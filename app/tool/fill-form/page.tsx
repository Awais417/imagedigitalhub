import type { Metadata } from 'next';
import FillFormClient from './FillFormClient';

export const metadata: Metadata = {
  title: 'Fill PDF Form Online — Free Form Filler | GoDocLab',
  description: 'Fill existing PDF form fields online for free. Upload a PDF form, fill in the fields, and download instantly. No installation needed.',
  openGraph: {
    title: 'Fill PDF Form Online — Free Form Filler | GoDocLab',
    description: 'Auto-detects all form fields in your PDF and lets you fill them in instantly. Free, fast, no installation.',
    url: 'https://godoclab.com/tool/fill-form',
    siteName: 'GoDocLab',
    type: 'website',
  },
};

export default function FillFormPage() {
  return <FillFormClient />;
}
