# PokerReads — Claude Code Implementation Guide

This document is a handoff guide for working with **Claude Code** to build PokerReads. It contains project conventions, prompting patterns, and task breakdowns optimized for AI-assisted development.

---

## 1. Project Conventions

### Code Style
- TypeScript strict mode — no `any`
- ESM imports only
- Named exports preferred over default exports (except for pages/layouts)
- Functional components only (no class components)
- Server Components by default; `"use client"` only when needed

### Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE`
- Database tables: `snake_case` (plural)
- API routes: `kebab-case` paths

### File Organization
- Co-locate component styles and tests with the component
- Domain logic in `lib/` (not in components)
- Shared types in `types/` at appropriate scope

### Commits
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- One logical change per commit
- Reference sprint task in commit body when relevant

---

## 2. Environment Variables

### `.env.local` (development)
```env
# Better Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Cloudflare Dashboard (production)
Same variables as above, plus Cloudflare-native bindings configured in `wrangler.toml`.

---

## 3. Recommended Development Order

Follow the sprint plan in `05-SPRINT-PLAN.md`. Within each sprint, work in this order:

1. **Types/schemas first** — Define Drizzle schema, Zod schemas, TypeScript types
2. **Backend/API routes** — Build and test API endpoints with mock data
3. **UI components** — Build in isolation (Storybook optional)
4. **Page integration** — Wire components into pages
5. **Polish** — Animations, error states, loading states

---

## 4. Prompting Claude Code Effectively

### Good prompt template
```
Context: Working on PokerReads, Sprint 2, task "Create AI structure-note endpoint"
File: app/api/ai/structure-note/route.ts

Requirements:
- POST endpoint accepting { rawNote: string, existingTags?: string[] }
- Uses Cloudflare Workers AI binding (env.AI)
- Model: @cf/meta/llama-3.1-8b-instruct
- System prompt specialized in poker (see 02-ARCHITECTURE.md section 5)
- Returns structured JSON matching this Zod schema: [paste schema]
- Rate limit: 10/day for IP-only, 20 for free users, 200 for pro
- Rate limiting stored in KV namespace RATE_LIMITS

Reference files:
- lib/db/schema.ts (for user tier check)
- lib/ai/noteStructurer.ts (existing helper if any)

Please implement with error handling and inline comments.
```

### Things to include in every prompt
- Sprint and task reference
- Target file path
- Related files to reference
- Constraints (TypeScript strict, no `any`, etc.)
- Expected return shape if applicable

### Anti-patterns to avoid
- ❌ "Build the whole app"
- ❌ Vague requirements without acceptance criteria
- ❌ Not mentioning Cloudflare bindings (Claude Code may default to OpenAI)
- ❌ Forgetting to specify error handling requirements

---

## 5. Key Technical Gotchas

### OpenNext + Cloudflare Pages
- Some Node.js APIs are not available; use Web APIs where possible
- Check compatibility: `crypto.randomUUID()` OK, `fs` not OK
- `nodejs_compat` flag enabled for compatibility

### Workers AI Quirks
- Response format is not always perfectly JSON — parse defensively
- Add retry logic for occasional timeouts
- Llama 3.1 8B is fast but weaker than 70B — keep prompts simple and explicit
- Always provide an example output in the system prompt

### D1 Limitations
- No foreign key enforcement by default — Drizzle handles referential integrity in app code
- Transactions have limited support; prefer batch operations
- Max 1MB per row — fine for notes, photos go to R2

### PWA on iOS
- No push notifications (except iOS 16.4+ in standalone mode)
- Limited IndexedDB quota (~50MB before prompts)
- Service worker must be served from root scope
- No background sync — design for online-only sync

### Better Auth
- Requires its own tables — don't conflict with our `users` table
- We'll use Better Auth's user table as source of truth and extend it with our columns via Drizzle

---

## 6. Testing Strategy

### MVP: Pragmatic minimum
- **Unit tests:** Calculator functions (ICM, pot odds, Nash lookup) — pure logic, easy to test
- **Integration tests:** API routes with mocked Cloudflare bindings (using `miniflare`)
- **E2E:** Skip for MVP, add post-launch with Playwright

### Tools
- Vitest for unit and integration
- `@cloudflare/vitest-pool-workers` for Workers testing
- Mock Workers AI responses in tests

---

## 7. Deployment Checklist

### First deploy
- [ ] Cloudflare account created with payment method (Workers AI requires)
- [ ] D1 database created: `wrangler d1 create pokerreads-db`
- [ ] KV namespace created: `wrangler kv:namespace create RATE_LIMITS`
- [ ] R2 bucket created: `wrangler r2 bucket create pokerreads-photos`
- [ ] IDs added to `wrangler.toml`
- [ ] Environment variables added to Cloudflare Pages dashboard
- [ ] Custom domain configured + DNS pointing to Cloudflare
- [ ] Drizzle migration applied: `wrangler d1 migrations apply pokerreads-db`
- [ ] Stripe webhook URL configured

### Every deploy
- [ ] Lint passes
- [ ] Types check passes
- [ ] Unit tests pass
- [ ] `npm run build` succeeds locally
- [ ] Preview deployment tested
- [ ] Production deploy

---

## 8. Documentation Index

| Doc | Purpose |
|---|---|
| `01-PRD.md` | Product vision, users, features |
| `02-ARCHITECTURE.md` | Tech stack, data flow, APIs |
| `03-DATABASE.md` | Drizzle schema, indexes, migration strategy |
| `04-UX-FLOWS.md` | User flows, screens, design direction |
| `05-SPRINT-PLAN.md` | Timeline, tasks, roadmap |
| `06-CLAUDE-CODE-GUIDE.md` | This file — handoff for AI-assisted dev |
| `07-CI-CD.md` | GitHub Actions pipeline, quality gates, deploys |
| `08-I18N.md` | Internationalization strategy (en + es) |
| `09-SKILLS-MCPS.md` | Recommended Claude Code skills and MCPs |

---

## 9. First Claude Code Session — Suggested Opening

When starting Sprint 0 with Claude Code, open with:

```
I'm building PokerReads, a live poker companion PWA using Next.js 15 
and the full Cloudflare stack (Pages, Workers, D1, R2, KV, Workers AI).
Launching in English and Spanish from day one.

Please read these files before we start:
- docs/01-PRD.md
- docs/02-ARCHITECTURE.md  
- docs/05-SPRINT-PLAN.md
- docs/06-CLAUDE-CODE-GUIDE.md
- docs/07-CI-CD.md
- docs/08-I18N.md

Then let's begin Sprint 0. Per the plan, we set up the full CI/CD pipeline 
BEFORE any feature code. Start with Day 1 tasks: create the GitHub Actions 
workflows exactly as specified in 07-CI-CD.md, then we'll move to 
scaffolding on Day 2 (including i18n setup — every new page uses 
translations from day one, no hardcoded strings).
```

This gives Claude Code full context from the start and anchors it to the documented plan.

---

## 10. When Things Go Wrong

### If Claude Code produces code that conflicts with the docs
- Stop and ask: "This conflicts with section X of doc Y. Should we update the doc or the code?"
- Update the doc deliberately if the change is intentional

### If stuck on a Cloudflare-specific issue
- Check Cloudflare Developer Platform MCP (already connected) for latest docs
- Reference: `https://developers.cloudflare.com/workers-ai/`
- Reference: `https://developers.cloudflare.com/d1/`

### If AI quality is poor
- Iterate on the system prompt in `lib/ai/noteStructurer.ts`
- Consider prompt caching, few-shot examples
- Test with the same input across multiple runs for consistency check

---

**Good luck. Ship it.**
