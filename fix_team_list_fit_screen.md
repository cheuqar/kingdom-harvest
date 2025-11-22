# Fix: Team List Fits 4 Teams Without Scrolling

## Problem
When there are 4 teams, the team list required scrolling to see all teams, making it difficult to view all players at once.

## Solution
Optimized spacing, padding, and element sizes to make the team cards more compact while maintaining readability and the game-feel aesthetic.

## Changes Made

### 1. Card Spacing
- **Gap between cards**: 1rem → 0.5rem
- **Card padding**: 1rem → 0.6rem 0.8rem (reduced by ~40%)
- **Header margin**: 0.5rem → 0.4rem

### 2. Text Sizes
- **Team name**: 1.2rem → 1.1rem
- **Turn badge**: 0.7rem → 0.65rem
- **Hint text**: 0.7rem → 0.65rem

### 3. Stat Boxes
- **Padding**: 8px 4px → 6px 3px
- **Gap**: 4px → 3px
- **Min width**: 60px → 55px
- **Border radius**: 8px → 6px
- **Icon size**: 1.5rem → 1.3rem
- **Value size**: 1.3rem → 1.1rem
- **Margin**: 12px 0 → 8px 0
- **Gap between boxes**: 8px → 6px

### 4. Progress Bar
- **Height**: 14px → 12px
- **Border radius**: 7px → 6px
- **Top margin**: 8px → 6px
- **Text size**: 0.65rem → 0.6rem

### 5. Other Spacing
- **View assets hint margin**: 8px → 4px
- **Turn badge padding**: 2px 6px → 2px 5px

## Result
- All 4 team cards now fit on screen without scrolling
- Maintains visual hierarchy and game-feel aesthetic
- Still readable and visually appealing
- Better use of vertical space
- Smoother gameplay experience without constant scrolling

## Technical Notes
- Added `height: 100%` and `overflow-y: auto` to `.team-list` as a safety measure
- Maintained aspect ratios and visual balance
- All interactive elements remain easily clickable
