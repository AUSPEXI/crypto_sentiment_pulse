import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../utils/api';
import { Event } from '../types';

const EventAlerts: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to fetch events. Showing static data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 6 * 60 * 60 * 1000); // 6-hour refresh
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">Event Alerts</h2>
        <p className="text-gray-500">Loading events...</p>
      </div>
    );
  }

  if (error || events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">Event Alerts</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
        <p className="text-gray-500">No events available. Showing static data.</p>
        <ul className="list-disc pl-5 mt-2">
          {STATIC_NEWS.map(event => (
            <li key={event.id} className="text-sm text-gray-600">
              {event.title} ({new Date(event.date).toLocaleDateString()})
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Event Alerts</h2>
      <ul className="list-disc pl-5">
        {events.map(event => (
          <li key={event.id} className="text-sm text-gray-600">
            {event.title} ({new Date(event.date).toLocaleDateString()} - {event.description})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventAlerts;
