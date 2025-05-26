// api.ts
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Define supported coins
const SUPPORTED_COINS = {
  BTC: { symbol: 'BTC', coinMetrics: 'bitcoin' },
  ETH: { symbol: 'ETH', coinMetrics: 'ethereum' },
  USDT: { symbol: 'USDT', coinMetrics: 'tether' },
  SOL: { symbol: 'SOL', coinMetrics: 'solana' },
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

interface Event {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}

// Helper function for proxied requests
const makeProxiedRequest = async (api: string, endpoint: string, params: any, method: 'GET' | 'POST' = 'GET') => {
  const proxyUrl = '/api/proxy';
  console.log(`Making proxied request to ${api}/${endpoint} with params:`, params);
  try {
    const response = await axios({
      method,
      url: proxyUrl,
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

// Fetch recent news
const fetchRecentNews = async (coin: string): Promise<string> => {
  console.log('Fetching news for', coin, 'via proxy');
  const params = { q: coin, language: 'en', sortBy: 'publishedAt' };
  const data = await makeProxiedRequest('newsapi', 'everything', params);
  return data.articles.map((article: any) => article.title + ' ' + article.description).join(' ');
};

// Fetch events
export const fetchEvents = async (coin: string): Promise<Event[]> => {
  console.log('Fetching events for', coin, 'via proxy');
  const params = { q: coin, language: 'en', pageSize: 5 };
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
    return [];
  }
};

// Fetch on-chain data
export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const params = {
      assets: coinInfo.coinMetrics,
      metrics: 'ActiveAddresses,TxCount',
      start_time: '2025-05-25',
      end_time: '2025-05-26',
    };
    console.log(`CoinMetrics request params:`, params);
    const data = await makeProxiedRequest('coinmetrics', 'timeseries/asset-metrics', params);
    console.log(`CoinMetrics raw response for ${coin}:`, data);

    const assetData = data.data?.[0];
    if (assetData) {
      return {
        coin,
        activeWallets: parseInt(assetData.ActiveAddresses || 100000),
        activeWalletsGrowth: parseFloat(assetData.ActiveAddressesGrowth || 1.0),
        largeTransactions: parseInt(assetData.TxCount || 500),
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error('No data found for asset');
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin} via CoinMetrics:`, error.message, error.response?.data, error.response?.status, error.response?.headers);
    const staticData = STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
    return staticData;
  }
};

// Fetch social sentiment
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
    const coinRegex = new RegExp(`\\b${coin}\\b`, 'i');
    const relevantPosts = items
      .filter((item: any) => coinRegex.test(item.title?.['#text'] || ''))
      .slice(0, 5)
      .map((item: any) => item.title?.['#text'] || '');

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
      "Instruction: Analyze sentiment of 'LTC steady gains'\n### Answer: 5"
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
    console.error(`Error fetching social sentiment for ${coin} from Reddit:`, error.message, error.stack);
    return 0;
  }
};

// Fetch sentiment data
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
    console.error(`Error fetching sentiment for ${coin}, falling back to static data:`, error.response?.data || error.message || error);
    const staticScore = STATIC_PRICE_CHANGES[coin] || 0;
    console.log(`Sentiment fallback for ${coin}: Static=${staticScore}`);
    return { coin, score: staticScore, socialScore: 0, timestamp: new Date().toISOString() };
  }
};
