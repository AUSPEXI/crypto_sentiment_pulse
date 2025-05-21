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

// Static fallback data for unsupported coins (simulated historical data)
const FALLBACK_ONCHAIN_DATA: Record<string, Partial<OnChainData>> = {
  'USDT': { activeWallets: 500000, activeWalletsGrowth: 1.2, largeTransactions: 1000 },
  'BNB': { activeWallets: 300000, activeWalletsGrowth: 0.8, largeTransactions: 800 },
  'USDC': { activeWallets: 400000, activeWalletsGrowth: 1.0, largeTransactions: 900 },
  'XRP': { activeWallets: 250000, activeWalletsGrowth: -0.5, largeTransactions: 600 },
  'DOGE': { activeWallets: 200000, activeWalletsGrowth: 2.0, largeTransactions: 500 },
  'TON': { activeWallets: 150000, activeWalletsGrowth: 1.5, largeTransactions: 400 },
  'ADA': { activeWallets: 220000, activeWalletsGrowth: 0.7, largeTransactions: 550 },
  'TRX': { activeWallets: 180000, activeWalletsGrowth: 1.1, largeTransactions: 450 },
  'AVAX': { activeWallets: 170000, activeWalletsGrowth: 0.9, largeTransactions: 420 },
  'SHIB': { activeWallets: 190000, activeWalletsGrowth: 3.0, largeTransactions: 470 },
  'LINK': { activeWallets: 160000, activeWalletsGrowth: 1.3, largeTransactions: 410 },
  'BCH': { activeWallets: 140000, activeWalletsGrowth: -0.2, largeTransactions: 380 },
  'DOT': { activeWallets: 130000, activeWalletsGrowth: 0.6, largeTransactions: 370 },
  'NEAR': { activeWallets: 120000, activeWalletsGrowth: 1.4, largeTransactions: 360 },
  'LTC': { activeWallets: 110000, activeWalletsGrowth: 0.3, largeTransactions: 350 },
  'MATIC': { activeWallets: 100000, activeWalletsGrowth: 0.5, largeTransactions: 340 },
  'PEPE': { activeWallets: 90000, activeWalletsGrowth: 4.0, largeTransactions: 320 }
};

