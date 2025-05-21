import React, { useState } from 'react';
import Header from './components/Header';
import About from './components/About';
import SentimentSnapshot from './components/SentimentSnapshot';
import OnChainInsights from './components/OnChainInsights';
import EventAlerts from './components/EventAlerts';
import PortfolioTracker from './components/PortfolioTracker';
import TipJar from './components/TipJar';
import DatasetInfo from './components/DatasetInfo';
import UserGuide from './components/UserGuide';
import CoinSelect from './components/CoinSelect';

function App() {
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH']);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral via-neutral to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <section id="about">
          <About />
        </section>
        
        <div className="mt-8 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">Select Coins to Track</h2>
          <CoinSelect selectedCoins={selectedCoins} onChange={setSelectedCoins} />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div id="sentiment" className="xl:col-span-2">
            <SentimentSnapshot selectedCoins={selectedCoins} />
          </div>
          
          <div className="xl:col-span-1">
            <OnChainInsights selectedCoins={selectedCoins} />
          </div>
          
          <div id="events" className="xl:col-span-1">
            <EventAlerts />
          </div>
          
          <div id="portfolio" className="xl:col-span-2">
            <PortfolioTracker />
          </div>
          
          <div id="tip-jar" className="xl:col-span-1">
            <TipJar />
          </div>
          
          <div id="datasets" className="xl:col-span-2">
            <DatasetInfo />
          </div>
        </div>
      </main>
      
      <UserGuide />
    </div>
  );
}

export default App;
