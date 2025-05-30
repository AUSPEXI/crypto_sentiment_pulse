import React, { useState, useEffect } from 'react';
import { fetchOnChainData } from '../utils/api';
import { OnChainData } from '../types';

interface OnChainInsightsProps {
  selectedCoins: string[];
}

const OnChainInsights: React.FC<OnChainInsightsProps> = ({ selectedCoins }) => {
  const [onChainDataList, setOnChainDataList] = useState<OnChainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dataPromises = selectedCoins.map(coin => fetchOnChainData(coin));
        const data = await Promise.all(dataPromises);
        setOnChainDataList(data);
      } catch (err) {
        setError('Failed to load on-chain data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedCoins]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!onChainDataList.length) return <div>No data available</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">On-Chain Insights</h2>
      {onChainDataList.map(data => (
        <div key={data.coin} className="mb-4">
          <h3 className="text-lg font-semibold">{data.coin}</h3>
          <p>Active Wallets: {data.activeWallets}</p>
          <p>Wallet Growth: {data.activeWalletsGrowth}%</p>
          <p>Large Transactions: {data.largeTransactions}</p>
          <p>Last Updated: {new Date(data.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default OnChainInsights;
