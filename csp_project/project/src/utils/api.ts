// src/App.tsx
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
        <section id="about" className="mb-8">
          <About />
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">Select Coins to Track</h2>
          <CoinSelect selectedCoins={selectedCoins} onChange={setSelectedCoins} />
        </section>

        <div className="space-y-8">
          <section id="sentiment">
            <SentimentSnapshot selectedCoins={selectedCoins} />
          </section>

          <section id="onchain-insights">
            <OnChainInsights selectedCoins={selectedCoins} />
          </section>

          <section id="portfolio">
            <PortfolioTracker />
          </section>

          <section id="news">
            <EventAlerts />
          </section>

          <section id="tip-jar">
            <TipJar />
          </section>

          <section id="datasets">
            <DatasetInfo />
          </section>
        </div>
      </main>
      <UserGuide />
    </div>
  );
}

export default App;
