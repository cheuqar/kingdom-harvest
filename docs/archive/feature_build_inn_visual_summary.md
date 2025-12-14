# Feature: Build Inn Visual Enhancements

## Description
Improved the "Build Inn" phase by displaying the specific cost of building an inn directly on each land card, instead of a generic text instruction.

## Implementation
1.  **`MainArea.jsx`**: Removed the static "($500/棟)" text from the instruction.
2.  **`VisualBoard.jsx`**: Updated the `build-overlay` to render:
    -   A hammer icon (🔨).
    -   The specific inn cost for that land (e.g., `$150`).
3.  **`VisualBoard.css`**: Added styles for `.build-icon` and `.build-cost` to ensure visibility and aesthetics (dark background, gold text, drop shadow).

## User Benefit
Players can now see exactly how much it costs to upgrade each specific property without needing to memorize costs or refer to a rulebook.
