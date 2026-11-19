// Rana Holidays: trip builder options (fleet, vibes, travellers, needs, places).
// Packages and contact details are in site-data.js.

// Fleet. Seats = passengers, driver not counted. cap = most passengers it takes. rate = starting fare per km.
const FLEET = [
  { id: 'sedan', cap: 4, name: 'Sedan', models: 'Dzire or Aura', seats: '4',
    best: 'Couples, small families, airport runs', rate: '₹12 / km', img: 'images/fleet/sedan.jpg' },
  { id: 'ertiga', cap: 6, name: 'Ertiga', models: 'Maruti Suzuki Ertiga', seats: '6',
    best: 'Families of 5–6 on a budget', rate: '₹15 / km', img: 'images/fleet/ertiga.jpg' },
  { id: 'crysta', cap: 7, name: 'Innova Crysta', models: 'Toyota Innova Crysta', seats: '7',
    best: 'Comfort for families and hill roads', rate: '₹19 / km', img: 'images/fleet/crysta.jpg' },
  { id: 'urbania', cap: 17, name: 'Force Urbania', models: '10, 13 or 17 seats', seats: '10 · 13 · 17',
    best: 'Premium group trips, weddings, corporate', rate: '₹38 / km', img: 'images/fleet/urbania.jpg', premium: true },
  { id: 'tempo', cap: 26, name: 'Tempo Traveller', models: '12 to 26 seats', seats: '12–26',
    best: 'Big groups, pilgrimages, college and office trips', rate: '₹28 / km', img: 'images/fleet/tempo.jpg' }
];
// suggestVehicle() ids → what the ticket and message say
const VEHICLE_LABEL = {
  sedan: 'Sedan (Dzire / Aura)', ertiga: 'Ertiga (6 seats)', crysta: 'Innova Crysta (7 seats)',
  urbania10: 'Force Urbania (10 seats)', urbania13: 'Force Urbania (13 seats)', urbania17: 'Force Urbania (17 seats)',
  tempo: 'Tempo Traveller (12–26 seats)', multi: 'More than one vehicle (we will plan the mix)'
};

// Vibes → featured package ids
const VIBES = [
  { id: 'Mountains', img: 'images/himachal.jpg', pkgs: ['himachal', 'uttarakhand', 'kashmir', 'northeast', 'corbett', 'bhutan', 'nepal'] },
  { id: 'Spiritual', img: 'images/vibe-spiritual.jpg', pkgs: ['ayodhya', 'uttarakhand', 'nepal', 'bhutan'] },
  { id: 'Beaches', img: 'images/vibe-beaches.jpg', pkgs: ['goa', 'andaman', 'thailand', 'srilanka'] },
  { id: 'Cities', img: 'images/vibe-cities.jpg', pkgs: ['malaysia', 'vietnam', 'rajasthan', 'kutch'] },
  { id: 'Honeymoon', img: 'images/vibe-honeymoon.jpg', pkgs: ['himachal', 'kashmir', 'goa', 'andaman', 'kutch', 'thailand', 'srilanka', 'vietnam'] }
];

const WHO = [['Couple', 2], ['Family', 4], ['Friends', 4], ['Group', 10]];
const NEEDS_HOLIDAY = ['Senior citizens', 'Kids', 'Veg / Jain food', '4★+ hotels', 'Budget stays'];
const NEEDS_VEHICLE = ['Luggage carrier', 'Multiple vehicles', 'Senior citizens', 'Night travel'];
const TRIP_TYPES = ['Outstation', 'Wedding', 'Corporate', 'Pilgrimage'];
const PLACES = ['Manali', 'Shimla', 'Dharamshala', 'Haridwar', 'Rishikesh', 'Char Dham Yatra', 'Mussoorie',
  'Nainital', 'Jim Corbett', 'Agra', 'Jaipur', 'Udaipur', 'Jodhpur', 'Amritsar', 'Chandigarh', 'Ahmedabad', 'Mount Abu'];
