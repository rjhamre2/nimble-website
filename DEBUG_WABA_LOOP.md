# Debug: Infinite Loop in checkWabaDetails API Calls

## The Problem
The API `GET /api/users/{db_id}` is being called indefinitely.

## Root Causes

### Issue 1: Circular Dependency in useEffect at Line 3515-3520
**Location:** Lines 3515-3520

**Dependencies:**
```javascript
[activeTab, activeChannel, isWabaModalOpen, user, userData, isCheckingWaba, isWabaDetailsEmpty, checkWabaDetails]
```

**Problem:**
- `checkWabaDetails` sets `isWabaDetailsEmpty` (line 3475)
- `checkWabaDetails` sets `activeTab` to 'channels' (line 3481)
- `checkWabaDetails` sets `activeChannel` to 'whatsapp' (line 3482)
- These are ALL in the dependency array!
- **Loop:** checkWabaDetails() → sets isWabaDetailsEmpty/activeTab/activeChannel → useEffect triggers → calls checkWabaDetails() again

**Condition that triggers it:**
```javascript
if (activeTab === 'channels' && activeChannel === 'whatsapp' && !isWabaModalOpen && user && userData && !isCheckingWaba && isWabaDetailsEmpty)
```

### Issue 2: checkWabaDetails in Dependency Arrays
**Locations:**
1. Line 3512: `[user, userData, loading, isWelcomeModalOpen, checkWabaDetails]`
2. Line 3520: `[activeTab, activeChannel, isWabaModalOpen, user, userData, isCheckingWaba, isWabaDetailsEmpty, checkWabaDetails]`
3. Line 3600: `[user, loading, isWelcomeModalOpen, isCheckingWaba, isWabaModalOpen, checkWabaDetails, userData]`

**Problem:**
- When `user` or `userData` changes, `checkWabaDetails` function is recreated (because it depends on them)
- This triggers all three useEffects to run again
- Each useEffect calls `checkWabaDetails()` again

### Issue 3: Multiple useEffects Calling the Same Function
There are **3 different useEffects** all calling `checkWabaDetails`:
1. Line 3503-3512: When user data is available
2. Line 3515-3520: When WhatsApp channel is selected
3. Line 3536-3600: Auto-check when user is authenticated

All three can potentially trigger at the same time or in sequence, causing multiple calls.

## The Fix

1. **Remove `checkWabaDetails` from all dependency arrays** - use `useCallback` with stable dependencies
2. **Remove `isWabaDetailsEmpty`, `activeTab`, `activeChannel` from the dependency array at line 3520** - these are set BY the function, not needed as dependencies
3. **Add a ref to track if check has already been done** to prevent re-checking
4. **Consolidate the useEffects** or add better guards

