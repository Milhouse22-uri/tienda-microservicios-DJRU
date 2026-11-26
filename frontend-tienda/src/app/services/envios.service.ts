import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRes, Cotizacion, Rastreo } from '../models';

@Injectable({ providedIn: 'root' })
export class EnviosService {
  private http = inject(HttpClient);
  private url = environment.envios;

  cotizar(codigoPostal: string, cantidad: number): Observable<Cotizacion> {
    if (environment.mock.envios) {
      const ultimo = Number(codigoPostal.slice(-1)) || 0;
      return of({ costo_envio: 50 + cantidad * 10, dias_estimados: 3 + (ultimo % 3) }).pipe(delay(200));
    }
    return this.http
      .post<ApiRes<Cotizacion>>(`${this.url}/cotizar`, { codigo_postal: codigoPostal, cantidad })
      .pipe(map((r) => r.data));
  }

  rastreo(guia: string): Observable<Rastreo> {
    if (environment.mock.envios) {
      return of({ guia, estado: 'preparando' }).pipe(delay(100));
    }
    return this.http.get<ApiRes<Rastreo>>(`${this.url}/rastreo/${guia}`).pipe(map((r) => r.data));
  }
}