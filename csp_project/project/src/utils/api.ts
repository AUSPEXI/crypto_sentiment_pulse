// src/utils/api.ts
import axios from 'axios';

export const STATIC_COINS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Eth// src/utils/api.ts
import axios from 'axios';

export const STATIC_COINS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' },
];

const PROXY_URL = '/.netlify/functions/proxy';

const sentimentCache: Record<string, { score: number; timestamp: number }> = {};

interface SentimentData {
  score: number;
}

export interface OnChainData {
  coin: string;
  activeWallets: number;
  activeWalletsGrowth: number;
  largeTransactions: number;
}

export interface Event {
  title: string;
  description: string;
  date: string;
  source: string;
}

const fetchWithProxy = async (endpoint: string, params: Record<string, any> = {}) => {
  try {
    const response = await axios.post(PROXY_URL, {
      endpoint,
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`Proxy request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Add fetchOnChainData function
export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  console.log(`Fetching on-chain data for ${coin}`);
  const coinMetricsParams = { assets: coin, metrics: 'AdrActCnt,AdrActCntChg24h,NVt10Day' };
  console.log(`CoinMetrics request params:`, coinMetricsParams);
  
  try {
    const coinMetricsResponse = await fetchWithProxy('coinmetrics/timeseries/asset-metrics', coinMetricsParams);
    console.log(`Proxy response for coinmetrics/timeseries/asset-metrics:`, coinMetricsResponse);
    
    const rawData = coinMetricsResponse.data[0];
    console.log(`CoinMetrics raw response for ${coin}:`, rawData);
    
    const onChainData: OnChainData = {
      coin,
      activeWallets: rawData?.AdrActCnt || 0,
      activeWalletsGrowth: rawData?.AdrActCntChg24h || 0,
      largeTransactions: rawData?.NVt10Day || 0,
    };
    
    console.log(`On-chain data for ${coin}:`, onChainData);
    return onChainData;
  } catch (error) {
    console.error(`Failed to fetch on-chain data for ${coin}:`, error);
    throw error;
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const cacheKey = `${coin}-sentiment`;
  const cached = sentimentCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    console.log(`Returning cached sentiment data for ${coin}:`, cached.score);
    return { score: cached.score };
  }

  console.log(`Fetching sentiment data for ${coin}`);

  console.log(`Fetching news for ${coin} via proxy`);
  const newsParams = { q: coin, language: 'en', pageSize: 5 };
  const newsResponse = await fetchWithProxy('newsapi/everything', newsParams);
  console.log(`Making proxied request to newsapi/everything with params:`, newsParams);
  const newsText = newsResponse.articles.map((article: any) => article.title + ' ' + article.description).join(' ');
  console.log(`News text for ${coin}:`, newsText);

  console.log(`Fetching events for ${coin} via proxy`);
  const eventsResponse = await fetchWithProxy('newsapi/everything', newsParams);
  console.log(`Making proxied request to newsapi/everything with params:`, newsParams);
  const rawEvents = eventsResponse.articles;
  console.log(`Raw events data for ${coin}:`, rawEvents);
  const articles = rawEvents.map((article: any) => ({
    title: article.title,
    description: article.description,
    date: article.publishedAt,
    source: article.source.name,
  }));
  console.log(`Articles for ${coin}:`, articles);
  const mappedEvents = articles.map((article: any): Event => ({
    title: article.title,
    description: article.description,
    date: article.date,
    source: article.source,
  }));
  console.log(`Mapped events for ${coin}:`, mappedEvents);

  console.log(`Fetching on-chain data for ${coin}`);
  const coinMetricsParams = { assets: coin, metrics: 'AdrActCnt,AdrActCntChg24h,NVt10Day' };
  console.log(`CoinMetrics request params:`, coinMetricsParams);
  const coinMetricsResponse = await fetchWithProxy('coinmetrics/timeseries/asset-metrics', coinMetricsParams);
  console.log(`Making proxied request to coinmetrics/timeseries/asset-metrics with params:`, coinMetricsParams);
  console.log(`Proxy response for coinmetrics/timeseries/asset-metrics:`, coinMetricsResponse);
  const rawData = coinMetricsResponse.data[0];
  console.log(`CoinMetrics raw response for ${coin}:`, rawData);
  const onChainData: OnChainData = {
    coin,
    activeWallets: rawData?.AdrActCnt || 0,
    activeWalletsGrowth: rawData?.AdrActCntChg24h || 0,
    largeTransactions: rawData?.NVt10Day || 0,
  };
  console.log(`On-chain data for ${coin}:`, onChainData);

  console.log(`Fetching sentiment for ${coin} via proxy`);
  const redditResponse = await fetchWithProxy(`reddit/r/CryptoCurrency.rss`, { q: coin });
  console.log(`Making proxied request to reddit/r/CryptoCurrency.rss with params:`, { q: coin });
  console.log(`Reddit raw response for ${coin}:`, redditResponse);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(redditResponse, 'application/xml');
  const entries = xmlDoc.getElementsByTagName('entry');
  const matchedPosts: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const title = entries[i].getElementsByTagName('title')[0]?.textContent || '';
    const content = entries[i].getElementsByTagName('content')[0]?.textContent || '';
    if (title.toLowerCase().includes(coin.toLowerCase()) || content.toLowerCase().includes(coin.toLowerCase())) {
      matchedPosts.push(title + ' ' + content);
    }
  }
  console.log(`Parsed XML data for ${coin}:`, xmlDoc);
  console.log(`Matched post for ${coin}:`, matchedPosts);

  const sentimentText = [newsText, ...matchedPosts].join(' ');
  const sentimentParams = { prompt: `Analyze sentiment for ${coin} based on this text: ${sentimentText}`, max_tokens: 10 };
  const sentimentResponse = await fetchWithProxy('openai/chat/completions', sentimentParams);
  console.log(`Making proxied request to openai/chat/completions with params:`, sentimentParams);
  console.log(`Proxy response for openai/chat/completions:`, sentimentResponse);
  const newsSentimentScore = parseFloat(sentimentResponse.choices[0].message.content) || 0;
  console.log(`News sentiment score for ${coin}:`, newsSentimentScore);

  const redditSentimentParams = { prompt: `Analyze sentiment for ${coin} based on Reddit posts: ${matchedPosts.join(' ')}`, max_tokens: 10 };
  const redditSentimentResponse = await fetchWithProxy('openai/chat/completions', redditSentimentParams);
  console.log(`Making proxied request to openai/chat/completions with params:`, redditSentimentParams);
  const redditSentimentScore = parseFloat(redditSentimentResponse.choices[0].message.content) || 0;
  console.log(`Reddit sentiment score for ${coin}:`, redditSentimentScore);

  const walletGrowthScore = onChainData.activeWalletsGrowth > 0 ? 1 : 0;
  const largeTxScore = onChainData.largeTransactions > 100 ? 1 : 0;
  const socialScore = redditSentimentScore;
  const totalScore = (newsSentimentScore + walletGrowthScore + largeTxScore + socialScore) / 4;

  const score = isNaN(totalScore) ? 0 : totalScore;
  sentimentCache[cacheKey] = { score, timestamp: Date.now() };
  console.log(`Sentiment for ${coin}: News=${newsSentimentScore}, WalletGrowth=${walletGrowthScore}, LargeTx=${largeTxScore}, Social=${socialScore}, Total=${totalScore}`);

  return { score };
};ereum' },
  { symbol: 'USDT', name: 'Tether' },
];

const PROXY_URL = '/.netlify/functions/proxy';

const sentimentCache: Record<string, { score: number; timestamp: number }> = {};

interface SentimentData {
  score: number;
}

export interface OnChainData {
  coin: string;
  activeWallets: number;
  activeWalletsGrowth: number;
  largeTransactions: number;
}

export interface Event {
  title: string;
  description: string;
  date: string;
  source: string;
}

const fetchWithProxy = async (endpoint: string, params: Record<string, any> = {}) => {
  try {
    const response = await axios.post(PROXY_URL, {
      endpoint,
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`Proxy request failed for ${endpoint}:`, error);
    throw error;
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const cacheKey = `${coin}-sentiment`;
  const cached = sentimentCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    console.log(`Returning cached sentiment data for ${coin}:`, cached.score);
    return { score: cached.score };
  }

  console.log(`Fetching sentiment data for ${coin}`);

  console.log(`Fetching news for ${coin} via proxy`);
  const newsParams = { q: coin, language: 'en', pageSize: 5 };
  const newsResponse = await fetchWithProxy('newsapi/everything', newsParams);
  console.log(`Making proxied request to newsapi/everything with params:`, newsParams);
  const newsText = newsResponse.articles.map((article: any) => article.title + ' ' + article.description).join(' ');
  console.log(`News text for ${coin}:`, newsText);

  console.log(`Fetching events for ${coin} via proxy`);
  const eventsResponse = await fetchWithProxy('newsapi/everything', newsParams);
  console.log(`Making proxied request to newsapi/everything with params:`, newsParams);
  const rawEvents = eventsResponse.articles;
  console.log(`Raw events data for ${coin}:`, rawEvents);
  const articles = rawEvents.map((article: any) => ({
    title: article.title,
    description: article.description,
    date: article.publishedAt,
    source: article.source.name,
  }));
  console.log(`Articles for ${coin}:`, articles);
  const mappedEvents = articles.map((article: any): Event => ({
    title: article.title,
    description: article.description,
    date: article.date,
    source: article.source,
  }));
  console.log(`Mapped events for ${coin}:`, mappedEvents);

  console.log(`Fetching on-chain data for ${coin}`);
  const coinMetricsParams = { assets: coin, metrics: 'AdrActCnt,AdrActCntChg24h,NVt10Day' };
  console.log(`CoinMetrics request params:`, coinMetricsParams);
  const coinMetricsResponse = await fetchWithProxy('coinmetrics/timeseries/asset-metrics', coinMetricsParams);
  console.log(`Making proxied request to coinmetrics/timeseries/asset-metrics with params:`, coinMetricsParams);
  console.log(`Proxy response for coinmetrics/timeseries/asset-metrics:`, coinMetricsResponse);
  const rawData = coinMetricsResponse.data[0];
  console.log(`CoinMetrics raw response for ${coin}:`, rawData);
  const onChainData: OnChainData = {
    coin,
    activeWallets: rawData?.AdrActCnt || 0,
    activeWalletsGrowth: rawData?.AdrActCntChg24h || 0,
    largeTransactions: rawData?.NVt10Day || 0,
  };
  console.log(`On-chain data for ${coin}:`, onChainData);

  console.log(`Fetching sentiment for ${coin} via proxy`);
  const redditResponse = await fetchWithProxy(`reddit/r/CryptoCurrency.rss`, { q: coin });
  console.log(`Making proxied request to reddit/r/CryptoCurrency.rss with params:`, { q: coin });
  console.log(`Reddit raw response for ${coin}:`, redditResponse);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(redditResponse, 'application/xml');
  const entries = xmlDoc.getElementsByTagName('entry');
  const matchedPosts: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const title = entries[i].getElementsByTagName('title')[0]?.textContent || '';
    const content = entries[i].getElementsByTagName('content')[0]?.textContent || '';
    if (title.toLowerCase().includes(coin.toLowerCase()) || content.toLowerCase().includes(coin.toLowerCase())) {
      matchedPosts.push(title + ' ' + content);
    }
  }
  console.log(`Parsed XML data for ${coin}:`, xmlDoc);
  console.log(`Matched post for ${coin}:`, matchedPosts);

  const sentimentText = [newsText, ...matchedPosts].join(' ');
  const sentimentParams = { prompt: `Analyze sentiment for ${coin} based on this text: ${sentimentText}`, max_tokens: 10 };
  const sentimentResponse = await fetchWithProxy('openai/chat/completions', sentimentParams);
  console.log(`Making proxied request to openai/chat/completions with params:`, sentimentParams);
  console.log(`Proxy response for openai/chat/completions:`, sentimentResponse);
  const newsSentimentScore = parseFloat(sentimentResponse.choices[0].message.content) || 0;
  console.log(`News sentiment score for ${coin}:`, newsSentimentScore);

  const redditSentimentParams = { prompt: `Analyze sentiment for ${coin} based on Reddit posts: ${matchedPosts.join(' ')}`, max_tokens: 10 };
  const redditSentimentResponse = await fetchWithProxy('openai/chat/completions', redditSentimentParams);
  console.log(`Making proxied request to openai/chat/completions with params:`, redditSentimentParams);
  const redditSentimentScore = parseFloat(redditSentimentResponse.choices[0].message.content) || 0;
  console.log(`Reddit sentiment score for ${coin}:`, redditSentimentScore);

  const walletGrowthScore = onChainData.activeWalletsGrowth > 0 ? 1 : 0;
  const largeTxScore = onChainData.largeTransactions > 100 ? 1 : 0;
  const socialScore = redditSentimentScore;
  const totalScore = (newsSentimentScore + walletGrowthScore + largeTxScore + socialScore) / 4;

  const score = isNaN(totalScore) ? 0 : totalScore;
  sentimentCache[cacheKey] = { score, timestamp: Date.now() };
  console.log(`Sentiment for ${coin}: News=${newsSentimentScore}, WalletGrowth=${walletGrowthScore}, LargeTx=${largeTxScore}, Social=${socialScore}, Total=${totalScore}`);

  return { score };
};
