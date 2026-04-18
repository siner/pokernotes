# PokerNotes — Skills & MCPs Recommendations

Curated list of Claude Code skills and MCP servers that will accelerate development of PokerNotes. Filtered to what actually helps for this specific stack — no hype inclusions.

> **Reality check first:** Skills and MCPs are powerful but not magic. Most publicly available skills don't just fail to help. They actively hurt — adding tokens, adding latency, injecting constraints that make the output narrower. Install intentionally. Benchmark. Remove what doesn't earn its keep.

---

## 1. Philosophy

### Skills vs CLAUDE.md
- **CLAUDE.md** is for facts and conventions that apply to every session
- **Skills** are for procedures and playbooks that apply *sometimes*
- Skills only load when triggered, so reference-heavy content is cheap
- Skills are prompt injections — probabilistic, not deterministic trigger

### MCPs
- **MCPs give Claude Code real tools** (DB access, deploy controls, docs search)
- Each active MCP adds tokens to context — enable per project, not globally
- Prefer official MCPs over community ones (security + stability)

---

## 2. Recommended Skills

### ⭐ Must-have for PokerNotes

#### `frontend-design` (Anthropic, official)
Forces Claude to commit to a bold aesthetic direction before writing UI code. Avoids the generic "AI slop" look that makes products feel forgettable.

**Why for PokerNotes:** The app needs to feel distinctive in a crowded poker tools market. Mobile-first, dark, discreet — this skill helps execute that with intention instead of defaulting to generic Tailwind cards.

**When it triggers:** Any UI component, landing page, or design task.

**Install:** Bundled with Claude Code / Claude.ai.

---

#### `test-driven-development` (community, widely used)
Triggers before implementing any feature or bugfix — enforces test-first workflow.

**Why for PokerNotes:** Calculators (ICM, pot odds, push/fold Nash) are pure logic and perfect TDD candidates. AI output parsers need robust tests because Workers AI responses are non-deterministic.

**When it triggers:** "implement X", "fix bug in Y", "add feature Z".

---

#### `web-design-guidelines` (Vercel Labs)
Encodes Vercel Engineering's UI/UX standards. Catches accessibility issues, WCAG compliance problems, and form anti-patterns.

**Why for PokerNotes:** Mobile-first PWA needs to be accessible. The app will be used at cardrooms in low-light conditions — contrast and readability matter.

**When it triggers:** UI review requests, component audits.

---

### 🎯 Strongly recommended

#### `subagent-driven-development`
Dispatches subagents for parallel tasks with review checkpoints between iterations.

**Why for PokerNotes:** Building 4 calculators in Sprint 1 — perfect fit for parallel subagents (one per calculator) with checkpoint reviews.

---

#### `/simplify` (bundled, Claude Code built-in)
After making changes to a codebase, /simplify reviews your recently changed files for code reuse opportunities, quality issues, and efficiency improvements — and then fixes them automatically. What makes it effective is that it spawns three parallel review agents, each looking at the changes from a different angle.

**Why for PokerNotes:** Run after every sprint finishes to catch duplicated logic, unused imports, and refactoring opportunities before merging to `main`.

**Usage:** `/simplify` after completing a feature.

---

#### `/review` (bundled)
Built-in code review before PRs.

**Why for PokerNotes:** Solo developer — no human reviewer. Use `/review` as a sanity check before opening every PR to `dev`.

---

### 📋 Consider for specific tasks

#### `using-git-worktrees`
Creates isolated git worktrees with smart directory selection.

**Why for PokerNotes:** If running parallel Claude Code sessions (e.g., one on auth, another on calculators), worktrees prevent branch conflicts.

---

#### `Changelog Generator`
Transforms technical commits into customer-friendly release notes.

**Why for PokerNotes:** Publishing updates on the landing page helps SEO and shows momentum. Run this before each production deploy.

---

#### `MCP Builder`
Guides creation of custom MCP servers.

**Why for PokerNotes:** Post-MVP, you may want a custom MCP for your PokerManager ecosystem to integrate with PokerNotes.

---

### ❌ Skills I'd skip (for this project)

- **Remotion skills**: not building videos
- **AWS skills**: we're all-in on Cloudflare
- **Supabase skills**: not using Supabase
- **Marketing skills**: scope creep, keep for post-MVP
- **Generic "best practices" skills**: CLAUDE.md already covers these

---

## 3. Recommended MCPs

### ⭐ Essential

