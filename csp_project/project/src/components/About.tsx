// src/components/About.tsx
import React from 'react';
import { Github, ExternalLink } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100/20 p-6 space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">About Crypto Sentiment Pulse</h1>

      <div className="space-y-4">
        <p className="text-gray-700">
          Crypto Sentiment Pulse (CSP) is an open-source tool designed to simplify cryptocurrency market sentiment analysis. 
          Unlike complex trading platforms, CSP focuses on providing clear, actionable insights for the crypto community.
        </p>

        <div className="bg-blue-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">How It Works</h2>
          <p className="text-gray-700">
            CSP aggregates data from multiple sources to provide real-time sentiment analysis:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>Social media sentiment from platforms like Twitter and Reddit via LunarCrush API</li>
            <li>On-chain metrics through Glassnode API for wallet activity and transaction analysis</li>
            <li>Upcoming events data from CoinMarketCal for market-moving developments</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-blue-800">Why CSP?</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">🎯</span>
              <span>Simple and focused: Get clear insights without overwhelming technical analysis</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🤝</span>
              <span>Community-driven: Built for crypto enthusiasts by crypto enthusiasts</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🔒</span>
              <span>Privacy-first: No account required, opt-in only for data collection</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🌐</span>
              <span>Open-source: Transparent code and community contributions welcome</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Data Sources</h2>
          <p className="text-gray-700 mb-3">
            Our sentiment analysis combines multiple data points to provide accurate insights:
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              <span>Social Media Analysis: Real-time processing of crypto discussions</span>
            </li>
            <li className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              <span>On-Chain Metrics: Active wallet tracking and transaction analysis</span>
            </li>
            <li className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              <span>Event Calendar: Curated list of significant crypto events</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <a 
            href="https://github.com/CryptexVision/crypto-sentiment-pulse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Github className="h-5 w-5 mr-2" />
            View on GitHub
          </a>
          <a 
            href="https://x.com/CryptexVision"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <span className="mr-2 font-bold text-lg">𝕏</span>
            Follow Updates
          </a>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-6">
          <p className="text-sm text-gray-600">
            Created by Cryptex Vision - Bridging the gap between crypto and AI innovation. 
            If you find CSP useful, consider supporting its development through the tip jar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
