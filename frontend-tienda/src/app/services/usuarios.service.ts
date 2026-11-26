import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRes, Usuario } from '../models';

export interface SesionRespuesta {
  usuario: Usuario;
  token: string;
}

// Forma flexible: la API puede devolver { token, usuario: {...} } o los datos planos
interface LoginRaw {
  token?: string;
  usuario?: Usuario;
  id?: number;
  usuario_id?: number;
  nombre?: string;
  correo?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private url = environment.usuarios;
  private mockUsuarios: (Usuario & { contrasena: string })[] = [
    { id: 1, nombre: 'Cliente Demo', correo: 'demo@tienda.com', contrasena: '123456' },
  ];

  registro(nombre: string, correo: string, contrasena: string): Observable<unknown> {
    if (environment.mock.usuarios) {
      if (this.mockUsuarios.some((u) => u.correo === correo)) {
        return throwError(() => new Error('El correo ya esta registrado'));
      }
      this.mockUsuarios.push({ id: this.mockUsuarios.length + 1, nombre, correo, contrasena });
      return of({}).pipe(delay(200));
    }
    return this.http.post<ApiRes<unknown>>(`${this.url}/registro`, { nombre, correo, contrasena }).pipe(map((r) => r.data));
  }

  login(correo: string, contrasena: string): Observable<SesionRespuesta> {
    if (environment.mock.usuarios) {
      const u = this.mockUsuarios.find((x) => x.correo === correo && x.contrasena === contrasena);
      if (!u) return throwError(() => new Error('Correo o contrasena incorrectos'));
      return of({ usuario: { id: u.id, nombre: u.nombre, correo: u.correo }, token: 'token-mock' }).pipe(delay(200));
    }
    return this.http.post<ApiRes<LoginRaw>>(`${this.url}/login`, { correo, contrasena }).pipe(
      map((r) => {
        const d = r.data;
        const usuario: Usuario = d.usuario ?? {
          id: d.id ?? d.usuario_id ?? 0,
          nombre: d.nombre ?? '',
          correo: d.correo ?? correo,
        };
        return { usuario, token: d.token ?? '' };
      }),
    );
  }

  obtener(id: number): Observable<Usuario> {
    if (environment.mock.usuarios) {
      const u = this.mockUsuarios.find((x) => x.id === id);
      return u ? of({ id: u.id, nombre: u.nombre, correo: u.correo }) : throwError(() => new Error('Usuario no encontrado'));
    }
    return this.http.get<ApiRes<Usuario>>(`${this.url}/${id}`).pipe(map((r) => r.data));
  }
}