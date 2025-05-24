// src/utils/api.ts
import axios from 'axios';
import { SentimentData, OnChainData, Event } from '../types';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 60000; // 1 minute
const MAX_RETRY_DELAY = 300000; // 5 minutes

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isNetworkError = (error: any): boolean => {
  return !error.response || 
    error.code === 'ECONNABORTED' || 
    error.message.includes('Network Error') ||
    (error.code && error.code.includes('ECONN'));
};

const getRetryDelay = (attempt: number): number => {
  return Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
};

// Static list of top 20 coins (May 2025, based on market cap trends)
export const STATIC_COINS = [
  { symbol: 'BTC', id: 'bitcoin', name: 'Bitcoin' },
  { symbol: 'ETH', id: 'ethereum', name: 'Ethereum' },
  { symbol: 'USDT', id: 'tether', name: 'Tether' },
  { symbol: 'BNB', id: 'binance-coin', name: 'BNB' },
  { symbol: 'SOL', id: 'solana', name: 'Solana' },
  { symbol: 'USDC', id: 'usd-coin', name: 'USDC' },
  { symbol: 'XRP', id: 'xrp', name: 'XRP' },
  { symbol: 'DOGE', id: 'dogecoin', name: 'Dogecoin' },
  { symbol: 'TON', id: 'toncoin', name: 'TON' },
  { symbol: 'ADA', id: 'cardano', name: 'Cardano' },
  { symbol: 'TRX', id: 'tron', name: 'TRON' },
  { symbol: 'AVAX', id: 'avalanche', name: 'Avalanche' },
  { symbol: 'SHIB', id: 'shiba-inu', name: 'Shiba Inu' },
  { symbol: 'LINK', id: 'chainlink', name: 'Chainlink' },
  { symbol: 'BCH', id: 'bitcoin-cash', name: 'Bitcoin Cash' },
  { symbol: 'DOT', id: 'polkadot', name: 'Polkadot' },
  { symbol: 'NEAR', id: 'near-protocol', name: 'NEAR Protocol' },
  { symbol: 'LTC', id: 'litecoin', name: 'Litecoin' },
  { symbol: 'MATIC', id: 'polygon', name: 'Polygon' },
  { symbol: 'PEPE', id: 'pepe', name: 'Pepe' }
];

// Static SUPPORTED_COINS based on STATIC_COINS
let SUPPORTED_COINS: { [key: string]: { coingecko: string, cryptoPanic: string, coinMetrics: string } } = {};
STATIC_COINS.forEach(coin => {
  SUPPORTED_COINS[coin.symbol] = {
    coingecko: coin.id,
    cryptoPanic: coin.symbol.toLowerCase(),
    coinMetrics: coin.symbol.toLowerCase()
  };
});

export const getSupportedCoins = () => Object.keys(SUPPORTED_COINS);

// Static price change data for sentiment
const STATIC_PRICE_CHANGES: { [key: string]: number } = {
  'BTC': 2.5, 'ETH': 1.8, 'USDT': 0.1, 'BNB': 3.2, 'SOL': -1.5,
  'USDC': 0.0, 'XRP': 4.0, 'DOGE': 5.2, 'TON': 2.1, 'ADA': -0.8,
  'TRX': 1.2, 'AVAX': 2.9, 'SHIB': 6.5, 'LINK': 3.5, 'BCH': 1.9,
  'DOT': -2.3, 'NEAR': 4.8, 'LTC': 0.5, 'MATIC': -1.0, 'PEPE': 7.0
};

