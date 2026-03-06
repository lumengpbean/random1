# Satirical Commons (Next.js 15)

A bilingual satire publishing platform scaffold (EN/ZH) with moderation workflow.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + reusable shadcn-style UI primitives
- PostgreSQL + Prisma
- NextAuth (credentials + Prisma adapter)

## What is implemented
- Public pages: home, manifesto, preprints feed, journal archive, announcements, rules, article detail
- Auth scaffolding: credentials login, signup endpoint, profile page
- Community actions: submit article, vote, comment, report
- Admin/editor: dashboard, moderation queue, promote route, announcements route
- Bilingual routing: `/en`, `/zh`
- Safety: visible satire disclaimers, report flow, in-memory rate limit, basic spam filters
- SEO: metadata helper, Open Graph/Twitter metadata, sitemap, robots, article JSON-LD

## Project structure

```
app/
  [locale]/...
  api/...
components/
lib/
prisma/
```

## Local run (recommended)

1. Install dependencies:
```bash
npm install
```

2. Copy env:
```bash
cp .env.example .env
```

3. Start PostgreSQL:
```bash
docker compose up -d db
```

4. Generate Prisma client + apply migration + seed:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Run app:
```bash
npm run dev
```

6. Open:
- `http://localhost:3000/en`
- `http://localhost:3000/zh`

## If `schema.prisma` fails

Use these checks in order:

```bash
npx prisma validate
npx prisma format
```

If you previously created broken migrations, reset local DB:

```bash
docker compose down -v
docker compose up -d db
npx prisma migrate reset --force
npm run prisma:seed
```

## Environment variables

See `.env.example`:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`

## Demo credentials
- Admin: `admin@satirical-commons.local` / `AdminPass123!`
- User: `reader@satirical-commons.local` / `UserPass123!`

## Notes
- `lib/rate-limit.ts` is in-memory only; replace with Redis/DB-backed limiter for production.
