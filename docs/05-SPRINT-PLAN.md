# PokerReads — Sprint Plan & Roadmap

## Estado actual (post Sprint 4)

Los sprints 0–4 están completados. Resumen de lo que está en producción:

| Área | Estado |
|---|---|
| CI/CD completo (lint, typecheck, tests, build, production) | ✅ |
| Calculadoras: Pot Odds, Push/Fold, ICM, Break-Even/MDF | ✅ |
| Landing, Pricing, Privacy, Terms | ✅ |
| PWA (service worker, manifest, install prompt) | ✅ |
| Notas offline: jugadores, notas, sesiones en IndexedDB | ✅ |
| AI structuring (Workers AI + rate limiting por tier) | ✅ |
| Auth: Better Auth con Google OAuth | ✅ |
| Stripe: checkout, portal, webhooks | ✅ |
| Producción en pokerreads.app | ✅ |
| Bilingüe EN/ES en toda la app | ✅ |
| Diseño mobile-first, tema casino terminal en herramientas | ✅ |

---

## Lo que falta para tener el producto completo

### Crítico (bloquea la propuesta de valor Pro)
- ❌ **Cloud sync** — los Pro no sincronizan entre dispositivos (el gap más grande)
- ❌ **Límite de 20 jugadores sin gate real para Pro** — la lógica está, falta leer el tier del usuario logado
- ❌ **Fotos de jugadores** (R2) — feature Pro prometida

### Importante (calidad de producto)
- ❌ Password reset (actualmente solo Google OAuth funciona bien)
- ❌ Borrado de cuenta real (GDPR)
- ❌ Compartir perfil de jugador con otro usuario
- ❌ Export de datos (CSV)

### Launch quality
- ❌ Analytics (Cloudflare Web Analytics)
- ❌ Error tracking básico
- ❌ Lighthouse 95+ en mobile
- ❌ Assets de lanzamiento (ProductHunt, Reddit)

---

## Timeline

| Sprint | Duración | Foco |
|---|---|---|
| Sprint 5 | 7 días | **Cloud Sync** — el backbone de Pro |
| Sprint 6 | 5 días | **Pro Features** — fotos, sharing, export, account |
| Sprint 7 | 3 días | **Launch** — polish, analytics, lanzamiento |

---

## Sprint 5 — Cloud Sync (7 días)

### Objetivo
Un usuario Pro que inicia sesión en el móvil y el ordenador ve los mismos jugadores y notas en ambos dispositivos.

### Arquitectura
- Pro users: **write-through** — cada escritura va a IndexedDB + D1 en paralelo
- Free users: solo IndexedDB (sin cambios)
- On login Pro: **pull** desde D1 → merge con IndexedDB local (last-write-wins)
- La capa de storage (`lib/storage/`) detecta el tier y enruta

### Tareas

#### API Routes
- [ ] `GET/POST /api/players` — listar y crear jugadores (Pro-gated)
- [ ] `GET/PATCH/DELETE /api/players/[id]` — detalle, editar, borrar
- [ ] `GET/POST /api/notes` — listar y crear notas
- [ ] `DELETE /api/notes/[id]`
- [ ] `GET/POST /api/sessions` — listar y crear sesiones
- [ ] `PATCH/DELETE /api/sessions/[id]`
- [ ] `POST /api/sync/import` — bulk import de IndexedDB al hacer upgrade/login Pro
- [ ] Todas las rutas validadas con Zod + autenticadas con Better Auth

#### Storage layer
- [ ] Refactor `lib/storage/local.ts` → extrae interfaz `StorageAdapter`
- [ ] Implementar `lib/storage/cloud.ts` (lee/escribe D1 vía API)
- [ ] Implementar `lib/storage/hybrid.ts` — write-through: local primero, cloud async
- [ ] Hook `useStorage()` — devuelve el adapter correcto según tier
- [ ] On-login sync: si Pro, pull D1 y merge en IndexedDB

#### Tier gating real
- [ ] Leer `tier` del user desde la sesión Better Auth (ya está en D1)
- [ ] Exponer tier en `useSession()` o context global
- [ ] `PlayerList`: desbloquear límite de 20 si tier === 'pro'
- [ ] `NoteComposer`: aumentar límite AI a 200/día para Pro (ya está en la lógica de rate limiting)

#### Tests
- [ ] Tests unitarios para los adapters de storage
- [ ] Tests de integración para las API routes (miniflare)

