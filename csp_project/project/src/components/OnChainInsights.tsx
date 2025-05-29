import React, { useState, useEffect } from 'react';
import { fetchOnChainData } from '../utils/api';
import { OnChainData } from '../types';

const OnChainInsights: React.FC<{ coin: string }> = ({ coin }) => {
  const [onChainData, setOnChainData] = useState<OnChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchOnChainData(coin);
        setOnChainData(data);
      } catch (err) {
        setError('Failed to load on-chain data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [coin]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!onChainData) return <div>No data available</div>;

  return (
    <div>
      <h2>On-Chain Insights for {coin}</h2>
      <p>Active Wallets: {onChainData.activeWallets}</p>
      <p>Wallet Growth: {onChainData.activeWalletsGrowth}%</p>
      <p>Large Transactions: {onChainData.largeTransactions}</p>
      <p>Last Updated: {new Date(onChainData.timestamp).toLocaleString()}</p>
    </div>
  );
};

export default OnChainInsights;
