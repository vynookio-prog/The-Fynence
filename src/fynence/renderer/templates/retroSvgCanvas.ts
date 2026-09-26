import type {
  EconomicCalendarSectionData,
  MarketSectionData,
  StorySectionData,
  StructuredNewspaperData,
  TomorrowWatchSectionData,
  WeatherSectionData,
} from '../../types/newspaper';
import type { RenderOptions } from '../types';

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        break;
      }
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}

export function generateRetroSvg(data: StructuredNewspaperData, options: RenderOptions = {}): string {
  const width = options.viewportWidth || 1200;
  const height = options.viewportHeight || 1600;

  const header = data.header;
  const sections = data.sections;

  const leadStory = sections.find((s): s is StorySectionData => s.type === 'top_story');
  const secondaryStories = sections.filter(
    (s): s is StorySectionData => s.type !== 'top_story' && 'headline' in s
  );
  const marketSection = sections.find((s): s is MarketSectionData => s.type === 'markets');
  const economicSection = sections.find(
    (s): s is EconomicCalendarSectionData => s.type === 'economic_calendar'
  );
  const weatherSection = sections.find((s): s is WeatherSectionData => s.type === 'weather');

  const headlineLines = leadStory ? wrapText(leadStory.headline, 38, 3) : ['FINANCIAL DISPATCH'];
  const summaryLines = leadStory ? wrapText(leadStory.summary, 62, 8) : [];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Aged Paper Background -->
  <rect width="${width}" height="${height}" fill="#fbf8ef"/>
  
  <!-- Outer Double Borders -->
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="#1a1714" stroke-width="4"/>
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="#1a1714" stroke-width="1"/>

  <!-- Masthead Ears -->
  <g font-family="'Courier New', Courier, monospace" font-size="11" fill="#1a1714">
    <!-- Left Ear: Weather -->
    <text x="44" y="52" font-weight="bold">METEOROLOGICAL REPORT</text>
    <text x="44" y="68">${escapeXml(weatherSection ? weatherSection.location : 'MAGELANG &amp; GLOBAL')}</text>
    <text x="44" y="84">${escapeXml(weatherSection ? `${weatherSection.currentCondition} (${weatherSection.currentTempC}&deg;C)` : 'Fair Weather')}</text>
    
    <!-- Right Ear: Edition & Volume -->
    <text x="${width - 44}" y="52" text-anchor="end" font-weight="bold">${escapeXml(header.volumeNumber || 'VOL. I')} &#8226; ${escapeXml(header.editionNumber || 'NO. 1')}</text>
    <text x="${width - 44}" y="68" text-anchor="end">${escapeXml(header.cityOrRegion)}</text>
    <text x="${width - 44}" y="84" text-anchor="end">PRICE: ${escapeXml(header.priceTag || 'FIVE CENTS')}</text>
  </g>

  <!-- Masthead Separator Line -->
  <line x1="44" y1="96" x2="${width - 44}" y2="96" stroke="#1a1714" stroke-width="1"/>

  <!-- Grand Newspaper Title -->
  <text x="${width / 2}" y="162" font-family="'Playfair Display', Georgia, serif" font-size="64" font-weight="bold" letter-spacing="6" fill="#1a1714" text-anchor="middle">${escapeXml(header.title)}</text>
  <text x="${width / 2}" y="190" font-family="Georgia, serif" font-size="13" font-style="italic" letter-spacing="2" fill="#4a4239" text-anchor="middle">${escapeXml(header.motto || 'VERITAS IN NUMERIS')} &#8226; ${escapeXml(header.subtitle)}</text>

  <!-- Dateline Banner -->
  <rect x="44" y="206" width="${width - 88}" height="26" fill="#f5f0e1" stroke="#1a1714" stroke-width="1.5"/>
  <text x="56" y="223" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="#1a1714">${escapeXml(header.dayOfWeek)}, ${escapeXml(header.date)}</text>
  <text x="${width / 2}" y="223" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="#1a1714" text-anchor="middle">ELECTRONIC BROADSHEET EDITION</text>
  <text x="${width - 56}" y="223" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="#1a1714" text-anchor="end">DAILY FINANCIAL DISPATCH</text>

  <!-- Ticker Tape Strip -->
  <rect x="44" y="240" width="${width - 88}" height="32" fill="#ede8d8" stroke="#1a1714" stroke-width="1"/>
  <g font-family="'Courier New', Courier, monospace" font-size="11" fill="#1a1714">
    ${marketSection && marketSection.tickers ? marketSection.tickers.slice(0, 6).map((t, idx) => {
      const posX = 60 + idx * 180;
      const isUp = t.direction === 'up';
      const color = isUp ? '#1a5624' : '#8c1d18';
      const sign = t.change > 0 ? '+' : '';
      return `<text x="${posX}" y="260"><tspan font-weight="bold">${escapeXml(t.symbol)}</tspan>: ${t.price.toFixed(2)} <tspan fill="${color}">${sign}${t.changePercent.toFixed(2)}%</tspan></text>`;
    }).join('') : '<text x="60" y="260">MARKET DATA RECORD: AWAITING CLOSING SESSIONS</text>'}
  </g>

  <!-- Broadsheet Dividing Rules -->
  <!-- Vertical rule separating 2/3 editorial and 1/3 market/docket -->
  <line x1="770" y1="285" x2="770" y2="${height - 110}" stroke="#1a1714" stroke-width="1"/>

  <!-- Left Editorial Section -->
  <g>
    <!-- Kicker -->
    <text x="56" y="310" font-family="'Courier New', monospace" font-size="11" font-weight="bold" letter-spacing="2" fill="#594f43">
      ${escapeXml(leadStory?.kicker || 'FRONT PAGE EXCLUSIVE')}
    </text>

    <!-- Lead Headline -->
    ${headlineLines.map((line, i) => `
      <text x="56" y="${345 + i * 36}" font-family="'Playfair Display', Georgia, serif" font-size="32" font-weight="bold" fill="#1a1714">
        ${escapeXml(line)}
      </text>
    `).join('')}

    <!-- Byline -->
    <text x="56" y="${355 + headlineLines.length * 36}" font-family="Georgia, serif" font-size="11" font-style="italic" fill="#554d42">
      BY ${escapeXml(leadStory?.author || 'BUREAU CORRESPONDENT')} &#8226; WIRE: ${escapeXml(leadStory?.source || 'The Fynence Wire')}
    </text>
    <line x1="56" y1="${365 + headlineLines.length * 36}" x2="750" y2="${365 + headlineLines.length * 36}" stroke="#cfc7b8" stroke-width="0.5"/>

    <!-- Optional Image or Fallback SVG Frame -->
    ${leadStory?.image?.processedUrl ? `
      <rect x="56" y="${380 + headlineLines.length * 36}" width="694" height="260" fill="#f0ece1" stroke="#1a1714" stroke-width="1"/>
      <image href="${escapeXml(leadStory.image.processedUrl)}" x="58" y="${382 + headlineLines.length * 36}" width="690" height="256" preserveAspectRatio="xMidYMid slice"/>
      <text x="740" y="${655 + headlineLines.length * 36}" font-family="Georgia, serif" font-size="9" font-style="italic" fill="#4a4239" text-anchor="end">Source Archive: ${escapeXml(leadStory.image.credit || leadStory.image.source)}</text>
    ` : ''}

    <!-- Lead Story Summary Text -->
    <g font-family="Georgia, serif" font-size="14" fill="#1a1714">
      ${summaryLines.map((line, i) => {
        const startY = (leadStory?.image?.processedUrl ? 680 : 390) + headlineLines.length * 36;
        return `<text x="56" y="${startY + i * 22}">${escapeXml(line)}</text>`;
      }).join('')}
    </g>

    <!-- Why It Matters Inset Box -->
    ${leadStory?.whyItMatters ? `
      <g>
        <rect x="56" y="${(leadStory?.image?.processedUrl ? 690 : 400) + headlineLines.length * 36 + summaryLines.length * 22}" width="694" height="70" fill="#f5f0e1" stroke="#1a1714" stroke-width="1"/>
        <text x="70" y="${(leadStory?.image?.processedUrl ? 710 : 420) + headlineLines.length * 36 + summaryLines.length * 22}" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#1a1714">WHY IT MATTERS TO MARKETS</text>
        <text x="70" y="${(leadStory?.image?.processedUrl ? 730 : 440) + headlineLines.length * 36 + summaryLines.length * 22}" font-family="Georgia, serif" font-size="12" fill="#1a1714">${escapeXml(leadStory.whyItMatters.substring(0, 100))}${leadStory.whyItMatters.length > 100 ? '...' : ''}</text>
      </g>
    ` : ''}
  </g>

  <!-- Right Column: Market Barometer & Docket -->
  <g>
    <!-- Market Barometer Header -->
    <rect x="790" y="295" width="365" height="26" fill="#1a1714"/>
    <text x="972" y="312" font-family="'Playfair Display', Georgia, serif" font-size="13" font-weight="bold" fill="#fbf8ef" text-anchor="middle" letter-spacing="1">MARKET BAROMETER</text>

    <rect x="790" y="321" width="365" height="110" fill="#faf6ec" stroke="#1a1714" stroke-width="1"/>
    <text x="805" y="345" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#1a1714">SENTIMENT: ${escapeXml(marketSection?.marketMood || 'BALANCED')}</text>
    <text x="805" y="365" font-family="Georgia, serif" font-size="11" font-style="italic" fill="#4a4239">${escapeXml((marketSection?.moodDescription || '').substring(0, 52))}</text>
    <text x="805" y="380" font-family="Georgia, serif" font-size="11" font-style="italic" fill="#4a4239">${escapeXml((marketSection?.moodDescription || '').substring(52, 105))}</text>
    <text x="805" y="410" font-family="'Courier New', monospace" font-size="10" fill="#666">TIMESTAMP: ${escapeXml(marketSection?.asOfTimestamp?.substring(0, 19) || 'RECENT')}</text>

    <!-- Economic Calendar Docket -->
    <rect x="790" y="450" width="365" height="26" fill="#1a1714"/>
    <text x="972" y="467" font-family="'Playfair Display', Georgia, serif" font-size="13" font-weight="bold" fill="#fbf8ef" text-anchor="middle" letter-spacing="1">ECONOMIC CALENDAR</text>

    <rect x="790" y="476" width="365" height="300" fill="#faf6ec" stroke="#1a1714" stroke-width="1"/>
    ${economicSection && economicSection.events ? economicSection.events.slice(0, 6).map((ev, idx) => {
      const itemY = 502 + idx * 46;
      return `
        <text x="802" y="${itemY}" font-family="'Courier New', monospace" font-size="10" font-weight="bold" fill="#1a1714">${escapeXml(ev.time)} &#8226; ${escapeXml(ev.currency)}</text>
        <text x="802" y="${itemY + 16}" font-family="Georgia, serif" font-size="11" fill="#1a1714">${escapeXml(ev.eventName.substring(0, 36))}</text>
        <text x="1135" y="${itemY + 16}" font-family="'Courier New', monospace" font-size="10" fill="#555" text-anchor="end">Fcst: ${escapeXml(ev.forecast || 'N/A')}</text>
        <line x1="802" y1="${itemY + 24}" x2="1140" y2="${itemY + 24}" stroke="#e0d9cc" stroke-width="0.5"/>
      `;
    }).join('') : '<text x="802" y="520" font-family="Georgia, serif" font-size="11">No scheduled high-impact events.</text>'}

    <!-- Secondary Dispatch Box -->
    ${secondaryStories.length > 0 ? `
      <rect x="790" y="800" width="365" height="24" fill="#3a332d"/>
      <text x="972" y="816" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#fbf8ef" text-anchor="middle">ADDITIONAL DISPATCHES</text>
      <rect x="790" y="824" width="365" height="280" fill="#faf6ec" stroke="#1a1714" stroke-width="1"/>
      ${secondaryStories.slice(0, 2).map((s, idx) => {
        const topY = 850 + idx * 130;
        return `
          <text x="802" y="${topY}" font-family="'Courier New', monospace" font-size="9" font-weight="bold" fill="#594f43">${escapeXml(s.kicker || s.type.toUpperCase())}</text>
          <text x="802" y="${topY + 18}" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="#1a1714">${escapeXml(s.headline.substring(0, 42))}</text>
          <text x="802" y="${topY + 36}" font-family="Georgia, serif" font-size="10.5" fill="#333">${escapeXml(s.summary.substring(0, 52))}</text>
          <text x="802" y="${topY + 52}" font-family="Georgia, serif" font-size="10.5" fill="#333">${escapeXml(s.summary.substring(52, 104))}...</text>
          <line x1="802" y1="${topY + 70}" x2="1140" y2="${topY + 70}" stroke="#e0d9cc" stroke-width="0.5"/>
        `;
      }).join('')}
    ` : ''}
  </g>

  <!-- Footer Colophon -->
  <line x1="44" y1="${height - 84}" x2="${width - 44}" y2="${height - 84}" stroke="#1a1714" stroke-width="2"/>
  <line x1="44" y1="${height - 80}" x2="${width - 44}" y2="${height - 80}" stroke="#1a1714" stroke-width="0.75"/>
  <text x="${width / 2}" y="${height - 62}" font-family="'Courier New', Courier, monospace" font-size="9.5" fill="#4a4239" text-anchor="middle">${escapeXml(data.footer.colophon)}</text>
  <text x="${width / 2}" y="${height - 48}" font-family="'Courier New', Courier, monospace" font-size="8.5" fill="#666" text-anchor="middle">${escapeXml(data.footer.disclaimer)}</text>
  <text x="${width / 2}" y="${height - 35}" font-family="'Courier New', Courier, monospace" font-size="8.5" fill="#666" text-anchor="middle">${escapeXml(data.footer.sourceAttribution)}</text>
</svg>`;
}
