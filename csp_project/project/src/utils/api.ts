import { Event, OnChainData, SentimentData } from '../types';

const sentimentCache: Record<string, { data: SentimentData; timestamp: number }> = {};
const rateLimitCache: Record<string, { lastAttempt: number; retryAfter: number }> = {};

interface CoinInfo {
  name: string;
  coinGecko: string;
  coinMetrics: string;
  santiment: string;
}

const SUPPORTED_COINS: Record<string, CoinInfo> = {
  BTC: { name: 'Bitcoin', coinGecko: 'bitcoin', coinMetrics: 'btc', santiment: 'bitcoin' },
  ETH: { name: 'Ethereum', coinGecko: 'ethereum', coinMetrics: 'eth', santiment: 'ethereum' },
  USDT: { name: 'Tether', coinGecko: 'tether', coinMetrics: 'usdt', santiment: 'tether' },
  BNB: { name: 'Binance Coin', coinGecko: 'binancecoin', coinMetrics: 'bnb', santiment: 'binance-coin' },
  SOL: { name: 'Solana', coinGecko: 'solana', coinMetrics: 'sol', santiment: 'solana' },
  USDC: { name: 'USD Coin', coinGecko: 'usd-coin', coinMetrics: 'usdc', santiment: 'usd-coin' },
  DOGE: { name: 'Dogecoin', coinGecko: 'dogecoin', coinMetrics: 'doge', santiment: 'dogecoin' },
  ADA: { name: 'Cardano', coinGecko: 'cardano', coinMetrics: 'ada', santiment: 'cardano' },
  TRX: { name: 'TRON', coinGecko: 'tron', coinMetrics: 'trx', santiment: 'tron' },
  AVAX: { name: 'Avalanche', coinGecko: 'avalanche-2', coinMetrics: 'avax', santiment: 'avalanche' },
  XRP: { name: 'Ripple', coinGecko: 'ripple', coinMetrics: 'xrp', santiment: 'ripple' },
  LTC: { name: 'Litecoin', coinGecko: 'litecoin', coinMetrics: 'ltc', santiment: 'litecoin' },
  BCH: { name: 'Bitcoin Cash', coinGecko: 'bitcoin-cash', coinMetrics: 'bch', santiment: 'bitcoin-cash' },
  DOT: { name: 'Polkadot', coinGecko: 'polkadot', coinMetrics: 'dot', santiment: 'polkadot' },
  LINK: { name: 'Chainlink', coinGecko: 'chainlink', coinMetrics: 'link', santiment: 'chainlink' },
  MATIC: { name: 'Polygon', coinGecko: 'matic-network', coinMetrics: 'matic', santiment: 'polygon' },
  XLM: { name: 'Stellar', coinGecko: 'stellar', coinMetrics: 'xlm', santiment: 'stellar' },
  ATOM: { name: 'Cosmos', coinGecko: 'cosmos', coinMetrics: 'atom', santiment: 'cosmos' },
  CRO: { name: 'Crypto.com Coin', coinGecko: 'crypto-com-chain', coinMetrics: 'cro', santiment: 'crypto-com-coin' },
  ALGO: { name: 'Algorand', coinGecko: 'algorand', coinMetrics: 'algo', santiment: 'algorand' },
  PEPE: { name: 'Pepe', coinGecko: 'pepe', coinMetrics: 'pepe', santiment: 'pepe' },
};

const STATIC_NEWS: Record<string, Event[]> = {
  BTC: [{ title: 'Bitcoin hits new high', description: '', url: '#', publishedAt: '2025-05-27T10:00:00Z' }],
  ETH: [{ title: 'Ethereum upgrades', description: '', url: '#', publishedAt: '2025-05-27T09:00:00Z' }],
  USDT: [{ title: 'Tether stable', description: '', url: '#', publishedAt: '2025-05-27T08:00:00Z' }],
  BNB: [{ title: 'BNB news', description: '', url: '#', publishedAt: '2025-05-27T07:00:00Z' }],
  SOL: [{ title: 'Solana update', description: '', url: '#', publishedAt: '2025-05-27T06:00:00Z' }],
  USDC: [{ title: 'USDC stable', description: '', url: '#', publishedAt: '2025-05-27T05:00:00Z' }],
  DOGE: [{ title: 'Dogecoin trend', description: '', url: '#', publishedAt: '2025-05-27T04:00:00Z' }],
  ADA: [{ title: 'Cardano news', description: '', url: '#', publishedAt: '2025-05-27T03:00:00Z' }],
  TRX: [{ title: 'TRON update', description: '', url: '#', publishedAt: '2025-05-27T02:00:00Z' }],
  AVAX: [{ title: 'Avalanche news', description: '', url: '#', publishedAt: '2025-05-27T01:00:00Z' }],
  XRP: [{ title: 'Ripple update', description: '', url: '#', publishedAt: '2025-05-26T23:00:00Z' }],
  LTC: [{ title: 'Litecoin news', description: '', url: '#', publishedAt: '2025-05-26T22:00:00Z' }],
  BCH: [{ title: 'Bitcoin Cash trend', description: '', url: '#', publishedAt: '2025-05-26T21:00:00Z' }],
  DOT: [{ title: 'Polkadot update', description: '', url: '#', publishedAt: '2025-05-26T20:00:00Z' }],
  LINK: [{ title: 'Chainlink news', description: '', url: '#', publishedAt: '2025-05-26T19:00:00Z' }],
  MATIC: [{ title: 'Polygon trend', description: '', url: '#', publishedAt: '2025-05-26T18:00:00Z' }],
  XLM: [{ title: 'Stellar update', description: '', url: '#', publishedAt: '2025-05-26T17:00:00Z' }],
  ATOM: [{ title: 'Cosmos news', description: '', url: '#', publishedAt: '2025-05-26T16:00:00Z' }],
  CRO: [{ title: 'Crypto.com news', description: '', url: '#', publishedAt: '2025-05-26T15:00:00Z' }],
  ALGO: [{ title: 'Algorand update', description: '', url: '#', publishedAt: '2025-05-26T14:00:00Z' }],
  PEPE: [{ title: 'Pepe meme coin surges', description: '', url: '#', publishedAt: '2025-05-26T13:00:00Z' }],
};

