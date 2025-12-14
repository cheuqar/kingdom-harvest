# Feature: Display Current Cash in Decision Phases

## Description
Added visible cash balance displays to help players make informed decisions during purchase, build, and auction phases.

## Implementation

### 1. Purchase Land Modal (`MainArea.jsx`)
- Added a prominent cash display showing "您的現金：$X"
- Displayed between the land card and action buttons
- Styled in green (#4ecca3) for easy visibility
- Already had an error message for insufficient funds

### 2. Build Inn Phase (`MainArea.jsx`)
- Added cash display to the build inn controls
- Shows current cash amount above the "結束回合" button
- Players can see if they have enough money before clicking on a land

### 3. Auction Interface (`AuctionInterface.jsx`)
- **Already implemented**: Each bidder card shows their cash as "現金: $X"
- Bid buttons are automatically disabled if the player can't afford the bid

## Visual Design
- Cash amounts are displayed in bold green (#4ecca3) for consistency
- Font size is slightly larger (1.1rem) for readability
- Positioned strategically near action buttons for easy reference

## User Benefit
Players can now:
- Quickly see their available funds when making purchase decisions
- Avoid attempting actions they can't afford
- Make better strategic decisions about building inns
- Understand their financial position during auctions
