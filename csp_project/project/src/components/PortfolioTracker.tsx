import React, { useState, useEffect } from 'react';
import { fetchSentimentData } from '../utils/api';
import { PortfolioItem } from '../types';
import { Trash2 } from 'lucide-react';

const DEFAULT_COINS = [
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'DOGE', 'ADA', 'TRX', 'AVAX',
  'XRP', 'LTC', 'BCH', 'DOT', 'LINK', 'MATIC', 'XLM', 'ATOM', 'CRO', 'ALGO'
];

const PortfolioTracker: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [newCoin, setNewCoin] = useState<string>(DEFAULT_COINS[0]);
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [dataConsent, setDataConsent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentPopup, setShowConsentPopup] = useState<boolean>(false);

  // Load portfolio from localStorage on initial render
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('portfolio');
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio));
    }
    
    const savedConsent = localStorage.getItem('dataConsent');
    if (savedConsent) {
      setDataConsent(JSON.parse(savedConsent));
    } else {
      // Show consent popup on first visit
      setShowConsentPopup(true);
    }
  }, []);

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Save data consent to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dataConsent', JSON.stringify(dataConsent));
  }, [dataConsent]);

  // Update sentiment scores for portfolio items
  useEffect(() => {
    const updateSentimentScores = async () => {
      if (portfolio.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const updatedPortfolio = [...portfolio];
        
        for (let i = 0; i < updatedPortfolio.length; i++) {
          const item = updatedPortfolio[i];
          const sentimentData = await fetchSentimentData(item.coin);
          updatedPortfolio[i] = {
            ...item,
            sentimentScore: sentimentData.score
          };
        }
        
        setPortfolio(updatedPortfolio);
      } catch (err) {
        setError('Failed to update sentiment scores. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    updateSentimentScores();
    
    // Set up interval to refresh data every hour
    const intervalId = setInterval(updateSentimentScores, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [portfolio.length]);

  const handleAddCoin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCoin || !newQuantity || isNaN(parseFloat(newQuantity)) || parseFloat(newQuantity) <= 0) {
      return;
    }
    
    // Check if coin already exists in portfolio
    const existingIndex = portfolio.findIndex(item => item.coin === newCoin);
    
    if (existingIndex >= 0) {
      // Update existing coin
      const updatedPortfolio = [...portfolio];
      updatedPortfolio[existingIndex] = {
        ...updatedPortfolio[existingIndex],
        quantity: updatedPortfolio[existingIndex].quantity + parseFloat(newQuantity)
      };
      setPortfolio(updatedPortfolio);
    } else {
      // Add new coin
      setPortfolio([
        ...portfolio,
        {
          coin: newCoin,
          quantity: parseFloat(newQuantity)
        }
      ]);
    }
    
    // Reset form
    setNewQuantity('');
  };

  const handleRemoveCoin = (coin: string) => {
    setPortfolio(portfolio.filter(item => item.coin !== coin));
  };

  // Calculate weighted sentiment score for the entire portfolio
  const calculatePortfolioSentiment = (): number | null => {
    if (portfolio.length === 0 || portfolio.some(item => item.sentimentScore === undefined)) {
      return null;
    }
    
    const totalQuantity = portfolio.reduce((sum, item) => sum + item.quantity, 0);
    const weightedScore = portfolio.reduce((sum, item) => {
      return sum + (item.quantity / totalQuantity) * (item.sentimentScore || 0);
    }, 0);
    
    return weightedScore;
  };

  const portfolioSentiment = calculatePortfolioSentiment();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Portfolio Tracker</h2>
      
      {/* Consent Popup */}
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="consent-checkbox" className="ml-2 block text-sm text-gray-700">
                I agree to share anonymized data for AI research purposes (opt-in)
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConsentPopup(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
      
      {portfolio.length === 0 ? (
        <p className="text-gray-500">Your portfolio is empty. Add coins to track their sentiment.</p>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Portfolio Sentiment</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Overall Sentiment Score:</span>
                {portfolioSentiment !== null ? (
                  <span className="text-lg font-semibold text-blue-600">
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
                      {item.sentimentScore !== undefined ? (
                        <span className="font-medium text-blue-600">
                          {item.sentimentScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Loading...</span>
                      )}
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
