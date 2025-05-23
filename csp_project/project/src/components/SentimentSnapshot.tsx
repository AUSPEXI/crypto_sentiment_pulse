// src/components/SentimentSnapshot.tsx
import React, { useState, useEffect } from 'react';
import { fetchSentimentData } from '../utils/api';
import { SentimentData } from '../types';

interface SentimentSnapshotProps {
  selectedCoins: string[];
}

const SentimentSnapshot: React.FC<SentimentSnapshotProps> = ({ selectedCoins }) => {
  const [sentimentData, setSentimentData] = useState<Record<string, SentimentData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching sentiment data for coins:', selectedCoins);
      setLoading(true);
      setError(null);

      try {
        const newData: Record<string, SentimentData> = {};
        for (const coin of selectedCoins) {
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

    if (selectedCoins.length > 0) {
      fetchData();
      const intervalId = setInterval(fetchData, 60 * 60 * 1000); // Update hourly
      return () => clearInterval(intervalId);
    } else {
      console.log('No coins selected, skipping sentiment fetch');
      setLoading(false);
    }
  }, [selectedCoins]);

  console.log('sentimentData:', sentimentData);

  if (!selectedCoins.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">Sentiment Snapshot</h2>
        <p className="text-gray-500">Please select at least one coin to view sentiment data.</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedCoins.map(coin => {
            const data = sentimentData[coin];
            if (!data || data.score === undefined) {
              return (
                <div key={coin} className="bg-gray-50 p-3 rounded-md">
                  <h3 className="font-medium text-gray-800">{coin} Sentiment</h3>
                  <p className="text-sm text-gray-600 mt-2">Data unavailable</p>
                </div>
              );
            }

            return (
              <div key={coin} className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-medium text-gray-800">{coin} Sentiment</h3>
                <div className="mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Score:</span>
                    <span className={`text-sm font-medium ${data.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.score.toFixed(1)}
                    </span>
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
