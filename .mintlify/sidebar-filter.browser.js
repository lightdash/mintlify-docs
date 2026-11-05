(async () => {
  const navigate = (path) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Navigation timed out: ${path}`)), 10000);
    window.addEventListener('mintlify:navigate', () => { clearTimeout(timeout); resolve(); }, { once: true });
    window.mintlify.navigate(path);
  });
  const input = document.querySelector('#sidebar input[aria-label="Filter navigation"]');
  if (!input) throw new Error('Sidebar has an accessible navigation filter');
  const filter = (value) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  filter('dashboard');
  const results = document.querySelector('.nav-filter-results');
  if (!results?.textContent.toLowerCase().includes('dashboard')) {
    throw new Error('Finds dashboard pages inside collapsed groups');
  }
  if (results.textContent.includes('Service Accounts')) throw new Error('Only matches the Docs tab');
  filter('DÁSHBOARD FILTERS');
  if (!results.querySelector('a[href="/explore/dashboards/filter"]')) {
    throw new Error('Matches multiple words regardless of case and accents');
  }
  filter('no-navigation-title-matches-this');
  if (!results.textContent.includes('No matching pages')) throw new Error('Explains empty results');
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  if (input.value || document.querySelector('#sidebar #navigation-items').hidden) {
    throw new Error('Escape clears filtering and restores navigation');
  }
  filter('dashboard');
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  if (!results.contains(document.activeElement)) throw new Error('Down Arrow focuses a result');
  await navigate('/api-reference/v1/introduction');
  const apiInput = document.querySelector('#sidebar input[aria-label="Filter navigation"]');
  if (apiInput.value) throw new Error('API has its own query');
  apiInput.value = 'scheduler';
  const started = performance.now();
  apiInput.dispatchEvent(new Event('input', { bubbles: true }));
  const elapsed = performance.now() - started;
  const apiResults = document.querySelector('#sidebar .nav-filter-results');
  if (!apiResults.querySelector('a[href*="scheduler"]')) throw new Error('Finds unvisited API endpoint titles');
  if (apiResults.querySelector('a[href="/explore/dashboards"]')) throw new Error('API excludes Docs pages');
  await navigate('/introduction');
  if (document.querySelector('#sidebar input').value !== 'dashboard') throw new Error('Retains each tab query');
  if (document.querySelectorAll('#sidebar .nav-filter').length !== 1) throw new Error('No duplicate filter after navigation');
  const destination = '/explore/dashboards/filter';
  const arrival = new Promise((resolve) => window.addEventListener('mintlify:navigate', resolve, { once: true }));
  document.querySelector(`#sidebar .nav-filter-results a[href="${destination}"]`).click();
  await arrival;
  if (document.querySelector('#sidebar input').value || document.querySelector('#sidebar #navigation-items').hidden) {
    throw new Error('Selecting a result clears the filter and restores the native navigation');
  }
  async function expectInView(destination) {
    const deadline = performance.now() + 2000;
    let inView = false;
    while (performance.now() < deadline) {
      const row = document.querySelector(`#sidebar li[id="${destination}"] > a`);
      const viewport = row?.closest('[data-component-part="scroll-area-viewport"]');
      if (row && viewport) {
        const bounds = row.getBoundingClientRect();
        const area = viewport.getBoundingClientRect();
        inView = bounds.height > 0 && bounds.top >= area.top - 1 && bounds.bottom <= area.bottom + 1;
      }
      if (inView) break;
      await new Promise(requestAnimationFrame);
    }
    if (!inView) throw new Error(`The selected page is visible in the native sidebar: ${destination}`);
  }
  await expectInView(destination);
  await navigate('/api-reference/v1/introduction');
  const last = window.lightdashSidebarNavigation.find((tab) => tab.title === 'API').entries.at(-1);
  const endpointInput = document.querySelector('#sidebar input');
  endpointInput.value = last.title;
  endpointInput.dispatchEvent(new Event('input', { bubbles: true }));
  const endpointArrival = new Promise((resolve) => window.addEventListener('mintlify:navigate', resolve, { once: true }));
  [...document.querySelectorAll('#sidebar .nav-filter-results a')].find((link) => link.getAttribute('href') === last.href).click();
  await endpointArrival;
  if (document.querySelector('#sidebar input').value) throw new Error('Selecting an API result clears its filter');
  await expectInView(last.href);
  const currentInput = document.querySelector('#sidebar input');
  currentInput.value = last.title;
  currentInput.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#sidebar [data-component-part="scroll-area-viewport"]').scrollTop = 0;
  const contentScroll = window.scrollY;
  [...document.querySelectorAll('#sidebar .nav-filter-results a')].find((link) => link.getAttribute('href') === last.href).click();
  await expectInView(last.href);
  if (window.scrollY !== contentScroll) throw new Error('Revealing the current page leaves article scroll unchanged');
  return `PASS: both tabs, matching, keyboard access, clear on selection, destination in view, current-page selection, article scroll unchanged; API filter ${elapsed.toFixed(1)}ms`;
})();
