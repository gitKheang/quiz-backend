import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const cats = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' as any }, { createdAt: 'asc' }],
    });
    if (!cats.length) return [];

    const ids = cats.map((c) => c.id);
    const entries = await Promise.all(
      ids.map(
        async (id) =>
          [id, await this.prisma.question.count({ where: { categoryId: id } })] as const,
      ),
    );
    const countMap = new Map<string, number>(entries.map(([id, cnt]) => [id, cnt]));

    return cats.map((c) => ({ ...c, questionCount: countMap.get(c.id) ?? 0 }));
  }

  async get(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    const questionCount = await this.prisma.question.count({ where: { categoryId: id } });
    return { ...cat, questionCount };
  }

  async create(body: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { slug: body.slug } });
    if (exists) throw new ConflictException('Slug already exists');
    return this.prisma.category.create({ data: body as any });
  }

  async update(id: string, body: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({ where: { id }, data: body as any });
    } catch {
      throw new NotFoundException('Category not found');
    }
  }

  /**
   * Delete a category and everything under it in one transaction:
   * - options of its questions
   * - questions in the category
   * - (optional) quiz sessions that target the category
   * - then the category itself
   *
   * This matches the admin UI text: “will remove all questions in this category”.
   */
  async remove(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.isDefault) throw new ConflictException('Cannot delete default category');

    // Gather question ids (if any) once
    const qRows = await this.prisma.question.findMany({
      where: { categoryId: id },
      select: { id: true },
    });
    const questionIds = qRows.map((q) => q.id);

    await this.prisma.$transaction(async (tx) => {
      if (questionIds.length) {
        // 1) delete options for those questions
        await tx.option.deleteMany({ where: { questionId: { in: questionIds } } });
        // 2) delete the questions themselves
        await tx.question.deleteMany({ where: { id: { in: questionIds } } });
      }

      // 3) (optional) clean up any quiz sessions tied to this category
      //    If you want to keep attempts history, comment this out.
      await tx.quizSession.deleteMany({ where: { categoryId: id } });

      // 4) finally delete the category
      await tx.category.delete({ where: { id } });
    });

    return { ok: true };
  }
}
