import assert from 'node:assert/strict';
import test from 'node:test';
import { apiSidebarEntries } from '../scripts/docs/lib/sidebar-navigation.ts';

test('API navigation uses Mintlify titles and URLs for summaries and unnamed operations', () => {
  const entries = apiSidebarEntries({ paths: {
    '/api/v1/projects/{projectUuid}/code/homepages': {
      get: { tags: ['Projects'] },
    },
    '/api/v1/spaces': {
      get: { tags: ['Spaces'], summary: 'List spaces as code' },
      post: { tags: ['Spaces'], summary: 'List spaces as code' },
    },
  } }, ['Reference']);
  assert.deepEqual(entries, [
    { title: 'Get apiv1projects codehomepages', href: '/api-reference/projects/get-apiv1projects-codehomepages', parents: ['Reference', 'Projects'] },
    { title: 'List spaces as code', href: '/api-reference/spaces/list-spaces-as-code', parents: ['Reference', 'Spaces'] },
    { title: 'List spaces as code', href: '/api-reference/spaces/list-spaces-as-code-1', parents: ['Reference', 'Spaces'] },
  ]);
});

test('API navigation respects visibility and explicit Mintlify labels and URLs', () => {
  const entries = apiSidebarEntries({ paths: { '/items': {
    parameters: [],
    get: { summary: 'Hidden', 'x-hidden': true },
    delete: { summary: 'Excluded', 'x-excluded': true },
    post: { summary: 'Create', 'x-mint': { href: '/custom/create', metadata: { sidebarTitle: 'Add an item' } } },
  } } }, ['Reference']);
  assert.deepEqual(entries, [{ title: 'Add an item', href: '/custom/create', parents: ['Reference', 'API Reference'] }]);
});
