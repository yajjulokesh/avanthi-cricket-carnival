import React, { useState } from 'react';
import { Navbar } from './components/Navbar.js';
import { useAuctionSocket } from './hooks/useAuctionSocket.js';
import { ProjectorView } from './views/ProjectorView.js';
import { AdminView } from './views/AdminView.js';
import { FranchiseView } from './views/FranchiseView.js';
import { PublicView } from './views/PublicView.js';
import { RegisterView } from './views/RegisterView.js';
import { PlayerProfileView } from './views/PlayerProfileView.js';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('projector');

  // Unified Socket.io connection hook
  const {
    lotState,
    franchises,
    scarcities,
    isConnected,
    localSecondsLeft,
    placeBid,
    passLot,
  } = useAuctionSocket(currentView);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        isConnected={isConnected}
      />

      <main className="flex-1">
        {currentView === 'projector' && (
          <ProjectorView
            lotState={lotState}
            franchises={franchises}
            scarcities={scarcities}
            secondsLeft={localSecondsLeft}
          />
        )}

        {currentView === 'admin' && (
          <AdminView
            lotState={lotState}
            franchises={franchises}
            scarcities={scarcities}
            secondsLeft={localSecondsLeft}
          />
        )}

        {currentView === 'bidding' && (
          <FranchiseView
            lotState={lotState}
            franchises={franchises}
            secondsLeft={localSecondsLeft}
            onPlaceBid={placeBid}
            onPassLot={passLot}
          />
        )}

        {currentView === 'live' && (
          <PublicView
            lotState={lotState}
            franchises={franchises}
            scarcities={scarcities}
            secondsLeft={localSecondsLeft}
          />
        )}

        {currentView === 'register' && <RegisterView />}

        {currentView === 'player-login' && <PlayerProfileView />}
      </main>
    </div>
  );
};
