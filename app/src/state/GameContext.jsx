import React, { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react';
import { useNetwork } from '../hooks/useNetwork';
import { db } from '../config/firebase';
import { ref, get, onValue, set, remove } from 'firebase/database';
import config from '../config/config.json';
import landsData from '../config/lands.json';
import eventsDefault from '../config/events.json';
import eventsMoney from '../config/events_money.json';
import questionsData from '../config/questions.json';
import logger from '../utils/logger';

const ALL_EVENT_DECKS = {
  default: { name: '預設事件', cards: eventsDefault },
  money: { name: '天國金錢管理', cards: eventsMoney }
};

const GameContext = createContext();

const initialState = {
  config,
  teams: [],
  currentTeamIndex: 0,
  rollCount: 0,
  phase: 'SETUP', // SETUP, RULES, ROLL, DRAW_LAND, DRAW_EVENT, PAY_RENT, BUILD_INN, AUCTION, GAME_OVER, DECISION_EVENT
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
  gameDuration: 0, // Minutes
  gameStartTime: null,
  rentInfo: null, // { land, rent, owner }
  animation: null, // { type, data, duration }
  highlightedSeries: null, // Series name to highlight on board
  selectedEventDecks: ['default'],
  auction: null,
  actionTimer: 5, // seconds, 0 = disabled
  offering: null, // { totalIncome, oneTenthAmount, seeds, doubleSeeds }
  offeringRound: 0, // Current offering round number (increments when all players complete)
  offeringCompletedBy: [], // Team IDs that have completed current round's offering
  rankingSummary: null // { round, triggered } or { round, active } for display
};

// Helper to shuffle array
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// Helper to ensure value is an array (Firebase converts empty arrays to null)
const ensureArray = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  // Firebase sometimes converts arrays to objects with numeric keys
  if (typeof value === 'object') return Object.values(value);
  return [];
};

