import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Producto, PromedioProducto } from '../models';
import { ProductosService } from '../services/productos.service';
import { ResenasService } from '../services/resenas.service';
import { SIN_IMAGEN, estrellas, msgError } from '../utils';

@Component({
  selector: 'app-catalogo-page',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <h1>Catálogo</h1>

    <div class="filtros">
      <input
        type="search"
        placeholder="Buscar producto..."
        [ngModel]="q()"
        (ngModelChange)="q.set($event); buscar()"
      />
      <select [ngModel]="categoria()" (ngModelChange)="categoria.set($event); buscar()">
        <option value="">Todas las categorías</option>
        @for (c of categorias(); track c) {
          <option [value]="c">{{ c }}</option>
        }
      </select>
    </div>

    @if (error()) { <p class="error">{{ error() }}</p> }

    @if (cargando() && productos().length === 0) {
      <p class="vacio">Cargando productos...</p>
    } @else if (productos().length === 0) {
      <p class="vacio">No se encontraron productos.</p>
    } @else {
      <div class="grid">
        @for (p of productos(); track p.id) {
          <a class="card" [routerLink]="['/producto', p.id]">
            <img [src]="p.imagen_url" [alt]="p.nombre" (error)="sinImagen($event)" />
            <div class="card-body">
              <h3>{{ p.nombre }}</h3>
              <span class="cat">{{ p.categoria }}</span>
              <div class="estrellas">
                {{ estrellas(prom(p.id).promedio) }}
                <small>({{ prom(p.id).total }})</small>
              </div>
              <span class="precio">{{ p.precio | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</span>
            </div>
          </a>
        }
      </div>
    }
  `,
})
export class CatalogoPage {
  private productosSvc = inject(ProductosService);
  private resenasSvc = inject(ResenasService);

  q = signal('');
  categoria = signal('');
  productos = signal<Producto[]>([]);
  todos = signal<Producto[]>([]);
  promedios = signal<Record<number, PromedioProducto>>({});
  error = signal('');
  cargando = signal(false);
  categorias = computed(() => [...new Set(this.todos().map((p) => p.categoria))].sort());

  estrellas = estrellas;
  private ultimo = 0;

  constructor() {
    // Carga inicial sin filtros: sirve para armar la lista de categorias
    this.productosSvc.listar().subscribe({
      next: (lista) => {
        this.todos.set(lista);
        this.productos.set(lista);
      },
      error: (e) => this.error.set(msgError(e)),
    });
    this.resenasSvc.promedios().subscribe({
      next: (p) => this.promedios.set(p),
      error: () => this.promedios.set({}),
    });
  }

  prom(id: number): PromedioProducto {
    return this.promedios()[id] ?? { promedio: 0, total: 0 };
  }

  buscar(): void {
    const turno = ++this.ultimo;
    this.cargando.set(true);
    this.productosSvc.listar(this.q(), this.categoria()).subscribe({
      next: (lista) => {
        if (turno !== this.ultimo) return; // respuesta vieja
        this.productos.set(lista);
        this.error.set('');
        this.cargando.set(false);
      },
      error: (e) => {
        if (turno !== this.ultimo) return;
        this.error.set(msgError(e));
        this.cargando.set(false);
      },
    });
  }

  sinImagen(ev: Event): void {
    (ev.target as HTMLImageElement).src = SIN_IMAGEN;
  }
}