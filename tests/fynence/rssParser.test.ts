import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseRssOrAtom } from '../../src/fynence/engine/parser/rssParser';

describe('RSS & Atom Parser', () => {
  it('parses standard RSS 2.0 with CDATA, images, and categories', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
      <channel>
        <title>Financial Dispatch Daily</title>
        <link>https://financialdispatch.com</link>
        <description>Macroeconomic News</description>
        <item>
          <title><![CDATA[Central Banks Coordinate Currency Liquidity Facility]]></title>
          <link>https://financialdispatch.com/articles/central-banks-liquidity?utm_source=rss</link>
          <description><![CDATA[Major monetary authorities agreed on enhanced standing swap lines to buffer cross-border funding.]]></description>
          <dc:creator>Elena Rostova</dc:creator>
          <pubDate>Sun, 27 Sep 2026 00:00:00 GMT</pubDate>
          <category>Economy</category>
          <category>Banking</category>
          <media:content url="https://financialdispatch.com/images/central-banks.jpg" medium="image" />
        </item>
      </channel>
    </rss>`;

    const feed = parseRssOrAtom(xml);
    assert.strictEqual(feed.title, 'Financial Dispatch Daily');
    assert.strictEqual(feed.items.length, 1);

    const item = feed.items[0];
    assert.strictEqual(item.title, 'Central Banks Coordinate Currency Liquidity Facility');
    assert.strictEqual(item.link, 'https://financialdispatch.com/articles/central-banks-liquidity?utm_source=rss');
    assert.ok(item.description?.includes('standing swap lines'));
    assert.strictEqual(item.author, 'Elena Rostova');
    assert.strictEqual(item.pubDate, 'Sun, 27 Sep 2026 00:00:00 GMT');
    assert.strictEqual(item.imageUrl, 'https://financialdispatch.com/images/central-banks.jpg');
    assert.deepStrictEqual(item.categories, ['Economy', 'Banking']);
  });

  it('parses Atom feed with entry tags and link href', () => {
    const atomXml = `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Tech &amp; Markets Feed</title>
      <entry>
        <title>Next-Gen Quantum Processors Enter Commercial Pilot</title>
        <link rel="alternate" href="https://techdaily.com/quantum-pilot"/>
        <summary>Researchers demonstrate 1,000-qubit coherence across cryo-cooled arrays.</summary>
        <updated>2026-09-26T18:00:00Z</updated>
        <author><name>Dr. Aris Thorne</name></author>
      </entry>
    </feed>`;

    const feed = parseRssOrAtom(atomXml);
    assert.strictEqual(feed.title, 'Tech & Markets Feed');
    assert.strictEqual(feed.items.length, 1);

    const item = feed.items[0];
    assert.strictEqual(item.title, 'Next-Gen Quantum Processors Enter Commercial Pilot');
    assert.strictEqual(item.link, 'https://techdaily.com/quantum-pilot');
    assert.ok(item.description?.includes('1,000-qubit coherence'));
    assert.strictEqual(item.author, 'Dr. Aris Thorne');
    assert.strictEqual(item.pubDate, '2026-09-26T18:00:00Z');
  });

  it('handles malformed feeds gracefully without crashing', () => {
    const malformed = 'Not valid XML at all <unclosed tag>';
    const feed = parseRssOrAtom(malformed);
    assert.strictEqual(feed.items.length, 0);
  });
});
