import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, of, switchMap, tap } from 'rxjs';
import { Carrito, Cotizacion, PedidoCreado } from '../models';
import { CarritoService } from '../services/carrito.service';
import { EnviosService } from '../services/envios.service';
import { PagosService } from '../services/pagos.service';
import { PedidosService } from '../services/pedidos.service';
import { SesionService } from '../services/sesion.service';
import { msgError } from '../utils';

@Component({
  selector: 'app-carrito-page',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <h1>Carrito</h1>

    @if (confirmacion(); as c) {
      <div class="panel">
        <h2>¡Pedido confirmado! 🎉</h2>
        <p class="exito">Tu pago fue aprobado.</p>
        <p>Número de pedido: <strong>#{{ c.pedido_id }}</strong></p>
        <p>Guía de rastreo: <strong>{{ c.guia || 'se generará en breve (consúltala en Mis pedidos)' }}</strong></p>
        <p>
          <a class="btn" routerLink="/pedidos">Ver mis pedidos</a>
          <a class="btn secundario" routerLink="/">Seguir comprando</a>
        </p>
      </div>
    }

    @if (error()) { <p class="error">{{ error() }}</p> }

    @if (cargando()) {
      <p class="vacio">Cargando carrito...</p>
    } @else if (!carrito() || carrito()!.items.length === 0) {
      @if (!confirmacion()) {
        <p class="vacio">Tu carrito está vacío. <a routerLink="/"><strong>Ir al catálogo</strong></a></p>
      }
    } @else {
      <div class="panel">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th class="num">Precio</th>
              <th class="num">Cantidad</th>
              <th class="num">Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (i of carrito()!.items; track i.producto_id) {
              <tr>
                <td>{{ i.nombre }}</td>
                <td class="num">{{ i.precio | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</td>
                <td class="num">{{ i.cantidad }}</td>
                <td class="num">{{ i.precio * i.cantidad | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</td>
                <td class="num">
                  <button class="btn peligro" type="button" (click)="quitar(i.producto_id)">Quitar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <p class="total">Subtotal: {{ carrito()!.total | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</p>
      </div>

      <div class="checkout">
        <div class="panel">
          <h2>Envío</h2>
          <div class="campo">
            <label for="direccion">Dirección</label>
            <input id="direccion" [ngModel]="direccion()" (ngModelChange)="direccion.set($event)" placeholder="Calle, número, colonia, ciudad" />
          </div>
          <div class="campo">
            <label for="cp">Código postal</label>
            <div class="fila">
              <input id="cp" [ngModel]="cp()" (ngModelChange)="cp.set($event); cotizacion.set(null); pedidoCreado.set(null)" maxlength="5" placeholder="38000" />
              <button class="btn secundario" type="button" [disabled]="cotizando()" (click)="cotizar()">
                {{ cotizando() ? 'Cotizando...' : 'Cotizar envío' }}
              </button>
            </div>
          </div>
          @if (cotizacion(); as c) {
            <p class="exito">
              Envío: <strong>{{ c.costo_envio | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</strong>
              · Llega en aprox. {{ c.dias_estimados }} días
            </p>
          }
        </div>

        <div class="panel">
          <h2>Pago</h2>
          <div class="campo">
            <label for="metodo">Método de pago</label>
            <select id="metodo" [ngModel]="metodo()" (ngModelChange)="metodo.set($event)">
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta_rechazada">Tarjeta rechazada (demo)</option>
            </select>
          </div>
          <p class="total">Total: {{ totalAPagar() | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</p>

          @if (rechazo()) {
            <p class="error">Pago rechazado: {{ rechazo() }}. Puedes intentarlo de nuevo.</p>
          }

          <button class="btn" type="button" [disabled]="!puedePagar() || procesando()" (click)="pagar()">
            {{ procesando() ? 'Procesando pago...' : rechazo() ? 'Reintentar pago' : 'Pagar ahora' }}
          </button>
          @if (!puedePagar()) {
            <p class="cat">Ingresa dirección y código postal, y cotiza el envío para continuar.</p>
          }
        </div>
      </div>
    }
  `,
})
export class CarritoPage {
  private carritoSvc = inject(CarritoService);
  private enviosSvc = inject(EnviosService);
  private pedidosSvc = inject(PedidosService);
  private pagosSvc = inject(PagosService);
  private sesion = inject(SesionService);

  carrito = signal<Carrito | null>(null);
  cp = signal('');
  direccion = signal('');
  metodo = signal('tarjeta');
  cotizacion = signal<Cotizacion | null>(null);
  pedidoCreado = signal<PedidoCreado | null>(null);
  confirmacion = signal<{ pedido_id: number; guia?: string } | null>(null);
  rechazo = signal('');
  error = signal('');
  cargando = signal(true);
  cotizando = signal(false);
  procesando = signal(false);

  private uid = computed(() => this.sesion.usuario()?.id ?? 0);
  cantidadTotal = computed(() => (this.carrito()?.items ?? []).reduce((a, i) => a + i.cantidad, 0));
  totalAPagar = computed(() => (this.carrito()?.total ?? 0) + (this.cotizacion()?.costo_envio ?? 0));
  puedePagar = computed(
    () => !!this.cotizacion() && this.direccion().trim().length > 3 && /^\d{5}$/.test(this.cp().trim()) && this.cantidadTotal() > 0,
  );

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.carritoSvc.obtener(this.uid()).subscribe({
      next: (c) => {
        this.carrito.set(c);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(msgError(e));
        this.cargando.set(false);
      },
    });
  }

  quitar(productoId: number): void {
    this.carritoSvc.quitar(this.uid(), productoId).subscribe({
      next: (c) => {
        this.carrito.set(c);
        this.cotizacion.set(null); // cambio la cantidad: hay que volver a cotizar
        this.pedidoCreado.set(null);
      },
      error: (e) => this.error.set(msgError(e)),
    });
  }

  cotizar(): void {
    if (!/^\d{5}$/.test(this.cp().trim())) {
      this.error.set('El código postal debe tener 5 dígitos');
      return;
    }
    this.error.set('');
    this.cotizando.set(true);
    this.enviosSvc.cotizar(this.cp().trim(), this.cantidadTotal()).subscribe({
      next: (c) => {
        this.cotizacion.set(c);
        this.cotizando.set(false);
      },
      error: (e) => {
        this.error.set(msgError(e));
        this.cotizando.set(false);
      },
    });
  }

  // Flujo: crear pedido -> procesar pago -> confirmacion o rechazo
  pagar(): void {
    const carrito = this.carrito();
    const cot = this.cotizacion();
    if (!carrito || !cot) return;

    this.error.set('');
    this.rechazo.set('');
    this.procesando.set(true);

    // Si el pago anterior fue rechazado, se reutiliza el mismo pedido
    const pedido$: Observable<PedidoCreado> = this.pedidoCreado()
      ? of(this.pedidoCreado()!)
      : this.pedidosSvc.crear({
          usuario_id: this.uid(),
          direccion: this.direccion().trim(),
          codigo_postal: this.cp().trim(),
          costo_envio: cot.costo_envio,
          items: carrito.items.map((i) => ({
            producto_id: i.producto_id,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio_unitario: i.precio,
          })),
        });

    pedido$
      .pipe(
        tap((p) => this.pedidoCreado.set(p)),
        switchMap((p) =>
          this.pagosSvc.procesar({
            pedido_id: p.id,
            usuario_id: this.uid(),
            monto: Number(p.total),
            metodo_pago: this.metodo(),
            items: carrito.items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
          }),
        ),
      )
      .subscribe({
        next: (r) => {
          this.procesando.set(false);
          if (String(r.estado).toUpperCase() === 'APROBADO') {
            this.confirmacion.set({ pedido_id: this.pedidoCreado()!.id, guia: r.guia });
            this.pedidoCreado.set(null);
            this.cotizacion.set(null);
            this.cargar(); // el carrito ya viene vacio (api-pagos lo vacia)
          } else {
            this.rechazo.set(r.motivo || 'el pago no fue aprobado');
          }
        },
        error: (e) => {
          this.procesando.set(false);
          this.error.set(msgError(e));
        },
      });
  }
}