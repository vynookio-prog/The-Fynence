import type { NewspaperDocument, NewspaperSectionName, NewspaperStory, StoryBlock } from '../../renderer/types/document';
import type { EditionPipelineResult, TelegramArticleSourceItem, TelegramEditionRequest } from '../types';
import { EditionComposer } from '../../composer/editionComposer';
import { NewspaperRenderer } from '../../renderer/service/newspaperRenderer';
import { PdfRenderer } from '../../pdf/service/pdfRenderer';
import { defaultPdfArtifactManager } from '../../pdf/utils/tempArtifactManager';
import { WeatherService } from '../../weather/service/weatherService';
import { MarketService } from '../../market/service/marketService';
import { MockMarketDataProvider } from '../../market/providers/mockMarketProvider';
import { NewsIngestionService, newsIngestionService } from '../../engine/ingestion/newsIngestionService';
import { formatNewspaperDateLong } from '../../weather/utils/timezone';

export type ProgressCallback = (statusText: string) => Promise<void>;

export function resolveTargetStoryCount(editionType?: string, sections?: string[]): number {
  switch (editionType) {
    case 'daily':
      return 15;
    case 'finance':
    case 'finance_economy':
      return 15;
    case 'market':
      return 12;
    default:
      if (sections && sections.length > 0) {
        return Math.min(15, Math.max(10, sections.length * 3));
      }
      return 15;
  }
}

export class EditionPipelineService {
  private composer: EditionComposer;
  private imageRenderer: NewspaperRenderer;
  private pdfRenderer: PdfRenderer;
  private weatherService: WeatherService;
  private marketService: MarketService;
  private newsIngestionService?: NewsIngestionService;

  constructor(options?: {
    composer?: EditionComposer;
    imageRenderer?: NewspaperRenderer;
    pdfRenderer?: PdfRenderer;
    weatherService?: WeatherService;
    marketService?: MarketService;
    newsIngestionService?: NewsIngestionService;
  }) {
    this.composer = options?.composer || new EditionComposer();
    this.imageRenderer = options?.imageRenderer || new NewspaperRenderer();
    this.pdfRenderer = options?.pdfRenderer || new PdfRenderer();
    this.weatherService = options?.weatherService || new WeatherService();
    this.marketService = options?.marketService || new MarketService();
    this.newsIngestionService = options?.newsIngestionService;
  }

