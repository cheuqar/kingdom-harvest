import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './state/GameContext';
import GameBoard from './components/GameBoard';
import PlayerController from './components/PlayerController';
import ScheduleGameScreen from './components/ScheduleGameScreen';
import HostController from './components/HostController';
import './App.css';

const HostApp = () => {
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsLargeScreen(width >= 1024);
      setIsLandscape(width > height);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isLandscape) {
    const maxDim = Math.max(window.innerWidth, window.innerHeight);
    if (maxDim >= 1024) {
      return (
        <div className="mobile-restriction-screen">
          <div className="restriction-content">
            <h1>請旋轉螢幕</h1>
            <p>請將裝置轉為橫向模式以獲得最佳體驗</p>
            <p>Please rotate your device to landscape orientation.</p>
            <div className="screen-icon rotate-icon">📱 ➡️ 💻</div>
          </div>
        </div>
      );
    }
  }

  if (isLargeScreen) {
    return (
      <GameProvider>
        <div className="app-container">
          <GameBoard />
        </div>
      </GameProvider>
    );
  }

  return (
    <div className="mobile-restriction-screen">
      <div className="restriction-content">
        <h1>請使用電腦瀏覽</h1>
        <p>本遊戲僅支援解析度寬度 1024px 以上的裝置</p>
        <p>Please switch to a desktop device to play this game.</p>
        <div className="screen-icon">💻</div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HostApp />} />
        <Route path="/schedule" element={<ScheduleGameScreen onBack={() => window.location.href = '/'} />} />
        <Route path="/host" element={<HostController />} />
        <Route path="/join" element={<PlayerController />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
