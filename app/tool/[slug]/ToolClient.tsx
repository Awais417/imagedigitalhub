'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { TOOLS } from '../../lib/tools';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://16-171-15-111.sslip.io/api';

export default function ToolClient({ slug }: { slug: string }) {
  const tool = TOOLS.find((t) => t.slug === slug);

  const [files, setFiles]           = useState<File[]>([]);
  const [dragging, setDragging]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [params, setParams]         = useState<Record<string, string>>(() => {
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
    if (!tool || files.length === 0) return;

    if (tool.multipleFiles && files.length < 2) {
      Swal.fire({
        icon: 'warning',
        title: 'More files needed',
        text: 'Please upload at least 2 PDF files to merge.',
        confirmButtonText: 'Got it',
        confirmButtonColor: '#2596be',
      });
      return;
    }

    setLoading(true);
    setError('');
    setDownloadUrl('');

    try {
      const formData = new FormData();
      if (tool.multipleFiles) {
        files.forEach((f) => formData.append('files', f));
      } else {
        formData.append('file', files[0]);
      }
      Object.entries(params).forEach(([k, v]) => {
        if (v !== '') formData.append(k, v);
      });

      const res = await fetch(`${API_BASE}${tool.apiEndpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(tool.outputFormat);
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
    if (inputRef.current) inputRef.current.value = '';
  };

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tool Not Found</h1>
          <p className="text-gray-500 mb-6">The tool you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
            ← Back to Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="shadow-sm border-b sticky top-0 z-50" style={{ backgroundColor: '#2596be', borderColor: '#1e7ea1' }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Image
              src="/Website Logo.png"
              alt="GoDocLab"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <Link
            href="/"
            className="text-sm text-white/80 hover:text-white flex items-center gap-1 transition"
          >
            ← All Tools
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Tool Header */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: tool.bgColor }}
          >
            {tool.icon}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{tool.name}</h1>
          <p className="text-gray-500 text-lg">{tool.description}</p>
        </div>

        {/* Upload Area */}
        {!downloadUrl && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-3 rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 mb-6 ${
              dragging
                ? 'border-dashed scale-[1.02] shadow-lg'
                : 'border-dashed hover:shadow-md'
            }`}
            style={{
              borderColor: dragging ? tool.color : tool.borderColor,
              backgroundColor: dragging ? tool.bgColor : '#ffffff',
              borderWidth: '2px',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={tool.acceptedFormats}
              multiple={tool.multipleFiles}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-5xl mb-4">
              {files.length > 0 ? '✅' : '☁️'}
            </div>
            {files.length > 0 ? (
              <div>
                <p className="font-semibold text-gray-800 text-lg mb-1">
                  {files.length === 1 ? files[0].name : `${files.length} files selected`}
                </p>
                <p className="text-gray-400 text-sm">
                  {files.length === 1
                    ? `${(files[0].size / 1024 / 1024).toFixed(2)} MB`
                    : files.map((f) => f.name).join(', ')}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
                >
                  Remove file{files.length > 1 ? 's' : ''}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-700 mb-1">
                  {tool.inputLabel}
                </p>
                <p className="text-gray-400 text-sm mb-3">
                  Drag & drop here, or click to browse
                </p>
                <p className="text-xs text-gray-300">
                  Supported: {tool.acceptedFormats.toUpperCase().replace(/\./g, '').replace(/,/g, ', ')} · Max 100 MB
                </p>
              </div>
            )}
          </div>
        )}

        {/* Parameters */}
        {!downloadUrl && tool.params && tool.params.length > 0 && files.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">
              Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tool.params.map((param) => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {param.label}
                  </label>
                  {param.type === 'select' ? (
                    <select
                      value={params[param.name] ?? ''}
                      onChange={(e) =>
                        setParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 bg-gray-50"
                    >
                      {param.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : param.type === 'color' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={params[param.name] ?? '#000000'}
                        onChange={(e) =>
                          setParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                        }
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">{params[param.name]}</span>
                    </div>
                  ) : (
                    <input
                      type={param.type}
                      value={params[param.name] ?? ''}
                      placeholder={param.placeholder}
                      onChange={(e) =>
                        setParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 bg-gray-50"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        {!downloadUrl && files.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: loading ? '#9ca3af' : tool.color }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing...
              </span>
            ) : (
              `Process ${tool.name} →`
            )}
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-700 text-sm">Processing Failed</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Download */}
        {downloadUrl && (
          <div
            className="bg-white rounded-3xl border-2 p-8 text-center shadow-lg"
            style={{ borderColor: tool.borderColor }}
          >
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Ready to Download!</h2>
            <p className="text-gray-500 mb-6">Your file has been processed successfully.</p>
            <a
              href={downloadUrl}
              download={downloadName}
              className="inline-block px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:opacity-90 mb-4"
              style={{ backgroundColor: tool.color }}
            >
              ⬇️ Download {downloadName}
            </a>
            <br />
            <button
              onClick={handleReset}
              className="mt-2 text-sm text-gray-400 hover:text-gray-600 underline transition"
            >
              Process another file
            </button>
          </div>
        )}

        {/* How it works */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">
            How to use {tool.name}
          </h3>
          <ol className="space-y-3">
            {[
              `Upload your ${tool.acceptedFormats.replace(/\./g, '').toUpperCase()} file`,
              tool.params && tool.params.length > 0 ? 'Configure the options as needed' : null,
              `Click "Process ${tool.name}"`,
              `Download your ${tool.outputFormat}`,
            ]
              .filter(Boolean)
              .map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: tool.color }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
          </ol>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← Back to all PDF tools
          </Link>
        </div>
      </main>
    </div>
  );
}
