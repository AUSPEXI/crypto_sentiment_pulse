// src/components/OnChainInsights.tsx
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
      console.log('Fetching on-chain data for coins:', selectedCoins);
      setLoading(true);
      setError(null);

      try {
        const newData: Record<string, OnChainData> = {};
        for (const coin of selectedCoins) {
          const data = await fetchOnChainData(coin);
          console.log(`Data for ${coin}:`, data);
          if (data && data.activeWallets !== undefined && data.activeWalletsGrowth !== undefined && data.largeTransactions !== undefined) {
            newData[coin] = data;
          } else {
            console.warn(`Incomplete data for ${coin}, skipping`);
          }
        }
        setOnChainData(newData);
      } catch (err) {
        console.error('Error fetching on-chain data:', err);
        setError('Failed to fetch on-chain data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (selectedCoins.length > 0) {
      fetchData();
      const intervalId = setInterval(fetchData, 5 * 60 * 1000);
      return () => clearInterval(intervalId);
    } else {
      console.log('No coins selected, skipping fetch');
      setLoading(false);
    }
  }, [selectedCoins]);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

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

  const GrowthBar = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    const color = value >= 0 ? '#22c55e' : '#ef4444';
    const barHeight = Math.abs(height);
    const yPos = value >= 0 ? y - barHeight : y;
    const coin = payload?.coin || '';

    return (
      <g>
        <rect x={x} y={yPos} width={width} height={barHeight} fill={color} />
        <text
          x={x + width / 2}
          y={yPos + (value >= 0 ? -5 : barHeight + 15)}
          textAnchor="middle"
          fill="#333"
          fontSize={12}
          fontWeight="bold"
        >
          {coin}
        </text>
      </g>
    );
  };

  const activeWalletsData = Object.entries(onChainData).map(([coin, data]) => ({
    coin,
    growth: data?.activeWalletsGrowth || 0
  }));

  const largeTransactionsData = Object.entries(onChainData).map(([coin, data]) => ({
    coin,
    transactions: data?.largeTransactions || 0
  }));

  const getChartHeight = (numCoins: number): number => {
    const baseHeight = 250;
    const heightPerCoin = 60;
    return Math.max(baseHeight, numCoins * heightPerCoin);
  };

  const getGrowthAxisRange = (data: typeof activeWalletsData) => {
    const maxAbsGrowth = Math.max(...data.map(item => Math.abs(item.growth)), 5);
    return { min: -maxAbsGrowth, max: maxAbsGrowth };
  };

  console.log('onChainData:', onChainData);
  console.log('activeWalletsData:', activeWalletsData);
  console.log('largeTransactionsData:', largeTransactionsData);

  const chartHeight = getChartHeight(selectedCoins.length);
  const growthRange = getGrowthAxisRange(activeWalletsData);

  if (!selectedCoins.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">On-Chain Insights</h2>
        <p className="text-gray-500">Please select at least one coin to view on-chain insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">On-Chain Insights</h2>

      {loading && <p className="text-gray-500">Loading on-chain data...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {!loading && !error && Object.keys(onChainData).length === 0 && (
        <p className="text-gray-500">No on-chain data available for the selected coins.</p>
      )}

      {!loading && !error && Object.keys(onChainData).length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Active Wallet Growth</h3>
            <div style={{ height: `${chartHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeWalletsData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[-growthRange.max, growthRange.max]}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <YAxis
                    dataKey="coin"
                    type="category"
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine x={0} stroke="#666" />
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
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="coin"
                    type="category"
                    width={80}
                  />
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
              if (
                !data ||
                data.activeWallets === undefined ||
                data.activeWalletsGrowth === undefined ||
                data.largeTransactions === undefined
              ) {
                return (
                  <div key={coin} className="bg-gray-50 p-3 rounded-md">
                    <h3 className="font-medium text-gray-800">{coin} On-Chain Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Data unavailable</p>
                  </div>
                );
              }

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
