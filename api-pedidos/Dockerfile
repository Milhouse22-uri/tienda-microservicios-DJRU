FROM php:8.3-cli

# Instalar dependencias de PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Copiar archivos de la API
COPY public/ ./public/

# Puerto del microservicio
EXPOSE 8006

# Iniciar servidor PHP
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8006} -t public public/index.php"]
