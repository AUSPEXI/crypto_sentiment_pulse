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
  BNB: { name: 'Binance Coin', coinGecko: 'binancecoin', coinMetrics: 'bnb' },
  SOL: { name: 'Solana', coinGecko: 'solana', coinMetrics: 'sol' },
  USDC: { name: 'USD Coin', coinGecko: 'usd-coin', coinMetrics: 'usdc' },
  DOGE: { name: 'Dogecoin', coinGecko: 'dogecoin', coinMetrics: 'doge' },
  ADA: { name: 'Cardano', coinGecko: 'cardano', coinMetrics: 'ada' },
  TRX: { name: 'TRON', coinGecko: 'tron', coinMetrics: 'trx' },
  AVAX: { name: 'Avalanche', coinGecko: 'avalanche-2', coinMetrics: 'avax' },
  USDT: { name: 'Tether', coinGecko: 'tether', coinMetrics: 'usdt' },
};

const STATIC_NEWS: Record<string, Event[]> = {
  BTC: [
    { title: 'Bitcoin hits new all-time high', description: 'Bitcoin surged past $70,000...', url: '#', publishedAt: '2025-05-27T10:00:00Z' },
  ],
  ETH: [
    { title: 'Ethereum 2.0 upgrades announced', description: 'Ethereum developers plan...', url: '#', publishedAt: '2025-05-27T09:00:00Z' },
  ],
  USDT: [
    { title: 'Tether remains stable', description: 'Tether maintains its peg...', url: '#', publishedAt: '2025-05-27T08:00:00Z' },
  ],
};

const STATIC_WALLET_DATA: Record<string, OnChainData> = {
  BTC: { coin: 'BTC', activeWallets: 800000, activeWalletsGrowth: 2.5, largeTransactions: 1200, timestamp: '2025-05-27T10:00:00Z' },
  ETH: { coin: 'ETH', activeWallets: 600000, activeWalletsGrowth: 3.0, largeTransactions: 900, timestamp: '2025-05-27T10:00:00Z' },
  USDT: { coin: 'USDT', activeWallets: 500000, activeWalletsGrowth: 1.0, largeTransactions: 1500, timestamp: '2025-05-27T10:00:00Z' },
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
};

const makeProxiedRequest = async (
  api: string,
  endpoint: string,
  params: any,
  method: 'GET' | 'POST',
  retryCount: number,
  signal?: AbortSignal
): Promise<any> => {
  console.log(`Making proxied request to ${api}/${endpoint} with params:`, params);
  const searchParams = new URLSearchParams();
  searchParams.append('api', api);
  searchParams.append('endpoint', endpoint);
  searchParams.append('params', JSON.stringify(params));

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
        return makeProxiedRequest(api, endpoint, params, method, retryCount + 1, signal);
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
      return makeProxiedRequest(api, endpoint, params, method, retryCount + 1, signal);
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
      q: `${coinInfo.name} OR cryptocurrency`,
      language: 'en',
      pageSize: 3,
      sortBy: 'publishedAt',
    };
    console.log('NewsAPI request params:', params);
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params, 'GET', 0, signal);
    console.log('NewsAPI full response:', JSON.stringify(data, null, 2));
    const articles = data.articles || [];
    if (!articles.length) throw new Error('No news articles found');
    const titles = articles.map((article: any) => article.title).join('. ');
    return titles;
  } catch (error) {
    console.error(`News fetch failed for ${coin}:`, error.message);
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

  if (coin === 'USDT') {
    console.log(`Skipping live CoinMetrics fetch for ${coin}; using STATIC_WALLET_DATA`);
    return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }

  try {
    const params = {
      assets: coinInfo.coinMetrics,
      metrics: 'AdrActCnt,TxCnt',
      limit: 2,
      frequency: '1d',
    };
    const data = await makeProxiedRequest('coinmetrics', 'v4/timeseries/asset-metrics', params, 'GET', 0, signal);
    const assetData = data.data || [];
    if (assetData.length >= 1) {
      const latest = assetData[0];
      const previous = assetData.length > 1 ? assetData[1] : null;

      const activeWallets = parseInt(latest.AdrActCnt || '0');
      let activeWalletsGrowth = 0;

      if (previous) {
        const previousWallets = parseInt(previous.AdrActCnt || '0');
        activeWalletsGrowth = previousWallets > 0 ? ((activeWallets - previousWallets) / previousWallets) * 100 : 0;
      }

      const result = {
        coin,
        activeWallets,
        activeWalletsGrowth: parseFloat(activeWalletsGrowth.toFixed(2)),
        largeTransactions: parseInt(latest.TxCnt ? latest.TxCnt * 0.01 : 0),
        timestamp: new Date().toISOString(),
      };
      console.log(`Fetched live on-chain data for ${coin}`);
      return result;
    }
    throw new Error('No data found');
  } catch (error) {
    console.error(`On-chain data fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_WALLET_DATA for ${coin} due to CoinMetrics failure`);
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
