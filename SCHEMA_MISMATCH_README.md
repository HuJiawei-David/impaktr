# Schema Mismatch Issue

## Problem
The code from Claude.ai expects a NEW schema structure (the one you provided), but your database still has the OLD schema structure. When we ran `prisma db push`, it tried to modify the existing schema instead of creating the new one from scratch.

## What Happened
1. Your OLD schema had fields like: `userType`, `currentRank`, `impaktrScore`, `isVerified`, `onboardingComplete`, etc.
2. The NEW schema has different fields: `impactScore`, `totalPoints`, `streak`, `level`, `xp`, `tier`, etc.
3. Prisma tried to merge them, causing data loss warnings and incomplete migrations.

## Solution Options

### Option 1: Fresh Database (RECOMMENDED for development)
If this is a development environment and you're okay losing test data:

```bash
# Reset the database completely
npx prisma migrate reset --force

# Or manually drop all tables in your database, then:
npx prisma db push
```

### Option 2: Keep Both Schemas (Hybrid Approach)
If you need to keep the existing data, you'll need to:

1. Decide which schema structure you want to keep
2. Either:
   - Modify the Claude.ai code to match your OLD schema, OR
   - Modify your Prisma schema to be a hybrid of OLD + NEW fields

### Option 3: Tell Claude.ai Your Actual Schema
Copy your ACTUAL current Prisma schema (after the push) and give it to Claude.ai, asking it to regenerate all the code to match your real database structure.

## Quick Fix for Now
The simplest fix is to ask Claude.ai to regenerate the code using your ACTUAL database schema. Here's what to do:

1. **Get your actual schema:**
```bash
cat prisma/schema.prisma
```

2. **Copy the entire output**

3. **Tell Claude.ai:** 
"The code you generated doesn't match my actual database schema. Here's my REAL Prisma schema: [paste schema]. Please regenerate all the API routes and helper functions to match THIS schema exactly."

## Fields That Are Mismatched

### User Model
- Claude's code expects: `impactScore`, `organizationMemberships`
- Your DB has: `impaktrScore`, `memberships` (possibly)

### Organization Model  
- Claude's code expects: `logo`, `esgScore`, `industry`, `participationRate`, `tierPoints`, `nextTierAt`
- Your DB might not have all these fields yet

### OrganizationMember Model
- Claude's code expects: `status`, `invitedBy` as relation
- Your DB has: `status` as string?, `invitedBy` as string?

### Prisma Client Names
- Claude's code uses: `prisma.eSGMetric`, `prisma.corporateBadge`, `prisma.corporateLeaderboard`
- These should be: `prisma.eSGMetric`, `prisma.corporateBadge`, `prisma.corporateLeaderboard`

## Recommendation
Since you're in development, I recommend **Option 1** - fresh database. This will ensure the new schema is applied cleanly without conflicts.


