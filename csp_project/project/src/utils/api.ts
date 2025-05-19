import axios from 'axios';
import { SentimentData, OnChainData, Event } from '../types';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 60000; // 1 minute
const MAX_RETRY_DELAY = 300000; // 5 minutes

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isNetworkError = (error: any): boolean => {
  return !error.response || 
    error.code === 'ECONNABORTED' || 
    error.message.includes('Network Error') ||
    (error.code && error.code.includes('ECONN'));
};

const getRetryDelay = (attempt: number): number => {
  return Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
};

const SUPPORTED_COINS = {
  'BTC': { coingecko: 'bitcoin', cryptoPanic: 'bitcoin', coinMetrics: 'btc', xQuery: 'BTC OR Bitcoin' },
  'ETH': { coingecko: 'ethereum', cryptoPanic: 'ethereum', coinMetrics: 'eth', xQuery: 'ETH OR Ethereum' },
  'SOL': { coingecko: 'solana', cryptoPanic: 'solana', coinMetrics: 'solana', xQuery: 'SOL OR Solana' }
};

// Fetch social sentiment from X and analyze with Hugging Face
const fetchSocialSentiment = async (coin: string): Promise<{ positive: number, negative: number, neutral: number }> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  const bearerToken = import.meta.env.VITE_X_BEARER_TOKEN;
  console.log('X Bearer Token (first 5 chars):', bearerToken?.substring(0, 5) || 'Not found');
  if (!bearerToken) throw new Error('X Bearer Token not configured');

  const query = coinConfig.xQuery;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching X posts for ${coin} (Attempt ${attempt}/${MAX_RETRIES})`);
      const response = await axios.get('https://api.x.com/2/tweets/search/recent', {
        params: {
          query: `${query} -is:retweet lang:en`,
          max_results: 10
        },
        headers: {
          Authorization: `Bearer ${bearerToken}`
        },
        timeout: 20000
      });
      console.log(`X API response for ${coin}:`, response.data);
      if (!response.data?.data) throw new Error(`No tweets found for ${coin}`);

      const tweets = response.data.data.map((tweet: any) => tweet.text);

      // Analyze sentiment with Hugging Face
      let positive = 0, negative = 0, neutral = 0;
      for (const tweet of tweets) {
        try {
          const sentimentResponse = await axios.post('https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english', {
            inputs: tweet
          }, {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_TOKEN || 'hf_free_tier'}`
            },
            timeout: 10000
          });
          console.log(`Hugging Face sentiment for tweet:`, sentimentResponse.data);
          const scores = sentimentResponse.data[0];
          const label = scores.reduce((a: any, b: any) => (a.score > b.score ? a : b)).label;
          if (label === 'POSITIVE') positive++;
          else if (label === 'NEGATIVE') negative++;
          else neutral++;
        } catch (error: any) {
          console.error(`Error analyzing tweet sentiment:`, error.message);
        }
      }

      const total = positive + negative + neutral;
      if (total === 0) throw new Error('No valid sentiment analysis results');
      return {
        positive: (positive / total) * 100,
        negative: (negative / total) * 100,
        neutral: (neutral / total) * 100
      };
    } catch (error: any) {
      console.error(`Error fetching X posts for ${coin} (Attempt ${attempt}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data?.substring(0, 200)
      });
      if (attempt === MAX_RETRIES) throw new Error(`Failed to fetch X posts for ${coin}: ${error.message}`);
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }
  throw new Error(`Failed to fetch X posts for ${coin}`);
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  const coinId = coinConfig.coingecko;
  let marketSentiment = 50, socialSentiment = 50;

  // Fetch market sentiment from CoinGecko
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching market data for ${coin} (Attempt ${attempt}/${MAX_RETRIES}) with ID: ${coinId}`);
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
        params: {
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        },
        timeout: 20000
      });
      console.log(`CoinGecko raw response for ${coin}:`, response.data);
      if (!response.data?.market_data) throw new Error(`No market data for ${coin}`);
      const data = response.data.market_data;
      const priceChange24h = data.price_change_percentage_24h || 0;
      marketSentiment = priceChange24h > 0 ? Math.min(75, 50 + priceChange24h * 2.5) : Math.max(25, 50 - Math.abs(priceChange24h) * 2.5);
      break;
    } catch (error: any) {
      console.error(`Error fetching market data for ${coin} (Attempt ${attempt}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data?.substring(0, 200)
      });
      if (attempt === MAX_RETRIES) throw new Error(`Failed to fetch market data for ${coin}: ${error.message}`);
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }

  // Fetch social sentiment from X
  let socialData = { positive: 50, negative: 50, neutral: 0 };
  try {
    socialData = await fetchSocialSentiment(coin);
    socialSentiment = socialData.positive;
  } catch (error: any) {
    console.error(`Failed to fetch social sentiment for ${coin}, using default:`, error.message);
  }

  // Combine market and social sentiment (weighted average)
  const finalScore = (marketSentiment * 0.4 + socialSentiment * 0.6); // More weight to social sentiment
  return {
    coin,
    positive: Math.max(0, Math.min(100, finalScore)),
    negative: Math.max(0, Math.min(100, 100 - finalScore)),
    neutral: 0,
    score: finalScore,
    timestamp: new Date().toISOString()
  };
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  const coinSymbol = coinConfig.coinMetrics;
  const endTime = new Date().toISOString().split('T')[0];
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching on-chain data for ${coin} (Attempt ${attempt}/${MAX_RETRIES})`);
      const response = await axios.get('https://community-api.coinmetrics.io/v4/timeseries/asset-metrics', {
        params: { assets: coinSymbol.toLowerCase(), metrics: 'AdrActCnt,TxCnt', frequency: '1d', page_size: 2, start_time: startTime, end_time: endTime },
        timeout: 20000
      });
      console.log(`CoinMetrics response for ${coin}:`, response.data);
      if (!response.data?.data || response.data.data.length < 2) throw new Error(`Insufficient data for ${coin}`);
      const metrics = response.data.data;
      const currentWallets = parseInt(metrics[1].AdrActCnt) || 0;
      const previousWallets = parseInt(metrics[0].AdrActCnt) || 0;
      const growth = previousWallets > 0 ? ((currentWallets - previousWallets) / previousWallets) * 100 : 0;
      return { coin, activeWallets: currentWallets, activeWalletsGrowth: growth, largeTransactions: parseInt(metrics[1].TxCnt) || 0, timestamp: new Date().toISOString() };
    } catch (error: any) {
      console.error(`Error fetching on-chain data for ${coin} (Attempt ${attempt}):`, { message: error.message, status: error.response?.status });
      if (attempt === MAX_RETRIES) throw new Error(`Failed to fetch on-chain data for ${coin}: ${error.message}`);
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }
  throw new Error(`Failed to fetch on-chain data for ${coin}`);
};

