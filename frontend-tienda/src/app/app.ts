import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SesionService } from './services/sesion.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  sesion = inject(SesionService);
  private router = inject(Router);

  tema = signal<'oscuro' | 'claro'>(this.leerTema());

  constructor() {
    effect(() => {
      const t = this.tema();
      document.documentElement.setAttribute('data-theme', t === 'claro' ? 'light' : 'dark');
      try {
        localStorage.setItem('tema', t);
      } catch {
        /* sin almacenamiento */
      }
    });
  }

  private leerTema(): 'oscuro' | 'claro' {
    try {
      return localStorage.getItem('tema') === 'claro' ? 'claro' : 'oscuro';
    } catch {
      return 'oscuro';
    }
  }

  cambiarTema(): void {
    this.tema.update((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));
  }

  salir(): void {
    this.sesion.cerrar();
    this.router.navigateByUrl('/login');
  }
}