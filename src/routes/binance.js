const express = require('express');
const { getClient } = require('../binanceClient');

const router = express.Router();

/**
 * Test Binance connection
 * GET /api/binance/status
 */
router.get('/status', async (req, res) => {
  try {
    const client = getClient();
    
    // Test connection by getting server time
    const serverTime = await client.time();
    
    res.json({
      status: 'connected',
      testnet: process.env.BINANCE_TESTNET === 'true',
      serverTime: serverTime.serverTime,
      timestamp: new Date(serverTime.serverTime).toISOString()
    });
  } catch (error) {
    console.error('Binance connection error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Binance',
      error: error.message
    });
  }
});

/**
 * Get account information
 * GET /api/binance/account
 */
router.get('/account', async (req, res) => {
  try {
    const client = getClient();
    
    // Get account information
    const accountInfo = await client.accountInfo();
    
    res.json({
      status: 'success',
      testnet: process.env.BINANCE_TESTNET === 'true',
      account: {
        canTrade: accountInfo.canTrade,
        canWithdraw: accountInfo.canWithdraw,
        canDeposit: accountInfo.canDeposit,
        updateTime: accountInfo.updateTime,
        balanceCount: accountInfo.balances?.length || 0,
        // Only show non-zero balances
        balances: accountInfo.balances?.filter(balance => 
          parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
        ).map(balance => ({
          asset: balance.asset,
          free: balance.free,
          locked: balance.locked
        })) || []
      }
    });
  } catch (error) {
    console.error('Binance account error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get account information',
      error: error.message
    });
  }
});

/**
 * Get current prices for all symbols
 * GET /api/binance/prices
 */
router.get('/prices', async (req, res) => {
  try {
    const client = getClient();
    
    // Get all current prices
    const prices = await client.prices();
    
    // Convert to array and filter popular trading pairs
    const popularPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT'];
    const filteredPrices = popularPairs.reduce((acc, symbol) => {
      if (prices[symbol]) {
        acc[symbol] = prices[symbol];
      }
      return acc;
    }, {});
    
    res.json({
      status: 'success',
      testnet: process.env.BINANCE_TESTNET === 'true',
      prices: filteredPrices,
      totalSymbols: Object.keys(prices).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Binance prices error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get prices',
      error: error.message
    });
  }
});

/**
 * Get exchange information
 * GET /api/binance/exchange-info
 */
router.get('/exchange-info', async (req, res) => {
  try {
    const client = getClient();
    
    // Get exchange information
    const exchangeInfo = await client.exchangeInfo();
    
    res.json({
      status: 'success',
      testnet: process.env.BINANCE_TESTNET === 'true',
      exchange: {
        timezone: exchangeInfo.timezone,
        serverTime: exchangeInfo.serverTime,
        symbolsCount: exchangeInfo.symbols?.length || 0,
        rateLimitsCount: exchangeInfo.rateLimits?.length || 0
      }
    });
  } catch (error) {
    console.error('Binance exchange info error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get exchange information',
      error: error.message
    });
  }
});

/**
 * Get account balances (only non-zero balances)
 * GET /account
 */
