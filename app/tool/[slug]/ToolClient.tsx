'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { TOOLS } from '../../lib/tools';
import { useAuth } from '../../context/AuthContext';
import { apiPostBlob, saveConversion } from '../../lib/api';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth');
    return raw ? (JSON.parse(raw) as { token?: string }).token ?? null : null;
  } catch { return null; }
}
function authHdrs(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Position param names that are auto-filled by the canvas picker */
const PDF_POS_PARAMS = new Set(['x', 'y', 'width', 'height', 'page', 'pages']);

export default function ToolClient({ slug }: { slug: string }) {
  const tool = TOOLS.find((t) => t.slug === slug);
  const { user } = useAuth();
  const isPosMode = !!(tool?.pdfPositionMode);

  /* ── core state ── */
  const [files, setFiles]               = useState<File[]>([]);
  const [dragging, setDragging]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [downloadUrl, setDownloadUrl]   = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [saved, setSaved]               = useState(false);
  const [params, setParams]             = useState<Record<string, string>>(() => {
    if (!tool?.params) return {};
    return Object.fromEntries(
      (tool.params ?? []).map((p) => [p.name, String(p.defaultValue ?? '')])
    );
  });
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── PDF canvas state ── */
  const [pdfPreviewUrl, setPdfPreviewUrl]   = useState('');
  const [pdfPageCount, setPdfPageCount]     = useState(1);
  const [pdfDims, setPdfDims]               = useState<{ width: number; height: number } | null>(null);
  const [previewPage, setPreviewPage]       = useState(1);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [pointMarker, setPointMarker]       = useState<{ fx: number; fy: number } | null>(null);
  const [areaStart, setAreaStart]           = useState<{ fx: number; fy: number } | null>(null);
  const [areaDrag, setAreaDrag]             = useState<{ fx: number; fy: number } | null>(null);
  const [areaFinal, setAreaFinal]           = useState<{ fx1: number; fy1: number; fx2: number; fy2: number } | null>(null);
  const previewCacheRef = useRef<Map<number, string>>(new Map());
  const pdfImgRef       = useRef<HTMLImageElement>(null);

  /* ── load PDF preview when file is chosen ── */
  useEffect(() => {
    if (!isPosMode || files.length === 0) {
      setPdfPreviewUrl('');
      setPdfDims(null);
      setPdfPageCount(1);
      setPreviewPage(1);
      previewCacheRef.current.clear();
      setPointMarker(null);
      setAreaStart(null);
      setAreaDrag(null);
      setAreaFinal(null);
      return;
    }
    const file = files[0];
    let cancelled = false;
    (async () => {
      try {
        setLoadingPreview(true);
        /* info */
        const fd1 = new FormData();
        fd1.append('file', file);
        const infoRes = await fetch(`${API_BASE}/pdf/info`, {
          method: 'POST', headers: authHdrs(), body: fd1,
        });
        if (!cancelled && infoRes.ok) {
          const info = await infoRes.json() as { pageCount: number; width: number; height: number };
          setPdfPageCount(info.pageCount);
          setPdfDims({ width: info.width, height: info.height });
        }
        /* page 1 preview */
        const fd2 = new FormData();
        fd2.append('file', file);
        fd2.append('page', '1');
        const prevRes = await fetch(`${API_BASE}/pdf/preview`, {
          method: 'POST', headers: authHdrs(), body: fd2,
        });
        if (!cancelled && prevRes.ok) {
          const blob = await prevRes.blob();
          const url = URL.createObjectURL(blob);
          previewCacheRef.current.set(1, url);
          setPdfPreviewUrl(url);
        }
      } catch (e) {
        console.error('PDF preview error:', e);
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPosMode, files[0]]);

  const changePage = async (newPage: number) => {
    if (!files[0] || newPage < 1 || newPage > pdfPageCount) return;
    setPreviewPage(newPage);
    setPointMarker(null);
    setAreaStart(null);
    setAreaDrag(null);
    setAreaFinal(null);
    const cached = previewCacheRef.current.get(newPage);
    if (cached) { setPdfPreviewUrl(cached); return; }
    try {
      setLoadingPreview(true);
      const fd = new FormData();
      fd.append('file', files[0]);
      fd.append('page', String(newPage));
      const res = await fetch(`${API_BASE}/pdf/preview`, {
        method: 'POST', headers: authHdrs(), body: fd,
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        previewCacheRef.current.set(newPage, url);
        setPdfPreviewUrl(url);
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  /* ── point-mode click ── */
  const handlePdfClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool?.pdfPositionMode !== 'point') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    setPointMarker({ fx, fy });
    if (pdfDims) {
      setParams(prev => ({
        ...prev,
        x:    String(Math.round(fx * pdfDims.width)),
        y:    String(Math.round((1 - fy) * pdfDims.height)),
        page: String(previewPage),
      }));
    }
  };

  /* ── area-mode drag ── */
  const handleAreaMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool?.pdfPositionMode !== 'area') return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = {
      fx: (e.clientX - rect.left) / rect.width,
      fy: (e.clientY - rect.top) / rect.height,
    };
    setAreaStart(pos);
    setAreaDrag(pos);
    setAreaFinal(null);
  };

  const handleAreaMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool?.pdfPositionMode !== 'area' || !areaStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setAreaDrag({
      fx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      fy: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    });
  };

  const handleAreaMouseUp = (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool?.pdfPositionMode !== 'area' || !areaStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx2 = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const fy2 = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const final = { fx1: areaStart.fx, fy1: areaStart.fy, fx2, fy2 };
    setAreaFinal(final);
    setAreaStart(null);
    setAreaDrag(null);
    if (pdfDims) {
      const xf   = Math.min(final.fx1, final.fx2);
      const ytop = Math.min(final.fy1, final.fy2);
      const ybot = Math.max(final.fy1, final.fy2);
      setParams(prev => ({
        ...prev,
        x:      String(Math.round(xf * pdfDims.width)),
        y:      String(Math.round((1 - ybot) * pdfDims.height)),
        width:  String(Math.round(Math.abs(final.fx2 - final.fx1) * pdfDims.width)),
        height: String(Math.round((ybot - ytop) * pdfDims.height)),
        page:   String(previewPage),
        pages:  String(previewPage),
      }));
    }
  };

  /* position set? → hide positional params from manual form */
  const hasPositionSet = !!(pointMarker || areaFinal);
  const visibleParams  = isPosMode && hasPositionSet
    ? (tool?.params ?? []).filter(p => !PDF_POS_PARAMS.has(p.name))
    : (tool?.params ?? []);

  /* ── file handlers ── */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      setFiles(tool?.multipleFiles ? dropped : [dropped[0]]);
      setDownloadUrl('');
      setError('');
    },
    [tool]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(tool?.multipleFiles ? selected : [selected[0]]);
    setDownloadUrl('');
    setError('');
  };

  const handleSubmit = async () => {
    const hasFile = files.length > 0;
    const hasUrl  = tool?.fileOptional && params['url']?.trim();
    if (!tool || (!hasFile && !hasUrl)) return;

    const minRequired = tool.minFiles ?? 2;
    if (tool.multipleFiles && files.length < minRequired) {
      Swal.fire({
        icon: 'warning',
        title: 'More files needed',
        text: `Please upload at least ${minRequired} file${minRequired === 1 ? '' : 's'}.`,
        confirmButtonText: 'Got it',
        confirmButtonColor: '#2596be',
      });
      return;
    }

    setLoading(true);
    setError('');
    setDownloadUrl('');
    setSaved(false);

    try {
      const formData = new FormData();
      if (tool.multipleFiles) {
        files.forEach((f) => formData.append('files', f));
      } else if (files.length > 0) {
        formData.append('file', files[0]);
      }
      Object.entries(params).forEach(([k, v]) => {
        if (v !== '') formData.append(k, v);
      });

      const blob = await apiPostBlob(tool.apiEndpoint, formData);
      const url  = URL.createObjectURL(blob);
      setDownloadUrl(url);
      // Detect actual extension from blob MIME type so e.g. split returns .pdf or .zip correctly
      const mimeToExt: Record<string, string> = {
        'application/pdf':      'pdf',
        'application/zip':      'zip',
        'application/json':     'json',
        'application/x-pkcs12': 'p12',
        'text/plain':           'txt',
        'text/html':            'html',
        'text/csv':             'csv',
        'text/xml':             'xml',
        'image/png':            'png',
        'image/jpeg':           'jpg',
        'image/webp':           'webp',
      };
      const detectedExt = mimeToExt[blob.type.split(';')[0].trim()] ??
        (tool.outputFormat.includes('.') ? tool.outputFormat.split('.').pop()! : tool.outputFormat);
      const origBase = (files[0]?.name ?? '').replace(/\.[^.]+$/, '') || 'output';
      setDownloadName(`${origBase}.${detectedExt}`);

      if (user) {
        const originalFileName = files[0]?.name ?? '';
        const outputFileName   = `${tool.slug}.${tool.outputFormat}`;
        saveConversion(blob, tool.slug, outputFileName, originalFileName);
        setSaved(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setDownloadUrl('');
    setError('');
    setSaved(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  /* ── 404 ── */
  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tool Not Found</h1>
          <p className="text-gray-500 mb-6">The tool you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 shadow-md"
            style={{ background: '#2596be' }}
          >
            ← Back to Hub
          </Link>
        </div>
      </div>
    );
  }

  /* ── helpers ── */
  const isImageTool = tool.category.startsWith('img-');
  const accentColor = tool.color;
  const canSubmit   = files.length > 0 || (!!tool.fileOptional && !!params['url']?.trim());

  /* draw selection rect style */
  const selRect = (() => {
    const src = areaStart && areaDrag
      ? { fx1: areaStart.fx, fy1: areaStart.fy, fx2: areaDrag.fx, fy2: areaDrag.fy }
      : areaFinal;
    if (!src) return null;
    return {
      left:   `${Math.min(src.fx1, src.fx2) * 100}%`,
      top:    `${Math.min(src.fy1, src.fy2) * 100}%`,
      width:  `${Math.abs(src.fx2 - src.fx1) * 100}%`,
      height: `${Math.abs(src.fy2 - src.fy1) * 100}%`,
    };
  })();

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8' }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: '#ffffff', borderColor: '#e5e7eb', boxShadow: '0 1px 12px rgba(37,150,190,0.08)' }}
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.webp"
              alt="Digital Hub"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                style={{ background: '#eff6ff', color: '#2596be' }}
              >
                📂 My Files
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-gray-100"
                style={{ color: '#64748b', border: '1.5px solid #e5e7eb' }}
              >
                Login to save files
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold transition-all hover:opacity-70"
              style={{ color: accentColor }}
            >
              <span>←</span> All Tools
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* ── Tool Hero ── */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${tool.bgColor}, ${tool.borderColor})`, border: `2px solid ${tool.borderColor}` }}
          >
            {tool.icon}
          </div>
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3"
            style={{ background: tool.bgColor, color: accentColor }}
          >
            {isImageTool ? 'Image Tool' : 'PDF Tool'}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{tool.name}</h1>
          <p className="text-gray-500 text-base max-w-md mx-auto">{tool.description}</p>
          {!user && (
            <p className="text-xs text-gray-400 mt-3">
              <Link href="/login" className="font-semibold hover:underline" style={{ color: '#2596be' }}>Sign in</Link>
              {' '}to automatically save converted files to your account
            </p>
          )}
        </div>

        {/* ── Steps indicator ── */}
        <div className="flex items-center justify-center gap-2 mb-8 select-none">
          {['Upload', 'Configure', 'Download'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: i === 0 ? accentColor : '#e5e7eb',
                  color:      i === 0 ? '#fff'       : '#9ca3af',
                }}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: i === 0 ? 'rgba(255,255,255,0.25)' : '#d1d5db', color: i === 0 ? '#fff' : '#6b7280' }}
                >
                  {i + 1}
                </span>
                {step}
              </div>
              {i < 2 && <span className="text-gray-300 text-xs">›</span>}
            </div>
          ))}
        </div>

        {/* ── Upload / Drop Zone ── */}
        {!downloadUrl && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="relative rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 mb-5 overflow-hidden"
            style={{
              border: `2px dashed ${dragging ? accentColor : tool.borderColor}`,
              background: dragging ? tool.bgColor : '#ffffff',
              boxShadow: dragging ? `0 0 0 4px ${accentColor}22` : '0 1px 6px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: `repeating-linear-gradient(45deg, ${accentColor} 0, ${accentColor} 1px, transparent 0, transparent 50%)`, backgroundSize: '20px 20px' }}
            />

            <input
              ref={inputRef}
              type="file"
              accept={tool.acceptedFormats}
              multiple={tool.multipleFiles}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="relative">
              {files.length > 0 ? (
                <div>
                  <div className="text-5xl mb-3">✅</div>
                  <p className="font-bold text-gray-800 text-lg mb-1">
                    {files.length === 1 ? files[0].name : `${files.length} files selected`}
                  </p>
                  <p className="text-gray-400 text-sm mb-1">
                    {files.length === 1
                      ? `${(files[0].size / 1024 / 1024).toFixed(2)} MB`
                      : files.map((f) => f.name).join(', ')}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="mt-3 text-xs font-semibold px-3 py-1 rounded-full transition-all hover:opacity-80"
                    style={{ background: '#fee2e2', color: '#ef4444' }}
                  >
                    ✕ Remove file{files.length > 1 ? 's' : ''}
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                    style={{ background: tool.bgColor }}
                  >
                    ☁️
                  </div>
                  <p className="text-base font-bold text-gray-700 mb-1">
                    {tool.inputLabel}
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Drag &amp; drop here, or{' '}
                    <span className="font-semibold" style={{ color: accentColor }}>
                      click to browse
                    </span>
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: tool.bgColor, color: accentColor, border: `1px solid ${tool.borderColor}` }}
                  >
                    Supported: {tool.acceptedFormats.toUpperCase().replace(/\./g, '').replace(/,/g, ' · ')}
                  </div>
                  <p className="text-xs text-gray-300 mt-2">Max 100 MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PDF Canvas Picker (point / area mode) ── */}
        {!downloadUrl && isPosMode && files.length > 0 && (
          <div
            className="rounded-2xl p-5 mb-5"
            style={{ background: '#ffffff', border: `1.5px solid ${tool.borderColor}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
          >
            {/* header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: accentColor, color: '#fff' }}>
                  🎯
                </div>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                  {tool.pdfPositionMode === 'point' ? 'Click to set position' : 'Drag to select area'}
                </h3>
              </div>
              {/* page navigation */}
              {pdfPageCount > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePage(previewPage - 1)}
                    disabled={previewPage <= 1 || loadingPreview}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: accentColor, color: '#fff' }}
                  >
                    ‹
                  </button>
                  <span className="text-xs font-semibold text-gray-600">
                    Page {previewPage} / {pdfPageCount}
                  </span>
                  <button
                    onClick={() => changePage(previewPage + 1)}
                    disabled={previewPage >= pdfPageCount || loadingPreview}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: accentColor, color: '#fff' }}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* instruction */}
            <p className="text-xs text-gray-500 mb-3">
              {tool.pdfPositionMode === 'point'
                ? 'Click anywhere on the page below to place your annotation at that position.'
                : 'Click and drag on the page below to select the region for your annotation.'}
            </p>

            {/* preview area */}
            <div
              className="relative w-full overflow-hidden rounded-xl"
              style={{
                border: `1.5px solid ${tool.borderColor}`,
                background: '#f0f0f0',
                minHeight: '200px',
                cursor: tool.pdfPositionMode === 'point' ? 'crosshair' : 'crosshair',
              }}
            >
              {loadingPreview && (
                <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(255,255,255,0.8)' }}>
                  <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke={accentColor} strokeWidth="4" />
                    <path className="opacity-75" fill={accentColor} d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}

              {pdfPreviewUrl ? (
                <div className="relative select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={pdfImgRef}
                    src={pdfPreviewUrl}
                    alt={`Page ${previewPage}`}
                    className="w-full h-auto block"
                    draggable={false}
                    onClick={tool.pdfPositionMode === 'point' ? handlePdfClick : undefined}
                    onMouseDown={tool.pdfPositionMode === 'area' ? handleAreaMouseDown : undefined}
                    onMouseMove={tool.pdfPositionMode === 'area' ? handleAreaMouseMove : undefined}
                    onMouseUp={tool.pdfPositionMode === 'area' ? handleAreaMouseUp : undefined}
                  />

                  {/* point marker */}
                  {tool.pdfPositionMode === 'point' && pointMarker && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `calc(${pointMarker.fx * 100}% - 8px)`,
                        top:  `calc(${pointMarker.fy * 100}% - 8px)`,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                        style={{ background: accentColor }}
                      />
                    </div>
                  )}

                  {/* area selection rect */}
                  {tool.pdfPositionMode === 'area' && selRect && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        ...selRect,
                        border: `2px solid ${accentColor}`,
                        background: `${accentColor}22`,
                      }}
                    />
                  )}
                </div>
              ) : !loadingPreview ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  Preview not available
                </div>
              ) : null}
            </div>

            {/* selected position badge */}
            {hasPositionSet && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: tool.bgColor, color: accentColor, border: `1px solid ${tool.borderColor}` }}
                >
                  ✓ Position set on page {previewPage}
                  {areaFinal && ` · ${params['width'] || 0} × ${params['height'] || 0} pt`}
                </span>
                <button
                  onClick={() => {
                    setPointMarker(null);
                    setAreaFinal(null);
                    setParams(prev => {
                      const next = { ...prev };
                      ['x','y','width','height','page','pages'].forEach(k => delete next[k]);
                      return next;
                    });
                  }}
                  className="text-xs font-semibold px-2 py-1 rounded-full transition-all hover:opacity-80"
                  style={{ background: '#fee2e2', color: '#ef4444' }}
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Parameters ── */}
        {!downloadUrl && visibleParams.length > 0 && (files.length > 0 || tool.fileOptional) && (
          <div
            className="rounded-2xl p-6 mb-5"
            style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: accentColor, color: '#fff' }}>
                ⚙
              </div>
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Options</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleParams.map((param) => (
                <div key={param.name}>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    {param.label}
                  </label>
                  {param.type === 'select' ? (
                    <select
                      value={params[param.name] ?? ''}
                      onChange={(e) => setParams((prev) => ({ ...prev, [param.name]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                      style={{ border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#111827' }}
                    >
                      {param.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : param.type === 'color' ? (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ border: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
                      <input
                        type="color"
                        value={params[param.name] ?? '#000000'}
                        onChange={(e) => setParams((prev) => ({ ...prev, [param.name]: e.target.value }))}
                        className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="text-sm font-mono text-gray-600">{params[param.name]}</span>
                    </div>
                  ) : (
                    <input
                      type={param.type}
                      value={params[param.name] ?? ''}
                      placeholder={param.placeholder}
                      onChange={(e) => setParams((prev) => ({ ...prev, [param.name]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                      style={{ border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#111827' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Process Button ── */}
        {!downloadUrl && canSubmit && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
            style={{ background: loading ? '#9ca3af' : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing your file...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Process {tool.name}
                <span className="text-xl">→</span>
              </span>
            )}
          </button>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl flex items-start gap-3" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-red-700 text-sm">Processing Failed</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Download Card ── */}
        {downloadUrl && (
          <div
            className="rounded-3xl p-10 text-center"
            style={{ background: '#ffffff', border: `2px solid ${tool.borderColor}`, boxShadow: `0 8px 40px ${accentColor}22` }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${tool.bgColor}, ${tool.borderColor})` }}
            >
              🎉
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Ready to Download!</h2>
            <p className="text-gray-400 text-sm mb-5">Your file has been processed successfully.</p>

            {saved && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}
              >
                ✓ Saved to your account ·{' '}
                <Link href="/dashboard" className="underline hover:no-underline">View My Files</Link>
              </div>
            )}

            <div>
              <a
                href={downloadUrl}
                download={downloadName}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-extrabold text-lg transition-all duration-200 shadow-md hover:shadow-xl hover:opacity-90 mb-5"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
              >
                ⬇️ Download {downloadName}
              </a>
            </div>
            <button
              onClick={handleReset}
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: accentColor }}
            >
              ↺ Process another file
            </button>
          </div>
        )}

        {/* ── How it works ── */}
        <div
          className="mt-8 rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
        >
          <h3 className="font-bold text-gray-700 mb-5 text-sm uppercase tracking-widest flex items-center gap-2">
            <span>📖</span> How to use {tool.name}
          </h3>
          <ol className="space-y-3">
            {(isPosMode
              ? [
                  `Upload your ${tool.acceptedFormats.replace(/\./g, '').toUpperCase().replace(/,/g, ' / ')} file`,
                  tool.pdfPositionMode === 'point'
                    ? 'The PDF page will appear — click exactly where you want to place the annotation'
                    : 'The PDF page will appear — click and drag to select the area for your annotation',
                  tool.params && tool.params.filter(p => !PDF_POS_PARAMS.has(p.name)).length > 0
                    ? 'Fill in the remaining options (text, color, etc.)'
                    : null,
                  `Click "Process ${tool.name}"`,
                  `Download your ${tool.outputFormat}`,
                ]
              : [
                  `Upload your ${tool.acceptedFormats.replace(/\./g, '').toUpperCase().replace(/,/g, ' / ')} file`,
                  tool.params && tool.params.length > 0 ? 'Configure the options to your needs' : null,
                  `Click "Process ${tool.name}"`,
                  `Download your ${tool.outputFormat}`,
                ]
            )
              .filter(Boolean)
              .map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 mt-0.5 shadow-sm"
                    style={{ background: accentColor }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
          </ol>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold transition-all hover:opacity-70"
            style={{ color: accentColor }}
          >
            ← Back to all tools
          </Link>
        </div>
      </main>
    </div>
  );
}
