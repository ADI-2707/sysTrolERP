#!/bin/sh
set -e

if [ "$1" = "gunicorn" ] || [ "$1" = "runserver" ]; then
    echo "Running database migrations..."
    python manage.py migrate --noinput

    echo "Collecting static files..."
    python manage.py collectstatic --noinput
fi

exec "$@"
