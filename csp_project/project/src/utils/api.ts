import { Event, OnChainData, SentimentData } from '../types';

// In-memory cache for sentiment data and rate limits
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

export const STATIC_PRICE_CHANGES: Record<string, number> = {
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

// Rate limit check
const checkRateLimit = (api: string): boolean => {
  const now = Date.now();
  const cache = rateLimitCache[api] || { lastAttempt: 0, retryAfter: 0 };
  if (now < cache.lastAttempt + cache.retryAfter) {
    console.log(`Rate limit hit for ${api}, retry after ${cache.retryAfter}ms`);
    return false;
  }
  return true;
};

const updateRateLimit = (api: string, retryAfter: number) => {
  rateLimitCache[api] = { lastAttempt: Date.now(), retryAfter };
};

const makeProxiedRequest = async (
  api: string,
  endpoint: string,
  params: any,
  method: 'GET' | 'POST',
  retryCount: number,
  signal?: AbortSignal,
  baseUrl?: string
): Promise<any> => {
  if (!checkRateLimit(api)) {
    throw new Error(`Rate limit exceeded for ${api}`);
  }

  console.log(`Making proxied request to ${api}/${endpoint} with params:`, params);
  const searchParams = new URLSearchParams();
  searchParams.append('api', api);
  searchParams.append('endpoint', endpoint);
  searchParams.append('params', JSON.stringify(params));
  if (baseUrl) searchParams.append('baseUrl', baseUrl);

  const url = `/api/proxy?${searchParams.toString()}`;
  const maxRetries = 3;

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxied request failed for ${api}/${endpoint}: ${errorText} Status: ${response.status}`);
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60') * 1000;
        updateRateLimit(api, retryAfter);
        throw new Error(`Rate limit exceeded for ${api}, retry after ${retryAfter}ms`);
      }
      if (retryCount < maxRetries && response.status >= 500) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying request to ${api}/${endpoint} (attempt ${retryCount + 1}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeProxiedRequest(api, endpoint, params, method, retryCount + 1, signal, baseUrl);
      }
      throw new Error(errorText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    console.error(`Proxied request error for ${api}/${endpoint}:`, error.message);
    if (retryCount < maxRetries && error.message.includes('network')) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying request to ${api}/${endpoint} (attempt ${retryCount + 1}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeProxiedRequest(api, endpoint, params, method, retryCount + 1, signal, baseUrl);
    }
    throw error;
  }
};

const fetchCryptoPanicNews = async (coin: string, signal?: AbortSignal): Promise<Event[]> => {
  console.log('Fetching news from CryptoPanic for', coin);
  if (!coin) {
    console.error('CryptoPanic fetch failed: No coin provided');
    return [];
  }
  try {
    const params = {
      auth_token: process.env.CRYPTOPANIC_API_TOKEN || '',
      currencies: coin.toUpperCase(),
      kind: 'news',
      public: 'true',
    };
    console.log('CryptoPanic request params:', params);
    const data = await makeProxiedRequest('cryptopanic', 'v1/posts', params, 'GET', 0, signal);
    console.log('CryptoPanic response:', data);
    const articles = data.results || [];
    return articles.map((article: any) => ({
      title: article.title,
      description: article.metadata?.description || '',
      url: article.url,
      publishedAt: article.published_at,
    }));
  } catch (error) {
    console.error(`CryptoPanic fetch failed for ${coin}:`, error.message);
    return [];
  }
};

const fetchSantimentNews = async (coin: string, signal?: AbortSignal): Promise<Event[]> => {
  console.log('Fetching news from Santiment for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  try {
    const params = {
      slug: coinInfo.santiment,
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    };
    const data = await makeProxiedRequest('santiment', 'news', params, 'GET', 0, signal);
    console.log('Santiment news response:', data);
    const articles = data.data || [];
    return articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.datetime,
    }));
  } catch (error) {
    console.error(`Santiment news fetch failed for ${coin}:`, error.message);
    return [];
  }
};

const fetchRecentNews = async (coin: string, signal?: AbortSignal): Promise<string> => {
  console.log('Fetching news for', coin);
  const coinInfo = SUPPORTED_COINS[coin];

  // Try NewsAPI
  try {
    const params = {
      q: `${coinInfo.name} cryptocurrency`,
      language: 'en',
      pageSize: 5,
      sortBy: 'publishedAt',
      sources: 'coindesk,cointelegraph',
    };
    console.log('NewsAPI request params:', params);
    const data = await makeProxiedRequest('newsapi', 'everything', params, 'GET', 0, signal);
    console.log('NewsAPI full response:', JSON.stringify(data, null, 2));
    const articles = data.articles || [];
    if (!articles.length) throw new Error('No news articles found from NewsAPI');
    return articles.map((article: any) => article.title).join('. ');
  } catch (error) {
    console.error(`NewsAPI fetch failed for ${coin}:`, error.message);
  }

  // Fallback to CryptoPanic
  try {
    const panicEvents = await fetchCryptoPanicNews(coin, signal);
    if (panicEvents.length) return panicEvents.map((event: any) => event.title).join('. ');
    console.log(`CryptoPanic returned no events for ${coin}`);
  } catch (panicError) {
    console.error(`CryptoPanic fetch failed for ${coin}:`, panicError.message);
  }

  // Fallback to Santiment
  try {
    const santimentEvents = await fetchSantimentNews(coin, signal);
    if (santimentEvents.length) return santimentEvents.map((event: any) => event.title).join('. ');
    console.log(`Santiment returned no events for ${coin}`);
  } catch (santimentError) {
    console.error(`Santiment fetch failed for ${coin}:`, santimentError.message);
  }

  // Fallback to STATIC_NEWS
  console.log(`Falling back to STATIC_NEWS for ${coin}`);
  return STATIC_NEWS[coin]?.map(event => event.title).join('. ') || '';
};

const fetchEvents = async (coin: string, signal?: AbortSignal): Promise<Event[]> => {
  console.log('Fetching events for', coin);
  if (!coin || typeof coin !== 'string') {
    throw new Error('Invalid coin parameter: coin must be a non-empty string');
  }
  const coinInfo = SUPPORTED_COINS[coin];

  // Try NewsAPI
  try {
    const params = {
      q: `${coinInfo.name} event cryptocurrency`,
      language: 'en',
      pageSize: 3,
    };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params, 'GET', 0, signal);
    const articles = data.articles || [];
    return articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  } catch (error) {
    console.error(`Events fetch failed for ${coin}:`, error.message);
  }

  // Fallback to CryptoPanic
  try {
    const panicEvents = await fetchCryptoPanicNews(coin, signal);
    if (panicEvents.length) return panicEvents;
    console.log(`CryptoPanic returned no events for ${coin}`);
  } catch (panicError) {
    console.error(`CryptoPanic fetch failed for ${coin}:`, panicError.message);
  }

  // Fallback to Santiment
  try {
    const santimentEvents = await fetchSantimentNews(coin, signal);
    if (santimentEvents.length) return santimentEvents;
    console.log(`Santiment returned no events for ${coin}`);
  } catch (santimentError) {
    console.error(`Santiment fetch failed for ${coin}:`, santimentError.message);
  }

  // Fallback to STATIC_NEWS
  console.log(`Falling back to STATIC_NEWS for ${coin}`);
  return STATIC_NEWS[coin] || [];
};

const fetchCoinGeckoData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  console.log('Fetching on-chain data from CoinGecko for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  try {
    const params = {
      id: coinInfo.coinGecko,
      vs_currency: 'usd',
      days: '1',
    };
    const data = await makeProxiedRequest('coingecko', 'coins/markets', params, 'GET', 0, signal);
    console.log('CoinGecko response:', data);
    return {
      coin,
      activeWallets: 0, // CoinGecko doesn't provide wallet data
      activeWalletsGrowth: 0,
      largeTransactions: data[0]?.total_volume ? Math.round(data[0].total_volume / 1000000) : 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`CoinGecko fetch failed for ${coin}:`, error.message);
    return { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }
};

const fetchSantimentOnChainData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  console.log('Fetching on-chain data from Santiment for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  try {
    const params = {
      slug: coinInfo.santiment,
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
      interval: '1d',
    };
    const data = await makeProxiedRequest('santiment', 'active_addresses_24h', params, 'GET', 0, signal);
    console.log('Santiment on-chain response:', data);
    const latest = data.data[data.data.length - 1] || {};
    return {
      coin,
      activeWallets: latest.active_addresses || 0,
      activeWalletsGrowth: 0,
      largeTransactions: 0, // Santiment free tier doesn't provide this
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Santiment on-chain fetch failed for ${coin}:`, error.message);
    return { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }
};

