// Rana Holidays: home page (package tabs, trip builder, ticket, fleet). Needs site-data.js, data.js, logic.js, common.js.

const pkgById = Object.fromEntries(PACKAGES.map(p => [p.id, p]));
const fleetById = Object.fromEntries(FLEET.map(v => [v.id, v]));
const CHARDHAM = { id: 'chardham', name: 'Char Dham Yatra', duration: '',
  route: [['Yamunotri', ''], ['Gangotri', ''], ['Kedarnath', ''], ['Badrinath', '']], start: 'Haridwar' };
const icon = id => `<svg class="ic"><use href="#${id}"/></svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const waLink = text => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
const daysOf = pkg => +((pkg.duration.match(/(\d+)\s*D/) || [])[1] || 0);
const plural = (n, one, many) => `${n} ${n == 1 ? one : many}`;
// Typed numbers are clamped to the input's own min/max and rounded (no "-3 people", "2.5 days")
function num(id) {
  const i = document.getElementById(id), v = Math.round(+i.value);
  return Math.min(+i.max, Math.max(+i.min, Number.isFinite(v) && i.value !== '' ? v : +i.min));
}

// ---------- shared pieces ----------
function chips(container, name, items, type = 'radio') {
  container.innerHTML = items.map(([value, label, ico]) =>
    `<label class="chip-opt"><input type="${type}" name="${name}" value="${esc(value)}"><span>${ico ? icon(ico) : ''}${esc(label)}</span></label>`
  ).join('');
}
function pick(form, name, value) {
  const input = $$(`input[name="${name}"]`, form).find(i => i.value === String(value));
  if (input) { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); }
}
const checked = (form, name) => $$(`input[name="${name}"]:checked`, form).map(i => i.value);

// Route line for the ticket (cards and trip pages carry the same markup in their HTML)
function routeHTML(start, stops) {
  const all = [[start, 'start'], ...stops];
  return `<ol class="route-line${all.length >= 5 ? ' many' : ''}" style="--n:${all.length}">${all.map(([c, n], i) =>
    `<li style="--i:${i}"><i class="dot"></i><b>${esc(c)}</b><small>${esc(n)}</small></li>`).join('')}</ol>`;
}
function draw(el) { el.classList.remove('drawn'); void el.offsetWidth; el.classList.add('drawn'); }

// Steppers (−/+ around a number input)
document.addEventListener('click', e => {
  const b = e.target.closest('.stepper button');
  if (!b) return;
  const input = $('#' + b.parentElement.dataset.for);
  input.value = Math.min(+input.max, Math.max(+input.min, num(input.id) + +b.dataset.d));
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

document.addEventListener('change', e => {
  if (e.target.matches('input[type="number"]')) e.target.value = num(e.target.id);
}, true);

// ---------- holiday form ----------
const hForm = $('#holidayForm'), vForm = $('#vehicleForm');
chips($('#whoChips'), 'who', WHO.map(([w]) => [w, w]));
chips($('#vibeChips'), 'vibe', VIBES.map(v => [v.id, v.id]));
chips($('#hNeeds'), 'needs', NEEDS_HOLIDAY.map(n => [n, n]), 'checkbox');

const now = new Date();
const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() + i, 1));
chips($('#monthChips'), 'month', months.map(d => [
  d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  d.toLocaleString('en-GB', { month: 'short' }).slice(0, 3) + " '" + String(d.getFullYear()).slice(2)]));  // "Sep", not "Sept"

function fillDest(vibe) {
  const v = VIBES.find(x => x.id === vibe);
  const list = (v ? v.pkgs : PACKAGES.map(p => p.id)).map(id => [id, pkgById[id].name]);
  if (vibe === 'Spiritual') list.unshift(['chardham', 'Char Dham Yatra']);
  list.push(['suggest', 'Suggest for me', 'i-star']);
  chips($('#destChips'), 'dest', list);
}
fillDest('');

hForm.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'who') $('#hN').value = WHO.find(([w]) => w === t.value)[1];
  if (t.name === 'vibe') { fillDest(t.value); setBg((VIBES.find(v => v.id === t.value) || {}).img); }
  if (t.name === 'dest' && pkgById[t.value]) $('#hDays').value = daysOf(pkgById[t.value]);
  if (t.name === 'dest' && t.value === 'chardham') $('#hDays').value = 10;
  render(); announce();
});
hForm.addEventListener('input', render);

function holidayState() {
  const dest = checked(hForm, 'dest')[0];
  return {
    who: checked(hForm, 'who')[0], n: num('hN'), vibe: checked(hForm, 'vibe')[0],
    pkg: dest === 'chardham' ? CHARDHAM : pkgById[dest], month: checked(hForm, 'month')[0],
    days: num('hDays'), needs: checked(hForm, 'needs'), note: hForm.note.value
  };
}

// ---------- vehicle form ----------
$('#placeList').innerHTML = PLACES.map(p => `<option value="${esc(p)}">`).join('');
$('#vDate').min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
chips($('#vehicleChips'), 'vehicle', FLEET.map(v => [v.id, v.name]));
chips($('#typeChips'), 'type', TRIP_TYPES.map(t => [t, t]));
chips($('#vNeeds'), 'needs', NEEDS_VEHICLE.map(n => [n, n]), 'checkbox');
pick(vForm, 'type', 'Outstation');

let manualVehicle = false, switchNote = ''; // switchNote stays until the visitor picks a vehicle again
function vehicleLabel(id, n) {
  if (id === 'urbania') return VEHICLE_LABEL[n <= 10 ? 'urbania10' : n <= 13 ? 'urbania13' : 'urbania17'];
  return VEHICLE_LABEL[id];
}
function suggest() {
  const n = num('vN'), s = suggestVehicle(n);
  const chipId = s.id.startsWith('urbania') ? 'urbania' : s.id;
  const chosen = fleetById[checked(vForm, 'vehicle')[0]];
  if (manualVehicle && chosen && n > chosen.cap) { // a picked vehicle that can't take the group is replaced, and we say so
    switchNote = `<br>${esc(chosen.name)} takes up to ${chosen.cap}, so we picked a vehicle that fits your group.`;
    manualVehicle = false;
  }
  $('#vHint').innerHTML = (s.id === 'multi'
    ? `For ${n} passengers we'll plan <b>more than one vehicle</b>.`
    : `Suggested for ${n}: <b>${esc(VEHICLE_LABEL[s.id])}</b>${s.alt ? ` · also fits: ${esc(fleetById[s.alt].name)}` : ''}`) + switchNote;
  if (!manualVehicle) {
    $$('input[name="vehicle"]', vForm).forEach(i => { i.checked = i.value === chipId; });
  }
}
vForm.addEventListener('change', e => {
  if (e.target.name === 'vehicle') { manualVehicle = true; switchNote = ''; suggest(); }
  if (e.target.id === 'vDate' && e.target.value && e.target.value < e.target.min) e.target.value = e.target.min;
  render(); announce();
});
// A vehicle the visitor picked stays picked; the hint keeps showing what fits.
vForm.addEventListener('input', e => { if (e.target.id === 'vN') suggest(); render(); });
suggest();

