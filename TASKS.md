# PokerReads — TASKS

Backlog post-launch. Orden = prioridad sugerida (impacto / esfuerzo). Sprint plan formal en `docs/05-SPRINT-PLAN.md`; este fichero es el "qué viene después" más vivo.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

---

## Nuevas herramientas

- [ ] **Equity calculator (hand vs hand, con board opcional)**
  - Caso de uso: "tengo AK, rival AJ, ¿qué % tenemos en preflop / flop / turn / river?"
  - Inputs: 2 manos (cada una 2 cartas) + board opcional (0/3/4/5 cartas). Validar cartas únicas.
  - Outputs: % win / tie / lose por mano, + breakdown por street si se va completando el board.
  - Algoritmo:
    - Preflop (sin board): Monte Carlo ~10k iteraciones. Suficiente precisión (<0.5%).
    - Flop (3 cartas): enumeración exhaustiva de turn+river → C(45,2) = 990.
    - Turn (4 cartas): 44 rivers, trivial.
    - River: showdown determinista.
  - Evaluador 7-card Hold'em: evaluar entre librería externa (`pokersolver` ~pocos KB) vs propio (lookup-table tipo Cactus Kev / 2+2). Decisión al implementar.
  - UI: selector visual de cartas tipo grid 13×13 con suit pickers, mobile-first. Reutilizar paleta `casino terminal` de las otras tools.
  - Añadir a `ToolsNav.tsx` como 5ª tool. Slug: `/tools/equity` o `/tools/odds`.
  - Tests unitarios sobre hands conocidas (AA vs KK ≈ 81/19 preflop, etc.).
  - i18n EN+ES, metadata propia, entrada en sitemap.

---

## Mejoras Pro (ordenadas por impacto · stickiness Pro)

### Alto valor, esfuerzo medio
- [ ] **Share player user-to-user** — desbloquear `sharedPlayers` (ya en schema). Modelo: `(ownerUserId, recipientUserId, playerId, scope)`. Notificación in-app. Resuelve bloqueo legal del modelo público que dejamos diferido.
- [ ] **Cross-session player recognition** — "ya jugaste con este tipo 3 veces". Matching por nickname + venue, vista historial en `PlayerDetail`. PRD lo lista como Pro.
- [ ] **Stats por jugador** — hands jugadas, sesiones, tags más frecuentes, timeline de notas. Roadmap v1.2 actual; subirlo si retención flojea.

### Alto valor, esfuerzo bajo
- [ ] **Búsqueda full-text** en notas y descripciones. FTS5 sobre `notes` en D1; en local fallback a filtro JS sobre IDB. Hoy sólo filtramos por tag/nombre.
- [ ] **Voz → nota** (Web Speech API en cliente, transcripción local; texto pasa por el AI structuring existente). Diferenciador real para tomar notas en vivo sin teclear.
- [ ] **Export PDF** — el PRD lo lista junto con el CSV ya entregado en Sprint 6. Reusar el data layer del export, añadir generación PDF.
- [ ] **Apple Sign-In** — iOS PWA es el sweet spot del producto. Hoy sólo Google OAuth.

### Retención / pulido
- [ ] **Email verification** (deuda Sprint 6) — `emailVerification.sendVerificationEmail` de Better Auth. Resend ya está integrado.
- [ ] **Welcome email** post-upgrade Pro con tips de uso.
- [ ] **Prompts AI por idioma** (ES vs EN) — hoy llama-3.1-8b a veces mezcla idiomas.
- [ ] **Quick-actions móvil** — swipe to delete/archive en `PlayerList`, long-press para tag rápido.

---

## Deuda técnica conocida (post-launch)

- [ ] Tests de integración para las 8 API routes de sync (sprint 5 los pidió y no se entregaron). Vitest + miniflare; mock de Workers AI ya existe; falta helper de auth mock.
- [ ] Cleanup job de soft-deletes (>30d) en D1 + R2 (cuando llegue volumen real).
- [ ] Race condition en sync (write entre snapshot y `replaceLocalState`) — merge-instead-of-replace o write lock durante sync.
- [ ] Migrar `STRIPE_SECRET_KEY` (`sk_`) → Restricted API Key (`rk_`). Deploy step pendiente.
- [ ] Bump Stripe SDK 17 → 22 (re-pin `apiVersion` al hacerlo). Skill `upgrade-stripe`.
- [ ] Bump Next 15 → 16 (Cache Components, `use cache`, async APIs). Validar OpenNext + Serwist + next-intl. Skill `next-upgrade`.

---

## Hechos recientes (referencia)

- ✅ Sprints 1–6 + hardening + launch-prep groups A–E (PRs #14–#24).
- ✅ A11y WCAG AA + cache immutable de Next static (PRs #28, #29).