const STATIC_WALLET_DATA: Record<string, OnChainData> = {
  BTC: { coin: 'BTC', activeWallets: 800000, activeWalletsGrowth: 2.5, largeTransactions: 1200, timestamp: '2025-05-27T10:00:00Z' },
  ETH: { coin: 'ETH', activeWallets: 600000, activeWalletsGrowth: 3.0, largeTransactions: 900, timestamp: '2025-05-27T10:00:00Z' },
  USDT: { coin: 'USDT', activeWallets: 500000, activeWalletsGrowth: 1.0, largeTransactions: 1500, timestamp: '2025-05-27T10:00:00Z' },
  BNB: { coin: 'BNB', activeWallets: 400000, activeWalletsGrowth: 1.5, largeTransactions: 800, timestamp: '2025-05-27T10:00:00Z' },
  SOL: { coin: 'SOL', activeWallets: 350000, activeWalletsGrowth: 2.0, largeTransactions: 700, timestamp: '2025-05-27T10:00:00Z' },
  USDC: { coin: 'USDC', activeWallets: 450000, activeWalletsGrowth: 0.5, largeTransactions: 1000, timestamp: '2025-05-27T10:00:00Z' },
  DOGE: { coin: 'DOGE', activeWallets: 300000, activeWalletsGrowth: 1.8, largeTransactions: 600, timestamp: '2025-05-27T10:00:00Z' },
  ADA: { coin: 'ADA', activeWallets: 280000, activeWalletsGrowth: 1.2, largeTransactions: 500, timestamp: '2025-05-27T10:00:00Z' },
  TRX: { coin: 'TRX', activeWallets: 250000, activeWalletsGrowth: 0.9, largeTransactions: 400, timestamp: '2025-05-27T10:00:00Z' },
  AVAX: { coin: 'AVAX', activeWallets: 220000, activeWalletsGrowth: 1.3, largeTransactions: 300, timestamp: '2025-05-27T10:00:00Z' },
  XRP: { coin: 'XRP', activeWallets: 200000, activeWalletsGrowth: 1.1, largeTransactions: 450, timestamp: '2025-05-27T10:00:00Z' },
  LTC: { coin: 'LTC', activeWallets: 180000, activeWalletsGrowth: 0.8, largeTransactions: 350, timestamp: '2025-05-27T10:00:00Z' },
  BCH: { coin: 'BCH', activeWallets: 160000, activeWalletsGrowth: 0.7, largeTransactions: 300, timestamp: '2025-05-27T10:00:00Z' },
  DOT: { coin: 'DOT', activeWallets: 150000, activeWalletsGrowth: 1.0, largeTransactions: 250, timestamp: '2025-05-27T10:00:00Z' },
  LINK: { coin: 'LINK', activeWallets: 140000, activeWalletsGrowth: 0.6, largeTransactions: 200, timestamp: '2025-05-27T10:00:00Z' },
  MATIC: { coin: 'MATIC', activeWallets: 130000, activeWalletsGrowth: 0.9, largeTransactions: 180, timestamp: '2025-05-27T10:00:00Z' },
  XLM: { coin: 'XLM', activeWallets: 120000, activeWalletsGrowth: 0.5, largeTransactions: 150, timestamp: '2025-05-27T10:00:00Z' },
  ATOM: { coin: 'ATOM', activeWallets: 110000, activeWalletsGrowth: 0.7, largeTransactions: 140, timestamp: '2025-05-27T10:00:00Z' },
  CRO: { coin: 'CRO', activeWallets: 100000, activeWalletsGrowth: 0.4, largeTransactions: 120, timestamp: '2025-05-27T10:00:00Z' },
  ALGO: { coin: 'ALGO', activeWallets: 90000, activeWalletsGrowth: 0.6, largeTransactions: 100, timestamp: '2025-05-27T10:00:00Z' },
  PEPE: { coin: 'PEPE', activeWallets: 80000, activeWalletsGrowth: 2.0, largeTransactions: 80, timestamp: '2025-05-27T10:00:00Z' },
};

