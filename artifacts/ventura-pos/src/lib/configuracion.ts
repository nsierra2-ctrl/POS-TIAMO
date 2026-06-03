import { customFetch } from "@workspace/api-client-react";

export interface Configuracion {
  id: number;
  nombreNegocio: string;
  slogan: string | null;
  logoUrl: string | null;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  instagram: string | null;
  ciudad: string | null;
  moneda: string;
  prefijoFactura: string | null;
  mensajeFactura: string | null;
  configurado: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export async function getConfiguracion(): Promise<Configuracion> {
  return customFetch<Configuracion>("/api/configuracion");
}

export async function updateConfiguracion(data: Partial<Configuracion>): Promise<Configuracion> {
  return customFetch<Configuracion>("/api/configuracion", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