export const fetchOnChainData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  if (coin === 'USDT' || coin === 'PEPE') {
    console.log(`Skipping live fetch for ${coin}; using STATIC_WALLET_DATA`);
    return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }

  // Try CoinMetrics
  try {
    const params = {
      assets: coinInfo.coinMetrics,
      metrics: 'AdrActCnt,TxCnt',
      frequency: '1d',
    };
    const data = await makeProxiedRequest('coinmetrics', 'v4/timeseries/asset-metrics', params, 'GET', 0, signal, 'https://community-api.coinmetrics.io');
    const assetData = data.data || [];
    if (assetData.length >= 1) {
      const latest = assetData[assetData.length - 1];
      const result = {
        coin,
        activeWallets: parseInt(latest.AdrActCnt || '0'),
        activeWalletsGrowth: 0,
        largeTransactions: parseInt(latest.TxCnt ? latest.TxCnt * 0.01 : 0),
        timestamp: new Date().toISOString(),
      };
      console.log(`Fetched live on-chain data for ${coin} from CoinMetrics`);
      return result;
    }
    throw new Error('No data found from CoinMetrics');
  } catch (error) {
    console.error(`CoinMetrics fetch failed for ${coin}:`, error.message);
  }

  // Fallback to Santiment
  try {
    const santimentData = await fetchSantimentOnChainData(coin, signal);
    if (santimentData.activeWallets > 0) {
      console.log(`Fetched on-chain data for ${coin} from Santiment`);
      return santimentData;
    }
  } catch (error) {
    console.error(`Santiment on-chain fetch failed for ${coin}:`, error.message);
  }

  // Fallback to CoinGecko
  try {
    const coinGeckoData = await fetchCoinGeckoData(coin, signal);
    if (coinGeckoData.largeTransactions > 0) {
      console.log(`Fetched on-chain data for ${coin} from CoinGecko`);
      return coinGeckoData;
    }
  } catch (error) {
    console.error(`CoinGecko fetch failed for ${coin}:`, error.message);
  }

  // Fallback to STATIC_WALLET_DATA
  console.log(`Falling back to STATIC_WALLET_DATA for ${coin}`);
  return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
};

