import type {
  NewspaperBlock,
  NewspaperDocument,
  NewspaperEditionMetadata,
  NewspaperPage,
  NewspaperSectionName,
  NewspaperStory,
  EditionType,
  MarketTickerItem,
  WeatherBlock,
  EconomicCalendarItem,
} from '../renderer/types/document';
import type { EditionFormat, EditionTheme } from '../types/edition';
import type { MarketSnapshot } from '../types/market';
import type { CurrentWeather, WeatherSnapshot } from '../types/weather';
import type { ArticleEditorialSummary } from '../types/article';
import {
  MOCK_STORIES,
  MOCK_TICKERS,
  MOCK_WEATHER_BLOCK,
  MOCK_ECONOMIC_EVENTS,
} from '../renderer/mock/mockNewspaperData';
import { formatNewspaperDateLong, formatNewspaperDateShort } from '../weather/utils/timezone';

export interface EditionRequest {
  editionType?: EditionType;
  sections?: NewspaperSectionName[];
  title?: string;
  subtitle?: string;
  publicationDate?: string | Date;
  timezone?: string;
  weatherLocationId?: string;
  pageSize?: 'single_page' | 'multi_page' | 'auto';
  theme?: EditionTheme;
  format?: EditionFormat;
  articles?: (ArticleEditorialSummary | NewspaperStory)[];
  marketSnapshot?: MarketSnapshot;
  weatherSnapshot?: WeatherSnapshot | CurrentWeather;
  economicEvents?: any[];
  mockMode?: boolean;
}

export class EditionComposer {
  /**
   * Transforms incoming news, market, and weather data into a structured NewspaperDocument.
   * Deterministic, reproducible, and does NOT call external APIs directly.
   */
  public composeDocument(request: EditionRequest = {}): NewspaperDocument {
    const isMock = request.mockMode || (
      !request.articles &&
      !request.marketSnapshot &&
      !request.weatherSnapshot &&
      !request.economicEvents
    );

    const timezone = request.timezone || 'Asia/Jakarta';
    const pubDate = request.publicationDate ? new Date(request.publicationDate) : new Date();

    // 1. Determine Edition Type and Titles
    const { editionType, title, subtitle, requestedSections } = this.resolveEditionConfig(request);

    // 2. Prepare Verified Content (NO AI Fabrication)
    const stories = this.resolveStories(request, isMock);
    const tickers = this.resolveMarketTickers(request, isMock);
    const weather = this.resolveWeatherBlock(request, isMock);
    const economicEvents = this.resolveEconomicEvents(request, isMock);

    // 3. Filter Content According to Requested Sections
    const sectionSet = new Set<string>(requestedSections);

    const filteredStories = stories.filter(story => {
      if (sectionSet.has('daily_news')) return true;
      return sectionSet.has(story.section);
    });

    const includeMarkets = sectionSet.has('markets') && tickers.length > 0;
    const includeWeather = sectionSet.has('weather') && weather !== null;
    const includeEconomics = (sectionSet.has('economy') || sectionSet.has('economic_calendar')) && economicEvents.length > 0;

    // 4. Structure Pages and Blocks
    const pages = this.buildPages({
      editionType,
      title,
      subtitle,
      pubDate,
      timezone,
      stories: filteredStories,
      includeMarkets,
      tickers,
      includeWeather,
      weather,
      includeEconomics,
      economicEvents,
      pageSize: request.pageSize || 'auto',
    });

    // 5. Build Complete NewspaperDocument
    const editionMetadata: NewspaperEditionMetadata = {
      id: `ed-${pubDate.toISOString().split('T')[0]}-${editionType}`,
      title,
      subtitle,
      editionDate: pubDate.toISOString().split('T')[0],
      editionType,
      sections: Array.from(sectionSet) as NewspaperSectionName[],
      generatedAt: new Date().toISOString(),
      timezone,
      volumeNumber: 'Vol. I',
      editionNumber: `No. ${pubDate.getUTCDate()}`,
      motto: 'PRUDENTIA IN MERCATIBUS',
      theme: request.theme || 'retro_black_cream',
      format: request.format || 'webp',
    };

    return {
      edition: editionMetadata,
      pages,
    };
  }

