import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'src/content/public-documents');
const MANIFEST_PATH = path.join(CONTENT_ROOT, 'publish-manifest.generated.json');
const BASE_URL = (process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://kiregister.com').replace(/\/+$/, '');

const VALID_CONTENT_TYPES = new Set(['standard', 'update', 'artefact']);
const VALID_LOCALES = new Set(['de', 'en']);
const VALID_SCHEMA_TYPES = new Set(['Article', 'FAQPage', 'BreadcrumbList', 'Organization', 'Dataset']);
const VALID_TEMPLATE_VARIANTS = new Set([
  'institutional-report',
  'institutional-brief',
  'authority-update',
  'artefact-sheet',
]);
const BANNED_TITLE_PATTERNS = [
  {
    regex: /\b(?:ist|sind)\s+(?:kein|keine|nicht)\b.{0,120}\bsondern\b/i,
    message:
      'Title uses the contrast pattern "nicht X, sondern Y", which reads like generic AI copy. Use a direct institutional headline instead.',
  },
  {
    regex: /\bnicht\s+nur\b.{0,120}\bsondern\s+auch\b/i,
    message:
      'Title uses the pattern "nicht nur X, sondern auch Y". Public headlines should stay direct and non-performative.',
  },
];

function walkJsonFiles(dirPath) {
  const files = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(entryPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.json') &&
      entry.name !== 'publish-manifest.generated.json'
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

function requiredString(doc, key, errors) {
  if (typeof doc[key] !== 'string' || doc[key].trim().length === 0) {
    errors.push(`Missing or invalid string field "${key}".`);
  }
}

function validateSection(section, errors, index) {
  if (!section || typeof section !== 'object') {
    errors.push(`Section ${index} is missing or invalid.`);
    return;
  }

  if (typeof section.heading !== 'string' || section.heading.trim().length === 0) {
    errors.push(`Section ${index} is missing a heading.`);
  }

  if (section.kind === 'paragraphs') {
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length === 0) {
      errors.push(`Paragraph section ${index} needs at least one paragraph.`);
    }
    return;
  }

  if (section.kind === 'bullets') {
    if (!Array.isArray(section.items) || section.items.length === 0) {
      errors.push(`Bullet section ${index} needs at least one item.`);
    }
    return;
  }

  if (section.kind === 'table') {
    if (!Array.isArray(section.rows) || section.rows.length === 0) {
      errors.push(`Table section ${index} needs at least one row.`);
      return;
    }

    for (const [rowIndex, row] of section.rows.entries()) {
      if (!row || typeof row !== 'object' || typeof row.label !== 'string' || typeof row.value !== 'string') {
        errors.push(`Table section ${index} row ${rowIndex} is invalid.`);
      }
    }
    return;
  }

  errors.push(`Section ${index} uses unsupported kind "${section.kind}".`);
}

function getSegment(contentType) {
  if (contentType === 'standard') return 'standards';
  if (contentType === 'update') return 'updates';
  return 'artefacts';
}

function buildPlainText(doc) {
  const lines = [doc.title, '', doc.summary];

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

  if (Array.isArray(doc.faq) && doc.faq.length > 0) {
    lines.push('', 'FAQ');
    for (const item of doc.faq) {
      lines.push(item.q, item.a);
    }
  }

  return lines.join('\n').trim();
}

function validateDocument(doc, filePath) {
  const errors = [];

  for (const field of [
    'slug',
    'locale',
    'content_type',
    'sector',
    'intent',
    'review_status',
    'reviewed_by',
    'effective_date',
    'last_substantive_update',
    'title',
    'summary',
    'object_label',
    'stance_label',
    'author',
    'template_variant',
    'notification_email',
  ]) {
    requiredString(doc, field, errors);
  }

  if (!VALID_LOCALES.has(doc.locale)) {
    errors.push(`Unsupported locale "${doc.locale}".`);
  }

  if (!VALID_CONTENT_TYPES.has(doc.content_type)) {
    errors.push(`Unsupported content type "${doc.content_type}".`);
  }

  if (!VALID_TEMPLATE_VARIANTS.has(doc.template_variant)) {
    errors.push(`Unsupported template variant "${doc.template_variant}".`);
  }

  if (typeof doc.title === 'string') {
    for (const pattern of BANNED_TITLE_PATTERNS) {
      if (pattern.regex.test(doc.title)) {
        errors.push(pattern.message);
      }
    }
  }

  if (!Array.isArray(doc.source_urls) || doc.source_urls.length === 0) {
    errors.push('source_urls must contain at least one source URL.');
  }

  if (!Array.isArray(doc.schema_types) || doc.schema_types.length === 0) {
    errors.push('schema_types must contain at least one schema type.');
  } else {
    for (const schemaType of doc.schema_types) {
      if (!VALID_SCHEMA_TYPES.has(schemaType)) {
        errors.push(`Unsupported schema type "${schemaType}".`);
      }
    }
  }

  if (!Array.isArray(doc.sections) || doc.sections.length === 0) {
    errors.push('sections must contain at least one section.');
  } else {
    for (const [index, section] of doc.sections.entries()) {
      validateSection(section, errors, index);
    }
  }

  if (doc.cta && (typeof doc.cta.label !== 'string' || typeof doc.cta.href !== 'string')) {
    errors.push('cta must contain label and href when present.');
  }

  if (doc.content_type === 'update' && doc.template_variant !== 'authority-update') {
    errors.push('Updates must use the authority-update template.');
  }

  if (doc.content_type === 'artefact' && doc.template_variant !== 'artefact-sheet') {
    errors.push('Artefacts must use the artefact-sheet template.');
  }

  if (
    doc.content_type === 'standard' &&
    !['institutional-report', 'institutional-brief'].includes(doc.template_variant)
  ) {
    errors.push('Standards must use an institutional template.');
  }

  if (doc.review_status === 'draft') {
    errors.push('Public documents must not remain in draft review_status.');
  }

  if (doc.reversible !== true) {
    errors.push('Public documents must declare reversible=true.');
  }

  return {
    filePath,
    doc,
    errors,
  };
}

function loadDocuments() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Missing content root: ${CONTENT_ROOT}`);
  }

  return walkJsonFiles(CONTENT_ROOT).map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return validateDocument(JSON.parse(raw), filePath);
  });
}

function printErrors(validationResults) {
  let hasErrors = false;

  for (const result of validationResults) {
    if (result.errors.length === 0) {
      continue;
    }

    hasErrors = true;
    console.error(`\n${path.relative(ROOT, result.filePath)}`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
  }

  return hasErrors;
}

function buildManifest(validationResults) {
  return {
    generatedAt: new Date().toISOString(),
    documents: validationResults
      .slice()
      .sort((left, right) => left.doc.title.localeCompare(right.doc.title, left.doc.locale))
      .map((result) => {
        const routePath = `/${result.doc.locale}/${getSegment(result.doc.content_type)}/${result.doc.slug}`;
        return {
          slug: result.doc.slug,
          locale: result.doc.locale,
          contentType: result.doc.content_type,
          title: result.doc.title,
          reviewStatus: result.doc.review_status,
          templateVariant: result.doc.template_variant,
          publishedUrl: `${BASE_URL}${routePath}`,
          routePath,
          deletePath: path.relative(ROOT, result.filePath),
          notificationEmail: result.doc.notification_email,
          sourceUrls: result.doc.source_urls,
          lastSubstantiveUpdate: result.doc.last_substantive_update,
          fullText: buildPlainText(result.doc),
          autoPublishEligible: result.doc.content_type !== 'standard',
        };
      }),
  };
}

const command = process.argv[2] || 'validate';
const validationResults = loadDocuments();
const hasErrors = printErrors(validationResults);

if (hasErrors) {
  process.exit(1);
}

if (command === 'validate') {
  console.log(`Validated ${validationResults.length} public content documents.`);
  process.exit(0);
}

if (command === 'manifest') {
  const manifest = buildManifest(validationResults);
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  console.log(`Wrote publish manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
  process.exit(0);
}

console.error(`Unknown command "${command}". Use "validate" or "manifest".`);
process.exit(1);
