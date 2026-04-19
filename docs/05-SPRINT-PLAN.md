# PokerReads — Sprint Plan & Roadmap

## Timeline Overview

**Total MVP duration:** 3–4 weeks (solo developer, part-time hours)

| Sprint | Duration | Focus |
|---|---|---|
| Sprint 0 | 3 days | Setup, scaffolding, **CI/CD pipeline** |
| Sprint 1 | 5 days | Calculators + PWA shell |
| Sprint 2 | 7 days | Table notes (local) + AI integration |
| Sprint 3 | 5 days | Auth + Pro tier + cloud sync |
| Sprint 4 | 3 days | Polish, SEO, launch prep |

---

## Sprint 0 — Setup, Scaffolding & CI/CD (3 days)

### Goals
- Full CI/CD pipeline working **before any feature code**
- Working Next.js 15 project deployed to Cloudflare Pages (staging + production)
- Design tokens and base components ready
- Green pipeline end-to-end

### Tasks

#### Day 1 — Repository & Pipeline (before any app code)
- [ ] Create GitHub repository (private initially)
- [ ] Configure `main` + `dev` branch protection rules
- [ ] Add all 4 GitHub Actions workflows (see `07-CI-CD.md`):
  - [ ] `ci.yml`
  - [ ] `deploy-staging.yml`
  - [ ] `deploy-production.yml`
  - [ ] `e2e-nightly.yml`
- [ ] Add `dependabot.yml`
- [ ] Configure GitHub Environments (staging, production) + secrets
- [ ] Create Cloudflare Pages projects (staging + production)
- [ ] **Install Claude Code skills and MCPs per `09-SKILLS-MCPS.md` section 9**
- [ ] **Create `.claude/skills/` folder with 5 custom skills** (poker-domain, cloudflare-stack, i18n-guardian, sprint-review, ai-prompt-tester)
- [ ] Verify empty pipeline runs green end-to-end

#### Day 2 — Project Scaffolding
- [ ] Create Next.js 15 project with TypeScript + App Router
- [ ] Configure OpenNext for Cloudflare Pages
- [ ] Set up `wrangler.toml` with bindings (D1, R2, KV, AI)
- [ ] Install and configure Tailwind CSS + shadcn/ui
- [ ] **Install and configure `next-intl`** (see `08-I18N.md`)
- [ ] **Create `app/[locale]/` structure and `messages/en.json` + `messages/es.json` scaffolds**
- [ ] **Add `middleware.ts` for locale routing**
- [ ] **Add `i18n:check` script + wire into CI**
- [ ] Configure ESLint + Prettier
- [ ] Set up Husky + lint-staged (pre-commit + pre-push hooks)
- [ ] Set up Vitest + Playwright (empty test suites first)
- [ ] Configure all `package.json` scripts per `07-CI-CD.md` section 6

#### Day 3 — Foundations
- [ ] Create base layout with dark theme
- [ ] Set up Drizzle ORM + D1 with first migration (including `preferredLocale` field)
- [ ] Generate PWA icons and manifest
- [ ] Configure Serwist for PWA
- [ ] Add `/api/health` endpoint for smoke tests
- [ ] **Add `LanguageSwitcher` component**
- [ ] **Translate first page (landing hero) to both en/es**
- [ ] Write one placeholder unit test (ensure test runner works in CI)
- [ ] Write one placeholder E2E smoke test per locale (hits `/en` and `/es`)
- [ ] First PR to `dev` → CI runs green → merge
- [ ] First PR from `dev` to `main` → production deploy runs green
- [ ] **Verify `/en` and `/es` both render correctly in production Cloudflare deployment**

### Deliverable
Empty "Hello PokerReads" app live at both staging and production URLs, installable as PWA, with a **fully working CI/CD pipeline that blocks bad code from merging**.

---

## Sprint 1 — Calculators + PWA Shell (5 days)

### Goals
- All 4 calculators functional and SEO-optimized
- Landing page live
- PWA installable with offline support for calculators

### Tasks

#### Calculators (each: ~half day)
- [ ] **Pot Odds Calculator** — `/tools/pot-odds`
  - Input form with live calculation
  - Equity needed formula
  - Color-coded output
  - SEO meta + structured data
- [ ] **Push/Fold Nash** — `/tools/push-fold`
  - Precomputed Nash range tables as JSON
  - Stack/position selectors
  - 13x13 visual hand grid (SVG or CSS grid)
- [ ] **ICM Calculator** — `/tools/icm`
  - Dynamic player rows
  - Payout structure input
  - Malmuth-Harville or Landau ICM algorithm
  - Results table
- [ ] **Hand Rankings** — `/tools/hand-rankings`
  - Static page with visual rankings
  - Purely educational, SEO asset

#### Landing & Marketing
- [ ] Landing page (`/`) with hero, features, pricing
- [ ] Pricing page (`/pricing`)
- [ ] Footer with calculator links (internal linking for SEO)

#### PWA
- [ ] Service worker configuration
- [ ] Offline fallback page
- [ ] Install prompt component
- [ ] Verify installability on iOS and Android

### Deliverable
Marketing site live with working calculators. Ready to start driving organic traffic.

---

## Sprint 2 — Table Notes (Local) + AI (7 days)

### Goals
- Full note-taking flow working without authentication
- AI structuring via Workers AI
- IndexedDB persistence

### Tasks

#### IndexedDB Setup
- [ ] Install `idb` library
- [ ] Create storage layer (`lib/storage/local.ts`)
- [ ] Implement CRUD for players, notes, sessions
- [ ] Migration-safe schema versioning