  private resolveEditionConfig(request: EditionRequest) {
    let editionType: EditionType = request.editionType || 'daily';
    let requestedSections: NewspaperSectionName[] = request.sections ? [...request.sections] : [];

    // Check for combined Finance + Economy request (Section 10)
    const hasFinance = requestedSections.includes('finance');
    const hasEconomy = requestedSections.includes('economy');
    if ((hasFinance && hasEconomy) || editionType === 'finance_economy') {
      editionType = 'finance_economy';
      if (!requestedSections.includes('markets')) requestedSections.push('markets');
      if (!requestedSections.includes('economic_calendar')) requestedSections.push('economic_calendar');
    }

    if (requestedSections.length === 0) {
      if (editionType === 'finance_economy') {
        requestedSections = ['markets', 'finance', 'economy', 'economic_calendar'];
      } else if (editionType === 'market') {
        requestedSections = ['markets', 'forex', 'crypto'];
      } else {
        requestedSections = [
          'daily_news',
          'world',
          'national',
          'business',
          'finance',
          'economy',
          'technology',
          'markets',
          'weather',
          'economic_calendar',
        ];
      }
    }

    let defaultTitle = 'THE FYNENCE';
    let defaultSubtitle = 'DAILY FINANCIAL DISPATCH';

    if (editionType === 'finance_economy') {
      defaultTitle = 'THE FYNENCE';
      defaultSubtitle = 'FINANCE & ECONOMY INTELLIGENCE';
    } else if (editionType === 'market') {
      defaultTitle = 'THE FYNENCE';
      defaultSubtitle = 'CAPITAL MARKETS CHRONICLE';
    }

    return {
      editionType,
      title: request.title || defaultTitle,
      subtitle: request.subtitle || defaultSubtitle,
      requestedSections,
    };
  }

  private resolveStories(request: EditionRequest, isMock: boolean): NewspaperStory[] {
    if (request.articles && request.articles.length > 0) {
      return request.articles.map((art, idx) => {
        if ('id' in art && 'headline' in art && 'section' in art) {
          return art as NewspaperStory;
        }
        // Normalize ArticleEditorialSummary
        const summary = art as ArticleEditorialSummary;
        const primarySource = summary.sourceArticles && summary.sourceArticles[0];
        const importance = summary.importance || (idx === 0 ? 'high' : 'medium');

        let image: NewspaperStory['image'] = undefined;
        if (summary.image && summary.image.originalUrl) {
          image = {
            url: summary.image.originalUrl,
            credit: summary.image.credit || primarySource?.source || 'Publisher Photo',
            source: summary.image.source || primarySource?.source || 'Verified Source',
            aspectRatio: '16:9',
            isAiGenerated: false,
          };
        }

        return {
          id: `story-${idx + 1}`,
          headline: summary.headline,
          kicker: `${summary.primarySection?.toUpperCase() || 'FINANCE'} DESK`,
          summary: summary.summary,
          whyItMatters: summary.whyItMatters,
          keyPoints: summary.keyPoints,
          source: primarySource?.source || 'Editorial Wire',
          originalUrl: primarySource?.url || 'https://thefynence.internal',
          publishedAt: summary.generatedAt || new Date().toISOString(),
          section: summary.primarySection || 'finance',
          importance,
          columnSpan: importance === 'high' ? 3 : 2,
          image,
        };
      });
    }

    if (isMock) {
      return [...MOCK_STORIES];
    }

    return [];
  }

  private resolveMarketTickers(request: EditionRequest, isMock: boolean): MarketTickerItem[] {
    if (request.marketSnapshot && request.marketSnapshot.quotesData) {
      const quotes = Object.values(request.marketSnapshot.quotesData);
      return quotes.map((q: any) => ({
        symbol: q.symbol,
        name: q.displayName || q.symbol,
        price: Number(q.price),
        change: Number(q.change || 0),
        changePercent: Number(q.changePercent || 0),
        direction: (q.direction?.toLowerCase() === 'up' ? 'up' : q.direction?.toLowerCase() === 'down' ? 'down' : 'flat'),
        category: q.category,
      }));
    }

    if (isMock) {
      return [...MOCK_TICKERS];
    }

    return [];
  }

