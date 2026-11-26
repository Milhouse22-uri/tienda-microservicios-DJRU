import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { Pedido } from '../models';
import { EnviosService } from '../services/envios.service';
import { PagosService } from '../services/pagos.service';
import { PedidosService } from '../services/pedidos.service';
import { SesionService } from '../services/sesion.service';
import { msgError } from '../utils';

interface Extra {
  pago?: string;
  guia?: string;
  rastreo?: string;
}

@Component({
  selector: 'app-pedidos-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <h1>Mis pedidos</h1>

    @if (error()) { <p class="error">{{ error() }}</p> }

    @if (cargando()) {
      <p class="vacio">Cargando pedidos...</p>
    } @else if (pedidos().length === 0) {
      <p class="vacio">Todavía no tienes pedidos. <a routerLink="/"><strong>Ir al catálogo</strong></a></p>
    } @else {
      @for (p of pedidos(); track p.id) {
        <div class="panel">
          <div class="fila">
            <h2 style="margin: 0; flex: 1">Pedido #{{ p.id }}</h2>
            <span class="etiqueta" [class]="p.estado">{{ p.estado }}</span>
          </div>
          @if (p.fecha) { <p class="cat">{{ p.fecha | date: 'dd/MM/yyyy HH:mm' }}</p> }

          @if (p.items && p.items.length) {
            <table>
              <tbody>
                @for (i of p.items; track i.producto_id) {
                  <tr>
                    <td>{{ i.nombre }}</td>
                    <td class="num">x{{ i.cantidad }}</td>
                    <td class="num">{{ i.precio_unitario * i.cantidad | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }

          <p><strong>Total:</strong> {{ p.total | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</p>
          <p>
            <strong>Pago:</strong> {{ extra()[p.id]?.pago || 'pendiente' }}
          </p>
          <p>
            <strong>Guía de rastreo:</strong>
            @if (extra()[p.id]?.guia; as g) {
              {{ g }}
              @if (extra()[p.id]?.rastreo; as r) {
                <span class="etiqueta" [class]="r">{{ r }}</span>
              }
            } @else {
              <span class="cat">aún sin guía</span>
            }
          </p>
        </div>
      }
    }
  `,
})
export class PedidosPage {
  private pedidosSvc = inject(PedidosService);
  private pagosSvc = inject(PagosService);
  private enviosSvc = inject(EnviosService);
  private sesion = inject(SesionService);

  pedidos = signal<Pedido[]>([]);
  extra = signal<Record<number, Extra>>({});
  error = signal('');
  cargando = signal(true);

  constructor() {
    const uid = this.sesion.usuario()?.id ?? 0;
    this.pedidosSvc.porUsuario(uid).subscribe({
      next: (lista) => {
        this.pedidos.set(lista);
        this.cargando.set(false);
        lista.forEach((p) => this.detalle(p));
      },
      error: (e) => {
        this.error.set(msgError(e));
        this.cargando.set(false);
      },
    });
  }

  // Por cada pedido: comprobante de pago (estado y guia) y estado del rastreo
  private detalle(p: Pedido): void {
    this.pagosSvc
      .porPedido(p.id)
      .pipe(
        switchMap((c) => {
          const guia = c?.guia ?? p.guia ?? undefined;
          const pago = c?.estado;
          if (!guia) return of<Extra>({ pago });
          return this.enviosSvc.rastreo(guia).pipe(map((r): Extra => ({ pago, guia, rastreo: r.estado })));
        }),
      )
      .subscribe({
        next: (x) => this.extra.update((m) => ({ ...m, [p.id]: x })),
        error: () => this.extra.update((m) => ({ ...m, [p.id]: { guia: p.guia ?? undefined } })),
      });
  }
}