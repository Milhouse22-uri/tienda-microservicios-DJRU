import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRes, PromedioProducto, Resena, ResenasProducto } from '../models';
import { RESENAS_MOCK } from './mock-data';

// Forma flexible de la respuesta real
interface ResenasRaw {
  promedio?: number;
  total?: number;
  resenas?: Resena[];
  comentarios?: Resena[];
}

type PromediosRaw =
  | { producto_id: number; promedio: number; total?: number }[]
  | Record<string, number | { promedio: number; total?: number }>;

@Injectable({ providedIn: 'root' })
export class ResenasService {
  private http = inject(HttpClient);
  private url = environment.resenas;
  private mock: Resena[] = [...RESENAS_MOCK];

  private resumen(lista: Resena[]): ResenasProducto {
    const total = lista.length;
    const promedio = total ? lista.reduce((a, r) => a + r.calificacion, 0) / total : 0;
    return { resenas: lista, promedio: Math.round(promedio * 10) / 10, total };
  }

  porProducto(productoId: number): Observable<ResenasProducto> {
    if (environment.mock.resenas) {
      return of(this.resumen(this.mock.filter((r) => r.producto_id === productoId))).pipe(delay(100));
    }
    return this.http.get<ApiRes<ResenasRaw>>(`${this.url}/producto/${productoId}`).pipe(
      map((r) => {
        const lista = r.data.resenas ?? r.data.comentarios ?? [];
        const calculado = this.resumen(lista);
        return {
          resenas: lista,
          promedio: r.data.promedio ?? calculado.promedio,
          total: r.data.total ?? calculado.total,
        };
      }),
    );
  }

  // Promedios de todos los productos (para las estrellas del catalogo): { producto_id: {promedio,total} }
  promedios(): Observable<Record<number, PromedioProducto>> {
    if (environment.mock.resenas) {
      const salida: Record<number, PromedioProducto> = {};
      for (const r of this.mock) {
        const lista = this.mock.filter((x) => x.producto_id === r.producto_id);
        const res = this.resumen(lista);
        salida[r.producto_id] = { promedio: res.promedio, total: res.total };
      }
      return of(salida).pipe(delay(100));
    }
    return this.http.get<ApiRes<PromediosRaw>>(`${this.url}/promedios`).pipe(
      map((r) => {
        const salida: Record<number, PromedioProducto> = {};
        const d = r.data;
        if (Array.isArray(d)) {
          for (const x of d) salida[x.producto_id] = { promedio: x.promedio, total: x.total ?? 0 };
        } else {
          for (const [id, v] of Object.entries(d)) {
            salida[Number(id)] = typeof v === 'number' ? { promedio: v, total: 0 } : { promedio: v.promedio, total: v.total ?? 0 };
          }
        }
        return salida;
      }),
    );
  }

  crear(resena: Pick<Resena, 'producto_id' | 'usuario_id' | 'calificacion' | 'comentario'>): Observable<unknown> {
    if (environment.mock.resenas) {
      this.mock.push({ ...resena, id: this.mock.length + 1, fecha: new Date().toISOString().slice(0, 10) });
      return of({}).pipe(delay(150));
    }
    return this.http.post<ApiRes<unknown>>(this.url, resena).pipe(map((r) => r.data));
  }
}