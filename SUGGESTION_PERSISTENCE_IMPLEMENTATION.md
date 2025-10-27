# Suggestion Component State Persistence Implementation

## Overview

This implementation adds state persistence to the Suggestion component to prevent data loss when users navigate away from the page. The solution uses **Zustand with localStorage persistence** to maintain suggestion data across sessions.

## Implementation Details

### 1. Zustand Store (`src/store/suggestionStore.ts`)

Created a new persistent store that manages:

#### State Properties
- **formData**: The suggestion request form data (focus, targets, constraints)
- **selectedSDGs**: Array of selected SDG values
- **result**: The suggestion result containing events and summary data
- **selectedEvents**: Array of selected event IDs
- **organizationId**: ID of the organization (for validation)
- **timestamp**: When the suggestion was generated (for expiration checking)

#### Key Features
- **Automatic Persistence**: All state is automatically saved to localStorage
- **24-Hour Expiration**: Stored suggestions expire after 24 hours
- **Organization Validation**: Clears data if user switches organizations
- **Settings Change Detection**: Tracks when form settings change to invalidate old results

#### Actions
- `setFormData(data)`: Updates form data
- `setSelectedSDGs(sdgs)`: Updates selected SDGs
- `setResult(result)`: Updates suggestion result and timestamp
- `setSelectedEvents(events)`: Updates selected events
- `setOrganizationId(id)`: Updates organization ID
- `clearSuggestions()`: Clears all stored data
- `hasSettingsChanged(newFormData, newSelectedSDGs)`: Checks if settings have changed

### 2. SuggestionPanel Component Updates

#### Initialization Logic
```typescript
useEffect(() => {
  // Check if we have stored data for this organization
  if (storedOrgId === organizationId && storedResult && timestamp) {
    // Check if data is not expired (24 hours)
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - timestamp < dayInMs) {
      // Restore stored state
      setFormData(storedFormData);
      setSelectedSDGs(storedSelectedSDGs);
      setResult(storedResult);
      setSelectedEvents(new Set(storedSelectedEvents));
    } else {
      // Data expired, clear it
      clearSuggestions();
    }
  } else if (storedOrgId !== organizationId) {
    // Different organization, clear stored data
    clearSuggestions();
  }
  
  setStoredOrganizationId(organizationId);
  setIsInitialized(true);
}, []);
```

#### Persistence Logic
- **Automatic Sync**: State changes are automatically persisted to the store
- **Initialization Guard**: Prevents overwriting stored data during initialization
- **Two-Way Binding**: Local state and store stay in sync

#### Settings Change Detection
When any of the following settings change, stored results are automatically cleared:
1. **Focus Area Band** (E, S, G, or SEG_overall)
2. **Selected SDGs**
3. **Target Hours**
4. **Target Participants**
5. **Target Score Delta**
6. **Budget Constraint**
7. **Max Events Constraint**
8. **Risk Level Constraint**

#### New UI Features

##### 1. Clear Suggestions Button
- Located in the card header (appears when results exist)
- Icon: `RotateCcw` (rotating counter-clockwise arrow)
- Action: Clears all suggestions and resets form
- Feedback: Shows success toast message

##### 2. Restoration Info Banner
- Appears at the top of results when data is restored
- Shows the date and time when suggestions were generated
- Blue-themed card with checkmark icon
- Helps users understand they're viewing cached results

### 3. User Experience Flow

#### First Visit
1. User fills out the suggestion form
2. Generates suggestions
3. Data is automatically saved to localStorage
4. User can navigate away

#### Return Visit (Same Session)
1. Component loads and checks localStorage
2. If data exists and is valid (not expired, same organization):
   - Restores form data
   - Restores results
   - Restores selected events
   - Shows restoration banner
3. User sees exactly what they left

#### Settings Change
1. User modifies any form setting
2. System automatically detects the change
3. Results are cleared (invalid for new settings)
4. User must generate new suggestions

#### Manual Reset
1. User clicks "Clear Suggestions" button
2. All data is cleared from both state and localStorage
3. Form returns to initial empty state
4. Success toast confirms the action

## Edge Cases Handled

