// src/utils/api.ts
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Define supported coins
const SUPPORTED_COINS = {
  BTC: { symbol: 'BTC', coinMetrics: 'btc' },
  ETH: { symbol: 'ETH', coinMetrics: 'eth' },
  USDT: { symbol: 'USDT', coinMetrics: 'usdt' },
  SOL: { symbol: 'SOL', coinMetrics: 'sol' },
  BNB: { symbol: 'BNB', coinMetrics: 'bnb' },
  XRP: { symbol: 'XRP', coinMetrics: 'xrp' },
  ADA: { symbol: 'ADA', coinMetrics: 'ada' },
  DOT: { symbol: 'DOT', coinMetrics: 'dot' },
  LINK: { symbol: 'LINK', coinMetrics: 'link' },
  DOGE: { symbol: 'DOGE', coinMetrics: 'doge' },
  SHIB: { symbol: 'SHIB', coinMetrics: 'shib' },
  LTC: { symbol: 'LTC', coinMetrics: 'ltc' },
  XLM: { symbol: 'XLM', coinMetrics: 'xlm' },
  AVAX: { symbol: 'AVAX', coinMetrics: 'avax' },
  MATIC: { symbol: 'MATIC', coinMetrics: 'matic' },
  TRX: { symbol: 'TRX', coinMetrics: 'trx' },
  ATOM: { symbol: 'ATOM', coinMetrics: 'atom' },
  NEAR: { symbol: 'NEAR', coinMetrics: 'near' },
  ALGO: { symbol: 'ALGO', coinMetrics: 'algo' },
  VET: { symbol: 'VET', coinMetrics: 'vet' },
};

export const STATIC_COINS = Object.keys(SUPPORTED_COINS);

const STATIC_WALLET_DATA = {
  BTC: { coin: 'BTC', activeWallets: 100000, activeWalletsGrowth: 2.1, largeTransactions: 500, timestamp: new Date().toISOString() },
  ETH: { coin: 'ETH', activeWallets: 75000, activeWalletsGrowth: 1.5, largeTransactions: 400, timestamp: new Date().toISOString() },
  USDT: { coin: 'USDT', activeWallets: 20000, activeWalletsGrowth: 0.2, largeTransactions: 600, timestamp: new Date().toISOString() },
  SOL: { coin: 'SOL', activeWallets: 50000, activeWalletsGrowth: 1.8, largeTransactions: 300, timestamp: new Date().toISOString() },
  BNB: { coin: 'BNB', activeWallets: 40000, activeWalletsGrowth: 1.2, largeTransactions: 350, timestamp: new Date().toISOString() },
  XRP: { coin: 'XRP', activeWallets: 30000, activeWalletsGrowth: 0.8, largeTransactions: 200, timestamp: new Date().toISOString() },
  ADA: { coin: 'ADA', activeWallets: 35000, activeWalletsGrowth: 1.0, largeTransactions: 250, timestamp: new Date().toISOString() },
  DOT: { coin: 'DOT', activeWallets: 25000, activeWalletsGrowth: 0.9, largeTransactions: 150, timestamp: new Date().toISOString() },
  LINK: { coin: 'LINK', activeWallets: 20000, activeWalletsGrowth: 0.7, largeTransactions: 180, timestamp: new Date().toISOString() },
  DOGE: { coin: 'DOGE', activeWallets: 60000, activeWalletsGrowth: 2.0, largeTransactions: 100, timestamp: new Date().toISOString() },
  SHIB: { coin: 'SHIB', activeWallets: 80000, activeWalletsGrowth: 2.5, largeTransactions: 50, timestamp: new Date().toISOString() },
  LTC: { coin: 'LTC', activeWallets: 28000, activeWalletsGrowth: 0.6, largeTransactions: 220, timestamp: new Date().toISOString() },
  XLM: { coin: 'XLM', activeWallets: 22000, activeWalletsGrowth: 0.5, largeTransactions: 170, timestamp: new Date().toISOString() },
  AVAX: { coin: 'AVAX', activeWallets: 32000, activeWalletsGrowth: 1.1, largeTransactions: 280, timestamp: new Date().toISOString() },
  MATIC: { coin: 'MATIC', activeWallets: 31000, activeWalletsGrowth: 0.9, largeTransactions: 260, timestamp: new Date().toISOString() },
  TRX: { coin: 'TRX', activeWallets: 29000, activeWalletsGrowth: 0.7, largeTransactions: 190, timestamp: new Date().toISOString() },
  ATOM: { coin: 'ATOM', activeWallets: 27000, activeWalletsGrowth: 0.8, largeTransactions: 210, timestamp: new Date().toISOString() },
  NEAR: { coin: 'NEAR', activeWallets: 26000, activeWalletsGrowth: 1.0, largeTransactions: 230, timestamp: new Date().toISOString() },
  ALGO: { coin: 'ALGO', activeWallets: 24000, activeWalletsGrowth: 0.6, largeTransactions: 160, timestamp: new Date().toISOString() },
  VET: { coin: 'VET', activeWallets: 23000, activeWalletsGrowth: 0.5, largeTransactions: 140, timestamp: new Date().toISOString() },
};

