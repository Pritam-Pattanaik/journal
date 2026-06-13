# AI System — Technical Architecture & Implementation
## TradeVault · Version 1.0 · June 2026

---

## 1. AI System Overview

The TradeVault AI system is built in three independent layers. Each layer has a different job, different cost, and different latency. Never mix them up.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADEVAULT AI SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LAYER 1 — Rule Engine          LAYER 2 — Stats Engine           │
│  ─────────────────────          ───────────────────────          │
│  Pure TypeScript logic          Mathematical computation          │
│  Zero API cost                  Zero API cost                     │
│  < 5ms response                 < 20ms response                   │
│  Always-on, client-side         Server or client-side             │
│                                                                   │
│  Detects:                       Computes:                         │
│  · Revenge trades               · Win rate by strategy            │
│  · Boredom trades               · Avg R:R ratio                   │
│  · Overtrading                  · Discipline trend                │
│  · Rule violations              · Mindset → P&L correlation       │
│  · Pattern breaks               · Time-of-day performance         │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LAYER 3 — LLM Engine (Claude API)                               │
│  ─────────────────────────────────                               │
│  Used only for natural language coaching output                   │
│  ~$0.003–0.015 per analysis call                                  │
│  2–8 second response time                                         │
│  Triggered by: user request, weekly cron, trade annotation        │
│                                                                   │
│  Produces:                                                        │
│  · Deep behavioral analysis (manual trigger)                      │
│  · Per-trade feedback (on annotation save)                        │
│  · Weekly digest (automated Monday 7 AM)                          │
│  · AI chat responses (multi-turn coach)                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Rule:** Layers 1 and 2 run on every page load. Layer 3 only runs when triggered — never automatically on every trade sync.

---

## 2. Core Data Types

Define these first. Everything else in the AI system depends on them.

```typescript
// types/ai.types.ts

export interface Trade {
  id: string
  date: string                          // "2026-06-06"
  timestamp: Date                       // precise time for same-day ordering
  symbol: string                        // "NIFTY 24500 CE"
  market: 'NSE' | 'F&O' | 'Crypto'
  instrumentType: 'EQ' | 'CE' | 'PE' | 'FUT' | 'CRYPTO'
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  status: 'WIN' | 'LOSS' | 'BREAKEVEN'
  strategy: string
  mindset: string
  decision: string
  learnings: string
  disciplineScore: number               // 1–5
  tags: string[]
}

export interface PatternAlert {
  type: 'revenge_trade' | 'boredom_trade' | 'overtrade' | 'rule_violation'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  affectedTrades: Trade[]
  estimatedCost: number                 // P&L lost to this pattern
}

export interface TraderProfile {
  userId: string
  generatedAt: Date
  totalTrades: number
  accountAge: number                    // days

  behavioral: {
    revengeTradingRate: number          // % of trades that are revenge trades
    boredomTradeRate: number
    avgDisciplineScore: number
    disciplineTrend: 'improving' | 'declining' | 'stable'
    consistencyScore: number            // 0–100
  }

  performance: {
    overallWinRate: number
    bestStrategy: string
    worstStrategy: string
    bestTimeOfDay: string               // "09:30–10:30"
    worstTimeOfDay: string
    avgRR: number
    profitFactor: number                // gross profit / gross loss
  }

  knownTriggers: string[]               // behavioral weaknesses
  confirmedStrengths: string[]
  last30DaysSummary: string            // short natural language summary
}

export interface AIAnalysisResult {
  id: string
  type: 'deep_analysis' | 'trade_feedback' | 'weekly_digest'
  content: string
  tradeCount: number
  generatedAt: Date
  tokensUsed: number
}
```

---

## 3. Layer 1 — Rule-Based Pattern Detection Engine

This runs client-side on every dashboard load. No API calls. Pure deterministic logic.

### 3.1 Revenge Trading Detection

**Definition:** A trade entered within a short window after a loss, with a discipline score ≤ 2.

```typescript
// lib/ai/patterns/revenge-trading.ts

interface RevengeTradeResult {
  count: number
  totalCostINR: number
  incidents: Array<{
    revengeTrade: Trade
    triggeringLoss: Trade
    minutesBetween: number
    cost: number
  }>
  riskLevel: 'high' | 'medium' | 'low' | 'none'
}

export function detectRevengeTrades(
  trades: Trade[],
  options = { windowMinutes: 60, maxDisciplineScore: 2 }
): RevengeTradeResult {

  // Sort oldest to newest (same-day ordering requires timestamp)
  const sorted = [...trades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const incidents = []

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1]
    const current  = sorted[i]

    const minutesBetween =
      (new Date(current.timestamp).getTime() -
       new Date(previous.timestamp).getTime()) / 60000

    const isRevenge =
      previous.status === 'LOSS' &&
      current.disciplineScore <= options.maxDisciplineScore &&
      minutesBetween <= options.windowMinutes

    if (isRevenge) {
      incidents.push({
        revengeTrade:    current,
        triggeringLoss:  previous,
        minutesBetween:  Math.round(minutesBetween),
        cost:            current.pnl
      })
    }
  }

  const totalCostINR = incidents.reduce((sum, i) => sum + i.cost, 0)

  return {
    count:         incidents.length,
    totalCostINR,
    incidents,
    riskLevel:
      incidents.length >= 5 ? 'high'   :
      incidents.length >= 2 ? 'medium' :
      incidents.length >= 1 ? 'low'    : 'none'
  }
}
```

