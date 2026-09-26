import type {
  EconomicCalendarSectionData,
  MarketSectionData,
  StorySectionData,
  StructuredNewspaperData,
  TomorrowWatchSectionData,
  WeatherSectionData,
} from '../../types/newspaper';
import type { RenderOptions } from '../types';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateRetroHtml(data: StructuredNewspaperData, options: RenderOptions = {}): string {
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
  const tomorrowSection = sections.find(
    (s): s is TomorrowWatchSectionData => s.type === 'tomorrow_watch'
  );

  const themeClass = options.theme || 'retro_black_cream';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(data.metadata.language || 'en')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(header.title)} - ${escapeHtml(header.date)}</title>
  <style>
    /* CSS Reset & Base */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #f0ebe0;
      color: #1a1714;
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      line-height: 1.35;
      padding: 24px;
      display: flex;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }

    /* Newspaper Broadsheet Container */
    .broadsheet {
      background-color: #fbf8ef;
      width: 100%;
      max-width: 1140px;
      padding: 28px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      border: 3px double #1a1714;
      position: relative;
    }

    .broadsheet-inner-border {
      border: 1px solid #1a1714;
      padding: 16px;
    }

    /* Masthead */
    .masthead-ears {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #1a1714;
      padding-bottom: 8px;
      margin-bottom: 12px;
      font-size: 11px;
      font-family: 'Courier New', Courier, monospace;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .weather-ear {
      max-width: 320px;
      line-height: 1.3;
    }

    .edition-ear {
      text-align: right;
      line-height: 1.3;
    }

    .masthead-title-wrap {
      text-align: center;
      padding: 10px 0 6px 0;
    }

    .masthead-title {
      font-size: 58px;
      font-weight: 900;
      letter-spacing: 6px;
      text-transform: uppercase;
      line-height: 1.05;
      margin-bottom: 4px;
      font-family: 'Playfair Display', Georgia, serif;
    }

    .masthead-motto {
      font-size: 12px;
      font-style: italic;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #4a4239;
      margin-bottom: 8px;
    }

    .dateline-bar {
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #1a1714;
      border-bottom: 2px solid #1a1714;
      padding: 4px 8px;
      margin-top: 6px;
      margin-bottom: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Ticker Tape Bar */
    .ticker-bar {
      border-top: 1px solid #1a1714;
      border-bottom: 1px solid #1a1714;
      padding: 6px 0;
      margin-bottom: 16px;
      background: #f5f0e1;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
    }

    .ticker-items {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      gap: 12px;
    }

    .ticker-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .ticker-sym {
      font-weight: bold;
    }

    .dir-up {
      color: #1a5624;
      font-weight: bold;
    }

    .dir-down {
      color: #8c1d18;
      font-weight: bold;
    }

    .dir-flat {
      color: #4a4239;
    }

    /* Main Grid Layout */
    .broadsheet-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    /* Left Column: Editorial Stories */
    .editorial-col {
      border-right: 1px solid #1a1714;
      padding-right: 20px;
    }

    .lead-story {
      border-bottom: 1px solid #1a1714;
      padding-bottom: 18px;
      margin-bottom: 18px;
    }

    .kicker {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #594f43;
      margin-bottom: 4px;
      display: block;
    }

    .lead-headline {
      font-size: 32px;
      font-weight: bold;
      line-height: 1.15;
      margin-bottom: 8px;
    }

    .byline-bar {
      font-size: 11px;
      font-style: italic;
      color: #554d42;
      border-bottom: 0.5px solid #cfc7b8;
      padding-bottom: 4px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    .lead-image-wrap {
      margin-bottom: 12px;
      border: 1px solid #1a1714;
      padding: 4px;
      background: #fff;
    }

    .lead-image {
      width: 100%;
      height: auto;
      display: block;
      filter: grayscale(100%) contrast(110%);
    }

    .image-caption {
      font-size: 10px;
      font-style: italic;
      color: #4a4239;
      margin-top: 4px;
      text-align: right;
    }

    .lead-text {
      text-align: justify;
      font-size: 14px;
      line-height: 1.45;
    }

    .dropcap {
      float: left;
      font-size: 52px;
      line-height: 42px;
      padding-top: 4px;
      padding-right: 8px;
      padding-bottom: 0;
      font-family: Georgia, serif;
      font-weight: bold;
      color: #1a1714;
    }

    .why-it-matters-box {
      border: 1px solid #1a1714;
      background: #f7f3e8;
      padding: 10px 14px;
      margin: 14px 0;
      font-size: 13px;
    }

    .why-title {
      font-weight: bold;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .key-points-list {
      margin: 10px 0 10px 18px;
      font-size: 13px;
    }

    .key-points-list li {
      margin-bottom: 4px;
    }

    /* Secondary Stories */
    .secondary-stories {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .secondary-story {
      border-top: 0.5px solid #1a1714;
      padding-top: 8px;
    }

    .secondary-headline {
      font-size: 18px;
      font-weight: bold;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .secondary-summary {
      font-size: 12.5px;
      line-height: 1.4;
      text-align: justify;
    }

    /* Right Column: Markets & Docket */
    .docket-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .docket-box {
      border: 1px solid #1a1714;
      padding: 12px;
      background: #faf6ec;
    }

    .docket-header {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 15px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #1a1714;
      padding-bottom: 4px;
      margin-bottom: 8px;
      text-align: center;
    }

    .market-mood-banner {
      background: #1a1714;
      color: #fbf8ef;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      padding: 4px;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
    }

    .market-mood-desc {
      font-size: 11.5px;
      font-style: italic;
      margin-bottom: 10px;
      text-align: center;
    }

    /* Economic Table */
    .econ-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      font-family: 'Courier New', Courier, monospace;
    }

    .econ-table th {
      border-bottom: 1px solid #1a1714;
      padding: 4px 2px;
      text-align: left;
      font-size: 10px;
    }

    .econ-table td {
      border-bottom: 0.5px solid #dfd8cb;
      padding: 4px 2px;
    }

    .impact-badge {
      display: inline-block;
      padding: 1px 4px;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .impact-high {
      background: #1a1714;
      color: #fbf8ef;
    }

    .impact-medium {
      background: #ded7c9;
      color: #1a1714;
    }

    .impact-low {
      color: #777;
    }

    /* Tomorrow Watch */
    .watch-item {
      border-bottom: 0.5px solid #ded7c9;
      padding: 6px 0;
      font-size: 11.5px;
    }

    .watch-session {
      font-family: 'Courier New', Courier, monospace;
      font-weight: bold;
      font-size: 10px;
      color: #554d42;
    }

    .watch-catalyst {
      font-weight: bold;
      margin: 2px 0;
    }

    .watch-desc {
      font-size: 11px;
      color: #3e3831;
    }

    /* Footer Colophon */
    .colophon-footer {
      border-top: 2px solid #1a1714;
      margin-top: 24px;
      padding-top: 10px;
      text-align: center;
      font-size: 10px;
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 0.5px;
      color: #4a4239;
    }

    .colophon-footer p {
      margin-bottom: 3px;
    }
  </style>
</head>
<body class="${themeClass}">

  <div class="broadsheet">
    <div class="broadsheet-inner-border">

      <!-- Masthead Top Ears -->
      <header class="masthead-ears">
        <div class="weather-ear">
          ${weatherSection ? `
            <strong>METEOROLOGICAL REPORT</strong><br>
            ${escapeHtml(weatherSection.location)} &bull; ${escapeHtml(weatherSection.conditionIconText)} ${escapeHtml(weatherSection.currentCondition)}<br>
            Temp: ${weatherSection.currentTempC}&deg;C (High: ${weatherSection.highTempC}&deg;C / Low: ${weatherSection.lowTempC}&deg;C)
          ` : `
            <strong>THE FYNENCE MERCANTILE RECORD</strong><br>
            Global Exchange & Commodity Intelligence
          `}
        </div>
        <div class="edition-ear">
          <strong>${escapeHtml(header.volumeNumber || 'VOL. I')} &bull; ${escapeHtml(header.editionNumber || 'NO. 1')}</strong><br>
          ${escapeHtml(header.cityOrRegion)}<br>
          PRICE: ${escapeHtml(header.priceTag || 'FIVE CENTS')}
        </div>
      </header>

      <!-- Main Masthead Title -->
      <div class="masthead-title-wrap">
        <h1 class="masthead-title">${escapeHtml(header.title)}</h1>
        <div class="masthead-motto">${escapeHtml(header.motto || 'VERITAS IN NUMERIS')} &bull; ${escapeHtml(header.subtitle)}</div>
      </div>

      <!-- Dateline Bar -->
      <div class="dateline-bar">
        <span>${escapeHtml(header.dayOfWeek)}, ${escapeHtml(header.date)}</span>
        <span>ELECTRONIC BROADSHEET EDITION</span>
        <span>DAILY FINANCIAL DISPATCH</span>
      </div>

      <!-- Market Ticker Tape -->
      ${marketSection && marketSection.tickers && marketSection.tickers.length > 0 ? `
      <div class="ticker-bar">
        <div class="ticker-items">
          ${marketSection.tickers.map((t) => {
            const dirIcon = t.direction === 'up' ? '&#9650;' : t.direction === 'down' ? '&#9660;' : '&ndash;';
            const dirClass = t.direction === 'up' ? 'dir-up' : t.direction === 'down' ? 'dir-down' : 'dir-flat';
            const sign = t.change > 0 ? '+' : '';
            return `
            <span class="ticker-item">
              <span class="ticker-sym">${escapeHtml(t.symbol)}</span>:
              <span>${t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span class="${dirClass}">${dirIcon} ${sign}${t.changePercent.toFixed(2)}%</span>
            </span>`;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Main Broadsheet Grid -->
      <main class="broadsheet-grid">

        <!-- Left Column: News Stories -->
        <section class="editorial-col">
          ${leadStory ? `
            <article class="lead-story">
              <span class="kicker">${escapeHtml(leadStory.kicker || 'FRONT PAGE EXCLUSIVE')}</span>
              <h2 class="lead-headline">${escapeHtml(leadStory.headline)}</h2>
              <div class="byline-bar">
                BY ${escapeHtml(leadStory.author || 'BUREAU CORRESPONDENT')} &bull; WIRE: ${escapeHtml(leadStory.source)}
              </div>

              ${leadStory.image && leadStory.image.processedUrl ? `
                <div class="lead-image-wrap">
                  <img class="lead-image" src="${escapeHtml(leadStory.image.processedUrl)}" alt="${escapeHtml(leadStory.headline)}">
                  <div class="image-caption">Image Archive: ${escapeHtml(leadStory.image.credit || leadStory.image.source)} (Strictly Source Verified)</div>
                </div>
              ` : ''}

              <div class="lead-text">
                <span class="dropcap">${escapeHtml(leadStory.summary.charAt(0))}</span>
                ${escapeHtml(leadStory.summary.substring(1))}
              </div>

              ${leadStory.whyItMatters ? `
                <div class="why-it-matters-box">
                  <div class="why-title">Why It Matters to Markets</div>
                  <p>${escapeHtml(leadStory.whyItMatters)}</p>
                </div>
              ` : ''}

              ${leadStory.keyPoints && leadStory.keyPoints.length > 0 ? `
                <ul class="key-points-list">
                  ${leadStory.keyPoints.map((pt) => `<li>${escapeHtml(pt)}</li>`).join('')}
                </ul>
              ` : ''}
            </article>
          ` : ''}

          <!-- Secondary Stories Columns -->
          <div class="secondary-stories">
            ${secondaryStories.map((story) => `
              <article class="secondary-story">
                <span class="kicker">${escapeHtml(story.kicker || story.type)}</span>
                <h3 class="secondary-headline">${escapeHtml(story.headline)}</h3>
                <p class="secondary-summary">${escapeHtml(story.summary)}</p>
              </article>
            `).join('')}
          </div>
        </section>

        <!-- Right Column: Markets Docket & Catalysts -->
        <aside class="docket-col">

          ${marketSection ? `
            <div class="docket-box">
              <h3 class="docket-header">Market Barometer</h3>
              <div class="market-mood-banner">MOOD: ${escapeHtml(marketSection.marketMood)}</div>
              <p class="market-mood-desc">${escapeHtml(marketSection.moodDescription)}</p>
              ${marketSection.macroSummary ? `<p style="font-size: 11px; text-align: justify;">${escapeHtml(marketSection.macroSummary)}</p>` : ''}
            </div>
          ` : ''}

          ${economicSection && economicSection.events && economicSection.events.length > 0 ? `
            <div class="docket-box">
              <h3 class="docket-header">Economic Docket</h3>
              <table class="econ-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Indicator</th>
                    <th>Impact</th>
                    <th>Forecast</th>
                  </tr>
                </thead>
                <tbody>
                  ${economicSection.events.map((ev) => `
                    <tr>
                      <td>${escapeHtml(ev.time)}</td>
                      <td><strong>${escapeHtml(ev.currency)}</strong> ${escapeHtml(ev.eventName)}</td>
                      <td><span class="impact-badge impact-${escapeHtml(ev.impact)}">${escapeHtml(ev.impact)}</span></td>
                      <td>${escapeHtml(ev.forecast || 'N/A')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${tomorrowSection && tomorrowSection.items && tomorrowSection.items.length > 0 ? `
            <div class="docket-box">
              <h3 class="docket-header">Tomorrow Watch</h3>
              ${tomorrowSection.items.map((it) => `
                <div class="watch-item">
                  <div class="watch-session">${escapeHtml(it.timeOrSession)}</div>
                  <div class="watch-catalyst">${escapeHtml(it.catalyst)}</div>
                  <div class="watch-desc">${escapeHtml(it.expectedSignificance)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

        </aside>

      </main>

      <!-- Colophon & Legal Footer -->
      <footer class="colophon-footer">
        <p>${escapeHtml(data.footer.colophon)}</p>
        <p>${escapeHtml(data.footer.disclaimer)}</p>
        <p>${escapeHtml(data.footer.sourceAttribution)}</p>
      </footer>

    </div>
  </div>

</body>
</html>`;
}
