# NaturalWrite

An AI writing workspace — not a chat box. NaturalWrite is organised around the
whole writing job: describe a brief, review an outline, draft in sections, refine
inline, and keep every document in a searchable library.

Built with Next.js (App Router), TypeScript and Tailwind CSS. Supabase is the
planned persistence layer; until it is wired up, storage is file-backed behind
an interface, so nothing else has to change when it lands.

## Status

This repository is being built in phases. The UI is real and complete for what
exists; anything not built yet says so plainly on the page rather than showing a
control that does nothing.

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Foundation, design system, app shell, marketing site | Done |
| 2 | AI writing studio and server-side generation routes | Done |
| 3 | Document storage, library, search and trash | Done |
| 4 | Templates, brand voice, rewrite and brainstorm tools | Done |
| 5 | SEO writer and research assistant | Done |
| 6 | Supabase auth, Stripe billing and enforced plan limits | Not started |

Persistence is currently a file-backed JSON store under `.data/` behind the
`src/lib/storage` interface, not Supabase. That keeps the document library
working with no external service. Swapping in Supabase means implementing the
same interface; no caller changes.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional; the app runs with no variables set
npm run dev                  # http://localhost:3000
```

The app runs with no environment variables set. Features that need a key say so
on the page instead of failing:

| Feature | Needs | Without it |
| --- | --- | --- |
| Generation (writer, rewrite, brainstorm) | `OPENAI_API_KEY` | Routes return 503 and the UI explains why |
| Research search | `TAVILY_API_KEY` or `BRAVE_SEARCH_API_KEY` | Search is disabled and says so |
| Research summary | `OPENAI_API_KEY` | Summarise is disabled |
| SEO analysis | nothing | Always works; it is computed from the text |
| Document library | nothing | File-backed store under `.data/` |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Test suite (Node's built-in runner, no test framework dependency) |

## Tests

`npm test` runs 178 tests using Node's built-in test runner with a TypeScript
loader; no test framework is installed. Route handlers are imported and called
directly, and the research provider and model paths run against real HTTP
servers started inside the test process. Nothing is mocked.

## Routes

Marketing (`/`): `/features`, `/pricing`, `/login`, `/signup`, `/privacy`, `/terms`.

Workspace (`/dashboard`): `/`, `/writer`, `/documents`, `/templates`,
`/favorites`, `/rewriter`, `/brainstorm`, `/research`, `/seo`, `/brand-voice`,
`/usage`, `/trash`, `/settings`, `/billing`.

API: `/api/generate/section`, `/api/generate/outline`, `/api/generate/rewrite`,
`/api/generate/brainstorm`, `/api/documents`, `/api/documents/[id]`,
`/api/brand-voices`, `/api/brand-voices/[id]`, `/api/seo/analyse`,
`/api/research/search`, `/api/research/summarize`.

## Project layout

```
src/
  app/
    (marketing)/        Public site; shares the marketing header and footer
    dashboard/          Workspace shell and pages
    api/                Server routes: generation, documents, brand voice,
                        SEO analysis, research
    layout.tsx          Root layout, fonts, metadata, skip link
    robots.ts           Crawler rules (the dashboard is disallowed)
    sitemap.ts          Marketing sitemap
  components/
    app/                Shell: sidebar, topbar, search, dashboard widgets
    marketing/          Public site: header, footer, sections, preview
    studio/             Writing studio
    library/            Document library
    templates/          Template gallery
    brand-voice/        Brand voice editor
    rewriter/           Rewrite tool
    brainstorm/         Brainstorm tool
    seo/                SEO writer workspace
    research/           Research assistant workspace
    ui/                 Primitives: button, card, badge, form, tooltip
  lib/
    ai/                 Provider, prompts and route helpers
    seo/                Deterministic SEO analyser and brief builder
    research/           Search providers and summarisation
    store/              Generic JSON store (atomic writes, serialised queue)
    documents/          Document store and query helpers
    templates/          Built-in template library
    brand-voice/        Brand voice store and renderer
    navigation.ts       Single source of truth for navigation
    types.ts            Domain types
    format.ts           Date, number and word-count formatting
```

## Architecture notes

- **The navigation is data.** `src/lib/navigation.ts` drives the sidebar, the
  header title and workspace search, so a route cannot drift out of the menu.
- **One place talks to the model.** `src/lib/ai/provider.ts` is the only module
  that calls a provider, so swapping models or adding a gateway is one change.
- **One store implementation.** `src/lib/store/json-store.ts` handles atomic
  writes (write to a temp file, then rename) and serialises concurrent writes.
  Documents and brand voices both sit on it rather than reimplementing it.
- **Deterministic where it can be.** The SEO analyser, the word counts and the
  research citation check are computed, not generated. The same input always
  gives the same answer, and they work with no API key.
- **Citations are checked, not trusted.** The summariser reports which sources
  the model actually cited and names the ones it ignored, so an uncited summary
  is visible rather than plausible.
- **Empty means empty.** Nothing is invented to fill a gap: an empty search
  renders an empty state, and a page that is not built says so.
- **Secrets stay on the server.** Provider keys are read only in server code.
  Nothing sensitive is prefixed with `NEXT_PUBLIC_`.

## License

Proprietary. All rights reserved.
