# Shoe Odometer — Revised Implementation Plan

## Status

- **Phase 0 (Scaffolding):** Complete
- **Phase 1 (Feature Work):** Complete — query layer, closet grid, add/edit dialogs, detail page all built
- **Phase 1.5 (Bug Fixes):** NOT STARTED — architectural review found issues that should be fixed before Phase 2
- **Phase 2 (Integration & Polish):** NOT STARTED

---

## Phase 1.5: Bug Fixes & Data Integrity (2 agents in parallel)

Phase 1 shipped with functional UI but has several data integrity gaps, dead code paths, and a broken integration between the closet page and the query layer. These should be fixed before adding auth pages and polish in Phase 2.

### Task 1.5A: Server-Side Validation & Data Fixes

**What:** Wire up Zod schemas in server actions, fix the closet page to use the query layer, fix mileage computation bug, fix notes clearing bug, add filename sanitization, fix Prisma schema.

**Files to modify:**
- `src/app/closet/actions.ts` — add Zod validation to all mutation actions
- `src/app/closet/page.tsx` — replace inlined Prisma queries with `getShoesByUser()`
- `src/components/mileage-stats.tsx` — fix avgPerWalk calculation
- `src/lib/upload.ts` — sanitize filename
- `src/lib/auth.ts` — wrap in `React.cache()` for per-request dedup
- `prisma/schema.prisma` — add `directUrl`

**Scope:** Medium (single agent, surgical edits to ~6 files)

**Dependencies:** None

<details>
<summary><strong>Agent Prompt</strong></summary>

```
You are fixing data integrity and validation bugs in "Shoe Odometer", a Next.js 14 app at /Users/connorrowe/projects/shoe_odometer. Read the existing code before making any changes. The project has a working UI but the server-side validation was never wired up and there are several bugs.

## Fixes to make (in order):

### 1. Wire Zod validation into server actions (`src/app/closet/actions.ts`)

The Zod schemas at `src/lib/validations/shoe.ts` and `src/lib/validations/walk.ts` exist but are only used client-side. The server actions do manual validation. Replace the manual validation with Zod.

For `addShoeAction`: import `shoeSchema` from `@/lib/validations/shoe`, parse the FormData through it:
```typescript
const parsed = shoeSchema.safeParse({
  name: formData.get("name"),
  brand: formData.get("brand"),
  startingMileage: formData.get("startingMileage"),
  photoUrl: formData.get("photoUrl") || undefined,
});
if (!parsed.success) {
  return { success: false, error: parsed.error.issues[0].message };
}
// Use parsed.data for the query call
```

Do the same for `updateShoeAction` (use `shoeSchema.partial()` for updates — all fields optional but still validated when present).

For `addWalkAction`: import `walkSchema` from `@/lib/validations/walk`, parse through it similarly.

For `updateWalkAction`: use `walkSchema.partial()` (omit shoeId since it's not updatable).

For `getUploadUrlAction`: add basic validation — fileName must be a non-empty string, max 255 chars.

### 2. Fix notes clearing bug in update actions (`src/app/closet/actions.ts`)

Currently `updateWalkAction` does:
```typescript
const notes = (formData.get("notes") as string) || undefined;
```
This means if the user clears the notes field (empty string), it becomes `undefined` and Prisma skips the update (old notes persist). Fix it:
```typescript
const notesRaw = formData.get("notes");
const notes = notesRaw !== null ? (notesRaw as string) || null : undefined;
// If the field was sent but empty -> null (clear it)
// If the field was not sent -> undefined (don't update)
```
Apply the same fix pattern to `updateShoeAction` for the optional fields — distinguish between "field sent but empty" (clear it) and "field not sent" (don't update).

### 3. Replace inlined queries in closet page (`src/app/closet/page.tsx`)

The closet page currently inlines its own Prisma queries instead of using `getShoesByUser()` from `src/lib/queries/shoes.ts`. This duplicates the mileage computation logic. Replace the inlined queries with a single call:
```typescript
import { getShoesByUser } from "@/lib/queries/shoes";
// ...
const user = await getCurrentUser();
const shoesWithMileage = await getShoesByUser(user.id);
```
Remove the `prisma` import and all the inlined query logic (findMany, groupBy, mileageMap, etc.).

### 4. Fix avgPerWalk calculation (`src/components/mileage-stats.tsx`)

Currently:
```typescript
const avgPerWalk = walkCount > 0 ? totalMileage / walkCount : null;
```
`totalMileage` includes `startingMileage`, so dividing by walkCount gives a misleading average. A shoe with 100mi starting + 2 walks of 5mi each shows "55.0 mi" avg instead of "5.0 mi". Fix:
```typescript
const walkedMiles = walks.reduce((sum, w) => sum + w.miles, 0);
const avgPerWalk = walks.length > 0 ? walkedMiles / walks.length : null;
```

### 5. Sanitize filename in upload utility (`src/lib/upload.ts`)

Currently the filename from the client is concatenated directly into the Supabase storage path. Sanitize it:
```typescript
const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
const path = `${userId}/${Date.now()}-${safeName}`;
```

### 6. Cache getCurrentUser per request (`src/lib/auth.ts`)

Wrap the function in `React.cache()` so multiple calls within the same server render (page + queries) don't each hit Clerk + Prisma:
```typescript
import { cache } from "react";
// ...
export const getCurrentUser = cache(async function getCurrentUser() {
  // existing implementation
});
```

### 7. Add directUrl to Prisma schema (`prisma/schema.prisma`)

The datasource block is missing `directUrl` which is needed for Prisma migrations through Supabase's PgBouncer. Update:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Important constraints
- READ each file before editing it
- Make minimal, surgical changes — do not rewrite entire files
- Do not change any UI components except mileage-stats.tsx
- Do not change any query layer files (src/lib/queries/*)
- After all fixes, run `npm run lint` to check for issues
- Commit with message: "fix: server-side validation, query dedup, and data integrity fixes"
```

