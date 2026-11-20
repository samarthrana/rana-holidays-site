// Rana Holidays: shared by the home page and the trip pages. Needs site-data.js.

// Old addresses (bookmarks, shared links) still open the page; the address bar then shows the clean one:
// /trips/goa.html → /trips/goa, /index.html#fleet → /#fleet, /index → /. Same folder, so every relative link stays
// the same; no new history entry, so Back still leaves the page. Only on the website itself (not a file opened from disk).
try {
  const clean = location.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '');
  if (clean !== location.pathname && /^https?:$/.test(location.protocol)) {
    history.replaceState(history.state, '', location.origin + clean + location.search + location.hash);
  }
} catch (e) { /* the address bar is cosmetic: never stop the page over it */ }

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const icon = id => `<svg class="ic"><use href="#${id}"/></svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const waLink = text => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
const scrollMode = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

// A list that opens under a box shows 4 full rows and half of the 5th, so it is plain that more scroll into view
// (sized from the real rows: a long name wraps to two lines on small phones). Never taller than 60% of the screen.
function fitList(list, rowSel) {
  list.style.maxHeight = '';
  list.scrollTop = 0;
  const fifth = $$(rowSel, list)[4];
  if (!fifth) return;
  const r = fifth.getBoundingClientRect();
  list.style.maxHeight = `min(${Math.round(r.top - list.getBoundingClientRect().top + r.height / 2)}px, 60vh)`;
}

// role="tab" lists: only the selected tab is in the Tab order; Left/Right/Home/End move between tabs
function syncTabs(list) {
  $$('[role="tab"]', list).forEach(t => { t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1; });
}
document.addEventListener('keydown', e => {
  const tab = e.target.closest('[role="tab"]');
  if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  const tabs = $$('[role="tab"]', tab.parentElement), i = tabs.indexOf(tab);
  const next = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs.at(-1) : tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
  e.preventDefault(); next.click(); next.focus();
});

// Route lines fill in once they are well on screen (hidden cards fill in when their tab is shown)
const routeObserver = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('drawn'); routeObserver.unobserve(en.target); }
}), { threshold: 0.6 }) : null;
$$('.route-line').forEach(l => (routeObserver ? routeObserver.observe(l) : l.classList.add('drawn')));

// Phone menu
const menuBtn = $('#menuBtn'), nav = $('#nav');
menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', String(nav.classList.toggle('open'))));
$$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

// Packages menu. Wide screens: a mouse opens it by hovering (a short pause before it closes, so the pointer can travel
// down to it); a tap, click, Enter or Space toggles it; Esc, a click elsewhere or tabbing away closes it.
// Phones (≤960px): the same list opens inside the ☰ menu.
const pkBtn = $('#pkBtn'), pkMenu = $('#pkMenu'), pkBox = pkBtn.parentElement;
const wideNav = () => matchMedia('(min-width: 961px)').matches;
let pkTimer;
function setPk(open) {
  clearTimeout(pkTimer);
  pkMenu.hidden = !open;
  pkBtn.setAttribute('aria-expanded', String(open));
}
// a mouse click on a menu the pointer already opened keeps it open; keyboard (detail 0) and touch toggle it
pkBtn.addEventListener('click', e => setPk(e.detail > 0 && wideNav() && matchMedia('(hover: hover)').matches ? true : pkMenu.hidden));
pkBox.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && wideNav()) setPk(true); });
pkBox.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && wideNav()) pkTimer = setTimeout(() => setPk(false), 250); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || pkMenu.hidden) return;
  const back = pkBox.contains(document.activeElement);
  setPk(false);
  if (back) pkBtn.focus();
});
document.addEventListener('pointerdown', e => { if (!pkMenu.hidden && wideNav() && !pkBox.contains(e.target)) setPk(false); });
pkBox.addEventListener('focusout', e => { if (wideNav() && e.relatedTarget && !pkBox.contains(e.relatedTarget)) setPk(false); });
$$('a', pkMenu).forEach(a => a.addEventListener('click', () => setPk(false)));
