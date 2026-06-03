'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

/* ── types ──────────────────────────────────────────────────────────────── */
interface FieldInfo {
  name: string;
  type: string;   // PDFTextField | PDFCheckBox | PDFDropdown | PDFRadioGroup
  value: string;
  options: string[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function getToken() {
  try { return (JSON.parse(localStorage.getItem('auth') || '{}') as { token?: string }).token ?? null; }
  catch { return null; }
}
const authHdrs = (): HeadersInit => {
  const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {};
};

function fieldKind(type: string): 'text' | 'checkbox' | 'dropdown' | 'radio' {
  if (type.includes('CheckBox'))   return 'checkbox';
  if (type.includes('Dropdown'))   return 'dropdown';
  if (type.includes('RadioGroup')) return 'radio';
  return 'text';
}

const KIND_ICON: Record<string, string> = {
  text: '📝', checkbox: '☑', dropdown: '⬇', radio: '🔘',
};
const KIND_LABEL: Record<string, string> = {
  text: 'Text', checkbox: 'Checkbox', dropdown: 'Dropdown', radio: 'Radio',
};

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function FillFormClient() {
  const [file, setFile]         = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [fields, setFields]     = useState<FieldInfo[] | null>(null);
  const [values, setValues]     = useState<Record<string, string>>({});
  const [flatten, setFlatten]   = useState(false);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [downloadUrl, setDownloadUrl]   = useState('');
  const [downloadName, setDownloadName] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── detect form fields ─────────────────────────────────────────────── */
  const detectFields = useCallback(async (f: File) => {
    setDetecting(true); setError(''); setFields(null); setValues({});
    try {
      const form = new FormData();
      form.append('file', f);
      const res = await fetch(`${API_BASE}/pdf/form-fields`, {
        method: 'POST',
        headers: authHdrs(),
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const detected: FieldInfo[] = await res.json();
      setFields(detected);
      // Pre-fill with existing values from the PDF
      const init: Record<string, string> = {};
      for (const fd of detected) init[fd.name] = fd.value;
      setValues(init);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDetecting(false);
    }
  }, []);

  /* ── load file ──────────────────────────────────────────────────────── */
  const loadFile = (f: File) => {
    if (!f.type.includes('pdf')) return;
    setFile(f); setFields(null); setValues({});
    setDownloadUrl(''); setError('');
    detectFields(f);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) loadFile(f);
  };

  /* ── change a field value ───────────────────────────────────────────── */
  const setValue = (name: string, val: string) =>
    setValues(prev => ({ ...prev, [name]: val }));

  /* ── submit ─────────────────────────────────────────────────────────── */
  const submit = async () => {
    if (!file || !fields) return;
    setLoading(true); setError('');
    try {
      // Build data: checkboxes are booleans, others are strings
      const data: Record<string, string | boolean> = {};
      for (const fd of fields) {
        const kind = fieldKind(fd.type);
        const raw  = values[fd.name] ?? '';
        if (kind === 'checkbox') {
          data[fd.name] = raw === 'true' || raw === '1' || raw === 'on';
        } else {
          data[fd.name] = raw;
        }
      }

      const form = new FormData();
      form.append('file', file);
      form.append('data', JSON.stringify(data));
      form.append('flatten', String(flatten));

      const res = await fetch(`${API_BASE}/pdf/fill-form`, {
        method: 'POST',
        headers: authHdrs(),
        body: form,
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const blob = await res.blob();
      setDownloadUrl(URL.createObjectURL(blob));
      setDownloadName((file.name.replace(/\.pdf$/i, '') || 'document') + '_filled.pdf');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* ── reset ──────────────────────────────────────────────────────────── */
  const reset = () => {
    setFile(null); setFields(null); setValues({});
    setDownloadUrl(''); setDownloadName(''); setError('');
  };

  /* ── field input renderer ───────────────────────────────────────────── */
  const renderInput = (fd: FieldInfo) => {
    const kind = fieldKind(fd.type);
    const val  = values[fd.name] ?? '';

    if (kind === 'checkbox') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={val === 'true' || val === '1' || val === 'on'}
            onChange={e => setValue(fd.name, String(e.target.checked))}
            className="w-4 h-4 accent-purple-600"
          />
          <span className="text-sm text-gray-600">Checked</span>
        </label>
      );
    }

    if (kind === 'dropdown' && fd.options.length > 0) {
      return (
        <select
          value={val}
          onChange={e => setValue(fd.name, e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="">— Select —</option>
          {fd.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (kind === 'radio' && fd.options.length > 0) {
      return (
        <div className="flex flex-wrap gap-3">
          {fd.options.map(opt => (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
              <input
                type="radio"
                name={fd.name}
                value={opt}
                checked={val === opt}
                onChange={() => setValue(fd.name, opt)}
                className="accent-purple-600"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    // text (or dropdown/radio without known options)
    return (
      <input
        type="text"
        value={val}
        onChange={e => setValue(fd.name, e.target.value)}
        placeholder={`Enter ${fd.name}`}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
    );
  };

  /* ══ render ════════════════════════════════════════════════════════════ */
  if (downloadUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Form Filled!</h2>
          <p className="text-gray-500 mb-6 text-sm">Your PDF has been filled and is ready to download.</p>
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
            Fill Another
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
        <span className="text-xl">✍️</span>
        <h1 className="text-lg font-bold text-gray-800">Fill Form</h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Populate PDF form fields</span>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Upload zone */}
        {!file ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition
              ${dragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50'}`}
          >
            <div className="text-5xl mb-4">☁️</div>
            <p className="text-lg font-semibold text-gray-700 mb-1">Select PDF form to fill</p>
            <p className="text-sm text-gray-400">Drag & drop here, or click to browse</p>
            <p className="text-xs text-gray-300 mt-3">PDF only · Max 100 MB</p>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* File header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={reset} className="text-sm text-gray-400 hover:text-red-400 transition">
                ✕ Remove
              </button>
            </div>

            {/* Detecting spinner */}
            {detecting && (
              <div className="flex items-center justify-center gap-3 py-10 text-gray-500">
                <div className="w-5 h-5 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Reading form fields…</span>
              </div>
            )}

            {/* Error */}
            {error && !detecting && (
              <div className="mx-5 my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* No fields found */}
            {fields !== null && fields.length === 0 && !detecting && (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
                <span className="text-4xl">📭</span>
                <p className="text-sm font-medium">No form fields found in this PDF.</p>
                <p className="text-xs text-gray-300">Use "Create Form" to add fields first.</p>
              </div>
            )}

            {/* Fields form */}
            {fields && fields.length > 0 && (
              <div className="p-5 space-y-5">
                <p className="text-sm text-gray-500">
                  Found <strong className="text-gray-700">{fields.length} field{fields.length !== 1 ? 's' : ''}</strong> — fill in the values below:
                </p>

                {fields.map(fd => {
                  const kind = fieldKind(fd.type);
                  return (
                    <div key={fd.name} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{KIND_ICON[kind]}</span>
                        <label className="text-sm font-medium text-gray-700">{fd.name}</label>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {KIND_LABEL[kind]}
                        </span>
                      </div>
                      {renderInput(fd)}
                    </div>
                  );
                })}

                {/* Flatten option */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flatten}
                      onChange={e => setFlatten(e.target.checked)}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Flatten after filling</p>
                      <p className="text-xs text-gray-400">Makes fields non-editable in the output PDF</p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Filling PDF…</>
                  ) : (
                    'Fill & Download PDF'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
