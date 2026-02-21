#!/usr/bin/env bash
# Build script for Render deployment
set -o errexit

pip install -r requirements.txt

cd backend
python manage.py collectstatic --no-input
python manage.py migrate --no-input

echo "Checking if database needs seeding..."
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'subbu_bank.settings')
django.setup()
from accounts.models import User
if not User.objects.exists():
    exec(open('seed_data.py').read())
    print('Database seeded!')
else:
    print('Database already has data.')
"

echo "Build complete!"
