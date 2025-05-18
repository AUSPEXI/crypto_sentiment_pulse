import React, { useState, useEffect } from 'react';
import { fetchSentimentData } from '../utils/api';
import { SentimentData } from '../types';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import SentimentSpeedometer from './SentimentSpeedometer';

interface SentimentSnapshotProps {
  selectedCoins: string[];
}

const SentimentSnapshot: React.FC<SentimentSnapshotProps> = ({ selectedCoins }) => {
  const [sentimentData, setSentimentData] = useState<Record<string, SentimentData[]>>({});
  const [errors, setErrors] = useState<Record<string, { message: string; details?: string }>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const newErrors: Record<string, { message: string; details?: string }> = {};

      const newData: Record<string, SentimentData[]> = {};
      for (const coin of selectedCoins) {
        const cached = localStorage.getItem(`sentiment_${coin}`);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) { // 24-hour cache
            newData[coin] = [data];
            continue;
          }
        }

        try {
          const latestData = await fetchSentimentData(coin);
          newData[coin] = [latestData];
          localStorage.setItem(`sentiment_${coin}`, JSON.stringify({ data: latestData, timestamp: Date.now() }));
        } catch (err: any) {
          newErrors[coin] = {
            message: err.message,
            details: JSON.stringify({
              status: err.response?.status,
              data: err.response?.data?.substring(0, 100)
            })
          };
          console.error(`Error fetching data for ${coin}:`, err);
        }
      }

      setSentimentData(newData);
      setErrors(newErrors);
      setLoading(false);
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [selectedCoins]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Sentiment Snapshot</h2>

      {loading && !Object.keys(sentimentData).length && (
        <p className="text-gray-500">Loading sentiment data...</p>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {Object.entries(errors).map(([coin, error]) => (
            <div key={coin} className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>
                {coin}: {error.message}
                {error.details && <span className="block text-xs">Details: {error.details}</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedCoins.map(coin => {
            const latestData = sentimentData[coin]?.[0];
            if (!latestData) return null;

            return (
              <div key={coin} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-medium text-gray-800 mb-4 text-center">{coin}</h3>
                <SentimentSpeedometer value={latestData.score} />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Positive:</span>
                    <span className="font-medium text-green-600">{latestData.positive}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Negative:</span>
                    <span className="font-medium text-red-600">{latestData.negative}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Neutral:</span>
                    <span className="font-medium text-gray-600">{latestData.neutral}%</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Last updated: {format(new Date(latestData.timestamp), 'MMM dd, HH:mm')}
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