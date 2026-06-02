import type { Metadata } from 'next';
import EditPdfClient from './EditPdfClient';

export const metadata: Metadata = {
  title: 'Edit PDF Online — Free PDF Editor | GoDocLab',
  description: 'Edit your PDF files online for free. Click anywhere on the page to add text at that exact position. No installation needed.',
  openGraph: {
    title: 'Edit PDF Online — Free PDF Editor | GoDocLab',
    description: 'Click anywhere on the page to add text. Free, fast, no installation.',
    url: 'https://godoclab.com/tool/edit-pdf',
    siteName: 'GoDocLab',
    type: 'website',
  },
};

export default function EditPdfPage() {
  return <EditPdfClient />;
}