**Example output:**
```
Revenge Trading: 4 detected
Total cost: –₹8,340
Risk Level: high

Incident 1: BTC/USDT on 2026-06-04
  Triggering loss: NIFTY CE –₹3,450 at 11:22 AM
  Revenge trade entered: 11:47 AM (25 min later)
  Discipline score: 1/5
  Cost: –₹67
```

---

### 3.2 Boredom / Forced Trade Detection

```typescript
// lib/ai/patterns/boredom-trades.ts

const BOREDOM_KEYWORDS = [
  'bored', 'forced', 'no setup', 'nothing to do',
  'just felt like', 'wanted to trade', 'fomo',
  'couldn\'t wait', 'impatient', 'had to do something'
]

export function detectBoredomTrades(trades: Trade[]): {
  trades: Trade[]
  totalCost: number
  percentage: number
} {
  const boredomTrades = trades.filter(trade => {
    const text = `${trade.mindset} ${trade.decision} ${trade.tags.join(' ')}`.toLowerCase()
    return BOREDOM_KEYWORDS.some(keyword => text.includes(keyword)) ||
           trade.disciplineScore === 1
  })

  return {
    trades:      boredomTrades,
    totalCost:   boredomTrades.reduce((s, t) => s + t.pnl, 0),
    percentage:  Math.round((boredomTrades.length / trades.length) * 100)
  }
}
```

---

### 3.3 Overtrading Detection

```typescript
// lib/ai/patterns/overtrading.ts

export function detectOvertrading(
  trades: Trade[],
  dailyLimit = 3
): {
  overtradedDays: Array<{ date: string; count: number; pnl: number }>
  totalExcessTrades: number
  totalCostOfExcess: number
} {

  // Group trades by date
  const byDate = trades.reduce((acc, trade) => {
    if (!acc[trade.date]) acc[trade.date] = []
    acc[trade.date].push(trade)
    return acc
  }, {} as Record<string, Trade[]>)

  const overtradedDays = Object.entries(byDate)
    .filter(([_, dayTrades]) => dayTrades.length > dailyLimit)
    .map(([date, dayTrades]) => {
      // Calculate cost: P&L of trades BEYOND the limit
      const sorted     = dayTrades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      const excessTrades = sorted.slice(dailyLimit)
      return {
        date,
        count:          dayTrades.length,
        excessCount:    excessTrades.length,
        pnl:            excessTrades.reduce((s, t) => s + t.pnl, 0)
      }
    })

  return {
    overtradedDays,
    totalExcessTrades: overtradedDays.reduce((s, d) => s + d.excessCount, 0),
    totalCostOfExcess: overtradedDays.reduce((s, d) => s + d.pnl, 0)
  }
}
```

---

### 3.4 Running All Rules — The Pattern Engine

```typescript
// lib/ai/pattern-engine.ts

export function runPatternEngine(trades: Trade[]): PatternAlert[] {
  const alerts: PatternAlert[] = []

  const revenge    = detectRevengeTrades(trades)
  const boredom    = detectBoredomTrades(trades)
  const overtrade  = detectOvertrading(trades)

  if (revenge.riskLevel === 'high' || revenge.riskLevel === 'medium') {
    alerts.push({
      type:            'revenge_trade',
      severity:        revenge.riskLevel === 'high' ? 'critical' : 'warning',
      title:           `${revenge.count} Revenge Trades Detected`,
      description:     `Costing you ₹${Math.abs(revenge.totalCostINR).toLocaleString('en-IN')} across ${revenge.count} incidents`,
      affectedTrades:  revenge.incidents.map(i => i.revengeTrade),
      estimatedCost:   revenge.totalCostINR
    })
  }

  if (boredom.trades.length > 0) {
    alerts.push({
      type:            'boredom_trade',
      severity:        boredom.percentage > 20 ? 'critical' : 'warning',
      title:           `${boredom.trades.length} Forced/Boredom Trades`,
      description:     `${boredom.percentage}% of your trades have no real setup`,
      affectedTrades:  boredom.trades,
      estimatedCost:   boredom.totalCost
    })
  }

  if (overtrade.overtradedDays.length > 0) {
    alerts.push({
      type:            'overtrade',
      severity:        'warning',
      title:           `Overtrading on ${overtrade.overtradedDays.length} Days`,
      description:     `Excess trades cost you ₹${Math.abs(overtrade.totalCostOfExcess).toLocaleString('en-IN')}`,
      affectedTrades:  [],
      estimatedCost:   overtrade.totalCostOfExcess
    })
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })
}
```

---

## 4. Layer 2 — Statistical Analysis Engine

All math. No text generation.

