import assert from 'node:assert/strict';
import test from 'node:test';

import { renderPolicyMarkdown } from './render-policy-markdown';

test('renderPolicyMarkdown escapes raw HTML before formatting markdown', () => {
  const rendered = renderPolicyMarkdown(
    '# Titel\n\n<script>alert(1)</script>\n**sicher**',
  );

  assert.match(rendered, /<h1 class="text-xl font-bold mt-6 mb-3">Titel<\/h1>/);
  assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(rendered, /<script>/);
  assert.match(rendered, /<strong>sicher<\/strong>/);
});
