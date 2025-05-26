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
  BNB: { coin: 'BNB', activeWallets: 40000, activeWalletsGrowth: 1.2, largeTransactions: 350, timestamp: new Date().toISOString() },
  SOL: { coin: 'SOL', activeWallets: 50000, activeWalletsGrowth: 1.8, largeTransactions: 300, timestamp: new Date().toISOString() },
  USDC: { coin: 'USDC', activeWallets: 18000, activeWalletsGrowth: 0.3, largeTransactions: 550, timestamp: new Date().toISOString() },
  XRP: { coin: 'XRP', activeWallets: 30000, activeWalletsGrowth: 0.8, largeTransactions: 200, timestamp: new Date().toISOString() },
  DOGE: { coin: 'DOGE', activeWallets: 60000, activeWalletsGrowth: 2.0, largeTransactions: 100, timestamp: new Date().toISOString() },
  TON: { coin: 'TON', activeWallets: 25000, activeWalletsGrowth: 0.9, largeTransactions: 150, timestamp: new Date().toISOString() },
  ADA: { coin: 'ADA', activeWallets: 35000, activeWalletsGrowth: 1.0, largeTransactions: 250, timestamp: new Date().toISOString() },
  TRX: { coin: 'TRX', activeWallets: 29000, activeWalletsGrowth: 0.7, largeTransactions: 190, timestamp: new Date().toISOString() },
  AVAX: { coin: 'AVAX', activeWallets: 32000, activeWalletsGrowth: 1.1, largeTransactions: 280, timestamp: new Date().toISOString() },
  SHIB: { coin: 'SHIB', activeWallets: 80000, activeWalletsGrowth: 2.5, largeTransactions: 50, timestamp: new Date().toISOString() },
  LINK: { coin: 'LINK', activeWallets: 20000, activeWalletsGrowth: 0.7, largeTransactions: 180, timestamp: new Date().toISOString() },
  BCH: { coin: 'BCH', activeWallets: 27000, activeWalletsGrowth: 0.6, largeTransactions: 220, timestamp: new Date().toISOString() },
  DOT: { coin: 'DOT', activeWallets: 23000, activeWalletsGrowth: 0.9, largeTransactions: 160, timestamp: new Date().toISOString() },
  NEAR: { coin: 'NEAR', activeWallets: 26000, activeWalletsGrowth: 1.0, largeTransactions: 230, timestamp: new Date().toISOString() },
  LTC: { coin: 'LTC', activeWallets: 28000, activeWalletsGrowth: 0.6, largeTransactions: 220, timestamp: new Date().toISOString() },
  MATIC: { coin: 'MATIC', activeWallets: 31000, activeWalletsGrowth: 0.9, largeTransactions: 260, timestamp: new Date().toISOString() },
  PEPE: { coin: 'PEPE', activeWallets: 70000, activeWalletsGrowth: 2.2, largeTransactions: 80, timestamp: new Date().toISOString() },
};

