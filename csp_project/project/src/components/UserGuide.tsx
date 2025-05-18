import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const UserGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem('hasVisitedCSP');
    
    if (!hasVisited) {
      // Show the guide on first visit
      setIsOpen(true);
      localStorage.setItem('hasVisitedCSP', 'true');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-800">Welcome to Crypto Sentiment Pulse!</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Crypto Sentiment Pulse provides real-time sentiment analysis and on-chain insights for cryptocurrencies.
            Here's a quick guide to help you get started:
          </p>
          
          <div>
            <h3 className="text-lg font-medium text-blue-700 mb-2">Dashboard Panels</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <span className="font-medium">Sentiment Snapshot:</span> View real-time sentiment trends for selected cryptocurrencies.
                Toggle between different coins to compare sentiment scores.
              </li>
              <li>
                <span className="font-medium">On-Chain Insights:</span> Monitor active wallet growth and large transaction spikes.
                These metrics can help identify significant market movements.
              </li>
              <li>
                <span className="font-medium">Event Alerts:</span> Stay informed about upcoming crypto events like token unlocks,
                exchange listings, and protocol upgrades.
              </li>
              <li>
                <span className="font-medium">Portfolio Tracker:</span> Add your crypto holdings to track the sentiment score
                of your portfolio. This can help you gauge market sentiment toward your investments.
              </li>
              <li>
                <span className="font-medium">Tip Jar:</span> If you find the service valuable, consider supporting us with a tip.
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-blue-700 mb-2">Data Privacy</h3>
            <p className="text-gray-700">
              We collect anonymized data to improve our service and create AI datasets for researchers.
              Your portfolio data is never shared with identifiable information, and data collection is opt-in only.
              You can change your data sharing preferences in the Portfolio Tracker panel at any time.
            </p>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;