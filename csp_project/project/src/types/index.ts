// src/types/index.ts
export interface SentimentData {
  coin: string;
  positive: number; // Optional, for display
  negative: number; // Optional, for display
  neutral: number; // Optional, for display
  score: number;   // -10 to 10
  socialScore?: number; // -10 to 10, optional
  timestamp: string;
}

export interface SentimentData {
  coin: string;
  positive: number;
  negative: number;
  neutral: number;
  score: number;
  timestamp: string;
}

export interface OnChainData {
  coin: string;
  activeWallets: number;
  activeWalletsGrowth: number;
  largeTransactions: number;
  timestamp: string;
}

export interface Event {
  id: string;
  coin: string;
  date: string;
  title: string;
  description: string;
  eventType: string;
}

export interface PortfolioItem {
  coin: string;
  quantity: number;
  sentimentScore?: number;
}

export interface DatasetEntry {
  timestamp: string;
  coin: string;
  sentimentPositive: number;
  sentimentNegative: number;
  sentimentNeutral: number;
  sentimentScore: number;
  activeWallets: number;
  largeTransactions: number;
  eventId: string;
  eventImpactScore: number;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
}

export const AVAILABLE_COINS: Coin[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'binance-coin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC' },
  { id: 'xrp', symbol: 'XRP', name: 'XRP' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'toncoin', symbol: 'TON', name: 'TON' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },
  { id: 'avalanche', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'near-protocol', symbol: 'NEAR', name: 'NEAR Protocol' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe' }
];
