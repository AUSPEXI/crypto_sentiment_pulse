// src/components/PortfolioTracker.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchSentimentData, STATIC_COINS } from '../utils/api';
import { PortfolioItem } from '../types';
import { Trash2 } from 'lucide-react';
import EventAlerts from './EventAlerts'; // Import EventAlerts

const DEFAULT_COINS = STATIC_COINS.map(coin => coin.symbol);

const PortfolioTracker: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [newCoin, setNewCoin] = useState<string>(DEFAULT_COINS[0]);
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [dataConsent, setDataConsent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentPopup, setShowConsentPopup] = useState<boolean>(false);

  // Load initial portfolio and consent from localStorage
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('portfolio');
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio));
    } else {
      const initialPortfolio = DEFAULT_COINS.map(coin => ({
        coin,
        quantity: 0,
      }));
      setPortfolio(initialPortfolio);
      localStorage.setItem('portfolio', JSON.stringify(initialPortfolio));
    }

    const savedConsent = localStorage.getItem('dataConsent');
    if (savedConsent) {
      setDataConsent(JSON.parse(savedConsent));
    } else {
      setShowConsentPopup(true);
    }
  }, []);

  // Sync portfolio to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Sync dataConsent to localStorage
  useEffect(() => {
    localStorage.setItem('dataConsent', JSON.stringify(dataConsent));
  }, [dataConsent]);

  // Memoized updateSentimentScores to prevent unnecessary re-runs
  const updateSentimentScores = useCallback(async () => {
    if (portfolio.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const updatedPortfolio = [...portfolio];

      for (let i = 0; i < updatedPortfolio.length; i++) {
        const item = updatedPortfolio[i];
        if (item.quantity === 0 || item.sentimentScore !== undefined) continue; // Skip if zero quantity or already fetched
        const sentimentData = await fetchSentimentData(item.coin);
        updatedPortfolio[i] = {
          ...item,
          sentimentScore: sentimentData.score,
        };
      }

      setPortfolio(prev => {
        const shouldUpdate = prev.some((item, idx) => item.sentimentScore !== updatedPortfolio[idx].sentimentScore);
        return shouldUpdate ? updatedPortfolio : prev; // Only update if scores differ
      });
    } catch (err) {
      setError('Failed to update sentiment scores. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [portfolio.length]); // Dependency on length to trigger on initial load or size change

  // Initial call and interval
  useEffect(() => {
    updateSentimentScores();
    const intervalId = setInterval(updateSentimentScores, 60 * 60 * 1000); // Update hourly
    return () => clearInterval(intervalId);
  }, [updateSentimentScores]);

  const handleAddCoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCoin || !newQuantity || isNaN(parseFloat(newQuantity)) || parseFloat(newQuantity) <= 0) {
      return;
    }

    const existingIndex = portfolio.findIndex(item => item.coin === newCoin);

    if (existingIndex >= 0) {
      const updatedPortfolio = [...portfolio];
      updatedPortfolio[existingIndex] = {
        ...updatedPortfolio[existingIndex],
        quantity: updatedPortfolio[existingIndex].quantity + parseFloat(newQuantity),
      };
      setPortfolio(updatedPortfolio);
    } else {
      setPortfolio([
        ...portfolio,
        {
          coin: newCoin,
          quantity: parseFloat(newQuantity),
        },
      ]);
    }

    setNewQuantity('');
  };

  const handleRemoveCoin = (coin: string) => {
    const updatedPortfolio = [...portfolio];
    const index = updatedPortfolio.findIndex(item => item.coin === coin);
    if (index >= 0) {
      updatedPortfolio[index] = { ...updatedPortfolio[index], quantity: 0 };
      setPortfolio(updatedPortfolio);
    }
  };

  const calculatePortfolioSentiment = (): number | null => {
    const activeItems = portfolio.filter(item => item.quantity > 0);
    if (activeItems.length === 0 || activeItems.some(item => item.sentimentScore === undefined)) {
      return null;
    }

    const totalQuantity = activeItems.reduce((sum, item) => sum + item.quantity, 0);
    const weightedScore = activeItems.reduce((sum, item) => {
      return sum + (item.quantity / totalQuantity) * (item.sentimentScore || 0);
    }, 0);

    return weightedScore;
  };

  const portfolioSentiment = calculatePortfolioSentiment();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-2 border-indigo-200">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Portfolio Tracker</h2>

      {showConsentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Collection Consent</h3>
            <p className="text-gray-700 mb-4">
              We collect anonymized data to improve our service and create AI datasets.
              Your portfolio data will never be shared with identifiable information.
            </p>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={dataConsent}
                onChange={(e) => setDataConsent(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="consent-checkbox" className="ml-2 block text-sm text-gray-700">
                I agree to share anonymized data for AI research purposes (opt-in)
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConsentPopup(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleAddCoin} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="coin" className="block text-sm font-medium text-gray-700 mb-1">
              Coin
            </label>
            <select
              id="coin"
              value={newCoin}
              onChange={(e) => setNewCoin(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {DEFAULT_COINS.map(coin => (
                <option key={coin} value={coin}>
                  {coin}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              min="0"
              step="any"
              placeholder="0.00"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add to Portfolio
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center">
          <input
            type="checkbox"
            id="data-consent"
            checked={dataConsent}
            onChange={(e) => setDataConsent(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="data-consent" className="ml-2 block text-sm text-gray-700">
            I agree to share anonymized data for AI research purposes (opt-in)
          </label>
        </div>
      </form>

      {loading && <p className="text-gray-500">Updating sentiment scores...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {portfolio.every(item => item.quantity === 0) ? (
        <p className="text-gray-500">Your portfolio is empty. Add coins to track their sentiment.</p>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Portfolio Sentiment</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Overall Sentiment Score:</span>
                {portfolioSentiment !== null ? (
                  <span className="text-lg font-semibold text-indigo-600">
                    {portfolioSentiment.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-gray-500">Calculating...</span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coin
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sentiment Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Events
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolio.map(item => (
                  <tr key={item.coin}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.coin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity > 0 && item.sentimentScore !== undefined ? (
                        <span className="font-medium text-indigo-600">
                          {item.sentimentScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">{item.quantity > 0 ? 'Loading...' : '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity > 0 && <EventAlerts coin={item.coin} />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleRemoveCoin(item.coin)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioTracker;
