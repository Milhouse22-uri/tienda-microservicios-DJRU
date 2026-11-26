<?php

function responder(int $codigo, array $contenido): void
{
    http_response_code($codigo);

    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function respuestaExitosa(
    int $codigo,
    mixed $data
): void {
    responder($codigo, [
        'ok' => true,
        'data' => $data
    ]);
}

function respuestaError(
    int $codigo,
    string $mensaje
): void {
    responder($codigo, [
        'ok' => false,
        'error' => $mensaje
    ]);
}
