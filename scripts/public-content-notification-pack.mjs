import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(
  ROOT,
  'src/content/public-documents/publish-manifest.generated.json',
);

function parseCliOptions(argv) {
  const options = {
    slug: null,
    field: 'json',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--slug') {
      options.slug = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--slug=')) {
      options.slug = arg.slice('--slug='.length) || null;
      continue;
    }

    if (arg === '--field') {
      options.field = argv[index + 1] ?? 'json';
      index += 1;
      continue;
    }

    if (arg.startsWith('--field=')) {
      options.field = arg.slice('--field='.length) || 'json';
    }
  }

  return options;
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Missing manifest at ${path.relative(ROOT, MANIFEST_PATH)}. Run npm run content:public:manifest first.`,
    );
  }

  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function buildBody(entry) {
  const lines = [
    'KIRegister Veröffentlichung',
    '',
    'Titel',
    entry.title,
    '',
    'Live-Link',
    entry.publishedUrl,
    '',
    'Direktlinks',
  ];

  if (entry.sourceFileUrl) {
    lines.push(`Repo-Datei: ${entry.sourceFileUrl}`);
  }
  if (entry.editFileUrl) {
    lines.push(`Bearbeiten: ${entry.editFileUrl}`);
  }
  if (entry.deleteUrl) {
    lines.push(`Direkt löschen: ${entry.deleteUrl}`);
  }
  lines.push(`Delete-Pfad: ${entry.deletePath}`);

  if (Array.isArray(entry.downloads) && entry.downloads.length > 0) {
    lines.push('', 'Downloads');
    for (const download of entry.downloads) {
      lines.push(`- ${download.label} (${download.format}): ${download.absoluteHref || download.href}`);
    }
  }

  if (entry.cta?.label && entry.cta?.absoluteHref) {
    lines.push('', 'Primärer nächster Schritt');
    lines.push(`${entry.cta.label}: ${entry.cta.absoluteHref}`);
  }

  if (Array.isArray(entry.relatedLinks) && entry.relatedLinks.length > 0) {
    lines.push('', 'Weiterführende Links');
    for (const link of entry.relatedLinks) {
      lines.push(`- ${link.label}: ${link.absoluteHref || link.href}`);
    }
  }

  if (Array.isArray(entry.sourceUrls) && entry.sourceUrls.length > 0) {
    lines.push('', 'Quellen');
    for (const sourceUrl of entry.sourceUrls) {
      lines.push(`- ${sourceUrl}`);
    }
  }

  lines.push('', 'Volltext', '', entry.fullText);
  return lines.join('\n').trim();
}

function main() {
  const options = parseCliOptions(process.argv.slice(2));
  if (!options.slug) {
    throw new Error('Missing required --slug option.');
  }

  const manifest = loadManifest();
  const entry = manifest.documents.find((document) => document.slug === options.slug);
  if (!entry) {
    throw new Error(`No manifest entry found for slug "${options.slug}".`);
  }

  const payload = {
    to: entry.notificationEmail,
    subject: `KIRegister Veröffentlichung: ${entry.title}`,
    body: buildBody(entry),
    publishedUrl: entry.publishedUrl,
    deletePath: entry.deletePath,
    sourceFileUrl: entry.sourceFileUrl,
    deleteUrl: entry.deleteUrl,
  };

  if (options.field === 'json') {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (!(options.field in payload)) {
    throw new Error(`Unsupported --field value "${options.field}".`);
  }

  process.stdout.write(`${payload[options.field]}\n`);
}

main();
