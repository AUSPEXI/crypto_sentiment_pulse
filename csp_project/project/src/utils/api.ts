import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Event, OnChainData, SentimentData } from '../types';

// Define supported coins
const SUPPORTED_COINS = {
  BTC: { symbol: 'BTC', coinMetrics: 'btc' },
  ETH: { symbol: 'ETH', coinMetrics: 'eth' },
  USDT: { symbol: 'USDT', coinMetrics: 'usdt' },
  BNB: { symbol: 'BNB', coinMetrics: 'bnb' },
  SOL: { symbol: 'SOL', coinMetrics: 'sol' },
  USDC: { symbol: 'USDC', coinMetrics: 'usdc' },
  XRP: { symbol: 'XRP', coinMetrics: 'xrp' },
  DOGE: { symbol: 'DOGE', coinMetrics: 'doge' },
  TON: { symbol: 'TON', coinMetrics: 'ton' },
  ADA: { symbol: 'ADA', coinMetrics: 'ada' },
  TRX: { symbol: 'TRX', coinMetrics: 'trx' },
  AVAX: { symbol: 'AVAX', coinMetrics: 'avax' },
  SHIB: { symbol: 'SHIB', coinMetrics: 'shib' },
  LINK: { symbol: 'LINK', coinMetrics: 'link' },
  BCH: { symbol: 'BCH', coinMetrics: 'bch' },
  DOT: { symbol: 'DOT', coinMetrics: 'dot' },
  NEAR: { symbol: 'NEAR', coinMetrics: 'near' },
  LTC: { symbol: 'LTC', coinMetrics: 'ltc' },
  MATIC: { symbol: 'MATIC', coinMetrics: 'matic' },
  PEPE: { symbol: 'PEPE', coinMetrics: 'pepe' },
};

export const STATIC_COINS = Object.keys(SUPPORTED_COINS);

const STATIC_WALLET_DATA = {
  BTC: { coin: 'BTC', activeWallets: 100000, activeWalletsGrowth: 2.1, largeTransactions: 500, timestamp: new Date().toISOString() },
  ETH: { coin: 'ETH', activeWallets: 75000, activeWalletsGrowth: 1.5, largeTransactions: 400, timestamp: new Date().toISOString() },
  USDT: { coin: 'USDT', activeWallets: 50000, activeWalletsGrowth: 0.5, largeTransactions: 1000, timestamp: new Date().toISOString() },
  // ... (other coins remain the same)
};

const STATIC_PRICE_CHANGES = {
  BTC: 1.02,
  ETH: 0.78,
  USDT: 0.84,
  // ... (other coins remain the same)
};

export const STATIC_NEWS: { [key: string]: Event[] } = {
  BTC: [
    { title: "El Salvador’s Bitcoin Holdings Show $357 Million in Unrealized Profit As Bitcoin Closes At Record Highs", description: "El Salvador’s bold foray into BTC has entered a new chapter of profitability.", url: "", publishedAt: new Date().toISOString() },
    { title: "XRP-BTC Pair Flashes First Golden Cross, Hinting at Major Bull Run for XRP", description: "No description", url: "", publishedAt: new Date().toISOString() },
    { title: "Peter Schiff Predicts ‘Fireworks,’ Says Michael Saylor’s Strategy Will See Unrealized Loss During Bitcoin’s Next Bearish Dip", description: "Economist and market commentator Peter Schiff projected Monday that the next Bitcoin pullback would trigger an unrealized loss for Michael...", url: "", publishedAt: new Date().toISOString() },
    { title: "Wall Street’s New Bitcoin Monster: Cantor’s $46B Bet Could Dethrone Michael Saylor", description: "Backed by Tether and SoftBank, Twenty One Capital is coming for Strategy’s crypto crown.", url: "", publishedAt: new Date().toISOString() },
    { title: "Bitcoin price holds above $102,000 as BlackRock leads fund inflows", description: "Bitcoin traded relatively flat on Thursday as institutional investors resumed allocations into US-based spot bitcoin exchange-traded funds.", url: "", publishedAt: new Date().toISOString() },
  ],
  ETH: [
    { title: "ETH network update", description: "Ethereum upgrade incoming.", url: "", publishedAt: new Date().toISOString() },
    { title: "ETH staking rises", description: "More users stake ETH.", url: "", publishedAt: new Date().toISOString() },
  ],
  USDT: [
    { title: "USDT volume up", description: "Tether transactions increase.", url: "", publishedAt: new Date().toISOString() },
  ],
  // ... (other coins remain the same)
};

// Simple in-memory cache for NewsAPI responses
const newsCache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // Cache for 1 hour

