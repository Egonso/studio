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
const VALID_DOWNLOAD_FORMATS = new Set(['PDF', 'XLSX', 'CSV', 'ZIP']);
const BANNED_CONTRAST_PATTERNS = [
  {
    regex: /\b(?:ist|sind)\s+(?:kein|keine|nicht)\b.{0,120}\bsondern\b/i,
    message:
      'Copy uses the contrast pattern "nicht X, sondern Y", which reads like generic AI copy. Use a direct institutional formulation instead.',
  },
  {
    regex: /\bnicht\s+nur\b.{0,120}\bsondern\s+auch\b/i,
    message:
      'Copy uses the pattern "nicht nur X, sondern auch Y". Public content should stay direct and non-performative.',
  },
];

const QUESTION_LED_HEADING_PATTERN = /\b(?:fragen|questions|beantwortet|answered)\b/i;
const QUALITY_FLOORS = {
  standard: {
    minSummaryChars: 160,
    minSections: 5,
    minParagraphSections: 3,
    minTotalChars: 2400,
    minFaq: 3,
  },
  update: {
    minSummaryChars: 150,
    minSections: 4,
    minParagraphSections: 2,
    minTotalChars: 1500,
    minFaq: 1,
  },
  artefact: {
    minSummaryChars: 150,
    minSections: 4,
    minParagraphSections: 2,
    minTotalChars: 1800,
    minFaq: 2,
  },
};

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

function requiredStringList(doc, key, errors, minimum = 1) {
  if (!Array.isArray(doc[key]) || doc[key].length < minimum) {
    errors.push(`Missing or invalid string array field "${key}".`);
    return;
  }

  for (const [index, value] of doc[key].entries()) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`Field "${key}" entry ${index} must be a non-empty string.`);
    }
  }
}

function getSectionTextItems(section) {
  if (!section || typeof section !== 'object') {
    return [];
  }

  if (section.kind === 'paragraphs') {
    return section.paragraphs ?? [];
  }

  if (section.kind === 'bullets') {
    return section.items ?? [];
  }

  if (section.kind === 'table') {
    return (section.rows ?? []).flatMap((row) => [row.label, row.value]);
  }

  return [];
}

function getDocumentTextFragments(doc) {
  const fragments = [
    { label: 'title', value: doc.title },
    { label: 'summary', value: doc.summary },
    { label: 'object_label', value: doc.object_label },
    { label: 'stance_label', value: doc.stance_label },
    ...(doc.audiences ?? []).map((value, index) => ({
      label: `audiences[${index}]`,
      value,
    })),
    ...(doc.delivers ?? []).map((value, index) => ({
      label: `delivers[${index}]`,
      value,
    })),
  ];

  if (doc.cta?.description) {
    fragments.push({ label: 'cta.description', value: doc.cta.description });
  }

  for (const [sectionIndex, section] of (doc.sections ?? []).entries()) {
    fragments.push({
      label: `sections[${sectionIndex}].heading`,
      value: section.heading,
    });
    for (const [itemIndex, value] of getSectionTextItems(section).entries()) {
      fragments.push({
        label: `sections[${sectionIndex}].item[${itemIndex}]`,
        value,
      });
    }
  }

  for (const [index, item] of (doc.faq ?? []).entries()) {
    fragments.push({ label: `faq[${index}].q`, value: item.q });
    fragments.push({ label: `faq[${index}].a`, value: item.a });
  }

  return fragments;
}

function validateWritingQuality(doc, errors) {
  for (const fragment of getDocumentTextFragments(doc)) {
    for (const pattern of BANNED_CONTRAST_PATTERNS) {
      if (pattern.regex.test(fragment.value)) {
        errors.push(`${fragment.label} uses a banned contrast pattern. ${pattern.message}`);
      }
    }
  }
}

