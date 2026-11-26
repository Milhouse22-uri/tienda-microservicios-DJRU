import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRes, NuevoPedido, Pedido, PedidoCreado } from '../models';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private url = environment.pedidos;
  private mock: Pedido[] = [];

  crear(pedido: NuevoPedido): Observable<PedidoCreado> {
    if (environment.mock.pedidos) {
      const subtotal = pedido.items.reduce((a, i) => a + i.precio_unitario * i.cantidad, 0);
      const nuevo: Pedido = {
        id: this.mock.length + 1,
        usuario_id: pedido.usuario_id,
        estado: 'pendiente',
        total: subtotal + pedido.costo_envio,
        costo_envio: pedido.costo_envio,
        direccion: pedido.direccion,
        codigo_postal: pedido.codigo_postal,
        fecha: new Date().toISOString(),
        guia: null,
        items: pedido.items,
      };
      this.mock.push(nuevo);
      return of({ id: nuevo.id, total: nuevo.total }).pipe(delay(250));
    }
    return this.http.post<ApiRes<PedidoCreado>>(this.url, pedido).pipe(map((r) => r.data));
  }

  porUsuario(usuarioId: number): Observable<Pedido[]> {
    if (environment.mock.pedidos) {
      return of(this.mock.filter((p) => p.usuario_id === usuarioId).slice().reverse()).pipe(delay(150));
    }
    return this.http.get<ApiRes<Pedido[]>>(`${this.url}/usuario/${usuarioId}`).pipe(map((r) => r.data));
  }

  // Solo para el modo mock: emula lo que haria api-pagos al aprobar
  marcarPagadoMock(id: number, guia: string): void {
    const p = this.mock.find((x) => x.id === id);
    if (p) {
      p.estado = 'pagado';
      p.guia = guia;
    }
  }
}