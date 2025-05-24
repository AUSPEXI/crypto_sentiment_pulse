// src/utils/api.ts (updated excerpt)
import axios from 'axios';
import { SentimentData, OnChainData, Event } from '../types';

// ... (STATIC_COINS, SUPPORTED_COINS, getSupportedCoins, static data remain unchanged)

const fetchSocialSentiment = async (coin: string): Promise<number> => {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${SUPPORTED_COINS[coin].coingecko}`, {
      params: { localization: false, community_data: true },
    });
    const sentiment = response.data.community_data.positive_sentiment_percentage || 50; // 0-100
    // Convert to -10 to 10 (e.g., 75% -> 5, 25% -> -5)
    return (sentiment - 50) / 5;
  } catch (error) {
    console.error(`Error fetching social sentiment for ${coin}:`, error);
    return 0; // Neutral fallback
  }
};

export const fetchSentimentData = async (coin: string): Promise<SentimentData> => {
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    // Fetch news text
    const newsText = await fetchRecentNews(coin);

    // Analyze news sentiment with OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: `Analyze the sentiment of the following text about ${coin} and provide a score between -10 (very negative) and 10 (very positive):\n\n${newsText}`,
        max_tokens: 60,
        temperature: 0.5,
      },
      { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } },
    );
    const sentimentText = response.data.choices[0].text.trim();
    const newsScore = parseFloat(sentimentText) || 0;

    // Fetch on-chain data
    const onChainData = await fetchOnChainData(coin);
    const normalizedWalletGrowth = Math.min(Math.max(onChainData.activeWalletsGrowth / 10, -1), 1); // -1 to 1
    const normalizedLargeTransactions = Math.min(onChainData.largeTransactions / 5000, 1); // 0 to 1

    // Fetch social sentiment
    const socialScore = await fetchSocialSentiment(coin);

    // Combine scores with weights
    const sentimentScore = (0.5 * newsScore) + (0.2 * normalizedWalletGrowth * 10) + (0.2 * normalizedLargeTransactions * 10) + (0.1 * socialScore);
    const finalScore = Math.min(Math.max(sentimentScore, -10), 10); // Clamp to -10 to 10

    return {
      coin,
      score: finalScore,
      socialScore, // Optional, for debugging
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching sentiment for ${coin}, falling back to static data:`, error);
    const staticScore = STATIC_PRICE_CHANGES[coin] || 0;
    return { coin, score: staticScore, timestamp: new Date().toISOString() };
  }
};

// ... (fetchOnChainData, fetchEvents remain unchanged)
