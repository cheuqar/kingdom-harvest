# Feature: Visual Feedback for Rent Series Cards

## Description
Enhanced the `E_COLLECT_RENT_SERIES` card usage experience by highlighting affected lands on the game board and showing the series name in notification messages.

## Implementation

### 1. Global State Management (`GameContext.jsx`)
- Added `highlightedSeries` to initial state
- Created `SET_HIGHLIGHTED_SERIES` and `CLEAR_HIGHLIGHTED_SERIES` actions

### 2. Miracle Confirmation (`MainArea.jsx`)
- When a rent series card is selected, the series is highlighted on the board
- Highlighting is set when the confirmation modal appears
- Highlighting is cleared when the user confirms or cancels

### 3. Board Highlighting (`VisualBoard.jsx`)
- Lands matching the `highlightedSeries` receive the `highlighted-series` class
- Visual styling includes:
  - Green glow effect (#4ecca3)
  - Pulsing animation
  - Slight scale increase
  - Higher z-index to stand out

### 4. Effect Enhancement (`effects.js`)
- Updated log message to include series name: `執行收租【${params.series}】：...`
- Added automatic highlight clearing 2 seconds after execution
- Clear highlighting immediately if player has no lands in that series

## User Benefit
- Players can visually identify which lands will be affected before confirming the action
- Notification messages now clearly state which series is being used for rent collection
- The combination of visual highlights and series name makes the mechanic more transparent and user-friendly
