# REESTRUCTURACIÓN COMPLETA POS TIAMO BURGER — Producción 100%

## Estado: COMPLETADO ✅

## Fase 1: Base de Datos (Fundamental) ✅
- [x] Nuevos estados de mesa: libre, ocupada, lista_cobro, en_pago, finalizada
- [x] Agregar tarjeta a métodos de pago (efectivo, tarjeta, transferencia, mixto)
- [x] Campo numeroFactura en pedidos
- [x] Campo tipoTarjeta en pagos
- [x] Campo referencia en pagos
- [x] Campo banco en pagos
- [x] Campos propinaSugerida, propinaAceptada, propinaRechazada en pedidos
- [x] Push schema a DB

## Fase 2: Backend API ✅
- [x] Actualizar cobrar endpoint con tarjeta + referencia + banco
- [x] Generar número de factura automático (prefijo + NNNNNN)
- [x] Endpoint solicitar cuenta (mesa → lista_cobro)
- [x] Actualizar cierre de mesa con flujo correcto
- [x] Actualizar caja routes con totalTarjeta
- [x] Actualizar reportes con tarjeta
- [x] Actualizar factura HTML con número de factura
- [x] Actualizar broadcast events

## Fase 3: Frontend ✅
- [x] MeseroPage: nuevos estados de mesa, botón "Solicitar Cuenta"
- [x] CobrarModal: 2 pasos, tarjeta, referencia, propina, impresión manual
- [x] CajaPage: tarjeta en métricas, sesiones, cierre
- [x] Dashboard: KPIs con tarjeta, PieChart con tarjeta, 7-day chart con tarjeta
- [x] TypeCheck limpio

## Fase 4: Reportes PDF ✅
- [x] Reporte diario con tarjeta (efectivo + tarjeta + transferencia + propinas)
- [x] Reporte semanal/mensual con tarjeta
- [x] Reporte por mesero con tarjeta
- [x] Factura HTML con número de factura

## Fase 5: Verificación E2E ✅
- [x] Flujo completo: libre → ocupada → lista_cobro → en_pago → cobrado → propina → finalizada → libre
- [x] SSE actualiza todo (broadcast en todas las mutaciones)
- [x] Caja coincide con DB (totalTarjeta agregado)
- [x] Factura tiene número (numeroFactura generado automáticamente)
- [x] TypeCheck limpio (todos los proyectos pasan)

## Pendientes / Scope Futuro
- [ ] DividirCuentaModal: por personas o por productos (feature avanzada)
- [ ] Tabla movimientos_caja (el sistema actual usa caja_sesiones con totalTarjeta)
