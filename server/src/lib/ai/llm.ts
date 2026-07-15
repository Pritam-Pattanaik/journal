import Groq from 'groq-sdk';
import {
  computeFullStats,
  runAllPatterns,
  analyzeDisciplineCorrelation,
  analyzeSymbolPerformance,
  BehavioralPattern,
} from './analytics';

let groq: Groq;

const COACH_SYSTEM_PROMPT = `
You are a brutally honest, elite trading coach and performance psychologist.

RESPONSE FORMAT (STRICT):
- Max 4 bullet points total. No intro. No outro. No headers.
- Start EVERY bullet with an emoji.
- Every bullet MUST cite a specific number from the data provided (₹ amount, %, trade count, discipline score).
- End with ONE short "Rule" line: a clear action the trader must adopt.
- Total response must be under 150 words.

TONE: Direct, clinical, data-first. Like a hedge fund risk manager reviewing a junior trader's book.
DO NOT give generic advice. If it couldn't have been written using the specific data provided, don't write it.
`;

export async function generateAIInsight(trades: any[]): Promise<{ content: string; patterns: BehavioralPattern[] }> {
  // Sort by date desc, take most recent 50
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  if (recentTrades.length === 0) {
    return {
      content: '📊 No trades found to analyze. Log your first trade to get coaching insights!',
      patterns: [],
    };
  }

  const stats = computeFullStats(recentTrades);
  const patterns = runAllPatterns(recentTrades);
  const discCorr = analyzeDisciplineCorrelation(recentTrades);
  const symbolPerf = analyzeSymbolPerformance(recentTrades);

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('GROQ_API_KEY is missing from environment variables. Using fallback analysis.');
    const fallback = [
      `⚠️ **API Key Missing:** Please add your GROQ_API_KEY in Vercel environment variables.`,
      `📊 **${recentTrades.length} trades analyzed.** Win rate: ${stats.winRate}%, total P&L: ₹${stats.totalPnl.toLocaleString('en-IN')}.`,
      ...patterns.map(p => `${p.severity === 'critical' ? '🔴' : '⚠️'} ${p.description}`),
      `📐 ${discCorr.insight}`,
    ].join('\n\n');
    return { content: fallback, patterns };
  }

  if (!groq) {
    groq = new Groq({ apiKey });
  }

  // Build the Behavioral Intelligence Report
  const patternLines = patterns.map(p => `• [${p.title.toUpperCase()}] ${p.description}`).join('\n');

  const userMessage = `
TRADER PERFORMANCE REPORT
─────────────────────────
Trades Analyzed: ${recentTrades.length}
Win Rate: ${stats.winRate}%
Total Net P&L: ₹${stats.totalPnl.toLocaleString('en-IN')}
Avg Win: ₹${stats.avgWin.toLocaleString('en-IN')} | Avg Loss: ₹${stats.avgLoss.toLocaleString('en-IN')}
R:R Ratio: ${stats.rrRatio} | Profit Factor: ${stats.profitFactor}

DISCIPLINE vs P&L BREAKDOWN
${discCorr.insight}

SYMBOL PERFORMANCE
${symbolPerf.details}

DETECTED BEHAVIORAL PATTERNS
${patternLines || '• No significant behavioral patterns detected.'}

RAW TRADE LOG (most recent ${Math.min(recentTrades.length, 15)} trades)
${recentTrades.slice(0, 15).map(t => {
    const d = typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0];
    return `[${d}] ${t.symbol} ${t.direction || ''} | ${t.status} | Net: ₹${parseFloat(t.netPnl || '0').toLocaleString('en-IN')} | Disc: ${t.disciplineScore ?? 'N/A'}/5 | Mindset: ${t.mindset?.substring(0, 60) || 'None'}`;
  }).join('\n')}

Give me a coach's debrief based ONLY on this specific data.
`.trim();

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: COACH_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || 'No insight generated.';
    return { content, patterns };
  } catch (err: any) {
    console.error('Groq API Error:', err);
    // Fallback: return a data-rich summary even if LLM fails
    const fallback = [
      `📊 **${recentTrades.length} trades analyzed.** Win rate: ${stats.winRate}%, total P&L: ₹${stats.totalPnl.toLocaleString('en-IN')}.`,
      ...patterns.map(p => `${p.severity === 'critical' ? '🔴' : '⚠️'} ${p.description}`),
      `📐 ${discCorr.insight}`,
    ].join('\n\n');
    return { content: fallback, patterns };
  }
}