router.get('/account', async (req, res) => {
  try {
    const client = getClient();
    
    // Get account information
    const accountInfo = await client.accountInfo();
    
    // Filter only non-zero balances
    const balances = accountInfo.balances?.filter(balance => 
      parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    ).map(balance => ({
      asset: balance.asset,
      free: parseFloat(balance.free),
      locked: parseFloat(balance.locked),
      total: parseFloat(balance.free) + parseFloat(balance.locked)
    })) || [];
    
    res.json({
      status: 'success',
      testnet: process.env.BINANCE_TESTNET === 'true',
      balances,
      balanceCount: balances.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Account balances error:', error.message);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Get portfolio value in USDT
 * GET /portfolio
 */
router.get('/portfolio', async (req, res) => {
  try {
    const client = getClient();
    
    // Get account balances
    const accountInfo = await client.accountInfo();
    const balances = accountInfo.balances?.filter(balance => 
      parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    ) || [];
    
    if (balances.length === 0) {
      return res.json({
        status: 'success',
        testnet: process.env.BINANCE_TESTNET === 'true',
        totalUSDT: 0,
        positions: [],
        timestamp: new Date().toISOString()
      });
    }
    
    // Get current prices for all symbols
    const prices = await client.prices();
    
    let totalUSDT = 0;
    const positions = [];
    
    for (const balance of balances) {
      const asset = balance.asset;
      const free = parseFloat(balance.free);
      const locked = parseFloat(balance.locked);
      const total = free + locked;
      
      let priceUSDT = 0;
      let valueUSDT = 0;
      
      if (asset === 'USDT') {
        // USDT is already in USDT
        priceUSDT = 1;
        valueUSDT = total;
      } else {
        // Try to get price for ASSET/USDT pair
        const symbol = `${asset}USDT`;
        if (prices[symbol]) {
          priceUSDT = parseFloat(prices[symbol]);
          valueUSDT = total * priceUSDT;
        } else {
          // If no USDT pair exists, skip this asset
          console.warn(`No USDT pair found for ${asset}`);
          continue;
        }
      }
      
      totalUSDT += valueUSDT;
      
      positions.push({
        asset,
        free,
        locked,
        total,
        priceUSDT,
        valueUSDT: parseFloat(valueUSDT.toFixed(2)),
        pct: 0 // Will calculate after we have totalUSDT
      });
    }
    
    // Calculate percentages
    positions.forEach(position => {
      position.pct = totalUSDT > 0 ? parseFloat(((position.valueUSDT / totalUSDT) * 100).toFixed(2)) : 0;
    });
    
    // Sort by value descending
    positions.sort((a, b) => b.valueUSDT - a.valueUSDT);
    
    res.json({
      status: 'success',
      testnet: process.env.BINANCE_TESTNET === 'true',
      totalUSDT: parseFloat(totalUSDT.toFixed(2)),
      positions,
      positionCount: positions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Portfolio calculation error:', error.message);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Get user's recent trades for a symbol
 * GET /trades?symbol=BTCUSDT&limit=20
 */
router.get('/trades', async (req, res) => {
  try {
    const client = getClient();
    const { symbol, limit = 20 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        error: 'Symbol parameter is required'
      });
    }
    
    // Get user's trades for the symbol
    const trades = await client.myTrades({
      symbol: symbol.toUpperCase(),
      limit: parseInt(limit)
    });
    
    // Format trades for frontend
    const formattedTrades = trades.map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      side: parseFloat(trade.qty) > 0 ? 'BUY' : 'SELL',
      quantity: parseFloat(trade.qty),
      price: parseFloat(trade.price),
      quoteQty: parseFloat(trade.quoteQty),
      commission: parseFloat(trade.commission),
      commissionAsset: trade.commissionAsset,
      time: trade.time,
      timestamp: new Date(trade.time).toISOString(),
      isBuyer: trade.isBuyer,
      isMaker: trade.isMaker
    }));
    
    res.json({
      status: 'success',
      testnet: process.env.BINANCE_TESTNET === 'true',
      symbol: symbol.toUpperCase(),
      trades: formattedTrades,
      tradeCount: formattedTrades.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trades error:', error.message);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Get market data (candlestick/klines) for charting
 * GET /market-data?symbol=BTCUSDT&interval=1h&limit=100
 */
router.get('/market-data', async (req, res) => {
  try {
    const client = getClient();
    const { symbol, interval = '1h', limit = 100 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        error: 'Symbol parameter is required'
      });
    }
    
    // Get candlestick data
    const klines = await client.candles({
      symbol: symbol.toUpperCase(),
      interval,
      limit: parseInt(limit)
    });
    
    // Format klines for charting (OHLC + volume + closeTime)
    const candlesticks = klines.map(kline => ({
      openTime: parseInt(kline.openTime),
      open: parseFloat(kline.open),
      high: parseFloat(kline.high),
      low: parseFloat(kline.low),
      close: parseFloat(kline.close),
      volume: parseFloat(kline.volume),
      closeTime: parseInt(kline.closeTime),
      timestamp: new Date(parseInt(kline.closeTime)).toISOString()
    }));
    
    res.json({
      status: 'success',
      testnet: process.env.BINANCE_TESTNET === 'true',
      symbol: symbol.toUpperCase(),
      interval,
      candlesticks,
      candleCount: candlesticks.length,
      timeframe: {
        start: new Date(candlesticks[0]?.openTime).toISOString(),
        end: new Date(candlesticks[candlesticks.length - 1]?.closeTime).toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market data error:', error.message);
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
