// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto, @Res() res: Response) {
    const user = await this.auth.signUp(dto, res);
    return res.json(user);
  }

  @Post('signin')
  async signIn(@Body() dto: SignInDto, @Res() res: Response) {
    const user = await this.auth.signIn(dto, res);
    return res.json(user);
  }

  @Post('signout')
  signOut(@Res() res: Response) {
    return res.json(this.auth.signOut(res));
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.auth.me(req);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async google() {
    // handled by passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    try {
      const profile = req.user as { email?: string; name?: string };
      await this.auth.googleLogin(profile, res);
      return res.redirect(FRONTEND_URL);
    } catch (err) {
      console.error('Google callback failed:', err);
      const url = new URL(FRONTEND_URL);
      url.pathname = '/signin';
      url.searchParams.set('error', 'google_failed');
      return res.redirect(url.toString());
    }
  }
}
