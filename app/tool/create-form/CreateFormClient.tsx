'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

/* ── types ──────────────────────────────────────────────────────────────── */
type FieldType = 'text' | 'checkbox' | 'dropdown' | 'radio';

interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  page: number;
  x: number; y: number;          // PDF pts, y from top
  width: number; height: number; // PDF pts
  options: string[];
  fx: number; fy: number; fw: number; fh: number; // fractional for overlay
}

interface PdfInfo { pageCount: number; width: number; height: number; }

/* ── helpers ─────────────────────────────────────────────────────────────── */
function uid() { return Math.random().toString(36).slice(2, 10); }

function getToken() {
  try { return (JSON.parse(localStorage.getItem('auth') || '{}') as { token?: string }).token ?? null; }
  catch { return null; }
}
const authHdrs = (): HeadersInit => {
  const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {};
};

let _pdfjs: any = null;
async function pdfjs() {
  if (_pdfjs) return _pdfjs;
  _pdfjs = await import('pdfjs-dist');
  _pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return _pdfjs;
}

const FIELD_COLORS: Record<FieldType, string> = {
  text:     'rgba(59,130,246,0.25)',
  checkbox: 'rgba(16,185,129,0.25)',
  dropdown: 'rgba(139,92,246,0.25)',
  radio:    'rgba(245,158,11,0.25)',
};
const FIELD_BORDERS: Record<FieldType, string> = {
  text:     '#3b82f6',
  checkbox: '#10b981',
  dropdown: '#8b5cf6',
  radio:    '#f59e0b',
};
const FIELD_LABELS: Record<FieldType, string> = {
  text: 'Text Field', checkbox: 'Checkbox', dropdown: 'Dropdown', radio: 'Radio Button',
};
const DEFAULT_SIZES: Record<FieldType, { w: number; h: number }> = {
  text:     { w: 200, h: 24 },
  checkbox: { w: 20,  h: 20 },
  dropdown: { w: 200, h: 24 },
  radio:    { w: 20,  h: 20 },
};

/* ── pending field (being configured before adding) ─────────────────────── */
interface PendingField {
  type: FieldType;
  fx: number; fy: number;
  x: number;  y: number;
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function CreateFormClient() {
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [pdfInfo, setPdfInfo]     = useState<PdfInfo | null>(null);
  const [page, setPage]           = useState(1);
  const [imgUrl, setImgUrl]       = useState('');
  const [loadingImg, setLoadingImg] = useState(false);

  const [fields, setFields]       = useState<FormField[]>([]);
  const [activeType, setActiveType] = useState<FieldType>('text');
  const [placing, setPlacing]     = useState(false);  // click-to-place mode

  const [pending, setPending]     = useState<PendingField | null>(null);
  const [pendingName, setPendingName]   = useState('');
  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingW, setPendingW]   = useState('');
  const [pendingH, setPendingH]   = useState('');
  const [pendingOpts, setPendingOpts]   = useState('');  // comma-separated

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');

  const imgRef  = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pageCache = useRef<Map<number, string>>(new Map());

  /* ── render PDF page ───────────────────────────────────────────────────── */
  const renderPage = useCallback(async (f: File, pg: number) => {
    if (pageCache.current.has(pg)) {
      setImgUrl(pageCache.current.get(pg)!);
      return;
    }
    setLoadingImg(true);
    try {
      const lib  = await pdfjs();
      const buf  = await f.arrayBuffer();
      const doc  = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
      const p    = await doc.getPage(pg);
      const vp   = p.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width  = vp.width;
      canvas.height = vp.height;
      await p.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
      const url = canvas.toDataURL('image/png');
      pageCache.current.set(pg, url);
      setImgUrl(url);
      if (pg === 1) {
        const vp1 = p.getViewport({ scale: 1 });
        setPdfInfo({ pageCount: doc.numPages, width: vp1.width, height: vp1.height });
      }
    } finally {
      setLoadingImg(false);
    }
  }, []);

  useEffect(() => {
    if (file) { pageCache.current.clear(); renderPage(file, page); }
  }, [file, page, renderPage]);

