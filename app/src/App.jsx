import React, { useState, useEffect } from 'react';
import { GameProvider } from './state/GameContext';
import GameBoard from './components/GameBoard';
import './App.css';

function App() {
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [isTablet, setIsTablet] = useState(false); // Approximate check

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsLargeScreen(width >= 1024);
      setIsLandscape(width > height);
      
      // Simple check for potential tablet devices (large phones or tablets)
      // that might trigger this range but aren't full desktops
      const isTabletSize = width >= 768 && width < 1024;
      setIsTablet(isTabletSize);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Logic:
  // 1. If screen < 768 (mobile), show desktop restriction (already handled by isLargeScreen logic, but refined below)
  // 2. If screen >= 768 and < 1024 (tablet range), check orientation.
  //    - If portrait, ask for landscape.
  //    - If landscape but < 1024, still show restriction (per original request ">= 1024").
  // Actually, user asked: "restrict the game only can load in desktop with >= 1024... for other, display message"
  // And then: "also check it it is tablet, if it is not landscape mode, show a fullscreen overlay to ask user to turn"
  
  // Merging logic:
  // - Strict Requirement: Width must be >= 1024.
  // - If Width >= 1024, we are good.
  // - If Width < 1024:
  //   - If it looks like a tablet in portrait (e.g., iPad is 768x1024), it might actually satisfy >= 1024 if rotated!
  //   - So if width < 1024, BUT device seems capable of being large enough if rotated (height >= 1024), we suggest rotation.
  //   - Otherwise, we say "Use Desktop".

  // Let's refine the checks to be more helpful:
  
  const isWidthValid = isLargeScreen; // Use state instead of direct window access
  const isHeightLargeEnough = window.innerHeight >= 1024; // Use window directly as this isn't in state, or add to state

  // Use state values for consistency during renders
  if (isLargeScreen) {
    return (
      <GameProvider>
        <div className="app-container">
          <GameBoard />
        </div>
      </GameProvider>
    );
  }

  // Case 2: Width is too small, but rotating might help (Tablet Portrait)
  // A tablet in portrait with 1024 width (e.g. iPad Pro 12.9 is 1024x1366)
  // Wait, if it is 1024 width, isLargeScreen will be true, so it will show the game.
  // But the user said "1024 x 1366 screen size... overlay message... is not shown, even it's in portrait mode".
  // This means for 1024x1366 (Portrait), width IS 1024. So isLargeScreen is TRUE.
  // So it enters "Case 1" and shows the game.
  // But the user WANTS to force landscape if it's a tablet.
  
  // Re-evaluating requirements:
  // 1. "restrict the game only can load in desktop with >= 1024 width"
  // 2. "also check it it is tablet, if it is not landscape mode, show a fullscreen overlay to ask user to turn"
  
  // If a tablet is 1024x1366 (Portrait), width=1024. It technically meets requirement #1.
  // But requirement #2 says "if it is not landscape mode, show overlay".
  // So we need to ENFORCE landscape if it detects it's a tablet-like aspect ratio or just generally enforce landscape?
  // Generally for games, we want landscape.
  
  // If width >= 1024 AND height > width (Portrait Desktop/Tablet), maybe we should ask to rotate?
  // A standard 1080p monitor in portrait is 1080x1920. Width > 1024.
  // Do we want to block that? Probably yes, "Turn screen" makes sense for tablets.
  
  // Updated Logic:
  // If not Landscape, ask to rotate (if device seems capable of being wide enough).
  
  if (!isLandscape) {
      // If it's portrait, we should check if rotating would solve it or if it's just a mobile phone.
      // If either dimension is >= 1024, it's a candidate for "Rotate Screen".
      // (e.g. 768x1024 iPad -> Rotate to 1024x768 -> Good)
      // (e.g. 1024x1366 iPad Pro -> Rotate to 1366x1024 -> Good)
      // (e.g. 375x812 iPhone -> Rotate to 812x375 -> Too small < 1024)
      
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
  
  // If we are here, either:
  // 1. It is Landscape.
  // 2. It is Portrait but max dimension < 1024 (Small mobile).
  
  // Now check width requirement for the actual game load
  if (isLargeScreen) {
       return (
      <GameProvider>
        <div className="app-container">
          <GameBoard />
        </div>
      </GameProvider>
    );
  }

  // Case 3: Landscape but still too small, or Portrait and too small.
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
}

export default App;
