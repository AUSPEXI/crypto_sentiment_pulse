export const fetchOnChainData = async (coin: string): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const params = {
      assets: coinInfo.coinMetrics,
      metrics: 'PriceUSD,CapMrktCurUSD,ActiveAddresses,TxCnt',
      start_time: startDate,
      end_time: endDate,
    };
    console.log(`CoinMetrics request params for ${coin}:`, params);
    const data = await makeProxiedRequest('coinmetrics', 'timeseries/asset-metrics', params);
    console.log(`CoinMetrics raw response for ${coin}:`, data);

    const assetData = data.data?.[0];
    if (assetData) {
      return {
        coin,
        activeWallets: parseInt(assetData.ActiveAddresses || assetData.PriceUSD ? 100000 : 0),
        activeWalletsGrowth: parseFloat(assetData.TxCnt ? (data.data[0].TxCnt - (data.data[1]?.TxCnt || 0)) / (data.data[1]?.TxCnt || 1) * 100 : 0),
        largeTransactions: parseInt(assetData.TxCnt ? assetData.TxCnt * 0.01 : 0), // Approx 1% as large transactions
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error('No data found for asset');
  } catch (error) {
    console.error(`Error fetching on-chain data for ${coin} via CoinMetrics:`, error.message, 'Response:', error.response?.data);
    const staticData = STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
    return staticData;
  }
};
