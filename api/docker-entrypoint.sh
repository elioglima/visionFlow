#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
  sleep 1
done

echo "Running migrations..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_DATABASE" -f /app/database/init.sql

echo "Starting API server..."
exec node --import tsx bin/server.ts