function validateQualityFloor(doc, errors) {
  const floor = QUALITY_FLOORS[doc.content_type];
  if (!floor) {
    return;
  }

  const paragraphSections = (doc.sections ?? []).filter((section) => section.kind === 'paragraphs').length;
  const totalChars = [
    doc.summary,
    ...(doc.audiences ?? []),
    ...(doc.delivers ?? []),
    ...((doc.sections ?? []).flatMap((section) => getSectionTextItems(section))),
    ...((doc.faq ?? []).flatMap((item) => [item.q, item.a])),
  ]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim().length;

  if ((doc.summary ?? '').trim().length < floor.minSummaryChars) {
    errors.push(
      `Summary is too thin for ${doc.content_type}. Use at least ${floor.minSummaryChars} characters with concrete substance.`,
    );
  }

  if ((doc.sections ?? []).length < floor.minSections) {
    errors.push(
      `${doc.content_type} documents need at least ${floor.minSections} substantive sections.`,
    );
  }

  if (paragraphSections < floor.minParagraphSections) {
    errors.push(
      `${doc.content_type} documents need at least ${floor.minParagraphSections} paragraph sections, not just bullets or tables.`,
    );
  }

  if (totalChars < floor.minTotalChars) {
    errors.push(
      `${doc.content_type} document is too thin (${totalChars} chars). Raise it to at least ${floor.minTotalChars} chars of substantive body text.`,
    );
  }

  if ((doc.faq ?? []).length < floor.minFaq) {
    errors.push(
      `${doc.content_type} documents need at least ${floor.minFaq} FAQ entries to answer likely follow-up questions directly on-page.`,
    );
  }
}

function validateDownloads(doc, errors) {
  if (doc.downloads == null) {
    return;
  }

  if (!Array.isArray(doc.downloads)) {
    errors.push('downloads must be an array when present.');
    return;
  }

  for (const [index, download] of doc.downloads.entries()) {
    if (!download || typeof download !== 'object') {
      errors.push(`Download ${index} is invalid.`);
      continue;
    }

    if (typeof download.label !== 'string' || download.label.trim().length === 0) {
      errors.push(`Download ${index} is missing a label.`);
    }

    if (typeof download.href !== 'string' || download.href.trim().length === 0) {
      errors.push(`Download ${index} is missing an href.`);
    }

    if (!VALID_DOWNLOAD_FORMATS.has(download.format)) {
      errors.push(`Download ${index} uses unsupported format "${download.format}".`);
    }

    if (
      typeof download.description !== 'string' ||
      download.description.trim().length < 70
    ) {
      errors.push(
        `Download ${index} needs a concrete description that explains what the visitor gets and how to use it.`,
      );
    }
  }
}

function validateExpectationDelivery(doc, errors) {
  for (const [index, section] of doc.sections.entries()) {
    if (!section || typeof section !== 'object') {
      continue;
    }

    if (!QUESTION_LED_HEADING_PATTERN.test(section.heading || '')) {
      continue;
    }

    if (
      section.kind === 'bullets' &&
      Array.isArray(section.items) &&
      section.items.length > 0 &&
      section.items.every((item) => typeof item === 'string' && item.trim().endsWith('?'))
    ) {
      errors.push(
        `Section ${index} promises answers but only lists teaser questions. Replace it with actual answers on the same page.`,
      );
    }
  }
}

