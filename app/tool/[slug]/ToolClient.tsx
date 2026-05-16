'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { TOOLS } from '../../lib/tools';
import { useAuth } from '../../context/AuthContext';
import { apiPostBlob, saveConversion } from '../../lib/api';

export default function ToolClient({ slug }: { slug: string }) {
  const tool = TOOLS.find((t) => t.slug === slug);
  const { user } = useAuth();

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

    if (tool.multipleFiles && files.length < 2) {
      Swal.fire({
        icon: 'warning',
        title: 'More files needed',
        text: 'Please upload at least 2 files.',
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
      setDownloadName(tool.outputFormat);

      /* Explicitly save to S3 + DB when logged in */
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

        {/* ── Parameters ── */}
        {!downloadUrl && tool.params && tool.params.length > 0 && (files.length > 0 || tool.fileOptional) && (
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
              {tool.params.map((param) => (
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

            {/* Saved to history badge */}
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
            {[
              `Upload your ${tool.acceptedFormats.replace(/\./g, '').toUpperCase().replace(/,/g, ' / ')} file`,
              tool.params && tool.params.length > 0 ? 'Configure the options to your needs' : null,
              `Click "Process ${tool.name}"`,
              `Download your ${tool.outputFormat}`,
            ]
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
