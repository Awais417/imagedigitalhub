'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

/* ── types ─────────────────────────────────────────────────────────────────── */
interface TextAnn {
  id: string; type: 'text'; page: number;
  fx: number; fy: number;
  x: number;  y: number;
  text: string; fontSize: number; fontColor: string; opacity: number;
  underline: boolean;
}
interface EraseAnn {
  id: string; type: 'erase'; page: number;
  fx: number; fy: number; fw: number; fh: number;
  x: number;  y: number;  width: number; height: number;
}
interface HighlightAnn {
  id: string; type: 'highlight'; page: number;
  fx: number; fy: number; fw: number; fh: number;
  x: number;  y: number;  width: number; height: number;
  color: string; opacity: number;
}
type Annotation = TextAnn | EraseAnn | HighlightAnn;
type Mode = 'select' | 'erase' | 'highlight';
interface PdfInfo { pageCount: number; width: number; height: number; }

/* ── auth ──────────────────────────────────────────────────────────────────── */
function getToken() {
  try { return (JSON.parse(localStorage.getItem('auth') || '{}') as { token?: string }).token ?? null; }
  catch { return null; }
}
const authHdrs = (): HeadersInit => {
  const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {};
};

/* ── pdfjs ────────────────────────────────────────────────────────────────── */
let _pdfjs: any = null;
async function pdfjs() {
  if (_pdfjs) return _pdfjs;
  _pdfjs = await import('pdfjs-dist');
  _pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return _pdfjs;
}

