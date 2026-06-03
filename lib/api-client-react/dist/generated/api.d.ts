import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AbrirCajaInput, ActualizarMesaInput, ActualizarPedidoInput, ActualizarProductoInput, ActualizarUsuarioInput, CajaSesion, CerrarCajaInput, CobrarPedidoInput, CrearMesaInput, CrearPedidoInput, CrearProductoInput, CrearUsuarioInput, EliminarMesa200, EliminarPedido200, EliminarProducto200, EliminarPromocion200, EliminarUsuario200, ErrorResponse, GetPedidosParams, GetProductosParams, HealthStatus, ImpresionLog, ImpresionResultado, ImpresoraConfig, ImprimirInput, LimpiarImpresoraLogs200, LoginInput, Logout200, Mesa, MesasStats, Pedido, Producto, ProductoTop, Promocion, PromocionInput, ResetResult, ResultadoCobro, ResumenCierre, ResumenDiaCaja, ResumenGeneral, ResumenPedidos, SetImpresoraConfig200, SubirImagenBody, UploadResult, UsuarioPublico, VentaDiaria, VentaMesero } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Iniciar sesión
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginInput: LoginInput, options?: RequestInit) => Promise<UsuarioPublico>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Iniciar sesión
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
/**
 * @summary Cerrar sesión
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<Logout200>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Cerrar sesión
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary Obtener usuario autenticado
 */
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<UsuarioPublico>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Obtener usuario autenticado
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Listar usuarios (solo admin)
 */
export declare const getGetUsuariosUrl: () => string;
export declare const getUsuarios: (options?: RequestInit) => Promise<UsuarioPublico[]>;
export declare const getGetUsuariosQueryKey: () => readonly ["/api/usuarios"];
export declare const getGetUsuariosQueryOptions: <TData = Awaited<ReturnType<typeof getUsuarios>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUsuarios>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUsuarios>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUsuariosQueryResult = NonNullable<Awaited<ReturnType<typeof getUsuarios>>>;
export type GetUsuariosQueryError = ErrorType<unknown>;
/**
 * @summary Listar usuarios (solo admin)
 */
export declare function useGetUsuarios<TData = Awaited<ReturnType<typeof getUsuarios>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUsuarios>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Crear nuevo usuario (solo admin)
 */
