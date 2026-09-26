import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { ImageValidator } from '../../../src/fynence/image/validator/imageValidator';
import { EditorialFallbackSvgGenerator } from '../../../src/fynence/image/fallback/editorialFallbackSvg';
import { ImageProcessor } from '../../../src/fynence/image/processor/imageProcessor';
import type { Article } from '../../../src/fynence/types/article';
import type { ImageMetadata } from '../../../src/fynence/image/types';

test('Image Processor: STRICT anti-AI guard rejects AI-generated imagery', () => {
  const validator = new ImageValidator();

  // Guard must throw when isAiGenerated is true
  assert.throws(
    () => {
      validator.assertNotAiGenerated({ isAiGenerated: true as any });
    },
    {
      message: /STRICT POLICY VIOLATION: AI-generated images are prohibited for news stories/i,
    }
  );

  // Must not throw when isAiGenerated is false
  assert.doesNotThrow(() => {
    validator.assertNotAiGenerated({ isAiGenerated: false });
  });
});

test('Image Processor: ImageValidator flags invalid and SSRF URLs', async () => {
  const validator = new ImageValidator();

  const localhostResult = await validator.validateSourceImageUrl('http://127.0.0.1:8080/photo.jpg');
  assert.equal(localhostResult.isValid, false);
  assert.ok(
    localhostResult.errorReason?.includes('blocked') ||
    localhostResult.errorReason?.includes('Private') ||
    localhostResult.errorReason?.includes('SSRF')
  );

  // Invalid protocol
  const ftpResult = await validator.validateSourceImageUrl('ftp://example.com/photo.png');
  assert.equal(ftpResult.isValid, false);

  // Empty string
  const emptyResult = await validator.validateSourceImageUrl('');
  assert.equal(emptyResult.isValid, false);
});

test('Image Processor: Fallback generator produces valid editorial SVGs', () => {
  const generator = new EditorialFallbackSvgGenerator();
  const mockArticle: Article = {
    id: 'art-001',
    title: 'Treasury Yields Stabilize Following Central Bank Conference',
    description: 'Bond yields held firm as traders digested remarks.',
    url: 'https://example.com/treasury',
    source: 'Financial Dispatch',
    category: 'finance',
    region: 'global',
    publishedAt: new Date().toISOString(),
    imageUsageStatus: 'fallback_typography',
  };

  const typographySvg = generator.generateFallbackSvg(mockArticle, 'typography');
  assert.ok(typographySvg.includes('<svg'));
  assert.ok(typographySvg.includes('VERITAS IN NUMERIS'));

  const chartSvg = generator.generateFallbackSvg(mockArticle, 'chart');
  assert.ok(chartSvg.includes('<polyline'));
  assert.ok(chartSvg.includes('DISPATCH MARKET METRICS'));

  const woodcutSvg = generator.generateFallbackSvg(mockArticle, 'decorative_woodcut');
  assert.ok(woodcutSvg.includes('THE FYNENCE DISPATCH'));
});

test('Image Processor: generateEditorialFallback returns compliant ProcessedArticleImage', () => {
  const processor = new ImageProcessor();
  const mockArticle: Article = {
    id: 'art-002',
    title: 'Continental Trade Surpluses Reach Annual Peak',
    description: 'Export numbers surpassed previous consensus estimates.',
    url: 'https://example.com/trade',
    source: 'Reuters',
    category: 'economy',
    region: 'europe',
    publishedAt: new Date().toISOString(),
    imageUsageStatus: 'fallback_chart',
  };

  const result = processor.generateEditorialFallback(mockArticle, 'chart');
  assert.equal(result.fallbackType, 'chart');
  assert.equal(result.hasHalftone, false);
  assert.ok(result.processedUrl?.startsWith('data:image/svg+xml;base64,'));
  assert.equal(result.credit, 'The Fynence Editorial Archives');
});

test('Image Processor: cropToColumnSpan crops and resizes with sharp', async () => {
  const processor = new ImageProcessor();

  // Create a 800x600 test canvas
  const testInputBuffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 4,
      background: { r: 240, g: 235, b: 220, alpha: 1 },
    },
  }).png().toBuffer();

  // Crop to 2-column span (target width 620, aspect ratio 16:9 -> height 349)
  const cropped2Col = await processor.cropToColumnSpan(testInputBuffer, 2, '16:9');
  const meta2Col = await sharp(Buffer.from(cropped2Col)).metadata();
  assert.equal(meta2Col.width, 620);
  assert.equal(meta2Col.height, 349);

  // Crop to 1-column span (target width 300, aspect ratio 1:1 -> height 300)
  const cropped1Col = await processor.cropToColumnSpan(testInputBuffer, 1, '1:1');
  const meta1Col = await sharp(Buffer.from(cropped1Col)).metadata();
  assert.equal(meta1Col.width, 300);
  assert.equal(meta1Col.height, 300);
});
