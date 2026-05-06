import { TOOLS } from '../../lib/tools';
import ToolClient from './ToolClient';

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  return <ToolClient slug={params.slug} />;
}
