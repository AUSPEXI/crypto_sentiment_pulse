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
const STATIC_COINS = [
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
    cryptoPanic: coin.symbol,
    coinMetrics: coin.symbol.toLowerCase()
  };
});

export const getSupportedCoins = () => Object.keys(SUPPORTED_COINS);

// Static price change data for sentiment (mocked for now)
const STATIC_PRICE_CHANGES: { [key: string]: number } = {
  'BTC': 2.5, 'ETH': 1.8, 'USDT': 0.1, 'BNB': 3.2, 'SOL': -1.5,
  'USDC': 0.0, 'XRP': 4.0, 'DOGE': 5.2, 'TON': 2.1, 'ADA': -0.8,
  'TRX': 1.2, 'AVAX': 2.9, 'SHIB': 6.5, 'LINK': 3.5, 'BCH': 1.9,
  'DOT': -2.3, 'NEAR': 4.8, 'LTC': 0.5, 'MATIC': -1.0, 'PEPE': 7.0
};

// Static news data (mocked for fallback)
const STATIC_NEWS: Event[] = [
  { id: '1', coin: 'BTC', date: '2025-05-20T10:00:00Z', title: 'Bitcoin Hits $70K', description: 'Bitcoin surges to a new high.', eventType: 'News' },
  { id: '2', coin: 'ETH', date: '2025-05-20T09:00:00Z', title: 'Ethereum Upgrade Delayed', description: 'Ethereum developers push back upgrade.', eventType: 'News' },
  { id: '3', coin: 'SOL', date: '2025-05-20T08:00:00Z', title: 'Solana Network Outage', description: 'Solana faces another downtime.', eventType: 'News' }
];

// Static wallet data (mocked for fallback)
const STATIC_WALLET_DATA: { [key: string]: OnChainData } = {
  'BTC': { coin: 'BTC', activeWallets: 900000, activeWalletsGrowth: 2.1, largeTransactions: 1500, timestamp: '2025-05-20T07:00:00Z' },
  'ETH': { coin: 'ETH', activeWallets: 600000, activeWalletsGrowth: 1.5, largeTransactions: 1200, timestamp: '2025-05-20T07:00:00Z' },
  'SOL': { coin: 'SOL', activeWallets: 200000, activeWalletsGrowth: -0.5, largeTransactions: 800, timestamp: '2025-05-20T07:00:00Z' }
};

// fetchSentimentData with OpenAI integration
export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  let marketSentiment = 50;
  let aiSentiment = 50;

  // Market sentiment from static data
  const priceChange24h = STATIC_PRICE_CHANGES[coin] || 0;
  marketSentiment = priceChange24h > 0 ? Math.min(75, 50 + priceChange24h * 2.5) : Math.max(25, 50 - Math.abs(priceChange24h) * 2.5);

  // AI sentiment using OpenAI
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not configured, using default AI sentiment');
  } else {
    try {
      const newsForCoin = STATIC_NEWS.filter(event => event.coin === coin);
      const newsText = newsForCoin.length > 0 ? newsForCoin.map(event => event.title + '. ' + event.description).join(' ') : `${coin} market steady.`;
      console.log(`Analyzing sentiment for ${coin} with text: ${newsText}`);
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a sentiment analysis expert. Analyze the sentiment of the following crypto news and return a score from 0 to 100 (0 = very negative, 100 = very positive).' },
          { role: 'user', content: newsText }
        ],
        max_tokens: 50
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      const aiResponse = response.data.choices[0].message.content;
      aiSentiment = parseInt(aiResponse) || 50;
      console.log(`OpenAI sentiment score for ${coin}: ${aiSentiment}`);
    } catch (error: any) {
      console.error(`Error fetching AI sentiment for ${coin}:`, error.message);
      aiSentiment = 50; // Fallback
    }
  }

  const finalScore = (marketSentiment * 0.6 + aiSentiment * 0.4);
  return {
    coin,
    positive: Math.max(0, Math.min(100, finalScore)),
    negative: Math.max(0, Math.min(100, 100 - finalScore)),
    neutral: 0,
    score: finalScore,
    timestamp: new Date().toISOString()
  };
};

// fetchOnChainData with static fallback
export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  if (STATIC_WALLET_DATA[coin]) {
    console.log(`Using static wallet data for ${coin}`);
    return STATIC_WALLET_DATA[coin];
  }

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
      if (attempt === MAX_RETRIES) {
        console.warn(`Failed to fetch on-chain data for ${coin}, returning default data`);
        return { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
      }
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }
  return { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
};

// fetchEvents with static fallback
export const fetchEvents = async (): Promise<Event[]> => {
  const apiToken = import.meta.env.VITE_CRYPTOPANIC_API_TOKEN;
  console.log('CryptoPanic API Token (first 5 chars):', apiToken?.substring(0, 5) || 'Not found');
  if (!apiToken) {
    console.warn('CryptoPanic API token not configured, using static news data');
    return STATIC_NEWS;
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
        console.warn('Failed to fetch events, using static news data');
        return STATIC_NEWS;
      }
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }
  return STATIC_NEWS;
};
