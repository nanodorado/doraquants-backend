const Binance = require('binance-api-node').default;

/**
 * Get configured Binance client based on environment settings
 * @returns {Object} Binance client instance
 */
function getBinanceClient() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  
  // Robust testnet detection for Railway environments
  const testnetEnv = process.env.BINANCE_TESTNET;
  let useTestnet = false;

  // Handle all possible Railway environment variable formats
  if (testnetEnv) {
    const cleanEnv = String(testnetEnv).toLowerCase().trim().replace(/['"]/g, '');
    useTestnet = cleanEnv === 'true' || cleanEnv === '1' || testnetEnv === true;
  }

  // Safe default: use mainnet if variable is missing or invalid
  if (testnetEnv === undefined || testnetEnv === null) {
    useTestnet = false;
    console.log('[Binance] BINANCE_TESTNET not set, defaulting to MAINNET');
  }

  // Log environment configuration clearly
  console.log('[Binance] Environment Detection:');
  console.log(`  BINANCE_TESTNET raw value: ${testnetEnv}`);
  console.log(`  Using Testnet: ${useTestnet}`);

  // Validate required environment variables (security: never log actual keys)
  if (!apiKey || !apiSecret) {
    console.error('❌ Missing required Binance API credentials');
    throw new Error('BINANCE_API_KEY and BINANCE_API_SECRET are required');
  }

  // Base client configuration
  let clientConfig = {
    apiKey,
    apiSecret
  };

  // Force specific endpoints for testnet configuration
  if (useTestnet) {
    clientConfig.httpBase = 'https://testnet.binance.vision';
    clientConfig.wsBase = 'wss://testnet.binance.vision/ws';
    console.log('🧪 Binance client configured for TESTNET environment');
    console.log('  HTTP Base: https://testnet.binance.vision');
    console.log('  WebSocket Base: wss://testnet.binance.vision/ws');
  } else {
    // Explicitly set mainnet (default behavior, but clearer logging)
    console.log('🚀 Binance client configured for MAINNET environment');
    console.log('  Using default Binance production endpoints');
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