```typescript
// lib/ai/stats-engine.ts

export function computeFullStats(trades: Trade[]) {

  const wins       = trades.filter(t => t.status === 'WIN')
  const losses     = trades.filter(t => t.status === 'LOSS')

  // ── Core metrics ──────────────────────────────────────────
  const winRate       = trades.length ? (wins.length / trades.length) * 100 : 0
  const totalPnL      = trades.reduce((s, t) => s + t.pnl, 0)
  const avgWin        = wins.length   ? wins.reduce((s, t)   => s + t.pnl, 0) / wins.length   : 0
  const avgLoss       = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0
  const rrRatio       = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0
  const grossProfit   = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss     = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const profitFactor  = grossLoss !== 0 ? grossProfit / grossLoss : 0

  // ── Strategy breakdown ─────────────────────────────────────
  const strategyMap: Record<string, { pnl: number; wins: number; count: number }> = {}
  trades.forEach(t => {
    if (!strategyMap[t.strategy]) strategyMap[t.strategy] = { pnl: 0, wins: 0, count: 0 }
    strategyMap[t.strategy].pnl   += t.pnl
    strategyMap[t.strategy].count += 1
    if (t.status === 'WIN') strategyMap[t.strategy].wins += 1
  })
  const strategyStats = Object.entries(strategyMap).map(([name, s]) => ({
    name,
    pnl:     s.pnl,
    winRate: (s.wins / s.count) * 100,
    count:   s.count,
    avgPnl:  s.pnl / s.count
  })).sort((a, b) => b.pnl - a.pnl)

  // ── Time of day analysis ───────────────────────────────────
  // Requires timestamp field
  const hourBuckets: Record<number, { pnl: number; count: number }> = {}
  trades.forEach(t => {
    const hour = new Date(t.timestamp).getHours()
    if (!hourBuckets[hour]) hourBuckets[hour] = { pnl: 0, count: 0 }
    hourBuckets[hour].pnl   += t.pnl
    hourBuckets[hour].count += 1
  })
  const hourStats = Object.entries(hourBuckets).map(([hour, d]) => ({
    hour:    parseInt(hour),
    label:   `${hour}:00–${parseInt(hour) + 1}:00`,
    pnl:     d.pnl,
    avgPnl:  d.pnl / d.count,
    count:   d.count
  }))
  const bestHour  = hourStats.sort((a, b) => b.avgPnl - a.avgPnl)[0]
  const worstHour = hourStats.sort((a, b) => a.avgPnl - b.avgPnl)[0]

  // ── Mindset → P&L correlation ──────────────────────────────
  // Tokenize mindset text and correlate with outcomes
  const mindsetMap: Record<string, { pnl: number; count: number }> = {}
  trades.forEach(t => {
    const keywords = t.mindset.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3)
    keywords.forEach(kw => {
      if (!mindsetMap[kw]) mindsetMap[kw] = { pnl: 0, count: 0 }
      mindsetMap[kw].pnl   += t.pnl
      mindsetMap[kw].count += 1
    })
  })
  const mindsetStats = Object.entries(mindsetMap)
    .filter(([_, d]) => d.count >= 3)          // only keywords seen 3+ times
    .map(([word, d]) => ({
      word,
      avgPnl:  d.pnl / d.count,
      count:   d.count
    }))
    .sort((a, b) => b.avgPnl - a.avgPnl)

  // ── Discipline → P&L correlation ──────────────────────────
  const discStats = [1, 2, 3, 4, 5].map(score => {
    const group = trades.filter(t => t.disciplineScore === score)
    return {
      score,
      count:   group.length,
      avgPnl:  group.length ? group.reduce((s, t) => s + t.pnl, 0) / group.length : 0,
      winRate: group.length ? (group.filter(t => t.status === 'WIN').length / group.length) * 100 : 0
    }
  })

  // ── Consecutive loss detection ─────────────────────────────
  let maxConsecutiveLosses = 0
  let currentStreak = 0
  const sortedByTime = [...trades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  sortedByTime.forEach(t => {
    if (t.status === 'LOSS') {
      currentStreak++
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak)
    } else {
      currentStreak = 0
    }
  })

  return {
    winRate:              Math.round(winRate * 10) / 10,
    totalPnL,
    avgWin:               Math.round(avgWin),
    avgLoss:              Math.round(avgLoss),
    rrRatio:              Math.round(rrRatio * 100) / 100,
    profitFactor:         Math.round(profitFactor * 100) / 100,
    strategyStats,
    bestStrategy:         strategyStats[0]?.name ?? 'N/A',
    worstStrategy:        strategyStats[strategyStats.length - 1]?.name ?? 'N/A',
    hourStats,
    bestHour:             bestHour?.label ?? 'N/A',
    worstHour:            worstHour?.label ?? 'N/A',
    mindsetStats,
    bestMindsetKeywords:  mindsetStats.slice(0, 3).map(m => m.word),
    worstMindsetKeywords: mindsetStats.slice(-3).map(m => m.word),
    discStats,
    maxConsecutiveLosses
  }
}
```

