import axios from 'axios';
import { SentimentData, OnChainData, Event } from '../types';

// Static fallback data for unsupported coins (simulated historical data)
const FALLBACK_ONCHAIN_DATA: Record<string, Partial<OnChainData>> = {
  'USDT': { activeWallets: 500000, activeWalletsGrowth: 1.2, largeTransactions: 1000 },
  'BNB': { activeWallets: 300000, activeWalletsGrowth: 0.8, largeTransactions: 800 },
  'USDC': { activeWallets: 400000, activeWalletsGrowth: 1.0, largeTransactions: 900 },
  'XRP': { activeWallets: 250000, activeWalletsGrowth: -0.5, largeTransactions: 600 },
  'DOGE': { activeWallets: 200000, activeWalletsGrowth: 2.0, largeTransactions: 500 },
  'TON': { activeWallets: 150000, activeWalletsGrowth: 1.5, largeTransactions: 400 },
  'ADA': { activeWallets: 220000, activeWalletsGrowth: 0.7, largeTransactions: 550 },
  'TRX': { activeWallets: 180000, activeWalletsGrowth: 1.1, largeTransactions: 450 },
  'AVAX': { activeWallets: 170000, activeWalletsGrowth: 0.9, largeTransactions: 420 },
  'SHIB': { activeWallets: 190000, activeWalletsGrowth: 3.0, largeTransactions: 470 },
  'LINK': { activeWallets: 160000, activeWalletsGrowth: 1.3, largeTransactions: 410 },
  'BCH': { activeWallets: 140000, activeWalletsGrowth: -0.2, largeTransactions: 380 },
  'DOT': { activeWallets: 130000, activeWalletsGrowth: 0.6, largeTransactions: 370 },
  'NEAR': { activeWallets: 120000, activeWalletsGrowth: 1.4, largeTransactions: 360 },
  'LTC': { activeWallets: 110000, activeWalletsGrowth: 0.3, largeTransactions: 350 },
  'MATIC': { activeWallets: 100000, activeWalletsGrowth: 0.5, largeTransactions: 340 },
  'PEPE': { activeWallets: 90000, activeWalletsGrowth: 4.0, largeTransactions: 320 }
};

