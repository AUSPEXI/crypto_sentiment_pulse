// src/utils/api.ts
import { NewsData, OnChainData, SentimentData, Event } from './types';

// Fallback data
const defaultNewsData: NewsData = {
  articles: [],
};
const fallbackNewsData: Record<string, NewsData> = {
  BTC: {
    articles: [
      {
        title: 'BTC Market Surge',
        description: 'Bitcoin experiences a significant price increase.',
        url: '#',
        publishedAt: '2025-06-01T12:00:00Z',
      },
      {
        title: 'New BTC Protocol Update',
        description: 'A major update to Bitcoin’s protocol is announced.',
        url: '#',
        publishedAt: '2025-06-01T14:00:00Z',
      },
      {
        title: 'BTC Adoption Grows',
        description: 'More companies adopt Bitcoin for transactions.',
        url: '#',
        publishedAt: '2025-06-01T16:00:00Z',
      },
    ],
  },
  ETH: {
    articles: [
      {
        title: 'ETH Scaling Solution Launched',
        description: 'Ethereum introduces a new scaling solution.',
        url: '#',
        publishedAt: '2025-06-01T12:00:00Z',
      },
      {
        title: 'ETH DeFi Boom',
        description: 'Decentralized finance on Ethereum sees growth.',
        url: '#',
        publishedAt: '2025-06-01T14:00:00Z',
      },
      {
        title: 'ETH Network Upgrade',
        description: 'Ethereum network undergoes a successful upgrade.',
        url: '#',
        publishedAt: '2025-06-01T16:00:00Z',
      },
    ],
  },
  USDT: {
    articles: [
      {
        title: 'USDT Stability Report',
        description: 'Tether maintains its 1:1 USD peg.',
        url: '#',
        publishedAt: '2025-06-01T12:00:00Z',
      },
      {
        title: 'USDT Usage Increases',
        description: 'Tether sees higher transaction volume.',
        url: '#',
        publishedAt: '2025-06-01T14:00:00Z',
      },
      {
        title: 'USDT Regulatory Update',
        description: 'New regulations affect Tether.',
        url: '#',
        publishedAt: '2025-06-01T16:00:00Z',
      },
    ],
  },
};
const defaultSentimentData: SentimentData = {
  coin: '',
  positive: 0,
  negative: 0,
  neutral: 0,
  score: 0,
  socialScore: 0,
  timestamp: '',
};
const fallbackSentimentData: Record<string, SentimentData> = {
  BTC: {
    coin: 'BTC',
    positive: 40,
    negative: 20,
    neutral: 40,
    score: 2, // -10 to 10 scale
    socialScore: 3,
    timestamp: '2025-06-01T12:00:00Z',
  },
  ETH: {
    coin: 'ETH',
    positive: 50,
    negative: 30,
    neutral: 20,
    score: 1,
    socialScore: 2,
    timestamp: '2025-06-01T12:00:00Z',
  },
  USDT: {
    coin: 'USDT',
    positive: 30,
    negative: 10,
    neutral: 60,
    score: 3,
    socialScore: 4,
    timestamp: '2025-06-01T12:00:00Z',
  },
};
const defaultOnChainData: OnChainData = {
  coin: '',
  activeWallets: 0,
  activeWalletsGrowth: 0,
  largeTransactions: 0,
  timestamp: '',
};
export const fallbackOnChainData: Record<string, OnChainData> = {
  BTC: {
    coin: 'BTC',
    activeWallets: 150000,
    activeWalletsGrowth: 5.2,
    largeTransactions: 250,
    timestamp: '2025-06-01T12:00:00Z',
  },
  ETH: {
    coin: 'ETH',
    activeWallets: 120000,
    activeWalletsGrowth: 3.8,
    largeTransactions: 180,
    timestamp: '2025-06-01T12:00:00Z',
  },
  USDT: {
    coin: 'USDT',
    activeWallets: 90000,
    activeWalletsGrowth: 2.5,
    largeTransactions: 300,
    timestamp: '2025-06-01T12:00:00Z',
  },
};

