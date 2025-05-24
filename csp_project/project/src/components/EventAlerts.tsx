// src/components/EventAlerts.tsx
import React from 'react';
import './EventAlerts.css';

const EventAlerts: React.FC = () => {
  return (
    <div className="event-alerts">
      <h2>Crypto News</h2>
      <div className="iframe-container">
        <iframe
          src="https://cryptopanic.com/widgets/news/?filter=hot¤cies=BTC,ETH,SOL,USDT,BNB,XRP,DOGE,TON,ADA,TRX,AVAX,SHIB,LINK,BCH,DOT,NEAR,LTC,MATIC,PEPE&theme=light"
          width="100%"
          height="400px"
          title="CryptoPanic News Widget"
        ></iframe>
      </div>
    </div>
  );
};

export default EventAlerts;
