import type {
  NewspaperBlock,
  NewspaperDocument,
  NewspaperPage,
  NewspaperStory,
} from '../types/document';
import { getThemePalette, NEWSPAPER_TYPOGRAPHY } from '../design/tokens';

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateNewspaperHtml(
  doc: NewspaperDocument,
  options?: { theme?: string; singlePageMode?: boolean }
): string {
  const palette = getThemePalette(options?.theme || doc.edition.theme);
  const typography = NEWSPAPER_TYPOGRAPHY;

  const renderedPages = doc.pages
    .map(page => renderPageHtml(page, doc, palette, options?.singlePageMode))
    .join('\n<div class="page-break-indicator"></div>\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(doc.edition.title)} - ${escapeHtml(doc.edition.subtitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,600;0,800;0,900;1,600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-paper: ${palette.paperBackground};
      --bg-light-paper: ${palette.lightPaper};
      --bg-dark-paper: ${palette.darkPaper};
      --color-ink: ${palette.ink};
      --color-muted-ink: ${palette.mutedInk};
      --color-faint-ink: ${palette.faintInk};
      --color-rule: ${palette.rule};
      --color-light-rule: ${palette.lightRule};
      --color-crimson: ${palette.accentCrimson};
      --color-green: ${palette.accentGreen};
      --font-masthead: ${typography.fontMasthead};
      --font-headline: ${typography.fontHeadline};
      --font-body: ${typography.fontBody};
      --font-metadata: ${typography.fontMetadata};
      --font-mono: ${typography.fontMono};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #2B2824;
      color: var(--color-ink);
      font-family: var(--font-body);
      line-height: 1.5;
      padding: 24px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }

    .broadsheet-page {
      background-color: var(--bg-paper);
      background-image: radial-gradient(var(--bg-light-paper) 15%, transparent 16%), radial-gradient(var(--bg-dark-paper) 15%, transparent 16%);
      background-size: 60px 60px;
      background-position: 0 0, 30px 30px;
      width: 100%;
      max-width: 1160px;
      min-height: 1540px;
      padding: 28px 36px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      position: relative;
      border: 1px solid #C8BBA0;
      margin-bottom: 32px;
    }

    /* Double border wrapper */
    .outer-border {
      border: 3px solid var(--color-rule);
      padding: 5px;
      min-height: 100%;
    }

    .inner-border {
      border: 1px solid var(--color-rule);
      padding: 16px 20px 24px 20px;
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Masthead */
    .masthead-container {
      margin-bottom: 12px;
    }

    .ears-container {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--color-rule);
      padding-bottom: 8px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--color-muted-ink);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .ear-box {
      max-width: 320px;
      line-height: 1.35;
    }

    .ear-box.right {
      text-align: right;
    }

    .ear-title {
      font-weight: 700;
      color: var(--color-ink);
      margin-bottom: 2px;
    }

    .masthead-title-wrap {
      text-align: center;
      padding: 14px 0 8px 0;
    }

    .masthead-title {
      font-family: var(--font-masthead);
      font-size: 68px;
      font-weight: 900;
      letter-spacing: 4px;
      line-height: 1;
      color: var(--color-ink);
      text-transform: uppercase;
    }

    .masthead-subtitle {
      font-family: var(--font-headline);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 2px;
      color: var(--color-muted-ink);
      text-transform: uppercase;
      margin-top: 6px;
    }

    .dateline-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid var(--color-rule);
      border-bottom: 2px solid var(--color-rule);
      padding: 6px 12px;
      margin: 10px 0 16px 0;
      font-family: var(--font-headline);
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      background-color: var(--bg-light-paper);
    }

    /* Running page header (Page 2+) */
    .running-page-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid var(--color-rule);
      padding-bottom: 8px;
      margin-bottom: 18px;
      font-family: var(--font-headline);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Market Strip */
    .market-strip-container {
      background-color: var(--bg-light-paper);
      border: 1px solid var(--color-rule);
      border-left: 4px solid var(--color-rule);
      padding: 8px 12px;
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .market-strip-label {
      font-family: var(--font-masthead);
      font-weight: 800;
      font-size: 12px;
      letter-spacing: 1px;
      color: var(--color-ink);
      border-right: 2px solid var(--color-rule);
      padding-right: 12px;
      text-transform: uppercase;
    }

    .market-tickers-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-family: var(--font-mono);
      font-size: 12px;
    }

    .ticker-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .ticker-sym {
      font-weight: 700;
      color: var(--color-ink);
    }

    .ticker-price {
      color: var(--color-muted-ink);
    }

    .ticker-change.up {
      color: var(--color-green);
      font-weight: 600;
    }

    .ticker-change.down {
      color: var(--color-crimson);
      font-weight: 600;
    }

    .ticker-change.flat {
      color: var(--color-muted-ink);
    }

    /* Lead Story Block */
    .lead-story-container {
      margin-bottom: 20px;
    }

    .story-kicker {
      font-family: var(--font-metadata);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: var(--color-crimson);
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .lead-headline {
      font-family: var(--font-headline);
      font-size: 34px;
      font-weight: 900;
      line-height: 1.15;
      color: var(--color-ink);
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .lead-content-grid {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 20px;
      align-items: start;
    }

    .story-figure {
      margin: 0;
      border: 1px solid var(--color-rule);
      background-color: #000;
    }

    .story-figure img {
      width: 100%;
      height: auto;
      display: block;
      filter: grayscale(100%) contrast(110%);
    }

    .story-figcaption {
      font-family: var(--font-metadata);
      font-size: 10px;
      color: var(--color-faint-ink);
      padding: 6px 8px;
      background-color: var(--bg-light-paper);
      border-top: 1px solid var(--color-light-rule);
      display: flex;
      justify-content: space-between;
    }

    .story-body {
      font-size: 13.5px;
      line-height: 1.55;
      text-align: justify;
      color: var(--color-muted-ink);
    }

    .story-body.lead-body::first-letter {
      float: left;
      font-family: var(--font-headline);
      font-size: 52px;
      line-height: 44px;
      padding-top: 4px;
      padding-right: 8px;
      padding-bottom: 2px;
      color: var(--color-ink);
      font-weight: 900;
    }

    .why-it-matters-box {
      margin-top: 12px;
      border: 1px solid var(--color-rule);
      background-color: var(--bg-light-paper);
      padding: 10px 14px;
      border-left: 3px solid var(--color-rule);
    }

    .why-title {
      font-family: var(--font-metadata);
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--color-ink);
      margin-bottom: 4px;
    }

    .why-body {
      font-size: 12px;
      color: var(--color-muted-ink);
      line-height: 1.45;
    }

    .story-byline {
      margin-top: 10px;
      font-family: var(--font-metadata);
      font-size: 10px;
      color: var(--color-faint-ink);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Story Grid & Columns */
    .story-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin: 16px 0;
    }

    .story-grid.col-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .story-card-inner {
      border-right: 1px solid var(--color-light-rule);
      padding-right: 20px;
    }

    .story-card-inner:last-child {
      border-right: none;
      padding-right: 0;
    }

    .story-headline-sub {
      font-family: var(--font-headline);
      font-size: 20px;
      font-weight: 800;
      line-height: 1.25;
      color: var(--color-ink);
      margin-bottom: 8px;
    }

    /* Section Header */
    .section-header-wrap {
      text-align: center;
      border-top: 2px solid var(--color-rule);
      border-bottom: 2px solid var(--color-rule);
      padding: 8px 0;
      margin: 18px 0 16px 0;
      background-color: var(--bg-light-paper);
    }

    .section-title {
      font-family: var(--font-masthead);
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
    }

    .section-sub {
      font-family: var(--font-headline);
      font-size: 10.5px;
      letter-spacing: 1px;
      color: var(--color-muted-ink);
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* Weather Block */
    .weather-block-wrap {
      border: 1px solid var(--color-rule);
      background-color: var(--bg-light-paper);
      padding: 12px 16px;
      margin: 16px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .weather-loc-box {
      font-family: var(--font-headline);
    }

    .weather-loc-name {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .weather-cond {
      font-size: 12px;
      color: var(--color-muted-ink);
      margin-top: 2px;
    }

    .weather-metrics {
      display: flex;
      gap: 18px;
      font-family: var(--font-mono);
      font-size: 12px;
    }

    .weather-metric-item {
      text-align: center;
    }

    .weather-val {
      font-weight: 700;
      font-size: 15px;
      color: var(--color-ink);
    }

    .weather-lbl {
      font-size: 9px;
      color: var(--color-faint-ink);
      text-transform: uppercase;
    }

    .weather-stale-tag {
      font-size: 9px;
      background-color: #6B5B3E;
      color: #fff;
      padding: 2px 6px;
      border-radius: 2px;
      font-weight: bold;
      text-transform: uppercase;
    }

    /* Economic Calendar */
    .economic-cal-wrap {
      margin: 16px 0;
    }

    .economic-cal-title {
      font-family: var(--font-masthead);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-bottom: 2px solid var(--color-rule);
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    .calendar-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }

    .calendar-table th {
      text-align: left;
      border-bottom: 1px solid var(--color-rule);
      padding: 4px 6px;
      font-family: var(--font-metadata);
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-muted-ink);
      font-size: 9.5px;
    }

    .calendar-table td {
      padding: 6px;
      border-bottom: 1px solid var(--color-light-rule);
      font-family: var(--font-mono);
    }

    .badge-impact {
      font-size: 9px;
      padding: 1px 4px;
      border-radius: 2px;
      text-transform: uppercase;
      font-weight: bold;
    }

    .badge-impact.high {
      background-color: var(--color-crimson);
      color: #FFF;
    }

    .badge-impact.medium {
      background-color: #C28624;
      color: #FFF;
    }

    .badge-impact.low {
      background-color: #7A7265;
      color: #FFF;
    }

    /* Dividers */
    .rule-thick {
      border: none;
      border-top: 2px solid var(--color-rule);
      margin: 12px 0;
    }

    .rule-thin {
      border: none;
      border-top: 1px solid var(--color-light-rule);
      margin: 10px 0;
    }

    .rule-double {
      border: none;
      border-top: 3px double var(--color-rule);
      margin: 12px 0;
    }

    /* Footer Colophon */
    .broadsheet-footer {
      margin-top: auto;
      padding-top: 14px;
      border-top: 2px solid var(--color-rule);
      font-family: var(--font-metadata);
      font-size: 9.5px;
      color: var(--color-faint-ink);
      text-align: center;
      line-height: 1.5;
    }

    .page-break-indicator {
      width: 100%;
      max-width: 1160px;
      height: 2px;
      background: repeating-linear-gradient(90deg, #555, #555 8px, transparent 8px, transparent 16px);
      margin: 16px 0;
    }

    /* Mobile Responsive Adaptation */
    @media (max-width: 820px) {
      body {
        padding: 12px 4px;
      }
      .broadsheet-page {
        padding: 14px 16px;
      }
      .masthead-title {
        font-size: 40px;
      }
      .ears-container {
        flex-direction: column;
        gap: 6px;
      }
      .ear-box.right {
        text-align: left;
      }
      .lead-headline {
        font-size: 24px;
      }
      .lead-content-grid {
        grid-template-columns: 1fr;
      }
      .story-grid {
        grid-template-columns: 1fr;
      }
      .story-card-inner {
        border-right: none;
        padding-right: 0;
        border-bottom: 1px solid var(--color-light-rule);
        padding-bottom: 16px;
        margin-bottom: 16px;
      }
      .weather-metrics {
        flex-wrap: wrap;
      }
    }
  </style>
</head>
<body>
  ${renderedPages}
</body>
</html>`;
}

function renderPageHtml(
  page: NewspaperPage,
  doc: NewspaperDocument,
  palette: any,
  singlePageMode?: boolean
): string {
  const blocksHtml = page.blocks.map(b => renderBlockHtml(b, doc)).join('\n');

  const runningHeader = page.header
    ? `<div class="running-page-header">
        <span>${escapeHtml(page.header.runningTitle)}</span>
        <span>${escapeHtml(page.header.pageDate)}</span>
        <span>${escapeHtml(page.header.sectionName || `PAGE ${page.pageNumber}`)}</span>
      </div>`
    : '';

  const pageFooter = page.footer && !singlePageMode
    ? `<div class="broadsheet-footer">
        <div>${escapeHtml(page.footer.colophon)}</div>
        <div style="font-weight: 700; margin-top: 4px;">PAGE ${page.pageNumber} OF ${page.totalPages}</div>
      </div>`
    : '';

  return `
    <article class="broadsheet-page" data-page="${page.pageNumber}">
      <div class="outer-border">
        <div class="inner-border">
          ${runningHeader}
          ${blocksHtml}
          ${pageFooter}
        </div>
      </div>
    </article>
  `;
}

function renderBlockHtml(block: NewspaperBlock, doc: NewspaperDocument): string {
  switch (block.type) {
    case 'masthead':
      return `
        <header class="masthead-container">
          <div class="ears-container">
            <div class="ear-box">
              <div class="ear-title">${escapeHtml(block.leftEar?.title || 'METEOROLOGY')}</div>
              <div>${escapeHtml(block.leftEar?.line1)}</div>
              <div>${escapeHtml(block.leftEar?.line2)}</div>
            </div>
            <div class="ear-box right">
              <div class="ear-title">${escapeHtml(block.rightEar?.title || 'DISPATCH')}</div>
              <div>${escapeHtml(block.rightEar?.line1)}</div>
              <div>${escapeHtml(block.rightEar?.line2)}</div>
            </div>
          </div>
          <div class="masthead-title-wrap">
            <h1 class="masthead-title">${escapeHtml(block.title)}</h1>
            <div class="masthead-subtitle">${escapeHtml(block.motto)} &bull; ${escapeHtml(block.subtitle)}</div>
          </div>
          <div class="dateline-strip">
            <span>${escapeHtml(block.dayOfWeek)}, ${escapeHtml(block.date)}</span>
            <span>${escapeHtml(block.cityOrRegion)}</span>
            <span>${escapeHtml(block.priceTag)}</span>
          </div>
        </header>
      `;

    case 'market_strip':
      return `
        <div class="market-strip-container">
          <span class="market-strip-label">${escapeHtml(block.title || 'MARKETS')}</span>
          <div class="market-tickers-wrap">
            ${block.tickers.map(t => {
              const sign = t.change > 0 ? '+' : t.change < 0 ? '−' : '';
              const directionClass = t.direction === 'up' ? 'up' : t.direction === 'down' ? 'down' : 'flat';
              const formattedChange = `${sign}${Math.abs(t.changePercent).toFixed(2)}%`;
              return `
                <div class="ticker-item">
                  <span class="ticker-sym">${escapeHtml(t.symbol)}</span>
                  <span class="ticker-price">${t.price >= 100 ? t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t.price.toFixed(4)}</span>
                  <span class="ticker-change ${directionClass}">${formattedChange}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

    case 'lead_story':
      const story = block.story;
      const imageHtml = story.image && story.image.url
        ? `<figure class="story-figure">
             <img src="${escapeHtml(story.image.url)}" alt="${escapeHtml(story.headline)}" loading="lazy" />
             <figcaption class="story-figcaption">
               <span>${escapeHtml(story.image.caption || story.headline)}</span>
               <span>PHOTO: ${escapeHtml(story.image.credit)}</span>
             </figcaption>
           </figure>`
        : '';

      const whyHtml = story.whyItMatters
        ? `<div class="why-it-matters-box">
             <div class="why-title">WHY THIS MATTERS</div>
             <p class="why-body">${escapeHtml(story.whyItMatters)}</p>
           </div>`
        : '';

      return `
        <section class="lead-story-container">
          ${story.kicker ? `<div class="story-kicker">${escapeHtml(story.kicker)}</div>` : ''}
          <h2 class="lead-headline">${escapeHtml(story.headline)}</h2>
          <div class="lead-content-grid ${!imageHtml ? 'no-image' : ''}">
            ${imageHtml}
            <div>
              <p class="story-body lead-body">${escapeHtml(story.summary)}</p>
              ${whyHtml}
              <div class="story-byline">
                <span>SOURCE: <a href="${escapeHtml(story.originalUrl)}" style="color:inherit;text-decoration:none;" target="_blank" rel="noopener">${escapeHtml(story.source)}</a></span>
                ${story.author ? ` &bull; <span>${escapeHtml(story.author)}</span>` : ''}
              </div>
            </div>
          </div>
        </section>
      `;

    case 'story':
      return renderSingleStoryHtml(block.story);

    case 'story_grid':
      const colClass = block.columns === 3 ? 'col-3' : '';
      return `
        <section class="story-grid ${colClass}">
          ${block.stories.map(s => renderSingleStoryHtml(s)).join('\n')}
        </section>
      `;

    case 'section_header':
      return `
        <div class="section-header-wrap">
          <h3 class="section-title">${escapeHtml(block.title)}</h3>
          ${block.subtitle ? `<div class="section-sub">${escapeHtml(block.subtitle)}</div>` : ''}
        </div>
      `;

    case 'weather_block':
      return `
        <div class="weather-block-wrap">
          <div class="weather-loc-box">
            <div class="weather-loc-name">${escapeHtml(block.location)} ${block.isStale ? `<span class="weather-stale-tag">CACHED DISPATCH</span>` : ''}</div>
            <div class="weather-cond">${escapeHtml(block.conditionIcon)} ${escapeHtml(block.condition)} &bull; ${escapeHtml(block.forecastSummary)}</div>
          </div>
          <div class="weather-metrics">
            <div class="weather-metric-item">
              <div class="weather-val">${block.currentTempC}&deg;C</div>
              <div class="weather-lbl">Current</div>
            </div>
            <div class="weather-metric-item">
              <div class="weather-val">${block.lowTempC}&deg; / ${block.highTempC}&deg;</div>
              <div class="weather-lbl">Low / High</div>
            </div>
            <div class="weather-metric-item">
              <div class="weather-val">${block.precipitationChancePercent}%</div>
              <div class="weather-lbl">Rain</div>
            </div>
            ${block.humidityPercent !== undefined ? `
            <div class="weather-metric-item">
              <div class="weather-val">${block.humidityPercent}%</div>
              <div class="weather-lbl">Humidity</div>
            </div>` : ''}
          </div>
        </div>
      `;

    case 'economic_calendar':
      return `
        <div class="economic-cal-wrap">
          <div class="economic-cal-title">${escapeHtml(block.title)}</div>
          <table class="calendar-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Currency</th>
                <th>Catalyst / Indicator</th>
                <th>Impact</th>
                <th>Forecast</th>
                <th>Previous</th>
              </tr>
            </thead>
            <tbody>
              ${block.events.map(ev => `
                <tr>
                  <td>${escapeHtml(ev.time)}</td>
                  <td><strong>${escapeHtml(ev.currency)}</strong></td>
                  <td>${escapeHtml(ev.eventName)}</td>
                  <td><span class="badge-impact ${ev.impact.toLowerCase()}">${escapeHtml(ev.impact)}</span></td>
                  <td>${escapeHtml(ev.forecast || '--')}</td>
                  <td>${escapeHtml(ev.previous || '--')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'divider':
      if (block.variant === 'thick') return '<hr class="rule-thick" />';
      if (block.variant === 'double') return '<hr class="rule-double" />';
      return '<hr class="rule-thin" />';

    case 'colophon':
      return `
        <footer class="broadsheet-footer">
          <div>${escapeHtml(block.colophon)}</div>
          <div style="margin-top: 3px;">${escapeHtml(block.disclaimer)}</div>
          <div style="margin-top: 2px;">${escapeHtml(block.sourceAttribution)}</div>
        </footer>
      `;

    default:
      return '';
  }
}

function renderSingleStoryHtml(story: NewspaperStory): string {
  const imageHtml = story.image && story.image.url
    ? `<figure class="story-figure" style="margin-bottom:8px;">
         <img src="${escapeHtml(story.image.url)}" alt="${escapeHtml(story.headline)}" loading="lazy" />
         <figcaption class="story-figcaption">PHOTO: ${escapeHtml(story.image.credit)}</figcaption>
       </figure>`
    : '';

  return `
    <article class="story-card-inner">
      ${story.kicker ? `<div class="story-kicker">${escapeHtml(story.kicker)}</div>` : ''}
      <h3 class="story-headline-sub">${escapeHtml(story.headline)}</h3>
      ${imageHtml}
      <p class="story-body" style="font-size:12.5px;">${escapeHtml(story.summary)}</p>
      ${story.whyItMatters ? `
        <div class="why-it-matters-box" style="margin-top:8px;padding:6px 10px;">
          <div class="why-title" style="font-size:8.5px;">WHY IT MATTERS</div>
          <p class="why-body" style="font-size:11px;">${escapeHtml(story.whyItMatters)}</p>
        </div>` : ''}
      <div class="story-byline">
        <span>${escapeHtml(story.source)}</span>
        ${story.author ? ` &bull; <span>${escapeHtml(story.author)}</span>` : ''}
      </div>
    </article>
  `;
}