**Example output from `computeFullStats`:**
```json
{
  "winRate": 62.5,
  "totalPnL": 14820,
  "avgWin": 2340,
  "avgLoss": -1100,
  "rrRatio": 2.13,
  "profitFactor": 3.41,
  "bestStrategy": "Breakout",
  "worstStrategy": "Reversal",
  "bestHour": "9:00–10:00",
  "worstHour": "14:00–15:00",
  "bestMindsetKeywords": ["patient", "focused", "disciplined"],
  "worstMindsetKeywords": ["anxious", "revenge", "bored"],
  "maxConsecutiveLosses": 4
}
```

This alone gives a trader more insight than most paid tools provide. Zero API cost.

---

## 5. Layer 3 — Claude API Integration

### 5.1 The Prompt Architecture

The Claude prompt system has three components that work together:

```
┌──────────────────────────────────────────────────────┐
│  1. SYSTEM PROMPT (static + trader profile injected) │
│     Sets the AI's persona, rules, output format      │
├──────────────────────────────────────────────────────┤
│  2. CONTEXT BLOCK (trade data, stats summary)        │
│     Structured data the AI needs to analyze          │
├──────────────────────────────────────────────────────┤
│  3. INSTRUCTION (what to produce)                    │
│     Specific ask for this API call                   │
└──────────────────────────────────────────────────────┘
```

---

### 5.2 System Prompt — Deep Analysis

```typescript
// lib/ai/prompts/system-prompts.ts

export function buildCoachSystemPrompt(profile: TraderProfile): string {
  return `
You are a brutally honest trading performance coach. You specialize in Indian retail traders
trading NSE equities, F&O derivatives, and crypto. You have deep knowledge of behavioral finance,
trading psychology, and technical analysis.

TRADER CONTEXT:
- Account age: ${profile.accountAge} days
- Total trades analyzed: ${profile.totalTrades}
- Known behavioral weaknesses: ${profile.knownTriggers.join(', ') || 'none identified yet'}
- Confirmed strengths: ${profile.confirmedStrengths.join(', ') || 'none identified yet'}
- Last 30 days: ${profile.last30DaysSummary}
- Discipline trend: ${profile.behavioral.disciplineTrend}

YOUR RULES:
1. Every claim must reference specific trades by date and symbol
2. Use exact rupee amounts — never say "significant loss", say "₹3,450 loss"
3. Never give generic advice. Generic = useless
4. If you see improvement, acknowledge it specifically
5. Identify the ROOT behavioral cause, not just the symptom
6. Be direct. Avoid "you might want to consider" — say "stop doing X"

OUTPUT FORMAT (strict, always use these exact emoji headers):
🔴 CRITICAL ISSUES
(2-3 problems currently costing money — with trade references and rupee amounts)

🟡 BEHAVIORAL PATTERNS  
(2-3 early warning patterns — with data correlation)

✅ WHAT'S WORKING
(1-2 genuine strengths — only if data supports it)

📋 THIS WEEK: 3 ACTIONS
1. [specific, measurable, executable in 7 days]
2. [specific, measurable, executable in 7 days]  
3. [specific, measurable, executable in 7 days]

Length: 350–450 words. No padding, no motivational language.
`.trim()
}
```

---

### 5.3 Data Serialization — The Context Block

This is the most important function in the AI system. How you format trade data for Claude directly determines the quality of its output.

```typescript
// lib/ai/serialization.ts

interface SerializationOptions {
  maxTrades:     number    // default 30
  includeStats:  boolean   // prepend statistical summary
  format:        'compact' | 'detailed'
}

export function serializeTradesForClaude(
  trades: Trade[],
  stats:  ReturnType<typeof computeFullStats>,
  opts:   SerializationOptions = { maxTrades: 30, includeStats: true, format: 'detailed' }
): string {

  const recent = [...trades]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, opts.maxTrades)

  // ── Stats header (critical context for Claude) ─────────────
  const statsBlock = opts.includeStats ? `
=== TRADER STATISTICS (last ${trades.length} trades) ===
Win Rate: ${stats.winRate}% | Avg Win: ₹${stats.avgWin} | Avg Loss: ₹${stats.avgLoss}
R:R Ratio: ${stats.rrRatio}x | Profit Factor: ${stats.profitFactor}
Best Strategy: ${stats.bestStrategy} | Worst Strategy: ${stats.worstStrategy}
Best Time: ${stats.bestHour} | Worst Time: ${stats.worstHour}
Best mindset keywords: ${stats.bestMindsetKeywords.join(', ')}
Worst mindset keywords: ${stats.worstMindsetKeywords.join(', ')}
Max consecutive losses: ${stats.maxConsecutiveLosses}

=== INDIVIDUAL TRADES (most recent ${opts.maxTrades}) ===
` : ''

  // ── Trade rows ─────────────────────────────────────────────
  const tradeRows = recent.map(t => {
    if (opts.format === 'compact') {
      return `${t.date} | ${t.symbol} | ${t.status} ₹${t.pnl} | ${t.strategy} | "${t.mindset}" | D:${t.disciplineScore}/5`
    }

    // detailed format — more tokens but much better AI output
    return [
      `DATE: ${t.date}  SYMBOL: ${t.symbol}  MARKET: ${t.market}`,
      `RESULT: ${t.status} ₹${t.pnl}  STRATEGY: ${t.strategy}`,
      `MINDSET: "${t.mindset}"`,
      `DECISION: "${t.decision}"`,
      `LEARNINGS: "${t.learnings}"`,
      `DISCIPLINE: ${t.disciplineScore}/5`,
      '---'
    ].join('\n')
  }).join('\n')

  return statsBlock + tradeRows
}
```

