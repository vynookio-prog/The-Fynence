import sharp from 'sharp';
import type { StructuredNewspaperData } from '../../types/newspaper';
import type {
  INewspaperRendererService,
  RenderOptions,
  RenderResult,
} from '../types';
import { generateRetroHtml } from '../templates/retroHtmlTemplate';
import { generateRetroSvg } from '../templates/retroSvgCanvas';

function wrapJpegInPdf(jpegBuffer: Buffer, width: number, height: number): Buffer {
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
  const obj4Header = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.length} >>\nstream\n`;
  const obj4Footer = '\nendstream\nendobj\n';
  const contentStream = `q ${width} 0 0 ${height} 0 0 cm /Im1 Do Q`;
  const obj5 = `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`;

  let offset = '%PDF-1.4\n'.length;
  const o1 = offset; offset += obj1.length;
  const o2 = offset; offset += obj2.length;
  const o3 = offset; offset += obj3.length;
  const o4 = offset; offset += (obj4Header.length + jpegBuffer.length + obj4Footer.length);
  const o5 = offset; offset += obj5.length;

  const xref = `xref\n0 6\n0000000000 65535 f \n${String(o1).padStart(10, '0')} 00000 n \n${String(o2).padStart(10, '0')} 00000 n \n${String(o3).padStart(10, '0')} 00000 n \n${String(o4).padStart(10, '0')} 00000 n \n${String(o5).padStart(10, '0')} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;

  return Buffer.concat([
    Buffer.from('%PDF-1.4\n' + obj1 + obj2 + obj3 + obj4Header),
    jpegBuffer,
    Buffer.from(obj4Footer + obj5 + xref + trailer),
  ]);
}

export class RetroNewspaperRenderer implements INewspaperRendererService {
  validateContract(data: StructuredNewspaperData): boolean {
    if (!data) return false;
    if (!data.metadata || data.metadata.schemaVersion !== '1.0.0') return false;
    if (!data.header || !data.header.title || !data.header.date) return false;
    if (!Array.isArray(data.sections) || data.sections.length === 0) return false;
    if (!data.footer || !data.footer.colophon) return false;
    return true;
  }

  async renderToHtml(data: StructuredNewspaperData, options: RenderOptions = {}): Promise<string> {
    if (!this.validateContract(data)) {
      throw new Error('Structured newspaper data violates contract schema.');
    }
    return generateRetroHtml(data, options);
  }

  async renderEdition(data: StructuredNewspaperData, options: RenderOptions = {}): Promise<RenderResult> {
    if (!this.validateContract(data)) {
      throw new Error('Structured newspaper data violates contract schema.');
    }

    const startTime = Date.now();
    const format = options.format || data.metadata.targetFormat || 'webp';
    const targetWidth = options.viewportWidth || 1200;
    const targetHeight = options.viewportHeight || 1600;
    const quality = options.quality || 88;

    const svgCanvas = generateRetroSvg(data, {
      ...options,
      viewportWidth: targetWidth,
      viewportHeight: targetHeight,
    });

    const svgBuffer = Buffer.from(svgCanvas, 'utf-8');
    let outputBuffer: Buffer;
    let mimeType: string;

    if (format === 'png') {
      outputBuffer = await sharp(svgBuffer).png().toBuffer();
      mimeType = 'image/png';
    } else if (format === 'pdf') {
      const jpegBuffer = await sharp(svgBuffer).jpeg({ quality: 90 }).toBuffer();
      outputBuffer = wrapJpegInPdf(jpegBuffer, targetWidth, targetHeight);
      mimeType = 'application/pdf';
    } else {
      // Default: WebP
      outputBuffer = await sharp(svgBuffer).webp({ quality }).toBuffer();
      mimeType = 'image/webp';
    }

    const renderDurationMs = Date.now() - startTime;

    return {
      editionId: data.metadata.editionId,
      format,
      mimeType,
      buffer: outputBuffer,
      fileSizeBytes: outputBuffer.length,
      dimensions: {
        width: targetWidth,
        height: targetHeight,
      },
      renderedAt: new Date().toISOString(),
      renderDurationMs,
    };
  }
}
