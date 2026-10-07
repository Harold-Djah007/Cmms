const STORAGE_KEY = 'safimaint-fiix-ops-v1';
const LEGACY_KEYS = ['safimaint-safisana-v1', 'safimaint-field-v1', 'safimaint-pilot-v1'];

const people = [
  { name: 'Abena Sarpong', initials: 'AS', role: 'Operations manager', kind: 'planner', trade: 'Planning', rate: 55 },
  { name: 'Simeon Sakyi', initials: 'SS', role: 'Maintenance technician', kind: 'technician', trade: 'Mechanical', rate: 42 },
  { name: 'Kwame Mensah', initials: 'KM', role: 'Mechanical technician', kind: 'technician', trade: 'Mechanical', rate: 40 },
  { name: 'Esi Agyeman', initials: 'EA', role: 'Mechanical technician', kind: 'technician', trade: 'Mechanical', rate: 40 },
  { name: 'Yaw Boateng', initials: 'YB', role: 'Instrumentation', kind: 'technician', trade: 'Instrumentation', rate: 45 }
];
const technicians = people.filter(p => p.kind === 'technician');
const planner = people[0];

function daysFromNow(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function stamp() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const seedData = {
  assets: [
    { id: 'SSGL', code: 'SSGL', name: 'Safi Sana Ghana Ltd', kind: 'Facility', parent: null, location: 'Ghana', status: 'Healthy', lastService: daysFromNow(-30), nextService: daysFromNow(30), criticality: 'A' },
    { id: 'OPS', code: 'OPS', name: 'Operations', kind: 'Facility', parent: 'SSGL', location: 'Operations', status: 'Healthy', lastService: daysFromNow(-14), nextService: daysFromNow(14), criticality: 'A' },
    { id: 'A136', code: 'A136', name: 'Gada demonstration site', kind: 'Facility', parent: 'SSGL', location: 'Gada', status: 'Healthy', lastService: daysFromNow(-20), nextService: daysFromNow(10), criticality: 'B' },
    { id: 'A177', code: 'A177', name: 'Laboratory', kind: 'Facility', parent: 'SSGL', location: 'Laboratory', status: 'Healthy', lastService: daysFromNow(-7), nextService: daysFromNow(21), criticality: 'B' },
    { id: 'A245', code: 'A245', name: 'Sourcing team', kind: 'Facility', parent: 'SSGL', location: 'Sourcing', status: 'Healthy', lastService: daysFromNow(-40), nextService: daysFromNow(20), criticality: 'C' },
    { id: 'A415', code: 'A415', name: 'Safisana storage tanks', kind: 'Facility', parent: 'SSGL', location: 'Tank farm', status: 'Attention', lastService: daysFromNow(-45), nextService: daysFromNow(2), criticality: 'A' },
    { id: 'KC', code: 'KC', name: 'Knowledge Centre', kind: 'Facility', parent: 'SSGL', location: 'Knowledge Centre', status: 'Healthy', lastService: daysFromNow(-12), nextService: daysFromNow(18), criticality: 'C' },
    { id: 'MP', code: 'MP', name: 'Mix Pit', kind: 'Facility', parent: 'SSGL', location: 'Mix Pit', status: 'Attention', lastService: daysFromNow(-18), nextService: daysFromNow(1), criticality: 'A' },
    { id: 'NUR', code: 'NUR', name: 'Nursery', kind: 'Facility', parent: 'SSGL', location: 'Nursery', status: 'Healthy', lastService: daysFromNow(-9), nextService: daysFromNow(25), criticality: 'B' },
    { id: 'WI', code: 'WI', name: 'Waste Intake', kind: 'Facility', parent: 'SSGL', location: 'Waste Intake', status: 'Healthy', lastService: daysFromNow(-4), nextService: daysFromNow(12), criticality: 'A' },
    { id: 'CHP', code: 'CHP', name: 'CHP Container', kind: 'Facility', parent: 'OPS', location: 'Operations', status: 'Attention', lastService: daysFromNow(-11), nextService: daysFromNow(0), criticality: 'A', meter: { name: 'Run hours', value: 4120, unit: 'h' }, manufacturer: 'Tedom', serial: 'CHP-2018-04', warranty: daysFromNow(180), bom: [{ partId: 'A326', qty: 1 }, { partId: 'A386', qty: 1 }] },
    { id: 'RO', code: 'RO', name: 'RO Plant', kind: 'Equipment', parent: 'OPS', location: 'Operations', status: 'Attention', lastService: daysFromNow(-22), nextService: daysFromNow(5), criticality: 'A' },
    { id: 'PUMP', code: 'A2067', name: 'Digester feed pump', kind: 'Equipment', parent: 'MP', location: 'Mix Pit', status: 'Down', lastService: daysFromNow(-41), nextService: daysFromNow(0), criticality: 'A', meter: { name: 'Hours', value: 1860, unit: 'h' }, manufacturer: 'Flygt', serial: 'FP-4011', warranty: daysFromNow(-20), bom: [{ partId: 'MS40', qty: 1 }, { partId: 'BLT', qty: 1 }] },
    { id: 'REG', code: 'A1994', name: 'Gas pressure regulator', kind: 'Equipment', parent: 'CHP', location: 'CHP Container', status: 'Attention', lastService: daysFromNow(-16), nextService: daysFromNow(3), criticality: 'A' },
    { id: 'A170', code: 'A170', name: 'Tahmo weather station', kind: 'Equipment', parent: 'OPS', location: 'Operations', status: 'Healthy', lastService: daysFromNow(-6), nextService: daysFromNow(24), criticality: 'B' },
    { id: 'A424', code: 'A424', name: 'Compost sewing machine', kind: 'Equipment', parent: 'A136', location: 'Gada', status: 'Healthy', lastService: daysFromNow(-15), nextService: daysFromNow(15), criticality: 'B' },
    { id: 'A426', code: 'A426', name: 'Weighing scale', kind: 'Tool', parent: 'A177', location: 'Laboratory', status: 'Healthy', lastService: daysFromNow(-3), nextService: daysFromNow(27), criticality: 'C' },
    { id: 'A150', code: 'A150', name: 'Compost thermometer #1', kind: 'Tool', parent: 'A177', location: 'Laboratory', status: 'Healthy', lastService: daysFromNow(-2), nextService: daysFromNow(28), criticality: 'C' },
    { id: 'A151', code: 'A151', name: 'Compost thermometer #2', kind: 'Tool', parent: 'A177', location: 'Laboratory', status: 'Healthy', lastService: daysFromNow(-2), nextService: daysFromNow(28), criticality: 'C' },
    { id: 'A157', code: 'A157', name: 'Infrared thermometer', kind: 'Tool', parent: 'A177', location: 'Laboratory', status: 'Healthy', lastService: daysFromNow(-8), nextService: daysFromNow(22), criticality: 'C' },
    { id: 'A169', code: 'A169', name: 'Sewerin Multitec 545', kind: 'Tool', parent: 'A177', location: 'Laboratory', status: 'Healthy', lastService: daysFromNow(-10), nextService: daysFromNow(20), criticality: 'B' },
    { id: 'A212', code: 'A212', name: 'Analox O2 portable #1', kind: 'Tool', parent: 'OPS', location: 'Operations', status: 'Healthy', lastService: daysFromNow(-5), nextService: daysFromNow(25), criticality: 'B' }
  ],
  workOrders: [
    { id: '2165', title: 'Rust / corrosion control at the RO Plant', asset: 'RO Plant', assetId: 'RO', location: 'Operations', priority: 'Medium', type: 'Preventive', assignee: 'Simeon Sakyi', due: daysFromNow(2), status: 'Open', estimatedHours: 4, loggedHours: 0, summary: 'Protect RO skid from corrosion before the next audit.', instructions: 'Isolate, clean rust, coat, and photograph before/after.', createdAt: daysFromNow(-4), tasks: [{ id: 't1', text: 'Isolate and make safe', done: false }, { id: 't2', text: 'Clean and coat affected steel', done: false }, { id: 't3', text: 'Photo record for the file', done: false }], partsUsed: [], timeLog: [], comments: [] },
    { id: '1662', title: 'EPA monthly reporting', asset: 'Operations', assetId: 'OPS', location: 'Operations', priority: 'High', type: 'Preventive', assignee: 'Simeon Sakyi', due: daysFromNow(0), status: 'Open', estimatedHours: 3, loggedHours: 0, summary: 'Compile EPA monthly figures and file.', instructions: 'Pull meter readings, lab results, and incident log. Submit before close of business.', createdAt: daysFromNow(-10), tasks: [{ id: 't1', text: 'Collect meter and lab data', done: false }, { id: 't2', text: 'Complete EPA form', done: false }], partsUsed: [], timeLog: [], comments: [] },
    { id: '1781', title: 'Construct new culvert for the staff', asset: 'Gada demonstration site', assetId: 'A136', location: 'Gada', priority: 'High', type: 'Project', assignee: 'Simeon Sakyi', due: daysFromNow(12), status: 'Open', estimatedHours: 16, loggedHours: 0, summary: 'Civil project — staff access culvert.', instructions: 'Coordinate with site, keep intake road open.', createdAt: daysFromNow(-20), tasks: [{ id: 't1', text: 'Confirm dimensions on site', done: true }, { id: 't2', text: 'Cast and backfill', done: false }], partsUsed: [], timeLog: [], comments: [] },
    { id: '1864', title: 'Cleaning of storage tank 1', asset: 'Safisana storage tanks', assetId: 'A415', location: 'Tank farm', priority: 'Medium', type: 'Preventive', assignee: 'Kwame Mensah', due: daysFromNow(1), status: 'Open', estimatedHours: 5, loggedHours: 0, summary: 'Scheduled tank clean.', instructions: 'Gas test, isolate, clean, inspect lining.', createdAt: daysFromNow(-6), tasks: [{ id: 't1', text: 'Permit and gas test', done: false }, { id: 't2', text: 'Clean and inspect lining', done: false }], partsUsed: [], timeLog: [], comments: [] },
    { id: '1966', title: 'Monthly cleaning of weather station', asset: 'Tahmo weather station', assetId: 'A170', location: 'Operations', priority: 'High', type: 'Preventive', assignee: 'Simeon Sakyi', due: daysFromNow(3), status: 'Open', estimatedHours: 1.5, loggedHours: 0, summary: 'Keep sensors clear.', instructions: 'Clean radiation shield and check mount bolts.', createdAt: daysFromNow(-8), tasks: [{ id: 't1', text: 'Clean sensors', done: false }, { id: 't2', text: 'Check data feed', done: false }], partsUsed: [], timeLog: [], comments: [] },
    { id: '1994', title: 'Low gas pressure on the pressure regulator', asset: 'Gas pressure regulator', assetId: 'REG', location: 'CHP Container', priority: 'Medium', type: 'Corrective', assignee: 'Simeon Sakyi', due: daysFromNow(0), status: 'In Progress', estimatedHours: 3, loggedHours: 1, summary: 'Pressure dropped after the morning run.', instructions: 'Isolate, inspect diaphragm and downstream filter, replace kit if scored.', createdAt: daysFromNow(-1), tasks: [{ id: 't1', text: 'Isolate and vent safely', done: true }, { id: 't2', text: 'Inspect regulator and filter', done: false }, { id: 't3', text: 'Recommission and log pressure', done: false }], partsUsed: [], timeLog: [{ hours: 1, note: 'Isolated, covers off', at: daysFromNow(0) }], comments: [{ from: 'Simeon Sakyi', text: 'Need the regulator kit from CHP stores before I crack the body.', at: '08:10' }] },
    { id: '2067', title: 'Cleaning of mix pit and checking the feed pump', asset: 'Digester feed pump', assetId: 'PUMP', location: 'Mix Pit', priority: 'High', type: 'Preventive', assignee: 'Kwame Mensah', due: daysFromNow(-1), status: 'Open', estimatedHours: 4, loggedHours: 0, summary: 'Mix pit hygiene and pump check.', instructions: 'Lock out pump, inspect coupling, clear pit, test run.', createdAt: daysFromNow(-3), tasks: [{ id: 't1', text: 'Lock out feed pump', done: false }, { id: 't2', text: 'Clear pit and inspect coupling', done: false }, { id: 't3', text: 'Test run and record amps', done: false }], partsUsed: [], timeLog: [], comments: [] },
    { id: '1828', title: 'EPA monthly reporting', asset: 'Operations', assetId: 'OPS', location: 'Operations', priority: 'High', type: 'Preventive', assignee: 'Simeon Sakyi', due: daysFromNow(-20), status: 'Completed', estimatedHours: 3, loggedHours: 3, summary: 'Previous cycle closed.', instructions: '', createdAt: daysFromNow(-30), completedAt: daysFromNow(-20), completionNotes: 'Filed with EPA.', downtimeHours: 0, cause: 'Scheduled', tasks: [{ id: 't1', text: 'File report', done: true }], partsUsed: [], timeLog: [{ hours: 3, note: 'Filed', at: daysFromNow(-20) }], comments: [] }
  ],
  inventory: [
    { id: 'A123', code: 'A123', name: 'RELAY C10-A10DX/24V R.S.', category: 'Electrical', quantity: 4, minimum: 2, maximum: 8, make: 'Schneider', barcode: 'A123', unitCost: 85, vendor: 'Schneider', locations: [{ site: 'SSGL', location: 'CHP Container', aisle: '1', row: 'B', bin: '04', qty: 4 }], receipts: [] },
    { id: 'A239', code: 'A239', name: 'Cylinder head & gasket (Sandfilter)', category: 'Mechanical', quantity: 0, minimum: 1, maximum: 2, make: '', barcode: 'A239', locations: [{ site: 'SSGL', location: 'CHP Container', aisle: '1', row: 'A', bin: '01', qty: 0 }], receipts: [] },
    { id: 'A243', code: 'A243', name: 'Inter cooler', category: 'Mechanical', quantity: 1, minimum: 1, maximum: 2, make: '', barcode: 'A243', locations: [{ site: 'SSGL', location: 'Operations', aisle: '2', row: 'C', bin: '11', qty: 1 }], receipts: [] },
    { id: 'A249', code: 'A249', name: 'CHP container (Sandfilter) kit', category: 'Assembly', quantity: 10, minimum: 4, maximum: 12, make: '', barcode: 'A249', locations: [{ site: 'SSGL', location: 'CHP Container', aisle: '1', row: 'A', bin: '02', qty: 10 }], receipts: [{ qty: 10, receipt: 'GRN-008', supplier: 'Local stores', at: daysFromNow(-12) }] },
    { id: 'A375', code: 'A375', name: 'Gasket copper', category: 'Seals', quantity: 2, minimum: 4, maximum: 10, make: '', barcode: 'A375', unitCost: 18, vendor: 'Local stores', locations: [{ site: 'SSGL', location: 'CHP Container', aisle: '1', row: 'B', bin: '08', qty: 2 }], receipts: [] },
    { id: 'A326', code: 'A326', name: 'Comp oil 0w48', category: 'Lubricants', quantity: 5, minimum: 4, maximum: 12, make: '', barcode: 'A326', locations: [{ site: 'SSGL', location: 'CHP Container', aisle: '2', row: 'A', bin: '03', qty: 5 }], receipts: [] },
    { id: 'A386', code: 'A386', name: 'Turbo charger gasket set', category: 'Seals', quantity: 1, minimum: 1, maximum: 3, make: '', barcode: 'A386', locations: [{ site: 'SSGL', location: 'CHP Container', aisle: '1', row: 'C', bin: '06', qty: 1 }], receipts: [] },
    { id: 'BLT', code: 'BLT-B72', name: 'Drive belt B-72', category: 'Mechanical', quantity: 1, minimum: 3, maximum: 6, make: '', barcode: 'BLT-B72', locations: [{ site: 'SSGL', location: 'Operations', aisle: '3', row: 'A', bin: '12', qty: 1 }], receipts: [] },
    { id: 'MS40', code: 'MS-40-SS', name: 'Pump mechanical seal', category: 'Seals', quantity: 2, minimum: 2, maximum: 4, make: '', barcode: 'MS-40-SS', locations: [{ site: 'SSGL', location: 'Mix Pit', aisle: '1', row: 'A', bin: '02', qty: 2 }], receipts: [] }
  ],
  schedules: [
    { id: 'PM-201', title: 'EPA monthly reporting', asset: 'Operations', assetId: 'OPS', date: daysFromNow(0), owner: 'Simeon Sakyi', interval: 'Every month', trigger: 'time', intervalDays: 30, active: true },
    { id: 'PM-202', title: 'Weather station clean', asset: 'Tahmo weather station', assetId: 'A170', date: daysFromNow(3), owner: 'Simeon Sakyi', interval: 'Every month', trigger: 'time', intervalDays: 30, active: true },
    { id: 'PM-203', title: 'Feed pump inspection', asset: 'Digester feed pump', assetId: 'PUMP', date: daysFromNow(7), owner: 'Kwame Mensah', interval: 'Every month', trigger: 'time', intervalDays: 30, active: true },
    { id: 'PM-204', title: 'CHP oil and leak check', asset: 'CHP Container', assetId: 'CHP', date: daysFromNow(5), owner: 'Simeon Sakyi', interval: 'Every 250 hours', trigger: 'meter', meterEvery: 250, lastMeter: 4000, active: true },
    { id: 'PM-205', title: 'Storage tank inspection', asset: 'Safisana storage tanks', assetId: 'A415', date: daysFromNow(14), owner: 'Kwame Mensah', interval: 'Every quarter', trigger: 'time', intervalDays: 90, active: true }
  ],
  requests: [
    { id: 'WR-101', title: 'Smell of gas around Mix Pit walkway', assetId: 'MP', asset: 'Mix Pit', requestedBy: 'Yaw Boateng', priority: 'High', status: 'Submitted', notes: 'Noticed after the morning offload.', createdAt: daysFromNow(0), convertedTo: '' },
    { id: 'WR-102', title: 'Weather station shield cracked', assetId: 'A170', asset: 'Tahmo weather station', requestedBy: 'Esi Agyeman', priority: 'Medium', status: 'Converted', notes: 'Convert to PM if it is already on the schedule.', createdAt: daysFromNow(-2), convertedTo: '1966' }
  ],
  purchaseOrders: [
    { id: 'PO-1008', vendor: 'Local stores', status: 'Submitted', createdAt: daysFromNow(-1), lines: [{ partId: 'A375', name: 'Gasket copper', qty: 6, cost: 18 }] }
  ],
  vendors: ['Local stores', 'Schneider', 'PumpTech Ghana'],
  threads: [
    { id: 'MSG-1', title: 'WO 1994 · gas regulator', type: 'work', recordType: 'work', recordId: '1994', with: 'Simeon Sakyi', messages: [
      { from: 'Simeon Sakyi', text: 'Pressure dropped after the morning run. I need the regulator kit from CHP stores.', at: '08:10', read: true },
      { from: 'Abena Sarpong', text: 'Kit is on A386. Isolate before you open the body. Confirm the reading on the thread when you recommission.', at: '08:22', read: false }
    ]},
    { id: 'MSG-2', title: 'Storeroom · copper gaskets', type: 'stock', recordType: 'part', recordId: 'A375', with: 'Kwame Mensah', messages: [
      { from: 'System', text: 'Gasket copper A375 is at 2, below min of 4. Count the CHP bin before the next job.', at: '07:40', read: false }
    ]},
    { id: 'MSG-3', title: 'Simeon Sakyi', type: 'direct', recordType: '', recordId: '', with: 'Simeon Sakyi', messages: [
      { from: 'Abena Sarpong', text: 'Please close 1662 EPA reporting before the afternoon meeting.', at: '07:05', read: true },
      { from: 'Simeon Sakyi', text: 'On it. Lab sheet is with Yaw.', at: '07:18', read: true }
    ]}
  ],
  activity: [
    { text: 'Simeon Sakyi started WO 1994 on the gas regulator', at: '08:14' },
    { text: 'Gasket copper A375 dropped below minimum', at: '07:40' },
    { text: 'EPA monthly reporting (1662) is due today', at: '07:00' }
  ]
};

let state = loadState();
let mode = localStorage.getItem('safimaint-mode') || 'planner';
let activeFilter = 'all';
let typeFilter = 'all';
let overdueOnly = false;
let mineFilter = 'active';
let assetKind = 'all';
let record = { type: null, id: null, tab: 'details' };
let lastListView = 'dashboard';
let activeThread = 'MSG-1';
let countDraft = {};
let receiveTarget = null;
let timeTarget = null;
let scanContext = 'all';
let collapsed = new Set();
let deferredInstall;
let workPage = 1;
let partsPage = 1;
const PAGE_SIZE = 20;
let partSearch = '';

function currentUser() {
  return mode === 'technician' ? people.find(p => p.name === 'Simeon Sakyi') : planner;
}
function currentUserName() { return currentUser().name; }

function loadState() {
  for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return hydrateState(JSON.parse(stored));
    } catch (_) {}
  }
  return hydrateState(structuredClone(seedData));
}

