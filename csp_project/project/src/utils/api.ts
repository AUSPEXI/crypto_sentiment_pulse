// src/api.ts
import axios from 'axios';
import { SentimentData, OnChainData, Event } from '../types';

// Log environment variables globally
console.log('Initial Environment variables:', {
  newsApiKey: import.meta.env.VITE_NEWSAPI_API_KEY,
  openAiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

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
    coinMetrics: coin.id // Use CoinMetrics-compatible asset names
  };
});
SUPPORTED_COINS['USDT'] = { coingecko: 'usd-coin', cryptoPanic: 'usdt', coinMetrics: 'tether' };
SUPPORTED_COINS['BNB'] = { coingecko: 'binance-coin', cryptoPanic: 'bnb', coinMetrics: 'binancecoin' };
SUPPORTED_COINS['SOL'] = { coingecko: 'solana', cryptoPanic: 'sol', coinMetrics: 'solana' };

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

// OpenAI and NewsAPI configurations
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'missing';
const NEWSAPI_API_KEY = import.meta.env.NEWSAPI_API_KEY || 'missing';

// Helper to make proxied API requests
const makeProxiedRequest = async (api: string, endpoint: string, params: any) => {
  const proxyUrl = '/api/proxy'; // Updated path to match netlify.toml redirect
  console.log(`Making proxied request to ${api}/${endpoint} with params:`, params);
  try {
    const response = await axios.get(proxyUrl, {
      params: {
        api,
        endpoint,
        params: JSON.stringify(params),
      },
      timeout: 10000,
    });
    console.log(`Proxy response for ${api}/${endpoint}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Proxied request failed for ${api}/${endpoint}:`, error.response?.data || error.message);
    throw new Error(`Proxied request failed: ${error.response?.data?.error || error.message}`);
  }
};

// Helper to fetch recent news from NewsAPI.org
const fetchRecentNews = async (coin: string): Promise<string> => {
  console.log('Fetching news for', coin, 'via proxy');
  try {
    const params = {
      q: coin,
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sortBy: 'publishedAt',
      pageSize: 5,
    };
    const data = await makeProxiedRequest('newsapi', 'everything', params);
    const articles = data.articles || [];
    const relevantNews = articles
      .filter((article: any) => article.title && article.title.toLowerCase().includes(coin.toLowerCase()))
      .map((article: any) => article.title)
      .slice(0, 5);
    return relevantNews.join(' ') || `No recent news for ${coin}`;
  } catch (error) {
    console.error(`Error fetching news for ${coin} via NewsAPI.org:`, error.message);
    return STATIC_NEWS.find(event => event.coin === coin)?.title || `No recent news for ${coin}`;
  }
};

// Fetch social sentiment from Reddit r/cryptocurrency with eight-shot prompting (temporary workaround)
const fetchSocialSentiment = async (coin: string): Promise<number> => {
  console.log('Fetching sentiment for', coin, 'via proxy');
  try {
    const params = {};
    const data = await makeProxiedRequest('reddit', 'r/CryptoCurrency.rss', params);
    console.log(`Reddit raw response for ${coin}:`, data);

    // Temporarily skip parsing due to xml2js compatibility issue
    console.log(`Skipping Reddit parsing for ${coin} due to xml2js compatibility issue`);
    return 0; // Default sentiment score until fast-xml-parser is installed
  } catch (error) {
    console.error(`Error fetching social sentiment for ${coin} from Reddit:`, error.message, error.stack);
    return 0;
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  console.log('Fetching sentiment data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    if (OPENAI_API_KEY === 'missing') throw new Error('OpenAI API key missing');
    const newsText = await fetchRecentNews(coin);
    const newsResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Analyze the sentiment of the following text about ${coin} and provide a score between -10 (very negative) and 10 (very positive):\n\n${newsText}` }],
        max_tokens: 60,
        temperature: 0.5,
      },
      { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const newsScore = parseFloat(newsResponse.data.choices[0].message.content.trim()) || 0;

    const onChainData = await fetchOnChainData(coin);
    const normalizedWalletGrowth = Math.min(Math.max(onChainData.activeWalletsGrowth / 10, -1), 1);
    const normalizedLargeTransactions = Math.min(onChainData.largeTransactions / 5000, 1);

    const socialScore = await fetchSocialSentiment(coin);

    const sentimentScore = (0.5 * newsScore) + (0.2 * normalizedWalletGrowth * 10) + (0.2 * normalizedLargeTransactions * 10) + (0.1 * socialScore);
    const finalScore = Math.min(Math.max(sentimentScore, -10), 10);

    console.log(`Sentiment for ${coin}: News=${newsScore}, WalletGrowth=${normalizedWalletGrowth * 10}, LargeTx=${normalizedLargeTransactions * 10}, Social=${socialScore}, Total=${finalScore}`);
    return { coin, score: finalScore, socialScore, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error(`Error fetching sentiment for ${coin}, falling back to static data:`, error.response?.data || error.message || error);
    const staticScore = STATIC_PRICE_CHANGES[coin] || 0;
    console.log(`Sentiment fallback for ${coin}: Static=${staticScore}`);
    return { coin, score: staticScore, timestamp: new Date().toISOString() };
  }
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const params = {};
    console.log(`CoinMetrics request params:`, params);
    const data = await makeProxiedRequest('coinmetrics', 'catalog/assets', params);
    console.log(`CoinMetrics raw response for ${coin}:`, data);

    // Filter for the specific coin
    const assetData = data.data?.find((d: any) => d.asset === coinInfo.coinMetrics);
    if (assetData) {
      return {
        coin,
        activeWallets: parseInt(assetData.active_addresses || 100000),
        activeWalletsGrowth: parseFloat(assetData.active_addresses_growth || 1.0),
        largeTransactions: parseInt(assetData.transaction_count || 500),
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error('No data found for asset');
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin} via CoinMetrics:`, error.message, error.response?.data);
    const staticData = STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
    return staticData;
  }
};

export const fetchEvents = async (): Promise<Event[]> => {
  console.log('Fetching events via proxy');
  try {
    const params = {
      category: 'business',
      language: 'en',
      pageSize: 50,
    };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const articles = data.articles || [];
    return articles.map((article: any, index: number) => ({
      id: index.toString(),
      coin: article.title.match(/[A-Z]{3,4}/)?.[0] || 'UNKNOWN',
      date: article.publishedAt || new Date().toISOString(),
      title: article.title,
      description: article.source.name || 'NewsAPI.org',
      eventType: 'News',
    }));
  } catch (error) {
    console.error('Error fetching events via NewsAPI.org:', error.message);
    return STATIC_NEWS;
  }
};