const STATIC_PRICE_CHANGES = {
  BTC: 1.02,
  ETH: 0.78,
  USDT: 0.84,
  SOL: 0.90,
  BNB: 0.95,
  XRP: 0.88,
  ADA: 0.92,
  DOT: 0.87,
  LINK: 0.91,
  DOGE: 1.05,
  SHIB: 1.10,
  LTC: 0.85,
  XLM: 0.83,
  AVAX: 0.96,
  MATIC: 0.89,
  TRX: 0.82,
  ATOM: 0.86,
  NEAR: 0.94,
  ALGO: 0.81,
  VET: 0.80,
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
  SOL: [
    { title: "SOL ecosystem grows", description: "Solana projects expand.", url: "", publishedAt: new Date().toISOString() },
  ],
  BNB: [
    { title: "BNB chain update", description: "Binance Smart Chain improves.", url: "", publishedAt: new Date().toISOString() },
  ],
  XRP: [
    { title: "XRP lawsuit news", description: "Ripple faces legal challenges.", url: "", publishedAt: new Date().toISOString() },
  ],
  ADA: [
    { title: "ADA staking grows", description: "Cardano staking increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  DOT: [
    { title: "DOT parachain launch", description: "Polkadot launches new parachain.", url: "", publishedAt: new Date().toISOString() },
  ],
  LINK: [
    { title: "LINK oracles expand", description: "Chainlink oracles grow.", url: "", publishedAt: new Date().toISOString() },
  ],
  DOGE: [
    { title: "DOGE price surge", description: "Dogecoin gains popularity.", url: "", publishedAt: new Date().toISOString() },
  ],
  SHIB: [
    { title: "SHIB community grows", description: "Shiba Inu community expands.", url: "", publishedAt: new Date().toISOString() },
  ],
  LTC: [
    { title: "LTC adoption rises", description: "Litecoin usage increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  XLM: [
    { title: "XLM partners grow", description: "Stellar partnerships expand.", url: "", publishedAt: new Date().toISOString() },
  ],
  AVAX: [
    { title: "AVAX defi boom", description: "Avalanche DeFi projects grow.", url: "", publishedAt: new Date().toISOString() },
  ],
  MATIC: [
    { title: "MATIC scaling news", description: "Polygon enhances scaling.", url: "", publishedAt: new Date().toISOString() },
  ],
  TRX: [
    { title: "TRX dapp growth", description: "TRON dapps increase.", url: "", publishedAt: new Date().toISOString() },
  ],
  ATOM: [
    { title: "ATOM interoperability", description: "Cosmos improves interoperability.", url: "", publishedAt: new Date().toISOString() },
  ],
  NEAR: [
    { title: "NEAR protocol update", description: "NEAR Protocol enhances features.", url: "", publishedAt: new Date().toISOString() },
  ],
  ALGO: [
    { title: "ALGO green tech", description: "Algorand focuses on sustainability.", url: "", publishedAt: new Date().toISOString() },
  ],
  VET: [
    { title: "VET supply chain news", description: "VeChain improves supply chain.", url: "", publishedAt: new Date().toISOString() },
  ],
};

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
    const params = { q: `crypto ${coin}`, category: 'business', language: 'en', pageSize: 3 };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const newsText = data.articles.map((article: any) => article.title + ' ' + article.description).join(' ');
    return newsText.length > 1000 ? newsText.substring(0, 1000) + '...' : newsText;
  } catch (error) {
    console.error(`Error fetching news for ${coin}:`, error.message);
    const staticNews = STATIC_NEWS[coin] || [];
    return staticNews.map((event: Event) => event.title + ' ' + event.description).join(' ') || `No news available for ${coin}.`;
  }
};

