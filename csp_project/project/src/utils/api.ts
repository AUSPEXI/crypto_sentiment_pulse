// src/utils/api.ts
// Minimal version to test if the error resolves
const FALLBACK_ONCHAIN_DATA = {
  'BTC': { coin: 'BTC', activeWallets: 900000, activeWalletsGrowth: 2.1, largeTransactions: 1500, timestamp: '2025-05-22T06:03:00Z' },
  'ETH': { coin: 'ETH', activeWallets: 600000, activeWalletsGrowth: 1.5, largeTransactions: 1200, timestamp: '2025-05-22T06:03:00Z' },
};

const SUPPORTED_COINS = {
  'BTC': { cryptoPanic: 'BTC', coinMetrics: 'btc' },
  'ETH': { cryptoPanic: 'ETH', coinMetrics: 'eth' },
};

export const fetchSentimentData = async (coin) => {
  console.log(`[Sentiment] Fetching sentiment for ${coin} - returning neutral (placeholder)`);
  return { coin, positive: 33.33, negative: 33.33, neutral: 33.33, score: 50, timestamp: new Date().toISOString() };
};

export const fetchOnChainData = async (coin) => {
  console.log(`[OnChain] Fetching on-chain data for ${coin} - using static fallback (placeholder)`);
  return FALLBACK_ONCHAIN_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
};

export const fetchEvents = async () => {
  console.log('[Events] Fetching events - returning empty (placeholder)');
  return [];
};
