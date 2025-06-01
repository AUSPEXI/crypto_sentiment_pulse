// src/components/EventAlerts.tsx
import React, { useState, useEffect } from 'react';
import { fetchNews, STATIC_NEWS, Event } from '../utils/api';

interface EventAlertsProps {
  coin?: string; // Make coin optional
}

const EventAlerts: React.FC<EventAlertsProps> = ({ coin }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use a default coin if none provided, or skip fetch
        if (!coin) {
          setEvents(STATIC_NEWS['BTC'].articles || []);
          return;
        }
        const fetchedEvents = await fetchNews(coin);
        console.log('Fetched events structure:', fetchedEvents); // Debug log
        if (!fetchedEvents || !Array.isArray(fetchedEvents.articles)) {
          throw new Error('Invalid event data structure');
        }
        setEvents(fetchedEvents.articles);
      } catch (err) {
        console.error(`Error fetching events for ${coin}:`, err.message);
        setError('Failed to load events. Showing static data.');
        const fallbackArticles = STATIC_NEWS[coin]?.articles || STATIC_NEWS['BTC'].articles || [];
        setEvents(fallbackArticles);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [coin]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Event Alerts {coin ? `for ${coin}` : ''}</h2>
      {loading && <p>Loading events...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event, index) => (
            <li key={index} className="border p-2 rounded">
              <a href={event.url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                {event.title}
              </a>
              <p>{event.description}</p>
              <p className="text-sm text-gray-500">
                {event.publishedAt ? new Date(event.publishedAt).toLocaleString() : 'Date unavailable'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventAlerts;