const STATIC_PRICE_CHANGES: Record<string, number> = {
  BTC: 1.02,
  ETH: 0.78,
  USDT: 0.84,
  BNB: 0.65,
  SOL: 1.12,
  USDC: 0.99,
  DOGE: 0.45,
  ADA: 0.72,
  TRX: 0.88,
  AVAX: 0.91,
  XRP: 0.55,
  LTC: 0.67,
  BCH: 0.59,
  DOT: 0.81,
  LINK: 0.73,
  MATIC: 0.64,
  XLM: 0.52,
  ATOM: 0.69,
  CRO: 0.48,
  ALGO: 0.61,
  PEPE: 1.50,
};

const checkRateLimit = (api: string): boolean => {
  const now = Date.now();
  const cache = rateLimitCache[api] || { lastAttempt: 0, retryAfter: 0 };
  return now >= cache.lastAttempt + cache.retryAfter;
};

const updateRateLimit = (api: string, retryAfter: number) => {
  rateLimitCache[api] = { lastAttempt: Date.now(), retryAfter };
};

const makeProxiedRequest = async (
  api: string,
  endpoint: string,
  params: any,
  method: 'GET' | 'POST',
  retryCount: number = 0,
  signal?: AbortSignal,
  baseUrl?: string
): Promise<any> => {
  if (!checkRateLimit(api)) {
    throw new Error(`Rate limit exceeded for ${api}`);
  }

  const searchParams = new URLSearchParams();
  searchParams.append('api', api);
  searchParams.append('endpoint', endpoint);
  searchParams.append('params', JSON.stringify(params || {}));
  if (baseUrl) searchParams.append('baseUrl', baseUrl);

  const url = `/api/proxy?${searchParams.toString()}`;
  const maxRetries = 1;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60') * 1000;
        updateRateLimit(api, retryAfter);
        throw new Error(`Rate limit exceeded for ${api}, retry after ${retryAfter}ms`);
      }
      throw new Error(errorText);
    }

    const data = await response.json();
    if (!data || typeof data !== 'object' || !('data' in data)) {
      throw new Error('Invalid response format');
    }
    return data.data;
  } catch (error) {
    if (retryCount < maxRetries && (error.message.includes('network') || error.message.includes('timeout'))) {
      const delay = 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeProxiedRequest(api, endpoint, params, method, retryCount + 1, signal, baseUrl);
    }
    return null;
  }
};

const fetchRecentNews = async (coin: string, signal?: AbortSignal): Promise<string> => {
  const coinInfo = SUPPORTED_COINS[coin] || { name: coin };
  try {
    const params = {
      q: `${coinInfo.name} cryptocurrency`,
      language: 'en',
      pageSize: 5,
    };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params, 'GET', 0, signal);
    return data?.articles?.map((article: any) => article.title).join('. ') || '';
  } catch (error) {
    return STATIC_NEWS[coin]?.map(event => event.title).join('. ') || '';
  }
};

const fetchEvents = async (coin: string, signal?: AbortSignal): Promise<Event[]> => {
  const coinInfo = SUPPORTED_COINS[coin] || { name: coin };
  try {
    const params = {
      q: `${coinInfo.name} event cryptocurrency`,
      language: 'en',
      pageSize: 3,
    };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params, 'GET', 0, signal);
    return data?.articles?.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
    })) || [];
  } catch (error) {
    return STATIC_NEWS[coin] || [];
  }
};

const fetchOnChainData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
};

export const fetchSentimentData = async (coin: string, options: { signal?: AbortSignal } = {}): Promise<SentimentData> => {
  const cached = sentimentCache[coin];
  if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
    return cached.data;
  }

  const coinInfo = SUPPORTED_COINS[coin] || { name: coin };
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  let newsScore = 0;
  let onChainData: OnChainData = { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  let socialScore = 0;

  try {
    const newsText = await fetchRecentNews(coin, options.signal);
    newsScore = 0;
  } catch (error) {
    newsScore = 0;
  }

  try {
    onChainData = await fetchOnChainData(coin, options.signal);
  } catch (error) {
    onChainData = STATIC_WALLET_DATA[coin] || onChainData;
  }

  try {
    socialScore = 0;
  } catch (error) {
    socialScore = 0;
  }

  const sentimentScore = 0;
  const result = {
    coin,
    score: sentimentScore,
    socialScore,
    timestamp: new Date().toISOString(),
  };

  sentimentCache[coin] = { data: result, timestamp: Date.now() };
  return result;
};

export { fetchEvents, STATIC_NEWS, SUPPORTED_COINS, STATIC_PRICE_CHANGES };
