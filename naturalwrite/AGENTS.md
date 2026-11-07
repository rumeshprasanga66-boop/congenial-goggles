# AGENTS.md — NaturalWrite

Repository knowledge for future sessions. Read this before making changes.

## What this project is

NaturalWrite, an AI writing SaaS workspace. Next.js App Router, TypeScript
strict, Tailwind CSS, Supabase planned for persistence. It is deliberately not a
chat interface; every feature maps to a writing stage.

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server on :3000
npm run build        # production build (must stay clean)
npm run lint         # ESLint via next lint
npm run typecheck    # tsc --noEmit
```

Verify work with `npm run typecheck && npm run lint && npm run build` before
finishing. All three must pass with no warnings.

## Conventions

- **Path alias.** `@/*` maps to `./src/*`.
- **Class names.** Always compose with `cn()` from `@/lib/cn`.
- **Colours.** Use the semantic tokens (`canvas`, `surface`, `subtle`, `line`,
  `ink`, `muted`, `faint`, `brand`, `positive`, `caution`, `danger`) defined as
  CSS variables in `src/app/globals.css` and mapped in `tailwind.config.ts`.
  Never hard-code a hex value in a component.
- **Radii.** `rounded-card` and `rounded-control`.
- **Shadows.** `shadow-card`, `shadow-raised`, `shadow-pop`.
- **Font size.** `text-2xs` is the smallest step; do not go below it.
- **Icons.** `lucide-react`, sized with `size-*` utilities.
- **Navigation.** Add routes to `src/lib/navigation.ts`, not directly to the
  sidebar. The sidebar, header title and search all read from that file.
- **Server vs client.** `src/lib/data.ts` starts with `import "server-only"`.
  Client components live behind `"use client"` and never import it.

## Non-negotiable product rules

1. **No fake data.** Never invent documents, usage numbers, notifications,
   credits, reviews or citations. `src/lib/data.ts` returns empty results and
   the UI renders real empty states.
2. **No fake functionality.** A control that does nothing must be disabled or
   replaced by `ComingSoon`, which states what is missing and why.
3. **Honest AI.** Research never fabricates sources. Errors and limits are
   stated in plain language, and generation is never described as unlimited.
4. **Secrets server-side only.** Provider keys are read in server code only.
   Nothing sensitive carries the `NEXT_PUBLIC_` prefix.
5. **Accessibility.** Every interactive element needs an accessible name; use
   `aria-current` for the active nav item and keep the skip link working.

## Environment

`.env.example` documents every variable. The app builds and runs with none set.
`DEMO_MODE` in `src/lib/data.ts` is true when Supabase credentials are absent
and drives the "no database connected" notice on the dashboard.

## Known pitfalls

- `src/app/dashboard/layout.tsx` sets `dynamic = "force-dynamic"` because the
  greeting and date must not be frozen into a static prerender.
- Files created through the editor tool can occasionally be written truncated;
  re-read a new file after creating it and check the last line is intact.
- `next lint` prints a deprecation notice on Next 15. It still works; migration
  to the ESLint CLI is a separate task.
