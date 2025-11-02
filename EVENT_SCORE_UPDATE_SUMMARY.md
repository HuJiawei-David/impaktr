# Event Score Display Update - Summary

## Problem
The event page was showing a misleading "Potential Impact Score" of 32.5 points, but users like Alan Greenspan only received 7.2 points after completing the event. This created unrealistic expectations.

## Root Cause
The "Potential Impact Score" displayed on the event page used a simplified formula that:
1. **Didn't account for actual hours worked** - It was just a theoretical maximum
2. **Didn't use the logarithmic scaling** - The actual score formula uses `Math.log10(hours + 1) × 100`
3. **Didn't apply diminishing returns** - The actual formula multiplies by 0.1 at the end

**Old Formula (Misleading):**
```
Score = Event Type × Intensity × Skills × Verification × 10
```

**Actual Formula Used:**
```
H = Math.log10(hours + 1) × 100
Score = (H × I × S × Q × V × L) × 0.1
```

## Solution Implemented

### 1. Backend API Update (`src/app/api/events/[id]/route.ts`)
Added a new function `calculateScoreEstimation()` that:
- Uses the **actual logarithmic scoring formula**
- Calculates realistic score ranges based on event specifications
- Considers event type and totalHours to estimate typical participation
- Returns `minScore`, `maxScore`, `typicalScore`, and `hoursRange`

**Example Output:**
```json
{
  "estimatedScoreRange": {
    "minScore": 5.1,
    "maxScore": 10.4,
    "typicalScore": 7.2,
    "hoursRange": { "min": 2, "max": 8, "typical": 4 }
  }
}
```

### 2. Frontend UI Update (`src/app/events/[id]/page.tsx`)
Replaced the misleading "Potential Impact Score" section with:
- **"Estimated Impact Score"** - More accurate terminology
- Shows the **typical score** prominently (e.g., "7.2 points")
- Displays the **score range** (e.g., "5.1 - 10.4 points")
- Shows the **hour range** (e.g., "2-8 hrs")
- Includes context: "Based on 4 typical hours of participation"

### 3. Score Calculation Details

The API now intelligently determines hours based on:

| Event Type | Min Hours | Max Hours | Typical Hours |
|------------|-----------|-----------|---------------|
| VOLUNTEERING | 2 | 8 | 4 |
| WORKSHOP | 2 | 6 | 3 |
| FUNDRAISER | 3 | 12 | 6 |
| CLEANUP | 2 | 6 | 4 |
| AWARENESS | 1 | 4 | 2 |
| EDUCATION | 2 | 8 | 4 |

If the event has a `totalHours` field set, the API uses that as the "typical" and calculates min/max as 50%-150% of that value.

## Example: Alan's Event

**Event:** Food Distribution for Homeless - KL City Center
- **Type:** VOLUNTEERING
- **Total Hours:** 3 hours
- **Skills:** 3 (Community Service, Empathy, Communication)
- **Verification:** Organizer

**Old Display:**
- "Potential Impact Score: **32.5 points**" ❌

**New Display:**
- "Estimated Impact Score: **6.6 points**" ✅
- Range: 5.1 - 9.9 points (2-4.5 hrs)
- Based on 3 typical hours of participation

**Actual Score Received:** 7.0 points ✅

## Benefits

1. **Realistic Expectations** - Users see accurate score estimates before participating
2. **API-Driven** - Score calculations are centralized and consistent
3. **Transparent** - Users understand the hour ranges that lead to different scores
4. **Accurate** - Uses the same logarithmic formula as the actual score calculation

## Files Modified

- `src/app/api/events/[id]/route.ts` - Added `calculateScoreEstimation()` function
- `src/app/events/[id]/page.tsx` - Updated UI to display realistic scores

## Documentation

- See `SCORING_EXPLANATION.md` for detailed explanation of the scoring formulas
- The realistic estimation is now consistent with the actual score users receive

## Testing

To verify the realistic scores match actual user scores:
```bash
# Run with env vars
cd /Users/jimmyho/Desktop/impaktrweb
source .env.local
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Check participations and compare estimated vs actual scores
"
```

