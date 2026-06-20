# Implementation Plan: Trade Position Aggregation

## Problem
Currently, the Dhan broker integration syncs raw individual order executions (e.g., partial fills, separate buys and sells) directly into the `trades` table. This clutters the UI and prevents the AI Coach from effectively analyzing performance because it needs completed **positions** (with entry price, exit price, and net P&L) rather than disconnected legs.

## Proposed Changes

We will refactor the sync logic to aggregate raw executions into consolidated positions.

### 1. Database Queries (`dhan.ts` & `index.ts`)
- Modify the sync endpoint to pass existing `OPEN` synced trades into the `syncDhanTrades` function. This ensures we can properly apply new closing executions to positions that were opened more than 30 days ago.
- Modify `syncDhanTrades` to return two arrays: `tradesToInsert` and `tradesToUpdate`.

### 2. Aggregation Engine (`dhan.ts`)
We will implement a FIFO position aggregator:
- **Initialize State**: Seed the aggregator with any existing `OPEN` positions from the database.
- **Sort**: Sort all raw Dhan trades chronologically by `exchangeTime`.
- **Process**: For each raw trade:
  - If the user has a flat position for the symbol, the trade opens a new position. We record its `entryPrice`, `quantity`, `direction`, and use its `exchangeTradeId` as the unique `brokerTradeId`.
  - If the trade is in the same direction as an open position (scaling in), we increase the `quantity` and calculate the new volume-weighted average `entryPrice`.
  - If the trade is in the opposite direction (closing or scaling out), we decrease the `quantity`, log the `exitPrice`, and calculate the realized P&L and charges for the closed portion.
  - If `quantity` reaches 0, the position is marked as `WIN`, `LOSS`, or `BREAKEVEN`.
- **Output**: Output newly formed positions to be inserted, and existing DB positions that had their exits/P&L updated.

### 3. Upsert Logic (`index.ts`)
- Iterate through `tradesToUpdate` and execute SQL `UPDATE` statements to update `exitPrice`, `quantity`, `pnl`, `netPnl`, `charges`, and `status`. We will NOT overwrite user-provided fields like `mindset`, `strategyId`, or `tags`.
- Execute a bulk `INSERT` for `tradesToInsert`.

## User Review Required
> [!IMPORTANT]  
> Since we are moving from raw orders to consolidated positions, you will have 80+ raw trades currently sitting in your TradeVault database from previous syncs. 
> To prevent data duplication and messy charts, I recommend that I run a one-time database cleanup to delete those existing synced raw trades before deploying this change, so your next sync starts fresh with clean, aggregated positions. 
> **Are you okay with me wiping the currently synced trades (manual trades will be untouched)?**

## Verification Plan
- Build and run the logic against the Dhan API.
- Verify that multiple partial fills collapse into a single position.
- Verify that a closed trade correctly displays Net P&L and Status instead of showing as `OPEN` with 0 P&L.
