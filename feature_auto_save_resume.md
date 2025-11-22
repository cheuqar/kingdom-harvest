# Feature: Auto-Save and Resume Game

## Description
Implemented automatic game state saving to localStorage with the ability to resume or delete saved games from the setup screen.

## Implementation

### 1. Auto-Save Functionality (`GameContext.jsx`)

**useEffect Hook:**
- Monitors game state changes
- Auto-saves to localStorage whenever state updates
- Only saves during active gameplay (excludes SETUP, RULES, GAME_OVER phases)
- Automatically clears save when game ends

**Storage Key:** `monopoly-game-save`

**New Reducer Actions:**
- `LOAD_GAME`: Restores entire game state from saved data
- `CLEAR_SAVE`: Placeholder for manual save clearing

### 2. Resume/Delete UI (`SetupScreen.jsx`)

**On Mount:**
- Checks localStorage for saved game
- Displays saved game section if found

**UI Elements:**
- Green "▶️ 繼續遊戲" button - Resumes saved game
- Red "🗑️ 刪除存檔" button - Deletes saved game

**Functions:**
- `handleResume()`: Loads saved state via LOAD_GAME action
- `handleDeleteSave()`: Removes from localStorage and updates UI

### 3. Styling (`SetupScreen.css`)

**Saved Game Section:**
- Teal-tinted background with border
- Prominent notice message
- Buttons arranged horizontally

**Button Styles:**
- `btn-success`: Green gradient, for resume
- `btn-danger`: Red gradient, for delete
- Hover effects with lift and glow
- Responsive design

## Technical Details

### What Gets Saved
Entire game state including:
- Teams and their stats (cash, seeds, miracles, etc.)
- Land ownership and inn counts
- Current phase and turn index
- Deck states (lands, events, discards)
- Game log
- Timer information

### Save Triggers
- Every state change during active gameplay
- Excludes setup and game over screens
- Error handling for localStorage quota

### Clear Triggers
- Manual delete via button
- Game completion (GAME_OVER phase)
- Starting new game (automatically overwrites)

## User Experience

**Scenarios:**
1. **Player closes during game**: Auto-saved, can resume later
2. **Browser crash**: Last state preserved
3. **Multiple games**: Only one save slot (latest overwrites)
4. **Finished game**: Save auto-deleted

**Visual Feedback:**
- Clear notice when saved game exists
- Distinct button colors (green/red)
- Emoji icons for quick recognition
- Smooth transitions and hover effects

## Safety Features
- Try-catch blocks for localStorage errors
- Validation of saved data structure
- Graceful fallback if save corrupted
- Console logging for debugging
