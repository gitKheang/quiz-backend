// src/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

type GoogleProfile = { email?: string; name?: string };
type JwtShape = { sub: string; email: string; role?: string; name?: string };

function isHttps(req: Request): boolean {
  const xfProto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
  return req.secure === true || xfProto === 'https';
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private get jwtSecret(): string {
    return process.env.JWT_SECRET || 'dev_secret_change_me';
  }

  private signJwt(payload: JwtShape): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  private setAuthCookie(req: Request, res: Response, token: string) {
    const https = isHttps(req);
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: https ? ('none' as const) : ('lax' as const),
      secure: https,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      // domain: process.env.COOKIE_DOMAIN || undefined, // uncomment if you need a specific cookie domain
    });
  }

  private clearAuthCookie(req: Request, res: Response) {
    const https = isHttps(req);
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: https ? ('none' as const) : ('lax' as const),
      secure: https,
      path: '/',
      // domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }

  /* =========================
   *   Manual Sign Up
   * ========================= */
  async signUp(dto: { name: string; email: string; password: string }, req: Request, res: Response) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, provider: true, passwordHash: true },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: { name, email, passwordHash, provider: 'local', role: Role.USER },
        select: { id: true, name: true, email: true, role: true },
      });
      const token = this.signJwt({ sub: user.id, email: user.email, name: user.name, role: user.role });
      this.setAuthCookie(req, res, token);
      return user;
    }

    if (!existing.passwordHash) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const updated = await this.prisma.user.update({
        where: { email },
        data: { passwordHash },
        select: { id: true, name: true, email: true, role: true },
      });
      const token = this.signJwt({ sub: updated.id, email: updated.email, name: updated.name, role: updated.role });
      this.setAuthCookie(req, res, token);
      return updated;
    }

    throw new BadRequestException('email_taken');
  }

  /* =========================
   *   Manual Sign In
   * ========================= */
  async signIn(dto: { email: string; password: string }, req: Request, res: Response) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, passwordHash: true, provider: true },
    });

    if (!user) throw new UnauthorizedException('invalid_credentials');

    if (!user.passwordHash) {
      const allowAuto =
        (process.env.ALLOW_AUTO_ATTACH_PASSWORD ??
          (process.env.NODE_ENV !== 'production' ? 'true' : 'false')) === 'true';

      if (!allowAuto) {
        throw new UnauthorizedException('password_not_set');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const updated = await this.prisma.user.update({
        where: { email },
        data: { passwordHash },
        select: { id: true, email: true, name: true, role: true },
      });

      const token = this.signJwt({
        sub: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
      });
      this.setAuthCookie(req, res, token);
      return updated;
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid_credentials');

    const token = this.signJwt({ sub: user.id, email: user.email, name: user.name, role: user.role });
    this.setAuthCookie(req, res, token);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  signOut(req: Request, res: Response) {
    this.clearAuthCookie(req, res);
    return { ok: true };
  }

  /* =========================
   *   Me (from cookie or Authorization)
   * ========================= */
  async me(req: Request) {
    let token: string | undefined =
      (req as any).cookies?.access_token ||
      (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice('Bearer '.length).trim()
        : undefined);

    if (!token) return null;

    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtShape;
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, role: true },
      });
      return dbUser ?? null;
    } catch {
      return null;
    }
  }

  /* =========================
   *   Google OAuth
   * ========================= */
  async googleLogin(profile: GoogleProfile, req: Request, res: Response): Promise<void> {
    if (!profile.email) throw new BadRequestException('google_no_email');

    const email = profile.email.toLowerCase();
    const name = profile.name ?? email.split('@')[0];

    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email, name, provider: 'google', role: Role.USER },
      update: { name, provider: 'google' },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = this.signJwt({ sub: user.id, email: user.email, name: user.name, role: user.role });
    this.setAuthCookie(req, res, token);
  }
}
