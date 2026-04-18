# PokerNotes — UX & User Flows

## 1. Design Principles

### Mobile-First, Always
- Every screen designed for one-handed phone use at a poker table
- Minimum tap target: 44x44px
- High contrast, readable in low-light cardrooms
- Dark theme by default (less conspicuous at the table)

### Discretion
- No loud sounds
- No flashing animations
- App can be briefly glanced at and closed fast
- "Stealth mode": tap-to-hide screen quickly

### Speed
- Adding a new player: max 3 taps
- AI note processing: visible progress, async
- Offline-first: works without signal

---

## 2. Information Architecture

```
┌─ PUBLIC ─────────────────────────────┐
│ / (landing)                          │
│ /tools/pot-odds                      │
│ /tools/push-fold                     │
│ /tools/icm                           │
│ /tools/hand-rankings                 │
│ /pricing                             │
│ /login /register                     │
└──────────────────────────────────────┘

┌─ APP (auth required for Pro only) ──┐
│ /notes          (player list)        │
│ /notes/new      (create player)      │
│ /notes/[id]     (player detail)      │
│ /session        (active session)     │
│ /settings                            │
│ /upgrade        (pro checkout)       │
└──────────────────────────────────────┘
```

---

## 3. Core User Flows

### Flow A: First-time user at a cardroom (no account)

1. User lands on `/` from a Google search for "pot odds calculator"
2. Uses the calculator, likes it
3. Sees banner: *"Track the players you're up against — free, no signup"*
4. Taps → lands on `/notes` with empty state
5. Taps **+ Add Player**
6. Enters: nickname `"Blue Cap"`, quick tag: `fish`, `calling-station`
7. Saves → player appears in list
8. Adds a note: *"called my river shove with middle pair"*
9. Taps **✨ Structure with AI**
10. AI returns suggested tags (`calling-station`, `scared-money` confirmed) + structured summary
11. User saves note
12. PWA install prompt appears after 2nd visit

### Flow B: Returning user, active session

1. Opens PokerNotes (PWA, offline-capable)
2. `/notes` shows player list, sorted by "last seen"
3. Taps **Start Session** → names it "Casino Orenes - Tuesday"
4. Adds players as they sit at the table
5. During hands: quick-adds notes (voice-to-text or typing)
6. AI structures notes asynchronously in background
7. At end of session, taps **End Session**
8. Session summary shown: X players tracked, Y notes taken

### Flow C: Free → Pro conversion

1. Free user hits 20-player limit
2. Modal appears: *"Unlock unlimited players + cloud sync + photo notes"*
3. Shows price: **$5/mo** or **$45/year (save 25%)**
4. Stripe Checkout
5. Returns to app with Pro status active
6. Prompted to enable cloud sync → local data uploaded

### Flow D: Share a player (Pro)

1. Pro user on player detail page
2. Taps **Share** menu
3. Enters friend's PokerNotes username or email
4. Selects permission: **Read-only** or **Collaborate** (both can add notes)
5. Friend receives a notification next time they open the app
6. Friend accepts → player appears in their "Shared with me" section

---

## 4. Screen-by-Screen Specs

### 4.1 Landing Page (`/`)

**Purpose:** Convert visitors to users or calculator tool users.

**Sections:**
- Hero: *"Read your opponents. Win more live poker."* + screenshot mockup + CTA
- Feature highlights (3 cards): AI Notes, Calculators, Mobile-first
- Free tools showcase (links to calculators)
- Pricing snippet
- Footer with SEO links

### 4.2 Player List (`/notes`)

**Empty state:**
- Illustration + "No players tracked yet"
- **+ Add Your First Player** CTA

**Populated:**
- Search bar (top)
- Filter pills: `All | By tag | By last seen`
- Player cards (vertically stacked):
  - Photo or avatar (initial letter)
  - Nickname (bold)
  - Top 3 tags
  - "Seen 3x • last Tuesday"
- Floating **+** button (bottom-right)

### 4.3 Player Detail (`/notes/[id]`)

- Header: photo, nickname, edit icon
- Tag chips (editable)
- Tabs: **Notes** | **History** | **Shared** (Pro)
- **Notes tab:**
  - Latest notes at top
  - Each note shows: raw + AI summary + date
  - **+ Add Note** → opens note composer

### 4.4 Note Composer (modal or full screen)

- Large text area (voice-to-text friendly)
- **✨ Structure with AI** button
- Loading state: shimmer on 3 skeleton lines
- AI response:
  - Suggested tags (tappable to add)
  - Structured summary
  - Preflop / postflop tendencies
  - **Edit** or **Save as is**

### 4.5 Active Session (`/session`)

- Session header: name, duration, # of players
- Quick-add player input (always visible)
- Grid/list of players at this table
- Tap player → quick-note sheet slides up
- **End Session** button (sticky bottom)

### 4.6 Calculators

All calculators follow same pattern:
- Page header with brief explanation (SEO paragraph)
- Calculator widget (interactive)
- Results display (prominent)
- Related calculators linked at bottom
- Affiliate banner (subtle): *"Practice at [Partner Room] →"*

#### Pot Odds
- Two inputs: pot size, bet to call
- Live calculation
- Output: "You need X% equity to call profitably"
- Color indicator: green (easy call) / yellow / red (tough)

#### Push/Fold
- Three selectors: stack size (BB), position, # players
- Visual 13x13 hand grid
- Green cells = push, red = fold

#### ICM
- Dynamic rows for stacks (add/remove)
- Payout structure input (presets: 50/30/20, custom)
- Results table: each player's $ equity

### 4.7 Settings (`/settings`)

- Account info
- Subscription status (with manage link → Stripe portal)
- Export data
- Delete account
- Theme toggle (dark default)
- AI usage stats

---

## 5. Visual Design Direction

### Color Palette

```
Primary:    #0f172a (slate-900)   — backgrounds
Surface:    #1e293b (slate-800)   — cards
Accent:     #10b981 (emerald-500) — CTAs, positive indicators
Danger:     #ef4444 (red-500)     — fold, warnings
Warning:    #f59e0b (amber-500)   — caution
Text:       #f1f5f9 (slate-100)   — primary text
Muted:      #64748b (slate-500)   — secondary text
```

### Typography

- **Display:** Geist Sans or similar modern geometric
- **Body:** Inter or system-ui (accessibility)
- **Mono:** Geist Mono (for numbers in calculators)

### Component System

- Use **shadcn/ui** as base
- Customize for dark-first palette
- Rounded corners: `rounded-xl` for cards, `rounded-lg` for buttons

---

## 6. Accessibility

- WCAG AA contrast minimum
- Full keyboard navigation for desktop
- Screen reader labels on icon-only buttons
- Respects `prefers-reduced-motion`
- Font size scales with browser settings
