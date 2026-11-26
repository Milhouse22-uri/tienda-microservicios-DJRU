import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';
import { UsuariosService } from '../services/usuarios.service';
import { msgError } from '../utils';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  template: `
    <div class="panel centrado">
      <h1>{{ modo() === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}</h1>

      <div class="tabs">
        <button type="button" class="btn" [class.secundario]="modo() !== 'login'" (click)="cambiar('login')">Entrar</button>
        <button type="button" class="btn" [class.secundario]="modo() !== 'registro'" (click)="cambiar('registro')">Registrarme</button>
      </div>

      <form (ngSubmit)="enviar()">
        @if (modo() === 'registro') {
          <div class="campo">
            <label for="nombre">Nombre</label>
            <input id="nombre" name="nombre" [ngModel]="nombre()" (ngModelChange)="nombre.set($event)" required />
          </div>
        }
        <div class="campo">
          <label for="correo">Correo</label>
          <input id="correo" name="correo" type="email" [ngModel]="correo()" (ngModelChange)="correo.set($event)" required />
        </div>
        <div class="campo">
          <label for="contrasena">Contraseña</label>
          <input id="contrasena" name="contrasena" type="password" [ngModel]="contrasena()" (ngModelChange)="contrasena.set($event)" required />
        </div>

        @if (error()) { <p class="error">{{ error() }}</p> }

        <button class="btn" type="submit" [disabled]="cargando()">
          {{ cargando() ? 'Procesando...' : modo() === 'login' ? 'Entrar' : 'Crear cuenta' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginPage {
  private usuarios = inject(UsuariosService);
  private sesion = inject(SesionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  modo = signal<'login' | 'registro'>('login');
  nombre = signal('');
  correo = signal('');
  contrasena = signal('');
  error = signal('');
  cargando = signal(false);

  cambiar(m: 'login' | 'registro'): void {
    this.modo.set(m);
    this.error.set('');
  }

  enviar(): void {
    if (!this.correo().trim() || !this.contrasena() || (this.modo() === 'registro' && !this.nombre().trim())) {
      this.error.set('Completa todos los campos');
      return;
    }
    this.error.set('');
    this.cargando.set(true);

    if (this.modo() === 'registro') {
      this.usuarios.registro(this.nombre().trim(), this.correo().trim(), this.contrasena()).subscribe({
        next: () => this.entrar(),
        error: (e) => this.fallo(e),
      });
    } else {
      this.entrar();
    }
  }

  private entrar(): void {
    this.usuarios.login(this.correo().trim(), this.contrasena()).subscribe({
      next: (r) => {
        this.sesion.iniciar(r.usuario, r.token);
        this.cargando.set(false);
        const volver = this.route.snapshot.queryParamMap.get('volver');
        this.router.navigateByUrl(volver || '/');
      },
      error: (e) => this.fallo(e),
    });
  }

  private fallo(e: unknown): void {
    this.error.set(msgError(e));
    this.cargando.set(false);
  }
}