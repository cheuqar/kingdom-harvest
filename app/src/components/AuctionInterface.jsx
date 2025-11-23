import React, { useState, useEffect } from 'react';
import { useGame } from '../state/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import CardDisplay from './CardDisplay';
import './AuctionInterface.css';

const AuctionInterface = () => {
    const { state } = useGame();
    const { handleBid, handlePass, resolveAuction } = useGameEngine();

    const auction = state.auction;

    // Auto-resolve logic
    useEffect(() => {
        if (!auction) return;

        if (auction.activeBidders.length === 0) {
            resolveAuction();
        } else if (auction.activeBidders.length === 1 && auction.activeBidders[0] === auction.highestBidderId) {
            // Winner determined
            resolveAuction();
        }
    }, [auction, resolveAuction]);

    if (!auction) return null;

    const land = state.currentCard; // Or find by auction.landId

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
                            當前最高價: <span className="price">${auction.highestBid}</span>
                            {auction.highestBidderId && (
                                <span className="bidder-name">
                                    (由 {state.teams.find(t => t.id === auction.highestBidderId).name} 出價)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bidders-grid">
                        {state.teams.map(team => {
                            // Only show initial eligible bidders
                            if (!auction.initialBidders.includes(team.id)) return null;

                            const isActive = auction.activeBidders.includes(team.id);
                            const isHighest = team.id === auction.highestBidderId;
                            const canAfford = (amount) => team.cash >= amount;

                            return (
                                <div key={team.id} className={`bidder-card ${isHighest ? 'winning' : ''} ${!isActive ? 'folded' : ''}`} style={{ borderLeftColor: team.color }}>
                                    <h3>{team.name}</h3>
                                    <div className="cash-display">現金: ${team.cash}</div>
                                    {!isActive && <div className="status-badge">已放棄</div>}

                                    {/* Host controls for players without devices */}
                                    {isActive && (
                                        <div className="bid-actions">
                                            <button
                                                className="btn-bid"
                                                onClick={() => handleBid(team.id, auction.highestBid + 50)}
                                                disabled={!canAfford(auction.highestBid + 50)}
                                            >
                                                + $50
                                            </button>
                                            <button
                                                className="btn-bid"
                                                onClick={() => handleBid(team.id, auction.highestBid + 100)}
                                                disabled={!canAfford(auction.highestBid + 100)}
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
                                    )}
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
