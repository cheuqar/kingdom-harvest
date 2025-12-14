# Bug Fix: Multiple Dice Rolls Prevention

## Issue
Players could click the "Toss" (擲骰子) button multiple times during their turn, causing the dice to be rolled multiple times and creating inconsistent game state.

## Root Cause
The `rollDice` function in `useGameEngine.js` didn't immediately change the game phase after being called. The phase change happened later inside `setTimeout` callbacks, creating a window where the button remained clickable and the function could be called multiple times.

## Solution
Added two safeguards to the `rollDice` function:

1. **Phase Guard**: Added a check at the beginning of `rollDice` to return immediately if `state.phase !== 'ROLL'`
2. **Immediate Phase Change**: Immediately dispatch `SET_PHASE` to `'ROLLING'` after rolling the dice, preventing the button from being clickable again

## Code Changes
**File**: `src/hooks/useGameEngine.js`
- Added phase check: `if (state.phase !== 'ROLL') { return; }`
- Added immediate phase change: `dispatch({ type: 'SET_PHASE', payload: 'ROLLING' });`

## Result
The dice button can now only be clicked once per turn, ensuring consistent game state and preventing exploits.
