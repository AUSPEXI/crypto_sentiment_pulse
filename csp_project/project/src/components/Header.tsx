// src/components/Header.tsx
import React, { useState } from 'react';
import { Activity, Github, Menu, X } from 'lucide-react';
import Navigation from './Navigation';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <Activity className="h-8 w-8 text-accent-gold animate-pulse-glow" />
              <div className="absolute -inset-1 bg-accent-gold/20 rounded-full blur group-hover:bg-accent-gold/30 transition-colors duration-300" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-white to-accent-gold bg-clip-text text-transparent">
                Crypto Sentiment Pulse
              </h1>
              <p className="text-sm text-accent-cyan">
                Decode Crypto, Empower Your Pulse
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Navigation />
            <a 
              href="https://github.com/CryptexVision/crypto-sentiment-pulse" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-accent-cyan hover:text-accent-gold transition-colors duration-300"
            >
              <Github className="h-5 w-5" />
              <span>View on GitHub</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-accent-cyan hover:text-accent-gold transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2">
            <Navigation mobile />
            <a 
              href="https://github.com/CryptexVision/crypto-sentiment-pulse" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-accent-cyan hover:text-accent-gold transition-colors duration-300 mt-4"
            >
              <Github className="h-5 w-5" />
              <span>View on GitHub</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
