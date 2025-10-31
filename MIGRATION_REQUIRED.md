# Database Migration Required - Fix Reject Participation Error

## Problem
When admin clicks "reject" on a participant in `organization/events/[id]`, an "Internal server error" occurs.

## Root Cause
The database enum for `ParticipationStatus` only contains 3 values:
- PENDING
- VERIFIED
- REJECTED

But the code requires 7 values:
- REGISTERED
- PENDING
- CONFIRMED
- ATTENDED
- CANCELLED
- VERIFIED
- REJECTED

The missing enum values cause Prisma to fail when trying to set status to 'REJECTED'.

## Solution
Apply the migration file to add the missing enum values to your database.

**IMPORTANT: This migration is safe and will NOT delete any data. It only adds missing enum values to the database.**

### Option 1: Apply Migration (Recommended)
```bash
# Navigate to project directory
cd /Users/david/Desktop/impacktr

# Apply the migration
npx prisma migrate deploy

# OR if you're in development
npx prisma migrate dev
```

### Option 2: Manual SQL Execution
If migrations don't work, you can run the SQL directly:

```bash
# Connect to your database and run:
psql -U your_user -d your_database -f prisma/migrations/20251031175905_add_participation_status_values/migration.sql
```

Or manually in your database console:
```sql
-- Add missing ParticipationStatus enum values
ALTER TYPE "ParticipationStatus" ADD VALUE IF NOT EXISTS 'REGISTERED';
ALTER TYPE "ParticipationStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "ParticipationStatus" ADD VALUE IF NOT EXISTS 'ATTENDED';
ALTER TYPE "ParticipationStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Add missing EventStatus enum values
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED';
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'UPCOMING';
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'ONGOING';
```

## After Applying Migration

1. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

3. Test the reject functionality again.

## Files Modified
- `prisma/migrations/20251031175905_add_participation_status_values/migration.sql` - Created migration file
- `src/app/api/events/[id]/participants/[participationId]/reject/route.ts` - Added detailed error logging
- `src/app/organization/events/[id]/page.tsx` - Improved error handling and display

## Verification
After applying the migration, check that all enum values exist:

```sql
SELECT enum_range(NULL::"ParticipationStatus");
SELECT enum_range(NULL::"EventStatus");
```

Both should show 7 and 7 values respectively.

## Error Logging
Enhanced error logging has been added to help diagnose issues. Check your server console for detailed error messages if problems persist.

## Troubleshooting

If you see `errorData: {}` in the console:
1. **The migration hasn't been applied yet** - This is the most common cause
2. Check server console logs for detailed error messages starting with "Error rejecting participation:"
3. Look for "Attempting to update participation to REJECTED" log to confirm the code path

The console will now show:
- HTTP status code (likely 500)
- Detailed error from backend
- Current participation status

Once the migration is applied, all these issues should resolve.

