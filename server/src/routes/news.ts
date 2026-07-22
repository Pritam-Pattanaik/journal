import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';
import { generateGroqJSON, streamGroqChat } from '../lib/ai/provider';

const router = Router();

// GET /api/news
router.get('/', authenticate, async (req: any, res) => {
  try {
    const category = req.query.category || 'general';
    const apiKey = process.env.FINNHUB_API_KEY;
    
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
          id: i + 1,
          category: 'markets',
          headline: headlines[i % headlines.length] + (i > 9 ? ` (Update ${i})` : ''),
          url: `https://example.com/news/${i + 1}`,
          publishedAt: now - (daysAgo * daySeconds) - Math.floor(Math.random() * 3600),
          source: 'Mock News Network',
          summary: 'This is a mocked news summary to demonstrate the UI layout and features. The actual Finnhub API would provide real summaries here.',
          image: ''
        });
      }

      // Sort by newest first
      mockArticles.sort((a, b) => b.publishedAt - a.publishedAt);
      
      return res.json(mockArticles);
    }

    const response = await fetch(`https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch news from provider');
    }
    const data = await response.json();
    
    // Map to generic format
    const formatted = data.map((item: any) => ({
      id: item.id,
      category: item.category,
      headline: item.headline,
      url: item.url,
      publishedAt: item.datetime,
      source: item.source,
      summary: item.summary,
      image: item.image
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET /api/news/economic-calendar
router.get('/economic-calendar', authenticate, async (req: any, res) => {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return res.json([
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
    }
    
    // Finnhub calendar requires from/to dates
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const to = nextWeek.toISOString().split('T')[0];

    const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch economic calendar');
    }
    
    const data = await response.json();
    const formatted = data.economicCalendar.map((item: any) => ({
      id: item.event + item.time,
      event: item.event,
      impact: item.impact || 'medium',
      time: item.time,
      country: item.country,
      estimate: item.estimate,
      actual: item.actual,
      previous: item.previous
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Economic calendar error:', error);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

// POST /api/news/enrich
router.post('/enrich', authenticate, async (req: any, res) => {
  try {
    const { id, headline, url, publishedAt, source, summary, image } = req.body;
    
    // Check if already enriched
    let enriched = await prisma.enrichedNews.findUnique({ where: { id: String(id) } });
    if (enriched) return res.json(enriched);

    // Call AI to enrich
    const prompt = `You are a strict Market Intelligence AI. Analyze this news article summary and provide a structured JSON response. 
NEVER predict prices or give investment advice. Strictly educational.

Article:
Headline: ${headline}
Summary: ${summary || 'No summary provided, infer from headline.'}

Return JSON strictly matching this schema:
{
  "tldr": "1 sentence extremely short summary",
  "aiSummary": "1-2 paragraph detailed objective summary answering: What happened, Why, and Who is affected.",
  "whyItMatters": "Concise explanation of why this is relevant to traders.",
  "historicalContext": "Brief mention of past similar events",
  "categories": ["Category1"],
  "sectors": ["Sector1"],
  "companies": ["Company1"],
  "financialTerms": [{"term": "Term", "definition": "Brief definition"}],
  "shortTermImpact": "Immediate market reaction/expectations (1-2 sentences)",
  "longTermImpact": "Structural/Long term implications (1-2 sentences)",
  "whatToWatchNext": "Key upcoming events or levels to monitor",
  "riskFactors": "Primary risks associated with this news",
  "probability": 85, 
  "confidence": 90,
  "marketImpact": [
    {"asset": "Tech Stocks", "impact": "High", "sentiment": "Bullish"},
    {"asset": "Bonds", "impact": "Medium", "sentiment": "Bearish"}
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
        companies: aiData.companies || [],
        financialTerms: aiData.financialTerms || [],
        historicalContext: aiData.historicalContext || '',
        shortTermImpact: aiData.shortTermImpact || '',
        longTermImpact: aiData.longTermImpact || '',
        whatToWatchNext: aiData.whatToWatchNext || '',
        riskFactors: aiData.riskFactors || '',
        probability: aiData.probability || 0,
        confidence: aiData.confidence || 0,
        marketImpact: aiData.marketImpact || []
      }
    });
    
    res.json(enriched);
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
