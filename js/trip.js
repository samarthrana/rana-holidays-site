// Rana Holidays: trip page (day accordion, expand all, section tabs).

function setDay(day, open) {
  day.classList.toggle('open', open);
  $('.day-head', day).setAttribute('aria-expanded', String(open));
  $('.day-body', day).hidden = !open;
}
$$('.day-head').forEach(head => head.addEventListener('click', () => setDay(head.closest('.day'), head.getAttribute('aria-expanded') !== 'true')));

const expand = $('.sh-expand');
expand.addEventListener('click', () => {
  const open = expand.getAttribute('aria-pressed') !== 'true';
  expand.setAttribute('aria-pressed', String(open));
  expand.textContent = open ? 'Collapse all days' : 'Expand all days';
  $$('.day').forEach(d => setDay(d, open));
});

// Section tabs are plain links (the browser scrolls); highlight the one clicked, then whichever section is in view
const tabs = $$('.sh-tabs a');
const highlight = id => tabs.forEach(a => {
  const on = a.hash === '#' + id;
  a.classList.toggle('on', on);
  if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
});
const sections = $$('.sh-sec'), tabBar = $('.sh-tabs');
let ticking = false;
function current() {
  ticking = false;
  const line = tabBar.getBoundingClientRect().bottom + 40;   // a section is current once its top passes just under the tabs
  const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  highlight((atEnd ? sections.at(-1) : sections.filter(s => s.getBoundingClientRect().top <= line).at(-1) || sections[0]).id);
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(current); } }, { passive: true });
current();
