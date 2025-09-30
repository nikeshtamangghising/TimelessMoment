import { generateStructuredDataScript } from '@/lib/structured-data';

interface StructuredDataProps {
  data: any;
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = generateStructuredDataScript(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}

export default StructuredData;