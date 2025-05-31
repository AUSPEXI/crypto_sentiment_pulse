import { useState, useEffect } from 'react';
import { fetchEvents, fetchSentimentData, STATIC_NEWS, STATIC_PRICE_CHANGES } from '../utils/api';

// Timeout wrapper for promises
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeout]) as Promise<T>;
};

// Example usage in your component
const SentimentSnapshot = ({ coin }: { coin: string }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsPromise = withTimeout(fetchEvents(coin), 15000); // 15s timeout
        const sentimentPromise = withTimeout(fetchSentimentData(coin), 15000);
        const [fetchedEvents, fetchedSentiment] = await Promise.all([eventsPromise, sentimentPromise]);
        setEvents(fetchedEvents);
        setSentiment(fetchedSentiment);
      } catch (error) {
        console.error('Failed to load data:', error);
        setEvents(STATIC_NEWS[coin] || []);
        setSentiment({ coin, score: STATIC_PRICE_CHANGES[coin] || 0, socialScore: 0, timestamp: new Date().toISOString() });
      }
    };
    loadData();
  }, [coin]);

  return (
    <div>
      <h2>Events for {coin}</h2>
      {events.length > 0 ? (
        events.map((event, index) => (
          <div key={index}>
            {event.title}: {event.description} ({event.publishedAt})
          </div>
        ))
      ) : (
        <div>No events available</div>
      )}
      <h2>Sentiment for {coin}</h2>
      {sentiment ? (
        <div>
          Score: {sentiment.score} | Social Score: {sentiment.socialScore}
        </div>
      ) : (
        <div>No sentiment data available</div>
      )}
    </div>
  );
};

export default SentimentSnapshot;