#### Cloudflare Developer Platform MCP
Official Cloudflare MCP. Gives Claude Code direct access to D1, R2, KV, Workers, and Pages without leaving the terminal.

**Why for PokerNotes:** Every piece of infra lives on Cloudflare. This MCP lets Claude:
- Query D1 databases directly during debugging
- List/create KV namespaces, R2 buckets
- Deploy Workers
- Read Cloudflare docs via built-in search

**Install:** Already available via Claude's MCP registry.

**URL:** `https://bindings.mcp.cloudflare.com/sse`

---

#### Context7
Up-to-date documentation and code examples for any package.

**Why for PokerNotes:** Next.js 15, `next-intl`, `drizzle-orm`, `better-auth`, `@opennextjs/cloudflare` — all evolve fast. Claude's training data lags; Context7 fetches current docs.

**Install:** MCP registry.

**URL:** `https://mcp.context7.com/mcp`

---

### 🎯 Strongly recommended

#### GitHub MCP
Read/write access to issues, PRs, Actions runs, and code review.

**Why for PokerNotes:**
- Claude can check CI status before merging
- Open issues for bugs found during development
- Review previous PRs for context on decisions
- Read GitHub Actions logs when debugging pipeline failures

**Install:** GitHub's official MCP server.

---

#### Stripe MCP (official)
Directly interact with Stripe API: create products, view subscriptions, debug webhook events.

**Why for PokerNotes:** Sprint 3 adds Stripe. Rather than juggle the Stripe dashboard and code, let Claude manage products and test webhook flows directly.

**URL:** `https://mcp.stripe.com`

---

### 📋 Situational

#### Notion MCP
If you use Notion for planning, this exposes your workspace to Claude.

**Why for PokerNotes:** If you keep sprint retros, user interviews, or affiliate program notes in Notion, this bridges the context. Optional.

---

#### Slack MCP
Read/post to Slack channels.

**Why for PokerNotes:** If you set up CI/deploy notifications in a Slack workspace, Claude can summarize recent alerts. Skip if not using Slack for this project.

---

### ❌ MCPs I'd skip

- **Google Drive / Docs / Calendar**: not relevant to this project
- **Gmail**: not relevant to this project
- **Linear / Jira**: if using GitHub Issues only, skip these
- **Database MCPs for other engines** (Supabase, Neon, Postgres): using D1 exclusively

---

## 4. Custom Skills to Build for PokerNotes

These are project-specific procedures worth capturing as skills. Create them in `.claude/skills/` in your repo so they travel with the project.

### 4.1 `.claude/skills/poker-domain/SKILL.md`

```markdown
---
name: poker-domain
description: Load poker domain knowledge before working on poker-related features. Use when writing calculators, AI prompts, tag taxonomies, or player-facing copy.
---

# Poker Domain Context

Before writing code or copy related to poker, load this context.

## Core Concepts
- **Pot odds**: ratio of bet size to total pot; determines call profitability
- **ICM**: Independent Chip Model, calculates tournament equity
- **Push/Fold**: Nash-equilibrium endgame strategy for short stacks (<15BB)
- **BB**: big blind, standard unit for stack sizing
- **Equity**: expected share of pot given current hand

## Tag Taxonomy (always English, even in Spanish UI)
- Aggression: aggro, passive, nit, maniac
- Style: fish, reg, shark, calling-station
- Tendencies: 3bet-happy, slow-player, bluffer, value-heavy, overbet, scared-money, tilt-prone, solid, tricky

## Language Conventions
- Keep poker jargon in English in both locales (fish, nit, 3bet, etc.)
- Translate UI chrome (buttons, labels) naturally
- Natural Spanish: "Lee a tus rivales" not "Lee a tus oponentes"

## Common Mistakes to Avoid
- Don't invent poker terms that don't exist
- Don't assume online poker conventions apply to live (e.g., no hand histories in live)
- Push/fold ranges must come from Nash tables, not estimated

## Reference
See `docs/01-PRD.md` and `docs/08-I18N.md` for full context.
```

---

### 4.2 `.claude/skills/cloudflare-stack/SKILL.md`

