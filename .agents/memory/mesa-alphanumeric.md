---
name: Mesa alphanumeric identifiers
description: Mesa/pedido identifiers are string (text) everywhere, allowing names like "Terraza A", "Bar 3", "T1".
---

**Rule:** Mesa `numero` and pedido `mesa` are `string` (text) types.

**Why:** The user requested alphanumeric table names instead of numeric-only. This affects the database schema, all API endpoints, the OpenAPI spec, generated API clients, and every frontend page that handles mesas.

**How to apply:**
- DB: `lib/db/src/schema/mesas.ts` — `numero: text("numero").primaryKey()`
- DB: `lib/db/src/schema/pedidos.ts` — `mesa: text("mesa")`
- API spec: `lib/api-spec/openapi.yaml` — change `numero` and `mesa` fields to `type: string`
- Regenerate clients: `cd lib/api-spec && npx orval --config orval.config.ts`
- Rebuild dist declarations: `cd lib/api-client-react && npx tsc --build --force`
- Backend routes: Remove `parseInt()` for mesa parameters
- Frontend: Use `string` types for all mesa/pedido identifiers
