import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

// Protege /carrito y /pedidos: si no hay usuario, manda a /login
export const authGuard: CanActivateFn = (_route, state) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return sesion.usuario() ? true : router.createUrlTree(['/login'], { queryParams: { volver: state.url } });
};