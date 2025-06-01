#!/bin/sh
# wait-for-postgres.sh

set -e

host="$POSTGRES_HOST"
port="$POSTGRES_PORT"
user="$POSTGRES_USER"
password="$POSTGRES_PASSWORD"
database="$POSTGRES_DB"

echo "Checking compiled files..."
if [ ! -d "/app/dist" ] || [ ! -f "/app/dist/index.js" ]; then
  echo "Error: TypeScript compilation failed - dist/index.js is missing!"
  echo "Contents of /app directory:"
  ls -la /app
  
  echo "Trying to compile TypeScript manually..."
  npm run build
  
  if [ ! -f "/app/dist/index.js" ]; then
    echo "Failed to compile TypeScript. Exiting."
    exit 1
  fi
fi
echo "Compiled files OK"

echo "Waiting for PostgreSQL to start..."

until PGPASSWORD=$password psql -h "$host" -U "$user" -d "$database" -c '\q'; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

>&2 echo "PostgreSQL is up - executing command"
exec "$@" 