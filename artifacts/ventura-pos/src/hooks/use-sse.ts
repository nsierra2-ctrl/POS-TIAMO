import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetPedidosQueryKey,
  getGetMesasQueryKey,
  getGetProductosQueryKey,
  getGetResumenPedidosQueryKey,
  getGetResumenGeneralQueryKey,
  getGetVentasDiariasQueryKey,
  getGetProductosTopQueryKey,
  getGetVentasPorMeseroQueryKey,
  getGetCajaSesionActivaQueryKey,
  getGetCajaResumenDiaQueryKey,
  getGetCajaSesionesQueryKey,
} from "@workspace/api-client-react";

export function useSSE(onPedidoEvent?: () => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    function invalidateCajaQueries() {
      queryClient.invalidateQueries({ queryKey: getGetCajaSesionActivaQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCajaResumenDiaQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCajaSesionesQueryKey() });
    }

    function invalidatePedidoQueries() {
      queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetResumenPedidosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetResumenGeneralQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetVentasDiariasQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetProductosTopQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetVentasPorMeseroQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["display-pedidos"] });
      invalidateCajaQueries();
      onPedidoEvent?.();
    }

    function invalidateAll() {
      queryClient.invalidateQueries();
      onPedidoEvent?.();
    }

    function connect() {
      if (!active) return;
      es = new EventSource("/api/eventos", { withCredentials: true });

      es.addEventListener("pedido_nuevo", invalidatePedidoQueries);
      es.addEventListener("pedido_actualizado", invalidatePedidoQueries);

      es.addEventListener("pedido_eliminado", () => {
        queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetResumenPedidosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetResumenGeneralQueryKey() });
        invalidateCajaQueries();
        onPedidoEvent?.();
      });

      es.addEventListener("mesas_actualizadas", () => {
        queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetResumenGeneralQueryKey() });
        invalidateCajaQueries();
      });

      es.addEventListener("productos_actualizados", () => {
        queryClient.invalidateQueries({ queryKey: getGetProductosQueryKey() });
      });

      es.addEventListener("reset_datos", invalidateAll);

      es.onerror = () => {
        es?.close();
        if (active) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [queryClient, onPedidoEvent]);
}
