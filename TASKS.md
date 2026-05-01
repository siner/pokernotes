# PokerReads — TASKS

Backlog post-launch. Orden = prioridad sugerida (impacto / esfuerzo). Sprint plan formal en `docs/05-SPRINT-PLAN.md`; este fichero es el "qué viene después" más vivo.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

---

## Nuevas herramientas

- [x] **Equity calculator (hand vs hand, con board opcional)** — PR #31. Heads-up + multiway, MC + enumeración por street, evaluador 7-card propio. UI grid 13×13.

---

## Mejoras Pro (ordenadas por impacto · stickiness Pro)

### Alto valor, esfuerzo medio
- [x] **Hand history per player** — PRs #45 (spike IA), #47 (foundation), #48 (UI), #49 (wake-lock + edit), #52 (lista standalone), #53 (share pack). Entrada free-text o voz, IA estructura a campos canónicos + narrativa + tags. Vinculada opcional a `playerId`/`sessionId`. Buscable. Pro-only. Tabla `hands` en D1 + IDB v3 + sync LWW. Detalle editable con re-estructurar. `/hands` standalone con búsqueda token-AND. **Public share link anonimizado** entregado: lifecycle API (`POST/DELETE /api/hands/[id]/share`), endpoint público con rate-limit 60/min/IP (`GET /api/hands/share/[token]`), página `/[locale]/hands/share/[token]` + OG image dinámica, contador de vistas (`shareViewCount` server-authoritative, no entra en sync push), feature en pricing.
- [ ] **Share player user-to-user** — desbloquear `sharedPlayers` (ya en schema). Modelo: `(ownerUserId, recipientUserId, playerId, scope)`. Notificación in-app. Resuelve bloqueo legal del modelo público que dejamos diferido.
- [x] **Cross-session player recognition** — PR #32. Matching por nickname + venue con vista de historial en `PlayerDetail`.
- [ ] **Stats por jugador** — hands jugadas, sesiones, tags más frecuentes, timeline de notas. Roadmap v1.2 actual; subirlo si retención flojea.

### Alto valor, esfuerzo bajo
- [x] **Búsqueda full-text** — PR #38. Client-side sobre IDB (no FTS5 en D1: los Pro ya tienen todo en local via sync, dataset pequeño). Matchea nickname/description/tags/contenido de notas (token-AND, diacritic-insensitive).
- [x] **Voz → nota** — PR #44. Web Speech API client-side (Safari prefix incluido), final segments append live al textarea, interim transcript visible. Reutilizable en NoteComposer + QuickNoteSheet. Locale → BCP-47 (`en-US`/`es-ES`).
- [ ] **Transcripción Pro vía Whisper** — Web Speech API tiene precisión irregular con términos de poker (3bet, UTG, AKs). Para Pro: MediaRecorder en cliente → blob → endpoint `/api/ai/transcribe` con `@cf/openai/whisper-large-v3-turbo` → texto sustituye/append al textarea. Mucho más preciso, coste manejable, requiere recordings cortos (<30s recomendado por chunk).
- [ ] **Export PDF** — el PRD lo lista junto con el CSV ya entregado en Sprint 6. Reusar el data layer del export, añadir generación PDF.
- [ ] **Apple Sign-In** — iOS PWA es el sweet spot del producto. Hoy sólo Google OAuth.

### Retención / pulido
- [x] **Email verification** — PR #39. Better Auth `sendOnSignUp: true` + `autoSignInAfterVerification: true`. Nudge-only: banner en `/settings` con botón Resend (no se gatea sign-in).
- [x] **Welcome email** post-upgrade Pro — PR #39. Trigger en `checkout.session.completed`, idempotency via `processedStripeEvents`. Bonus: extraído `lib/email/templates.ts` (EN/ES) y arreglado el `sendResetPassword` que estaba en inglés.
- [x] **Prompts AI por idioma** — PR #40. Directive en CAPS al inicio Y al final del system prompt, one-shot con input en idioma OPUESTO al output para forzar la regla.
- [x] **Mobile-first UX** — PRs #50–#52. Tier-aware header (logo→/notes logueado, Pricing oculto Pro), `/`→`/notes` redirect, BottomNav móvil (Notes/Sesión/Tools/Settings + active session dot), EmptyState/LoadingState/SkeletonCard compartidos, touch targets ≥44px, modal padding consistente, aria-label cleanup, tab counters en PlayerDetail, footer oculto en móvil logueado, h1 sizes consistentes.
- [ ] **Quick-actions móvil** — swipe to delete/archive en `PlayerList`, long-press para tag rápido.

---

## Deuda técnica conocida (post-launch)

- [ ] Tests de integración para las 8 API routes de sync (sprint 5 los pidió y no se entregaron). Vitest + miniflare; mock de Workers AI ya existe; falta helper de auth mock.
- [ ] Cleanup job de soft-deletes (>30d) en D1 + R2 (cuando llegue volumen real).
- [ ] Race condition en sync (write entre snapshot y `replaceLocalState`) — merge-instead-of-replace o write lock durante sync. Mitigado parcialmente por LWW guards en PR #33.
- [ ] Migrar `STRIPE_SECRET_KEY` (`sk_`) → Restricted API Key (`rk_`). Deploy step pendiente.
- [ ] Bump Stripe SDK 17 → 22 (re-pin `apiVersion` al hacerlo). Skill `upgrade-stripe`.
- [ ] Bump Next 15 → 16 (Cache Components, `use cache`, async APIs). Validar OpenNext + Serwist + next-intl. Skill `next-upgrade`.

---

## Hechos recientes (referencia)

- ✅ Sprints 1–6 + hardening + launch-prep groups A–E (PRs #14–#24).
- ✅ A11y WCAG AA + cache immutable de Next static (PRs #28, #29).
- ✅ Equity calculator + cross-session recognition + sync LWW guards (PRs #31–#33).
- ✅ AI rate limit tier-aware + `ai_usage` log + admin panel + Unosend + unify users (PRs #34–#37).
- ✅ Búsqueda FTS + email verification/welcome + AI prompts por locale (PRs #38–#40).
- ✅ Umami analytics junto a Cloudflare Web Analytics (PR pendiente).
- ✅ Voz → nota (Web Speech API + dictado en composers) — PR #44.
- ✅ Hand history per player (spike IA + DB + UI + edición + lista standalone) — PRs #45, #47, #48, #49, #52.
- ✅ Mobile-first UX rework (tier-aware nav, BottomNav, empty/loading/skeleton, polish) — PRs #50, #51, #52.
