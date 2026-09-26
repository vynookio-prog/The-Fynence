# THE FYNENCE: System Architecture & Engineering Blueprint

## 1. Product Concept & Visual Identity

THE FYNENCE is a digital financial newspaper delivered through Telegram. It combines institutional macroeconomic intelligence, market data, and world events into retro broadsheet newspaper editions.

### Visual Direction
* **Palette:** Aged cream paper background, deep black ink, dark brown and muted ink tones.
* **Typography:** Classic serif newspaper typefaces (Playfair, Merriweather, Georgia), dense editorial columns, justified typography, and drop caps.
* **Layout:** Multi-column broadsheet layout, thin ornamental border rules, kicker labels, and dateline subheaders.
* **Image Treatment:** High-contrast monochrome, vintage halftone screening, woodcut and engraving styling.
* **Philosophy:** The newspaper feels like a genuine historical financial daily, not a modern dashboard or web screenshot.

---

## 2. Decoupled 10-Layer System Architecture

To avoid tight coupling and maintain determinism, THE FYNENCE separates concerns across ten independent layers:

```
[Layer 1: News Ingestion]      RSS, NewsAPI, Webhook Feeds
          │
          ▼
[Layer 2: News Normalization]  Sanitization, URL Verification, Image Provenance
          │
          ▼
[Layer 3: News Classification] Section Categorization & Editorial Scoring
          │
          ▼
[Layer 4: AI Editorial Layer]  Summarization, Concise Headlines, "Why It Matters"
          │
          ▼
[Layer 5: Market Snapshot]     Twelve Data / Live Market Quotes (XAU, US100, DXY, etc.)
          │
          ▼
[Layer 6: Weather Snapshot]    OpenWeather API (Configurable: Magelang default)
          │
          ▼
[Layer 7: Newspaper Composer]  Pure deterministic JSON assembly matching schema
          │
          ▼
[Layer 8: Image Processor]     Halftone / Grayscale filter (STRICT: Original Source Only)
          │
          ▼
[Layer 9: HTML/CSS Renderer]   Deterministic Chromium/Puppeteer pipeline (WebP/PDF)
          │
          ▼
[Layer 10: Telegram Delivery]  Bot dispatcher, WebP photo upload, source attribution links
```

---

## 3. Strict Image Provenance & Anti-AI Image Policy

**Fundamental Rule: NEVER use AI-generated images for news stories.**

* News photographs must come exclusively from the original news publisher or verified source.
* **Pipeline:**
  `Original Article -> Original Image URL -> Validate Dimensions/Mime -> Crop/Resize -> Grayscale -> Halftone -> Broadsheet`
* **Fallback Strategy:**
  If a news article has no usable original image, AI replacement images are strictly forbidden. The layout falls back to:
  1. Typographic headline treatment
  2. Financial charts and diagrams
  3. Macroeconomic data visualizations
  4. Non-photographic decorative newspaper dividers (e.g. vintage rules)
  5. Text-only column layouts
* **Audit Metadata:**
  All images record `image_url`, `image_source`, `image_credit`, `original_article_url`, `usage_status`, and `fetched_at` in the database.

---

## 4. AI Editorial Responsibilities & Restrictions

### Permitted AI Functions
* Summarizing verified article body text into dense editorial paragraphs.
* Crafting concise, non-clickbait broadsheet headlines.
* Generating "Why It Matters" macroeconomic context derived from source facts.
* Detecting duplicate or overlapping stories across different feeds.
* Extracting named entities (central banks, tickers, policy makers).
* Categorizing stories into newspaper sections.

### Prohibited AI Functions
* AI must NOT invent facts, statistics, or quotes.
* AI must NOT fabricate market prices or index levels (must come from Market APIs).
* AI must NOT fabricate weather conditions or temperatures (must come from Weather APIs).
* AI must NOT create or generate news imagery.
* AI must NOT generate final HTML, CSS, or layout coordinates.

