# Satirical Commons (Next.js 15)

A bilingual satire publishing platform scaffold built with production-minded structure and moderation workflow.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + reusable shadcn-style UI primitives
- PostgreSQL + Prisma
- NextAuth (credentials + Prisma adapter)

## Features included
- Public pages: home, manifesto, preprints feed, journal archive, announcements, rules, article detail
- Auth: credential login via NextAuth setup
- User features: profile, submit article, vote/comment/report route handlers
- Admin/editor features: dashboard, moderation queue, promote preprint, publish announcements API
- Content workflow states: `draft`, `submitted`, `pending_review`, `published_preprint`, `promoted_to_journal`, `rejected`, `archived`, `removed`
- Bilingual routes: `/en` and `/zh` with shared dictionary
- Safety: satire disclaimers, report flow, in-memory rate limit, basic spam signal checks
- SEO basics: metadata, Open Graph/Twitter metadata, sitemap, robots, JSON-LD article schema

## Folder structure

```
app/
  [locale]/
    admin/
    article/[slug]/
    preprints/
    submit/
    ...
  api/
    auth/[...nextauth]/
    comments/
    votes/
    reports/
    submit/
    admin/{moderation,promote,announcements}/
components/
  admin/
  cards/
  forms/
  layout/
  ui/
lib/
  auth/
  db.ts
  i18n/
  rate-limit.ts
  seo.ts
  validators/
prisma/
  schema.prisma
  seed.ts
```

## Quick start
1. Install dependencies
   ```bash
   npm install
   ```
2. Configure environment
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client
   ```bash
   npm run prisma:generate
   ```
4. Run migrations
   ```bash
   npm run prisma:migrate
   ```
5. Seed demo content
   ```bash
   npm run prisma:seed
   ```
6. Start dev server
   ```bash
   npm run dev
   ```

## Demo credentials
- Admin: `admin@satirical-commons.local` / `AdminPass123!`
- User: `reader@satirical-commons.local` / `UserPass123!`

## Notes
- Rate limiting in `lib/rate-limit.ts` is in-memory and should be replaced by Redis or database-backed storage in distributed production deployments.
- Credential auth is configured; add OAuth providers in `auth.ts` as needed.
