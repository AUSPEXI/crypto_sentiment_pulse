import React, { useState } from 'react';

// Placeholder wallet addresses - replace with your actual addresses
const METAMASK_WALLET_ADDRESS = '0xYourMetaMaskAddressHere'; // Replace with your Ethereum address
const BITCOIN_WALLET_ADDRESS = '1YourBitcoinAddressHere'; // Replace with your Bitcoin address

const TipJar: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum?.isMetaMask;

  // Function to initiate a MetaMask transaction
  const sendTipWithMetaMask = async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install MetaMask or copy the Ethereum address below.');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      // Initiate a transaction (default to 0.01 ETH)
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to: METAMASK_WALLET_ADDRESS,
            value: '0x2386F26FC10000', // 0.01 ETH in wei (0.01 * 10^18)
            gas: '0x5208', // 21000 gas (standard for ETH transfer)
          },
        ],
      });

      alert('Thank you for your tip in ETH! 🎉');
      setError(null);
    } catch (err: any) {
      console.error('Error sending tip via MetaMask:', err);
      setError(`Failed to send tip: ${err.message}`);
    }
  };

  // Function to copy wallet address to clipboard
  const copyToClipboard = (address: string, coin: string) => {
    navigator.clipboard.writeText(address);
    alert(`${coin} address copied to clipboard!`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Tip Jar</h2>
      <p className="text-gray-600 mb-4">
        Enjoying the app? Send a tip in ETH (or ERC-20 tokens) using MetaMask, or in BTC using the Bitcoin address below!
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* MetaMask Section for Ethereum-based Tips */}
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Tip with Ethereum (ETH)</h3>
          <button
            onClick={sendTipWithMetaMask}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isMetaMaskInstalled
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!isMetaMaskInstalled}
          >
            Send Tip via MetaMask (0.01 ETH)
          </button>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-gray-700">ETH Address:</span>
            <button
              onClick={() => copyToClipboard(METAMASK_WALLET_ADDRESS, 'Ethereum')}
              className="text-sm text-blue-600 hover:underline"
            >
              {METAMASK_WALLET_ADDRESS.slice(0, 6)}...{METAMASK_WALLET_ADDRESS.slice(-4)} (Copy)
            </button>
          </div>
          {!isMetaMaskInstalled && (
            <p className="text-sm text-gray-500 mt-2">
              Don’t have MetaMask?{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Install MetaMask
              </a>{' '}
              or copy the ETH address above to send a tip manually.
            </p>
          )}
        </div>

        {/* Bitcoin Section */}
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Tip with Bitcoin (BTC)</h3>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">BTC Address:</span>
            <button
              onClick={() => copyToClipboard(BITCOIN_WALLET_ADDRESS, 'Bitcoin')}
              className="text-sm text-blue-600 hover:underline"
            >
              {BITCOIN_WALLET_ADDRESS.slice(0, 6)}...{BITCOIN_WALLET_ADDRESS.slice(-4)} (Copy)
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Send BTC directly to the address above using your preferred Bitcoin wallet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TipJar;
