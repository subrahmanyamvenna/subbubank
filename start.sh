#!/usr/bin/env bash
# Start script for Render — runs migrations and seeds before starting gunicorn
set -o errexit

cd backend

echo "Running migrations..."
python manage.py migrate --no-input

echo "Checking if database needs seeding..."
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'subbu_bank.settings')
django.setup()
from accounts.models import User
if not User.objects.exists():
    exec(open('seed_data.py').read())
    print('Database seeded with dummy data!')
else:
    print('Database already has data, skipping seed.')
"

echo "Starting gunicorn..."
exec gunicorn subbu_bank.wsgi:application --bind 0.0.0.0:$PORT