**Why this matters — bad vs good serialization:**

Bad (Claude gives generic advice):
```
Trade 1: WIN +3250
Trade 2: LOSS -380
Trade 3: WIN +4250
```

Good (Claude gives specific advice):
```
DATE: 2026-06-04  SYMBOL: BTC/USDT  MARKET: Crypto
RESULT: LOSS ₹-67.5  STRATEGY: Scalp
MINDSET: "Revenge trading"
DECISION: "Entered immediately after a morning loss. No setup at all."
LEARNINGS: "Hard rule: 2 consecutive losses → stop trading."
DISCIPLINE: 1/5
```

The second format gives Claude the behavioral evidence to produce coaching that references this exact trade.

---

### 5.4 The Complete API Call — Deep Analysis

```typescript
// lib/ai/claude-client.ts

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY   // server-side only, never client
})

export async function runDeepAnalysis(
  trades:  Trade[],
  profile: TraderProfile
): Promise<{ text: string; tokensUsed: number }> {

  const stats        = computeFullStats(trades)
  const tradeContext = serializeTradesForClaude(trades, stats, {
    maxTrades:    30,
    includeStats: true,
    format:       'detailed'
  })

  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system:     buildCoachSystemPrompt(profile),
    messages: [
      {
        role:    'user',
        content: `Analyze my trading performance and give me honest coaching.\n\n${tradeContext}`
      }
    ]
  })

  const text       = response.content[0].type === 'text' ? response.content[0].text : ''
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

  return { text, tokensUsed }
}
```

---

### 5.5 Streaming — Real-Time Response Display

Without streaming, the user stares at a spinner for 6–8 seconds, then sees the full text dump. With streaming, text appears word by word — feels alive.

**Next.js Route Handler (server-side):**

```typescript
// app/api/ai/analyze/route.ts

import Anthropic from '@anthropic-ai/sdk'
import { auth }  from '@/lib/auth'
import { db }    from '@/lib/db'

const anthropic = new Anthropic()

export async function POST(req: Request) {

  // 1. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Load trades from Neon DB
  const trades = await db.query.trades.findMany({
    where: (t, { eq }) => eq(t.userId, session.user.id),
    orderBy: (t, { desc }) => [desc(t.date)],
    limit: 50
  })

  // 3. Load or generate trader profile
  const profile = await getOrBuildTraderProfile(session.user.id, trades)

  // 4. Build prompt inputs
  const stats        = computeFullStats(trades)
  const tradeContext = serializeTradesForClaude(trades, stats)

  // 5. Create streaming response
  const stream = await anthropic.messages.stream({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system:     buildCoachSystemPrompt(profile),
    messages:   [{ role: 'user', content: `Analyze my trades:\n\n${tradeContext}` }]
  })

  // 6. Pipe Claude stream → HTTP Response stream
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type  === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              new TextEncoder().encode(chunk.delta.text)
            )
          }
        }

        // Save completed analysis to DB
        const finalMessage = await stream.finalMessage()
        await db.insert(aiInsights).values({
          userId:       session.user.id,
          type:         'deep_analysis',
          content:      finalMessage.content[0].text,
          tradeCount:   trades.length,
          tokensUsed:   finalMessage.usage.input_tokens + finalMessage.usage.output_tokens
        })

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type':     'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked'
    }
  })
}
```

**React Frontend — consuming the stream:**

```typescript
// components/AICoach/AnalysisPanel.tsx

'use client'
import { useState } from 'react'

export function AnalysisPanel() {
  const [output,  setOutput]  = useState('')
  const [loading, setLoading] = useState(false)

  async function runAnalysis() {
    setLoading(true)
    setOutput('')

    const response = await fetch('/api/ai/analyze', { method: 'POST' })

    if (!response.ok || !response.body) {
      setOutput('Analysis failed. Please try again.')
      setLoading(false)
      return
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()

    // Stream text chunks into state as they arrive
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setOutput(prev => prev + decoder.decode(value, { stream: true }))
    }

    setLoading(false)
  }

  return (
    <div>
      <button onClick={runAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : 'Run Analysis'}
      </button>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{output}</pre>
    </div>
  )
}
```

---

## 6. Per-Trade AI Feedback — Structured JSON Output

When a trader saves an annotation, trigger a lightweight Claude call that returns structured JSON — not free-form text. This powers the small AI badge on each trade row.

