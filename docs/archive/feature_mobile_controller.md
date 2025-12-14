# Feature: Mobile Player Controller

## Overview
Allows players to control the game using their mobile devices by scanning a QR code. The main screen acts as the game board (Host), while mobile devices act as controllers (Clients).

## Architecture
- **PeerJS**: WebRTC-based peer-to-peer connection (Serverless).
- **Host**: Maintains game state, broadcasts updates, executes logic.
- **Client**: Sends actions (Roll, Buy, etc.), receives state updates.
- **Routing**: 
  - `/`: Host (Desktop)
  - `/join`: Client (Mobile)

## How to Use

1. **Setup Game**: Configure teams on the main screen.
2. **Connect Players**:
   - A new "Connection Screen" appears after setup.
   - Players scan the QR code for their team.
   - Mobile device opens the controller interface.
   - Host screen shows "Connected" status.
3. **Start Game**: Click "Start Game" on Host once everyone is connected.
4. **Play**:
   - When it's a player's turn, their mobile controller activates.
   - Actions: Roll Dice, Buy Land, Auction, Pay Rent, Use Miracle Cards.
   - State is synced instantly between Host and all Clients.

## Features

### Host (Main Board)
- **QR Code Generation**: Unique link for each team slot.
- **Connection Management**: See who is connected, disconnect if needed.
- **Hybrid Control**: Can still control the game from the main board (e.g. for players without phones).
- **Desktop Restriction**: Enforces desktop view for the main board.

### Client (Mobile Controller)
- **Real-time Status**: View Cash, Seeds, Cards.
- **Turn Notification**: "It's your turn!" alert.
- **Action Controls**: Context-aware buttons (Roll, Buy, Pay, etc.).
- **Card Management**: View and use Miracle cards.
- **No App Install**: Runs entirely in the mobile browser.

## Technical Details
- **State Sync**: Host broadcasts full state on every update (Optimized for local network/low latency).
- **Security**: Basic validation (Client sends action, Host executes reducer).
- **Persistence**: Host auto-saves game state. Clients re-sync on reconnect.

## Deployment
- Works on Vercel (Client-side routing).
- Uses public PeerServer (0.peerjs.com) by default.
- **Note**: For best performance, ensure devices are on a stable network.
