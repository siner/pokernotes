# CLAUDE.md

This file is the persistent context for Claude Code when working on PokerReads. Read this first, every session.

---

## Project Summary

**PokerReads** is a mobile-first PWA for live poker players. Core features:
- AI-powered note-taking on opponents (Cloudflare Workers AI)
- Free utility calculators (pot odds, ICM, push/fold, hand rankings)
- Pro tier with cloud sync, photos, sharing
- Bilingual from day one: English (source) + Spanish

Target market: live poker players worldwide. Primary interface: mobile PWA.

---

## Tech Stack (non-negotiable)

| Layer | Technology |
|---|---|
| Framework | **Next.js 15** (App Router, Server Components default) |
| Language | **TypeScript** (strict mode, no `any`) |
| Styling | **Tailwind CSS** + **shadcn/ui** |
| Package Manager | **pnpm** |
| Runtime | **Node 22** |
| Deploy | **Cloudflare Pages** (via `@opennextjs/cloudflare`) |
| Database | **Cloudflare D1** (SQLite) with **Drizzle ORM** |
| Storage | **Cloudflare R2** (player photos) |
| Cache | **Cloudflare KV** (rate limiting, sessions) |
| AI | **Cloudflare Workers AI** (`@cf/meta/llama-3.1-8b-instruct`) |
| Auth | **Better Auth** |
| Payments | **Stripe** |
| i18n | **next-intl** (en, es) |
| Testing | **Vitest** (unit + integration) + **Playwright** (E2E) |
| PWA | **Serwist** |

**All backend services run on Cloudflare.** No Vercel, no Supabase, no OpenAI (we use Workers AI).

---

## Documentation Map

Always reference these in `docs/` before implementing:

| Doc | When to read |
|---|---|
| `docs/01-PRD.md` | Product features, user stories, monetization |
| `docs/02-ARCHITECTURE.md` | Folder structure, API design, Cloudflare bindings |
| `docs/03-DATABASE.md` | Drizzle schema, tag taxonomy, IndexedDB shape |
| `docs/04-UX-FLOWS.md` | User journeys, screen specs, visual design |
| `docs/05-SPRINT-PLAN.md` | Current sprint tasks, priorities |
| `docs/06-CLAUDE-CODE-GUIDE.md` | Prompting patterns, conventions, gotchas |
| `docs/07-CI-CD.md` | GitHub Actions pipeline, quality gates |
| `docs/08-I18N.md` | Translation strategy, locale routing |
| `docs/09-SKILLS-MCPS.md` | Recommended Claude Code skills and MCPs |

---

## Golden Rules

These rules are **non-negotiable** and apply to every change:

### 1. CI/CD pipeline first
**Before writing any feature code**, the full pipeline must be green (see `docs/07-CI-CD.md`). Never disable a check to "ship faster."

### 2. No hardcoded strings in UI
Every user-facing string goes through `next-intl`. Add both `en.json` and `es.json` keys when creating a new string. See `docs/08-I18N.md`.

### 3. TypeScript strict mode
- No `any` — use `unknown` and narrow, or write a proper type
- Prefer `satisfies` over type assertions
- Runtime validation with Zod on all external inputs (API bodies, AI outputs, form data)

### 4. Server Components by default
Only add `"use client"` when the component needs interactivity, browser APIs, or hooks. Keep the client bundle lean.

### 5. Mobile-first, always
- Every UI is designed for 375px first, then scaled up
- Tap targets ≥ 44×44px
- Dark theme default (discreet at the table)
- Readable in low-light conditions

### 6. Privacy-aware
- Player descriptions and notes are private by design
- No analytics that track individual users beyond essentials (Cloudflare Web Analytics only)
- GDPR: account deletion truly deletes all user data

### 7. Offline-first for free tier
Notes stored in IndexedDB. App must work without network for the free flow. Sync is a Pro feature.

