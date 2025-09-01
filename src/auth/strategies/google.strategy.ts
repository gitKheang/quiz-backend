// src/auth/strategies/google.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

export type OAuthUser = {
  email: string;
  name: string;
  avatarUrl?: string;
  googleId: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/auth/google/callback',
      scope: ['profile', 'email'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const json: any = profile._json ?? {};
    const rawEmail =
      profile.emails?.[0]?.value ||
      json.email ||
      json.emails?.[0]?.value ||
      undefined;

    const name =
      profile.displayName ||
      [json.given_name, json.family_name].filter(Boolean).join(' ') ||
      (rawEmail ? rawEmail.split('@')[0] : 'Google User');

    const avatarUrl = profile.photos?.[0]?.value ?? json.picture ?? undefined;

    const email = rawEmail ? rawEmail.toLowerCase() : `${profile.id}@no-email.google.local`;
    if (!rawEmail) {
      this.logger.warn(`Google profile had no email; using placeholder for id=${profile.id}`);
    }

    return { email, name, avatarUrl, googleId: profile.id };
  }
}
