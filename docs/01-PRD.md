# PokerNotes — Product Requirements Document (PRD)

## 1. Overview

**Product Name:** PokerNotes  
**Tagline:** Your live poker companion. Read players, win more.  
**Target Platform:** Mobile-first PWA (Progressive Web App), installable on iOS and Android  
**Target Market:** Live poker players (English-speaking, international)  
**Primary Language:** English (source), with Spanish (`es`) at launch. See `08-I18N.md`.

---

## 2. Problem Statement

Live poker players need to track reads and tendencies on opponents during sessions, but:
- Paper notes are slow and visible to others
- Generic note apps lack poker-specific structure
- Existing poker tools are built for online play, not live
- No fast, mobile-optimized tool exists for in-session live player tracking

**PokerNotes** solves this by offering a fast, discreet, AI-powered note-taking tool specifically for live poker, with free utility calculators to drive organic traffic.

---

## 3. Target Users

### Primary: The Regular Live Player
- Plays live poker 2–5x/month at cardrooms or casinos
- Mid-stakes to low-stakes (€1/€2 to €5/€10)
- Wants an edge on opponents they see repeatedly
- Uses their phone at the table discreetly

### Secondary: The Semi-Pro / Study-Oriented Player
- Plays regularly, tracks results
- Willing to pay for tools that give them an edge
- Wants to share reads with friends/study partners

### Tertiary: Recreational Player (free tools only)
- Uses calculators for pot odds, push/fold decisions
- May convert to note-taking user over time

---

## 4. Core Features

### 4.1 Table Notes (Free + Pro)

#### Free Tier
- Add a player profile: nickname, seat number, optional physical description
- Quick-tag system: predefined behavioral tags
  - Aggression: `aggro`, `passive`, `nit`, `maniac`
  - Style: `fish`, `reg`, `shark`, `calling-station`
  - Tendencies: `3bet-happy`, `slow-player`, `bluffer`, `value-heavy`, `overbet`, `scared-money`
- Free text note input → **AI converts to structured note** (Cloudflare Workers AI)
- Notes stored locally (IndexedDB) — no account required
- Search/filter players by tag or name
- Session context: group players by session/table
- Max 20 player profiles in free tier

#### Pro Tier
- Unlimited player profiles
- Cloud sync across devices (Cloudflare D1)
- Player photos (Cloudflare R2) — discreet capture
- Full note history per player with timestamps
- Share a player profile with another PokerNotes user (link or username)
- Export notes (CSV, PDF)
- Cross-session player recognition ("seen this player before")

### 4.2 AI Note Structuring (Cloudflare Workers AI)

**How it works:**
1. User types or dictates a raw note: *"this guy limps everything preflop, never 3bets, called my river shove with third pair, very passive"*
2. AI (Llama 3 via Workers AI) processes the input and returns:
   - Suggested tags from the predefined list
   - A clean 1–2 sentence structured summary
   - A tendencies breakdown (preflop / postflop)
3. User confirms or edits before saving

**AI prompt context:**
- System prompt specialised in poker player profiling
- Output is always structured JSON
- Runs entirely on Cloudflare edge (no external API calls)

### 4.3 Free Utility Calculators

All calculators are:
- Accessible without an account
- Mobile-optimized
- Instant (no server calls for calculations)
- SEO-indexed (Astro static pages)

#### Pot Odds Calculator
- Input: pot size, bet size
- Output: pot odds %, equity needed to call, simple call/fold guidance

#### Push/Fold Nash Chart
- Input: stack size (BB), position, number of players
- Output: recommended push/fold range (visual range grid)
- Based on precomputed Nash equilibrium tables

#### ICM Calculator
- Input: stack sizes (up to 9 players), payout structure
- Output: ICM equity per player in $/%
- Use case: deal negotiations at final tables

#### Hand Strength Reference
- Quick visual reference of hand rankings
- Useful for new players or teaching

### 4.4 PWA (Progressive Web App)

- Installable on iOS (Safari "Add to Home Screen") and Android (Chrome install prompt)
- Works fully offline for free tier (IndexedDB, no network required)
- App manifest with PokerNotes branding
- Service worker for asset caching
- Fast load: target < 2s on mobile 3G

---

## 5. Authentication & Tiers

### Free (No Account)
- All calculators
- Table notes (local only, up to 20 players)
- AI note structuring (limited: 10 AI calls/day by IP)

### Free Account (Email/Password or OAuth)
- Table notes (local + optional manual export)
- AI note structuring (20 AI calls/day)
- Access to future free features

### Pro ($5/month or $45/year)
- Unlimited players + cloud sync
- Player photos
- Share profiles
- Full history + export
- Priority AI processing
- 200 AI calls/day

---

## 6. Non-Goals (Out of Scope for MVP)

- Hand history import/analysis (future)
- Real-time collaborative tables (future)
- Native iOS/Android app (PWA covers this for MVP)
- Integration with online poker rooms
- Video or audio notes

---

## 7. Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Monthly Active Users | 500+ |
| Pro conversions | 30+ paying users |
| Calculator page views | 2,000/month |
| PWA installs | 200+ |
| AI notes generated | 1,000+ |

---

## 8. Monetization Strategy

1. **Pro subscription**: $5/month via Stripe
2. **Affiliate links**: Subtle placements on calculator pages linking to poker rooms (GGPoker, PokerStars, 888poker) — high CPA commissions
3. **Future**: B2B license for cardrooms (share PokerNotes with your poker club members)

---

## 9. Constraints & Assumptions

- All AI inference via Cloudflare Workers AI (no OpenAI dependency)
- Entire backend runs on Cloudflare (Workers, D1, R2, KV, Pages)
- No native app — PWA only for MVP
- MVP timeline: 3–4 weeks solo developer
- Budget: near-zero infrastructure cost (Cloudflare free tier covers MVP traffic)