#### Player Management UI
- [ ] Player list page (`/notes`) with empty state
- [ ] Search and filter functionality
- [ ] Add player modal/page
- [ ] Edit player page
- [ ] Delete player with confirmation
- [ ] Tag selector component (grouped by category)

#### Notes UI
- [ ] Note composer component (textarea + AI button)
- [ ] Notes list on player detail
- [ ] Note editing
- [ ] Delete note

#### AI Integration
- [ ] Create `/api/ai/structure-note` route
- [ ] Cloudflare Worker AI binding config
- [ ] System prompt engineering for Llama 3.1 8B
- [ ] JSON response parser with validation (Zod)
- [ ] Rate limiting via KV (IP-based for anonymous)
- [ ] Error handling and fallbacks
- [ ] Loading states in UI
- [ ] AI response review/edit UI

#### Session Management
- [ ] Active session concept
- [ ] `/session` page
- [ ] Quick-add player during session
- [ ] Session summary view

### Deliverable
Fully functional note-taking app working offline, AI structuring real notes.

---

## Sprint 3 — Auth + Pro Tier + Cloud Sync (5 days)

### Goals
- Users can sign up and log in
- Pro tier unlocks cloud sync and premium features
- Stripe integration working

### Tasks

#### Authentication (Better Auth)
- [ ] Install and configure Better Auth
- [ ] Email/password signup + login
- [ ] Google OAuth setup
- [ ] Email verification (optional for MVP)
- [ ] Password reset flow
- [ ] Session management via cookies
- [ ] Protected route middleware

#### User Profile & Settings
- [ ] Settings page (`/settings`)
- [ ] Profile editing
- [ ] Account deletion flow (GDPR)

#### Cloud Sync
- [ ] `/api/players` CRUD endpoints (Pro-gated)
- [ ] `/api/notes` CRUD endpoints
- [ ] `/api/sessions` CRUD endpoints
- [ ] Sync-on-login: pull cloud data to local
- [ ] Optimistic local write, async cloud write
- [ ] Conflict resolution (last-write-wins for MVP)

#### Stripe Integration
- [ ] Stripe account setup + products created
- [ ] Checkout session API route
- [ ] Stripe webhook handler (`/api/stripe/webhook`)
- [ ] Subscription status sync to D1
- [ ] Customer portal link
- [ ] Upgrade flow from free tier modal

#### Pro Features
- [ ] Unlimited players (remove 20-player gate)
- [ ] Player photo upload to R2
- [ ] Image optimization (resize before upload)
- [ ] Player sharing UI (basic: by email)
- [ ] Shared players section in UI
- [ ] Export data (CSV) button

### Deliverable
Full SaaS experience: free users can sign up, upgrade to Pro, sync across devices.

---

## Sprint 4 — Polish, SEO, Launch (3 days)

### Goals
- Production-ready quality
- SEO-optimized for organic acquisition
- Launch announcement prepared

### Tasks

#### SEO
- [ ] Meta tags on all pages (Open Graph, Twitter cards)
- [ ] Structured data (JSON-LD) for calculators
- [ ] `sitemap.xml` generation
- [ ] `robots.txt`
- [ ] Blog-ready structure (even if empty at launch)
- [ ] Link building plan (Reddit poker subs, poker forums)

#### Analytics & Monitoring
- [ ] Cloudflare Web Analytics (privacy-friendly)
- [ ] Error tracking (Sentry or Cloudflare logs)
- [ ] Conversion funnel tracking (free → pro)

#### Performance
- [ ] Lighthouse audit: target 95+ on all metrics
- [ ] Image optimization (next/image for all assets)
- [ ] Bundle analysis and code-splitting
- [ ] Test on real mobile devices (iOS + Android)

#### Launch Prep
- [ ] Landing page copy polish
- [ ] Pricing page final
- [ ] Privacy policy + Terms of service
- [ ] GDPR cookie banner (if needed)
- [ ] Support email setup (`support@pokerreads.app`)
- [ ] ProductHunt launch assets
- [ ] Twitter/X thread draft
- [ ] Reddit post drafts for r/poker, r/livepoker

### Deliverable
**Launch day.** Live at pokerreads.app (or similar), ready to accept users.

---

## Post-MVP Roadmap (v1.1 — v2)

### v1.1 — User Feedback Response (Month 2)
- Blog (first articles: "How to take poker notes", calculator explainers)
- Improved AI prompts based on user feedback
- Better mobile gestures (swipe to delete, etc.)
- Performance improvements

### v1.2 — Engagement (Month 3)
- Weekly/monthly player stats dashboard
- Notification system (shared player updates)
- Multi-language support (Spanish first)
- Apple Sign-In for iOS PWA users

### v2 — Expansion (Month 4+)
- Hand history import (text paste)
- Hand analysis AI (separate paid tier)
- Collaborative sessions (live sync with friends)
- Native iOS/Android apps (if PWA limitations hit)
- Integration with poker room player databases (ethical concerns TBD)

---

## Risk Register

| Risk | Mitigation |
|---|---|
| iOS PWA limitations (push notifications, background sync) | Accept as MVP limitation, plan native app if needed |
| Workers AI latency/quality | Fallback prompts, potentially allow OpenAI as backup |
| SEO slow to ramp | Paid acquisition ready (Google Ads on "poker calculator" keywords) |
| Low conversion free → pro | Adjust pricing, improve Pro feature set |
| Legal concerns (sharing player info) | Clear ToS, opt-in sharing, GDPR compliance |
