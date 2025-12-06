/**
 * Node.js-compatible game reducer for automated testing
 * Extracted from GameContext.jsx with React dependencies removed
 */

const config = require('../config/config.json');
const landsData = require('../config/lands.json');
const eventsDefault = require('../config/events.json');
const eventsMoney = require('../config/events_money.json');

const ALL_EVENT_DECKS = {
  default: { name: '預設事件', cards: eventsDefault },
  money: { name: '天國金錢管理', cards: eventsMoney }
};

// Helper to shuffle array
const shuffle = (array) => {
  const arr = [...array];
  let currentIndex = arr.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }
  return arr;
};

// Initial game state template
const createInitialState = () => ({
  config,
  teams: [],
  currentTeamIndex: 0,
  rollCount: 0,
  phase: 'SETUP',
  dice: null,
  currentCard: null,
  currentQuestion: null,
  lands: {},
  deck: {
    lands: [],
    events: [],
    landDiscard: [],
    eventDiscard: []
  },
  log: [],
  modal: null,
  winner: null,
  auctionPool: [],
  gameDuration: 0,
  gameStartTime: null,
  rentInfo: null,
  animation: null,
  highlightedSeries: null,
  selectedEventDecks: ['default'],
  auction: null,
  actionTimer: 5,
  offering: null,
  offeringRound: 0,
  offeringCompletedBy: [],
  rankingSummary: null
});

// Calculate rent for a land
const calculateRent = (land, landState, ownerId, allLandsState) => {
  let rent = land.baseRent + (landState.innCount * land.innRentIncrement);

  // Series Bonus
  const seriesLands = landsData.filter(l => l.series === land.series);
  const ownerSeriesCount = seriesLands.filter(l => allLandsState[l.id]?.ownerId === ownerId).length;

  let multiplier = 1.0;
  if (ownerSeriesCount === 2) multiplier = config.seriesBonus["2"];
  if (ownerSeriesCount === 3) multiplier = config.seriesBonus["3"];
  if (ownerSeriesCount === 4) multiplier = config.seriesBonus["4"];

  return Math.floor(rent * multiplier);
};