### 8. Cost-conscious
- Stay within Cloudflare free tier wherever possible
- Rate limit AI calls aggressively (see `docs/02-ARCHITECTURE.md` section 5)
- Cache aggressively with KV for repeated queries

---

## Conventions

### Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE`
- DB tables: `snake_case` (plural)
- API routes: `kebab-case` paths
- Feature branches: `feat/short-description`

### Imports
- Named exports preferred (except Next.js pages/layouts, which need default)
- Absolute imports via `@/` alias
- Group imports: external, then internal, then relative

### File Organization
- Co-locate tests with the code they test: `potOdds.ts` + `potOdds.test.ts`
- Domain logic in `lib/`, never in components
- Shared types in `types/` at appropriate scope

### Commits (Conventional Commits)
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change that doesn't add feature or fix bug
- `docs:` documentation only
- `chore:` tooling, dependencies, CI
- `test:` adding or fixing tests

One logical change per commit. Reference sprint task in body when relevant.

---

## Workflow Expectations

### Before starting a task
1. Check which sprint and task in `docs/05-SPRINT-PLAN.md`
2. Read the relevant doc sections
3. Create a feature branch: `git checkout -b feat/<task-name>` from `dev`

### During a task
1. Write types/schemas first (Drizzle, Zod, TS)
2. Implement backend/API before UI
3. Add i18n keys for any new strings in `messages/en.json` AND `messages/es.json`
4. Write tests for pure logic (calculators, parsers)
5. Run locally: `pnpm lint && pnpm typecheck && pnpm test:unit`

### Before committing
Pre-commit hook runs:
- ESLint + Prettier on staged files
- i18n translation parity check

Pre-push hook runs:
- `pnpm typecheck`
- `pnpm test:unit`

### Pull request
1. Push to `feat/*` branch
2. Open PR to `dev`
3. CI must pass (lint, typecheck, tests, build)
4. Self-review locally with `pnpm preview:cf` (or against staging once merged)
5. Merge to `dev` → auto-deploy to staging
6. When sprint is complete, PR from `dev` to `main` → production deploy

---

## Cloudflare-Specific Gotchas

### Workers AI
- Responses can be imperfect JSON — always validate with Zod + retry on parse failure
- Llama 3.1 8B needs explicit system prompts with examples
- Always pass the user's locale so AI responds in the right language
- Rate limit aggressively via KV

### D1 (SQLite)
- No foreign key enforcement by default; rely on Drizzle + app code
- Transactions have limited support; prefer batch operations
- Max 1MB per row (fine for notes; photos go to R2)

### OpenNext + Cloudflare Pages
- Some Node APIs not available: use Web APIs (`crypto.randomUUID()`, not `crypto` module)
- `fs` module: nope. R2 for files.
- `nodejs_compat` flag enabled for compatibility

### PWA on iOS
- No push notifications (pre-iOS 16.4)
- IndexedDB quota ~50MB before prompts
- Service worker must be served from root scope
- No background sync — design for online-only sync

### Better Auth
- Uses its own tables; don't conflict with custom `users` table
- Extend Better Auth's user table via Drizzle for our custom columns (tier, preferredLocale, stripeCustomerId)

---

## Common Scripts

```bash
# Development
pnpm dev                    # Next.js dev server
pnpm preview:cf             # Preview Cloudflare build locally

# Quality
pnpm lint                   # ESLint
pnpm lint:fix               # Auto-fix
pnpm typecheck              # tsc --noEmit
pnpm format                 # Prettier write
pnpm i18n:check             # Verify en/es translation parity

# Tests
pnpm test                   # Watch mode
pnpm test:unit              # Unit tests run once
pnpm test:integration       # Integration tests with miniflare
pnpm test:e2e               # Playwright full suite
pnpm test:e2e:smoke         # Smoke tests only (@smoke tag)

# Database
pnpm db:generate            # Generate Drizzle migration from schema
pnpm db:migrate:local       # Apply to local D1
pnpm db:migrate:staging     # Apply to staging D1 (remote)
pnpm db:migrate:prod        # Apply to production D1 (remote)

# Build & Deploy
pnpm build                  # Next.js build (local)
pnpm build:cf               # OpenNext build for Cloudflare
```

