# 🔧 Production Signup Error - Fix Guide

## Problem
The signup page at https://impaktrweb.vercel.app/signup?type=ngo returns an **Internal Server Error**.

## Root Cause
The production environment on Vercel is missing required environment variables and/or the database hasn't been properly configured.

---

## ✅ Solution: Configure Vercel Environment Variables

### Step 1: Access Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your project: **impaktrweb**
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Required Environment Variables

Add the following environment variables for **Production**, **Preview**, and **Development**:

#### **Required Variables:**

```bash
# Database (CRITICAL - Use your Neon database)
DATABASE_URL="postgresql://neondb_owner:npg_huLwiq89ZSkd@ep-orange-truth-a1ew7cj8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth (CRITICAL)
NEXTAUTH_URL="https://impaktrweb.vercel.app"
NEXTAUTH_SECRET="D0PH2WWSyEI7+VXNU/0mZkcE4ycgelmNdNb33c65MnY="

# Google OAuth (Optional but recommended)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### **Optional Variables (for full features):**

```bash
# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="impaktr-uploads"

# Email (for notifications)
AWS_SES_SMTP_USERNAME="your-ses-username"
AWS_SES_SMTP_PASSWORD="your-ses-password"
FROM_EMAIL="noreply@impaktr.com"

# Application URL
NEXT_PUBLIC_APP_URL="https://impaktrweb.vercel.app"

# Redis (optional - for Socket.io)
REDIS_URL="your-redis-url"
```

### Step 3: Redeploy

After adding environment variables:

**Option A: From Vercel Dashboard**
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Redeploy"** button
4. Wait for deployment to complete

**Option B: From Command Line**
```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Option C: Push to GitHub**
```bash
git add .
git commit -m "Update configuration"
git push origin main
# Vercel will auto-deploy
```

---

## 🗄️ Database Migration (If Tables Don't Exist)

If the database doesn't have the tables, you need to run migrations:

### Method 1: From Local Machine

```bash
# Set production DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://neondb_owner:npg_huLwiq89ZSkd@ep-orange-truth-a1ew7cj8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Push schema to production database
npm run db:push

# Or run migrations
npm run db:migrate
```

### Method 2: Add to Vercel Build Command

In Vercel project settings:
1. Go to **Settings** → **General** → **Build & Development Settings**
2. Override **Build Command** with:
   ```bash
   npm run build && npx prisma generate && npx prisma db push
   ```

---

## 🧪 Test the Fix

After redeploying:

1. Visit: https://impaktrweb.vercel.app/signup?type=ngo
2. Fill in the registration form
3. Click "Create Account"
4. Should redirect to profile setup page

---

## 📋 Checklist

- [ ] Add `DATABASE_URL` to Vercel environment variables
- [ ] Add `NEXTAUTH_URL` to Vercel environment variables  
- [ ] Add `NEXTAUTH_SECRET` to Vercel environment variables
- [ ] Add optional variables (Google OAuth, AWS, etc.)
- [ ] Redeploy the application
- [ ] Run database migrations if needed
- [ ] Test signup functionality
- [ ] Test signin functionality
- [ ] Test profile setup flow

---

## 🔍 Debugging Tips

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments** → Click latest deployment
4. Click **"View Function Logs"**
5. Look for errors in `/api/auth/register`

### Common Errors

**Error: "Environment variable not found: DATABASE_URL"**
- Solution: Add DATABASE_URL to Vercel environment variables

**Error: "User with this email already exists"**
- Solution: This is expected - try a different email

**Error: "Invalid authentication"**
- Solution: Check NEXTAUTH_SECRET is set correctly

**Error: "Table 'users' does not exist"**
- Solution: Run database migrations

---

## 🚀 Quick Fix Command (All-in-One)

If you have Vercel CLI installed:

```bash
# Set all environment variables at once
vercel env add DATABASE_URL production
# Paste: postgresql://neondb_owner:npg_huLwiq89ZSkd@ep-orange-truth-a1ew7cj8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

vercel env add NEXTAUTH_URL production
# Paste: https://impaktrweb.vercel.app

vercel env add NEXTAUTH_SECRET production
# Paste: D0PH2WWSyEI7+VXNU/0mZkcE4ycgelmNdNb33c65MnY=

# Redeploy
vercel --prod
```

---

## 📞 Need Help?

If you're still experiencing issues:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Ensure database is accessible from Vercel
4. Check if tables exist in production database

---

**Last Updated:** October 10, 2025  
**Status:** Ready to deploy


