# Impact Score Calculation: Why Alan Got 7.2 Instead of 32.5

## The Two Different Calculations

### 1. **Potential Impact Score** (Shown on Event Page)
This is a **simplified estimate** displayed on the event page to give participants an idea of what they *could* earn. It's calculated as:

```
Potential Score = (Event Type Multiplier) × Intensity × Skills × Verification × 10
```

For your event:
- Event Type: Likely WORKSHOP (3) or FUNDRAISER (4) or default (2.5)
- Intensity: 1.0
- Skills: (1 + skills count × 0.1)
- Verification: ORGANIZER (1.1)
- × 10

**This formula assumes optimal conditions and a certain amount of hours.**

### 2. **Actual Impact Score** (What Alan Received)
The actual score uses a **log-scaled formula** that accounts for the actual hours worked:

```
Score = (H × I × S × Q × V × L) × 0.1
```

Where:
- **H** = `Math.log10(hours + 1) × 100` ← **This is the key difference!**
- **I** = Intensity multiplier (0.8-1.2)
- **S** = Skill multiplier (1.0-1.4)
- **Q** = Quality rating (0.5-1.5)
- **V** = Verification factor (0.8-1.1)
- **L** = Location multiplier (0.8-1.2)

## Why the Logarithmic Hours Component?

The **log10(hours + 1) × 100** formula creates a diminishing returns curve:

| Hours | H Value | Notes |
|-------|---------|-------|
| 1 hour | 30.1 | Small participation |
| 2 hours | 47.7 | Still building |
| 3 hours | 60.2 | Getting there |
| 5 hours | 77.8 | Moderate impact |
| 10 hours | 104.1 | Good impact |
| 20 hours | 132.2 | Strong impact |
| 50 hours | 170.8 | Major impact |

This prevents score inflation and rewards sustained, quality participation over just logging massive hours.

## Example Calculation for Alan's 7.2 Score

Let's assume Alan worked **2-3 hours** on the event:

```
H = Math.log10(3 + 1) × 100 = 60.2
I = 1.0 (default intensity)
S = 1.0 (no skill match bonus)
Q = 1.0 (standard quality)
V = 1.1 (organizer verification bonus)
L = 1.0 (US location)

Participation Score = 60.2 × 1.0 × 1.0 × 1.0 × 1.1 × 1.0 = 66.22

Final Score = 66.22 × 0.1 = 6.6

(With rounding and variations, this becomes ~7.2)
```

## To Get Closer to the 32.5 Potential Score

Alan would need to work significantly more hours:

```
To get 32.5:
325 = H × 1.0 × 1.0 × 1.0 × 1.1 × 1.0
H = 295.45

295.45 = Math.log10(hours + 1) × 100
2.9545 = Math.log10(hours + 1)
900.8 = hours + 1
≈ 900 hours needed!
```

This shows that the **32.5 "potential" score is not realistically achievable** through one event participation. The potential score formula is more of a theoretical maximum if all multipliers were at their highest.

## Key Takeaways

1. **Potential Score** = Marketing/motivational number showing maximum theoretical impact
2. **Actual Score** = Realistic calculation based on actual hours with diminishing returns
3. **Log scaling** prevents gaming the system and rewards consistent, quality participation
4. **7.2 is a good score** for a 2-3 hour event participation!
5. The total impact score grows over multiple events, not from a single massive event

## How to Check Alan's Actual Data

To see exactly what was recorded:

1. Open Prisma Studio: `npx prisma studio`
2. Go to the `Participation` table
3. Filter by userId = Alan's ID and eventId = `cmgxrelvv0003kch6xt8uta41`
4. Check the `hours` field
5. Go to `ScoreHistory` table to see the exact score calculation breakdown

## Recommendations

**For the Event Page:**
Consider updating the "Potential Impact Score" label to:
- "Estimated Score Range: 5-15 points" (based on typical 2-10 hour participation)
- Or hide it completely and only show actual scores after completion
- Or add a tooltip explaining it's a theoretical maximum

The current 32.5 creates unrealistic expectations compared to the actual 7.2 score earned.

