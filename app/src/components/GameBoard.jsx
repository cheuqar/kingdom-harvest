
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
import DeviceTakeoverToast from './DeviceTakeoverToast';
import ErrorBoundary from './ErrorBoundary';
import LeaderboardModal from './LeaderboardModal';
import './GameBoard.css';

const GameBoard = () => {
    const { state, dispatch, landsData, network } = useGame();
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // ... (timer logic)

    if (state.phase === 'SETUP') return <SetupScreen />;
    if (state.phase === 'CONNECT') return <ConnectionScreen />;
    if (state.phase === 'RULES') return <RulesScreen />;

    if (state.phase === 'GAME_OVER') {
        return <GameOverScreen winner={state.winner} />;
    }

    return (
        <div className="game-board">
            <div className="top-buttons">
                <button className="btn-leaderboard" onClick={() => setShowLeaderboard(true)}>
                    🏆 排名
                </button>
                <button className="btn-system-menu" onClick={() => setShowMenu(true)}>
                    ⚙️ 選單
                </button>
            </div>
            {showMenu && <SystemMenu onClose={() => setShowMenu(false)} />}
            {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}

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
                    <ErrorBoundary name="MainArea">
                        <MainArea />
                    </ErrorBoundary>
                </VisualBoard>
            </div>

            <div className="right-panel">
                <LogPanel />
            </div>

            <AnimationOverlay />

            {/* Device Takeover Toast - non-blocking notification */}
            <DeviceTakeoverToast
                pendingTakeover={network.pendingTakeover}
                teamName={network.pendingTakeover ? state.teams[network.pendingTakeover.teamIndex]?.name : ''}
                teamColor={network.pendingTakeover ? state.teams[network.pendingTakeover.teamIndex]?.color : '#fff'}
                onConfirm={() => {
                    network.confirmTakeover();
                    const { config, ...dynamicState } = state;
                    network.broadcast({ type: 'SYNC_STATE', state: dynamicState });
                }}
                onReject={() => network.rejectTakeover()}
            />
        </div>
    );
};

export default GameBoard;
