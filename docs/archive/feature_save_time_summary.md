# Enhancement: Save Time and Game Summary Display

## New Features

### 1. Save Timestamp
**Storage Format:**
```json
{
  "gameState": { /* full game state */ },
  "timestamp": 1732263720000
}
```

**GameContext.jsx:**
- Wraps game state with timestamp when saving
- Stores `Date.now()` milliseconds

### 2. Time Ago Display

**Helper Function:** `getTimeAgo(timestamp)`

**Formats:**
- `X 秒前` - Less than 1 minute
- `X 分鐘前` - Less than 1 hour  
- `X 小時前` - Less than 1 day
- `X 天前` - 1 day or more

**Display:**
- Shown below main notice
- Italic, lighter color
- Updates on component mount

### 3. Game Summary

**Information Displayed:**
1. **隊伍數量** - Number of teams in the game
2. **當前玩家** - Name of current player's turn
3. **遊戲階段** - Current game phase

**Data Source:**
- `savedGame.teams.length`
- `savedGame.teams[currentTeamIndex].name`
- `savedGame.phase`

**Safety:**
- Uses optional chaining (`?.`)
- Fallback values (`|| '-'`, `|| 0`)
- Handles missing/corrupted data

### 4. Backwards Compatibility

**Handles Two Formats:**
1. **New format** (with timestamp):
   ```json
   { "gameState": {...}, "timestamp": 123456 }
   ```

2. **Old format** (direct state):
   ```json
   { "teams": [...], "phase": "...", ... }
   ```

**Detection Logic:**
```js
if (saveData.gameState) {
  // New format
  setSavedGame(saveData.gameState);
  setSaveTimestamp(saveData.timestamp);
} else {
  // Old format
  setSavedGame(saveData);
  setSaveTimestamp(null);
}
```

## Visual Design

### Save Time
- Center-aligned
- Italic text
- Slightly transparent (70% opacity)
- 0.9rem font size

### Game Summary Box
- Dark semi-transparent background
- Rounded corners
- List of key-value pairs
- Divider lines between items

### Summary Items
- Two-column layout (label/value)
- Labels in gray, values in white
- Values are bold for emphasis
- Last item has no divider

## User Experience

**Before Resume:**
Users can now see:
- ✅ When they last played ("5 分鐘前")
- ✅ How many teams are in the game
- ✅ Whose turn it is
- ✅ What phase the game is in

**Confidence:**
- Players can confirm it's the right save
- Avoid accidental resume of wrong game
- Clear context before loading

## Technical Notes

**Timestamp:**
- Stored in milliseconds (Unix epoch)
- Calculated: `Date.now() - timestamp`
- Auto-updates on component mount
- Cleared when save deleted

**Error Handling:**
- Try-catch for JSON parsing
- Console errors logged
- Graceful fallback to no timestamp
- No crash if data corrupted
