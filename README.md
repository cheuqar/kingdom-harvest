# Kingdom Harvest - 天國大富翁

> A biblical-themed Monopoly-style board game with real-time multiplayer support

**"多種的多收，有的還要加給他"** - Sow much, harvest much; to those who have, more will be given.

---

## Live Demo

**Play now for free:** [https://kingdom-harvest.vercel.app](https://kingdom-harvest.vercel.app)

No registration required. Just open the link, configure your teams, and start playing!

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Gameplay Instructions](#gameplay-instructions)
- [Game Mechanics](#game-mechanics)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Privacy & Data](#privacy--data)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Overview

**Kingdom Harvest (天國大富翁)** is a web-based multiplayer board game that combines classic Monopoly mechanics with biblical education. Players collect lands representing authentic biblical locations, answer Scripture trivia questions, and participate in a unique "seed" system that embodies the spiritual principle of sowing and reaping.

### Key Differentiators from Classic Monopoly

| Feature | Classic Monopoly | Kingdom Harvest |
|---------|-----------------|-----------------|
| Movement | Roll dice, move around board | Roll dice for action type |
| Properties | Land on space to buy | Draw land cards from deck |
| Purchase | Pay money to buy | Answer biblical question to buy |
| Improvements | Houses/Hotels | Inns (客棧) |
| Special Cards | Chance/Community Chest | 77 Event Cards with biblical themes |
| Endgame | Bankrupt all opponents | Seed bonus calculation + final ranking |
| Multiplayer | Physical board only | Real-time web-based with device sync |

---

## Features

### Core Gameplay
- **24 Biblical Land Cards** - Properties representing locations from Scripture (示劍, 伯特利, 耶路撒冷, etc.)
- **6 Land Series** - From "祖先與應許" to "普世與啟示"
- **77 Event Cards** - Diverse events including rent collection, trials, miracles, and decisions
- **Biblical Trivia System** - Answer Scripture questions to purchase lands
- **Auction Mechanism** - Declined lands go to competitive bidding

### Unique Systems
- **Seed Mechanism (播種系統)** - Long-term investment through giving; seeds multiply final score
- **Miracle Cards (神蹟卡)** - Holdable cards for emergency use during gameplay
- **Offering Events (奉獻)** - Every 7th roll triggers tithing decisions with seed rewards
- **Series Bonuses** - Collect 2-4 lands in a series for 2x-4x rent multipliers

### Multiplayer Features
- **Real-time Sync** - Firebase-powered game state synchronization
- **QR Code Join** - Scan to connect devices to game room
- **Device Per Team** - Each team can play from their own mobile device
- **Device Takeover** - Approval system for replacing disconnected devices
- **Host-Client Model** - Host controls game flow; clients send action requests

### User Experience
- **Auto-Save** - Game state preserved in localStorage and Firebase
- **Resume Games** - Continue interrupted sessions
- **Scheduled Games** - Pre-configure settings before game time
- **Mid-Game Leaderboard** - Rankings displayed after offering rounds
- **Animation System** - Visual feedback for game events
- **Structured Logging** - Comprehensive game event tracking

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| Vite | 7.2.4 | Build Tool |
| React Router DOM | 7.9.6 | Client-side Routing |
| CSS3 | - | Styling (33 stylesheets) |
| qrcode.react | 4.2.0 | QR Code Generation |

### Backend / Real-time
| Technology | Purpose |
|------------|---------|
| Firebase Realtime Database | Game state sync & persistence |
| Firebase (Asia Southeast) | Low-latency regional hosting |

### Development
| Technology | Purpose |
|------------|---------|
| ESLint | Code linting |
| Vercel | Deployment platform |

---

## Architecture

### State Management

```
┌─────────────────────────────────────────────────────────┐
│                    GameContext.jsx                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  Game State                      │   │
│  │  - teams[] (cash, seeds, lands, miracles)       │   │
│  │  - currentTeamIndex                              │   │
│  │  - phase (ROLL, DRAW_LAND, AUCTION, etc.)       │   │
│  │  - lands{} (ownership, inn counts)              │   │
│  │  - deck (land cards, event cards)               │   │
│  │  - auction (bidding state)                      │   │
│  │  - offering (tithing state)                     │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                    useReducer                           │
│                         │                               │
│              ┌──────────┴──────────┐                   │
│              ▼                      ▼                   │
│         dispatch()            Firebase Sync             │
└─────────────────────────────────────────────────────────┘
```

### Network Architecture

```
┌─────────────┐         Firebase          ┌─────────────┐
│    HOST     │◄─────────────────────────►│   CLIENT    │
│  GameBoard  │    Realtime Database      │ Controller  │
│             │                           │             │
│ - Game logic│  games/{roomId}/state     │ - Read-only │
│ - State mgmt│  games/{roomId}/actions   │ - Send acts │
│ - Broadcast │  games/{roomId}/teams     │ - Receive   │
└─────────────┘                           └─────────────┘
       │                                         │
       │         ┌───────────────┐              │
       └────────►│ Firebase RTDB │◄─────────────┘
                 │               │
                 │ - State sync  │
                 │ - Action queue│
                 │ - Team registry│
                 └───────────────┘
```

### Component Hierarchy

```
App
├── GameBoard (Host)
│   ├── SetupScreen
│   ├── RulesScreen
│   ├── VisualBoard (24 land spaces)
│   ├── TeamList (player cards)
│   ├── MainArea
│   │   ├── CardDisplay
│   │   ├── QuestionModal
│   │   ├── AuctionInterface
│   │   └── OfferingModal
│   ├── LogPanel
│   └── SystemMenu
│
├── PlayerController (Client)
│   ├── ConnectionScreen
│   ├── Team-specific controls
│   └── Read-only game state
│
├── ScheduleGameScreen
├── LobbyScreen
└── GameOverScreen
```

---

## Gameplay Instructions

### Game Setup

1. **Host Creates Game**
   - Open the app on a desktop/tablet (1024px+ width required)
   - Configure team names and colors (2-4 teams)
   - Select event deck and timer settings
   - Click "Start Game"

2. **Players Join**
   - Scan QR code or enter room code on mobile devices
   - Select team to join
   - Wait for host to start

### Turn Flow

```
┌──────────────────────────────────────────────────────────┐
│                      ROLL DICE                           │
│                         │                                │
│    ┌────────┬────────┬──┴───┬────────┬────────┐        │
│    ▼        ▼        ▼      ▼        ▼        ▼        │
│  Roll 1   Roll 2   Roll 3  Roll 4  Roll 5   Roll 6    │
│    │        │        │      │        │        │        │
│    └────────┴────────┘      │        └────────┘        │
│           │                 │              │            │
│     Draw Land Card    Random Land    Draw Event Card   │
│           │            Phase              │            │
│           ▼                │              ▼            │
│    Answer Question    Pick any land   Execute Effect   │
│           │           on board              │            │
│    ┌──────┴──────┐         │              │            │
│    ▼             ▼         ▼              │            │
│ Correct      Wrong    Process Land       │            │
│    │             │         │              │            │
│ Buy/Skip     AUCTION       │              │            │
│    │             │         │              │            │
│    └─────────────┴─────────┴──────────────┘            │
│                         │                               │
│                    NEXT TURN                            │
└──────────────────────────────────────────────────────────┘
```

### Dice Roll Outcomes

| Roll | Action | Description |
|------|--------|-------------|
| 1-2 | Draw Land | Draw from land deck, answer question to buy |
| 3 | Random Land | Choose any land on the board to interact with |
| 4 | Build Inn | Build inns on owned lands (or draw land if none owned) |
| 5-6 | Draw Event | Draw event card and execute its effect |

### Special Events

**Every 7th Roll - Replenishment & Offering:**
1. Receive $1000 from the bank
2. Offering modal appears with choices:
   - **10% Tithe**: Pay 10% of income since last offering → Gain seeds (1 per $100)
   - **20% Double Tithe**: Pay 20% → Gain double seeds
   - **Skip**: No payment, no seeds
3. After all teams complete → Leaderboard displays

### Winning the Game

**Victory Conditions:**
- All other teams go bankrupt, OR
- Game timer expires (highest score wins)

**Final Score Calculation:**
```
Base Assets = Cash + Total Land Value

Seed Bonus = (Your Seeds / Total Seeds) × Total Base Assets

Final Score = Base Assets + Seed Bonus
```

---

## Game Mechanics

### Land System

**6 Series, 24 Lands Total:**

| Series | Theme | Lands | Price Range |
|--------|-------|-------|-------------|
| 1 | 祖先與應許 (Ancestral & Promise) | 4 | $150 - $225 |
| 2 | 出埃及與曠野 (Exodus & Wilderness) | 4 | $240 - $285 |
| 3 | 王國與敬拜 (Kingdom & Worship) | 4 | $315 - $375 |
| 4 | 耶穌腳蹤 (Jesus' Footsteps) | 4 | $390 - $435 |
| 5 | 宣教拓展 (Missionary Expansion) | 4 | $450 - $495 |
| 6 | 普世與啟示 (Universal & Revelation) | 4 | $525 - $600 |

**Series Bonus Multipliers:**
| Lands Owned | Rent Multiplier |
|-------------|-----------------|
| 2 in series | 2.0x |
| 3 in series | 3.0x |
| 4 in series (complete) | 4.0x |

### Inn Building

- Build inns on owned lands during Roll 4 phase
- Each inn increases rent by `innRentIncrement`
- Maximum inns per land: 4
- Inn cost varies by land

### Seed System (播種)

Seeds represent spiritual investment through giving:

**Gaining Seeds:**
- Offering events (tithing)
- Event cards that involve sacrifice/giving
- Decision card choices

**Seed Benefits:**
- Some event cards give bonus cash per seed
- Major endgame bonus based on seed proportion

**Strategy:**
- More seeds = larger share of total wealth redistribution
- Balance immediate cash vs. long-term seed investment

### Event Card Types

| Type | Description | Example |
|------|-------------|---------|
| Rent Collection | Collect rent from opponents | "收取所有系列一地產租金" |
| Seed Events | Pay to gain seeds | "暗中祝福肢體: -$100, +1 seed" |
| Harvest Events | Cash scaled by seeds | "收成: +$50 per seed" |
| Trial Events | Challenges/costs | "試煉: -$200" |
| Miracle Cards | Kept in hand for later | "五餅二魚: Half payment + grant" |
| Decision Cards | Choose Y/N outcome | "是否奉獻? Y: -$300/+2 seeds" |

### Auction System

Triggered when a player declines or fails to purchase a land:

1. Starting bid: 50% of land price
2. All teams except current player can bid
3. Sequential bidding with pass option
4. Highest bidder wins the land
5. If no bids, land returns to deck

### Biblical Questions

Each land has an associated Scripture trivia question:

- **Format:** Multiple choice (4 options) or text input
- **Correct Answer:** Can purchase the land
- **Wrong Answer:** Land goes to auction

**Example:**
> 亞伯蘭在示劍為耶和華築了什麼？
> - A) 壇 ✓
> - B) 祭壇
> - C) 房子
> - D) 井

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (for multiplayer)