```typescript
// lib/ai/trade-feedback.ts

interface TradeFeedback {
  verdict:         'strong' | 'acceptable' | 'weak' | 'mistake'
  verdictReason:   string
  behavioralFlag:  'revenge_trade' | 'boredom_trade' | 'late_entry' |
                   'premature_exit' | 'oversize' | 'none'
  keyLearning:     string
  patternMatch:    string | null    // "matches your winning pattern" or null
}

const TRADE_FEEDBACK_SYSTEM = `
You are a trading coach. Analyze one trade and return ONLY a JSON object.
No markdown. No explanation outside the JSON.
Return this exact schema:
{
  "verdict": "strong" | "acceptable" | "weak" | "mistake",
  "verdictReason": "one sentence, max 15 words",
  "behavioralFlag": "revenge_trade" | "boredom_trade" | "late_entry" | "premature_exit" | "oversize" | "none",
  "keyLearning": "one specific, actionable sentence, max 20 words",
  "patternMatch": "one sentence about whether this matches known patterns" | null
}
`.trim()

export async function getTradeFeeback(
  trade:   Trade,
  profile: TraderProfile
): Promise<TradeFeedback> {

  const tradeText = `
Trade: ${trade.symbol} on ${trade.date}
Result: ${trade.status} ₹${trade.pnl}
Strategy: ${trade.strategy}
Mindset: "${trade.mindset}"
Decision: "${trade.decision}"
Discipline: ${trade.disciplineScore}/5

Trader's known weaknesses: ${profile.knownTriggers.join(', ')}
Trader's strengths: ${profile.confirmedStrengths.join(', ')}
`.trim()

  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 300,                          // small — JSON only
    system:     TRADE_FEEDBACK_SYSTEM,
    messages:   [{ role: 'user', content: tradeText }]
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    // Strip any accidental markdown code fences
    const clean = rawText.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as TradeFeedback
  } catch {
    // Fallback if Claude returns malformed JSON
    return {
      verdict:        'acceptable',
      verdictReason:  'Could not parse AI feedback',
      behavioralFlag: 'none',
      keyLearning:    'Review this trade manually',
      patternMatch:   null
    }
  }
}
```

**Example Input → Output:**
```
Input trade:
  BTC/USDT | LOSS -₹67 | Mindset: "Revenge trading"
  Decision: "Entered after a morning loss, no setup"
  Discipline: 1/5

Output JSON:
{
  "verdict": "mistake",
  "verdictReason": "Entered with no setup after a loss — classic revenge trade",
  "behavioralFlag": "revenge_trade",
  "keyLearning": "Stop trading after 2 consecutive losses — log off until next session",
  "patternMatch": "Matches your known revenge trading pattern (4 previous incidents)"
}
```

---

## 7. AI Memory — The Trader Profile System

This is what makes the AI feel personal over time. Without it, every Claude call starts from scratch.

### 7.1 Building the Profile

```typescript
// lib/ai/trader-profile.ts

export async function buildTraderProfile(
  userId: string,
  trades: Trade[]
): Promise<TraderProfile> {

  const stats   = computeFullStats(trades)
  const revenge = detectRevengeTrades(trades)
  const boredom = detectBoredomTrades(trades)

  // Discipline trend: compare last 20 trades vs previous 20
  const sorted   = [...trades].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  const recent   = sorted.slice(0, 20)
  const previous = sorted.slice(20, 40)

  const recentAvgDisc   = recent.length   ? recent.reduce((s, t)   => s + t.disciplineScore, 0) / recent.length   : 3
  const previousAvgDisc = previous.length ? previous.reduce((s, t) => s + t.disciplineScore, 0) / previous.length : 3

  const disciplineTrend: TraderProfile['behavioral']['disciplineTrend'] =
    recentAvgDisc > previousAvgDisc + 0.3 ? 'improving' :
    recentAvgDisc < previousAvgDisc - 0.3 ? 'declining' : 'stable'

  // Behavioral weaknesses (computed, not LLM)
  const knownTriggers: string[] = []
  if (revenge.riskLevel !== 'none') {
    knownTriggers.push(`revenge trades after losses (${revenge.count} incidents)`)
  }
  if (boredom.percentage > 15) {
    knownTriggers.push(`boredom/forced trades (${boredom.percentage}% of all trades)`)
  }
  if (stats.worstHour) {
    knownTriggers.push(`underperforms in ${stats.worstHour} session`)
  }

  const confirmedStrengths: string[] = []
  if (stats.rrRatio > 2) {
    confirmedStrengths.push(`strong R:R ratio (${stats.rrRatio}x)`)
  }
  if (stats.profitFactor > 2) {
    confirmedStrengths.push(`profitable overall (profit factor ${stats.profitFactor})`)
  }
  if (recentAvgDisc >= 4) {
    confirmedStrengths.push(`high discipline recently (avg ${recentAvgDisc.toFixed(1)}/5)`)
  }

  // Short natural language summary for Claude context injection
  const last30DaysSummary = buildLast30Summary(trades.slice(0, 30), stats)

  const profile: TraderProfile = {
    userId,
    generatedAt: new Date(),
    totalTrades: trades.length,
    accountAge: getAccountAgeDays(trades),
    behavioral: {
      revengeTradingRate:  (revenge.count / trades.length) * 100,
      boredomTradeRate:    boredom.percentage,
      avgDisciplineScore:  recentAvgDisc,
      disciplineTrend,
      consistencyScore:    computeConsistencyScore(trades)
    },
    performance: {
      overallWinRate: stats.winRate,
      bestStrategy:   stats.bestStrategy,
      worstStrategy:  stats.worstStrategy,
      bestTimeOfDay:  stats.bestHour,
      worstTimeOfDay: stats.worstHour,
      avgRR:          stats.rrRatio,
      profitFactor:   stats.profitFactor
    },
    knownTriggers,
    confirmedStrengths,
    last30DaysSummary
  }

  // Persist to DB (regenerate weekly or on demand)
  await db.insert(traderProfiles)
    .values({ userId, profile: JSON.stringify(profile) })
    .onConflictDoUpdate({ target: traderProfiles.userId, set: { profile: JSON.stringify(profile), updatedAt: new Date() } })

  return profile
}

function buildLast30Summary(trades: Trade[], stats: ReturnType<typeof computeFullStats>): string {
  const wins   = trades.filter(t => t.status === 'WIN').length
  const losses = trades.filter(t => t.status === 'LOSS').length
  const pnl    = trades.reduce((s, t) => s + t.pnl, 0)
  return `Last 30 trades: ${wins}W/${losses}L, net ₹${pnl.toLocaleString('en-IN')}. Best strategy: ${stats.bestStrategy}. Primary issue: ${stats.worstMindsetKeywords[0] ?? 'none identified'}.`
}
```

