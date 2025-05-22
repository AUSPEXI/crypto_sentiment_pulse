// src/api.ts (updated)
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

// Static news data (mocked for fallback)
const STATIC_NEWS: Event[] = [
  { id: '1', coin: 'BTC', date: '2025-05-22T10:00:00Z', title: 'Bitcoin Hits $70K', description: 'Bitcoin surges to a new high.', eventType: 'News' },
  { id: '2', coin: 'ETH', date: '2025-05-22T09:00:00Z', title: 'Ethereum Upgrade Delayed', description: 'Ethereum developers push back upgrade.', eventType: 'News' },
  { id: '3', coin: 'SOL', date: '2025-05-22T08:00:00Z', title: 'Solana Network Outage', description: 'Solana faces another downtime.', eventType: 'News' },
  { id: '4', coin: 'XRP', date: '2025-05-22T07:00:00Z', title: 'XRP Lawsuit Update', description: 'New developments in XRP case.', eventType: 'News' }
];

// Static wallet data (expanded for all 20 coins)
const STATIC_WALLET_DATA: { [key: string]: OnChainData } = {
  'BTC': { coin: 'BTC', activeWallets: 900000, activeWalletsGrowth: 2.1, largeTransactions: 1500, timestamp: '2025-05-22T07:00:00Z' },
  'ETH': { coin: 'ETH', activeWallets: 600000, activeWalletsGrowth: 1.5, largeTransactions: 1200, timestamp: '2025-05-22T07:00:00Z' },
  'USDT': { coin: 'USDT', activeWallets: 500000, activeWalletsGrowth: 0.2, largeTransactions: 2000, timestamp: '2025-05-22T07:00:00Z' },
  'BNB': { coin: 'BNB', activeWallets: 300000, activeWalletsGrowth: 2.8, largeTransactions: 900, timestamp: '2025-05-22T07:00:00Z' },
  'SOL': { coin: 'SOL', activeWallets: 200000, activeWalletsGrowth: -0.5, largeTransactions: 800, timestamp: '2025-05-22T07:00:00Z' },
  'USDC': { coin: 'USDC', activeWallets: 450000, activeWalletsGrowth: 0.1, largeTransactions: 1800, timestamp: '2025-05-22T07:00:00Z' },
  'XRP': { coin: 'XRP', activeWallets: 250000, activeWalletsGrowth: 3.0, largeTransactions: 700, timestamp: '2025-05-22T07:00:00Z' },
  'DOGE': { coin: 'DOGE', activeWallets: 180000, activeWalletsGrowth: 4.5, largeTransactions: 600, timestamp: '2025-05-22T07:00:00Z' },
  'TON': { coin: 'TON', activeWallets: 150000, activeWalletsGrowth: 1.8, largeTransactions: 500, timestamp: '2025-05-22T07:00:00Z' },
  'ADA': { coin: 'ADA', activeWallets: 220000, activeWalletsGrowth: -0.3, largeTransactions: 650, timestamp: '2025-05-22T07:00:00Z' },
  'TRX': { coin: 'TRX', activeWallets: 200000, activeWalletsGrowth: 1.0, largeTransactions: 550, timestamp: '2025-05-22T07:00:00Z' },
  'AVAX': { coin: 'AVAX', activeWallets: 170000, activeWalletsGrowth: 2.5, largeTransactions: 400, timestamp: '2025-05-22T07:00:00Z' },
  'SHIB': { coin: 'SHIB', activeWallets: 140000, activeWalletsGrowth: 5.0, largeTransactions: 300, timestamp: '2025-05-22T07:00:00Z' },
  'LINK': { coin: 'LINK', activeWallets: 160000, activeWalletsGrowth: 2.0, largeTransactions: 450, timestamp: '2025-05-22T07:00:00Z' },
  'BCH': { coin: 'BCH', activeWallets: 130000, activeWalletsGrowth: 1.2, largeTransactions: 350, timestamp: '2025-05-22T07:00:00Z' },
  'DOT': { coin: 'DOT', activeWallets: 120000, activeWalletsGrowth: -1.0, largeTransactions: 300, timestamp: '2025-05-22T07:00:00Z' },
  'NEAR': { coin: 'NEAR', activeWallets: 110000, activeWalletsGrowth: 3.5, largeTransactions: 250, timestamp: '2025-05-22T07:00:00Z' },
  'LTC': { coin: 'LTC', activeWallets: 100000, activeWalletsGrowth: 0.8, largeTransactions: 200, timestamp: '2025-05-22T07:00:00Z' },
  'MATIC': { coin: 'MATIC', activeWallets: 90000, activeWalletsGrowth: -0.5, largeTransactions: 180, timestamp: '2025-05-22T07:00:00Z' },
  'PEPE': { coin: 'PEPE', activeWallets: 80000, activeWalletsGrowth: 6.0, largeTransactions: 150, timestamp: '2025-05-22T07:00:00Z' }
};

