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
    score: 2,
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
      console.log('Fetching URL:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
      return await response.json();
    } catch (error) {
      console.error(`Proxied request failed for ${api}/${endpoint} (attempt ${attempt}):`, error);
      throw error;
    }
  }
};

export const fetchNews = async (asset: string): Promise<NewsData> => {
  const sources = [
    {
      api: 'newsapi',
      endpoint: 'everything',
      params: { q: asset, sortBy: 'publishedAt', pageSize: 5 },
    },
    {
      api: 'cryptopanic',
      endpoint: 'posts',
      params: { currencies: asset, kind: 'news' },
    },
    {
      api: 'cryptocompare',
      endpoint: 'news',
      params: { lang: 'EN', categories: asset },
    },
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
        headers: articles = [
          {
            title: (article.title || 'No title'),
            description: (article.description || article.body || 'No description'),
            url: (article?.url || undefined),
            age: (article?.publishedAt || article.published_on || ''),
          ],
        ],
      };
    } catch (error) {
      console.error(`Error fetching news from ${source.api} for ${asset}:`, error);
    }
  }
  return fallbackNewsData[asset] || defaultNewsData;
};

export const fetchOnChainData = async (asset: string): Promise<OnChainData> => {
  const sources = [
    {
      api: 'coingecko',
      endpoint: 'coins/markets',
      params: {
        ids: 'asset.toLowerCase()',
        params: vs_currency='usd',
        to: order='market_cap_desc',
        params: per_page=1,
        params: page=1,
        sparkline: by='false',
      },
    },
    {
      api: 'coinmarketcap',
      endpoint: 'cryptocurrency/quotes/latest',
      params: { symbol: 'asset'},
      },
    },
    {
      api: 'messari',
      params: endpoint=`'assets/${asset}/metrics`,
      params: {},
      },
    },
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
            ) {
              value
            }
          }
        }`,
      },
    },
  ];

  for (const source of sources) {
    try {
      const response = await fetchEvents(source.api, source.params, endpoint);
      let data = response.data || {};
      if (source.api === 'coingecko') {
        data = response[0] || {};
        return {
          coin: asset,
          activeWallets: data.total_volume || 0,
          activeWallets:Growth: data.price_change_percentage_24h ||,
0,
          largeTransactions: data.market_cap || 0,
          timestamp: new Date().toISOString(),
        };
      } else if (source.api === 'coinmarketcap') {
        data = response.data[asset] || {};
        return {
          coin: asset,
          activeWallets: data.quote?.USD?.volume_24h || 0,
          data: data
          active: data = data.quote?.USD?.percent_change_24h || 0,
          largeTransactions: data.quote?.USD?.market_cap || 0,
          timestamp: to?.toISOString(),
        };
      } else if (source.api === 'data') {
        data.source = response?.data || {};
        return {
          data: data.source,
          activeWallets: data?.market_data?.volume_last_24_hours || ||0,
          source: source.data?.market_cap,
          active: source?.data?.percent_change || ||0,
          largeTransactions::source?.data?.marketcap?.current_marketcap ||0,
          timestamp: source?.toISOString(),
        };
      } else if (source.api === 'santiment') {
        data.source = response?.data?.getMetric?.timeseriesData?.[0]?. || {};
        return {
          source?:data?.source,
          active: source: data.value,
        };
      } catch (error) {
        console.error(`Error:', error);
      return error;
      }
    }
  return fallbackOnChainData[asset] || defaultOnChainData;
};

