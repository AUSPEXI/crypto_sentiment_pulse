import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Event, OnChainData, SentimentData } from '../types';

// Define supported coins
const SUPPORTED_COINS = {
  BTC: { symbol: 'BTC', coinMetrics: 'btc' },
  ETH: { symbol: 'ETH', coinMetrics: 'eth' },
  USDT: { symbol: 'USDT', coinMetrics: 'usdt' },
  BNB: { symbol: 'BNB', coinMetrics: 'bnb' },
  SOL: { symbol: 'SOL', coinMetrics: 'sol' },
  USDC: { symbol: 'USDC', coinMetrics: 'usdc' },
  XRP: { symbol: 'XRP', coinMetrics: 'xrp' },
  DOGE: { symbol: 'DOGE', coinMetrics: 'doge' },
  TON: { symbol: 'TON', coinMetrics: 'ton' },
  ADA: { symbol: 'ADA', coinMetrics: 'ada' },
  TRX: { symbol: 'TRX', coinMetrics: 'trx' },
  AVAX: { symbol: 'AVAX', coinMetrics: 'avax' },
  SHIB: { symbol: 'SHIB', coinMetrics: 'shib' },
  LINK: { symbol: 'LINK', coinMetrics: 'link' },
  BCH: { symbol: 'BCH', coinMetrics: 'bch' },
  DOT: { symbol: 'DOT', coinMetrics: 'dot' },
  NEAR: { symbol: 'NEAR', coinMetrics: 'near' },
  LTC: { symbol: 'LTC', coinMetrics: 'ltc' },
  MATIC: { symbol: 'MATIC', coinMetrics: 'matic' },
  PEPE: { symbol: 'PEPE', coinMetrics: 'pepe' },
};

export const STATIC_COINS = Object.keys(SUPPORTED_COINS);

const STATIC_WALLET_DATA = {
  BTC: { coin: 'BTC', activeWallets: 100000, activeWalletsGrowth: 2.1, largeTransactions: 500, timestamp: new Date().toISOString() },
  ETH: { coin: 'ETH', activeWallets: 75000, activeWalletsGrowth: 1.5, largeTransactions: 400, timestamp: new Date().toISOString() },
  USDT: { coin: 'USDT', activeWallets: 50000, activeWalletsGrowth: 0.5, largeTransactions: 1000, timestamp: new Date().toISOString() },
  BNB: { coin: 'BNB', activeWallets: 40000, activeWalletsGrowth: 1.2, largeTransactions: 350, timestamp: new Date().toISOString() },
  SOL: { coin: 'SOL', activeWallets: 50000, activeWalletsGrowth: 1.8, largeTransactions: 300, timestamp: new Date().toISOString() },
  USDC: { coin: 'USDC', activeWallets: 18000, activeWalletsGrowth: 0.3, largeTransactions: 550, timestamp: new Date().toISOString() },
  XRP: { coin: 'XRP', activeWallets: 30000, activeWalletsGrowth: 0.8, largeTransactions: 200, timestamp: new Date().toISOString() },
  DOGE: { coin: 'DOGE', activeWallets: 60000, activeWalletsGrowth: 2.0, largeTransactions: 100, timestamp: new Date().toISOString() },
  TON: { coin: 'TON', activeWallets: 25000, activeWalletsGrowth: 0.9, largeTransactions: 150, timestamp: new Date().toISOString() },
  ADA: { coin: 'ADA', activeWallets: 35000, activeWalletsGrowth: 1.0, largeTransactions: 250, timestamp: new Date().toISOString() },
  TRX: { coin: 'TRX', activeWallets: 29000, activeWalletsGrowth: 0.7, largeTransactions: 190, timestamp: new Date().toISOString() },
  AVAX: { coin: 'AVAX', activeWallets: 32000, activeWalletsGrowth: 1.1, largeTransactions: 280, timestamp: new Date().toISOString() },
  SHIB: { coin: 'SHIB', activeWallets: 80000, activeWalletsGrowth: 2.5, largeTransactions: 50, timestamp: new Date().toISOString() },
  LINK: { coin: 'LINK', activeWallets: 20000, activeWalletsGrowth: 0.7, largeTransactions: 180, timestamp: new Date().toISOString() },
  BCH: { coin: 'BCH', activeWallets: 27000, activeWalletsGrowth: 0.6, largeTransactions: 220, timestamp: new Date().toISOString() },
  DOT: { coin: 'DOT', activeWallets: 23000, activeWalletsGrowth: 0.9, largeTransactions: 160, timestamp: new Date().toISOString() },
  NEAR: { coin: 'NEAR', activeWallets: 26000, activeWalletsGrowth: 1.0, largeTransactions: 230, timestamp: new Date().toISOString() },
  LTC: { coin: 'LTC', activeWallets: 28000, activeWalletsGrowth: 0.6, largeTransactions: 220, timestamp: new Date().toISOString() },
  MATIC: { coin: 'MATIC', activeWallets: 31000, activeWalletsGrowth: 0.9, largeTransactions: 260, timestamp: new Date().toISOString() },
  PEPE: { coin: 'PEPE', activeWallets: 70000, activeWalletsGrowth: 2.2, largeTransactions: 80, timestamp: new Date().toISOString() },
};

const STATIC_PRICE_CHANGES = {
  BTC: 1.02,
  ETH: 0.78,
  USDT: 0.84,
  BNB: 0.95,
  SOL: 0.90,
  USDC: 0.82,
  XRP: 0.88,
  DOGE: 1.05,
  TON: 0.87,
  ADA: 0.92,
  TRX: 0.82,
  AVAX: 0.96,
  SHIB: 1.10,
  LINK: 0.91,
  BCH: 0.85,
  DOT: 0.87,
  NEAR: 0.94,
  LTC: 0.85,
  MATIC: 0.89,
  PEPE: 1.08,
};

export const STATIC_NEWS: { [key: string]: Event[] } = {
  BTC: [
    { title: "El Salvador’s Bitcoin Holdings Show $357 Million in Unrealized Profit As Bitcoin Closes At Record Highs", description: "El Salvador’s bold foray into BTC (CRYPTO: BTC) has entered a new chapter of profitability.", url: "", publishedAt: new Date().toISOString() },
    { title: "XRP-BTC Pair Flashes First Golden Cross, Hinting at Major Bull Run for XRP", description: "No description", url: "", publishedAt: new Date().toISOString() },
    { title: "Peter Schiff Predicts ‘Fireworks,’ Says Michael Saylor’s Strategy Will See Unrealized Loss During Bitcoin’s Next Bearish Dip", description: "Economist and market commentator Peter Schiff projected Monday that the next Bitcoin (CRYPTO: BTC) pullback would trigger an unrealized loss for Michael...", url: "", publishedAt: new Date().toISOString() },
    { title: "Wall Street’s New Bitcoin Monster: Cantor’s $46B Bet Could Dethrone Michael Saylor", description: "Backed by Tether and SoftBank, Twenty One Capital is coming for Strategy’s crypto crown — and it’s not playing small.", url: "", publishedAt: new Date().toISOString() },
    { title: "Bitcoin price holds above $102,000 as BlackRock leads fund inflows", description: "Bitcoin traded relatively flat on Thursday as institutional investors resumed allocations into US-based spot bitcoin exchange-traded funds on Wednesday.", url: "", publishedAt: new Date().toISOString() },
  ],
  ETH: [
    { title: "ETH network update", description: "Ethereum upgrade incoming.", url: "", publishedAt: new Date().toISOString() },
    { title: "ETH staking rises", description: "More users stake ETH.", url: "", publishedAt: new Date().toISOString() },
  ],
  USDT: [
    { title: "USDT volume up", description: "Tether transactions increase.", url: "", publishedAt: new Date().toISOString() },
  ],
  BNB: [
    { title: "BNB chain update", description: "Binance Smart Chain improves.", url: "", publishedAt: new Date().toISOString() },
  ],
  SOL: [
    { title: "SOL ecosystem grows", description: "Solana projects expand.", url: "", publishedAt: new Date().toISOString() },
  ],
  USDC: [
    { title: "USDC adoption rises", description: "USDC usage increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  XRP: [
    { title: "XRP lawsuit news", description: "Ripple faces legal challenges.", url: "", publishedAt: new Date().toISOString() },
  ],
  DOGE: [
    { title: "DOGE price surge", description: "Dogecoin gains popularity.", url: "", publishedAt: new Date().toISOString() },
  ],
  TON: [
    { title: "TON network growth", description: "TON ecosystem expands.", url: "", publishedAt: new Date().toISOString() },
  ],
  ADA: [
    { title: "ADA staking grows", description: "Cardano staking increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  TRX: [
    { title: "TRX dapp growth", description: "TRON dapps increase.", url: "", publishedAt: new Date().toISOString() },
  ],
  AVAX: [
    { title: "AVAX defi boom", description: "Avalanche DeFi projects grow.", url: "", publishedAt: new Date().toISOString() },
  ],
  SHIB: [
    { title: "SHIB community grows", description: "Shiba Inu community expands.", url: "", publishedAt: new Date().toISOString() },
  ],
  LINK: [
    { title: "LINK oracles expand", description: "Chainlink oracles grow.", url: "", publishedAt: new Date().toISOString() },
  ],
  BCH: [
    { title: "BCH adoption rises", description: "Bitcoin Cash usage increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  DOT: [
    { title: "DOT parachain launch", description: "Polkadot launches new parachain.", url: "", publishedAt: new Date().toISOString() },
  ],
  NEAR: [
    { title: "NEAR protocol update", description: "NEAR Protocol enhances features.", url: "", publishedAt: new Date().toISOString() },
  ],
  LTC: [
    { title: "LTC adoption rises", description: "Litecoin usage increases.", url: "", publishedAt: new Date().toISOString() },
  ],
  MATIC: [
    { title: "MATIC scaling news", description: "Polygon enhances scaling.", url: "", publishedAt: new Date().toISOString() },
  ],
  PEPE: [
    { title: "PEPE meme coin surge", description: "Pepe gains traction.", url: "", publishedAt: new Date().toISOString() },
  ],
};

// Rate limit handling with retry logic
let lastNewsApiRequestTime: number | null = null;
const NEWS_API_RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour delay for 429
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // Initial delay of 5 seconds, doubles on each retry

const makeProxiedRequest = async (api: string, endpoint: string, params: any, method: 'GET' | 'POST' = 'GET', retries = 0): Promise<any> => {
  if (api === 'newsapi' && lastNewsApiRequestTime) {
    const timeSinceLastRequest = Date.now() - lastNewsApiRequestTime;
    if (timeSinceLastRequest < NEWS_API_RATE_LIMIT_MS) {
      console.log(`Rate limit active for NewsAPI. Delaying request by ${NEWS_API_RATE_LIMIT_MS - timeSinceLastRequest}ms`);
      await new Promise(resolve => setTimeout(resolve, NEWS_API_RATE_LIMIT_MS - timeSinceLastRequest));
    }
  }

  const proxyUrl = '/api/proxy';
  console.log(`Making proxied request to ${api}/${endpoint} with params:`, params);
  try {
    const config: any = {
      method,
      url: proxyUrl,
      timeout: 10000,
    };
    if (method === 'POST') {
      config.data = { api, endpoint, params };
    } else {
      config.params = { api, endpoint, params: JSON.stringify(params) };
    }
    const response = await axios(config);
    console.log(`Proxy response for ${api}/${endpoint}:`, response.data, 'Headers:', response.headers);
    if (api === 'newsapi') {
      lastNewsApiRequestTime = Date.now();
    }
    return response.data;
  } catch (error: any) {
    console.error(`Proxied request failed for ${api}/${endpoint}:`, error.response?.data || error.message, 'Status:', error.response?.status, 'Headers:', error.response?.headers);
    if (error.response?.status === 429 && retries < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      console.log(`Retrying ${api}/${endpoint} after ${delay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeProxiedRequest(api, endpoint, params, method, retries + 1);
    }
    throw new Error(`Proxied request failed: ${error.response?.status || error.message}`);
  }
};

const fetchRecentNews = async (coin: string): Promise<string> => {
  console.log('Fetching news for', coin, 'via proxy');
  try {
    const params = { q: `crypto ${coin} OR ${SUPPORTED_COINS[coin].symbol} cryptocurrency`, language: 'en', pageSize: 3 };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const newsText = data.articles.map((article: any) => article.title + ' ' + article.description).join(' ');
    return newsText.length > 1000 ? newsText.substring(0, 1000) + '...' : newsText;
  } catch (error) {
    console.error(`Error fetching news for ${coin}:`, error.message);
    const staticNews = STATIC_NEWS[coin] || [];
    return staticNews.map((event: Event) => event.title + ' ' + event.description).join(' ') || `No news available for ${coin}.`;
  }
};

const fetchGeneralCryptoNews = async (): Promise<Event[]> => {
  console.log('Fetching general cryptocurrency news via proxy');
  const params = { q: 'cryptocurrency OR blockchain OR bitcoin OR ethereum -inurl:(signup OR login)', language: 'en', pageSize: 5 };
  try {
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const articles = data.articles || [];
    if (articles.length === 0) {
      throw new Error('No general crypto news found');
    }
    return articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  } catch (error) {
    console.error('Error fetching general crypto news:', error.message);
    return [
      { title: "Crypto market update", description: "General trends in the cryptocurrency market.", url: "", publishedAt: new Date().toISOString() },
      { title: "Blockchain innovations", description: "Latest developments in blockchain technology.", url: "", publishedAt: new Date().toISOString() },
    ];
  }
};

export const fetchEvents = async (coin: string = 'BTC'): Promise<Event[]> => {
  console.log('Fetching events for', coin, 'via proxy');
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) {
    console.error(`Unsupported coin: ${coin}, falling back to general crypto news`);
    return fetchGeneralCryptoNews();
  }

  const params = {
    q: `${coin} OR ${coinInfo.symbol} cryptocurrency OR blockchain`,
    language: 'en',
    pageSize: 5,
    sortBy: 'relevancy',
  };
  try {
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const articles = data.articles || [];
    
    const relevantArticles = articles.filter((article: any) => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      return (
        text.includes(coin.toLowerCase()) ||
        text.includes(coinInfo.symbol.toLowerCase()) ||
        text.includes('cryptocurrency') ||
        text.includes('blockchain')
      );
    });

    if (relevantArticles.length >= 2) {
      return relevantArticles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        url: article.url,
        publishedAt: article.publishedAt,
      }));
    }

    console.log(`Insufficient relevant news for ${coin} (${relevantArticles.length} articles), falling back to static news`);
    return STATIC_NEWS[coin] || [];
  } catch (error) {
    console.error(`Error fetching events for ${coin}:`, error.message);
    return STATIC_NEWS[coin] || [];
  }
};

export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const params = {
      assets: coinInfo.coinMetrics,
      metrics: 'PriceUSD,CapMrktCurUSD,ActiveAddresses,TxCnt',
      start_time: startDate,
      end_time: endDate,
    };
    console.log(`CoinMetrics request params for ${coin}:`, params);
    const data = await makeProxiedRequest('coinmetrics', 'timeseries/asset-metrics', params);
    const assetData = data.data?.[0];
    if (assetData) {
      return {
        coin,
        activeWallets: parseInt(assetData.ActiveAddresses || assetData.PriceUSD ? 100000 : 0),
        activeWalletsGrowth: parseFloat(assetData.TxCnt ? (data.data[0].TxCnt - (data.data[1]?.TxCnt || 0)) / (data.data[1]?.TxCnt || 1) * 100 : 0),
        largeTransactions: parseInt(assetData.TxCnt ? assetData.TxCnt * 0.01 : 0),
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error('No data found for asset');
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin} via CoinMetrics:`, error.message, 'Response:', error.response?.data);
    const staticData = STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
    return staticData;
  }
};

const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });

const fetchSocialSentiment = async (coin: string): Promise<number> => {
  console.log('Fetching sentiment for', coin, 'via proxy');
  try {
    const params = {};
    const data = await makeProxiedRequest('reddit', 'r/CryptoCurrency.rss', params);
    const xmlData = parser.parse(data);

    const items = xmlData.feed?.entry || [];
    const coinRegex = new RegExp(`${coin}`, 'i');
    const relevantPosts = items
      .filter((item: any) => coinRegex.test(item.title?.['#text'] || ''))
      .slice(0, 5)
      .map((item: any) => {
        const title = item.title?.['#text'] || '';
        console.log(`Matched title for ${coin}:`, title);
        return title;
      });

    if (relevantPosts.length === 0) {
      console.log(`No relevant Reddit posts found for ${coin}`);
      return 0;
    }

    const fewShotExamples = [
      "Instruction: Analyze sentiment of 'BTC price up 5% today!'\n### Answer: 7",
      "Instruction: Analyze sentiment of 'ETH crash incoming'\n### Answer: -6",
      "Instruction: Analyze sentiment of 'SOL network stable'\n### Answer: 4",
      "Instruction: Analyze sentiment of 'XRP lawsuit news'\n### Answer: -3",
      "Instruction: Analyze sentiment of 'ADA great project'\n### Answer: 6",
      "Instruction: Analyze sentiment of 'DOGE to the moon'\n### Answer: 8",
      "Instruction: Analyze sentiment of 'SHIB scam alert'\n### Answer: -8",
      "Instruction: Analyze sentiment of 'LTC steady gains'\n### Answer: 5",
    ].join('\n\n');

    const prompt = `${fewShotExamples}\n\nInstruction: Analyze the sentiment of the following Reddit post titles about ${coin} and provide a score between -10 (very negative) and 10 (very positive):\n\n${relevantPosts.join('\n')}\n### Answer:`;

    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const sentimentResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST');

    const sentimentText = sentimentResponse.choices[0].message.content.trim();
    const socialScore = parseFloat(sentimentText) || 0;
    console.log(`Reddit sentiment score for ${coin}: ${socialScore}`);
    return Math.min(Math.max(socialScore, -10), 10);
  } catch (error) {
    console.error(`Error fetching social sentiment for ${coin} from Reddit:`, error.message);
    return 0;
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  console.log('Fetching sentiment data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  let newsScore = 0;
  let socialScore = 0;

  try {
    const newsText = await fetchRecentNews(coin);
    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Analyze the sentiment of the following text about ${coin} and provide a score between -10 (very negative) and 10 (very positive):\n\n${newsText}` }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const newsResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST');
    newsScore = parseFloat(newsResponse.choices[0].message.content.trim()) || 0;
    console.log(`News sentiment score for ${coin}: ${newsScore} (API: ${newsText.length > 0 ? 'Yes' : 'No'})`);

    const onChainData = await fetchOnChainData(coin);
    const normalizedWalletGrowth = Math.min(Math.max(onChainData.activeWalletsGrowth / 10, -1), 1);
    const normalizedLargeTransactions = Math.min(onChainData.largeTransactions / 5000, 1);
    console.log(`On-chain contribution for ${coin}: Growth=${normalizedWalletGrowth * 10}, LargeTx=${normalizedLargeTransactions * 10} (API: ${onChainData.activeWallets > 0 ? 'Yes' : 'No'})`);

    socialScore = await fetchSocialSentiment(coin);
    console.log(`Social sentiment score for ${coin}: ${socialScore} (API: ${socialScore !== 0 ? 'Yes' : 'No'})`);

    const sentimentScore = (0.5 * newsScore) + (0.2 * normalizedWalletGrowth * 10) + (0.2 * normalizedLargeTransactions * 10) + (0.1 * socialScore);
    const finalScore = Math.min(Math.max(sentimentScore, -10), 10);

    console.log(`Sentiment for ${coin}: News=${newsScore}, WalletGrowth=${normalizedWalletGrowth * 10}, LargeTx=${normalizedLargeTransactions * 10}, Social=${socialScore}, Total=${finalScore}`);
    return { coin, score: finalScore, socialScore, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error(`Error fetching sentiment for ${coin}, falling back to static data:`, error.message);
    const staticScore = STATIC_PRICE_CHANGES[coin] || 0;
    console.log(`Sentiment fallback for ${coin}: Static=${staticScore}`);
    return { coin, score: staticScore, socialScore: 0, timestamp: new Date().toISOString() };
  }
};
