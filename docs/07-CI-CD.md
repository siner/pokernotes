# PokerReads — CI/CD Pipeline

Complete GitHub Actions pipeline for PokerReads: quality gates, testing, and production deploys to Cloudflare Pages. Per-PR preview deploys were removed — they leaked one Worker per PR on the Cloudflare account.

---

## 1. Pipeline Overview

```
┌──────────────────────────────────────────────────────────────┐
│  DEVELOPER PUSH                                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌───────────────┐                 ┌────────────────┐
│ PUSH to `dev` │                 │ PR to `main`   │
│ or any branch │                 └───────┬────────┘
└───────┬───────┘                         │
        │                                 ▼
        │                        ┌────────────────┐
        │                        │ CI Pipeline    │
        │                        │ - Lint         │
        │                        │ - Typecheck    │
        │                        │ - Unit tests   │
        │                        │ - Build        │
        │                        │ - E2E (smoke)  │
        │                        │ - Preview      │
        │                        │   Deploy       │
        │                        └───────┬────────┘
        │                                │
        │                                ▼
        │                        ┌────────────────┐
        │                        │ Merge to `main`│
        │                        └───────┬────────┘
        │                                │
        ▼                                ▼
┌───────────────┐                ┌────────────────┐
│ Staging       │                │ Production     │
│ Deploy        │                │ Deploy         │
│ (dev.domain)  │                │ (domain.com)   │
└───────────────┘                └────────────────┘
```

---

## 2. Branch Strategy

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code | `pokerreads.app` (production) |
| `dev` | Integration branch | `dev.pokerreads.app` (staging) |
| `feat/*` | Feature branches | Preview URL per PR |
| `fix/*` | Bug fixes | Preview URL per PR |

**Protection rules on `main`:**
- Require PR with at least 1 review (self-review OK for solo)
- Require all status checks to pass
- No direct pushes
- No force pushes

---

## 3. Required Workflows

### 3.1 `ci.yml` — Pull Request Quality Gate

**Triggers:** `pull_request` to `main` or `dev`

**Jobs (run in parallel where possible):**

1. **lint** — ESLint + Prettier check
2. **typecheck** — `tsc --noEmit`
3. **test-unit** — Vitest unit tests
4. **test-integration** — API routes with mocked Cloudflare bindings (miniflare)
5. **build** — `next build` to catch build errors

Per-PR preview deploys were removed: they created one `pokerreads-pr-<n>` Worker per PR and were never cleaned up. Self-review happens against staging after merging to `dev`.

### 3.2 `deploy-staging.yml` — Staging Deploy

**Triggers:** `push` to `dev`

**Jobs:**
1. Run full CI suite
2. Run D1 migrations against staging database
3. Deploy to Cloudflare Pages (staging environment)
4. Run E2E smoke tests against staging
5. Notify on failure (email/Slack)

### 3.3 `deploy-production.yml` — Production Deploy

**Triggers:** `push` to `main`

**Jobs:**
1. Run full CI suite (again, defensive)
2. Run D1 migrations against production database
3. Deploy to Cloudflare Pages (production environment)
4. Run E2E smoke tests against production
5. Tag release with version bump
6. Create GitHub release with changelog
7. Notify on success/failure

### 3.4 `e2e.yml` — Full E2E Suite (nightly)

**Triggers:** Scheduled nightly + manual dispatch

**Jobs:**
1. Playwright full test suite against staging
2. Lighthouse audit for performance regression
3. Accessibility audit (axe-core)
4. Post report to repo as artifact

### 3.5 `dependabot.yml` — Dependency Updates

Weekly updates for npm + GitHub Actions. Grouped PRs to avoid noise.

---

## 4. Workflow File Specifications

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, dev]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm prettier --check .
      - run: pnpm i18n:check   # Verify en/es translation parity

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  test-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:integration

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NEXT_PUBLIC_APP_URL: https://pokerreads.app
```

### `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy Staging

on:
  push:
    branches: [dev]