// Export userPredictions for use in fetchSentimentData
export const userPredictions: { userId: string; coin: string; prediction: 'positive' | 'negative' | 'neutral'; timestamp: string }[] = [];

// fetchSentimentData with OpenAI integration and community predictions
export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  let marketSentiment = 50;
  let aiSentiment = 50;
  let communitySentiment = 50;

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

  // Community sentiment from user predictions
  const coinPredictions = userPredictions.filter(
    p => p.coin === coin && new Date(p.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  if (coinPredictions.length > 0) {
    const positiveVotes = coinPredictions.filter(p => p.prediction === 'positive').length;
    const negativeVotes = coinPredictions.filter(p => p.prediction === 'negative').length;
    const totalVotes = coinPredictions.length;
    const positiveRatio = positiveVotes / totalVotes;
    const negativeRatio = negativeVotes / totalVotes;
    communitySentiment = 50 + (positiveRatio * 50) - (negativeRatio * 50);
  }

  const finalScore = (marketSentiment * 0.4 + aiSentiment * 0.4 + communitySentiment * 0.2);
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
        console.warn(`CoinMetrics does not support ${coin}, using static data`);
        return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
      }
      const metrics = response.data.data;
      const currentWallets = parseInt(metrics[1].AdrActCnt) || 0;
      const previousWallets = parseInt(metrics[0].AdrActCnt) || 0;
      const growth = previousWallets > 0 ? ((currentWallets - previousWallets) / previousWallets) * 100 : 0;
      return { coin, activeWallets: currentWallets, activeWalletsGrowth: growth, largeTransactions: parseInt(metrics[1].TxCnt) || 0, timestamp: new Date().toISOString() };
    } catch (error: any) {
      console.error(`Error fetching on-chain data for ${coin} (Attempt ${attempt}):`, { message: error.message, status: error.response?.status });
      if (attempt === MAX_RETRIES) {
        console.warn(`Failed to fetch on-chain data for ${coin}, using static data`);
        return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
      }
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }
  return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
};

// fetchEvents with RSS fallback
export const fetchEvents = async (): Promise<Event[]> => {
  const apiToken = import.meta.env.VITE_CRYPTOPANIC_API_TOKEN;
  console.log('CryptoPanic API Token (first 5 chars):', apiToken?.substring(0, 5) || 'Not found');

  if (!apiToken) {
    console.warn('CryptoPanic API token not configured, attempting RSS feed');
  } else {
    const currencies = Object.keys(SUPPORTED_COINS).join(',').toUpperCase();
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Fetching events from CryptoPanic API (Attempt ${attempt}/${MAX_RETRIES}) for currencies: ${currencies}`);
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
        console.error(`Error fetching events from CryptoPanic API (Attempt ${attempt}):`, { message: error.message, status: error.response?.status });
        if (attempt === MAX_RETRIES) {
          console.warn('Failed to fetch events from CryptoPanic API, attempting RSS feed');
          break;
        }
        if (error.response?.status === 429 || isNetworkError(error)) {
          const retryDelay = getRetryDelay(attempt);
          console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
          await delay(retryDelay);
        }
      }
    }
  }

  // Fallback to CryptoPanic RSS feed
  try {
    console.log('Fetching events from CryptoPanic RSS feed');
    const response = await axios.get('https://cryptopanic.com/news/rss/', {
      timeout: 20000
    });
    console.log(`CryptoPanic RSS response:`, response.data);
    // Basic parsing of RSS feed (assuming XML response)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, 'text/xml');
    const items = xmlDoc.getElementsByTagName('item');
    const events: Event[] = [];
    for (let i = 0; i < Math.min(items.length, 5); i++) {
      const item = items[i];
      const title = item.getElementsByTagName('title')[0]?.textContent || 'Unknown Title';
      const description = item.getElementsByTagName('description')[0]?.textContent || '';
      const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || new Date().toISOString();
      // Extract coin from title or description (simplified)
      const coinMatch = title.match(/\b(BTC|ETH|SOL|XRP|USDT|BNB|DOGE|ADA|TON|TRX|AVAX|SHIB|LINK|BCH|DOT|NEAR|LTC|MATIC|PEPE)\b/i);
      const coin = coinMatch ? coinMatch[0].toUpperCase() : 'UNKNOWN';
      events.push({
        id: `rss-${i}`,
        coin,
        date: pubDate,
        title,
        description,
        eventType: 'News'
      });
    }
    return events.length > 0 ? events : STATIC_NEWS;
  } catch (error: any) {
    console.error('Error fetching CryptoPanic RSS feed:', error.message);
    console.warn('Falling back to static news data');
    return STATIC_NEWS;
  }
};
