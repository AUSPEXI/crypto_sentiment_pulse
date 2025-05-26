// api.ts
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Define supported coins
const SUPPORTED_COINS = {
  BTC: { symbol: 'BTC', coinMetrics: 'btc' },
  ETH: { symbol: 'ETH', coinMetrics: 'eth' },
  USDT: { symbol: 'USDT', coinMetrics: 'usdt' },
  SOL: { symbol: 'SOL', coinMetrics: 'sol' },
};

// Export STATIC_COINS for use in PortfolioTracker.tsx
export const STATIC_COINS = Object.keys(SUPPORTED_COINS);

// Static data fallbacks
const STATIC_WALLET_DATA = {
  BTC: { coin: 'BTC', activeWallets: 100000, activeWalletsGrowth: 2.1, largeTransactions: 500, timestamp: new Date().toISOString() },
  ETH: { coin: 'ETH', activeWallets: 75000, activeWalletsGrowth: 1.5, largeTransactions: 400, timestamp: new Date().toISOString() },
  USDT: { coin: 'USDT', activeWallets: 20000, activeWalletsGrowth: 0.2, largeTransactions: 600, timestamp: new Date().toISOString() },
  SOL: { coin: 'SOL', activeWallets: 50000, activeWalletsGrowth: 1.8, largeTransactions: 300, timestamp: new Date().toISOString() },
};

const STATIC_PRICE_CHANGES = {
  BTC: 1.02,
  ETH: 0.78,
  USDT: 0.84,
  SOL: 0.90,
};

// Static news fallback for EventAlerts.tsx
export const STATIC_NEWS: { [key: string]: Event[] } = {
  BTC: [
    { title: "BTC price steady", description: "Bitcoin remains stable.", url: "", publishedAt: new Date().toISOString() },
    { title: "BTC adoption grows", description: "More merchants accept BTC.", url: "", publishedAt: new Date().toISOString() },
  ],
  ETH: [
    { title: "ETH network update", description: "Ethereum upgrade incoming.", url: "", publishedAt: new Date().toISOString() },
    { title: "ETH staking rises", description: "More users stake ETH.", url: "", publishedAt: new Date().toISOString() },
  ],
  USDT: [
    { title: "USDT volume up", description: "Tether transactions increase.", url: "", publishedAt: new Date().toISOString() },
  ],
  SOL: [
    { title: "SOL ecosystem grows", description: "Solana projects expand.", url: "", publishedAt: new Date().toISOString() },
  ],
};

// Interface definitions
interface OnChainData {
  coin: string;
  activeWallets: number;
  activeWalletsGrowth: number;
  largeTransactions: number;
  timestamp: string;
}

interface SentimentData {
  coin: string;
  score: number;
  socialScore: number;
  timestamp: string;
}

export interface Event {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}

// Cache for sentiment data to prevent duplicate calls
const sentimentCache: { [coin: string]: SentimentData } = {};

// Helper function for proxied requests
const makeProxiedRequest = async (api: string, endpoint: string, params: any, method: 'GET' | 'POST' = 'GET') => {
  const proxyUrl = '/api/proxy';
  console.log(`Making proxied request to ${api}/${endpoint} with params:`, params);
  try {
    const config: any = {
      method,
      url: proxyUrl,
      timeout: 10000,
    };
    if (method === 'POST') {
      config.data = { api, endpoint, params };
    } else {
      config.params = { api, endpoint, params: JSON.stringify(params) };
    }
    const response = await axios(config);
    console.log(`Proxy response for ${api}/${endpoint}:`, response.data, 'Headers:', response.headers);
    return response.data;
  } catch (error) {
    console.error(`Proxied request failed for ${api}/${endpoint}:`, error.response?.data || error.message, 'Status:', error.response?.status, 'Headers:', error.response?.headers);
    throw new Error(`Proxied request failed: ${error.response?.status || error.message}`);
  }
};

// Fetch recent news
const fetchRecentNews = async (coin: string): Promise<string> => {
  console.log('Fetching news for', coin, 'via proxy');
  const params = { q: coin, language: 'en', sortBy: 'publishedAt' };
  const data = await makeProxiedRequest('newsapi', 'everything', params);
  const newsText = data.articles.map((article: any) => article.title + ' ' + article.description).join(' ');
  console.log(`News text for ${coin}:`, newsText); // Debug log
  return newsText.length > 1000 ? newsText.substring(0, 1000) + '...' : newsText;
