import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRes, Producto } from '../models';
import { PRODUCTOS_MOCK } from './mock-data';

function normalizar(p: Producto): Producto {
  return { ...p, precio: Number(p.precio) };
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);
  private url = environment.productos;

  listar(q = '', categoria = ''): Observable<Producto[]> {
    if (environment.mock.productos) {
      const texto = q.trim().toLowerCase();
      const lista = PRODUCTOS_MOCK.filter(
        (p) =>
          (!texto || p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto)) &&
          (!categoria || p.categoria === categoria),
      );
      return of(lista).pipe(delay(150));
    }
    let params = new HttpParams();
    if (q.trim()) params = params.set('q', q.trim());
    if (categoria) params = params.set('categoria', categoria);
    return this.http.get<ApiRes<Producto[]>>(this.url, { params }).pipe(map((r) => r.data.map(normalizar)));
  }

  obtener(id: number): Observable<Producto> {
    if (environment.mock.productos) {
      const p = PRODUCTOS_MOCK.find((x) => x.id === id);
      return p ? of(p).pipe(delay(100)) : throwError(() => new Error('Producto no encontrado'));
    }
    return this.http.get<ApiRes<Producto>>(`${this.url}/${id}`).pipe(map((r) => normalizar(r.data)));
  }
}