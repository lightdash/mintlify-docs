(() => {
  const normalize = (text) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const queries = new Map();
  let controllers = [];

  function mount() {
    const tabs = window.lightdashSidebarNavigation;
    if (!tabs) return;
    const path = document.documentElement.dataset.currentPath || location.pathname;
    const tab = tabs.find((tab) => tab.entries.some((entry) => entry.href === path))
      ?? tabs.find((tab) => tab.title === 'API' && path.startsWith('/api-reference/'));
    if (!tab) return;
    controllers.forEach((controller) => controller.abort());
    controllers = [];
    document.querySelectorAll('.nav-filter').forEach((element) => element.remove());

    for (const root of document.querySelectorAll('#sidebar, #mobile-nav')) {
      const navigation = root.querySelector('#navigation-items');
      if (!navigation) continue;
      const controller = new AbortController();
      controllers.push(controller);
      const options = { signal: controller.signal };
      const entries = tab.entries.map((entry) => ({
        ...entry,
        text: normalize([...entry.parents, entry.title].join(' ')),
      }));

      const panel = document.createElement('div');
      panel.className = 'nav-filter';
      panel.innerHTML = `
        <div class="nav-filter-field">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M7 12h10M10 17h4"/></svg>
          <input type="text" aria-label="Filter navigation" placeholder="Filter navigation…" autocomplete="off" spellcheck="false">
          <button type="button" aria-label="Clear navigation filter" hidden><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="m6 6 12 12M6 18 18 6"/></svg></button>
        </div>
        <div class="nav-filter-status" role="status" aria-live="polite" aria-atomic="true"></div>
        <div class="nav-filter-results" hidden></div>`;
      const tabPicker = root.id === 'mobile-nav'
        ? [...navigation.children].find((element) => element.querySelector('button[aria-haspopup="menu"]'))
        : null;
      if (tabPicker) {
        tabPicker.setAttribute('data-nav-filter-controls', '');
        tabPicker.after(panel);
      } else navigation.before(panel);
      const input = panel.querySelector('input');
      const clear = panel.querySelector('button');
      const results = panel.querySelector('.nav-filter-results');
      const status = panel.querySelector('.nav-filter-status');
      results.id = `${root.id}-filter-results`;
      input.setAttribute('aria-controls', results.id);

      function update(value) {
        input.value = value;
        queries.set(tab.title, value);
        const terms = normalize(value).trim().split(/\s+/).filter(Boolean);
        const active = terms.length > 0;
        if (tabPicker) {
          navigation.hidden = false;
          navigation.toggleAttribute('data-nav-filter-active', active);
        } else navigation.hidden = active;
        results.hidden = !active;
        clear.hidden = !value;
        status.textContent = '';
        results.replaceChildren();
        if (!active) return;
        const matches = entries.filter((entry) => terms.every((term) => entry.text.includes(term)));
        status.textContent = `${matches.length} ${matches.length === 1 ? 'page' : 'pages'} in ${tab.title}`;
        if (!matches.length) {
          const empty = document.createElement('p');
          empty.className = 'nav-filter-empty';
          empty.textContent = 'No matching pages. Try another name.';
          results.append(empty);
          return;
        }
        const list = document.createElement('ul');
        for (const entry of matches) {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = entry.href;
          if (entry.href === path) link.setAttribute('aria-current', 'page');
          const title = document.createElement('span');
          title.textContent = entry.title;
          link.append(title);
          if (entry.parents.length) {
            const context = document.createElement('small');
            entry.parents.forEach((parent, index) => {
              if (index) {
                const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                chevron.setAttribute('aria-hidden', 'true');
                chevron.setAttribute('viewBox', '0 0 24 24');
                chevron.setAttribute('fill', 'none');
                chevron.setAttribute('stroke', 'currentColor');
                chevron.setAttribute('stroke-width', '2');
                chevron.setAttribute('stroke-linecap', 'round');
                chevron.setAttribute('stroke-linejoin', 'round');
                chevron.innerHTML = '<path d="m9 6 6 6-6 6"/>';
                context.append(' ', chevron, ' ');
              }
              const label = document.createElement('span');
              label.textContent = parent;
              context.append(label);
            });
            link.append(context);
          }
          item.append(link);
          list.append(item);
        }
        results.append(list);
      }
      input.addEventListener('input', () => update(input.value), options);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && input.value) {
          event.preventDefault();
          event.stopPropagation();
          update('');
        }
        if (event.key === 'ArrowDown' && !results.hidden) {
          event.preventDefault();
          results.querySelector('a')?.focus();
        }
      }, options);
      clear.addEventListener('click', () => { update(''); input.focus(); }, options);
      results.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const href = link.getAttribute('href');
        update('');
        if (typeof window.mintlify?.navigate !== 'function') return;
        event.preventDefault();
        if (href === path) {
          mount();
          requestAnimationFrame(() => {
            const sidebar = document.querySelector('#sidebar');
            const item = [...(sidebar?.querySelectorAll('li[id]') ?? [])].find((item) => item.id === href);
            const row = item?.querySelector(':scope > a, :scope > button');
            const viewport = row?.closest('[data-component-part="scroll-area-viewport"]');
            if (!viewport || !row.getClientRects().length) return;
            const bounds = row.getBoundingClientRect();
            const area = viewport.getBoundingClientRect();
            viewport.scrollTop += Math.min(0, bounds.top - area.top) || Math.max(0, bounds.bottom - area.bottom);
            row.focus({ preventScroll: true });
          });
        }
        if (root.id === 'mobile-nav') root.querySelector('button[aria-label="Close navigation"]')?.click();
        window.mintlify.navigate(href);
      }, options);
      update(queries.get(tab.title) ?? '');
    }
  }

  window.addEventListener('mintlify:navigate', mount);
  window.addEventListener('lightdash:navigation-ready', mount);
  document.addEventListener('DOMContentLoaded', mount, { once: true });
  // The mobile drawer mounts in a body portal independently of page navigation.
  const drawerObserver = new MutationObserver((records) => {
    if (!records.some((record) => record.addedNodes.length)) return;
    requestAnimationFrame(() => {
      if (document.querySelector('#mobile-nav #navigation-items')
        && !document.querySelector('#mobile-nav .nav-filter')) mount();
    });
  });
  drawerObserver.observe(document.body, { childList: true });
  mount();
})();
