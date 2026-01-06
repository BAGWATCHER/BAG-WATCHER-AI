# Trench Maps

Track Solana memecoin capital flows in real-time.

## Overview

Trench Maps monitors holders of a specific Solana token and detects when they swap to other memecoins (not stablecoins/SOL). This helps traders identify where capital is rotating before pumps happen.

**Key Insight:** When multiple holders of Token A swap directly to Token B (instead of exiting to SOL/USDC), it's a strong signal that Token B is the next play.

## Features

- Track any Solana token by mint address
- Monitor top 100 holders in real-time
- Detect memecoin-to-memecoin swaps only (filters out SOL/USDC exits)
- Rank destination tokens by:
  - Number of unique wallets swapping
  - Total swap count
  - Total volume
- Multiple time windows: 15min, 1hr, 4hr, 24hr
- Auto-refresh every 30 seconds

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js for REST API
- Helius API for Solana data
- In-memory caching (Redis-ready)

**Frontend:**
- React + TypeScript
- Vite
- Axios for API calls

## Project Structure

```
trench-maps/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── helius.service.ts       # Helius API integration
│   │   │   ├── swap.service.ts         # Swap detection & monitoring
│   │   │   └── aggregation.service.ts  # Flow aggregation logic
│   │   ├── controllers/
│   │   │   └── token.controller.ts     # API endpoints
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript types
│   │   ├── utils/
│   │   │   └── constants.ts            # Known tokens, DEX programs
│   │   └── index.ts                    # Main server
│   ├── package.json
│   └── .env                            # API keys
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.ts                  # API client
│   │   ├── App.tsx                     # Main UI
│   │   └── App.css                     # Styles
│   ├── package.json
│   └── .env                            # API base URL
│
├── PROJECT_CONTEXT.md                  # Detailed project plan
└── README.md                           # This file
```

## Setup & Installation

### Prerequisites

- Node.js 18+
- Helius API key (get one at https://helius.dev)

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```
HELIUS_API_KEY=your_api_key_here
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key_here
PORT=3000
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:3000
```

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

Server will start on http://localhost:3000

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will start on http://localhost:5173

## Usage

1. Open the frontend in your browser
2. Enter a Solana token mint address (e.g., a memecoin you're holding)
3. Click "Track Token"
4. Wait for the system to:
   - Fetch all token holders
   - Monitor their transactions
   - Detect swaps to other memecoins
5. View ranked list of destination tokens
6. Tokens with most unique wallets swapping to them = strongest signal

## API Endpoints

### POST `/api/tokens/track`
Start tracking a token
```json
{
  "mintAddress": "TokenMintAddressHere..."
}
```

### GET `/api/tokens/:mintAddress/flows?timeWindow=60`
Get aggregated flow data (where holders are swapping to)

### GET `/api/tokens/:mintAddress/swaps?timeWindow=60`
Get raw swap transactions

### DELETE `/api/tokens/:mintAddress/untrack`
Stop tracking a token

## How It Works

1. **Fetch Holders:** Uses Solana's `getParsedProgramAccounts` to get all token holders
2. **Monitor Transactions:** Polls Helius API for recent transactions from top 100 holders
3. **Parse Swaps:** Uses Helius Enhanced Transactions to identify DEX swaps
4. **Filter:** Removes swaps to SOL/USDC/USDT (major tokens)
5. **Aggregate:** Groups swaps by destination token, counts unique wallets
6. **Rank:** Sorts by unique wallet count (strongest signal)
7. **Display:** Shows top destination tokens in real-time

## Limitations (MVP)

- Monitors top 100 holders only (to avoid rate limits)
- Polling-based (webhooks coming in Phase 2)
- No database (in-memory only, resets on restart)
- No historical data retention beyond 24 hours
- Single token tracking at a time

## Roadmap

**Phase 2:**
- [ ] Helius webhooks for real-time updates
- [ ] PostgreSQL for persistent storage
- [ ] Multi-token tracking
- [ ] Historical playback

**Phase 3:**
- [ ] Sankey diagram visualization
- [ ] Wallet clustering (identify smart money)
- [ ] Alert system (Telegram/email)
- [ ] Mobile responsive design

## Troubleshooting

**No swaps detected:**
- Token may have low trading volume
- Holders may not be actively swapping
- Try a more active memecoin

**Rate limit errors:**
- Reduce number of holders being monitored
- Increase polling interval in `swap.service.ts`

**Connection errors:**
- Verify Helius API key is valid
- Check RPC URL is correct
- Ensure backend is running

## Contributing

This is an MVP. Feel free to:
- Add database integration
- Implement webhooks
- Add more DEX program IDs
- Improve UI/UX
- Add tests

## License

MIT

---

For detailed architecture, implementation plan, and future features, see [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
