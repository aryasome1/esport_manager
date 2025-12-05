# Environment Setup Guide

This guide will help you set up the environment variables for both the backend and frontend to run the full application with your database.

## 📋 Prerequisites

- PostgreSQL database created and running
- Python 3.9+ installed
- Node.js and npm installed
- Backend dependencies installed
- Frontend dependencies installed

## 🔧 Backend Environment Setup

### Step 1: Create Backend `.env` File

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.example .env
   
   # On Linux/Mac
   cp .env.example .env
   ```

3. Open `.env` file and update with your database credentials:

```env
# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=esport_manager
DB_USERNAME=postgres
DB_PASSWORD=your_actual_password

# Security Configuration
SECRET_KEY=your-secret-key-minimum-32-characters-long-change-this-in-production
```

### Step 2: Generate a Secure Secret Key (Optional but Recommended)

For production, generate a secure secret key:

```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 3: Verify Database Connection

Make sure your PostgreSQL database is running and accessible with the credentials you specified.

## 🎨 Frontend Environment Setup

### Step 1: Create Frontend `.env` File

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Copy the example environment file:
   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.example .env
   
   # On Linux/Mac
   cp .env.example .env
   ```

3. Open `.env` file and verify the API URL (default should work for local development):

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_WS_URL=ws://localhost:8000/ws

# Development Configuration
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_ENVIRONMENT=development
```

**Note:** If your backend runs on a different port, update `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` accordingly.

## 🚀 Running the Full Application

### Terminal 1: Start Backend Server

```bash
cd backend

# Activate virtual environment (if using one)
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/ws

### Terminal 2: Start Frontend Server

```bash
cd frontend

# Start Expo development server
npx expo start

# Or for web specifically
npx expo start --web
```

Then:
- Press `w` to open in web browser
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

## 🔍 Verifying the Setup

### Check Backend Connection

1. Open http://localhost:8000/docs in your browser
2. You should see the Swagger API documentation
3. Try the `/health` endpoint (if available) to verify the server is running

### Check Database Connection

The backend will automatically create tables when it starts. Check the console output for any database connection errors.

### Check Frontend Connection

1. Open the app in your browser/emulator
2. Check the browser console (F12) for any API connection errors
3. Try logging in or registering a user

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error:**
- Verify PostgreSQL is running: `pg_isready` or check services
- Verify credentials in `.env` match your database
- Check if the database exists: `psql -U postgres -l`
- Verify firewall/network settings allow connection

**Port Already in Use:**
- Change the port in the uvicorn command: `--port 8001`
- Update frontend `.env` to match the new port

### Frontend Issues

**Cannot Connect to Backend:**
- Verify backend is running on http://localhost:8000
- Check `EXPO_PUBLIC_API_URL` in frontend `.env`
- For web, ensure CORS is configured in backend
- Check browser console for CORS errors

**Environment Variables Not Loading:**
- Restart the Expo dev server after changing `.env`
- Ensure variables start with `EXPO_PUBLIC_` for Expo
- Clear cache: `npx expo start --clear`

## 📝 Environment Variables Reference

### Backend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_CONNECTION` | Database type: `pgsql` or `sqlite` | `sqlite` | No |
| `DB_HOST` | PostgreSQL host | `127.0.0.1` | Yes (if using PostgreSQL) |
| `DB_PORT` | PostgreSQL port | `5432` | Yes (if using PostgreSQL) |
| `DB_DATABASE` | Database name | `esport_manager` | Yes (if using PostgreSQL) |
| `DB_USERNAME` | Database username | `postgres` | Yes (if using PostgreSQL) |
| `DB_PASSWORD` | Database password | - | Yes (if using PostgreSQL) |
| `SECRET_KEY` | JWT secret key | `your-secret-key...` | Yes (change in production) |

### Frontend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` | No |
| `EXPO_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000/ws` | No |
| `EXPO_PUBLIC_DEBUG` | Enable debug mode | `true` | No |
| `EXPO_PUBLIC_ENVIRONMENT` | Environment name | `development` | No |

## 🔒 Security Notes

1. **Never commit `.env` files to git** - they're already in `.gitignore`
2. **Use strong SECRET_KEY in production** - generate using openssl
3. **Use environment-specific credentials** - different for dev/staging/prod
4. **Restrict CORS origins in production** - update backend CORS settings

## 📚 Next Steps

After setup:
1. Create your first user account through the registration screen
2. Explore the API documentation at http://localhost:8000/docs
3. Test the WebSocket connection for real-time features
4. Check the database to verify data is being stored correctly

