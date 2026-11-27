import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { CarritoPage } from './pages/carrito.page';
import { CatalogoPage } from './pages/catalogo.page';
import { DetallePage } from './pages/detalle.page';
import { LoginPage } from './pages/login.page';
import { PedidosPage } from './pages/pedidos.page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'carrito', component: CarritoPage, canActivate: [authGuard] },
  { path: 'pedidos', component: PedidosPage, canActivate: [authGuard] },
  {
    path: '',
    component: CatalogoPage,
    children: [{ path: 'producto/:id', component: DetallePage }],
  },
  { path: '**', redirectTo: '' },
];