You are the lead software architect and senior TypeScript engineer for a project called THE FYNENCE.

We are building a digital financial newspaper delivered through Telegram.

The final product will generate retro newspaper editions containing economy, finance, markets, world news, technology, business, weather, and other configurable sections.

IMPORTANT: DO NOT build the entire system in one step.

For this task, ONLY build the project foundation, architecture, schemas, configuration, and interfaces required for future development.

==================================================
PRODUCT CONCEPT

Product name:

THE FYNENCE

Visual identity:

A premium retro financial newspaper.

Design direction:

- Cream / aged paper
- Black ink
- Dark brown / muted tones
- Serif newspaper typography
- Dense editorial columns
- Thin newspaper borders
- Halftone / monochrome treatment
- Vintage newspaper texture
- Editorial financial-journal aesthetic

The newspaper should feel like a real historical financial newspaper, not a modern dashboard.

==================================================
CORE PRINCIPLE

Separate the system into independent layers:

1. News ingestion
2. News normalization
3. News classification
4. AI editorial processing
5. Market data
6. Weather data
7. Newspaper composition
8. Image processing
9. Rendering
10. Telegram delivery

Do NOT tightly couple these systems.

The AI must NEVER be responsible for creating the final newspaper layout.

The renderer must receive structured JSON and deterministically render the newspaper.

==================================================
CRITICAL IMAGE RULE

NEVER use AI-generated images for news stories.

This is a strict project rule.

News images must come from the original news source/article whenever available and legally/technically permitted.

Pipeline:

Original article
→ original/source image
→ validate image
→ crop/resize
→ optional grayscale
→ optional halftone treatment
→ newspaper

If a source does not provide a usable image, DO NOT generate an AI replacement image.

Instead:

- use typography
- use a chart
- use a data visualization
- or render the story without an image

Store image attribution and original article URL.

Recommended article image metadata:

- image_url
- image_source
- image_credit
- original_article_url
- usage_status
- fetched_at

==================================================
AI RESPONSIBILITIES

AI is allowed to:

- summarize articles
- classify articles
- detect article topics
- identify duplicate stories
- create concise headlines
- extract entities
- identify important stories
- generate "why it matters"
- organize stories into newspaper sections

AI must NOT:

- invent facts
- invent statistics
- invent quotes
- invent market prices
- invent weather information
- fabricate sources
- fabricate images

Market prices must come from market APIs.

Weather must come from a weather API.

News facts must remain traceable to source articles.

==================================================
NEWSPAPER SECTIONS

The system must support modular sections.

Possible sections:

- top_story
- world
- national
- business
- technology
- finance
- economy
- forex
- crypto
- markets
- economic_calendar
- weather
- tomorrow_watch

The user must eventually be able to request custom combinations.

Examples:

"finance economy"

"daily"

"daily technology world"

"finance economy crypto"

"daily news with Magelang weather"

Do NOT implement the natural-language Telegram parser yet.

Only design interfaces for it.

==================================================
DAILY EDITION

The default Daily Edition should eventually support:

1. Top Stories
2. World
3. National / Indonesia
4. Business
5. Technology
6. Finance
7. Economy
8. Weather
9. Market Snapshot
10. Economic Calendar
11. Tomorrow's Watch

Weather location for Daily Edition:

Magelang, Jawa Tengah, Indonesia

This should be configurable rather than hardcoded throughout the codebase.

==================================================
EDITION CONFIGURATION

Create a strongly typed configuration model.

Example:

{
"type": "daily",
"title": "THE FYNENCE",
"subtitle": "DAILY EDITION",
"sections": [
"world",
"national",
"business",
"technology",
"finance",
"economy",
"weather",
"markets",
"economic_calendar"
],
"weather": {
"enabled": true,
"location": "Magelang, Jawa Tengah, Indonesia"
},
"format": "webp",
"theme": "retro_black_cream"
}

Support future formats:

- webp
- png
- pdf

Default format:

webp

==================================================
PROJECT STRUCTURE

Use a clean TypeScript monorepo architecture.

Suggested structure:

the-fynence/

├── apps/
│   ├── web/
│   └── bot/
│
├── packages/
│   ├── news/
│   ├── ai/
│   ├── market/
│   ├── weather/
│   ├── newspaper/
│   ├── images/
│   └── shared/
│
├── database/
│   ├── schema/
│   └── migrations/
│
├── templates/
│   └── newspaper/
│
├── scripts/
│
├── docs/
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md

