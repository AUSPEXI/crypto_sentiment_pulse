// src/components/OnChainInsights.tsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { fetchOnChainData } from '../utils/api';
import { OnChainData } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend as ChartJSLegend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartJSTooltip, ChartJSLegend);

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
    if (values.length === 0) return { min: -5, max: 5 };

    const maxAbsValue = Math.max(...values.map(Math.abs));
    const range = Math.max(5, maxAbsValue);
    const padding = range * 0.1;
    return { min: -range - padding, max: range + padding };
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

  // Prepare data for Chart.js Active Wallet Growth chart
  const growthLabels = activeWalletsData.map(item => item.coin);
  const growthValues = activeWalletsData.map(item => item.growth);

  const growthChartData = {
    labels: growthLabels,
    datasets: [
      {
        label: 'Growth (%)',
        data: growthValues.map(value => ({
          x: [0, value], // Start at 0, end at the value
          y: growthLabels[growthValues.indexOf(value)],
        })),
        backgroundColor: growthValues.map(value => (value >= 0 ? '#22c55e' : '#ef4444')),
        borderWidth: 1,
        barThickness: 20,
      },
    ],
  };

  const growthChartOptions = {
    indexAxis: 'y' as const, // Horizontal bar chart
    scales: {
      x: {
        min: growthRange.min,
        max: growthRange.max,
        ticks: {
          callback: (value: number) => `${value}%`,
        },
        grid: {
          display: true,
          drawBorder: true,
          drawOnChartArea: true,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw.x[1];
            return `Growth: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  // Prepare data for Chart.js Large Transactions chart
  const transactionLabels = largeTransactionsData.map(item => item.coin);
  const transactionValues = largeTransactionsData.map(item => item.transactions);

  const transactionsChartData = {
    labels: transactionLabels,
    datasets: [
      {
        label: 'Transactions',
        data: transactionValues.map(value => ({
          x: [0, value], // Start at 0, end at the transaction value
          y: transactionLabels[transactionValues.indexOf(value)],
        })),
        backgroundColor: '#3b82f6', // Blue color as per screenshot
        borderWidth: 1,
        barThickness: 20,
      },
    ],
  };

  const transactionsChartOptions = {
    indexAxis: 'y' as const, // Horizontal bar chart
    scales: {
      x: {
        min: 0,
        max: transactionsRange[1],
        ticks: {
          callback: (value: number) => formatNumber(value),
        },
        grid: {
          display: true,
          drawBorder: true,
          drawOnChartArea: true,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: true, // Show legend to match screenshot
        labels: {
          generateLabels: (chart) => {
            return [{
              text: 'Transactions',
              fillStyle: '#3b82f6',
              strokeStyle: '#3b82f6',
              lineWidth: 1,
              hidden: false,
              datasetIndex: 0,
            }];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw.x[1];
            return `Transactions: ${formatNumber(value)}`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

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
              <Bar data={growthChartData} options={growthChartOptions} />
            </div>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Large Transactions</h3>
            <div style={{ height: `${chartHeight}px` }}>
              <Bar data={transactionsChartData} options={transactionsChartOptions} />
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
