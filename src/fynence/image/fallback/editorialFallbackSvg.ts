import type { Article } from '../../types/article';
import type { ImageFallbackType } from '../types';

export class EditorialFallbackSvgGenerator {
  /**
   * Generates a vintage SVG string for an article fallback illustration.
   */
  generateFallbackSvg(article: Article, fallbackType: ImageFallbackType, width = 600, height = 340): string {
    const titleSnippet = article.title.length > 40 ? `${article.title.substring(0, 38)}...` : article.title;
    const sanitizedTitle = titleSnippet.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const sourceSnippet = (article.source || 'THE FYNENCE ARCHIVE').toUpperCase();

    if (fallbackType === 'chart' || fallbackType === 'data_viz') {
      return this.generateChartSvg(sanitizedTitle, sourceSnippet, width, height);
    }

    if (fallbackType === 'decorative_woodcut') {
      return this.generateWoodcutSvg(sanitizedTitle, sourceSnippet, width, height);
    }

    // Default: typography / editorial monogram
    return this.generateTypographySvg(sanitizedTitle, sourceSnippet, width, height);
  }

  private generateTypographySvg(title: string, source: string, width: number, height: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#fbf8ef"/>
  <rect x="12" y="12" width="${width - 24}" height="${height - 24}" fill="none" stroke="#1a1714" stroke-width="2"/>
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" fill="none" stroke="#1a1714" stroke-width="0.75"/>
  <circle cx="${width / 2}" cy="${height / 2 - 25}" r="45" fill="none" stroke="#1a1714" stroke-width="1.5"/>
  <text x="${width / 2}" y="${height / 2 - 12}" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="bold" fill="#1a1714" text-anchor="middle">§</text>
  <text x="${width / 2}" y="${height / 2 + 50}" font-family="Georgia, 'Times New Roman', serif" font-size="14" font-weight="bold" letter-spacing="2" fill="#1a1714" text-anchor="middle">VERITAS IN NUMERIS</text>
  <text x="${width / 2}" y="${height / 2 + 75}" font-family="'Courier New', monospace" font-size="11" letter-spacing="1" fill="#4a4239" text-anchor="middle">${source}</text>
  <line x1="80" y1="${height - 35}" x2="${width - 80}" y2="${height - 35}" stroke="#1a1714" stroke-width="0.5"/>
</svg>`;
  }

  private generateChartSvg(title: string, source: string, width: number, height: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#fbf8ef"/>
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="#1a1714" stroke-width="1.5"/>
  <!-- Chart Grid -->
  <line x1="40" y1="50" x2="${width - 40}" y2="50" stroke="#cfc7b8" stroke-width="1" stroke-dasharray="2,2"/>
  <line x1="40" y1="110" x2="${width - 40}" y2="110" stroke="#cfc7b8" stroke-width="1" stroke-dasharray="2,2"/>
  <line x1="40" y1="170" x2="${width - 40}" y2="170" stroke="#cfc7b8" stroke-width="1" stroke-dasharray="2,2"/>
  <line x1="40" y1="230" x2="${width - 40}" y2="230" stroke="#cfc7b8" stroke-width="1" stroke-dasharray="2,2"/>
  <line x1="40" y1="260" x2="${width - 40}" y2="260" stroke="#1a1714" stroke-width="1.5"/>
  <!-- Historical Stepped Trend Line -->
  <polyline points="40,220 90,190 140,210 190,150 240,165 290,130 340,140 390,95 440,110 490,70 540,60" fill="none" stroke="#1a1714" stroke-width="2.5"/>
  <!-- Data markers -->
  <circle cx="190" cy="150" r="3" fill="#1a1714"/>
  <circle cx="290" cy="130" r="3" fill="#1a1714"/>
  <circle cx="390" cy="95" r="3" fill="#1a1714"/>
  <circle cx="490" cy="70" r="3" fill="#1a1714"/>
  <circle cx="540" cy="60" r="4" fill="#1a1714"/>
  <!-- Legend Header -->
  <text x="45" y="35" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="#1a1714">DISPATCH MARKET METRICS: ${title}</text>
  <text x="${width - 45}" y="35" font-family="'Courier New', monospace" font-size="10" fill="#4a4239" text-anchor="end">${source}</text>
  <text x="45" y="${height - 20}" font-family="'Courier New', monospace" font-size="9" fill="#666">EXCHANGE QUOTATIONS &bull; RECORDED SESSIONS</text>
</svg>`;
  }

  private generateWoodcutSvg(title: string, source: string, width: number, height: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#fbf8ef"/>
  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="#1a1714" stroke-width="2"/>
  <line x1="8" y1="16" x2="${width - 8}" y2="16" stroke="#1a1714" stroke-width="0.5"/>
  <line x1="8" y1="${height - 16}" x2="${width - 8}" y2="${height - 16}" stroke="#1a1714" stroke-width="0.5"/>
  <!-- Decorative vignette corners -->
  <path d="M 20,20 L 50,20 L 20,50 Z" fill="#1a1714"/>
  <path d="M ${width - 20},20 L ${width - 50},20 L ${width - 20},50 Z" fill="#1a1714"/>
  <path d="M 20,${height - 20} L 50,${height - 20} L 20,${height - 50} Z" fill="#1a1714"/>
  <path d="M ${width - 20},${height - 20} L ${width - 50},${height - 20} L ${width - 20},${height - 50} Z" fill="#1a1714"/>
  <!-- Central Emblem -->
  <text x="${width / 2}" y="${height / 2 - 10}" font-family="Georgia, serif" font-size="18" font-weight="bold" letter-spacing="3" fill="#1a1714" text-anchor="middle">THE FYNENCE DISPATCH</text>
  <text x="${width / 2}" y="${height / 2 + 15}" font-family="'Courier New', monospace" font-size="11" letter-spacing="1" fill="#4a4239" text-anchor="middle">&bull; EDITORIAL SECTION RECORD &bull;</text>
  <line x1="120" y1="${height / 2 + 30}" x2="${width - 120}" y2="${height / 2 + 30}" stroke="#1a1714" stroke-width="1"/>
</svg>`;
  }
}