function hydrateState(data) {
  const seed = structuredClone(seedData);
  const next = { ...seed, ...data };
  next.threads = next.threads?.length ? next.threads : seed.threads;
  next.requests = next.requests || seed.requests;
  next.purchaseOrders = next.purchaseOrders || seed.purchaseOrders;
  next.vendors = next.vendors || seed.vendors;
  next.activity = next.activity || seed.activity;
  next.inventory = (next.inventory || []).map(normalizePart);
  next.assets = (next.assets || []).map(normalizeAsset);
  next.workOrders = (next.workOrders || []).map(normalizeWork);
  next.schedules = (next.schedules || []).map(normalizePm);
  return next;
}

function normalizePart(part) {
  const locations = part.locations || [{ site: 'SSGL', location: part.location || 'Operations', aisle: '', row: '', bin: '', qty: part.quantity || 0 }];
  const quantity = locations.reduce((sum, loc) => sum + Number(loc.qty || 0), 0);
  return { category: 'Parts And Supplies', minimum: 1, maximum: 5, make: '', barcode: part.code || part.id, receipts: [], unitCost: 0, vendor: '', ...part, locations, quantity };
}

function normalizeAsset(asset) {
  return { manufacturer: '', serial: '', model: '', warranty: '', assignedTo: '', bom: [], meterHistory: [], notes: '', ...asset };
}

function normalizeWork(work) {
  return { additionalCosts: [], followUpOf: '', requestId: '', failureCode: '', completedAt: '', completionNotes: '', downtimeHours: 0, cause: '', partsUsed: [], timeLog: [], comments: [], tasks: [], ...work };
}