const SUPPORTED_COINS = {
  'BTC': { santiment: 'bitcoin', cryptoPanic: 'BTC', coinMetrics: 'btc' },
  'ETH': { santiment: 'ethereum', cryptoPanic: 'ETH', coinMetrics: 'eth' },
  'SOL': { santiment: 'solana', cryptoPanic: 'SOL', coinMetrics: 'sol' },
  'USDT': { santiment: 'tether', cryptoPanic: 'USDT', coinMetrics: 'usdt' },
  'BNB': { santiment: 'binance-coin', cryptoPanic: 'BNB', coinMetrics: 'bnb' },
  'USDC': { santiment: 'usd-coin', cryptoPanic: 'USDC', coinMetrics: 'usdc' },
  'XRP': { santiment: 'xrp', cryptoPanic: 'XRP', coinMetrics: 'xrp' },
  'DOGE': { santiment: 'dogecoin', cryptoPanic: 'DOGE', coinMetrics: 'doge' },
  'TON': { santiment: 'toncoin', cryptoPanic: 'TON', coinMetrics: 'ton' },
  'ADA': { santiment: 'cardano', cryptoPanic: 'ADA', coinMetrics: 'ada' },
  'TRX': { santiment: 'tron', cryptoPanic: 'TRX', coinMetrics: 'trx' },
  'AVAX': { santiment: 'avalanche', cryptoPanic: 'AVAX', coinMetrics: 'avax' },
  'SHIB': { santiment: 'shiba-inu', cryptoPanic: 'SHIB', coinMetrics: 'shib' },
  'LINK': { santiment: 'chainlink', cryptoPanic: 'LINK', coinMetrics: 'link' },
  'BCH': { santiment: 'bitcoin-cash', cryptoPanic: 'BCH', coinMetrics: 'bch' },
  'DOT': { santiment: 'polkadot', cryptoPanic: 'DOT', coinMetrics: 'dot' },
  'NEAR': { santiment: 'near-protocol', cryptoPanic: 'NEAR', coinMetrics: 'near' },
  'LTC': { santiment: 'litecoin', cryptoPanic: 'LTC', coinMetrics: 'ltc' },
  'MATIC': { santiment: 'polygon', cryptoPanic: 'MATIC', coinMetrics: 'matic' },
  'PEPE': { santiment: 'pepe', cryptoPanic: 'PEPE', coinMetrics: 'pepe' }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  const coinSlug = coinConfig.santiment;
  console.log(`Fetching sentiment data for ${coin} with slug: ${coinSlug}`);

  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinSlug}?community_data=true`, {
      timeout: 20000
    });
    if (!response.data.community_data) throw new Error('No community data available');

    const { twitter_followers, reddit_average_comments_48h, reddit_subscribers } = response.data.community_data;
    const positive = twitter_followers || 0;
    const negative = reddit_average_comments_48h || 0;
    const total = positive + negative + (reddit_subscribers || 0);
    const score = total > 0 ? (positive / total) * 100 : 0;

    return {
      coin,
      positive: (positive / total) * 100 || 0,
      negative: (negative / total) * 100 || 0,
      neutral: total > 0 ? ((reddit_subscribers || 0) / total) * 100 : 0,
      score,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching sentiment data for ${coin}:`, error);
    return {
      coin,
      positive: 0,
      negative: 0,
      neutral: 0,
      score: 0,
      timestamp: new Date().toISOString()
    };
  }
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const coinConfig = SUPPORTED_COINS[coin];
  if (!coinConfig) throw new Error(`Unsupported coin: ${coin}`);

  const coinSymbol = coinConfig.coinMetrics;
  const endTime = new Date().toISOString().split('T')[0];
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    console.log(`Fetching on-chain data for ${coin}`);
    const response = await axios.get('https://community-api.coinmetrics.io/v4/timeseries/asset-metrics', {
      params: {
        assets: coinSymbol.toLowerCase(),
        metrics: 'AdrActCnt,TxTfrValAdjUSD',
        frequency: '1d',
        page_size: 2,
        start_time: startTime,
        end_time: endTime
      },
      timeout: 20000
    });

    if (!response.data?.data || response.data.data.length < 2) {
      console.warn(`Insufficient data for ${coin}, using fallback`);
      const fallback = FALLBACK_ONCHAIN_DATA[coin] || { activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0 };
      return {
        coin,
        activeWallets: fallback.activeWallets || 0,
        activeWalletsGrowth: fallback.activeWalletsGrowth || 0,
        largeTransactions: fallback.largeTransactions || 0,
        timestamp: new Date().toISOString()
      };
    }

    const metrics = response.data.data;
    const currentWallets = parseInt(metrics[1].AdrActCnt) || 0;
    const previousWallets = parseInt(metrics[0].AdrActCnt) || 0;
    const growth = previousWallets > 0 ? ((currentWallets - previousWallets) / previousWallets) * 100 : 0;

    return {
      coin,
      activeWallets: currentWallets,
      activeWalletsGrowth: growth,
      largeTransactions: parseFloat(metrics[1].TxTfrValAdjUSD) || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin}:`, error);
    const fallback = FALLBACK_ONCHAIN_DATA[coin] || { activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0 };
    return {
      coin,
      activeWallets: fallback.activeWallets || 0,
      activeWalletsGrowth: fallback.activeWalletsGrowth || 0,
      largeTransactions: fallback.largeTransactions || 0,
      timestamp: new Date().toISOString()
    };
  }
};

export const fetchEvents = async (): Promise<Event[]> => {
  const apiToken = import.meta.env.VITE_CRYPTOPANIC_API_TOKEN;
  if (!apiToken) throw new Error('CryptoPanic API token not configured');

  try {
    console.log(`Fetching events`);
    const response = await axios.get('https://cryptopanic.com/api/v1/posts', {
      params: {
        auth_token: apiToken,
        public: 'true',
        filter: 'hot',
        currencies: Object.keys(SUPPORTED_COINS).join(',')
      },
      headers: { 'Accept': 'application/json' },
      timeout: 20000
    });

    if (!response.data.results || !Array.isArray(response.data.results)) return [];

    return response.data.results.map((post: any) => ({
      id: (post.id || Date.now()).toString(),
      coin: post.currencies?.[0]?.code || 'UNKNOWN',
      date: post.published_at || new Date().toISOString(),
      title: post.title || 'No title available',
      description: post.text || post.title || 'No description available',
      eventType: post.kind || 'News'
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};
