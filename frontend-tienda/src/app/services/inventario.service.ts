import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRes } from '../models';
import { INVENTARIO_MOCK } from './mock-data';

interface InventarioRaw {
  producto_id?: number;
  disponibles?: number;
  stock?: number;
  cantidad?: number;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);
  private url = environment.inventario;

  // Devuelve las unidades disponibles
  disponibles(productoId: number): Observable<number> {
    if (environment.mock.inventario) {
      return of(INVENTARIO_MOCK[productoId] ?? 0).pipe(delay(100));
    }
    return this.http
      .get<ApiRes<InventarioRaw>>(`${this.url}/${productoId}`)
      .pipe(map((r) => r.data.disponibles ?? r.data.stock ?? r.data.cantidad ?? 0));
  }
}