import type { ArticleEditorialSummary } from '../../types/article';
import type { EditionConfig } from '../../types/edition';
import type {
  EconomicCalendarItem,
  EconomicCalendarSectionData,
  MarketSectionData,
  MarketTickerItem,
  NewspaperHeaderData,
  NewspaperSectionItem,
  StorySectionData,
  StructuredNewspaperData,
  TomorrowWatchItem,
  TomorrowWatchSectionData,
  WeatherSectionData,
} from '../../types/newspaper';
import type { MarketSnapshot } from '../../types/market';
import type { WeatherSnapshot } from '../../types/weather';
import { WeatherSectionFormatter } from '../../weather/formatter/weatherSectionFormatter';

function toRomanNumeral(num: number): string {
  const romanLookup: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  let remaining = num;
  for (const [val, letter] of romanLookup) {
    while (remaining >= val) {
      result += letter;
      remaining -= val;
    }
  }
  return result || 'I';
}

export class BroadsheetLayoutPlanner {
  private weatherFormatter = new WeatherSectionFormatter();

  planNewspaper(
    config: EditionConfig,
    articles: ArticleEditorialSummary[],
    marketSnapshot?: MarketSnapshot,
    weatherSnapshot?: WeatherSnapshot,
    economicEvents?: any[],
    pubDateStr?: string
  ): StructuredNewspaperData {
    const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
    const editionId = `ed_${pubDate.toISOString().split('T')[0]}_${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // 1. Build Header & Masthead
    const header = this.buildHeader(pubDate, config);

    // 2. Build Sections
    const sections: NewspaperSectionItem[] = [];

    // 2a. Stories: Top Story + Categorized Secondary Stories
    const storySections = this.buildStorySections(articles);
    sections.push(...storySections);

    // 2b. Markets Section
    if (marketSnapshot) {
      sections.push(this.buildMarketSection(marketSnapshot));
    }

    // 2c. Economic Calendar Section
    if (economicEvents && economicEvents.length > 0) {
      sections.push(this.buildEconomicCalendarSection(economicEvents, pubDate));
    }

    // 2d. Weather Section
    if (weatherSnapshot) {
      sections.push(this.weatherFormatter.formatWeatherSection(weatherSnapshot));
    }

    // 2e. Tomorrow Watch Section
    sections.push(this.buildTomorrowWatchSection(marketSnapshot, economicEvents));

    // 3. Assemble Complete Structured Data
    return {
      metadata: {
        editionId,
        schemaVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        targetFormat: config.format || 'webp',
        theme: config.theme || 'retro_black_cream',
        language: 'en',
      },
      header,
      sections,
      footer: {
        colophon: 'PRINTED & DISTRIBUTED ELECTRONICALLY BY THE FYNENCE TELEGRAPHIC SYNDICATE.',
        disclaimer: 'DISCLAIMER: All market values are historical and informational. Do not construe as financial advice.',
        sourceAttribution: 'SOURCE ATTRIBUTIONS: Official Exchange Wires, Twelve Data Services, and Certified Public Dispatches.',
      },
    };
  }

  private buildHeader(date: Date, config: EditionConfig): NewspaperHeaderData {
    const year = date.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
    ];

    const dayOfWeek = days[date.getUTCDay()];
    const month = months[date.getUTCMonth()];
    const dayOfMonth = date.getUTCDate();

    return {
      title: config.title || 'THE FYNENCE',
      subtitle: config.subtitle || 'DAILY FINANCIAL CHRONICLE & MERCANTILE GAZETTE',
      volumeNumber: `VOL. ${toRomanNumeral(year - 1900)}`,
      editionNumber: `NO. ${dayOfYear}`,
      date: `${month} ${dayOfMonth}, ${year}`,
      dayOfWeek,
      cityOrRegion: 'MAGELANG & GLOBAL EXCHANGES',
      priceTag: 'FIVE CENTS',
      motto: 'VERITAS IN NUMERIS',
    };
  }

  private buildStorySections(articles: ArticleEditorialSummary[]): StorySectionData[] {
    if (!articles || articles.length === 0) {
      return [];
    }

    // Sort by importance / editorial score
    const sorted = [...articles].sort((a, b) => {
      const rankA = a.importance === 'high' ? 3 : a.importance === 'medium' ? 2 : 1;
      const rankB = b.importance === 'high' ? 3 : b.importance === 'medium' ? 2 : 1;
      return rankB - rankA;
    });

    const storySections: StorySectionData[] = [];

    // Lead Story (Column Span 3 or 2)
    const lead = sorted[0];
    storySections.push({
      type: 'top_story',
      headline: lead.headline,
      kicker: 'LEAD FINANCIAL DISPATCH',
      summary: lead.summary,
      whyItMatters: lead.whyItMatters,
      keyPoints: lead.keyPoints || [],
      source: lead.sourceArticles?.[0]?.source || 'Wire Service',
      articleUrl: lead.sourceArticles?.[0]?.url || '',
      author: 'Bureau Staff',
      publishedAt: lead.generatedAt,
      image: lead.primaryArticle?.image_url ? {
        originalUrl: lead.primaryArticle.image_url,
        credit: lead.primaryArticle.image_credit || 'Source Wire',
        source: lead.primaryArticle.image_source || 'Archive',
        aspectRatio: '16:9',
        hasHalftone: true,
        fallbackType: 'none',
      } : undefined,
      columnSpan: 3,
    });

    // Secondary Stories
    for (let i = 1; i < sorted.length; i++) {
      const art = sorted[i];
      const validTypes: StorySectionData['type'][] = [
        'world', 'national', 'business', 'technology', 'finance', 'economy', 'forex', 'crypto',
      ];
      const sectionType = validTypes.includes(art.primarySection as any)
        ? (art.primarySection as StorySectionData['type'])
        : 'business';

      storySections.push({
        type: sectionType,
        headline: art.headline,
        kicker: (art.primarySection || 'REPORT').toUpperCase(),
        summary: art.summary,
        whyItMatters: art.whyItMatters,
        keyPoints: art.keyPoints,
        source: art.sourceArticles?.[0]?.source || 'Associated Wire',
        articleUrl: art.sourceArticles?.[0]?.url || '',
        author: 'Dispatch Correspondent',
        publishedAt: art.generatedAt,
        image: art.primaryArticle?.image_url ? {
          originalUrl: art.primaryArticle.image_url,
          credit: art.primaryArticle.image_credit || 'Source Archive',
          source: art.primaryArticle.image_source || 'Wire',
          aspectRatio: '16:9',
          hasHalftone: true,
          fallbackType: 'none',
        } : undefined,
        columnSpan: i === 1 ? 2 : 1,
      });
    }

    return storySections;
  }

  private buildMarketSection(snapshot: MarketSnapshot): MarketSectionData {
    const tickers: MarketTickerItem[] = [];
    const quotes = snapshot.quotesData || {};

    const categoryMap: Record<string, MarketTickerItem['category']> = {
      XAUUSD: 'metal',
      EURUSD: 'forex',
      GBPUSD: 'forex',
      USDJPY: 'forex',
      AUDUSD: 'forex',
      US30: 'index',
      US100: 'index',
      SPX: 'index',
      BTCUSD: 'crypto',
      ETHUSD: 'crypto',
      WTI: 'commodity',
      BRENT: 'commodity',
    };

    for (const [sym, quote] of Object.entries(quotes)) {
      if (!quote || typeof quote.price !== 'number') continue;

      const direction: 'up' | 'down' | 'flat' =
        quote.direction === 'UP' ? 'up' : quote.direction === 'DOWN' ? 'down' : 'flat';

      tickers.push({
        symbol: quote.symbol || sym,
        name: quote.name || sym,
        price: quote.price,
        change: quote.change ?? 0,
        changePercent: quote.changePercent ?? 0,
        direction,
        category: categoryMap[sym] || 'index',
      });
    }

    let moodDescription = 'Markets exhibit measured equilibrium across international mercantile exchanges.';
    if (snapshot.overallSentiment === 'BULLISH') {
      moodDescription = 'Ascending valuations predominate as institutional buying supports benchmark averages.';
    } else if (snapshot.overallSentiment === 'BEARISH') {
      moodDescription = 'Defensive positioning evident as selling pressure constrains cyclical and risk assets.';
    }

    return {
      type: 'markets',
      marketMood: snapshot.overallSentiment || 'NEUTRAL',
      moodDescription,
      asOfTimestamp: snapshot.capturedAt,
      tickers,
      macroSummary: snapshot.sentimentHeadline,
    };
  }

  private buildEconomicCalendarSection(events: any[], date: Date): EconomicCalendarSectionData {
    const dateStr = date.toISOString().split('T')[0];
    const items: EconomicCalendarItem[] = events.slice(0, 6).map((e) => ({
      time: e.event_time ? new Date(e.event_time).toTimeString().substring(0, 5) + ' UTC' : '12:00 UTC',
      currency: e.currency || 'USD',
      eventName: e.event_name || 'Economic Release',
      impact: (e.impact || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
      forecast: e.forecast || 'N/A',
      previous: e.previous || 'N/A',
      actual: e.actual || 'Pending',
    }));

    return {
      type: 'economic_calendar',
      title: 'OFFICIAL ECONOMIC CALENDAR & CENTRAL BANK DOCKET',
      date: dateStr,
      events: items,
    };
  }

  private buildTomorrowWatchSection(marketSnapshot?: MarketSnapshot, economicEvents?: any[]): TomorrowWatchSectionData {
    const items: TomorrowWatchItem[] = [
      {
        timeOrSession: '08:00 TOKYO',
        catalyst: 'Asian Cash Session Open & Nikkei Early Settlements',
        expectedSignificance: 'Opening momentum for regional sovereign debt and currency pairs.',
        affectedSectors: ['Forex', 'Asian Equities', 'Metals'],
      },
      {
        timeOrSession: '13:30 LONDON',
        catalyst: 'European Commercial Paper Liquidity & Sovereign Bond Yield Fixings',
        expectedSignificance: 'Continental trade balances and euro interest rate trajectory.',
        affectedSectors: ['Sovereign Bonds', 'EURUSD', 'European Banking'],
      },
      {
        timeOrSession: '14:30 NEW YORK',
        catalyst: 'Opening Bell & Federal Reserve Liquidity Window',
        expectedSignificance: 'Primary volatility catalyst for benchmark Wall Street indices.',
        affectedSectors: ['US Equities', 'Treasuries', 'Commodities'],
      },
    ];

    if (economicEvents && economicEvents.length > 0) {
      const topEvent = economicEvents[0];
      items.unshift({
        timeOrSession: 'SCHEDULED',
        catalyst: `${topEvent.currency || 'KEY'} Release: ${topEvent.event_name || 'Macro Indicator'}`,
        expectedSignificance: `Projected impact: ${(topEvent.impact || 'HIGH').toUpperCase()}. Scrutinized by macro desks.`,
        affectedSectors: [topEvent.currency || 'FX', 'Global Indices'],
      });
    }

    return {
      type: 'tomorrow_watch',
      title: 'THE TOMORROW WATCH: KEY MARKET CATALYSTS',
      items: items.slice(0, 4),
    };
  }
}
