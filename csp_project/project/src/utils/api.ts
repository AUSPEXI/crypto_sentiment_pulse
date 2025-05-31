// api.ts (replace the relevant sections)
export const fetchEvents = async (api: string, endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/proxy?api=${api}&endpoint=${endpoint}¶ms=${encodeURIComponent(JSON.stringify({ ...params, pageSize: 5 }))}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Proxied request failed for ${api}/${endpoint}:`, error, `Status: ${error.status || 500}`, `Headers: ${JSON.stringify(error.headers || {})}`);
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
};

export const fetchSocialSentiment = async (asset: string): Promise<SentimentData> => {
  try {
    const response = await fetchEvents('reddit', 'r/CryptoCurrency.rss');
    const data = response.data.rss?.channel?.[0]?.item || [];
    const sentimentScore = analyzeSentiment(data); // Custom sentiment logic
    return { score: Math.max(-1, Math.min(1, sentimentScore)) };
  } catch (error) {
    console.error(`Error fetching social sentiment for ${asset} from Reddit:`, error);
    return { score: 0 }; // Fallback to neutral
  }
};

const analyzeSentiment = (data: any): number => {
  // Custom logic to analyze sentiment from RSS items
  // Example: Count positive/negative keywords
  return 0; // Placeholder, replace with actual logic
};
