import React, { useState, useEffect } from 'react';
import { fetchSentimentData, STATIC_PRICE_CHANGES } from '../utils/api';
import { SentimentData } from '../types';
import SentimentSpeedometer from './SentimentSpeedometer';

interface SentimentSnapshotProps {
  selectedCoins: string[];
}

const SentimentSnapshot: React.FC<SentimentSnapshotProps> = ({ selectedCoins }) => {
  const [sentimentData, setSentimentData] = useState<Record<string, SentimentData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const defaultCoins = ['BTC', 'ETH', 'BNB', 'SOL', 'USDC', 'DOGE', 'ADA', 'TRX', 'AVAX'];
  const coinsToFetch = selectedCoins.length > 0 ? selectedCoins : defaultCoins;

  // Timeout wrapper for promises
  const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    });
    return Promise.race([promise, timeout]) as Promise<T>;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const newData: Record<string, SentimentData> = {};
        for (const coin of coinsToFetch) {
          const data = await withTimeout(fetchSentimentData(coin), 15000); // 15s timeout per coin
          if (data && data.score !== undefined) newData[coin] = data;
          else console.warn(`Incomplete sentiment data for ${coin}, skipping`);
        }
        setSentimentData(newData);
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        setError('Failed to fetch sentiment data. Using fallback data.');
        const fallbackData: Record<string, SentimentData> = {};
        coinsToFetch.forEach(coin => {
          fallbackData[coin] = { coin, score: STATIC_PRICE_CHANGES[coin] || 0, socialScore: 0, timestamp: new Date().toISOString() };
        });
        setSentimentData(fallbackData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 6 * 60 * 60 * 1000); // 6-hour refresh
    return () => clearInterval(intervalId);
  }, [coinsToFetch]);

  const rows = Math.ceil(coinsToFetch.length / 3);
  const containerHeight = rows * 280;

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
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
      {!loading && !error && Object.keys(sentimentData).length === 0 && (
        <p className="text-gray-500">No sentiment data available for the selected coins.</p>
      )}
      {!loading && !error && Object.keys(sentimentData).length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ minHeight: `${containerHeight}px` }}
        >
          {coinsToFetch.map(coin => {
            const data = sentimentData[coin];
            if (!data || data.score === undefined) {
              return (
                <div key={coin} className="bg-gray-50 p-3 rounded-md h-64 flex items-center justify-center">
                  <p className="text-sm text-gray-600">Data unavailable</p>
                </div>
              );
            }
            const speedometerValue = ((data.score + 10) / 20) * 100;
            const positive = speedometerValue > 50 ? (speedometerValue - 50) * 2 : 0;
            const negative = speedometerValue < 50 ? (50 - speedometerValue) * 2 : 0;
            const neutral = Math.abs(50 - speedometerValue) === 50 ? 100 : 100 - positive - negative;

            return (
              <div key={coin} className="bg-gray-50 p-3 rounded-md flex flex-col items-center justify-center h-64">
                <h3 className="font-medium text-gray-800 mb-2 text-center">{coin}</h3>
                <SentimentSpeedometer value={speedometerValue} size={180} />
                <div className="mt-2 text-sm text-gray-600 text-center">
                  <div className="flex justify-between">
                    <span>Positive:</span>
                    <span className="text-green-600">{positive.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Negative:</span>
                    <span className="text-red-600">{negative.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Neutral:</span>
                    <span>{neutral.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last updated:</span>
                    <span>{new Date(data.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
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