// Game reducer - pure function (state, action) => newState
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_GAME': {
      const { teamNames, teamColors, gameDuration, selectedEventDecks, actionTimer } = action.payload;
      const defaultColors = ['#e94560', '#4ecca3', '#3282b8', '#f1c40f'];

      // Combine selected event decks
      let allEvents = [];
      (selectedEventDecks || ['default']).forEach(deckKey => {
        if (ALL_EVENT_DECKS[deckKey]) {
          allEvents = [...allEvents, ...ALL_EVENT_DECKS[deckKey].cards];
        }
      });

      const shuffledLands = shuffle([...landsData]);
      const shuffledEvents = shuffle([...allEvents]);

      // Initialize teams
      const teams = teamNames.map((name, index) => ({
        id: `team_${index}`,
        name,
        cash: config.initialCash,
        seeds: config.initialSeeds || 0,
        landCount: 0,
        totalAssets: config.initialCash,
        isBankrupt: false,
        miracles: [],
        rollCount: 0,
        color: (teamColors && teamColors[index]) || defaultColors[index % defaultColors.length],
        incomeSinceLastReplenish: 0
      }));

      // Initialize lands ownership
      const initialLands = {};
      landsData.forEach(land => {
        initialLands[land.id] = {
          ownerId: null,
          innCount: 0
        };
      });

      return {
        ...createInitialState(),
        teams,
        lands: initialLands,
        deck: {
          lands: shuffledLands,
          events: shuffledEvents,
          landDiscard: [],
          eventDiscard: []
        },
        phase: 'ROLL', // Skip RULES for testing
        gameDuration: gameDuration || 0,
        gameStartTime: Date.now(),
        selectedEventDecks: selectedEventDecks || ['default'],
        actionTimer: actionTimer || 5,
        log: ['遊戲開始！'],
        currentTeamIndex: 0
      };
    }

    case 'START_GAME':
      return {
        ...state,
        phase: 'ROLL',
        gameStartTime: Date.now(),
        log: [...state.log, '遊戲開始！']
      };

    case 'ROLL_DICE': {
      const roll = action.payload;
      const newTeams = state.teams.map((t, i) =>
        i === state.currentTeamIndex ? { ...t, rollCount: (t.rollCount || 0) + 1 } : t
      );
      return {
        ...state,
        dice: roll,
        teams: newTeams,
        rollCount: state.rollCount + 1,
        log: [...state.log, `${state.teams[state.currentTeamIndex].name} 擲出了 ${roll}`]
      };
    }

    case 'SET_PHASE':
      return { ...state, phase: action.payload };

    case 'SET_CARD':
      return { ...state, currentCard: action.payload };

    case 'SET_QUESTION':
      return { ...state, currentQuestion: action.payload === undefined ? null : action.payload };

    case 'SET_RENT_INFO':
      return { ...state, rentInfo: action.payload === undefined ? null : action.payload };

    case 'SET_ANIMATION':
      return { ...state, animation: action.payload === undefined ? null : action.payload };

    case 'CLEAR_ANIMATION':
      return { ...state, animation: null };

    case 'SET_HIGHLIGHTED_SERIES':
      return { ...state, highlightedSeries: action.payload === undefined ? null : action.payload };

    case 'CLEAR_HIGHLIGHTED_SERIES':
      return { ...state, highlightedSeries: null };

    case 'UPDATE_TEAM': {
      const { teamId, updates } = action.payload;
      const newTeams = state.teams.map(t => t.id === teamId ? { ...t, ...updates } : t);
      return { ...state, teams: newTeams };
    }

    case 'ADD_CASH': {
      const { teamId, amount, skipIncomeTracking } = action.payload;
      const newTeams = state.teams.map(t => {
        if (t.id === teamId) {
          const newCash = t.cash + amount;
          const incomeToAdd = (!skipIncomeTracking && amount > 0) ? amount : 0;
          return {
            ...t,
            cash: newCash,
            incomeSinceLastReplenish: (t.incomeSinceLastReplenish || 0) + incomeToAdd
          };
        }
        return t;
      });
      return { ...state, teams: newTeams };
    }

    case 'ADD_SEEDS': {
      const { teamId, amount } = action.payload;
      const newTeams = state.teams.map(t => {
        if (t.id === teamId) {
          return { ...t, seeds: (t.seeds || 0) + amount };
        }
        return t;
      });
      return { ...state, teams: newTeams };
    }

    case 'UPDATE_LAND': {
      const { landId, updates } = action.payload;
      return {
        ...state,
        lands: {
          ...state.lands,
          [landId]: { ...state.lands[landId], ...updates }
        }
      };
    }

    case 'ADD_LOG':
      return { ...state, log: [...state.log, action.payload] };

    case 'ADD_MIRACLE': {
      const { teamId, card } = action.payload;
      const newTeams = state.teams.map(t =>
        t.id === teamId ? { ...t, miracles: [...t.miracles, card] } : t
      );
      return { ...state, teams: newTeams };
    }

    case 'REMOVE_MIRACLE': {
      const { teamId, cardId } = action.payload;
      let discardedCard = null;

      const newTeams = state.teams.map(t => {
        if (t.id !== teamId) return t;
        const index = t.miracles.findIndex(m => m.id === cardId);
        if (index === -1) return t;

        discardedCard = t.miracles[index];
        const newMiracles = [...t.miracles];
        newMiracles.splice(index, 1);
        return { ...t, miracles: newMiracles };
      });

      let newDiscard = state.deck.eventDiscard;
      if (discardedCard) {
        newDiscard = [...newDiscard, discardedCard];
      }

      return {
        ...state,
        teams: newTeams,
        deck: { ...state.deck, eventDiscard: newDiscard }
      };
    }

    case 'UPDATE_LAND_DECK':
      return {
        ...state,
        deck: {
          ...state.deck,
          lands: action.payload
        }
      };

    case 'DRAW_LAND_CARD': {
      const newLands = state.deck.lands.slice(1);
      return {
        ...state,
        deck: { ...state.deck, lands: newLands }
      };
    }

    case 'DRAW_EVENT_CARD': {
      const card = state.deck.events[0];
      const newEvents = state.deck.events.slice(1);
      let newDiscard = state.deck.eventDiscard;

      if (card && card.type !== 'miracle') {
        newDiscard = [...newDiscard, card];
      }

      return {
        ...state,
        deck: { ...state.deck, events: newEvents, eventDiscard: newDiscard }
      };
    }

    case 'UPDATE_EVENT_DECK': {
      return {
        ...state,
        deck: {
          ...state.deck,
          events: action.payload.events,
          eventDiscard: action.payload.eventDiscard
        }
      };
    }

    case 'ADD_TO_AUCTION': {
      const card = action.payload;
      if (!card) return state;
      return {
        ...state,
        auctionPool: [...state.auctionPool, card]
      };
    }

    case 'NEXT_TURN': {
      // Check bankruptcy for current team
      const currentTeam = state.teams[state.currentTeamIndex];
      let newTeams = state.teams;

      if (currentTeam.cash < 0 && !currentTeam.isBankrupt) {
        newTeams = state.teams.map((t, i) =>
          i === state.currentTeamIndex ? { ...t, isBankrupt: true } : t
        );
      }

      // Check winner
      const activeTeams = newTeams.filter(t => !t.isBankrupt);
      if (activeTeams.length === 1) {
        // Calculate final rankings with seed multiplier
        const totalSeeds = newTeams.reduce((sum, t) => sum + (t.seeds || 0), 0);

        const teamsWithBaseAssets = newTeams.map(team => {
          const ownedLandIds = Object.entries(state.lands)
            .filter(([id, landState]) => landState.ownerId === team.id)
            .map(([id]) => id);
          const landCount = ownedLandIds.length;

          const landValue = ownedLandIds.reduce((sum, landId) => {
            const landData = landsData.find(l => l.id === landId);
            const landState = state.lands[landId];
            if (!landData) return sum;
            return sum + (landData.price || 0) + ((landState?.innCount || 0) * (landData.innCost || 0));
          }, 0);
          const baseAssets = team.cash + landValue;

          return {
            ...team,
            landCount,
            landValue,
            baseAssets
          };
        });

        const totalBaseAssets = teamsWithBaseAssets.reduce((sum, t) => sum + t.baseAssets, 0);

        const rankings = teamsWithBaseAssets.map(team => {
          const seedMultiplier = totalSeeds > 0 ? (team.seeds || 0) / totalSeeds : 0;
          const seedBonus = totalBaseAssets * seedMultiplier;
          const finalScore = team.baseAssets + seedBonus;

          return {
            ...team,
            seedMultiplier,
            seedBonus,
            finalScore
          };
        }).sort((a, b) => b.finalScore - a.finalScore);

        return {
          ...state,
          teams: newTeams,
          phase: 'GAME_OVER',
          winner: {
            team: rankings[0],
            rankings,
            reason: 'bankruptcy',
            totalSeeds,
            totalBaseAssets
          },
          log: [...state.log, `${currentTeam.cash < 0 ? currentTeam.name + ' 破產了！' : ''}`, `遊戲結束！${rankings[0].name} 獲勝！`]
        };
      }

      let nextIndex = (state.currentTeamIndex + 1) % state.teams.length;
      let loopCount = 0;
      while (newTeams[nextIndex].isBankrupt && loopCount < newTeams.length) {
        nextIndex = (nextIndex + 1) % newTeams.length;
        loopCount++;
      }

      if (loopCount >= newTeams.length) {
        return state;
      }

      return {
        ...state,
        teams: newTeams,
        currentTeamIndex: nextIndex,
        phase: 'ROLL',
        dice: null,
        currentCard: null,
        currentQuestion: null,
        log: currentTeam.cash < 0 && !currentTeam.isBankrupt
          ? [...state.log, `${currentTeam.name} 破產了！`]
          : state.log
      };
    }

    case 'GAME_OVER': {
      const totalSeeds = state.teams.reduce((sum, t) => sum + (t.seeds || 0), 0);

      const teamsWithBaseAssets = state.teams.map(team => {
        const ownedLandIds = Object.entries(state.lands)
          .filter(([id, landState]) => landState.ownerId === team.id)
          .map(([id]) => id);
        const landCount = ownedLandIds.length;

        const landValue = ownedLandIds.reduce((sum, landId) => {
          const landData = landsData.find(l => l.id === landId);
          const landState = state.lands[landId];
          if (!landData) return sum;
          return sum + (landData.price || 0) + ((landState?.innCount || 0) * (landData.innCost || 0));
        }, 0);
        const baseAssets = team.cash + landValue;

        return {
          ...team,
          landCount,
          landValue,
          baseAssets
        };
      });

      const totalBaseAssets = teamsWithBaseAssets.reduce((sum, t) => sum + t.baseAssets, 0);

      const rankings = teamsWithBaseAssets.map(team => {
        const seedMultiplier = totalSeeds > 0 ? (team.seeds || 0) / totalSeeds : 0;
        const seedBonus = totalBaseAssets * seedMultiplier;
        const finalScore = team.baseAssets + seedBonus;

        return {
          ...team,
          seedMultiplier,
          seedBonus,
          finalScore
        };
      }).sort((a, b) => b.finalScore - a.finalScore);

      return {
        ...state,
        phase: 'GAME_OVER',
        winner: {
          team: rankings[0],
          rankings,
          reason: action.payload?.reason || 'manual',
          totalSeeds,
          totalBaseAssets
        }
      };
    }

    case 'START_AUCTION':
      return {
        ...state,
        phase: 'AUCTION',
        auction: {
          landId: action.payload.landId,
          highestBid: action.payload.startBid,
          highestBidderId: null,
          activeBidders: action.payload.bidders,
          initialBidders: action.payload.bidders
        }
      };

    case 'PLACE_BID':
      return {
        ...state,
        auction: {
          ...state.auction,
          highestBid: action.payload.amount,
          highestBidderId: action.payload.teamId
        },
        log: [...state.log, `${state.teams.find(t => t.id === action.payload.teamId).name} 出價 $${action.payload.amount}`]
      };

    case 'PASS_AUCTION': {
      const newActiveBidders = state.auction.activeBidders.filter(id => id !== action.payload.teamId);
      return {
        ...state,
        auction: {
          ...state.auction,
          activeBidders: newActiveBidders
        },
        log: [...state.log, `${state.teams.find(t => t.id === action.payload.teamId).name} 放棄競拍`]
      };
    }

    case 'END_AUCTION':
      return {
        ...state,
        auction: null
      };

    case 'START_OFFERING': {
      const { totalIncome, oneTenthAmount, seeds, doubleSeeds } = action.payload;
      return {
        ...state,
        phase: 'OFFERING_EVENT',
        offering: { totalIncome, oneTenthAmount, seeds, doubleSeeds }
      };
    }

    case 'COMPLETE_OFFERING': {
      const { teamId } = action.payload;
      const newTeams = state.teams.map(t =>
        t.id === teamId ? { ...t, incomeSinceLastReplenish: 0 } : t
      );

      const newCompletedBy = [...(state.offeringCompletedBy || []), teamId];
      const activeTeams = newTeams.filter(t => !t.isBankrupt);
      const allCompleted = activeTeams.every(t => newCompletedBy.includes(t.id));

      if (allCompleted) {
        return {
          ...state,
          teams: newTeams,
          offering: null,
          offeringCompletedBy: [],
          offeringRound: (state.offeringRound || 0) + 1,
          rankingSummary: {
            triggered: true,
            round: (state.offeringRound || 0) + 1
          }
        };
      }

      return {
        ...state,
        teams: newTeams,
        offering: null,
        offeringCompletedBy: newCompletedBy
      };
    }

    case 'SHOW_RANKING_SUMMARY': {
      const { round } = action.payload;
      return {
        ...state,
        rankingSummary: {
          round,
          active: true
        },
        phase: 'RANKING_SUMMARY'
      };
    }

    case 'DISMISS_RANKING_SUMMARY': {
      return {
        ...state,
        rankingSummary: null,
        phase: 'ROLL'
      };
    }

    default:
      return state;
  }
};

module.exports = {
  gameReducer,
  createInitialState,
  calculateRent,
  shuffle,
  landsData,
  eventsDefault,
  eventsMoney,
  ALL_EVENT_DECKS,
  config
};