export declare const getCrearUsuarioUrl: () => string;
export declare const crearUsuario: (crearUsuarioInput: CrearUsuarioInput, options?: RequestInit) => Promise<UsuarioPublico>;
export declare const getCrearUsuarioMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearUsuario>>, TError, {
        data: BodyType<CrearUsuarioInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof crearUsuario>>, TError, {
    data: BodyType<CrearUsuarioInput>;
}, TContext>;
export type CrearUsuarioMutationResult = NonNullable<Awaited<ReturnType<typeof crearUsuario>>>;
export type CrearUsuarioMutationBody = BodyType<CrearUsuarioInput>;
export type CrearUsuarioMutationError = ErrorType<unknown>;
/**
 * @summary Crear nuevo usuario (solo admin)
 */
export declare const useCrearUsuario: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearUsuario>>, TError, {
        data: BodyType<CrearUsuarioInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof crearUsuario>>, TError, {
    data: BodyType<CrearUsuarioInput>;
}, TContext>;
/**
 * @summary Actualizar usuario (solo admin)
 */
export declare const getActualizarUsuarioUrl: (id: number) => string;
export declare const actualizarUsuario: (id: number, actualizarUsuarioInput: ActualizarUsuarioInput, options?: RequestInit) => Promise<UsuarioPublico>;
export declare const getActualizarUsuarioMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarUsuario>>, TError, {
        id: number;
        data: BodyType<ActualizarUsuarioInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof actualizarUsuario>>, TError, {
    id: number;
    data: BodyType<ActualizarUsuarioInput>;
}, TContext>;
export type ActualizarUsuarioMutationResult = NonNullable<Awaited<ReturnType<typeof actualizarUsuario>>>;
export type ActualizarUsuarioMutationBody = BodyType<ActualizarUsuarioInput>;
export type ActualizarUsuarioMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Actualizar usuario (solo admin)
 */
export declare const useActualizarUsuario: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarUsuario>>, TError, {
        id: number;
        data: BodyType<ActualizarUsuarioInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof actualizarUsuario>>, TError, {
    id: number;
    data: BodyType<ActualizarUsuarioInput>;
}, TContext>;
/**
 * @summary Eliminar usuario (solo admin)
 */
export declare const getEliminarUsuarioUrl: (id: number) => string;
export declare const eliminarUsuario: (id: number, options?: RequestInit) => Promise<EliminarUsuario200>;
export declare const getEliminarUsuarioMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarUsuario>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof eliminarUsuario>>, TError, {
    id: number;
}, TContext>;
export type EliminarUsuarioMutationResult = NonNullable<Awaited<ReturnType<typeof eliminarUsuario>>>;
export type EliminarUsuarioMutationError = ErrorType<unknown>;
/**
 * @summary Eliminar usuario (solo admin)
 */
export declare const useEliminarUsuario: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarUsuario>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof eliminarUsuario>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Listar todas las mesas
 */
export declare const getGetMesasUrl: () => string;
export declare const getMesas: (options?: RequestInit) => Promise<Mesa[]>;
export declare const getGetMesasQueryKey: () => readonly ["/api/mesas"];
export declare const getGetMesasQueryOptions: <TData = Awaited<ReturnType<typeof getMesas>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMesas>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMesas>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMesasQueryResult = NonNullable<Awaited<ReturnType<typeof getMesas>>>;
export type GetMesasQueryError = ErrorType<unknown>;
/**
 * @summary Listar todas las mesas
 */
export declare function useGetMesas<TData = Awaited<ReturnType<typeof getMesas>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMesas>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Crear nueva mesa (solo admin)
 */
export declare const getCrearMesaUrl: () => string;
export declare const crearMesa: (crearMesaInput: CrearMesaInput, options?: RequestInit) => Promise<Mesa>;
export declare const getCrearMesaMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearMesa>>, TError, {
        data: BodyType<CrearMesaInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof crearMesa>>, TError, {
    data: BodyType<CrearMesaInput>;
}, TContext>;
export type CrearMesaMutationResult = NonNullable<Awaited<ReturnType<typeof crearMesa>>>;
export type CrearMesaMutationBody = BodyType<CrearMesaInput>;
export type CrearMesaMutationError = ErrorType<unknown>;
/**
 * @summary Crear nueva mesa (solo admin)
 */
export declare const useCrearMesa: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearMesa>>, TError, {
        data: BodyType<CrearMesaInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof crearMesa>>, TError, {
    data: BodyType<CrearMesaInput>;
}, TContext>;
/**
 * @summary Actualizar estado de una mesa
 */
export declare const getActualizarMesaUrl: (numero: string) => string;
export declare const actualizarMesa: (numero: string, actualizarMesaInput: ActualizarMesaInput, options?: RequestInit) => Promise<Mesa>;
export declare const getActualizarMesaMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarMesa>>, TError, {
        numero: string;
        data: BodyType<ActualizarMesaInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof actualizarMesa>>, TError, {
    numero: string;
    data: BodyType<ActualizarMesaInput>;
}, TContext>;
export type ActualizarMesaMutationResult = NonNullable<Awaited<ReturnType<typeof actualizarMesa>>>;
export type ActualizarMesaMutationBody = BodyType<ActualizarMesaInput>;
export type ActualizarMesaMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Actualizar estado de una mesa
 */
export declare const useActualizarMesa: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarMesa>>, TError, {
        numero: string;
        data: BodyType<ActualizarMesaInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof actualizarMesa>>, TError, {
    numero: string;
    data: BodyType<ActualizarMesaInput>;
}, TContext>;
/**
 * @summary Eliminar mesa (solo admin)
 */
export declare const getEliminarMesaUrl: (numero: string) => string;
export declare const eliminarMesa: (numero: string, options?: RequestInit) => Promise<EliminarMesa200>;
export declare const getEliminarMesaMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarMesa>>, TError, {
        numero: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof eliminarMesa>>, TError, {
    numero: string;
}, TContext>;
export type EliminarMesaMutationResult = NonNullable<Awaited<ReturnType<typeof eliminarMesa>>>;
export type EliminarMesaMutationError = ErrorType<unknown>;
/**
 * @summary Eliminar mesa (solo admin)
 */
export declare const useEliminarMesa: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarMesa>>, TError, {
        numero: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof eliminarMesa>>, TError, {
    numero: string;
}, TContext>;
/**
 * @summary Listar productos del catálogo
 */
export declare const getGetProductosUrl: (params?: GetProductosParams) => string;
export declare const getProductos: (params?: GetProductosParams, options?: RequestInit) => Promise<Producto[]>;
export declare const getGetProductosQueryKey: (params?: GetProductosParams) => readonly ["/api/productos", ...GetProductosParams[]];
export declare const getGetProductosQueryOptions: <TData = Awaited<ReturnType<typeof getProductos>>, TError = ErrorType<unknown>>(params?: GetProductosParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProductos>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductosQueryResult = NonNullable<Awaited<ReturnType<typeof getProductos>>>;
export type GetProductosQueryError = ErrorType<unknown>;
/**
 * @summary Listar productos del catálogo
 */
export declare function useGetProductos<TData = Awaited<ReturnType<typeof getProductos>>, TError = ErrorType<unknown>>(params?: GetProductosParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Crear producto (solo admin)
 */
export declare const getCrearProductoUrl: () => string;
export declare const crearProducto: (crearProductoInput: CrearProductoInput, options?: RequestInit) => Promise<Producto>;
export declare const getCrearProductoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearProducto>>, TError, {
        data: BodyType<CrearProductoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof crearProducto>>, TError, {
    data: BodyType<CrearProductoInput>;
}, TContext>;
export type CrearProductoMutationResult = NonNullable<Awaited<ReturnType<typeof crearProducto>>>;
export type CrearProductoMutationBody = BodyType<CrearProductoInput>;
export type CrearProductoMutationError = ErrorType<unknown>;
/**
 * @summary Crear producto (solo admin)
 */
export declare const useCrearProducto: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearProducto>>, TError, {
        data: BodyType<CrearProductoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof crearProducto>>, TError, {
    data: BodyType<CrearProductoInput>;
}, TContext>;
/**
 * @summary Actualizar producto (solo admin)
 */
export declare const getActualizarProductoUrl: (id: number) => string;
export declare const actualizarProducto: (id: number, actualizarProductoInput: ActualizarProductoInput, options?: RequestInit) => Promise<Producto>;
export declare const getActualizarProductoMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarProducto>>, TError, {
        id: number;
        data: BodyType<ActualizarProductoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof actualizarProducto>>, TError, {
    id: number;
    data: BodyType<ActualizarProductoInput>;
}, TContext>;
export type ActualizarProductoMutationResult = NonNullable<Awaited<ReturnType<typeof actualizarProducto>>>;
export type ActualizarProductoMutationBody = BodyType<ActualizarProductoInput>;
export type ActualizarProductoMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Actualizar producto (solo admin)
 */
export declare const useActualizarProducto: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarProducto>>, TError, {
        id: number;
        data: BodyType<ActualizarProductoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof actualizarProducto>>, TError, {
    id: number;
    data: BodyType<ActualizarProductoInput>;
}, TContext>;
/**
 * @summary Eliminar producto (solo admin)
 */
export declare const getEliminarProductoUrl: (id: number) => string;
export declare const eliminarProducto: (id: number, options?: RequestInit) => Promise<EliminarProducto200>;
export declare const getEliminarProductoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarProducto>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof eliminarProducto>>, TError, {
    id: number;
}, TContext>;
export type EliminarProductoMutationResult = NonNullable<Awaited<ReturnType<typeof eliminarProducto>>>;
export type EliminarProductoMutationError = ErrorType<unknown>;
/**
 * @summary Eliminar producto (solo admin)
 */
export declare const useEliminarProducto: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarProducto>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof eliminarProducto>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Listar pedidos
 */
export declare const getGetPedidosUrl: (params?: GetPedidosParams) => string;
export declare const getPedidos: (params?: GetPedidosParams, options?: RequestInit) => Promise<Pedido[]>;
export declare const getGetPedidosQueryKey: (params?: GetPedidosParams) => readonly ["/api/pedidos", ...GetPedidosParams[]];
export declare const getGetPedidosQueryOptions: <TData = Awaited<ReturnType<typeof getPedidos>>, TError = ErrorType<unknown>>(params?: GetPedidosParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPedidos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPedidos>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPedidosQueryResult = NonNullable<Awaited<ReturnType<typeof getPedidos>>>;
export type GetPedidosQueryError = ErrorType<unknown>;
/**
 * @summary Listar pedidos
 */
export declare function useGetPedidos<TData = Awaited<ReturnType<typeof getPedidos>>, TError = ErrorType<unknown>>(params?: GetPedidosParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPedidos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Crear nuevo pedido
 */
export declare const getCrearPedidoUrl: () => string;
export declare const crearPedido: (crearPedidoInput: CrearPedidoInput, options?: RequestInit) => Promise<Pedido>;
export declare const getCrearPedidoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearPedido>>, TError, {
        data: BodyType<CrearPedidoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof crearPedido>>, TError, {
    data: BodyType<CrearPedidoInput>;
}, TContext>;
export type CrearPedidoMutationResult = NonNullable<Awaited<ReturnType<typeof crearPedido>>>;
export type CrearPedidoMutationBody = BodyType<CrearPedidoInput>;
export type CrearPedidoMutationError = ErrorType<unknown>;
/**
 * @summary Crear nuevo pedido
 */
export declare const useCrearPedido: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearPedido>>, TError, {
        data: BodyType<CrearPedidoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof crearPedido>>, TError, {
    data: BodyType<CrearPedidoInput>;
}, TContext>;
/**
 * @summary Obtener un pedido por ID
 */
export declare const getGetPedidoUrl: (id: number) => string;
export declare const getPedido: (id: number, options?: RequestInit) => Promise<Pedido>;
export declare const getGetPedidoQueryKey: (id: number) => readonly [`/api/pedidos/${number}`];
export declare const getGetPedidoQueryOptions: <TData = Awaited<ReturnType<typeof getPedido>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPedido>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPedido>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPedidoQueryResult = NonNullable<Awaited<ReturnType<typeof getPedido>>>;
export type GetPedidoQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Obtener un pedido por ID
 */
export declare function useGetPedido<TData = Awaited<ReturnType<typeof getPedido>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPedido>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Actualizar estado de un pedido
 */
export declare const getActualizarPedidoUrl: (id: number) => string;
export declare const actualizarPedido: (id: number, actualizarPedidoInput: ActualizarPedidoInput, options?: RequestInit) => Promise<Pedido>;
export declare const getActualizarPedidoMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarPedido>>, TError, {
        id: number;
        data: BodyType<ActualizarPedidoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof actualizarPedido>>, TError, {
    id: number;
    data: BodyType<ActualizarPedidoInput>;
}, TContext>;
export type ActualizarPedidoMutationResult = NonNullable<Awaited<ReturnType<typeof actualizarPedido>>>;
export type ActualizarPedidoMutationBody = BodyType<ActualizarPedidoInput>;
export type ActualizarPedidoMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Actualizar estado de un pedido
 */
export declare const useActualizarPedido: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarPedido>>, TError, {
        id: number;
        data: BodyType<ActualizarPedidoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof actualizarPedido>>, TError, {
    id: number;
    data: BodyType<ActualizarPedidoInput>;
}, TContext>;
/**
 * @summary Cancelar pedido
 */
export declare const getEliminarPedidoUrl: (id: number) => string;
export declare const eliminarPedido: (id: number, options?: RequestInit) => Promise<EliminarPedido200>;
export declare const getEliminarPedidoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarPedido>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof eliminarPedido>>, TError, {
    id: number;
}, TContext>;
export type EliminarPedidoMutationResult = NonNullable<Awaited<ReturnType<typeof eliminarPedido>>>;
export type EliminarPedidoMutationError = ErrorType<unknown>;
/**
 * @summary Cancelar pedido
 */
export declare const useEliminarPedido: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarPedido>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof eliminarPedido>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Registrar pago de un pedido
 */
export declare const getCobrarPedidoUrl: (id: number) => string;
export declare const cobrarPedido: (id: number, cobrarPedidoInput: CobrarPedidoInput, options?: RequestInit) => Promise<ResultadoCobro>;
export declare const getCobrarPedidoMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cobrarPedido>>, TError, {
        id: number;
        data: BodyType<CobrarPedidoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cobrarPedido>>, TError, {
    id: number;
    data: BodyType<CobrarPedidoInput>;
}, TContext>;
export type CobrarPedidoMutationResult = NonNullable<Awaited<ReturnType<typeof cobrarPedido>>>;
export type CobrarPedidoMutationBody = BodyType<CobrarPedidoInput>;
export type CobrarPedidoMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Registrar pago de un pedido
 */
export declare const useCobrarPedido: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cobrarPedido>>, TError, {
        id: number;
        data: BodyType<CobrarPedidoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cobrarPedido>>, TError, {
    id: number;
    data: BodyType<CobrarPedidoInput>;
}, TContext>;
/**
 * @summary Resumen del estado de pedidos
 */
export declare const getGetResumenPedidosUrl: () => string;
export declare const getResumenPedidos: (options?: RequestInit) => Promise<ResumenPedidos>;
export declare const getGetResumenPedidosQueryKey: () => readonly ["/api/pedidos/resumen"];
export declare const getGetResumenPedidosQueryOptions: <TData = Awaited<ReturnType<typeof getResumenPedidos>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResumenPedidos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getResumenPedidos>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetResumenPedidosQueryResult = NonNullable<Awaited<ReturnType<typeof getResumenPedidos>>>;
export type GetResumenPedidosQueryError = ErrorType<unknown>;
/**
 * @summary Resumen del estado de pedidos
 */
export declare function useGetResumenPedidos<TData = Awaited<ReturnType<typeof getResumenPedidos>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResumenPedidos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Resumen general del día y semana
 */
export declare const getGetResumenGeneralUrl: () => string;
export declare const getResumenGeneral: (options?: RequestInit) => Promise<ResumenGeneral>;
export declare const getGetResumenGeneralQueryKey: () => readonly ["/api/reportes/resumen"];
export declare const getGetResumenGeneralQueryOptions: <TData = Awaited<ReturnType<typeof getResumenGeneral>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResumenGeneral>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getResumenGeneral>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetResumenGeneralQueryResult = NonNullable<Awaited<ReturnType<typeof getResumenGeneral>>>;
export type GetResumenGeneralQueryError = ErrorType<unknown>;
/**
 * @summary Resumen general del día y semana
 */
export declare function useGetResumenGeneral<TData = Awaited<ReturnType<typeof getResumenGeneral>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResumenGeneral>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Ventas de los últimos 7 días
 */
export declare const getGetVentasDiariasUrl: () => string;
export declare const getVentasDiarias: (options?: RequestInit) => Promise<VentaDiaria[]>;
export declare const getGetVentasDiariasQueryKey: () => readonly ["/api/reportes/ventas-diarias"];
export declare const getGetVentasDiariasQueryOptions: <TData = Awaited<ReturnType<typeof getVentasDiarias>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVentasDiarias>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getVentasDiarias>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetVentasDiariasQueryResult = NonNullable<Awaited<ReturnType<typeof getVentasDiarias>>>;
export type GetVentasDiariasQueryError = ErrorType<unknown>;
/**
 * @summary Ventas de los últimos 7 días
 */
export declare function useGetVentasDiarias<TData = Awaited<ReturnType<typeof getVentasDiarias>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVentasDiarias>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Productos más vendidos hoy
 */
export declare const getGetProductosTopUrl: () => string;
export declare const getProductosTop: (options?: RequestInit) => Promise<ProductoTop[]>;
export declare const getGetProductosTopQueryKey: () => readonly ["/api/reportes/productos-top"];
export declare const getGetProductosTopQueryOptions: <TData = Awaited<ReturnType<typeof getProductosTop>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductosTop>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProductosTop>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductosTopQueryResult = NonNullable<Awaited<ReturnType<typeof getProductosTop>>>;
export type GetProductosTopQueryError = ErrorType<unknown>;
/**
 * @summary Productos más vendidos hoy
 */
export declare function useGetProductosTop<TData = Awaited<ReturnType<typeof getProductosTop>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductosTop>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Ventas por mesero hoy
 */
export declare const getGetVentasPorMeseroUrl: () => string;
export declare const getVentasPorMesero: (options?: RequestInit) => Promise<VentaMesero[]>;
export declare const getGetVentasPorMeseroQueryKey: () => readonly ["/api/reportes/ventas-por-mesero"];
export declare const getGetVentasPorMeseroQueryOptions: <TData = Awaited<ReturnType<typeof getVentasPorMesero>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVentasPorMesero>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getVentasPorMesero>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetVentasPorMeseroQueryResult = NonNullable<Awaited<ReturnType<typeof getVentasPorMesero>>>;
export type GetVentasPorMeseroQueryError = ErrorType<unknown>;
/**
 * @summary Ventas por mesero hoy
 */
export declare function useGetVentasPorMesero<TData = Awaited<ReturnType<typeof getVentasPorMesero>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVentasPorMesero>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Estadísticas de mesas hoy
 */
export declare const getGetMesasStatsUrl: () => string;
export declare const getMesasStats: (options?: RequestInit) => Promise<MesasStats>;
export declare const getGetMesasStatsQueryKey: () => readonly ["/api/reportes/mesas-stats"];
export declare const getGetMesasStatsQueryOptions: <TData = Awaited<ReturnType<typeof getMesasStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMesasStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMesasStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMesasStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getMesasStats>>>;
export type GetMesasStatsQueryError = ErrorType<unknown>;
/**
 * @summary Estadísticas de mesas hoy
 */
export declare function useGetMesasStats<TData = Awaited<ReturnType<typeof getMesasStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMesasStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Obtener sesión de caja activa
 */
export declare const getGetCajaSesionActivaUrl: () => string;
export declare const getCajaSesionActiva: (options?: RequestInit) => Promise<CajaSesion>;
export declare const getGetCajaSesionActivaQueryKey: () => readonly ["/api/caja/sesion-activa"];
export declare const getGetCajaSesionActivaQueryOptions: <TData = Awaited<ReturnType<typeof getCajaSesionActiva>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCajaSesionActiva>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCajaSesionActiva>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCajaSesionActivaQueryResult = NonNullable<Awaited<ReturnType<typeof getCajaSesionActiva>>>;
export type GetCajaSesionActivaQueryError = ErrorType<unknown>;
/**
 * @summary Obtener sesión de caja activa
 */
export declare function useGetCajaSesionActiva<TData = Awaited<ReturnType<typeof getCajaSesionActiva>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCajaSesionActiva>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Abrir sesión de caja
 */
export declare const getAbrirCajaUrl: () => string;
export declare const abrirCaja: (abrirCajaInput: AbrirCajaInput, options?: RequestInit) => Promise<CajaSesion>;
export declare const getAbrirCajaMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof abrirCaja>>, TError, {
        data: BodyType<AbrirCajaInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof abrirCaja>>, TError, {
    data: BodyType<AbrirCajaInput>;
}, TContext>;
export type AbrirCajaMutationResult = NonNullable<Awaited<ReturnType<typeof abrirCaja>>>;
export type AbrirCajaMutationBody = BodyType<AbrirCajaInput>;
export type AbrirCajaMutationError = ErrorType<unknown>;
/**
 * @summary Abrir sesión de caja
 */
export declare const useAbrirCaja: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof abrirCaja>>, TError, {
        data: BodyType<AbrirCajaInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof abrirCaja>>, TError, {
    data: BodyType<AbrirCajaInput>;
}, TContext>;
/**
 * @summary Cerrar sesión de caja con conteo de efectivo
 */
export declare const getCerrarCajaUrl: () => string;
export declare const cerrarCaja: (cerrarCajaInput: CerrarCajaInput, options?: RequestInit) => Promise<ResumenCierre>;
export declare const getCerrarCajaMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cerrarCaja>>, TError, {
        data: BodyType<CerrarCajaInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cerrarCaja>>, TError, {
    data: BodyType<CerrarCajaInput>;
}, TContext>;
export type CerrarCajaMutationResult = NonNullable<Awaited<ReturnType<typeof cerrarCaja>>>;
export type CerrarCajaMutationBody = BodyType<CerrarCajaInput>;
export type CerrarCajaMutationError = ErrorType<unknown>;
/**
 * @summary Cerrar sesión de caja con conteo de efectivo
 */
export declare const useCerrarCaja: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cerrarCaja>>, TError, {
        data: BodyType<CerrarCajaInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cerrarCaja>>, TError, {
    data: BodyType<CerrarCajaInput>;
}, TContext>;
/**
 * @summary Historial de sesiones de caja
 */
export declare const getGetCajaSesionesUrl: () => string;
export declare const getCajaSesiones: (options?: RequestInit) => Promise<CajaSesion[]>;
export declare const getGetCajaSesionesQueryKey: () => readonly ["/api/caja/sesiones"];
export declare const getGetCajaSesionesQueryOptions: <TData = Awaited<ReturnType<typeof getCajaSesiones>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCajaSesiones>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCajaSesiones>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCajaSesionesQueryResult = NonNullable<Awaited<ReturnType<typeof getCajaSesiones>>>;
export type GetCajaSesionesQueryError = ErrorType<unknown>;
/**
 * @summary Historial de sesiones de caja
 */
export declare function useGetCajaSesiones<TData = Awaited<ReturnType<typeof getCajaSesiones>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCajaSesiones>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Resumen de efectivo del día
 */
export declare const getGetCajaResumenDiaUrl: () => string;
export declare const getCajaResumenDia: (options?: RequestInit) => Promise<ResumenDiaCaja>;
export declare const getGetCajaResumenDiaQueryKey: () => readonly ["/api/caja/resumen-dia"];
export declare const getGetCajaResumenDiaQueryOptions: <TData = Awaited<ReturnType<typeof getCajaResumenDia>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCajaResumenDia>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCajaResumenDia>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCajaResumenDiaQueryResult = NonNullable<Awaited<ReturnType<typeof getCajaResumenDia>>>;
export type GetCajaResumenDiaQueryError = ErrorType<unknown>;
/**
 * @summary Resumen de efectivo del día
 */
export declare function useGetCajaResumenDia<TData = Awaited<ReturnType<typeof getCajaResumenDia>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCajaResumenDia>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Obtener configuración de impresora
 */
export declare const getGetImpresoraConfigUrl: () => string;
export declare const getImpresoraConfig: (options?: RequestInit) => Promise<ImpresoraConfig>;
export declare const getGetImpresoraConfigQueryKey: () => readonly ["/api/impresora/config"];
export declare const getGetImpresoraConfigQueryOptions: <TData = Awaited<ReturnType<typeof getImpresoraConfig>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getImpresoraConfig>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getImpresoraConfig>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetImpresoraConfigQueryResult = NonNullable<Awaited<ReturnType<typeof getImpresoraConfig>>>;
export type GetImpresoraConfigQueryError = ErrorType<unknown>;
/**
 * @summary Obtener configuración de impresora
 */
export declare function useGetImpresoraConfig<TData = Awaited<ReturnType<typeof getImpresoraConfig>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getImpresoraConfig>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Actualizar configuración de impresora
 */
export declare const getSetImpresoraConfigUrl: () => string;
export declare const setImpresoraConfig: (impresoraConfig: ImpresoraConfig, options?: RequestInit) => Promise<SetImpresoraConfig200>;
export declare const getSetImpresoraConfigMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setImpresoraConfig>>, TError, {
        data: BodyType<ImpresoraConfig>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof setImpresoraConfig>>, TError, {
    data: BodyType<ImpresoraConfig>;
}, TContext>;
export type SetImpresoraConfigMutationResult = NonNullable<Awaited<ReturnType<typeof setImpresoraConfig>>>;
export type SetImpresoraConfigMutationBody = BodyType<ImpresoraConfig>;
export type SetImpresoraConfigMutationError = ErrorType<unknown>;
/**
 * @summary Actualizar configuración de impresora
 */
export declare const useSetImpresoraConfig: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setImpresoraConfig>>, TError, {
        data: BodyType<ImpresoraConfig>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof setImpresoraConfig>>, TError, {
    data: BodyType<ImpresoraConfig>;
}, TContext>;
/**
 * @summary Imprimir ticket
 */
export declare const getImprimirTicketUrl: () => string;
export declare const imprimirTicket: (imprimirInput: ImprimirInput, options?: RequestInit) => Promise<ImpresionResultado>;
export declare const getImprimirTicketMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof imprimirTicket>>, TError, {
        data: BodyType<ImprimirInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof imprimirTicket>>, TError, {
    data: BodyType<ImprimirInput>;
}, TContext>;
export type ImprimirTicketMutationResult = NonNullable<Awaited<ReturnType<typeof imprimirTicket>>>;
export type ImprimirTicketMutationBody = BodyType<ImprimirInput>;
export type ImprimirTicketMutationError = ErrorType<unknown>;
/**
 * @summary Imprimir ticket
 */
export declare const useImprimirTicket: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof imprimirTicket>>, TError, {
        data: BodyType<ImprimirInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof imprimirTicket>>, TError, {
    data: BodyType<ImprimirInput>;
}, TContext>;
/**
 * @summary Imprimir ticket de prueba
 */
export declare const getImprimirPruebaUrl: () => string;
export declare const imprimirPrueba: (options?: RequestInit) => Promise<ImpresionResultado>;
export declare const getImprimirPruebaMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof imprimirPrueba>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof imprimirPrueba>>, TError, void, TContext>;
export type ImprimirPruebaMutationResult = NonNullable<Awaited<ReturnType<typeof imprimirPrueba>>>;
export type ImprimirPruebaMutationError = ErrorType<unknown>;
/**
 * @summary Imprimir ticket de prueba
 */
export declare const useImprimirPrueba: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof imprimirPrueba>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof imprimirPrueba>>, TError, void, TContext>;
/**
 * @summary Obtener logs de impresión
 */
export declare const getGetImpresoraLogsUrl: () => string;
export declare const getImpresoraLogs: (options?: RequestInit) => Promise<ImpresionLog[]>;
export declare const getGetImpresoraLogsQueryKey: () => readonly ["/api/impresora/logs"];
export declare const getGetImpresoraLogsQueryOptions: <TData = Awaited<ReturnType<typeof getImpresoraLogs>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getImpresoraLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getImpresoraLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetImpresoraLogsQueryResult = NonNullable<Awaited<ReturnType<typeof getImpresoraLogs>>>;
export type GetImpresoraLogsQueryError = ErrorType<unknown>;
/**
 * @summary Obtener logs de impresión
 */
export declare function useGetImpresoraLogs<TData = Awaited<ReturnType<typeof getImpresoraLogs>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getImpresoraLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Limpiar logs de impresión
 */
export declare const getLimpiarImpresoraLogsUrl: () => string;
export declare const limpiarImpresoraLogs: (options?: RequestInit) => Promise<LimpiarImpresoraLogs200>;
export declare const getLimpiarImpresoraLogsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof limpiarImpresoraLogs>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof limpiarImpresoraLogs>>, TError, void, TContext>;
export type LimpiarImpresoraLogsMutationResult = NonNullable<Awaited<ReturnType<typeof limpiarImpresoraLogs>>>;
export type LimpiarImpresoraLogsMutationError = ErrorType<unknown>;
/**
 * @summary Limpiar logs de impresión
 */
export declare const useLimpiarImpresoraLogs: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof limpiarImpresoraLogs>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof limpiarImpresoraLogs>>, TError, void, TContext>;
/**
 * @summary Subir imagen de producto
 */
export declare const getSubirImagenUrl: () => string;
export declare const subirImagen: (subirImagenBody: SubirImagenBody, options?: RequestInit) => Promise<UploadResult>;
export declare const getSubirImagenMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof subirImagen>>, TError, {
        data: BodyType<SubirImagenBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof subirImagen>>, TError, {
    data: BodyType<SubirImagenBody>;
}, TContext>;
export type SubirImagenMutationResult = NonNullable<Awaited<ReturnType<typeof subirImagen>>>;
export type SubirImagenMutationBody = BodyType<SubirImagenBody>;
export type SubirImagenMutationError = ErrorType<unknown>;
/**
 * @summary Subir imagen de producto
 */
export declare const useSubirImagen: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof subirImagen>>, TError, {
        data: BodyType<SubirImagenBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof subirImagen>>, TError, {
    data: BodyType<SubirImagenBody>;
}, TContext>;
/**
 * @summary Reiniciar todos los datos
 */
export declare const getResetDatosUrl: () => string;
export declare const resetDatos: (options?: RequestInit) => Promise<ResetResult>;
export declare const getResetDatosMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetDatos>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resetDatos>>, TError, void, TContext>;
export type ResetDatosMutationResult = NonNullable<Awaited<ReturnType<typeof resetDatos>>>;
export type ResetDatosMutationError = ErrorType<unknown>;
/**
 * @summary Reiniciar todos los datos
 */
export declare const useResetDatos: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetDatos>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resetDatos>>, TError, void, TContext>;
/**
 * @summary Listar promociones
 */
export declare const getGetPromocionesUrl: () => string;
export declare const getPromociones: (options?: RequestInit) => Promise<Promocion[]>;
export declare const getGetPromocionesQueryKey: () => readonly ["/api/promociones"];
export declare const getGetPromocionesQueryOptions: <TData = Awaited<ReturnType<typeof getPromociones>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPromociones>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPromociones>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPromocionesQueryResult = NonNullable<Awaited<ReturnType<typeof getPromociones>>>;
export type GetPromocionesQueryError = ErrorType<unknown>;
/**
 * @summary Listar promociones
 */
export declare function useGetPromociones<TData = Awaited<ReturnType<typeof getPromociones>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPromociones>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Crear promoción
 */
export declare const getCrearPromocionUrl: () => string;
export declare const crearPromocion: (promocionInput: PromocionInput, options?: RequestInit) => Promise<Promocion>;
export declare const getCrearPromocionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearPromocion>>, TError, {
        data: BodyType<PromocionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof crearPromocion>>, TError, {
    data: BodyType<PromocionInput>;
}, TContext>;
export type CrearPromocionMutationResult = NonNullable<Awaited<ReturnType<typeof crearPromocion>>>;
export type CrearPromocionMutationBody = BodyType<PromocionInput>;
export type CrearPromocionMutationError = ErrorType<unknown>;
/**
 * @summary Crear promoción
 */
export declare const useCrearPromocion: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof crearPromocion>>, TError, {
        data: BodyType<PromocionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof crearPromocion>>, TError, {
    data: BodyType<PromocionInput>;
}, TContext>;
/**
 * @summary Actualizar promoción
 */
export declare const getActualizarPromocionUrl: (id: number) => string;
export declare const actualizarPromocion: (id: number, promocionInput: PromocionInput, options?: RequestInit) => Promise<Promocion>;
export declare const getActualizarPromocionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarPromocion>>, TError, {
        id: number;
        data: BodyType<PromocionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof actualizarPromocion>>, TError, {
    id: number;
    data: BodyType<PromocionInput>;
}, TContext>;
export type ActualizarPromocionMutationResult = NonNullable<Awaited<ReturnType<typeof actualizarPromocion>>>;
export type ActualizarPromocionMutationBody = BodyType<PromocionInput>;
export type ActualizarPromocionMutationError = ErrorType<unknown>;
/**
 * @summary Actualizar promoción
 */
export declare const useActualizarPromocion: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof actualizarPromocion>>, TError, {
        id: number;
        data: BodyType<PromocionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof actualizarPromocion>>, TError, {
    id: number;
    data: BodyType<PromocionInput>;
}, TContext>;
/**
 * @summary Eliminar promoción
 */
export declare const getEliminarPromocionUrl: (id: number) => string;
export declare const eliminarPromocion: (id: number, options?: RequestInit) => Promise<EliminarPromocion200>;
export declare const getEliminarPromocionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarPromocion>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof eliminarPromocion>>, TError, {
    id: number;
}, TContext>;
export type EliminarPromocionMutationResult = NonNullable<Awaited<ReturnType<typeof eliminarPromocion>>>;
export type EliminarPromocionMutationError = ErrorType<unknown>;
/**
 * @summary Eliminar promoción
 */
export declare const useEliminarPromocion: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof eliminarPromocion>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof eliminarPromocion>>, TError, {
    id: number;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map