export const fetchEvents = async (coin: string = 'BTC'): Promise<Event[]> => {
  console.log('Fetching events for', coin, 'via proxy');
  const params = { q: `crypto ${coin}`, language: 'en', pageSize: 5 };
  try {
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  } catch (error) {
    console.error(`Error fetching events for ${coin}:`, error.message);
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
      metrics: 'PriceUSD,CapMrktCurUSD',
      start_time: startDate,
      end_time: endDate,
    };
    console.log(`CoinMetrics request params:`, params);
    const data = await makeProxiedRequest('coinmetrics', 'timeseries/asset-metrics', params);
    console.log(`CoinMetrics raw response for ${coin}:`, data);

    const assetData = data.data?.[0];
    if (assetData) {
      return {
        coin,
        activeWallets: parseInt(assetData.PriceUSD ? 100000 : 0),
        activeWalletsGrowth: parseFloat(assetData.CapMrktCurUSD ? 1.0 : 0),
        largeTransactions: parseInt(assetData.CapMrktCurUSD ? 500 : 0),
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error('No data found for asset');
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin} via CoinMetrics:`, error.message);
    const staticData = STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
    return staticData;
  }
};

const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });

const fetchSocialSentiment = async (coin: string): Promise<number> => {
  console.log('Fetching sentiment for', coin, 'via proxy');
  try {
    const params = {};
    const data = await makeProxiedRequest('reddit', 'r/CryptoCurrency.rss', params);
    console.log(`Reddit raw response for ${coin}:`, data);
    const xmlData = parser.parse(data);
    console.log(`Parsed XML data for ${coin}:`, xmlData);

    const items = xmlData.feed?.entry || [];
    const coinRegex = new RegExp(`${coin}`, 'i');
    const relevantPosts = items
      .filter((item: any) => coinRegex.test(item.title?.['#text'] || ''))
      .slice(0, 5)
      .map((item: any) => {
        const title = item.title?.['#text'] || '';
        console.log(`Matched title for ${coin}:`, title);
        return title;
      });

    if (relevantPosts.length === 0) {
      console.log(`No relevant Reddit posts found for ${coin}`);
      return 0;
    }

    const fewShotExamples = [
      "Instruction: Analyze sentiment of 'BTC price up 5% today!'\n### Answer: 7",
      "Instruction: Analyze sentiment of 'ETH crash incoming'\n### Answer: -6",
      "Instruction: Analyze sentiment of 'SOL network stable'\n### Answer: 4",
      "Instruction: Analyze sentiment of 'XRP lawsuit news'\n### Answer: -3",
      "Instruction: Analyze sentiment of 'ADA great project'\n### Answer: 6",
      "Instruction: Analyze sentiment of 'DOGE to the moon'\n### Answer: 8",
      "Instruction: Analyze sentiment of 'SHIB scam alert'\n### Answer: -8",
      "Instruction: Analyze sentiment of 'LTC steady gains'\n### Answer: 5",
    ].join('\n\n');

    const prompt = `${fewShotExamples}\n\nInstruction: Analyze the sentiment of the following Reddit post titles about ${coin} and provide a score between -10 (very negative) and 10 (very positive):\n\n${relevantPosts.join('\n')}\n### Answer:`;

    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const sentimentResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST');

    const sentimentText = sentimentResponse.choices[0].message.content.trim();
    const socialScore = parseFloat(sentimentText) || 0;
    console.log(`Reddit sentiment score for ${coin}: ${socialScore}`);
    return Math.min(Math.max(socialScore, -10), 10);
  } catch (error) {
    console.error(`Error fetching social sentiment for ${coin} from Reddit:`, error.message);
    return 0;
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  console.log('Fetching sentiment data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  let newsScore = 0;
  let socialScore = 0;

  try {
    const newsText = await fetchRecentNews(coin);
    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Analyze the sentiment of the following text about ${coin} and provide a score between -10 (very negative) and 10 (very positive):\n\n${newsText}` }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const newsResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST');
    newsScore = parseFloat(newsResponse.choices[0].message.content.trim()) || 0;
    console.log(`News sentiment score for ${coin}: ${newsScore}`);

    const onChainData = await fetchOnChainData(coin);
    const normalizedWalletGrowth = Math.min(Math.max(onChainData.activeWalletsGrowth / 10, -1), 1);
    const normalizedLargeTransactions = Math.min(onChainData.largeTransactions / 5000, 1);

    socialScore = await fetchSocialSentiment(coin);

    const sentimentScore = (0.5 * newsScore) + (0.2 * normalizedWalletGrowth * 10) + (0.2 * normalizedLargeTransactions * 10) + (0.1 * socialScore);
    const finalScore = Math.min(Math.max(sentimentScore, -10), 10);

    console.log(`Sentiment for ${coin}: News=${newsScore}, WalletGrowth=${normalizedWalletGrowth * 10}, LargeTx=${normalizedLargeTransactions * 10}, Social=${socialScore}, Total=${finalScore}`);
    return { coin, score: finalScore, socialScore, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error(`Error fetching sentiment for ${coin}, falling back to static data:`, error.message);
    const staticScore = STATIC_PRICE_CHANGES[coin] || 0;
    console.log(`Sentiment fallback for ${coin}: Static=${staticScore}`);
    return { coin, score: staticScore, socialScore: 0, timestamp: new Date().toISOString() };
  }
};
