export interface Coin {
  id: string;
  symbol: string;
  name: string;
  coinMetrics: string; // Added for CoinMetrics API
}

export interface SentimentData {
  coin: string;
  positive?: number; // Optional, for display
  negative?: number; // Optional, for display
  neutral?: number; // Optional, for display
  score: number;    // -10 to 10
  socialScore?: number; // -10 to 10, optional
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
  id?: string; // Made optional to align with api.ts usage
  coin?: string; // Made optional since not always used
  date?: string; // Made optional to align with api.ts
  title: string;
  description: string;
  eventType?: string; // Made optional since not used in api.ts
  url?: string; // Added to align with api.ts
  publishedAt?: string; // Added to align with api.ts
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

export const AVAILABLE_COINS: Coin[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', coinMetrics: 'btc' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', coinMetrics: 'eth' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', coinMetrics: 'usdt' },
  { id: 'binance-coin', symbol: 'BNB', name: 'BNB', coinMetrics: 'bnb' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', coinMetrics: 'sol' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC', coinMetrics: 'usdc' },
  { id: 'xrp', symbol: 'XRP', name: 'XRP', coinMetrics: 'xrp' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', coinMetrics: 'doge' },
  { id: 'toncoin', symbol: 'TON', name: 'TON', coinMetrics: 'ton' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', coinMetrics: 'ada' },
  { id: 'tron', symbol: 'TRX', name: 'TRON', coinMetrics: 'trx' },
  { id: 'avalanche', symbol: 'AVAX', name: 'Avalanche', coinMetrics: 'avax' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', coinMetrics: 'shib' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', coinMetrics: 'link' },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', coinMetrics: 'bch' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', coinMetrics: 'dot' },
  { id: 'near-protocol', symbol: 'NEAR', name: 'NEAR Protocol', coinMetrics: 'near' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', coinMetrics: 'ltc' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon', coinMetrics: 'matic' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', coinMetrics: 'pepe' },
];
