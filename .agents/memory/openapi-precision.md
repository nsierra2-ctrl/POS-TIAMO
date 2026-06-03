---
name: OpenAPI spec precision
description: When editing openapi.yaml types, use targeted edits only to avoid corrupting unrelated fields.
---

**Rule:** When changing field types in `openapi.yaml`, use targeted per-schema/per-parameter edits. Never use global string replacement on the file.

**Why:** A global `sed` that replaced all `type: integer` with `type: string` (or vice versa) corrupted ~50 unrelated numeric fields (id, precio, cantidad, total, etc.), causing widespread TypeScript errors that took extra time to diagnose and fix.

**How to apply:**
- Edit specific schemas only (e.g., `Mesa`, `CrearMesaInput`, `Pedido`, `CrearPedidoInput`)
- Edit specific path parameters only (e.g., `/mesas/{numero}`)
- Leave query params like `limite` and unrelated schemas untouched
