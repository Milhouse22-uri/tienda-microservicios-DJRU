<?php

function conectarDB(): PDO
{
    $host = getenv('DB_HOST') ?: 'localhost';
    $port = getenv('DB_PORT') ?: '5432';
    $dbname = getenv('DB_NAME') ?: 'pedidos_db';
    $user = getenv('DB_USER') ?: 'tienda';
    $password = getenv('DB_PASSWORD') ?: 'tienda123';

    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";

    try {
        return new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
    } catch (PDOException $e) {
        error_log("Error de conexion a PostgreSQL: " . $e->getMessage());

        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'ok' => false,
            'error' => 'Error de conexion con la base de datos'
        ]);

        exit;
    }
}
