// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ADMIN SEED (idempotent) 
  // Can override via env also:
  // SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, SEED_ADMIN_PASSWORD
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "kimkheangmac8055@gmail.com";
  const adminName = process.env.SEED_ADMIN_NAME ?? "kheang";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "kheang10101000";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      provider: "local",
      role: Role.ADMIN,
    },
    update: {
      name: adminName,
      role: Role.ADMIN,
      provider: "local",
    },
  });

  // CATEGORIES (your original 6, unchanged)
  const categories = [
    {
      name: "World History",
      slug: "history",
      description: "Ancient to modern history",
      color: "#8B5CF6",
      icon: "🏛️",
      isDefault: true,
      sortOrder: 1,
      timeLimitSec: 600,
    },
    {
      name: "Science & Nature",
      slug: "science",
      description: "Physics, Chemistry, Biology",
      color: "#10B981",
      icon: "🔬",
      isDefault: true,
      sortOrder: 2,
      timeLimitSec: 600,
    },
    {
      name: "Technology",
      slug: "technology",
      description: "Computers, Internet, Gadgets",
      color: "#3B82F6",
      icon: "💻",
      isDefault: true,
      sortOrder: 3,
      timeLimitSec: 600,
    },
    {
      name: "Geography",
      slug: "geography",
      description: "Countries, capitals, maps",
      color: "#F59E0B",
      icon: "🌍",
      isDefault: true,
      sortOrder: 4,
      timeLimitSec: 600,
    },
    {
      name: "Literature",
      slug: "literature",
      description: "Books and authors",
      color: "#EF4444",
      icon: "📚",
      isDefault: true,
      sortOrder: 5,
      timeLimitSec: 600,
    },
    {
      name: "Sports",
      slug: "sports",
      description: "Games and records",
      color: "#22C55E",
      icon: "🏅",
      isDefault: true,
      sortOrder: 6,
      timeLimitSec: 600,
    },
  ] as const;

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        color: c.color,
        icon: c.icon,
        sortOrder: c.sortOrder,
        isDefault: c.isDefault,
        timeLimitSec: c.timeLimitSec,
      },
      create: c,
    });
  }

  // SAMPLE QUESTIONS (unchanged logic: seed only if none exist for "history")
  const history = await prisma.category.findUnique({ where: { slug: "history" } });
  if (history) {
    const qCount = await prisma.question.count({ where: { categoryId: history.id } });
    if (qCount === 0) {
      const q1 = await prisma.question.create({
        data: {
          categoryId: history.id,
          text: "Who was the first President of the United States?",
          explanation: "George Washington served from 1789 to 1797.",
          difficulty: "easy",
          type: "single",
          options: {
            create: [
              { text: "George Washington", isCorrect: true },
              { text: "Thomas Jefferson", isCorrect: false },
              { text: "John Adams", isCorrect: false },
              { text: "James Madison", isCorrect: false },
            ],
          },
        },
        include: { options: true },
      });

      const q2 = await prisma.question.create({
        data: {
          categoryId: history.id,
          text: "In which year did World War II end?",
          explanation: "WWII ended in 1945.",
          difficulty: "easy",
          type: "single",
          options: {
            create: [
              { text: "1939", isCorrect: false },
              { text: "1941", isCorrect: false },
              { text: "1945", isCorrect: true },
              { text: "1949", isCorrect: false },
            ],
          },
        },
        include: { options: true },
      });

      const q3 = await prisma.question.create({
        data: {
          categoryId: history.id,
          text: "Which empire built the Colosseum?",
          explanation: "The Roman Empire built it around AD 70–80.",
          difficulty: "medium",
          type: "single",
          options: {
            create: [
              { text: "Greek Empire", isCorrect: false },
              { text: "Roman Empire", isCorrect: true },
              { text: "Ottoman Empire", isCorrect: false },
              { text: "Byzantine Empire", isCorrect: false },
            ],
          },
        },
        include: { options: true },
      });

      console.log("Seeded sample questions:", [q1.id, q2.id, q3.id]);
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
