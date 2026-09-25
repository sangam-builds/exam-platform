# Windows PowerShell Dev Environment Setup Script
Write-Host "=== Exam Platform Dev Environment Setup ===" -ForegroundColor Cyan

# 1. Ensure env files exist
Write-Host "--> Creating local environment files if missing..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
if (-not (Test-Path "apps\backend\.env")) { Copy-Item "apps\backend\.env.example" "apps\backend\.env" }
if (-not (Test-Path "apps\student-app\.env.local")) { Copy-Item "apps\student-app\.env.example" "apps\student-app\.env.local" }
if (-not (Test-Path "apps\teacher-app\.env.local")) { Copy-Item "apps\teacher-app\.env.example" "apps\teacher-app\.env.local" }
if (-not (Test-Path "apps\admin-app\.env.local")) { Copy-Item "apps\admin-app\.env.example" "apps\admin-app\.env.local" }

# 2. Start Docker Compose services
Write-Host "--> Starting Postgres and Redis containers..." -ForegroundColor Yellow
docker compose -f infra/docker/docker-compose.yml up -d

# 3. Install Monorepo Dependencies
Write-Host "--> Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "=== Setup complete! ===" -ForegroundColor Green
Write-Host "Run 'npm run dev' to start all apps or 'cd apps/backend; npm run start:dev' for the backend." -ForegroundColor Green