// Static wallet data (expanded for all 20 coins)
const STATIC_WALLET_DATA: { [key: string]: OnChainData } = {
  'BTC': { coin: 'BTC', activeWallets: 900000, activeWalletsGrowth: 2.1, largeTransactions: 1500, timestamp: '2025-05-24T00:00:00Z' },
  'ETH': { coin: 'ETH', activeWallets: 600000, activeWalletsGrowth: 1.5, largeTransactions: 1200, timestamp: '2025-05-24T00:00:00Z' },
  'USDT': { coin: 'USDT', activeWallets: 500000, activeWalletsGrowth: 0.2, largeTransactions: 2000, timestamp: '2025-05-24T00:00:00Z' },
  'BNB': { coin: 'BNB', activeWallets: 300000, activeWalletsGrowth: 2.8, largeTransactions: 900, timestamp: '2025-05-24T00:00:00Z' },
  'SOL': { coin: 'SOL', activeWallets: 200000, activeWalletsGrowth: -0.5, largeTransactions: 800, timestamp: '2025-05-24T00:00:00Z' },
  'USDC': { coin: 'USDC', activeWallets: 450000, activeWalletsGrowth: 0.1, largeTransactions: 1800, timestamp: '2025-05-24T00:00:00Z' },
  'XRP': { coin: 'XRP', activeWallets: 250000, activeWalletsGrowth: 3.0, largeTransactions: 700, timestamp: '2025-05-24T00:00:00Z' },
  'DOGE': { coin: 'DOGE', activeWallets: 180000, activeWalletsGrowth: 4.5, largeTransactions: 600, timestamp: '2025-05-24T00:00:00Z' },
  'TON': { coin: 'TON', activeWallets: 150000, activeWalletsGrowth: 1.8, largeTransactions: 500, timestamp: '2025-05-24T00:00:00Z' },
  'ADA': { coin: 'ADA', activeWallets: 220000, activeWalletsGrowth: -0.3, largeTransactions: 650, timestamp: '2025-05-24T00:00:00Z' },
  'TRX': { coin: 'TRX', activeWallets: 200000, activeWalletsGrowth: 1.0, largeTransactions: 550, timestamp: '2025-05-24T00:00:00Z' },
  'AVAX': { coin: 'AVAX', activeWallets: 170000, activeWalletsGrowth: 2.5, largeTransactions: 400, timestamp: '2025-05-24T00:00:00Z' },
  'SHIB': { coin: 'SHIB', activeWallets: 140000, activeWalletsGrowth: 5.0, largeTransactions: 300, timestamp: '2025-05-24T00:00:00Z' },
  'LINK': { coin: 'LINK', activeWallets: 160000, activeWalletsGrowth: 2.0, largeTransactions: 450, timestamp: '2025-05-24T00:00:00Z' },
  'BCH': { coin: 'BCH', activeWallets: 130000, activeWalletsGrowth: 1.2, largeTransactions: 350, timestamp: '2025-05-24T00:00:00Z' },
  'DOT': { coin: 'DOT', activeWallets: 120000, activeWalletsGrowth: -1.0, largeTransactions: 300, timestamp: '2025-05-24T00:00:00Z' },
  'NEAR': { coin: 'NEAR', activeWallets: 110000, activeWalletsGrowth: 3.5, largeTransactions: 250, timestamp: '2025-05-24T00:00:00Z' },
  'LTC': { coin: 'LTC', activeWallets: 100000, activeWalletsGrowth: 0.8, largeTransactions: 200, timestamp: '2025-05-24T00:00:00Z' },
  'MATIC': { coin: 'MATIC', activeWallets: 90000, activeWalletsGrowth: -0.5, largeTransactions: 180, timestamp: '2025-05-24T00:00:00Z' },
  'PEPE': { coin: 'PEPE', activeWallets: 80000, activeWalletsGrowth: 6.0, largeTransactions: 150, timestamp: '2025-05-24T00:00:00Z' }
};