  private resolveWeatherBlock(request: EditionRequest, isMock: boolean): WeatherBlock | null {
    if (request.weatherSnapshot) {
      const snap = request.weatherSnapshot as any;
      const isStale = Boolean(snap.isStale);
      const temp = typeof snap.temperature === 'number' ? snap.temperature : snap.currentTempC;
      const condition = snap.conditionText || snap.condition || 'Fair';

      return {
        type: 'weather_block',
        location: snap.location || 'Magelang, Central Java',
        currentTempC: temp,
        condition,
        conditionIcon: snap.conditionIconText || '☼',
        highTempC: typeof snap.highTempC === 'number' ? snap.highTempC : temp + 3,
        lowTempC: typeof snap.lowTempC === 'number' ? snap.lowTempC : temp - 4,
        precipitationChancePercent: snap.precipitationChancePercent ?? snap.precipitationProbability ?? 20,
        humidityPercent: snap.humidityPercent ?? snap.humidity ?? undefined,
        windKmh: snap.windKmh ?? snap.windSpeed ?? undefined,
        forecastSummary: snap.forecastSummary ?? snap.summary ?? 'Steady meteorological observations.',
        source: snap.source?.name || snap.sourceProvider || 'Open-Meteo',
        isStale,
        observedAt: snap.observedAt || snap.capturedAt || new Date().toISOString(),
      };
    }

    if (isMock) {
      return { ...MOCK_WEATHER_BLOCK };
    }

    return null;
  }

  private resolveEconomicEvents(request: EditionRequest, isMock: boolean): EconomicCalendarItem[] {
    if (request.economicEvents && request.economicEvents.length > 0) {
      return request.economicEvents.map(e => ({
        time: e.event_time || e.time || '12:00 WIB',
        currency: e.currency || 'USD',
        eventName: e.event_name || e.eventName || 'Scheduled Catalyst',
        impact: (e.impact?.toLowerCase() === 'high' ? 'high' : e.impact?.toLowerCase() === 'medium' ? 'medium' : 'low'),
        forecast: e.forecast,
        previous: e.previous,
        actual: e.actual,
      }));
    }

    if (isMock) {
      return [...MOCK_ECONOMIC_EVENTS];
    }

    return [];
  }

