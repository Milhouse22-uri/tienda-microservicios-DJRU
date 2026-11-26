// Todas las APIs responden { ok, data } o { ok: false, error }
export interface ApiRes<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url: string;
}

export interface ItemCarrito {
  producto_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface Carrito {
  usuario_id: number;
  items: ItemCarrito[];
  total: number;
}

export interface Resena {
  id?: number;
  producto_id: number;
  usuario_id: number;
  calificacion: number;
  comentario: string;
  fecha?: string;
}

export interface ResenasProducto {
  resenas: Resena[];
  promedio: number;
  total: number;
}

export interface PromedioProducto {
  promedio: number;
  total: number;
}

export interface Cotizacion {
  costo_envio: number;
  dias_estimados: number;
}

export interface ItemPedido {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface NuevoPedido {
  usuario_id: number;
  direccion: string;
  codigo_postal: string;
  costo_envio: number;
  items: ItemPedido[];
}

export interface Pedido {
  id: number;
  usuario_id: number;
  estado: string;
  total: number;
  costo_envio?: number;
  direccion?: string;
  codigo_postal?: string;
  fecha?: string;
  guia?: string | null;
  items?: ItemPedido[];
}

export interface PedidoCreado {
  id: number;
  total: number;
}

export interface SolicitudPago {
  pedido_id: number;
  usuario_id: number;
  monto: number;
  metodo_pago: string;
  items: { producto_id: number; cantidad: number }[];
}

export interface ResultadoPago {
  estado: string; // APROBADO | RECHAZADO
  motivo?: string;
  guia?: string;
}

export interface Comprobante {
  pedido_id: number;
  estado: string;
  monto?: number;
  metodo_pago?: string;
  guia?: string;
  fecha?: string;
}

export interface Rastreo {
  guia: string;
  estado: string; // preparando | en_transito | entregado
}