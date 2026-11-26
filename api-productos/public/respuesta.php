<?php

function responder($codigo, $contenido) {
    http_response_code($codigo);

    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function respuestaExitosa($datos, $codigo = 200) {
    responder($codigo, [
        'ok' => true,
        'data' => $datos
    ]);
}

function respuestaError($mensaje, $codigo = 400) {
    responder($codigo, [
        'ok' => false,
        'error' => $mensaje
    ]);
}
