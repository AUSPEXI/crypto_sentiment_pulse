import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { fetchOnChainData } from '../utils/api';
import { OnChainData } from '../types';

interface OnChainInsightsProps {
  selectedCoins: string[];
}

const OnChainInsights: React.FC<OnChainInsightsProps> = ({ selectedCoins }) => {
  const [onChainData, setOnChainData] = useState<Record<string, OnChainData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const defaultCoins = ['BTC', 'ETH', 'BNB', 'SOL', 'USDC', 'DOGE', 'ADA', 'TRX', 'AVAX'];
  const coinsToFetch = selectedCoins.length > 0 ? selectedCoins : defaultCoins;

  useEffect(() => {
    let abortController = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const newData: Record<string, OnChainData> = {};
        for (const coin of coinsToFetch) {
          const data = await fetchOnChainData(coin, { signal: abortController.signal });
          if (data) newData[coin] = data;
        }
        setOnChainData(newData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching on-chain data:', err);
          setError('Failed to fetch on-chain data. Using fallback data.');
          const fallbackData: Record<string, OnChainData> = {};
          coinsToFetch.forEach(coin => {
            fallbackData[coin] = { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
          });
          setOnChainData(fallbackData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => abortController.abort();
  }, [coinsToFetch]);

  const chartData = {
    labels: coinsToFetch,
    datasets: [
      {
        label: 'Active Wallets',
        data: coinsToFetch.map(coin => onChainData[coin]?.activeWallets || 0),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable animation to avoid potential eval usage
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  if (loading) return <div className="bg-white rounded-lg shadow-md p-4">Loading on-chain data...</div>;
  if (error) return <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>;
  if (Object.keys(onChainData).length === 0) return <div className="bg-white rounded-lg shadow-md p-4">No data available.</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">On-Chain Insights</h2>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default OnChainInsights;
