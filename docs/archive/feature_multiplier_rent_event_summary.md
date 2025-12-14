# Feature: Random Multiplier Rent Event

## Description
Added a new type of event card that forces the player to pay a multiplied rent (2x or 3x) on a randomly selected land owned by an opponent.

## Implementation
1.  **`src/engine/effects.js`**:
    -   Added `E_PAY_MULTIPLIER_RENT_RANDOM` function.
    -   **Logic**:
        1.  Filters lands owned by other players.
        2.  Selects one at random.
        3.  Calculates current rent for that land (including inn bonuses).
        4.  Multiplies rent by `params.multiplier`.
        5.  Transfers cash from current player to the land owner.
        6.  Triggers `PAY_RENT` animation and logs the event.
2.  **`src/config/events.json`**:
    -   Added "意外開支" (2x rent).
    -   Added "嚴重罰款" (3x rent).

## User Benefit
Introduces more risk and unpredictability to the game, making the event deck more exciting and potentially turning the tide of the game.
