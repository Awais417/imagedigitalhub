'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

/* ── Types ───────────────────────────────────────────────────────────────── */
type AnnType = 'text' | 'erase';
type Mode    = 'text' | 'erase';

interface BaseAnn {
  id: string;
  type: AnnType;
  page: number;
  x: number;   // PDF pts from bottom-left
  y: number;
  fx: number;  // fractional 0-1 on image (for visual overlay)
  fy: number;
}

interface TextAnn extends BaseAnn {
  type: 'text';
  text: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
}

interface EraseAnn extends BaseAnn {
  type: 'erase';
  width: number;    // PDF pts
  height: number;
  fw: number;       // fractional width on image
  fh: number;       // fractional height on image
}

type Annotation = TextAnn | EraseAnn;

interface PdfInfo { pageCount: number; width: number; height: number; }

/* ── Auth helpers ─────────────────────────────────────────────────────────── */
function getToken(): string | null {
  try { return (JSON.parse(localStorage.getItem('auth') || '{}') as { token?: string }).token ?? null; }
  catch { return null; }
}
function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ── pdfjs setup (runs only in browser) ─────────────────────────────────── */
let _pdfjsLib: any = null;
async function getPdfjsLib() {
  if (_pdfjsLib) return _pdfjsLib;
  _pdfjsLib = await import('pdfjs-dist');
  _pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return _pdfjsLib;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function EditPdfClient() {
  /* ── state ── */
  const [file, setFile]               = useState<File | null>(null);
  const [pdfInfo, setPdfInfo]         = useState<PdfInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCache, setPageCache]     = useState<Record<number, string>>({});
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [error, setError]             = useState('');
  const [downloading, setDownloading] = useState(false);
  const [dropDrag, setDropDrag]       = useState(false);

  /* toolbar */
  const [mode, setMode]               = useState<Mode>('text');
  const [fontSize, setFontSize]       = useState(14);
  const [fontColor, setFontColor]     = useState('#000000');
  const [opacity, setOpacity]         = useState(100);

  /* text popup */
  const [popup, setPopup]             = useState<{ fx: number; fy: number; x: number; y: number } | null>(null);
  const [popupText, setPopupText]     = useState('');

  /* erase drag */
  const [eraseStart, setEraseStart]   = useState<{ fx: number; fy: number } | null>(null);
  const [eraseDrag, setEraseDrag]     = useState<{ fx: number; fy: number } | null>(null);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imgRef        = useRef<HTMLImageElement>(null);
  const popupInputRef = useRef<HTMLInputElement>(null);
  const pdfDocRef     = useRef<any>(null); // holds the pdfjs PDFDocumentProxy

  /* ── render a single PDF page client-side via pdfjs ──────────────────── */
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current) return;
    if (pageCache[pageNum]) return;  // already cached
    setLoadingPage(true);
    try {
      const pdfPage  = await pdfDocRef.current.getPage(pageNum);
      const viewport = pdfPage.getViewport({ scale: 1.5 });
      const canvas   = document.createElement('canvas');
      const ctx      = canvas.getContext('2d')!;
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;
      // White background
      ctx.fillStyle  = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');
      setPageCache(prev => ({ ...prev, [pageNum]: dataUrl }));
    } catch (e) {
      console.error('pdfjs render error:', e);
    } finally {
      setLoadingPage(false);
    }
  }, [pageCache]);

  /* render current page whenever it changes */
  useEffect(() => {
    if (pdfDocRef.current) renderPage(currentPage);
  }, [currentPage, renderPage]);

  /* focus popup */
  useEffect(() => {
    if (popup) setTimeout(() => popupInputRef.current?.focus(), 30);
  }, [popup]);

  /* ── file upload ───────────────────────────────────────────────────────── */
  const handleFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Please upload a PDF file.'); return; }
    setFile(f);
    setAnnotations([]);
    setPageCache({});
    setCurrentPage(1);
    setError('');
    pdfDocRef.current = null;
    setLoadingInfo(true);
    try {
      const pdfjsLib = await getPdfjsLib();
      const arrayBuf = await f.arrayBuffer();
      const pdfDoc   = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) }).promise;
      pdfDocRef.current = pdfDoc;

      /* get page dimensions from page 1 at scale=1 */
      const page1    = await pdfDoc.getPage(1);
      const vp1      = page1.getViewport({ scale: 1 });
      const info: PdfInfo = {
        pageCount: pdfDoc.numPages,
        width:     vp1.width,
        height:    vp1.height,
      };
      setPdfInfo(info);

      /* render page 1 immediately */
      const viewport  = page1.getViewport({ scale: 1.5 });
      const canvas    = document.createElement('canvas');
      const ctx       = canvas.getContext('2d')!;
      canvas.width    = viewport.width;
      canvas.height   = viewport.height;
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page1.render({ canvasContext: ctx, viewport }).promise;
      setPageCache({ 1: canvas.toDataURL('image/png') });
    } catch (e) {
      setError((e as Error).message);
      setFile(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  /* ── canvas pointer helpers ────────────────────────────────────────────── */
  const getRelPos = (e: React.MouseEvent) => {
    const rect = imgRef.current!.getBoundingClientRect();
    return {
      fx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      fy: Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height)),
    };
  };

  /* ── text mode: click → popup ──────────────────────────────────────────── */
  const handleImgClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!pdfInfo || mode !== 'text') return;
    const { fx, fy } = getRelPos(e);
    setPopup({
      fx, fy,
      x: Math.round(fx * pdfInfo.width),
      y: Math.round((1 - fy) * pdfInfo.height),  // pdf-lib bottom-left
    });
    setPopupText('');
  };

  const confirmText = () => {
    if (!popup || !popupText.trim()) { setPopup(null); return; }
    const ann: TextAnn = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'text', page: currentPage,
      x: popup.x, y: popup.y, fx: popup.fx, fy: popup.fy,
      text: popupText.trim(), fontSize, fontColor, opacity,
    };
    setAnnotations(prev => [...prev, ann]);
    setPopup(null);
    setPopupText('');
  };

  /* ── erase mode: drag ──────────────────────────────────────────────────── */
  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (mode !== 'erase') return;
    e.preventDefault();
    setEraseStart(getRelPos(e));
    setEraseDrag(getRelPos(e));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (mode !== 'erase' || !eraseStart) return;
    setEraseDrag(getRelPos(e));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLImageElement>) => {
    if (mode !== 'erase' || !eraseStart || !pdfInfo) return;
    const end = getRelPos(e);
    const fx1 = Math.min(eraseStart.fx, end.fx);
    const fy1 = Math.min(eraseStart.fy, end.fy);
    const fw  = Math.abs(end.fx - eraseStart.fx);
    const fh  = Math.abs(end.fy - eraseStart.fy);
    if (fw < 0.005 || fh < 0.005) { setEraseStart(null); setEraseDrag(null); return; }
    const ann: EraseAnn = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'erase', page: currentPage,
      x:      Math.round(fx1 * pdfInfo.width),
      y:      Math.round((1 - (fy1 + fh)) * pdfInfo.height),
      width:  Math.round(fw * pdfInfo.width),
      height: Math.round(fh * pdfInfo.height),
      fx: fx1, fy: fy1, fw, fh,
    };
    setAnnotations(prev => [...prev, ann]);
    setEraseStart(null);
    setEraseDrag(null);
  };

  const dragRect = eraseStart && eraseDrag ? {
    left:   `${Math.min(eraseStart.fx, eraseDrag.fx) * 100}%`,
    top:    `${Math.min(eraseStart.fy, eraseDrag.fy) * 100}%`,
    width:  `${Math.abs(eraseDrag.fx - eraseStart.fx) * 100}%`,
    height: `${Math.abs(eraseDrag.fy - eraseStart.fy) * 100}%`,
  } : null;

  /* ── download ──────────────────────────────────────────────────────────── */
  const handleDownload = async () => {
    if (!file || annotations.length === 0) return;
    setDownloading(true);
    setError('');
    try {
      const elements = annotations.map(a => {
        if (a.type === 'erase') {
          return { type: 'erase', page: a.page, x: a.x, y: a.y,
                   width: (a as EraseAnn).width, height: (a as EraseAnn).height };
        }
        const t = a as TextAnn;
        return { type: 'text', text: t.text, page: t.page, x: t.x, y: t.y,
                 font_size: t.fontSize, font_color: t.fontColor,
                 opacity: t.opacity, rotation: 0 };
      });
      const fd = new FormData();
      fd.append('file', file);
      fd.append('elements', JSON.stringify(elements));
      const res = await fetch(`${API_BASE}/pdf/edit-pdf`, {
        method: 'POST', headers: authHeaders(), body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = file.name.replace(/\.[^.]+$/, '') + '_edited.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError((e as Error).message); }
    finally { setDownloading(false); }
  };

  /* ── drop zone ─────────────────────────────────────────────────────────── */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDropDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  /* ─── Upload screen ─────────────────────────────────────────────────────── */
  if (!file || !pdfInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Back</Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-bold text-gray-800">Edit PDF</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1">
            Add text · Erase content
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDropDrag(true); }}
            onDragLeave={() => setDropDrag(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-all bg-white
              ${dropDrag ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}
          >
            <div className="text-7xl">📄</div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-700">
                {loadingInfo ? 'Loading PDF…' : 'Click or drag a PDF here'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Add text anywhere · Erase / remove existing content
              </p>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex gap-3 mt-2 flex-wrap justify-center">
              {['✏️ Add Text','⬜ Erase','⬇️ Download'].map(s => (
                <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentAnns  = annotations.filter(a => a.page === currentPage);
  const currentImage = pageCache[currentPage];
  const editCount    = annotations.length;

  /* ─── Editor screen ─────────────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

      {/* ── Top toolbar ── */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-2 flex-wrap shrink-0 z-20 shadow-sm">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm shrink-0 mr-1">← Back</Link>

        {/* Mode buttons */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'text' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
            ✏️ Add Text
          </button>
          <button onClick={() => setMode('erase')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'erase' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
            ⬜ Erase
          </button>
        </div>

        {/* Text options */}
        {mode === 'text' && (
          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-gray-500">Size</label>
            <input type="number" value={fontSize} min={6} max={96}
              onChange={e => setFontSize(Number(e.target.value))}
              className="w-14 border border-gray-200 rounded-md px-2 py-1 text-sm text-center bg-gray-50" />
            <label className="text-xs text-gray-500">Color</label>
            <input type="color" value={fontColor}
              onChange={e => setFontColor(e.target.value)}
              className="w-8 h-8 rounded-md cursor-pointer border border-gray-200 p-0.5 bg-gray-50" />
            <label className="text-xs text-gray-500">Opacity%</label>
            <input type="number" value={opacity} min={10} max={100}
              onChange={e => setOpacity(Number(e.target.value))}
              className="w-16 border border-gray-200 rounded-md px-2 py-1 text-sm text-center bg-gray-50" />
          </div>
        )}
        {mode === 'erase' && (
          <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full ml-2 font-medium">
            Click &amp; drag on the PDF to erase
          </span>
        )}

        <span className="text-xs text-gray-400 truncate max-w-[140px] ml-1 hidden sm:block">{file.name}</span>

        <button onClick={handleDownload} disabled={downloading || editCount === 0}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
          {downloading ? '⏳ Saving…' : `⬇ Download${editCount > 0 ? ` (${editCount})` : ''}`}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-sm shrink-0 border-b border-red-100">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: page strip ── */}
        <div className="w-20 bg-white border-r flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0">
          {Array.from({ length: pdfInfo.pageCount }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setCurrentPage(p)}
              className={`w-14 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                p === currentPage
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-100 text-gray-400 hover:border-blue-200'
              }`}>
              {p}
              {annotations.some(a => a.page === p) && (
                <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>

        {/* ── Center: PDF canvas ── */}
        <div className="flex-1 overflow-auto flex justify-center items-start p-6 bg-gray-100">
          <div className="relative shadow-2xl rounded-sm" style={{ userSelect: 'none' }}>

            {!currentImage || loadingPage ? (
              <div className="w-[595px] h-[842px] bg-white border border-gray-200 flex items-center justify-center rounded">
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <span className="text-gray-400 text-sm">Rendering page {currentPage}…</span>
                </div>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={imgRef}
                src={currentImage}
                alt={`Page ${currentPage}`}
                onClick={mode === 'text' ? handleImgClick : undefined}
                onMouseDown={mode === 'erase' ? handleMouseDown : undefined}
                onMouseMove={mode === 'erase' ? handleMouseMove : undefined}
                onMouseUp={mode === 'erase' ? handleMouseUp : undefined}
                draggable={false}
                className="block max-w-[780px] w-full rounded border border-gray-200"
                style={{ cursor: mode === 'erase' ? 'crosshair' : 'text' }}
              />
            )}

            {/* Annotation overlays */}
            {currentImage && currentAnns.map(ann => {
              if (ann.type === 'text') {
                const t = ann as TextAnn;
                return (
                  <div key={t.id} className="absolute pointer-events-none"
                    style={{ left: `${t.fx * 100}%`, top: `${t.fy * 100}%`, transform: 'translate(-2px, -100%)' }}>
                    <div className="text-xs rounded px-1.5 py-0.5 whitespace-nowrap max-w-[200px] truncate shadow-sm border border-white/30 font-medium"
                      style={{ background: t.fontColor, color: '#fff', fontSize: `${Math.min(t.fontSize, 14)}px`, opacity: t.opacity / 100 }}>
                      {t.text}
                    </div>
                  </div>
                );
              }
              if (ann.type === 'erase') {
                const er = ann as EraseAnn;
                return (
                  <div key={er.id} className="absolute pointer-events-none"
                    style={{
                      left: `${er.fx * 100}%`, top: `${er.fy * 100}%`,
                      width: `${er.fw * 100}%`, height: `${er.fh * 100}%`,
                      background: 'rgba(255,255,255,0.85)',
                      border: '2px dashed #ef4444', boxSizing: 'border-box',
                    }}>
                    <span className="absolute top-0.5 left-1 text-[9px] text-red-400 font-bold">ERASED</span>
                  </div>
                );
              }
              return null;
            })}

            {/* Live erase drag rect */}
            {dragRect && (
              <div className="absolute pointer-events-none"
                style={{ ...dragRect, background: 'rgba(239,68,68,0.12)', border: '2px dashed #ef4444', boxSizing: 'border-box' }}
              />
            )}

            {/* Text popup */}
            {popup && (
              <div className="absolute z-30"
                style={{ left: `${Math.min(popup.fx * 100, 62)}%`, top: `${Math.min(popup.fy * 100, 82)}%`, transform: 'translate(8px, -50%)' }}>
                <div className="bg-white border-2 border-blue-400 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-60">
                  <p className="text-xs font-semibold text-blue-600">Add text at this position</p>
                  <input ref={popupInputRef} type="text" value={popupText}
                    onChange={e => setPopupText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmText(); if (e.key === 'Escape') setPopup(null); }}
                    placeholder="Type your text…"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-blue-300" />
                  <div className="flex gap-2">
                    <button onClick={confirmText}
                      className="flex-1 bg-blue-600 text-white text-xs font-bold rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors">
                      ✓ Add
                    </button>
                    <button onClick={() => setPopup(null)}
                      className="flex-1 border border-gray-200 text-xs rounded-lg px-3 py-1.5 hover:bg-gray-50 text-gray-500">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: annotations panel ── */}
        <div className="w-64 bg-white border-l flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b shrink-0">
            <h3 className="font-bold text-sm text-gray-700">
              Edits
              <span className="ml-1.5 text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{editCount}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === 'text' ? '✏️ Click on the PDF to add text' : '⬜ Drag on the PDF to erase'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            {editCount === 0 ? (
              <div className="text-center mt-10 px-4">
                <p className="text-2xl mb-2">✏️</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  No edits yet.<br />
                  Use <b className="text-gray-500">Add Text</b> to insert or <b className="text-gray-500">Erase</b> to remove content.
                </p>
              </div>
            ) : (
              annotations.map(ann => (
                <div key={ann.id} onClick={() => setCurrentPage(ann.page)}
                  className={`border rounded-lg p-2 text-xs cursor-pointer transition-all hover:shadow-sm ${
                    ann.page === currentPage
                      ? ann.type === 'erase' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  <div className="flex items-start gap-1.5">
                    <span className={`text-base mt-0.5 shrink-0 ${ann.type === 'erase' ? 'text-red-400' : 'text-blue-400'}`}>
                      {ann.type === 'erase' ? '⬜' : '✏️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      {ann.type === 'text' && (
                        <>
                          <p className="font-semibold text-gray-800 truncate">"{(ann as TextAnn).text}"</p>
                          <p className="text-gray-400 mt-0.5">Pg {ann.page} · {(ann as TextAnn).fontSize}pt</p>
                        </>
                      )}
                      {ann.type === 'erase' && (
                        <>
                          <p className="font-semibold text-red-700">Erase area</p>
                          <p className="text-gray-400 mt-0.5">Pg {ann.page} · {(ann as EraseAnn).width}×{(ann as EraseAnn).height}pt</p>
                        </>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); setAnnotations(prev => prev.filter(a => a.id !== ann.id)); }}
                      className="text-gray-300 hover:text-red-500 text-base leading-none shrink-0 transition-colors">×</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {editCount > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50 shrink-0">
              <button onClick={handleDownload} disabled={downloading}
                className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {downloading ? '⏳ Saving…' : '⬇ Download PDF'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