function vehicleState() {
  const n = num('vN'), id = checked(vForm, 'vehicle')[0];
  const label = !manualVehicle && suggestVehicle(n).id === 'multi' ? VEHICLE_LABEL.multi : id ? vehicleLabel(id, n) : '';
  return { from: vForm.from.value.trim() || 'Delhi NCR', to: vForm.to.value, date: vForm.date.value,
    days: num('vDays'), n, vehicle: label, type: checked(vForm, 'type')[0],
    needs: checked(vForm, 'needs'), note: vForm.note.value };
}

// ---------- mode switch ----------
let mode = 'holiday';
function setMode(m) {
  mode = m;
  $$('.mode-btn').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
  syncTabs($('.mode'));
  hForm.hidden = m !== 'holiday'; vForm.hidden = m !== 'vehicle';
  setBg(m === 'vehicle' ? 'images/vehicle-bg.jpg' : (VIBES.find(v => v.id === checked(hForm, 'vibe')[0]) || {}).img);
  render();
}
$$('.mode-btn').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

// Photo behind the ticket crossfades with the vibe
function setBg(src = 'images/hero.jpg') {
  const box = $('#ticketBg');
  if (box.dataset.src === src) return;
  box.dataset.src = src;
  const img = new Image(); img.src = src; img.alt = '';
  box.appendChild(img);
  void img.offsetWidth; // flush styles so the opacity transition runs (no rAF/timer race)
  img.classList.add('on');
  $$('img', box).forEach(i => { if (i !== img) { i.classList.remove('on'); setTimeout(() => i.remove(), 900); } });
}

