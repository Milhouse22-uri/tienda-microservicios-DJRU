import { HttpErrorResponse } from '@angular/common/http';

export function estrellas(n: number): string {
  const r = Math.max(0, Math.min(5, Math.round(n || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

export function msgError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const detalle = (e.error as { error?: string } | null)?.error;
    if (detalle) return detalle;
    return e.status === 0 ? 'No se pudo conectar con el servidor' : `Error ${e.status}`;
  }
  return (e as Error)?.message || 'Error inesperado';
}

// Imagen de respaldo (SVG embebido) si la imagen del producto no carga
export const SIN_IMAGEN =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" font-family="sans-serif" font-size="22" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">Sin imagen</text></svg>',
  );