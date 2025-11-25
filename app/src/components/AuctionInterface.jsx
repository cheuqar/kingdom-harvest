import React, { useState, useEffect } from 'react';
import { useGame } from '../state/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import CardDisplay from './CardDisplay';
import CountdownTimer from './CountdownTimer';
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

    // Auto-pass all remaining bidders when timer expires
    const handleAuctionExpire = () => {
        if (!auction) return;
        // Pass all active bidders
        auction.activeBidders.forEach(bidderId => {
            handlePass(bidderId);
        });
    };

    if (!auction) return null;

    const land = state.currentCard; // Or find by auction.landId

    return (
        <>
            {state.actionTimer > 0 && (
                <CountdownTimer
                    duration={state.actionTimer}
                    onExpire={handleAuctionExpire}
                />
            )}
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
                                const isActive = auction.activeBidders.includes(team.id);
                                const isHighest = auction.highestBidderId === team.id;
                                const canBid = isActive && team.cash >= auction.highestBid + 50;

                                return (
                                    <div
                                        key={team.id}
                                        className={`bidder-card ${isActive ? 'active' : 'passed'} ${isHighest ? 'highest' : ''}`}
                                    >
                                        <div className="bidder-name">{team.name}</div>
                                        <div className="bidder-cash">${team.cash}</div>
                                        {isActive && (
                                            <div className="bidder-actions">
                                                <button
                                                    className="btn-bid small"
                                                    onClick={() => handleBid(team.id, auction.highestBid + 50)}
                                                    disabled={!canBid}
                                                >
                                                    +$50
                                                </button>
                                                <button
                                                    className="btn-bid small"
                                                    onClick={() => handleBid(team.id, auction.highestBid + 100)}
                                                    disabled={team.cash < auction.highestBid + 100}
                                                >
                                                    +$100
                                                </button>
                                                <button
                                                    className="btn-pass small"
                                                    onClick={() => handlePass(team.id)}
                                                >
                                                    放棄
                                                </button>
                                            </div>
                                        )}
                                        {!isActive && <div className="status-passed">已放棄</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuctionInterface;
