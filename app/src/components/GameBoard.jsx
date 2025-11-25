
import React, { useEffect, useState } from 'react';
import { useGame } from '../state/GameContext';
import SetupScreen from './SetupScreen';
import ConnectionScreen from './ConnectionScreen';
import RulesScreen from './RulesScreen';
import GameOverScreen from './GameOverScreen';
import TeamList from './TeamList';
import MainArea from './MainArea';
import LogPanel from './LogPanel';
import VisualBoard from './VisualBoard';
import AnimationOverlay from './AnimationOverlay';
import SystemMenu from './SystemMenu';
import './GameBoard.css';

const GameBoard = () => {
    const { state, dispatch, landsData } = useGame();
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    // ... (timer logic)

    if (state.phase === 'SETUP') return <SetupScreen />;
    if (state.phase === 'CONNECT') return <ConnectionScreen />;
    if (state.phase === 'RULES') return <RulesScreen />;

    if (state.phase === 'GAME_OVER') {
        return <GameOverScreen winner={state.winner} />;
    }

    return (
        <div className="game-board">
            <button className="btn-system-menu" onClick={() => setShowMenu(true)}>
                ⚙️ 選單
            </button>
            {showMenu && <SystemMenu onClose={() => setShowMenu(false)} />}

            {state.gameDuration > 0 && timeRemaining !== null && (
                <div className="timer-display">
                    ⏱️ 剩餘時間: {formatTime ? formatTime(timeRemaining) : timeRemaining}
                </div>
            )}

            <div className="left-panel">
                <TeamList />
            </div>

            <div className="center-panel">
                <VisualBoard>
                    <MainArea />
                </VisualBoard>
            </div>

            <div className="right-panel">
                <LogPanel />
            </div>

            <AnimationOverlay />
        </div>
    );
};

export default GameBoard;
