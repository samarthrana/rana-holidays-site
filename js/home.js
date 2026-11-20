// Rana Holidays: home page (package tabs, trip builder, ticket, fleet). Needs site-data.js, data.js, logic.js, common.js.

const pkgById = Object.fromEntries(PACKAGES.map(p => [p.id, p]));
const fleetById = Object.fromEntries(FLEET.map(v => [v.id, v]));
const CHARDHAM = { id: 'chardham', name: 'Char Dham Yatra', duration: '',
  route: [['Yamunotri', ''], ['Gangotri', ''], ['Kedarnath', ''], ['Badrinath', '']], start: 'Haridwar' };
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

// Route line for the ticket (cards and trip pages carry the same markup in their HTML).
// A stop is [place, note, unset?]: an unset stop is a muted stand-in ("Destination") until the visitor types one.
function routeHTML(start, stops) {
  const all = [[start, 'start'], ...stops];
  return `<ol class="route-line${all.length >= 5 ? ' many' : ''}" style="--n:${all.length}">${all.map(([c, n, unset], i) =>
    `<li style="--i:${i}"><i class="dot"></i><b${unset ? ' class="unset"' : ''}>${esc(c)}</b><small>${esc(n)}</small></li>`).join('')}</ol>`;
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

// Trip list: India and International trips by name (a vibe narrows them). No length or price here: this is a custom
// request (the visitor sets the days; the reply on WhatsApp carries the plan and the price).
// The rows are radio buttons, so the choice, arrow keys and screen readers work as in any radio group.
const destBtn = $('#destBtn'), destList = $('#destChips');
function fillDest(vibe) {
  const v = VIBES.find(x => x.id === vibe), ids = v ? v.pkgs : PACKAGES.map(p => p.id);
  const opt = (value, name) => `<label class="pick-opt"><input type="radio" name="dest" value="${esc(value)}"><span><b>${esc(name)}</b></span></label>`;
  const group = (g, label, first = '') => {
    const rows = first + ids.map(id => pkgById[id]).filter(p => p.group === g).map(p => opt(p.id, p.name)).join('');
    return rows ? `<div role="group" aria-label="${label}"><p class="pick-group" aria-hidden="true">${label}</p>${rows}</div>` : '';
  };
  destList.innerHTML = group('india', 'India', vibe === 'Spiritual' ? opt('chardham', 'Char Dham Yatra') : '') + group('intl', 'International');
}
fillDest('');

function paintTrip() {
  const p = holidayState().pkg;
  $('.pick-val', destBtn).textContent = p ? p.name : 'Choose a trip';
  destBtn.classList.toggle('unset', !p);
}
function closeDest(refocus) {
  if (destList.hidden) return;
  destList.hidden = true;
  destBtn.setAttribute('aria-expanded', 'false');
  if (refocus) destBtn.focus();
}
destBtn.addEventListener('click', () => {
  if (!destList.hidden) return closeDest(true);
  destList.hidden = false;
  destBtn.setAttribute('aria-expanded', 'true');
  fitList(destList, '.pick-opt');
  const on = $('input:checked', destList);
  if (on) destList.scrollTop = on.closest('label').offsetTop - 6;     // the chosen trip in view
  (on || $('input', destList)).focus({ preventScroll: true });
  destList.scrollIntoView({ block: 'nearest', behavior: scrollMode() }); // all of it on screen, clear of the phone bar
});
// A tap, Space or Enter picks and closes; arrow keys move through the trips with the list kept open
let destArrow = false;
destList.addEventListener('keydown', e => {
  destArrow = e.key.startsWith('Arrow');
  if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); closeDest(true); }
});
destList.addEventListener('pointerdown', () => { destArrow = false; });
destList.addEventListener('click', e => { if (e.target.name === 'dest' && !destArrow) closeDest(true); destArrow = false; });
document.addEventListener('pointerdown', e => { if (!destList.hidden && !e.target.closest('.pick-field')) closeDest(false); });
destList.addEventListener('focusout', e => { if (e.relatedTarget && !e.relatedTarget.closest('.pick-field')) closeDest(false); });

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
    pkg: dest === 'chardham' ? CHARDHAM : pkgById[dest], date: hForm.date.value,
    days: num('hDays'), needs: checked(hForm, 'needs'), note: hForm.note.value
  };
}

