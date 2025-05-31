import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SentimentSnapshot from './components/SentimentSnapshot';
import OnChainInsights from './components/OnChainInsights';
import EventAlerts from './components/EventAlerts';
import PortfolioTracker from './components/PortfolioTracker';
import Header from './components/Header';
import CoinSelect from './components/CoinSelect';
import DatasetInfo from './components/DatasetInfo';
import About from './components/About';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH', 'USDT']);

  return (
    <Router>
      <div className="min-h-screen bg-blue-50">
        <Header />
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <About />
          </div>
          <div className="mb-6">
            <CoinSelect selectedCoins={selectedCoins} onChange={setSelectedCoins} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
            <div className="space-y-6">
              <ErrorBoundary>
                <SentimentSnapshot selectedCoins={selectedCoins} />
              </ErrorBoundary>
              <ErrorBoundary>
                <EventAlerts />
              </ErrorBoundary>
            </div>
            <div className="space-y-6">
              <ErrorBoundary>
                <OnChainInsights selectedCoins={selectedCoins} />
              </ErrorBoundary>
            </div>
          </div>
          <div className="mt-6 w-full">
            <PortfolioTracker />
          </div>
          <div className="mt-6 w-full">
            <DatasetInfo />
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
