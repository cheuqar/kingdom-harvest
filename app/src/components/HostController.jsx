import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../config/firebase';
import { ref, get } from 'firebase/database';
import { GameProvider } from '../state/GameContext';
import GameBoard from './GameBoard';
import LobbyScreen from './LobbyScreen';
import './HostController.css';

const HostController = () => {
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roomData, setRoomData] = useState(null);

    useEffect(() => {
        const checkRoom = async () => {
            if (!roomId) {
                setError('未提供房間代碼');
                setLoading(false);
                return;
            }

            try {
                const roomRef = ref(db, `games/${roomId}`);
                const snapshot = await get(roomRef);

                if (!snapshot.exists()) {
                    setError('找不到房間或房間已被刪除');
                    setLoading(false);
                    return;
                }

                const data = snapshot.val();
                const meta = data.meta || {};

                // Check expiration
                if (meta.expiresAt && meta.expiresAt < Date.now()) {
                    setError('此房間已過期');
                    setLoading(false);
                    return;
                }

                setRoomData({
                    roomId,
                    meta,
                    config: data.config || {},
                    state: data.state || null,
                    hasExistingGame: !!data.state
                });
                setLoading(false);
            } catch (err) {
                console.error('Error checking room:', err);
                setError('載入房間失敗，請重試。');
                setLoading(false);
            }
        };

        checkRoom();
    }, [roomId]);

    // Loading state
    if (loading) {
        return (
            <div className="host-controller-screen">
                <div className="host-controller-content">
                    <div className="loading-spinner"></div>
                    <h2>載入房間中...</h2>
                    <p>房間代碼: {roomId}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="host-controller-screen error">
                <div className="host-controller-content">
                    <span className="error-icon">!</span>
                    <h2>無法加入房間</h2>
                    <p>{error}</p>
                    <div className="action-buttons">
                        <button className="btn-primary" onClick={() => window.location.href = '/'}>
                            返回首頁
                        </button>
                        <button className="btn-secondary" onClick={() => window.location.href = '/schedule'}>
                            建立新房間
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Determine what to show based on room status
    const status = roomData?.meta?.status || 'scheduled';

    // If game is active or ended, restore to GameBoard
    if (status === 'active' || roomData.hasExistingGame) {
        return (
            <GameProvider restoreFromRoom={roomId}>
                <div className="app-container">
                    <GameBoard />
                </div>
            </GameProvider>
        );
    }

    // If scheduled or lobby, show LobbyScreen
    if (status === 'scheduled' || status === 'lobby') {
        return (
            <LobbyScreen
                roomId={roomId}
                isHost={true}
                roomData={roomData}
            />
        );
    }

    // Game ended
    if (status === 'ended') {
        return (
            <div className="host-controller-screen">
                <div className="host-controller-content">
                    <span className="info-icon">i</span>
                    <h2>遊戲已結束</h2>
                    <p>此遊戲已經結束。</p>
                    <div className="action-buttons">
                        <button className="btn-primary" onClick={() => window.location.href = '/'}>
                            返回首頁
                        </button>
                        <button className="btn-secondary" onClick={() => window.location.href = '/schedule'}>
                            建立新房間
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback
    return (
        <div className="host-controller-screen">
            <div className="host-controller-content">
                <h2>未知房間狀態</h2>
                <p>狀態: {status}</p>
                <button className="btn-primary" onClick={() => window.location.href = '/'}>
                    返回首頁
                </button>
            </div>
        </div>
    );
};

export default HostController;
