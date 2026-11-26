<?php

require_once __DIR__ . '/respuesta.php';

// Configuración CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Atender solicitudes OPTIONS del navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];
$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Endpoint de salud
if ($metodo === 'GET' && $ruta === '/health') {
    respuestaExitosa([
        'servicio' => 'api-productos'
    ]);
}

// Conexión con PostgreSQL
require_once __DIR__ . '/db.php';

try {

    // ==========================================
    // GET /api/productos
    // GET /api/productos?q=teclado
    // GET /api/productos?categoria=Ropa
    // GET /api/productos?q=teclado&categoria=Electrónica
    // ==========================================

    if ($metodo === 'GET' && $ruta === '/api/productos') {

        $q = trim($_GET['q'] ?? '');
        $categoria = trim($_GET['categoria'] ?? '');

        if (!is_string($_GET['q'] ?? '') ||
            !is_string($_GET['categoria'] ?? '')) {
            respuestaError('Los filtros deben ser texto', 400);
        }

        $sql = "SELECT id, nombre, descripcion, precio, categoria, imagen_url
                FROM productos
                WHERE 1=1";

        $parametros = [];

        // Filtro por nombre o descripción
        if ($q !== '') {
            $sql .= " AND (nombre ILIKE :q OR descripcion ILIKE :q)";
            $parametros[':q'] = "%$q%";
        }

        // Filtro por categoría
        if ($categoria !== '') {
            $sql .= " AND categoria ILIKE :categoria";
            $parametros[':categoria'] = $categoria;
        }

        $sql .= " ORDER BY id ASC";

        $consulta = $pdo->prepare($sql);
        $consulta->execute($parametros);

        $productos = $consulta->fetchAll();

        respuestaExitosa($productos);
    }

    // ==========================================
    // GET /api/productos/{id}
    // ==========================================

    if (
        $metodo === 'GET' &&
        preg_match('#^/api/productos/([0-9]+)$#', $ruta, $coincidencias)
    ) {

        $id = (int) $coincidencias[1];

        if ($id <= 0) {
            respuestaError('El ID debe ser mayor que cero', 400);
        }

        $consulta = $pdo->prepare(
            "SELECT id, nombre, descripcion, precio, categoria, imagen_url
             FROM productos
             WHERE id = :id"
        );

        $consulta->execute([
            ':id' => $id
        ]);

        $producto = $consulta->fetch();

        if (!$producto) {
            respuestaError('Producto no encontrado', 404);
        }

        respuestaExitosa($producto);
    }

    // ==========================================
    // POST /api/productos
    // ==========================================

    if ($metodo === 'POST' && $ruta === '/api/productos') {

        $contenido = file_get_contents('php://input');
        $datos = json_decode($contenido, true);

        // Validar JSON
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($datos)) {
            respuestaError('El cuerpo debe contener un objeto JSON válido', 400);
        }

        // Obtener los campos
        $nombre = $datos['nombre'] ?? null;
        $descripcion = $datos['descripcion'] ?? null;
        $precio = $datos['precio'] ?? null;
        $categoria = $datos['categoria'] ?? null;
        $imagenUrl = $datos['imagen_url'] ?? null;

        // Validar tipos de datos
        if (!is_string($nombre) || !is_string($categoria)) {
            respuestaError('El nombre y la categoría deben ser texto', 400);
        }

        if (
            ($descripcion !== null && !is_string($descripcion)) ||
            ($imagenUrl !== null && !is_string($imagenUrl))
        ) {
            respuestaError('La descripción y la imagen deben ser texto', 400);
        }

        $nombre = trim($nombre);
        $categoria = trim($categoria);

        // Validar campos obligatorios
        // Validar nombre
        if ($nombre === '') {
            respuestaError('El nombre del producto es obligatorio', 400);
        }

        // Validar precio
        if (
            $precio === null ||
            !is_numeric($precio) ||
            !is_finite((float) $precio)
        ) {
            respuestaError('El precio debe ser un número válido', 400);
        }

        if ($categoria === '') {
            respuestaError('La categoría es obligatoria', 400);
        }

        // Validar precio
        if (
            $precio === null ||
            !is_numeric($precio) ||
            !is_finite((float) $precio)
        ) {
            respuestaError('El precio debe ser un número válido', 400);
        }

        if ((float) $precio < 0) {
            respuestaError('El precio no puede ser negativo', 400);
        }

        // Validar longitud de campos
        if (mb_strlen($nombre) > 150) {
            respuestaError('El nombre no puede superar 150 caracteres', 400);
        }

        if (mb_strlen($categoria) > 50) {
            respuestaError('La categoría no puede superar 50 caracteres', 400);
        }

        // Registrar producto
        $consulta = $pdo->prepare(
            "INSERT INTO productos
                (nombre, descripcion, precio, categoria, imagen_url)
             VALUES
                (:nombre, :descripcion, :precio, :categoria, :imagen_url)
             RETURNING id, nombre, descripcion, precio, categoria, imagen_url"
        );

        $consulta->execute([
            ':nombre' => $nombre,
            ':descripcion' => $descripcion,
            ':precio' => $precio,
            ':categoria' => $categoria,
            ':imagen_url' => $imagenUrl
        ]);

        $producto = $consulta->fetch();

        respuestaExitosa($producto, 201);
    }

    // ==========================================
    // Ruta no encontrada
    // ==========================================

    respuestaError('Ruta no encontrada', 404);

} catch (Throwable $e) {

    // Registrar el error internamente
    error_log($e->getMessage());

    // No exponer detalles internos al cliente
    respuestaError('Error interno del servidor', 500);
}
