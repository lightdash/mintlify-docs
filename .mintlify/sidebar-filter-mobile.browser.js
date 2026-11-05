(async () => {
  async function waitFor(find) {
    const deadline = performance.now() + 3000;
    while (performance.now() < deadline) {
      const result = find();
      if (result) return result;
      await new Promise(requestAnimationFrame);
    }
    throw new Error('Mobile navigation did not reach its expected state');
  }
  const open = () => [...document.querySelectorAll('button')]
    .find((button) => button.textContent.startsWith('Navigation'))?.click();
  open();
  const input = await waitFor(() => document.querySelector('#mobile-nav input[aria-label="Filter navigation"]'));
  input.value = 'dashboard';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const root = document.querySelector('#mobile-nav');
  const picker = root.querySelector('[data-nav-filter-controls]');
  if (!picker.getBoundingClientRect().height || picker.getBoundingClientRect().bottom > input.getBoundingClientRect().top) {
    throw new Error('Mobile tab picker remains visible above the filter');
  }
  const link = root.querySelector('.nav-filter-results a[href="/explore/dashboards"]');
  if (!link) throw new Error('Mobile filter finds collapsed dashboard pages');
  link.click();
  await waitFor(() => location.pathname === '/explore/dashboards' && !document.querySelector('#mobile-nav'));
  open();
  const reopened = await waitFor(() => document.querySelector('#mobile-nav input[aria-label="Filter navigation"]'));
  if (reopened.value) throw new Error('Selecting a mobile result clears the query when reopening the drawer');
  reopened.value = 'dashboard';
  reopened.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#mobile-nav .nav-filter-field button').click();
  if (reopened.value || document.activeElement !== reopened) throw new Error('Clear restores navigation and focuses the input');
  return 'PASS: mobile mount, tab picker placement, result navigation, drawer dismissal, cleared query after selection, clear focus';
})();
