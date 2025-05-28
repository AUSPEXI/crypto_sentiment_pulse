// src/components/PortfolioTracker.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchSentimentData, SUPPORTED_COINS } from '../utils/api';
import { PortfolioItem } from '../types';
import { Trash2 } from 'lucide-react';

const PortfolioTracker: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Use SUPPORTED_COINS instead of STATIC_COINS
  const coins = Object.keys(SUPPORTED_COINS); // Fixed at line 9

  useEffect(() => {
    const loadSentiment = async () => {
      setLoading(true);
      try {
        const updatedPortfolio = await Promise.all(
          portfolio.map(async (item) => {
            const sentiment = await fetchSentimentData(item.coin);
            return { ...item, sentiment: sentiment.score };
          })
        );
        setPortfolio(updatedPortfolio);
      } catch (error) {
        console.error('Error loading sentiment:', error);
      } finally {
        setLoading(false);
      }
    };
    if (portfolio.length) loadSentiment();
  }, [portfolio]);

  const addCoin = useCallback((coin: string) => {
    if (!portfolio.find((item) => item.coin === coin)) {
      setPortfolio((prev) => [...prev, { coin, amount: 0, sentiment: 0 }]);
    }
  }, [portfolio]);

  const removeCoin = useCallback((coin: string) => {
    setPortfolio((prev) => prev.filter((item) => item.coin !== coin));
  }, []);

  const updateAmount = useCallback((coin: string, amount: number) => {
    setPortfolio((prev) =>
      prev.map((item) => (item.coin === coin ? { ...item, amount } : item))
    );
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Portfolio Tracker</h2>
      {loading && <p>Loading sentiment data...</p>}
      <div className="mb-4">
        <select
          onChange={(e) => addCoin(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Select a coin</option>
          {coins.map((coin) => (
            <option key={coin} value={coin}>
              {coin}
            </option>
          ))}
        </select>
      </div>
      {portfolio.length === 0 ? (
        <p>No coins in portfolio. Add one above!</p>
      ) : (
        <ul className="space-y-2">
          {portfolio.map((item) => (
            <li key={item.coin} className="flex items-center space-x-4">
              <span>{item.coin}: ${item.amount}</span>
              <input
                type="number"
                value={item.amount}
                onChange={(e) =>
                  updateAmount(item.coin, parseFloat(e.target.value) || 0)
                }
                className="p-1 border rounded w-20"
              />
              <span>Sentiment: {item.sentiment.toFixed(2)}</span>
              <button
                onClick={() => removeCoin(item.coin)}
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PortfolioTracker;
