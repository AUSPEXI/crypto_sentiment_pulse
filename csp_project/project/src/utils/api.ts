src/utils/api.ts
import axios from 'axios';
import { SentimentData, OnChainData, Event } from '../types';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 60000;
const MAX_RETRY_DELAY = 300000;

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

// Static fallback data (used as a last resort)
const FALLBACK_ONCHAIN_DATA: Record<string, OnChainData> = {
  'BTC': { coin: 'BTC', activeWallets: 900000, activeWalletsGrowth: 2.1, largeTransactions: 1500, timestamp: '2025-05-21T22:00:00Z' },
  'ETH': { coin: 'ETH', activeWallets: 600000, activeWalletsGrowth: 1.5, largeTransactions: 1200, timestamp: '2025-05-21T22:00:00Z' },
  'SOL': { coin: 'SOL', activeWallets: 200000, activeWalletsGrowth: -0.5, largeTransactions: 800, timestamp: '2025-05-21T22:00:00Z' },
  'USDT': { coin: 'USDT', activeWallets: 500000, activeWalletsGrowth: 0.8, largeTransactions: 2000, timestamp: '2025-05-21T22:00:00Z' },
  'BNB': { coin: 'BNB', activeWallets: 300000, activeWalletsGrowth: 1.2, largeTransactions: 900, timestamp: '2025-05-21T22:00:00Z' },
  'USDC': { coin: 'USDC', activeWallets: 450000, activeWalletsGrowth: 0.5, largeTransactions: 1800, timestamp: '2025-05-21T22:00:00Z' },
  'XRP': { coin: 'XRP', activeWallets: 250000, activeWalletsGrowth: -0.2, largeTransactions: 700, timestamp: '2025-05-21T22:00:00Z' },
  'DOGE': { coin: 'DOGE', activeWallets: 150000, activeWalletsGrowth: 0.3, largeTransactions: 500, timestamp: '2025-05-21T22:00:00Z' },
  'TON': { coin: 'TON', activeWallets: 100000, activeWalletsGrowth: 0.7, largeTransactions: 400, timestamp: '2025-05-21T22:00:00Z' },
  'ADA': { coin: 'ADA', activeWallets: 200000, activeWalletsGrowth: -0.1, largeTransactions: 600, timestamp: '2025-05-21T22:00:00Z' },
  'TRX': { coin: 'TRX', activeWallets: 180000, activeWalletsGrowth: 0.4, largeTransactions: 550, timestamp: '2025-05-21T22:00:00Z' },
  'AVAX': { coin: 'AVAX', activeWallets: 120000, activeWalletsGrowth: 0.6, largeTransactions: 450, timestamp: '2025-05-21T22:00:00Z' },
  'SHIB': { coin: 'SHIB', activeWallets: 80000, activeWalletsGrowth: 0.9, largeTransactions: 300, timestamp: '2025-05-21T22:00:00Z' },
  'LINK': { coin: 'LINK', activeWallets: 90000, activeWalletsGrowth: 0.2, largeTransactions: 350, timestamp: '2025-05-21T22:00:00Z' },
  'BCH': { coin: 'BCH', activeWallets: 110000, activeWalletsGrowth: -0.3, largeTransactions: 400, timestamp: '2025-05-21T22:00:00Z' },
  'DOT': { coin: 'DOT', activeWallets: 130000, activeWalletsGrowth: 0.5, largeTransactions: 500, timestamp: '2025-05-21T22:00:00Z' },
  'NEAR': { coin: 'NEAR', activeWallets: 95000, activeWalletsGrowth: 0.1, largeTransactions: 320, timestamp: '2025-05-21T22:00:00Z' },
  'LTC': { coin: 'LTC', activeWallets: 140000, activeWalletsGrowth: -0.4, largeTransactions: 600, timestamp: '2025-05-21T22:00:00Z' },
  'MATIC': { coin: 'MATIC', activeWallets: 160000, activeWalletsGrowth: 0.3, largeTransactions: 700, timestamp: '2025-05-21T22:00:00Z' },
  'PEPE': { coin: 'PEPE', activeWallets: 70000, activeWalletsGrowth: 1.0, largeTransactions: 200, timestamp: '2025-05-21T22:00:00Z' }
};

