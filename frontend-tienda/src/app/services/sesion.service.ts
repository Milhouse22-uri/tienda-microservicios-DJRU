import { Injectable, signal } from '@angular/core';
import { Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class SesionService {
  readonly usuario = signal<Usuario | null>(this.leer());

  private leer(): Usuario | null {
    try {
      const u = localStorage.getItem('usuario');
      return u ? (JSON.parse(u) as Usuario) : null;
    } catch {
      return null;
    }
  }

  iniciar(usuario: Usuario, token: string): void {
    try {
      localStorage.setItem('usuario', JSON.stringify(usuario));
      localStorage.setItem('token', token ?? '');
    } catch {
      /* sin almacenamiento: la sesion dura mientras no se recargue */
    }
    this.usuario.set(usuario);
  }

  cerrar(): void {
    try {
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
    } catch {
      /* nada */
    }
    this.usuario.set(null);
  }
}