### Local Development

```bash
# Clone repository
git clone https://github.com/cheuqar/kingdom-harvest.git
cd kingdom-harvest

# Install dependencies
cd app
npm install

# Start development server
npm run dev

# Open http://localhost:5174
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable Realtime Database:
   - Go to Build → Realtime Database
   - Create database (start in test mode)
   - Select Asia Southeast region for best performance

3. Get your config:
   - Go to Project Settings → General
   - Add a web app
   - Copy the firebaseConfig object

4. Update config file:
```javascript
// app/src/config/firebase.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.asia-southeast1.firebasedatabase.app",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

---

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect GitHub for auto-deploy
```

**Configuration (vercel.json):**
```json
{
  "buildCommand": "cd app && npm install && npm run build",
  "outputDirectory": "app/dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Build for Production

```bash
cd app
npm run build
# Output: app/dist/
```

---

## Configuration

### Game Settings (app/src/config/config.json)

```json
{
  "initialCash": 3000,           // Starting money per team
  "minTeams": 2,                 // Minimum teams to start
  "maxTeams": 4,                 // Maximum teams allowed
  "forceLiquidateBeforeBankrupt": true,
  "diceMode": "internal",        // Virtual dice
  "seriesBonus": {
    "2": 2.0,                    // 2 lands = 2x rent
    "3": 3.0,                    // 3 lands = 3x rent
    "4": 4.0                     // Complete series = 4x rent
  },
  "enableSeeds": true,
  "logMaxEntries": 100
}
```

### Land Cards (app/src/config/lands.json)

```json
{
  "id": "land_1",
  "name": "示劍",
  "series": 1,
  "price": 150,
  "baseRent": 20,
  "innRentIncrement": 15,
  "innCost": 75,
  "bibleRef": "創 12:6-7"
}
```

### Event Cards (app/src/config/events.json)

```json
{
  "id": "event_1",
  "name": "收取租金",
  "description": "收取所有系列一地產租金",
  "effectCode": "E_COLLECT_RENT_SERIES",
  "effectParams": { "series": 1 },
  "type": "rent"
}
```

---

## Project Structure

```
kingdom-harvest/
├── README.md                         # Project documentation
├── LICENSE                           # MIT License
├── vercel.json                       # Deployment config
│
├── app/                              # Main application
│   ├── src/
│   │   ├── components/               # React components (29+)
│   │   │   ├── GameBoard.jsx         # Main host interface
│   │   │   ├── PlayerController.jsx  # Mobile client interface
│   │   │   ├── MainArea.jsx          # Central action area
│   │   │   ├── VisualBoard.jsx       # Board visualization
│   │   │   ├── TeamList.jsx          # Team sidebar
│   │   │   ├── CardDisplay.jsx       # Card presentation
│   │   │   ├── QuestionModal.jsx     # Biblical quiz
│   │   │   ├── AuctionInterface.jsx  # Bidding UI
│   │   │   ├── OfferingModal.jsx     # Tithing decisions
│   │   │   └── ...
│   │   ├── config/                   # Game data
│   │   │   ├── config.json           # Game settings
│   │   │   ├── lands.json            # 24 land definitions
│   │   │   ├── events.json           # 77 event cards
│   │   │   ├── events_money.json     # Alternative deck
│   │   │   ├── questions.json        # Trivia questions
│   │   │   └── firebase.js           # Firebase config
│   │   ├── engine/
│   │   │   └── effects.js            # Event effect handlers
│   │   ├── hooks/
│   │   │   ├── useGameEngine.js      # Core game logic
│   │   │   └── useNetwork.js         # Firebase networking
│   │   ├── state/
│   │   │   └── GameContext.jsx       # Global state management
│   │   ├── utils/
│   │   │   ├── gameUtils.js          # Rent calculations
│   │   │   └── logger.js             # Logging system
│   │   ├── App.jsx                   # Root component
│   │   ├── App.css                   # Global styles
│   │   └── main.jsx                  # Entry point
│   ├── public/                       # Static assets
│   ├── package.json
│   └── vite.config.js
│
└── docs/                             # Documentation
    ├── DEPLOYMENT.md                 # Deployment guide
    ├── FIREBASE_SETUP.md             # Firebase setup guide
    ├── GAME_SPEC.md                  # Game specification
    ├── LAND_CARDS.md                 # Land card details
    ├── EVENT_CARDS.md                # Event card details
    └── archive/                      # Historical documentation
```

---

## Biblical Foundation

### Core Theme

The game embodies the biblical principle from **Matthew 25** (Parable of Talents) and **2 Corinthians 9:6** (Sowing & Reaping):

> "多種的多收，有的還要加給他"
>
> *"Whoever sows generously will also reap generously... To everyone who has, more will be given."*

### How the Theme Manifests

| Game Mechanic | Spiritual Principle |
|---------------|---------------------|
| Seed System | Faithful giving multiplies blessings |
| Series Bonus | Good stewardship yields returns |
| Offering Events | Tithing leads to spiritual harvest |
| Miracle Cards | God's provision in times of need |
| Biblical Questions | Scripture knowledge rewards |

### Authentic Biblical Locations

All 24 lands are real locations from Scripture:
- **示劍 (Shechem)** - Genesis 12:6-7
- **伯特利 (Bethel)** - Genesis 28:16-19
- **耶路撒冷 (Jerusalem)** - 1 Kings 8, Psalm 122
- **拿撒勒 (Nazareth)** - Luke 2:39-40
- **羅馬 (Rome)** - Acts 28, Book of Romans
- *...and 19 more biblical locations*

---

## Screenshots

*Screenshots demonstrating:*
- Setup screen with team configuration
- Game board in action
- Mobile controller interface
- Question modal with biblical trivia
- Auction interface
- Offering modal
- Game over screen with final rankings

---

## Privacy & Data

### Data Storage

This game stores data in two locations:

**Local Storage (Browser)**
- Game state for auto-save/resume functionality
- Room ID for reconnection
- Data stays on your device and is not transmitted externally
- Cleared when you clear browser data or start a new game

**Firebase Realtime Database (Cloud)**
- Game room data for multiplayer synchronization
- Includes: team names, game state, actions queue
- Data is stored under a unique 6-character room ID
- No personal information or accounts required

### Data Retention

- **Local Storage**: Persists until manually cleared or browser data is deleted
- **Firebase Data**: Game room data persists in the database until periodically cleaned up by administrators

### No Account Required

- No user registration or login needed
- No personal information collected
- No cookies for tracking purposes
- Anonymous gameplay experience

### Third-Party Services

- **Firebase** (Google): Used for real-time game synchronization
- **Vercel**: Hosting platform for the web application
- **Google Analytics**: Basic usage analytics (page views)

---

## Roadmap

We have exciting plans for future development! Here's what's on the horizon:

### Enhanced Graphics
- Upgraded visual design with richer animations
- Improved card artwork and board aesthetics
- Sound effects and background music
- Mobile-responsive improvements

### Event Cards Creation System
- In-app card editor for creating custom event cards
- Import/export card deck functionality
- Community card sharing platform
- Card balancing tools and preview mode

### Customization Theme (White Label)
- Customizable branding (logos, colors, fonts)
- Theme builder for different church/organization identities
- Custom land names and biblical references
- Localization support for multiple languages

### Self-Hosting Package
- Docker containerized deployment
- One-click installation scripts
- Offline mode support (local network play)
- Self-contained database option (no Firebase dependency)
- Comprehensive deployment documentation

---

## Contributing

We welcome contributions from the community! Whether you're a developer, designer, or just passionate about biblical education, there are many ways to help.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/cheuqar/kingdom-harvest.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and test thoroughly

4. **Submit a Pull Request** with a clear description of your changes

### Ways to Contribute

- **Code**: Bug fixes, new features, performance improvements
- **Design**: UI/UX improvements, graphics, animations
- **Documentation**: Improve README, add tutorials, translate content
- **Testing**: Report bugs, suggest improvements, test on different devices
- **Ideas**: Share feature requests and suggestions via GitHub Issues

### Development Guidelines

- Follow existing code style and patterns
- Test your changes locally before submitting
- Write clear commit messages
- Update documentation for any new features
- Be respectful and constructive in discussions

### Get in Touch

- Open an [Issue](https://github.com/cheuqar/kingdom-harvest/issues) for bugs or feature requests
- Start a [Discussion](https://github.com/cheuqar/kingdom-harvest/discussions) for questions or ideas

We appreciate every contribution, no matter how small. Together, we can make this game a blessing to more communities!

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to:
- Use the game for personal, educational, or ministry purposes
- Modify and customize for your church or organization
- Distribute copies to others
- Use as a base for your own projects

The only requirement is to include the original copyright notice in any copies or substantial portions of the software.

---

## Acknowledgments

- Created by [cheuqar.com](https://cheuqar.com)
- Built with React and Firebase
- Inspired by the classic Monopoly game with a biblical twist
- Designed for church fellowship and Bible study groups

---

**May this game bring joy and Scripture learning to your community!**

---

<p align="center">
  Made with ❤️ by <a href="https://cheuqar.com">cheuqar.com</a>
</p>
