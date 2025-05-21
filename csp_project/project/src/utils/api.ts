// src/utils/api.ts
import { SentimentData, OnChainData, Event } from '../types';

export const SUPPORTED_COINS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binance-coin',
  SOL: 'solana',
  USDC: 'usd-coin',
  XRP: 'xrp',
  DOGE: 'dogecoin',
  TON: 'toncoin',
  ADA: 'cardano',
  TRX: 'tron',
  AVAX: 'avalanche',
  SHIB: 'shiba-inu',
  LINK: 'chainlink',
  BCH: 'bitcoin-cash',
  DOT: 'polkadot',
  NEAR: 'near-protocol',
  LTC: 'litecoin',
  MATIC: 'polygon',
  PEPE: 'pepe'
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const slug = SUPPORTED_COINS[coin];
  if (!slug) throw new Error(`Unsupported coin: ${coin}`);

  const url = `https://api.coingecko.com/api/v3/coins/${slug}?community_data=true`;
  console.log(`Fetching sentiment data for ${coin} (Attempt 1/3) with slug: ${slug}`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed with status code ${response.status}`);

    const data = await response.json();
    // Approximate sentiment using community data (e.g., Twitter followers, Reddit activity)
    const positive = data.community_data.twitter_followers || 0;
    const negative = data.community_data.reddit_average_comments_48h || 0;
    const total = positive + negative + (data.community_data.reddit_subscribers || 0);
    const score = total > 0 ? (positive / total) * 100 : 0;

    return {
      coin,
      positive: (positive / total) * 100 || 0,
      negative: (negative / total) * 100 || 0,
      neutral: total > 0 ? ((data.community_data.reddit_subscribers || 0) / total) * 100 : 0,
      score,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching sentiment data for ${coin}:`, error);
    throw new Error(`Failed to fetch sentiment data for ${coin}: ${error.message}`);
  }
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  const slug = SUPPORTED_COINS[coin];
  if (!slug) throw new Error(`Unsupported coin: ${coin}`);

  const url = `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=${slug}&metrics=AdrActCnt,TxTfrValAdjUSD`;
  console.log(`Fetching on-chain data for ${coin} (Attempt 1/3)`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Invalid request for ${coin}, using fallback`);
      return {
        coin,
        activeWallets: 0,
        activeWalletsGrowth: 0,
        largeTransactions: 0,
        timestamp: new Date().toISOString()
      };
    }

    const data = await response.json();
    console.log(`CoinMetrics raw response for ${coin}:`, data);

    const latest = data.data?.[0]?.metrics?.[0] || {};
    const previous = data.data?.[1]?.metrics?.[0] || {};
    const activeWallets = parseInt(latest.AdrActCnt) || 0;
    const prevWallets = parseInt(previous.AdrActCnt) || 0;
    const growth = prevWallets > 0 ? ((activeWallets - prevWallets) / prevWallets) * 100 : 0;

    return {
      coin,
      activeWallets,
      activeWalletsGrowth: growth,
      largeTransactions: parseFloat(latest.TxTfrValAdjUSD) || 0,
      timestamp: latest.time || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin}:`, error);
    throw new Error(`Failed to fetch on-chain data for ${coin}`);
  }
};

export const fetchEvents = async (): Promise<Event[]> => {
  const apiKey = import.meta.env.VITE_CRYPTOPANIC_API_TOKEN;
  const currencies = Object.keys(SUPPORTED_COINS).join(',');
  const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&currencies=${currencies}`;
  console.log(`Fetching events (Attempt 1/3)`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed with status code ${response.status}`);

    const data = await response.json();
    return data.results.map((post: any) => ({
      id: post.id,
      coin: post.currencies?.[0]?.code || 'N/A',
      date: post.created_at,
      title: post.title,
      description: post.description || post.title,
      eventType: post.kind || 'news'
    }));
  } catch (error) {
    console.error(`Error fetching events:`, error);
    throw new Error(`Failed to fetch events`);
  }
};