---

## 5. InsForge Backend & Data Layer Integration

THE FYNENCE integrates directly with the existing InsForge backend (`@insforge/sdk`). No secondary database, Prisma instance, or separate server is introduced.

### Existing Entities Reused
* `auth.users`: User accounts and credentials.
* `public.profiles`: User preferences, currency, and tier settings.
* `public.market_events`: Economic calendar entries and Forex news schedule.

### New InsForge Entities Scaffolded (Migration: `20260927000000_create-the-fynence-newspaper-schema.sql`)
1. `news_sources`: Registered publishers, feed URLs, category specializations, and reliability scores.
2. `articles`: Normalized news records with URLs, attribution, categories, and content summaries.
3. `article_images`: Image provenance tracking and processing status.
4. `market_snapshots`: Point-in-time multi-asset financial quotes.
5. `weather_snapshots`: Point-in-time meteorological observations.
6. `editions`: Edition metadata, section selections, formats, and compiled structured JSON.
7. `edition_articles`: Ordered join table linking curated stories to specific editions.
8. `telegram_deliveries`: Delivery audit logs, Telegram chat IDs, message IDs, and status.

---

## 6. Modular Edition Configuration & Sections

Supported section identifiers:
* `top_story`: Lead broadsheet story with prominent headline and verified image.
* `world`: International geopolitical and macroeconomic developments.
* `national`: Regional coverage (Indonesia and Southeast Asia).
* `business`: Corporate developments, earnings, and M&A.
* `technology`: AI, semiconductor, enterprise software, and infrastructure.
* `finance`: Banking, sovereign debt, yields, and liquidity.
* `economy`: Inflation, central bank rates, GDP, and trade balance.
* `forex`: FX majors (EURUSD, USDJPY, GBPUSD, DXY).
* `crypto`: Digital asset markets (BTC, ETH) and regulatory updates.
* `markets`: Cross-asset market summary table and market mood.
* `economic_calendar`: Upcoming high-impact events and consensus numbers.
* `weather`: Configurable local weather dispatch (default: Magelang, Jawa Tengah).
* `tomorrow_watch`: Catalyst alerts for the upcoming global trading sessions.

### Weather Location Configuration
The Daily Edition defaults to `Magelang, Jawa Tengah, Indonesia`, but is fully configurable in `EditionConfig` rather than hardcoded.

---

## 7. Deterministic Rendering Pipeline

The renderer operates as a pure function:
```
StructuredNewspaperData + HTML/CSS Template = Deterministic Output (WebP / PDF)
```
* **No AI Prompts in Renderer:** The renderer accepts only strongly typed JSON (`StructuredNewspaperData`).
* **Engine:** Headless Chromium (Puppeteer) captures pixel-accurate retro newspaper pages.
* **Target Formats:**
  * `webp` (Default, optimized for mobile Telegram delivery).
  * `png` (Lossless archive).
  * `pdf` (Multi-page high-resolution broadsheet for print/desktop reading).

---

## 8. Ephemeral Storage Lifecycle

To prevent storage bloat, generated newspaper image binaries are treated as temporary artifacts:
1. Newspaper JSON is compiled and rendered to temporary WebP/PDF.
2. File is uploaded to Telegram chat.
3. Telegram message ID and edition metadata are saved in InsForge DB.
4. Temporary file is purged immediately or retained for a short TTL (e.g. 1 hour).
5. The newspaper can be regenerated deterministically at any future time from the saved `structured_data` JSON.

---

## 9. Telegram Service Boundary

The Telegram delivery service (`ITelegramDeliveryService`) provides a clean interface:
* Receives edition requests from subscribers (scheduled daily or on-demand).
* Dispatches broadsheet WebP images directly to Telegram chats.
* Dispatches optional PDF documents upon request.
* Delivers clickable attribution links to every source article to preserve journalistic integrity.
