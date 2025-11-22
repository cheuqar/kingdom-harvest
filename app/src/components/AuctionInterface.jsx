import React, { useState, useEffect } from 'react';
import { useGame } from '../state/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import CardDisplay from './CardDisplay';
import './AuctionInterface.css';

const AuctionInterface = () => {
    const { state, dispatch } = useGame();
    const { endTurn } = useGameEngine();
    const land = state.currentCard;
    const currentTurnTeamId = state.teams[state.currentTeamIndex].id;

    // Eligible bidders: everyone except the current turn player (who failed to buy)
    // Unless it's a "skip" choice, maybe they can still bid? 
    // Usually if you decline to buy at face value, you can bid in auction.
    // But the prompt says "every other team input a budget". So exclude current team.
    const [bidders, setBidders] = useState([]);
    const [highestBid, setHighestBid] = useState(0);
    const [highestBidderId, setHighestBidderId] = useState(null);
    const [activeBidders, setActiveBidders] = useState(null); // Start as null to indicate uninitialized

    useEffect(() => {
        const eligibleTeams = state.teams.filter(t => t.id !== currentTurnTeamId && !t.isBankrupt);
        setBidders(eligibleTeams);
        setActiveBidders(eligibleTeams.map(t => t.id));
        setHighestBid(Math.floor(land.price * 0.5));
    }, [state.teams, currentTurnTeamId, land]);


    const handleBid = (teamId, amount) => {
        if (amount > highestBid) {
            setHighestBid(amount);
            setHighestBidderId(teamId);
            dispatch({ type: 'ADD_LOG', payload: `${state.teams.find(t => t.id === teamId).name} 出價 $${amount}` });
        }
    };

    const handlePass = (teamId) => {
        setActiveBidders(prev => prev.filter(id => id !== teamId));
        dispatch({ type: 'ADD_LOG', payload: `${state.teams.find(t => t.id === teamId).name} 放棄競拍` });
    };

    const resolveAuction = () => {
        if (highestBidderId) {
            const winner = state.teams.find(t => t.id === highestBidderId);
            dispatch({
                type: 'UPDATE_TEAM',
                payload: { teamId: winner.id, updates: { cash: winner.cash - highestBid } }
            });
            dispatch({
                type: 'UPDATE_LAND',
                payload: { landId: land.id, updates: { ownerId: winner.id } }
            });
            dispatch({ type: 'ADD_LOG', payload: `拍賣結束！${winner.name} 以 $${highestBid} 購得 ${land.name}` });
        } else {
            dispatch({ type: 'ADD_LOG', payload: '無人出價，土地流拍。' });
            // Should it go to auction pool? Or just stay unowned?
            // If it was from the deck, it's already "drawn".
            // Let's just leave it unowned.
        }
        endTurn();
    };

    // If only one bidder left and they are the highest bidder (or if everyone passed)
    useEffect(() => {
        if (activeBidders === null) return; // Wait for initialization

        if (activeBidders.length === 0) {
            resolveAuction();
        } else if (activeBidders.length === 1 && activeBidders[0] === highestBidderId) {
            // The last person standing is already the winner
            resolveAuction();
        }
    }, [activeBidders, highestBidderId]);

    if (!land || activeBidders === null) return null;

    return (
        <div className="auction-interface">
            <h2>土地拍賣</h2>

            <div className="auction-content">
                <div className="auction-left">
                    <CardDisplay card={land} type="land" />
                </div>

                <div className="auction-right">
                    <div className="auction-status">
                        <div className="highest-bid">
                            當前最高價: <span className="price">${highestBid}</span>
                            {highestBidderId && (
                                <span className="bidder-name">
                                    (由 {state.teams.find(t => t.id === highestBidderId).name} 出價)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bidders-grid">
                        {bidders.map(team => {
                            const isActive = activeBidders.includes(team.id);
                            const isHighest = team.id === highestBidderId;
                            const canAfford = (amount) => team.cash >= amount;

                            if (!isActive) return null;

                            return (
                                <div key={team.id} className={`bidder-card ${isHighest ? 'winning' : ''}`} style={{ borderLeftColor: team.color }}>
                                    <h3>{team.name}</h3>
                                    <div className="cash-display">現金: ${team.cash}</div>

                                    <div className="bid-actions">
                                        <button
                                            className="btn-bid"
                                            onClick={() => handleBid(team.id, highestBid + 50)}
                                            disabled={!canAfford(highestBid + 50)}
                                        >
                                            + $50
                                        </button>
                                        <button
                                            className="btn-bid"
                                            onClick={() => handleBid(team.id, highestBid + 100)}
                                            disabled={!canAfford(highestBid + 100)}
                                        >
                                            + $100
                                        </button>
                                        <button
                                            className="btn-pass"
                                            onClick={() => handlePass(team.id)}
                                        >
                                            放棄
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionInterface;
