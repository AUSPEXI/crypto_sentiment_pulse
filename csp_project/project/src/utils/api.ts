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

// Initialize with fallback coins
let SUPPORTED_COINS: { [key: string]: { coingecko: string, cryptoPanic: string, coinMetrics: string, xQuery: string } } = {
  'BTC': { coingecko: 'bitcoin', cryptoPanic: 'bitcoin', coinMetrics: 'btc', xQuery: 'BTC OR Bitcoin' },
  'ETH': { coingecko: 'ethereum', cryptoPanic: 'ethereum', coinMetrics: 'eth', xQuery: 'ETH OR Ethereum' },
  'SOL': { coingecko: 'solana', cryptoPanic: 'solana', coinMetrics: 'solana', xQuery: 'SOL OR Solana' }
};

// Fetch top 100 coins by market cap from CoinGecko
export const fetchSupportedCoins = async (): Promise<void> => {
  try {
    console.log('Attempting to fetch top 100 coins from CoinGecko...');
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false
      },
      timeout: 20000
    });
    console.log('CoinGecko response status:', response.status);
    console.log('CoinGecko response data length:', response.data.length);

    if (!response.data || response.data.length === 0) throw new Error('No coins fetched from CoinGecko');

    SUPPORTED_COINS = response.data.reduce((acc: any, coin: any) => {
      const symbol = coin.symbol.toUpperCase();
      acc[symbol] = {
        coingecko: coin.id,
        cryptoPanic: symbol,
        coinMetrics: symbol.toLowerCase(),
        xQuery: `${symbol} OR ${coin.name}`
      };
      return acc;
    }, {});
    console.log('Successfully updated SUPPORTED_COINS with', Object.keys(SUPPORTED_COINS).length, 'coins');
  } catch (error: any) {
    console.error('Failed to fetch coins from CoinGecko:', error.message, 'Falling back to initial coins');
    // Keep fallback coins
  }
};

export const getSupportedCoins = () => Object.keys(SUPPORTED_COINS);

// fetchSentimentData
export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  const coinId = coinConfig.coingecko;
  let marketSentiment = 50, socialSentiment = 50;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching market data for ${coin} (Attempt ${attempt}/${MAX_RETRIES}) with ID: ${coinId}`);
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
        params: {
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        },
        timeout: 20000
      });
      console.log(`CoinGecko raw response for ${coin}:`, response.data);
      if (!response.data?.market_data) throw new Error(`No market data for ${coin}`);
      const data = response.data.market_data;
      const priceChange24h = data.price_change_percentage_24h || 0;
      marketSentiment = priceChange24h > 0 ? Math.min(75, 50 + priceChange24h * 2.5) : Math.max(25, 50 - Math.abs(priceChange24h) * 2.5);
      break;
    } catch (error: any) {
      console.error(`Error fetching market data for ${coin} (Attempt ${attempt}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data?.substring(0, 200)
      });
      if (attempt === MAX_RETRIES) throw new Error(`Failed to fetch market data for ${coin}: ${error.message}`);
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }

  // Fetch social sentiment from X (simplified for now, ensure VITE_X_BEARER_TOKEN is set)
  let socialData = { positive: 50, negative: 50, neutral: 0 };
  try {
    const bearerToken = import.meta.env.VITE_X_BEARER_TOKEN;
    if (!bearerToken) throw new Error('X Bearer Token not configured');
    // Simplified: Assume social sentiment fetch works if token is present
    socialSentiment = 50; // Placeholder until full integration
  } catch (error) {
    console.error('Failed to fetch social sentiment for ${coin}:', error.message);
  }

  const finalScore = (marketSentiment * 0.4 + socialSentiment * 0.6);
  return {
    coin,
    positive: Math.max(0, Math.min(100, finalScore)),
    negative: Math.max(0, Math.min(100, 100 - finalScore)),
    neutral: 0,
    score: finalScore,
    timestamp: new Date().toISOString()
  };
};

// fetchOnChainData
export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  const coinSymbol = coinConfig.coinMetrics;
  const endTime = new Date().toISOString().split('T')[0];
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching on-chain data for ${coin} (Attempt ${attempt}/${MAX_RETRIES}) with symbol: ${coinSymbol}`);
      const response = await axios.get('https://community-api.coinmetrics.io/v4/timeseries/asset-metrics', {
        params: { assets: coinSymbol.toLowerCase(), metrics: 'AdrActCnt,TxCnt', frequency: '1d', page_size: 2, start_time: startTime, end_time: endTime },
        timeout: 20000
      });
      console.log(`CoinMetrics response for ${coin}:`, response.data);
      if (!response.data?.data || response.data.data.length < 2) {
        console.warn(`CoinMetrics does not support ${coin}, returning default data`);
        return { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
      }
      const metrics = response.data.data;
      const currentWallets = parseInt(metrics[1].AdrActCnt) || 0;
      const previousWallets = parseInt(metrics[0].AdrActCnt) || 0;
      const growth = previousWallets > 0 ? ((currentWallets - previousWallets) / previousWallets) * 100 : 0;
      return { coin, activeWallets: currentWallets, activeWalletsGrowth: growth, largeTransactions: parseInt(metrics[1].TxCnt) || 0, timestamp: new Date().toISOString() };
    } catch (error: any) {
      console.error(`Error fetching on-chain data for ${coin} (Attempt ${attempt}):`, { message: error.message, status: error.response?.status });
      if (attempt === MAX_RETRIES) throw new Error(`Failed to fetch on-chain data for ${coin}: ${error.message}`);
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }
  throw new Error(`Failed to fetch on-chain data for ${coin}`);
};

// fetchEvents with fallback
export const fetchEvents = async (): Promise<Event[]> => {
  const apiToken = import.meta.env.VITE_CRYPTOPANIC_API_TOKEN;
  console.log('CryptoPanic API Token (first 5 chars):', apiToken?.substring(0, 5) || 'Not found');
  if (!apiToken) {
    console.warn('CryptoPanic API token not configured, returning empty events');
    return [];
  }

  const currencies = Object.keys(SUPPORTED_COINS).join(',');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching events (Attempt ${attempt}/${MAX_RETRIES}) for currencies: ${currencies}`);
      const response = await axios.get(`https://cryptopanic.com/api/v1/posts/?auth_token=${apiToken}&public=true&filter=hot¤cies=${currencies}`, {
        timeout: 20000
      });
      console.log(`CryptoPanic raw response:`, response.data);
      if (!response.data?.results) throw new Error('Invalid response format from CryptoPanic API');
      return response.data.results.map((post: any) => ({
        id: post.id.toString(),
        coin: post.currencies?.[0]?.code || 'UNKNOWN',
        date: post.published_at,
        title: post.title,
        description: post.excerpt || '',
        eventType: post.kind || 'News'
      }));
    } catch (error: any) {
      console.error(`Error fetching events (Attempt ${attempt}):`, { message: error.message, status: error.response?.status, data: error.response?.data?.substring(0, 200) });
      if (attempt === MAX_RETRIES) {
        console.warn('Failed to fetch events, returning empty array');
        return [];
      }
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }
  return [];
};
