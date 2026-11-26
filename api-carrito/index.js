const express = require('express');
const cors = require('cors');

const app = express();

// CORS abierto: GET, POST, PATCH, DELETE, OPTIONS. OPTIONS responde 204.
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

// usuario_id -> [{ producto_id, nombre, precio, cantidad }]
const carritos = new Map();

const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data });
const fail = (res, status, error) => res.status(status).json({ ok: false, error });

function armarCarrito(usuarioId) {
  const items = carritos.get(usuarioId) || [];
  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  return {
    usuario_id: usuarioId,
    items,
    total: Math.round(total * 100) / 100,
  };
}

function parseId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'api-carrito' }));

// Obtener carrito
app.get('/api/carrito/:usuario_id', (req, res) => {
  const usuarioId = parseId(req.params.usuario_id);
  if (usuarioId === null) return fail(res, 400, 'usuario_id invalido');
  return ok(res, armarCarrito(usuarioId));
});

// Agregar producto (suma cantidad si ya existe)
app.post('/api/carrito/:usuario_id/agregar', (req, res) => {
  const usuarioId = parseId(req.params.usuario_id);
  if (usuarioId === null) return fail(res, 400, 'usuario_id invalido');

  const { producto_id, nombre, precio, cantidad } = req.body || {};
  const productoId = parseId(producto_id);
  const cant = Number(cantidad);
  const precioNum = Number(precio);

  if (productoId === null) return fail(res, 400, 'producto_id invalido');
  if (!Number.isInteger(cant) || cant <= 0) return fail(res, 400, 'cantidad debe ser un entero mayor a 0');
  if (!Number.isFinite(precioNum) || precioNum < 0) return fail(res, 400, 'precio invalido');
  if (typeof nombre !== 'string' || nombre.trim() === '') return fail(res, 400, 'nombre requerido');

  const items = carritos.get(usuarioId) || [];
  const existente = items.find((i) => i.producto_id === productoId);
  if (existente) {
    existente.cantidad += cant;
    existente.precio = precioNum;
    existente.nombre = nombre;
  } else {
    items.push({ producto_id: productoId, nombre, precio: precioNum, cantidad: cant });
  }
  carritos.set(usuarioId, items);

  return ok(res, armarCarrito(usuarioId));
});

// Quitar un articulo (extra para la vista del carrito)
app.delete('/api/carrito/:usuario_id/item/:producto_id', (req, res) => {
  const usuarioId = parseId(req.params.usuario_id);
  const productoId = parseId(req.params.producto_id);
  if (usuarioId === null) return fail(res, 400, 'usuario_id invalido');
  if (productoId === null) return fail(res, 400, 'producto_id invalido');

  const items = carritos.get(usuarioId) || [];
  const restantes = items.filter((i) => i.producto_id !== productoId);
  if (restantes.length === items.length) return fail(res, 404, 'producto no esta en el carrito');
  carritos.set(usuarioId, restantes);

  return ok(res, armarCarrito(usuarioId));
});

// Vaciar carrito (lo llama api-pagos al aprobar el pago)
app.delete('/api/carrito/:usuario_id/vaciar', (req, res) => {
  const usuarioId = parseId(req.params.usuario_id);
  if (usuarioId === null) return fail(res, 400, 'usuario_id invalido');
  carritos.set(usuarioId, []);
  return ok(res, armarCarrito(usuarioId));
});

// 404 para rutas desconocidas
app.use((req, res) => fail(res, 404, 'ruta no encontrada'));

// JSON malformado y otros errores
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'JSON invalido');
  console.error(err);
  return fail(res, 500, 'error interno');
});

const PORT = process.env.PORT || 8005;
app.listen(PORT, '0.0.0.0', () => console.log(`api-carrito escuchando en 0.0.0.0:${PORT}`));