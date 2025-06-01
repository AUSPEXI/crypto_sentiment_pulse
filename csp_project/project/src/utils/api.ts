import { NewsData, OnChainData, SentimentData } from './types';

// Fallback data
const defaultNewsData: NewsData = { articles: [] };
const fallbackNewsData: Record<string, NewsData> = {
  BTC: {
    articles: [
      { title: 'BTC Market Surge', description: 'Bitcoin experiences a significant price increase.', url: '#', publishedAt: '2025-06-01T12:00:00Z' },
      { title: 'New BTC Protocol Update', description: 'A major update to Bitcoin’s protocol is announced.', url: '#', publishedAt: '2025-06-01T14:00:00Z' },
      { title: 'BTC Adoption Grows', description: 'More companies adopt Bitcoin for transactions.', url: '#', publishedAt: '2025-06-01T16:00:00Z' },
    ],
  },
  ETH: {
    articles: [
      { title: 'ETH Scaling Solution Launched', description: 'Ethereum introduces a new scaling solution.', url: '#', publishedAt: '2025-06-01T12:00:00Z' },
      { title: 'ETH DeFi Boom', description: 'Decentralized finance on Ethereum sees growth.', url: '#', publishedAt: '2025-06-01T14:00:00Z' },
      { title: 'ETH Network Upgrade', description: 'Ethereum network undergoes a successful upgrade.', url: '#', publishedAt: '2025-06-01T16:00:00Z' },
    ],
  },
  USDT: {
    articles: [
      { title: 'USDT Stability Report', description: 'Tether maintains its 1:1 USD peg.', url: '#', publishedAt: '2025-06-01T12:00:00Z' },
      { title: 'USDT Usage Increases', description: 'Tether sees higher transaction volume.', url: '#', publishedAt: '2025-06-01T14:00:00Z' },
      { title: 'USDT Regulatory Update', description: 'New regulations affect Tether.', url: '#', publishedAt: '2025-06-01T16:00:00Z' },
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
  BTC: { coin: 'BTC', positive: 40, negative: 20, neutral: 40, score: 2, socialScore: 3, timestamp: '2025-06-01T12:00:00Z' },
  ETH: { coin: 'ETH', positive: 50, negative: 30, neutral: 20, score: 1, socialScore: 2, timestamp: '2025-06-01T12:00:00Z' },
  USDT: { coin: 'USDT', positive: 30, negative: 10, neutral: 60, score: 3, socialScore: 4, timestamp: '2025-06-01T12:00:00Z' },
};
const defaultOnChainData: OnChainData = {
  coin: '',
  activeWallets: 0,
  activeWalletsGrowth: 0,
  largeTransactions: 0,
  timestamp: '',
};
export const fallbackOnChainData: Record<string, OnChainData> = {
  BTC: { coin: 'BTC', activeWallets: 150000, activeWalletsGrowth: 5.2, largeTransactions: 250, timestamp: '2025-06-01T12:00:00Z' },
  ETH: { coin: 'ETH', activeWallets: 120000, activeWalletsGrowth: 3.8, largeTransactions: 180, timestamp: '2025-06-01T12:00:00Z' },
  USDT: { coin: 'USDT', activeWallets: 90000, activeWalletsGrowth: 2.5, largeTransactions: 300, timestamp: '2025-06-01T12:00:00Z' },
};

export const fetchEvents = async (api: string, endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/api/proxy?api=${api}&endpoint=${endpoint}${queryParams ? `&params=${encodeURIComponent(JSON.stringify(params))}` : ''}`;
      console.log('Fetching URL:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
      return await response.json();
    } catch (error) {
      console.error(`Proxied request failed for ${api}/${endpoint} (attempt ${attempt}):`, error);
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const fetchNews = async (asset: string): Promise<NewsData> => {
  try {
    const sources = [
      { api: 'newsapi', endpoint: 'everything', params: { q: asset, sortBy: 'publishedAt', pageSize: 5 } },
      { api: 'cryptopanic', endpoint: 'posts', params: { currencies: asset, kind: 'news' } },
      { api: 'cryptocompare', endpoint: 'news', params: { lang: 'EN', categories: asset } },
    ];

    for (const source of sources) {
      try {
        const response = await fetchEvents(source.api, source.endpoint, source.params);
        let articles = [];
        if (source.api === 'newsapi') {
          articles = response.articles || [];
        } else if (source.api === 'cryptopanic') {
          articles = response.results || [];
        } else if (source.api === 'cryptocompare') {
          articles = response.Data || [];
        }
        return {
          articles: articles.map((article: any) => ({
            title: article.title || 'No title',
            description: article.description || article.body || 'No description',
            url: article.url || '#',
            publishedAt: article.publishedAt || article.published_on || new Date().toISOString(),
          })),
        };
      } catch (error) {
        console.error(`Error fetching news from ${source.api} for ${asset}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to fetch news for ${asset}:`, error);
  }
  return fallbackNewsData[asset] || defaultNewsData;
};

export const fetchOnChainData = async (asset: string): Promise<OnChainData> => {
  try {
    const sources = [
      {
        api: 'coingecko',
        endpoint: 'coins/markets',
        params: { ids: asset.toLowerCase(), vs_currency: 'usd', order: 'market_cap_desc', per_page: 1, page: 1, sparkline: false },
      },
      { api: 'coinmarketcap', endpoint: 'cryptocurrency/quotes/latest', params: { symbol: asset } },
      { api: 'messari', endpoint: `assets/${asset.toLowerCase()}/metrics`, params: {} },
      {
        api: 'santiment',
        endpoint: 'graphql',
        params: {
          query: `{
            getMetric(metric: "active_addresses_24h") {
              timeseriesData(
                slug: "${asset.toLowerCase()}"
                from: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
                to: "${new Date().toISOString()}"
                interval: "1d"
              ) { value }
            }
          }`,
        },
      },
    ];

    for (const source of sources) {
      try {
        const response = await fetchEvents(source.api, source.endpoint, source.params);
        let data = {};
        if (source.api === 'coingecko') {
          data = response[0] || {};
          return {
            coin: asset,
            activeWallets: data.total_volume || 0,
            activeWalletsGrowth: data.price_change_percentage_24h || 0,
            largeTransactions: data.market_cap || 0,
            timestamp: new Date().toISOString(),
          };
        } else if (source.api === 'coinmarketcap') {
          data = response.data[asset] || {};
          return {
            coin: asset,
            activeWallets: data.quote?.USD?.volume_24h || 0,
            activeWalletsGrowth: data.quote?.USD?.percent_change_24h || 0,
            largeTransactions: data.quote?.USD?.market_cap || 0,
            timestamp: new Date().toISOString(),
          };
        } else if (source.api === 'messari') {
          data = response.data || {};
          return {
            coin: asset,
            activeWallets: data.market_data?.volume_last_24_hours || 0,
            activeWalletsGrowth: data.market_data?.percent_change_usd_last_24_hours || 0,
            largeTransactions: data.market_data?.marketcap?.current_marketcap_usd || 0,
            timestamp: new Date().toISOString(),
          };
        } else if (source.api === 'santiment') {
          data = response.data?.getMetric?.timeseriesData?.[0] || {};
          return {
            coin: asset,
            activeWallets: data.value || 0,
            activeWalletsGrowth: 0,
            largeTransactions: 0,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.error(`Error fetching on-chain data from ${source.api} for ${asset}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to fetch on-chain data for ${asset}:`, error);
  }
  return fallbackOnChainData[asset] || defaultOnChainData;
};

export const fetchSocialSentiment = async (asset: string): Promise<SentimentData> => {
  try {
    const sources = [
      { api: 'reddit', endpoint: 'r/CryptoCurrency.rss', params: {} },
      {
        api: 'santiment',
        endpoint: 'graphql',
        params: {
          query: `{
            getMetric(metric: "social_volume_total") {
              timeseriesData(
                slug: "${asset.toLowerCase()}"
                from: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
                to: "${new Date().toISOString()}"
                interval: "1d"
              ) { value }
            }
          }`,
        },
      },
    ];

    for (const source of sources) {
      try {
        const response = await fetchEvents(source.api, source.endpoint, source.params);
        let sentimentScore = 0;
        if (source.api === 'reddit') {
          const items = response.rss?.channel?.[0]?.item || [];
          sentimentScore = analyzeSentiment(items);
        } else if (source.api === 'santiment') {
          const volume = response.data?.getMetric?.timeseriesData?.[0]?.value || 0;
          sentimentScore = volume > 100 ? 5 : volume > 50 ? 2 : 0;
        }
        return {
          coin: asset,
          positive: sentimentScore > 0 ? 60 : 20,
          negative: sentimentScore < 0 ? 60 : 20,
          neutral: 20,
          score: Math.max(-10, Math.min(10, sentimentScore)),
          socialScore: sentimentScore,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Error fetching social sentiment from ${source.api} for ${asset}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to fetch social sentiment for ${asset}:`, error);
  }
  return fallbackSentimentData[asset] || defaultSentimentData;
};

