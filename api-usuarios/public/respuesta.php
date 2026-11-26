<?php

function ok($datos, $codigo = 200) {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        [
            'ok' => true,
            'data' => $datos
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function error($mensaje, $codigo = 400) {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        [
            'ok' => false,
            'error' => $mensaje
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}
