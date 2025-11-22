import { EFFECTS } from './engine/effects.js';
import { calculateRent } from './utils/gameUtils.js';
import landsData from './config/lands.json' with { type: "json" };
import eventsData from './config/events.json' with { type: "json" };

// Mock dispatch and state
let state = {
    teams: [
        { id: 'team_0', name: 'Team A', cash: 2500, seeds: 0, miracles: [], isBankrupt: false },
        { id: 'team_1', name: 'Team B', cash: 2500, seeds: 0, miracles: [], isBankrupt: false }
    ],
    lands: {},
    deck: {
        events: [...eventsData],
        eventDiscard: []
    },
    currentTeamIndex: 0
};

// Initialize lands
landsData.forEach(l => {
    state.lands[l.id] = { ownerId: null, innCount: 0 };
});

const dispatch = (action) => {
    console.log('Action:', action.type, action.payload);
    if (action.type === 'UPDATE_TEAM') {
        const { teamId, updates } = action.payload;
        state.teams = state.teams.map(t => t.id === teamId ? { ...t, ...updates } : t);
    } else if (action.type === 'UPDATE_LAND') {
        const { landId, updates } = action.payload;
        state.lands[landId] = { ...state.lands[landId], ...updates };
    } else if (action.type === 'ADD_MIRACLE') {
        const { teamId, card } = action.payload;
        state.teams = state.teams.map(t => t.id === teamId ? { ...t, miracles: [...t.miracles, card] } : t);
    }
};

// Test Helper
const assert = (condition, message) => {
    if (!condition) {
        console.error('FAILED:', message);
        throw new Error(message);
    } else {
        console.log('PASSED:', message);
    }
};

console.log('--- Starting Simulation ---');

// 1. Test Buying Land
console.log('\n[Test 1] Buying Land');
const land = landsData[0]; // Shechem, price 200
const buyer = state.teams[0];
console.log(`${buyer.name} buys ${land.name} for $${land.price}`);

dispatch({
    type: 'UPDATE_TEAM',
    payload: { teamId: buyer.id, updates: { cash: buyer.cash - land.price } }
});
dispatch({
    type: 'UPDATE_LAND',
    payload: { landId: land.id, updates: { ownerId: buyer.id } }
});

assert(state.teams[0].cash === 2300, 'Cash should be 2300');
assert(state.lands[land.id].ownerId === buyer.id, 'Land owner should be Team A');

// 2. Test Rent Collection (Event)
console.log('\n[Test 2] Rent Collection Event');
// Mock event: Collect rent for Series 1
const rentEvent = eventsData.find(e => e.effectCode === 'E_COLLECT_RENT_SERIES' && e.params.series === '祖先與應許');
const effectFunc = EFFECTS[rentEvent.effectCode];

// Team A owns Shechem (Series 1). Team B should pay rent.
// Rent calculation: Base 40.
effectFunc(dispatch, state, rentEvent.params, buyer.id, landsData);

// Team B pays 40 to Team A.
// Team B: 2500 - 40 = 2460
// Team A: 2300 + 40 = 2340
assert(state.teams[1].cash === 2460, 'Team B cash should be 2460');
assert(state.teams[0].cash === 2340, 'Team A cash should be 2340');

// 3. Test Payment Event
console.log('\n[Test 3] Payment Event');
const payEvent = eventsData.find(e => e.effectCode === 'E_PAY_CASH'); // Pay 100
const payEffect = EFFECTS[payEvent.effectCode];

// Team B pays 100
payEffect(dispatch, state, payEvent.params, state.teams[1].id);
assert(state.teams[1].cash === 2360, 'Team B cash should be 2360 (2460 - 100)');

// 4. Test Seed Mechanism
console.log('\n[Test 4] Seed Mechanism');
const seedEvent = eventsData.find(e => e.effectCode === 'E_PAY_AND_GAIN_SEED'); // Pay 100, Seed +1
const seedEffect = EFFECTS[seedEvent.effectCode];

// Team A pays 100, gets 1 seed
seedEffect(dispatch, state, seedEvent.params, state.teams[0].id);
assert(state.teams[0].cash === 2240, 'Team A cash should be 2240 (2340 - 100)');
assert(state.teams[0].seeds === 1, 'Team A seeds should be 1');

// 5. Test Harvest with Seed
console.log('\n[Test 5] Harvest with Seed');
const harvestEvent = eventsData.find(e => e.effectCode === 'E_GAIN_CASH_PER_SEED'); // Base 100 + 20/seed
const harvestEffect = EFFECTS[harvestEvent.effectCode];

// Team A has 1 seed. Gain 100 + 20*1 = 120.
harvestEffect(dispatch, state, harvestEvent.params, state.teams[0].id);
assert(state.teams[0].cash === 2360, 'Team A cash should be 2360 (2240 + 120)');

// 6. Full Game Simulation
console.log('\n[Test 6] Full Game Simulation');