// ---------- vehicle form ----------
$('#placeList').innerHTML = PLACES.map(p => `<option value="${esc(p)}">`).join('');
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

// ---------- Start date calendar (holiday and vehicle forms) ----------
// The button shows the trip span; the hidden input next to it holds the start date as 'YYYY-MM-DD'.
// Phones get a sheet from the bottom of the screen (modal dialog), wider screens a panel under the button.
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ymd = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const partsOf = iso => iso.split('-').map(Number);
const weekday = iso => { const [y, m, d] = partsOf(iso); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const shortDate = iso => `${DAY_NAMES[weekday(iso)].slice(0, 3)} ${partsOf(iso)[2]} ${MONTHS[partsOf(iso)[1] - 1]}`;
const shiftMonth = ([y, m], k) => { const d = new Date(Date.UTC(y, m - 1 + k, 1)); return [d.getUTCFullYear(), d.getUTCMonth() + 1]; };
// Pickable days: today (visitor's clock) to the end of the 12th month counting this one
function dateRange() {
  const t = new Date(), end = new Date(t.getFullYear(), t.getMonth() + 12, 0);
  return [ymd(t.getFullYear(), t.getMonth() + 1, t.getDate()), ymd(end.getFullYear(), end.getMonth() + 1, end.getDate())];
}

function paintDate(btn) {
  const start = $('#' + btn.dataset.dateFor).value, days = num(btn.dataset.days);
  $('.date-val', btn).textContent = !start ? 'Pick a date' : days > 1 ? `${shortDate(start)} → ${shortDate(addDays(start, days - 1))}` : shortDate(start);
  btn.classList.toggle('unset', !start);
}

function datePicker(btn) {
  const input = $('#' + btn.dataset.dateFor), cal = document.createElement('dialog');
  cal.className = 'cal'; cal.id = input.id + 'Cal';
  cal.setAttribute('aria-label', 'Choose a start date');
  cal.innerHTML = `<div class="cal-in"><div class="cal-head"><p class="cal-title" id="${cal.id}T" aria-live="polite"></p>`
    + `<button type="button" class="cal-nav cal-prev" aria-label="Previous month">${icon('i-arrow')}</button>`
    + `<button type="button" class="cal-nav cal-next" aria-label="Next month">${icon('i-arrow')}</button>`
    + `<button type="button" class="cal-x" aria-label="Close calendar">×</button></div>`
    + `<table class="cal-grid" role="grid" aria-labelledby="${cal.id}T"><thead><tr>`
    + DAY_NAMES.map(d => `<th scope="col" abbr="${d}">${d[0]}</th>`).join('') + '</tr></thead><tbody></tbody></table></div>';
  btn.setAttribute('aria-controls', cal.id);
  btn.after(cal);                                   // inside .date-field, so the wide-screen panel sits under the button
  const body = $('tbody', cal), title = $('.cal-title', cal), prev = $('.cal-prev', cal), next = $('.cal-next', cal);
  let view, focusIso;                               // view = [year, month] shown; focusIso = the one day Tab reaches

  function draw() {
    const [y, m] = view, [min, max] = dateRange(), start = input.value;
    const end = start && addDays(start, num(btn.dataset.days) - 1), n = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const shown = iso => !!iso && partsOf(iso)[0] === y && partsOf(iso)[1] === m && iso >= min && iso <= max;
    if (!shown(focusIso)) focusIso = [start, min, ymd(y, m, 1)].find(shown) || min;
    const cells = Array(weekday(ymd(y, m, 1))).fill('<td></td>');
    for (let d = 1; d <= n; d++) {
      const iso = ymd(y, m, d), cls = iso === start ? 'sel' : start && iso > start && iso <= end ? 'stay' : '';
      cells.push(`<td${iso === start ? ' aria-selected="true"' : ''}><button type="button" data-iso="${iso}"${cls ? ` class="${cls}"` : ''}`
        + ` tabindex="${iso === focusIso ? 0 : -1}"${iso < min || iso > max ? ' disabled' : ''}${iso === min ? ' aria-current="date"' : ''}`
        + ` aria-label="${DAY_NAMES[weekday(iso)]} ${d} ${MONTH_NAMES[m - 1]} ${y}">${d}</button></td>`);
    }
    while (cells.length % 7) cells.push('<td></td>');
    body.innerHTML = Array.from({ length: cells.length / 7 }, (_, r) => `<tr>${cells.slice(r * 7, r * 7 + 7).join('')}</tr>`).join('');
    title.textContent = `${MONTH_NAMES[m - 1]} ${y}`;
    prev.disabled = ymd(y, m, 1) <= min;            // the current month is the first
    next.disabled = ymd(y, m, n) >= max;            // the 12th month is the last
  }
  const focusDay = () => $(`button[data-iso="${focusIso}"]`, body)?.focus({ preventScroll: true });

  function open() {
    const [min] = dateRange();
    focusIso = input.value >= min ? input.value : min;
    view = partsOf(focusIso).slice(0, 2);
    draw();
    const sheet = matchMedia('(max-width: 720px)').matches;
    if (sheet) cal.showModal(); else cal.show();
    btn.setAttribute('aria-expanded', 'true');
    focusDay();
    if (!sheet) cal.scrollIntoView({ block: 'nearest', behavior: scrollMode() });   // the panel may open below the fold
  }
  function close(refocus) {
    if (!cal.open) return;
    cal.close();
    btn.setAttribute('aria-expanded', 'false');
    if (refocus) btn.focus();
  }

  btn.addEventListener('click', () => (cal.open ? close(true) : open()));
  for (const [b, k] of [[prev, -1], [next, 1]]) {
    b.addEventListener('click', () => { view = shiftMonth(view, k); draw(); if (b.disabled) focusDay(); });
  }
  body.addEventListener('click', e => {             // one tap on a day picks it and closes the calendar
    const b = e.target.closest('button[data-iso]');
    if (!b || b.disabled) return;
    input.value = b.dataset.iso;
    close(true);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  body.addEventListener('keydown', e => {           // arrows move a day or a week, across months
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key], b = e.target.closest('button[data-iso]');
    if (!step || !b) return;
    e.preventDefault();
    const [min, max] = dateRange(), to = addDays(b.dataset.iso, step);
    if (to < min || to > max) return;
    focusIso = to;
    view = partsOf(to).slice(0, 2);
    draw();
    focusDay();
  });
  $('.cal-x', cal).addEventListener('click', () => close(true));
  cal.addEventListener('cancel', e => { e.preventDefault(); close(true); });          // Esc on the phone sheet
  cal.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(true); } });
  cal.addEventListener('click', e => {              // a tap on the dimmed page around the sheet
    const r = cal.getBoundingClientRect();
    if (e.target === cal && (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right)) close(true);
  });
  // wide screens: a click elsewhere, or tabbing out of the panel, closes it
  document.addEventListener('pointerdown', e => { if (cal.open && !cal.matches(':modal') && !cal.contains(e.target) && !btn.contains(e.target)) close(false); });
  cal.addEventListener('focusout', e => { if (!cal.matches(':modal') && e.relatedTarget && !cal.contains(e.relatedTarget) && e.relatedTarget !== btn) close(false); });
}
$$('.date-btn').forEach(datePicker);

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
  $$('.date-btn').forEach(paintDate);   // the trip span on each Start date button follows the days counter
  paintTrip();
  const rows = [];
  let title, route = '';
  const link = $('#tLink');
  link.hidden = true;
  if (mode === 'holiday') {
    const s = holidayState();
    title = s.pkg ? s.pkg.name : s.vibe ? `A ${s.vibe.toLowerCase()} trip, where to?` : s.who ? `${s.who} trip, where to?` : "Tell us who's going";
    // the stops only: the package's nights per stop would contradict the visitor's own days
    if (s.pkg) route = routeHTML(s.pkg.start || (s.pkg.group === 'intl' ? 'Delhi ✈' : 'Delhi'), s.pkg.route.map(([city]) => [city, '']));
    if (s.who) rows.push(['Travellers', `${s.who} · ${plural(s.n, 'person', 'people')}`]);
    if (s.vibe) rows.push(['Vibe', s.vibe]);
    rows.push(s.pkg ? ['Trip', s.pkg.name] : ['Trip', 'Choose a trip', true]);
    rows.push(s.date ? ['When', `${niceDate(s.date)} · ${plural(s.days, 'day', 'days')}`] : ['When', `${plural(s.days, 'day', 'days')} · pick a date`, true]);
    if (s.pkg && s.pkg.url) { link.href = s.pkg.url; link.hidden = false; }   // the ready-made trip's page, to compare with
    if (s.needs.length) rows.push(['Needs', s.needs.join(', ')]);
  } else {
    const s = vehicleState();
    const to = s.to.trim();
    title = `${s.from} → ${to || 'where to?'}`;
    route = routeHTML(s.from, [[to || 'Destination', plural(s.days, 'day', 'days'), !to]]);
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

// Pre-fill the builder with a package (trip pages link here as ../?plan=<id>#plan)
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
// Char Dham is a request, not a package: the trip style and the Packages menu (?plan=chardham) both start it here
function planCharDham() {
  setMode('holiday');
  pick(hForm, 'who', 'Family'); pick(hForm, 'vibe', 'Spiritual'); pick(hForm, 'dest', 'chardham');
  goPlan();
}
$$('[data-style]').forEach(t => t.addEventListener('click', () => {
  const s = t.dataset.style;
  if (s === 'events') { setMode('vehicle'); pick(vForm, 'type', 'Wedding'); goPlan(); return; }
  if (s === 'chardham') return planCharDham();
  setMode('holiday');
  if (s === 'honeymoon') { pick(hForm, 'who', 'Couple'); pick(hForm, 'vibe', 'Honeymoon'); }
  if (s === 'groups') { pick(hForm, 'who', 'Group'); }
  goPlan();
}));

// ---------- fleet ----------
$('#fleetGrid').innerHTML = FLEET.map(v => `
  <article class="vcard${v.premium ? ' premium' : ''}">
    <div class="vphoto"><img src="${v.img}" alt="" loading="lazy">${v.premium ? '<span class="prem">Premium seats</span>' : ''}</div>
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

// ---------- reviews: one row that scrolls sideways; the arrows move one card (a mouse wheel can't scroll sideways) ----------
const reviewRow = $('#reviewRow'), reviewBtns = $$('.review-btn');
function syncReviewBtns() {
  const end = reviewRow.scrollWidth - reviewRow.clientWidth;
  reviewBtns.forEach(b => { b.disabled = b.dataset.dir < 0 ? reviewRow.scrollLeft <= 1 : reviewRow.scrollLeft >= end - 1; });
}
reviewBtns.forEach(b => b.addEventListener('click', () => {
  const step = $('.review', reviewRow).offsetWidth + parseFloat(getComputedStyle(reviewRow).columnGap);
  reviewRow.scrollBy({ left: b.dataset.dir * step, behavior: scrollMode() });
}));
reviewRow.addEventListener('scroll', syncReviewBtns, { passive: true });
addEventListener('resize', syncReviewBtns);
syncReviewBtns();

// Arriving from a trip page's "Plan this trip"
{ const id = new URLSearchParams(location.search).get('plan'); if (id === 'chardham') planCharDham(); else if (Object.hasOwn(pkgById, id)) planTrip(id); }