### Deliverable
Un Pro puede crear una nota en el móvil y verla en el ordenador sin hacer nada especial.

---

## Sprint 6 — Pro Features (5 días)

### Objetivo
Completar todas las features Pro prometidas en el PRD. El tier Pro tiene que valer el precio.

### Tareas

#### Fotos de jugadores (R2)
- [ ] `POST /api/players/[id]/photo` — upload a R2, devuelve URL
- [ ] `DELETE /api/players/[id]/photo`
- [ ] Resize/compress antes de subir (target: ≤200KB)
- [ ] UI: botón de foto en PlayerDetail, preview, borrar
- [ ] Mostrar foto en PlayerList (avatar pequeño)

#### Compartir jugador
- [ ] `POST /api/players/[id]/share` — genera token de share
- [ ] `GET /api/shared/[token]` — vista pública de un jugador (sin notas privadas)
- [ ] UI: botón "Share" en PlayerDetail, modal con enlace
- [ ] Página `/shared/[token]` — vista de solo lectura del perfil

#### Export de datos
- [ ] `GET /api/export` — genera CSV con todos los jugadores y notas del usuario
- [ ] UI: botón "Export CSV" en Settings
- [ ] Formato: una fila por nota, columnas: player_name, tags, note, date, session

#### Account management
- [ ] Password reset flow (email con link temporal)
- [ ] Borrado real de cuenta: elimina usuario de `user`, `users`, `players`, `notes`, `sessions`, `account`, fotos en R2
- [ ] UI: "Delete account" en Settings con confirmación por texto

### Deliverable
Pro ofrece fotos, sharing, export, y la cuenta se puede borrar limpiamente.

---

## Sprint 7 — Launch (3 días)

### Objetivo
Lanzar públicamente con calidad de producción.

### Tareas

#### Performance & Quality
- [ ] Lighthouse audit en mobile: target 95+ en todas las métricas
- [ ] Probar en dispositivos reales (iOS Safari + Android Chrome)
- [ ] Resolver cualquier bug visual o de UX que aparezca en las pruebas

#### Analytics & Monitoring
- [ ] Activar Cloudflare Web Analytics (ya está soportado en el stack)
- [ ] Error logging básico en las API routes (Workers logs)
- [ ] Dashboard de conversión: free → pro (desde Stripe)

#### SEO final
- [ ] Verificar que sitemap.xml se genera correctamente
- [ ] robots.txt correcto
- [ ] Open Graph images reales (actualmente `/og-image.png` no existe)
- [ ] Probar sharing en Twitter/WhatsApp con la OG image

#### Launch prep
- [ ] Email de soporte configurado (`support@pokerreads.app`)
- [ ] Post de ProductHunt redactado y programado
- [ ] Post para r/poker y r/livepoker redactados
- [ ] Tweet de lanzamiento redactado

### Deliverable
**Launch day.** pokerreads.app live, primer usuario Pro de pago real.

---

## Post-Launch Roadmap

### v1.1 — Mes 2 (respuesta a feedback)
- Blog (artículos: "Cómo tomar notas en póker en vivo", explicadores de calculadoras)
- Mejora de prompts de AI según feedback de usuarios
- Mejores gestos móviles (swipe to delete, etc.)
- Apple Sign-In para usuarios de iOS PWA

### v1.2 — Mes 3 (engagement)
- Dashboard de estadísticas por jugador (semana/mes)
- Sistema de notificaciones (cuando alguien comparte un jugador contigo)
- Historial cross-session ("ya jugaste con este tipo 3 veces")

### v2 — Mes 4+ (expansión)
- Import de historial de manos (paste de texto)
- Hand analysis AI (tier de pago separado)
- Sesiones colaborativas (sync en tiempo real con amigos)
- Licencia B2B para casinos/clubs de póker

---

## Risk Register

| Riesgo | Mitigación |
|---|---|
| iOS PWA: limitaciones de notificaciones y background sync | Aceptado como limitación del MVP, app nativa si crece |
| Workers AI latencia/calidad | Prompts de fallback, sin dependencia externa |
| SEO lento en arranque | Google Ads en "poker calculator" como backup |
| Conversión free → pro baja | Ajustar precio, mejorar features Pro |
| Problemas legales con sharing de info de jugadores | ToS claro, sharing opt-in, GDPR compliant |