export const fetchEvents = async (api: string, endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/api/proxy?api=${api}&endpoint=${endpoint}${queryParams ? `&params=${encodeURIComponent(JSON.stringify(params))}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Proxied request failed for ${api}/${endpoint}:`, error);
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const fetchNews = async (asset: string): Promise<NewsData> => {
  try {
    const response = await fetchEvents('newsapi', 'everything', {
      q: asset,
      sortBy: 'publishedAt',
      pageSize: 5,
    });
    const data = response.articles || [];
    return {
      articles: data.map((article: any) => ({
        title: article.title || 'No title',
        description: article.description || 'No description',
        url: article.url || '#',
        publishedAt: article.publishedAt || '',
      })),
    };
  } catch (error) {
    console.error(`Error fetching news for ${asset}:`, error);
    return fallbackNewsData[asset] || defaultNewsData;
  }
};

export const fetchOnChainData = async (asset: string): Promise<OnChainData> => {
  try {
    const response = await fetchEvents('coingecko', 'coins/markets', {
      ids: asset.toLowerCase(),
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 1,
      page: 1,
      sparkline: false,
    });
    const data = response[0] || {};
    return {
      coin: asset,
      activeWallets: data.total_volume || 0, // Adjusted field
      activeWalletsGrowth: data.price_change_percentage_24h || 0,
      largeTransactions: data.market_cap || 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching on-chain data for ${asset} via CoinGecko:`, error);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before fallback
    return fallbackOnChainData[asset] || defaultOnChainData;
  }
};

export const fetchSocialSentiment = async (asset: string): Promise<SentimentData> => {
  try {
    const response = await fetchEvents('reddit', 'r/CryptoCurrency.rss');
    const data = response.data?.rss?.channel?.[0]?.item || [];
    const sentimentScore = analyzeSentiment(data);
    return { coin: asset, score: Math.max(-10, Math.min(10, sentimentScore)), timestamp: new Date().toISOString() };
  } catch (error) {
    console.error(`Error fetching social sentiment for ${asset} from Reddit:`, error);
    return { coin: asset, score: 0, timestamp: '2025-06-01T12:00:00Z' };
  }
};

const analyzeSentiment = (data: any): number => {
  return 0; // Placeholder
};

export const calculateNewsSentiment = async (news: NewsData[], asset: string): Promise<SentimentData> => {
  try {
    const prompt = `Analyze the sentiment of the following news articles about ${asset}: ${JSON.stringify(news.articles || [])}. Return a score from -10 (negative) to 10 (positive).`;
    const response = await fetchEvents('openai', 'v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    const data = response.choices?.[0]?.message?.content || '0';
    const sentimentScore = parseFloat(data);
    return { coin: asset, score: Math.max(-10, Math.min(10, sentimentScore)), timestamp: new Date().toISOString() };
  } catch (error) {
    console.error(`Error calculating news sentiment for ${asset}:`, error);
    return fallbackSentimentData[asset] || defaultSentimentData;
  }
};

export const fetchSentimentData = async (asset: string): Promise<SentimentData> => {
  try {
    const news = await fetchNews(asset);
    const newsSentiment = await calculateNewsSentiment([news], asset);
    const socialSentiment = await fetchSocialSentiment(asset);
    const combinedScore = (newsSentiment.score * 0.6 + socialSentiment.score * 0.4);
    return {
      coin: asset,
      positive: newsSentiment.score > 0 ? 60 : 20,
      negative: newsSentiment.score < 0 ? 60 : 20,
      neutral: 20,
      score: Math.max(-10, Math.min(10, combinedScore)),
      socialScore: socialSentiment.score,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching sentiment data for ${asset}:`, error);
    return fallbackSentimentData[asset] || defaultSentimentData;
  }
};

export const STATIC_PRICE_CHANGES: Record<string, number> = {
  BTC: 2.5,
  ETH: -1.3,
  USDT: 0.1,
};

export const STATIC_NEWS: Record<string, NewsData> = fallbackNewsData; // Use the same data as fallback
