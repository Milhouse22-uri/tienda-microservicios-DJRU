import { Producto, Resena } from '../models';

// Productos semilla con IDs 1 a 6 (los mismos que crea Diego en api-productos)
export const PRODUCTOS_MOCK: Producto[] = [
  { id: 1, nombre: 'Audífonos Bluetooth', descripcion: 'Audífonos inalámbricos con cancelación de ruido y 20 horas de batería.', precio: 350, categoria: 'Electrónica', imagen_url: 'https://placehold.co/400x300?text=Audifonos' },
  { id: 2, nombre: 'Teclado mecánico', descripcion: 'Teclado mecánico retroiluminado con switches rojos.', precio: 890, categoria: 'Electrónica', imagen_url: 'https://placehold.co/400x300?text=Teclado' },
  { id: 3, nombre: 'Mochila urbana', descripcion: 'Mochila resistente al agua con compartimento para laptop de 15 pulgadas.', precio: 520, categoria: 'Accesorios', imagen_url: 'https://placehold.co/400x300?text=Mochila' },
  { id: 4, nombre: 'Botella térmica', descripcion: 'Botella de acero inoxidable de 750 ml, mantiene la temperatura 12 horas.', precio: 240, categoria: 'Hogar', imagen_url: 'https://placehold.co/400x300?text=Botella' },
  { id: 5, nombre: 'Lámpara de escritorio', descripcion: 'Lámpara LED con tres niveles de brillo y puerto USB.', precio: 410, categoria: 'Hogar', imagen_url: 'https://placehold.co/400x300?text=Lampara' },
  { id: 6, nombre: 'Mouse inalámbrico', descripcion: 'Mouse ergonómico inalámbrico con receptor USB.', precio: 280, categoria: 'Electrónica', imagen_url: 'https://placehold.co/400x300?text=Mouse' },
];

export const INVENTARIO_MOCK: Record<number, number> = { 1: 10, 2: 3, 3: 0, 4: 25, 5: 7, 6: 12 };

export const RESENAS_MOCK: Resena[] = [
  { id: 1, producto_id: 1, usuario_id: 2, calificacion: 5, comentario: 'Excelente sonido y muy cómodos.', fecha: '2026-11-10' },
  { id: 2, producto_id: 1, usuario_id: 3, calificacion: 4, comentario: 'Buena batería, el estuche es un poco grande.', fecha: '2026-11-12' },
  { id: 3, producto_id: 2, usuario_id: 2, calificacion: 5, comentario: 'Muy buen teclado para programar.', fecha: '2026-11-15' },
  { id: 4, producto_id: 4, usuario_id: 3, calificacion: 3, comentario: 'Mantiene el frío pero la tapa se atora.', fecha: '2026-11-18' },
];