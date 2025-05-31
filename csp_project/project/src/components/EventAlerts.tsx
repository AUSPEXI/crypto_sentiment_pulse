// src/components/EventAlerts.tsx
import React, { useState, useEffect } from 'react';
import { fetchEvents, STATIC_NEWS, Event } from '../utils/api';

interface EventAlertsProps {
  asset: string;
}

const EventAlerts: React.FC<EventAlertsProps> = ({ asset }) => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetchEvents('newsapi', 'top-headlines', { q: asset });
        const fetchedArticles = Array.isArray(response.data?.articles) ? response.data.articles : [];
        setEvents(fetchedArticles.map((article: any) => ({
          title: article.title || 'No title',
          description: article.description || 'No description',
          url: article.url || '#',
        })));
      } catch (error) {
        console.error(`Error fetching events for ${asset}:`, error);
        const fallbackArticles = Array.isArray(STATIC_NEWS[asset]?.articles) ? STATIC_NEWS[asset].articles : [];
        setEvents(fallbackArticles);
      }
    };
    loadEvents();
  }, [asset]);

  return (
    <div>
      <h3>Event Alerts for {asset}</h3>
      {Array.isArray(events) && events.length > 0 ? (
        <ul>
          {events.map((event, index) => (
            <li key={index}>
              <a href={event.url} target="_blank" rel="noopener noreferrer">{event.title}</a>
              <p>{event.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No events available for {asset}.</p>
      )}
    </div>
  );
};

export default EventAlerts;