function normalizePm(pm) {
  const intervalDays = pm.intervalDays || (String(pm.interval || '').includes('week') ? 14 : String(pm.interval || '').includes('quarter') ? 90 : 30);
  return { trigger: 'time', intervalDays, meterEvery: 0, lastMeter: 0, active: true, tasks: [], ...pm, intervalDays };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function logActivity(text) {
  state.activity.unshift({ text, at: stamp() });
  state.activity = state.activity.slice(0, 12);
}

function notify(title, text, extra = {}) {
  const thread = {
    id: `MSG-${Date.now()}`,
    title,
    type: extra.type || 'system',
    recordType: extra.recordType || '',
    recordId: extra.recordId || '',
    with: extra.with || currentUserName(),
    messages: [{ from: extra.from || 'System', text, at: stamp(), read: false }]
  };
  state.threads.unshift(thread);
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function prettyDate(date) {
  if (!date) return '—';
  const d = new Date(`${date}T12:00:00`);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function statusClass(status) {
  return String(status).toLowerCase().replace('in ', '').replaceAll(' ', '-');
}

function isOverdue(order) {
  return order.status !== 'Completed' && order.due < daysFromNow(0);
}

function openWork() { return state.workOrders.filter(w => w.status !== 'Completed'); }
function findAsset(key) { return state.assets.find(a => a.id === key || a.code === key || a.name === key); }
function findPart(key) { return state.inventory.find(p => p.id === key || p.code === key || p.name === key); }
function findWork(id) { return state.workOrders.find(w => w.id === id); }
function partOnHand(part) { return (part.locations || []).reduce((sum, loc) => sum + Number(loc.qty || 0), 0); }
function binLabel(part) {
  const loc = (part.locations || [])[0];
  if (!loc) return '—';
  return [loc.location, loc.aisle && `Aisle ${loc.aisle}`, loc.row && `Row ${loc.row}`, loc.bin && `Bin ${loc.bin}`].filter(Boolean).join(' · ');
}
function taskProgress(order) {
  const total = order.tasks?.length || 0;
  const done = (order.tasks || []).filter(t => t.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
function unreadCount() {
  return state.threads.reduce((sum, t) => sum + t.messages.filter(m => !m.read && m.from !== currentUserName()).length, 0);
}
function nextWorkId() {
  const nums = state.workOrders.map(w => Number(w.id)).filter(n => !Number.isNaN(n));
  return String(Math.max(2000, ...nums, 0) + 1);
}

function qrMark(code) {
  const bits = [...String(code || 'X')].map(c => c.charCodeAt(0));
  let cells = '';
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      if ((bits[(x + y) % bits.length] + x * 3 + y * 7) % 3 !== 0) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  return `<svg class="qr-mark" viewBox="0 0 7 7" aria-hidden="true">${cells}</svg>`;
}

function personRate(name) {
  return people.find(p => p.name === name)?.rate || 40;
}

function laborCost(work) {
  return (work.loggedHours || 0) * personRate(work.assignee);
}

function partsCost(work) {
  return (work.partsUsed || []).reduce((sum, line) => {
    const part = findPart(line.partId);
    return sum + (line.qty || 0) * Number(part?.unitCost || 0);
  }, 0);
}

function extraCost(work) {
  return (work.additionalCosts || []).reduce((sum, c) => sum + Number(c.amount || 0), 0);
}

function workCost(work) {
  return laborCost(work) + partsCost(work) + extraCost(work);
}

function money(n) {
  return `GHS ${Number(n || 0).toFixed(0)}`;
}

function nextRequestId() {
  const nums = (state.requests || []).map(r => Number(String(r.id).replace(/\D/g, ''))).filter(n => !Number.isNaN(n));
  return `WR-${Math.max(100, ...nums, 0) + 1}`;
}

function nextPoId() {
  const nums = (state.purchaseOrders || []).map(p => Number(String(p.id).replace(/\D/g, ''))).filter(n => !Number.isNaN(n));
  return `PO-${Math.max(1000, ...nums, 0) + 1}`;
}

function nextPmId() {
  const nums = state.schedules.map(s => Number(String(s.id).replace(/\D/g, ''))).filter(n => !Number.isNaN(n));
  return `PM-${Math.max(200, ...nums, 0) + 1}`;
}

function openRequests() {
  return (state.requests || []).filter(r => r.status === 'Submitted');
}

function openPos() {
  return (state.purchaseOrders || []).filter(p => p.status !== 'Received');
}

function maybeReorder(part) {
  if (partOnHand(part) > part.minimum) return;
  const open = (state.purchaseOrders || []).some(po => po.status !== 'Received' && po.lines.some(l => l.partId === part.id));
  if (open) return;
  const qty = Math.max(part.maximum - partOnHand(part), 1);
  state.purchaseOrders.unshift({
    id: nextPoId(), vendor: part.vendor || 'Local stores', status: 'Draft', createdAt: daysFromNow(0),
    lines: [{ partId: part.id, name: part.name, qty, cost: part.unitCost || 0 }]
  });
  notify(`${part.code} reorder`, `Draft ${state.purchaseOrders[0].id} created because ${part.name} is below min.`, { type: 'stock', recordType: 'part', recordId: part.id });
}

function renderDashboard() {
  const open = openWork();
  const overdue = open.filter(isOverdue);
  const lowParts = state.inventory.filter(p => partOnHand(p) <= p.minimum);
  const down = state.assets.filter(a => a.status === 'Down');
  const onTimePm = state.schedules.filter(s => s.date >= daysFromNow(0)).length;
  const compliance = Math.round((onTimePm / Math.max(state.schedules.length, 1)) * 100);
  const dueToday = open.filter(w => w.due === daysFromNow(0)).length;
  const metrics = [
    ['Active', open.length, `${open.filter(w => w.priority === 'High' || w.priority === 'Critical').length} high / critical`, 'i-work', '', 'work-orders'],
    ['Late', overdue.length, overdue.length ? 'Past suggested completion' : 'Nothing late', 'i-alert', overdue.length ? 'danger' : '', 'work-orders'],
    ['Due today', dueToday, `${state.schedules.filter(s => s.date <= daysFromNow(7)).length} PM this week`, 'i-calendar', '', 'maintenance'],
    ['Offline assets', down.length, `${state.assets.filter(a => a.kind !== 'Facility' && a.status !== 'Down').length} online`, 'i-asset', down.length ? 'warn' : '', 'assets'],
    ['Work requests', openRequests().length, `${openPos().length} open POs`, 'i-inbox', openRequests().length ? 'blue' : '', 'requests']
  ];
  document.querySelector('#metricGrid').innerHTML = metrics.map(([label, value, note, icon, tone, view]) => `
    <button class="metric-card ${tone}" data-view-link="${view}">
      <div class="metric-top"><span>${label}</span><span class="metric-icon ${tone}"><svg><use href="#${icon}"/></svg></span></div>
      <div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div>
    </button>`).join('');

  const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const priorities = [...open].sort((a, b) => (rank[a.priority] - rank[b.priority]) || a.due.localeCompare(b.due)).slice(0, 5);
  document.querySelector('#priorityList').innerHTML = priorities.map(w => `
    <button class="queue-item" data-open-wo="${w.id}">
      <span class="priority-line ${w.priority}"></span>
      <div><h3>${escapeHTML(w.title)}</h3><p>${w.id} · ${escapeHTML(w.asset)} · ${prettyDate(w.due)} · ${escapeHTML(w.assignee)}</p></div>
      <div class="queue-meta">
        <span class="status-badge ${statusClass(w.status)}">${w.status}</span>
        <span class="type-badge ${w.type}">${w.type}</span>
      </div>
    </button>`).join('');

  const tracked = state.assets.filter(a => a.kind !== 'Facility').length;
  const onlineAssets = state.assets.filter(a => a.kind !== 'Facility' && a.status !== 'Down').length;
  const percent = Math.round((onlineAssets / Math.max(tracked, 1)) * 100);
  document.querySelector('#healthDonut').style.setProperty('--percent', percent);
  document.querySelector('#healthPercent').textContent = `${percent}%`;
  const onlineCount = state.assets.filter(a => a.kind !== 'Facility' && a.status !== 'Down').length;
  const offlineCount = state.assets.filter(a => a.kind !== 'Facility' && a.status === 'Down').length;
  const attentionCount = state.assets.filter(a => a.kind !== 'Facility' && a.status === 'Attention').length;
  document.querySelector('#healthLegend').innerHTML = [
    ['Online', onlineCount, 'healthy'],
    ['Attention', attentionCount, 'attention'],
    ['Offline', offlineCount, 'down']
  ].map(([label, n, cls]) =>
    `<div class="legend-row"><span><i class="legend-dot ${cls}"></i>${label}</span><strong>${n}</strong></div>`
  ).join('');

  document.querySelector('#crewList').innerHTML = technicians.map(tech => {
    const jobs = open.filter(w => w.assignee === tech.name);
    const hours = jobs.reduce((sum, w) => sum + Math.max(w.estimatedHours - w.loggedHours, 0), 0);
    const load = Math.min(100, Math.round((hours / 8) * 100));
    return `<div class="crew-row">
      <div class="avatar">${tech.initials}</div>
      <div><h3>${escapeHTML(tech.name)}</h3><p>${tech.trade} · ${jobs.length} open · ${hours.toFixed(1)} h</p></div>
      <div class="load-bar ${load > 85 ? 'hot' : ''}"><b style="width:${load}%"></b></div>
    </div>`;
  }).join('');

  renderSchedule('#dashboardSchedule', state.schedules.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3), false);
  document.querySelector('#activityList').innerHTML = state.activity.slice(0, 6).map(item =>
    `<div class="activity-item"><i></i><div><p>${escapeHTML(item.text)}</p><small>${escapeHTML(item.at)}</small></div></div>`
  ).join('');

  document.querySelector('#opsHeadline').textContent = mode === 'technician'
    ? `${currentUserName().split(' ')[0]}, you have ${open.filter(w => w.assignee === currentUserName()).length} assigned work orders`
    : 'Active work order insights';
  document.querySelector('#opsSubhead').textContent = overdue.length
    ? `${overdue.length} late. ${unreadCount()} unread notifications.`
    : `Nothing late. ${unreadCount()} unread notifications.`;
}

function pagerHTML(id, page, total) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(page * PAGE_SIZE, total);
  const buttons = Array.from({ length: pages }, (_, i) => i + 1).map(n =>
    `<button type="button" class="${n === page ? 'active' : ''}" data-page="${id}:${n}">${n}</button>`
  ).join('');
  return `<span>${start}–${end} of ${total}</span><div class="pager-btns">${buttons}</div>`;
}

function assetOnlineLabel(asset) {
  return asset.status === 'Down' ? 'Offline' : 'Online';
}

function workOrderMatches(w) {
  const search = (document.querySelector('#workSearch')?.value || '').toLowerCase();
  const hay = [w.id, w.title, w.asset, w.assignee, w.type, w.location].join(' ').toLowerCase();
  if (search && !hay.includes(search)) return false;
  if (activeFilter !== 'all' && w.status !== activeFilter) return false;
  if (typeFilter !== 'all' && w.type !== typeFilter) return false;
  if (overdueOnly && !isOverdue(w)) return false;
  return true;
}

function renderWorkOrders() {
  const rows = state.workOrders.filter(workOrderMatches);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (workPage > pages) workPage = pages;
  const pageRows = rows.slice((workPage - 1) * PAGE_SIZE, workPage * PAGE_SIZE);
  const selected = id => record.type === 'work' && record.id === id ? 'selected' : '';
  document.querySelector('#workOrderRows').innerHTML = pageRows.map(w => `
    <tr data-open-wo="${w.id}" class="${selected(w.id)}">
      <td class="check-cell"><input type="checkbox" aria-label="Select ${w.id}"></td>
      <td><span class="code-link">${escapeHTML(w.id)}</span></td>
      <td><strong>${escapeHTML(w.title)}</strong><small>${escapeHTML(w.location)}</small></td>
      <td>${escapeHTML(w.asset)}</td>
      <td class="type-cell ${w.type}">${escapeHTML(w.type)}</td>
      <td><span class="priority-badge ${w.priority}">${w.priority}</span></td>
      <td>${escapeHTML(w.assignee)}</td>
      <td><strong>${prettyDate(w.due)}</strong>${isOverdue(w) ? '<small class="due-overdue">Late</small>' : ''}</td>
      <td><span class="status-badge ${statusClass(w.status)}">${w.status}</span></td>
    </tr>`).join('');
  document.querySelector('#workOrderCards').innerHTML = pageRows.map(w => `
    <button class="work-card ${selected(w.id)}" data-open-wo="${w.id}">
      <div class="field-card-top">
        <div><div class="wo-id">${w.id} · ${escapeHTML(w.type)}</div><h3>${escapeHTML(w.title)}</h3></div>
        <span class="status-badge ${statusClass(w.status)}">${w.status}</span>
      </div>
      <div class="field-meta">
        <span>${escapeHTML(w.asset)}</span>
        <span>${prettyDate(w.due)}${isOverdue(w) ? ' · Late' : ''}</span>
        <span class="priority-badge ${w.priority}">${w.priority}</span>
      </div>
    </button>`).join('');
  document.querySelector('#workEmpty').hidden = rows.length > 0;
  document.querySelector('#workPager').innerHTML = pagerHTML('work', workPage, rows.length);
  document.querySelector('#navWorkCount').textContent = openWork().length;
  const mine = openWork().filter(w => w.assignee === currentUserName()).length;
  const mineBadge = document.querySelector('#navMineCount');
  mineBadge.textContent = mine;
  mineBadge.hidden = mine === 0;
  const msgBadge = document.querySelector('#navMsgCount');
  const unread = unreadCount();
  msgBadge.textContent = unread;
  msgBadge.hidden = unread === 0;
  const reqBadge = document.querySelector('#navReqCount');
  if (reqBadge) {
    reqBadge.textContent = openRequests().length;
    reqBadge.hidden = openRequests().length === 0;
  }
  const poBadge = document.querySelector('#navPoCount');
  if (poBadge) {
    poBadge.textContent = openPos().length;
    poBadge.hidden = openPos().length === 0;
  }
}

function renderMyWork() {
  const name = currentUserName();
  const today = daysFromNow(0);
  let jobs = mode === 'planner' ? state.workOrders.filter(w => w.status !== 'Completed') : state.workOrders.filter(w => w.assignee === name);
  if (mineFilter === 'active') jobs = jobs.filter(w => w.status !== 'Completed');
  if (mineFilter === 'today') jobs = jobs.filter(w => w.due <= today && w.status !== 'Completed');
  document.querySelector('#myWorkTitle').textContent = mode === 'technician' ? 'Assigned Work Orders' : 'Active Work Orders';
  document.querySelector('#fieldBoard').innerHTML = jobs.length ? jobs.map(w => {
    const progress = taskProgress(w);
    const action = w.status === 'Completed' ? '' : w.status === 'In Progress'
      ? `<button class="action-button primary" data-wo-action="complete" data-id="${w.id}">Complete</button>
         <button class="action-button warn" data-wo-action="hold" data-id="${w.id}">Hold</button>
         <button class="action-button" data-wo-action="time" data-id="${w.id}">Log time</button>`
      : `<button class="action-button primary" data-wo-action="start" data-id="${w.id}">Start job</button>
         <button class="action-button" data-open-wo="${w.id}">Open record</button>`;
    return `<article class="field-card ${w.priority.toLowerCase()}">
      <div class="field-card-top"><div><div class="wo-id">${w.id} · ${escapeHTML(w.type)}</div><h3>${escapeHTML(w.title)}</h3></div>
      <span class="status-badge ${statusClass(w.status)}">${w.status}</span></div>
      <div class="field-meta">
        <span><svg><use href="#i-asset"/></svg>${escapeHTML(w.asset)}</span>
        <span><svg><use href="#i-pin"/></svg>${escapeHTML(w.location)}</span>
        <span><svg><use href="#i-clock"/></svg>${prettyDate(w.due)}</span>
      </div>
      <div><small>${progress.done}/${progress.total} tasks</small><div class="task-progress"><b style="width:${progress.pct}%"></b></div></div>
      <div class="field-actions">${action}</div>
    </article>`;
  }).join('') : '<div class="empty-state"><h3>Board is clear</h3><p>No jobs match this filter.</p></div>';
}

function assetDepth(asset) {
  let depth = 0; let cur = asset;
  while (cur?.parent) { depth += 1; cur = findAsset(cur.parent); }
  return depth;
}

function renderAssets() {
  const search = (document.querySelector('#assetSearch')?.value || '').toLowerCase();
  let list = state.assets.filter(a => [a.id, a.code, a.name, a.location, a.kind].join(' ').toLowerCase().includes(search));
  if (assetKind !== 'all') {
    const match = new Set(list.filter(a => a.kind === assetKind).map(a => a.id));
    match.forEach(id => {
      let node = findAsset(id);
      while (node?.parent) { match.add(node.parent); node = findAsset(node.parent); }
    });
    list = state.assets.filter(a => match.has(a.id));
  }
  const visible = new Set(list.map(a => a.id));
  const ordered = [];
  const walk = parent => {
    state.assets.filter(a => a.parent === parent && visible.has(a.id)).forEach(a => {
      ordered.push(a);
      if (!collapsed.has(a.id)) walk(a.id);
    });
  };
  walk(null);
  const heading = { all: 'All Assets', Facility: 'Facilities', Equipment: 'Equipment', Tool: 'Tools' }[assetKind] || 'All Assets';
  const assetsHeading = document.querySelector('#assetsHeading');
  if (assetsHeading) assetsHeading.textContent = heading;
  document.querySelector('#assetTree').innerHTML = ordered.map(a => {
    const kids = state.assets.some(c => c.parent === a.id && visible.has(c.id));
    const open = !collapsed.has(a.id);
    const pad = 8 + assetDepth(a) * 16;
    const online = assetOnlineLabel(a);
    return `<div class="tree-row" style="padding-left:${pad}px">
      <span class="check-cell"><input type="checkbox" aria-label="Select ${escapeHTML(a.code)}"></span>
      ${kids ? `<button class="tree-toggle" data-toggle-node="${a.id}">${open ? '▾' : '▸'}</button>` : '<span></span>'}
      <button data-open-asset="${a.id}" style="border:0;background:transparent;text-align:left">
        <strong>${escapeHTML(a.name)}</strong>
        <small style="display:block;color:var(--muted)">${escapeHTML(a.kind)} · ${escapeHTML(a.location)}</small>
      </button>
      <span class="code">${escapeHTML(a.code)}</span>
      <span class="kind-pill">${a.kind}</span>
      <span class="status-badge ${online === 'Offline' ? 'offline' : 'online'}">${online}</span>
    </div>`;
  }).join('') || '<div class="empty-state"><h3>No assets</h3></div>';
}

function renderSchedule(target, schedules, full = true) {
  document.querySelector(target).innerHTML = schedules.map(s => full ? `
    <div class="timeline-group">
      <div class="timeline-date">${prettyDate(s.date)}</div>
      <article class="timeline-card">
        <div><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.asset)} · ${escapeHTML(s.owner)} · ${escapeHTML(s.trigger === 'meter' ? `Every ${s.meterEvery} ${findAsset(s.assetId)?.meter?.unit || 'units'}` : s.interval)}</p></div>
        <button class="action-button primary" data-generate-pm="${s.id}">Generate WO</button>
      </article>
    </div>` : `
    <button class="schedule-item" data-view-link="maintenance">
      <div class="date-block"><small>${new Date(`${s.date}T12:00:00`).toLocaleDateString('en-GB', { month: 'short' })}</small>${new Date(`${s.date}T12:00:00`).getDate()}</div>
      <div><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.asset)}</p></div>
    </button>`).join('');
}

function renderRequests() {
  const rows = document.querySelector('#requestRows');
  if (!rows) return;
  rows.innerHTML = (state.requests || []).map(r => `
    <tr>
      <td><span class="code-link">${escapeHTML(r.id)}</span></td>
      <td><strong>${escapeHTML(r.title)}</strong><small>${escapeHTML(r.notes || '')}</small></td>
      <td>${escapeHTML(r.asset)}</td>
      <td>${escapeHTML(r.requestedBy)}</td>
      <td><span class="priority-badge ${r.priority}">${r.priority}</span></td>
      <td><span class="status-badge ${statusClass(r.status)}">${r.status}${r.convertedTo ? ` · ${r.convertedTo}` : ''}</span></td>
      <td>${r.status === 'Submitted' ? `<button class="action-button primary" data-convert-request="${r.id}">Convert</button> <button class="action-button" data-decline-request="${r.id}">Decline</button>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="7">No work requests.</td></tr>';
}

function renderPurchasing() {
  const rows = document.querySelector('#poRows');
  if (!rows) return;
  rows.innerHTML = (state.purchaseOrders || []).map(po => {
    const total = po.lines.reduce((sum, l) => sum + l.qty * Number(l.cost || 0), 0);
    return `<tr>
      <td><span class="code-link">${escapeHTML(po.id)}</span></td>
      <td>${escapeHTML(po.vendor)}</td>
      <td>${po.lines.map(l => `${escapeHTML(l.name)} × ${l.qty}`).join(', ')}</td>
      <td><strong>${money(total)}</strong></td>
      <td><span class="status-badge ${statusClass(po.status)}">${po.status}</span></td>
      <td>${po.status !== 'Received' ? `<button class="action-button primary" data-receive-po="${po.id}">Receive</button>` : ''}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6">No purchase orders.</td></tr>';
}

function renderInventory() {
  const q = (document.querySelector('#partSearch')?.value || partSearch || '').toLowerCase();
  partSearch = q;
  const all = state.inventory.filter(p => [p.id, p.code, p.name, p.category, binLabel(p)].join(' ').toLowerCase().includes(q));
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  if (partsPage > pages) partsPage = pages;
  const rows = all.slice((partsPage - 1) * PAGE_SIZE, partsPage * PAGE_SIZE);
  const low = state.inventory.filter(p => partOnHand(p) <= p.minimum);
  const units = state.inventory.reduce((sum, p) => sum + partOnHand(p), 0);
  document.querySelector('#inventorySummary').innerHTML = `
    <div class="mini-stat"><span>SKUs</span><strong>${state.inventory.length}</strong></div>
    <div class="mini-stat"><span>Units on hand</span><strong>${units}</strong></div>
    <div class="mini-stat"><span>Below min</span><strong style="color:var(--critical)">${low.length}</strong></div>`;
  document.querySelector('#inventoryRows').innerHTML = rows.map(p => {
    const qty = partOnHand(p);
    const loc = (p.locations || [])[0] || {};
    return `<tr data-open-part="${p.id}">
      <td class="check-cell"><input type="checkbox" aria-label="Select ${p.code}"></td>
      <td><span class="code-link">${escapeHTML(p.code)}</span></td>
      <td>${escapeHTML(p.name)}</td>
      <td>${escapeHTML(loc.location || '—')}</td>
      <td>${escapeHTML(loc.aisle || '—')}</td>
      <td>${escapeHTML(loc.row || '—')}</td>
      <td>${escapeHTML(loc.bin || '—')}</td>
      <td><strong>${qty}</strong></td>
      <td>${p.minimum}</td>
      <td>${p.maximum}</td>
      <td><span class="status-badge ${qty <= p.minimum ? 'down' : 'healthy'}">${qty <= p.minimum ? 'Reorder' : 'In stock'}</span></td>
    </tr>`;
  }).join('');
  const pager = document.querySelector('#partsPager');
  if (pager) pager.innerHTML = pagerHTML('parts', partsPage, all.length);
}

function stockLocations() {
  return [...new Set(state.inventory.flatMap(p => p.locations.map(l => l.location)))];
}

function renderStockTake() {
  const select = document.querySelector('#countLocation');
  const locations = stockLocations();
  if (!select.dataset.ready) {
    select.innerHTML = locations.map(l => `<option>${escapeHTML(l)}</option>`).join('');
    select.dataset.ready = '1';
  }
  const loc = select.value || locations[0];
  const blind = document.querySelector('#blindCount').checked;
  const rows = state.inventory.filter(p => p.locations.some(l => l.location === loc));
  const counted = rows.filter(p => countDraft[p.id] !== undefined && countDraft[p.id] !== '').length;
  document.querySelector('#countProgress').textContent = `${counted} / ${rows.length} counted`;
  document.querySelector('#countRows').innerHTML = rows.map(p => {
    const bin = p.locations.find(l => l.location === loc) || p.locations[0];
    const system = Number(bin.qty || 0);
    const raw = countDraft[p.id];
    const countedQty = raw === undefined || raw === '' ? null : Number(raw);
    const variance = countedQty === null ? '' : countedQty - system;
    const tone = variance === '' ? '' : variance === 0 ? 'pos' : 'neg';
    return `<tr class="count-row" data-count-part="${p.id}">
      <td><strong>${escapeHTML(p.name)}</strong><small>${p.code}</small></td>
      <td>${escapeHTML([bin.aisle && `Aisle ${bin.aisle}`, bin.row && `Row ${bin.row}`, bin.bin && `Bin ${bin.bin}`].filter(Boolean).join(' · ') || '—')}</td>
      <td>${blind ? '—' : system}</td>
      <td><input class="count-input" inputmode="numeric" data-count-input="${p.id}" value="${raw ?? ''}" placeholder="Qty"></td>
      <td class="variance ${tone}">${variance === '' ? '—' : (variance > 0 ? `+${variance}` : variance)}</td>
    </tr>`;
  }).join('');
}

function renderMessages() {
  document.querySelector('#threadList').innerHTML = state.threads.map(t => {
    const last = t.messages[t.messages.length - 1];
    const unread = t.messages.some(m => !m.read && m.from !== currentUserName());
    return `<button class="msg-item ${t.id === activeThread ? 'active' : ''} ${unread ? 'unread' : ''}" data-open-thread="${t.id}">
      <strong>${escapeHTML(t.title)}</strong>
      <small>${escapeHTML(last?.text || '')}</small>
    </button>`;
  }).join('');
  const thread = state.threads.find(t => t.id === activeThread);
  const pane = document.querySelector('#threadPane');
  if (!thread) {
    pane.innerHTML = '<div class="empty-state"><h3>No conversation selected</h3></div>';
    return;
  }
  pane.innerHTML = `
    <div class="msg-thread-head">
      <p class="eyebrow">${thread.type}</p>
      <h2 style="margin:0">${escapeHTML(thread.title)}</h2>
      ${thread.recordId ? `<button class="text-button" data-open-${thread.recordType === 'part' ? 'part' : thread.recordType === 'work' ? 'wo' : 'asset'}="${thread.recordId}">Open record →</button>` : ''}
    </div>
    <div class="msg-thread-body">
      ${thread.messages.map(m => `<div class="bubble ${m.from === currentUserName() ? 'mine' : m.from === 'System' ? 'system' : ''}"><strong>${escapeHTML(m.from)}</strong><p>${escapeHTML(m.text)}</p><small>${escapeHTML(m.at)}</small></div>`).join('')}
    </div>
    <form class="msg-compose" id="replyForm">
      <input name="reply" required placeholder="Reply…">
      <button class="primary-button" type="submit">Send</button>
    </form>`;
}

function renderReports() {
  const completed = state.workOrders.filter(w => w.status === 'Completed');
  document.querySelector('#completedReport').textContent = completed.length;
  const counts = ['Critical', 'High', 'Medium', 'Low'].map(p => [p, state.workOrders.filter(w => w.status !== 'Completed' && w.priority === p).length]);
  const max = Math.max(1, ...counts.map(([, n]) => n));
  document.querySelector('#priorityChart').innerHTML = counts.map(([p, n]) =>
    `<div class="bar-row"><strong>${p}</strong><div class="bar-track"><div class="bar-fill ${p}" style="width:${n / max * 100}%"></div></div><b>${n}</b></div>`
  ).join('');
  const onTimePm = state.schedules.filter(s => s.date >= daysFromNow(0)).length;
  document.querySelector('#pmCompliance').textContent = `${Math.round((onTimePm / Math.max(state.schedules.length, 1)) * 100)}%`;
  const hours = state.workOrders.reduce((sum, w) => sum + (w.loggedHours || 0), 0);
  const cost = completed.reduce((sum, w) => sum + workCost(w), 0);
  const costEl = document.querySelector('#costReport');
  if (costEl) costEl.textContent = money(cost);
  document.querySelector('#insightPills').innerHTML = `<span>${unreadCount()} unread</span><span>${hours.toFixed(1)} h logged</span><span>${openRequests().length} requests</span><span>${openPos().length} open POs</span>`;
}

function renderRecord() {
  const root = document.querySelector('#recordCanvas');
  if (!record.type) { root.innerHTML = ''; return; }
  if (record.type === 'work') renderWorkRecord(root);
  if (record.type === 'asset') renderAssetRecord(root);
  if (record.type === 'part') renderPartRecord(root);
}

function recordChrome(adminTitle, kind, code, title, badges, extra = '', showSave = false) {
  return `<div class="record-page">
    <div class="record-admin-title">${escapeHTML(adminTitle)}</div>
    <div class="record-toolbar">
      <button class="ribbon-btn" data-back-list type="button"><svg><use href="#i-back"/></svg>Back</button>
      ${showSave ? '<button class="ribbon-btn primary" data-save-record type="button">Save</button>' : ''}
      ${showSave ? '<button class="ribbon-btn" data-save-create type="button">Save and Create Another</button>' : ''}
      ${extra}
    </div>
    <div class="record-hero">
      <div class="asset-icon">${escapeHTML(kind.slice(0, 1))}</div>
      <div>
        <p class="wo-id">${kind} ${escapeHTML(code)}</p>
        <h2>${escapeHTML(title)}</h2>
        ${badges}
      </div>
      ${qrMark(code)}
    </div>`;
}

function renderWorkRecord(root) {
  const w = findWork(record.id);
  if (!w) return;
  const progress = taskProgress(w);
  const tabs = {
    details: 'General',
    tasks: `Tasks (${progress.done}/${progress.total})`,
    parts: 'Parts',
    log: 'Labor',
    costs: `Costs (${money(workCost(w))})`,
    messages: 'Messages',
    completion: 'Completion'
  };
  const actions = `
    ${w.status === 'Completed' ? '' : `${w.status === 'In Progress' ? '' : `<button class="ribbon-btn" data-wo-action="start" data-id="${w.id}">${w.status === 'On Hold' ? 'Resume' : 'Start'}</button>`}
    ${w.status === 'In Progress' ? `<button class="ribbon-btn" data-wo-action="hold" data-id="${w.id}">Hold</button>` : ''}
    <button class="ribbon-btn" data-wo-action="time" data-id="${w.id}">Log time</button>
    <button class="ribbon-btn ${w.status === 'In Progress' ? 'primary' : ''}" data-wo-action="complete" data-id="${w.id}">Complete</button>`}
    <button class="ribbon-btn" data-copy-wo="${w.id}">Copy</button>
    <button class="ribbon-btn" data-follow-wo="${w.id}">Follow-up</button>
    <button class="ribbon-btn" data-delete-wo="${w.id}">Delete</button>`;
  const panels = {
    details: `<div class="record-grid" id="woFields">
      <label>Status<select name="status">${['Open', 'In Progress', 'On Hold', 'Completed'].map(s => `<option ${s === w.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label>Asset<select name="assetId">${state.assets.filter(a => a.kind !== 'Facility' || a.id === w.assetId).map(a => `<option value="${a.id}" ${a.id === w.assetId ? 'selected' : ''}>${escapeHTML(a.name)}</option>`).join('')}</select></label>
      <label>Maintenance Type<select name="type">${['Corrective', 'Preventive', 'Inspection', 'Project'].map(t => `<option ${t === w.type ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label>Priority<select name="priority">${['Low', 'Medium', 'High', 'Critical'].map(p => `<option ${p === w.priority ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
      <label>Assigned To<select name="assignee">${people.map(p => `<option ${p.name === w.assignee ? 'selected' : ''}>${escapeHTML(p.name)}</option>`).join('')}</select></label>
      <label>Suggested Completion Date<input name="due" type="date" value="${w.due}"></label>
      <label>Estimated Hours<input name="estimatedHours" type="number" step="0.5" value="${w.estimatedHours}"></label>
      <label>Actual Hours<input name="loggedHours" type="number" step="0.25" value="${w.loggedHours}"></label>
      <label class="full">Summary of Issue<textarea name="summary" rows="2">${escapeHTML(w.summary || w.title)}</textarea></label>
      <label class="full">Work Instructions<textarea name="instructions" rows="3">${escapeHTML(w.instructions || w.description || '')}</textarea></label>
    </div>`,
    tasks: `${(w.tasks || []).map(t => `<div class="task-row"><label><input type="checkbox" data-toggle-task="${t.id}" data-id="${w.id}" ${t.done ? 'checked' : ''}><span>${escapeHTML(t.text)}</span></label>
        ${t.kind === 'inspect' ? `<select data-inspect-result="${t.id}" data-id="${w.id}"><option value="">Result</option><option ${t.result === 'pass' ? 'selected' : ''} value="pass">Pass</option><option ${t.result === 'fail' ? 'selected' : ''} value="fail">Fail</option></select>` : ''}</div>`).join('') || '<p>No tasks yet.</p>'}
      <div class="part-add"><input id="newTaskText" placeholder="Add a task"><button class="action-button primary" data-add-task="${w.id}">Add</button>
      <button class="action-button" data-add-inspect="${w.id}">Add inspection</button></div>`,
    parts: `${(w.partsUsed || []).map(p => `<div class="part-row"><div><strong>${escapeHTML(p.name)}</strong><small> qty ${p.qty}</small></div></div>`).join('') || '<p>No parts issued.</p>'}
      <div class="part-add"><select id="issuePartSelect">${state.inventory.map(p => `<option value="${p.id}">${escapeHTML(p.name)} (${partOnHand(p)})</option>`).join('')}</select>
      <button class="action-button primary" data-issue-part="${w.id}">Issue 1</button></div>`,
    messages: `${(w.comments || []).map(c => `<div class="bubble ${c.from === currentUserName() ? 'mine' : ''}"><strong>${escapeHTML(c.from)}</strong><p>${escapeHTML(c.text)}</p><small>${escapeHTML(c.at)}</small></div>`).join('') || '<p>No messages on this work order.</p>'}
      <div class="part-add"><input id="woComment" placeholder="Message the assigned technician">
      <button class="action-button primary" data-wo-comment="${w.id}">Send</button></div>`,
    log: `${(w.timeLog || []).map(l => `<div class="log-row"><div><strong>${l.hours} h · ${money(l.hours * personRate(w.assignee))}</strong><p>${escapeHTML(l.note || 'Labor')}</p></div><small>${prettyDate(l.at)}</small></div>`).join('') || '<p>No labor logged.</p>'}
      <p><small>${w.loggedHours || 0} h actual vs ${w.estimatedHours || 0} h estimated · ${money(laborCost(w))}</small></p>`,
    costs: `<div class="record-grid">
        <div class="field"><small>Labor</small><strong>${money(laborCost(w))}</strong></div>
        <div class="field"><small>Parts</small><strong>${money(partsCost(w))}</strong></div>
        <div class="field"><small>Other</small><strong>${money(extraCost(w))}</strong></div>
        <div class="field"><small>Total cost</small><strong>${money(workCost(w))}</strong></div>
      </div>
      ${(w.additionalCosts || []).map((c, i) => `<div class="log-row"><div><strong>${money(c.amount)}</strong><p>${escapeHTML(c.desc)}</p></div><button class="text-button" data-remove-cost="${i}" data-id="${w.id}">Remove</button></div>`).join('')}
      <button class="action-button primary" data-add-cost="${w.id}" style="margin-top:12px">Add cost</button>`,
    completion: `<div class="record-grid" id="woComplete">
      <label>Completed On<input name="completedAt" type="date" value="${w.completedAt || ''}"></label>
      <label>Downtime (hours)<input name="downtimeHours" type="number" step="0.25" value="${w.downtimeHours || 0}"></label>
      <label>Failure code<select name="failureCode">${['', 'Wear', 'Breakdown', 'Operator error', 'Scheduled', 'Unknown'].map(c => `<option ${c === (w.failureCode || w.cause || '') ? 'selected' : ''}>${c || '—'}</option>`).join('')}</select></label>
      <label>Cause<input name="cause" value="${escapeHTML(w.cause || '')}" placeholder="Wear, breakdown, scheduled"></label>
      <label class="full">Completion Notes<textarea name="completionNotes" rows="3">${escapeHTML(w.completionNotes || '')}</textarea></label>
      ${w.followUpOf ? `<p class="full">Follow-up of WO ${escapeHTML(w.followUpOf)}</p>` : ''}
      ${w.requestId ? `<p class="full">Converted from ${escapeHTML(w.requestId)}</p>` : ''}
    </div>`
  };
  root.innerHTML = `${recordChrome(`Work Order Administration: WO ${w.id}`, 'Work Order', w.id, w.title, `<span class="status-badge ${statusClass(w.status)}">${w.status}</span> <span class="priority-badge ${w.priority}">${w.priority}</span> <span class="type-badge ${w.type}">${w.type}</span>`, actions, true)}
    <div class="record-body">
      <div class="tabs">${Object.entries(tabs).map(([key, label]) => `<button class="tab ${record.tab === key ? 'active' : ''}" data-tab="${key}">${label}</button>`).join('')}</div>
      <div class="record-panel">${panels[record.tab]}</div>
    </div></div>`;
}

function renderAssetRecord(root) {
  const a = findAsset(record.id);
  if (!a) return;
  const related = state.workOrders.filter(w => w.assetId === a.id || w.asset === a.name);
  const kids = state.assets.filter(c => c.parent === a.id);
  const online = assetOnlineLabel(a);
  const cost = related.reduce((sum, w) => sum + workCost(w), 0);
  root.innerHTML = `${recordChrome(`${a.kind} Administration: ${a.code}`, a.kind, a.code, a.name, `<span class="status-badge ${online === 'Offline' ? 'offline' : 'online'}">${online}</span>`, `<button class="ribbon-btn primary" data-wo-for-asset="${a.name}">New WO</button><button class="ribbon-btn" data-toggle-online="${a.id}">Set ${online === 'Offline' ? 'Online' : 'Offline'}</button>`)}
    <div class="record-body"><div class="record-panel">
    <div class="record-grid" id="assetFields">
      <label>Location<input name="location" value="${escapeHTML(a.location)}"></label>
      <label>Criticality<select name="criticality">${['A', 'B', 'C'].map(c => `<option ${c === (a.criticality || 'B') ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label>Manufacturer<input name="manufacturer" value="${escapeHTML(a.manufacturer || '')}"></label>
      <label>Serial<input name="serial" value="${escapeHTML(a.serial || '')}"></label>
      <label>Warranty<input name="warranty" type="date" value="${a.warranty || ''}"></label>
      <label>Assigned To<select name="assignedTo"><option value="">—</option>${people.map(p => `<option ${p.name === a.assignedTo ? 'selected' : ''}>${escapeHTML(p.name)}</option>`).join('')}</select></label>
      <div class="field"><small>Last service</small><strong>${prettyDate(a.lastService)}</strong></div>
      <div class="field"><small>Next service</small><strong>${prettyDate(a.nextService)}</strong></div>
      ${a.meter ? `<div class="field"><small>${escapeHTML(a.meter.name)}</small><strong>${a.meter.value} ${a.meter.unit}</strong></div>` : ''}
      <div class="field"><small>Maintenance cost</small><strong>${money(cost)}</strong></div>
    </div>
    <div class="record-toolbar" style="background:transparent;padding:12px 0"><button class="ribbon-btn primary" data-save-asset="${a.id}">Save</button></div>
    <h3 style="margin:18px 0 8px">Bill of materials</h3>
    ${(a.bom || []).length ? a.bom.map(line => {
      const part = findPart(line.partId);
      return `<div class="part-row"><div><strong>${escapeHTML(part?.name || line.partId)}</strong><small> qty ${line.qty}</small></div><button class="text-button" data-open-part="${line.partId}">Open</button></div>`;
    }).join('') : '<p>No BOM lines. Issue parts from a work order to build history.</p>'}
    <div class="part-add"><select id="bomPartSelect">${state.inventory.map(p => `<option value="${p.id}">${escapeHTML(p.name)}</option>`).join('')}</select>
    <button class="action-button primary" data-add-bom="${a.id}">Add to BOM</button></div>
    <h3 style="margin:18px 0 8px">Meter history</h3>
    ${(a.meterHistory || []).length ? a.meterHistory.slice(0, 8).map(m => `<div class="log-row"><div><strong>${m.value} ${a.meter?.unit || ''}</strong></div><small>${prettyDate(m.at)}</small></div>`).join('') : '<p>No meter history yet. Use Batch Meter Reading.</p>'}
    <h3 style="margin:18px 0 8px">Under this record</h3>
    ${kids.length ? kids.map(c => `<button class="queue-item" data-open-asset="${c.id}" style="margin-bottom:8px"><span class="priority-line Medium"></span><div><h3>${escapeHTML(c.name)}</h3><p>${c.code} · ${c.kind}</p></div></button>`).join('') : '<p>No child assets.</p>'}
    <h3 style="margin:18px 0 8px">Work Orders</h3>
    ${related.length ? related.slice(0, 8).map(w => `<button class="queue-item" data-open-wo="${w.id}" style="margin-bottom:8px"><span class="priority-line ${w.priority}"></span><div><h3>${escapeHTML(w.title)}</h3><p>${w.id} · ${w.status} · ${money(workCost(w))}</p></div></button>`).join('') : '<p>No work history.</p>'}
    </div></div></div>`;
}

function renderPartRecord(root) {
  const p = findPart(record.id);
  if (!p) return;
  const qty = partOnHand(p);
  root.innerHTML = `${recordChrome(`Part Administration: ${p.code}`, 'Part', p.code, p.name, `<span class="status-badge ${qty <= p.minimum ? 'down' : 'healthy'}">${qty <= p.minimum ? 'Below min' : 'In stock'}</span>`, `<button class="ribbon-btn primary" data-receive-part="${p.id}">Receive</button><button class="ribbon-btn" data-reorder-part="${p.id}">Reorder</button><button class="ribbon-btn" data-view-link="stock-take">Cycle Count</button>`)}
    <div class="record-body"><div class="record-panel">
    <div class="record-grid" id="partFields">
      <div class="field"><small>On hand</small><strong>${qty}</strong></div>
      <label>Min<input name="minimum" type="number" value="${p.minimum}"></label>
      <label>Max<input name="maximum" type="number" value="${p.maximum}"></label>
      <label>Category<input name="category" value="${escapeHTML(p.category)}"></label>
      <label>Unit cost<input name="unitCost" type="number" step="0.01" value="${p.unitCost || 0}"></label>
      <label>Vendor<input name="vendor" value="${escapeHTML(p.vendor || '')}"></label>
      <div class="field"><small>Barcode</small><strong>${escapeHTML(p.barcode)}</strong></div>
    </div>
    <div class="record-toolbar" style="background:transparent;padding:12px 0"><button class="ribbon-btn primary" data-save-part="${p.id}">Save</button></div>
    <h3 style="margin:18px 0 8px">Stock by location</h3>
    <div class="table-card"><table><thead><tr><th>Site</th><th>Location</th><th>Aisle</th><th>Row</th><th>Bin</th><th>Qty</th></tr></thead>
    <tbody>${p.locations.map(l => `<tr><td>${escapeHTML(l.site)}</td><td>${escapeHTML(l.location)}</td><td>${escapeHTML(l.aisle || '—')}</td><td>${escapeHTML(l.row || '—')}</td><td>${escapeHTML(l.bin || '—')}</td><td><strong>${l.qty}</strong></td></tr>`).join('')}</tbody></table></div>
    <h3 style="margin:18px 0 8px">Receipts</h3>
    ${(p.receipts || []).length ? p.receipts.map(r => `<div class="log-row"><div><strong>+${r.qty}</strong><p>${escapeHTML(r.supplier || 'Receipt')} · ${escapeHTML(r.receipt || '')}</p></div><small>${prettyDate(r.at)}</small></div>`).join('') : '<p>No receipts yet. Use Receive when stock arrives.</p>'}
    </div></div></div>`;
}

function renderAll() {
  applyMode();
  renderDashboard();
  renderWorkOrders();
  renderMyWork();
  renderAssets();
  renderSchedule('#maintenanceTimeline', state.schedules.slice().sort((a, b) => a.date.localeCompare(b.date)));
  renderInventory();
  renderStockTake();
  renderMessages();
  renderReports();
  renderRequests();
  renderPurchasing();
  renderRecord();
  populateSelects();
  updateBottomNav();
}

function viewMeta(name) {
  const assetTitle = { all: 'All Assets', Facility: 'Facilities', Equipment: 'Equipment', Tool: 'Tools' }[assetKind] || 'All Assets';
  return {
    dashboard: { title: 'Dashboard', context: 'Safi Sana Ghana Ltd' },
    'my-work': { title: 'Assigned Work Orders', context: 'Maintenance' },
    'work-orders': { title: 'Work Orders', context: 'Maintenance' },
    record: { title: 'Record', context: 'Administration' },
    messages: { title: 'Notifications', context: 'Inbox' },
    assets: { title: assetTitle, context: 'Assets' },
    maintenance: { title: 'Scheduled Maintenance', context: 'Maintenance' },
    requests: { title: 'Work Requests', context: 'Maintenance' },
    inventory: { title: 'Parts And Supplies', context: 'Supplies' },
    'stock-take': { title: 'Inventory Cycle Count', context: 'Supplies' },
    purchasing: { title: 'Purchase Orders', context: 'Supplies' },
    reports: { title: 'Reports', context: 'Insights' }
  }[name] || { title: 'SafiMaintain', context: 'SAFI SANA' };
}

function showView(name, jumpKind) {
  if (name !== 'record') lastListView = name;
  if (name === 'assets' && jumpKind) {
    assetKind = jumpKind;
    document.querySelectorAll('[data-asset-kind]').forEach(x => x.classList.toggle('active', x.dataset.assetKind === assetKind));
    renderAssets();
  }
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
  document.querySelectorAll('.nav-item').forEach(n => {
    const sameView = n.dataset.view === name;
    if (n.dataset.jumpKind) {
      n.classList.toggle('active', sameView && n.dataset.jumpKind === assetKind);
    } else {
      n.classList.toggle('active', sameView);
    }
  });
  const meta = viewMeta(name);
  if (name === 'record' && record.type === 'work') {
    document.querySelector('#pageTitle').textContent = `Work Order Administration: WO ${record.id}`;
    document.querySelector('#contextLabel').textContent = 'Maintenance';
  } else if (name === 'record' && record.type === 'part') {
    document.querySelector('#pageTitle').textContent = `Part Administration: ${findPart(record.id)?.code || ''}`;
    document.querySelector('#contextLabel').textContent = 'Supplies';
  } else if (name === 'record' && record.type === 'asset') {
    const asset = findAsset(record.id);
    document.querySelector('#pageTitle').textContent = `${asset?.kind || 'Asset'} Administration: ${asset?.code || ''}`;
    document.querySelector('#contextLabel').textContent = 'Assets';
  } else {
    document.querySelector('#pageTitle').textContent = meta.title;
    document.querySelector('#contextLabel').textContent = meta.context;
  }
  closeMenu();
  updateBottomNav(name);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBottomNav(name) {
  const active = name || [...document.querySelectorAll('.view')].find(v => v.classList.contains('active'))?.id.replace('view-', '');
  document.querySelectorAll('.bottom-nav [data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === active));
}

function applyMode() {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  const user = currentUser();
  document.querySelector('#userAvatar').textContent = user.initials;
  document.querySelector('#userName').textContent = user.name;
  document.querySelector('#userRole').textContent = user.role;
  document.querySelector('#shiftLabel').textContent = mode === 'technician' ? 'On plant · Operations' : 'Operations · Live';
}

function populateSelects() {
  const workAssets = state.assets.filter(a => a.kind !== 'Facility' || ['OPS', 'CHP', 'MP', 'A415', 'A136'].includes(a.id));
  document.querySelector('#assetSelect').innerHTML = workAssets.map(a => `<option value="${escapeHTML(a.name)}">${escapeHTML(a.name)}</option>`).join('');
  document.querySelector('#assigneeSelect').innerHTML = people.map(p => `<option>${escapeHTML(p.name)}</option>`).join('');
  document.querySelector('#messageToSelect').innerHTML = people.filter(p => p.name !== currentUserName()).map(p => `<option>${escapeHTML(p.name)}</option>`).join('');
  document.querySelector('#messageAboutSelect').innerHTML = `<option value="">General</option>` +
    openWork().map(w => `<option value="work:${w.id}">WO ${w.id} · ${escapeHTML(w.title)}</option>`).join('') +
    state.inventory.map(p => `<option value="part:${p.id}">Part ${p.code} · ${escapeHTML(p.name)}</option>`).join('');
  const reqAsset = document.querySelector('#requestAssetSelect');
  if (reqAsset) reqAsset.innerHTML = state.assets.map(a => `<option value="${a.id}">${escapeHTML(a.name)}</option>`).join('');
  const parentSel = document.querySelector('#assetParentSelect');
  if (parentSel) parentSel.innerHTML = `<option value="">Top level</option>` + state.assets.map(a => `<option value="${a.id}">${escapeHTML(a.name)}</option>`).join('');
  const pmAsset = document.querySelector('#pmAssetSelect');
  if (pmAsset) pmAsset.innerHTML = state.assets.map(a => `<option value="${a.id}">${escapeHTML(a.name)}</option>`).join('');
  const pmOwner = document.querySelector('#pmOwnerSelect');
  if (pmOwner) pmOwner.innerHTML = people.map(p => `<option>${escapeHTML(p.name)}</option>`).join('');
  const poPart = document.querySelector('#poPartSelect');
  if (poPart) poPart.innerHTML = state.inventory.map(p => `<option value="${p.id}">${escapeHTML(p.code)} · ${escapeHTML(p.name)}</option>`).join('');
}

function openWorkOrder(id) {
  record = { type: 'work', id, tab: 'details' };
  showView('record');
  renderRecord();
}
function openAsset(id) {
  record = { type: 'asset', id, tab: 'details' };
  showView('record');
  renderRecord();
}
function openPart(id) {
  record = { type: 'part', id, tab: 'details' };
  showView('record');
  renderRecord();
}

function saveWorkRecord() {
  const w = findWork(record.id);
  if (!w) return false;
  const box = document.querySelector('#woFields');
  const complete = document.querySelector('#woComplete');
  const get = (root, name) => root?.querySelector(`[name="${name}"]`)?.value;
  if (box) {
    w.status = get(box, 'status');
    w.assetId = get(box, 'assetId');
    const asset = findAsset(w.assetId);
    if (asset) { w.asset = asset.name; w.location = asset.location; }
    w.type = get(box, 'type');
    w.priority = get(box, 'priority');
    w.assignee = get(box, 'assignee');
    w.due = get(box, 'due');
    w.estimatedHours = Number(get(box, 'estimatedHours')) || 0;
    w.loggedHours = Number(get(box, 'loggedHours')) || 0;
    w.summary = get(box, 'summary');
    w.instructions = get(box, 'instructions');
  }
  if (complete) {
    w.completedAt = get(complete, 'completedAt') || w.completedAt || '';
    w.downtimeHours = Number(get(complete, 'downtimeHours')) || 0;
    w.failureCode = get(complete, 'failureCode') || '';
    w.cause = get(complete, 'cause') || w.failureCode || '';
    w.completionNotes = get(complete, 'completionNotes') || '';
  }
  if (w.status === 'Completed' && !w.completedAt) w.completedAt = daysFromNow(0);
  logActivity(`${w.id} saved by ${currentUserName()}`);
  saveState();
  showToast(`${w.id} saved`);
  return true;
}

function setWorkStatus(id, status) {
  const item = findWork(id);
  if (!item || item.status === 'Completed') return;
  item.status = status;
  if (status === 'Completed') {
    item.tasks = (item.tasks || []).map(t => ({ ...t, done: true }));
    item.completedAt = item.completedAt || daysFromNow(0);
    const asset = findAsset(item.assetId || item.asset);
    if (asset) asset.lastService = daysFromNow(0);
  }
  if (status === 'In Progress') {
    notify(`WO ${id} started`, `${currentUserName()} started ${item.title}`, { type: 'work', recordType: 'work', recordId: id, with: item.assignee, from: currentUserName() });
  }
  logActivity(`${currentUserName()} marked ${id} ${status.toLowerCase()}`);
  saveState();
  showToast(`${id} · ${status}`);
}

function issuePart(workId, partId) {
  const part = findPart(partId);
  const work = findWork(workId);
  if (!part || !work) return;
  if (partOnHand(part) < 1) { showToast('Not enough stock'); return; }
  const loc = part.locations.find(l => l.qty > 0) || part.locations[0];
  loc.qty -= 1;
  part.quantity = partOnHand(part);
  const existing = (work.partsUsed || []).find(p => p.partId === partId);
  if (existing) existing.qty += 1;
  else work.partsUsed = [...(work.partsUsed || []), { partId, name: part.name, qty: 1 }];
  logActivity(`${part.code} issued to ${workId}`);
  if (part.quantity <= part.minimum) {
    notify(`${part.code} below min`, `${part.name} is now ${part.quantity}.`, { type: 'stock', recordType: 'part', recordId: part.id });
    maybeReorder(part);
  }
  saveState();
  showToast(`${part.code} issued`);
}

function workFromPm(pm) {
  if (state.workOrders.some(w => w.title === pm.title && (w.assetId === pm.assetId || w.asset === pm.asset) && w.status !== 'Completed')) return null;
  const asset = findAsset(pm.assetId || pm.asset);
  return {
    id: nextWorkId(), title: pm.title, asset: pm.asset || asset?.name || '', assetId: pm.assetId, location: asset?.location || 'Operations',
    priority: 'Medium', type: 'Preventive', assignee: pm.owner, due: pm.date || daysFromNow(0), status: 'Open',
    estimatedHours: 2, loggedHours: 0, summary: `${pm.interval || 'Scheduled'} plan.`, instructions: 'Carry out the planned inspection and record condition.',
    createdAt: daysFromNow(0), tasks: (pm.tasks?.length ? pm.tasks : [{ id: 't1', text: 'Carry out planned work', done: false }, { id: 't2', text: 'Record condition / meters', done: false }]),
    partsUsed: [], timeLog: [], comments: [], completedAt: '', completionNotes: '', downtimeHours: 0, cause: '', additionalCosts: []
  };
}

function advancePm(pm) {
  if (pm.trigger === 'time') {
    const d = new Date(`${pm.date || daysFromNow(0)}T12:00:00`);
    d.setDate(d.getDate() + (pm.intervalDays || 30));
    pm.date = d.toISOString().slice(0, 10);
  }
  if (pm.trigger === 'meter') {
    const assetMeter = findAsset(pm.assetId)?.meter;
    pm.lastMeter = assetMeter?.value || pm.lastMeter;
  }
}

function generatePm(id) {
  const pm = state.schedules.find(s => s.id === id);
  if (!pm) return;
  const wo = workFromPm(pm);
  if (!wo) { showToast('A live WO already covers this PM'); return; }
  advancePm(pm);
  state.workOrders.unshift(wo);
  logActivity(`${wo.id} generated from ${pm.id}`);
  saveState();
  openWorkOrder(wo.id);
  showToast(`${wo.id} created from PM`);
}

function generateDuePms() {
  let created = 0;
  state.schedules.filter(s => s.active !== false && s.trigger !== 'meter' && s.date <= daysFromNow(0)).forEach(pm => {
    const wo = workFromPm(pm);
    if (!wo) return;
    advancePm(pm);
    state.workOrders.unshift(wo);
    created += 1;
  });
  if (!created) { showToast('No due schedules without a live WO'); return; }
  logActivity(`${created} PM work orders generated`);
  saveState();
  showView('work-orders');
  showToast(`${created} work order${created === 1 ? '' : 's'} generated`);
}

function checkMeterTriggers() {
  state.schedules.filter(s => s.trigger === 'meter' && s.active !== false).forEach(pm => {
    const asset = findAsset(pm.assetId);
    if (!asset?.meter || !Number(pm.meterEvery || 0)) return;
    if (asset.meter.value < Number(pm.lastMeter || 0) + Number(pm.meterEvery)) return;
    const wo = workFromPm(pm);
    if (!wo) return;
    advancePm(pm);
    state.workOrders.unshift(wo);
    logActivity(`${wo.id} generated from meter trigger ${pm.id}`);
  });
}

function postCount() {
  const locName = document.querySelector('#countLocation').value;
  let changes = 0;
  Object.entries(countDraft).forEach(([id, raw]) => {
    if (raw === '' || raw === undefined) return;
    const part = findPart(id);
    const loc = part?.locations.find(l => l.location === locName);
    if (!part || !loc) return;
    const counted = Number(raw);
    if (counted === loc.qty) return;
    const diff = counted - loc.qty;
    loc.qty = counted;
    part.quantity = partOnHand(part);
    part.receipts = part.receipts || [];
    part.receipts.unshift({ qty: diff, receipt: 'COUNT', supplier: `Cycle count · ${locName}`, at: daysFromNow(0) });
    changes += 1;
  });
  if (!changes) { showToast('No variances to post'); return; }
  logActivity(`${changes} stock lines adjusted by ${currentUserName()}`);
  notify('Stock take posted', `${changes} lines updated at ${locName}.`, { type: 'stock' });
  countDraft = {};
  saveState();
  showToast(`${changes} line${changes === 1 ? '' : 's'} posted`);
}

function receiveStock(partId, qty, receipt, supplier) {
  const part = findPart(partId);
  if (!part) return;
  const loc = part.locations[0];
  loc.qty += qty;
  part.quantity = partOnHand(part);
  part.receipts = part.receipts || [];
  part.receipts.unshift({ qty, receipt, supplier, at: daysFromNow(0) });
  logActivity(`${part.code} received +${qty}`);
  saveState();
  showToast(`${part.code} +${qty}`);
}

function copyWorkOrder(id) {
  const src = findWork(id);
  if (!src) return;
  const copy = structuredClone(src);
  copy.id = nextWorkId();
  copy.status = 'Open';
  copy.loggedHours = 0;
  copy.timeLog = [];
  copy.partsUsed = [];
  copy.completedAt = '';
  copy.comments = [];
  copy.createdAt = daysFromNow(0);
  copy.tasks = (copy.tasks || []).map((t, i) => ({ ...t, id: `t${i + 1}`, done: false, result: '' }));
  copy.followUpOf = '';
  state.workOrders.unshift(copy);
  logActivity(`${copy.id} copied from ${id}`);
  saveState();
  openWorkOrder(copy.id);
  showToast(`${copy.id} created`);
}

function followUpWork(id) {
  const src = findWork(id);
  if (!src) return;
  const wo = {
    id: nextWorkId(), title: `Follow-up: ${src.title}`, asset: src.asset, assetId: src.assetId, location: src.location,
    priority: src.priority, type: 'Corrective', assignee: src.assignee, due: daysFromNow(2), status: 'Open',
    estimatedHours: 2, loggedHours: 0, summary: `Follow-up from WO ${src.id}.`, instructions: src.instructions || '',
    createdAt: daysFromNow(0), tasks: [{ id: 't1', text: 'Investigate remaining defect', done: false }],
    partsUsed: [], timeLog: [], comments: [], followUpOf: src.id, additionalCosts: []
  };
  state.workOrders.unshift(wo);
  logActivity(`${wo.id} follow-up of ${id}`);
  saveState();
  openWorkOrder(wo.id);
  showToast(`${wo.id} follow-up created`);
}

function deleteWorkOrder(id) {
  if (!window.confirm(`Delete work order ${id}?`)) return;
  state.workOrders = state.workOrders.filter(w => w.id !== id);
  logActivity(`${id} deleted by ${currentUserName()}`);
  saveState();
  showView(lastListView === 'record' ? 'work-orders' : lastListView);
  showToast(`${id} deleted`);
}

function convertRequest(id) {
  const req = state.requests.find(r => r.id === id);
  if (!req || req.status !== 'Submitted') return;
  const asset = findAsset(req.assetId || req.asset);
  const wo = {
    id: nextWorkId(), title: req.title, asset: req.asset, assetId: req.assetId, location: asset?.location || 'Operations',
    priority: req.priority, type: 'Corrective', assignee: asset?.assignedTo || currentUserName(), due: daysFromNow(1), status: 'Open',
    estimatedHours: 2, loggedHours: 0, summary: req.notes || req.title, instructions: req.notes || '',
    createdAt: daysFromNow(0), tasks: [{ id: 't1', text: 'Investigate reported issue', done: false }, { id: 't2', text: 'Correct and test', done: false }],
    partsUsed: [], timeLog: [], comments: [], requestId: req.id, additionalCosts: []
  };
  req.status = 'Converted';
  req.convertedTo = wo.id;
  state.workOrders.unshift(wo);
  notify(`WR ${req.id} converted`, `${wo.id} created from request.`, { type: 'work', recordType: 'work', recordId: wo.id, with: wo.assignee, from: currentUserName() });
  logActivity(`${wo.id} converted from ${req.id}`);
  saveState();
  openWorkOrder(wo.id);
  showToast(`${req.id} → ${wo.id}`);
}

function declineRequest(id) {
  const req = state.requests.find(r => r.id === id);
  if (!req) return;
  req.status = 'Declined';
  logActivity(`${id} declined`);
  saveState();
  showToast(`${id} declined`);
}

function receivePo(id) {
  const po = state.purchaseOrders.find(p => p.id === id);
  if (!po || po.status === 'Received') return;
  po.lines.forEach(line => receiveStock(line.partId, line.qty, po.id, po.vendor));
  po.status = 'Received';
  logActivity(`${id} received`);
  saveState();
  showToast(`${id} received`);
}

function saveAssetRecord(id) {
  const a = findAsset(id);
  const box = document.querySelector('#assetFields');
  if (!a || !box) return;
  const get = name => box.querySelector(`[name="${name}"]`)?.value;
  a.location = get('location');
  a.criticality = get('criticality');
  a.manufacturer = get('manufacturer');
  a.serial = get('serial');
  a.warranty = get('warranty');
  a.assignedTo = get('assignedTo');
  saveState();
  showToast(`${a.code} saved`);
}

function savePartRecord(id) {
  const p = findPart(id);
  const box = document.querySelector('#partFields');
  if (!p || !box) return;
  const get = name => box.querySelector(`[name="${name}"]`)?.value;
  p.minimum = Number(get('minimum')) || 0;
  p.maximum = Number(get('maximum')) || 0;
  p.category = get('category');
  p.unitCost = Number(get('unitCost')) || 0;
  p.vendor = get('vendor');
  if (partOnHand(p) <= p.minimum) maybeReorder(p);
  saveState();
  showToast(`${p.code} saved`);
}

function toggleAssetOnline(id) {
  const a = findAsset(id);
  if (!a) return;
  a.status = a.status === 'Down' ? 'Healthy' : 'Down';
  logActivity(`${a.code} set ${a.status === 'Down' ? 'offline' : 'online'}`);
  saveState();
  showToast(`${a.code} ${a.status === 'Down' ? 'offline' : 'online'}`);
}

function openDialog(prefill = {}) {
  const dialog = document.querySelector('#workOrderDialog');
  const form = document.querySelector('#workOrderForm');
  form.reset();
  document.querySelector('[name="due"]').value = daysFromNow(1);
  if (prefill.asset) form.asset.value = prefill.asset;
  if (mode === 'technician') form.assignee.value = currentUserName();
  dialog.showModal();
  form.title.focus();
}

function showToast(message) {
  const t = document.querySelector('#toast');
  t.querySelector('span').textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
function closeMenu() {
  document.querySelector('#sidebar').classList.remove('open');
  document.querySelector('#scrim').classList.remove('show');
}
function exportData() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data: state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `safimaint-backup-${daysFromNow(0)}.json`; a.click();
  URL.revokeObjectURL(url); showToast('Backup downloaded');
}

function openScanner(context = 'all') {
  scanContext = context;
  document.querySelector('#scanOverlay').hidden = false;
  const assets = state.assets.filter(a => a.kind !== 'Facility').map(a => `<button data-scan-asset="${a.id}"><strong>${escapeHTML(a.name)}</strong><br><small>${a.code} · ${escapeHTML(a.location)}</small></button>`);
  const parts = state.inventory.map(p => `<button data-scan-part="${p.id}"><strong>${escapeHTML(p.name)}</strong><br><small>${p.code} · ${escapeHTML(binLabel(p))}</small></button>`);
  document.querySelector('#scanList').innerHTML = (context === 'stock' ? parts : assets.concat(parts)).join('');
}
function closeScanner() { document.querySelector('#scanOverlay').hidden = true; }

function printTags() {
  const items = state.assets.filter(a => a.kind !== 'Facility').slice(0, 12).concat(
    state.inventory.slice(0, 8).map(p => ({ code: p.code, name: p.name, location: binLabel(p), kind: 'Part' }))
  );
  document.querySelector('#printSheet').innerHTML = items.map(item => `
    <article class="print-tag">${qrMark(item.code)}<h3>${escapeHTML(item.name)}</h3><p>${item.code}<br>${escapeHTML(item.location || '')}</p></article>`).join('');
  document.querySelector('#printSheet').hidden = false;
  window.print();
  document.querySelector('#printSheet').hidden = true;
}

function openMeters() {
  const metered = state.assets.filter(a => a.meter);
  document.querySelector('#meterFields').innerHTML = metered.map(a => `
    <label class="full">${escapeHTML(a.name)} (${a.meter.name}, ${a.meter.unit})
      <input name="meter-${a.id}" type="number" value="${a.meter.value}">
    </label>`).join('') || '<p>No meters on the register.</p>';
  document.querySelector('#meterDialog').showModal();
}

function renderSearch(query) {
  const box = document.querySelector('#searchResults');
  const q = query.trim().toLowerCase();
  if (!q) { box.hidden = true; box.innerHTML = ''; return; }
  const hits = [
    ...state.workOrders.filter(w => [w.id, w.title, w.asset].join(' ').toLowerCase().includes(q)).slice(0, 4).map(w => ({ label: w.title, meta: `WO ${w.id}`, action: () => openWorkOrder(w.id) })),
    ...state.assets.filter(a => [a.code, a.name].join(' ').toLowerCase().includes(q)).slice(0, 3).map(a => ({ label: a.name, meta: a.code, action: () => openAsset(a.id) })),
    ...state.inventory.filter(p => [p.code, p.name].join(' ').toLowerCase().includes(q)).slice(0, 3).map(p => ({ label: p.name, meta: p.code, action: () => openPart(p.id) }))
  ];
  box.hidden = hits.length === 0;
  box.innerHTML = hits.map((h, i) => `<button class="search-hit" data-hit="${i}"><strong>${escapeHTML(h.label)}</strong><small>${escapeHTML(h.meta)}</small></button>`).join('');
  box._hits = hits;
}

function handleWorkAction(action, id) {
  if (action === 'start') setWorkStatus(id, 'In Progress');
  if (action === 'hold') setWorkStatus(id, 'On Hold');
  if (action === 'complete') setWorkStatus(id, 'Completed');
  if (action === 'time') { timeTarget = id; document.querySelector('#timeForm').reset(); document.querySelector('#timeDialog').showModal(); }
}

function setupEvents() {
  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => showView(b.dataset.view, b.dataset.jumpKind)));
  document.querySelectorAll('.nav-group').forEach(b => b.addEventListener('click', () => {
    const group = b.dataset.navGroup;
    b.classList.toggle('open');
    document.querySelector(`[data-sub="${group}"]`)?.classList.toggle('open');
  }));
  document.querySelector('#logOffButton')?.addEventListener('click', () => {
    mode = 'planner';
    localStorage.setItem('safimaint-mode', mode);
    applyMode();
    renderAll();
    showView('dashboard');
    showToast('Logged off this device session');
  });
  document.body.addEventListener('click', e => {
    if (e.target.closest('.check-cell, input[type="checkbox"]') && !e.target.closest('[data-page]')) return;
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn) {
      const [which, n] = pageBtn.dataset.page.split(':');
      if (which === 'work') { workPage = Number(n); renderWorkOrders(); }
      if (which === 'parts') { partsPage = Number(n); renderInventory(); }
      return;
    }
    const viewLink = e.target.closest('[data-view-link]');
    if (viewLink) showView(viewLink.dataset.viewLink);
    const openWo = e.target.closest('[data-open-wo]');
    if (openWo && !e.target.closest('.check-cell, input[type="checkbox"]')) openWorkOrder(openWo.dataset.openWo);
    const openAssetBtn = e.target.closest('[data-open-asset]');
    if (openAssetBtn && !e.target.closest('.check-cell, input[type="checkbox"]')) openAsset(openAssetBtn.dataset.openAsset);
    const openPartBtn = e.target.closest('[data-open-part]');
    if (openPartBtn && !e.target.closest('.check-cell, input[type="checkbox"]')) openPart(openPartBtn.dataset.openPart);
    const woAction = e.target.closest('[data-wo-action]');
    if (woAction) handleWorkAction(woAction.dataset.woAction, woAction.dataset.id);
    const generate = e.target.closest('[data-generate-pm]');
    if (generate) generatePm(generate.dataset.generatePm);
    const forAsset = e.target.closest('[data-wo-for-asset]');
    if (forAsset) openDialog({ asset: forAsset.dataset.woForAsset });
    const tab = e.target.closest('[data-tab]');
    if (tab) { record.tab = tab.dataset.tab; renderRecord(); }
    if (e.target.closest('[data-back-list]')) showView(lastListView === 'record' ? 'work-orders' : lastListView);
    if (e.target.closest('[data-save-record]')) saveWorkRecord();
    if (e.target.closest('[data-save-create]')) {
      if (saveWorkRecord()) openDialog();
    }
    const copyWo = e.target.closest('[data-copy-wo]');
    if (copyWo) copyWorkOrder(copyWo.dataset.copyWo);
    const followWo = e.target.closest('[data-follow-wo]');
    if (followWo) followUpWork(followWo.dataset.followWo);
    const delWo = e.target.closest('[data-delete-wo]');
    if (delWo) deleteWorkOrder(delWo.dataset.deleteWo);
    const convert = e.target.closest('[data-convert-request]');
    if (convert) convertRequest(convert.dataset.convertRequest);
    const decline = e.target.closest('[data-decline-request]');
    if (decline) declineRequest(decline.dataset.declineRequest);
    const recvPo = e.target.closest('[data-receive-po]');
    if (recvPo) receivePo(recvPo.dataset.receivePo);
    const saveAsset = e.target.closest('[data-save-asset]');
    if (saveAsset) saveAssetRecord(saveAsset.dataset.saveAsset);
    const savePart = e.target.closest('[data-save-part]');
    if (savePart) savePartRecord(savePart.dataset.savePart);
    const onlineBtn = e.target.closest('[data-toggle-online]');
    if (onlineBtn) toggleAssetOnline(onlineBtn.dataset.toggleOnline);
    const addBom = e.target.closest('[data-add-bom]');
    if (addBom) {
      const asset = findAsset(addBom.dataset.addBom);
      const partId = document.querySelector('#bomPartSelect')?.value;
      if (asset && partId) {
        asset.bom = asset.bom || [];
        const existing = asset.bom.find(l => l.partId === partId);
        if (existing) existing.qty += 1; else asset.bom.push({ partId, qty: 1 });
        saveState();
      }
    }
    const addInspect = e.target.closest('[data-add-inspect]');
    if (addInspect) {
      const work = findWork(addInspect.dataset.addInspect);
      const input = document.querySelector('#newTaskText');
      if (work) {
        work.tasks.push({ id: `t${Date.now()}`, text: input?.value.trim() || 'Inspection point', done: false, kind: 'inspect', result: '' });
        saveState();
      }
    }
    const addCost = e.target.closest('[data-add-cost]');
    if (addCost) {
      timeTarget = addCost.dataset.addCost;
      document.querySelector('#costForm').reset();
      document.querySelector('#costDialog').showModal();
    }
    const removeCost = e.target.closest('[data-remove-cost]');
    if (removeCost) {
      const work = findWork(removeCost.dataset.id);
      if (work) {
        work.additionalCosts.splice(Number(removeCost.dataset.removeCost), 1);
        saveState();
      }
    }
    const reorder = e.target.closest('[data-reorder-part]');
    if (reorder) {
      const part = findPart(reorder.dataset.reorderPart);
      if (part) { maybeReorder(part); saveState(); showView('purchasing'); showToast('Reorder drafted'); }
    }
    const addTask = e.target.closest('[data-add-task]');
    if (addTask) {
      const input = document.querySelector('#newTaskText');
      const work = findWork(addTask.dataset.addTask);
      if (work && input?.value.trim()) { work.tasks.push({ id: `t${Date.now()}`, text: input.value.trim(), done: false }); saveState(); }
    }
    const issue = e.target.closest('[data-issue-part]');
    if (issue) issuePart(issue.dataset.issuePart, document.querySelector('#issuePartSelect').value);
    const comment = e.target.closest('[data-wo-comment]');
    if (comment) {
      const input = document.querySelector('#woComment');
      const work = findWork(comment.dataset.woComment);
      if (work && input?.value.trim()) {
        work.comments = work.comments || [];
        work.comments.push({ from: currentUserName(), text: input.value.trim(), at: stamp() });
        notify(`WO ${work.id}`, input.value.trim(), { type: 'work', recordType: 'work', recordId: work.id, with: work.assignee, from: currentUserName() });
        saveState();
      }
    }
    const receive = e.target.closest('[data-receive-part]');
    if (receive) {
      receiveTarget = receive.dataset.receivePart;
      document.querySelector('#receiveForm').reset();
      document.querySelector('#receiveDialog').showModal();
    }
    const threadBtn = e.target.closest('[data-open-thread]');
    if (threadBtn) {
      activeThread = threadBtn.dataset.openThread;
      const thread = state.threads.find(t => t.id === activeThread);
      thread?.messages.forEach(m => { if (m.from !== currentUserName()) m.read = true; });
      saveState();
    }
    const toggle = e.target.closest('[data-toggle-node]');
    if (toggle) {
      const id = toggle.dataset.toggleNode;
      if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
      renderAssets();
    }
    const scanAsset = e.target.closest('[data-scan-asset]');
    if (scanAsset) { closeScanner(); openAsset(scanAsset.dataset.scanAsset); showToast('Asset tag read'); }
    const scanPart = e.target.closest('[data-scan-part]');
    if (scanPart) {
      closeScanner();
      if (scanContext === 'stock') {
        showView('stock-take');
        countDraft[scanPart.dataset.scanPart] = countDraft[scanPart.dataset.scanPart] ?? '';
        renderStockTake();
        document.querySelector(`[data-count-input="${scanPart.dataset.scanPart}"]`)?.focus();
      } else openPart(scanPart.dataset.scanPart);
      showToast('Part tag read');
    }
    const hit = e.target.closest('[data-hit]');
    if (hit) {
      const item = document.querySelector('#searchResults')._hits?.[Number(hit.dataset.hit)];
      document.querySelector('#searchResults').hidden = true;
      document.querySelector('#globalSearch').value = '';
      item?.action();
    }
  });
  document.body.addEventListener('change', e => {
    const box = e.target.closest('[data-toggle-task]');
    if (box) {
      const work = findWork(box.dataset.id);
      const task = work?.tasks.find(t => t.id === box.dataset.toggleTask);
      if (task) { task.done = box.checked; saveState(); }
    }
    const countInput = e.target.closest('[data-count-input]');
    if (countInput) {
      countDraft[countInput.dataset.countInput] = countInput.value;
      renderStockTake();
    }
    const inspect = e.target.closest('[data-inspect-result]');
    if (inspect) {
      const work = findWork(inspect.dataset.id);
      const task = work?.tasks.find(t => t.id === inspect.dataset.inspectResult);
      if (task) {
        task.result = inspect.value;
        task.done = inspect.value === 'pass' || inspect.value === 'fail';
        if (inspect.value === 'fail') followUpWork(work.id);
        else saveState();
      }
    }
  });
  document.body.addEventListener('submit', e => {
    if (e.target.id !== 'replyForm') return;
    e.preventDefault();
    const text = new FormData(e.target).get('reply').trim();
    const thread = state.threads.find(t => t.id === activeThread);
    if (!thread || !text) return;
    thread.messages.push({ from: currentUserName(), text, at: stamp(), read: true });
    saveState();
  });

  document.querySelectorAll('[data-open-work-order]').forEach(b => b.addEventListener('click', () => openDialog()));
  document.querySelector('#closeDialog').addEventListener('click', () => document.querySelector('#workOrderDialog').close());
  document.querySelector('#cancelDialog').addEventListener('click', () => document.querySelector('#workOrderDialog').close());
  document.querySelector('#workSearch').addEventListener('input', () => { workPage = 1; renderWorkOrders(); });
  document.querySelector('#assetSearch').addEventListener('input', renderAssets);
  document.querySelector('#partSearch')?.addEventListener('input', () => { partsPage = 1; renderInventory(); });
  document.querySelector('#typeFilter').addEventListener('change', e => { typeFilter = e.target.value; workPage = 1; renderWorkOrders(); });
  document.querySelector('#overdueOnly').addEventListener('change', e => { overdueOnly = e.target.checked; workPage = 1; renderWorkOrders(); });
  document.querySelector('#selectAllWork')?.addEventListener('change', e => {
    document.querySelectorAll('#workOrderRows input[type="checkbox"]').forEach(box => { box.checked = e.target.checked; });
  });
  document.querySelector('#exportWorkButton')?.addEventListener('click', exportData);
  document.querySelector('#exportPartsButton')?.addEventListener('click', exportData);
  document.querySelector('#printWorkTags')?.addEventListener('click', printTags);
  document.querySelector('#countLocation').addEventListener('change', () => { countDraft = {}; renderStockTake(); });
  document.querySelector('#blindCount').addEventListener('change', renderStockTake);
  document.querySelector('#submitCountButton').addEventListener('click', postCount);
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    if (!b.dataset.filter) return;
    activeFilter = b.dataset.filter;
    workPage = 1;
    document.querySelectorAll('#view-work-orders [data-filter]').forEach(x => x.classList.toggle('active', x === b));
    renderWorkOrders();
  }));
  document.querySelectorAll('[data-mine-filter]').forEach(b => b.addEventListener('click', () => {
    mineFilter = b.dataset.mineFilter;
    document.querySelectorAll('[data-mine-filter]').forEach(x => x.classList.toggle('active', x === b));
    renderMyWork();
  }));
  document.querySelectorAll('[data-asset-kind]').forEach(b => b.addEventListener('click', () => {
    assetKind = b.dataset.assetKind;
    document.querySelectorAll('[data-asset-kind]').forEach(x => x.classList.toggle('active', x === b));
    renderAssets();
  }));
  document.querySelector('#workOrderForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const asset = findAsset(form.get('asset'));
    const order = {
      id: nextWorkId(), title: form.get('title').trim(), asset: form.get('asset'), assetId: asset?.id || '',
      location: asset?.location || 'Operations', priority: form.get('priority'), type: form.get('type'),
      assignee: form.get('assignee'), due: form.get('due'), status: 'Open',
      estimatedHours: Number(form.get('hours')) || 2, loggedHours: 0,
      summary: form.get('title').trim(), instructions: form.get('description').trim(),
      createdAt: daysFromNow(0),
      tasks: [{ id: 't1', text: 'Make the area safe', done: false }, { id: 't2', text: 'Complete the assigned work', done: false }, { id: 't3', text: 'Test and record the outcome', done: false }],
      partsUsed: [], timeLog: [],       comments: [], completedAt: '', completionNotes: '', downtimeHours: 0, cause: ''
    };
    state.workOrders.unshift(order);
    notify(`WO ${order.id} assigned`, `${order.title} assigned to ${order.assignee}.`, { type: 'work', recordType: 'work', recordId: order.id, with: order.assignee, from: currentUserName() });
    logActivity(`${order.id} raised for ${order.asset}`);
    saveState();
    e.currentTarget.reset();
    document.querySelector('#workOrderDialog').close();
    openWorkOrder(order.id);
    showToast(`${order.id} created`);
  });
  document.querySelector('#messageForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const about = String(form.get('about') || '');
    const [recordType, recordId] = about.split(':');
    state.threads.unshift({
      id: `MSG-${Date.now()}`,
      title: about ? `${recordType === 'work' ? 'WO' : 'Part'} ${recordId}` : form.get('to'),
      type: recordType || 'direct',
      recordType: recordType || '',
      recordId: recordId || '',
      with: form.get('to'),
      messages: [{ from: currentUserName(), text: form.get('text').trim(), at: stamp(), read: true }]
    });
    activeThread = state.threads[0].id;
    saveState();
    document.querySelector('#messageDialog').close();
    showView('messages');
    showToast('Message sent');
  });
  document.querySelector('#receiveForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    receiveStock(receiveTarget, Number(form.get('qty')), form.get('receipt'), form.get('supplier'));
    document.querySelector('#receiveDialog').close();
  });
  document.querySelector('#meterForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    state.assets.forEach(a => {
      if (!a.meter) return;
      const value = form.get(`meter-${a.id}`);
      if (value === null) return;
      const next = Number(value);
      if (next !== a.meter.value) {
        a.meterHistory = a.meterHistory || [];
        a.meterHistory.unshift({ value: next, at: daysFromNow(0) });
        a.meter.value = next;
      }
    });
    logActivity(`Meter readings saved by ${currentUserName()}`);
    checkMeterTriggers();
    saveState();
    document.querySelector('#meterDialog').close();
    showToast('Meters updated');
  });
  document.querySelector('#timeForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const work = findWork(timeTarget);
    if (work) {
      const hours = Number(form.get('hours'));
      work.loggedHours = Number((work.loggedHours + hours).toFixed(2));
      work.timeLog = [...(work.timeLog || []), { hours, note: form.get('note').trim(), at: daysFromNow(0) }];
      if (work.status === 'Open') work.status = 'In Progress';
      saveState();
      showToast('Labor logged');
    }
    document.querySelector('#timeDialog').close();
  });
  document.querySelector('#newMessageButton').addEventListener('click', () => document.querySelector('#messageDialog').showModal());
  document.querySelector('#newRequestButton')?.addEventListener('click', () => document.querySelector('#requestDialog').showModal());
  document.querySelector('#newAssetButton')?.addEventListener('click', () => document.querySelector('#assetDialog').showModal());
  document.querySelector('#newPartButton')?.addEventListener('click', () => document.querySelector('#partDialog').showModal());
  document.querySelector('#newPmButton')?.addEventListener('click', () => {
    document.querySelector('#pmForm').reset();
    document.querySelector('#pmForm [name="date"]').value = daysFromNow(7);
    document.querySelector('#pmDialog').showModal();
  });
  document.querySelector('#newPoButton')?.addEventListener('click', () => document.querySelector('#poDialog').showModal());
  document.querySelector('#generateDuePm')?.addEventListener('click', generateDuePms);
  [['closeRequestDialog', 'cancelRequestDialog', 'requestDialog'], ['closeAssetDialog', 'cancelAssetDialog', 'assetDialog'], ['closePartDialog', 'cancelPartDialog', 'partDialog'], ['closePmDialog', 'cancelPmDialog', 'pmDialog'], ['closePoDialog', 'cancelPoDialog', 'poDialog'], ['closeCostDialog', 'cancelCostDialog', 'costDialog']].forEach(([closeId, cancelId, dialogId]) => {
    [closeId, cancelId].forEach(id => document.querySelector(`#${id}`)?.addEventListener('click', () => document.querySelector(`#${dialogId}`).close()));
  });
  document.querySelector('#requestForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const asset = findAsset(form.get('asset'));
    state.requests.unshift({
      id: nextRequestId(), title: form.get('title').trim(), assetId: asset?.id || '', asset: asset?.name || '',
      requestedBy: currentUserName(), priority: form.get('priority'), status: 'Submitted', notes: form.get('notes').trim(),
      createdAt: daysFromNow(0), convertedTo: ''
    });
    notify('New work request', `${state.requests[0].id}: ${form.get('title')}`, { type: 'work' });
    saveState();
    e.currentTarget.reset();
    document.querySelector('#requestDialog').close();
    showView('requests');
    showToast(`${state.requests[0].id} submitted`);
  });
  document.querySelector('#assetForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const id = form.get('code').trim();
    if (findAsset(id)) { showToast('Code already exists'); return; }
    state.assets.push(normalizeAsset({
      id, code: id, name: form.get('name').trim(), kind: form.get('kind'), parent: form.get('parent') || null,
      location: form.get('location').trim(), status: 'Healthy', lastService: daysFromNow(0), nextService: daysFromNow(30),
      criticality: form.get('criticality'), manufacturer: form.get('manufacturer'), serial: form.get('serial')
    }));
    saveState();
    document.querySelector('#assetDialog').close();
    openAsset(id);
    showToast(`${id} created`);
  });
  document.querySelector('#partForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const id = form.get('code').trim();
    if (findPart(id)) { showToast('Code already exists'); return; }
    const [aisle, row, bin] = String(form.get('bin') || '').split('/').map(s => s.trim());
    state.inventory.unshift(normalizePart({
      id, code: id, name: form.get('name').trim(), category: 'Parts And Supplies', minimum: Number(form.get('minimum')),
      maximum: Number(form.get('maximum')), unitCost: Number(form.get('unitCost') || 0), vendor: form.get('vendor'),
      barcode: id, locations: [{ site: 'SSGL', location: form.get('location').trim(), aisle: aisle || '', row: row || '', bin: bin || '', qty: 0 }], receipts: []
    }));
    saveState();
    document.querySelector('#partDialog').close();
    openPart(id);
    showToast(`${id} created`);
  });
  document.querySelector('#pmForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const asset = findAsset(form.get('assetId'));
    const trigger = form.get('trigger');
    state.schedules.push(normalizePm({
      id: nextPmId(), title: form.get('title').trim(), asset: asset?.name || '', assetId: asset?.id,
      date: form.get('date'), owner: form.get('owner'), trigger,
      interval: trigger === 'meter' ? `Every ${form.get('meterEvery')} ${asset?.meter?.unit || 'units'}` : `Every ${form.get('intervalDays')} days`,
      intervalDays: Number(form.get('intervalDays') || 30), meterEvery: Number(form.get('meterEvery') || 0),
      lastMeter: asset?.meter?.value || 0, active: true
    }));
    saveState();
    document.querySelector('#pmDialog').close();
    showView('maintenance');
    showToast('Schedule created');
  });
  document.querySelector('#poForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const part = findPart(form.get('partId'));
    state.purchaseOrders.unshift({
      id: nextPoId(), vendor: form.get('vendor'), status: 'Submitted', createdAt: daysFromNow(0),
      lines: [{ partId: part.id, name: part.name, qty: Number(form.get('qty')), cost: Number(form.get('cost') || part.unitCost || 0) }]
    });
    saveState();
    document.querySelector('#poDialog').close();
    showView('purchasing');
    showToast(`${state.purchaseOrders[0].id} created`);
  });
  document.querySelector('#costForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const work = findWork(timeTarget);
    if (work) {
      work.additionalCosts = work.additionalCosts || [];
      work.additionalCosts.push({ desc: form.get('desc').trim(), amount: Number(form.get('amount')) });
      saveState();
      showToast('Cost added');
    }
    document.querySelector('#costDialog').close();
  });
  ['closeMessageDialog', 'cancelMessageDialog'].forEach(id => document.querySelector(`#${id}`).addEventListener('click', () => document.querySelector('#messageDialog').close()));
  ['closeReceiveDialog', 'cancelReceiveDialog'].forEach(id => document.querySelector(`#${id}`).addEventListener('click', () => document.querySelector('#receiveDialog').close()));
  ['closeMeterDialog', 'cancelMeterDialog'].forEach(id => document.querySelector(`#${id}`).addEventListener('click', () => document.querySelector('#meterDialog').close()));
  document.querySelector('#closeTimeDialog').addEventListener('click', () => document.querySelector('#timeDialog').close());
  document.querySelector('#cancelTimeDialog').addEventListener('click', () => document.querySelector('#timeDialog').close());
  document.querySelector('#menuButton').addEventListener('click', () => {
    document.querySelector('#sidebar').classList.add('open');
    document.querySelector('#scrim').classList.add('show');
  });
  document.querySelector('#scrim').addEventListener('click', closeMenu);
  document.querySelectorAll('#exportButton, #exportButton2').forEach(b => b.addEventListener('click', exportData));
  document.querySelectorAll('#scanButton, #scanFromField, #scanFromAssets, #scanFab').forEach(b => b.addEventListener('click', () => openScanner('all')));
  document.querySelector('#scanFromCount').addEventListener('click', () => openScanner('stock'));
  document.querySelector('#closeScan').addEventListener('click', closeScanner);
  document.querySelector('#meterButton').addEventListener('click', openMeters);
  document.querySelector('#printTagsButton').addEventListener('click', printTags);
  document.querySelector('#globalSearch').addEventListener('input', e => renderSearch(e.target.value));
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.querySelector('#globalSearch').focus(); }
    if (e.key === 'Escape') closeScanner();
  });
  document.querySelectorAll('.role-btn').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    localStorage.setItem('safimaint-mode', mode);
    applyMode();
    renderAll();
    showView(mode === 'technician' ? 'my-work' : 'dashboard');
    showToast(mode === 'technician' ? 'Field board · Simeon Sakyi' : 'Planner workspace');
  }));
  document.querySelectorAll('.bottom-nav [data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstall = e;
    document.querySelector('#installButton').hidden = false;
  });
  document.querySelector('#installButton').addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    document.querySelector('#installButton').hidden = true;
  });
}

