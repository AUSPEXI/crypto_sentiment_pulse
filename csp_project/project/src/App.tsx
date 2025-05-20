import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import About from './components/About';
import SentimentSnapshot from './components/SentimentSnapshot';
import OnChainInsights from './components/OnChainInsights';
import EventAlerts from './components/EventAlerts';
import PortfolioTracker from './components/PortfolioTracker';
import TipJar from './components/TipJar';
import DatasetInfo from './components/DatasetInfo';
import UserGuide from './components/UserGuide';
import CoinSelect, { setCoinDetails } from './components/CoinSelect';
import { fetchSupportedCoins, getSupportedCoins } from './api';

function App() {
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH']);

  useEffect(() => {
    const loadCoins = async () => {
      try {
        await fetchSupportedCoins();
        const supportedCoins = getSupportedCoins();
        console.log('Supported Coins:', supportedCoins);
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        const coinData = await response.json();
        if (!coinData || coinData.length === 0) throw new Error('No coin data from CoinGecko');
        setCoinDetails(coinData);
        const validSelected = selectedCoins.filter(coin => supportedCoins.includes(coin));
        if (validSelected.length === 0 && supportedCoins.length > 0) {
          setSelectedCoins([supportedCoins[0], supportedCoins[1]]);
        } else {
          setSelectedCoins(validSelected);
        }
      } catch (error) {
        console.error('Error loading coins in App:', error);
        // Use fallback coins
        setCoinDetails([
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
          { id: 'solana', symbol: 'SOL', name: 'Solana' }
        ]);
        setSelectedCoins(['BTC', 'ETH']);
      }
    };
    loadCoins();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral via-neutral to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <section id="about">
          <About />
        </section>
        
        <div className="mt-8 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">Select Coins to Track</h2>
          <CoinSelect 
            selectedCoins={selectedCoins} 
            onChange={setSelectedCoins} 
            availableCoins={getSupportedCoins()}
          />
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
