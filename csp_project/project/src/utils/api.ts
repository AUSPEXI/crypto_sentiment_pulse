import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Event, OnChainData, SentimentData } from '../types';

// Define supported coins (all 20)
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
  BNB: { coin: 'BNB', activeWallets: 45000, activeWalletsGrowth: 1.2, largeTransactions: 300, timestamp: new Date().toISOString() },
  SOL: { coin: 'SOL', activeWallets: 40000, activeWalletsGrowth: 2.5, largeTransactions: 350, timestamp: new Date().toISOString() },
  USDC: { coin: 'USDC', activeWallets: 48000, activeWalletsGrowth: 0.8, largeTransactions: 900, timestamp: new Date().toISOString() },
  XRP: { coin: 'XRP', activeWallets: 35000, activeWalletsGrowth: 1.0, largeTransactions: 250, timestamp: new Date().toISOString() },
  DOGE: { coin: 'DOGE', activeWallets: 30000, activeWalletsGrowth: 1.8, largeTransactions: 200, timestamp: new Date().toISOString() },
  TON: { coin: 'TON', activeWallets: 28000, activeWalletsGrowth: 2.0, largeTransactions: 180, timestamp: new Date().toISOString() },
  ADA: { coin: 'ADA', activeWallets: 32000, activeWalletsGrowth: 1.3, largeTransactions: 220, timestamp: new Date().toISOString() },
  TRX: { coin: 'TRX', activeWallets: 31000, activeWalletsGrowth: 1.4, largeTransactions: 210, timestamp: new Date().toISOString() },
  AVAX: { coin: 'AVAX', activeWallets: 29000, activeWalletsGrowth: 1.7, largeTransactions: 190, timestamp: new Date().toISOString() },
  SHIB: { coin: 'SHIB', activeWallets: 27000, activeWalletsGrowth: 2.2, largeTransactions: 170, timestamp: new Date().toISOString() },
  LINK: { coin: 'LINK', activeWallets: 26000, activeWalletsGrowth: 1.6, largeTransactions: 160, timestamp: new Date().toISOString() },
  BCH: { coin: 'BCH', activeWallets: 25000, activeWalletsGrowth: 1.1, largeTransactions: 150, timestamp: new Date().toISOString() },
  DOT: { coin: 'DOT', activeWallets: 24000, activeWalletsGrowth: 1.9, largeTransactions: 140, timestamp: new Date().toISOString() },
  NEAR: { coin: 'NEAR', activeWallets: 23000, activeWalletsGrowth: 2.3, largeTransactions: 130, timestamp: new Date().toISOString() },
  LTC: { coin: 'LTC', activeWallets: 22000, activeWalletsGrowth: 1.2, largeTransactions: 120, timestamp: new Date().toISOString() },
  MATIC: { coin: 'MATIC', activeWallets: 21000, activeWalletsGrowth: 1.5, largeTransactions: 110, timestamp: new Date().toISOString() },
  PEPE: { coin: 'PEPE', activeWallets: 20000, activeWalletsGrowth: 2.4, largeTransactions: 100, timestamp: new Date().toISOString() },
};