### 1. Data Expiration
**Problem**: Stored data might become stale
**Solution**: 24-hour automatic expiration
```typescript
const dayInMs = 24 * 60 * 60 * 1000;
if (now - timestamp < dayInMs) {
  // Data is fresh, restore it
} else {
  // Data is stale, clear it
}
```

### 2. Organization Switch
**Problem**: User switches to different organization
**Solution**: Automatic validation and clearing
```typescript
if (storedOrgId !== organizationId) {
  clearSuggestions();
}
```

### 3. Invalid State
**Problem**: Corrupted or incomplete data in localStorage
**Solution**: Defensive checks before restoration
```typescript
if (storedOrgId === organizationId && storedResult && timestamp) {
  // All required data exists, safe to restore
}
```

### 4. Settings Change
**Problem**: Stored results no longer match form settings
**Solution**: Automatic clearing when settings change
```typescript
const clearResultsIfNeeded = () => {
  if (result) {
    setResult(null);
    setSelectedEvents(new Set());
  }
};
// Called on every settings input change
```

### 5. Type Safety
**Problem**: Set objects can't be serialized to JSON
**Solution**: Convert Set to Array for storage
```typescript
// Store as array
setStoredSelectedEvents(Array.from(selectedEvents));

// Restore as Set
setSelectedEvents(new Set(storedSelectedEvents));
```

## Technical Benefits

### 1. Performance
- **Fast Restoration**: No need to regenerate suggestions
- **Reduced API Calls**: Cached results don't require server requests
- **Optimized Storage**: Only essential data is persisted

### 2. User Experience
- **No Data Loss**: Users can navigate freely without losing work
- **Session Continuity**: Work persists across page refreshes
- **Clear Feedback**: Visual indicators show when data is restored

### 3. Maintainability
- **Type Safety**: Full TypeScript support
- **Centralized Logic**: All persistence logic in one store
- **Testable**: Pure functions for settings change detection
- **Documented**: Clear comments and structure

## Storage Structure

Data is stored in localStorage under the key `suggestion-storage`:

```json
{
  "state": {
    "formData": {
      "focus": { "band": "E" },
      "targets": { "hours": 500, "participants": 100 },
      "constraints": { "budget": 5000, "maxEvents": 5 }
    },
    "selectedSDGs": ["SDG6", "SDG7", "SDG13"],
    "result": {
      "plan": [...],
      "totals": {...},
      "predictedDelta": {...},
      "sdgsCovered": [...],
      "meets": {...},
      "warnings": [...]
    },
    "selectedEvents": ["event-id-1", "event-id-2"],
    "organizationId": "org-123",
    "timestamp": 1698765432000
  },
  "version": 0
}
```

## Future Enhancements

### Potential Improvements
1. **Cloud Sync**: Sync suggestions across devices
2. **History**: Keep multiple suggestion sets
3. **Comparison**: Compare different suggestion scenarios
4. **Export**: Export suggestions as PDF or CSV
5. **Sharing**: Share suggestions with team members
6. **Smart Expiration**: Different expiration based on settings complexity

### Configuration Options
```typescript
// Could be made configurable
const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours
const MAX_STORED_RESULTS = 5; // Keep last 5 suggestions
const AUTO_CLEAR_ON_SETTINGS_CHANGE = true;
```

## Testing Recommendations

### Manual Testing Checklist
- [ ] Generate suggestions and navigate away
- [ ] Return to page and verify data is restored
- [ ] Change focus band and verify results are cleared
- [ ] Modify targets and verify results are cleared
- [ ] Change constraints and verify results are cleared
- [ ] Click "Clear Suggestions" and verify all data is reset
- [ ] Wait 24 hours and verify data expires
- [ ] Switch organizations and verify data is cleared
- [ ] Clear browser storage and verify graceful handling

### Automated Testing
```typescript
// Example test cases
describe('SuggestionStore', () => {
  it('should persist form data to localStorage');
  it('should restore data on mount');
  it('should clear data after 24 hours');
  it('should clear data when organization changes');
  it('should detect settings changes correctly');
  it('should handle invalid stored data gracefully');
});
```

## Conclusion

This implementation provides a robust, user-friendly solution for persisting suggestion data. It handles edge cases gracefully, maintains type safety, and provides clear feedback to users. The solution is maintainable, testable, and ready for future enhancements.


