// src/components/Navigation.tsx
import React from 'react';
import { Activity, BarChart2, Calendar, Wallet, Heart, Database } from 'lucide-react';

interface NavigationProps {
  mobile?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ mobile = false }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navItems = [
    { id: 'about', label: 'About', icon: Activity },
    { id: 'sentiment', label: 'Sentiment', icon: BarChart2 },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'tip-jar', label: 'Tip Jar', icon: Heart },
    { id: 'datasets', label: 'Datasets', icon: Database },
  ];

  const baseClasses = "flex items-center space-x-2 text-sm text-accent-cyan hover:text-accent-gold transition-colors cursor-pointer";
  const mobileClasses = mobile ? "block py-2" : "";

  return (
    <nav className={`${mobile ? 'flex flex-col space-y-2' : 'flex items-center space-x-6'}`}>
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => scrollToSection(id)}
          className={`${baseClasses} ${mobileClasses}`}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
