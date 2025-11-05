# Fix: CERTIFICATE_ISSUED Enum Error

## Problem
The error `invalid input value for enum "NotificationType": "CERTIFICATE_ISSUED"` occurs because the database enum doesn't include this value yet, even though it's defined in the Prisma schema.

## Quick Fix (Choose One Method)

> ⚠️ **All methods below are SAFE and will NOT reset your database** - they only ADD new enum values, never delete or modify existing data.

### Method 1: Manual SQL Execution (SAFEST - Recommended)

**✅ 100% Safe - Only adds enum values, never deletes data**

1. **Access your database console** (Neon, AWS RDS, etc.)
2. **Open SQL Editor**
3. **Run this SQL:**

```sql
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CERTIFICATE_ISSUED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RANK_UP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_JOINED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MONTHLY_REPORT';
```

4. **Verify it worked:**

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'NotificationType'::regtype 
ORDER BY enumlabel;
```

You should see `CERTIFICATE_ISSUED` in the list.

### Method 2: Run Migration Script (SAFE - Local Development)

**✅ Safe - Uses IF NOT EXISTS, won't reset database**

If you have `DATABASE_URL` set in your environment:

```bash
# Make sure DATABASE_URL is set in your .env file or environment
node apply-notification-enum-migration.js
```

### Method 3: Prisma Migrate Deploy (SAFE - Production)

**✅ Safe - Only applies pending migrations, never resets**

```bash
# This will apply all pending migrations including the enum update
npx prisma migrate deploy
```

> ⚠️ **DO NOT use `prisma migrate dev` in production** - it's for development only and may reset the database.

## Why These Methods Are Safe

All three methods above:
- ✅ **Only ADD** new enum values
- ✅ **Never DELETE** existing values or data
- ✅ **Never MODIFY** existing records
- ✅ Use `IF NOT EXISTS` to prevent errors if already applied
- ✅ **Will NOT reset your database**

## Verification

After applying the migration, test the "Grant Approval" feature:
1. Navigate to an event with participants
2. Click "Grant Approval" for a participant
3. The notification should be created successfully without errors

## Migration File Location

The migration file already exists at:
- `prisma/migrations/20251103005606_add_notification_types/migration.sql`

It just needs to be applied to your database.

