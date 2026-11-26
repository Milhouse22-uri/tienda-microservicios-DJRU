import { Component, inject } from '@angular/core';
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

  salir(): void {
    this.sesion.cerrar();
    this.router.navigateByUrl('/login');
  }
}