# 🧪 Testing Signup - Troubleshooting Guide

## Test 1: Local Signup (localhost:3000)

### Step 1: Open the Signup Page
1. Make sure dev server is running: `npm run dev`
2. Open: http://localhost:3000/signup?type=ngo
3. Fill in the form:
   - Organization Name: "Test NGO"
   - Email: Use a unique email (e.g., test1@ngo.com)
   - Password: At least 8 characters
   - Confirm Password: Same as password

### Step 2: Check for Errors
If signup fails locally, check:

**A. Browser Console (F12)**
- Look for JavaScript errors
- Look for network errors (red entries in Network tab)

**B. Terminal/Command Prompt**
- Look for error messages in the `npm run dev` output
- Common errors:
  - Database connection error → Check DATABASE_URL in .env
  - Prisma error → Run `npm run db:generate`

### Step 3: Test Database Connection
```bash
# Test if database is accessible
npm run db:studio
```

If this works, your local database is fine.

---

## Test 2: Production Signup (impaktrweb.vercel.app)

### Current Status: ❌ NOT WORKING

**Why?** Environment variables are not configured on Vercel.

### Fix for Production:

#### Option A: Using Vercel Dashboard (Easiest)

1. **Login to Vercel**: https://vercel.com/dashboard
2. **Select Project**: Click "impaktrweb"
3. **Go to Settings** → **Environment Variables**
4. **Add these variables**:

```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_huLwiq89ZSkd@ep-orange-truth-a1ew7cj8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
Environments: ☑ Production ☑ Preview ☑ Development

Name: NEXTAUTH_URL  
Value: https://impaktrweb.vercel.app
Environments: ☑ Production ☑ Preview

Name: NEXTAUTH_SECRET
Value: D0PH2WWSyEI7+VXNU/0mZkcE4ycgelmNdNb33c65MnY=
Environments: ☑ Production ☑ Preview ☑ Development
```

5. **Click "Save"** for each variable
6. **Redeploy**: Go to Deployments → Click latest → Redeploy

#### Option B: Using Vercel CLI (Faster)

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add DATABASE_URL production
# Paste the Neon URL when prompted

vercel env add NEXTAUTH_URL production  
# Paste: https://impaktrweb.vercel.app

vercel env add NEXTAUTH_SECRET production
# Paste: D0PH2WWSyEI7+VXNU/0mZkcE4ycgelmNdNb33c65MnY=

# Deploy to production
vercel --prod
```

---

## Common Issues & Solutions

### Issue 1: "Internal Server Error" on Signup

**Cause**: Missing environment variables on Vercel

**Solution**: 
1. Add DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET to Vercel
2. Redeploy

### Issue 2: "User with this email already exists"

**Cause**: You already registered with this email

**Solution**: 
- Use a different email
- Or login instead: http://localhost:3000/signin

### Issue 3: Database Connection Error

**Cause**: DATABASE_URL is incorrect or database is down

**Solution**:
1. Check DATABASE_URL is correct
2. Test connection: `npm run db:studio`
3. Verify Neon database is running

### Issue 4: "Table 'users' does not exist"

**Cause**: Database schema not pushed

**Solution**:
```bash
npm run db:generate
npm run db:push
```

---

## Quick Test Script

Save this as `test-signup.js`:

```javascript
const testSignup = async () => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test NGO',
      email: `test${Date.now()}@ngo.com`,
      password: 'testpass123',
      userType: 'NGO'
    })
  });
  
  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', data);
};

testSignup();
```

Run: `node test-signup.js`

---

## Verification Checklist

### Local Environment:
- [ ] `npm run dev` is running without errors
- [ ] `.env.local` has DATABASE_URL
- [ ] `.env` has DATABASE_URL  
- [ ] Database tables exist (`npm run db:studio`)
- [ ] Can access http://localhost:3000

### Production Environment:
- [ ] DATABASE_URL set in Vercel
- [ ] NEXTAUTH_URL set in Vercel
- [ ] NEXTAUTH_SECRET set in Vercel
- [ ] Latest deployment is live
- [ ] Can access https://impaktrweb.vercel.app

---

## Next Steps

1. **Test Local First**: Make sure signup works on localhost
2. **Fix Production**: Add environment variables to Vercel
3. **Test Production**: Try signing up on the live site
4. **Verify**: Create account and complete profile

---

**Need immediate help?**
- Check browser console (F12)
- Check terminal output where `npm run dev` is running
- Share any error messages you see


