CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    imagen_url TEXT
);

INSERT INTO productos (
    id,
    nombre,
    descripcion,
    precio,
    categoria,
    imagen_url
)
VALUES
(   
    1,
    'Audífonos Bluetooth',
    'Audífonos inalámbricos con conexión Bluetooth y diseño ergonómico.',
    599.00,
    'Electrónica',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'
),
(   
    2,
    'Teclado mecánico',
    'Teclado mecánico para computadora, ideal para trabajo y videojuegos.',
    899.00,
    'Electrónica',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'
),
(
    3,
    'Playera básica',
    'Playera casual de diseño sencillo para uso diario.',
    249.00,
    'Ropa',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'
),
(
    4,
    'Sudadera casual',
    'Sudadera cómoda de estilo casual para uso diario.',
    499.00,
    'Ropa',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'
),
(
    5,
    'Lámpara de escritorio',
    'Lámpara de escritorio para iluminar espacios de trabajo y estudio.',
    349.00,
    'Hogar',
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600'
),
(
    6,
    'Organizador multiusos',
    'Organizador para mantener en orden objetos y accesorios del hogar.',
    199.00,
    'Hogar',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'
)
ON CONFLICT (id) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('productos', 'id'),
    (SELECT MAX(id) FROM productos),
    true
);

SELECT * FROM productos ORDER BY id;
