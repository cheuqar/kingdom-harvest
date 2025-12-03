import React from 'react';
import { useGame } from '../state/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import { getSeriesColor } from './CardDisplay';
import './VisualBoard.css';

const VisualBoard = ({ children }) => {
    const { state, landsData } = useGame();
    const { buildInn, currentTeam } = useGameEngine();

    // We need to map 24 lands to a board layout.
    // Bottom Row (Right to Left): 0-5
    // Left Col (Bottom to Top): 6-11
    // Top Row (Left to Right): 12-17
    // Right Col (Top to Bottom): 18-23

    // Helper to get land by index
    const getLand = (index) => landsData[index];

    const handleLandClick = (land) => {
        if (state.phase === 'BUILD_INN') {
            const landState = state.lands[land.id];
            if (landState.ownerId === currentTeam.id) {
                buildInn(land.id);
            }
        }
    };

    const renderLandCell = (index, positionClass) => {
        const land = getLand(index);
        const landState = state.lands[land.id];
        const owner = landState.ownerId ? state.teams.find(t => t.id === landState.ownerId) : null;
        const hasOwner = !!owner;
        const innCount = landState.innCount;

        const isBuildable = state.phase === 'BUILD_INN' && landState.ownerId === currentTeam.id;
        const isHighlighted = state.highlightedSeries && land.series === state.highlightedSeries;

        // Use owner's color for the header if owned, otherwise grey
        const headerColor = getSeriesColor(land.series, owner?.color);

        return (
            <div
                key={`${land.id}-${landState.ownerId || 'unowned'}-${innCount}`}
                className={`board-cell land-cell ${positionClass} ${hasOwner ? 'owned' : ''} ${innCount > 0 ? 'has-inn' : ''} ${isBuildable ? 'buildable' : ''} ${isHighlighted ? 'highlighted-series' : ''}`}
                style={{
                    borderColor: owner ? owner.color : 'rgba(255,255,255,0.1)',
                    borderWidth: owner ? '3px' : '1px',
                    cursor: isBuildable ? 'pointer' : 'default'
                }}
                onClick={() => handleLandClick(land)}
            >
                <div className="cell-header" style={{ backgroundColor: headerColor }}></div>
                <div className="cell-content">
                    <span className="cell-name">{land.name}</span>
                    {landState.innCount > 0 && (
                        <div className="inn-icons">
                            {'🏠'.repeat(landState.innCount)}
                        </div>
                    )}
                    {isBuildable && (
                        <div className="build-overlay">
                            <span className="build-icon">🔨</span>
                            <span className="build-cost">${land.innCost}</span>
                        </div>
                    )}
                </div>
                <div className="cell-price">${land.price}</div>
            </div>
        );
    };

    const renderCorner = (label, className) => (
        <div className={`board-cell corner-cell ${className}`}>
            <span>{label}</span>
        </div>
    );

    return (
        <div className="visual-board">
            {/* Top Row: Corner, 12-17, Corner */}
            {renderCorner("收成", "top-left")}
            {[12, 13, 14, 15, 16, 17].map(i => renderLandCell(i, "top-row"))}
            {renderCorner("神蹟", "top-right")}

            {/* Middle Section */}
            <div className="board-middle">
                {/* Left Column: 11-6 (Top to Bottom visually in grid, but logical order is 6->11 up) */}
                {/* Actually grid will place them. Left col is 11 down to 6? No. */}
                {/* Let's use specific placement containers */}
                <div className="side-column left-col">
                    {[11, 10, 9, 8, 7, 6].map(i => renderLandCell(i, "left-col-item"))}
                </div>

                {/* Center Content */}
                <div className="board-center-content">
                    {children}
                </div>

                {/* Right Column: 18-23 */}
                <div className="side-column right-col">
                    {[18, 19, 20, 21, 22, 23].map(i => renderLandCell(i, "right-col-item"))}
                </div>
            </div>

            {/* Bottom Row: Corner, 5-0, Corner */}
            {renderCorner("試煉", "bottom-left")}
            {[5, 4, 3, 2, 1, 0].map(i => renderLandCell(i, "bottom-row"))}
            {renderCorner("起點", "bottom-right")}
        </div>
    );
};

export default VisualBoard;
