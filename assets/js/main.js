/* akhanda-os tools page
 * Renders the tool catalogue grouped by domain (collapsible sections),
 * with a chip filter for quick narrowing and a live text search.
 * Background visuals are pure CSS (bindu watermark in body::before).
 */

(async function toolsList () {
  const grid    = document.getElementById('toolgrid');
  const search  = document.getElementById('toolsearch');
  const chipBar = document.getElementById('chips');
  const counter = document.getElementById('toolcount');
  if (!grid) return;   // page that doesn't have the tools UI

  let data;
  try {
    const res = await fetch('data/tools.json');
    data = await res.json();
  } catch (e) {
    grid.innerHTML = '<p class="muted">Failed to load tools.json. Refresh the page.</p>';
    return;
  }

  const domainById = Object.fromEntries(data.domains.map(d => [d.id, d]));

  // Collapsed state per domain, persisted in localStorage.
  const STORAGE_KEY = 'akhanda.collapsedDomains';
  const collapsed = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  const saveCollapsed = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));

  let activeDomain = 'all';
  let query = '';

  // -------- chip bar (top, single-select filter) --------
  const allChip = document.createElement('button');
  allChip.className = 'chip active';
  allChip.textContent = `all (${data.tools.length})`;
  allChip.dataset.id = 'all';
  chipBar.appendChild(allChip);
  for (const d of data.domains) {
    const n = data.tools.filter(t => t.domain === d.id).length;
    if (!n) continue;
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = `${d.name} (${n})`;
    chip.dataset.id  = d.id;
    chip.style.setProperty('--c', d.color);
    chipBar.appendChild(chip);
  }

  // -------- grouped sections, one per domain --------
  // Build the sections in domain-declared order.
  const sections = {};   // domain id -> { section, list, countEl }

  for (const d of data.domains) {
    const tools = data.tools.filter(t => t.domain === d.id);
    if (!tools.length) continue;

    const section = document.createElement('section');
    section.className = 'domain-section';
    section.dataset.domain = d.id;
    section.style.setProperty('--c', d.color);
    if (collapsed.has(d.id)) section.classList.add('collapsed');

    const header = document.createElement('button');
    header.className = 'domain-header';
    header.type = 'button';
    header.setAttribute('aria-expanded', !collapsed.has(d.id));
    header.innerHTML = `
      <span class="caret" aria-hidden="true">&#9656;</span>
      <span class="domain-name">${escapeHtml(d.name)}</span>
      <span class="domain-count">${tools.length}</span>
      <span class="domain-blurb">${escapeHtml(d.blurb || '')}</span>
    `;
    header.addEventListener('click', () => {
      const isCollapsed = section.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', !isCollapsed);
      if (isCollapsed) collapsed.add(d.id); else collapsed.delete(d.id);
      saveCollapsed();
    });
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'domain-tools toolgrid';

    for (const t of tools) {
      const card = document.createElement('article');
      card.className = 'tool';
      card.style.setProperty('--c', d.color);
      card.dataset.domain = t.domain;
      card.dataset.search = (t.name + ' ' + t.desc).toLowerCase();
      card.innerHTML = `
        <div class="row">
          <span class="name">${t.url
            ? `<a href="${t.url}" target="_blank" rel="noopener">${escapeHtml(t.name)}</a>`
            : escapeHtml(t.name)}</span>
          <span class="domain">${escapeHtml(d.name)}</span>
        </div>
        <p>${escapeHtml(t.desc)}</p>
      `;
      list.appendChild(card);
    }
    section.appendChild(list);
    grid.appendChild(section);

    sections[d.id] = { section, list, total: tools.length };
  }

  // -------- helpers: bulk expand / collapse --------
  function setAll(state) {
    for (const id in sections) {
      sections[id].section.classList.toggle('collapsed', state);
      if (state) collapsed.add(id); else collapsed.delete(id);
    }
    saveCollapsed();
  }

  // Inject expand-all / collapse-all controls into the filter bar
  const bulk = document.createElement('div');
  bulk.className = 'bulk-controls';
  bulk.innerHTML = `
    <button id="expand-all"   type="button" class="bulk-btn">expand all</button>
    <button id="collapse-all" type="button" class="bulk-btn">collapse all</button>
  `;
  chipBar.parentElement.appendChild(bulk);
  bulk.querySelector('#expand-all').addEventListener('click',   () => setAll(false));
  bulk.querySelector('#collapse-all').addEventListener('click', () => setAll(true));

  // -------- filtering --------
  function applyFilters () {
    const q = query.trim().toLowerCase();
    let shown = 0;

    for (const id in sections) {
      const { section, list } = sections[id];
      const matchDomain = activeDomain === 'all' || id === activeDomain;
      let domainShown = 0;

      for (const card of list.children) {
        const matchQuery = !q || card.dataset.search.includes(q);
        const visible = matchDomain && matchQuery;
        card.classList.toggle('hidden', !visible);
        if (visible) { shown++; domainShown++; }
      }

      // Hide the entire section when nothing in it matches
      section.classList.toggle('section-hidden', domainShown === 0);

      // If a chip was clicked, auto-expand that section so user sees results
      if (activeDomain === id && q === '') {
        section.classList.remove('collapsed');
        collapsed.delete(id);
        saveCollapsed();
      }
    }
    counter.textContent = `${shown} / ${data.tools.length} tools`;
  }

  chipBar.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    for (const c of chipBar.children) c.classList.remove('active');
    chip.classList.add('active');
    activeDomain = chip.dataset.id;
    applyFilters();
  });
  search.addEventListener('input', e => {
    query = e.target.value;
    applyFilters();
  });

  applyFilters();
})();

function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
