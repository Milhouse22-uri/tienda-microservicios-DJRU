#!/usr/bin/env bash
J='Content-Type: application/json'
paso() { echo; echo "=== $1 ==="; }

paso "1. Registro y login (api-usuarios)"
curl -s -X POST localhost:8001/api/usuarios/registro -H "$J" -d '{"nombre":"Demo","correo":"demo@test.com","contrasena":"12345678"}'; echo
curl -s -X POST localhost:8001/api/usuarios/login -H "$J" -d '{"correo":"demo@test.com","contrasena":"12345678"}'; echo

paso "2. Catálogo, stock y reseñas"
curl -s localhost:8002/api/productos/1; echo
curl -s localhost:8004/api/inventario/1; echo
curl -s localhost:8008/api/resenas/producto/1; echo

paso "3. Carrito"
curl -s -X POST localhost:8005/api/carrito/1/agregar -H "$J" -d '{"producto_id":1,"nombre":"Producto 1","precio":350,"cantidad":2}'; echo

paso "4. Cotizar envío y crear pedido"
curl -s -X POST localhost:8003/api/envios/cotizar -H "$J" -d '{"codigo_postal":"38010","cantidad":2}'; echo
PEDIDO=$(curl -s -X POST localhost:8006/api/pedidos -H "$J" -d '{"usuario_id":1,"direccion":"Av. Tecnológico 1","codigo_postal":"38010","costo_envio":129,"items":[{"producto_id":1,"nombre":"Producto 1","cantidad":2,"precio_unitario":350}]}')
echo "$PEDIDO"
PEDIDO_ID=$(echo "$PEDIDO" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

paso "5. Pagar pedido $PEDIDO_ID"
curl -s -X POST localhost:8007/api/pagos/procesar -H "$J" -d "{\"pedido_id\":$PEDIDO_ID,\"usuario_id\":1,\"monto\":829,\"metodo_pago\":\"tarjeta\",\"items\":[{\"producto_id\":1,\"cantidad\":2}]}"; echo

paso "6. Verificación: stock bajó, carrito vacío, pedido pagado con guía"
curl -s localhost:8004/api/inventario/1; echo
curl -s localhost:8005/api/carrito/1; echo
curl -s localhost:8006/api/pedidos/usuario/1; echo
curl -s localhost:8007/api/pagos/pedido/$PEDIDO_ID; echo
