import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createLocalUser(params: { name: string; email: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: { ...params, provider: 'local', role: Role.USER },
    });
  }

  async findOrCreateGoogle(email: string, name: string) {
    const existing = await this.findByEmail(email);
    if (existing) return existing;
    return this.prisma.user.create({
      data: { email, name, provider: 'google', role: Role.USER },
    });
  }

  toPublic(user: any) {
    if (!user) return null;
    const { id, name, email, role, provider, createdAt, updatedAt } = user;
    return { id, name, email, role, provider, createdAt, updatedAt };
  }
}
