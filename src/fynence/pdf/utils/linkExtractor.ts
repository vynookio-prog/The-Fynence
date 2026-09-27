import type {
  NewspaperBlock,
  NewspaperPage,
  NewspaperStory,
} from '../../renderer/types/document';

export interface PdfLinkAnnotation {
  url: string;
  rect: [number, number, number, number]; // [x1, y1, x2, y2] in PDF coordinates (bottom-left origin)
}

function isValidHttpUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

/**
 * Extracts story clickable links from a NewspaperPage and computes
 * their PDF coordinate bounding boxes based on the page's SVG layout geometry.
 */
export function extractPageLinkAnnotations(
  page: NewspaperPage,
  svgWidth = 1200,
  svgHeight = 1600,
  pdfWidth = 1200,
  pdfHeight = 1600
): PdfLinkAnnotation[] {
  const annotations: PdfLinkAnnotation[] = [];
  const scaleX = pdfWidth / svgWidth;
  const scaleY = pdfHeight / svgHeight;

  let currentY = 48;

  // 1. Running Header
  if (page.header) {
    currentY += 28;
  }

  // 2. Masthead
  const masthead = page.blocks.find(b => b.type === 'masthead');
  if (masthead) {
    currentY += 202;
  }

  // 3. Section Header
  const sectionHeader = page.blocks.find(b => b.type === 'section_header');
  if (sectionHeader) {
    currentY += 46;
  }

  // 4. Market Strip
  const marketStrip = page.blocks.find(b => b.type === 'market_strip');
  if (marketStrip) {
    currentY += 42;
  }

  // Helper to convert SVG (top-left) rect to PDF (bottom-left) rect
  const toPdfRect = (x: number, y: number, w: number, h: number): [number, number, number, number] => {
    const x1 = Math.round(x * scaleX);
    const y1 = Math.round((svgHeight - (y + h)) * scaleY);
    const x2 = Math.round((x + w) * scaleX);
    const y2 = Math.round((svgHeight - y) * scaleY);
    return [x1, y1, x2, y2];
  };

  // 5. Blocks
  for (const block of page.blocks) {
    if (block.type === 'lead_story') {
      const s = block.story;
      if (isValidHttpUrl(s.originalUrl)) {
        const leadHeight = s.image ? 300 : 220;
        const rect = toPdfRect(44, currentY, svgWidth - 88, leadHeight);
        annotations.push({
          url: s.originalUrl,
          rect,
        });
      }
      currentY += (s.image ? 310 : 230);
    } else if (block.type === 'story_grid') {
      const cols = block.columns || 2;
      const gap = 28;
      const colWidth = (svgWidth - 88 - (cols - 1) * gap) / cols;
      const stories = block.stories;
      for (let i = 0; i < stories.length; i += cols) {
        const rowStories = stories.slice(i, i + cols);
        rowStories.forEach((st, sIdx) => {
          if (isValidHttpUrl(st.originalUrl)) {
            const colX = 44 + sIdx * (colWidth + gap);
            const rect = toPdfRect(colX, currentY, colWidth, 190);
            annotations.push({
              url: st.originalUrl,
              rect,
            });
          }
        });
        currentY += 210;
      }
    } else if (block.type === 'story') {
      const s = block.story;
      if (isValidHttpUrl(s.originalUrl)) {
        const rect = toPdfRect(44, currentY, svgWidth - 88, 160);
        annotations.push({
          url: s.originalUrl,
          rect,
        });
      }
      currentY += 176;
    } else if (block.type === 'weather_block') {
      currentY += 70;
    } else if (block.type === 'economic_calendar') {
      currentY += block.events.length * 24 + 38;
    }
  }

  return annotations;
}
