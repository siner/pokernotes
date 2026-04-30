# PokerReads — TASKS

Backlog post-launch. Orden = prioridad sugerida (impacto / esfuerzo). Sprint plan formal en `docs/05-SPRINT-PLAN.md`; este fichero es el "qué viene después" más vivo.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

---

## Nuevas herramientas

- [x] **Equity calculator (hand vs hand, con board opcional)** — PR #31. Heads-up + multiway, MC + enumeración por street, evaluador 7-card propio. UI grid 13×13.

---

## Mejoras Pro (ordenadas por impacto · stickiness Pro)

### Alto valor, esfuerzo medio
- [~] **Hand history per player** — guardar manos concretas jugadas contra cada jugador. Entrada free-text o voz (reutiliza `useSpeechToText`); IA estructura a campos canónicos (posición, hero hand, board, acción por street, resultado/pot) + narrativa libre + tags. Vinculada a `playerId` + opcional `sessionId`. Buscable, filtrable por board/posición/tags, compartible. Pro-only.
  - [x] Spike IA (rama `spike/hand-history-ai-v2`): endpoint `POST /api/ai/structure-hand`, schema zod loose, prompt v2 con anti-invención + alias normalizers para posiciones/stakes. Validado con 7 casos EN/ES — green-light.
  - [ ] DB schema (`hands` table en D1) + IDB local + sync.
  - [ ] CRUD endpoints (`/api/hands`).
  - [ ] UI: form de entrada (voz+texto+IA), lista y detalle, edición, vinculación opcional player/session.
  - [ ] Pro gate UI + entrada en pricing/features.
  - [ ] Public share link anonimizado (post-MVP).
- [ ] **Share player user-to-user** — desbloquear `sharedPlayers` (ya en schema). Modelo: `(ownerUserId, recipientUserId, playerId, scope)`. Notificación in-app. Resuelve bloqueo legal del modelo público que dejamos diferido.
- [x] **Cross-session player recognition** — PR #32. Matching por nickname + venue con vista de historial en `PlayerDetail`.
- [ ] **Stats por jugador** — hands jugadas, sesiones, tags más frecuentes, timeline de notas. Roadmap v1.2 actual; subirlo si retención flojea.

### Alto valor, esfuerzo bajo
- [x] **Búsqueda full-text** — PR #38. Client-side sobre IDB (no FTS5 en D1: los Pro ya tienen todo en local via sync, dataset pequeño). Matchea nickname/description/tags/contenido de notas (token-AND, diacritic-insensitive).
- [x] **Voz → nota** — PR #44. Web Speech API client-side (Safari prefix incluido), final segments append live al textarea, interim transcript visible. Reutilizable en NoteComposer + QuickNoteSheet. Locale → BCP-47 (`en-US`/`es-ES`).
- [ ] **Export PDF** — el PRD lo lista junto con el CSV ya entregado en Sprint 6. Reusar el data layer del export, añadir generación PDF.
- [ ] **Apple Sign-In** — iOS PWA es el sweet spot del producto. Hoy sólo Google OAuth.

### Retención / pulido
- [x] **Email verification** — PR #39. Better Auth `sendOnSignUp: true` + `autoSignInAfterVerification: true`. Nudge-only: banner en `/settings` con botón Resend (no se gatea sign-in).
- [x] **Welcome email** post-upgrade Pro — PR #39. Trigger en `checkout.session.completed`, idempotency via `processedStripeEvents`. Bonus: extraído `lib/email/templates.ts` (EN/ES) y arreglado el `sendResetPassword` que estaba en inglés.
- [x] **Prompts AI por idioma** — PR #40. Directive en CAPS al inicio Y al final del system prompt, one-shot con input en idioma OPUESTO al output para forzar la regla.
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
