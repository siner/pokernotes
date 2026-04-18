# PokerNotes — Technical Architecture

## 1. Technology Decisions

### Frontend: Next.js 15 (App Router)

**Rationale over Astro:**
- PWA support is more mature and better documented with Next.js
- App Router enables hybrid static/dynamic rendering naturally
- Better ecosystem for auth flows (middleware, server actions)
- next-pwa / Serwist integration is battle-tested
- Server Components reduce client bundle for calculator pages (SEO benefit)
- Fran's primary stack — faster development

### Full Stack: Cloudflare-native

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 + OpenNext | App framework |
| Deploy | Cloudflare Pages (via OpenNext) | Edge deployment |
| API/Backend | Cloudflare Workers | API endpoints, AI proxy |
| Database | Cloudflare D1 (SQLite) | User data, notes, players |
| File Storage | Cloudflare R2 | Player photos |
| Cache/Sessions | Cloudflare KV | Session tokens, rate limiting |
| AI | Cloudflare Workers AI (Llama 3.1 8B) | Note structuring |
| Auth | Better Auth | Authentication |
| Payments | Stripe | Pro subscriptions |
| ORM | Drizzle ORM | D1 queries |
| i18n | next-intl | Internationalization (en, es) |

---

## 2. Repository Structure

```
pokernotes/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n route segment (en/es) — see 08-I18N.md
│   │   ├── (marketing)/          # Public pages (landing, about)
│   │   │   ├── page.tsx          # Landing page
│   │   │   └── layout.tsx
│   │   ├── (app)/                # Authenticated app shell
│   │   │   ├── layout.tsx        # App layout with nav
│   │   │   ├── notes/
│   │   │   │   ├── page.tsx      # Player list
│   │   │   │   └── [playerId]/
│   │   │   │       └── page.tsx  # Player detail
│   │   │   ├── session/
│   │   │   │   └── page.tsx      # Active session view
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── tools/                # Free calculators (public, SSG)
│   │   │   ├── pot-odds/
│   │   │   │   └── page.tsx
│   │   │   ├── push-fold/
│   │   │   │   └── page.tsx
│   │   │   ├── icm/
│   │   │   │   └── page.tsx
│   │   │   └── hand-rankings/
│   │   │       └── page.tsx
│   │   └── layout.tsx            # Locale layout
│   ├── api/                      # API Routes (not localized)
│   │   ├── ai/
│   │   │   └── structure-note/
│   │   │       └── route.ts      # AI note structuring endpoint
│   │   ├── players/
│   │   │   └── route.ts          # CRUD players (Pro: cloud sync)
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts      # Better Auth handler
│   │   └── stripe/
│   │       └── webhook/
│   │           └── route.ts
│   ├── sitemap.ts                # Multi-locale sitemap
│   └── layout.tsx                # Root layout
│
├── messages/                     # i18n translations
│   ├── en.json
│   └── es.json
│
├── i18n/                         # i18n configuration
│   ├── routing.ts
│   ├── request.ts
│   └── navigation.ts
│
├── components/
│   ├── notes/
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerForm.tsx
│   │   ├── TagSelector.tsx
│   │   ├── AINoteSuggestion.tsx
│   │   └── NoteHistory.tsx
│   ├── tools/
│   │   ├── PotOddsCalc.tsx
│   │   ├── PushFoldChart.tsx
│   │   ├── ICMCalc.tsx
│   │   └── HandRankings.tsx
│   ├── session/
│   │   ├── SessionHeader.tsx
│   │   └── TableView.tsx
│   ├── LanguageSwitcher.tsx
│   └── ui/                       # Shared UI components (shadcn/ui)
│
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── migrations/           # D1 migrations
│   │   └── index.ts              # DB client
│   ├── auth/
│   │   └── index.ts              # Better Auth config
│   ├── ai/
│   │   └── noteStructurer.ts     # AI prompt + response parser (locale-aware)
│   ├── storage/
│   │   └── local.ts              # IndexedDB wrapper (free tier)
│   ├── calculators/
│   │   ├── potOdds.ts
│   │   ├── icm.ts
│   │   └── pushFold.ts           # Nash tables
│   └── stripe/
│       └── index.ts
│
├── scripts/
│   └── check-translations.mjs    # i18n completeness check (CI)
│
├── workers/
│   └── ai-proxy.ts               # Cloudflare Worker for AI calls
│
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # PWA icons (various sizes)
│
├── middleware.ts                 # next-intl middleware
├── wrangler.toml                 # Cloudflare config
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

---

## 3. Data Flow

### Free Tier (Local)
```
User Input → IndexedDB (browser) → UI
User Note → /api/ai/structure-note → Workers AI → Suggestion → IndexedDB
```

### Pro Tier (Cloud)
```
User Input → /api/players → Cloudflare Worker → D1 → Response
User Photo → /api/players/photo → R2 → CDN URL stored in D1
AI Note → /api/ai/structure-note → Workers AI (rate limited via KV) → D1
```

---

## 4. API Design

### POST /api/ai/structure-note
```typescript
// Request
{
  rawNote: string;        // Free text from user
  existingTags?: string[]; // Already applied tags
}

