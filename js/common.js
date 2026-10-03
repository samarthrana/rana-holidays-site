// Rana Holidays: shared by the home page and the trip pages.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const scrollMode = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

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
