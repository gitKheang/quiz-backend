import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';

type OptionInput = { id?: string; text: string; isCorrect?: boolean } | string;

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  private async resolveCategoryId(idOrSlug: string): Promise<string> {
    const byId = await this.prisma.category.findUnique({ where: { id: idOrSlug } });
    if (byId) return byId.id;
    const bySlug = await this.prisma.category.findUnique({ where: { slug: idOrSlug } });
    if (bySlug) return bySlug.id;
    throw new NotFoundException('Category not found');
  }

  // Admin/editor list — includes correctOptionIds so radios can preselect
  async listByCategory(categoryIdOrSlug: string) {
    const categoryId = await this.resolveCategoryId(categoryIdOrSlug);
    const list = await this.prisma.question.findMany({
      where: { categoryId },
      include: { options: { orderBy: { text: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((q) => ({
      id: q.id,
      text: q.text,
      explanation: q.explanation ?? undefined,
      difficulty: q.difficulty as any,
      type: q.type as any,
      imageUrl: q.imageUrl ?? undefined,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
      correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
    }));
  }

  async getOne(id: string) {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!q) throw new NotFoundException('Question not found');

    return {
      id: q.id,
      text: q.text,
      explanation: q.explanation ?? undefined,
      difficulty: q.difficulty as any,
      type: q.type as any,
      imageUrl: q.imageUrl ?? undefined,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
      correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
    };
  }

  /** Normalize options, default A if none marked correct */
  private normalizeOptionsWithDefault(body: any): { text: string; isCorrect: boolean }[] {
    const raw: OptionInput[] = body.options ?? [];
    const correctOptionIds: string[] | undefined = body.correctOptionIds;
    const correctIndexes: number[] | undefined = body.correctIndexes;
    const correctOptionTexts: string[] | undefined = body.correctOptionTexts;

    if (!Array.isArray(raw) || raw.length === 0) {
      throw new BadRequestException('Options required');
    }

    const normalized = raw.map((opt, idx) => {
      const asObj = typeof opt === 'string' ? { text: opt } : (opt as any);
      const posId = asObj.id ?? `pos-${idx + 1}`;

      let isCorrect: boolean | undefined = asObj.isCorrect;
      if (isCorrect === undefined && Array.isArray(correctOptionIds)) {
        isCorrect = correctOptionIds.includes(posId);
      }
      if (isCorrect === undefined && Array.isArray(correctIndexes)) {
        isCorrect = correctIndexes.includes(idx);
      }
      if (isCorrect === undefined && Array.isArray(correctOptionTexts)) {
        isCorrect = correctOptionTexts.includes(asObj.text);
      }

      return { text: asObj.text, isCorrect: !!isCorrect };
    });

    if (!normalized.some((o) => o.isCorrect)) {
      normalized[0].isCorrect = true; // default to Option A
    }

    return normalized;
  }

  async create(categoryIdOrSlug: string, body: CreateQuestionDto | any) {
    const categoryId = await this.resolveCategoryId(categoryIdOrSlug);
    const { text, explanation, difficulty, type = 'single', imageUrl } = body;
    const normalized = this.normalizeOptionsWithDefault(body);

    const created = await this.prisma.question.create({
      data: {
        categoryId,
        text,
        explanation: explanation ?? null,
        difficulty: difficulty as any,
        type,
        imageUrl: imageUrl ?? null,
        options: { create: normalized },
      },
      include: { options: true },
    });

    return {
      id: created.id,
      text: created.text,
      explanation: created.explanation ?? undefined,
      difficulty: created.difficulty as any,
      type: created.type as any,
      imageUrl: created.imageUrl ?? undefined,
      options: created.options.map((o) => ({ id: o.id, text: o.text })),
      correctOptionIds: created.options.filter((o) => o.isCorrect).map((o) => o.id), // important
    };
  }

  async update(id: string, body: UpdateQuestionDto | any) {
    const q = await this.prisma.question.findUnique({ where: { id }, include: { options: true } });
    if (!q) throw new NotFoundException('Question not found');

    if (body.options) {
      const normalized = this.normalizeOptionsWithDefault(body);
      await this.prisma.option.deleteMany({ where: { questionId: id } });
      await this.prisma.option.createMany({
        data: normalized.map((n) => ({ questionId: id, text: n.text, isCorrect: n.isCorrect })),
      });
    }

    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        text: body.text ?? q.text,
        explanation: body.explanation ?? q.explanation,
        difficulty: (body.difficulty ?? q.difficulty) as any,
        type: (body.type ?? q.type) as any,
        imageUrl: body.imageUrl ?? q.imageUrl,
      },
      include: { options: true },
    });

    return {
      id: updated.id,
      text: updated.text,
      explanation: updated.explanation ?? undefined,
      difficulty: updated.difficulty as any,
      type: updated.type as any,
      imageUrl: updated.imageUrl ?? undefined,
      options: updated.options.map((o) => ({ id: o.id, text: o.text })),
      correctOptionIds: updated.options.filter((o) => o.isCorrect).map((o) => o.id), // important
    };
  }

  async remove(id: string) {
    const existed = await this.prisma.question.findUnique({ where: { id } });
    if (!existed) throw new NotFoundException('Question not found');
    await this.prisma.question.delete({ where: { id } });
    return { ok: true };
  }

  async getWithAnswers(ids: string[]) {
    return this.prisma.question.findMany({
      where: { id: { in: ids } },
      include: { options: true },
    });
  }
}