// Rate limit handling
let lastNewsApiRequestTime: number | null = null;
const NEWS_API_RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour delay
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const makeProxiedRequest = async (api: string, endpoint: string, params: any, method: 'GET' | 'POST' = 'GET', retries = 0): Promise<any> => {
  const cacheKey = `${api}/${endpoint}/${JSON.stringify(params)}`;
  if (api === 'newsapi' && newsCache[cacheKey]) {
    const cached = newsCache[cacheKey];
    if (Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      console.log(`Returning cached response for ${cacheKey}`);
      return cached.data;
    }
    delete newsCache[cacheKey]; // Clear expired cache
  }

  if (api === 'newsapi' && lastNewsApiRequestTime) {
    const timeSinceLastRequest = Date.now() - lastNewsApiRequestTime;
    if (timeSinceLastRequest < NEWS_API_RATE_LIMIT_MS) {
      const delay = NEWS_API_RATE_LIMIT_MS - timeSinceLastRequest;
      console.log(`Rate limit active for NewsAPI. Delaying ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

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
    if (api === 'newsapi') {
      lastNewsApiRequestTime = Date.now();
      newsCache[cacheKey] = { data: response.data, timestamp: Date.now() };
    }
    return response.data;
  } catch (error: any) {
    console.error(`Proxied request failed for ${api}/${endpoint}:`, error.message, 'Status:', error.response?.status);
    if (error.response?.status === 429 && retries < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      console.log(`Retrying ${api}/${endpoint} after ${delay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeProxiedRequest(api, endpoint, params, method, retries + 1);
    }
    throw error;
  }
};

const fetchRecentNews = async (coin: string): Promise<string> => {
  console.log('Fetching news for', coin);
  try {
    const params = { q: `crypto ${coin} OR ${SUPPORTED_COINS[coin].symbol} cryptocurrency`, language: 'en', pageSize: 3 };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const newsText = data.articles.map((article: any) => article.title + ' ' + (article.description || '')).join(' ').slice(0, 1000) + '...';
    console.log(`Fetched live news for ${coin}`);
    return newsText;
  } catch (error) {
    console.error(`News fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_NEWS for ${coin}`);
    return STATIC_NEWS[coin]?.map(event => event.title + ' ' + event.description).join(' ') || 'No news available.';
  }
};

export const fetchEvents = async (coin: string = 'BTC'): Promise<Event[]> => {
  console.log('Fetching events for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) return [];

  try {
    const params = { q: `${coin} OR ${coinInfo.symbol} cryptocurrency`, language: 'en', pageSize: 5 };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const articles = data.articles || [];
    console.log(`Fetched live events for ${coin}: ${articles.length} articles`);
    return articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  } catch (error) {
    console.error(`Events fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_NEWS for ${coin}`);
    return STATIC_NEWS[coin] || [];
  }
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const params = {
      assets: coinInfo.coinMetrics,
      metrics: 'PriceUSD,ActiveAddresses,TxCnt',
      start_time: startDate,
      end_time: endDate,
    };
    const data = await makeProxiedRequest('coinmetrics', 'timeseries/asset-metrics', params);
    const assetData = data.data?.[0];
    if (assetData) {
      const result = {
        coin,
        activeWallets: parseInt(assetData.ActiveAddresses || '0'),
        activeWalletsGrowth: parseFloat(assetData.TxCnt ? (data.data[0].TxCnt - (data.data[1]?.TxCnt || 0)) / (data.data[1]?.TxCnt || 1) * 100 : 0),
        largeTransactions: parseInt(assetData.TxCnt ? assetData.TxCnt * 0.01 : 0),
        timestamp: new Date().toISOString(),
      };
      console.log(`Fetched live on-chain data for ${coin}`);
      return result;
    }
    throw new Error('No data found');
  } catch (error) {
    console.error(`On-chain data fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_WALLET_DATA for ${coin}`);
    return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }
};

const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });

const fetchSocialSentiment = async (coin: string): Promise<number> => {
  console.log('Fetching social sentiment for', coin);
  try {
    const data = await makeProxiedRequest('reddit', 'r/CryptoCurrency.rss', {});
    const xmlData = parser.parse(data);
    const items = xmlData.feed?.entry || [];
    const relevantPosts = items
      .filter((item: any) => new RegExp(coin, 'i').test(item.title?.['#text'] || ''))
      .slice(0, 5)
      .map((item: any) => item.title?.['#text'] || '');
    if (relevantPosts.length === 0) return 0;

    const prompt = `Analyze sentiment of ${relevantPosts.join(', ')} for ${coin}, score -10 to 10`;
    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const response = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST');
    const score = parseFloat(response.choices[0].message.content.trim()) || 0;
    console.log(`Fetched live social sentiment for ${coin}: ${score}`);
    return score;
  } catch (error) {
    console.error(`Social sentiment fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to default social sentiment (0) for ${coin}`);
    return 0;
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  console.log('Fetching sentiment data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const newsText = await fetchRecentNews(coin);
    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Sentiment score -10 to 10 for: ${newsText}` }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const newsResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST');
    const newsScore = parseFloat(newsResponse.choices[0].message.content.trim()) || 0;

    const onChainData = await fetchOnChainData(coin);
    const socialScore = await fetchSocialSentiment(coin);
    const sentimentScore = (0.5 * newsScore) + (0.2 * onChainData.activeWalletsGrowth) + (0.2 * (onChainData.largeTransactions / 500)) + (0.1 * socialScore);
    const finalScore = Math.min(Math.max(sentimentScore, -10), 10);
    console.log(`Computed sentiment for ${coin}: ${finalScore}`);
    return {
      coin,
      score: finalScore,
      socialScore,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Sentiment data fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_PRICE_CHANGES for ${coin}`);
    return { coin, score: STATIC_PRICE_CHANGES[coin] || 0, socialScore: 0, timestamp: new Date().toISOString() };
  }
};
