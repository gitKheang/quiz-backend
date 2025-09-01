import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { verifyToken, type JwtPayload } from './jwt.util';

const COOKIE_NAME = 'access_token';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const token = req.cookies?.[COOKIE_NAME];
    if (!token) throw new UnauthorizedException('Not authenticated');

    const payload = verifyToken<JwtPayload>(token);
    if (!payload) throw new UnauthorizedException('Invalid token');

    // tolerate both 'admin' and 'ADMIN'
    const role = String((payload as any).role ?? '').toUpperCase();
    if (role !== 'ADMIN') throw new ForbiddenException('Admins only');

    // expose minimal user for downstream handlers if needed
    (req as any).user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    return true;
  }
}
