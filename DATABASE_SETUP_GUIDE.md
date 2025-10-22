# Database Setup Guide - Fix Login Issue

## Problem
You cannot log in with `org@test.com` because:
1. Your `.env` file is missing or doesn't have `DATABASE_URL`
2. Your local database doesn't have the test user that exists on your friend's laptop

## Solution Steps

### Step 1: Create .env File

Create a file named `.env` in the root directory `/Users/david/Desktop/impacker/.env` with the following content:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/impakter_db?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-at-least-32-characters-long"

# Node Environment
NODE_ENV="development"
```

**IMPORTANT:** Replace the DATABASE_URL values:
- `username` - Your PostgreSQL username (usually `postgres`)
- `password` - Your PostgreSQL password
- `localhost:5432` - Your PostgreSQL host and port
- `impakter_db` - Your database name (create if it doesn't exist)

### Step 2: Get Database Info from Your Friend

Ask your friend to share their `.env` file or at least the `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` values.

**OR** if they have a different database, you need to:

1. **Option A: Copy their database** (Recommended)
   ```bash
   # Friend exports their database
   pg_dump -U postgres impakter_db > database_backup.sql
   
   # You import it
   psql -U postgres impakter_db < database_backup.sql
   ```

2. **Option B: Create the test user locally**
   ```bash
   # After setting up .env, run:
   node add-test-user.js
   ```
   This creates user: `org@test.com` with password: `password123`

### Step 3: Setup Database (if empty)

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# OR run migrations
npm run db:migrate
```

### Step 4: Verify Database

```bash
# Check database status and list users
node check-database.js

# Open Prisma Studio to view data visually
npm run db:studio
```

### Step 5: Create Test User (if needed)

```bash
# This creates org@test.com with password: password123
node add-test-user.js
```

### Step 6: Test Login

Start your dev server and try to login:
```bash
npm run dev
```

Login with:
- Email: `org@test.com`
- Password: `password123`

## Quick Setup (if you're using the same code)

Since you and your friend are using the same codebase, the easiest solution is:

1. Copy your friend's `.env` file exactly
2. Make sure you have PostgreSQL running locally
3. Have your friend export their database and you import it
4. OR have them send you the database credentials if it's hosted somewhere

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- Your `.env` file doesn't exist or is in the wrong location
- Must be at: `/Users/david/Desktop/impacker/.env`

### Error: "Invalid email or password"
- Database doesn't have the user
- Run: `node check-database.js` to see what users exist
- Run: `node add-test-user.js` to create the test user

### Error: "Cannot reach database server"
- PostgreSQL is not running
- Database URL is incorrect
- Database doesn't exist

### Connection String Examples

**Local PostgreSQL:**
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/impakter_db?schema=public"
```

**Hosted Database (Neon, Supabase, etc):**
```
DATABASE_URL="postgresql://user:pass@host.example.com:5432/database?sslmode=require"
```

**Docker PostgreSQL:**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/impakter_db?schema=public"
```

## What Your Friend Should Share

Ask your friend for:
1. Their `.env` file (at least DATABASE_URL and NEXTAUTH_SECRET)
2. OR a database dump file
3. OR the database connection details if it's hosted

This is the root cause of why the same code works on their laptop but not yours - different database instances with different data!

