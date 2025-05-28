const MAX_DELAY_MS = 60 * 1000; // Increase to 60 seconds

const makeProxiedRequest = async (api: string, endpoint: string, params: any, method: 'GET' | 'POST' = 'GET', retries = 0, signal?: AbortSignal): Promise<any> => {
  // ... (existing code)
  const config: any = {
    method,
    url: proxyUrl,
    timeout: 10000,
    signal, // Add signal for abort
  };
  // ... (rest of the function)
};

const fetchCryptoPanicNews = async (coin: string, signal?: AbortSignal): Promise<Event[]> => {
  console.log('Fetching news from CryptoPanic for', coin);
  try {
    const params = {
      auth_token: process.env.CRYPTOPANIC_API_TOKEN,
      currencies: coin,
      kind: 'news',
      public: true,
    };
    const data = await makeProxiedRequest('cryptopanic', 'v1/posts', params, 'GET', 0, signal);
    const articles = data.results || [];
    return articles.map((article: any) => ({
      title: article.title,
      description: article.metadata?.description || '',
      url: article.url,
      publishedAt: article.published_at,
    }));
  } catch (error) {
    console.error(`CryptoPanic fetch failed for ${coin}:`, error.message);
    return [];
  }
};

const fetchRecentNews = async (coin: string, signal?: AbortSignal): Promise<string> => {
  console.log('Fetching news for', coin);
  try {
    const params = { q: `crypto ${coin} OR ${SUPPORTED_COINS[coin].symbol} cryptocurrency`, language: 'en', pageSize: 3 };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params, 'GET', 0, signal);
    const newsText = data.articles.map((article: any) => article.title + ' ' + (article.description || '')).join(' ').slice(0, 1000) + '...';
    console.log(`Fetched live news for ${coin}`);
    return newsText;
  } catch (error) {
    console.error(`News fetch failed for ${coin}:`, error.message);
    if (error.message.includes('Rate limit delay')) {
      console.log(`Falling back to CryptoPanic for ${coin} due to rate limit`);
      const cryptoPanicNews = (await fetchCryptoPanicNews(coin, signal)).map(event => event.title + ' ' + event.description).join(' ') || '';
      if (cryptoPanicNews) return cryptoPanicNews;
    }
    console.log(`Falling back to STATIC_NEWS for ${coin}`);
    const staticNews = STATIC_NEWS[coin]?.map(event => event.title + ' ' + event.description).join(' ') || 'No news available.';
    return staticNews;
  }
};

export const fetchOnChainData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const params = {
      assets: coinInfo.coinMetrics,
      metrics: 'AdrActCnt,TxTfrCnt',
      start: startDate,
      end: endDate,
    };
    const data = await makeProxiedRequest('coinmetrics', `v4/assets/${coinInfo.coinMetrics}/metric/daily`, params, 'GET', 0, signal);
    const assetData = data.data?.[0];
    if (assetData) {
      const result = {
        coin,
        activeWallets: parseInt(assetData.AdrActCnt || '0'),
        activeWalletsGrowth: parseFloat(assetData.TxTfrCnt ? (data.data[0].TxTfrCnt - (data.data[1]?.TxTfrCnt || 0)) / (data.data[1]?.TxTfrCnt || 1) * 100 : 0),
        largeTransactions: parseInt(assetData.TxTfrCnt ? assetData.TxTfrCnt * 0.01 : 0),
        timestamp: new Date().toISOString(),
      };
      console.log(`Fetched live on-chain data for ${coin}`);
      return result;
    }
    throw new Error('No data found');
  } catch (error) {
    console.error(`On-chain data fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_WALLET_DATA for ${coin} due to CoinMetrics failure`);
    return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }
};

const fetchSantimentOnChainData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  console.log('Fetching on-chain data from Santiment for', coin);
  try {
    const params = {
      slug: coin.toLowerCase(),
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
      metrics: ['daily_active_addresses', 'transaction_volume'],
    };
    const data = await makeProxiedRequest('santiment', `v2/projects/${coin.toLowerCase()}/metrics`, params, 'GET', 0, signal);
    const latest = data.data?.[data.data.length - 1] || {};
    return {
      coin,
      activeWallets: parseInt(latest.daily_active_addresses || '0'),
      activeWalletsGrowth: 0,
      largeTransactions: parseInt(latest.transaction_volume || '0') * 0.01,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Santiment fetch failed for ${coin}:`, error.message);
    return null;
  }
};

const fetchSocialSentiment = async (coin: string, signal?: AbortSignal): Promise<number> => {
  console.log('Fetching social sentiment for', coin);
  try {
    const data = await makeProxiedRequest('reddit', 'r/CryptoCurrency.rss', {}, 'GET', 0, signal);
    const xmlData = parser.parse(data);
    const items = xmlData.feed?.entry || [];
    const relevantPosts = items
      .filter((item: any) => new RegExp(coin, 'i').test(item.title?.['#text'] || ''))
      .slice(0, 5)
      .map((item: any) => item.title?.['#text'] || '');
    if (relevantPosts.length === 0) return 0;

    const prompt = `Analyze sentiment of ${relevantPosts.join(', ')} for ${coin}, score -10 to 10`;
    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const response = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST', 0, signal);
    const score = parseFloat(response.choices[0].message.content.trim()) || 0;
    console.log(`Fetched live social sentiment for ${coin}: ${score}`);
    return score;
  } catch (error) {
    console.error(`Social sentiment fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to default social sentiment (0) for ${coin}`);
    return 0;
  }
};

export const fetchSentimentData = async (coin: string, options: { signal?: AbortSignal } = {}): Promise<SentimentData> => {
  console.log('Fetching sentiment data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const newsText = await fetchRecentNews(coin, options.signal);
    const openAiParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Sentiment score -10 to 10 for: ${newsText}` }],
      max_tokens: 60,
      temperature: 0.5,
    };
    const newsResponse = await makeProxiedRequest('openai', 'chat/completions', openAiParams, 'POST', 0, options.signal);
    const newsScore = parseFloat(newsResponse.choices[0].message.content.trim()) || 0;

    const onChainData = await fetchOnChainData(coin, options.signal);
    const socialScore = await fetchSocialSentiment(coin, options.signal);
    const sentimentScore = (0.5 * newsScore) + (0.2 * onChainData.activeWalletsGrowth) + (0.2 * (onChainData.largeTransactions / 500)) + (0.1 * socialScore);
    const finalScore = Math.min(Math.max(sentimentScore, -10), 10);
    console.log(`Computed sentiment for ${coin}: ${finalScore}`);
    return {
      coin,
      score: finalScore,
      socialScore,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    console.error(`Sentiment data fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_PRICE_CHANGES for ${coin}`);
    return { coin, score: STATIC_PRICE_CHANGES[coin] || 0, socialScore: 0, timestamp: new Date().toISOString() };
  }
};

// Export static data
export { STATIC_PRICE_CHANGES };
