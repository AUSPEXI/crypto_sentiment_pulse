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
      setLoading(true);
      setError(null);
      try {
        const newData: Record<string, OnChainData> = {};
        for (const coin of selectedCoins) {
          const data = await fetchOnChainData(coin);
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
            {isGrowth ? <>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</> : formatNumber(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const GrowthBar = (props: any) => {
    const { x, y, width, height, value, domainMin, domainMax } = props;
    const color = value >= 0 ? '#22c55e' : '#ef4444';

    // Calculate the domain range and the pixel position of 0%
    const domainRange = domainMax - domainMin;
    const centerX = x + (width * (0 - domainMin)) / domainRange; // Map 0% to the chart's X-axis
    const valuePosition = x + (width * (value - domainMin)) / domainRange; // Map the value to the chart's X-axis

    // Calculate bar width and position to start at 0% and extend to the value
    const barWidth = Math.abs(centerX - valuePosition);
    const xPos = value >= 0 ? centerX : centerX - barWidth; // Start at 0%, extend right for positive, left for negative

    return <rect x={xPos} y={y} width={barWidth} height={height} fill={color} />;
  };

  const activeWalletsData = Object.entries(onChainData).map(([coin, data]) => ({
    coin,
    growth: data?.activeWalletsGrowth || 0,
  }));

  const largeTransactionsData = Object.entries(onChainData).map(([coin, data]) => ({
    coin,
    transactions: data?.largeTransactions || 0,
  }));

  const getChartHeight = (numCoins: number): number => {
    const baseHeight = 250;
    const heightPerCoin = 40;
    return Math.max(baseHeight, numCoins * heightPerCoin);
  };

  const getGrowthAxisRange = (data: typeof activeWalletsData) => {
    const values = data.map(item => item.growth).filter(v => v !== 0);
    if (values.length === 0) return { min: -5, max: 5 }; // Default minimum range of ±5%

    // Find the maximum absolute value in the data
    const maxAbsValue = Math.max(...values.map(Math.abs));
    // Ensure a minimum range of ±5%, but expand if the data exceeds this
    const range = Math.max(5, maxAbsValue);
    // Add a small padding (10% of the range) for better visualization
    const padding = range * 0.1;
    return { min: -range - padding, max: range + padding }; // Symmetric domain around 0%
  };

  const getTransactionsAxisRange = (data: typeof largeTransactionsData) => {
    const values = data.map(item => item.transactions).filter(v => v !== 0);
    if (values.length === 0) return [0, 1000];
    const maxValue = Math.max(...values);
    const padding = maxValue * 0.2;
    return [0, maxValue + padding];
  };

  const chartHeight = getChartHeight(selectedCoins.length);
  const growthRange = getGrowthAxisRange(activeWalletsData);
  const transactionsRange = getTransactionsAxisRange(largeTransactionsData);

  // Calculate ticks for the X-axis to ensure 0% is included and centered
  const tickInterval = (growthRange.max - growthRange.min) / 4; // Divide the range into 4 intervals
  const ticks = [
    growthRange.min,
    growthRange.min + tickInterval,
    0, // Explicitly include 0% as the center marker
    growthRange.min + 3 * tickInterval,
    growthRange.max,
  ];

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
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
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
                  margin={{ top: 10, right: 10, left: 60, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[growthRange.min, growthRange.max]}
                    ticks={ticks} // Use calculated ticks to ensure 0% is the center marker
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    dataKey="coin"
                    type="category"
                    width={50}
                    tickMargin={10}
                    tick={{ dy: 8 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" />
                  <Bar
                    dataKey="growth"
                    name="Growth (%)"
                    shape={(props) => <GrowthBar {...props} domainMin={growthRange.min} domainMax={growthRange.max} />}
                    barSize={40}
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
                  margin={{ top: 10, right: 10, left: 60, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={transactionsRange}
                    tickFormatter={formatNumber}
                  />
                  <YAxis
                    dataKey="coin"
                    type="category"
                    width={50}
                    tickMargin={10}
                    tick={{ dy: 8 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="transactions"
                    name="Transactions"
                    fill="#3b82f6"
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <span className="text-sm font-medium text-blue-600">{formatNumber(data.activeWallets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Growth:</span>
                      <span className={`text-sm font-medium ${data.activeWalletsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.activeWalletsGrowth >= 0 ? '+' : ''}{data.activeWalletsGrowth.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Large Transactions:</span>
                      <span className="text-sm font-medium text-purple-600">{formatNumber(data.largeTransactions)}</span>
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