const SUPPORTED_COINS = {
  'BTC': { cryptoPanic: 'BTC', coinMetrics: 'btc' },
  'ETH': { cryptoPanic: 'ETH', coinMetrics: 'eth' },
  'SOL': { cryptoPanic: 'SOL', coinMetrics: 'sol' },
  'USDT': { cryptoPanic: 'USDT', coinMetrics: 'usdt' },
  'BNB': { cryptoPanic: 'BNB', coinMetrics: 'bnb' },
  'USDC': { cryptoPanic: 'USDC', coinMetrics: 'usdc' },
  'XRP': { cryptoPanic: 'XRP', coinMetrics: 'xrp' },
  'DOGE': { cryptoPanic: 'DOGE', coinMetrics: 'doge' },
  'TON': { cryptoPanic: 'TON', coinMetrics: 'ton' },
  'ADA': { cryptoPanic: 'ADA', coinMetrics: 'ada' },
  'TRX': { cryptoPanic: 'TRX', coinMetrics: 'trx' },
  'AVAX': { cryptoPanic: 'AVAX', coinMetrics: 'avax' },
  'SHIB': { cryptoPanic: 'SHIB', coinMetrics: 'shib' },
  'LINK': { cryptoPanic: 'LINK', coinMetrics: 'link' },
  'BCH': { cryptoPanic: 'BCH', coinMetrics: 'bch' },
  'DOT': { cryptoPanic: 'DOT', coinMetrics: 'dot' },
  'NEAR': { cryptoPanic: 'NEAR', coinMetrics: 'near' },
  'LTC': { cryptoPanic: 'LTC', coinMetrics: 'ltc' },
  'MATIC': { cryptoPanic: 'MATIC', coinMetrics: 'matic' },
  'PEPE': { cryptoPanic: 'PEPE', coinMetrics: 'pepe' }
};

