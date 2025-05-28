export const fetchOnChainData = async (coin: string, signal?: AbortSignal): Promise<OnChainData> => {
  console.log('Fetching on-chain data for', coin);
  const coinInfo = SUPPORTED_COINS[coin];
  if (!coinInfo) throw new Error(`Unsupported coin: ${coin}`);

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const params = {
      assets: coinInfo.coinMetrics,
      metrics: 'AdrActCnt,TxCnt', // Community API metrics
      start: startDate,
      end: endDate,
    };
    const data = await makeProxiedRequest('coinmetrics', 'v4/timeseries/asset-metrics', params, 'GET', 0, signal);
    const assetData = data.data?.[0];
    if (assetData) {
      const result = {
        coin,
        activeWallets: parseInt(assetData.AdrActCnt || '0'),
        activeWalletsGrowth: parseFloat(assetData.TxCnt ? (data.data[0].TxCnt - (data.data[1]?.TxCnt || 0)) / (data.data[1]?.TxCnt || 1) * 100 : 0),
        largeTransactions: parseInt(assetData.TxCnt ? assetData.TxCnt * 0.01 : 0),
        timestamp: new Date().toISOString(),
      };
      console.log(`Fetched live on-chain data for ${coin}`);
      return result;
    }
    throw new Error('No data found');
  } catch (error) {
    console.error(`On-chain data fetch failed for ${coin}:`, error.message);
    console.log(`Falling back to STATIC_WALLET_DATA for ${coin} due to CoinMetrics failure`);
    return STATIC_WALLET_DATA[coin] || { coin, activeWallets: 0, activeWalletsGrowth: 0, largeTransactions: 0, timestamp: new Date().toISOString() };
  }
};
