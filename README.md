# PokerReads Documentation

Complete specification and planning docs for **PokerReads** — a mobile-first PWA for live poker players, built on the Cloudflare stack.

## 📋 Document Index

| # | Document | Description |
|---|---|---|
| ⭐ | [CLAUDE.md](./CLAUDE.md) | **Root context file for Claude Code — always loaded, every session** |
| 01 | [PRD](./01-PRD.md) | Product vision, target users, features, monetization |
| 02 | [Architecture](./02-ARCHITECTURE.md) | Tech stack, folder structure, API design, Cloudflare integration |
| 03 | [Database](./03-DATABASE.md) | Drizzle schema, indexes, local IndexedDB, tag taxonomy |
| 04 | [UX & Flows](./04-UX-FLOWS.md) | User journeys, screen specs, visual design direction |
| 05 | [Sprint Plan](./05-SPRINT-PLAN.md) | 4-sprint MVP roadmap (~3–4 weeks solo dev) |
| 06 | [Claude Code Guide](./06-CLAUDE-CODE-GUIDE.md) | Conventions, prompting patterns, deployment checklist |
| 07 | [CI/CD Pipeline](./07-CI-CD.md) | GitHub Actions workflows, quality gates, deploy strategy |
| 08 | [i18n](./08-I18N.md) | Internationalization strategy (en + es launch, extensible) |
| 09 | [Skills & MCPs](./09-SKILLS-MCPS.md) | Recommended Claude Code skills and MCP servers |

## 🎯 Quick Summary

**What:** PokerReads — AI-powered note-taking app for live poker players + free utility calculators (pot odds, ICM, push/fold, hand rankings).

**Why:** Existing poker tools target online players; live poker has no great mobile companion. Calculators drive SEO traffic; notes + AI drive conversion to Pro.

**Tech:** Next.js 15 + Cloudflare Pages + Workers + D1 + R2 + KV + Workers AI (Llama 3.1 8B) + Drizzle + Better Auth + Stripe.

**Monetization:** Free tier (local, limited) → Pro $5/mo (cloud sync, photos, sharing) + affiliate links on calculator pages.

**Timeline:** 3–4 weeks to MVP launch.

## 🚀 Getting Started

1. Read docs **01** and **02** for context
2. Read doc **05** for the sprint plan
3. Read doc **06** for working with Claude Code
4. Begin Sprint 0 in a new repository with Claude Code

## 📂 Suggested Repository Structure

```
pokerreads/
├── CLAUDE.md              # Root context — Claude Code reads this every session
├── README.md              # Project readme (public-facing)
├── .claude/
│   └── skills/            # Project-specific custom skills (see doc 09)
│       ├── poker-domain/
│       ├── cloudflare-stack/
│       ├── i18n-guardian/
│       ├── sprint-review/
│       └── ai-prompt-tester/
├── docs/                  # Full specification docs
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-DATABASE.md
│   ├── 04-UX-FLOWS.md
│   ├── 05-SPRINT-PLAN.md
│   ├── 06-CLAUDE-CODE-GUIDE.md
│   ├── 07-CI-CD.md
│   ├── 08-I18N.md
│   └── 09-SKILLS-MCPS.md
├── app/                   # Next.js App Router
├── components/
├── lib/
├── messages/              # i18n translations (en.json, es.json)
└── public/
```
