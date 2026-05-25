/* akhanda-os website
 * Renders and filters the tools list from data/tools.json.
 * Background visuals are pure CSS (bindu watermark in body::before).
 */

// -------- Tools list (only on /tools.html) --------
(async function toolsList () {
  const grid     = document.getElementById('toolgrid');
  const search   = document.getElementById('toolsearch');
  const chipBar  = document.getElementById('chips');
  const counter  = document.getElementById('toolcount');
  if (!grid) return;

  let data;
  try {
    const res = await fetch('data/tools.json');
    data = await res.json();
  } catch (e) {
    grid.innerHTML = '<p class="muted">Failed to load tools.json. Refresh the page.</p>';
    return;
  }

  const domainById = Object.fromEntries(data.domains.map(d => [d.id, d]));
  let activeDomain = 'all';
  let query = '';

  // Build chip filter bar
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

  // Build tool cards (built once, hidden/shown on filter)
  for (const t of data.tools) {
    const d = domainById[t.domain] || { name: t.domain, color: '#888' };
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
    grid.appendChild(card);
  }

  function applyFilters () {
    const q = query.trim().toLowerCase();
    let shown = 0;
    for (const card of grid.children) {
      const matchDomain = activeDomain === 'all' || card.dataset.domain === activeDomain;
      const matchQuery  = !q || card.dataset.search.includes(q);
      const visible = matchDomain && matchQuery;
      card.classList.toggle('hidden', !visible);
      if (visible) shown++;
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
