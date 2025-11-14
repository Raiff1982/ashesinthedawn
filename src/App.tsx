import { useState } from 'react';
import { DAWProvider } from './contexts/DAWContext';
import TopBar from './components/TopBar';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import Mixer from './components/Mixer';
import Sidebar from './components/Sidebar';
import WelcomeModal from './components/WelcomeModal';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <DAWProvider>
      <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
        <TopBar />

        <div className="flex-1 flex overflow-hidden">
          <TrackList />

          <div className="flex-1 flex flex-col overflow-hidden">
            <Timeline />
            <Mixer />
          </div>

          <Sidebar />
        </div>

        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      </div>
    </DAWProvider>
  );
}

export default App;
