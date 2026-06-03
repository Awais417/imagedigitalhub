import type { Metadata } from 'next';
import CreateFormClient from './CreateFormClient';

export const metadata: Metadata = {
  title: 'Create PDF Form Online — Free Form Builder | GoDocLab',
  description: 'Add interactive text fields, checkboxes, dropdowns, and radio buttons to any PDF online for free. No installation needed.',
  openGraph: {
    title: 'Create PDF Form Online — Free Form Builder | GoDocLab',
    description: 'Click anywhere on the PDF to place text fields, checkboxes, dropdowns, and radio buttons. Free, fast, no installation.',
    url: 'https://godoclab.com/tool/create-form',
    siteName: 'GoDocLab',
    type: 'website',
  },
};

export default function CreateFormPage() {
  return <CreateFormClient />;
}
