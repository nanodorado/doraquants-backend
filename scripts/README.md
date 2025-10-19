# API Testing Scripts

This directory contains HTTP request files for testing the Doraquants Backend API using VSCode REST Client extension.

## Setup

1. Install the REST Client extension in VSCode:
   ```
   code --install-extension humao.rest-client
   ```

2. Open any `.http` file in VSCode and click the "Send Request" button above each request.

## Files

### `test-local.http`
Main testing file with commented examples for both development and production modes.
- Contains all available endpoints
- API key headers are commented out by default
- Uncomment the `x-api-key` lines when authentication is enabled

### `test-dev.http`
Simplified version for development mode (when `API_KEY` is not set in `.env`).
- No authentication headers
- All requests work without API keys (except Binance-authenticated endpoints)

### `test-authenticated.http`
Version with authentication enabled by default.
- Use when `API_KEY` is set in your `.env` file
- All requests include the `x-api-key` header
- Includes error testing scenarios

## Usage

### Development Mode (No API Key)
1. Ensure `API_KEY` is commented out in your `.env` file
2. Start the server: `npm run dev`
3. Use `test-dev.http` or `test-local.http` (keep API key lines commented)

### Production Mode (With API Key)
1. Set `API_KEY=your_secret_key` in your `.env` file
2. Start the server: `npm run dev`
3. Use `test-authenticated.http` or uncomment API key lines in `test-local.http`

## Endpoints Covered

### Public Endpoints
- `GET /health` - Health check
- `GET /api` - API info
- `GET /market-data` - Market candlestick data
- `GET /api/binance/prices` - Current prices
- `GET /api/binance/status` - Binance connection status

### Private Endpoints (Require Binance API Keys)
- `GET /account` - Account balances
- `GET /portfolio` - Portfolio value calculation
- `GET /trades` - User trade history

### Error Testing
- Invalid symbols
- Missing parameters
- Wrong API keys
- Missing authentication

## Variables

Update the variables at the top of each file:
```http
@baseUrl = http://localhost:4000
@apiKey = your_actual_api_key_here
```