const uid = () => `${Date.now()}-${Math.random()}`;

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function EditPdfClient() {

  /* core */
  const [file, setFile]         = useState<File | null>(null);
  const [pdfInfo, setPdfInfo]   = useState<PdfInfo | null>(null);
  const [page, setPage]         = useState(1);
  const [cache, setCache]       = useState<Record<number, string>>({});
  const [busy, setBusy]         = useState(false);
  const [downloading, setDl]    = useState(false);
  const [error, setError]       = useState('');
  const [dropDrag, setDropDrag] = useState(false);
  const pdfDocRef               = useRef<any>(null);

  /* annotations */
  const [anns, setAnns] = useState<Annotation[]>([]);

  /* mode & defaults */
  const [mode, setMode]               = useState<Mode>('select');
  const [fontSize, setFontSize]       = useState(14);
  const [fontColor, setFontColor]     = useState('#000000');
  const [highlightColor, setHlColor]  = useState('#ffff00');
  const [opacity, setOpacity]         = useState(100);

  /* inline editing — no onBlur; only Enter or Done button commits */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText]   = useState('');
  const editInputRef              = useRef<HTMLInputElement>(null);

  /* drag — also used to distinguish click vs drag */
  const [dragId, setDragId]   = useState<string | null>(null);
  const dragOffset             = useRef({ dx: 0, dy: 0 });
  const mouseDownPos           = useRef<{ x: number; y: number } | null>(null);

  /* draw (erase + highlight) */
  const [drawStart, setDrawStart] = useState<{ fx: number; fy: number } | null>(null);
  const [drawDrag, setDrawDrag]   = useState<{ fx: number; fy: number } | null>(null);

  /* DOM refs */
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imgRef        = useRef<HTMLImageElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  /* ── render page ─────────────────────────────────────────────────────── */
  const renderPage = useCallback(async (n: number) => {
    if (!pdfDocRef.current || cache[n]) return;
    setBusy(true);
    try {
      const pg = await pdfDocRef.current.getPage(n);
      const vp = pg.getViewport({ scale: 1.5 });
      const cv = document.createElement('canvas');
      const cx = cv.getContext('2d')!;
      cv.width = vp.width; cv.height = vp.height;
      cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await pg.render({ canvasContext: cx, viewport: vp }).promise;
      setCache(prev => ({ ...prev, [n]: cv.toDataURL('image/png') }));
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  }, [cache]);

  useEffect(() => { if (pdfDocRef.current) renderPage(page); }, [page, renderPage]);
  useEffect(() => { if (editingId) setTimeout(() => editInputRef.current?.focus(), 30); }, [editingId]);

  /* ── load file ────────────────────────────────────────────────────────── */
  const handleFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Upload a PDF file.'); return; }
    setFile(f); setAnns([]); setCache({}); setPage(1); setError('');
    pdfDocRef.current = null; setEditingId(null);
    setBusy(true);
    try {
      const lib = await pdfjs();
      const buf = await f.arrayBuffer();
      const doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
      pdfDocRef.current = doc;
      const pg1 = await doc.getPage(1);
      const vp1 = pg1.getViewport({ scale: 1 });
      setPdfInfo({ pageCount: doc.numPages, width: vp1.width, height: vp1.height });
      const vp  = pg1.getViewport({ scale: 1.5 });
      const cv  = document.createElement('canvas');
      const cx  = cv.getContext('2d')!;
      cv.width = vp.width; cv.height = vp.height;
      cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await pg1.render({ canvasContext: cx, viewport: vp }).promise;
      setCache({ 1: cv.toDataURL('image/png') });
    } catch (e) { setError((e as Error).message); setFile(null); }
    finally { setBusy(false); }
  };

  /* ── Add Text ─────────────────────────────────────────────────────────── */
  const handleAddText = () => {
    if (!pdfInfo) return;
    if (editingId) commitEdit();
    const id = uid();
    const fx = 0.15, fy = 0.1;
    const newAnn: TextAnn = {
      id, type: 'text', page,
      fx, fy,
      x: Math.round(fx * pdfInfo.width),
      y: Math.round((1 - fy) * pdfInfo.height),
      text: '', fontSize, fontColor, opacity,
      underline: false,
    };
    setAnns(prev => [...prev, newAnn]);
    setEditingId(id);
    setEditText('');
    setMode('select');
  };

  /* ── commit / cancel edit ─────────────────────────────────────────────── */
  const commitEdit = useCallback(() => {
    setEditingId(id => {
      if (!id) return null;
      setEditText(txt => {
        setAnns(prev => {
          if (!txt.trim()) return prev.filter(a => a.id !== id);
          return prev.map(a => a.id === id ? { ...a, text: txt } : a);
        });
        return '';
      });
      return null;
    });
  }, []);

  const openEdit = (ann: TextAnn) => {
    if (editingId && editingId !== ann.id) {
      // commit previous
      setAnns(prev => {
        const cur = prev.find(a => a.id === editingId) as TextAnn | undefined;
        if (!cur) return prev;
        if (!editText.trim()) return prev.filter(a => a.id !== editingId);
        return prev.map(a => a.id === editingId ? { ...a, text: editText } : a);
      });
    }
    setEditingId(ann.id);
    setEditText(ann.text);
  };

  /* ── drag (annotation move) ──────────────────────────────────────────── */
  const startDrag = (e: React.MouseEvent, ann: TextAnn) => {
    e.stopPropagation();
    e.preventDefault();
    if (!imgRef.current) return;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    const r   = imgRef.current.getBoundingClientRect();
    const cfx = (e.clientX - r.left) / r.width;
    const cfy = (e.clientY - r.top)  / r.height;
    dragOffset.current = { dx: cfx - ann.fx, dy: cfy - ann.fy };
    setDragId(ann.id);
  };

  /* ── container mouse events ──────────────────────────────────────────── */
  const handleWrapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || !pdfInfo) return;
    const r  = imgRef.current.getBoundingClientRect();
    const fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const fy = Math.max(0, Math.min(1, (e.clientY - r.top)  / r.height));

    if (dragId) {
      const nfx = Math.max(0, Math.min(0.98, fx - dragOffset.current.dx));
      const nfy = Math.max(0, Math.min(0.98, fy - dragOffset.current.dy));
      setAnns(prev => prev.map(a => {
        if (a.id !== dragId || a.type !== 'text') return a;
        return { ...a, fx: nfx, fy: nfy,
          x: Math.round(nfx * pdfInfo.width),
          y: Math.round((1 - nfy) * pdfInfo.height) };
      }));
    }

    if ((mode === 'erase' || mode === 'highlight') && drawStart) setDrawDrag({ fx, fy });
  };

  const handleWrapMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    /* ── annotation drag / click ── */
    if (dragId) {
      const moved = mouseDownPos.current
        ? Math.abs(e.clientX - mouseDownPos.current.x) > 5 || Math.abs(e.clientY - mouseDownPos.current.y) > 5
        : true;

      if (!moved) {
        /* it was a click → open edit */
        const ann = anns.find(a => a.id === dragId);
        if (ann?.type === 'text') openEdit(ann as TextAnn);
      }
      setDragId(null);
      mouseDownPos.current = null;
      return;
    }

    /* ── erase / highlight draw ── */
    if ((mode === 'erase' || mode === 'highlight') && drawStart && pdfInfo) {
      const r   = imgRef.current!.getBoundingClientRect();
      const fx  = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const fy  = Math.max(0, Math.min(1, (e.clientY - r.top)  / r.height));
      const fx1 = Math.min(drawStart.fx, fx);
      const fy1 = Math.min(drawStart.fy, fy);
      const fw  = Math.abs(fx - drawStart.fx);
      const fh  = Math.abs(fy - drawStart.fy);

      if (fw >= 0.005 && fh >= 0.005) {
        if (mode === 'erase') {
          setAnns(prev => [...prev, {
            id: uid(), type: 'erase', page,
            fx: fx1, fy: fy1, fw, fh,
            x:      Math.round(fx1 * pdfInfo.width),
            y:      Math.round((1 - (fy1 + fh)) * pdfInfo.height),
            width:  Math.round(fw  * pdfInfo.width),
            height: Math.round(fh  * pdfInfo.height),
          }]);
        } else {
          setAnns(prev => [...prev, {
            id: uid(), type: 'highlight', page,
            fx: fx1, fy: fy1, fw, fh,
            x:      Math.round(fx1 * pdfInfo.width),
            y:      Math.round((1 - (fy1 + fh)) * pdfInfo.height),
            width:  Math.round(fw  * pdfInfo.width),
            height: Math.round(fh  * pdfInfo.height),
            color: highlightColor,
            opacity: 50,
          }]);
        }
      }
      setDrawStart(null); setDrawDrag(null);
    }
  };

  const handleImgMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (mode !== 'erase' && mode !== 'highlight') {
      /* click on PDF canvas outside annotations → commit any open edit */
      if (editingId) commitEdit();
      return;
    }
    e.preventDefault();
    const r   = imgRef.current!.getBoundingClientRect();
    const pos = {
      fx: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      fy: Math.max(0, Math.min(1, (e.clientY - r.top)  / r.height)),
    };
    setDrawStart(pos); setDrawDrag(pos);
  };

  /* ── download ─────────────────────────────────────────────────────────── */
  const download = async () => {
    if (!file || anns.length === 0) return;
    if (editingId) commitEdit();
    setDl(true); setError('');
    try {
      const elements = anns.map(a => {
        if (a.type === 'erase')
          return { type: 'erase', page: a.page, x: a.x, y: a.y, width: a.width, height: a.height };
        if (a.type === 'highlight')
          return { type: 'highlight', page: a.page, x: a.x, y: a.y, width: a.width, height: a.height,
                   color: a.color, opacity: a.opacity };
        const t = a as TextAnn;
        return { type: 'text', text: t.text, page: t.page, x: t.x, y: t.y,
                 font_size: t.fontSize, font_color: t.fontColor, opacity: t.opacity, rotation: 0,
                 underline: t.underline };
      });
      const fd = new FormData();
      fd.append('file', file);
      fd.append('elements', JSON.stringify(elements));
      const res = await fetch(`${API_BASE}/pdf/edit-pdf`, { method: 'POST', headers: authHdrs(), body: fd });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = file.name;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { setError((e as Error).message); }
    finally { setDl(false); }
  };

  /* ── upload screen ────────────────────────────────────────────────────── */
  if (!file || !pdfInfo) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Back</Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-bold text-gray-800">Edit PDF</h1>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          onDrop={e => { e.preventDefault(); setDropDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={e => { e.preventDefault(); setDropDrag(true); }}
          onDragLeave={() => setDropDrag(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-all bg-white
            ${dropDrag ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}
        >
          <div className="text-7xl">📄</div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700">{busy ? 'Loading PDF…' : 'Click or drag a PDF here'}</p>
            <p className="text-sm text-gray-400 mt-1">Add text · Highlight · Underline · Erase content</p>
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      </div>
    </div>
  );

  const curAnns = anns.filter(a => a.page === page);
  const img     = cache[page];
  const total   = anns.length;

  /* live draw rect */
  const drawRect = drawStart && drawDrag ? {
    left:   `${Math.min(drawStart.fx, drawDrag.fx) * 100}%`,
    top:    `${Math.min(drawStart.fy, drawDrag.fy) * 100}%`,
    width:  `${Math.abs(drawDrag.fx - drawStart.fx) * 100}%`,
    height: `${Math.abs(drawDrag.fy - drawStart.fy) * 100}%`,
  } : null;

  /* ─────────────────── editor screen ─────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

      {/* ── toolbar ── */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-2 flex-wrap shrink-0 shadow-sm">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm mr-1">← Back</Link>

        {/* Add Text */}
        <button
          onClick={handleAddText}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 active:scale-95 shadow-sm transition-all"
        >
          ✏️ Add Text
        </button>

        {/* Highlight */}
        <button
          onClick={() => setMode(m => m === 'highlight' ? 'select' : 'highlight')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            mode === 'highlight' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🖊 {mode === 'highlight' ? 'Highlighting…' : 'Highlight'}
        </button>

        {/* Highlight color picker */}
        {mode === 'highlight' && (
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
            <span className="text-[10px] text-gray-400">Color</span>
            {['#ffff00','#a8f5a8','#add8e6','#ffb6c1','#ffd700','#ff9966'].map(c => (
              <button
                key={c}
                onClick={() => setHlColor(c)}
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: c,
                  borderColor: highlightColor === c ? '#1d4ed8' : '#e5e7eb',
                  outline: highlightColor === c ? '2px solid #93c5fd' : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
            <input type="color" value={highlightColor}
              onChange={e => setHlColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border border-gray-200 p-0.5 bg-gray-50" />
          </div>
        )}

        {/* Erase */}
        <button
          onClick={() => setMode(m => m === 'erase' ? 'select' : 'erase')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            mode === 'erase' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⬜ {mode === 'erase' ? 'Erasing…' : 'Erase'}
        </button>

        {mode !== 'select' && (
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            mode === 'erase' ? 'text-red-500 bg-red-50' : 'text-yellow-700 bg-yellow-50'
          }`}>
            Drag on PDF to {mode === 'erase' ? 'erase' : 'highlight'}
          </span>
        )}

        <span className="text-xs text-gray-400 truncate max-w-32 ml-1 hidden sm:block">{file.name}</span>

        <button onClick={download} disabled={downloading || total === 0}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
          {downloading ? '⏳ Saving…' : `⬇ Download${total > 0 ? ` (${total})` : ''}`}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-sm border-b border-red-100">⚠️ {error}</div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ── page strip ── */}
        <div className="w-20 bg-white border-r flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0">
          {Array.from({ length: pdfInfo.pageCount }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-14 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                p === page ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-blue-200'
              }`}>
              {p}
              {anns.some(a => a.page === p) && (
                <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>

        {/* ── PDF canvas ── */}
        <div
          className="flex-1 overflow-auto flex justify-center items-start p-6 bg-gray-100"
          onMouseMove={handleWrapMouseMove}
          onMouseUp={handleWrapMouseUp}
          onMouseLeave={() => { setDragId(null); setDrawStart(null); setDrawDrag(null); mouseDownPos.current = null; }}
        >
          <div ref={canvasWrapRef} className="relative shadow-2xl rounded-sm select-none">

            {!img || busy ? (
              <div className="w-[595px] h-[842px] bg-white border border-gray-200 flex items-center justify-center rounded">
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-gray-400 text-sm">Rendering page {page}…</span>
                </div>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={imgRef}
                src={img}
                alt={`Page ${page}`}
                draggable={false}
                onMouseDown={handleImgMouseDown}
                className="block max-w-[780px] w-full rounded border border-gray-200"
                style={{ cursor: mode !== 'select' ? 'crosshair' : 'default', display: 'block' }}
              />
            )}

            {/* ── annotation overlays ── */}
            {img && curAnns.map(ann => {

              /* highlight overlay */
              if (ann.type === 'highlight') return (
                <div key={ann.id} className="absolute group"
                  style={{
                    left:    `${ann.fx * 100}%`,
                    top:     `${ann.fy * 100}%`,
                    width:   `${ann.fw * 100}%`,
                    height:  `${ann.fh * 100}%`,
                    background: ann.color,
                    opacity: ann.opacity / 100,
                    pointerEvents: 'auto',
                    mixBlendMode: 'multiply',
                  }}>
                  <button
                    style={{ opacity: 1 / (ann.opacity / 100) }}
                    onClick={e => { e.stopPropagation(); setAnns(p => p.filter(a => a.id !== ann.id)); }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold leading-none hidden group-hover:flex items-center justify-center shadow z-50"
                  >×</button>
                </div>
              );

              /* erase overlay */
              if (ann.type === 'erase') return (
                <div key={ann.id} className="absolute group"
                  style={{
                    left: `${ann.fx * 100}%`, top: `${ann.fy * 100}%`,
                    width: `${ann.fw * 100}%`, height: `${ann.fh * 100}%`,
                    background: 'rgba(255,255,255,0.9)',
                    border: '2px dashed #ef4444', boxSizing: 'border-box',
                    pointerEvents: 'auto',
                  }}>
                  <span className="absolute top-0.5 left-1 text-[9px] text-red-400 font-bold">ERASED</span>
                  <button
                    onClick={e => { e.stopPropagation(); setAnns(p => p.filter(a => a.id !== ann.id)); }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold leading-none hidden group-hover:flex items-center justify-center shadow"
                  >×</button>
                </div>
              );

              /* text annotation */
              const t         = ann as TextAnn;
              const isEditing = editingId === t.id;
              const isDragging = dragId === t.id;

              return (
                <div
                  key={t.id}
                  data-ann="1"
                  className="absolute"
                  style={{
                    left: `${t.fx * 100}%`, top: `${t.fy * 100}%`,
                    zIndex: isEditing || isDragging ? 50 : 20,
                    pointerEvents: 'auto',
                    userSelect: 'none',
                  }}
                >
                  {isEditing ? (
                    /* ══ Editing box ══ */
                    <div
                      data-ann="1"
                      className="rounded-xl shadow-2xl overflow-hidden border-2 border-blue-500 bg-white"
                      style={{ minWidth: 240 }}
                    >
                      {/* drag handle */}
                      <div
                        className="flex items-center justify-between px-2 py-1.5 bg-blue-500 select-none"
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        onMouseDown={e => startDrag(e, t)}
                      >
                        <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="white" opacity="0.9">
                            <circle cx="3.5" cy="3.5" r="1.4"/>
                            <circle cx="8.5" cy="3.5" r="1.4"/>
                            <circle cx="3.5" cy="8.5" r="1.4"/>
                            <circle cx="8.5" cy="8.5" r="1.4"/>
                          </svg>
                          Drag to move
                        </span>
                        <button
                          className="text-white/80 hover:text-white text-base font-bold leading-none ml-2"
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => {
                            e.stopPropagation();
                            setAnns(p => p.filter(a => a.id !== t.id));
                            setEditingId(null); setEditText('');
                          }}
                        >×</button>
                      </div>

                      {/* text input */}
                      <div className="px-2 pt-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
                            if (e.key === 'Escape') {
                              const existing = anns.find(a => a.id === t.id) as TextAnn | undefined;
                              if (!existing?.text) { setAnns(p => p.filter(a => a.id !== t.id)); }
                              setEditingId(null); setEditText('');
                            }
                          }}
                          placeholder="Type here…"
                          className="outline-none w-full bg-transparent border-b border-blue-300 pb-1"
                          style={{
                            fontSize:   `${t.fontSize}px`,
                            color:       t.fontColor,
                            opacity:     t.opacity / 100,
                            fontFamily: 'Arial, sans-serif',
                            textDecoration: t.underline ? 'underline' : 'none',
                            minWidth: 180,
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>

                      {/* size controls */}
                      <div className="px-2 pt-2 flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 mr-0.5">Size</span>
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            const v = Math.max(6, t.fontSize - 2);
                            setFontSize(v);
                            setAnns(p => p.map(a => a.id === t.id ? { ...a, fontSize: v } : a));
                          }}
                          className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-700 flex items-center justify-center"
                        >−</button>
                        <span className="text-xs font-semibold text-gray-700 w-9 text-center">{t.fontSize}pt</span>
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            const v = Math.min(96, t.fontSize + 2);
                            setFontSize(v);
                            setAnns(p => p.map(a => a.id === t.id ? { ...a, fontSize: v } : a));
                          }}
                          className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-700 flex items-center justify-center"
                        >+</button>

                        {/* underline toggle */}
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => setAnns(p => p.map(a => a.id === t.id ? { ...a, underline: !t.underline } : a))}
                          className="ml-1 w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all"
                          style={{
                            background:  t.underline ? '#3b82f6' : '#f3f4f6',
                            color:       t.underline ? '#fff' : '#6b7280',
                            border:      `1.5px solid ${t.underline ? '#2563eb' : '#e5e7eb'}`,
                            textDecoration: 'underline',
                          }}
                          title="Underline"
                        >U</button>
                      </div>

                      {/* color swatches */}
                      <div className="px-2 pt-1.5 pb-1 flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-gray-400 mr-0.5">Color</span>
                        {['#000000','#374151','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'].map(c => (
                          <button key={c}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setFontColor(c);
                              setAnns(p => p.map(a => a.id === t.id ? { ...a, fontColor: c } : a));
                            }}
                            className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                            style={{
                              background:   c,
                              border:      `2px solid ${t.fontColor === c ? '#3b82f6' : '#e5e7eb'}`,
                              outline:      t.fontColor === c ? '2px solid #93c5fd' : 'none',
                              outlineOffset: '1px',
                            }}
                          />
                        ))}
                      </div>

                      {/* done button */}
                      <div className="px-2 pb-2">
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); commitEdit(); }}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >✓ Done</button>
                      </div>
                    </div>

                  ) : (
                    /* ══ Confirmed text label ══ */
                    <div
                      className="group relative whitespace-nowrap rounded px-1 py-0.5"
                      style={{
                        fontSize:       `${t.fontSize}px`,
                        color:           t.fontColor,
                        opacity:         t.opacity / 100,
                        fontFamily:     'Arial, sans-serif',
                        lineHeight:      1.2,
                        cursor:          isDragging ? 'grabbing' : 'grab',
                        border:         `1.5px dashed ${isDragging ? t.fontColor + 'aa' : 'transparent'}`,
                        transition:     'border-color 0.12s',
                        textDecoration:  t.underline ? 'underline' : 'none',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = t.fontColor + '88'; }}
                      onMouseLeave={e => { if (!isDragging) (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                      onMouseDown={e => startDrag(e, t)}
                      title="Click to edit · Drag to move"
                    >
                      {t.text}
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); setAnns(p => p.filter(a => a.id !== t.id)); }}
                        className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold leading-none hidden group-hover:flex items-center justify-center shadow z-50"
                      >×</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* live draw preview */}
            {drawRect && (
              <div className="absolute pointer-events-none"
                style={{
                  ...drawRect,
                  background: mode === 'highlight'
                    ? `${highlightColor}80`
                    : 'rgba(239,68,68,0.08)',
                  border: `2px dashed ${mode === 'highlight' ? '#ca8a04' : '#ef4444'}`,
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        </div>

        {/* ── right panel ── */}
        <div className="w-60 bg-white border-l flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-bold text-sm text-gray-700">
              Edits
              <span className="ml-1 text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{total}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === 'erase' ? '⬜ Drag on PDF to erase'
               : mode === 'highlight' ? '🖊 Drag on PDF to highlight'
               : '✏️ Click "Add Text" above'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            {total === 0 ? (
              <div className="text-center mt-10 px-4">
                <p className="text-3xl mb-2">✏️</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  No edits yet.<br />
                  <strong className="text-blue-600">Add Text</strong> — type &amp; position<br />
                  <strong className="text-yellow-600">Highlight</strong> — drag over text<br />
                  <strong className="text-red-500">Erase</strong> — drag to blank out
                </p>
              </div>
            ) : anns.map(ann => (
              <div key={ann.id}
                onClick={() => setPage(ann.page)}
                className={`border rounded-lg p-2 text-xs cursor-pointer transition-all ${
                  ann.page === page
                    ? ann.type === 'erase'     ? 'border-red-200 bg-red-50'
                    : ann.type === 'highlight' ? 'border-yellow-200 bg-yellow-50'
                    :                            'border-blue-200 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}>
                <div className="flex items-start gap-1.5">
                  <span className={`text-sm mt-0.5 shrink-0 ${
                    ann.type === 'erase' ? 'text-red-400'
                    : ann.type === 'highlight' ? 'text-yellow-500'
                    : 'text-blue-400'
                  }`}>
                    {ann.type === 'erase' ? '⬜' : ann.type === 'highlight' ? '🟨' : '✏️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    {ann.type === 'text' && (
                      <>
                        <p className="font-semibold text-gray-800 truncate">"{(ann as TextAnn).text}"</p>
                        <p className="text-gray-400 mt-0.5">
                          Pg {ann.page} · {(ann as TextAnn).fontSize}pt
                          {(ann as TextAnn).underline ? ' · U̲' : ''}
                        </p>
                      </>
                    )}
                    {ann.type === 'highlight' && (
                      <>
                        <p className="font-semibold text-yellow-700 flex items-center gap-1">
                          Highlight
                          <span className="inline-block w-3 h-3 rounded-sm border border-gray-200" style={{ background: (ann as HighlightAnn).color }} />
                        </p>
                        <p className="text-gray-400 mt-0.5">Pg {ann.page}</p>
                      </>
                    )}
                    {ann.type === 'erase' && (
                      <>
                        <p className="font-semibold text-red-700">Erase area</p>
                        <p className="text-gray-400 mt-0.5">Pg {ann.page}</p>
                      </>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setAnns(p => p.filter(a => a.id !== ann.id)); }}
                    className="text-gray-300 hover:text-red-500 text-base leading-none shrink-0">×</button>
                </div>
              </div>
            ))}
          </div>

          {total > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50">
              <button onClick={download} disabled={downloading}
                className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {downloading ? '⏳ Saving…' : '⬇ Download PDF'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
