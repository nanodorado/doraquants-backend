/**
 * API Key Authentication Middleware
 * 
 * If process.env.API_KEY is defined, requires x-api-key header to match
 * Excludes /health endpoint from authentication
 * If API_KEY is not defined, allows all requests (development mode)
 */
function apiKeyMiddleware(req, res, next) {
  const requiredApiKey = process.env.API_KEY;
  
  // If no API_KEY is set in environment, skip authentication (dev mode)
  if (!requiredApiKey) {
    console.log('🔓 API_KEY not set - authentication disabled (dev mode)');
    return next();
  }
  
  // Skip authentication for health check endpoint
  if (req.path === '/health') {
    return next();
  }
  
  // Get API key from headers
  const providedApiKey = req.headers['x-api-key'];
  
  // Check if API key is provided
  if (!providedApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Provide x-api-key header.'
    });
  }
  
  // Verify API key matches
  if (providedApiKey !== requiredApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key.'
    });
  }
  
  // API key is valid, proceed
  console.log('🔐 API key authenticated successfully');
  next();
}

module.exports = apiKeyMiddleware;
