# Attendance Dialog Fix

## Problem
When a participant clicked the "Mark Attendance" button on the event detail page (`/events/[id]`), the screen would become gray and unresponsive. Clicking again would dismiss the gray overlay, but the attendance dialog did not appear.

## Root Cause
The Attendance Dialog was using **conditional rendering** (`{showAttendanceDialog && <Dialog>...</Dialog>}`) in addition to the `open` prop. This dual control caused the Radix UI Dialog to not properly initialize its internal state when the component was first rendered.

The issue was in `/src/app/events/[id]/page.tsx` at lines 1544-1638.

## Solution
Removed the conditional rendering wrapper around the Dialog component. The Dialog should always be rendered in the DOM and only controlled via the `open` prop.

### Before
```tsx
{showAttendanceDialog && (
  <Dialog open={showAttendanceDialog} onOpenChange={...}>
    <DialogContent>...</DialogContent>
  </Dialog>
)}
```

### After
```tsx
<Dialog open={showAttendanceDialog} onOpenChange={...}>
  <DialogContent>...</DialogContent>
</Dialog>
```

## Additional Improvements
1. **Removed redundant CSS classes**: Simplified from `sm:max-w-[425px] bg-white dark:bg-gray-900 z-[100]` to just `sm:max-w-[425px]` as these styles are already applied by the base Dialog component
2. **Updated styling**: Changed hardcoded color classes to use theme-aware classes like `text-muted-foreground`, `bg-background`, `border-input`
3. **Replaced native input with Input component**: Used the project's Input component instead of a native `<input>` element for better consistency with the design system

## How It Works Now
1. Participant clicks "Mark Attendance" button
2. `setShowAttendanceDialog(true)` is called
3. Dialog renders with `open={true}` and displays the attendance form
4. Participant enters the 6-digit attendance code
5. On successful submission, the API updates the participation status to 'ATTENDED'
6. The admin can see the attendance timestamp in the participants list

## API Endpoint
The attendance marking functionality uses:
- **POST** `/api/events/[id]/attendance/mark`
- Requires: `{ code: string }`
- Validates:
  - User is authenticated
  - User is registered for the event
  - Attendance tracking is enabled for the event
  - Code matches the event's attendance code
  - Event has started
  - Attendance is within enabled time window
  - User hasn't already marked attendance

## Files Modified
- `src/app/events/[id]/page.tsx` - Fixed Dialog rendering (removed conditional wrapper)

## Testing Checklist
- [x] Dialog appears when clicking "Mark Attendance" button
- [x] Dialog shows input field for attendance code
- [x] Dialog can be closed with Cancel button
- [x] Dialog can be closed by clicking outside
- [x] Enter key submits the form when code is entered
- [x] Form validation works (code required)
- [x] Success message displays after marking attendance
- [x] Admin can see attendance timestamp in participants list

## Related Files
- `src/components/ui/dialog.tsx` - Base Dialog component (no changes needed)
- `src/app/api/events/[id]/attendance/mark/route.ts` - Attendance API endpoint
- `src/app/api/events/[id]/attendance/toggle/route.ts` - Enable/disable attendance API

