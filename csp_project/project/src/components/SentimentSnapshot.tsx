src/components/SentimentSnapshot.tsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
      setLoading(true);
      setError(null);

      try {
        const dataPromises = selectedCoins.map(async (coin) => {
          try {
            const data = await fetchSentimentData(coin);
            return { coin, data };
          } catch (err) {
            console.warn(`[SentimentSnapshot] Failed to fetch sentiment for ${coin}:`, err);
            return { coin, data: { coin, positive: 33.33, negative: 33.33, neutral: 33.33, score: 50, timestamp: new Date().toISOString() } };
          }
        });

        const results = await Promise.all(dataPromises);
        const newData: Record<string, SentimentData> = {};
        results.forEach(({ coin, data }) => {
          newData[coin] = data;
        });

        console.log('[SentimentSnapshot] Fetched sentimentData:', newData);
        setSentimentData(newData);
      } catch (err) {
        setError('Failed to fetch sentiment data for all coins.');
        console.error('[SentimentSnapshot] General error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [selectedCoins]);

  const COLORS = ['#22c55e', '#ef4444', '#6b7280'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Sentiment Snapshot</h2>
      
      {loading && <p className="text-gray-500">Loading sentiment data...</p>}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedCoins.map(coin => {
            const data = sentimentData[coin];
            if (!data) return null;

            const chartData = [
              { name: 'Positive', value: data.positive },
              { name: 'Negative', value: data.negative },
              { name: 'Neutral', value: data.neutral }
            ];

            return (
              <div key={coin} className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-medium text-gray-800">{coin} Sentiment</h3>
                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Sentiment Score: <span className="font-medium">{data.score.toFixed(1)}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SentimentSnapshot;
