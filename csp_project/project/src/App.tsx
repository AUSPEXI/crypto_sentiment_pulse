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
import { getSupportedCoins } from './api';

function App() {
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('App.tsx: useEffect triggered at', new Date().toISOString());
    const loadCoins = async () => {
      try {
        setIsLoading(true);
        const supportedCoins = getSupportedCoins();
        console.log('App.tsx: Supported Coins from api.ts:', supportedCoins);
        if (supportedCoins.length === 0) {
          console.error('App.tsx: No coins available from getSupportedCoins - check api.ts');
        }
        const coinDetails = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
          { id: 'tether', symbol: 'USDT', name: 'Tether' },
          { id: 'binance-coin', symbol: 'BNB', name: 'BNB' },
          { id: 'solana', symbol: 'SOL', name: 'Solana' },
          { id: 'usd-coin', symbol: 'USDC', name: 'USDC' },
          { id: 'xrp', symbol: 'XRP', name: 'XRP' },
          { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
          { id: 'toncoin', symbol: 'TON', name: 'TON' },
          { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
          { id: 'tron', symbol: 'TRX', name: 'TRON' },
          { id: 'avalanche', symbol: 'AVAX', name: 'Avalanche' },
          { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
          { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
          { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash' },
          { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
          { id: 'near-protocol', symbol: 'NEAR', name: 'NEAR Protocol' },
          { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
          { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
          { id: 'pepe', symbol: 'PEPE', name: 'Pepe' }
        ];
        setCoinDetails(coinDetails);
        console.log('App.tsx: setCoinDetails called with', coinDetails.length, 'coins');
        const validSelected = selectedCoins.filter(coin => supportedCoins.includes(coin));
        if (validSelected.length === 0 && supportedCoins.length > 0) {
          setSelectedCoins([supportedCoins[0], supportedCoins[1]]);
          console.log('App.tsx: Set default selected coins:', [supportedCoins[0], supportedCoins[1]]);
        } else {
          setSelectedCoins(validSelected);
          console.log('App.tsx: Set validated selected coins:', validSelected);
        }
      } catch (error) {
        console.error('App.tsx: Error loading coins:', error);
        setCoinDetails([
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
          { id: 'solana', symbol: 'SOL', name: 'Solana' }
        ]);
        setSelectedCoins(['BTC', 'ETH']);
      } finally {
        setIsLoading(false);
        console.log('App.tsx: Loading complete, isLoading set to false');
      }
    };
    loadCoins();
  }, []);

  if (isLoading) {
    return <div>Loading coins...</div>;
  }

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
