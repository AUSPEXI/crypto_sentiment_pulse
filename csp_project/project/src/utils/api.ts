// api.ts
import { NewsData, OnChainData, SentimentData } from './types';

// Fallback data
const defaultNewsData: NewsData = { articles: [] };
const fallbackNewsData: Record<string, NewsData> = {
  BTC: { articles: [{ title: 'Fallback BTC News', description: 'No data', url: '#' }] },
  ETH: { articles: [{ title: 'Fallback ETH News', description: 'No data', url: '#' }] },
  USDT: { articles: [{ title: 'Fallback USDT News', description: 'No data', url: '#' }] },
};
const defaultOnChainData: OnChainData = { price: 0, marketCap: 0, volume: 0 };
const fallbackOnChainData: Record<string, OnChainData> = {
  BTC: { price: 60000, marketCap: 1.2e12, volume: 3e10 },
  ETH: { price: 3000, marketCap: 3.6e11, volume: 1.5e10 },
  USDT: { price: 1, marketCap: 1.1e11, volume: 5e10 },
};

export const fetchEvents = async (api: string, endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/proxy?api=${api}&endpoint=${endpoint}¶ms=${encodeURIComponent(JSON.stringify({ ...params, pageSize: 5 }))}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else if (contentType && (contentType.includes('application/xml') || contentType.includes('text/xml'))) {
        const text = await response.text();
        return { data: text }; // Pass raw XML for parsing
      }
      return { data: await response.text() }; // Fallback to text
    } catch (error) {
      console.error(`Proxied request failed for ${api}/${endpoint}:`, error, `Status: ${error.status || 500}`, `Headers: ${JSON.stringify(error.headers || {})}`);
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
};

export const fetchNews = async (asset: string): Promise<NewsData> => {
  try {
    const response = await fetchEvents('newsapi', 'top-headlines', {
      q: asset,
      category: 'business',
      pageSize: 5, // Limit results to reduce timeout risk
    });
    const data = response.data.articles || [];
    return {
      articles: data.map(article => ({
        title: article.title || 'No title',
        description: article.description || 'No description',
        url: article.url || '#',
      })),
    };
  } catch (error) {
    console.error(`Error fetching news for ${asset}:`, error);
    return fallbackNewsData[asset] || defaultNewsData;
  }
};

export const fetchOnChainData = async (asset: string): Promise<OnChainData> => {
  try {
    const response = await fetchEvents('coingecko', 'simple/price', {
      ids: asset.toLowerCase(),
      vs_currencies: 'usd', // Required parameter for CoinGecko
    });
    const data = response.data;
    return {
      price: data[asset.toLowerCase()]?.usd || 0,
      marketCap: data[asset.toLowerCase()]?.usd_market_cap || 0,
      volume: data[asset.toLowerCase()]?.usd_24h_vol || 0,
    };
  } catch (error) {
    console.error(`Error fetching on-chain data for ${asset} via CoinGecko:`, error);
    return fallbackOnChainData[asset] || defaultOnChainData;
  }
};

export const fetchSocialSentiment = async (asset: string): Promise<SentimentData> => {
  try {
    const response = await fetchEvents('reddit', 'r/CryptoCurrency.rss');
    const data = await parseRSS(response.data); // Parse XML data
    const sentimentScore = analyzeSentiment(data); // Custom sentiment logic
    return { score: Math.max(-1, Math.min(1, sentimentScore)) };
  } catch (error) {
    console.error(`Error fetching social sentiment for ${asset} from Reddit:`, error);
    return { score: 0 }; // Fallback to neutral
  }
};

// Placeholder functions for RSS parsing and sentiment analysis
const parseRSS = async (xml: string): Promise<any> => {
  // Requires xml2js (npm install xml2js)
  const { parseStringPromise } = await import('xml2js');
  const result = await parseStringPromise(xml);
  return result.rss?.channel?.[0]?.item || [];
};

const analyzeSentiment = (data: any): number => {
  // Custom logic to analyze sentiment from RSS items
  // Example: Count positive/negative keywords
  return 0; // Placeholder, replace with actual logic
};

export const calculateNewsSentiment = async (news: NewsData[], asset: string): Promise<SentimentData> => {
  try {
    const prompt = `Analyze the sentiment of the following news articles about ${asset}: ${JSON.stringify(news.articles)}. Return a score from -1 (negative) to 1 (positive).`;
    const response = await fetchEvents('openai', 'v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    const data = response.data;
    const sentimentScore = parseFloat(data.choices?.[0]?.message?.content || '0');
    return { score: Math.max(-1, Math.min(1, sentimentScore)) };
  } catch (error) {
    console.error(`Error calculating news sentiment for ${asset}:`, error);
    return { score: 0 }; // Fallback to neutral sentiment
  }
};

// Add fetchSentimentData to aggregate news and social sentiment
export const fetchSentimentData = async (asset: string): Promise<SentimentData> => {
  try {
    const news = await fetchNews(asset);
    const newsSentiment = await calculateNewsSentiment([news], asset);
    const socialSentiment = await fetchSocialSentiment(asset);
    
    // Combine sentiments (e.g., weighted average)
    const combinedScore = (newsSentiment.score * 0.6 + socialSentiment.score * 0.4);
    return { score: Math.max(-1, Math.min(1, combinedScore)) };
  } catch (error) {
    console.error(`Error fetching sentiment data for ${asset}:`, error);
    return { score: 0 }; // Fallback to neutral
  }
};

// Static price changes (used by SentimentSnapshot.tsx)
export const STATIC_PRICE_CHANGES: Record<string, number> = {
  BTC: 2.5,
  ETH: -1.3,
  USDT: 0.1,
};