export const fetchEvents = async (): Promise<Event[]> => {
  const apiToken = import.meta.env.VITE_CRYPTOPANIC_API_TOKEN;
  console.log('CryptoPanic API Token (first 5 chars):', apiToken?.substring(0, 5) || 'Not found');
  if (!apiToken) throw new Error('CryptoPanic API token not configured');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching events (Attempt ${attempt}/${MAX_RETRIES})`);
      const response = await axios.get(`https://cryptopanic.com/api/v1/posts/?auth_token=${apiToken}&public=true&filter=hot¤cies=BTC,ETH`, {
        timeout: 20000
      });
      console.log(`CryptoPanic raw response:`, response.data);
      if (!response.data?.results) throw new Error('Invalid response format from CryptoPanic API');
      return response.data.results.map((post: any) => ({
        id: post.id.toString(),
        coin: post.currencies?.[0]?.code || 'UNKNOWN',
        date: post.published_at,
        title: post.title,
        description: post.excerpt || '',
        eventType: post.kind || 'News'
      }));
    } catch (error: any) {
      console.error(`Error fetching events (Attempt ${attempt}):`, { message: error.message, status: error.response?.status, data: error.response?.data?.substring(0, 200) });
      if (attempt === MAX_RETRIES) throw new Error(`Failed to fetch event data: ${error.message}`);
      if (error.response?.status === 429 || isNetworkError(error)) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
      }
    }
  }
  throw new Error('Failed to fetch event data');
};
