# Feature: Miracle Card Confirmation

## Description
Added a confirmation prompt when using miracle cards from inventory. Before executing the card's effect, the system now displays the card details and asks the user to confirm their action.

## Implementation
**`src/components/MainArea.jsx`**:
1. Added `useState` to manage `confirmingMiracle` state.
2. Modified the "Use" button in the inventory to set `confirmingMiracle` instead of directly calling `useMiracle`.
3. Added a confirmation modal that:
   - Displays the card using `CardDisplay` component
   - Shows the card's description and effect
   - Provides "確定使用" (Confirm) and "取消" (Cancel) buttons
   - Only executes `useMiracle` upon confirmation

## User Benefit
- Prevents accidental use of valuable miracle cards
- Allows players to review the card's effect before committing to use it
- Improves overall game UX by adding a safety mechanism for important decisions
