// URLs de las APIs (las llama el navegador, por eso son localhost).
// mock: true = datos falsos en el servicio. Cambia a false cuando la API real este lista.
// El carrito siempre usa la API real (api-carrito).
export const environment = {
  usuarios: 'http://localhost:8001/api/usuarios',
  productos: 'http://localhost:8002/api/productos',
  envios: 'http://localhost:8003/api/envios',
  inventario: 'http://localhost:8004/api/inventario',
  carrito: 'http://localhost:8005/api/carrito',
  pedidos: 'http://localhost:8006/api/pedidos',
  pagos: 'http://localhost:8007/api/pagos',
  resenas: 'http://localhost:8008/api/resenas',
  mock: {
    usuarios: false,
    productos: false,
    inventario: false,
    resenas: false,
    envios: false,
    pedidos: false,
    pagos: false,
  },
};