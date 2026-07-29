import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';
import { generateGroqJSON, streamGroqChat } from '../lib/ai/provider';

// ─── SEBI Compliance Disclaimer ───────────────────────────────────────────────
// Mandatory on every customer-facing AI-generated news analysis output.
// This protects the platform under SEBI Research Analyst Regulations, 2014
// and the 2024-25 SEBI finfluencer advisory framework.
const EDUCATIONAL_DISCLAIMER =
  '⚠️ Educational Use Only: This analysis is for educational purposes and market awareness only. ' +
  'It does not constitute investment advice, research, or a recommendation to buy, sell, or hold ' +
  'any security. Past sector observations do not guarantee future performance. Please consult a ' +
  'SEBI-registered financial advisor before making investment decisions. TradeVault is not a ' +
  'SEBI-registered Research Analyst.';

const router = Router();

// GET /api/news

router.get('/', authenticate, async (req: any, res) => {
  try {
    const category = req.query.category || 'general';
    const apiKey = process.env.MARKETAUX_API_KEY;
    
    if (!apiKey) {
      // Mock data if no API key is provided
      const mockArticles = [];
      const now = Date.now() / 1000;
      const daySeconds = 86400;
      
      const headlines = [
        'Markets hit record highs as inflation cools',
        'Tech stocks rally on strong earnings guidance',
        'Central bank signals potential rate cuts next quarter',
        'Oil prices stabilize amid geopolitical tensions',
        'Crypto markets see renewed institutional interest',
        'Retail sales data beats expectations',
        'New regulations proposed for AI sector',
        'Global supply chain bottlenecks ease',
        'Housing market shows signs of cooling',
        'Major merger announced in healthcare sector'
      ];

      for (let i = 0; i < 25; i++) {
        // Distribute articles over the last 35 days
        const daysAgo = i === 0 ? 0 : i === 1 ? 1 : i < 8 ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 25) + 8;
        mockArticles.push({
          id: String(i + 1),
          category: 'markets',
          headline: headlines[i % headlines.length] + (i > 9 ? ` (Update ${i})` : ''),
          url: `https://example.com/news/${i + 1}`,
          publishedAt: now - (daysAgo * daySeconds) - Math.floor(Math.random() * 3600),
          source: 'Mock News Network',
          summary: 'This is a mocked news summary to demonstrate the UI layout and features. The actual MarketAux API would provide real summaries here.',
          image: ''
        });
      }

      // Sort by newest first
      mockArticles.sort((a, b) => b.publishedAt - a.publishedAt);
      
      return res.json(mockArticles);
    }

    const response = await fetch(`https://api.marketaux.com/v1/news/all?api_token=${apiKey}&language=en&countries=us,in`);
    if (!response.ok) {
      throw new Error('Failed to fetch news from provider');
    }
    const data = await response.json();
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from MarketAux API');
    }

    // Map to generic format
    const formatted = data.data.map((item: any) => ({
      id: item.uuid,
      category: category,
      headline: item.title,
      url: item.url,
      publishedAt: Math.floor(new Date(item.published_at).getTime() / 1000),
      source: item.source,
      summary: item.description || item.snippet,
      image: item.image_url
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET /api/news/economic-calendar
router.get('/economic-calendar', authenticate, async (req: any, res) => {
  // MarketAux does not provide an economic calendar. Returning mock/static data.
  res.json([
    {
      id: 1,
      event: 'Fed Interest Rate Decision',
      impact: 'high',
      time: new Date(Date.now() + 86400000).toISOString(),
      country: 'US',
      estimate: '5.25%',
      actual: null
    }
  ]);
});

// POST /api/news/enrich
// COMPLIANCE NOTE: This endpoint is for educational market context only.
// All AI-generated analysis carries a mandatory disclaimer. No investment
// advice, buy/sell signals, or return predictions are made or implied.
router.post('/enrich', authenticate, async (req: any, res) => {
  try {
    const { id, headline, url, publishedAt, source, summary, image } = req.body;
    
    // Check if already enriched
    let enriched = await prisma.enrichedNews.findUnique({ where: { id: String(id) } });
    if (enriched) return res.json({ ...enriched, _disclaimer: EDUCATIONAL_DISCLAIMER });

    // Call AI to enrich — EDUCATIONAL_MODE only, no price predictions or buy/sell advice
    const prompt = `You are a strict Market Intelligence AI operating in EDUCATIONAL MODE.
Analyze this news article and provide a structured JSON response.

CRITICAL RULES:
- NEVER predict prices, returns, or percentage movements
- NEVER give buy/sell/hold advice on specific securities
- NEVER claim a specific accuracy or success rate for any analysis
- Provide ONLY factual context and sector-level educational commentary

Article:
Headline: ${headline}
Summary: ${summary || 'No summary provided, infer from headline.'}

Return JSON strictly matching this schema (no additional fields):
{
  "tldr": "1 sentence factual summary of what happened",
  "aiSummary": "1-2 paragraph objective summary: What happened, Why it occurred, Who is affected at sector level.",
  "whyItMatters": "Why this is educationally relevant to understanding market dynamics (sector-level only, no stock picks).",
  "historicalContext": "Brief factual mention of past similar macro/sector events",
  "categories": ["Category1"],
  "sectors": ["Sector1"],
  "companies": [],
  "financialTerms": [{"term": "Term", "definition": "Brief definition"}],
  "shortTermImpact": "What sector-level dynamics this may trigger in the near term (educational, no price targets)",
  "longTermImpact": "What structural sector implications this may have long term (educational)",
  "whatToWatchNext": "Key upcoming events or data releases relevant to this sector",
  "riskFactors": "Primary macro or sector-level risks associated with this news",
  "marketImpact": [
    {"asset": "Nifty Bank", "impact": "High", "sentiment": "Negative"},
    {"asset": "Nifty IT", "impact": "Low", "sentiment": "Neutral"}
  ]
}`;

    const aiData = await generateGroqJSON([{ role: 'user', content: prompt }]);

    enriched = await prisma.enrichedNews.create({
      data: {
        id: String(id),
        headline, url, source, image, originalSummary: summary,
        publishedAt: publishedAt || Math.floor(Date.now() / 1000),
        aiSummary: aiData.aiSummary || '',
        tldr: aiData.tldr || '',
        whyItMatters: aiData.whyItMatters || '',
        categories: aiData.categories || [],
        sectors: aiData.sectors || [],
        // In EDUCATIONAL_MODE, company-specific lists are intentionally limited
        // to avoid "coded reference" risk under SEBI's finfluencer guidelines
        companies: [],
        financialTerms: aiData.financialTerms || [],
        historicalContext: aiData.historicalContext || '',
        shortTermImpact: aiData.shortTermImpact || '',
        longTermImpact: aiData.longTermImpact || '',
        whatToWatchNext: aiData.whatToWatchNext || '',
        riskFactors: aiData.riskFactors || '',
        // probability/confidence fields are intentionally not stored for customer-facing use
        // as they constitute track-record claims under SEBI regulations
        probability: 0,
        confidence: 0,
        marketImpact: aiData.marketImpact || []
      }
    });
    
    // Always attach the educational disclaimer to every enriched response
    res.json({ ...enriched, _disclaimer: EDUCATIONAL_DISCLAIMER });
  } catch (error) {
    console.error('Enrichment error:', error);
    res.status(500).json({ error: 'Failed to enrich news' });
  }
});

// POST /api/news/:id/bookmark
router.post('/:id/bookmark', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const bookmark = await prisma.newsBookmark.upsert({
      where: { userId_newsId: { userId: req.userId, newsId: id } },
      update: { notes },
      create: { userId: req.userId, newsId: id, notes }
    });
    res.json(bookmark);
  } catch (error) {
    res.status(500).json({ error: 'Failed to bookmark' });
  }
});

// POST /api/news/link-trade
router.post('/link-trade', authenticate, async (req: any, res) => {
  try {
    const { newsId, tradeId, reason } = req.body;
    const link = await prisma.tradeNewsLink.create({
      data: { newsId, tradeId, reason }
    });
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: 'Failed to link trade' });
  }
});

// POST /api/news/:id/chat
router.post('/:id/chat', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    const article = await prisma.enrichedNews.findUnique({ where: { id } });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = `You are an educational Market Intelligence Assistant. You are answering questions about the following article:
Headline: ${article.headline}
Summary: ${article.aiSummary}
Why it matters: ${article.whyItMatters}

STRICT RULES:
1. ONLY Explain, Summarize, Simplify, Educate.
2. NEVER predict prices, market direction, or give buy/sell advice.
3. If asked for predictions, politely decline and explain your educational purpose.
`;

    await streamGroqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    );
    res.end();
  } catch (error) {
    res.status(500).end();
  }
});

export default router;
