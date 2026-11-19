// Rana Holidays: trip search (top bar on every page, and the home page hero). Needs site-data.js and common.js.
// findTrips() is plain logic with no page access, so it can be tested on its own; searchBox() wires up one search form.

// "Pashupatinath Temple!" -> "pashupatinath temple": case, accents and punctuation never decide a match
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

// How well one typed word fits one word of a place: 2 = it starts the word ("kath" → kathmandu),
// 1 = a small typo ("kashmeer" → kashmir; 5+ letters only, so "bali" never turns into "balapitiya"), 0 = no fit
function wordFit(q, w) {
  if (w.startsWith(q)) return 2;
  if (q.length < 5) return 0;
  const allowed = q.length >= 7 ? 2 : 1;
  return Math.min(editDistance(q, w.slice(0, q.length)), editDistance(q, w)) <= allowed ? 1 : 0;
}

// Each trip's searchable phrases: its name, region and route stops count more than places inside the itinerary
const termCache = new Map();
function termsOf(p) {
  if (!termCache.has(p.id)) {
    termCache.set(p.id, [[p.name, 2], [p.region, 2], ...p.route.map(([c]) => [c, 2]), ...p.places.map(x => [x, 1])]
      .map(([text, tier]) => ({ text, tier, words: fold(text).split(' ') })));
  }
  return termCache.get(p.id);
}

// Trips for a query, best first. Every typed word must fit a word of the same phrase ("phi phi" → "Phi Phi Islands").
// place: the itinerary place that matched, so the suggestion can say why the trip came up (null for name/region/route).
function findTrips(query, packages) {
  const qs = fold(query).split(' ').filter(Boolean);
  if (!qs.length) return packages.map(p => ({ p, place: null }));
  const hits = [];
  packages.forEach((p, order) => {
    let best = null;
    for (const t of termsOf(p)) {
      let fit = 0;
      for (const q of qs) {
        const f = Math.max(...t.words.map(w => wordFit(q, w)));
        if (!f) { fit = 0; break; }
        fit += f;
      }
      const score = fit && t.tier * 10 + fit;
      if (score && (!best || score > best.score)) best = { score, place: t.tier === 1 ? t.text : null };
    }
    if (best) hits.push({ p, place: best.place, score: best.score, order });
  });
  return hits.sort((a, b) => b.score - a.score || a.order - b.order);
}

// One search form: a combobox whose listbox suggests trips; no match offers a custom plan on WhatsApp
function searchBox(form) {
  const input = $('input', form), list = $('[role="listbox"]', form), none = $('.search-none', form), status = $('.search-status', form);
  const root = form.dataset.root;                       // '' on the home page, '../' on trip pages
  let opts = [], active = -1;

  const option = (r, i) => `<a class="search-opt" role="option" id="${list.id}-${i}" href="${root}${r.p.url}" aria-selected="false">`
    + `<b>${esc(r.p.name)}</b><small>${r.place ? `Includes ${esc(r.place)} · ` : ''}${esc(r.p.duration)}</small></a>`;

  function setActive(i) {
    opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
    active = i;
    if (i >= 0) { input.setAttribute('aria-activedescendant', opts[i].id); opts[i].scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  }

  function close() {
    list.hidden = none.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    setActive(-1);
  }

  function show() {
    const q = input.value.trim(), hits = findTrips(q, PACKAGES);
    if (!hits.length) {                                    // owner's choice: say so, and offer to plan it
      none.innerHTML = `<p>No ready trip for “${esc(q)}” yet. We can plan one for you.</p>`
        + `<a class="btn btn-wa btn-sm" href="${esc(waLink(`Hi Rana Holidays! I'd like a trip to ${q}.`))}" target="_blank" rel="noopener">${icon('i-wa')} Ask on WhatsApp</a>`;
      list.hidden = true; none.hidden = false;
      input.setAttribute('aria-expanded', 'false');
      status.textContent = `No ready trip for ${q}. You can ask us to plan one on WhatsApp.`;
      opts = []; setActive(-1);
      return;
    }
    let i = 0;
    if (q) list.innerHTML = hits.slice(0, 8).map(r => option(r, i++)).join('');
    else list.innerHTML = [['india', 'India'], ['intl', 'International']].map(([g, label]) =>   // empty box: every trip we offer
      `<div role="group" aria-label="${label}"><p class="search-group" aria-hidden="true">${label}</p>`
      + hits.filter(r => r.p.group === g).map(r => option(r, i++)).join('') + '</div>').join('');
    opts = $$('[role="option"]', list);
    none.hidden = true; list.hidden = false;
    fitList(list, '.search-opt');
    input.setAttribute('aria-expanded', 'true');
    status.textContent = q ? `${opts.length} ${opts.length === 1 ? 'trip' : 'trips'} found` : `${opts.length} trips`;
    setActive(-1);
  }

  input.addEventListener('focus', () => {
    // phones: a box low on the screen (the hero's) moves up under the top bar, so the keyboard can't hide the suggestions
    if (innerWidth <= 720 && !form.closest('.site-header')) {
      const by = form.getBoundingClientRect().top - $('.site-header').offsetHeight - 12;
      if (by > 0) scrollBy({ top: by, behavior: scrollMode() });
    }
    show();
  });
  input.addEventListener('input', show);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.hidden) show();
      const step = e.key === 'ArrowDown' ? 1 : -1;        // wraps round; Up from the box goes to the last trip
      if (opts.length) setActive(active < 0 && step < 0 ? opts.length - 1 : (active + step + opts.length) % opts.length);
    } else if (e.key === 'Escape') {
      e.preventDefault();                                  // a search box's own Esc empties it, which would reopen the full list
      close();                                             // (in the top bar the same Esc then closes the panel)
    }
  });
  form.addEventListener('submit', e => {                   // Enter: the highlighted trip, else the best match
    e.preventDefault();
    const o = opts[active] || (input.value.trim() && opts[0]);
    if (o) location.href = o.href;
  });
  form.addEventListener('focusout', e => { if (!form.contains(e.relatedTarget)) close(); });
  list.addEventListener('mousedown', e => e.preventDefault());   // keep focus in the box while a suggestion is clicked
}

if (typeof document === 'object') {                        // only in a browser (the matching logic is also tested on its own)
  $$('.trip-search').forEach(searchBox);

  // Top bar: the search button opens a panel under the bar; Esc or a click outside closes it
  const searchBtn = $('#searchBtn'), panel = $('#searchPanel');
  const setPanel = open => {
    panel.hidden = !open;
    searchBtn.setAttribute('aria-expanded', String(open));
    if (open) $('input', panel).focus();
  };
  searchBtn.addEventListener('click', () => setPanel(panel.hidden));
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { setPanel(false); searchBtn.focus(); } });
  document.addEventListener('pointerdown', e => {
    if (!panel.hidden && !panel.contains(e.target) && !searchBtn.contains(e.target)) setPanel(false);
  });
}
