const MAX_DELAY_MS = 60 * 1000; // Increase to 60 seconds

const fetchRecentNews = async (coin: string): Promise<string> => {
  console.log('Fetching news for', coin);
  try {
    const params = { q: `crypto ${coin} OR ${SUPPORTED_COINS[coin].symbol} cryptocurrency`, language: 'en', pageSize: 3 };
    const data = await makeProxiedRequest('newsapi', 'top-headlines', params);
    const newsText = data.articles.map((article: any) => article.title + ' ' + (article.description || '')).join(' ').slice(0, 1000) + '...';
    console.log(`Fetched live news for ${coin}`);
    return newsText;
  } catch (error) {
    console.error(`News fetch failed for ${coin}:`, error.message);
    if (error.message.includes('Rate limit delay')) {
      console.log(`Falling back to CryptoPanic for ${coin} due to rate limit`);
      const cryptoPanicNews = (await fetchCryptoPanicNews(coin)).map(event => event.title + ' ' + event.description).join(' ') || '';
      if (cryptoPanicNews) return cryptoPanicNews;
    }
    console.log(`Falling back to STATIC_NEWS for ${coin}`);
    const staticNews = STATIC_NEWS[coin]?.map(event => event.title + ' ' + event.description).join(' ') || 'No news available.';
    return staticNews;
  }
};
