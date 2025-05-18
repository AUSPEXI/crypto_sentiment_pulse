import React from 'react';
import { Heart } from 'lucide-react';

const TipJar: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Support CSP with a Tip!</h2>
      
      <div className="flex flex-col sm:flex-row items-center">
        <div className="mb-4 sm:mb-0 sm:mr-6">
          {/* Placeholder for QR code - in production, this would be an actual QR code image */}
          <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-md">
            <Heart className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-gray-700">
            If you find Crypto Sentiment Pulse useful, please consider supporting our work with a tip.
            Your contributions help us maintain and improve the service.
          </p>
          
          <div className="bg-blue-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Wallet Addresses</h3>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-12">BTC:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded select-all">bc1qxyz...</code>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-12">ETH:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded select-all">0xabc...</code>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-12">SOL:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded select-all">solxyz...</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipJar;