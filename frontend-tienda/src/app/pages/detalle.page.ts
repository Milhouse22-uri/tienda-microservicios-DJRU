import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Producto, Resena } from '../models';
import { CarritoService } from '../services/carrito.service';
import { InventarioService } from '../services/inventario.service';
import { ProductosService } from '../services/productos.service';
import { ResenasService } from '../services/resenas.service';
import { SesionService } from '../services/sesion.service';
import { switchMap, throwError } from 'rxjs';
import { SIN_IMAGEN, estrellas, msgError } from '../utils';

@Component({
  selector: 'app-detalle-page',
  imports: [FormsModule, RouterLink, CurrencyPipe, DecimalPipe],
  template: `
    <p><a routerLink="/" class="cat">✕ Cerrar</a></p>

    @if (error()) { <p class="error">{{ error() }}</p> }

    @if (producto(); as p) {
      <div class="panel detalle">
        <img [src]="p.imagen_url" [alt]="p.nombre" (error)="sinImagen($event)" />
        <div>
          <h1>{{ p.nombre }}</h1>
          <p class="cat">{{ p.categoria }}</p>
          <div class="estrellas">
            {{ estrellas(promedio()) }}
            <small>{{ promedio() | number: '1.1-1' }} ({{ total() }} reseñas)</small>
          </div>
          <p>{{ p.descripcion }}</p>
          <h2>{{ p.precio | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</h2>

          <p class="stock" [class.agotado]="disponibles() === 0">
            @if (disponibles() === null) {
              <span>Consultando disponibilidad...</span>
            } @else if (disponibles() === 0) {
              <span>Agotado</span>
            } @else {
              <span>{{ disponibles() }} unidades disponibles</span>
            }
          </p>

          <div class="fila">
            <input
              class="cantidad"
              type="number"
              min="1"
              [ngModel]="cantidad()"
              (ngModelChange)="cantidad.set(+$event)"
              aria-label="Cantidad"
            />
            <button class="btn" type="button" [disabled]="!puedeAgregar() || agregando()" (click)="agregar(p)">
              {{ agregando() ? 'Agregando...' : 'Agregar al carrito' }}
            </button>
          </div>
          @if (excede()) {
            <p class="error">La cantidad pedida supera el stock disponible.</p>
          }
          @if (aviso()) { <p class="exito">{{ aviso() }}</p> }
        </div>
      </div>

      <div class="panel">
        <h2>Reseñas</h2>
        @if (resenas().length === 0) {
          <p class="vacio">Aún no hay reseñas. ¡Sé el primero en opinar!</p>
        }
        @for (r of resenas(); track r.id ?? $index) {
          <div class="resena">
            <div class="estrellas">{{ estrellas(r.calificacion) }}</div>
            <p>{{ r.comentario }}</p>
            @if (r.fecha) { <small class="cat">{{ r.fecha }}</small> }
          </div>
        }
      </div>

      <div class="panel">
        <h2>Deja tu reseña</h2>
        @if (sesion.usuario()) {
          <div class="campo">
            <label for="calificacion">Calificación</label>
            <select id="calificacion" [ngModel]="calificacion()" (ngModelChange)="calificacion.set(+$event)">
              <option [ngValue]="5">5 - Excelente</option>
              <option [ngValue]="4">4 - Muy bueno</option>
              <option [ngValue]="3">3 - Regular</option>
              <option [ngValue]="2">2 - Malo</option>
              <option [ngValue]="1">1 - Muy malo</option>
            </select>
          </div>
          <div class="campo">
            <label for="comentario">Comentario</label>
            <textarea id="comentario" maxlength="300" [ngModel]="comentario()" (ngModelChange)="comentario.set($event)"></textarea>
          </div>
          @if (errorResena()) { <p class="error">{{ errorResena() }}</p> }
          <button class="btn" type="button" [disabled]="enviando()" (click)="enviarResena(p)">
            {{ enviando() ? 'Enviando...' : 'Publicar reseña' }}
          </button>
        } @else {
          <p>Para comentar necesitas <a routerLink="/login" [queryParams]="{ volver: router.url }"><strong>iniciar sesión</strong></a>.</p>
        }
      </div>
    }
  `,
})
export class DetallePage {
  private productosSvc = inject(ProductosService);
  private inventarioSvc = inject(InventarioService);
  private resenasSvc = inject(ResenasService);
  private carritoSvc = inject(CarritoService);
  private route = inject(ActivatedRoute);
  sesion = inject(SesionService);
  router = inject(Router);
  private id = 0;

