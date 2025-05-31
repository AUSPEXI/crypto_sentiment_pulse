useEffect(() => {
  let isFetching = false;
  let abortController = new AbortController();

  const fetchData = async () => {
    if (isFetching) {
      abortController.abort();
      abortController = new AbortController();
    }
    isFetching = true;
    setLoading(true);
    setError(null);
    try {
      const newData: Record<string, SentimentData> = {};
      for (const coin of coinsToFetch) {
        const data = await withTimeout(fetchSentimentData(coin, { signal: abortController.signal }), 15000);
        if (data && data.score !== undefined) newData[coin] = data;
        else console.warn(`Incomplete sentiment data for ${coin}, skipping`);
      }
      setSentimentData(newData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching sentiment data:', err);
        setError('Failed to fetch sentiment data. Using fallback data.');
        const fallbackData: Record<string, SentimentData> = {};
        coinsToFetch.forEach(coin => {
          fallbackData[coin] = { coin, score: STATIC_PRICE_CHANGES[coin] || 0, socialScore: 0, timestamp: new Date().toISOString() };
        });
        setSentimentData(fallbackData);
      }
    } finally {
      isFetching = false;
      setLoading(false);
    }
  };

  fetchData();
  const intervalId = setInterval(fetchData, 6 * 60 * 60 * 1000);
  return () => {
    abortController.abort();
    clearInterval(intervalId);
  };
}, [coinsToFetch]);
