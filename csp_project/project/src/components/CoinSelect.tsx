import React from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AVAILABLE_COINS } from '../types';

interface CoinSelectProps {
  selectedCoins: string[];
  onChange: (coins: string[]) => void;
}

const CoinSelect: React.FC<CoinSelectProps> = ({ selectedCoins, onChange }) => {
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
            {AVAILABLE_COINS.map((coin) => (
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