// Helper to sanitize state loaded from Firebase
const sanitizeLoadedState = (loadedState) => {
  if (!loadedState) return loadedState;

  return {
    ...loadedState,
    teams: ensureArray(loadedState.teams).map(team => ({
      ...team,
      miracles: ensureArray(team.miracles)
    })),
    log: ensureArray(loadedState.log),
    auctionPool: ensureArray(loadedState.auctionPool),
    deck: loadedState.deck ? {
      lands: ensureArray(loadedState.deck.lands),
      events: ensureArray(loadedState.deck.events),
      landDiscard: ensureArray(loadedState.deck.landDiscard),
      eventDiscard: ensureArray(loadedState.deck.eventDiscard)
    } : initialState.deck,
    selectedEventDecks: ensureArray(loadedState.selectedEventDecks),
    offeringCompletedBy: ensureArray(loadedState.offeringCompletedBy)
  };
};

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
        incomeSinceLastReplenish: 0 // Track income for tithing calculation
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
        ...initialState,
        teams,
        lands: initialLands,
        deck: {
          lands: shuffledLands,
          events: shuffledEvents,
          landDiscard: [],
          eventDiscard: []
        },
        phase: 'RULES',
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
          // Track positive income for tithing (unless explicitly skipped)
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
        // We can't dispatch ADD_LOG here easily as it's a reducer.
        // We could append to log, but we need to be careful.
        // Let's just update state.
      }

      // Check winner
      const activeTeams = newTeams.filter(t => !t.isBankrupt);
      if (activeTeams.length === 1) {
        // Calculate final rankings with seed multiplier
        const totalSeeds = newTeams.reduce((sum, t) => sum + (t.seeds || 0), 0);

        // First pass: calculate base assets for all teams
        const teamsWithBaseAssets = newTeams.map(team => {
          // Get owned lands from state.lands (which has ownerId, innCount)
          const ownedLandIds = Object.entries(state.lands)
            .filter(([id, landState]) => landState.ownerId === team.id)
            .map(([id]) => id);
          const landCount = ownedLandIds.length;

          // Calculate land value using landsData (imported JSON with price/innCost)
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

        // Calculate total base assets of ALL players
        const totalBaseAssets = teamsWithBaseAssets.reduce((sum, t) => sum + t.baseAssets, 0);

        // Second pass: calculate seed bonus using total assets of ALL players
        const rankings = teamsWithBaseAssets.map(team => {
          // Seed bonus: (total assets of ALL players) * (playerSeeds / totalSeeds)
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
      // Skip bankrupt teams
      let loopCount = 0;
      while (newTeams[nextIndex].isBankrupt && loopCount < newTeams.length) {
        nextIndex = (nextIndex + 1) % newTeams.length;
        loopCount++;
      }

      if (loopCount >= newTeams.length) {
        // All bankrupt? Should be handled above.
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
      // Calculate final rankings with seed multiplier
      const totalSeeds = state.teams.reduce((sum, t) => sum + (t.seeds || 0), 0);

      // First pass: calculate base assets for all teams
      const teamsWithBaseAssets = state.teams.map(team => {
        // Get owned lands from state.lands (which has ownerId, innCount)
        const ownedLandIds = Object.entries(state.lands)
          .filter(([id, landState]) => landState.ownerId === team.id)
          .map(([id]) => id);
        const landCount = ownedLandIds.length;

        // Calculate land value using landsData (imported JSON with price/innCost)
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

      // Calculate total base assets of ALL players
      const totalBaseAssets = teamsWithBaseAssets.reduce((sum, t) => sum + t.baseAssets, 0);

      // Second pass: calculate seed bonus using total assets of ALL players
      const rankings = teamsWithBaseAssets.map(team => {
        // Seed bonus: (total assets of ALL players) * (playerSeeds / totalSeeds)
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

    case 'LOAD_GAME':
      return sanitizeLoadedState(action.payload);

    case 'CLEAR_SAVE':
      return state;

    case 'SET_ACTION_TIMER':
      return {
        ...state,
        actionTimer: action.payload
      };

    case 'START_AUCTION':
      return {
        ...state,
        phase: 'AUCTION',
        auction: {
          landId: action.payload.landId,
          highestBid: action.payload.startBid,
          highestBidderId: null,
          activeBidders: action.payload.bidders, // IDs
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

    case 'PASS_AUCTION':
      const newActiveBidders = state.auction.activeBidders.filter(id => id !== action.payload.teamId);
      return {
        ...state,
        auction: {
          ...state.auction,
          activeBidders: newActiveBidders
        },
        log: [...state.log, `${state.teams.find(t => t.id === action.payload.teamId).name} 放棄競拍`]
      };

    case 'END_AUCTION':
      return {
        ...state,
        auction: null,
        // Phase change usually handled separately or here?
        // Let's assume caller handles phase change (e.g. NEXT_TURN)
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
      // Reset the income tracker for this team
      const newTeams = state.teams.map(t =>
        t.id === teamId ? { ...t, incomeSinceLastReplenish: 0 } : t
      );

      // Track this team's offering completion
      const newCompletedBy = [...(state.offeringCompletedBy || []), teamId];
      const activeTeams = newTeams.filter(t => !t.isBankrupt);
      const allCompleted = activeTeams.every(t => newCompletedBy.includes(t.id));

      if (allCompleted) {
        // All players done - trigger ranking summary
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

    case 'REPLACE_STATE': {
      const sanitized = sanitizeLoadedState(action.payload);
      return {
        ...sanitized,
        config: sanitized.config || state.config
      };
    }

    default:
      return state;
  }
};

// Safe reducer wrapper that catches errors and prevents crashes
const safeReducer = (state, action) => {
  try {
    logger.state(`Dispatch: ${action.type}`, action.payload);
    const newState = gameReducer(state, action);

    // Log phase changes
    if (newState.phase !== state.phase) {
      logger.phase(state.phase, newState.phase);
    }

    return newState;
  } catch (error) {
    logger.error('State', `Reducer error on ${action.type}:`, error);
    // Return current state to prevent crash, but add error info
    return {
      ...state,
      lastError: {
        action: action.type,
        message: error.message,
        timestamp: Date.now()
      }
    };
  }
};

export const GameProvider = ({ children, isClientMode = false, networkParams = {}, restoreFromRoom = null }) => {
  const [state, localDispatch] = useReducer(safeReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(!restoreFromRoom);
  const network = useNetwork(networkParams.clientId || restoreFromRoom);

  // Ref to store game action handlers (for host to execute when receiving GAME_ACTION from clients)
  const gameActionsRef = useRef({});

  // Function to register game action handlers (called by components using useGameEngine)
  const registerGameActions = useCallback((actions) => {
    gameActionsRef.current = actions;
  }, []);

  // Host mode: Restore network connection for scheduled games (enables device takeover)
  useEffect(() => {
    if (!restoreFromRoom || isClientMode) return;

    console.log('[GameContext] Host restoring network for room:', restoreFromRoom);
    network.restoreHost(restoreFromRoom);
  }, [restoreFromRoom, isClientMode]); // network.restoreHost is stable

  // Initialize game from Firebase room config (for scheduled games)
  useEffect(() => {
    if (!restoreFromRoom) return;

    const initFromRoom = async () => {
      try {
        // Check if there's already saved game state
        const stateSnap = await get(ref(db, `games/${restoreFromRoom}/state`));
        if (stateSnap.exists()) {
          // Restore existing game state
          const savedState = stateSnap.val();
          localDispatch({ type: 'LOAD_GAME', payload: savedState });
          setIsInitialized(true);
          return;
        }

        // If client mode, wait for state to appear in Firebase (host will create it)
        if (isClientMode) {
          // Wait a bit and check again, as host might be initializing
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retrySnap = await get(ref(db, `games/${restoreFromRoom}/state`));
          if (retrySnap.exists()) {
            const savedState = retrySnap.val();
            localDispatch({ type: 'LOAD_GAME', payload: savedState });
            setIsInitialized(true);
            return;
          }
          // If still no state, keep waiting - will be handled by listener below
          setIsInitialized(true);
          return;
        }

        // Host mode: Get room config and initialize new game
        const configSnap = await get(ref(db, `games/${restoreFromRoom}/config`));
        const roomConfig = configSnap.val() || {};

        // Initialize game with room config
        const teamNames = roomConfig.teamNames || ['隊伍 1', '隊伍 2'];
        const teamColors = roomConfig.teamColors || null;
        const gameDuration = roomConfig.gameDuration || 0;
        const selectedEventDecks = roomConfig.selectedEventDecks || ['default'];
        const actionTimer = roomConfig.actionTimer || 5;

        localDispatch({
          type: 'INIT_GAME',
          payload: {
            teamNames,
            teamColors,
            gameDuration,
            selectedEventDecks,
            actionTimer
          }
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to init from room:', error);
        setIsInitialized(true); // Still set initialized to avoid infinite loading
      }
    };

    initFromRoom();
  }, [restoreFromRoom, isClientMode]);

  // Note: Host action listeners for scheduled games are now set up via restoreHost()
  // which calls setupHostListeners in useNetwork.js. This enables proper JOIN_REQUEST
  // handling and device takeover detection.

  // Client mode: Listen for state updates from Firebase (for scheduled games)
  useEffect(() => {
    if (!isClientMode || !restoreFromRoom) return;

    const stateRef = ref(db, `games/${restoreFromRoom}/state`);
    const unsubscribe = onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        const newState = snapshot.val();
        // Only update if we have teams (valid state)
        if (newState.teams && newState.teams.length > 0) {
          localDispatch({ type: 'REPLACE_STATE', payload: newState });
        }
      }
    });

    return () => unsubscribe();
  }, [isClientMode, restoreFromRoom]);

  // Track last action per sender to prevent duplicate processing
  const lastActionRef = useRef({});

  // Network Data Handler
  useEffect(() => {
    network.setOnDataReceived((data, senderPeerId, conn) => {
      console.log('[GameContext] Received data:', data.type, 'from', senderPeerId);

      if (data.type === 'JOIN_REQUEST') {
        // Host handles join request
        const { teamIndex } = data;
        console.log('[Host] Received JOIN_REQUEST for team', teamIndex);
        if (state.teams[teamIndex]) {
          const registered = network.registerTeamDevice(teamIndex, senderPeerId);

          if (registered) {
            console.log('[Host] Registered team device, broadcasting state');
            // Trigger a broadcast immediately
            // We can do this by just calling broadcast directly
            const { config, ...dynamicState } = state;
            network.broadcast({ type: 'SYNC_STATE', state: dynamicState });
          } else {
            console.log('[Host] Device takeover pending, not broadcasting state until approved');
          }
        } else {
          console.warn('[Host] Invalid team index in JOIN_REQUEST');
        }
      } else if (data.type === 'ACTION') {
        // Handle GAME_ACTION from clients - these need to execute game engine functions
        if (data.action.type === 'GAME_ACTION') {
          const { action, payload } = data.action;

          // Duplicate prevention: skip if same action from same sender within 500ms
          const actionKey = `${senderPeerId}:${action}`;
          const now = Date.now();
          const lastTime = lastActionRef.current[actionKey];
          if (lastTime && now - lastTime < 500) {
            console.log('[Host] Skipping duplicate GAME_ACTION:', action, 'from', senderPeerId);
            return;
          }
          lastActionRef.current[actionKey] = now;

          console.log('[Host] Processing GAME_ACTION:', action, payload);
          const actions = gameActionsRef.current;
          switch (action) {
            case 'ROLL_DICE':
              actions.rollDice?.();
              break;
            case 'BUY_LAND':
              actions.buyLand?.();
              break;
            case 'SKIP_LAND':
              actions.skipLand?.();
              break;
            case 'PAY_RENT':
              actions.payRent?.();
              break;
            case 'END_TURN':
              actions.endTurn?.();
              break;
            case 'DECISION':
              actions.handleDecision?.(payload?.choice);
              break;
            case 'BUILD_INN':
              actions.buildInn?.(payload?.landId);
              break;
            case 'OFFERING':
              actions.handleOffering?.(payload?.choice);
              break;
            case 'BID':
              actions.handleBid?.(payload?.teamId, payload?.amount);
              break;
            case 'PASS':
              actions.handlePass?.(payload?.teamId);
              break;
            case 'ANSWER_QUESTION':
              actions.answerQuestion?.(payload?.isCorrect);
              break;
            case 'USE_MIRACLE':
              // For miracle, we need to find the card by id
              const team = state.teams[state.currentTeamIndex];
              const miracleCard = team?.miracles?.find(m => m.id === payload?.cardId);
              if (miracleCard) {
                actions.useMiracle?.(miracleCard);
              }
              break;
            default:
              console.warn('[Host] Unknown GAME_ACTION:', action);
          }
        } else {
          localDispatch(data.action);
        }
      } else if (data.type === 'SYNC_STATE') {
        console.log('[Client] Received SYNC_STATE, updating local state');
        localDispatch({ type: 'REPLACE_STATE', payload: data.state });
      } else if (data.type === 'JOIN_ACCEPTED') {
        console.log('Joined as team', data.teamIndex);
      }
    });
  }, [network, state]);

  // Client Connection Logic
  useEffect(() => {
    if (isClientMode && networkParams.hostId) {
      console.log('[Client] Connecting to room:', networkParams.hostId);
      const conn = network.connectToHost(networkParams.hostId);

      // Firebase connection is "open" immediately (optimistic)
      console.log('[Client] Connected, sending JOIN_REQUEST');
      conn.send({
        type: 'JOIN_REQUEST',
        teamIndex: networkParams.teamIndex
      });

      return () => {
        if (conn.close) conn.close();
      };
    }
  }, [isClientMode, networkParams.hostId, networkParams.teamIndex]); // Run once on mount/params change

  // Enhanced Dispatch
  const dispatch = (action) => {
    if (isClientMode) {
      // Client sends action to host
      network.sendToHost({ type: 'ACTION', action });
    } else {
      // Host updates local state
      localDispatch(action);
    }
  };

  // Broadcast state on change (Host only)
  useEffect(() => {
    if (!isClientMode && network.peerId && state.phase !== 'SETUP') {
      // Create a copy and remove config to avoid sending undefined
      const { config, ...dynamicState } = state;
      network.broadcast({ type: 'SYNC_STATE', state: dynamicState });
    }
  }, [state, isClientMode, network.peerId]);

  // Auto-save game state to localStorage (Host only)
  useEffect(() => {
    if (isClientMode) return;

    // Only save if game is in progress (not SETUP, RULES, or GAME_OVER)
    if (state.phase !== 'SETUP' && state.phase !== 'RULES' && state.phase !== 'GAME_OVER') {
      try {
        const saveData = {
          gameState: state,
          peerId: network.peerId, // Save the room ID for reconnection
          timestamp: Date.now()
        };
        localStorage.setItem('monopoly-game-save', JSON.stringify(saveData));
      } catch (error) {
        console.error('Failed to save game:', error);
      }
    }

    // Clear save and room when game ends
    if (state.phase === 'GAME_OVER') {
      localStorage.removeItem('monopoly-game-save');
      network.clearSavedRoom();
    }
  }, [state, isClientMode, network.peerId]);

  // Auto-save game state to Firebase for scheduled games (Host only)
  useEffect(() => {
    if (isClientMode || !restoreFromRoom || !isInitialized) return;

    // Only save if game is in progress (not SETUP)
    if (state.phase !== 'SETUP') {
      const saveToFirebase = async () => {
        try {
          const { config: _, ...stateWithoutConfig } = state;
          await set(ref(db, `games/${restoreFromRoom}/state`), stateWithoutConfig);
        } catch (error) {
          console.error('Failed to save state to Firebase:', error);
        }
      };
      saveToFirebase();
    }
  }, [state, isClientMode, restoreFromRoom, isInitialized]);

  // Show loading while initializing from room
  if (!isInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        載入遊戲中...
      </div>
    );
  }

  return (
    <GameContext.Provider value={{ state, dispatch, landsData, eventsData: eventsDefault, questionsData, network, isClientMode, registerGameActions }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
