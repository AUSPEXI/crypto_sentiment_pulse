import React, { useState, useEffect } from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

interface CoinSelectProps {
  selectedCoins: string[];
  onChange: (coins: string[]) => void;
  availableCoins: string[];
}

// Manage coin details state internally
const CoinSelect: React.FC<CoinSelectProps> = ({ selectedCoins, onChange, availableCoins }) => {
  const [coinDetails, setCoinDetailsInternal] = useState<Coin[]>([]);

  // Function to set coin details, exported for App.tsx
  const setCoinDetails = (details: any[]) => {
    setCoinDetailsInternal(details.map(item => ({
      id: item.id || item.symbol.toLowerCase(),
      symbol: item.symbol,
      name: item.name || item.symbol // Fallback to symbol if name is missing
    })));
  };

  // Sync with availableCoins
  useEffect(() => {
    if (availableCoins.length > 0 && coinDetails.length === 0) {
      setCoinDetails(availableCoins.map(symbol => ({ id: symbol.toLowerCase(), symbol, name: symbol })));
    }
  }, [availableCoins, coinDetails.length]);

  return (
    <div className="relative w-full">
      <Listbox value={selectedCoins} onChange={onChange} multiple>
        <Listbox.Button className="relative w-full bg-white rounded-lg py-2 pl-3 pr-10 text-left shadow-md">
          <span className="block truncate">
            {selectedCoins.length === 0 
              ? 'Select coins...' 
              : `${selectedCoins.length} coin${selectedCoins.length > 1 ? 's' : ''} selected`}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>

        <AnimatePresence>
          <Listbox.Options 
            as={motion.ul}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            {coinDetails.map((coin) => (
              <Listbox.Option
                key={coin.id}
                value={coin.symbol}
                className={({ active, selected }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-blue-100' : ''
                  } ${selected ? 'bg-blue-50' : ''}`
                }
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                      {coin.name} ({coin.symbol})
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </AnimatePresence>
      </Listbox>
    </div>
  );
};

export default CoinSelect;
export { setCoinDetails };
