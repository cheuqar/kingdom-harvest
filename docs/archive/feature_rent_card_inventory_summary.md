# Feature: Collect Rent Cards as Miracles

## Description
Changed the behavior of "Collect Rent by Series" event cards. Instead of triggering immediately upon draw, they are now treated as "Miracle" cards, meaning they are added to the player's inventory and can be used strategically at a later time.

## Implementation
-   **`src/config/events.json`**: Updated the `type` field for all `E_COLLECT_RENT_SERIES` cards from `"rent"` to `"miracle"`.

## User Benefit
Gives players more strategic control over when to collect rent, allowing them to wait until they own more properties in a series or until opponents have more cash.
