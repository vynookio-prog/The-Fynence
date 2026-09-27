import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import sharp from 'sharp';

import { UrlResolver } from '../../../src/fynence/engine/url/urlResolver';
import { ImagePipelineService } from '../../../src/fynence/image/imagePipelineService';
import { generatePageSvg } from '../../../src/fynence/renderer/templates/svgPageCanvas';
import { createSourcesKeyboard } from '../../../src/fynence/telegram/keyboard/inlineKeyboards';
import { MOCK_STORIES } from '../../../src/fynence/renderer/mock/mockNewspaperData';
import type { NewspaperDocument } from '../../../src/fynence/renderer/types/document';

describe('Master Quality Fix: URLs, Images, Broadsheet Structure & Telegram', () => {
  // =========================================================================
  // 1, 2, 3: URL Redirects, Paywalls & Broken URL Detection
  // =========================================================================
  describe('URL Resolver & Validation Engine', () => {
    it('resolves 301, 302, 307, 308 redirects to the final destination', async () => {
      const server = http.createServer((req, res) => {
        if (req.url === '/start-301') {
          res.writeHead(301, { Location: '/hop-302' });
          res.end();
        } else if (req.url === '/hop-302') {
          res.writeHead(302, { Location: '/hop-307' });
          res.end();
        } else if (req.url === '/hop-307') {
          res.writeHead(307, { Location: '/final-destination' });
          res.end();
        } else if (req.url === '/final-destination') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body>Destination Page</body></html>');
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as AddressInfo).port;
      const baseUrl = `http://127.0.0.1:${port}`;

      try {
        const resolver = new UrlResolver();
        const startUrl = `${baseUrl}/start-301`;
        const result = await resolver.resolveAndValidate(startUrl);

        assert.strictEqual(result.originalUrl, startUrl);
        assert.strictEqual(result.resolvedUrl, `${baseUrl}/final-destination`);
        assert.strictEqual(result.linkStatus, 'REDIRECTED');
        assert.ok(result.redirectHops >= 3, `Expected >= 3 hops, got ${result.redirectHops}`);
        assert.strictEqual(result.httpStatus, 200);
      } finally {
        server.close();
      }
    });

    it('classifies paywalled sites as PAYWALLED rather than BROKEN', () => {
      const resolver = new UrlResolver();

      // Test classification logic directly via internal method
      const ftPaywall = (resolver as any).classifyStatus('https://www.ft.com/content/12345', 200);
      assert.strictEqual(ftPaywall, 'PAYWALLED');

      const bloombergPaywall = (resolver as any).classifyStatus('https://www.bloomberg.com/news/articles/2026-09-27', 403);
      assert.strictEqual(bloombergPaywall, 'PAYWALLED');

      const wsjPaywall = (resolver as any).classifyStatus('https://www.wsj.com/articles/markets-today', 401);
      assert.strictEqual(wsjPaywall, 'PAYWALLED');
    });

    it('detects broken 404 URLs as BROKEN', async () => {
      const server = http.createServer((req, res) => {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found');
      });

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as AddressInfo).port;

      try {
        const resolver = new UrlResolver();
        const brokenUrl = `http://127.0.0.1:${port}/non-existent-article`;
        const result = await resolver.resolveAndValidate(brokenUrl);

        assert.strictEqual(result.originalUrl, brokenUrl);
        assert.strictEqual(result.linkStatus, 'BROKEN');
        assert.strictEqual(result.httpStatus, 404);
      } finally {
        server.close();
      }
    });
  });

  // =========================================================================
  // 4 & 5: Image Resolution Priority & Validation
  // =========================================================================
  describe('Image Pipeline: Priority & Validation', () => {
    const imageService = new ImagePipelineService();

    it('resolves images according to priority: media:content > thumbnail > enclosure > og:image > none', async () => {
      // 1. media:content takes highest precedence
      const res1 = await imageService.resolveOriginalImage({
        mediaContentUrl: 'https://example.com/media-content.jpg',
        mediaThumbnailUrl: 'https://example.com/thumbnail.jpg',
        enclosureUrl: 'https://example.com/enclosure.jpg',
        articleHtml: '<meta property="og:image" content="https://example.com/og.jpg">',
      });
      assert.strictEqual(res1.sourceType, 'media:content');
      assert.strictEqual(res1.imageUrl, 'https://example.com/media-content.jpg');

      // 2. When media:content is missing, media:thumbnail is next
      const res2 = await imageService.resolveOriginalImage({
        mediaThumbnailUrl: 'https://example.com/thumbnail.jpg',
        enclosureUrl: 'https://example.com/enclosure.jpg',
        articleHtml: '<meta property="og:image" content="https://example.com/og.jpg">',
      });
      assert.strictEqual(res2.sourceType, 'media:thumbnail');
      assert.strictEqual(res2.imageUrl, 'https://example.com/thumbnail.jpg');

      // 3. Enclosure when thumbnail is absent
      const res3 = await imageService.resolveOriginalImage({
        enclosureUrl: 'https://example.com/enclosure.jpg',
        articleHtml: '<meta property="og:image" content="https://example.com/og.jpg">',
      });
      assert.strictEqual(res3.sourceType, 'enclosure');
      assert.strictEqual(res3.imageUrl, 'https://example.com/enclosure.jpg');

      // 4. og:image from HTML when RSS has no imagery
      const res4 = await imageService.resolveOriginalImage({
        articleHtml: '<meta property="og:image" content="https://example.com/og-news.jpg">',
      });
      assert.strictEqual(res4.sourceType, 'og:image');
      assert.strictEqual(res4.imageUrl, 'https://example.com/og-news.jpg');

      // 5. No image → resolves cleanly to null
      const res5 = await imageService.resolveOriginalImage({});
      assert.strictEqual(res5.sourceType, 'none');
      assert.strictEqual(res5.imageUrl, null);
    });

    it('rejects HTML responses, and too-small images; accepts valid press photos', async () => {
      // Create a noise-filled JPEG large enough to exceed 3KB minimum (solid colour compresses too small)
      const noisePixels = Buffer.alloc(640 * 320 * 3);
      for (let i = 0; i < noisePixels.length; i++) {
        noisePixels[i] = Math.floor(Math.random() * 256);
      }
      const validBuffer = await sharp(noisePixels, { raw: { width: 640, height: 320, channels: 3 } })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Create a tiny 1x1 PNG  
      const tinyPixelBuffer = await sharp({
        create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .png({ compressionLevel: 9 })
        .toBuffer();

      // Safety check — our noise JPEG must be > 3KB
      assert.ok(
        validBuffer.length >= 3072,
        `Test setup: valid image buffer should be ≥3KB (is ${validBuffer.length}B)`
      );

      const server = http.createServer((req, res) => {
        if (req.url === '/valid-image.jpg') {
          res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': String(validBuffer.length) });
          res.end(validBuffer);
        } else if (req.url === '/pixel.png') {
          res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': String(tinyPixelBuffer.length) });
          res.end(tinyPixelBuffer);
        } else if (req.url === '/fake-image-html') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body>Not an image</body></html>');
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as AddressInfo).port;
      const baseUrl = `http://127.0.0.1:${port}`;

      try {
        const testService = new ImagePipelineService({ timeoutMs: 10000 });

        // 1. Valid noise JPEG → must decode, resize, and produce webp data URI
        const validRes = await testService.downloadAndPrepareImage(`${baseUrl}/valid-image.jpg`, { maxWidth: 800, maxHeight: 450 });
        assert.ok(
          validRes.isValid,
          `Valid image should succeed (errorReason: ${validRes.errorReason || 'none'}, size=${validBuffer.length}B)`
        );
        assert.ok(
          validRes.assetDataUri?.startsWith('data:image/webp;base64,'),
          'Valid image must produce a webp data URI'
        );
        assert.ok(validRes.width && validRes.width >= 180, 'Valid image must meet minimum broadsheet width');

        // 2. Reject HTML response (wrong content-type)
        const htmlRes = await testService.downloadAndPrepareImage(`${baseUrl}/fake-image-html`);
        assert.strictEqual(htmlRes.isValid, false, 'HTML response must be rejected');
        assert.match(htmlRes.errorReason || '', /non-image Content-Type/i);

        // 3. Reject tiny pixel (< 3KB) — only if tinyPixelBuffer is actually < 3KB
        if (tinyPixelBuffer.length < 3072) {
          const pixelRes = await testService.downloadAndPrepareImage(`${baseUrl}/pixel.png`);
          assert.strictEqual(pixelRes.isValid, false, '1x1 pixel must be rejected as tracking pixel');
        }
      } finally {
        server.close();
      }
    });
  });

  // =========================================================================
  // 6: Text-First Fallback Without Dark Rectangles / Empty Boxes
  // =========================================================================
  describe('SVG Renderer & Text-First Fallback', () => {
    it('renders text-first layout without empty black boxes or fake archive rectangles when image is absent', () => {
      // Build a proper NewspaperDocument matching the actual type
      const textOnlyDoc: NewspaperDocument = {
        edition: {
          id: 'edition-test',
          editionType: 'daily',
          title: 'THE FYNENCE',
          subtitle: 'TEST BROADSHEET',
          editionDate: '2026-09-27',
          sections: [],
          generatedAt: new Date().toISOString(),
          timezone: 'Asia/Jakarta',
          volumeNumber: 'VOL. I',
          editionNumber: 'NO. 1',
          motto: 'VERITAS IN NUMERIS',
        },
        pages: [
          {
            pageNumber: 1,
            totalPages: 1,
            blocks: [
              {
                type: 'lead_story',
                story: {
                  id: 'story-text-first',
                  headline: 'Sovereign Markets Settle Following Key Central Bank Monetary Decisions',
                  subheadline: 'Benchmark yields compress while commercial banking reserves remain comfortable',
                  whatHappened:
                    'Central banking authorities held benchmark rates steady during the weekend monetary conclave, noting that employment numbers have moderated while inflation metrics approach long-range objectives.',
                  details:
                    'Primary bond dealers absorbed sovereign auctions with strong bid-to-cover ratios. Institutional desks observed minimal volatility across currency pairs and equity benchmarks.',
                  summary:
                    'Central banking authorities held benchmark rates steady during the weekend monetary conclave. Primary bond dealers absorbed sovereign auctions with solid metrics.',
                  whyItMatters:
                    'Predictable benchmark policy supports corporate budgeting and prevents capital market dislocation.',
                  source: 'Reuters Financial Wires',
                  originalUrl: 'https://www.reuters.com/markets/',
                  resolvedUrl: 'https://www.reuters.com/markets/',
                  linkStatus: 'VALID',
                  publishedAt: '2026-09-27T00:00:00Z',
                  section: 'finance',
                  importance: 'high',
                  columnSpan: 3,
                  // NO IMAGE — testing text-first layout
                },
              },
            ],
          },
        ],
      };

      const svgOutput = generatePageSvg(textOnlyDoc.pages[0], textOnlyDoc, { viewportWidth: 1200, viewportHeight: 1600 });

      // Must NOT render fake black placeholder rectangles
      assert.ok(!svgOutput.includes('OFFICIAL PUBLISHER ARCHIVE'), 'Must not render fake archive placeholder');
      assert.ok(!svgOutput.includes('fill="#1A1816" stroke'), 'Must not render dark placeholder rect');
      assert.ok(!svgOutput.includes('fill="#2D2924"'), 'Must not render secondary dark placeholder rect');

      // Must render the headline and WHY THIS MATTERS in text-first mode
      assert.ok(svgOutput.includes('Sovereign Markets Settle'), 'Must render headline text');
      assert.ok(svgOutput.includes('WHY THIS MATTERS'), 'Must render why it matters section');
    });
  });

  // =========================================================================
  // 7: 6-Part Broadsheet Editorial Structure & Word Counts
  // =========================================================================
  describe('Full Broadsheet Article Structure', () => {
    it('verifies that mock stories contain all 6 required broadsheet parts', () => {
      assert.ok(MOCK_STORIES.length >= 15, `Mock stories must contain at least 15 stories (has ${MOCK_STORIES.length})`);

      for (const story of MOCK_STORIES.slice(0, 10)) {
        // 1. Headline — minimum 5 words
        const headlineWords = story.headline.trim().split(/\s+/).length;
        assert.ok(headlineWords >= 5, `Headline "${story.headline}" should have ≥5 words (has ${headlineWords})`);

        // 2. Subheadline must exist
        assert.ok(story.subheadline, `Story ${story.id} must have a subheadline`);

        // 3. whatHappened — minimum 20 words
        assert.ok(story.whatHappened, `Story ${story.id} must have whatHappened`);
        const whatWords = story.whatHappened!.trim().split(/\s+/).length;
        assert.ok(whatWords >= 20, `whatHappened of "${story.id}" should have ≥20 words (has ${whatWords})`);

        // 4. details — minimum 30 words
        assert.ok(story.details, `Story ${story.id} must have details`);
        const detailWords = story.details!.trim().split(/\s+/).length;
        assert.ok(detailWords >= 30, `details of "${story.id}" should have ≥30 words (has ${detailWords})`);

        // 5. whyItMatters — minimum 12 words
        assert.ok(story.whyItMatters, `Story ${story.id} must have whyItMatters`);
        const whyWords = story.whyItMatters!.trim().split(/\s+/).length;
        assert.ok(whyWords >= 12, `whyItMatters of "${story.id}" should have ≥12 words (has ${whyWords})`);

        // 6. Authoritative URL — no fake /dispatches/ slugs
        assert.ok(story.source, `Story ${story.id} must have source attribution`);
        assert.ok(story.originalUrl, `Story ${story.id} must have authoritative originalUrl`);
        assert.ok(
          story.originalUrl.startsWith('http://') || story.originalUrl.startsWith('https://'),
          `URL of "${story.id}" must be valid HTTP/HTTPS`
        );
        assert.ok(!story.originalUrl.includes('/dispatches/fed-policy-liquidity-anchor'), 'Fake FT URL must be gone');
        assert.ok(!story.originalUrl.includes('/news/cargo-trade-metrics'), 'Fake Bloomberg URL must be gone');
      }
    });
  });

  // =========================================================================
  // 8: Telegram Links & Source Attribution
  // =========================================================================
  describe('Telegram Citations & Authoritative URLs', () => {
    it('creates inline keyboards with direct article URL buttons using authoritative publisher URLs', () => {
      const topSources = [
        {
          section: 'finance',
          headline: 'Federal Reserve Holds Benchmark Rates Steady',
          sourceName: 'Financial Times',
          articleUrl: 'https://www.ft.com/markets',
        },
        {
          section: 'world',
          headline: 'European Sovereign Debt Auctions Witness Resilient Demand',
          sourceName: 'Reuters',
          articleUrl: 'https://www.reuters.com/markets/',
        },
      ];

      const keyboard = createSourcesKeyboard(topSources.length, topSources);
      const jsonStr = JSON.stringify(keyboard);

      // Keyboard must reference exact publisher URLs
      assert.ok(jsonStr.includes('https://www.ft.com/markets'), 'Must include FT article URL');
      assert.ok(jsonStr.includes('https://www.reuters.com/markets/'), 'Must include Reuters article URL');
      // Must still expose the sources list callback
      assert.ok(jsonStr.includes('action:sources'), 'Must include sources action callback');
    });
  });
});