function validatePrimaryCta(doc, errors) {
  if (!doc.cta) {
    return;
  }

  if (typeof doc.cta.label !== 'string' || typeof doc.cta.href !== 'string') {
    errors.push('cta must contain label and href when present.');
    return;
  }

  if (/^(mailto:|tel:)/i.test(doc.cta.href)) {
    errors.push('Primary CTA must point to a real product path or workflow, not to an email or phone link.');
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

  if (Array.isArray(doc.audiences) && doc.audiences.length > 0) {
    lines.push('', doc.locale === 'de' ? 'Relevant fuer' : 'Relevant for');
    lines.push(...doc.audiences);
  }

  if (Array.isArray(doc.delivers) && doc.delivers.length > 0) {
    lines.push('', doc.locale === 'de' ? 'Diese Seite liefert' : 'This page delivers');
    lines.push(...doc.delivers);
  }

  if (Array.isArray(doc.downloads) && doc.downloads.length > 0) {
    lines.push('', doc.locale === 'de' ? 'Vorlagen, Handouts und Beispiele' : 'Templates, handouts and examples');
    for (const download of doc.downloads) {
      lines.push(`${download.label} (${download.format}): ${download.href}`);
      if (typeof download.description === 'string' && download.description.trim().length > 0) {
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

  requiredStringList(doc, 'audiences', errors, 2);
  requiredStringList(doc, 'delivers', errors, 2);

  if (!VALID_LOCALES.has(doc.locale)) {
    errors.push(`Unsupported locale "${doc.locale}".`);
  }

  if (!VALID_CONTENT_TYPES.has(doc.content_type)) {
    errors.push(`Unsupported content type "${doc.content_type}".`);
  }

  if (!VALID_TEMPLATE_VARIANTS.has(doc.template_variant)) {
    errors.push(`Unsupported template variant "${doc.template_variant}".`);
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

  validateDownloads(doc, errors);
  validateExpectationDelivery(doc, errors);
  validatePrimaryCta(doc, errors);
  validateWritingQuality(doc, errors);
  validateQualityFloor(doc, errors);

  if (doc.content_type === 'update' && doc.template_variant !== 'authority-update') {
    errors.push('Updates must use the authority-update template.');
  }

  if (doc.content_type === 'artefact' && doc.template_variant !== 'artefact-sheet') {
    errors.push('Artefacts must use the artefact-sheet template.');
  }

  if (doc.content_type === 'artefact' && (!Array.isArray(doc.downloads) || doc.downloads.length === 0)) {
    errors.push('Artefacts must include at least one download or example file.');
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
          audiences: result.doc.audiences,
          delivers: result.doc.delivers,
          downloads: result.doc.downloads ?? [],
          lastSubstantiveUpdate: result.doc.last_substantive_update,
          fullText: buildPlainText(result.doc),
          autoPublishEligible: result.doc.content_type !== 'standard',
        };
      }),
  };
}

function normalizeInternalHref(href) {
  if (typeof href !== 'string' || !href.startsWith('/')) {
    return null;
  }

  return href;
}

function localizeInternalHref(locale, href) {
  const normalizedHref = normalizeInternalHref(href);
  if (!normalizedHref) {
    return null;
  }

  if (normalizedHref === '/' || normalizedHref === `/${locale}` || normalizedHref.startsWith(`/${locale}/`)) {
    return normalizedHref === '/' ? `/${locale}` : normalizedHref;
  }

  if (normalizedHref.startsWith('/downloads/')) {
    return normalizedHref;
  }

  return `/${locale}${normalizedHref}`;
}

function collectVerificationTargets(validationResults) {
  const targets = new Map();

  function addTarget(urlPath, payload) {
    const normalizedPath = normalizeInternalHref(urlPath);
    if (!normalizedPath) {
      return;
    }

    const absoluteUrl = `${BASE_URL}${normalizedPath}`;
    const existing = targets.get(absoluteUrl);

    if (existing) {
      existing.kinds.add(payload.kind);
      existing.sources.add(payload.source);
      if (payload.expectedText) {
        existing.expectedText.add(payload.expectedText);
      }
      return;
    }

    targets.set(absoluteUrl, {
      url: absoluteUrl,
      kinds: new Set([payload.kind]),
      sources: new Set([payload.source]),
      expectedText: new Set(payload.expectedText ? [payload.expectedText] : []),
    });
  }

  for (const result of validationResults) {
    const routePath = `/${result.doc.locale}/${getSegment(result.doc.content_type)}/${result.doc.slug}`;
    const source = path.relative(ROOT, result.filePath);

    addTarget(routePath, { kind: 'document', source, expectedText: result.doc.title });

    for (const section of result.doc.sections ?? []) {
      if (section.heading) {
        addTarget(routePath, { kind: 'document-section', source, expectedText: section.heading });
      }

      if (section.kind === 'paragraphs' && Array.isArray(section.paragraphs) && section.paragraphs[0]) {
        addTarget(routePath, {
          kind: 'document-section-content',
          source,
          expectedText: section.paragraphs[0],
        });
      }

      if (section.kind === 'bullets' && Array.isArray(section.items) && section.items[0]) {
        addTarget(routePath, {
          kind: 'document-section-content',
          source,
          expectedText: section.items[0],
        });
      }

      if (section.kind === 'table' && Array.isArray(section.rows) && section.rows[0]?.label) {
        addTarget(routePath, {
          kind: 'document-section-content',
          source,
          expectedText: section.rows[0].label,
        });
      }
    }

    for (const item of result.doc.faq ?? []) {
      if (item.q) {
        addTarget(routePath, { kind: 'document-faq', source, expectedText: item.q });
      }
    }

    if (Array.isArray(result.doc.downloads) && result.doc.downloads.length > 0) {
      addTarget(routePath, {
        kind: 'document-download-section',
        source,
        expectedText: result.doc.locale === 'de' ? 'Vorlagen, Handouts und Beispiele' : 'Templates, handouts and examples',
      });
    }

    if (result.doc.cta?.href) {
      addTarget(localizeInternalHref(result.doc.locale, result.doc.cta.href) ?? result.doc.cta.href, {
        kind: 'cta',
        source,
      });
    }

    for (const link of result.doc.related_links ?? []) {
      addTarget(localizeInternalHref(result.doc.locale, link.href) ?? link.href, {
        kind: 'related',
        source,
      });
    }

    for (const download of result.doc.downloads ?? []) {
      addTarget(download.href, { kind: 'download', source });
    }
  }

  return [...targets.values()].sort((left, right) => left.url.localeCompare(right.url));
}

async function verifyTarget(target) {
  const response = await fetch(target.url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'user-agent': 'KIRegister public content verifier',
      accept: '*/*',
    },
  });

  if (!response.ok) {
    throw new Error(`returned ${response.status}`);
  }

  const isHtml = (response.headers.get('content-type') || '').includes('text/html');
  if (!isHtml) {
    return {
      status: response.status,
      contentType: response.headers.get('content-type') || 'unknown',
    };
  }

  const html = await response.text();
  for (const fragment of target.expectedText) {
    if (!html.includes(fragment)) {
      throw new Error(`missing expected fragment "${fragment}"`);
    }
  }

  return {
    status: response.status,
    contentType: response.headers.get('content-type') || 'text/html',
  };
}