// Reset state for full game
state = {
    teams: [
        { id: 'team_0', name: 'Team A', cash: 2500, seeds: 0, miracles: [], isBankrupt: false, color: '#ff0000' },
        { id: 'team_1', name: 'Team B', cash: 2500, seeds: 0, miracles: [], isBankrupt: false, color: '#00ff00' }
    ],
    lands: {},
    deck: {
        lands: [...landsData],
        events: [...eventsData],
        eventDiscard: []
    },
    auctionPool: [],
    currentTeamIndex: 0,
    phase: 'ROLL',
    winner: null
};

landsData.forEach(l => {
    state.lands[l.id] = { ownerId: null, innCount: 0 };
});

let turnCount = 0;
const MAX_TURNS = 1000;

while (!state.winner && turnCount < MAX_TURNS) {
    turnCount++;
    const currentTeam = state.teams[state.currentTeamIndex];

    if (currentTeam.isBankrupt) {
        state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
        continue;
    }

    // console.log(`\n--- Turn ${turnCount}: ${currentTeam.name} (Cash: ${currentTeam.cash}) ---`);

    // 1. Roll Dice
    const roll = Math.floor(Math.random() * 6) + 1;
    // console.log(`Rolled: ${roll}`);

    // 2. Handle Phase based on roll
    if (roll <= 3) {
        // Land Phase
        if (state.deck.lands.length > 0) {
            const card = state.deck.lands[0];
            // Simulate Draw
            state.deck.lands = state.deck.lands.slice(1);

            // Simulate Buy Decision (Buy if affordable)
            if (currentTeam.cash >= card.price) {
                dispatch({
                    type: 'UPDATE_TEAM',
                    payload: { teamId: currentTeam.id, updates: { cash: currentTeam.cash - card.price } }
                });
                dispatch({
                    type: 'UPDATE_LAND',
                    payload: { landId: card.id, updates: { ownerId: currentTeam.id } }
                });
                // console.log(`Bought ${card.name}`);
            } else {
                // console.log(`Cannot afford ${card.name}`);
            }
        } else {
            // console.log('Land deck empty');
        }
    } else if (roll === 4) {
        // Inn Phase (Simplified: Build on first owned land if affordable)
        const ownedLands = landsData.filter(l => state.lands[l.id].ownerId === currentTeam.id);
        if (ownedLands.length > 0) {
            const land = ownedLands[0];
            if (currentTeam.cash >= land.innCost) {
                dispatch({
                    type: 'UPDATE_TEAM',
                    payload: { teamId: currentTeam.id, updates: { cash: currentTeam.cash - land.innCost } }
                });
                dispatch({
                    type: 'UPDATE_LAND',
                    payload: { landId: land.id, updates: { innCount: state.lands[land.id].innCount + 1 } }
                });
                // console.log(`Built Inn on ${land.name}`);
            }
        }
    } else {
        // Event Phase
        let eventCard;
        if (state.deck.events.length > 0) {
            eventCard = state.deck.events[0];
            state.deck.events = state.deck.events.slice(1);
        } else if (state.deck.eventDiscard.length > 0) {
            state.deck.events = [...state.deck.eventDiscard].sort(() => Math.random() - 0.5);
            state.deck.eventDiscard = [];
            eventCard = state.deck.events[0];
            state.deck.events = state.deck.events.slice(1);
        }

        if (eventCard) {
            // console.log(`Event: ${eventCard.name}`);
            const effectFunc = EFFECTS[eventCard.effectCode];
            if (effectFunc) {
                effectFunc(dispatch, state, eventCard.params, currentTeam.id, landsData);
            }
            // Discard
            state.deck.eventDiscard.push(eventCard);
        }
    }

    // 3. End Turn & Check Bankruptcy
    // Simulate rent payment if landed on opponent's land? 
    // Wait, the game logic is card-based, not movement-based. 
    // Rent is collected via EVENTS, not by landing on squares.
    // So we don't need to simulate movement.

    // Check Bankruptcy
    if (currentTeam.cash < 0) {
        console.log(`${currentTeam.name} went BANKRUPT!`);
        state.teams = state.teams.map(t => t.id === currentTeam.id ? { ...t, isBankrupt: true } : t);
    }

    // Check Winner
    const activeTeams = state.teams.filter(t => !t.isBankrupt);
    if (activeTeams.length === 1) {
        state.winner = activeTeams[0];
        console.log(`\nWINNER: ${state.winner.name} in ${turnCount} turns!`);
    }

    state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
}

if (!state.winner) {
    console.log('\nGame ended (Max turns reached) without a winner.');
    console.log('Final State:', state.teams.map(t => `${t.name}: $${t.cash}`).join(', '));
} else {
    console.log('Final State:', state.teams.map(t => `${t.name}: $${t.cash} (${t.isBankrupt ? 'Bankrupt' : 'Active'})`).join(', '));
}

