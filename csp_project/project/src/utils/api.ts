import { Event, OnChainData, SentimentData } from '../types';
import { XMLParser } from 'fast-xml-parser';

const sentimentCache: Record<string, { data: SentimentData; timestamp: number }> = {};
const rateLimitCache: Record<string, { lastAttempt: number; retryAfter: number }> = {};
const newsCache: Record<string, { data: string; timestamp: number }> = {};
const eventsCache: Record<string, { data: Event[]; timestamp: number }> = {};
const onChainCache: Record<string, { data: OnChainData; timestamp: number }> = {};

interface CoinInfo {
  name: string;
  coinGecko: string;
  santiment: string;
}

const SUPPORTED_COINS: Record<string, CoinInfo> = {
  BTC: { name: 'Bitcoin', coinGecko: 'bitcoin', santiment: 'bitcoin' },
  ETH: { name: 'Ethereum', coinGecko: 'ethereum', santiment: 'ethereum' },
  USDT: { name: 'Tether', coinGecko: 'tether', santiment: 'tether' },
  BNB: { name: 'Binance Coin', coinGecko: 'binancecoin', santiment: 'binance-coin' },
  SOL: { name: 'Solana', coinGecko: 'solana', santiment: 'solana' },
  USDC: { name: 'USD Coin', coinGecko: 'usd-coin', santiment: 'usd-coin' },
  DOGE: { name: 'Dogecoin', coinGecko: 'dogecoin', santiment: 'dogecoin' },
  ADA: { name: 'Cardano', coinGecko: 'cardano', santiment: 'cardano' },
  TRX: { name: 'TRON', coinGecko: 'tron', santiment: 'tron' },
  AVAX: { name: 'Avalanche', coinGecko: 'avalanche-2', santiment: 'avalanche' },
  XRP: { name: 'Ripple', coinGecko: 'ripple', santiment: 'ripple' },
  LTC: { name: 'Litecoin', coinGecko: 'litecoin', santiment: 'litecoin' },
  BCH: { name: 'Bitcoin Cash', coinGecko: 'bitcoin-cash', santiment: 'bitcoin-cash' },
  DOT: { name: 'Polkadot', coinGecko: 'polkadot', santiment: 'polkadot' },
  LINK: { name: 'Chainlink', coinGecko: 'chainlink', santiment: 'chainlink' },
  MATIC: { name: 'Polygon', coinGecko: 'matic-network', santiment: 'polygon' },
  XLM: { name: 'Stellar', coinGecko: 'stellar', santiment: 'stellar' },
  ATOM: { name: 'Cosmos', coinGecko: 'cosmos', santiment: 'cosmos' },
  CRO: { name: 'Crypto.com Coin', coinGecko: 'crypto-com-chain', santiment: 'crypto-com-coin' },
  ALGO: { name: 'Algorand', coinGecko: 'algorand', santiment: 'algorand' },
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
};

