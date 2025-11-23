import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useNetwork } from '../hooks/useNetwork';
import config from '../config/config.json';
import landsData from '../config/lands.json';
import eventsData from '../config/events.json';
import questionsData from '../config/questions.json';

const GameContext = createContext();

const initialState = {
  config,
  teams: [],
  currentTeamIndex: 0,
  rollCount: 0,
  phase: 'SETUP', // SETUP, RULES, ROLL, DRAW_LAND, DRAW_EVENT, PAY_RENT, BUILD_INN, AUCTION, GAME_OVER
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
  highlightedSeries: null // Series name to highlight on board
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

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_GAME': {
      const { teamNames, gameDuration } = action.payload;
      const teams = teamNames.map((name, index) => ({
        id: `team_${index}`,
        name,
        cash: state.config.initialCash,
        seeds: 0,
        miracles: [],
        rollCount: 0,
        isBankrupt: false,
        color: ['#FF5252', '#4CAF50', '#2196F3', '#FFC107'][index % 4]
      }));

      // Initialize lands state
      const landsState = {};
      landsData.forEach(land => {
        landsState[land.id] = { ownerId: null, innCount: 0 };
      });

      // Shuffle decks
      const landsDeck = shuffle([...landsData]);
      const eventsDeck = shuffle([...eventsData]);

      return {
        ...state,
        teams,
        lands: landsState,
        deck: {
          lands: landsDeck,
          events: eventsDeck,
          landDiscard: [],
          eventDiscard: []
        },
        phase: 'CONNECT', // Go to Connection screen first
        gameDuration: gameDuration || 0,
        log: ['遊戲準備就緒，請連接玩家裝置。'],
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
      return { ...state, currentQuestion: action.payload };

    case 'SET_RENT_INFO':
      return { ...state, rentInfo: action.payload };

    case 'SET_ANIMATION':
      return { ...state, animation: action.payload };

    case 'CLEAR_ANIMATION':
      return { ...state, animation: null };

    case 'SET_HIGHLIGHTED_SERIES':
      return { ...state, highlightedSeries: action.payload };

    case 'CLEAR_HIGHLIGHTED_SERIES':
      return { ...state, highlightedSeries: null };

    case 'UPDATE_TEAM': {
      const { teamId, updates } = action.payload;
      const newTeams = state.teams.map(t => t.id === teamId ? { ...t, ...updates } : t);
      return { ...state, teams: newTeams };
    }

    case 'ADD_CASH': {
      const { teamId, amount } = action.payload;
      const newTeams = state.teams.map(t => {
        if (t.id === teamId) {
          return { ...t, cash: t.cash + amount };
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
        return {
          ...state,
          teams: newTeams,
          phase: 'GAME_OVER',
          winner: activeTeams[0],
          log: [...state.log, `${currentTeam.cash < 0 ? currentTeam.name + ' 破產了！' : ''}`, `遊戲結束！${activeTeams[0].name} 獲勝！`]
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

    case 'GAME_OVER':
      return {
        ...state,
        phase: 'GAME_OVER',
        winner: action.payload
      };

    case 'LOAD_GAME':
      return action.payload;

    case 'CLEAR_SAVE':
      return state;

    case 'REPLACE_STATE':
      return {
        ...action.payload,
        config: action.payload.config || state.config
      };

    default:
      return state;
  }
};

export const GameProvider = ({ children, isClientMode = false, networkParams = {} }) => {
  const [state, localDispatch] = useReducer(gameReducer, initialState);
  const network = useNetwork();

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

  // Network Data Handler
  useEffect(() => {
    network.setOnDataReceived((data, senderPeerId, conn) => {
      console.log('[GameContext] Received data:', data.type, 'from', senderPeerId);

      if (data.type === 'JOIN_REQUEST') {
        // Host handles join request
        const { teamIndex } = data;
        console.log('[Host] Received JOIN_REQUEST for team', teamIndex);
        if (state.teams[teamIndex]) {
          network.registerTeamDevice(teamIndex, senderPeerId);
          console.log('[Host] Registered team device, broadcasting state');

          // Trigger a broadcast immediately
          // We can do this by just calling broadcast directly
          const dynamicState = {
            ...state,
            config: undefined
          };
          network.broadcast({ type: 'SYNC_STATE', state: dynamicState });
        } else {
          console.warn('[Host] Invalid team index in JOIN_REQUEST');
        }
      } else if (data.type === 'ACTION') {
        localDispatch(data.action);
      } else if (data.type === 'SYNC_STATE') {
        console.log('[Client] Received SYNC_STATE, updating local state');
        localDispatch({ type: 'REPLACE_STATE', payload: data.state });
      } else if (data.type === 'JOIN_ACCEPTED') {
        console.log('Joined as team', data.teamIndex);
      }
    });
  }, [network, state]);

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
      const dynamicState = {
        ...state,
        config: undefined
      };
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
          timestamp: Date.now()
        };
        localStorage.setItem('monopoly-game-save', JSON.stringify(saveData));
      } catch (error) {
        console.error('Failed to save game:', error);
      }
    }

    // Clear save when game ends
    if (state.phase === 'GAME_OVER') {
      localStorage.removeItem('monopoly-game-save');
    }
  }, [state, isClientMode]);

  return (
    <GameContext.Provider value={{ state, dispatch, landsData, eventsData, questionsData, network, isClientMode }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
