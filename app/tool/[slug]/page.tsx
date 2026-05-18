import type { Metadata } from 'next';
import { TOOLS } from '../../lib/tools';
import ToolClient from './ToolClient';

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return { title: 'Tool Not Found | GoDocLab' };

  const title       = tool.seoTitle       ?? `${tool.name} — Free Online Tool | GoDocLab`;
  const description = tool.seoDescription ?? tool.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://godoclab.com/tool/${slug}`,
      siteName: 'GoDocLab',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `https://godoclab.com/tool/${slug}`,
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);

  const schema = tool
    ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.seoTitle ?? tool.name,
        url: `https://godoclab.com/tool/${slug}`,
        description: tool.seoDescription ?? tool.description,
        applicationCategory: 'DeveloperTools',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        provider: { '@type': 'Organization', name: 'GoDocLab', url: 'https://godoclab.com' },
      }
    : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <ToolClient slug={slug} />
    </>
  );
}
