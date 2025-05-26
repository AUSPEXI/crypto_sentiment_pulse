// src/components/EventAlerts.tsx
import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../utils/api';
import { Event } from '../types';

interface EventAlertsProps {
  coin: string;
}

const EventAlerts: React.FC<EventAlertsProps> = ({ coin }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedEvents = await fetchEvents(coin);
        setEvents(fetchedEvents);
      } catch (err) {
        console.error(`Error fetching events for ${coin}:`, err);
        setError('Failed to fetch events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [coin]);

  if (loading) return <span className="text-gray-500">Loading events...</span>;
  if (error) return <span className="text-red-500">{error}</span>;
  if (events.length === 0) return <span className="text-gray-500">No events</span>;

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div key={index} className="bg-gray-50 p-2 rounded-md text-sm">
          <strong>{event.title}</strong>
          <p className="text-gray-600 text-xs">{event.date} - {event.source}</p>
          <p className="text-gray-700 text-xs">{event.description}</p>
        </div>
      ))}
    </div>
  );
};

export default EventAlerts;
