import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fetchOnChainData } from '../utils/api';
import { OnChainData } from '../types';

interface OnChainInsightsProps {
  selectedCoins: string[];
}

const OnChainInsights: React.FC<OnChainInsightsProps> = ({ selectedCoins }) => {
  const [onChainData, setOnChainData] = useState<Record<string, OnChainData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch data for all coins in parallel
        const fetchPromises = selectedCoins.map(async (coin) => {
          try {
            const data = await fetchOnChainData(coin);
            return { coin, data };
          } catch (err) {
            console.warn(`Failed to fetch on-chain data for ${coin}:`, err);
            // Fallback data for unsupported coins
            return {
              coin,
              data: {
                coin,
                activeWallets: 0,
                activeWalletsGrowth: 0,
                largeTransactions: 0,
                timestamp: new Date().toISOString()
              }
            };
          }
        });

        const results = await Promise.all(fetchPromises);
        const newData: Record<string, OnChainData> = {};
        results.forEach(({ coin, data }) => {
          newData[coin] = data;
        });

        setOnChainData(newData);
      } catch (err) {
        setError('Failed to fetch on-chain data. Please try again later.');
        console.error('Overall fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [selectedCoins]);

  // Format large numbers with K/M/B suffix
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const isGrowth = payload[0].dataKey === 'growth';

      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          <p className={`text-sm ${isGrowth ? (value >= 0 ? 'text-green-600' : 'text-red-600') : 'text-blue-600'}`}>
            {isGrowth ? (
              <>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</>
            ) : (
              formatNumber(value)
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom bar component for growth chart
  const GrowthBar = (props: any) => {
    const { fill, x, y, width, height, value } = props;
    const color = value >= 0 ? '#22c55e' : '#ef4444';
    const barHeight = Math.abs(height);
    const yPos = value >= 0 ? y : y + height;

    return <rect x={x} y={yPos} width={width} height={barHeight} fill={color} />;
  };

  // Prepare data for the charts
  const activeWalletsData = Object.entries(onChainData).map(([coin, data]) => ({
    coin,
    activeWallets: data.activeWallets,
    growth: data.activeWalletsGrowth
  }));

  const largeTransactionsData = Object.entries(onChainData).map(([coin, data]) => ({
    coin,
    transactions: data.largeTransactions
  }));

  // Calculate chart dimensions based on number of coins
  const getChartHeight = (numCoins: number): number => {
    const baseHeight = 250;
    const heightPerCoin = 30;
    return Math.max(baseHeight, baseHeight + (numCoins - 5) * heightPerCoin);
  };

  const chartHeight = getChartHeight(selectedCoins.length);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">On-Chain Insights</h2>

      {loading && <p className="text-gray-500">Loading on-chain data...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Active Wallet Growth</h3>
            <div style={{ height: `${chartHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeWalletsData}
                  layout={selectedCoins.length > 5 ? 'vertical' : 'horizontal'}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  {selectedCoins.length > 5 ? (
                    <>
                      <XAxis type="number" />
                      <YAxis dataKey="coin" type="category" width={60} />
                    </>
                  ) : (
                    <>
                      <XAxis dataKey="coin" />
                      <YAxis />
                    </>
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" />
                  <Bar
                    dataKey="growth"
                    name="Growth (%)"
                    shape={<GrowthBar />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Large Transactions</h3>
            <div style={{ height: `${chartHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={largeTransactionsData}
                  layout={selectedCoins.length > 5 ? 'vertical' : 'horizontal'}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  {selectedCoins.length > 5 ? (
                    <>
                      <XAxis type="number" />
                      <YAxis dataKey="coin" type="category" width={60} />
                    </>
                  ) : (
                    <>
                      <XAxis dataKey="coin" />
                      <YAxis />
                    </>
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="transactions"
                    name="Transactions"
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCoins.map(coin => {
              const data = onChainData[coin];
              if (!data) return null;

              return (
                <div key={coin} className="bg-gray-50 p-3 rounded-md">
                  <h3 className="font-medium text-gray-800">{coin} On-Chain Data</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Wallets:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {formatNumber(data.activeWallets)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Growth:</span>
                      <span className={`text-sm font-medium ${data.activeWalletsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.activeWalletsGrowth >= 0 ? '+' : ''}{data.activeWalletsGrowth.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Large Transactions:</span>
                      <span className="text-sm font-medium text-purple-600">
                        {formatNumber(data.largeTransactions)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnChainInsights;