</details>

---

### Task 1.5B: Wire Up ShoeCard Actions & Fix Broken Links

**What:** Connect the ShoeCard dropdown menu stubs to real server actions, fix the "Add Shoe" button to use the AddShoeDialog instead of linking to a nonexistent route, remove the unused `shoeId` prop warning.

**Files to modify:**
- `src/components/shoe-card.tsx` — wire up edit/retire/delete handlers to server actions
- `src/components/empty-state.tsx` — replace broken `/closet/add` link with AddShoeDialog
- `src/app/closet/page.tsx` — replace "Add Shoe" link with AddShoeDialog component
- `src/components/walk-log-table.tsx` — remove eslint-disable for unused var

**Scope:** Medium (single agent, 4 files)

**Dependencies:** None (can run in parallel with 1.5A since they touch different files, except both touch `closet/page.tsx` — but 1.5A changes the data fetching while 1.5B changes the JSX/button, so the edits don't conflict if 1.5A runs first or they are merged carefully)

**Note:** Run this AFTER 1.5A completes since both modify `src/app/closet/page.tsx`.

<details>
<summary><strong>Agent Prompt</strong></summary>

```
You are wiring up incomplete UI interactions in "Shoe Odometer", a Next.js 14 app at /Users/connorrowe/projects/shoe_odometer. Read the existing code before making changes.

## Fixes to make:

### 1. Wire up ShoeCard dropdown actions (`src/components/shoe-card.tsx`)

The ShoeCard component has a three-dot dropdown menu with Edit, Retire/Unretire, and Delete items. All three handlers are stubs (`// TODO`). Wire them up:

**Import the server actions and dialog components:**
```typescript
import { deleteShoeAction, retireShoeAction, unretireShoeAction } from "@/app/closet/actions";
import EditShoeDialog from "@/components/edit-shoe-dialog";
import { toast } from "sonner";
```

**Also import AlertDialog components** from shadcn for delete confirmation:
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

**Wire up `handleRetireToggle`:**
```typescript
async function handleRetireToggle(e: React.MouseEvent) {
  e.preventDefault();
  try {
    const action = isRetired ? unretireShoeAction : retireShoeAction;
    const result = await action(shoe.id);
    if (!result.success) throw new Error(result.error);
    toast.success(isRetired ? "Shoe unretired!" : "Shoe retired!");
  } catch (err) {
    toast.error((err as Error).message ?? "Something went wrong");
  }
}
```

**Wire up `handleDelete`** — replace the simple handler with an AlertDialog for confirmation. You'll need to restructure the Delete dropdown item to use AlertDialog. The pattern:
- The Delete DropdownMenuItem should trigger an AlertDialog
- The AlertDialog confirms "Delete this shoe? This will permanently remove the shoe and all its walk history."
- On confirm, call `deleteShoeAction(shoe.id)` and show a toast
- You may need to add `useState` for managing delete state

**Wire up Edit** — replace the Edit DropdownMenuItem with the EditShoeDialog component. The Edit menu item should open the EditShoeDialog. Use the `trigger` prop pattern:
```tsx
<EditShoeDialog
  shoe={{
    id: shoe.id,
    name: shoe.name,
    brand: shoe.brand,
    startingMileage: shoe.startingMileage,
    photoUrl: shoe.photoUrl,
  }}
  trigger={
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <Pencil className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
  }
/>
```

Note: When embedding a Dialog trigger inside a DropdownMenu, you need `onSelect={(e) => e.preventDefault()}` on the DropdownMenuItem to prevent the dropdown from closing before the dialog opens. Similarly for the AlertDialog delete trigger.

### 2. Fix "Add Shoe" button on closet page (`src/app/closet/page.tsx`)

The page header has:
```tsx
<Button asChild>
  <Link href="/closet/add">Add Shoe</Link>
</Button>
```
But `/closet/add` doesn't exist — the AddShoeDialog component should be used instead. Replace the Link/Button with the AddShoeDialog component:

```tsx
import AddShoeDialog from "@/components/add-shoe-dialog";
// ...
// Replace the <Button asChild><Link>... with:
<AddShoeDialog />
```

Remove the `Link` import if it's no longer used, and remove the `Button` import if it's no longer used directly.

### 3. Fix EmptyState to use AddShoeDialog (`src/components/empty-state.tsx`)

Same issue — the EmptyState has a Link to `/closet/add`. Replace it with the AddShoeDialog:

```tsx
"use client";

import AddShoeDialog from "@/components/add-shoe-dialog";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-7xl mb-6 select-none">👟</span>
      <h2 className="text-2xl font-semibold mb-2">No shoes in your closet yet</h2>
      <p className="text-muted-foreground mb-8 max-w-xs">
        Add your first pair to start tracking mileage
      </p>
      <AddShoeDialog />
    </div>
  );
}
```

Note: this makes EmptyState a client component (needs `"use client"` since it renders AddShoeDialog which is a client component). Alternatively, you can just pass AddShoeDialog as children or a prop — use your judgment for the cleanest approach.

### 4. Clean up walk-log-table.tsx (`src/components/walk-log-table.tsx`)

Remove the `// eslint-disable-next-line @typescript-eslint/no-unused-vars` comment and the unused `shoeId` from the destructured props (or use it if there's a reason to keep it — check if it's needed anywhere in the component).

## Important constraints
- READ each file before editing
- Make minimal, surgical changes
- Do not modify server actions, query layer, or validation files
- Ensure all components that need to be client components have "use client"
- After all fixes, run `npm run lint` to check for issues
- Commit with message: "fix: wire up ShoeCard actions, fix Add Shoe routing, clean up dead code"
```

</details>

---

## Phase 2: Integration & Polish (2 agents, sequential after 1.5)

### Task 2A: Auth Pages + Navigation + Landing

**What:** Add Clerk sign-in/sign-up pages, a navbar with user controls, and a proper landing page.

**Files to create:**
- `src/components/navbar.tsx` — header with app name, Clerk `UserButton`, nav links
- `src/app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in
- `src/app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up

**Files to modify:**
- `src/app/page.tsx` — landing page for unauthed users, redirect to /closet if signed in
- `src/app/closet/layout.tsx` — add navbar

**Scope:** Small

**Dependencies:** Phase 1.5 complete

<details>
<summary><strong>Agent Prompt</strong></summary>

```
You are building the auth pages, navigation bar, and landing page for "Shoe Odometer", a Next.js 14 app at /Users/connorrowe/projects/shoe_odometer. Read the existing code first — especially `src/app/layout.tsx`, `src/app/page.tsx`, `src/middleware.ts`, and `src/app/closet/layout.tsx`.

## Your task: Create auth pages, navbar, and landing page

### Files to create:

**1. `src/app/sign-in/[[...sign-in]]/page.tsx`**
- Renders Clerk's `<SignIn />` component from `@clerk/nextjs`
- Centered on the page (flexbox centering)
- Minimal styling — let Clerk handle the form

**2. `src/app/sign-up/[[...sign-up]]/page.tsx`**
- Renders Clerk's `<SignUp />` component from `@clerk/nextjs`
- Same centered layout as sign-in

**3. `src/components/navbar.tsx`** — Client component (`"use client"`)
- Fixed/sticky header at the top
- Left: App name "Shoe Odometer" (link to `/closet` if signed in, `/` if not) — use a shoe emoji: 👟
- Right: Clerk `<UserButton />` component (shows avatar, sign-out, etc.) when signed in. "Sign In" link when not signed in.
- Use `SignedIn`/`SignedOut` from `@clerk/nextjs` to conditionally render
- Clean, minimal design — white background, subtle bottom border
- Responsive

### Files to modify:

**4. `src/app/page.tsx`** — Landing page for unauthenticated users
- Import `auth` from `@clerk/nextjs/server` and `redirect` from `next/navigation`
- If user is signed in (`auth()` returns a userId), `redirect("/closet")`
- Hero section for unauthenticated visitors:
  - Headline: "Track Every Mile"
  - Subheadline: "Keep a digital closet of your shoes and log walks to track cumulative mileage"
  - CTA button: "Get Started" -> `/sign-up`
  - Secondary link: "Already have an account? Sign in" -> `/sign-in`
  - 2-3 feature bullets (Add shoes, Log walks, Track mileage)
- Simple, clean design — centered content, generous whitespace

**5. `src/app/closet/layout.tsx`** — Add the navbar
- Import and render `<Navbar />` above `{children}`
- Add some padding for the content below the navbar:
```tsx
import { Navbar } from "@/components/navbar";

export default function ClosetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
```

## Important constraints
- READ existing files before modifying them
- The Navbar should only appear in the closet section (via closet layout), NOT on the landing page
- Do NOT modify any component files in `src/components/` other than creating `navbar.tsx`
- Do NOT modify any files in `src/lib/` or `src/app/closet/actions.ts`
- After all changes, run `npm run lint` to check for issues
- Commit with message: "feat: auth pages, navigation bar, and landing page"
```

</details>

---

### Task 2B: Error Handling + Final Polish

**What:** Add error boundaries, not-found pages, accessibility improvements, and final integration audit.

**Files to create:**
- `src/app/not-found.tsx` — custom 404
- `src/app/error.tsx` — generic error boundary
- `src/app/closet/[id]/not-found.tsx` — "Shoe not found"

**Files to audit and potentially modify:**
- All components — accessibility pass (aria-labels, keyboard handlers)
- `src/middleware.ts` — remove `/api(.*)` from public routes
- `src/components/photo-upload.tsx` — add keyboard accessibility
- `src/components/add-walk-dialog.tsx`, `src/components/edit-walk-dialog.tsx` — use shadcn Textarea instead of raw textarea

**Scope:** Small-Medium

**Dependencies:** Task 2A complete

<details>
<summary><strong>Agent Prompt</strong></summary>

```
You are doing error handling, accessibility, and final polish for "Shoe Odometer", a Next.js 14 app at /Users/connorrowe/projects/shoe_odometer. All feature code and auth pages have been built. Your job is to add error boundaries, improve accessibility, and fix remaining rough edges.

## Step 1: Read the codebase

Read ALL files in `src/` to understand what exists. Pay particular attention to the component files and page files.

## Step 2: Create error boundary files

**`src/app/not-found.tsx`**
- Custom 404 page: "Page not found" message
- Link back to `/closet`
- Simple, centered design matching the app's style

**`src/app/error.tsx`** — Must be a client component (`"use client"`)
- Generic error boundary: "Something went wrong" with a "Try again" button
- Props: `{ error: Error & { digest?: string }, reset: () => void }`
- The "Try again" button calls `reset()`
- Include a link to `/closet` as a fallback

**`src/app/closet/[id]/not-found.tsx`**
- "Shoe not found" message
- "This shoe may have been deleted or doesn't exist"
- Link back to `/closet`

## Step 3: Remove `/api(.*)` from public routes

Edit `src/middleware.ts` — remove `/api(.*)` from the `isPublicRoute` matcher. The app uses Server Actions, not API routes, so there's no reason to leave all API routes unprotected. The public routes should be:
```typescript
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);
```

## Step 4: Accessibility improvements

**`src/components/photo-upload.tsx`** — The clickable div that triggers file upload is keyboard-inaccessible. Add:
- `role="button"`
- `tabIndex={0}`
- `onKeyDown` handler that triggers the file input on Enter/Space
- `aria-label="Upload shoe photo"`

**`src/components/add-walk-dialog.tsx`** and **`src/components/edit-walk-dialog.tsx`** — Both use a hand-styled `<textarea>` instead of the shadcn `<Textarea>` component (which exists at `src/components/ui/textarea.tsx`). Replace:
```tsx
// Before (raw textarea with inline styles):
<textarea className="flex min-h-[80px] w-full rounded-md border..." />

// After (shadcn component):
import { Textarea } from "@/components/ui/textarea";
// ...
<Textarea ... />
```

**Icon-only buttons** — Audit all components for icon-only buttons that lack `aria-label` or `sr-only` text. The ShoeCard and WalkLogTable likely already have `sr-only` spans — verify this and add any missing ones.

## Step 5: Move `prisma` to devDependencies

The `prisma` CLI package is listed under `dependencies` in `package.json` but it should be in `devDependencies` (only `@prisma/client` is needed at runtime). Move it:
- Remove `"prisma"` from `dependencies`
- Add `"prisma"` to `devDependencies` with the same version

## Step 6: Final verification

- Run `npm run lint` and fix any issues
- Run `npm run build` to verify the production build succeeds
- Review the output for any warnings

## Important constraints
- READ each file before editing
- Make minimal changes — do not redesign or restructure components
- Do not change data fetching logic, server actions, or query functions
- Focus on: error handling, accessibility, and correctness
- Commit with message: "fix: error boundaries, accessibility improvements, and cleanup"
```

</details>

---

## Execution Order

```
Phase 1.5 (sequential — 1.5A then 1.5B):
  ├─ Agent 1: Task 1.5A (validation, query dedup, data fixes)
  └─ Agent 1: Task 1.5B (wire up UI actions, fix broken links)

Phase 2 (sequential):
  ├─ Agent 1: Task 2A (auth pages + nav + landing)
  └─ Agent 1: Task 2B (error handling + polish)
```

**Why sequential for 1.5A/1.5B:** Both touch `src/app/closet/page.tsx`. 1.5A changes the data fetching (replacing inlined queries), 1.5B changes the JSX (replacing the Add Shoe link with a dialog). Running them in parallel would cause merge conflicts.

**Why sequential for 2A/2B:** 2B's audit needs to see the navbar and auth pages from 2A to do a complete review.

---

## Post-Phase 2 Verification Checklist

1. [ ] `npm run build` succeeds with no errors
2. [ ] `npm run lint` passes clean
3. [ ] Sign up / sign in works via Clerk
4. [ ] Signed-out users see landing page, cannot access `/closet`
5. [ ] Create a shoe via dialog — appears in closet grid
6. [ ] Edit a shoe via card dropdown — changes persist
7. [ ] Retire/unretire a shoe — badge toggles
8. [ ] Delete a shoe — confirmation dialog, then removed
9. [ ] Log a walk — mileage updates on card and detail page
10. [ ] Edit a walk — changes persist, clear notes works
11. [ ] Delete a walk — mileage decreases
12. [ ] Invalid data (negative miles, empty name) rejected by server
13. [ ] Navbar shows user avatar, sign-out works
14. [ ] 404 page renders for nonexistent shoe
15. [ ] Error boundary renders on server error
16. [ ] Photo upload works (presigned URL flow)
17. [ ] Multi-user: different accounts cannot see each other's shoes