const fetchSantimentSocialSentiment = async (coin: string, signal?: AbortSignal): Promise<number> => {
  console.log('Fetching social sentiment from Santiment for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  try {
    const params = {
      slug: coinInfo.santiment,
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
      interval: '1d',
    };
    const data = await makeProxiedRequest('santiment', 'sentiment_balance_reddit', params, 'GET', 0, signal);
    console.log('Santiment sentiment response:', data);
    const latest = data.data[data.data.length - 1] || {};
    return latest.sentiment_balance || 0;
  } catch (error) {
    console.error(`Santiment social sentiment fetch failed for ${coin}:`, error.message);
    return 0;
  }
};

const fetchSocialSentiment = async (coin: string, signal?: AbortSignal): Promise<number> => {
  console.log('Fetching social sentiment for', coin);
  const coinInfo = SUPPORTED_COINS[coin];

  // Try Reddit
  try {
    const redditUrl = `https://www.reddit.com/r/cryptocurrency/search.json?q=${coinInfo.name}&sort=new&restrict_sr=on`;
    const response = await fetch(redditUrl, { signal });
    if (!response.ok) throw new Error(`Reddit fetch failed: ${response.statusText}`);
    const data = await response.json();
    const posts = data.data?.children || [];
    const sentimentScores = posts.map((post: any) => {
      const title = post.data.title.toLowerCase();
      if (title.includes('bullish') || title.includes('up')) return 1;
      if (title.includes('bearish') || title.includes('down')) return -1;
      return 0;
    });
    const averageScore = sentimentScores.length ? sentimentScores.reduce((a: number, b: number) => a + b, 0) / sentimentScores.length : 0;
    return averageScore * 10;
  } catch (error) {
    console.error(`Reddit social sentiment fetch failed for ${coin}:`, error.message);
  }

  // Fallback to Santiment
  try {
    const santimentScore = await fetchSantimentSocialSentiment(coin, signal);
    if (santimentScore !== 0) return santimentScore;
  } catch (error) {
    console.error(`Santiment social sentiment fetch failed for ${coin}:`, error.message);
  }

  return 0;
};

