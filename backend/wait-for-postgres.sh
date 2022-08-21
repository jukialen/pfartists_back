#!/bin/sh

# wait-for-postgres.sh
until PGPASSWORD=${POSTGRES_PASSWORD:-adminpass12} PGUSER=${POSTGRES_USER:-postgres} PGHOST=${POSTGRES_DB_HOST:-postgres} PGDATABASE=${POSTGRES_DB_PREFIX:-db}"_"${POSTGRES_DB_NAME:-pfartists_local} psql -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up"
exec "$@"