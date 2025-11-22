import React from 'react';
import { GameProvider } from './state/GameContext';
import GameBoard from './components/GameBoard';
import './App.css';

function App() {
  return (
    <GameProvider>
      <div className="app-container">
        <GameBoard />
      </div>
    </GameProvider>
  );
}

export default App;
