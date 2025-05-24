// src/components/DatasetInfo.tsx
import React from 'react';
import { Database, ExternalLink } from 'lucide-react';

const DatasetInfo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">AI Datasets</h2>
      
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <Database className="h-8 w-8 text-blue-500" />
        </div>
        
        <div>
          <p className="text-gray-700 mb-3">
            We collect anonymized, aggregated data from Crypto Sentiment Pulse to create valuable datasets for AI researchers and developers.
            These datasets include sentiment trends, on-chain metrics, and event impacts - all without any personally identifiable information.
          </p>
          
          <div className="bg-blue-50 p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2">What's Included in Our Datasets</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Sentiment trends (positive/negative/neutral counts and scores) per coin, timestamped</li>
              <li>On-chain metrics (active wallets, large transactions) per coin, timestamped</li>
              <li>Event impacts (sentiment shifts 24 hours post-event), timestamped</li>
              <li>Portfolio sentiment scores (anonymized, with user consent)</li>
            </ul>
          </div>
          
          <a
            href="https://gumroad.com/your_datasets"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Buy Datasets for AI Research
          </a>
          
          <p className="mt-3 text-xs text-gray-500">
            All datasets are provided under a Creative Commons Attribution 4.0 license.
            We only collect data from users who have explicitly opted in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatasetInfo;
