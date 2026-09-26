import React, { useState, useMemo } from 'react';
import { editionComposer } from '@/fynence/composer/editionComposer';
import { generateNewspaperHtml } from '@/fynence/renderer/templates/htmlPreviewTemplate';
import { generateNewspaperPdfAction } from '@/app/actions';
import type { EditionType, NewspaperSectionName } from '@/fynence/renderer/types/document';

const ALL_SECTIONS: { id: NewspaperSectionName; label: string }[] = [
  { id: 'daily_news', label: 'Top Story / Lead' },
  { id: 'world', label: 'World News' },
  { id: 'national', label: 'National (Indonesia)' },
  { id: 'business', label: 'Corporate & Business' },
  { id: 'finance', label: 'Finance & Banking' },
  { id: 'economy', label: 'Macro Economy' },
  { id: 'technology', label: 'Technology' },
  { id: 'markets', label: 'Cross-Asset Market Strip' },
  { id: 'weather', label: 'Magelang Weather Block' },
  { id: 'economic_calendar', label: 'Economic Calendar' },
];

export default function NewspaperPreviewPage() {
  const [editionPreset, setEditionPreset] = useState<'daily' | 'finance_economy' | 'market' | 'daily_weather' | 'custom'>('daily');
  const [selectedSections, setSelectedSections] = useState<NewspaperSectionName[]>([
    'daily_news', 'world', 'national', 'business', 'finance', 'economy', 'technology', 'markets', 'weather', 'economic_calendar'
  ]);
  const [theme, setTheme] = useState<'retro_black_cream' | 'vintage_sepia' | 'classic_monochrome'>('retro_black_cream');
  const [viewMode, setViewMode] = useState<'html' | 'json'>('html');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const type: EditionType = editionPreset === 'finance_economy' ? 'finance_economy' : editionPreset === 'market' ? 'market' : 'daily';
      const res = await generateNewspaperPdfAction({
        editionType: type,
        sections: selectedSections,
        theme,
        format: 'newspaper',
        mockMode: true,
      });
      if (res.success && res.base64Pdf) {
        const byteCharacters = atob(res.base64Pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = res.fileName || 'THE_FYNENCE_EDITION.pdf';
        link.click();
        URL.revokeObjectURL(url);
      } else {
        alert(res.error || 'Failed to compile PDF');
      }
    } catch (err: any) {
      alert(err?.message || 'PDF export failed');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Preset Change
  const handlePresetSelect = (preset: 'daily' | 'finance_economy' | 'market' | 'daily_weather' | 'custom') => {
    setEditionPreset(preset);
    if (preset === 'daily') {
      setSelectedSections(['daily_news', 'world', 'national', 'business', 'finance', 'economy', 'technology', 'markets', 'weather', 'economic_calendar']);
    } else if (preset === 'finance_economy') {
      setSelectedSections(['markets', 'finance', 'economy', 'economic_calendar']);
    } else if (preset === 'market') {
      setSelectedSections(['markets', 'finance']);
    } else if (preset === 'daily_weather') {
      setSelectedSections(['daily_news', 'weather']);
    }
  };

  const toggleSection = (sec: NewspaperSectionName) => {
    setEditionPreset('custom');
    if (selectedSections.includes(sec)) {
      setSelectedSections(selectedSections.filter(s => s !== sec));
    } else {
      setSelectedSections([...selectedSections, sec]);
    }
  };

  // Compose Document
  const document = useMemo(() => {
    const type: EditionType = editionPreset === 'finance_economy' ? 'finance_economy' : editionPreset === 'market' ? 'market' : 'daily';
    return editionComposer.composeDocument({
      editionType: type,
      sections: selectedSections,
      theme,
      mockMode: true,
      pageSize: 'auto',
    });
  }, [editionPreset, selectedSections, theme]);

  // Generate HTML
  const htmlContent = useMemo(() => {
    return generateNewspaperHtml(document, { theme });
  }, [document, theme]);

  return (
    <div className="min-h-screen bg-[#0D0F12] text-[#E1E4EA] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#23272F] bg-[#14171C] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-[#F2E8D0] flex items-center justify-center text-[#111] font-serif font-black text-xl">
            F
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-white">THE FYNENCE &bull; NEWSPAPER STUDIO</h1>
            <p className="text-xs text-[#8A909E]">Step 6: Broadsheet Renderer &amp; Document Composer</p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 bg-[#1C2027] p-1 rounded-lg border border-[#2D333E] text-xs">
          <button
            onClick={() => handlePresetSelect('daily')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${editionPreset === 'daily' ? 'bg-[#F2E8D0] text-[#111]' : 'text-[#A0A7B5] hover:text-white'}`}
          >
            Daily Edition
          </button>
          <button
            onClick={() => handlePresetSelect('finance_economy')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${editionPreset === 'finance_economy' ? 'bg-[#F2E8D0] text-[#111]' : 'text-[#A0A7B5] hover:text-white'}`}
          >
            Finance &amp; Economy
          </button>
          <button
            onClick={() => handlePresetSelect('market')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${editionPreset === 'market' ? 'bg-[#F2E8D0] text-[#111]' : 'text-[#A0A7B5] hover:text-white'}`}
          >
            Markets
          </button>
          <button
            onClick={() => handlePresetSelect('daily_weather')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${editionPreset === 'daily_weather' ? 'bg-[#F2E8D0] text-[#111]' : 'text-[#A0A7B5] hover:text-white'}`}
          >
            Daily + Weather
          </button>
        </div>

        {/* View Mode & Theme */}
        <div className="flex items-center gap-3 text-xs">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="bg-[#1C2027] border border-[#2D333E] text-[#A0A7B5] rounded-md px-3 py-1.5 focus:outline-none focus:border-[#F2E8D0]"
          >
            <option value="retro_black_cream">Theme: Retro Black &amp; Cream</option>
            <option value="vintage_sepia">Theme: Vintage Sepia</option>
            <option value="classic_monochrome">Theme: Classic Monochrome</option>
          </select>

          <div className="flex bg-[#1C2027] rounded-md border border-[#2D333E] p-0.5">
            <button
              onClick={() => setViewMode('html')}
              className={`px-3 py-1 rounded text-xs font-medium ${viewMode === 'html' ? 'bg-[#2A303C] text-white' : 'text-[#8A909E]'}`}
            >
              HTML Broadsheet
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-1 rounded text-xs font-medium ${viewMode === 'json' ? 'bg-[#2A303C] text-white' : 'text-[#8A909E]'}`}
            >
              JSON Document
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-3.5 py-1.5 rounded-md font-semibold text-xs bg-[#E5D7BA] hover:bg-[#F2E8D0] text-[#111] transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-[#111]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <span>⬇ Download PDF (Step 7)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Control Drawer / Sections Checkbox */}
      <section className="bg-[#101317] border-b border-[#23272F] px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="text-[#6C7382] font-semibold uppercase tracking-wider text-[10px]">Sections:</span>
        {ALL_SECTIONS.map((sec) => (
          <label key={sec.id} className="inline-flex items-center gap-1.5 cursor-pointer text-[#A0A7B5] hover:text-white">
            <input
              type="checkbox"
              checked={selectedSections.includes(sec.id)}
              onChange={() => toggleSection(sec.id)}
              className="rounded bg-[#1C2027] border-[#2D333E] text-[#F2E8D0] focus:ring-0"
            />
            <span>{sec.label}</span>
          </label>
        ))}
        <span className="ml-auto text-[11px] text-[#6C7382]">
          Total Pages: <strong className="text-white">{document.pages.length}</strong> &bull; Blocks: <strong className="text-white">{document.pages.reduce((acc, p) => acc + p.blocks.length, 0)}</strong>
        </span>
      </section>

      {/* Main Preview Workspace */}
      <main className="flex-1 overflow-auto p-4 flex justify-center">
        {viewMode === 'html' ? (
          <iframe
            srcDoc={htmlContent}
            title="Newspaper Preview"
            className="w-full max-w-[1240px] h-[calc(100vh-140px)] border-0 rounded-lg shadow-2xl bg-[#2B2824]"
          />
        ) : (
          <div className="w-full max-w-4xl bg-[#14171C] border border-[#23272F] rounded-lg p-6 overflow-auto">
            <h2 className="text-sm font-bold text-[#F2E8D0] mb-3">Intermediate Representation (NewspaperDocument IR)</h2>
            <pre className="text-xs font-mono text-[#A0A7B5] leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(document, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
