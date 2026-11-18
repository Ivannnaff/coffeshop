#!/usr/bin/env bash
set -euo pipefail

# Deploy Menanti. Sesuaikan APP_DIR.
APP_DIR="/var/www/menanti"
cd "$APP_DIR"

php artisan down --retry=60 || true
trap 'php artisan up || true' EXIT

git pull --ff-only
composer install --no-dev --optimize-autoloader --no-interaction
npm ci
npm run build

php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart

php artisan up

echo "Deploy selesai. Cek /health dan log queue."
