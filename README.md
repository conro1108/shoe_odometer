# Shoe Odometer

Track cumulative mileage on your shoes. Add pairs to your closet, log walks, and see when it's time to retire them.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma** → PostgreSQL via **Supabase**
- **Clerk** for authentication
- **Supabase Storage** for shoe photos
- **Tailwind CSS** + **shadcn/ui**

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your credentials:

```env
# Clerk — dashboard.clerk.com → your app → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase DB — supabase.com/dashboard → project → Connect → Prisma
# Transaction pooler (port 6543) — used at runtime
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Direct connection (port 5432) — used for migrations
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Storage — supabase.com/dashboard → project → Settings → API → service_role
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Also update `.env` (used by the Prisma CLI) with the same `DATABASE_URL` and `DIRECT_URL` values.

### 3. Push the database schema

```bash
npx prisma db push
```

> If you get a `prepared statement "s1" already exists` error, run it directly against port 5432 (bypasses pgBouncer):
> ```bash
> DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-1-us-east-1.pooler.supabase.com:5432/postgres" npx prisma db push
> ```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint

npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio GUI (browse/edit data)
```

---

## Project Structure

```
src/
├── app/
│   ├── closet/          # Main app — shoe grid, detail page, add page
│   │   ├── [id]/        # Shoe detail + walk history
│   │   ├── add/         # Add shoe page
│   │   └── actions.ts   # Server actions for all mutations
│   ├── sign-in/         # Clerk auth pages
│   └── sign-up/
├── components/          # UI components (flat, no nesting)
├── lib/
│   ├── auth.ts          # getCurrentUser() — single auth entry point
│   ├── prisma.ts        # Prisma client singleton
│   ├── queries/         # All DB queries (shoes.ts, walks.ts)
│   ├── supabase.ts      # Supabase client (lazy init)
│   ├── upload.ts        # Supabase Storage upload helper
│   └── validations/     # Zod schemas
└── middleware.ts        # Clerk auth middleware
```

---

## How to Contribute / Work on This

### The mental model

This app has two kinds of code: **server** (runs in Node.js, can touch the database) and **client** (runs in the browser, can't). Next.js App Router makes this explicit with file conventions and `"use client"` directives.

- **Server Components** — the default. Any `page.tsx` or component without `"use client"` at the top runs on the server. It can call Prisma directly. It cannot use React state (`useState`) or browser events (`onClick`).
- **Client Components** — files with `"use client"` at the top. These run in the browser. They can use state, handle events, and show interactive UI. They cannot call Prisma directly.
- **Server Actions** — functions in `actions.ts` marked with `"use server"`. These are how client components talk to the database — you call them like regular async functions from a client component, but they execute on the server. All mutations (create/update/delete) go through these.

### Reading data

Data fetching happens in Server Components by calling query functions from `src/lib/queries/`. These call Prisma directly.

```tsx
// src/app/closet/page.tsx — a Server Component (no "use client")
import { getCurrentUser } from "@/lib/auth";
import { getShoesByUser } from "@/lib/queries/shoes";

export default async function ClosetPage() {
  const user = await getCurrentUser();           // who's logged in
  const shoes = await getShoesByUser(user.id);  // fetch their data
  return <ShoeGrid shoes={shoes} />;             // render it
}
```

**Always go through `getCurrentUser()`** — never read `userId` directly from Clerk in components. It handles the DB upsert on first login.

### Writing data (mutations)

Mutations go through Server Actions in `src/app/closet/actions.ts`. From a client component:

```tsx
"use client";
import { addShoeAction } from "@/app/closet/actions";

async function handleSubmit() {
  const formData = new FormData();
  formData.set("name", "Ghost 15");
  formData.set("brand", "Brooks");
  formData.set("startingMileage", "0");

  const result = await addShoeAction(formData);
  if (!result.success) {
    console.error(result.error); // validation or DB error message
  }
}
```

All actions return `{ success: true, data: ... }` or `{ success: false, error: string }`.

After a mutation succeeds, the action calls `revalidatePath("/closet")` which tells Next.js to re-fetch the data for that page automatically.

### Adding a new database field

1. Edit `prisma/schema.prisma` — add the field to the relevant model
2. Run `npx prisma db push` to apply it to the database
3. Run `npx prisma generate` to update the TypeScript types
4. Update the relevant query in `src/lib/queries/` to return the new field
5. Update the relevant action in `src/app/closet/actions.ts` to accept and write it
6. Update any Zod validation schemas in `src/lib/validations/` to include it

### Adding a new page

Pages live in `src/app/`. The folder structure maps to the URL:
- `src/app/closet/page.tsx` → `/closet`
- `src/app/closet/[id]/page.tsx` → `/closet/abc123` (the `id` is a variable)
- `src/app/closet/settings/page.tsx` → `/closet/settings`

Create a new folder with a `page.tsx` file. Pages are Server Components by default, so you can fetch data directly at the top.

```tsx
// src/app/closet/settings/page.tsx
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  return <div>Settings for {user.email}</div>;
}
```

### Adding a UI component

Components go in `src/components/`. Check if a shadcn/ui primitive already exists before building from scratch — there's a full library available in `src/components/ui/`.

Available primitives include: `Button`, `Input`, `Label`, `Dialog`, `AlertDialog`, `DropdownMenu`, `Badge`, `Separator`, `Textarea`, and more. Browse `src/components/ui/` to see what's installed.

To add a new shadcn component that isn't installed yet:
```bash
npx shadcn@latest add <component-name>
# e.g. npx shadcn@latest add calendar
```

### Styling

Use Tailwind CSS utility classes. There's no separate CSS file to edit. Common patterns in this codebase:

```tsx
// Layout
<div className="flex items-center gap-4">
<div className="container mx-auto px-4 py-8">

// Typography
<h1 className="text-3xl font-bold tracking-tight">
<p className="text-muted-foreground text-sm">   // muted = gray

// Spacing
className="space-y-4"   // vertical gap between children
className="gap-2"       // gap in flex/grid
```

`text-muted-foreground` is the standard way to render secondary/helper text — it automatically adapts to light/dark mode.

### Auth

Every protected page and action calls `getCurrentUser()` from `src/lib/auth.ts`. It:
1. Gets the current Clerk session
2. Looks up (or creates) the user in the database
3. Returns the database `User` object with `id`, `email`, `displayName`

Use the returned `user.id` (the database ID, not the Clerk ID) when querying or writing data. Never skip this — it's what enforces that users can only see their own data.
