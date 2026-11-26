<?php

require_once __DIR__ . '/respuesta.php';

// Configuración CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responder solicitudes preliminares
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Endpoint de salud
$metodo = $_SERVER['REQUEST_METHOD'];
$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($metodo === 'GET' && $ruta === '/health') {
    ok(['servicio' => 'api-usuarios']);
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;

// Obtener y validar el cuerpo JSON
$datos = json_decode(file_get_contents('php://input'), true);

try {

    // REGISTRO DE USUARIOS
    if ($metodo === 'POST' && $ruta === '/api/usuarios/registro') {

        if (!is_array($datos)) {
            error('El cuerpo debe contener JSON válido', 400);
        }

        $nombre = $datos['nombre'] ?? '';
        $correo = $datos['correo'] ?? '';
        $contrasena = $datos['contrasena'] ?? '';

        if (
            !is_string($nombre) ||
            !is_string($correo) ||
            !is_string($contrasena)
        ) {
            error('Los campos deben ser texto', 400);
        }

        $nombre = trim($nombre);
        $correo = trim($correo);

        if ($nombre === '' || $correo === '' || $contrasena === '') {
            error('Todos los campos son obligatorios', 400);
        }

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            error('El correo electrónico no es válido', 400);
        }

        if (strlen($contrasena) < 8) {
            error('La contraseña debe tener al menos 8 caracteres', 400);
        }

        // Comprobar si el correo ya existe
        $consulta = $pdo->prepare(
            'SELECT id FROM usuarios WHERE correo = :correo'
        );

        $consulta->execute([':correo' => $correo]);

        if ($consulta->fetch()) {
            error('El correo ya está registrado', 400);
        }

        // Proteger la contraseña
        $hash = password_hash($contrasena, PASSWORD_DEFAULT);

        // Guardar usuario
        $consulta = $pdo->prepare(
            'INSERT INTO usuarios (nombre, correo, contrasena_hash)
             VALUES (:nombre, :correo, :hash)
             RETURNING id, nombre, correo, rol'
        );

        $consulta->execute([
            ':nombre' => $nombre,
            ':correo' => $correo,
            ':hash' => $hash
        ]);

        $usuario = $consulta->fetch();

        ok($usuario, 201);
    }

    // INICIO DE SESIÓN
    if ($metodo === 'POST' && $ruta === '/api/usuarios/login') {

        if (!is_array($datos)) {
            error('El cuerpo debe contener JSON válido', 400);
        }

        $correo = $datos['correo'] ?? '';
        $contrasena = $datos['contrasena'] ?? '';

        if (
            !is_string($correo) ||
            !is_string($contrasena) ||
            trim($correo) === '' ||
            $contrasena === ''
        ) {
            error('Correo y contraseña son obligatorios', 400);
        }

        $consulta = $pdo->prepare(
            'SELECT id, nombre, correo, contrasena_hash, rol
             FROM usuarios
             WHERE correo = :correo'
        );

        $consulta->execute([':correo' => trim($correo)]);

        $usuario = $consulta->fetch();

        if (
            !$usuario ||
            !password_verify($contrasena, $usuario['contrasena_hash'])
        ) {
            error('Credenciales incorrectas', 401);
        }

        $secreto = getenv('JWT_SECRET');

        if (!$secreto) {
            error('Configuración de autenticación no disponible', 500);
        }

        $ahora = time();

        $payload = [
            'iat' => $ahora,
            'exp' => $ahora + 86400,
            'sub' => (string) $usuario['id'],
            'correo' => $usuario['correo'],
            'rol' => $usuario['rol']
        ];

        $token = JWT::encode($payload, $secreto, 'HS256');

        unset($usuario['contrasena_hash']);

        ok([
            'token' => $token,
            'usuario' => $usuario
        ]);
    }

    // CONSULTAR PERFIL POR ID
    if (
        $metodo === 'GET' &&
        preg_match('#^/api/usuarios/([0-9]+)$#', $ruta, $coincidencias)
    ) {

        $id = (int) $coincidencias[1];

        if ($id <= 0) {
            error('ID de usuario inválido', 400);
        }

        $consulta = $pdo->prepare(
            'SELECT id, nombre, correo, rol, creado_en
             FROM usuarios
             WHERE id = :id'
        );

        $consulta->execute([':id' => $id]);

        $usuario = $consulta->fetch();

        if (!$usuario) {
            error('Usuario no encontrado', 404);
        }

        ok($usuario);
    }

    error('Ruta no encontrada', 404);

} catch (Throwable $e) {

    error_log($e->getMessage());

    error('Error interno del servidor', 500);
}