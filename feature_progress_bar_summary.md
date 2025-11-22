# Feature: 7-Roll Bonus Progress Bar

## Description
Added a visual progress bar to each player's card in the Team List to track their progress towards the 7-roll cash replenishment bonus.

## Implementation
- **Component**: `TeamList.jsx`
- **Logic**: Calculates progress as `(team.rollCount % 7) / 7`.
- **Visuals**:
    - Gradient progress bar (Gold/Orange).
    - Text overlay showing current count (e.g., "3 / 7").
    - Tooltip explaining the bonus ("每7次擲骰獲得獎勵").

## User Benefit
Players can now easily see how close they (and their opponents) are to receiving the $1000 bonus, adding a layer of anticipation and strategy.