const checkRateLimit = (api: string): boolean => {
  const now = Date.now();
  const cache = rateLimitCache[api] || { lastAttempt: 0, retryAfter: 0 };
  const timeSinceLastRequest = now - cache.lastAttempt;
  if (timeSinceLastRequest < cache.retryAfter) {
    console.log(`Rate limit active for ${api}. Delaying request by ${cache.retryAfter - timeSinceLastRequest}ms`);
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

  console.log(`Making proxied request to ${api}/${endpoint} with params:`, params);

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
      const status = response.status;
      if (status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '3600') * 1000;
        updateRateLimit(api, retryAfter);
        console.error(`Rate limit exceeded for ${api}, retry after ${retryAfter}ms`);
        throw new Error(`Rate limit exceeded for ${api}, retry after ${retryAfter}ms`);
      }
      console.error(`Proxied request failed for ${api}/${endpoint}:`, errorText, 'Status:', status, 'Headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(errorText);
    }

    const data = await response.json();
    console.log(`Proxy response for ${api}/${endpoint}:`, data, 'Headers:', Object.fromEntries(response.headers.entries()));
    if (!data || typeof data !== 'object' || !('data' in data)) {
      throw new Error('Invalid response format');
    }
    return data.data;
  } catch (error) {
    if (retryCount < maxRetries && (error.message.includes('network') || error.message.includes('timeout'))) {
      const delay = 1000;
      console.log(`Retrying request to ${api}/${endpoint} after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeProxiedRequest(api, endpoint, params, method, retryCount + 1, signal, baseUrl);
    }
    console.error(`Proxied request failed for ${api}/${endpoint} after ${retryCount + 1} attempts:`, error.message);
    throw error;
  }
};

const fetchRecentNews = async (coin: string, signal?: AbortSignal): Promise<string> => {
  console.log('Fetching news for', coin, 'via proxy');
  const cached = newsCache[coin];
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    console.log(`Returning cached news for ${coin}`);
    return cached.data;
  }

  const coinInfo = SUPPORTED_COINS[coin] || { name: coin };
  try {
    const params = {
      q: `${coinInfo.name} cryptocurrency`,
      language: 'en',
      pageSize: 5,
    };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params, 'GET', 0, signal);
    const newsText = data?.articles?.map((article: any) => article.title + ' ' + (article.description || '')).join('. ') || '';
    console.log(`News fetched for ${coin}:`, newsText);
    newsCache[coin] = { data: newsText, timestamp: Date.now() };
    return newsText;
  } catch (error) {
    console.error(`Error fetching news for ${coin}:`, error.message);
    const staticNews = STATIC_NEWS[coin]?.map(event => event.title + ' ' + event.description).join('. ') || '';
    console.log(`Falling back to static news for ${coin}:`, staticNews);
    newsCache[coin] = { data: staticNews, timestamp: Date.now() };
    return staticNews;
  }
};

const fetchEvents = async (coin: string, signal?: AbortSignal): Promise<Event[]> => {
  console.log('Fetching events for', coin, 'via proxy');
  const cached = eventsCache[coin];
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    console.log(`Returning cached events for ${coin}`);
    return cached.data;
  }

  const coinInfo = SUPPORTED_COINS[coin] || { name: coin };
  try {
    const params = {
      q: `${coinInfo.name} event cryptocurrency`,
      language: 'en',
      pageSize: 3,
    };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params, 'GET', 0, signal);
    const events = data?.articles?.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
    })) || [];
    console.log(`Events fetched for ${coin}:`, events);
    eventsCache[coin] = { data: events, timestamp: Date.now() };
    return events;
  } catch (error) {
    console.error(`Error fetching events for ${coin}:`, error.message);
    const staticEvents = STATIC_NEWS[coin] || [];
    console.log(`Falling back to static events for ${coin}:`, staticEvents);
    eventsCache[coin] = { data: staticEvents, timestamp: Date.now() };
    return staticEvents;
  }
};

const fetchOnChainData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const cached = onChainCache[coin];
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    console.log(`Returning cached on-chain data for ${coin}`);
    return cached.data;
  }

  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const params = {
      ids: coinInfo.coinGecko,
      vs_currencies: 'usd',
      include_24hr_change: true,
    };
    const data = await makeProxiedRequest('coingecko', 'simple/price', params, 'GET', 0, signal, 'https://api.coingecko.com/api/v3');
    console.log(`CoinGecko raw response for ${coin}:`, data);

    const priceChange = data[coinInfo.coinGecko]?.usd_24h_change || 0;
    const activeWallets = STATIC_WALLET_DATA[coin]?.activeWallets || 0;
    const largeTransactions = STATIC_WALLET_DATA[coin]?.largeTransactions || 0;

    const onChainData = {
      coin,
      activeWallets,
      activeWalletsGrowth: priceChange,
      largeTransactions,
      timestamp: new Date().toISOString(),
    };
    console.log(`On-chain data for ${coin}:`, onChainData);
    onChainCache[coin] = { data: onChainData, timestamp: Date.now() };
    return onChainData;
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin} via CoinGecko:`, error.message);
    const staticData = STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
    console.log(`Falling back to static wallet data for ${coin}:`, staticData);
    onChainCache[coin] = { data: staticData, timestamp: Date.now() };
    return staticData;
  }
};

const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });

