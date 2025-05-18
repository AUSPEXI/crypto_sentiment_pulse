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

export const AVAILABLE_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' }
] as const;