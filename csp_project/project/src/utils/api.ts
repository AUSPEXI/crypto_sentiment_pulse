// src/utils/api.ts
import axios from 'axios';
import { SentimentData, OnChainData, Event } from '../types';

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

let SUPPORTED_COINS: { [key: string]: { coingecko: string, cryptoPanic: string, coinMetrics: string } } = {};
STATIC_COINS.forEach(coin => {
  SUPPORTED_COINS[coin.symbol] = {
    coingecko: coin.id,
    cryptoPanic: coin.symbol.toLowerCase(),
    coinMetrics: coin.symbol.toLowerCase()
  };
});

export const getSupportedCoins = () => Object.keys(SUPPORTED_COINS);

// Static price change data for sentiment (fallback)
const STATIC_PRICE_CHANGES: { [key: string]: number } = {
  'BTC': 2.5, 'ETH': 1.8, 'USDT': 0.1, 'BNB': 3.2, 'SOL': -1.5,
  'USDC': 0.0, 'XRP': 4.0, 'DOGE': 5.2, 'TON': 2.1, 'ADA': -0.8,
  'TRX': 1.2, 'AVAX': 2.9, 'SHIB': 6.5, 'LINK': 3.5, 'BCH': 1.9,
  'DOT': -2.3, 'NEAR': 4.8, 'LTC': 0.5, 'MATIC': -1.0, 'PEPE': 7.0
};

// Static wallet data (fallback)
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

// Static news data (fallback)
const STATIC_NEWS: Event[] = [
  { id: '1', coin: 'BTC', date: '2025-05-24T10:00:00Z', title: 'Bitcoin Hits $70K', description: 'Bitcoin surges to a new high.', eventType: 'News' },
  { id: '2', coin: 'ETH', date: '2025-05-24T09:00:00Z', title: 'Ethereum Upgrade Delayed', description: 'Ethereum developers push back upgrade.', eventType: 'News' },
  { id: '3', coin: 'SOL', date: '2025-05-24T08:00:00Z', title: 'Solana Network Outage', description: 'Solana faces another downtime.', eventType: 'News' },
  { id: '4', coin: 'XRP', date: '2025-05-24T07:00:00Z', title: 'XRP Lawsuit Update', description: 'New developments in XRP case.', eventType: 'News' }
];

// OpenAI and Hugging Face configurations
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;

// Helper to fetch recent news or social media posts for sentiment analysis (mocked for simplicity)
const fetchRecentNews = async (coin: string): Promise<string> => {
  try {
    const response = await axios.get('[invalid url, do not cite] {
      params: {
        auth_token: import.meta.env.VITE_CRYPTOPANIC_API_TOKEN,
        public: true,
        kind: 'news',
        filter: 'hot',
        currencies: coin
      }
    });
    return response.data.results.map((item: any) => item.title).join(' ') || `No recent news for ${coin}`;
  } catch (error) {
    console.error(`Failed to fetch news for ${coin}:`, error);
    return STATIC_NEWS.find(event => event.coin === coin)?.title || `No recent news for ${coin}`;
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) {
    throw new Error(`Unsupported coin: ${coin}`);
  }

  try {
    // Fetch recent news or social media data to analyze
    const newsText = await fetchRecentNews(coin);

    // Use OpenAI to analyze sentiment
    const response = await axios.post(
      '[invalid url, do not cite]
      {
        model: 'text-davinci-003',
        prompt: `Analyze the sentiment of the following text about ${coin} and provide a sentiment score between -10 (very negative) and 10 (very positive):\n\n${newsText}`,
        max_tokens: 60,
        temperature: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sentimentText = response.data.choices[0].text.trim();
    const score = parseFloat(sentimentText) || 0;

    return {
      coin,
      score: Math.min(Math.max(score, -10), 10), // Clamp score between -10 and 10
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching sentiment for ${coin} via OpenAI, falling back to static data:`, error);
    const staticScore = STATIC_PRICE_CHANGES[coin] || 0;
    return {
      coin,
      score: staticScore,
      timestamp: new Date().toISOString()
    };
  }
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) {
    throw new Error(`Unsupported coin: ${coin}`);
  }

  try {
    // Use Hugging Face to estimate on-chain metrics (mocked API call)
    const response = await axios.post(
      '[invalid url, do not cite] // Replace with your actual model
      {
        inputs: `Estimate on-chain metrics for ${coin} based on historical data. Return active wallets, growth percentage, and large transactions.`
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse Hugging Face response (example format)
    const data = response.data[0];
    const activeWallets = parseInt(data.activeWallets, 10) || 0;
    const activeWalletsGrowth = parseFloat(data.growth) || 0;
    const largeTransactions = parseInt(data.largeTransactions, 10) || 0;

    return {
      coin,
      activeWallets,
      activeWalletsGrowth,
      largeTransactions,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin} via Hugging Face, falling back to static data:`, error);
    const staticData = STATIC_WALLET_DATA[coin] || {
      coin,
      activeWallets: 0,
      activeWalletsGrowth: 0,
      largeTransactions: 0,
      timestamp: new Date().toISOString()
    };
    return staticData;
  }
};

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const response = await axios.get('[invalid url, do not cite] {
      params: {
        auth_token: import.meta.env.VITE_CRYPTOPANIC_API_TOKEN,
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
    console.error('API error fetching events, falling back to static data:', error);
    return STATIC_NEWS;
  }
};
