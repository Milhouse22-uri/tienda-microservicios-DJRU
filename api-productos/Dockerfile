FROM php:8.3-cli

# Instalar dependencias necesarias para PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo dentro del contenedor
WORKDIR /var/www/html

# Copiar los archivos de la API
COPY public/ ./public/

# Puerto del microservicio
EXPOSE 8002

# Iniciar el servidor PHP
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8002} -t public public/index.php"]
