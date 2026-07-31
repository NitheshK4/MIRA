FROM php:8.2-cli-alpine

# Install curl extension and dependencies
RUN apk add --no-cache curl-dev libcurl \
    && docker-php-ext-install curl

WORKDIR /app

# Copy PHP portal code
COPY php/ /app/php/

EXPOSE 8000

ENV MIRA_API_URL=http://node:3000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "php"]
