import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';
import { CreateSessionDto, SaveProgressDto } from './dto';

type SavedItem = {
  questionId: string;
  chosenOptionIds: string[];
  answeredAt: string;
  flagged?: boolean;
};

// Non-deterministic shuffle (use once to pick/arrange questions at start) //
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministic helpers (for options so refresh doesn’t reshuffle) //
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash32(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function deterministicShuffle<T>(arr: T[], seedStr: string): T[] {
  const a = [...arr];
  const rand = mulberry32(hash32(seedStr));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Ensure shuffled order is not identical to input (rotate if identical) //
function ensureNotIdentity<T>(original: T[], shuffled: T[]): T[] {
  const same =
    original.length === shuffled.length &&
    original.every((v, i) => v === shuffled[i]);
  if (same && shuffled.length > 1) {
    return [...shuffled.slice(1), shuffled[0]];
  }
  return shuffled;
}

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  // Resume/continue an attempt //
  async get(id: string) {
    const session = await this.prisma.quizSession.findUnique({ where: { attemptId: id } });
    if (!session) throw new NotFoundException('Session not found');

    const questionIds: string[] = (session.questionIds as any) ?? [];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true, category: true },
    });

    // restore question order saved at create-time
    const indexOf = new Map<string, number>(questionIds.map((qid, i) => [qid, i]));
    questions.sort((a, b) => (indexOf.get(a.id)! - indexOf.get(b.id)!));

    const cat = await this.prisma.category.findUnique({ where: { id: session.categoryId } });

    const dtoQuestions = questions.map((q) => {
      // deterministic option order per attempt+question
      const base = q.options;
      const seeded = deterministicShuffle(base, `${session.attemptId}:${q.id}`);
      const shuffledOptions = ensureNotIdentity(base, seeded);
      return {
        id: q.id,
        text: q.text,
        type: q.type as any,
        imageUrl: q.imageUrl ?? undefined,
        options: shuffledOptions.map((o) => ({ id: o.id, text: o.text })),
        explanation: undefined,
        difficulty: q.difficulty as any,
      };
    });

    // stable countdown (don’t recompute after create)
    const persistedEnd =
      session.endAt ?? new Date(session.startAt.getTime() + (session.timeLimitSec ?? 600) * 1000);

    return {
      id: session.attemptId,
      categoryId: session.categoryId,
      category: cat && {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? undefined,
        color: cat.color ?? undefined,
        icon: cat.icon ?? undefined,
      },
      numQuestions: session.numQuestions,
      difficulty: (session.difficulty ?? undefined) as any,
      timeLimitSec: session.timeLimitSec ?? 600,
      startAt: session.startAt.toISOString(),
      endAt: persistedEnd.toISOString(),
      serverNow: new Date().toISOString(),
      questions: dtoQuestions,
      currentAnswers: Object.fromEntries(
        (((session.savedAnswers as any) ?? []) as SavedItem[]).map((a) => [a.questionId, a.chosenOptionIds]),
      ),
      isCompleted: session.isCompleted,
      submittedAt: undefined,
      score: session.score ?? undefined,
    };
  }

  // Start a new attempt: shuffle questions once & persist endAt */
  async create(body: CreateSessionDto) {
    const { categoryId, numQuestions, timeLimitMin, timeLimitMinutes } = body;
    const timeLimitSec = (timeLimitMin ?? timeLimitMinutes ?? 10) * 60;

    // Load all category questions
    const all = await this.prisma.question.findMany({
      where: { categoryId },
      include: { options: true },
    });

    // Shuffle once for this attempt
    const shuffledAll = shuffle(all);
    let selected = shuffledAll.slice(0, Math.min(numQuestions, shuffledAll.length));

    // Guard: if we somehow got the same prefix order, rotate once so it’s visibly shuffled
    const originalPrefix = all.slice(0, selected.length);
    if (
      selected.length > 1 &&
      originalPrefix.length === selected.length &&
      originalPrefix.every((q, i) => q.id === selected[i].id)
    ) {
      selected = [...selected.slice(1), selected[0]];
    }

    const attemptId = nanoid(10);
    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + timeLimitSec * 1000);

    await this.prisma.quizSession.create({
      data: {
        attemptId,
        categoryId,
        questionIds: selected.map((q) => q.id),
        numQuestions: selected.length,
        timeLimitSec,
        startAt,
        endAt, // persist now → stable countdown
      } as any,
    });

    const cat = await this.prisma.category.findUnique({ where: { id: categoryId } });

    const questions = selected.map((q) => {
      // deterministic options per question for this attempt
      const base = q.options;
      const seeded = deterministicShuffle(base, `${attemptId}:${q.id}`);
      const shuffledOptions = ensureNotIdentity(base, seeded);
      return {
        id: q.id,
        text: q.text,
        type: q.type as any,
        imageUrl: q.imageUrl ?? undefined,
        options: shuffledOptions.map((o) => ({ id: o.id, text: o.text })),
        explanation: undefined,
        difficulty: q.difficulty as any,
      };
    });

    return {
      attemptId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      timeLimitSec,
      serverNow: new Date().toISOString(),
      questions,
      category: cat && {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? undefined,
        color: cat.color ?? undefined,
        icon: cat.icon ?? undefined,
      },
    };
  }

  // Save in-progress answers (autosave) //
  async saveProgress(id: string, body: SaveProgressDto) {
    const session = await this.prisma.quizSession.findUnique({ where: { attemptId: id } });
    if (!session) throw new NotFoundException('Session not found');

    const nowISO = new Date().toISOString();
    const saved: SavedItem[] = (body.answers ?? []).map((a) => ({
      questionId: a.questionId,
      chosenOptionIds: a.chosenOptionIds ?? [],
      answeredAt: nowISO,
    }));

    await this.prisma.quizSession.update({
      where: { id: session.id },
      data: { savedAnswers: saved as any },
    });

    return { saved: true, serverNow: new Date().toISOString() };
  }

  // Submit: accepts answers in body (optional) or uses saved progress //
  async submit(id: string, body?: SaveProgressDto) {
    const session = await this.prisma.quizSession.findUnique({ where: { attemptId: id } });
    if (!session) throw new NotFoundException('Session not found');

    let answers: SavedItem[];

    if (body?.answers?.length) {
      const nowISO = new Date().toISOString();
      answers = body.answers.map((a) => ({
        questionId: a.questionId,
        chosenOptionIds: a.chosenOptionIds ?? [],
        answeredAt: nowISO,
      }));
      // persist the final answers too
      await this.prisma.quizSession.update({
        where: { id: session.id },
        data: { savedAnswers: answers as any },
      });
    } else {
      answers = ((session.savedAnswers as any) ?? []) as SavedItem[];
    }

    const byQ = new Map(answers.map((a) => [a.questionId, a.chosenOptionIds]));
    const questionIds: string[] = (session.questionIds as any) ?? [];
    const qs = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });

    let correctCount = 0;
    let incorrectCount = 0;
    let unselectedCount = 0;
    const breakdown: any[] = [];

    for (const q of qs) {
      const userAnswerIds = byQ.get(q.id) ?? [];
      const correctAnswerIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const isCorrect =
        userAnswerIds.length === correctAnswerIds.length &&
        userAnswerIds.every((oid) => correctAnswerIds.includes(oid));

      if (userAnswerIds.length === 0) unselectedCount++;
      else if (isCorrect) correctCount++;
      else incorrectCount++;

      breakdown.push({
        questionId: q.id,
        isCorrect,
        userAnswerIds,
        correctAnswerIds,
        userAnswerTexts: q.options.filter((o) => userAnswerIds.includes(o.id)).map((o) => o.text),
        correctAnswerTexts: q.options.filter((o) => correctAnswerIds.includes(o.id)).map((o) => o.text),
        explanation: q.explanation ?? null,
      });
    }

    const total = questionIds.length;
    const timeTakenSec = Math.max(0, Math.floor((Date.now() - new Date(session.startAt).getTime()) / 1000));
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const submittedAt = new Date();

    await this.prisma.quizSession.update({
      where: { id: session.id },
      data: { isCompleted: true, score, timeTakenSec, endAt: submittedAt, savedAnswers: answers as any },
    });

    return {
      attemptId: id,
      score,
      correctCount,
      incorrectCount,
      unselectedCount,
      total,
      timeTakenSec,
      submittedAt: submittedAt.toISOString(),
      rank: 50,
      percentile: 0,
      breakdown,
    };
  }
}