const STATIC_PRICE_CHANGES = {
  BTC: 1.02,
  ETH: 0.78,
  USDT: 0.84,
  BNB: 0.95,
  SOL: 0.90,
  USDC: 0.82,
  XRP: 0.88,
  DOGE: 1.05,
  TON: 0.87,
  ADA: 0.92,
  TRX: 0.82,
  AVAX: 0.96,
  SHIB: 1.10,
  LINK: 0.91,
  BCH: 0.85,
  DOT: 0.87,
  NEAR: 0.94,
  LTC: 0.85,
  MATIC: 0.89,
  PEPE: 1.08,
};

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
  BNB: [
    { title: "BNB chain update", description: "Binance Smart Chain improves.", url: "", publishedAt: new Date().toISOString() },
  ],
  SOL: [
    { title: "SOL ecosystem grows", description: "Solana projects expand.", url: "", publishedAt: new Date().toISOString() },
  ],
  USDC: [
    { title: "USDC adoption rises", description: "USDC usage increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  XRP: [
    { title: "XRP lawsuit news", description: "Ripple faces legal challenges.", url: "", publishedAt: new Date().toISOString() },
  ],
  DOGE: [
    { title: "DOGE price surge", description: "Dogecoin gains popularity.", url: "", publishedAt: new Date().toISOString() },
  ],
  TON: [
    { title: "TON network growth", description: "TON ecosystem expands.", url: "", publishedAt: new Date().toISOString() },
  ],
  ADA: [
    { title: "ADA staking grows", description: "Cardano staking increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  TRX: [
    { title: "TRX dapp growth", description: "TRON dapps increase.", url: "", publishedAt: new Date().toISOString() },
  ],
  AVAX: [
    { title: "AVAX defi boom", description: "Avalanche DeFi projects grow.", url: "", publishedAt: new Date().toISOString() },
  ],
  SHIB: [
    { title: "SHIB community grows", description: "Shiba Inu community expands.", url: "", publishedAt: new Date().toISOString() },
  ],
  LINK: [
    { title: "LINK oracles expand", description: "Chainlink oracles grow.", url: "", publishedAt: new Date().toISOString() },
  ],
  BCH: [
    { title: "BCH adoption rises", description: "Bitcoin Cash usage increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  DOT: [
    { title: "DOT parachain launch", description: "Polkadot launches new parachain.", url: "", publishedAt: new Date().toISOString() },
  ],
  NEAR: [
    { title: "NEAR protocol update", description: "NEAR Protocol enhances features.", url: "", publishedAt: new Date().toISOString() },
  ],
  LTC: [
    { title: "LTC adoption rises", description: "Litecoin usage increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  MATIC: [
    { title: "MATIC scaling news", description: "Polygon enhances scaling.", url: "", publishedAt: new Date().toISOString() },
  ],
  PEPE: [
    { title: "PEPE meme coin surge", description: "Pepe gains traction.", url: "", publishedAt: new Date().toISOString() },
  ],
};

// Rate limit handling
let lastNewsApiRequestTime: number | null = null;
const NEWS_API_RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour delay for 429

const makeProxiedRequest = async (api: string, endpoint: string, params: any, method: 'GET' | 'POST' = 'GET') => {
  if (api === 'newsapi' && lastNewsApiRequestTime) {
    const timeSinceLastRequest = Date.now() - lastNewsApiRequestTime;
    if (timeSinceLastRequest < NEWS_API_RATE_LIMIT_MS) {
      console.log(`Rate limit active for NewsAPI. Delaying request by ${NEWS_API_RATE_LIMIT_MS - timeSinceLastRequest}ms`);
      throw new Error('NewsAPI rate limit active');
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
    console.log(`Proxy response for ${api}/${endpoint}:`, response.data, 'Headers:', response.headers);
    if (api === 'newsapi') {
      lastNewsApiRequestTime = Date.now();
    }
    return response.data;
  } catch (error) {
    console.error(`Proxied request failed for ${api}/${endpoint}:`, error.response?.data || error.message, 'Status:', error.response?.status, 'Headers:', error.response?.headers);
    throw new Error(`Proxied request failed: ${error.response?.status || error.message}`);
  }
};

const fetchRecentNews = async (coin: string): Promise<string> => {
  console.log('Fetching news for', coin, 'via proxy');
  try {
    const params = { q: `crypto ${coin} OR ${SUPPORTED_COINS[coin].symbol} cryptocurrency`, language: 'en', pageSize: 3 };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const newsText = data.articles.map((article: any) => article.title + ' ' + article.description).join(' ');
    return newsText.length > 1000 ? newsText.substring(0, 1000) + '...' : newsText;
  } catch (error) {
    console.error(`Error fetching news for ${coin}:`, error.message);
    const staticNews = STATIC_NEWS[coin] || [];
    return staticNews.map((event: Event) => event.title + ' ' + event.description).join(' ') || `No news available for ${coin}.`;
  }
};

// New function to fetch general cryptocurrency news
const fetchGeneralCryptoNews = async (): Promise<Event[]> => {
  console.log('Fetching general cryptocurrency news via proxy');
  const params = { q: 'cryptocurrency OR blockchain OR bitcoin OR ethereum -inurl:(signup OR login)', language: 'en', pageSize: 5 };
  try {
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const articles = data.articles || [];
    if (articles.length === 0) {
      throw new Error('No general crypto news found');
    }
    return articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  } catch (error) {
    console.error('Error fetching general crypto news:', error.message);
    return [
      { title: "Crypto market update", description: "General trends in the cryptocurrency market.", url: "", publishedAt: new Date().toISOString() },
      { title: "Blockchain innovations", description: "Latest developments in blockchain technology.", url: "", publishedAt: new Date().toISOString() },
    ];
  }
};

export const fetchEvents = async (coin: string = 'BTC'): Promise<Event[]> => {
  console.log('Fetching events for', coin, 'via proxy');
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) {
    console.error(`Unsupported coin: ${coin}, falling back to general crypto news`);
    return fetchGeneralCryptoNews();
  }

  // Try coin-specific news first
  const params = {
    q: `${coin} OR ${coinInfo.symbol} cryptocurrency OR blockchain`,
    language: 'en',
    pageSize: 5,
    sortBy: 'relevancy',
  };
  try {
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const articles = data.articles || [];
    
    // Filter for relevance: ensure the coin or crypto terms are mentioned
    const relevantArticles = articles.filter((article: any) => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      return (
        text.includes(coin.toLowerCase()) ||
        text.includes(coinInfo.symbol.toLowerCase()) ||
        text.includes('cryptocurrency') ||
        text.includes('blockchain')
      );
    });

    // Require at least 2 relevant articles to consider the query successful
    if (relevantArticles.length >= 2) {
      return relevantArticles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        url: article.url,
        publishedAt: article.publishedAt,
      }));
    }

    console.log(`Insufficient relevant news for ${coin} (${relevantArticles.length} articles), falling back to general crypto news`);
    return fetchGeneralCryptoNews();
  } catch (error) {
    console.error(`Error fetching events for ${coin}:`, error.message);
    
    // Fallback to general crypto news if API call fails
    try {
      const generalNews = await fetchGeneralCryptoNews();
      if (generalNews.length > 0) {
        return generalNews;
      }
    } catch (generalError) {
      console.error('Error fetching general crypto news as fallback:', generalError.message);
    }
    
    // Final fallback to static news
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
      metrics: 'PriceUSD,CapMrktCurUSD,ActiveAddresses,TxCnt',
      start_time: startDate,
      end_time: endDate,
    };
    console.log(`CoinMetrics request params for ${coin}:`, params);
    const data = await makeProxiedRequest('coinmetrics', 'timeseries/asset-metrics', params);
    console.log(`CoinMetrics raw response for ${coin}:`, data);

    const assetData = data.data?.[0];
    if (assetData) {
      return {
        coin,
        activeWallets: parseInt(assetData.ActiveAddresses || assetData.PriceUSD ? 100000 : 0),
        activeWalletsGrowth: parseFloat(assetData.TxCnt ? (data.data[0].TxCnt - (data.data[1]?.TxCnt || 0)) / (data.data[1]?.TxCnt || 1) * 100 : 0),
        largeTransactions: parseInt(assetData.TxCnt ? assetData.TxCnt * 0.01 : 0),
        timestamp: new Date().toISOString(),
      };
    }
    throw
