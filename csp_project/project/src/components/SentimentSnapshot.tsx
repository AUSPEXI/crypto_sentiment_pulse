// src/components/SentimentSnapshot.tsx
import React, { useState, useEffect } from 'react';
import { fetchSentimentData } from '../utils/api';
import { SentimentData } from '../types';
import SentimentSpeedometer from './SentimentSpeedometer';

interface SentimentSnapshotProps {
  selectedCoins: string[];
}

const SentimentSnapshot: React.FC<SentimentSnapshotProps> = ({ selectedCoins }) => {
  const [sentimentData, setSentimentData] = useState<Record<string, SentimentData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Default to 9 coins if none selected
  const coinsToFetch = selectedCoins.length > 0 ? selectedCoins : ['BTC', 'ETH', 'BNB', 'SOL', 'USDC', 'DOGE', 'ADA', 'TRX', 'AVAX'];

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching sentiment data for coins:', coinsToFetch);
      setLoading(true);
      setError(null);

      try {
        const newData: Record<string, SentimentData> = {};
        for (const coin of coinsToFetch) {
          const data = await fetchSentimentData(coin);
          console.log(`Sentiment data for ${coin}:`, data);
          if (data && data.score !== undefined) {
            newData[coin] = data;
          } else {
            console.warn(`Incomplete sentiment data for ${coin}, skipping`);
          }
        }
        setSentimentData(newData);
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        setError('Failed to fetch sentiment data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60 * 60 * 1000); // Update hourly
    return () => clearInterval(intervalId);
  }, [coinsToFetch]);

  if (selectedCoins.length === 0 && !loading && !error && Object.keys(sentimentData).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">Sentiment Snapshot</h2>
        <p className="text-gray-500">Loading default coin data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Sentiment Snapshot</h2>

      {loading && <p className="text-gray-500">Loading sentiment data...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {!loading && !error && Object.keys(sentimentData).length === 0 && (
        <p className="text-gray-500">No sentiment data available for the selected coins.</p>
      )}

      {!loading && !error && Object.keys(sentimentData).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ minHeight: '600px' }}> {/* Fixed height for alignment */}
          {coinsToFetch.map(coin => {
            const data = sentimentData[coin];
            if (!data || data.score === undefined) {
              return (
                <div key={coin} className="bg-gray-50 p-3 rounded-md">
                  <h3 className="font-medium text-gray-800">{coin}</h3>
                  <p className="text-sm text-gray-600 mt-2">Data unavailable</p>
                </div>
              );
            }

            const speedometerValue = ((data.score + 10) / 20) * 100;

            return (
              <div key={coin} className="bg-gray-50 p-3 rounded-md flex flex-col items-center">
                <h3 className="font-medium text-gray-800 mb-2">{coin}</h3>
                <SentimentSpeedometer
                  value={speedometerValue}
                  timestamp={data.timestamp}
                  size={150}
                />
                <div className="mt-2 text-sm text-gray-600 text-center">
                  <div className="flex justify-between">
                    <span>Positive:</span>
                    <span>{((speedometerValue > 50 ? (speedometerValue - 50) * 2 : 0).toFixed(2))}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Negative:</span>
                    <span>{(speedometerValue < 50 ? (50 - speedometerValue) * 2 : 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Neutral:</span>
                    <span>{(Math.abs(50 - speedometerValue) === 50 ? 100 : 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last updated:</span>
                    <span>{new Date(data.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SentimentSnapshot;
