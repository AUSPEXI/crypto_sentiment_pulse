import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../utils/api';
import { Event } from '../types';
import { format, parseISO } from 'date-fns';
import { Calendar, RefreshCw } from 'lucide-react';

const EventAlerts: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setRetrying(false);
    
    try {
      const data = await fetchEvents();
      // Sort events by date (closest first)
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(data);
    } catch (err: any) {
      setError(
        'Unable to load event data. This could be due to network issues or the service being temporarily unavailable. ' +
        'Please check your internet connection and try refreshing.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh data every hour
    const intervalId = setInterval(fetchData, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    fetchData();
  };

  const getEventTypeColor = (eventType: string): string => {
    switch (eventType.toLowerCase()) {
      case 'halving':
        return 'bg-purple-100 text-purple-800';
      case 'protocol upgrade':
        return 'bg-blue-100 text-blue-800';
      case 'mainnet upgrade':
        return 'bg-green-100 text-green-800';
      case 'exchange listing':
        return 'bg-yellow-100 text-yellow-800';
      case 'token unlock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-blue-800">Upcoming Events</h2>
        {error && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            Retry
          </button>
        )}
      </div>
      
      {loading && <p className="text-gray-500">Loading event data...</p>}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border border-red-200">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {!loading && !error && events.length === 0 && (
        <p className="text-gray-500">No upcoming events found.</p>
      )}
      
      {!loading && !error && events.length > 0 && (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="border-l-4 border-blue-500 pl-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    {format(parseISO(event.date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.eventType)}`}>
                  {event.eventType}
                </span>
              </div>
              
              <h3 className="font-medium text-gray-800 mt-1">
                {event.coin}: {event.title}
              </h3>
              
              <p className="text-sm text-gray-600 mt-1">
                {event.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventAlerts;