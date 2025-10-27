# Suggestion Component Persistence Testing Guide

## 🧪 Testing Steps

### Step 1: Generate Suggestions
1. Open the suggestion component page
2. Select Focus Area (e.g., Environmental)
3. Select some SDGs
4. Fill in Targets (e.g., 500 hours, 100 participants)
5. Click "Generate Suggestions"
6. **Verify**: Should see suggestion results and summary

### Step 2: Navigate Away
1. Click other pages in the navigation bar (e.g., Dashboard, Events)
2. **Verify**: Page should switch normally

### Step 3: Return to Suggestion Page
1. Click "Suggestion" or "ESG" page in the navigation bar
2. **Verify**: Should see the following:
   - Form data restored (Focus Area, SDGs, Targets)
   - Suggestion results restored (Suggested Events list)
   - Suggestion summary restored (Suggestion Summary)
   - Blue banner showing restoration time

### Step 4: Check Console Logs
Open browser developer tools console, should see:
```
Restored suggestion state from storage: {hasResult: true, selectedSDGs: 16, selectedEvents: 0}
```

## 🔍 Verification Points

### ✅ Data Recovery Verification
- [ ] Focus Area selection restored
- [ ] SDGs selection restored
- [ ] Targets values restored
- [ ] Constraints settings restored
- [ ] Suggested Events list displayed
- [ ] Suggestion Summary displayed
- [ ] Blue restoration banner displayed

### ✅ Console Log Verification
- [ ] See "Restored suggestion state from storage" log
- [ ] See "Suggestion result saved to store" log
- [ ] Logs show correct data status

### ✅ Function Verification
- [ ] Can continue selecting events
- [ ] Can create draft events
- [ ] Can add to favorites
- [ ] Old results cleared when settings change

## 🐛 Troubleshooting

### If data is not restored:

1. **Check console logs**
   - Look for error messages
   - Check if restoration logs appear

2. **Check localStorage**
   - Open Developer Tools → Application → Local Storage
   - Look for `suggestion-storage` key
   - Check if `result` field is `null`

3. **Manual data check**
   ```javascript
   // Run in browser console
   const data = localStorage.getItem('suggestion-storage');
   const parsed = JSON.parse(data);
   console.log('Stored result:', parsed.state.result);
   console.log('Has result:', !!parsed.state.result);
   ```

### If there are still issues:

1. **Clear storage and retry**
   ```javascript
   // Run in browser console
   localStorage.removeItem('suggestion-storage');
   location.reload();
   ```

2. **Check organization ID**
   - Ensure testing under the same organization
   - Switching organizations will clear data

3. **Check timestamp**
   - Data expires after 24 hours
   - Check `timestamp` field

## 📊 Expected Results

### Success Case
- All data completely restored after navigation
- Console shows correct restoration logs
- Blue banner shows restoration time
- Functions work normally

### Failure Case
- Data not restored
- Console shows errors
- Functions abnormal

## 🎯 Test Scenarios

### Scenario 1: Basic Navigation
1. Generate suggestions → Navigate to other pages → Return
2. **Expected**: Data completely restored

### Scenario 2: Browser Refresh
1. Generate suggestions → Refresh page (F5)
2. **Expected**: Data completely restored

### Scenario 3: Tab Switching
1. Generate suggestions → Switch tabs → Return
2. **Expected**: Data completely restored

### Scenario 4: Settings Modification
1. Generate suggestions → Modify Focus Area → View results
2. **Expected**: Old results cleared, need to regenerate

## ✅ Success Criteria

- [ ] Suggestion results correctly saved and restored
- [ ] Suggestion summary correctly saved and restored
- [ ] Form data correctly saved and restored
- [ ] Console logs display correctly
- [ ] Functions work normally
- [ ] Good user experience

---

**Test Status**: Pending verification
**Fix Version**: v1.2
**Test Date**: October 24, 2025

