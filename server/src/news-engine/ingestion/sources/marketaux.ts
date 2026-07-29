import { logger } from '../../../lib/logger';

export async function fetchMarketAux(): Promise<Array<{
  headline: string;
  body?: string;
  publishedAt: Date;
  url?: string;
  externalId?: string;
  rawPayload: Record<string, unknown>;
}>> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) {
    logger.warn('[SourceRegistry:MarketAux] MARKETAUX_API_KEY is not set');
    return [];
  }

  const url = `https://api.marketaux.com/v1/news/all?api_token=${apiKey}&countries=in,us&language=en`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MarketAux API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from MarketAux API');
    }

    return data.data.map((item: any) => ({
      headline: item.title || 'Untitled',
      body: item.description || item.snippet || '',
      publishedAt: new Date(item.published_at),
      url: item.url,
      externalId: item.uuid,
      rawPayload: item,
    }));
  } catch (error: any) {
    logger.error(`[SourceRegistry:MarketAux] Fetch failed: ${error.message}`);
    throw error;
  }
}