// Response
{
  suggestedTags: string[];
  structuredSummary: string;
  tendencies: {
    preflop: string;
    postflop: string;
  };
  confidence: number; // 0-1
}
```

### GET/POST /api/players
```typescript
// GET - list players (Pro: from D1, Free: 404 → use local)
// POST - create player
{
  nickname: string;
  description?: string;
  tags: string[];
  notes: Note[];
  sessionId?: string;
}
```

### POST /api/players/[id]/photo
```
multipart/form-data → R2 upload → returns CDN URL
```

---

## 5. Workers AI Integration

### Model: `@cf/meta/llama-3.1-8b-instruct`

```typescript
// workers/ai-proxy.ts
const systemPrompt = `
You are a poker player profiling assistant. 
When given a raw note about a poker player's behavior, you must:
1. Extract and return relevant behavioral tags from the approved list
2. Write a concise 1-2 sentence structured summary
3. Identify preflop and postflop tendencies separately
4. Return ONLY valid JSON, no markdown, no explanation

Approved tags: aggro, passive, nit, maniac, fish, reg, shark, 
calling-station, 3bet-happy, slow-player, bluffer, value-heavy, 
overbet, scared-money, tilt-prone, solid, tricky

JSON format:
{
  "suggestedTags": string[],
  "structuredSummary": string,
  "tendencies": { "preflop": string, "postflop": string },
  "confidence": number
}
`;
```

### Rate Limiting (KV)
- Free (no account): 10 AI calls/day per IP
- Free account: 20 AI calls/day per user ID
- Pro: 200 AI calls/day per user ID
- KV key: `ai_rate:{userId_or_IP}:{YYYY-MM-DD}` → count

---

## 6. Authentication (Better Auth)

### Providers
- Email/Password
- Google OAuth
- (Future: Apple OAuth for iOS PWA users)

### Session Strategy
- JWT stored in HttpOnly cookie
- Session data cached in KV for edge performance
- Pro status stored in D1 `users` table + cached in KV

### Middleware (Next.js)
```typescript
// Protect /app/* routes
// Redirect unauthenticated users to /login
// Check Pro status for Pro-only features
```

---

## 7. PWA Configuration

### next.config.ts (Serwist)
```typescript
// Cache strategies:
// - App shell: CacheFirst (static assets)
// - API calls: NetworkFirst with fallback
// - Calculator pages: StaleWhileRevalidate
// - Player photos: CacheFirst (R2 CDN URLs)
```

### manifest.json
```json
{
  "name": "PokerNotes",
  "short_name": "PokerNotes",
  "description": "Live poker player notes & tools",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0f172a",
  "background_color": "#0f172a",
  "start_url": "/notes",
  "scope": "/"
}
```

---

## 8. Deployment

### Cloudflare Pages (via OpenNext v4)
- Build command: `npx opennextjs-cloudflare build`
- Output: Cloudflare Pages compatible
- Environment variables via Cloudflare dashboard

### wrangler.toml
```toml
name = "pokernotes"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "pokernotes-db"
database_id = "<your-d1-id>"

[[r2_buckets]]
binding = "PLAYER_PHOTOS"
bucket_name = "pokernotes-photos"

[[kv_namespaces]]
binding = "RATE_LIMITS"
id = "<your-kv-id>"

[ai]
binding = "AI"
```

---

## 9. Performance Targets

| Metric | Target |
|---|---|
| LCP (mobile 3G) | < 2.5s |
| Calculator pages (SSG) | < 1s |
| AI note structuring | < 3s |
| PWA offline load | < 1s |
| D1 query (Pro sync) | < 100ms |

---

## 10. Cost Estimation (Cloudflare Free Tier)

| Service | Free Tier | Expected MVP Usage |
|---|---|---|
| Pages | Unlimited requests | ✅ Covered |
| Workers | 100k req/day | ✅ Covered |
| D1 | 5M rows read/day | ✅ Covered |
| R2 | 10GB storage, 1M ops | ✅ Covered |
| KV | 100k reads/day | ✅ Covered |
| Workers AI | $0.011/1k tokens | ~$5–10/month at scale |

**MVP infrastructure cost: ~$0–10/month**
