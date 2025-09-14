#!/bin/sh
set -e

until nc -z db 5432; do
  echo "Waiting for database..."
  sleep 1
done

echo "Database is up!"
