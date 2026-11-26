import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRes, Comprobante, ResultadoPago, SolicitudPago } from '../models';
import { CarritoService } from './carrito.service';
import { PedidosService } from './pedidos.service';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private http = inject(HttpClient);
  private url = environment.pagos;
  private carrito = inject(CarritoService);
  private pedidos = inject(PedidosService);
  private comprobantes: Comprobante[] = [];

  procesar(solicitud: SolicitudPago): Observable<ResultadoPago> {
    if (environment.mock.pagos) {
      if (solicitud.metodo_pago === 'tarjeta_rechazada') {
        return of<ResultadoPago>({ estado: 'RECHAZADO', motivo: 'Tarjeta rechazada por el banco' }).pipe(delay(300));
      }
      const guia = 'GUIA-' + String(Date.now()).slice(-8);
      this.comprobantes.push({
        pedido_id: solicitud.pedido_id,
        estado: 'APROBADO',
        monto: solicitud.monto,
        metodo_pago: solicitud.metodo_pago,
        guia,
        fecha: new Date().toISOString(),
      });
      this.pedidos.marcarPagadoMock(solicitud.pedido_id, guia);
      // Emula que api-pagos vacia el carrito al aprobar (usa la API real del carrito)
      return this.carrito.vaciar(solicitud.usuario_id).pipe(
        catchError(() => of(null)),
        map((): ResultadoPago => ({ estado: 'APROBADO', guia })),
        delay(300),
      );
    }
    return this.http.post<ApiRes<ResultadoPago>>(`${this.url}/procesar`, solicitud).pipe(map((r) => r.data));
  }

  // Comprobante del pedido; null si todavia no tiene pago
  porPedido(pedidoId: number): Observable<Comprobante | null> {
    if (environment.mock.pagos) {
      return of(this.comprobantes.find((c) => c.pedido_id === pedidoId) ?? null).pipe(delay(80));
    }
    return this.http.get<ApiRes<Comprobante>>(`${this.url}/pedido/${pedidoId}`).pipe(
      map((r) => r.data),
      catchError(() => of(null)),
    );
  }
}