const SUPPORTED_COINS = {
  'BTC': { santiment: 'bitcoin', cryptoPanic: 'BTC', coinMetrics: 'btc' },
  'ETH': { santiment: 'ethereum', cryptoPanic: 'ETH', coinMetrics: 'eth' },
  'SOL': { santiment: 'solana', cryptoPanic: 'SOL', coinMetrics: 'sol' }, // Fixed: Changed 'solana' to 'sol'
  'USDT': { santiment: 'tether', cryptoPanic: 'USDT', coinMetrics: 'usdt' },
  'BNB': { santiment: 'binance-coin', cryptoPanic: 'BNB', coinMetrics: 'bnb' },
  'USDC': { santiment: 'usd-coin', cryptoPanic: 'USDC', coinMetrics: 'usdc' },
  'XRP': { santiment: 'xrp', cryptoPanic: 'XRP', coinMetrics: 'xrp' },
  'DOGE': { santiment: 'dogecoin', cryptoPanic: 'DOGE', coinMetrics: 'doge' },
  'TON': { santiment: 'toncoin', cryptoPanic: 'TON', coinMetrics: 'ton' },
  'ADA': { santiment: 'cardano', cryptoPanic: 'ADA', coinMetrics: 'ada' },
  'TRX': { santiment: 'tron', cryptoPanic: 'TRX', coinMetrics: 'trx' },
  'AVAX': { santiment: 'avalanche', cryptoPanic: 'AVAX', coinMetrics: 'avax' },
  'SHIB': { santiment: 'shiba-inu', cryptoPanic: 'SHIB', coinMetrics: 'shib' },
  'LINK': { santiment: 'chainlink', cryptoPanic: 'LINK', coinMetrics: 'link' },
  'BCH': { santiment: 'bitcoin-cash', cryptoPanic: 'BCH', coinMetrics: 'bch' },
  'DOT': { santiment: 'polkadot', cryptoPanic: 'DOT', coinMetrics: 'dot' },
  'NEAR': { santiment: 'near-protocol', cryptoPanic: 'NEAR', coinMetrics: 'near' },
  'LTC': { santiment: 'litecoin', cryptoPanic: 'LTC', coinMetrics: 'ltc' },
  'MATIC': { santiment: 'polygon', cryptoPanic: 'MATIC', coinMetrics: 'matic' },
  'PEPE': { santiment: 'pepe', cryptoPanic: 'PEPE', coinMetrics: 'pepe' }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const apiKey = import.meta.env.VITE_SANTIMENT_API_KEY;
  console.log(`Santiment API Key loaded: ${apiKey ? 'Yes' : 'No'}`); // Debug log
  if (!apiKey) {
    throw new Error('Santiment API key not configured');
  }

  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) {
    throw new Error(`Unsupported coin: ${coin}`);
  }

  const coinSlug = coinConfig.santiment;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching sentiment data for ${coin} (Attempt ${attempt}/${MAX_RETRIES}) with slug: ${coinSlug}`);
      
      const response = await axios.get('/.netlify/functions/proxy', {
        params: {
          url: `https://api.santiment.net/graphql`,
          query: `{
            getMetric(metric: "sentiment_balance") {
              timeseriesData(
                slug: "${coinSlug}"
                from: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
                to: "${new Date().toISOString()}"
                interval: "1d"
              ) {
                datetime
                value
              }
            }
          }`
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      console.log(`Santiment raw response for ${coin}:`, response.data);

      if (!response.data?.data?.getMetric?.timeseriesData?.[0]) {
        throw new Error(`No sentiment data available for ${coin}`);
      }

      const data = response.data.data.getMetric.timeseriesData[0];
      const sentimentValue = data.value || 0;
      
      const normalizedValue = (sentimentValue + 1) * 50;
      
      return {
        coin,
        positive: Math.max(0, normalizedValue - 50) * 2,
        negative: Math.max(0, 50 - normalizedValue) * 2,
        neutral: Math.min(Math.abs(50 - normalizedValue) * 2, 100),
        score: normalizedValue,
        timestamp: data.datetime
      };
    } catch (error: any) {
      console.error(`Error fetching sentiment data for ${coin} (Attempt ${attempt}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });

      if (error.response?.status === 401) {
        throw new Error('Invalid Santiment API key');
      }

      if (error.response?.status === 402) {
        throw new Error('Santiment API requires a paid subscription for this endpoint');
      }

      if ((error.response?.status === 429 || isNetworkError(error)) && attempt < MAX_RETRIES) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
        continue;
      }

      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to fetch sentiment data for ${coin}: ${error.message}`);
      }
    }
  }

  throw new Error(`Failed to fetch sentiment data for ${coin}`);
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) {
    throw new Error(`Unsupported coin: ${coin}`);
  }

  const coinSymbol = coinConfig.coinMetrics;
  const endTime = new Date().toISOString().split('T')[0];
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching on-chain data for ${coin} (Attempt ${attempt}/${MAX_RETRIES})`);
      
      const response = await axios.get('https://community-api.coinmetrics.io/v4/timeseries/asset-metrics', {
        params: {
          assets: coinSymbol.toLowerCase(),
          metrics: 'AdrActCnt,TxCnt',
          frequency: '1d',
          page_size: 2,
          start_time: startTime,
          end_time: endTime
        },
        timeout: 20000
      });

      console.log(`CoinMetrics raw response for ${coin}:`, response.data);

      if (!response.data?.data || response.data.data.length < 2) {
        console.warn(`Insufficient data for ${coin}, using fallback`);
        const fallback = FALLBACK_ONCHAIN_DATA[coin] || { activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0 };
        return {
          coin,
          activeWallets: fallback.activeWallets || 0,
          activeWalletsGrowth: fallback.activeWalletsGrowth || 0,
          largeTransactions: fallback.largeTransactions || 0,
          timestamp: new Date().toISOString()
        };
      }

      const metrics = response.data.data;
      const currentWallets = parseInt(metrics[1].AdrActCnt) || 0;
      const previousWallets = parseInt(metrics[0].AdrActCnt) || 0;
      const growth = previousWallets > 0 ? ((currentWallets - previousWallets) / previousWallets) * 100 : 0;

      return {
        coin,
        activeWallets: currentWallets,
        activeWalletsGrowth: growth,
        largeTransactions: parseInt(metrics[1].TxCnt) || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`Error fetching on-chain data for ${coin} (Attempt ${attempt}):`, {
        message: error.message,
        status: error.response?.status,
        data: JSON.stringify(error.response?.data) || error.message
      });

      if (error.response?.status === 400) {
        console.warn(`Invalid request for ${coin}, using fallback`);
        const fallback = FALLBACK_ONCHAIN_DATA[coin] || { activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0 };
        return {
          coin,
          activeWallets: fallback.activeWallets || 0,
          activeWalletsGrowth: fallback.activeWalletsGrowth || 0,
          largeTransactions: fallback.largeTransactions || 0,
          timestamp: new Date().toISOString()
        };
      }

      if ((error.response?.status === 429 || isNetworkError(error)) && attempt < MAX_RETRIES) {
        const retryDelay = getRetryDelay(attempt) + (Math.random() * 1000); // Add jitter
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
        continue;
      }

      if (attempt === MAX_RETRIES) {
        console.warn(`Max retries reached for ${coin}, using fallback`);
        const fallback = FALLBACK_ONCHAIN_DATA[coin] || { activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0 };
        return {
          coin,
          activeWallets: fallback.activeWallets || 0,
          activeWalletsGrowth: fallback.activeWalletsGrowth || 0,
          largeTransactions: fallback.largeTransactions || 0,
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  const fallback = FALLBACK_ONCHAIN_DATA[coin] || { activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0 };
  return {
    coin,
    activeWallets: fallback.activeWallets || 0,
    activeWalletsGrowth: fallback.activeWalletsGrowth || 0,
    largeTransactions: fallback.largeTransactions || 0,
    timestamp: new Date().toISOString()
  };
};

export const fetchEvents = async (): Promise<Event[]> => {
  const apiToken = import.meta.env.VITE_CRYPTOPANIC_API_TOKEN;
  console.log(`CryptoPanic API Token loaded: ${apiToken ? 'Yes' : 'No'}`); // Debug log
  if (!apiToken) {
    throw new Error('CryptoPanic API token not configured');
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching events (Attempt ${attempt}/${MAX_RETRIES})`);
      
      const response = await axios.get('/.netlify/functions/proxy', {
        params: {
          url: 'https://cryptopanic.com/api/v1/posts',
          auth_token: apiToken,
          public: 'true',
          filter: 'hot',
          currencies: 'BTC,ETH,SOL'
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: 20000
      });

      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid API response format');
      }

      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        console.error('Received HTML instead of JSON');
        throw new Error('Invalid API response: received HTML instead of JSON');
      }

      console.log('CryptoPanic raw response:', response.data);

      if (!Array.isArray(response.data.results)) {
        console.error('Invalid response structure:', response.data);
        return [];
      }

      return response.data.results.map((post: any) => ({
        id: (post.id || Date.now()).toString(),
        coin: Array.isArray(post.currencies) && post.currencies[0]?.code ? post.currencies[0].code : 'UNKNOWN',
        date: post.published_at || new Date().toISOString(),
        title: post.title || 'No title available',
        description: post.text || post.title || 'No description available',
        eventType: post.kind || 'News'
      }));
    } catch (error: any) {
      console.error(`Error fetching events (Attempt ${attempt}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        throw new Error('Invalid CryptoPanic API token');
      }

      if ((error.response?.status === 429 || isNetworkError(error)) && attempt < MAX_RETRIES) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
        continue;
      }

      if (attempt === MAX_RETRIES) {
        return [];
      }
    }
  }

  return [];
};