```markdown
---
name: cloudflare-stack
description: Use when implementing anything that touches Cloudflare services (D1, R2, KV, Workers AI, Pages). Loads stack-specific gotchas and patterns.
---

# Cloudflare Stack Patterns

## Before writing Cloudflare-dependent code
1. Check `wrangler.toml` for existing bindings
2. Verify `nodejs_compat` flag if using Node APIs
3. Remember: bindings are accessed via `env.BINDING_NAME`, not imports

## D1 Gotchas
- No foreign key enforcement by default (use Drizzle app-level checks)
- Limited transaction support (prefer batch)
- Max 1MB per row (files go to R2)
- Migrations are forward-only by convention

## Workers AI (Llama 3.1 8B)
- Model: `@cf/meta/llama-3.1-8b-instruct`
- Responses often have slight JSON issues — always validate with Zod + retry
- Pass user locale into system prompt
- Keep prompts explicit with examples (8B is weaker than 70B)
- Rate limit via KV with key pattern: `ai_rate:{userId_or_IP}:{YYYY-MM-DD}`

## R2
- Upload images resized client-side before POST (reduce egress costs)
- Return CDN URL from server; don't expose R2 directly

## OpenNext + Pages
- Use Web APIs, not Node APIs (`crypto.randomUUID()` yes, `fs` no)
- Build command: `pnpm build:cf` (not `next build`)
- Preview locally: `pnpm preview:cf`

## Debugging
- Use Cloudflare MCP to query D1 directly
- Check Worker logs in Cloudflare dashboard → Observability
- KV writes are eventually consistent (~60s globally)
```

---

### 4.3 `.claude/skills/i18n-guardian/SKILL.md`

