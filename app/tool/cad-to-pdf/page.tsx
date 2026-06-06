import type { Metadata } from 'next';
import CadToPdfClient from './CadToPdfClient';

export const metadata: Metadata = {
  title: 'CAD to PDF Online — Convert DXF, DWG, DWF | GoDocLab',
  description: 'Convert CAD drawings (DXF, DWG, DWF) to PDF online for free. Preview your DXF drawing before converting. No installation needed.',
  openGraph: {
    title: 'CAD to PDF Online — Convert DXF, DWG, DWF | GoDocLab',
    description: 'Upload your CAD file and preview it instantly. Supports DXF, DWG and DWF formats.',
    url: 'https://godoclab.com/tool/cad-to-pdf',
    siteName: 'GoDocLab',
    type: 'website',
  },
};

export default function CadToPdfPage() {
  return <CadToPdfClient />;
}
