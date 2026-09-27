import type {
  NewspaperBlock,
  NewspaperDocument,
  NewspaperPage,
} from '../types/document';
import type { RenderOptions } from '../types';
import { getThemePalette, getPaperGrainSvgFilter } from '../design/tokens';

function escapeXml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
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

export function generatePageSvg(
  page: NewspaperPage,
  doc: NewspaperDocument,
  options: RenderOptions = {}
): string {
  const width = options.viewportWidth || 1200;
  const height = options.viewportHeight || 1600;
  const palette = getThemePalette(options.theme || doc.edition.theme);

  const paperGrainFilter = options.includeTextureOverlay ? getPaperGrainSvgFilter() : '';

  let currentY = 48;
  let bodySvg = '';

  // 1. PAGE HEADER (Running title on Page 2+)
  if (page.header) {
    bodySvg += `
      <g font-family="Georgia, serif" font-size="11" font-weight="bold" fill="${palette.ink}" text-transform="uppercase">
        <text x="44" y="${currentY}">${escapeXml(page.header.runningTitle)}</text>
        <text x="${width / 2}" y="${currentY}" text-anchor="middle">${escapeXml(page.header.pageDate)}</text>
        <text x="${width - 44}" y="${currentY}" text-anchor="end">${escapeXml(page.header.sectionName || `PAGE ${page.pageNumber}`)}</text>
      </g>
      <line x1="44" y1="${currentY + 10}" x2="${width - 44}" y2="${currentY + 10}" stroke="${palette.rule}" stroke-width="2"/>
    `;
    currentY += 28;
  }

  // Iterate over all page blocks sequentially
  for (const block of page.blocks) {
    switch (block.type) {
      case 'masthead': {
        const masthead = block;
        bodySvg += `
          <!-- Masthead Ears -->
          <g font-family="'Courier New', Courier, monospace" font-size="11" fill="${palette.mutedInk}">
            <text x="44" y="${currentY + 12}" font-weight="bold" fill="${palette.ink}">${escapeXml(masthead.leftEar?.title || 'METEOROLOGICAL REPORT')}</text>
            <text x="44" y="${currentY + 28}">${escapeXml(masthead.leftEar?.line1)}</text>
            <text x="44" y="${currentY + 44}">${escapeXml(masthead.leftEar?.line2)}</text>

            <text x="${width - 44}" y="${currentY + 12}" text-anchor="end" font-weight="bold" fill="${palette.ink}">${escapeXml(masthead.rightEar?.title || 'DISPATCH')}</text>
            <text x="${width - 44}" y="${currentY + 28}" text-anchor="end">${escapeXml(masthead.rightEar?.line1)}</text>
            <text x="${width - 44}" y="${currentY + 44}" text-anchor="end">${escapeXml(masthead.rightEar?.line2)}</text>
          </g>

          <line x1="44" y1="${currentY + 54}" x2="${width - 44}" y2="${currentY + 54}" stroke="${palette.rule}" stroke-width="1"/>

          <!-- Newspaper Title -->
          <text x="${width / 2}" y="${currentY + 120}" font-family="'Playfair Display', Georgia, serif" font-size="64" font-weight="900" letter-spacing="5" fill="${palette.ink}" text-anchor="middle">${escapeXml(masthead.title)}</text>
          <text x="${width / 2}" y="${currentY + 148}" font-family="Georgia, serif" font-size="13" font-style="italic" letter-spacing="2" fill="${palette.mutedInk}" text-anchor="middle">${escapeXml(masthead.motto)} &#8226; ${escapeXml(masthead.subtitle)}</text>

          <!-- Dateline Strip -->
          <rect x="44" y="${currentY + 162}" width="${width - 88}" height="26" fill="${palette.lightPaper}" stroke="${palette.rule}" stroke-width="1.5"/>
          <g font-family="Georgia, serif" font-size="11.5" font-weight="bold" fill="${palette.ink}">
            <text x="56" y="${currentY + 179}">${escapeXml(masthead.dayOfWeek)}, ${escapeXml(masthead.date)}</text>
            <text x="${width / 2}" y="${currentY + 179}" text-anchor="middle">${escapeXml(masthead.cityOrRegion)}</text>
            <text x="${width - 56}" y="${currentY + 179}" text-anchor="end">${escapeXml(masthead.priceTag)}</text>
          </g>
        `;
        currentY += 202;
        break;
      }

      case 'section_header': {
        const sectionHeader = block;
        bodySvg += `
          <rect x="44" y="${currentY}" width="${width - 88}" height="32" fill="${palette.lightPaper}" stroke="${palette.rule}" stroke-width="1.5"/>
          <text x="${width / 2}" y="${currentY + 21}" font-family="'Playfair Display', Georgia, serif" font-size="16" font-weight="900" letter-spacing="3" fill="${palette.ink}" text-anchor="middle">${escapeXml(sectionHeader.title)}</text>
        `;
        currentY += 44;
        break;
      }

      case 'market_strip': {
        const marketStrip = block;
        const tickers = marketStrip.tickers;
        bodySvg += `
          <rect x="44" y="${currentY}" width="${width - 88}" height="30" fill="${palette.lightPaper}" stroke="${palette.rule}" stroke-width="1"/>
          <g font-family="'Courier New', Courier, monospace" font-size="11" fill="${palette.ink}">
            <text x="56" y="${currentY + 19}" font-weight="bold">MARKETS</text>
            <line x1="126" y1="${currentY + 6}" x2="126" y2="${currentY + 24}" stroke="${palette.rule}" stroke-width="1"/>
        `;

        let tickerX = 142;
        for (let i = 0; i < Math.min(tickers.length, 5); i++) {
          const t = tickers[i];
          const sign = t.change > 0 ? '+' : t.change < 0 ? '-' : '';
          const color = t.direction === 'up' ? palette.accentGreen : t.direction === 'down' ? palette.accentCrimson : palette.mutedInk;
          const formattedPercent = `${sign}${Math.abs(t.changePercent).toFixed(2)}%`;
          bodySvg += `
            <text x="${tickerX}" y="${currentY + 19}">
              <tspan font-weight="bold">${escapeXml(t.symbol)}</tspan>
              <tspan fill="${palette.mutedInk}"> ${t.price >= 100 ? t.price.toFixed(1) : t.price.toFixed(4)}</tspan>
              <tspan fill="${color}" font-weight="bold"> ${formattedPercent}</tspan>
            </text>
          `;
          tickerX += 190;
        }

        bodySvg += `</g>`;
        currentY += 42;
        break;
      }

      case 'lead_story': {
        const s = block.story;
        const headlineLines = wrapLines(s.headline, 42, 3);
        const summaryLines = wrapLines(s.summary, 65, 7);

        bodySvg += `
          <!-- Lead Story Kicker -->
          ${s.kicker ? `<text x="44" y="${currentY + 12}" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" letter-spacing="1.5" fill="${palette.accentCrimson}">${escapeXml(s.kicker)}</text>` : ''}
        `;

        currentY += s.kicker ? 26 : 14;

        bodySvg += `<g font-family="'Playfair Display', Georgia, serif" font-size="30" font-weight="900" fill="${palette.ink}">`;
        headlineLines.forEach((line, idx) => {
          bodySvg += `<text x="44" y="${currentY + idx * 34}">${escapeXml(line)}</text>`;
        });
        bodySvg += `</g>`;

        currentY += headlineLines.length * 34 + 14;

        if (s.image) {
          const colWidth = (width - 116) / 2;
          const imgHeight = 240;

          bodySvg += `
            <rect x="44" y="${currentY}" width="${colWidth}" height="${imgHeight}" fill="#1A1816" stroke="${palette.rule}" stroke-width="1"/>
            <rect x="48" y="${currentY + 4}" width="${colWidth - 8}" height="${imgHeight - 28}" fill="#2D2924"/>
            <text x="${44 + colWidth / 2}" y="${currentY + imgHeight / 2 - 8}" font-family="Georgia, serif" font-size="13" font-style="italic" fill="#E8DCBE" text-anchor="middle">${escapeXml(s.image.caption || 'Verified Press Dispatch Wire')}</text>
            <text x="${44 + colWidth / 2}" y="${currentY + imgHeight / 2 + 12}" font-family="Arial, sans-serif" font-size="9" fill="#B0A48E" text-anchor="middle">OFFICIAL PUBLISHER ARCHIVE</text>
            
            <rect x="44" y="${currentY + imgHeight - 20}" width="${colWidth}" height="20" fill="${palette.lightPaper}"/>
            <text x="52" y="${currentY + imgHeight - 6}" font-family="Arial, sans-serif" font-size="9" fill="${palette.faintInk}">PHOTO: ${escapeXml(s.image.credit || s.source)}</text>

            <g font-family="'Merriweather', Georgia, serif" font-size="13" fill="${palette.mutedInk}">
          `;

          summaryLines.forEach((line, idx) => {
            bodySvg += `<text x="${44 + colWidth + 28}" y="${currentY + 16 + idx * 21}">${escapeXml(line)}</text>`;
          });

          bodySvg += `</g>`;

          if (s.whyItMatters) {
            const whyY = currentY + 16 + summaryLines.length * 21 + 8;
            const whyLines = wrapLines(s.whyItMatters, 58, 3);
            bodySvg += `
              <rect x="${44 + colWidth + 28}" y="${whyY}" width="${colWidth - 28}" height="${whyLines.length * 18 + 24}" fill="${palette.lightPaper}" stroke="${palette.rule}" stroke-width="1"/>
              <line x1="${44 + colWidth + 28}" y1="${whyY}" x2="${44 + colWidth + 28}" y2="${whyY + whyLines.length * 18 + 24}" stroke="${palette.rule}" stroke-width="3"/>
              <text x="${44 + colWidth + 38}" y="${whyY + 14}" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="${palette.ink}">WHY THIS MATTERS</text>
              <g font-family="'Merriweather', Georgia, serif" font-size="11.5" fill="${palette.mutedInk}">
            `;
            whyLines.forEach((wl, wIdx) => {
              bodySvg += `<text x="${44 + colWidth + 38}" y="${whyY + 28 + wIdx * 16}">${escapeXml(wl)}</text>`;
            });
            bodySvg += `</g>`;
          }

          currentY += Math.max(imgHeight + 14, 280);
          bodySvg += `<line x1="44" y1="${currentY}" x2="${width - 44}" y2="${currentY}" stroke="${palette.rule}" stroke-width="1"/>`;
          currentY += 16;
        } else {
          const fullWidth = width - 88;
          const textSummaryLines = wrapLines(s.summary, 90, 6);
          bodySvg += `<g font-family="'Merriweather', Georgia, serif" font-size="13.5" fill="${palette.mutedInk}">`;
          textSummaryLines.forEach((line, idx) => {
            bodySvg += `<text x="44" y="${currentY + 16 + idx * 22}">${escapeXml(line)}</text>`;
          });
          bodySvg += `</g>`;

          if (s.whyItMatters) {
            const whyY = currentY + 16 + textSummaryLines.length * 22 + 10;
            const whyLines = wrapLines(s.whyItMatters, 85, 3);
            bodySvg += `
              <rect x="44" y="${whyY}" width="${fullWidth}" height="${whyLines.length * 18 + 24}" fill="${palette.lightPaper}" stroke="${palette.rule}" stroke-width="1"/>
              <line x1="44" y1="${whyY}" x2="44" y2="${whyY + whyLines.length * 18 + 24}" stroke="${palette.rule}" stroke-width="3"/>
              <text x="56" y="${whyY + 14}" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="${palette.ink}">WHY THIS MATTERS</text>
              <g font-family="'Merriweather', Georgia, serif" font-size="12" fill="${palette.mutedInk}">
            `;
            whyLines.forEach((wl, wIdx) => {
              bodySvg += `<text x="56" y="${whyY + 28 + wIdx * 16}">${escapeXml(wl)}</text>`;
            });
            bodySvg += `</g>`;
            currentY = whyY + whyLines.length * 18 + 30;
          } else {
            currentY += textSummaryLines.length * 22 + 24;
          }
          bodySvg += `<line x1="44" y1="${currentY}" x2="${width - 44}" y2="${currentY}" stroke="${palette.rule}" stroke-width="1"/>`;
          currentY += 16;
        }
        break;
      }

      case 'story': {
        const s = block.story;
        const headlineLines = wrapLines(s.headline, 48, 2);
        const summaryLines = wrapLines(s.summary, 75, 4);

        bodySvg += `
          ${s.kicker ? `<text x="44" y="${currentY + 10}" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="${palette.accentCrimson}">${escapeXml(s.kicker)}</text>` : ''}
          <g font-family="'Playfair Display', Georgia, serif" font-size="18" font-weight="bold" fill="${palette.ink}">
        `;
        headlineLines.forEach((hl, hIdx) => {
          bodySvg += `<text x="44" y="${currentY + 26 + hIdx * 22}">${escapeXml(hl)}</text>`;
        });
        bodySvg += `</g><g font-family="'Merriweather', Georgia, serif" font-size="12" fill="${palette.mutedInk}">`;
        summaryLines.forEach((sl, slIdx) => {
          bodySvg += `<text x="44" y="${currentY + 30 + headlineLines.length * 22 + slIdx * 18}">${escapeXml(sl)}</text>`;
        });
        bodySvg += `</g>
          <text x="44" y="${currentY + 38 + headlineLines.length * 22 + summaryLines.length * 18}" font-family="Arial, sans-serif" font-size="9" fill="${palette.faintInk}">SOURCE: ${escapeXml(s.source)}</text>
        `;

        currentY += headlineLines.length * 22 + summaryLines.length * 18 + 50;
        bodySvg += `<line x1="44" y1="${currentY}" x2="${width - 44}" y2="${currentY}" stroke="${palette.rule}" stroke-width="1"/>`;
        currentY += 14;
        break;
      }

      case 'story_grid': {
        const stories = block.stories;
        const cols = block.columns || 2;
        const gap = 28;
        const colWidth = (width - 88 - (cols - 1) * gap) / cols;

        // Render stories in rows of `cols` columns across the grid
        for (let i = 0; i < stories.length; i += cols) {
          const rowStories = stories.slice(i, i + cols);
          let maxRowHeight = 180;

          rowStories.forEach((st, sIdx) => {
            const colX = 44 + sIdx * (colWidth + gap);
            const headlineLines = wrapLines(st.headline, Math.floor(colWidth / 15), 2);
            const summaryLines = wrapLines(st.summary, Math.floor(colWidth / 10), 4);
            const cardHeight = headlineLines.length * 22 + summaryLines.length * 18 + 56;
            if (cardHeight > maxRowHeight) maxRowHeight = cardHeight;

            bodySvg += `
              ${st.kicker ? `<text x="${colX}" y="${currentY + 10}" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="${palette.accentCrimson}">${escapeXml(st.kicker)}</text>` : ''}
              <g font-family="'Playfair Display', Georgia, serif" font-size="17" font-weight="bold" fill="${palette.ink}">
            `;

            headlineLines.forEach((hl, hIdx) => {
              bodySvg += `<text x="${colX}" y="${currentY + 26 + hIdx * 22}">${escapeXml(hl)}</text>`;
            });

            bodySvg += `</g><g font-family="'Merriweather', Georgia, serif" font-size="11.5" fill="${palette.mutedInk}">`;

            summaryLines.forEach((sl, slIdx) => {
              bodySvg += `<text x="${colX}" y="${currentY + 30 + headlineLines.length * 22 + slIdx * 18}">${escapeXml(sl)}</text>`;
            });

            bodySvg += `
              </g>
              <text x="${colX}" y="${currentY + 38 + headlineLines.length * 22 + summaryLines.length * 18}" font-family="Arial, sans-serif" font-size="9" fill="${palette.faintInk}">SOURCE: ${escapeXml(st.source)}</text>
            `;

            if (sIdx < rowStories.length - 1) {
              bodySvg += `<line x1="${colX + colWidth + gap / 2}" y1="${currentY}" x2="${colX + colWidth + gap / 2}" y2="${currentY + maxRowHeight}" stroke="${palette.lightRule}" stroke-width="1"/>`;
            }
          });

          currentY += maxRowHeight + 16;
          bodySvg += `<line x1="44" y1="${currentY}" x2="${width - 44}" y2="${currentY}" stroke="${palette.rule}" stroke-width="1"/>`;
          currentY += 14;
        }
        break;
      }

      case 'weather_block': {
        const weatherBlock = block;
        bodySvg += `
          <rect x="44" y="${currentY}" width="${width - 88}" height="56" fill="${palette.lightPaper}" stroke="${palette.rule}" stroke-width="1"/>
          <text x="56" y="${currentY + 22}" font-family="Georgia, serif" font-size="13" font-weight="bold" fill="${palette.ink}">${escapeXml(weatherBlock.location)} ${weatherBlock.isStale ? '[CACHED]' : ''}</text>
          <text x="56" y="${currentY + 40}" font-family="Georgia, serif" font-size="11" fill="${palette.mutedInk}">${escapeXml(weatherBlock.condition)} &#8226; ${escapeXml(weatherBlock.forecastSummary)}</text>

          <g font-family="'Courier New', Courier, monospace" font-size="11" text-anchor="middle" fill="${palette.ink}">
            <text x="${width - 290}" y="${currentY + 24}" font-size="15" font-weight="bold">${weatherBlock.currentTempC}&#176;C</text>
            <text x="${width - 290}" y="${currentY + 40}" font-size="9" fill="${palette.faintInk}">CURRENT</text>

            <text x="${width - 200}" y="${currentY + 24}" font-size="15" font-weight="bold">${weatherBlock.lowTempC}&#176; / ${weatherBlock.highTempC}&#176;</text>
            <text x="${width - 200}" y="${currentY + 40}" font-size="9" fill="${palette.faintInk}">LOW / HIGH</text>

            <text x="${width - 100}" y="${currentY + 24}" font-size="15" font-weight="bold">${weatherBlock.precipitationChancePercent}%</text>
            <text x="${width - 100}" y="${currentY + 40}" font-size="9" fill="${palette.faintInk}">RAIN PROB</text>
          </g>
        `;
        currentY += 70;
        break;
      }

      case 'economic_calendar': {
        const economicBlock = block;
        bodySvg += `
          <text x="44" y="${currentY + 12}" font-family="'Playfair Display', Georgia, serif" font-size="13" font-weight="bold" letter-spacing="1.5" fill="${palette.ink}">ECONOMIC CALENDAR &amp; KEY CATALYSTS</text>
          <line x1="44" y1="${currentY + 18}" x2="${width - 44}" y2="${currentY + 18}" stroke="${palette.rule}" stroke-width="1.5"/>
        `;
        currentY += 28;

        economicBlock.events.slice(0, 4).forEach((ev, eIdx) => {
          const evY = currentY + eIdx * 24;
          bodySvg += `
            <g font-family="'Courier New', Courier, monospace" font-size="11" fill="${palette.ink}">
              <text x="44" y="${evY}">${escapeXml(ev.time)}</text>
              <text x="140" y="${evY}" font-weight="bold">${escapeXml(ev.currency)}</text>
              <text x="210" y="${evY}">${escapeXml(ev.eventName)}</text>
              <text x="${width - 180}" y="${evY}" fill="${ev.impact === 'high' ? palette.accentCrimson : palette.mutedInk}">[${escapeXml(ev.impact.toUpperCase())}]</text>
              <text x="${width - 44}" y="${evY}" text-anchor="end">FCST: ${escapeXml(ev.forecast || '--')}</text>
            </g>
            <line x1="44" y1="${evY + 6}" x2="${width - 44}" y2="${evY + 6}" stroke="${palette.lightRule}" stroke-width="0.5"/>
          `;
        });

        currentY += economicBlock.events.length * 24 + 10;
        break;
      }

      case 'divider': {
        const strokeWidth = block.variant === 'thick' ? 2 : 1;
        bodySvg += `<line x1="44" y1="${currentY}" x2="${width - 44}" y2="${currentY}" stroke="${palette.rule}" stroke-width="${strokeWidth}"/>`;
        currentY += 12;
        break;
      }

      case 'colophon': {
        // Render inline colophon if space permits
        break;
      }
    }
  }

  // Running footer at bottom of every page
  const footerY = height - 52;
  bodySvg += `
    <line x1="44" y1="${footerY - 14}" x2="${width - 44}" y2="${footerY - 14}" stroke="${palette.rule}" stroke-width="1.5"/>
    <g font-family="Arial, sans-serif" font-size="9" fill="${palette.faintInk}" text-anchor="middle">
      <text x="${width / 2}" y="${footerY}">${escapeXml(page.footer?.colophon || doc.edition.title + ' TELEGRAPHIC SYNDICATE · PRINTED ON DIGITAL BROADSHEET')}</text>
      <text x="${width / 2}" y="${footerY + 14}">PAGE ${page.pageNumber} OF ${page.totalPages} &#8226; ALL RIGHTS RESERVED &#8226; STRICTLY NON-ADVISORY</text>
    </g>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${paperGrainFilter ? `<defs>${paperGrainFilter}</defs>` : ''}
  <!-- Paper Background -->
  <rect width="${width}" height="${height}" fill="${palette.paperBackground}"/>

  <!-- Outer Double Borders -->
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="${palette.rule}" stroke-width="3"/>
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="${palette.rule}" stroke-width="1"/>

  ${bodySvg}
</svg>`;
}