const STATIC_PRICE_CHANGES = {
  BTC: 1.02,
  ETH: 0.78,
  USDT: 0.84,
  BNB: 0.95,
  SOL: 1.10,
  USDC: 0.82,
  XRP: 0.90,
  DOGE: 1.05,
  TON: 1.08,
  ADA: 0.88,
  TRX: 0.92,
  AVAX: 1.00,
  SHIB: 1.15,
  LINK: 0.96,
  BCH: 0.89,
  DOT: 0.94,
  NEAR: 1.12,
  LTC: 0.87,
  MATIC: 0.91,
  PEPE: 1.20,
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
  BNB: [
    { title: "BNB chain expansion", description: "Binance Smart Chain grows.", url: "", publishedAt: new Date().toISOString() },
  ],
  SOL: [
    { title: "Solana DEX volume spikes", description: "Solana’s DeFi ecosystem booms.", url: "", publishedAt: new Date().toISOString() },
  ],
  USDC: [
    { title: "USDC adoption grows", description: "More platforms integrate USDC.", url: "", publishedAt: new Date().toISOString() },
  ],
  XRP: [
    { title: "XRP legal update", description: "Ripple’s case progresses.", url: "", publishedAt: new Date().toISOString() },
  ],
  DOGE: [
    { title: "DOGE meme frenzy", description: "Dogecoin surges on social media hype.", url: "", publishedAt: new Date().toISOString() },
  ],
  TON: [
    { title: "TON ecosystem expands", description: "New projects launch on TON.", url: "", publishedAt: new Date().toISOString() },
  ],
  ADA: [
    { title: "Cardano smart contracts update", description: "ADA enhances functionality.", url: "", publishedAt: new Date().toISOString() },
  ],
  TRX: [
    { title: "TRON DeFi growth", description: "TRX sees more DeFi activity.", url: "", publishedAt: new Date().toISOString() },
  ],
  AVAX: [
    { title: "Avalanche subnet launch", description: "AVAX expands scalability.", url: "", publishedAt: new Date().toISOString() },
  ],
  SHIB: [
    { title: "Shiba Inu burns tokens", description: "SHIB reduces supply.", url: "", publishedAt: new Date().toISOString() },
  ],
  LINK: [
    { title: "Chainlink CCIP update", description: "LINK improves cross-chain tech.", url: "", publishedAt: new Date().toISOString() },
  ],
  BCH: [
    { title: "Bitcoin Cash adoption", description: "BCH gains merchant support.", url: "", publishedAt: new Date().toISOString() },
  ],
  DOT: [
    { title: "Polkadot parachain auction", description: "DOT ecosystem grows.", url: "", publishedAt: new Date().toISOString() },
  ],
  NEAR: [
    { title: "NEAR protocol upgrade", description: "Faster transactions on NEAR.", url: "", publishedAt: new Date().toISOString() },
  ],
  LTC: [
    { title: "Litecoin mining update", description: "LTC hashrate increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  MATIC: [
    { title: "Polygon zkEVM progress", description: "MATIC enhances scaling.", url: "", publishedAt: new Date().toISOString() },
  ],
  PEPE: [
    { title: "Pepe meme coin surges", description: "PEPE gains traction.", url: "", publishedAt: new Date().toISOString() },
  ],
};

// In-memory cache for NewsAPI responses
const newsCache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // Cache for 1 hour

// Rate limit handling
let lastNewsApiRequestTime: number | null = null;
const NEWS_API_RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const MAX_DELAY_MS = 10 * 1000; // Max 10 seconds delay for rate limit

const makeProxiedRequest = async (api: string, endpoint: string, params: any, method: 'GET' | 'POST' = 'GET', retries = 0): Promise<any> => {
  const cacheKey = `${api}/${endpoint}/${JSON.stringify(params)}`;
  if (api === 'newsapi' && newsCache[cacheKey]) {
    const cached = newsCache[cacheKey];
    if (Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      console.log(`Returning cached response for ${cacheKey}`);
      return cached.data;
    }
    delete newsCache[cacheKey];
  }

  if (api === 'newsapi' && lastNewsApiRequestTime) {
    const timeSinceLastRequest = Date.now() - lastNewsApiRequestTime;
    if (timeSinceLastRequest < NEWS_API_RATE_LIMIT_MS) {
      const delay = Math.min(NEWS_API_RATE_LIMIT_MS - timeSinceLastRequest, MAX_DELAY_MS);
      if (delay >= MAX_DELAY_MS) {
        throw new Error(`Rate limit delay too long (${delay}ms), aborting request`);
      }
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

const fetchCryptoPanicNews = async (coin: string): Promise<Event[]> => {
  console.log('Fetching news from CryptoPanic for', coin);
  try {
    const params = {
      auth_token: process.env.CRYPTOPANIC_API_TOKEN,
      currencies: coin,
      kind: 'news',
      public: true,
    };
    const data = await makeProxiedRequest('cryptopanic', 'posts', params);
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
    const staticNews = STATIC_NEWS[coin]?.map(event => event.title + ' ' + event.description).join(' ') || 'No news available.';
    return staticNews;
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
    console.log(`Falling back to CryptoPanic for ${coin}`);
    const cryptoPanicNews = await fetchCryptoPanicNews(coin);
    if (cryptoPanicNews.length > 0) return cryptoPanicNews;
    console.log(`Falling back to STATIC_NEWS for ${coin}`);
    return STATIC_NEWS[coin] || [];
  }
};

const fetchSantimentOnChainData = async (coin: string): Promise<OnChainData> => {
  console.log('Fetching on-chain data from Santiment for', coin);
  try {
    const params = {
      slug: coin.toLowerCase(),
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
      metrics: ['active_addresses_24h', 'transaction_volume'],
    };
    const data = await makeProxiedRequest('santiment', 'timeseries', params);
    const latest = data.data?.[data.data.length - 1] || {};
    return {
      coin,
      activeWallets: parseInt(latest.active_addresses_24h || '0'),
      activeWalletsGrowth: 0, // Santiment free tier may not provide historical data for growth
      largeTransactions: parseInt(latest.transaction_volume || '0') * 0.01,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Santiment fetch failed for ${coin}:`, error.message);
    return null;
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
      metrics: 'AdrActCnt,TxCnt', // Adjusted for community API
      start: startDate,
      end: endDate,
    };
    const data = await makeProxiedRequest('coinmetrics', 'timeseries/asset-metrics', params);
    const assetData = data.data?.[0];
    if (assetData) {
      const result = {
        coin,
        activeWallets: parseInt(assetData.AdrActCnt || '0'),
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
    console.log(`Falling back to Santiment for ${coin}`);
    const santimentData = await fetchSantimentOnChainData(coin);
    if (santimentData) return santimentData;
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

// Export STATIC_PRICE_CHANGES
export { STATIC_PRICE_CHANGES };