const fetchSocialSentiment = async (coin: string, signal?: AbortSignal): Promise<number> => {
  console.log('Fetching social sentiment for', coin, 'via Reddit RSS');
  try {
    const data = await makeProxiedRequest('reddit', 'r/CryptoCurrency.rss', {}, 'GET', 0, signal, 'https://www.reddit.com');
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
      "Instruction: Analyze sentiment of 'LTC steady gains'\n### Answer: 5",
    ].join('\n\n');

    const prompt = `${fewShotExamples}\n\nInstruction: Analyze the sentiment of the following Reddit post titles about ${coin} and provide a score between -10 (very negative) and 10 (very positive):\n\n${relevantPosts.join('\n')}\n### Answer:`;

    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const sentimentResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST', 0, signal);
    const sentimentText = sentimentResponse.choices[0].message.content.trim();
    const socialScore = parseFloat(sentimentText) || 0;
    console.log(`Reddit sentiment score for ${coin}: ${socialScore}`);
    return Math.min(Math.max(socialScore, -10), 10);
  } catch (error) {
    console.error(`Error fetching social sentiment for ${coin} from Reddit:`, error.message);
    return 0;
  }
};

export const fetchSentimentData = async (coin: string, options: { signal?: AbortSignal } = {}): Promise<SentimentData> => {
  console.log('Fetching sentiment data for', coin);
  const cached = sentimentCache[coin];
  if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
    console.log(`Returning cached sentiment data for ${coin}`);
    return cached.data;
  }

  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  let newsScore = 0;
  let socialScore = 0;
  let onChainData: OnChainData = { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };

  try {
    const newsText = await fetchRecentNews(coin, options.signal);
    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Analyze the sentiment of the following text about ${coin} and provide a score between -10 (very negative) and 10 (very positive):\n\n${newsText}` }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const newsResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST', 0, options.signal);
    newsScore = parseFloat(newsResponse.choices[0].message.content.trim()) || 0;
    console.log(`News sentiment score for ${coin}: ${newsScore} (Source: ${newsText.length > 0 ? 'API' : 'Static'})`);
  } catch (error) {
    console.error(`Error calculating news sentiment for ${coin}:`, error.message);
    newsScore = 0;
  }

  try {
    onChainData = await fetchOnChainData(coin, options.signal);
  } catch (error) {
    console.error(`Error fetching on-chain data in sentiment for ${coin}:`, error.message);
    onChainData = STATIC_WALLET_DATA[coin] || onChainData;
  }

  const normalizedWalletGrowth = Math.min(Math.max(onChainData.activeWalletsGrowth / 10, -1), 1);
  const normalizedLargeTransactions = Math.min(onChainData.largeTransactions / 5000, 1);
  console.log(
    `On-chain contribution for ${coin}: Growth=${normalizedWalletGrowth * 10}, LargeTx=${normalizedLargeTransactions * 10} (Source: ${
      onChainData.activeWallets > 0 ? 'API' : 'Static'
    })`
  );

  try {
    socialScore = await fetchSocialSentiment(coin, options.signal);
    console.log(`Social sentiment score for ${coin}: ${socialScore} (Source: ${socialScore !== 0 ? 'API' : 'Static'})`);
  } catch (error) {
    console.error(`Error calculating social sentiment for ${coin}:`, error.message);
    socialScore = 0;
  }

  try {
    const sentimentScore = (0.5 * newsScore) + (0.2 * normalizedWalletGrowth * 10) + (0.2 * normalizedLargeTransactions * 10) + (0.1 * socialScore);
    const finalScore = Math.min(Math.max(sentimentScore, -10), 10);

    console.log(
      `Sentiment for ${coin}: News=${newsScore}, WalletGrowth=${normalizedWalletGrowth * 10}, LargeTx=${normalizedLargeTransactions * 10}, Social=${socialScore}, Total=${finalScore}`
    );
    const result = { coin, score: finalScore, socialScore, timestamp: new Date().toISOString() };
    sentimentCache[coin] = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error(`Error calculating final sentiment for ${coin}, falling back to static data:`, error.message);
    const staticScore = STATIC_PRICE_CHANGES[coin] || 0;
    console.log(`Sentiment fallback for ${coin}: Static=${staticScore}`);
    const result = { coin, score: staticScore, socialScore: 0, timestamp: new Date().toISOString() };
    sentimentCache[coin] = { data: result, timestamp: Date.now() };
    return result;
  }
};

export { fetchEvents, fetchOnChainData, STATIC_NEWS, SUPPORTED_COINS, STATIC_PRICE_CHANGES };