If the repository already has an existing structure, DO NOT destroy or unnecessarily rewrite it.

First inspect the existing project and adapt this architecture to it.

==================================================
DATABASE

Prepare PostgreSQL schema/interfaces for:

users

news_sources

articles

article_images

market_snapshots

weather_snapshots

editions

edition_articles

telegram_deliveries

Do not over-engineer the database yet.

Important fields for articles:

- id
- title
- description
- content
- url
- source
- author
- category
- region
- published_at
- image_url
- image_source
- image_credit
- created_at
- updated_at

Important fields for editions:

- id
- type
- title
- subtitle
- sections
- format
- theme
- status
- created_at

==================================================
ENVIRONMENT

Create .env.example.

Use placeholders only.

Required future environment variables:

GEMINI_API_KEY=
NEWS_API_KEY=
TWELVE_DATA_API_KEY=
WEATHER_API_KEY=
TELEGRAM_BOT_TOKEN=
DATABASE_URL=
APP_URL=

NEVER hardcode API keys.

NEVER expose secrets in source code.

==================================================
NEWSPAPER DATA CONTRACT

Create TypeScript interfaces/types for the future newspaper renderer.

The AI/editorial layer should eventually output structured data similar to:

{
"edition": {
"title": "THE FYNENCE",
"subtitle": "DAILY EDITION",
"date": "2026-09-26"
},

"sections": [
{
"type": "top_story",
"headline": "...",
"summary": "...",
"source": "...",
"articleUrl": "...",
"image": {
"url": "...",
"credit": "..."
}
}
]
}

Make this strongly typed.

The renderer should never need to understand AI prompts.

==================================================
RENDERER ARCHITECTURE

Do NOT implement the full renderer yet.

Only create its interface.

Future pipeline:

Structured Newspaper JSON
→ HTML template
→ CSS
→ Chromium/Puppeteer
→ WebP
→ optional PDF

The renderer must be deterministic.

AI should never directly generate HTML/CSS for the newspaper.

==================================================
STORAGE PRINCIPLE

Generated newspaper images should be treated as temporary files.

Future behavior:

Generate
→ send to Telegram
→ optionally retain for a limited period
→ delete temporary file

Do not design the system around permanently storing every generated newspaper.

Database should store metadata and Telegram message IDs rather than unnecessarily storing all generated images forever.

==================================================
TELEGRAM

Do NOT implement the full Telegram bot yet.

Only create a clean interface/service boundary for future:

- receive user request
- parse request
- generate edition
- send WebP
- optionally send PDF
- send article/source information

==================================================
CODE QUALITY

Requirements:

- TypeScript
- strict typing
- modular architecture
- clear interfaces
- environment validation
- no hardcoded secrets
- no duplicated business logic
- no unnecessary dependencies
- useful comments only
- clean naming
- easy future testing

Do not install large dependencies unless necessary.

==================================================
IMPORTANT DEVELOPMENT BEHAVIOR

Before modifying files:

1. Inspect the existing repository.
2. Identify the current framework.
3. Identify existing dependencies.
4. Identify existing database setup.
5. Identify existing environment configuration.
6. Identify potential conflicts.

Do NOT blindly overwrite existing code.

If an existing Fynence/Freonix architecture already exists, integrate with it instead of creating a parallel application.

==================================================
STEP 1 SUCCESS CRITERIA

When finished, the project should have:

✓ Clean architecture
✓ TypeScript types
✓ Environment configuration
✓ Database schema/interfaces
✓ Edition configuration model
✓ Newspaper data contract
✓ News interfaces
✓ Market interfaces
✓ Weather interfaces
✓ Image metadata interfaces
✓ Telegram service interface
✓ Renderer interface
✓ Documentation explaining architecture

DO NOT build:

✗ Full Telegram bot
✗ News scraping engine
✗ AI summarization
✗ Newspaper rendering
✗ PDF generation
✗ WebP generation
✗ Weather API integration
✗ Market API integration

Those belong to later steps.

==================================================
FINAL RESPONSE

After implementation, report:

1. What files were created/modified
2. What architecture was established
3. What interfaces/types were created
4. Any dependencies added
5. Any issues or conflicts discovered
6. Exact next recommended step

Do not claim something is implemented if it is only scaffolded.

STOP after Step 1 is complete.
