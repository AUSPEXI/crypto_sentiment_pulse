// EventAlerts.tsx
import React, { useState, useEffect } from 'react';
import { fetchEvents, STATIC_NEWS, Event } from '../utils/api';

interface EventAlertsProps {
  coin: string;
}

const EventAlerts: React.FC<EventAlertsProps> = ({ coin }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const fetchedEvents = await fetchEvents(coin);
        if (isMounted) {
          setEvents(fetchedEvents.length > 0 ? fetchedEvents : STATIC_NEWS[coin] || []);
        }
      } catch (err) {
        console.error('Error in EventAlerts:', err);
        if (isMounted) {
          setError('Failed to load events');
          setEvents(STATIC_NEWS[coin] || []);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted component
    };
  }, [coin]); // Dependency on coin to re-fetch only when coin changes

  if (isLoading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Events for {coin}</h3>
      {events.length === 0 ? (
        <p>No events available.</p>
      ) : (
        <ul>
          {events.map((event, index) => (
            <li key={index}>
              <strong>{event.title}</strong>: {event.description} ({event.publishedAt})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventAlerts;
