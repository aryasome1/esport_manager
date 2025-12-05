# Understanding SECRET_KEY

## ⚠️ Important: SECRET_KEY is NOT from the Database!

The `SECRET_KEY` in your `.env` file is **NOT** stored in or retrieved from your PostgreSQL database. It's a **JWT (JSON Web Token) secret key** used for:
- Signing and verifying authentication tokens
- Encrypting session data
- Security purposes in your FastAPI application

## 🔑 What is SECRET_KEY?

The SECRET_KEY is a random string that your backend uses to:
1. **Sign JWT tokens** when users log in
2. **Verify JWT tokens** when users make authenticated requests
3. **Encrypt sensitive data** in sessions

Think of it like a password for your application's security system - it should be:
- ✅ Long and random (at least 32 characters)
- ✅ Kept secret (never commit to git)
- ✅ Different for each environment (dev/staging/production)
- ✅ Changed periodically in production

## 📝 How to Get/Generate SECRET_KEY

### Option 1: Use the Generated Key (Recommended)
I've already generated one for you:
```
SECRET_KEY=KYv93uuTle26c6AZVPcT8Dvs8dHqIhbfVHIC-xSYsLc
```

Just copy this into your `backend/.env` file.

### Option 2: Generate Your Own

**On Windows (PowerShell):**
```powershell
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

**On Linux/Mac:**
```bash
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

**Or using OpenSSL:**
```bash
openssl rand -hex 32
```

## 🔐 Database Credentials vs SECRET_KEY

These are **completely separate**:

### Database Credentials (in `.env`):
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=esport_manager
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password  # ← This is your PostgreSQL password
```

These connect your backend to PostgreSQL. You can see these in DBeaver when you connect to your database.

### SECRET_KEY (in `.env`):
```env
SECRET_KEY=KYv93uuTle26c6AZVPcT8Dvs8dHqIhbfVHIC-xSYsLc  # ← This is NOT in the database
```

This is used by your FastAPI application for JWT token security. It's **not stored in the database** - it's only in your `.env` file.

## 📋 Complete `.env` File Example

Your `backend/.env` should look like this:

```env
# Database Configuration (from your PostgreSQL setup)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=esport_manager
DB_USERNAME=postgres
DB_PASSWORD=aryaaaaa  # ← Your PostgreSQL password (you can see this in DBeaver)

# Security Configuration (generated, NOT from database)
SECRET_KEY=KYv93uuTle26c6AZVPcT8Dvs8dHqIhbfVHIC-xSYsLc  # ← Generated secret key
```

## ✅ Quick Setup Steps

1. **Open `backend/.env` file**
2. **Update `DB_PASSWORD`** with your actual PostgreSQL password (the one you use in DBeaver)
3. **Update `SECRET_KEY`** with the generated key above (or generate a new one)
4. **Save the file**
5. **Restart your backend server**

## 🛡️ Security Best Practices

1. **Never commit `.env` to git** (it's already in `.gitignore`)
2. **Use different SECRET_KEY for production** - generate a new one
3. **Keep SECRET_KEY secret** - don't share it publicly
4. **Rotate SECRET_KEY periodically** in production (requires re-authenticating all users)

## 🔍 Where to Find Database Password in DBeaver

If you need to find your PostgreSQL password:
1. Open DBeaver
2. Right-click on your PostgreSQL connection
3. Select "Edit Connection"
4. Look at the "Password" field (you can show/hide it)
5. Copy that password to `DB_PASSWORD` in your `.env` file

**Remember:** The database password and SECRET_KEY are different things!