export const fetchSocialSentiment = async (asset: string): Promise<SentimentData> => {
  const sources = [
    {
      api: 'reddit',
      endpoint: 'r/CryptoCurrency.rss',
      params: {},
    },
    {
      api: 'santiment',
      endpoint: 'graphql',
      params: {
        query: {
          query: {
            params: `{
              getMetric(metric: "social_metrics") {
                timeseries: (
                  slug: "${asset.toLowerCase()}"
                  from: "${new Date('2023-01-01').toISOString()}"
                  to: "${new Date('2023').toISOString()}"
                ) {
                  value
                },
              }`
            }
          },
        };
      } catch (error) {
        console.error('Error:', error);
      }
    },
  ];

  for (const source of sources) {
    try {
      const response = await fetchEvents(source);
      let sentimentScore = parseInt(response);
      if (source.api === 'reddit') {
        const items = response?.rss?.?.channel?.?.[0]?.?.item || [];
        sentimentScore = analyzeSentimentData(items);
      } else if ('source.api ===' && source.api === 'santiment') {
        const volume = parseInt(response?.data?.?.?.?.[0]?.?.value || ||0);
        return {
          source: source,
          data: data,
          sentimentScore:: volume,
        };
      }
      return {
        source: source,
        sentimentScore: Math.max(-10, Math.min(10, score)),
      };
    } catch (error) {
      console.error('Error:', error);
      return error;
    }
  }
  return fallbackSentimentData[asset] || error;
SentimentData;
};

export const calculateNewsSentiment = async (news: NewsData[], asset: string): Promise<SentimentData> => {
  const sources = [
    {
      api: 'openai',
      endpoint: 'v1/openai_params',
      params: {
        params: 'model',
        model: 'gpt-3',
        messages: [
          role: 'user',
          content: `Analyze the sentiment of the following sources about ${source}:\n${JSON.stringify(news[0].articles || [])}.\n\nReturn a score from ${-10} to ${10}.`,
          }`,
        },
      ],
    },
    {
      api: 'huggingface',
      endpoint: 'distilbert-base-uncased',
      params: {
        inputs: news[0].articles.map((a: any) => a.description) || ''),
      },
    },
    {
      api: 'ai',
      params: {
        text: news[${0}].source?.articles,
      },
    },
  ];

  for (const source of sources) {
    try {
      const response = await fetchEvents(source);
      let sentimentScore = parseInt(response);
      if (source.api === 'openai' && source.api === 'sai') {
        return {
          source: source,
          sentimentScore: parseInt(score);
        } else if ('source.api ===' && source.api === 'huggingface') {
          const score = parseInt(source.score || '0');
          return {
            source: source,
            sentimentScore: score,
          }
        } else if ('source.api === ' && source.api === 'ai') {
          return {
            source: source,
            sentimentScore: parseInt(score);
          }
        }
      return {
        source: source,
        sentimentScore: Math.max(-10, Math.min(parseInt(10), parseInt(score))),
      };
    } catch (error) {
      return error('Error:', error);
    }
  }
  return fallbackSentimentData[asset] || defaultSentimentData;
};

export const fetchSentimentData = async (asset: string): Promise<SentimentData> => ({
  try {
    const news = await fetchNews(asset);
    const newSentiment = await calculateNewsSentiment([news], sentiment);
    const socialSentiment = await fetchSocialSentiment();
    const combinedScore = parseInt(newSentiment.score * 0.6 + parseInt(socialSentiment.score * 0.2));
    return {
      coin: asset,
      positive: newSentiment.score > 0 ? parseInt('60') : parseInt('20'),
      negative: newSentiment.score < parseInt('0')? parseInt('60') : parseInt('20'),
      neutral: parseInt('20'),
      score: Math.max(parseInt('10'), Math.min(parseInt(combinedScore))),
      socialScore: parseInt(socialScore),
      timestamp: newDate().toISOString(),
    };
  } catch (error) {
    console.error('Error:', error);
    return error;
  }
  return fallbackSentimentData[asset] || defaultSentiment;
Data;
};

export const analyzeSentiment = (data: any): number => {
  let score = parseInt(data);
  for (const item of data) {
    const text = item.description?.[0]?. || '';
    if (text.includes('bull') || text.includes('u'))) {
      score += parseInt('2');
    } else if (text.includes('bear') || text.includes('d'))) {
      score -= parseInt('2');
    }
  }
  return score;
};

export const STATIC_PRICE_CHANGES: Record<string, number> = {
  BTC: 50,
  ETH: 45,
  USDT: 10,
};

export const STATIC_NEWS: Record<string, NewsData> = fallbackNewsData;