// ---------- ticket ----------
let lastRoute = '';
function render() {
  const rows = [];
  let title, route = '';
  const link = $('#tLink');
  link.hidden = true;
  if (mode === 'holiday') {
    const s = holidayState();
    title = s.pkg ? s.pkg.name : s.vibe ? `A ${s.vibe.toLowerCase()} trip, planned for you` : s.who ? `${s.who} trip, where to?` : "Tell us who's going";
    if (s.pkg) route = routeHTML(s.pkg.start || (s.pkg.group === 'intl' ? 'Delhi ✈' : 'Delhi'), s.pkg.route);
    if (s.who) rows.push(['Travellers', `${s.who} · ${plural(s.n, 'person', 'people')}`]);
    if (s.vibe) rows.push(['Vibe', s.vibe]);
    rows.push(s.pkg ? ['Trip', s.pkg.name + (s.pkg.duration ? ` · ${s.pkg.duration}` : '')] : ['Trip', 'We suggest', true]);
    rows.push(s.month ? ['When', `${s.month} · ${plural(s.days, 'day', 'days')}`] : ['When', `${plural(s.days, 'day', 'days')} · any month`, true]);
    if (s.pkg && s.pkg.url) {
      rows.push(['From', `${s.pkg.price} ${s.pkg.per}`]);
      link.href = s.pkg.url; link.hidden = false;
    }
    if (s.needs.length) rows.push(['Needs', s.needs.join(', ')]);
  } else {
    const s = vehicleState();
    title = `${s.from} → ${s.to.trim() || 'where to?'}`;
    route = routeHTML(s.from, [[s.to.trim() || '…', plural(s.days, 'day', 'days')]]);
    rows.push(s.date ? ['Date', niceDate(s.date)] : ['Date', 'Pick a date', true]);
    rows.push(['Passengers', String(s.n)]);
    if (s.vehicle) rows.push(['Vehicle', s.vehicle]);
    if (s.type) rows.push(['Trip type', s.type]);
    if (s.needs.length) rows.push(['Needs', s.needs.join(', ')]);
  }
  $('#tTitle').textContent = title;
  $('#tRows').innerHTML = rows.map(([k, v, unset]) => `<div><dt>${esc(k)}</dt><dd${unset ? ' class="unset"' : ''}>${esc(v)}</dd></div>`).join('');
  $('#mbText').textContent = title; // phone bottom bar mini ticket
  const box = $('#tRoute');
  if (route !== lastRoute) {
    box.innerHTML = route; lastRoute = route;
    const line = $('.route-line', box);
    if (line) draw(line);
  }
}

// One short, polite announcement per choice (not on every keystroke)
function announce() { $('#tStatus').textContent = 'Your trip: ' + $('#tTitle').textContent; }

function message() {
  return mode === 'holiday' ? holidayMessage(holidayState()) : vehicleMessage(vehicleState());
}

// ---------- tear-off send (tap/Enter sends; dragging the stub is an optional flourish) ----------
const stub = $('#tear'), ticket = $('#ticket');
let dragY = null, dragged = false;

