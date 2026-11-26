<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/respuesta.php';


header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];
$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {

    // CONEXION A POSTGRESQL
    $db = conectarDB();

    if ($metodo === 'GET' && $ruta === '/health') {
        respuestaExitosa(200, [
            'servicio' => 'api-pedidos'
        ]);
    }


    // POST /api/pedidos
    // Crear un pedido y sus productos
    if ($metodo === 'POST' && $ruta === '/api/pedidos') {

        $datos = json_decode(file_get_contents('php://input'), true);

        if (!is_array($datos)) {
            respuestaError(400, 'JSON invalido');
        }

        $usuarioId = $datos['usuario_id'] ?? null;
        $direccion = trim($datos['direccion'] ?? '');
        $codigoPostal = trim($datos['codigo_postal'] ?? '');
        $costoEnvio = $datos['costo_envio'] ?? null;
        $items = $datos['items'] ?? null;

        if (!is_numeric($usuarioId) || (int)$usuarioId <= 0) {
            respuestaError(400, 'usuario_id debe ser un entero positivo');
        }

        if ($direccion === '') {
            respuestaError(400, 'direccion es obligatoria');
        }

        if ($codigoPostal === '') {
            respuestaError(400, 'codigo_postal es obligatorio');
        }

        if (!is_numeric($costoEnvio) || !is_finite((float)$costoEnvio) || (float)$costoEnvio < 0) {
            respuestaError(400, 'costo_envio debe ser un numero mayor o igual a 0');
        }

        if (!is_array($items) || count($items) === 0) {
            respuestaError(400, 'items debe contener al menos un producto');
        }

        $subtotal = 0;
        $itemsValidados = [];

        foreach ($items as $item) {

            $productoId = $item['producto_id'] ?? null;
            $nombre = trim($item['nombre'] ?? '');
            $cantidad = $item['cantidad'] ?? null;
            $precio = $item['precio_unitario'] ?? null;

            if (
                !is_numeric($productoId) ||
                (int)$productoId <= 0 ||
                !is_int($productoId) && !ctype_digit((string)$productoId)
            ) {
                respuestaError(400, 'producto_id debe ser un entero positivo');
            }

            if ($nombre === '') {
                respuestaError(400, 'El nombre de cada producto es obligatorio');
            }

            if (
                !is_numeric($cantidad) ||
                (int)$cantidad <= 0 ||
                (string)(int)$cantidad !== (string)$cantidad
            ) {
                respuestaError(400, 'cantidad debe ser un entero positivo');
            }

            if (
                !is_numeric($precio) ||
                !is_finite((float)$precio) ||
                (float)$precio < 0
            ) {
                respuestaError(400, 'precio_unitario debe ser mayor o igual a 0');
            }

            $precio = number_format((float)$precio, 2, '.', '');
            $cantidad = (int)$cantidad;

            $subtotal += $cantidad * (float)$precio;

            $itemsValidados[] = [
                'producto_id' => (int)$productoId,
                'nombre' => $nombre,
                'cantidad' => $cantidad,
                'precio_unitario' => $precio
            ];
        }

        $subtotal = number_format($subtotal, 2, '.', '');
        $costoEnvio = number_format((float)$costoEnvio, 2, '.', '');
        $total = number_format(
            (float)$subtotal + (float)$costoEnvio,
            2,
            '.',
            ''
        );

        try {

            $db->beginTransaction();

            // Insertar pedido principal
            $sqlPedido = "
                INSERT INTO pedidos (
                    usuario_id,
                    direccion,
                    codigo_postal,
                    subtotal,
                    costo_envio,
                    total
                )
                VALUES (
                    :usuario_id,
                    :direccion,
                    :codigo_postal,
                    :subtotal,
                    :costo_envio,
                    :total
                )
                RETURNING id
            ";

            $stmt = $db->prepare($sqlPedido);

            $stmt->execute([
                ':usuario_id' => (int)$usuarioId,
                ':direccion' => $direccion,
                ':codigo_postal' => $codigoPostal,
                ':subtotal' => $subtotal,
                ':costo_envio' => $costoEnvio,
                ':total' => $total
            ]);

            $pedidoId = (int)$stmt->fetchColumn();

            // Insertar productos del pedido
            $sqlItem = "
                INSERT INTO pedido_items (
                    pedido_id,
                    producto_id,
                    nombre,
                    cantidad,
                    precio_unitario
                )
                VALUES (
                    :pedido_id,
                    :producto_id,
                    :nombre,
                    :cantidad,
                    :precio_unitario
                )
            ";

            $stmtItem = $db->prepare($sqlItem);

            foreach ($itemsValidados as $item) {
                $stmtItem->execute([
                    ':pedido_id' => $pedidoId,
                    ':producto_id' => $item['producto_id'],
                    ':nombre' => $item['nombre'],
                    ':cantidad' => $item['cantidad'],
                    ':precio_unitario' => $item['precio_unitario']
                ]);
            }

            $db->commit();

            respuestaExitosa(201, [
                'id' => $pedidoId,
                'usuario_id' => (int)$usuarioId,
                'direccion' => $direccion,
                'codigo_postal' => $codigoPostal,
                'subtotal' => $subtotal,
                'costo_envio' => $costoEnvio,
                'total' => $total,
                'estado' => 'pendiente',
                'items' => $itemsValidados
            ]);

        } catch (Throwable $e) {

            if ($db->inTransaction()) {
                $db->rollBack();
            }

            throw $e;
        }
    }

    // GET /api/pedidos/usuario/{usuario_id}
    // Consultar pedidos de un usuario
    if (
        $metodo === 'GET' &&
        preg_match('#^/api/pedidos/usuario/([0-9]+)$#', $ruta, $coincidencias)
    ) {

        $usuarioId = (int)$coincidencias[1];

        if ($usuarioId <= 0) {
            respuestaError(400, 'usuario_id invalido');
        }

        $sql = "
            SELECT
                id,
                usuario_id,
                direccion,
                codigo_postal,
                subtotal,
                costo_envio,
                total,
                estado,
                guia,
                creado_en
            FROM pedidos
            WHERE usuario_id = :usuario_id
            ORDER BY creado_en DESC, id DESC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([':usuario_id' => $usuarioId]);

        $pedidos = $stmt->fetchAll();

        $sqlItems = "
            SELECT
                id,
                producto_id,
                nombre,
                cantidad,
                precio_unitario
            FROM pedido_items
            WHERE pedido_id = :pedido_id
            ORDER BY id ASC
        ";

        $stmtItems = $db->prepare($sqlItems);

        foreach ($pedidos as &$pedido) {

            $stmtItems->execute([
                ':pedido_id' => $pedido['id']
            ]);

            $pedido['items'] = $stmtItems->fetchAll();
        }

        unset($pedido);

        respuestaExitosa(200, $pedidos);
    }

    // PATCH /api/pedidos/{id}/estado
    // Actualizar estado y guia
    if (
        $metodo === 'PATCH' &&
        preg_match('#^/api/pedidos/([0-9]+)/estado$#', $ruta, $coincidencias)
    ) {

        $pedidoId = (int)$coincidencias[1];

        if ($pedidoId <= 0) {
            respuestaError(400, 'ID de pedido invalido');
        }

        $datos = json_decode(file_get_contents('php://input'), true);

        if (!is_array($datos)) {
            respuestaError(400, 'JSON invalido');
        }

        $estado = strtolower(trim($datos['estado'] ?? ''));

        $estadosPermitidos = [
            'pendiente',
            'pagado',
            'enviado',
            'cancelado'
        ];

        if (!in_array($estado, $estadosPermitidos, true)) {
            respuestaError(400, 'Estado de pedido no permitido');
        }

        $guia = $datos['guia'] ?? null;

        if ($guia !== null) {
            if (!is_string($guia) || trim($guia) === '') {
                respuestaError(400, 'guia debe ser una cadena no vacia');
            }

            $guia = trim($guia);
        }

        $sql = "
            UPDATE pedidos
            SET
                estado = :estado,
                guia = COALESCE(:guia, guia)
            WHERE id = :id
            RETURNING
                id,
                usuario_id,
                direccion,
                codigo_postal,
                subtotal,
                costo_envio,
                total,
                estado,
                guia,
                creado_en
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':estado' => $estado,
            ':guia' => $guia,
            ':id' => $pedidoId
        ]);
        $pedido = $stmt->fetch();
        if (!$pedido) {
            respuestaError(404, 'Pedido no encontrado');
        }
        respuestaExitosa(200, $pedido);
    }
    // RUTA NO ENCONTRADA
    respuestaError(404, 'Endpoint no encontrado');

} catch (Throwable $e) {
    error_log('Error en api-pedidos: ' . $e->getMessage());
    respuestaError(500, 'Error interno del servidor');
}
