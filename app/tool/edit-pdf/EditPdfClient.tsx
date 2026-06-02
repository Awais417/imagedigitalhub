'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

interface Annotation {
  id: string;
  page: number;
  x: number;       // PDF coord — pts from bottom-left
  y: number;
  text: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
  fx: number;      // fractional click position 0-1 on displayed image (for marker)
  fy: number;
}

interface PdfInfo {
  pageCount: number;
  width: number;   // page width in pts
  height: number;  // page height in pts
}

function getToken(): string | null {
  try { return (JSON.parse(localStorage.getItem('auth') || '{}') as { token?: string }).token ?? null; }
  catch { return null; }
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function EditPdfClient() {
  const [file, setFile]               = useState<File | null>(null);
  const [pdfInfo, setPdfInfo]         = useState<PdfInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCache, setPageCache]     = useState<Record<number, string>>({});
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [popup, setPopup]             = useState<{ fx: number; fy: number; x: number; y: number } | null>(null);
  const [popupText, setPopupText]     = useState('');
  const [fontSize, setFontSize]       = useState(16);
  const [fontColor, setFontColor]     = useState('#000000');
  const [opacity, setOpacity]         = useState(100);
  const [error, setError]             = useState('');
  const [downloading, setDownloading] = useState(false);
  const [dragging, setDragging]       = useState(false);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imgRef        = useRef<HTMLImageElement>(null);
  const popupInputRef = useRef<HTMLInputElement>(null);

  // ── Load a single page preview ─────────────────────────────────────────────
  const loadPage = useCallback(async (f: File, page: number) => {
    if (pageCache[page]) return;
    setLoadingPage(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('page', String(page));
      fd.append('scale', '1.5');
      const res = await fetch(`${API_BASE}/pdf/preview`, {
        method: 'POST', headers: authHeaders(), body: fd,
      });
      if (!res.ok) throw new Error('Preview failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setPageCache(prev => ({ ...prev, [page]: url }));
    } catch {
      // silently ignore — show placeholder
    } finally {
      setLoadingPage(false);
    }
  }, [pageCache]);

  useEffect(() => {
    if (file && pdfInfo) loadPage(file, currentPage);
  }, [file, pdfInfo, currentPage, loadPage]);

  // Focus popup input when shown
  useEffect(() => {
    if (popup) setTimeout(() => popupInputRef.current?.focus(), 30);
  }, [popup]);

  // ── Upload & read info ─────────────────────────────────────────────────────
  const handleFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.'); return;
    }
    setFile(f);
    setAnnotations([]);
    setPageCache({});
    setCurrentPage(1);
    setError('');
    setLoadingInfo(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch(`${API_BASE}/pdf/info`, {
        method: 'POST', headers: authHeaders(), body: fd,
      });
      if (!res.ok) throw new Error('Could not read PDF.');
      const info = await res.json() as PdfInfo;
      setPdfInfo(info);
    } catch (e) {
      setError((e as Error).message);
      setFile(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  // ── Click on PDF image → show popup ───────────────────────────────────────
  const handleImgClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!pdfInfo || !imgRef.current) return;
    const rect  = imgRef.current.getBoundingClientRect();
    const fx    = (e.clientX - rect.left)  / rect.width;
    const fy    = (e.clientY - rect.top)   / rect.height;
    const pdfX  = Math.round(fx * pdfInfo.width);
    const pdfY  = Math.round((1 - fy) * pdfInfo.height);   // flip Y axis (pdf-lib bottom-left)
    setPopup({ fx, fy, x: pdfX, y: pdfY });
    setPopupText('');
  };

  const confirmAnnotation = () => {
    if (!popup || !popupText.trim()) { setPopup(null); return; }
    setAnnotations(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      page: currentPage,
      x: popup.x, y: popup.y,
      text: popupText.trim(),
      fontSize, fontColor, opacity,
      fx: popup.fx, fy: popup.fy,
    }]);
    setPopup(null);
    setPopupText('');
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!file || annotations.length === 0) return;
    setDownloading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('text_boxes', JSON.stringify(annotations.map(a => ({
        text: a.text, page: a.page, x: a.x, y: a.y,
        font_size: a.fontSize, font_color: a.fontColor,
        opacity: a.opacity, rotation: 0,
      }))));
      const res = await fetch(`${API_BASE}/pdf/edit-pdf`, {
        method: 'POST', headers: authHeaders(), body: fd,
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = file.name.replace(/\.[^.]+$/, '') + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  // ── Drop zone ──────────────────────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ─── Upload screen ─────────────────────────────────────────────────────────
  if (!file || !pdfInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>
          <h1 className="text-xl font-semibold text-gray-800">Edit PDF</h1>
          <p className="text-sm text-gray-400 ml-2">Click anywhere on the page to add text</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-colors bg-white
              ${dragging ? 'border-blue-500 bg-blue-50' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'}`}
          >
            <div className="text-6xl">📄</div>
            <p className="text-xl font-semibold text-gray-700">
              {loadingInfo ? 'Loading PDF…' : 'Click or drag a PDF here'}
            </p>
            <p className="text-sm text-gray-400">Click on any part of the page to place your text</p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        </div>
      </div>
    );
  }

  const currentAnnotations = annotations.filter(a => a.page === currentPage);
  const currentImage       = pageCache[currentPage];

  // ─── Editor screen ─────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

      {/* ── Top toolbar ── */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-3 flex-wrap shrink-0 z-20">
        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm shrink-0">← Back</Link>
        <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">{file.name}</span>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <span className="text-xs text-gray-500">Size</span>
          <input type="number" value={fontSize} min={6} max={96}
            onChange={e => setFontSize(Number(e.target.value))}
            className="w-14 border rounded px-2 py-1 text-sm text-center" />

          <span className="text-xs text-gray-500">Color</span>
          <input type="color" value={fontColor}
            onChange={e => setFontColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border p-0.5" />

          <span className="text-xs text-gray-500">Opacity %</span>
          <input type="number" value={opacity} min={10} max={100}
            onChange={e => setOpacity(Number(e.target.value))}
            className="w-16 border rounded px-2 py-1 text-sm text-center" />

          <button
            onClick={handleDownload}
            disabled={downloading || annotations.length === 0}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? 'Saving…' : `⬇ Download (${annotations.length} edit${annotations.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-2 text-sm shrink-0">{error}</div>}

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: page strip ── */}
        <div className="w-20 bg-white border-r flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0">
          {Array.from({ length: pdfInfo.pageCount }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setCurrentPage(p)}
              className={`w-14 py-2 rounded border-2 text-xs font-medium transition-colors
                ${p === currentPage
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}
            >
              {p}
              {annotations.some(a => a.page === p) && (
                <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>

        {/* ── Center: PDF canvas ── */}
        <div className="flex-1 overflow-auto flex justify-center items-start p-6">
          <div className="relative shadow-xl" style={{ userSelect: 'none' }}>

            {/* Page image */}
            {!currentImage || loadingPage ? (
              <div className="w-[595px] h-[842px] bg-white border flex items-center justify-center rounded">
                <span className="text-gray-400 text-sm animate-pulse">Loading page {currentPage}…</span>
              </div>
            ) : (
              <img
                ref={imgRef}
                src={currentImage}
                alt={`Page ${currentPage}`}
                onClick={handleImgClick}
                draggable={false}
                className="block max-w-[780px] w-full rounded border cursor-crosshair"
              />
            )}

            {/* Annotation markers */}
            {currentImage && currentAnnotations.map(ann => (
              <div key={ann.id} className="absolute pointer-events-none"
                style={{ left: `${ann.fx * 100}%`, top: `${ann.fy * 100}%`, transform: 'translate(-2px, -10px)' }}>
                <div
                  className="text-xs rounded px-1.5 py-0.5 whitespace-nowrap max-w-[180px] truncate shadow font-medium"
                  style={{ background: ann.fontColor, color: '#fff', fontSize: `${Math.min(ann.fontSize, 13)}px`, opacity: ann.opacity / 100 }}
                >
                  {ann.text}
                </div>
              </div>
            ))}

            {/* Floating text-input popup */}
            {popup && (
              <div className="absolute z-30"
                style={{
                  left: `${Math.min(popup.fx * 100, 65)}%`,
                  top:  `${Math.min(popup.fy * 100, 85)}%`,
                  transform: 'translate(6px, -50%)',
                }}>
                <div className="bg-white border-2 border-blue-400 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-56">
                  <p className="text-xs text-gray-400">Type text to insert at this position</p>
                  <input
                    ref={popupInputRef}
                    type="text"
                    value={popupText}
                    onChange={e => setPopupText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmAnnotation();
                      if (e.key === 'Escape') setPopup(null);
                    }}
                    placeholder="Your text…"
                    className="border rounded px-2 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <div className="flex gap-2">
                    <button onClick={confirmAnnotation}
                      className="flex-1 bg-blue-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-blue-700">
                      Add
                    </button>
                    <button onClick={() => setPopup(null)}
                      className="flex-1 border text-xs rounded-lg px-3 py-1.5 hover:bg-gray-50 text-gray-600">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: annotations list ── */}
        <div className="w-60 bg-white border-l flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b shrink-0">
            <h3 className="font-semibold text-sm text-gray-700">Added Text ({annotations.length})</h3>
            <p className="text-xs text-gray-400 mt-0.5">Click the PDF to add text anywhere</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {annotations.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-10 leading-relaxed">
                No text added yet.<br />
                <span className="font-medium text-gray-500">Click anywhere on the PDF</span><br />
                to insert text at that position.
              </p>
            )}
            {annotations.map(ann => (
              <div key={ann.id}
                className={`border rounded-lg p-2 text-xs cursor-pointer transition-colors
                  ${ann.page === currentPage ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setCurrentPage(ann.page)}
              >
                <div className="flex items-start gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">"{ann.text}"</p>
                    <p className="text-gray-400 mt-0.5">Pg {ann.page} · {ann.fontSize}pt</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setAnnotations(prev => prev.filter(a => a.id !== ann.id)); }}
                    className="text-red-400 hover:text-red-600 text-base leading-none shrink-0 ml-1"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
