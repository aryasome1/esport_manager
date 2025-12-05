# eSports MOBA Manager - Setup Guide

## 🚀 Quick Start

This guide will help you set up the complete eSports MOBA Manager system with both frontend (Expo Go) and backend (FastAPI) components.

## 📋 Prerequisites

### System Requirements
- Node.js 16+ and npm/yarn
- Python 3.8+
- PostgreSQL 12+
- Git
- Expo CLI (`npm install -g @expo/cli`)

### Required Accounts
- Expo account for mobile app building
- Database hosting (PostgreSQL) - can use local development

## 🏗️ Backend Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd esport-manager

# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Configuration

```bash
# Install PostgreSQL (if not already installed)
# Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib
# macOS: brew install postgresql
# Windows: Download from postgresql.org

# Create database
sudo -u postgres psql
CREATE DATABASE esports_moba_manager;
CREATE USER esports_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE esports_moba_manager TO esports_user;

# Run migrations
cd backend
alembic upgrade head
```

### 3. Environment Configuration

Create `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://esports_user:your_password@localhost/esports_moba_manager

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:19006

# WebSocket Configuration
WS_HOST=localhost
WS_PORT=8001

# Redis (for caching and sessions)
REDIS_URL=redis://localhost:6379/0
```

### 4. Start Backend Server

```bash
# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# The API will be available at http://localhost:8000
# API documentation at http://localhost:8000/docs
```

## 📱 Frontend Setup

### 1. Install Dependencies

```bash
# Navigate to frontend
cd frontend

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli

# Install dependencies
npm install
```

### 2. Environment Configuration

Create `.env` file in the frontend directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_WS_URL=ws://localhost:8000/ws

# Development Configuration
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_ENVIRONMENT=development
```

### 3. Configure Expo

Update `app.json` (or `app.config.js`):

```json
{
  "expo": {
    "name": "eSports MOBA Manager",
    "slug": "esport-manager",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.esportsmanager.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.esportsmanager.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### 4. Start Frontend Development Server

```bash
# Start Expo development server
npx expo start

# This will open Expo Developer Tools in your browser
# You can run the app on:
# - Physical device: Scan QR code with Expo Go app
# - Emulator: Press 'a' for Android or 'i' for iOS
# - Web browser: Press 'w'
```

## 🔧 Development Workflow

### Backend Development

```bash
# Terminal 1: Start backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Run tests
cd backend
pytest

# Terminal 3: Database migrations
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### Frontend Development

```bash
# Terminal 1: Start Expo server
cd frontend
npx expo start

# Terminal 2: Run linting
cd frontend
npm run lint

# Terminal 3: Run tests
cd frontend
npm test
```

## 🚀 Production Deployment

### Backend Deployment

#### Using Docker

Create `Dockerfile` for backend:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t esports-backend .
docker run -p 8000:8000 --env-file .env esports-backend
```

#### Using Cloud Services

- **Heroku**: Use the Heroku Python buildpack
- **AWS ECS**: Deploy using ECS Fargate
- **Google Cloud Run**: Deploy as a container
- **Railway**: Simple deployment platform

### Frontend Deployment

#### Expo Application Services (EAS)

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Deploy to app stores
eas submit --platform ios
eas submit --platform android
```

## 🔒 Security Configuration

### Backend Security

```python
# app/main.py additions
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Add security middleware
app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
)

# CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Environment Variables

```env
# Production .env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-super-secure-secret-key
CORS_ORIGINS=https://yourdomain.com
DEBUG=false
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

## 📊 Monitoring and Logging

### Backend Logging

```python
# app/utils/logging.py
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Database connection
curl http://localhost:8000/api/health/database
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest --cov=app tests/

# Run specific test files
pytest tests/test_draft.py -v
pytest tests/test_auth.py -v
```

### Frontend Tests

```bash
cd frontend
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (if using Detox)
npm run test:e2e
```

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL status
   sudo service postgresql status
   
   # Check database exists
   psql -U esports_user -d esports_moba_manager
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port 8000
   lsof -i :8000
   
   # Kill process
   kill -9 <PID>
   ```

3. **Expo Build Errors**
   ```bash
   # Clear Expo cache
   npx expo r -c
   
   # Reset Metro bundler
   npx react-native start --reset-cache
   ```

4. **WebSocket Connection Failed**
   ```bash
   # Check firewall settings
   # Ensure WebSocket endpoints are accessible
   # Verify CORS configuration
   ```

### Debug Mode

```bash
# Backend debug
export DEBUG=true
uvicorn app.main:app --reload --log-level debug

# Frontend debug
export EXPO_PUBLIC_DEBUG=true
npx expo start --debug
```

## 📞 Support

For additional help:
1. Check the [API documentation](http://localhost:8000/docs)
2. Review the [project structure](./PROJECT_STRUCTURE.md)
3. Check issue logs for common problems
4. Ensure all prerequisites are correctly installed

---

**Happy coding! 🎮⚡**