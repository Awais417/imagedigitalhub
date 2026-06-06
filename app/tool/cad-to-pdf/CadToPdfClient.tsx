'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

function getToken() {
  try { return (JSON.parse(localStorage.getItem('auth') || '{}') as { token?: string }).token ?? null; }
  catch { return null; }
}
const authHdrs = (): HeadersInit => {
  const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {};
};

/* ── DXF canvas renderer ─────────────────────────────────────────────────── */
async function renderDxfToCanvas(canvas: HTMLCanvasElement, text: string) {
  // Dynamic import — dxf-parser is browser-compatible
  const DxfParser = (await import('dxf-parser')).default;
  const parser    = new DxfParser();
  let dxf: any;
  try { dxf = parser.parseSync(text); } catch { return false; }

  const entities: any[] = dxf?.entities ?? [];
  if (entities.length === 0) return false;

  /* bounding box */
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const upd = (x: number, y: number) => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  };
  for (const e of entities) {
    switch (e.type) {
      case 'LINE':
        e.vertices?.forEach((v: any) => upd(v.x, v.y)); break;
      case 'CIRCLE': case 'ARC':
        upd((e.center?.x ?? 0) - (e.radius ?? 0), (e.center?.y ?? 0) - (e.radius ?? 0));
        upd((e.center?.x ?? 0) + (e.radius ?? 0), (e.center?.y ?? 0) + (e.radius ?? 0)); break;
      case 'LWPOLYLINE': case 'POLYLINE':
        e.vertices?.forEach((v: any) => upd(v.x, v.y)); break;
      case 'SPLINE':
        (e.controlPoints ?? e.fitPoints ?? []).forEach((v: any) => upd(v.x, v.y)); break;
      case 'ELLIPSE':
        upd((e.center?.x ?? 0) - Math.abs(e.majorAxisEndPoint?.x ?? 0),
            (e.center?.y ?? 0) - Math.abs(e.majorAxisEndPoint?.y ?? 0));
        upd((e.center?.x ?? 0) + Math.abs(e.majorAxisEndPoint?.x ?? 0),
            (e.center?.y ?? 0) + Math.abs(e.majorAxisEndPoint?.y ?? 0)); break;
      case 'TEXT': case 'MTEXT':
        upd(e.startPoint?.x ?? e.position?.x ?? 0, e.startPoint?.y ?? e.position?.y ?? 0); break;
    }
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 300; maxY = 200; }

  const W = canvas.width, H = canvas.height;
  const pad   = 20;
  const dxfW  = (maxX - minX) || 1;
  const dxfH  = (maxY - minY) || 1;
  const scale = Math.min((W - pad * 2) / dxfW, (H - pad * 2) / dxfH);
  const tx    = (x: number) => pad + (x - minX) * scale;
  const ty    = (y: number) => H - pad - (y - minY) * scale;  // flip Y

  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth   = 0.8;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  const sampleArc = (cx: number, cy: number, r: number, s: number, e: number, n = 48) => {
    const pts: [number, number][] = [];
    let end = e; if (end <= s) end += 360;
    const step = (end - s) / n;
    for (let d = s; d <= end + step * 0.5; d += step) {
      const rad = Math.min(d, end) * (Math.PI / 180);
      pts.push([cx + r * Math.cos(rad), cy + r * Math.sin(rad)]);
    }
    return pts;
  };

  for (const e of entities) {
    try {
      ctx.beginPath();
      switch (e.type) {
        case 'LINE': {
          const v = e.vertices ?? [];
          if (v.length >= 2) { ctx.moveTo(tx(v[0].x), ty(v[0].y)); ctx.lineTo(tx(v[1].x), ty(v[1].y)); }
          break;
        }
        case 'CIRCLE':
          ctx.arc(tx(e.center.x), ty(e.center.y), (e.radius ?? 0) * scale, 0, Math.PI * 2);
          break;
        case 'ARC': {
          const pts = sampleArc(e.center.x, e.center.y, e.radius ?? 0, e.startAngle ?? 0, e.endAngle ?? 360);
          pts.forEach(([px, py], i) => i === 0 ? ctx.moveTo(tx(px), ty(py)) : ctx.lineTo(tx(px), ty(py)));
          break;
        }
        case 'LWPOLYLINE': case 'POLYLINE': {
          const vv = e.vertices ?? [];
          vv.forEach((v: any, i: number) => i === 0 ? ctx.moveTo(tx(v.x), ty(v.y)) : ctx.lineTo(tx(v.x), ty(v.y)));
          if (e.closed) ctx.closePath();
          break;
        }
        case 'SPLINE': {
          const pts = e.controlPoints ?? e.fitPoints ?? [];
          pts.forEach((p: any, i: number) => i === 0 ? ctx.moveTo(tx(p.x), ty(p.y)) : ctx.lineTo(tx(p.x), ty(p.y)));
          break;
        }
        case 'ELLIPSE': {
          const rx = Math.sqrt((e.majorAxisEndPoint?.x ?? 0) ** 2 + (e.majorAxisEndPoint?.y ?? 0) ** 2);
          const ry = rx * (e.axisRatio ?? 1);
          ctx.ellipse(tx(e.center.x), ty(e.center.y), rx * scale, ry * scale, 0, 0, Math.PI * 2);
          break;
        }
        case 'TEXT': case 'MTEXT': {
          const px = e.startPoint?.x ?? e.position?.x ?? 0;
          const py = e.startPoint?.y ?? e.position?.y ?? 0;
          ctx.fillStyle = '#86efac';
          ctx.font = `${Math.max(8, (e.height ?? 2.5) * scale)}px monospace`;
          ctx.fillText(e.text ?? e.string ?? '', tx(px), ty(py));
          ctx.fillStyle = '#4ade80';
          continue;
        }
      }
      ctx.stroke();
    } catch { /* skip bad entity */ }
  }
  return true;
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function CadToPdfClient() {
  const [file, setFile]               = useState<File | null>(null);
  const [dragging, setDragging]       = useState(false);
  const [previewReady, setPreviewReady]   = useState(false);
  const [previewError, setPreviewError]   = useState('');
  const [dwgPreviewUrl, setDwgPreviewUrl] = useState('');
  const [dwgPreviewLoading, setDwgPreviewLoading] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [downloadUrl, setDownloadUrl]     = useState('');
  const [downloadName, setDownloadName]   = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const ext = file?.name.split('.').pop()?.toLowerCase() ?? '';

  /* ── render / fetch preview when file changes ── */
  useEffect(() => {
    setPreviewReady(false);
    setPreviewError('');
    setDwgPreviewLoading(false);
    // Revoke any existing object URL
    setDwgPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return ''; });

    if (!file) return;

    if (ext === 'dxf') {
      /* DXF — render client-side */
      file.text().then(async text => {
        if (!canvasRef.current) return;
        const ok = await renderDxfToCanvas(canvasRef.current, text);
        if (ok) setPreviewReady(true);
        else    setPreviewError('Could not parse DXF for preview.');
      });
    } else if (ext === 'dwg' || ext === 'dwf') {
      /* DWG / DWF — fetch PNG preview from backend */
      setDwgPreviewLoading(true);
      const form = new FormData();
      form.append('file', file);
      fetch(`${API_BASE}/pdf/cad-preview`, {
        method: 'POST', headers: authHdrs(), body: form,
      })
        .then(async res => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(body.message || `HTTP ${res.status}`);
          }
          return res.blob();
        })
        .then(blob => {
          setDwgPreviewUrl(URL.createObjectURL(blob));
        })
        .catch(e => {
          setPreviewError((e as Error).message);
        })
        .finally(() => {
          setDwgPreviewLoading(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, ext]);

  /* ── load file ── */
  const loadFile = (f: File) => {
    const e = f.name.split('.').pop()?.toLowerCase();
    if (!['dxf', 'dwg', 'dwf'].includes(e ?? '')) return;
    setFile(f); setDownloadUrl(''); setError('');
  };
  const onDrop = (ev: React.DragEvent) => {
    ev.preventDefault(); setDragging(false);
    const f = ev.dataTransfer.files[0]; if (f) loadFile(f);
  };

  /* ── convert ── */
  const convert = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/pdf/cad-to-pdf`, {
        method: 'POST', headers: authHdrs(), body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      setDownloadUrl(URL.createObjectURL(blob));
      setDownloadName(file.name.replace(/\.[^.]+$/, '') + '.pdf');
    } catch (e) { setError((e as Error).message); }
    finally     { setLoading(false); }
  };

  /* ── reset ── */
  const reset = () => {
    if (dwgPreviewUrl) URL.revokeObjectURL(dwgPreviewUrl);
    setFile(null); setPreviewReady(false); setPreviewError('');
    setDwgPreviewUrl(''); setDwgPreviewLoading(false);
    setDownloadUrl(''); setDownloadName(''); setError('');
  };

  /* ══ download screen ══════════════════════════════════════════════════════ */
  if (downloadUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF Ready!</h2>
          <p className="text-gray-400 text-sm mb-6">Your CAD drawing has been converted.</p>
          <a href={downloadUrl} download={downloadName}
            className="block w-full bg-green-600 text-white font-semibold py-3 rounded-xl mb-3 hover:bg-green-700 transition">
            Download {downloadName}
          </a>
          <button onClick={reset}
            className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition">
            Convert Another
          </button>
          <Link href="/" className="block mt-4 text-sm text-gray-400 hover:text-gray-600">← Back to tools</Link>
        </div>
      </div>
    );
  }

  /* ══ main ═════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <span className="text-gray-300">|</span>
        <span className="text-xl">📐</span>
        <h1 className="text-lg font-bold text-gray-800">CAD to PDF</h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">DXF · DWG · DWF</span>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {!file ? (
          /* Upload zone */
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition
              ${dragging ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50'}`}
          >
            <div className="text-6xl mb-4">📐</div>
            <p className="text-lg font-semibold text-gray-700 mb-1">Select CAD file (DXF, DWG or DWF)</p>
            <p className="text-sm text-gray-400">Drag & drop here, or click to browse</p>
            <p className="text-xs text-gray-300 mt-3">Supported: .dxf · .dwg · .dwf · Max 100 MB</p>
            <input ref={fileRef} type="file" accept=".dxf,.dwg,.dwf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview panel */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📐</span>
                  <span className="font-medium text-gray-700 text-sm truncate max-w-[180px]">{file.name}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold">
                    {ext}
                  </span>
                </div>
                <button onClick={reset} className="text-gray-300 hover:text-red-400 text-lg">×</button>
              </div>

              {/* Preview area */}
              <div className="relative bg-[#0d1117] flex items-center justify-center"
                   style={{ minHeight: 340 }}>
                {ext === 'dxf' ? (
                  /* DXF — client-side canvas */
                  <>
                    <canvas
                      ref={canvasRef}
                      width={560}
                      height={340}
                      className="block w-full"
                      style={{ display: previewReady ? 'block' : 'none' }}
                    />
                    {!previewReady && !previewError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-green-400">
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Rendering DXF preview…</span>
                      </div>
                    )}
                    {previewError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-yellow-400">
                        <span className="text-3xl">⚠️</span>
                        <span className="text-sm">{previewError}</span>
                      </div>
                    )}
                  </>
                ) : (
                  /* DWG / DWF — server-side PNG preview */
                  <>
                    {dwgPreviewLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-green-400">
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Generating {ext.toUpperCase()} preview…</span>
                      </div>
                    )}
                    {dwgPreviewUrl && !dwgPreviewLoading && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dwgPreviewUrl}
                        alt={`${ext.toUpperCase()} preview`}
                        className="block w-full max-h-[500px] object-contain"
                      />
                    )}
                    {previewError && !dwgPreviewLoading && !dwgPreviewUrl && (
                      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
                        <span className="text-3xl">⚠️</span>
                        <p className="text-yellow-400 text-sm">{previewError}</p>
                        <p className="text-gray-500 text-xs font-medium">{file.name}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Controls panel */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">File Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name</span>
                    <span className="text-gray-700 font-medium truncate max-w-[180px]">{file.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Format</span>
                    <span className="text-gray-700 font-medium uppercase">{ext}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size</span>
                    <span className="text-gray-700 font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Output</span>
                    <span className="text-gray-700 font-medium">PDF (A4 landscape)</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={convert}
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Converting…</>
                ) : (
                  '📄 Convert to PDF'
                )}
              </button>

              <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 text-center py-1">
                Choose different file
              </button>

              <p className="text-xs text-gray-300 text-center">
                {ext === 'dxf'
                  ? 'DXF is converted locally on the server with full fidelity'
                  : 'DWG/DWF conversion powered by CloudConvert'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