---

## Environment Variables

See `docs/06-CLAUDE-CODE-GUIDE.md` section 2 for full list. Key ones:

```env
BETTER_AUTH_SECRET=         # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=                # Comma-separated emails allowed at /admin (empty = no admins)
```

Cloudflare bindings (in `wrangler.toml`, not env): `DB`, `PLAYER_PHOTOS`, `RATE_LIMITS`, `AI`.

---

## When Asked to Do X, Do Y

### "Add a new page"
1. Create under `app/[locale]/` — never outside the `[locale]` segment
2. Add strings to `messages/en.json` and `messages/es.json`
3. Add metadata (including `metaDescription` translation)
4. Update `app/sitemap.ts` if public
5. Use Server Component unless interactivity required

### "Add a new API route"
1. Create under `app/api/<route>/route.ts` (not localized)
2. Validate request body with Zod
3. Validate response shape with Zod (especially for AI)
4. Add rate limiting via KV if user-facing
5. Write integration test with miniflare

### "Add a new DB field"
1. Update `lib/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Review migration file
4. Apply locally: `pnpm db:migrate:local`
5. Update types derived from schema
6. **Never write destructive migrations without a plan** (forward-only by default)

### "Fix a bug"
1. Write a failing test first (when practical)
2. Fix the bug
3. Verify test now passes
4. Add `fix:` commit referencing the issue

### "Refactor X"
1. Ensure tests exist for the area being refactored
2. Refactor in small commits
3. Each commit should leave the codebase green

---

## Things to Avoid

- ❌ `any` in TypeScript
- ❌ Hardcoded English strings in components
- ❌ Class components
- ❌ Default exports (except Next.js requirements)
- ❌ Inline styles instead of Tailwind
- ❌ Direct DB calls in components (always via `lib/`)
- ❌ `console.log` in committed code (use a logger or remove)
- ❌ Committing `.env*` files
- ❌ Disabling a failing test to ship (fix it or mark `.skip` with a TODO and ticket)
- ❌ Third-party APIs for AI (use Workers AI)
- ❌ External auth providers that conflict with Better Auth

---

## Poker Domain Context

Claude Code should understand these concepts to build the product well:

- **Pot odds**: ratio of current bet to total pot, used to determine if a call is profitable
- **ICM (Independent Chip Model)**: method to calculate tournament equity based on chip stacks and payout structure
- **Push/Fold**: endgame strategy for short stacks (typically < 15BB), based on Nash equilibrium tables
- **BB (big blind)**: standard unit of measurement for stack sizes
- **Tags**: behavioral categorizations of opponents (aggro, passive, fish, nit, etc. — full list in `docs/03-DATABASE.md`)
- **Live poker**: in-person play at a physical cardroom, vs online poker
- **Session**: a continuous period of play at a specific table/venue

When in doubt about poker terminology, keep English terms in Spanish translations — they're widely used by Spanish-speaking poker communities.

---

## Success Criteria

A feature is done when:
1. ✅ CI is green (lint, typecheck, all tests, build, i18n check)
2. ✅ Works on mobile (tested at 375px viewport minimum)
3. ✅ Works in both `en` and `es` locales
4. ✅ Accessible (keyboard nav, screen reader labels, WCAG AA contrast)
5. ✅ Respects `prefers-reduced-motion`
6. ✅ Preview deploy verified
7. ✅ Relevant docs updated if architecture changed

---

## Contact & Escalation

Solo developer project (Fran). When architectural decisions are needed:
1. Check existing docs for precedent
2. If genuinely new, propose the decision with tradeoffs in the PR description
3. Update the relevant doc as part of the same PR

**Never silently deviate from the documented architecture.** If a doc is wrong, update it.