### 7.2 How the Profile Flows Into Every Prompt

```
Every Claude call injects:

System Prompt:
  "Trader context:
   - Known weaknesses: revenge trades after losses (4 incidents), 
                       underperforms in 14:00–15:00 session
   - Confirmed strengths: strong R:R ratio (2.13x)
   - Last 30 days: 19W/11L, net ₹14,820. Best strategy: Breakout."

This means Claude never says generic things like
"you should have a stop loss" — it says
"your Breakout trades have a 2.1x R:R but your Reversal 
trades have destroyed ₹6,240 this month. Stop trading reversals."
```

---

## 8. Multi-Turn AI Chat

Users should be able to ask follow-up questions: "Why does my discipline drop on Fridays?" or "Which of my losses were avoidable?"

The challenge: Claude has no memory between calls. We manage conversation state in the DB.

```typescript
// lib/ai/chat.ts

interface ChatMessage {
  role:    'user' | 'assistant'
  content: string
}

export async function sendChatMessage(
  userId:      string,
  userMessage: string,
  history:     ChatMessage[],  // loaded from DB
  trades:      Trade[]
): Promise<{ reply: string; updatedHistory: ChatMessage[] }> {

  const stats        = computeFullStats(trades)
  const profile      = await getOrBuildTraderProfile(userId, trades)
  const tradeContext = serializeTradesForClaude(trades, stats, {
    maxTrades:    20,
    includeStats: true,
    format:       'compact'     // compact for chat — saves tokens
  })

  // Inject trade data only in first message to save tokens on follow-ups
  const isFirstMessage = history.length === 0

  const messages: ChatMessage[] = [
    // Prime the context if it's a fresh conversation
    ...(isFirstMessage ? [{
      role:    'user' as const,
      content: `Here is my trading data for context:\n\n${tradeContext}\n\nI will ask questions about this.`
    }, {
      role:    'assistant' as const,
      content: `Understood. I have your trading data loaded — ${trades.length} trades across ${new Set(trades.map(t => t.strategy)).size} strategies. What would you like to know?`
    }] : []),

    // Include conversation history (last 10 turns max — token budget)
    ...history.slice(-10),

    // New user message
    { role: 'user', content: userMessage }
  ]

  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 600,
    system:     buildCoachSystemPrompt(profile),
    messages
  })

  const reply          = response.content[0].type === 'text' ? response.content[0].text : ''
  const updatedHistory = [
    ...history,
    { role: 'user' as const,      content: userMessage },
    { role: 'assistant' as const, content: reply }
  ]

  return { reply, updatedHistory }
}
```

**Example conversation:**
```
User:    "Why am I losing money on Reversal trades?"
Claude:  "Your Reversal strategy has a 28% win rate across 18 trades,
          costing you ₹4,240. The pattern is consistent: you enter
          before confirmation (see HDFC Bank on June 2 and Reliance
          on June 5). Both had discipline scores of 2/5. You're
          predicting reversals instead of waiting for them to form."

User:    "What should I do specifically?"
Claude:  "Three rules for your Reversal trades:
          1. No entry until the reversal candle is fully closed
          2. Require a base of at least 3 candles at support
          3. If discipline score would be below 3 — skip the trade
          Apply these and track your Reversal win rate for 30 days."
```

---

## 9. Weekly Digest — Automated Pipeline