```markdown
---
name: i18n-guardian
description: Use before creating any new UI component or page. Enforces the i18n rules — no hardcoded strings, always add keys to both en.json and es.json.
---

# i18n Guardian

## Rules
1. NEVER hardcode user-facing strings in components
2. Every new string requires entries in BOTH `messages/en.json` AND `messages/es.json`
3. Use namespaces that match feature/page structure
4. Poker jargon stays English even in Spanish translations

## Workflow for new strings
1. Identify the namespace (e.g., `notes.empty`, `tools.potOdds`)
2. Add key to `messages/en.json`
3. Add translated key to `messages/es.json`
4. Use in component: `const t = useTranslations('namespace'); t('key')`
5. For Server Components: `const t = await getTranslations('namespace')`

## Common patterns
- Counts: `{count, plural, =0 {No players} one {# player} other {# players}}`
- Dates: `{date, date, medium}`
- Numbers: ICU auto-formats based on locale

## Translation style for Spanish
- Natural, casual Spanish (not formal "usted")
- Use "tú" form
- Keep poker terms: fish, nit, 3bet, overbet, calling station
- Translate UI chrome: buttons, labels, nav

## Reference
See `docs/08-I18N.md` for full spec.
```

---

### 4.4 `.claude/skills/sprint-review/SKILL.md`

```markdown
---
name: sprint-review
description: Use at the end of each sprint before merging dev to main. Runs a comprehensive review against the sprint plan.
---

# Sprint Review

Run this before opening the PR from `dev` to `main`.

## Checklist

### Feature completeness
- [ ] All tasks in the current sprint marked complete in `docs/05-SPRINT-PLAN.md`
- [ ] Deliverable for the sprint achieved (see sprint doc)

### Code quality
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test:unit` passes with no skipped tests (or all skips have TODOs)
- [ ] `pnpm test:integration` passes
- [ ] `pnpm i18n:check` passes
- [ ] No `console.log` in committed code
- [ ] No `any` in TypeScript
- [ ] No hardcoded strings in UI

### i18n
- [ ] Every new string has en + es entries
- [ ] Spanish translations reviewed for natural phrasing
- [ ] Poker jargon kept in English

### Architecture
- [ ] No deviations from `docs/02-ARCHITECTURE.md` (or docs updated)
- [ ] All new routes under `app/[locale]/`
- [ ] Server Components where possible
- [ ] Zod validation on external inputs

### Mobile
- [ ] Tested at 375px viewport
- [ ] Tap targets ≥ 44×44px
- [ ] Dark theme readable in low light

### Performance
- [ ] Lighthouse score > 90 on affected pages
- [ ] No client bundle bloat (check with `next build` output)

### Ready to merge
- [ ] PR title follows conventional commits
- [ ] Preview deploy verified manually
- [ ] Docs updated if architecture changed

## Output
Report which items passed/failed. For failures, propose fixes before merging.
```

---

### 4.5 `.claude/skills/ai-prompt-tester/SKILL.md`

```markdown
---
name: ai-prompt-tester
description: Use when modifying the Workers AI system prompt for note structuring. Tests the prompt against a battery of real poker note inputs.
---

# AI Prompt Tester

When changing `lib/ai/noteStructurer.ts`, validate against test cases.

## Test cases (run each against the new prompt)

### Case 1: Simple tendency note
Input: "this guy calls everything with any two cards, never folds preflop"
Expected: tags include `calling-station`, `fish`

### Case 2: Ambiguous note
Input: "played weird on the turn, weird bet sizing"
Expected: low confidence score, minimal tags, summary notes ambiguity

### Case 3: Multiple tendencies
Input: "limps preflop always, but if raised he 3bets light, very sticky postflop"
Expected: tags include `3bet-happy`, `calling-station` or `sticky`

### Case 4: Spanish input (when locale=es)
Input: "este tío sube cada mano preflop, es un maníaco"
Expected: Spanish summary, tags in English (as IDs)

### Case 5: Long rambling note
Input: "so I played this hand with him earlier, he had AK offsuit and raised, then on the flop he had second pair and he bet big, then on the turn he bet even bigger, I think he's just aggressive but idk"
Expected: tags include `aggro`, `overbet`; summary is condensed

### Case 6: Noise/non-poker
Input: "the lights in the room are too bright"
Expected: low confidence, explicit "unable to extract player tendencies"

## Validation
- Every response must parse as valid JSON
- Tags must be from approved list
- Summary in requested locale
- Confidence score between 0 and 1

## Report
For each case: pass/fail + any issues with the response structure.
```

---

## 5. Installation & Setup

### Skills in repo (project-specific)

```bash
# From project root
mkdir -p .claude/skills/poker-domain
mkdir -p .claude/skills/cloudflare-stack
mkdir -p .claude/skills/i18n-guardian
mkdir -p .claude/skills/sprint-review
mkdir -p .claude/skills/ai-prompt-tester

# Then add SKILL.md to each using the templates above
```

Commit `.claude/skills/` to git — they travel with the repo.

### Skills global (user-level)

Use Claude Code's built-in installer:

```bash
# List available skills
claude skills list

# Install official/community skills
claude skills install frontend-design
claude skills install test-driven-development
```

### MCPs

Configure in Claude Code settings or via `.claude/config.json`:

```json
{
  "mcps": {
    "cloudflare": {
      "url": "https://bindings.mcp.cloudflare.com/sse"
    },
    "context7": {
      "url": "https://mcp.context7.com/mcp"
    },
    "stripe": {
      "url": "https://mcp.stripe.com"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

---

## 6. Recommended Startup Routine

Suggested first commands when starting a Claude Code session on PokerNotes:

```
1. Read CLAUDE.md (auto-loaded)
2. Check sprint status: read docs/05-SPRINT-PLAN.md, which sprint and what's next
3. If working on UI: /frontend-design
4. If writing calculators or AI parsers: /test-driven-development
5. If touching Cloudflare infra: custom skill cloudflare-stack triggers automatically
6. Before committing: /review
7. Before merging dev to main: /sprint-review
```

---

## 7. Skills/MCPs to Reconsider After MVP

Revisit post-launch:

- **agent-browser**: if you need to test the PWA across devices, browser automation could help
- **Playwright Browser Automation skill**: if E2E complexity grows
- **Skill Seekers**: to auto-generate skills from new library docs
- **Supermemory MCP**: if the app grows context per user significantly
- **Composio**: if integrating many SaaS tools (email, analytics, support)

---

## 8. Anti-Patterns

- ❌ **Installing every trendy skill** — adds noise, slows down triggering
- ❌ **Ignoring skill trigger reliability** — skills sit in a list that Claude sees in its system prompt. When you type a request, the model decides whether to consult a skill based on pattern-matching your words against the skill's description. It's probabilistic, not deterministic. There is no guarantee your skill fires. Invoke explicitly with `/skill-name` when critical.
- ❌ **Putting MCPs in global config that aren't needed per project** — tokens cost money and context
- ❌ **Building custom skills for one-off tasks** — use for recurring procedures only
- ❌ **Skipping benchmarking** — always verify a new skill actually improves output quality

---

## 9. Summary: The Minimum Viable Setup

For getting started on PokerNotes immediately, install these and skip the rest:

### Skills (6)
1. `frontend-design` (official)
2. `test-driven-development` (community)
3. `/simplify` (bundled, use per-sprint)
4. `/review` (bundled, use pre-PR)
5. Custom: `poker-domain` (in repo)
6. Custom: `i18n-guardian` (in repo)

### MCPs (3)
1. **Cloudflare Developer Platform** (all infra)
2. **Context7** (fresh docs)
3. **GitHub** (CI, issues, PRs)

Add more only when a specific pain point justifies it.
