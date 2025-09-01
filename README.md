<!-- Quiz Backend (NestJS + Prisma) -->

Backend API for a quiz application.  
Built with [NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/) using PostgreSQL.  
All endpoints are exposed under the `/api` prefix.



 <!-- Features -->

- Category management (CRUD with safeguards on default categories)
- Question management (linked to categories, options included)
- Quiz sessions (create, track progress, submit for scoring)
- Leaderboard (scores from completed sessions)
- Prisma with PostgreSQL for persistence
- Global API prefix for frontend compatibility


 <!-- Endpoints -->

<!-- Categories -->
- `GET /api/categories` — list categories
- `GET /api/categories/:id` — category details (with `questionCount`)
- `POST /api/categories` — create category
- `PUT /api/categories/:id` — update category
- `DELETE /api/categories/:id` — delete category  
  *Deletion blocked if default or contains questions*

<!-- Questions -->
- `GET /api/categories/:categoryId/questions` — list questions (answers hidden)
- `POST /api/categories/:categoryId/questions` — create question with options
- `PUT /api/questions/:id` — update question (options replaced if provided)
- `DELETE /api/questions/:id` — delete question

<!-- Quiz Sessions -->
- `POST /api/quiz-sessions` — create session and return questions
- `GET /api/quiz-sessions/:id` — get session (by `attemptId`)
- `PATCH /api/quiz-sessions/:id/progress` — save answers
- `POST /api/quiz-sessions/:id/submit` — score session

<!-- Leaderboard -->
- `GET /api/leaderboard` — simple scoreboard from completed sessions



<!-- Quick Start -->

<!-- Clone and configure** -->
   ```bash
   git clone https://github.com/gitKheang/quiz-backend.git
   cd quiz-backend
   cp .env.example .env