```typescript
// app/api/cron/weekly-digest/route.ts
// Scheduled: Monday 07:00 IST via Vercel Cron

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {

  // Verify this is a legitimate cron call
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get all active users with trades in the last 7 days
  const activeUsers = await db.query.users.findMany({
    where: (u, { gte }) => gte(u.lastTradeAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  })

  const results = { sent: 0, skipped: 0, failed: 0 }

  for (const user of activeUsers) {
    try {
      const weekTrades = await db.query.trades.findMany({
        where: (t, { and, eq, gte }) => and(
          eq(t.userId, user.id),
          gte(t.date, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        )
      })

      if (weekTrades.length === 0) { results.skipped++; continue }

      const stats        = computeFullStats(weekTrades)
      const tradeContext = serializeTradesForClaude(weekTrades, stats, {
        maxTrades:    20,
        includeStats: true,
        format:       'compact'
      })

      const digestResponse = await anthropic.messages.create({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 500,
        system:     WEEKLY_DIGEST_SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: tradeContext }]
      })

      const digest = digestResponse.content[0].text

      // Save to DB
      await db.insert(aiInsights).values({
        userId:     user.id,
        type:       'weekly_digest',
        content:    digest,
        tradeCount: weekTrades.length
      })

      // Send email
      await resend.emails.send({
        from:    'TradeVault Coach <coach@tradevault.in>',
        to:      user.email,
        subject: `Your Week in Trading — ${new Date().toLocaleDateString('en-IN')}`,
        html:    buildDigestEmail(digest, stats, user.name)
      })

      results.sent++
    } catch (err) {
      console.error(`Digest failed for user ${user.id}:`, err)
      results.failed++
    }
  }

  return Response.json(results)
}
```

---

## 10. Cost Management

Claude API is not free. Left unchecked, it can become expensive at scale.

### Token Budget Per Feature

| Feature | Model | Max Input Tokens | Max Output Tokens | Est. Cost |
|---|---|---|---|---|
| Deep Analysis | claude-sonnet-4-20250514 | ~3,000 | 1,000 | ~$0.018 |
| Per-Trade Feedback | claude-sonnet-4-20250514 | ~500 | 300 | ~$0.003 |
| Chat Message | claude-sonnet-4-20250514 | ~2,000 | 600 | ~$0.010 |
| Weekly Digest | claude-sonnet-4-20250514 | ~2,000 | 500 | ~$0.010 |

### Rate Limiting Strategy

```typescript
// lib/ai/rate-limiter.ts

export async function checkAIRateLimit(
  userId: string,
  feature: 'deep_analysis' | 'chat' | 'trade_feedback'
): Promise<{ allowed: boolean; reason?: string }> {

  const limits = {
    deep_analysis:  { maxPerDay: 3,  maxPerWeek: 10 },
    chat:           { maxPerDay: 20, maxPerWeek: 100 },
    trade_feedback: { maxPerDay: 50, maxPerWeek: 300 }
  }

  const limit = limits[feature]
  const today = new Date().toISOString().slice(0, 10)

  const todayCount = await db.query.aiInsights.findMany({
    where: (a, { and, eq, gte }) => and(
      eq(a.userId, userId),
      eq(a.type, feature),
      gte(a.createdAt, new Date(today))
    )
  })

  if (todayCount.length >= limit.maxPerDay) {
    return {
      allowed: false,
      reason:  `Daily limit of ${limit.maxPerDay} ${feature} analyses reached.`
    }
  }

  return { allowed: true }
}
```

### Input Compression — Reduce Tokens Without Losing Quality

```typescript
// For large trade histories, summarize older trades instead of sending raw data

function compressOldTrades(trades: Trade[]): string {
  // Last 15 trades: full detail
  // Trades 15–50: compact 1-line per trade
  // Trades 50+: aggregate statistics only

  const recent    = trades.slice(0, 15)
  const mid       = trades.slice(15, 50)
  const historical = trades.slice(50)

  const recentText = serializeTradesForClaude(recent,
    computeFullStats(recent), { maxTrades: 15, includeStats: false, format: 'detailed' })

  const midText = mid.map(t =>
    `${t.date} ${t.symbol} ${t.status} ₹${t.pnl} D:${t.disciplineScore}`
  ).join('\n')

  const historicalStats = historical.length > 0
    ? `\n[HISTORICAL: ${historical.length} trades, WR: ${computeFullStats(historical).winRate}%, Net: ₹${computeFullStats(historical).totalPnL}]`
    : ''

  return `${historicalStats}\n\nMID HISTORY:\n${midText}\n\nRECENT (detailed):\n${recentText}`
}
```

---

## 11. Complete Integration Sequence

**What happens when a user clicks "Run Analysis":**

```
1. Frontend: POST /api/ai/analyze
2. Route Handler: validateJWT → get userId
3. DB: load last 50 trades for userId (Neon DB, ~30ms)
4. DB: load trader profile (Neon DB, ~10ms)
5. AI Layer 1: runPatternEngine(trades) → alerts (~2ms)
6. AI Layer 2: computeFullStats(trades) → metrics (~5ms)
7. Serialization: serializeTradesForClaude() → ~3,000 tokens
8. Claude API: stream request sent (~200ms to first token)
9. Stream: text chunks piped to frontend in real-time
10. On stream complete: save result to ai_insights table
11. Update traderProfile with latest patterns
12. Frontend: display completed analysis
```

**Total latency:** ~200ms spinner → text starts appearing → 4–6 seconds to complete
**Total cost:** ~$0.018 per analysis

---

*Document Owner: Pritam | Version 1.0 | June 2026*
