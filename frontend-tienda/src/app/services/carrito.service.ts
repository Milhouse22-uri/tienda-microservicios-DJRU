import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRes, Carrito, ItemCarrito } from '../models';

// Siempre usa la API real (api-carrito, puerto 8005)
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private http = inject(HttpClient);
  private url = environment.carrito;

  obtener(usuarioId: number): Observable<Carrito> {
    return this.http.get<ApiRes<Carrito>>(`${this.url}/${usuarioId}`).pipe(map((r) => r.data));
  }

  agregar(usuarioId: number, item: ItemCarrito): Observable<Carrito> {
    return this.http.post<ApiRes<Carrito>>(`${this.url}/${usuarioId}/agregar`, item).pipe(map((r) => r.data));
  }

  quitar(usuarioId: number, productoId: number): Observable<Carrito> {
    return this.http.delete<ApiRes<Carrito>>(`${this.url}/${usuarioId}/item/${productoId}`).pipe(map((r) => r.data));
  }

    vaciar(usuarioId: number): Observable<Carrito> {
    return this.http.delete<ApiRes<Carrito>>(`${this.url}/${usuarioId}/vaciar`).pipe(map((r) => r.data));
  }
}