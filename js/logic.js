// Trip logic: vehicle suggestion and the WhatsApp message text.

// Passengers exclude the driver. `alt` is the other sensible choice.
function suggestVehicle(n) {
  if (n <= 4) return { id: 'sedan' };
  if (n <= 6) return { id: 'ertiga', alt: 'crysta' };
  if (n <= 7) return { id: 'crysta' };
  if (n <= 10) return { id: 'urbania10' };
  if (n <= 13) return { id: 'urbania13', alt: 'tempo' };
  if (n <= 17) return { id: 'urbania17', alt: 'tempo' };
  if (n <= 26) return { id: 'tempo' };
  return { id: 'multi' };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// '2026-12-20' → '20 Dec 2026' (string maths, so no timezone shift)
function niceDate(iso) {
  const [y, m, d] = (iso || '').split('-').map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : '';
}

const line = (label, value) => (value ? `• ${label}: ${value}` : null);
const daysText = d => (d ? `${d} day${d == 1 ? '' : 's'}` : '');
const join = (...parts) => parts.filter(Boolean).join(', ');

function holidayMessage(s) {
  return [
    "Hi Rana Holidays! I'd like to plan a trip.",
    line('Travellers', `${s.who}, ${s.n} ${s.n == 1 ? 'person' : 'people'}`),
    line('Vibe', s.vibe),
    line('Destination', s.pkg ? s.pkg.name + (s.pkg.duration ? ` (${s.pkg.duration})` : '') : 'Please suggest'),
    line('When', join(s.month, daysText(s.days))),
    line('Needs', (s.needs || []).join(', ')),
    line('Note', (s.note || '').trim())
  ].filter(Boolean).join('\n');
}

function vehicleMessage(s) {
  return [
    "Hi Rana Holidays! I'd like to book a vehicle.",
    line('Route', `${s.from || 'Delhi NCR'} → ${(s.to || '').trim() || '(destination to discuss)'}`),
    line('Date', join(niceDate(s.date), daysText(s.days))),
    line('Passengers', String(s.n)),
    line('Vehicle', s.vehicle),
    line('Trip type', s.type),
    line('Needs', (s.needs || []).join(', ')),
    line('Note', (s.note || '').trim())
  ].filter(Boolean).join('\n');
}

if (typeof module !== 'undefined') module.exports = { suggestVehicle, holidayMessage, vehicleMessage, niceDate };