function send() {
  if (mode === 'holiday' && !checked(hForm, 'who').length) {
    ticket.classList.remove('nudge'); void ticket.offsetWidth; ticket.classList.add('nudge');
    $('#tTitle').textContent = "First, tell us who's going ↖";
    $('#whoChips input').focus();
    return;
  }
  const url = waLink(message());
  const w = window.open(url, '_blank'); // inside the user gesture, so popup blockers allow it
  if (w) w.opener = null; else location.href = url; // in-app browsers that refuse new tabs: open WhatsApp here
  stub.classList.add('torn');
  setTimeout(() => { stub.classList.remove('torn'); stub.style.transform = ''; }, 1400);
}
stub.addEventListener('pointerdown', e => {
  dragged = false;
  if (e.pointerType === 'touch') return; // phones: tap to send, and page scrolling is never blocked
  dragY = e.clientY; stub.setPointerCapture(e.pointerId);
});
stub.addEventListener('pointermove', e => {
  if (dragY === null) return;
  const dy = Math.max(0, e.clientY - dragY);
  if (dy > 15) dragged = true;
  stub.style.transform = `translateY(${Math.min(dy, 90)}px) rotate(${Math.min(dy, 90) / 18}deg)`;
});
stub.addEventListener('pointerup', e => {
  if (dragY === null) return;
  const dy = e.clientY - dragY; dragY = null;
  if (dragged && dy > 50) send(); else stub.style.transform = '';
});
stub.addEventListener('pointercancel', () => { dragY = null; stub.style.transform = ''; });
stub.addEventListener('click', e => { if (dragged) { dragged = false; e.preventDefault(); return; } send(); });
$('#mbSend').addEventListener('click', send);

function goPlan() {
  // Phones stack the ticket under the steps, so show the filled ticket there
  const narrow = matchMedia('(max-width: 960px)').matches;
  const target = $(narrow ? '#yourTrip' : '#plan'), block = narrow ? 'center' : 'start';
  target.scrollIntoView({ behavior: scrollMode(), block });
  // Landing check: re-check once after a jump; cancelled the moment the visitor scrolls, taps or types.
  clearTimeout(goPlan.t);
  goPlan.t = setTimeout(() => {
    const r = target.getBoundingClientRect();
    if (r.bottom < 80 || r.top > innerHeight - 80) target.scrollIntoView({ behavior: 'auto', block });
  }, 1200);
  ticket.classList.remove('flash'); void ticket.offsetWidth; ticket.classList.add('flash');
}
// any deliberate input cancels the landing check: wheel, touch, keys, and pointer presses (scrollbar drags, link clicks)
['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, () => clearTimeout(goPlan.t), { passive: true }));

// ---------- package tabs (cards are in the page; tabs show one group) ----------
const cards = $('#cards');
function showGroup(group) {
  const list = $$('.card', cards);
  list.forEach(c => { c.hidden = c.dataset.group !== group; });
  cards.dataset.n = list.filter(c => !c.hidden).length;
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.group === group)));
  syncTabs($('.tabs'));
  cards.setAttribute('aria-labelledby', group === 'india' ? 'tab-india' : 'tab-intl');
}
$$('.tab').forEach(t => t.addEventListener('click', () => showGroup(t.dataset.group)));
syncTabs($('.tabs'));

// Pre-fill the builder with a package (trip pages link here as index.html?plan=<id>#plan)
function planTrip(id) {
  const p = pkgById[id];
  setMode('holiday');
  if (!checked(hForm, 'who').length) pick(hForm, 'who', 'Family');
  const cur = VIBES.find(v => v.id === checked(hForm, 'vibe')[0]);
  pick(hForm, 'vibe', cur && cur.pkgs.includes(p.id) ? cur.id : p.vibe);
  pick(hForm, 'dest', p.id);
  goPlan();
}

// ---------- hero: two intent buttons + destination chips (browse first, build when ready) ----------
$$('[data-open]').forEach(b => b.addEventListener('click', () => { setMode(b.dataset.open); goPlan(); }));
$$('[data-jump]').forEach(chip => chip.addEventListener('click', () => {
  const p = pkgById[chip.dataset.jump];
  showGroup(p.group);
  const card = $('#pkg-' + p.id);
  card.scrollIntoView({ behavior: scrollMode(), block: 'center' });
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
}));

