# Feature: Relocated Miracle Cards to Right Panel

## Problem
The miracle cards inventory section ("我的神蹟卡") was displayed in the `MainArea` component, which caused it to push down the game board and make it overflow off-screen when players had multiple cards.

## Solution
Reorganized the UI layout by moving the miracle cards inventory to the right panel (LogPanel), splitting it vertically with the game history.

## Implementation

### 1. Moved Miracle Cards to LogPanel (`LogPanel.jsx`)
- Added miracle cards section at the top of the right panel
- Implemented miracle card selection and confirmation modal directly in LogPanel
- Miracle cards section takes up max 30% of the panel height
- Includes the same functionality: click to confirm, highlight series for rent cards

### 2. Removed from MainArea (`MainArea.jsx`)
- Removed the `inventory-section` div
- Removed miracle-related state (`confirmingMiracle`) and handlers
- Removed the miracle confirmation modal
- Cleaned up unused imports

### 3. Split Layout CSS (`LogPanel.css`)
**Miracle Cards Section:**
- Fixed height allocation (max 30% of panel)
- Scrollable if many cards
- Green-tinted background (#4ecca3 with low opacity)
- Compact card items with "使用" button
- Gold-colored card names for visibility

**Game Log Section:**
- Takes remaining space (flex: 1)
- Maintains scrollability
- Clear visual separation

## Visual Design
- **Miracle Cards**: Green-tinted box at top, gold text, compact layout
- **Game Log**: Familiar scrolling log below
- **Separation**: Clear visual boundary between sections
- **Space Efficient**: No more vertical overflow issues

## User Benefit
- Game board no longer gets pushed off-screen
- All miracle cards are always visible in a dedicated area
- Better use of screen real estate
- Quick access to cards without obscuring gameplay area
