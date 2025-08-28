# Quiz Backend (NestJS + Prisma)

Compatible with your frontend expecting `/api/*` routes. Implements:

- `GET /api/categories` — list categories
- `GET /api/categories/:id` — category detail (with `questionCount`)
- `POST /api/categories` — create
- `PUT /api/categories/:id` — update
- `DELETE /api/categories/:id` — delete (blocked for defaults or when questions exist)
- `GET /api/categories/:categoryId/questions` — list questions (no answers revealed)
- `POST /api/categories/:categoryId/questions` — create question with options
- `PUT /api/questions/:id` — update question (replaces options if provided)
- `DELETE /api/questions/:id` — delete question
- `POST /api/quiz-sessions` — create session and return questions
- `GET /api/quiz-sessions/:id` — get session (by `attemptId`)
- `PATCH /api/quiz-sessions/:id/progress` — save answers
- `POST /api/quiz-sessions/:id/submit` — score the session
- `GET /api/leaderboard` — simple scoreboard from completed sessions

## Quick start

1. Copy `.env.example` to `.env` and set `DATABASE_URL` for PostgreSQL.
2. Install deps:

   ```bash
   pnpm i
   # or npm i / yarn
   ```

3. Generate client & migrate (dev):

   ```bash
   pnpm prisma:generate
   pnpm db:migrate --name init
   pnpm db:seed
   ```

4. Run the server:

   ```bash
   pnpm dev
   # API at http://localhost:3000/api
   ```

## Notes

- **Global prefix** `/api` is set in `src/main.ts` to match your frontend `fetch('/api/...')`.
- **PrismaModule** is global, so `PrismaService` injection works in every module (fixes the `UnknownDependenciesException` you hit).
- Session `attemptId` is returned from `POST /api/quiz-sessions` and used as the `:id` for subsequent calls and the results route.
- Questions returned to the quiz player do **not** reveal `correctOptionIds` or `explanation`. Those are only used server-side for scoring.
- Leaderboard fabricates a `userName` since there is no auth in this scope.
- Default categories are seeded and protected from deletion.
