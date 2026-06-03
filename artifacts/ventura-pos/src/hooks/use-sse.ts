import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetPedidosQueryKey,
  getGetMesasQueryKey,
  getGetProductosQueryKey,
  getGetResumenPedidosQueryKey,
} from "@workspace/api-client-react";

export function useSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    function connect() {
      if (!active) return;
      es = new EventSource("/api/eventos", { withCredentials: true });

      es.addEventListener("pedido_nuevo", () => {
        queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetResumenPedidosQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["display-pedidos"] });
      });

      es.addEventListener("pedido_actualizado", () => {
        queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetResumenPedidosQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["display-pedidos"] });
      });

      es.addEventListener("pedido_eliminado", () => {
        queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetResumenPedidosQueryKey() });
      });

      es.addEventListener("mesas_actualizadas", () => {
        queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });
      });

      es.addEventListener("productos_actualizados", () => {
        queryClient.invalidateQueries({ queryKey: getGetProductosQueryKey() });
      });

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
  }, [queryClient]);
}
