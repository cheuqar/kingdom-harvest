# Feature: Event Deck Reshuffling

## Description
Ensured that the event deck never runs empty by implementing a discard pile and reshuffling logic.

## Implementation
1.  **Discard Logic**:
    -   **`DRAW_EVENT_CARD`**: When an event card is drawn, if it's NOT a Miracle card, it is immediately added to the `eventDiscard` pile.
    -   **`REMOVE_MIRACLE`**: When a Miracle card is used (removed from player's hand), it is added to the `eventDiscard` pile.
2.  **Reshuffle Logic**:
    -   **`useGameEngine.js`**: Before drawing an event card, checks if the deck is empty.
    -   If empty, it checks the `eventDiscard` pile.
    -   If `eventDiscard` has cards, it shuffles them and creates a new `events` deck, clearing the discard pile.
    -   If both are empty, the game logs "Event deck empty" (rare edge case if all cards are held as Miracles).

## Files Modified
-   `src/state/GameContext.jsx`: Updated `DRAW_EVENT_CARD` and `REMOVE_MIRACLE` reducers.
-   `src/hooks/useGameEngine.js`: (Logic was already present, but enabled by the reducer updates).
