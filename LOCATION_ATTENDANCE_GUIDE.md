# Location-Based Attendance System - User Guide

## Overview
The attendance system now requires participants to be within 200 meters of the event location to mark their attendance. This prevents remote check-ins and ensures participants are physically present.

## For Event Organizers (Admin)

### Setting Up Location Coordinates

When creating or editing an event:

1. **Enter Event Location**
   - Fill in the City field (required)
   - Fill in the Meeting Location/Address field (required)

2. **Get Location Coordinates** ⚠️ IMPORTANT
   - Click the "Get Location Coordinates" button
   - The system will fetch precise GPS coordinates using the address you entered
   - You'll see a green confirmation showing the coordinates (e.g., `3.140853, 101.693207`)
   - **Without coordinates, participants won't be able to check in!**

3. **Verification**
   - Green box ✓: Coordinates are saved
   - Yellow box ⚠: Coordinates not set - you must click "Get Location Coordinates"

### Example
```
City: Kuala Lumpur
Meeting Location: KLCC Convention Centre, Jalan Pinang

[Click "Get Location Coordinates"]

✓ Coordinates saved: 3.153889, 101.714444
Participants will need to be within 200 meters of this location to mark attendance.
```

## For Participants

### Marking Attendance

When you click "Mark Attendance":

1. **Location Permission Required**
   - Your browser will ask for location access - click "Allow"
   - This is required to verify you're at the event location

2. **Distance Check**
   - The system calculates your distance from the event
   - Shows: "Your distance from event: 45 meters"
   - ✓ Green: Within 200m - you can check in
   - ✗ Red: Too far - you must be closer to the event

3. **Enter Attendance Code**
   - Get the 6-digit code from the organizer
   - Enter it and submit

### Troubleshooting Location Permission

#### If you see: "Location permission was denied"

**Chrome / Edge / Brave:**
1. Click the 🔒 lock icon in the address bar (left side)
2. Find "Location" in the permissions list
3. Change it from "Block" to "Allow"
4. Refresh the page and try again

**Safari (Mac/iPhone):**
1. Open Safari → Settings → Websites → Location
2. Find this website in the list
3. Change permission to "Allow"
4. Refresh the page and try again

**Safari (iPhone) Alternative:**
1. Go to iPhone Settings → Safari → Location
2. Change to "Allow"
3. Return to the page and refresh

**Firefox:**
1. Click the 🔒 lock icon in the address bar
2. Click "Clear cookies and site data"
3. Refresh the page
4. When prompted, click "Allow" for location access

### Common Issues

**"Location information is unavailable"**
- Make sure your device's GPS/Location Services are turned on
- On iPhone: Settings → Privacy → Location Services → ON
- On Android: Settings → Location → ON

**"Location request timed out"**
- Your GPS signal might be weak
- Try moving to an open area with clear sky view
- Wait a moment and try again

**"You are too far from the event location"**
- You must physically be at the event (within 200 meters)
- The distance shown is: `Current: 245m` (example)
- Move closer to the event venue and try again

## Technical Details

### How It Works

1. **Admin Setup**
   - Admin enters address → System uses Nominatim (OpenStreetMap) API → Gets coordinates
   - Coordinates stored with event: `{lat: 3.1234, lng: 101.5678}`

2. **Participant Check-in**
   - Participant clicks "Mark Attendance"
   - Browser requests location permission
   - System gets participant's GPS coordinates
   - Calculates distance using Haversine formula
   - If distance ≤ 200m → Allow check-in
   - If distance > 200m → Deny with distance shown

3. **API Flow**
   ```
   Frontend (AttendanceDialog) 
     → Get user location from browser
     → Calculate distance
     → POST /api/events/[id]/attendance/mark
       with {code, userLat, userLng}
     → Backend verifies code and distance
     → Returns success or error
   ```

### Distance Calculation
```javascript
// Haversine formula calculates distance between two GPS points
// Returns distance in kilometers
const distance = calculateDistance(userLat, userLng, eventLat, eventLng);

// Check if within 200 meters (0.2 km)
if (distance <= 0.2) {
  // Allow attendance
} else {
  // Deny: too far
}
```

## Testing Checklist

### Admin Testing
- [ ] Create event with city and address
- [ ] Click "Get Location Coordinates"
- [ ] Verify green confirmation shows coordinates
- [ ] Edit event and update location
- [ ] Verify coordinates update correctly

### Participant Testing (Within Range)
- [ ] Open event page
- [ ] Click "Mark Attendance"
- [ ] Allow location when prompted
- [ ] Verify distance shows < 200m
- [ ] Enter attendance code
- [ ] Successfully mark attendance

### Participant Testing (Out of Range)
- [ ] Be more than 200m away from event location
- [ ] Click "Mark Attendance"
- [ ] Verify error: "You are too far from the event location. Distance: XXX meters"

### Permission Error Testing
- [ ] Block location permission
- [ ] Verify red warning appears with guide
- [ ] Click "Show How to Enable"
- [ ] Follow guide and re-enable permission
- [ ] Verify green "Location permission granted ✓" appears

## Updates Made

### Files Modified

1. **`src/app/organization/events/create/page.tsx`**
   - Enhanced location coordinates UI
   - Added warning when coordinates not set
   - Better visual feedback

2. **`src/app/events/[id]/edit/page.tsx`**
   - Added same location coordinates UI for editing events
   - Ensures coordinates are maintained when editing

3. **`src/components/events/AttendanceDialog.tsx`**
   - Added permission state detection
   - Shows detailed permission guide for each browser
   - Real-time distance display
   - Better error messages
   - Permission status indicator

4. **`src/app/api/events/[id]/attendance/mark/route.ts`**
   - Already implements 200m distance check
   - Returns detailed error messages

## Security & Privacy

- Location is only requested when marking attendance
- Location data is not stored permanently
- Only the attendance timestamp is recorded
- Distance calculation happens on both client and server for verification
- No tracking or continuous location monitoring

---

**Need Help?** Contact the system administrator or refer to this guide.