const fetchHuggingFaceSentiment = async (text: string, signal?: AbortSignal): Promise<number> => {
  console.log('Fetching sentiment from Hugging Face for text:', text);
  try {
    const params = {
      inputs: text,
    };
    const data = await makeProxiedRequest('huggingface', 'cardiffnlp/twitter-roberta-base-sentiment-latest', params, 'POST', 0, signal);
    console.log('Hugging Face response:', data);
    const scores = data[0];
    const positive = scores.find((s: any) => s.label === 'positive')?.score || 0;
    const negative = scores.find((s: any) => s.label === 'negative')?.score || 0;
    return (positive - negative) * 10; // Scale to -10 to 10
  } catch (error) {
    console.error('Hugging Face sentiment fetch failed:', error.message);
    return 0;
  }
};

export const fetchSentimentData = async (coin: string, options: { signal?: AbortSignal } = {}): Promise<SentimentData> => {
  console.log('Fetching sentiment data for', coin);

  const cached = sentimentCache[coin];
  const cacheDuration = 6 * 60 * 60 * 1000;
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    console.log(`Using cached sentiment data for ${coin}`);
    return cached.data;
  }

  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  let newsScore = 0;
  let onChainData: OnChainData = { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  let socialScore = 0;

  // Fetch news and compute sentiment
  try {
    const newsText = await fetchRecentNews(coin, options.signal);
    if (newsText) {
      try {
        const openAiParams = {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: `Sentiment score -10 to 10 for: ${newsText}` }],
          max_tokens: 60,
          temperature: 0.5,
        };
        const newsResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST', 0, options.signal);
        newsScore = parseFloat(newsResponse.choices[0].message.content.trim()) || 0;
      } catch (error) {
        console.error(`OpenAI sentiment fetch failed for ${coin}:`, error.message);
        // Fallback to Hugging Face
        newsScore = await fetchHuggingFaceSentiment(newsText, options.signal);
      }
    }
  } catch (error) {
    console.error(`News sentiment fetch failed for ${coin}:`, error.message);
    newsScore = 0;
  }

  // Fetch on-chain data
  try {
    onChainData = await fetchOnChainData(coin, options.signal);
  } catch (error) {
    console.error(`On-chain data fetch failed for ${coin}:`, error.message);
    onChainData = STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }

  // Fetch social sentiment
  try {
    socialScore = await fetchSocialSentiment(coin, options.signal);
  } catch (error) {
    console.error(`Social sentiment fetch failed for ${coin}:`, error.message);
    socialScore = 0;
  }

  const sentimentScore = (0.5 * newsScore) + (0.2 * onChainData.activeWalletsGrowth) + (0.2 * (onChainData.largeTransactions / 500)) + (0.1 * socialScore);
  const finalScore = Math.min(Math.max(sentimentScore, -10), 10);
  console.log(`Computed sentiment for ${coin}: ${finalScore}`);
  const result = {
    coin,
    score: finalScore,
    socialScore,
    timestamp: new Date().toISOString(),
  };

  sentimentCache[coin] = { data: result, timestamp: Date.now() };
  return result;
};

export { fetchEvents, STATIC_NEWS, SUPPORTED_COINS };
