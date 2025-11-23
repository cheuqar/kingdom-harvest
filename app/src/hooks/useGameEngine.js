import { useGame } from '../state/GameContext';
import { calculateRent } from '../utils/gameUtils';
import { EFFECTS } from '../engine/effects';

export const useGameEngine = () => {
    const { state, dispatch, landsData, eventsData, questionsData } = useGame();

    const currentTeam = state.teams[state.currentTeamIndex] || {};

    const rollDice = () => {
        // Guard: Only allow rolling if phase is ROLL
        if (state.phase !== 'ROLL') {
            return;
        }

        const val = Math.floor(Math.random() * 6) + 1;
        dispatch({ type: 'ROLL_DICE', payload: val });

        // Immediately change phase to prevent multiple clicks
        dispatch({ type: 'SET_PHASE', payload: 'ROLLING' });

        // Check for 7-roll bonus
        // Note: state.rollCount is the OLD count before dispatch updates it. 
        // But dispatch is sync-ish in React state updates? No, async.
        // Check for 7-roll bonus (per player)
        // currentTeam.rollCount is from BEFORE the roll, so add 1
        const currentRollCount = (currentTeam.rollCount || 0) + 1;
        if (currentRollCount % 7 === 0) {
            dispatch({
                type: 'ADD_CASH',
                payload: { teamId: currentTeam.id, amount: 1000 }
            });
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'BONUS_CASH', data: { amount: 1000 }, duration: 3000 }
            });
            dispatch({ type: 'ADD_LOG', payload: '每7次擲骰獎勵：銀行發放 $1000！' });
        }

        setTimeout(() => {
            if (val <= 3) {
                // If deck is empty OR roll is 3, trigger Random Land logic
                if (state.deck.lands.length === 0 || val === 3) {
                    handleRandomLandPhase();
                } else {
                    handleLandPhase();
                }
            } else if (val === 4) {
                // If team has no lands, treat as Land Phase (or Random Land if empty)
                const ownedLands = landsData.filter(l => state.lands[l.id].ownerId === currentTeam.id);
                if (ownedLands.length === 0) {
                    dispatch({ type: 'ADD_LOG', payload: '無土地可建旅店，改為抽土地卡！' });
                    if (state.deck.lands.length === 0) {
                        handleRandomLandPhase();
                    } else {
                        handleLandPhase();
                    }
                } else {
                    handleInnPhase();
                }
            } else {
                handleEventPhase();
            }
        }, 1000);
    };

    const handleLandPhase = () => {
        const availableLands = state.deck.lands;
        if (availableLands.length === 0) {
            dispatch({ type: 'ADD_LOG', payload: '土地牌庫已空！' });
            endTurn();
            return;
        }

        const card = availableLands[0]; // Take top
        dispatch({ type: 'DRAW_LAND_CARD' }); // Remove from deck

        dispatch({ type: 'SET_PHASE', payload: 'DRAW_LAND' });
        dispatch({ type: 'SET_CARD', payload: card });

        // Check if question exists
        const question = questionsData.find(q => q.landId === card.id);
        if (question) {
            dispatch({ type: 'SET_QUESTION', payload: question });
        }
    };

    // ... handleInnPhase, handleEventPhase ...

    const handleRandomLandPhase = () => {
        // Pick random land from ALL lands
        const randomIndex = Math.floor(Math.random() * landsData.length);
        const land = landsData[randomIndex];
        const landState = state.lands[land.id];

        dispatch({ type: 'SET_CARD', payload: land });

        if (!landState.ownerId) {
            // Unowned: Treat as normal draw (but don't remove from deck if it's still there? 
            // Actually if it's unowned, it MUST be in the deck or auction pool?
            // If we pick randomly, we might pick one that is currently in the deck.
            // If so, we should remove it from deck to avoid duplicates.

            // Check if in deck
            const deckIndex = state.deck.lands.findIndex(l => l.id === land.id);
            if (deckIndex !== -1) {
                // Remove from deck
                const newLands = [...state.deck.lands];
                newLands.splice(deckIndex, 1);
                dispatch({ type: 'UPDATE_LAND_DECK', payload: newLands });
            }

            // Also check auction pool? If in auction pool, remove it?
            // For simplicity, let's assume we just take it.

            dispatch({ type: 'SET_PHASE', payload: 'DRAW_LAND' });
            dispatch({ type: 'ADD_LOG', payload: `隨機選中：${land.name} (未售出)` });

            // Check question
            const question = questionsData.find(q => q.landId === land.id);
            if (question) {
                dispatch({ type: 'SET_QUESTION', payload: question });
            }

        } else if (landState.ownerId !== currentTeam.id) {
            // Owned by other: Pay Rent - Show Modal
            const rent = calculateRent(land, landState, landState.ownerId, landsData, state.lands);
            const owner = state.teams.find(t => t.id === landState.ownerId);

            dispatch({ type: 'SET_PHASE', payload: 'PAY_RENT' });
            dispatch({ type: 'SET_CARD', payload: land });
            dispatch({
                type: 'SET_RENT_INFO',
                payload: {
                    land,
                    rent,
                    owner
                }
            });
            dispatch({ type: 'ADD_LOG', payload: `隨機選中：${land.name} (由 ${owner.name} 擁有)。需支付租金 $${rent}` });

        } else {
            // Owned by self: Build Inn
            dispatch({ type: 'ADD_LOG', payload: `隨機選中：${land.name} (你擁有的)。可建造旅店。` });
            dispatch({ type: 'SET_PHASE', payload: 'BUILD_INN' });
            // We need to restrict BUILD_INN to THIS land only?
            // The current BuildInnInterface shows all lands.
            // Let's keep it simple and let them build on any land, or pass this land as target.
            // But the prompt says "let him decide to build Inn".
            // I'll just set phase to BUILD_INN.
        }
    };

    const buyLand = () => {
        const card = state.currentCard;
        if (currentTeam.cash >= card.price) {
            dispatch({
                type: 'ADD_CASH',
                payload: { teamId: currentTeam.id, amount: -card.price }
            });
            dispatch({
                type: 'UPDATE_LAND',
                payload: { landId: card.id, updates: { ownerId: currentTeam.id } }
            });
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'ACQUIRE_LAND', data: { name: card.name }, duration: 2000 }
            });
            dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 購買了 ${card.name}` });
            endTurn();
        } else {
            // Trigger Auction
            startAuction(card);
        }
    };

    const skipLand = () => {
        const card = state.currentCard;
        // Trigger Auction instead of just adding to pool
        startAuction(card);
    };

    const startAuction = (card) => {
        dispatch({ type: 'SET_PHASE', payload: 'AUCTION' });
        dispatch({ type: 'ADD_LOG', payload: `${card.name} 進入拍賣！` });
        // Initialize auction state if needed (e.g. current bidder, highest bid)
        // We'll handle this in the component state or context
    };

    const handleInnPhase = () => {
        // Check if team has lands
        const ownedLands = landsData.filter(l => state.lands[l.id].ownerId === currentTeam.id);

        if (ownedLands.length === 0) {
            dispatch({ type: 'ADD_LOG', payload: '沒有土地可建旅店。' });
            endTurn();
        } else {
            dispatch({ type: 'SET_PHASE', payload: 'BUILD_INN' });
        }
    };

    const handleEventPhase = () => {
        let deck = [...state.deck.events];
        if (deck.length === 0) {
            // Reshuffle discard
            if (state.deck.eventDiscard.length > 0) {
                deck = [...state.deck.eventDiscard].sort(() => Math.random() - 0.5);
                dispatch({ type: 'UPDATE_EVENT_DECK', payload: { events: deck, eventDiscard: [] } });
            } else {
                dispatch({ type: 'ADD_LOG', payload: '事件牌庫已空！' });
                endTurn();
                return;
            }
        }

        const card = deck[0];
        // Remove from deck
        dispatch({ type: 'DRAW_EVENT_CARD' });

        dispatch({ type: 'SET_PHASE', payload: 'DRAW_EVENT' });
        dispatch({ type: 'SET_CARD', payload: card });

        // Execute effect immediately (not delayed)
        setTimeout(() => {
            executeEvent(card);
        }, 100);
    };

    const executeEvent = (card) => {
        console.log('[Event] Executing:', card.name, 'Type:', card.type, 'Effect:', card.effectCode);

        if (card.type === 'miracle') {
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'EVENT', data: { name: `獲得: ${card.name}`, type: 'miracle' }, duration: 2000 }
            });
            dispatch({ type: 'ADD_MIRACLE', payload: { teamId: currentTeam.id, card } });
            dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 獲得神蹟卡：${card.name}` });
        } else {
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'EVENT', data: { name: card.name, type: card.type || 'event' }, duration: 2000 }
            });
            const effectFunc = EFFECTS[card.effectCode];
            if (effectFunc) {
                console.log('[Event] Calling effect function:', card.effectCode, 'with params:', card.params);
                effectFunc(dispatch, state, card.params, currentTeam.id, landsData);
            } else {
                console.warn('Unknown effect:', card.effectCode);
                dispatch({ type: 'ADD_LOG', payload: `未知效果: ${card.name}` });
            }
        }
        // Move to discard logic is missing here for normal cards too.
        // Ideally we move to discard if not miracle.
        // But for now let's just keep it simple.
    };



    const buildInn = (landId) => {
        const land = landsData.find(l => l.id === landId);
        if (currentTeam.cash >= land.innCost) {
            dispatch({
                type: 'ADD_CASH',
                payload: { teamId: currentTeam.id, amount: -land.innCost }
            });
            dispatch({
                type: 'UPDATE_LAND',
                payload: { landId: land.id, updates: { innCount: state.lands[land.id].innCount + 1 } }
            });
            dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 在 ${land.name} 建了一間旅店` });
            endTurn();
        }
    };

    const useMiracle = (card) => {
        const effectFunc = EFFECTS[card.effectCode];
        if (effectFunc) {
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'MIRACLE', data: { name: card.name }, duration: 2500 }
            });
            effectFunc(dispatch, state, card.params, currentTeam.id, landsData);
            dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 使用了神蹟卡：${card.name}` });
            dispatch({ type: 'REMOVE_MIRACLE', payload: { teamId: currentTeam.id, cardId: card.id } });
        }
    };

    const endTurn = () => {
        dispatch({ type: 'NEXT_TURN' });
    };

    const payRent = () => {
        const { rent, owner } = state.rentInfo;

        dispatch({
            type: 'ADD_CASH',
            payload: { teamId: currentTeam.id, amount: -rent }
        });
        dispatch({
            type: 'ADD_CASH',
            payload: { teamId: owner.id, amount: rent }
        });
        dispatch({
            type: 'SET_ANIMATION',
            payload: { type: 'PAY_RENT', data: { amount: rent }, duration: 2000 }
        });
        dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 支付租金 $${rent} 給 ${owner.name}` });
        dispatch({ type: 'SET_RENT_INFO', payload: null });
        endTurn();
    };

    const sellLand = (landId) => {
        const land = landsData.find(l => l.id === landId);
        const landState = state.lands[landId];

        // Calculate sell price: half of land price + half of inn cost for each inn
        const sellPrice = Math.floor(land.price / 2) + Math.floor((landState.innCount * land.innCost) / 2);

        dispatch({
            type: 'ADD_CASH',
            payload: { teamId: currentTeam.id, amount: sellPrice }
        });

        // Reset land ownership but keep inns
        dispatch({
            type: 'UPDATE_LAND',
            payload: { landId, updates: { ownerId: null } }
        });

        dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 以半價 $${sellPrice} 出售了 ${land.name}` });
    };

    return {
        rollDice,
        buyLand,
        skipLand,
        buildInn,
        useMiracle,
        payRent,
        sellLand,
        endTurn,
        currentTeam
    };
};