export const calculateNewsSentiment = async (news: NewsData[], asset: string): Promise<SentimentData> => {
  try {
    const sources = [
      {
        api: 'openai',
        endpoint: 'v1/chat/completions',
        params: {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Analyze the sentiment of the following news articles about ${asset}: ${JSON.stringify(news[0].articles || [])}. Return a score from -10 (negative) to 10 (positive).`,
            },
          ],
        },
      },
      {
        api: 'huggingface',
        endpoint: 'distilbert-base-uncased-finetuned-sst-2-english',
        params: { inputs: news[0].articles.map((a: any) => a.description).join(' ') },
      },
      {
        api: 'local-sentiment',
        endpoint: '',
        params: { text: news[0].articles.map((a: any) => a.description).join(' ') },
      },
    ];

    for (const source of sources) {
      try {
        const response = await fetchEvents(source.api, source.endpoint, source.params);
        let sentimentScore = 0;
        if (source.api === 'openai') {
          sentimentScore = parseFloat(response.choices?.[0]?.message?.content || '0');
        } else if (source.api === 'huggingface') {
          const score = response[0]?.score || 0;
          sentimentScore = response[0]?.label === 'POSITIVE' ? score * 10 : -score * 10;
        } else if (source.api === 'local-sentiment') {
          sentimentScore = response.score || 0;
        }
        return {
          coin: asset,
          positive: sentimentScore > 0 ? 60 : 20,
          negative: sentimentScore < 0 ? 60 : 20,
          neutral: 20,
          score: Math.max(-10, Math.min(10, sentimentScore)),
          socialScore: 0,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Error calculating news sentiment from ${source.api} for ${asset}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to calculate news sentiment for ${asset}:`, error);
  }
  return fallbackSentimentData[asset] || defaultSentimentData;
};

export const fetchSentimentData = async (asset: string): Promise<SentimentData> => {
  try {
    const news = await fetchNews(asset);
    const newsSentiment = await calculateNewsSentiment([news], asset);
    const socialSentiment = await fetchSocialSentiment(asset);
    const combinedScore = newsSentiment.score * 0.6 + socialSentiment.score * 0.4;
    return {
      coin: asset,
      positive: combinedScore > 0 ? 60 : 20,
      negative: combinedScore < 0 ? 60 : 20,
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

const analyzeSentiment = (data: any): number => {
  let score = 0;
  for (const item of data) {
    const text = item.description?.[0] || '';
    if (text.includes('bullish') || text.includes('up')) score += 2;
    if (text.includes('bearish') || text.includes('down')) score -= 2;
  }
  return score;
};

export const STATIC_PRICE_CHANGES: Record<string, number> = {
  BTC: 2.5,
  ETH: -1.3,
  USDT: 0.1,
};

export const STATIC_NEWS: Record<string, NewsData> = fallbackNewsData;
