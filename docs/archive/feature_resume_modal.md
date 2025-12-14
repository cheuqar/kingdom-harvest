# Enhancement: Resume Modal for Space Efficiency

## Problem
With 4 players selected, the setup screen was overflowing vertically, requiring scrolling to see all elements.

## Solution
Moved the saved game details to a confirmation modal, showing only a simple "Resume" button on the main screen.

## Changes Made

### 1. Compact Setup Screen
**Before:**
- Large saved game section with all details inline
- Time, team count, current player, phase all visible
- Resume and Delete buttons taking vertical space

**After:**
- Single "▶️ 繼續上次遊戲" button
- Clean, minimal appearance
- Saves ~150px of vertical space

### 2. Confirmation Modal

**Trigger:** Click "Resume" button

**Modal Contents:**
- Title: "繼續遊戲"
- Save time ("最後儲存：X ago")
- Game summary box:
  - 隊伍數量 (Team count)
  - 當前玩家 (Current player)
  - 遊戲階段 (Game phase)
- Question: "確定要繼續這場遊戲嗎？"
- Three buttons:
  - ✅ **確定繼續** (green) - Loads game
  - ❌ **刪除存檔** (red) - Deletes save
  - ⬜ **取消** (gray) - Closes modal

### 3. Modal Design

**Layout:**
- Full-screen overlay with dark background
- Centered modal box
- Gradient background (blue shades)
- Green bordered for "resume" theme
- Click outside to close

**Buttons:**
- Vertical stack for mobile-friendly layout
- Full-width buttons for easy clicking
- Color-coded by action type
- Hover effects maintained

### 4. Space Savings

**Vertical Space Recovered:**
- Team name inputs: Still compact
- Resume section: ~120px saved
- Better distribution of elements
- Everything fits on
 single screen (1080p+)

## User Experience

**Flow:**
1. User sees simple "Resume" button if save exists
2. Clicks button to review details
3. **Sees full game info in modal**
4. Makes informed decision:
   - Continue game
   - Delete save
   - Cancel and start new

**Benefits:**
- ✅ Clean setup screen
- ✅ No scrolling needed
- ✅ Still shows all details before resume
- ✅ Confirmation step prevents accidents
- ✅ Easy to dismiss modal

## Technical Notes

**State Management:**
- Added `showResumeModal` state
- Modal only renders when `showResumeModal && savedGame`
- Click overlay or cancel to close

**Event Handlers:**
- `handleResumeClick()` - Opens modal
- `handleConfirmResume()` - Loads game
- `handleDeleteSave()` - Removes save + closes modal
- Click overlay - Closes modal

**CSS:**
- Modal overlay: `position: fixed`, full viewport
- `.resume-modal`: Centered, max-width 400px
- `.btn-resume`: Full-width green button
- Responsive design maintained