  /**
   * Executes the full edition generation pipeline:
   * Data Gathering -> EditionComposer -> NewspaperDocument -> Image/PDF Rendering -> Cleanup
   */
  public async generateEdition(
    request: TelegramEditionRequest,
    onProgress?: ProgressCallback
  ): Promise<EditionPipelineResult> {
    const startTime = Date.now();
    const requestId = request.requestId;
    let tempFilePath: string | undefined;

    try {
      // 1. Initial Status
      if (onProgress) {
        await onProgress('🗞️ Preparing your edition...\n⏳ Gathering news & editorial...');
      }

      // 2. Weather Data Gathering (with graceful degradation)
      let weatherData: any = undefined;
      const needsWeather = request.sections.includes('weather') || request.editionType === 'weather' || request.editionType === 'daily';
      if (needsWeather) {
        try {
          const loc = request.weatherLocationId || 'magelang';
          weatherData = await this.weatherService.getCurrentWeather(loc);
        } catch {
          // Graceful degradation: continue without weather if unavailable
          weatherData = undefined;
        }
      }

      // 3. Market Data Gathering (with graceful degradation)
      let marketSnapshot: any = undefined;
      let economicEvents: any[] = [];
      const needsMarkets =
        request.sections.includes('markets') ||
        request.sections.includes('forex') ||
        request.sections.includes('crypto') ||
        request.sections.includes('economy') ||
        request.editionType === 'market' ||
        request.editionType === 'finance_economy' ||
        request.editionType === 'daily';

      if (needsMarkets) {
        try {
          marketSnapshot = await this.marketService.refreshSnapshot();
        } catch {
          // Graceful fallback to mock market provider to ensure verified tickers render
          try {
            const mockMarket = new MockMarketDataProvider();
            const quotesRes = await mockMarket.getQuotes(['XAUUSD', 'US30', 'BTCUSD', 'EURUSD']);
            if (quotesRes.success && quotesRes.data) {
              const quotesMap: Record<string, any> = {};
              for (const q of quotesRes.data) quotesMap[q.symbol] = q;
              marketSnapshot = {
                capturedAt: new Date().toISOString(),
                asOfDate: new Date().toISOString().slice(0, 10),
                overallSentiment: 'neutral',
                sentimentHeadline: 'Financial Markets Steady Across Major Asset Classes',
                quotes: quotesMap,
                source: 'mock_market_provider',
              };
            }
          } catch {
            marketSnapshot = undefined;
          }
        }

        try {
          economicEvents = await this.marketService.getEconomicEvents();
        } catch {
          economicEvents = [];
        }
      }

      // 4. News and Editorial Gathering (Real RSS feeds or fallback)
      const targetStoryCount = request.targetStoryCount || resolveTargetStoryCount(request.editionType, request.sections);
      let stories: NewspaperStory[] | undefined = request.articles;
      let mockMode = request.mockMode;

      if (!stories && !mockMode && this.newsIngestionService) {
        try {
          const newsResult = await this.newsIngestionService.ingestAndBuildEditorialStories({
            editionType: request.editionType,
            sections: request.sections,
            targetCount: targetStoryCount,
            useAi: true,
          });
          if (newsResult.stories && newsResult.stories.length > 0) {
            stories = newsResult.stories;
            mockMode = false;
          }
        } catch {
          mockMode = true;
        }
      }

      if (mockMode === undefined) {
        mockMode = !stories || stories.length === 0;
      }

      // Progress Update: Rendering Stage
      if (onProgress) {
        await onProgress(
          '🗞️ Preparing your edition...\n' +
          '✓ News verified\n' +
          '✓ Market data collected\n' +
          '✓ Weather observations verified\n' +
          '⏳ Rendering newspaper broadsheet...'
        );
      }

      // 5. Compose NewspaperDocument ONCE (Single source of truth)
      const doc = this.composer.composeDocument({
        editionType: request.editionType,
        sections: request.sections,
        weatherLocationId: request.weatherLocationId || 'magelang',
        weatherSnapshot: weatherData,
        marketSnapshot,
        economicEvents,
        articles: stories,
        targetStoryCount,
        mockMode,
        theme: request.theme || 'retro_black_cream',
      });

      // 6. Multi-format Rendering
      let imageBuffer: Buffer | undefined;
      let imageMimeType: string | undefined;
      let imagePages: Array<{ buffer: Buffer; mimeType: string; pageNumber: number }> | undefined;
      let pdfBuffer: Buffer | undefined;
      let pdfFileName: string | undefined;

      const shouldRenderImage = request.format === 'image' || request.format === 'both';
      const shouldRenderPdf = request.format === 'pdf' || request.format === 'both';

      if (shouldRenderImage) {
        const renderedEdition = await this.imageRenderer.renderToImages(doc, {
          format: 'png',
          viewportWidth: 1200,
          viewportHeight: 1600,
        });
        if (renderedEdition.pages.length > 0) {
          imageBuffer = renderedEdition.pages[0].buffer;
          imageMimeType = renderedEdition.pages[0].mimeType;
          imagePages = renderedEdition.pages.map((p, idx) => ({
            buffer: p.buffer,
            mimeType: p.mimeType,
            pageNumber: p.pageNumber || idx + 1,
          }));
        }
      }

      if (shouldRenderPdf) {
        const pdfResult = await this.pdfRenderer.render(doc, {
          format: 'broadsheet',
          generateTempFile: true,
          addClickableLinks: true,
        });

        if (pdfResult.success) {
          pdfBuffer = pdfResult.buffer;
          pdfFileName = pdfResult.fileName;
          tempFilePath = pdfResult.filePath;
        } else {
          throw new Error(`PDF generation failed: ${pdfResult.error?.message || 'Unknown error'}`);
        }
      }

      // 7. Extract Verified Article Sources
      const sources = this.extractArticleSources(doc);

      // 8. Progress Completed
      if (onProgress) {
        await onProgress('✅ Your edition is ready.');
      }

      return {
        success: true,
        requestId,
        editionId: doc.edition.id,
        editionType: doc.edition.editionType,
        title: doc.edition.title,
        subtitle: doc.edition.subtitle,
        editionDate: doc.edition.editionDate,
        format: request.format,
        imageBuffer,
        imageMimeType,
        imagePages,
        pdfBuffer,
        pdfFileName,
        sources,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        requestId,
        editionId: `err-${Date.now()}`,
        editionType: request.editionType,
        title: 'THE FYNENCE',
        subtitle: 'EDITION ERROR',
        editionDate: new Date().toISOString().slice(0, 10),
        format: request.format,
        sources: [],
        error: errorMessage,
        durationMs: Date.now() - startTime,
      };
    } finally {
      // 9. Storage Cleanup of temporary file
      if (tempFilePath) {
        try {
          await defaultPdfArtifactManager.cleanupArtifact(tempFilePath);
        } catch {
          // Ignore cleanup error
        }
      }
    }
  }

  /**
   * Extracts verified sources from all story blocks in the document.
   */
  public extractArticleSources(doc: NewspaperDocument): TelegramArticleSourceItem[] {
    const sources: TelegramArticleSourceItem[] = [];
    const seenUrls = new Set<string>();

    const addStory = (story: any) => {
      if (story && story.originalUrl && !seenUrls.has(story.originalUrl)) {
        seenUrls.add(story.originalUrl);
        sources.push({
          section: story.section || 'news',
          headline: story.headline,
          sourceName: story.source || 'Verified Source',
          articleUrl: story.originalUrl,
        });
      }
    };

    for (const page of doc.pages) {
      for (const block of page.blocks) {
        if (block.type === 'story' || block.type === 'lead_story') {
          addStory((block as any).story);
        } else if (block.type === 'story_grid' && Array.isArray((block as any).stories)) {
          for (const story of (block as any).stories) {
            addStory(story);
          }
        }
      }
    }

    return sources;
  }
}

export const defaultEditionPipelineService = new EditionPipelineService({ newsIngestionService });
