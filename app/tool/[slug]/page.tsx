import { TOOLS } from '../../lib/tools';
import ToolClient from './ToolClient';

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ToolClient slug={slug} />;
}