// ---------- trip styles ----------
$$('[data-style]').forEach(t => t.addEventListener('click', () => {
  const s = t.dataset.style;
  if (s === 'events') { setMode('vehicle'); pick(vForm, 'type', 'Wedding'); goPlan(); return; }
  setMode('holiday');
  if (s === 'honeymoon') { pick(hForm, 'who', 'Couple'); pick(hForm, 'vibe', 'Honeymoon'); }
  if (s === 'chardham') { pick(hForm, 'who', 'Family'); pick(hForm, 'vibe', 'Spiritual'); pick(hForm, 'dest', 'chardham'); }
  if (s === 'groups') { pick(hForm, 'who', 'Group'); }
  goPlan();
}));

// ---------- fleet ----------
const SHAPES = {
  car: '<path d="M18 62h164M30 62c-8 0-12-4-12-10v-6l18-4 26-16h66l30 16 20 4c6 2 8 6 8 10v6H30Z"/><path d="M70 30l-14 12h40V30Zm34 0v12h46l-24-12Z"/>',
  mpv: '<path d="M16 62h168M26 62c-6 0-10-4-10-10V40l10-14h108l30 14 14 4c4 2 6 6 6 10v8H26Z"/><path d="M34 30l-6 12h34V30Zm36 0v12h36V30Zm44 0v12h44l-26-12Z"/>',
  van: '<path d="M12 64h176M22 64c-6 0-10-4-10-10V22c0-6 4-10 10-10h122c8 0 14 4 18 10l16 22c6 2 10 6 10 12v8H22Z"/><path d="M26 22h22v18H26Zm30 0h22v18H56Zm30 0h22v18H86Zm30 0h22v18h-22Zm30 0h10l12 18h-22Z"/>',
  bus: '<path d="M8 64h184M18 64c-6 0-10-4-10-10V18c0-6 4-8 10-8h138c8 0 12 2 16 8l14 26c4 2 6 6 6 10v10H18Z"/><path d="M20 20h20v18H20Zm26 0h20v18H46Zm26 0h20v18H72Zm26 0h20v18H98Zm26 0h20v18h-20Zm26 0h8l12 18h-20Z"/>'
};
function vehicleArt(shape) {
  return `<svg viewBox="0 0 200 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${SHAPES[shape]}</g>
    <g fill="currentColor"><circle cx="50" cy="64" r="9"/><circle cx="150" cy="64" r="9"/></g></svg>`;
}
$('#fleetGrid').innerHTML = FLEET.map(v => `
  <article class="vcard${v.premium ? ' premium' : ''}">
    <div class="vphoto" data-placeholder="vehicle photo">${vehicleArt(v.shape)}${v.premium ? '<span class="prem">Premium seats</span>' : ''}</div>
    <div class="vbody">
      <div class="vtop"><h3>${esc(v.name)}</h3><span class="seats">${icon('i-users')}${esc(v.seats)}</span></div>
      <p class="vmodel">${esc(v.models)}</p>
      <p class="vbest">${esc(v.best)}</p>
      <div class="vfoot">
        <span class="vrate" data-placeholder="vehicle rate"><small>From</small> ${esc(v.rate)}</span>
        <button class="btn btn-quote btn-sm" data-fare="${v.id}" aria-label="Get fare for ${esc(v.name)}">Get fare</button>
      </div>
    </div>
  </article>`).join('');
$('#fleetGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-fare]');
  if (!b) return;
  setMode('vehicle');
  // Choosing a vehicle from the fleet is explicit: fit the passenger count to it rather than override the choice
  const cap = fleetById[b.dataset.fare].cap;
  if (num('vN') > cap) $('#vN').value = cap;
  pick(vForm, 'vehicle', b.dataset.fare); // marks it manual via the change handler
  goPlan();
});

// Phone bottom bar becomes a mini ticket with a Send button while the builder is on screen
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([en]) => document.body.classList.toggle('in-builder', en.intersectionRatio >= 0.15), { threshold: [0, 0.15] }).observe($('#plan'));
  new IntersectionObserver(([en]) => document.body.classList.toggle('ticket-visible', en.intersectionRatio >= 0.3), { threshold: [0, 0.3] }).observe($('#ticket'));
}

syncTabs($('.mode'));
render();

// Arriving from a trip page's "Plan this trip"
{ const id = new URLSearchParams(location.search).get('plan'); if (Object.hasOwn(pkgById, id)) planTrip(id); }