// AI-powered fallback for on-chain data using OpenAI
const fetchAIFallbackOnChainData = async (coin: string): Promise<OnChainData> => {
  const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;
  console.log('[AI Fallback] OpenAI API Key loaded:', openAiKey ? 'Yes' : 'No');
  if (!openAiKey) {
    console.warn(`[AI Fallback] OpenAI API key not configured, using static fallback for ${coin}`);
    return FALLBACK_ONCHAIN_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }

  try {
    console.log(`[AI Fallback] Generating on-chain data for ${coin} using OpenAI`);
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a crypto data analyst. Provide estimated on-chain metrics for a given cryptocurrency.'
          },
          {
            role: 'user',
            content: `Estimate the active wallets, active wallet growth (%), and large transactions for ${coin} as of today, May 21, 2025. Base your estimate on typical trends for this coin. Return the response in the format: "Active Wallets: X, Growth: Y, Large Transactions: Z".`
          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log(`[AI Fallback] OpenAI response for ${coin}:`, aiResponse);

    // Parse the AI response
    const activeWalletsMatch = aiResponse.match(/Active Wallets: (\d+)/);
    const growthMatch = aiResponse.match(/Growth: ([-]?\d+\.\d+)/);
    const transactionsMatch = aiResponse.match(/Large Transactions: (\d+)/);

    const activeWallets = activeWalletsMatch ? parseInt(activeWalletsMatch[1]) : 0;
    const activeWalletsGrowth = growthMatch ? parseFloat(growthMatch[1]) : 0;
    const largeTransactions = transactionsMatch ? parseInt(transactionsMatch[1]) : 0;

    if (activeWallets === 0 && activeWalletsGrowth === 0 && largeTransactions === 0) {
      console.warn(`[AI Fallback] Failed to parse meaningful data for ${coin}, using static fallback`);
      return FALLBACK_ONCHAIN_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
    }

    return {
      coin,
      activeWallets,
      activeWalletsGrowth,
      largeTransactions,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error(`[AI Fallback] Error generating on-chain data for ${coin}:`, error.message);
    return FALLBACK_ONCHAIN_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }
};

// AI-powered sentiment analysis using Hugging Face
const fetchAISentimentData = async (news: Event[]): Promise<SentimentData> => {
  const huggingFaceKey = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;
  console.log('[AI Sentiment] Hugging Face API Key loaded:', huggingFaceKey ? 'Yes' : 'No');
  if (!huggingFaceKey) {
    console.warn('[AI Sentiment] Hugging Face API key not configured, returning neutral sentiment');
    return { coin: news[0]?.coin || 'UNKNOWN', positive: 33.33, negative: 33.33, neutral: 33.33, score: 50, timestamp: new Date().toISOString() };
  }

  if (!news || news.length === 0) {
    console.warn('[AI Sentiment] No news data available for sentiment analysis');
    return { coin: 'UNKNOWN', positive: 33.33, negative: 33.33, neutral: 33.33, score: 50, timestamp: new Date().toISOString() };
  }

  try {
    console.log('[AI Sentiment] Analyzing sentiment using Hugging Face');
    const textToAnalyze = news.map(event => event.title + ' ' + event.description).join(' ').slice(0, 512);
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
      { inputs: textToAnalyze },
      {
        headers: {
          'Authorization': `Bearer ${huggingFaceKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const sentiment = response.data[0];
    console.log('[AI Sentiment] Hugging Face response:', sentiment);

    const positiveScore = sentiment.find((s: any) => s.label === 'POSITIVE')?.score || 0;
    const negativeScore = sentiment.find((s: any) => s.label === 'NEGATIVE')?.score || 0;
    const total = positiveScore + negativeScore;

    if (total === 0) {
      console.warn('[AI Sentiment] No meaningful sentiment scores, returning neutral');
      return { coin: news[0]?.coin || 'UNKNOWN', positive: 33.33, negative: 33.33, neutral: 33.33, score: 50, timestamp: new Date().toISOString() };
    }

    const positive = (positiveScore / total) * 100;
    const negative = (negativeScore / total) * 100;
    const score = (positiveScore * 100) - (negativeScore * 100);

    return {
      coin: news[0]?.coin || 'UNKNOWN',
      positive,
      negative,
      neutral: 100 - positive - negative,
      score: (score + 100) / 2,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[AI Sentiment] Error analyzing sentiment:', error.message);
    return { coin: news[0]?.coin || 'UNKNOWN', positive: 33.33, negative: 33.33, neutral: 33.33, score: 50, timestamp: new Date().toISOString() };
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const events = await fetchEvents();
  const coinEvents = events.filter(event => event.coin === coin);
  if (coinEvents.length === 0) {
    console.warn(`[Sentiment] No events found for ${coin}, returning neutral sentiment`);
    return { coin, positive: 33.33, negative: 33.33, neutral: 33.33, score: 50, timestamp: new Date().toISOString() };
  }
  return fetchAISentimentData(coinEvents);
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) {
    console.warn(`[OnChain] Unsupported coin: ${coin}, using AI fallback`);
    return fetchAIFallbackOnChainData(coin);
  }

  const coinSymbol = coinConfig.coinMetrics;
  const endTime = new Date().toISOString().split('T')[0];
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[OnChain] Fetching on-chain data for ${coin} (Attempt ${attempt}/${MAX_RETRIES})`);
      
      const response = await axios.get('https://community-api.coinmetrics.io/v4/timeseries/asset-metrics', {
        params: {
          assets: coinSymbol.toLowerCase(),
          metrics: 'AdrActCnt,TxCnt',
          frequency: '1d',
          page_size: 2,
          start_time: startTime,
          end_time: endTime
        },
        timeout: 20000
      });

      console.log(`[OnChain] CoinMetrics raw response for ${coin}:`, response.data);

      if (!response.data?.data || response.data.data.length < 2) {
        console.warn(`[OnChain] Insufficient data for ${coin}, using AI fallback`);
        return fetchAIFallbackOnChainData(coin);
      }

      const metrics = response.data.data;
      const currentWallets = parseInt(metrics[1].AdrActCnt) || 0;
      const previousWallets = parseInt(metrics[0].AdrActCnt) || 0;
      const growth = previousWallets > 0 ? ((currentWallets - previousWallets) / previousWallets) * 100 : 0;

      return {
        coin,
        activeWallets: currentWallets,
        activeWalletsGrowth: growth,
        largeTransactions: parseInt(metrics[1].TxCnt) || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`[OnChain] Error fetching on-chain data for ${coin} (Attempt ${attempt}):`, {
        message: error.message,
        status: error.response?.status,
        data: JSON.stringify(error.response?.data) || error.message
      });

      if (error.response?.status === 400) {
        console.warn(`[OnChain] Invalid request for ${coin}, using AI fallback`);
        return fetchAIFallbackOnChainData(coin);
      }

      if ((error.response?.status === 429 || isNetworkError(error)) && attempt < MAX_RETRIES) {
        const retryDelay = getRetryDelay(attempt) + Math.random() * 1000;
        console.log(`[OnChain] Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
        continue;
      }

      if (attempt === MAX_RETRIES) {
        console.warn(`[OnChain] Max retries reached for ${coin}, using AI fallback`);
        return fetchAIFallbackOnChainData(coin);
      }
    }
  }

  console.warn(`[OnChain] Failed to fetch on-chain data for ${coin}, using AI fallback`);
  return fetchAIFallbackOnChainData(coin);
};

export const fetchEvents = async (): Promise<Event[]> => {
  const apiToken = import.meta.env.VITE_CRYPTOPANIC_API_TOKEN;
  console.log('[Events] CryptoPanic API Token loaded:', apiToken ? 'Yes' : 'No');
  if (!apiToken) {
    console.warn('[Events] CryptoPanic API token not configured, returning empty events');
    return [];
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Events] Fetching events (Attempt ${attempt}/${MAX_RETRIES})`);
      
      const response = await axios.get('/.netlify/functions/proxy', {
        params: {
          url: 'https://cryptopanic.com/api/v1/posts',
          auth_token: apiToken,
          public: 'true',
          filter: 'hot',
          currencies: Object.keys(SUPPORTED_COINS).join(',')
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: 20000
      });

      if (!response.data || typeof response.data !== 'object') {
        console.error('[Events] Invalid response format:', response.data);
        throw new Error('Invalid API response format');
      }

      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        console.error('[Events] Received HTML instead of JSON');
        throw new Error('Invalid API response: received HTML instead of JSON');
      }

      console.log('[Events] CryptoPanic raw response:', response.data);

      if (!Array.isArray(response.data.results)) {
        console.error('[Events] Invalid response structure:', response.data);
        return [];
      }

      return response.data.results.map((post: any) => ({
        id: (post.id || Date.now()).toString(),
        coin: Array.isArray(post.currencies) && post.currencies[0]?.code ? post.currencies[0].code : 'UNKNOWN',
        date: post.published_at || new Date().toISOString(),
        title: post.title || 'No title available',
        description: post.text || post.title || 'No description available',
        eventType: post.kind || 'News'
      }));
    } catch (error: any) {
      console.error(`[Events] Error fetching events (Attempt ${attempt}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        console.warn('[Events] Invalid CryptoPanic API token, returning empty events');
        return [];
      }

      if ((error.response?.status === 429 || isNetworkError(error)) && attempt < MAX_RETRIES) {
        const retryDelay = getRetryDelay(attempt) + Math.random() * 1000;
        console.log(`[Events] Retrying in ${retryDelay}ms due to rate limit or network issue...`);
        await delay(retryDelay);
        continue;
      }

      if (attempt === MAX_RETRIES) {
        console.warn('[Events] Max retries reached, returning empty events');
        return [];
      }
    }
  }

  console.warn('[Events] Failed to fetch events after retries, returning empty events');
  return [];
};