  /* ── drop/upload ────────────────────────────────────────────────────────── */
  const loadFile = (f: File) => {
    if (!f.type.includes('pdf')) return;
    setFile(f); setFields([]); setPage(1);
    setDownloadUrl(''); setError(''); setSelectedId(null);
    pageCache.current.clear();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) loadFile(f);
  };

  /* ── click on PDF image ─────────────────────────────────────────────────── */
  const onImgClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!placing || !imgRef.current || !pdfInfo) return;
    const r  = imgRef.current.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top)  / r.height;
    const x  = Math.round(fx * pdfInfo.width);
    const y  = Math.round(fy * pdfInfo.height);

    const def = DEFAULT_SIZES[activeType];
    setPending({ type: activeType, fx, fy, x, y });
    setPendingName(`field_${uid()}`);
    setPendingLabel('');
    setPendingW(String(def.w));
    setPendingH(String(def.h));
    setPendingOpts(activeType === 'dropdown' || activeType === 'radio' ? 'Option 1, Option 2' : '');
    setPlacing(false);
  };

  /* ── confirm pending field ──────────────────────────────────────────────── */
  const confirmPending = () => {
    if (!pending || !pdfInfo) return;
    const w  = parseInt(pendingW) || DEFAULT_SIZES[pending.type].w;
    const h  = parseInt(pendingH) || DEFAULT_SIZES[pending.type].h;
    const opts = pending.type === 'dropdown' || pending.type === 'radio'
      ? pendingOpts.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const field: FormField = {
      id:      uid(),
      type:    pending.type,
      name:    pendingName.trim() || `field_${uid()}`,
      label:   pendingLabel.trim(),
      page,
      x:       pending.x,
      y:       pending.y,
      width:   w,
      height:  h,
      options: opts,
      fx:      pending.fx,
      fy:      pending.fy,
      fw:      w / pdfInfo.width,
      fh:      h / pdfInfo.height,
    };
    setFields(prev => [...prev, field]);
    setPending(null);
  };

  /* ── delete field ───────────────────────────────────────────────────────── */
  const deleteField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  /* ── submit ─────────────────────────────────────────────────────────────── */
  const submit = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const defs = fields.map(f => ({
        type:    f.type,
        name:    f.name,
        label:   f.label || undefined,
        page:    f.page,
        x:       f.x,
        y:       f.y,
        width:   f.width,
        height:  f.height,
        options: f.options.length ? f.options : undefined,
      }));
      const form = new FormData();
      form.append('file', file);
      form.append('fields', JSON.stringify(defs));
      const res = await fetch(`${API_BASE}/pdf/create-form`, {
        method: 'POST',
        headers: authHdrs(),
        body: form,
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `HTTP ${res.status}`); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName((file.name.replace(/\.pdf$/i, '') || 'document') + '_form.pdf');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* ── reset ──────────────────────────────────────────────────────────────── */
  const reset = () => {
    setFile(null); setFields([]); setPage(1); setImgUrl('');
    setDownloadUrl(''); setDownloadName(''); setError('');
    setPending(null); setSelectedId(null); setPlacing(false);
    pageCache.current.clear();
  };

  /* ── get overlay style for a field ─────────────────────────────────────── */
  const overlayStyle = (f: FormField): React.CSSProperties => ({
    position: 'absolute',
    left:     `${f.fx * 100}%`,
    top:      `${f.fy * 100}%`,
    width:    `${f.fw * 100}%`,
    height:   `${f.fh * 100}%`,
    background: FIELD_COLORS[f.type],
    border:   `1.5px solid ${FIELD_BORDERS[f.type]}`,
    borderRadius: 2,
    boxSizing: 'border-box',
    cursor:   'pointer',
    outline:  selectedId === f.id ? `2px solid ${FIELD_BORDERS[f.type]}` : 'none',
    outlineOffset: 1,
  });

  /* ══ render ════════════════════════════════════════════════════════════════ */
  if (downloadUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Form PDF Ready!</h2>
          <p className="text-gray-500 mb-6 text-sm">{fields.length} field{fields.length !== 1 ? 's' : ''} added to your PDF.</p>
          <a
            href={downloadUrl}
            download={downloadName}
            className="block w-full bg-purple-600 text-white font-semibold py-3 rounded-xl mb-3 hover:bg-purple-700 transition"
          >
            Download {downloadName}
          </a>
          <button
            onClick={reset}
            className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition"
          >
            Create Another
          </button>
          <Link href="/" className="block mt-4 text-sm text-gray-400 hover:text-gray-600">← Back to tools</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <span className="text-gray-300">|</span>
        <span className="text-xl">📋</span>
        <h1 className="text-lg font-bold text-gray-800">Create Form</h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Add interactive fields to PDF</span>
      </div>

      {!file ? (
        /* ── Upload zone ── */
        <div className="flex items-center justify-center p-10">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition
              ${dragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50'}`}
          >
            <div className="text-5xl mb-4">☁️</div>
            <p className="text-lg font-semibold text-gray-700 mb-1">Select PDF to add form fields to</p>
            <p className="text-sm text-gray-400">Drag & drop here, or click to browse</p>
            <p className="text-xs text-gray-300 mt-3">PDF only · Max 100 MB</p>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          </div>
        </div>
      ) : (
        /* ── Main editor ── */
        <div className="flex h-[calc(100vh-65px)] overflow-hidden">

          {/* ── Left: PDF canvas ── */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-100">
            {/* page nav */}
            {pdfInfo && pdfInfo.pageCount > 1 && (
              <div className="flex items-center justify-center gap-3 py-2 bg-white border-b border-gray-200">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-40">‹ Prev</button>
                <span className="text-sm text-gray-600">Page {page} / {pdfInfo.pageCount}</span>
                <button disabled={page >= pdfInfo.pageCount} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-40">Next ›</button>
              </div>
            )}

            {/* placing hint */}
            {placing && (
              <div className="text-center py-2 bg-purple-50 border-b border-purple-200 text-purple-700 text-sm font-medium">
                Click anywhere on the PDF to place a <strong>{FIELD_LABELS[activeType]}</strong>
                <button onClick={() => setPlacing(false)} className="ml-3 text-xs underline text-purple-500">Cancel</button>
              </div>
            )}

            {/* PDF + overlays */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-6">
              <div className="relative inline-block shadow-xl">
                {loadingImg && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {imgUrl && (
                  <img
                    ref={imgRef}
                    src={imgUrl}
                    alt={`Page ${page}`}
                    className={`block max-w-full select-none ${placing ? 'cursor-crosshair' : 'cursor-default'}`}
                    onClick={onImgClick}
                    draggable={false}
                  />
                )}
                {/* Field overlays */}
                {imgUrl && fields.filter(f => f.page === page).map(f => (
                  <div
                    key={f.id}
                    style={overlayStyle(f)}
                    onClick={() => { if (!placing) setSelectedId(f.id === selectedId ? null : f.id); }}
                    title={`${FIELD_LABELS[f.type]}: ${f.name}`}
                  >
                    <span style={{
                      fontSize: 9, color: FIELD_BORDERS[f.type], fontWeight: 700,
                      padding: '1px 2px', whiteSpace: 'nowrap', overflow: 'hidden',
                      display: 'block', lineHeight: 1.2,
                    }}>
                      {f.type === 'checkbox' || f.type === 'radio' ? '' : f.name}
                    </span>
                  </div>
                ))}

                {/* Pending placement ghost */}
                {pending && pdfInfo && (
                  <div style={{
                    position: 'absolute',
                    left:   `${pending.fx * 100}%`,
                    top:    `${pending.fy * 100}%`,
                    width:  `${(parseInt(pendingW) || DEFAULT_SIZES[pending.type].w) / pdfInfo.width * 100}%`,
                    height: `${(parseInt(pendingH) || DEFAULT_SIZES[pending.type].h) / pdfInfo.height * 100}%`,
                    background: FIELD_COLORS[pending.type],
                    border: `2px dashed ${FIELD_BORDERS[pending.type]}`,
                    borderRadius: 2,
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            </div>
          </div>

          {/* ── Right: sidebar ── */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">

            {/* Field type selector */}
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Field Type</p>
              <div className="grid grid-cols-2 gap-2">
                {(['text', 'checkbox', 'dropdown', 'radio'] as FieldType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition
                      ${activeType === t
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {t === 'text' ? '📝 Text' : t === 'checkbox' ? '☑ Checkbox' : t === 'dropdown' ? '⬇ Dropdown' : '🔘 Radio'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPlacing(true)}
                className="mt-3 w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition text-sm"
              >
                + Click to Place {FIELD_LABELS[activeType]}
              </button>
            </div>

            {/* Pending field config popup */}
            {pending && (
              <div className="p-4 border-b border-purple-200 bg-purple-50">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3">
                  Configure {FIELD_LABELS[pending.type]}
                </p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Field Name (unique ID) *</label>
                    <input value={pendingName} onChange={e => setPendingName(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-0.5"
                      placeholder="e.g. full_name" autoFocus />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Label (shown to user)</label>
                    <input value={pendingLabel} onChange={e => setPendingLabel(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-0.5"
                      placeholder="e.g. Full Name" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Width (pts)</label>
                      <input value={pendingW} onChange={e => setPendingW(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-0.5"
                        type="number" min={10} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Height (pts)</label>
                      <input value={pendingH} onChange={e => setPendingH(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-0.5"
                        type="number" min={10} />
                    </div>
                  </div>
                  {(pending.type === 'dropdown' || pending.type === 'radio') && (
                    <div>
                      <label className="text-xs text-gray-500">Options (comma-separated)</label>
                      <input value={pendingOpts} onChange={e => setPendingOpts(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-0.5"
                        placeholder="Yes, No, Maybe" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={confirmPending}
                    className="flex-1 bg-purple-600 text-white font-semibold py-1.5 rounded text-sm hover:bg-purple-700">
                    Add Field
                  </button>
                  <button onClick={() => setPending(null)}
                    className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Fields list */}
            <div className="flex-1 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Fields ({fields.length})
              </p>
              {fields.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No fields yet.<br/>Select a type and click "Click to Place".
                </p>
              ) : (
                <div className="space-y-2">
                  {fields.map(f => (
                    <div
                      key={f.id}
                      onClick={() => { setPage(f.page); setSelectedId(f.id); }}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm transition
                        ${selectedId === f.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span style={{ color: FIELD_BORDERS[f.type], fontSize: 14 }}>
                        {f.type === 'text' ? '📝' : f.type === 'checkbox' ? '☑' : f.type === 'dropdown' ? '⬇' : '🔘'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-700 truncate">{f.name}</div>
                        <div className="text-xs text-gray-400">
                          {FIELD_LABELS[f.type]} · pg {f.page}
                          {f.options.length > 0 && ` · ${f.options.length} opts`}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteField(f.id); }}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none"
                        title="Delete"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={submit}
                disabled={loading || fields.length === 0}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                ) : (
                  `Create Form PDF (${fields.length} field${fields.length !== 1 ? 's' : ''})`
                )}
              </button>
              <button onClick={reset} className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-1">
                Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
