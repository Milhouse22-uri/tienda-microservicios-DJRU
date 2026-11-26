CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    direccion TEXT NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    costo_envio NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    guia VARCHAR(100),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pedido_estado
    CHECK (estado IN ('pendiente', 'pagado', 'enviado', 'cancelado'))
);

CREATE TABLE IF NOT EXISTS pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,

    CONSTRAINT fk_pedido_items
    FOREIGN KEY (pedido_id)
    REFERENCES pedidos(id)
    ON DELETE CASCADE,

    CONSTRAINT chk_item_cantidad
    CHECK (cantidad > 0),

    CONSTRAINT chk_item_precio
    CHECK (precio_unitario >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario
ON pedidos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha
ON pedidos(creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido
ON pedido_items(pedido_id);
