# Bug Fixes Summary

## 1. 7-Roll Bonus Not Triggering (Stale State Issue)
**Issue:** The 7-roll bonus was being overwritten by subsequent game logic due to stale state in closures.
**Fix:** Implemented `ADD_CASH` reducer action to perform atomic cash updates based on the current state. Updated all cash operations (`buyLand`, `payRent`, `sellLand`, `buildInn`, and all `effects.js`) to use `ADD_CASH`.

## 2. 7-Roll Bonus Logic Error (Global vs Per Player)
**Issue:** The 7-roll bonus was using a global roll count, meaning the bonus triggered every 7th roll of the *game*, regardless of who rolled it.
**Fix:** 
- Updated `GameContext` to track `rollCount` for each individual team.
- Updated `useGameEngine` to check `currentTeam.rollCount` instead of the global `state.rollCount`.
- The bonus now correctly triggers when a specific player rolls their 7th, 14th, etc. time.

## 3. Browser Console Error (ReferenceError)
**Issue:** `ownedLands` was undefined in `TeamList.jsx` causing a crash.
**Fix:** Restored the definition of `ownedLands` in `TeamList.jsx`.

## 4. Animation Enhancements
**Feature:** Added visual feedback for key game events.
**Implementation:**
- **Miracle Card**: Flash and particle effects.
- **Pay Rent**: Flying money animation.
- **Acquire Land**: Flying card animation.
- **Stacked Cards**: Visual stack effect on team cards based on asset count.
- **Event Cards**: Shake effect and overlay.