  producto = signal<Producto | null>(null);
  disponibles = signal<number | null>(null);
  resenas = signal<Resena[]>([]);
  promedio = signal(0);
  total = signal(0);
  cantidad = signal(1);
  calificacion = signal(5);
  comentario = signal('');

  error = signal('');
  aviso = signal('');
  errorResena = signal('');
  agregando = signal(false);
  enviando = signal(false);

  estrellas = estrellas;

  excede = computed(() => {
    const d = this.disponibles();
    return d !== null && d > 0 && this.cantidad() > d;
  });
  puedeAgregar = computed(() => {
    const d = this.disponibles();
    const c = this.cantidad();
    return d !== null && d > 0 && Number.isInteger(c) && c >= 1 && c <= d;
  });

  constructor() {
    // El componente se reutiliza al cambiar de producto: reacciona al cambio del id
    this.route.paramMap.subscribe((pm) => {
      this.id = Number(pm.get('id'));
      this.reiniciar();
      this.cargar();
    });
  }

  private reiniciar(): void {
    this.producto.set(null);
    this.disponibles.set(null);
    this.resenas.set([]);
    this.promedio.set(0);
    this.total.set(0);
    this.cantidad.set(1);
    this.aviso.set('');
    this.error.set('');
    this.comentario.set('');
    this.errorResena.set('');
  }

  private cargar(): void {
    const id = this.id;
    this.productosSvc.obtener(id).subscribe({
      next: (p) => id === this.id && this.producto.set(p),
      error: (e) => id === this.id && this.error.set(msgError(e)),
    });
    this.inventarioSvc.disponibles(id).subscribe({
      next: (n) => id === this.id && this.disponibles.set(n),
      error: () => id === this.id && this.disponibles.set(0),
    });
    this.cargarResenas();
  }

  private cargarResenas(): void {
    const id = this.id;
    this.resenasSvc.porProducto(id).subscribe({
      next: (r) => {
        if (id !== this.id) return;
        this.resenas.set(r.resenas);
        this.promedio.set(r.promedio);
        this.total.set(r.total);
      },
      error: () => id === this.id && this.resenas.set([]),
    });
  }

  agregar(p: Producto): void {
    const u = this.sesion.usuario();
    if (!u) {
      this.router.navigate(['/login'], { queryParams: { volver: this.router.url } });
      return;
    }
    this.agregando.set(true);
    this.aviso.set('');
    this.error.set('');
    this.carritoSvc
      .obtener(u.id)
      .pipe(
        switchMap((c) => {
          const ya = c.items.find((i) => i.producto_id === p.id)?.cantidad ?? 0;
          const disp = this.disponibles() ?? 0;
          if (ya + this.cantidad() > disp) {
            return throwError(() => new Error(`Ya tienes ${ya} en el carrito y solo hay ${disp} disponibles`));
          }
          return this.carritoSvc.agregar(u.id, {
            producto_id: p.id,
            nombre: p.nombre,
            precio: p.precio,
            cantidad: this.cantidad(),
          });
        }),
      )
      .subscribe({
        next: () => {
          this.aviso.set('Producto agregado al carrito');
          this.agregando.set(false);
        },
        error: (e) => {
          this.error.set(msgError(e));
          this.agregando.set(false);
        },
      });
  }

  enviarResena(p: Producto): void {
    const u = this.sesion.usuario();
    if (!u) return;
    if (!this.comentario().trim()) {
      this.errorResena.set('Escribe un comentario');
      return;
    }
    this.errorResena.set('');
    this.enviando.set(true);
    this.resenasSvc
      .crear({ producto_id: p.id, usuario_id: u.id, calificacion: this.calificacion(), comentario: this.comentario().trim() })
      .subscribe({
        next: () => {
          this.comentario.set('');
          this.enviando.set(false);
          this.cargarResenas();
        },
        error: (e) => {
          this.errorResena.set(msgError(e));
          this.enviando.set(false);
        },
      });
  }

  sinImagen(ev: Event): void {
    (ev.target as HTMLImageElement).src = SIN_IMAGEN;
  }
}