function updateConnection() {
  const online = navigator.onLine;
  document.querySelector('#connectionDot').classList.toggle('offline', !online);
  document.querySelector('#connectionText').textContent = online ? 'Online · saved on device' : 'Offline · queue on device';
  document.querySelector('#syncHint').textContent = 'Timezone (UTC) Zulu';
}

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = tool => { try { Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch (_) {} };
  register({
    name: 'list_open_work_orders',
    title: 'List open work orders',
    description: 'Return the current non-completed maintenance work orders visible in SafiMaintain.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => state.workOrders.filter(w => w.status !== 'Completed')
  });
  register({
    name: 'create_work_order',
    title: 'Create work order',
    description: 'Create a maintenance work order and update the visible SafiMaintain list.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 3 },
        asset: { type: 'string' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
        assignee: { type: 'string' },
        due: { type: 'string', format: 'date' }
      },
      required: ['title', 'asset', 'priority', 'assignee', 'due'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: input => {
      const asset = findAsset(input.asset);
      if (!input || typeof input.title !== 'string' || !asset) throw new Error('Valid title and equipment are required.');
      const order = {
        id: nextWorkId(), status: 'Open', type: 'Corrective', location: asset.location, assetId: asset.id,
        estimatedHours: 2, loggedHours: 0, createdAt: daysFromNow(0), summary: input.title, instructions: '',
        tasks: [{ id: 't1', text: 'Complete the assigned work', done: false }], partsUsed: [], timeLog: [], comments: [], ...input, asset: asset.name
      };
      state.workOrders.unshift(order);
      saveState();
      return order;
    }
  });
}

document.querySelector('#todayLabel').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
setupEvents();
checkMeterTriggers();
renderAll();
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
showView(mode === 'technician' ? 'my-work' : 'dashboard');
updateConnection();
registerWebMCP();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
