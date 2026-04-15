import 'server-only';

import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const publicDocumentLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  description: z.string().min(1).optional(),
});

const publicDocumentDownloadSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  description: z.string().min(1).optional(),
  format: z.enum(['PDF', 'XLSX', 'CSV', 'ZIP']),
});

const publicDocumentFaqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

const publicDocumentTableRowSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const publicDocumentSectionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('paragraphs'),
    heading: z.string().min(1),
    paragraphs: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    kind: z.literal('bullets'),
    heading: z.string().min(1),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    kind: z.literal('table'),
    heading: z.string().min(1),
    rows: z.array(publicDocumentTableRowSchema).min(1),
  }),
]);

const publicDocumentSchema = z.object({
  slug: z.string().min(1),
  locale: z.enum(['de', 'en']),
  content_type: z.enum(['standard', 'update', 'artefact']),
  sector: z.string().min(1),
  intent: z.string().min(1),
  review_status: z.enum(['draft', 'reviewed', 'approved']),
  reviewed_by: z.string().min(1),
  effective_date: z.string().min(1),
  last_substantive_update: z.string().min(1),
  source_urls: z.array(z.string().url()).min(1),
  schema_types: z
    .array(z.enum(['Article', 'FAQPage', 'BreadcrumbList', 'Organization', 'Dataset']))
    .min(1),
  template_variant: z.enum([
    'institutional-report',
    'institutional-brief',
    'authority-update',
    'artefact-sheet',
  ]),
  reversible: z.boolean(),
  notification_email: z.string().email(),
  title: z.string().min(1),
  summary: z.string().min(1),
  object_label: z.string().min(1),
  stance_label: z.string().min(1),
  author: z.string().min(1),
  cta: publicDocumentLinkSchema.optional(),
  downloads: z.array(publicDocumentDownloadSchema).optional().default([]),
  related_links: z.array(publicDocumentLinkSchema).optional().default([]),
  faq: z.array(publicDocumentFaqSchema).optional().default([]),
  sections: z.array(publicDocumentSectionSchema).min(1),
});

export type PublicDocument = z.infer<typeof publicDocumentSchema> & {
  filePath: string;
};
export type PublicDocumentSection = z.infer<typeof publicDocumentSectionSchema>;
export type PublicDocumentDownload = z.infer<typeof publicDocumentDownloadSchema>;
export type PublicDocumentLink = z.infer<typeof publicDocumentLinkSchema>;

const CONTENT_ROOT = path.join(process.cwd(), 'src/content/public-documents');

function walkJsonFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(entryPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.json') &&
      entry.name !== 'publish-manifest.generated.json'
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

function readDocumentFromFile(filePath: string): PublicDocument {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = publicDocumentSchema.parse(JSON.parse(raw));
  return { ...parsed, filePath };
}

function readAllDocuments(): PublicDocument[] {
  if (!fs.existsSync(CONTENT_ROOT)) {
    return [];
  }

  return walkJsonFiles(CONTENT_ROOT)
    .map(readDocumentFromFile)
    .sort((left, right) => left.title.localeCompare(right.title, left.locale));
}

export function getPublicDocuments(locale?: string): PublicDocument[] {
  const docs = readAllDocuments();
  if (!locale) {
    return docs;
  }

  return docs.filter((doc) => doc.locale === locale);
}

export function getPublicDocumentsByType(
  contentType: PublicDocument['content_type'],
  locale?: string,
): PublicDocument[] {
  return getPublicDocuments(locale).filter((doc) => doc.content_type === contentType);
}

export function getPublicDocument(
  contentType: PublicDocument['content_type'],
  slug: string,
  locale: string,
): PublicDocument | null {
  return (
    getPublicDocuments(locale).find(
      (doc) => doc.content_type === contentType && doc.slug === slug,
    ) ?? null
  );
}

export function getPublicDocumentSegment(
  contentType: PublicDocument['content_type'],
): 'standards' | 'updates' | 'artefacts' {
  if (contentType === 'standard') return 'standards';
  if (contentType === 'update') return 'updates';
  return 'artefacts';
}

export function getPublicDocumentHref(doc: Pick<PublicDocument, 'locale' | 'content_type' | 'slug'>): string {
  return `/${doc.locale}/${getPublicDocumentSegment(doc.content_type)}/${doc.slug}`;
}

export function getPublicDocumentTypeLabel(
  contentType: PublicDocument['content_type'],
  locale: string,
): string {
  const isGerman = locale === 'de';

  if (contentType === 'standard') {
    return isGerman ? 'Standard' : 'Standard';
  }

  if (contentType === 'update') {
    return isGerman ? 'Update' : 'Update';
  }

  return isGerman ? 'Artefakt' : 'Artefact';
}

export function getPublicDocumentCollectionCopy(
  contentType: PublicDocument['content_type'],
  locale: string,
): { title: string; description: string } {
  const isGerman = locale === 'de';

  if (contentType === 'standard') {
    return {
      title: isGerman ? 'Standards' : 'Standards',
      description: isGerman
        ? 'Öffentliche Referenzdokumente zum Use-Case-Pass, zur Nachweislogik und zur Struktur des KI-Registers.'
        : 'Public reference documents covering the use-case pass, evidence logic, and the structure of the AI Register.',
    };
  }

  if (contentType === 'update') {
    return {
      title: isGerman ? 'Updates' : 'Updates',
      description: isGerman
        ? 'Kurze regulatorische und standardisierungsbezogene Notizen mit Datum, Wirkung und Verlinkung in den Register-Kontext.'
        : 'Short regulatory and standardisation notes with dates, practical effect, and links back into the register context.',
    };
  }

  return {
    title: isGerman ? 'Artefakte' : 'Artefacts',
    description: isGerman
      ? 'Partnerfähige Dokumente, Explainer und Kits, die den Use-Case-Pass als Arbeits- und Beschaffungsformat verankern.'
      : 'Partner-ready documents, explainers, and kits that anchor the use-case pass as an operational and procurement format.',
  };
}

export function getPublicDocumentPlainText(doc: PublicDocument): string {
  const lines: string[] = [doc.title, '', doc.summary];

  if (doc.downloads.length > 0) {
    lines.push('', doc.locale === 'de' ? 'Downloads und Beispiele' : 'Downloads and examples');
    for (const download of doc.downloads) {
      lines.push(`${download.label} (${download.format}): ${download.href}`);
      if (download.description) {
        lines.push(download.description);
      }
    }
  }

  for (const section of doc.sections) {
    lines.push('', section.heading);
    if (section.kind === 'table') {
      for (const row of section.rows) {
        lines.push(`${row.label}: ${row.value}`);
      }
      continue;
    }

    const items = section.kind === 'paragraphs' ? section.paragraphs : section.items;
    lines.push(...items);
  }

  if (doc.faq.length > 0) {
    lines.push('', 'FAQ');
    for (const item of doc.faq) {
      lines.push(item.q, item.a);
    }
  }

  return lines.join('\n').trim();
}

export function getPublicDocumentDeletePath(doc: PublicDocument): string {
  return path.relative(process.cwd(), doc.filePath);
}