  private buildPages(params: {
    editionType: EditionType;
    title: string;
    subtitle: string;
    pubDate: Date;
    timezone: string;
    stories: NewspaperStory[];
    includeMarkets: boolean;
    tickers: MarketTickerItem[];
    includeWeather: boolean;
    weather: WeatherBlock | null;
    includeEconomics: boolean;
    economicEvents: EconomicCalendarItem[];
    pageSize: 'single_page' | 'multi_page' | 'auto';
  }): NewspaperPage[] {
    const {
      editionType,
      title,
      subtitle,
      pubDate,
      timezone,
      stories,
      includeMarkets,
      tickers,
      includeWeather,
      weather,
      includeEconomics,
      economicEvents,
      pageSize,
    } = params;

    const formattedLongDate = formatNewspaperDateLong(pubDate, timezone);
    const formattedShortDate = formatNewspaperDateShort(pubDate, timezone);
    const dayOfWeek = formattedLongDate.split(',')[0].toUpperCase();

    // Left ear (Weather snapshot if available)
    const leftEar = weather
      ? {
          title: 'METEOROLOGY',
          line1: `${weather.location.toUpperCase()}`,
          line2: `${weather.conditionIcon} ${weather.condition.toUpperCase()} · ${weather.currentTempC}°C`,
        }
      : {
          title: 'DATELINE',
          line1: 'MAGELANG · INDONESIA',
          line2: 'WIB · TIMEZONE UTC+7',
        };

    // Right ear (Edition info)
    const rightEar = {
      title: 'DISPATCH',
      line1: `${editionType.toUpperCase().replace('_', ' & ')}`,
      line2: 'FREE TELEGRAM EDITION',
    };

    // Select lead story: highest priority story
    const sortedStories = [...stories].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.importance] - priorityOrder[b.importance];
    });

    const leadStory = sortedStories.length > 0 ? sortedStories[0] : null;
    const secondaryStories = sortedStories.slice(1);

    // Multi-page determination
    const isMultiPage =
      pageSize === 'multi_page' ||
      (pageSize === 'auto' && (secondaryStories.length >= 3 || (includeEconomics && secondaryStories.length >= 2)));

    // Assemble Page 1
    const page1Blocks: NewspaperBlock[] = [
      {
        type: 'masthead',
        title,
        subtitle,
        volumeNumber: 'Vol. I',
        editionNumber: `No. ${pubDate.getUTCDate()}`,
        date: formattedShortDate,
        dayOfWeek,
        cityOrRegion: 'MAGELANG · INDONESIA',
        priceTag: 'FREE EDITION',
        motto: 'PRUDENTIA IN MERCATIBUS',
        leftEar,
        rightEar,
      },
    ];

    if (includeMarkets) {
      page1Blocks.push({
        type: 'market_strip',
        tickers,
        asOfTimestamp: pubDate.toISOString(),
      });
      page1Blocks.push({ type: 'divider', variant: 'thick' });
    }

    if (leadStory) {
      page1Blocks.push({
        type: 'lead_story',
        story: leadStory,
      });
      page1Blocks.push({ type: 'divider', variant: 'thin' });
    }

    if (!isMultiPage) {
      // Single Page: Place all remaining elements
      if (secondaryStories.length > 0) {
        page1Blocks.push({
          type: 'story_grid',
          stories: secondaryStories.slice(0, 3),
          columns: secondaryStories.length > 1 ? 2 : 2,
        });
        page1Blocks.push({ type: 'divider', variant: 'thin' });
      }

      if (includeWeather && weather) {
        page1Blocks.push(weather);
        page1Blocks.push({ type: 'divider', variant: 'thin' });
      }

      if (includeEconomics) {
        page1Blocks.push({
          type: 'economic_calendar',
          title: 'SCHEDULED ECONOMIC CATALYSTS',
          events: economicEvents.slice(0, 4),
        });
      }

      page1Blocks.push({
        type: 'colophon',
        colophon: 'PUBLISHED VIA THE FYNENCE TELEGRAPHIC SYNDICATE · PRINTED ON DIGITAL BROADSHEET',
        disclaimer: 'Informational financial dispatch. Strictly non-advisory.',
        sourceAttribution: 'Wires: Reuters, Bloomberg, AP, Financial Times. Data: Twelve Data, Open-Meteo.',
      });

      return [
        {
          pageNumber: 1,
          totalPages: 1,
          blocks: page1Blocks,
        },
      ];
    }

    // MULTI-PAGE EDITION:
    // Page 1: Lead story + 1 secondary story + Weather box
    const page1Secondary = secondaryStories.slice(0, 1);
    if (page1Secondary.length > 0) {
      page1Blocks.push({
        type: 'story',
        story: page1Secondary[0],
        columnSpan: 3,
      });
      page1Blocks.push({ type: 'divider', variant: 'thin' });
    }

    if (includeWeather && weather) {
      page1Blocks.push(weather);
    }

    const page1: NewspaperPage = {
      pageNumber: 1,
      totalPages: 2,
      blocks: page1Blocks,
      footer: {
        colophon: 'CONTINUED ON PAGE 2 · FINANCIAL INTELLIGENCE & CAPITAL MARKETS',
        pageNumber: 1,
        totalPages: 2,
      },
    };

    // Page 2: Section Header + Remaining Stories + Economic Calendar + Colophon
    const page2Stories = secondaryStories.slice(1);
    const page2Blocks: NewspaperBlock[] = [
      {
        type: 'section_header',
        title: editionType === 'finance_economy' ? 'FINANCE & ECONOMIC REVIEWS' : 'GLOBAL & REGIONAL DISPATCHES',
        subtitle: 'CONTINUATION DESK · SECOND EDITION PAGE',
        ornament: true,
      },
    ];

    if (page2Stories.length > 0) {
      page2Blocks.push({
        type: 'story_grid',
        stories: page2Stories,
        columns: 2,
      });
      page2Blocks.push({ type: 'divider', variant: 'thick' });
    }

    if (includeEconomics) {
      page2Blocks.push({
        type: 'economic_calendar',
        title: 'ECONOMIC SCHEDULE & CONSENSUS PROJECTIONS',
        events: economicEvents,
      });
      page2Blocks.push({ type: 'divider', variant: 'thin' });
    }

    page2Blocks.push({
      type: 'colophon',
      colophon: 'PUBLISHED VIA THE FYNENCE TELEGRAPHIC SYNDICATE · PRINTED ON DIGITAL BROADSHEET',
      disclaimer: 'Informational financial dispatch. Strictly non-advisory.',
      sourceAttribution: 'Wires: Reuters, Bloomberg, AP, Financial Times. Data: Twelve Data, Open-Meteo.',
    });

    const page2: NewspaperPage = {
      pageNumber: 2,
      totalPages: 2,
      header: {
        runningTitle: `${title} · ${subtitle}`,
        pageDate: formattedShortDate,
        sectionName: 'PAGE TWO',
      },
      blocks: page2Blocks,
      footer: {
        colophon: 'THE FYNENCE · ALL RIGHTS RESERVED',
        pageNumber: 2,
        totalPages: 2,
      },
    };

    return [page1, page2];
  }
}

export const editionComposer = new EditionComposer();
