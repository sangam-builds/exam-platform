#!/usr/bin/env bash
set -e

echo "=== Exam Platform Dev Environment Setup ==="

# 1. Ensure env files exist
echo "--> Creating local environment files if missing..."
if [ ! -f .env ]; then
  cp .env.example .env
fi
if [ ! -f apps/backend/.env ]; then
  cp apps/backend/.env.example apps/backend/.env
fi
if [ ! -f apps/student-app/.env.local ]; then
  cp apps/student-app/.env.example apps/student-app/.env.local
fi
if [ ! -f apps/teacher-app/.env.local ]; then
  cp apps/teacher-app/.env.example apps/teacher-app/.env.local
fi
if [ ! -f apps/admin-app/.env.local ]; then
  cp apps/admin-app/.env.example apps/admin-app/.env.local
fi

# 2. Start Docker Compose services
echo "--> Starting Postgres and Redis containers..."
docker compose -f infra/docker/docker-compose.yml up -d

# 3. Install Monorepo Dependencies
echo "--> Installing dependencies..."
npm install

echo "=== Setup complete! ==="
echo "You can now run 'npm run dev' to start all apps, or 'cd apps/backend && npm run start:dev' for the backend."
