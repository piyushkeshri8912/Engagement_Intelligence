# Engagement Intelligence Setup Script
Write-Host "🚀 Setting up Engagement & Retention Intelligence Layer..." -ForegroundColor Green

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Test-Command "node")) {
    Write-Host "❌ Node.js is required but not installed." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

if (!(Test-Command "docker")) {
    Write-Host "❌ Docker is required but not installed." -ForegroundColor Red
    Write-Host "Please install Docker from https://docker.com/" -ForegroundColor Red
    exit 1
}

if (!(Test-Command "docker-compose")) {
    Write-Host "❌ Docker Compose is required but not installed." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed!" -ForegroundColor Green

# Create environment file
Write-Host "📝 Setting up environment configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "⚠️  Please review and update the .env file with your specific configuration" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Set-Location "frontend"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    Set-Location ".."
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend directory not found" -ForegroundColor Yellow
}

# Create logs directory
Write-Host "📁 Creating logs directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
Write-Host "✅ Logs directory created" -ForegroundColor Green

# Build and start services with Docker
Write-Host "🐳 Building and starting Docker services..." -ForegroundColor Yellow
docker-compose up --build -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

# Check main app
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Main application is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Main application health check failed" -ForegroundColor Yellow
}

# Check ML service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ML service is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  ML service health check failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application is now running at:" -ForegroundColor Cyan
Write-Host "   Main App:      http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend:      http://localhost:3001" -ForegroundColor White  
Write-Host "   ML Service:    http://localhost:5000" -ForegroundColor White
Write-Host "   PostgreSQL:    localhost:5432" -ForegroundColor White
Write-Host "   Redis:         localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📚 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:           docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop services:       docker-compose down" -ForegroundColor White
Write-Host "   Restart services:    docker-compose restart" -ForegroundColor White
Write-Host "   Run tests:           npm test" -ForegroundColor White
Write-Host "   Check health:        curl http://localhost:3000/health" -ForegroundColor White
Write-Host ""
Write-Host "📖 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review the .env file and update configuration as needed" -ForegroundColor White
Write-Host "   2. Access the dashboard at http://localhost:3000" -ForegroundColor White
Write-Host "   3. Check the WARP.md file for detailed documentation" -ForegroundColor White
