# Etapa 1: instalar dependencias PHP
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --optimize-autoloader

# Etapa 2: construir el contenedor PHP
FROM php:8.3-cli

RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY --from=vendor /app/vendor/ ./vendor/
COPY public/ ./public/

EXPOSE 8001

CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8001} -t public public/index.php"]