async function verifyLinks(validationResults) {
  const targets = collectVerificationTargets(validationResults);
  let failures = 0;

  for (const target of targets) {
    try {
      const result = await verifyTarget(target);
      console.log(
        `OK [${[...target.kinds].join(', ')}] ${target.url} (${result.status} ${result.contentType})`,
      );
    } catch (error) {
      failures += 1;
      console.error(
        `FAIL [${[...target.kinds].join(', ')}] ${target.url} :: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.error(`  referenced from: ${[...target.sources].join(', ')}`);
    }
  }

  if (failures > 0) {
    process.exit(1);
  }

  console.log(`Verified ${targets.length} internal public links and downloads against ${BASE_URL}.`);
}

async function main() {
  const command = process.argv[2] || 'validate';
  const validationResults = loadDocuments();
  const hasErrors = printErrors(validationResults);

  if (hasErrors) {
    process.exit(1);
  }

  if (command === 'validate') {
    console.log(`Validated ${validationResults.length} public content documents.`);
    return;
  }

  if (command === 'manifest') {
    const manifest = buildManifest(validationResults);
    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
    console.log(`Wrote publish manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
    return;
  }

  if (command === 'verify-links') {
    await verifyLinks(validationResults);
    return;
  }

  console.error(`Unknown command "${command}". Use "validate", "manifest", or "verify-links".`);
  process.exit(1);
}

await main();
