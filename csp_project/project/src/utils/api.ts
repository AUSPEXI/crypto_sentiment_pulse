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

// Initialize with fallback coins
let SUPPORTED_COINS: { [key: string]: { coingecko: string, cryptoPanic: string, coinMetrics: string, xQuery: string } } = {
  'BTC': { coingecko: 'bitcoin', cryptoPanic: 'bitcoin', coinMetrics: 'btc', xQuery: 'BTC OR Bitcoin' },
  'ETH': { coingecko: 'ethereum', cryptoPanic: 'ethereum', coinMetrics: 'eth', xQuery: 'ETH OR Ethereum' },
  'SOL': { coingecko: 'solana', cryptoPanic: 'solana', coinMetrics: 'solana', xQuery: 'SOL OR Solana' }
};

// Fetch top 100 coins by market cap from CoinGecko
export const fetchSupportedCoins = async (): Promise<void> => {
  try {
    console.log('Fetching top 100 coins from CoinGecko...');
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false
      },
      timeout: 20000
    });
    console.log('CoinGecko top 100 coins response:', response.data);

    if (!response.data || response.data.length === 0) throw new Error('No coins fetched from CoinGecko');

    SUPPORTED_COINS = response.data.reduce((acc: any, coin: any) => {
      const symbol = coin.symbol.toUpperCase();
      acc[symbol] = {
        coingecko: coin.id,
        cryptoPanic: symbol,
        coinMetrics: symbol.toLowerCase(),
        xQuery: `${symbol} OR ${coin.name}`
      };
      return acc;
    }, {});
  } catch (error: any) {
    console.error('Error fetching supported coins:', error.message);
    // Fallback already set at initialization
  }
};

// Rest of api.ts remains the same (omitted for brevity)
// Ensure getSupportedCoins is exported
export const getSupportedCoins = () => Object.keys(SUPPORTED_COINS);