concurrency:
  group: deploy-staging
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm build:cf

      - name: Apply D1 migrations (staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: d1 migrations apply pokerreads-db-staging --remote

      - name: Deploy to Cloudflare Pages (staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .vercel/output/static --project-name=pokerreads --branch=dev

      - name: E2E smoke tests
        run: pnpm test:e2e:smoke
        env:
          E2E_BASE_URL: https://dev.pokerreads.app
```

### `.github/workflows/deploy-production.yml`

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm build:cf

      - name: Apply D1 migrations (production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: d1 migrations apply pokerreads-db --remote

      - name: Deploy to Cloudflare Pages (production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .vercel/output/static --project-name=pokerreads --branch=main

      - name: E2E smoke tests
        run: pnpm test:e2e:smoke
        env:
          E2E_BASE_URL: https://pokerreads.app

      - name: Create GitHub release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ github.run_number }}
          generate_release_notes: true
```

### `.github/workflows/e2e-nightly.yml`

```yaml
name: E2E Nightly

on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM UTC daily
  workflow_dispatch:

jobs:
  e2e-full:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium webkit
      - run: pnpm test:e2e
        env:
          E2E_BASE_URL: https://dev.pokerreads.app
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            https://dev.pokerreads.app/
            https://dev.pokerreads.app/tools/pot-odds
            https://dev.pokerreads.app/tools/icm
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: development
      production-dependencies:
        dependency-type: production

  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
    groups:
      actions:
        patterns:
          - "*"
```

---

## 5. Required GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

### Repository secrets
| Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Wrangler deploys (scope: Account.Cloudflare Pages, D1, Workers) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

### Environment-specific (staging & production)
| Secret | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Auth session signing |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `STRIPE_PRICE_ID_MONTHLY` | Product price ID |
| `STRIPE_PRICE_ID_YEARLY` | Product price ID |

Use **GitHub Environments** (staging, production) to scope secrets and require manual approval for production deploys if desired.

---

## 6. `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:cf": "opennextjs-cloudflare build",
    "preview:cf": "opennextjs-cloudflare preview",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest",
    "test:unit": "vitest run --project=unit",
    "test:integration": "vitest run --project=integration",
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test --grep @smoke",
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply pokerreads-db --local",
    "db:migrate:staging": "wrangler d1 migrations apply pokerreads-db-staging --remote",
    "db:migrate:prod": "wrangler d1 migrations apply pokerreads-db --remote",
    "prepare": "husky"
  }
}
```

---

## 7. Local Quality Gates

### Pre-commit (Husky + lint-staged)

`.husky/pre-commit`:
```bash
pnpm exec lint-staged
```

`.lintstagedrc.json`:
```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{md,json,yml,yaml}": ["prettier --write"]
}
```

### Pre-push

`.husky/pre-push`:
```bash
pnpm typecheck && pnpm test:unit
```

This catches issues before they hit CI.

---

## 8. Status Badges (README.md)

```markdown
![CI](https://github.com/USERNAME/pokerreads/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/USERNAME/pokerreads/actions/workflows/deploy-production.yml/badge.svg)
![E2E](https://github.com/USERNAME/pokerreads/actions/workflows/e2e-nightly.yml/badge.svg)
```

---

## 9. Monitoring & Rollback

### Rollback strategy
- Cloudflare Pages keeps all previous deployments
- One-click rollback from Cloudflare dashboard
- For DB migrations: always forward-only, never destructive without a plan
- Feature flags for risky changes (consider `@vercel/edge-config` or KV-based flags)

### Post-deploy health checks
- `/api/health` endpoint returning version + DB + AI status
- Smoke test hits this after every deploy
- Alert if smoke test fails (email notification via GitHub)

---

## 10. Cost Considerations

**GitHub Actions (free tier for public repos):** unlimited minutes. For private repos, 2,000 minutes/month free. The full pipeline uses ~5–10 minutes per PR and ~5 minutes per deploy — well within free limits at MVP scale.

**Cloudflare Pages:** unlimited deploys on free tier.

---

## 11. Sprint 0 Additions (updated)

These tasks are added to Sprint 0 **before any app code is written**:

- [ ] Create GitHub repository (private initially, can go public later)
- [ ] Set up `main` and `dev` branches with protection rules
- [ ] Add all 4 GitHub Actions workflows (ci, deploy-staging, deploy-production, e2e-nightly)
- [ ] Add `dependabot.yml`
- [ ] Configure GitHub Environments (staging, production) with secrets
- [ ] Create 2 Cloudflare Pages projects (staging, production) or use environment variables on a single project
- [ ] Set up Husky + lint-staged
- [ ] First empty PR to `dev` to verify CI passes end-to-end
- [ ] First merge to `main` to verify production deploy works

**Only after the pipeline is green do we start building features.**

---

## 12. Post-MVP Enhancements

- **Visual regression testing** with Percy or Chromatic
- **Bundle size tracking** with bundlesize-action
- **Security scanning** with GitHub CodeQL
- **Performance budgets** enforced in Lighthouse CI
- **Automatic changelog** generation from conventional commits
- **Release-please** for automated versioning