// Static news data (mocked for fallback)
const STATIC_NEWS: Event[] = [
  { id: '1', coin: 'BTC', date: '2025-05-24T10:00:00Z', title: 'Bitcoin Hits $70K', description: 'Bitcoin surges to a new high.', eventType: 'News' },
  { id: '2', coin: 'ETH', date: '2025-05-24T09:00:00Z', title: 'Ethereum Upgrade Delayed', description: 'Ethereum developers push back upgrade.', eventType: 'News' },
  { id: '3', coin: 'SOL', date: '2025-05-24T08:00:00Z', title: 'Solana Network Outage', description: 'Solana faces another downtime.', eventType: 'News' },
  { id: '4', coin: 'XRP', date: '2025-05-24T07:00:00Z', title: 'XRP Lawsuit Update', description: 'New developments in XRP case.', eventType: 'News' }
];

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) {
    throw new Error(`Unsupported coin: ${coin}`);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const priceResponse = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinInfo.coingecko}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days: '7',
            interval: 'daily'
          }
        }
      );

      const priceData = priceResponse.data.prices;
      const priceChange = ((priceData[priceData.length - 1][1] - priceData[0][1]) / priceData[0][1]) * 100;

      return {
        coin,
        score: priceChange,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (isNetworkError(error) && attempt < MAX_RETRIES) {
        const retryDelay = getRetryDelay(attempt);
        console.warn(`Network error fetching sentiment for ${coin}, retrying in ${retryDelay / 1000}s... (Attempt ${attempt}/${MAX_RETRIES})`);
        await delay(retryDelay);
        continue;
      }

      console.error(`Failed to fetch sentiment for ${coin} after ${MAX_RETRIES} attempts:`, error);
      break;
    }
  }

  // Fallback to static data if API fails
  console.log(`Falling back to static sentiment data for ${coin}`);
  const staticPriceChange = STATIC_PRICE_CHANGES[coin];
  if (staticPriceChange === undefined) {
    throw new Error(`No static sentiment data available for ${coin}`);
  }

  return {
    coin,
    score: staticPriceChange,
    timestamp: new Date().toISOString()
  };
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) {
    throw new Error(`Unsupported coin: ${coin}`);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(
        `https://api.coinmetrics.io/v4/timeseries/asset-metrics`,
        {
          params: {
            assets: coinInfo.coinMetrics,
            metrics: 'AdrActCnt,TxTfrValAdjUSD',
            frequency: '1d',
            api_key: process.env.REACT_APP_COINMETRICS_API_KEY
          }
        }
      );

      const data = response.data.data[0];
      const activeWallets = parseInt(data.AdrActCnt, 10);
      const previousWallets = parseInt(response.data.data[1]?.AdrActCnt || data.AdrActCnt, 10);
      const growth = ((activeWallets - previousWallets) / previousWallets) * 100;

      return {
        coin,
        activeWallets,
        activeWalletsGrowth: growth,
        largeTransactions: parseInt(data.TxTfrValAdjUSD, 10) / 1e6,
        timestamp: data.time
      };
    } catch (error) {
      if (isNetworkError(error) && attempt < MAX_RETRIES) {
        const retryDelay = getRetryDelay(attempt);
        console.warn(`Network error fetching on-chain data for ${coin}, retrying in ${retryDelay / 1000}s... (Attempt ${attempt}/${MAX_RETRIES})`);
        await delay(retryDelay);
        continue;
      }

      console.error(`Failed to fetch on-chain data for ${coin} after ${MAX_RETRIES} attempts:`, error);
      break;
    }
  }

  // Fallback to static data if API fails
  console.log(`Falling back to static on-chain data for ${coin}`);
  const staticData = STATIC_WALLET_DATA[coin];
  if (!staticData) {
    throw new Error(`No static on-chain data available for ${coin}`);
  }

  return staticData;
};

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: {
        auth_token: process.env.REACT_APP_CRYPTOPANIC_API_KEY,
        public: true,
        kind: 'news',
        filter: 'hot',
        currencies: Object.keys(SUPPORTED_COINS).join(',')
      }
    });

    return response.data.results.map((item: any) => ({
      id: item.id.toString(),
      coin: item.currencies?.[0]?.code || 'UNKNOWN',
      date: item.published_at,
      title: item.title,
      description: item.domain,
      eventType: 'News'
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return STATIC_NEWS;
  }
};
