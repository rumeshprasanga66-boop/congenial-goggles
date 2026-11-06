# NaturalWrite

An AI writing workspace — not a chat box. NaturalWrite is organised around the
whole writing job: describe a brief, review an outline, draft in sections, refine
inline, and keep every document in a searchable library.

Built with Next.js (App Router), TypeScript, Tailwind CSS and Supabase.

## Status

This repository is being built in phases. The UI is real and complete for what
exists; anything not built yet says so plainly on the page rather than showing a
control that does nothing.

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Foundation, design system, app shell, marketing site, honest placeholders | Done |
| 2 | AI writing studio and server-side generation routes | Not started |
| 3 | Supabase auth, document storage, search and trash | Not started |
| 4 | Templates, brand voice, rewrite and brainstorm tools | Not started |
| 5 | Research assistant, usage tracking, SEO writer | Not started |
| 6 | Stripe billing and enforced plan limits | Not started |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional for Phase 1; required from Phase 3
npm run dev                  # http://localhost:3000
```

The app runs with no environment variables set. Database-backed surfaces report
that storage is not connected instead of failing.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

## Routes

Marketing (`/`): `/features`, `/pricing`, `/login`, `/signup`, `/privacy`, `/terms`.

Workspace (`/dashboard`): `overview`, `/writer`, `/documents`, `/templates`,
`/favorites`, `/rewriter`, `/brainstorm`, `/research`, `/seo`, `/brand-voice`,
`/usage`, `/trash`, `/settings`, `/billing`.

## Project layout

```
src/
  app/
    (marketing)/        Public site; shares the marketing header and footer
    dashboard/          Authenticated workspace shell
    layout.tsx          Root layout, fonts, metadata, skip link
    robots.ts           Crawler rules (the dashboard is disallowed)
    sitemap.ts          Marketing sitemap
  components/
    app/                Shell: sidebar, topbar, search, dashboard widgets
    marketing/          Public site: header, footer, sections, preview
    ui/                 Primitives: button, card, badge, form, tooltip
  lib/
    data.ts             Server-side data layer (empty until Phase 3)
    navigation.ts       Single source of truth for navigation
    types.ts            Domain types mirroring the planned tables
    format.ts           Date, number and word-count formatting
```

## Architecture notes

- **The navigation is data.** `src/lib/navigation.ts` drives the sidebar, the
  header title and workspace search, so a route cannot drift out of the menu.
- **Empty means empty.** `src/lib/data.ts` returns genuinely empty results while
  no database exists. Components exercise their real empty states from day one.
- **Secrets stay on the server.** Provider keys are read only in server code.
  Nothing sensitive is prefixed with `NEXT_PUBLIC_`.
- **Honest placeholders.** `ComingSoon` states what is missing and what will
  make it work, so no user is misled by a button that appears functional.

## License

Proprietary. All rights reserved.
