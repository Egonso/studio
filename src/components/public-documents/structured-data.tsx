interface StructuredDataProps {
  payload: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function StructuredData({ payload }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
