# AI Coach V2 Master Specification & Prompt Engineering Architecture
**TradeVault Platform — Institutional AI Mentor & Trading Intelligence System**  
**Document ID:** SPEC-AI-2026-004  
**Category:** AI Architecture & Prompt Engineering  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** AI Systems Architect & Product Lead  
**Target UX Score:** 9.8/10

---

## 1. Executive Summary & Design Vision

TradeVault AI Coach V2 is an institutional-grade, context-aware AI trading mentor. Unlike generic chatbots, the AI Coach operates directly upon the trader's verified order execution records, emotional journal logs, behavioral pattern memory, and live NSE/BSE market feeds.

### Design Metaphor
*"The AI Mentor who reads your trade journal, monitors live market tape, and prevents you from repeating your psychological mistakes."*

---

## 2. Trading Modes Specification

The AI Coach dynamically adjusts system prompts, token context budgets, and reasoning style according to 12 dedicated trading modes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI COACH V2 MODE SELECTOR                       │
│  [General] [Pre-Market] [Post-Market] [Trade Review] [Journal Coach]   │
│  [Discipline] [Weekly Review] [Monthly] [Portfolio] [Psychology] [Risk]│
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Mode Breakdown

| Mode Name | System Prompt Focus | Injected Context Layers | Output Structure |
|-----------|--------------------|-------------------------|------------------|
| **General Mentor** | Broad trading Q&A, strategy, market mechanics | 50 Trades + 30 Journals + Live Market | Conversational Mentor Tone |
| **Pre-Market Briefing** | Global cues, SGX Nifty, gap expectations, key levels | Overnight Global Indices + High-Impact Calendar + VIX | 5-Point Structured Morning Plan |
| **Post-Market Review** | Today's trade debrief, execution vs plan, net P&L | Today's Trades + Today's Journal + Closing Tape | P&L Summary + Best/Worst Trade + Action Item |
| **Trade Analysis** | Deep-dive into a single trade execution | Trade Details + Historical Symbol P&L + Setup Tags | Entry / Risk / Exit / Discipline Score (1-5) |
| **Journal Coach** | Emotional bias analysis, FOMO detection, mindset drift | 30 Journals + CoachMemory Patterns | Emotional Breakdown + Behavioral Recommendation |
| **Discipline Coach** | Rule compliance, stop-loss adherence, revenge trading | Discipline Evaluation History + CoachMemory | Strengths / Broken Rules / Focus Area |
| **Weekly Review** | Macro week performance, strategy win rates, best/worst days | 7-Day Trades + 7-Day Journals + Prev Review | Weekly P&L + Trajectory + Top 3 Improvements |
| **Monthly Review** | Long-term strategy effectiveness, instrument allocation | 30-Day Trades + Monthly P&L Matrix | Asset Performance + Strategy Retention/Pause |
| **Portfolio Review** | Instrument concentration risk, option vs equity exposure | All Trades by Symbol + Sector Exposures | Allocation Analysis + Rebalance Advice |
| **Psychology Coach** | Cognitive reframing, loss mitigation psychology | Psychological Tags + Drawdown Streaks | Empathetic & Direct Psychological Framework |
| **Risk Management** | Position sizing, drawdown limits, consecutive loss rules | P&L Variance + Max Drawdown Stats | Risk Metric Audit + Hard Loss Limits |
| **Educational** | Strategy definitions, Indian market rules, SEBI basics | Minimal (General Knowledge Base) | Definition + Indian Context + Real Example |

---

## 3. Context Window Token Budgeting (< 8,000 Tokens)

To guarantee sub-500ms Time-To-First-Token (TTFB) on Groq `llama-3.3-70b-versatile` and prevent attention dilution, context is tightly compressed:

| Context Block | Max Tokens | Compression & Formatting Standard |
|---------------|------------|-----------------------------------|
| System Identity & Rules | 400 | Immutable, strict formatting rules |
| Trader Profile & Stats | 300 | Pre-computed Win Rate, Avg P&L, Sharpe ratio |
| Trade History (Last 50) | 2,500 | `[2026-08-01] NIFTY CE 24800 \| LONG \| E:425 X:510 \| +₹8,500 \| S:TrendFollow \| M:Calm` |
| Journal Logs (Last 30) | 1,200 | `[2026-08-01] Mood:Calm \| Bias:BULLISH \| PnL:+₹8,500 \| Mistake:None \| Note:Followed plan` |
| Coach Memory Patterns | 600 | Top 5 active behavioral patterns with severity tags |
| Live Market & News Tape | 300 | Current Nifty/Sensex/Vix quotes + 5 top news headlines |
| Conversation History | 2,500 | Last 15 message turns (FIFO) |
| **Total Context Budget** | **~7,800** | **~6% of Groq 131k Window** |

---

## 4. Multi-Provider AI Architecture & Nemotron Roadmap

```
┌────────────────────────────────────────────────────────┐
│                   IProvider Interface                  │
│  + streamChat(messages, onToken, signal): Promise<void>│
│  + generateText(messages): Promise<string>             │
│  + generateJSON(messages, schema): Promise<object>     │
└───────────┬────────────────────────┬───────────────────┘
            │                        │
┌───────────▼───────────┐┌───────────▼───────────┐┌────────────────────────┐
│     GroqProvider      ││   NemotronProvider    ││    AnthropicProvider   │
│ - llama-3.3-70b       ││ - Llama-3.1-Nemotron  ││ - Claude 3.5 Haiku     │
│ - Ultra-Low Latency   ││ - Advanced Reasoning  ││ - News Engine Triage   │
│ - Live Chat & Summary ││ - Trade & Risk Review ││ - High Precision Tagger│
└───────────────────────┘└───────────────────────┘└────────────────────────┘
```

- **Groq Provider:** Handles low-latency interactive chat streaming and 5-minute market summaries.
- **NVIDIA Nemotron Provider:** Dedicated to deep-reasoning trade evaluations, JSON discipline scoring, and monthly reviews.
- **Anthropic Claude Provider:** Primary ingestion parser for the automated news triage engine.

---

## 5. Explicitly Excluded Features (Simplification Guardrails)

The following capabilities are strictly excluded to maintain focus on institutional trading utility:
1. ❌ **Voice Input / Text-to-Speech:** Distracting in active trading environments; traders utilize keyboard shortcuts.
2. ❌ **Chart Image OCR Upload:** Inefficient and hallucination-prone; the AI already has access to verified OHLCV data.
3. ❌ **Social Chat Sharing:** Trading journals contain confidential financial data.
4. ❌ **Custom Persona Prompting:** Increases prompt injection risk; one authoritative mentor persona is enforced.
5. ❌ **Automated Trade Signal Generation:** Violates SEBI advisory regulations.

---

## 6. SEBI Compliance Framework

Every market outlook generated by the AI Coach automatically appends the legal disclaimer:
> *"This analysis is for educational purposes only and does not constitute financial advice or investment recommendations under SEBI regulations. TradeVault AI analyzes historical execution data to assist with process discipline. All market investments are subject to market risks."*
