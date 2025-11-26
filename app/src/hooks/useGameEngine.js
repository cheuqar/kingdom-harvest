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
        const is7thToss = currentRollCount % 7 === 0;

        if (is7thToss) {
            // Add replenishment bonus (track as income for tithing)
            const replenishAnimationDuration = 1500; // 1.5 seconds
            dispatch({
                type: 'ADD_CASH',
                payload: { teamId: currentTeam.id, amount: 1000 }
            });
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'BONUS_CASH', data: { amount: 1000 }, duration: replenishAnimationDuration }
            });
            dispatch({ type: 'ADD_LOG', payload: '每7次擲骰獎勵：銀行發放 $1000！' });

            // Calculate offering amounts (income includes the $1000 just received)
            // Note: incomeSinceLastReplenish is updated by ADD_CASH, so we need to add the new amount
            const totalIncome = (currentTeam.incomeSinceLastReplenish || 0) + 1000;
            const oneTenthAmount = Math.floor(totalIncome / 10);
            const seeds = Math.floor(oneTenthAmount / 100); // 1 seed per $100
            const doubleSeeds = seeds * 2;

            // Trigger offering event AFTER the replenishment animation ends
            // so the countdown timer starts after the animation
            setTimeout(() => {
                dispatch({
                    type: 'START_OFFERING',
                    payload: { totalIncome, oneTenthAmount, seeds, doubleSeeds }
                });
            }, replenishAnimationDuration);
        }

        // If it's the 7th toss, don't proceed to dice phases yet - wait for offering to complete
        if (!is7thToss) {
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
        }
        // For 7th toss, the dice phase will be triggered after offering is completed
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
        if (!card) return; // Guard against null card

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
        if (!card) return; // Guard against null card
        // Trigger Auction instead of just adding to pool
        startAuction(card);
    };

    const startAuction = (card) => {
        // Exclude current player from initial bidders? Or include?
        // Usually current player declined to buy, so they might be excluded or included depending on rules.
        // Let's exclude them as per previous logic.
        const eligibleTeams = state.teams.filter(t => t.id !== currentTeam.id && !t.isBankrupt);
        const bidderIds = eligibleTeams.map(t => t.id);
        const startBid = Math.floor(card.price * 0.5);

        dispatch({
            type: 'START_AUCTION',
            payload: {
                landId: card.id,
                startBid,
                bidders: bidderIds
            }
        });
        dispatch({ type: 'ADD_LOG', payload: `${card.name} 進入拍賣！起標價 $${startBid}` });
    };

    const placeBid = (amount) => {
        // Check if amount > highestBid
        if (state.auction && amount > state.auction.highestBid) {
            // We need to know WHO is bidding. 
            // In Client mode, useGameEngine uses 'currentTeam' which is the TURN owner.
            // But in auction, ANYONE can bid.
            // So placeBid needs to accept teamId.
        }
    };

    // Actually, useGameEngine is used by PlayerController too.
    // PlayerController knows its own teamIndex.
    // So we should export a generic placeBid(teamId, amount).

    const handleBid = (teamId, amount) => {
        if (state.auction && amount > state.auction.highestBid) {
            dispatch({ type: 'PLACE_BID', payload: { teamId, amount } });
        }
    };

    const handlePass = (teamId) => {
        if (state.auction) {
            dispatch({ type: 'PASS_AUCTION', payload: { teamId } });
        }
    };

    const resolveAuction = () => {
        if (!state.auction) return;

        const { highestBidderId, highestBid, landId } = state.auction;
        const land = landsData.find(l => l.id === landId);

        if (highestBidderId) {
            const winner = state.teams.find(t => t.id === highestBidderId);
            dispatch({
                type: 'ADD_CASH',
                payload: { teamId: winner.id, amount: -highestBid }
            });
            dispatch({
                type: 'UPDATE_LAND',
                payload: { landId: land.id, updates: { ownerId: winner.id } }
            });
            dispatch({ type: 'ADD_LOG', payload: `拍賣結束！${winner.name} 以 $${highestBid} 購得 ${land.name}` });
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'ACQUIRE_LAND', data: { name: land.name }, duration: 2000 }
            });
        } else {
            dispatch({ type: 'ADD_LOG', payload: '無人出價，土地流拍。' });
        }

        dispatch({ type: 'END_AUCTION' });
        endTurn();
    };

    // ...

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

        if (card.type === 'decision') {
            dispatch({ type: 'SET_PHASE', payload: 'DECISION_EVENT' });
            return;
        }

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
    };

    const handleDecision = (choice) => {
        const card = state.currentCard;
        if (!card || card.type !== 'decision') return;

        const effect = choice === 'Y' ? card.yEffect : card.nEffect;

        if (effect.cash !== 0) {
            dispatch({ type: 'ADD_CASH', payload: { teamId: currentTeam.id, amount: effect.cash } });
        }
        if (effect.seeds !== 0) {
            dispatch({ type: 'ADD_SEEDS', payload: { teamId: currentTeam.id, amount: effect.seeds } });
        }

        dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 選擇了 ${choice === 'Y' ? '是' : '否'}。` });
        endTurn();
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

    const handleOffering = (choice) => {
        // choice: 'none', 'tithe', 'double'
        const { oneTenthAmount, seeds, doubleSeeds } = state.offering || {};

        if (choice === 'tithe' && oneTenthAmount > 0) {
            // Deduct one-tenth and give seeds
            dispatch({
                type: 'ADD_CASH',
                payload: { teamId: currentTeam.id, amount: -oneTenthAmount, skipIncomeTracking: true }
            });
            dispatch({
                type: 'ADD_SEEDS',
                payload: { teamId: currentTeam.id, amount: seeds }
            });
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'OFFERING', data: { amount: oneTenthAmount, seeds }, duration: 2500 }
            });
            dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 奉獻十分之一 $${oneTenthAmount}，獲得 ${seeds} 顆種子！` });
        } else if (choice === 'double' && oneTenthAmount > 0) {
            // Deduct double and give double seeds
            const doubleAmount = oneTenthAmount * 2;
            dispatch({
                type: 'ADD_CASH',
                payload: { teamId: currentTeam.id, amount: -doubleAmount, skipIncomeTracking: true }
            });
            dispatch({
                type: 'ADD_SEEDS',
                payload: { teamId: currentTeam.id, amount: doubleSeeds }
            });
            dispatch({
                type: 'SET_ANIMATION',
                payload: { type: 'OFFERING', data: { amount: doubleAmount, seeds: doubleSeeds }, duration: 2500 }
            });
            dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 雙倍奉獻 $${doubleAmount}，獲得 ${doubleSeeds} 顆種子！` });
        } else {
            dispatch({ type: 'ADD_LOG', payload: `${currentTeam.name} 選擇不奉獻。` });
        }

        // Complete offering and reset income tracker
        dispatch({ type: 'COMPLETE_OFFERING', payload: { teamId: currentTeam.id } });

        // Now continue to the dice phase based on the roll value
        // We need to get the dice value from state
        const val = state.dice;
        setTimeout(() => {
            if (val <= 3) {
                if (state.deck.lands.length === 0 || val === 3) {
                    handleRandomLandPhase();
                } else {
                    handleLandPhase();
                }
            } else if (val === 4) {
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
        }, 500);
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
        startAuction,
        handleBid,
        handlePass,
        handleDecision,
        handleOffering,
        resolveAuction,
        currentTeam
    };
};
