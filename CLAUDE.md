# Shoe Odometer

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npx prisma generate` — regenerate Prisma client after schema changes
- `npx prisma db push` — push schema to database
- `npx prisma studio` — open Prisma Studio GUI

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Prisma ORM → PostgreSQL (Supabase)
- Clerk for auth
- Supabase Storage for shoe photos

## Architecture
- Server Components for data fetching (call Prisma directly)
- Server Actions for mutations (in `actions.ts` files)
- No standalone API routes for MVP — Server Actions only
- Auth: `src/lib/auth.ts` `getCurrentUser()` is the single entry point — upserts Clerk user into DB
- Mileage is computed (startingMileage + SUM of walks), never stored redundantly

## Conventions
- All DB queries go through `src/lib/queries/*.ts`
- Zod validation schemas in `src/lib/validations/*.ts`
- Components in `src/components/` (flat, no nesting)
- Use shadcn/ui components — they are already installed
