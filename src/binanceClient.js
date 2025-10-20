const Binance = require('binance-api-node').default;

/**
 * Get configured Binance client based on environment settings
 * @returns {Object} Binance client instance
 */
function getBinanceClient() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  
  // Handle testnet configuration - support both quoted and unquoted values
  const testnetEnv = process.env.BINANCE_TESTNET;
  const useTestnet = testnetEnv === 'true' || testnetEnv === '"true"' || testnetEnv === true;

  // Log testnet usage for Railway verification (without exposing API keys)
  console.log('[Binance] Using Testnet:', useTestnet);

  // Validate required environment variables
  if (!apiKey || !apiSecret) {
    throw new Error('BINANCE_API_KEY and BINANCE_API_SECRET are required');
  }

  let clientConfig = {
    apiKey,
    apiSecret
  };

  // Force testnet configuration when enabled
  if (useTestnet) {
    clientConfig.httpBase = 'https://testnet.binance.vision';
    clientConfig.wsBase = 'wss://testnet.binance.vision/ws';
    console.log('🧪 Binance client configured for TESTNET environment');
  } else {
    console.log('🚀 Binance client configured for MAINNET environment');
  }

  try {
    const client = Binance(clientConfig);
    console.log('✅ Binance client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize Binance client:', error.message);
    throw error;
  }
}

// Create and cache the client instance
let binanceClient = null;

/**
 * Get cached Binance client instance or create new one
 * @returns {Object} Binance client instance
 */
function getClient() {
  if (!binanceClient) {
    binanceClient = getBinanceClient();
  }
  return binanceClient;
}

module.exports = {
  getBinanceClient,
  getClient
};
