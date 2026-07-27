/**
 * BSE Corporate Announcements Source Adapter
 *
 * Polls BSE's public announcement API (AnnPublish feed).
 * Covers BSE-listed companies not on NSE, providing complementary coverage.
 *
 * BSE offers a JSON API for corporate announcements accessible without auth.
 */

import { normalise, NormalisedItem } from '../../processing/Normalizer';

const BSE_ANNOUNCEMENTS_URL =
  'https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w?strCat=-1&strPrevDate=&strScrip=&strSearch=P&strToDate=&strType=C&subcategory=-1';

const BSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.bseindia.com',
  'Referer': 'https://www.bseindia.com/',
};

export interface RawSourceItem extends NormalisedItem {
  source: string;
  externalId?: string;
  rawPayload: Record<string, unknown>;
}

export async function fetchBSEAnnouncements(timeoutMs = 10_000): Promise<RawSourceItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(BSE_ANNOUNCEMENTS_URL, {
      headers: BSE_HEADERS,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`BSE API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    const items: any[] = data?.Table || data?.data || [];

    return items.slice(0, 50).map((item: any) => {
      const headline = [
        item.SLONGNAME || item.scrip_name || '',
        item.NEWSSUB || item.headline || item.subject || '',
      ]
        .filter(Boolean)
        .join(' — ')
        .trim() || 'BSE Announcement';

      const normalised = normalise({
        headline,
        body: item.NEWSSUB || item.headline || '',
        publishedAt: item.NEWS_DT || item.DisseminationDate || item.dt,
        url: item.ATTACHMENTNAME
          ? `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${item.ATTACHMENTNAME}`
          : 'https://www.bseindia.com/corporates/ann.html',
      });

      return {
        ...normalised,
        source: 'BSE',
        externalId: item.NEWSID || item.NewsNo || undefined,
        rawPayload: item as Record<string, unknown>,
      };
    });
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('BSE request timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
