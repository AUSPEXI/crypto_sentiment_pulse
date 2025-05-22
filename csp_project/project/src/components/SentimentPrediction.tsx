// src/components/SentimentPrediction.tsx
import React, { useState, useEffect } from 'react';
import { getSupportedCoins } from '../utils/api';

interface Prediction {
  userId: string; // Placeholder: use wallet address in production
  coin: string;
  prediction: 'positive' | 'negative' | 'neutral';
  timestamp: string;
  points?: number;
}

// In-memory store for predictions (replace with a database in production)
const userPredictions: Prediction[] = [];

const SentimentPrediction: React.FC = () => {
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [prediction, setPrediction] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [points, setPoints] = useState<number>(0);
  const [userPredictionsState, setUserPredictionsState] = useState<Prediction[]>(userPredictions);
  const coins = getSupportedCoins();

  // Load user points from localStorage
  useEffect(() => {
    const savedPoints = localStorage.getItem('userPoints');
    if (savedPoints) {
      setPoints(parseInt(savedPoints));
    }
  }, []);

  // Save points to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userPoints', points.toString());
  }, [points]);

  const handleSubmit = () => {
    if (!selectedCoin) return;

    const userId = 'user1'; // Placeholder: use wallet address or auth in production
    const newPrediction: Prediction = {
      userId,
      coin: selectedCoin,
      prediction,
      timestamp: new Date().toISOString(),
    };

    userPredictions.push(newPrediction);
    setUserPredictionsState([...userPredictions]);

    // Simplified scoring: award 10 points immediately (in production, validate after 24h)
    setPoints(points + 10);

    // Reset form
    setSelectedCoin('');
    setPrediction('neutral');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Predict Sentiment & Earn Points</h2>
      <p className="text-gray-700 mb-3">Your Points: <span className="font-medium text-blue-600">{points}</span></p>
      <div className="space-y-3">
        <div>
          <label htmlFor="predict-coin" className="block text-sm font-medium text-gray-700 mb-1">
            Select Coin
          </label>
          <select
            id="predict-coin"
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a Coin</option>
            {coins.map((coin) => (
              <option key={coin} value={coin}>
                {coin}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prediction" className="block text-sm font-medium text-gray-700 mb-1">
            Sentiment Prediction
          </label>
          <select
            id="prediction"
            value={prediction}
            onChange={(e) => setPrediction(e.target.value as 'positive' | 'negative' | 'neutral')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!selectedCoin}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Submit Prediction
        </button>
      </div>
      {userPredictionsState.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-700 mb-2">Your Predictions</h3>
          <ul className="space-y-2">
            {userPredictionsState.map((pred, index) => (
              <li key={index} className="text-sm text-gray-700">
                {pred.coin}: {pred.prediction.charAt(0).toUpperCase() + pred.prediction.slice(1)} (Submitted: {new Date(pred.timestamp).toLocaleString()})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SentimentPrediction;
