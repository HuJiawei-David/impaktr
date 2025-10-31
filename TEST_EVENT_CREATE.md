# Event Creation Testing Guide

## Quick Testing Steps

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Event Creation Page
Open browser and visit: `http://localhost:3000/organization/events/create`

### 3. Fill Out Form and Test

#### Test Case 1: Complete Fill (Should Succeed)
1. **Step 1 - Basic Information:**
   - Event Title: `Community Environmental Cleanup Event`
   - Description: `Let's contribute to the community environment, cleaning parks and streets`
   - Organization: Select your organization (or select "Create as Individual")
   - SDG Focus Areas: Select at least one SDG (e.g., SDG 11, 13, 15)
   - Event Images: Optionally upload 1-5 images

2. **Step 2 - Date and Time:**
   - Start Date: Select a future date and time (e.g., `2025-11-15 09:00`)
   - End Date: Select end time (e.g., `2025-11-15 17:00`)
   - Registration Deadline: Select registration deadline (e.g., `2025-11-14 23:59`)
   - Location: 
     - Do not check virtual event
     - City: `Kuala Lumpur`
     - Address: `Central Park, Jalan Sultan Ismail`
   - Max Participants: `50`
   - Check "Public event"

3. **Step 3 - Skills and Requirements:**
   - Skills: Select relevant skills (e.g., "Event Planning", "Gardening")
   - Intensity Level: Select `Medium (1.0x)`
   - Verification Method: Select `Organizer Verification`

4. **Step 4 - Advanced:**
   - Certificate Template: Select `Default Impaktr Certificate`
   - Click "Create Event"

**Expected Results:** 
- Display "Event created successfully!" success message
- Automatically redirect to `/organization/events` page
- Newly created event appears in the list

---

#### Test Case 2: Virtual Event (Should Succeed)
1. **Step 1:** Fill in basic information and SDG
2. **Step 2:** 
   - Fill in date and time
   - **Check "This is a virtual event"**
   - City field should be optional
   - No need to fill in address
3. **Step 3-4:** Fill normally
4. Click "Create Event"

**Expected Result:** Successfully create virtual event

---

#### Test Case 3: Missing Required Fields (Should Display Error)

**Test 3a: Missing Title**
- Skip Event Title
- Directly click "Continue" or "Create Event"
- **Expected:** Display "Please fill in all required fields"

**Test 3b: Missing Registration Deadline**
- Fill all other fields
- But do not fill Registration Deadline
- Click "Create Event"
- **Expected:** Display "Registration deadline is required"

**Test 3c: Non-virtual Event but No City**
- Do not check virtual event
- But do not fill City
- Click "Create Event"
- **Expected:** Display "City is required for non-virtual events"

**Test 3d: No SDG Selected**
- Fill all other fields
- But do not select any SDG
- Click "Create Event"
- **Expected:** Display "Please select at least one SDG"

---

## Debugging Guide

If event creation still fails, follow these steps to debug:

### 1. Open Browser Developer Tools
- Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac)
- Switch to "Console" tab

### 2. Check Console Errors
Try creating an event, check if there are red error messages in the console. Common errors:
- `Unauthorized` → User not logged in or session expired
- `No organization admin access` → User is not an administrator of any organization
- `Validation failed` → Data validation failed
- `Internal server error` → Server-side error

### 3. Check Network Requests
- Switch to "Network" tab
- Click "Create Event"
- Find the POST request to `/api/organization/events`
- Click to view request details:
  - **Request Payload:** View sent data
  - **Response:** View server-returned error message

### 4. Common Errors and Solutions

#### Error: "Unauthorized" (401)
**Cause:** User not logged in  
**Solution:** Ensure logged in, check if session is valid

#### Error: "No organization admin access" (403)
**Cause:** User is not an administrator or owner of any organization  
**Solution:** 
1. Create an organization
2. Or add user as administrator of existing organization
3. Use the following script to add user to organization:
```bash
node add-to-organization.js
```

#### Error: "Invalid data" or "Validation failed" (400)
**Cause:** Data format incorrect  
**Solution:** 
1. Check the `details` field in Response to see which field validation failed
2. Common issues:
   - Date format incorrect
   - Required fields empty
   - Numeric fields negative or invalid values
   - SDG array out of range (must be 1-17)

#### Error: "Internal server error" (500)
**Cause:** Server-side error  
**Solution:** 
1. Check server console logs
2. Possible causes:
   - Database connection failed
   - Prisma schema mismatch
   - Database field type mismatch

### 5. Check Server Logs
In the terminal window running `npm run dev`, check output:
```
Received event data: { ... }  # Received data
Validation error: [ ... ]      # Zod validation error (if any)
Error creating event: ...      # Error when creating event
```

---

## Data Format Reference

### Correct API Request Data Format:
```json
{
  "title": "Community Environmental Cleanup Event",
  "description": "Let's contribute to the community environment",
  "startDate": "2025-11-15T09:00",
  "endDate": "2025-11-15T17:00",
  "registrationDeadline": "2025-11-14T23:59",
  "location": {
    "address": "Central Park",
    "city": "Kuala Lumpur",
    "isVirtual": false
  },
  "maxParticipants": 50,
  "sdgTags": [11, 13, 15],
  "skills": ["Event Planning", "Gardening"],
  "intensity": 1.0,
  "verificationType": "ORGANIZER",
  "eventInstructions": "",
  "materialsNeeded": [],
  "emergencyContact": null,
  "autoIssueCertificates": true,
  "requiresApproval": false
}
```

### Date Format Notes
- Use `datetime-local` format: `YYYY-MM-DDTHH:mm`
- Example: `2025-11-15T09:00`
- No timezone information needed

### SDG Array
- Numeric array, each number range: 1-17
- Example: `[1, 3, 4, 11, 13]`
- Maximum 5 selections

---

## Post-Creation Verification

After successful creation, check the following:

1. **Event List Page** (`/organization/events`)
   - New event should appear in the list
   - Status should be "DRAFT"

2. **Database Check**
   ```bash
   # Use Prisma Studio to view
   npx prisma studio
   ```
   - Open `Event` table
   - Find newly created event
   - Verify all fields saved correctly

3. **Event Details Page**
   - Click event to view details
   - Confirm all information displays correctly

---

## Need Help?

If you still cannot create events following the above steps, please provide the following information:

1. **Browser console error messages** (Console tab)
2. **Network request response content** (Network tab → Response)
3. **Server log output** (Terminal window)
4. **Your filled data example**

This will help further diagnose the issue.
