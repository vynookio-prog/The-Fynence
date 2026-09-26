# THE FYNENCE: Data Contracts & Interface Reference

This document outlines the core data contracts and schemas implemented for THE FYNENCE module.

## 1. Structured Newspaper JSON Contract

The AI and composer layer produces structured JSON conforming to `StructuredNewspaperData`. The renderer consumes this object deterministically:

```json
{
  "metadata": {
    "editionId": "ed-2026-09-27-daily",
    "schemaVersion": "1.0.0",
    "generatedAt": "2026-09-27T00:00:00Z",
    "targetFormat": "webp",
    "theme": "retro_black_cream",
    "language": "en"
  },
  "header": {
    "title": "THE FYNENCE",
    "subtitle": "DAILY FINANCIAL DISPATCH",
    "volumeNumber": "Vol. I, No. 1",
    "editionNumber": "Ed. 001",
    "date": "Sunday, September 27, 2026",
    "dayOfWeek": "Sunday",
    "cityOrRegion": "Magelang & Global Markets",
    "priceTag": "Free Telegram Edition",
    "motto": "Prudentia in Mercatibus"
  },
  "sections": [
    {
      "type": "top_story",
      "headline": "Treasury Yields Stabilize as Global Liquidity Adapts to Policy Shifts",
      "kicker": "MACRO DESK",
      "summary": "Sovereign bond markets observed calmer trading across benchmark maturities as institutional participants digested remarks from central banking authorities.",
      "whyItMatters": "Yield curve stability offers breathing room for risk assets, tempering volatility in equity indices and currency pairs.",
      "source": "Financial Times",
      "articleUrl": "https://ft.com/example-article",
      "author": "Marcus Vance",
      "publishedAt": "2026-09-26T21:30:00Z",
      "image": {
        "originalUrl": "https://ft.com/images/verified-photo.jpg",
        "credit": "Bloomberg / Pool Photo",
        "source": "Financial Times",
        "aspectRatio": "16:9",
        "hasHalftone": true,
        "fallbackType": "none"
      },
      "columnSpan": 3
    },
    {
      "type": "markets",
      "marketMood": "Cautious",
      "moodDescription": "Cross-asset volatility tempered; investors seek defensive positioning.",
      "asOfTimestamp": "2026-09-27T00:00:00Z",
      "tickers": [
        {
          "symbol": "XAUUSD",
          "name": "Gold Spot",
          "price": 2685.40,
          "change": 8.20,
          "changePercent": 0.31,
          "direction": "up",
          "category": "metal"
        },
        {
          "symbol": "US100",
          "name": "Nasdaq 100",
          "price": 20180.50,
          "change": -45.10,
          "changePercent": -0.22,
          "direction": "down",
          "category": "index"
        }
      ]
    },
    {
      "type": "weather",
      "location": "Magelang, Jawa Tengah, Indonesia",
      "currentCondition": "partly_cloudy",
      "conditionIconText": "Partly Cloudy",
      "currentTempC": 26.5,
      "highTempC": 31.0,
      "lowTempC": 21.0,
      "precipitationChancePercent": 25,
      "humidityPercent": 78,
      "windKmh": 11,
      "forecastSummary": "Pleasant morning giving way to mild afternoon cloud cover across the Borobudur basin."
    }
  ],
  "footer": {
    "colophon": "Published daily via Telegram by THE FYNENCE Editorial Systems.",
    "disclaimer": "Informational purposes only. Not financial advice.",
    "sourceAttribution": "Market data via Twelve Data. News sourced from accredited publishers."
  }
}
```

---

## 2. Edition Configuration Contract

Defines how editions are requested and generated:

```typescript
export interface EditionConfig {
  id?: string;
  type: EditionType; // 'daily' | 'custom' | 'breaking' | 'weekly_digest'
  title: string;
  subtitle: string;
  date?: string;
  sections: NewspaperSectionType[];
  weather: {
    enabled: boolean;
    location: string;
  };
  format: EditionFormat; // 'webp' | 'png' | 'pdf'
  theme: EditionTheme; // 'retro_black_cream'
}
```

---

## 3. Strict Image Provenance Contract

```typescript
export interface ImageMetadata {
  id?: string;
  articleId?: string;
  imageUrl: string;
  imageSource: string;
  imageCredit: string;
  originalArticleUrl: string;
  usageStatus: ImageUsageStatus;
  fetchedAt: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileSizeBytes?: number;
  storagePath?: string;
  readonly isAiGenerated: false; // Type guard ensuring no AI imagery
}
```

---

## 4. Service Boundaries Overview

| Layer | Contract Interface | Responsibility |
| :--- | :--- | :--- |
| News Ingestion | `INewsIngestionService` | Fetches raw articles from RSS and News APIs |
| News Normalization | `INewsNormalizationService` | Cleans HTML, extracts source and image provenance |
| News Classification | `INewsClassificationService` | Categorizes into sections, scores importance |
| AI Editorial | `IAiEditorialService` | Summarizes, headlines, Why It Matters (facts only) |
| Market Data | `IMarketDataProvider` | Fetches multi-asset quotes from Twelve Data |
| Weather Data | `IWeatherProvider` | Fetches local meteorological snapshot |
| Newspaper Composer | `INewspaperComposerService` | Deterministic structured JSON compilation |
| Image Processor | `IImageProcessorService` | Halftone screening on verified publisher photos |
| Rendering Engine | `INewspaperRendererService` | HTML/CSS to WebP/PDF via Headless Chromium |
| Telegram Delivery | `ITelegramDeliveryService` | Delivers WebP/PDF and article source links |
| Storage Lifecycle | `INewspaperStorageService` | Ephemeral temporary file storage and cleanup |
