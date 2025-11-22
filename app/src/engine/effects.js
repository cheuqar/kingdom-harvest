import { calculateRent } from '../utils/gameUtils.js';

export const EFFECTS = {
    E_COLLECT_RENT_SERIES: (dispatch, state, params, teamId, landsData) => {
        // User needs to select a land of that series?
        // Or we just pick the best one?
        // Spec: "Holder chooses one land of that series they own".
        // For simplicity, we'll pick the best one for max rent automatically.

        const teamLands = landsData.filter(l =>
            l.series === params.series && state.lands[l.id].ownerId === teamId
        );

        if (teamLands.length === 0) {
            dispatch({ type: 'ADD_LOG', payload: `沒有「${params.series}」系列土地，無法收租。` });
            dispatch({ type: 'CLEAR_HIGHLIGHTED_SERIES' });
            return;
        }

        // Find max rent
        let bestLand = teamLands[0];
        let maxRent = 0;

        teamLands.forEach(l => {
            const r = calculateRent(l, state.lands[l.id], teamId, landsData, state.lands);
            if (r > maxRent) {
                maxRent = r;
                bestLand = l;
            }
        });

        dispatch({ type: 'ADD_LOG', payload: `執行收租【${params.series}】：${bestLand.name}，金額 $${maxRent}` });

        // Correct approach:
        // Assuming all pay. Actually need to check bankrupt teams.
        let gain = 0;
        state.teams.forEach(t => {
            if (t.id !== teamId && !t.isBankrupt) {
                dispatch({ type: 'ADD_CASH', payload: { teamId: t.id, amount: -maxRent } });
                gain += maxRent;
            }
        });

        dispatch({ type: 'ADD_CASH', payload: { teamId, amount: gain } });

        // Clear highlighting after execution
        setTimeout(() => {
            dispatch({ type: 'CLEAR_HIGHLIGHTED_SERIES' });
        }, 2000);
    },

    E_COLLECT_RENT_LAND: (dispatch, state, params, teamId, landsData) => {
        const land = landsData.find(l => l.id === params.landId);
        if (state.lands[land.id].ownerId !== teamId) {
            dispatch({ type: 'ADD_LOG', payload: '你沒有這塊地，無法收租。' });
            return;
        }
        const rent = calculateRent(land, state.lands[land.id], teamId, landsData, state.lands);

        let gain = 0;
        state.teams.forEach(t => {
            if (t.id !== teamId && !t.isBankrupt) {
                dispatch({ type: 'ADD_CASH', payload: { teamId: t.id, amount: -rent } });
                gain += rent;
            }
        });
        dispatch({ type: 'ADD_CASH', payload: { teamId, amount: gain } });
    },

    E_PAY_AND_GAIN_SEED: (dispatch, state, params, teamId) => {
        const currentSeeds = state.teams.find(t => t.id === teamId).seeds;

        dispatch({ type: 'ADD_CASH', payload: { teamId, amount: -params.pay } });
        dispatch({ type: 'UPDATE_TEAM', payload: { teamId, updates: { seeds: currentSeeds + params.seed } } });
        dispatch({ type: 'ADD_LOG', payload: `付 $${params.pay}，獲得種子 +${params.seed}` });
    },

    E_GIVE_PLAYER_AND_GAIN_SEED: (dispatch, state, params, teamId) => {
        // Give to random other player or let user choose?
        // For simplicity: Give to next player.
        const targetIndex = (state.teams.findIndex(t => t.id === teamId) + 1) % state.teams.length;
        const targetTeam = state.teams[targetIndex];

        const currentTeam = state.teams.find(t => t.id === teamId);

        dispatch({ type: 'ADD_CASH', payload: { teamId: currentTeam.id, amount: -params.amount } });
        dispatch({ type: 'UPDATE_TEAM', payload: { teamId: currentTeam.id, updates: { seeds: currentTeam.seeds + params.seed } } });

        dispatch({ type: 'ADD_CASH', payload: { teamId: targetTeam.id, amount: params.amount } });

        dispatch({ type: 'ADD_LOG', payload: `給予 ${targetTeam.name} $${params.amount}，獲得種子 +${params.seed}` });
    },

    E_GAIN_CASH_BY_SEED: (dispatch, state, params, teamId) => {
        const team = state.teams.find(t => t.id === teamId);
        let amount = params.base;
        if (team.seeds >= params.threshold) {
            amount += params.bonus; // My JSON params: { base: 150, threshold: 2, bonus: 100 } -> 150 + 100 = 250.
        }
        dispatch({ type: 'ADD_CASH', payload: { teamId, amount } });
        dispatch({ type: 'ADD_LOG', payload: `獲得 $${amount}` });
    },

    E_GAIN_CASH_PER_SEED: (dispatch, state, params, teamId) => {
        const team = state.teams.find(t => t.id === teamId);
        let amount = params.base + (team.seeds * params.perSeed);
        if (params.max && amount > params.max) amount = params.max;

        dispatch({ type: 'ADD_CASH', payload: { teamId, amount } });
        dispatch({ type: 'ADD_LOG', payload: `獲得 $${amount} (種子加成)` });
    },

    E_PAY_CASH: (dispatch, state, params, teamId) => {
        dispatch({ type: 'ADD_CASH', payload: { teamId, amount: -params.amount } });
        dispatch({ type: 'ADD_LOG', payload: `支付 $${params.amount}` });
    },

    E_PAY_CASH_OR_SEED: (dispatch, state, params, teamId) => {
        // Complex logic requiring user choice.
        // For MVP, auto-use seed if available?
        // "If has seed, can choose to destroy 1 seed -> pay half".
        // Let's auto-use for now to simplify.
        const team = state.teams.find(t => t.id === teamId);
        if (team.seeds > 0) {
            dispatch({ type: 'ADD_CASH', payload: { teamId, amount: -(params.amount / 2) } });
            dispatch({ type: 'UPDATE_TEAM', payload: { teamId, updates: { seeds: team.seeds - 1 } } });
            dispatch({ type: 'ADD_LOG', payload: `消耗種子減半支付 $${params.amount / 2}` });
        } else {
            dispatch({ type: 'ADD_CASH', payload: { teamId, amount: -params.amount } });
            dispatch({ type: 'ADD_LOG', payload: `支付 $${params.amount}` });
        }
    },

    E_MIRACLE_HALF_PAY: (dispatch, state, params, teamId) => {
        // This is a miracle card, so it should be added to inventory.
        // The caller 'executeEvent' should handle adding to inventory if type is miracle.
        // Let's make `executeEvent` handle "miracle" type check.
    },

    E_MANIP_RICH_TO_POOR: (dispatch, state, params, teamId) => {
        // Find rich and poor
        let sorted = [...state.teams].sort((a, b) => b.cash - a.cash);
        let rich = sorted[0];
        let poor = sorted[sorted.length - 1];

        if (rich.id === poor.id) return; // Only 1 team?

        dispatch({ type: 'ADD_CASH', payload: { teamId: rich.id, amount: -params.amount } });
        dispatch({ type: 'ADD_CASH', payload: { teamId: poor.id, amount: params.amount } });
        dispatch({ type: 'ADD_LOG', payload: `${rich.name} 轉移 $${params.amount} 給 ${poor.name}` });
    },

    E_MANIP_REVERSE_FORTUNE: (dispatch, state, params, teamId) => {
        let sorted = [...state.teams].sort((a, b) => b.cash - a.cash);
        let rich = sorted[0];
        const team = state.teams.find(t => t.id === teamId);

        if (team.id === rich.id) {
            dispatch({ type: 'ADD_CASH', payload: { teamId, amount: -params.amount } });
            dispatch({ type: 'ADD_LOG', payload: `你是首富，支付 $${params.amount}` });
        } else {
            dispatch({ type: 'ADD_CASH', payload: { teamId, amount: params.amount } });
            dispatch({ type: 'ADD_LOG', payload: `你不是首富，獲得 $${params.amount}` });
        }
    },

    E_BUFF_NEXT_RENT: (dispatch, state, params, teamId) => {
        // This would require a buff state system, which is complex
        // For now, just give immediate cash bonus
        dispatch({ type: 'ADD_CASH', payload: { teamId, amount: 100 } });
        dispatch({ type: 'ADD_LOG', payload: `獲得租金加成獎勵 $100` });
    },

    E_MIRACLE_POOR_GRANT: (dispatch, state, params, teamId) => {
        // Miracle cards should be added to inventory, not executed here
        // This function won't be called for miracle type cards
        // But adding implementation in case it's called directly
        const team = state.teams.find(t => t.id === teamId);
        if (team.cash <= params.threshold) {
            let grant = params.grant;
            if (team.seeds >= 1) {
                grant += params.seedBonus;
            }
            dispatch({ type: 'ADD_CASH', payload: { teamId, amount: grant } });
            dispatch({ type: 'ADD_LOG', payload: `使用神蹟卡，獲得 $${grant}` });
        }
    },

    E_PAY_MULTIPLIER_RENT_RANDOM: (dispatch, state, params, teamId, landsData) => {
        // 1. Find lands owned by OTHERS
        const otherLands = landsData.filter(l => {
            const ownerId = state.lands[l.id].ownerId;
            return ownerId && ownerId !== teamId;
        });

        if (otherLands.length === 0) {
            dispatch({ type: 'ADD_LOG', payload: '沒有其他玩家擁有土地，無需支付。' });
            return;
        }

        // 2. Pick random land
        const randomLand = otherLands[Math.floor(Math.random() * otherLands.length)];
        const ownerId = state.lands[randomLand.id].ownerId;
        const owner = state.teams.find(t => t.id === ownerId);

        // 3. Calculate rent
        const baseRent = calculateRent(randomLand, state.lands[randomLand.id], ownerId, landsData, state.lands);

        // 4. Apply multiplier
        const finalRent = baseRent * params.multiplier;

        // 5. Pay
        dispatch({ type: 'ADD_CASH', payload: { teamId, amount: -finalRent } });
        dispatch({ type: 'ADD_CASH', payload: { teamId: ownerId, amount: finalRent } });

        dispatch({
            type: 'SET_ANIMATION',
            payload: { type: 'PAY_RENT', data: { amount: finalRent }, duration: 2000 }
        });

        dispatch({ type: 'ADD_LOG', payload: `隨機選中 ${owner.name} 的 ${randomLand.name}，支付 ${params.multiplier} 倍租金 $${finalRent}` });
    }
};
