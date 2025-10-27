# Suggestion Component Persistence Testing Guide

## Problem Fix

### Original Problem
When users navigate to other components or pages, Suggested Events and Suggestion Summary data were not being saved.

### Fix Content
1. **Added data saving on component unmount**
2. **Added periodic automatic saving (every 5 seconds)**
3. **Added saving on page visibility changes**
4. **Added saving before page unload**
5. **Improved store persistence configuration**

## Testing Steps

### Test 1: Basic Navigation Test
1. Open the suggestion component page
2. Fill out the form (select Focus Area, SDGs, etc.)
3. Click "Generate Suggestions"
4. View the generated suggestion results
5. **Navigate to other pages** (such as Dashboard, Events, etc.)
6. **Return to the suggestion component page**
7. **Verify**: Data should be completely restored

### Test 2: Browser Refresh Test
1. Fill out the suggestion form and generate results
2. **Refresh the browser page** (F5 or Ctrl+R)
3. **Verify**: Data should be completely restored

### Test 3: Tab Switching Test
1. Fill out the suggestion form and generate results
2. **Switch to other browser tabs**
3. **Switch back to the original tab**
4. **Verify**: Data should be completely restored

### Test 4: Browser Close and Reopen Test
1. Fill out the suggestion form and generate results
2. **Close the browser**
3. **Reopen the browser and navigate to the suggestion page**
4. **Verify**: Data should be completely restored (within 24 hours)

### Test 5: Console Log Verification
Open browser developer tools console, should see the following logs:

```
Suggestion store rehydrated from localStorage
Form data saved to store: {focus: {...}, targets: {...}, constraints: {...}}
Selected SDGs saved to store: ["SDG6", "SDG7"]
Result saved to store: Has result
Selected events saved to store: ["event-id-1", "event-id-2"]
All suggestion data force-saved to store
```

## Verification Points

### ✅ Data Recovery Verification
- [ ] Form data restored (Focus Area, Targets, Constraints)
- [ ] Selected SDGs restored
- [ ] Suggestion results restored (Suggested Events list)
- [ ] Suggestion summary restored (Suggestion Summary)
- [ ] Selected events restored (checkbox states)

### ✅ Timestamp Verification
- [ ] Correct generation time displayed on restoration
- [ ] Blue info banner shows restoration time

### ✅ Cleanup Mechanism Verification
- [ ] Old results cleared when Focus Area is modified
- [ ] Old results cleared when Targets are modified
- [ ] Old results cleared when Constraints are modified
- [ ] All data cleared when "Clear Suggestions" button is clicked

## Troubleshooting

### If data is still not saved:

1. **Check browser console**
   - Look for error messages
   - Check if save logs appear

2. **Check localStorage**
   - Open Developer Tools → Application → Local Storage
   - Look for `suggestion-storage` key
   - Verify data exists

3. **Check organization ID**
   - Ensure testing under the same organization
   - Switching organizations will clear data

4. **Check timestamp**
   - Data expires after 24 hours
   - Check timestamp field

### Manual localStorage verification
```javascript
// Run in browser console
const data = localStorage.getItem('suggestion-storage');
console.log('Stored data:', JSON.parse(data));
```

## Expected Behavior

### Normal Case
- Data automatically saved to localStorage
- Data completely restored after navigation
- Console shows save logs
- Blue banner shows restoration info

### Abnormal Case
- Data expired (after 24 hours)
- Organization switch
- Browser localStorage disabled
- Insufficient storage space

## Performance Considerations

### Save Frequency
- **Real-time saving**: On every state change
- **Periodic saving**: Every 5 seconds (if there is data)
- **Event saving**: Page switching, tab switching, page unload

### Storage Size
- Typical size: 10-50KB
- Maximum size: Usually < 100KB
- Cleanup mechanism: Automatic expiration after 24 hours

## Success Criteria

✅ **Data Persistence**: Data completely restored after navigation
✅ **Good Performance**: Save operations don't affect user experience
✅ **Error Handling**: Gracefully handles various abnormal situations
✅ **User Feedback**: Clear visual indicators
✅ **Code Quality**: No linting errors, type safety

---

**Test Status**: Pending verification
**Fix Version**: v1.1
**Test Date**: October 24, 2025

