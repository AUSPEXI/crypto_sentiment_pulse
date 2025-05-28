import { Event, OnChainData, SentimentData } from '../types';

// In-memory cache for sentiment data
const sentimentCache: Record<string, { data: SentimentData; timestamp: number }> = {};

interface CoinInfo {
  name: string;
  coinGecko: string;
  coinMetrics: string;
}

const SUPPORTED_COINS: Record<string, CoinInfo> = {
  BTC: { name: 'Bitcoin', coinGecko: 'bitcoin', coinMetrics: 'btc' },
  ETH: { name: 'Ethereum', coinGecko: 'ethereum', coinMetrics: 'eth' },
  USDT: { name: 'Tether', coinGecko: 'tether', coinMetrics: 'usdt' },
  BNB: { name: 'Binance Coin', coinGecko: 'binancecoin', coinMetrics: 'bnb' },
  SOL: { name: 'Solana', coinGecko: 'solana', coinMetrics: 'sol' },
  USDC: { name: 'USD Coin', coinGecko: 'usd-coin', coinMetrics: 'usdc' },
  DOGE: { name: 'Dogecoin', coinGecko: 'dogecoin', coinMetrics: 'doge' },
  ADA: { name: 'Cardano', coinGecko: 'cardano', coinMetrics: 'ada' },
  TRX: { name: 'TRON', coinGecko: 'tron', coinMetrics: 'trx' },
  AVAX: { name: 'Avalanche', coinGecko: 'avalanche-2', coinMetrics: 'avax' },
  XRP: { name: 'Ripple', coinGecko: 'ripple', coinMetrics: 'xrp' },
  LTC: { name: 'Litecoin', coinGecko: 'litecoin', coinMetrics: 'ltc' },
  BCH: { name: 'Bitcoin Cash', coinGecko: 'bitcoin-cash', coinMetrics: 'bch' },
  DOT: { name: 'Polkadot', coinGecko: 'polkadot', coinMetrics: 'dot' },
  LINK: { name: 'Chainlink', coinGecko: 'chainlink', coinMetrics: 'link' },
  MATIC: { name: 'Polygon', coinGecko: 'matic-network', coinMetrics: 'matic' },
  XLM: { name: 'Stellar', coinGecko: 'stellar', coinMetrics: 'xlm' },
  ATOM: { name: 'Cosmos', coinGecko: 'cosmos', coinMetrics: 'atom' },
  CRO: { name: 'Crypto.com Coin', coinGecko: 'crypto-com-chain', coinMetrics: 'cro' },
  ALGO: { name: 'Algorand', coinGecko: 'algorand', coinMetrics: 'algo' },
  PEPE: { name: 'Pepe', coinGecko: 'pepe', coinMetrics: 'pepe' },
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

const makeProxiedRequest = async (
  api: string,
  endpoint: string,
  params: any,
  method: 'GET' | 'POST',
  retryCount: number,
  signal?: AbortSignal,
  baseUrl?: string
): Promise<any> => {
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

const fetchRecentNews = async (coin: string, signal?: AbortSignal): Promise<string> => {
  console.log('Fetching news for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  try {
    const params = {
      q: `crypto ${coinInfo.name}`,
      language: 'en',
      pageSize: 5,
      sortBy: 'publishedAt',
    };
    console.log('NewsAPI request params:', params);
    const data = await makeProxiedRequest('newsapi', 'everything', params, 'GET', 0, signal);
    console.log('NewsAPI full response:', JSON.stringify(data, null, 2));
    const articles = data.articles || [];
    if (!articles.length) throw new Error('No news articles found from NewsAPI');
    return articles.map((article: any) => article.title).join('. ');
  } catch (error) {
    console.error(`NewsAPI fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to CryptoPanic for ${coin}`);
    try {
      const panicEvents = await fetchCryptoPanicNews(coin, signal);
      if (panicEvents.length) return panicEvents.map((event: any) => event.title).join('. ');
    } catch (panicError) {
      console.error(`CryptoPanic fetch failed for ${coin}:`, panicError.message);
    }
    console.log(`Falling back to STATIC_NEWS for ${coin}`);
    return STATIC_NEWS[coin]?.map(event => event.title).join('. ') || '';
  }
};

const fetchEvents = async (coin: string, signal?: AbortSignal): Promise<Event[]> => {
  console.log('Fetching events for', coin);
  if (!coin || typeof coin !== 'string') {
    throw new Error('Invalid coin parameter: coin must be a non-empty string');
  }
  const coinInfo = SUPPORTED_COINS[coin];
  try {
    const params = {
      q: `${coinInfo.name} event`,
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
    console.log(`Falling back to CryptoPanic for ${coin}`);
    const panicEvents = await fetchCryptoPanicNews(coin, signal);
    if (panicEvents.length) return panicEvents;
    console.log(`Falling back to STATIC_NEWS for ${coin}`);
    return STATIC_NEWS[coin] || [];
  }
};

export const fetchOnChainData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  if (coin === 'USDT' || coin === 'PEPE') {
    console.log(`Skipping live CoinMetrics fetch for ${coin}; using STATIC_WALLET_DATA`);
    return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }

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
      console.log(`Fetched live on-chain data for ${coin}`);
      return result;
    }
    throw new Error('No data found from CoinMetrics');
  } catch (error) {
    console.error(`CoinMetrics fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_WALLET_DATA for ${coin}`);
    return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }
};

const fetchSocialSentiment = async (coin: string, signal?: AbortSignal): Promise<number> => {
  console.log('Fetching social sentiment for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
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
    console.error(`Social sentiment fetch failed for ${coin}:`, error.message);
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

  try {
    const newsText = await fetchRecentNews(coin, options.signal);
    if (newsText) {
      const openAiParams = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Sentiment score -10 to 10 for: ${newsText}` }],
        max_tokens: 60,
        temperature: 0.5,
      };
      const newsResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST', 0, options.signal);
      newsScore = parseFloat(newsResponse.choices[0].message.content.trim()) || 0;
    }
  } catch (error) {
    console.error(`News sentiment fetch failed for ${coin}:`, error.message);
    newsScore = 0;
  }

  try {
    onChainData = await fetchOnChainData(coin, options.signal);
  } catch (error) {
    console.error(`On-chain data fetch failed for ${coin}:`, error.message);
    onChainData = STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }

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
