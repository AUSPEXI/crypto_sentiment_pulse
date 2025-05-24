// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SentimentSnapshot from './components/SentimentSnapshot';
import OnChainInsights from './components/OnChainInsights';
import EventAlerts from './components/EventAlerts';
import PortfolioTracker from './components/PortfolioTracker';
import Header from './components/Header';

const App: React.FC = () => {
  const [selectedCoins, setSelectedCoins] = React.useState<string[]>(['BTC', 'ETH', 'USDT']);

  return (
    <Router>
      <div className="min-h-screen bg-blue-50">
        <Header />
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <SentimentSnapshot selectedCoins={selectedCoins} />
              <EventAlerts />
              <PortfolioTracker />
            </div>
            <div className="space-y-6">
              <OnChainInsights selectedCoins={selectedCoins} />
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
