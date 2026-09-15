const STORAGE_KEY = 'safimaint-field-v1';
const LEGACY_KEY = 'safimaint-pilot-v1';

const technicians = [
  { name: 'Kwame Mensah', initials: 'KM', trade: 'Mechanical', shift: 'A' },
  { name: 'Esi Agyeman', initials: 'EA', trade: 'Mechanical', shift: 'A' },
  { name: 'Yaw Boateng', initials: 'YB', trade: 'Instrumentation', shift: 'A' },
  { name: 'Ama Owusu', initials: 'AO', trade: 'Electrical', shift: 'B' }
];

const planner = { name: 'Abena Sarpong', initials: 'AS', role: 'Operations manager', trade: 'Planning' };

function daysFromNow(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const seedData = {
  workOrders: [
    {
      id: 'WO-1048', title: 'Inspect unusual vibration', asset: 'Digester Feed Pump 02', assetId: 'AST-001',
      location: 'Digester Hall', priority: 'Critical', type: 'Corrective', assignee: 'Kwame Mensah',
      due: daysFromNow(-1), status: 'Open', estimatedHours: 3, loggedHours: 0,
      description: 'Strong vibration noticed during morning round. Isolate before inspection.',
      createdAt: daysFromNow(-1),
      tasks: [
        { id: 't1', text: 'Lock out / tag out the pump', done: false },
        { id: 't2', text: 'Measure vibration at DE and NDE', done: false },
        { id: 't3', text: 'Check coupling, base bolts, and seal', done: false },
        { id: 't4', text: 'Record findings and recommend next step', done: false }
      ],
      partsUsed: [], timeLog: []
    },
    {
      id: 'WO-1047', title: 'Replace worn drive belt', asset: 'Sludge Dewatering Press', assetId: 'AST-002',
      location: 'Dewatering Bay', priority: 'High', type: 'Corrective', assignee: 'Esi Agyeman',
      due: daysFromNow(0), status: 'In Progress', estimatedHours: 2, loggedHours: 0.75,
      description: 'Replacement belt B-72 is staged in Store A, Rack 3.',
      createdAt: daysFromNow(-2),
      tasks: [
        { id: 't1', text: 'Isolate press and confirm zero energy', done: true },
        { id: 't2', text: 'Remove guard and worn belt', done: true },
        { id: 't3', text: 'Fit BLT-B72 and tension to spec', done: false },
        { id: 't4', text: 'Test run and record amps', done: false }
      ],
      partsUsed: [{ partId: 'PRT-002', name: 'Drive belt B-72', qty: 1 }],
      timeLog: [{ hours: 0.75, note: 'Guards off, old belt removed', at: daysFromNow(0) }]
    },
    {
      id: 'WO-1046', title: 'Check gas pressure reading', asset: 'Biogas Blower 01', assetId: 'AST-003',
      location: 'Gas Room', priority: 'Medium', type: 'Inspection', assignee: 'Yaw Boateng',
      due: daysFromNow(1), status: 'Open', estimatedHours: 1, loggedHours: 0,
      description: 'Verify local gauge against portable instrument.',
      createdAt: daysFromNow(-1),
      tasks: [
        { id: 't1', text: 'Compare local vs portable gauge', done: false },
        { id: 't2', text: 'Check for leaks at fittings', done: false },
        { id: 't3', text: 'Log both readings in the job', done: false }
      ],
      partsUsed: [], timeLog: []
    },
    {
      id: 'WO-1045', title: 'Clean electrical cabinet filters', asset: 'CHP Unit 01', assetId: 'AST-004',
      location: 'Power House', priority: 'Low', type: 'Preventive', assignee: 'Ama Owusu',
      due: daysFromNow(2), status: 'Open', estimatedHours: 1.5, loggedHours: 0,
      description: 'Quarterly cabinet hygiene. Replace mats if loaded.',
      createdAt: daysFromNow(-3),
      tasks: [
        { id: 't1', text: 'Power down auxiliary fans if required', done: false },
        { id: 't2', text: 'Replace G4 filter mats', done: false },
        { id: 't3', text: 'Vacuum cabinet and restore covers', done: false }
      ],
      partsUsed: [], timeLog: []
    },
    {
      id: 'WO-1044', title: 'Lubricate mixer bearings', asset: 'Digester Mixer 03', assetId: 'AST-005',
      location: 'Digester 3', priority: 'Medium', type: 'Preventive', assignee: 'Kwame Mensah',
      due: daysFromNow(-3), status: 'Completed', estimatedHours: 1, loggedHours: 1,
      description: 'Routine lubrication completed.',
      createdAt: daysFromNow(-5),
      tasks: [
        { id: 't1', text: 'Apply grease to both bearings', done: true },
        { id: 't2', text: 'Wipe excess and check for heat', done: true }
      ],
      partsUsed: [], timeLog: [{ hours: 1, note: 'Greased and checked', at: daysFromNow(-3) }]
    },
    {
      id: 'WO-1043', title: 'Seal weep on transfer pump', asset: 'Effluent Transfer Pump', assetId: 'AST-006',
      location: 'Treatment Line', priority: 'High', type: 'Corrective', assignee: 'Kwame Mensah',
      due: daysFromNow(0), status: 'On Hold', estimatedHours: 4, loggedHours: 0.5,
      description: 'Waiting on mechanical seal MS-40-SS from stores.',
      createdAt: daysFromNow(-2),
      tasks: [
        { id: 't1', text: 'Confirm seal kit and gasket set', done: true },
        { id: 't2', text: 'Drain and isolate pump', done: false },
        { id: 't3', text: 'Replace mechanical seal', done: false }
      ],
      partsUsed: [], timeLog: [{ hours: 0.5, note: 'Parts check — seal at min stock', at: daysFromNow(-1) }]
    }
  ],
  assets: [
    { id: 'AST-001', name: 'Digester Feed Pump 02', location: 'Digester Hall', status: 'Down', lastService: daysFromNow(-41), nextService: daysFromNow(3), criticality: 'A', qr: 'SM-AST-001' },
    { id: 'AST-002', name: 'Sludge Dewatering Press', location: 'Dewatering Bay', status: 'Attention', lastService: daysFromNow(-28), nextService: daysFromNow(0), criticality: 'A', qr: 'SM-AST-002' },
    { id: 'AST-003', name: 'Biogas Blower 01', location: 'Gas Room', status: 'Healthy', lastService: daysFromNow(-12), nextService: daysFromNow(14), criticality: 'B', qr: 'SM-AST-003' },
    { id: 'AST-004', name: 'CHP Unit 01', location: 'Power House', status: 'Healthy', lastService: daysFromNow(-7), nextService: daysFromNow(2), criticality: 'A', qr: 'SM-AST-004' },
    { id: 'AST-005', name: 'Digester Mixer 03', location: 'Digester 3', status: 'Healthy', lastService: daysFromNow(-3), nextService: daysFromNow(27), criticality: 'B', qr: 'SM-AST-005' },
    { id: 'AST-006', name: 'Effluent Transfer Pump', location: 'Treatment Line', status: 'Attention', lastService: daysFromNow(-35), nextService: daysFromNow(5), criticality: 'A', qr: 'SM-AST-006' }
  ],
  schedules: [
    { id: 'PM-201', title: 'Weekly safety inspection', asset: 'Sludge Dewatering Press', assetId: 'AST-002', date: daysFromNow(0), owner: 'Esi Agyeman', interval: 'Every week' },
    { id: 'PM-202', title: 'Air filter inspection', asset: 'CHP Unit 01', assetId: 'AST-004', date: daysFromNow(2), owner: 'Ama Owusu', interval: 'Every month' },
    { id: 'PM-203', title: 'Seal and bearing check', asset: 'Digester Feed Pump 02', assetId: 'AST-001', date: daysFromNow(3), owner: 'Kwame Mensah', interval: 'Every month' },
    { id: 'PM-204', title: 'Oil level and leak check', asset: 'Effluent Transfer Pump', assetId: 'AST-006', date: daysFromNow(5), owner: 'Yaw Boateng', interval: 'Every two weeks' },
    { id: 'PM-205', title: 'Full blower service', asset: 'Biogas Blower 01', assetId: 'AST-003', date: daysFromNow(14), owner: 'Kwame Mensah', interval: 'Every quarter' }
  ],
  inventory: [
    { id: 'PRT-001', name: 'Pump mechanical seal', number: 'MS-40-SS', quantity: 2, minimum: 2, location: 'Store A · Bin 12' },
    { id: 'PRT-002', name: 'Drive belt B-72', number: 'BLT-B72', quantity: 1, minimum: 3, location: 'Store A · Rack 3' },
    { id: 'PRT-003', name: 'Bearing 6205-2RS', number: 'BRG-6205', quantity: 8, minimum: 4, location: 'Store A · Bin 08' },
    { id: 'PRT-004', name: 'Hydraulic oil ISO 46', number: 'OIL-ISO46', quantity: 24, minimum: 10, location: 'Store B · Bay 2' },
    { id: 'PRT-005', name: 'Cabinet filter mat', number: 'FLT-G4-20', quantity: 3, minimum: 5, location: 'Store A · Shelf 5' }
  ],
  requests: [
    { id: 'REQ-318', title: 'Oil sheen at mixer 03 walkway', asset: 'Digester Mixer 03', location: 'Digester 3', requester: 'Kofi Adjei', priority: 'High', status: 'Submitted', notes: 'Noticed on night shift. Possible grease purge overflow.', createdAt: daysFromNow(0) },
    { id: 'REQ-317', title: 'Cabinet fan louder than usual', asset: 'CHP Unit 01', location: 'Power House', requester: 'Ama Owusu', priority: 'Medium', status: 'Submitted', notes: 'Started after yesterday’s run-up.', createdAt: daysFromNow(-1) }
  ],
  activity: [
    { text: 'Esi Agyeman started WO-1047 on the dewatering press', at: '08:14' },
    { text: 'Kofi Adjei raised REQ-318 from Digester 3', at: '07:52' },
    { text: 'Drive belt B-72 dropped below minimum stock', at: '07:10' },
    { text: 'Kwame Mensah closed WO-1044 · mixer lubrication', at: 'Yesterday' }
  ]
};

let state = loadState();
let mode = localStorage.getItem('safimaint-mode') || 'planner';
let activeFilter = 'all';
let typeFilter = 'all';
let overdueOnly = false;
let mineFilter = 'active';
let inspector = { type: null, id: null, tab: 'details' };
let timeTarget = null;
let deferredInstall;

function hydrateWorkOrder(order, assets) {
  const asset = (assets || seedData.assets).find(a => a.name === order.asset);
  return {
    ...order,
    type: order.type || 'Corrective',
    location: order.location || asset?.location || 'Plant',
    assetId: order.assetId || asset?.id || '',
    estimatedHours: order.estimatedHours || 2,
    loggedHours: order.loggedHours ?? (order.status === 'Completed' ? 1 : 0),
    createdAt: order.createdAt || order.due,
    tasks: order.tasks || [{ id: 't1', text: 'Complete the assigned work', done: order.status === 'Completed' }],
    partsUsed: order.partsUsed || [],
    timeLog: order.timeLog || [],
    description: order.description || ''
  };
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!stored) return structuredClone(seedData);
    const parsed = JSON.parse(stored);
    parsed.workOrders = (parsed.workOrders || []).map(order => hydrateWorkOrder(order, parsed.assets || seedData.assets));
    parsed.requests = parsed.requests || structuredClone(seedData.requests);
    parsed.activity = parsed.activity || structuredClone(seedData.activity);
    parsed.schedules = parsed.schedules || structuredClone(seedData.schedules);
    parsed.inventory = parsed.inventory || structuredClone(seedData.inventory);
    parsed.assets = parsed.assets || structuredClone(seedData.assets);
    return parsed;
  } catch (_) {
    return structuredClone(seedData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function logActivity(text) {
  const at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  state.activity.unshift({ text, at });
  state.activity = state.activity.slice(0, 12);
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function prettyDate(date) {
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

function currentUserName() {
  return mode === 'technician' ? 'Kwame Mensah' : planner.name;
}

function taskProgress(order) {
  const total = order.tasks?.length || 0;
  const done = (order.tasks || []).filter(t => t.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function openWork() {
  return state.workOrders.filter(w => w.status !== 'Completed');
}

function nextWorkId() {
  return `WO-${Math.max(...state.workOrders.map(w => Number(w.id.split('-')[1]) || 1000), 1000) + 1}`;
}

function nextRequestId() {
  const nums = state.requests.map(r => Number(r.id.split('-')[1]) || 300);
  return `REQ-${Math.max(...nums, 300) + 1}`;
}

function findAsset(nameOrId) {
  return state.assets.find(a => a.name === nameOrId || a.id === nameOrId);
}

function renderDashboard() {
  const open = openWork();
  const overdue = open.filter(isOverdue);
  const lowParts = state.inventory.filter(p => p.quantity <= p.minimum);
  const down = state.assets.filter(a => a.status === 'Down');
  const duePm = state.schedules.filter(s => s.date <= daysFromNow(7)).length;
  const onTimePm = state.schedules.filter(s => s.date >= daysFromNow(0)).length;
  const compliance = Math.round((onTimePm / Math.max(state.schedules.length, 1)) * 100);

  const metrics = [
    ['Open work', open.length, `${open.filter(w => w.priority === 'Critical').length} critical`, 'i-work', '', 'work-orders'],
    ['Overdue', overdue.length, overdue.length ? 'Act before the next round' : 'Nothing overdue', 'i-alert', overdue.length ? 'danger' : '', 'work-orders'],
    ['PM on plan', `${compliance}%`, `${duePm} due this week`, 'i-calendar', compliance < 80 ? 'warn' : '', 'maintenance'],
    ['Assets down', down.length, `${state.assets.length - down.length} available`, 'i-asset', down.length ? 'warn' : '', 'assets'],
    ['Parts at min', lowParts.length, 'Storeroom risk', 'i-box', 'blue', 'inventory']
  ];

  document.querySelector('#metricGrid').innerHTML = metrics.map(([label, value, note, icon, tone, view]) => `
    <button class="metric-card ${tone}" data-view-link="${view}">
      <div class="metric-top"><span>${label}</span><span class="metric-icon ${tone}"><svg><use href="#${icon}"/></svg></span></div>
      <div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div>
    </button>`).join('');

  const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const priorities = [...open].sort((a, b) => (rank[a.priority] - rank[b.priority]) || a.due.localeCompare(b.due)).slice(0, 5);
  document.querySelector('#priorityList').innerHTML = priorities.length ? priorities.map(w => `
    <button class="queue-item" data-open-wo="${w.id}">
      <span class="priority-line ${w.priority}"></span>
      <div>
        <h3>${escapeHTML(w.title)}</h3>
        <p>${escapeHTML(w.asset)} · ${prettyDate(w.due)} · ${escapeHTML(w.assignee)}</p>
      </div>
      <div class="queue-meta">
        <span class="status-badge ${statusClass(w.status)}">${w.status}</span>
        <span class="priority-badge ${w.priority}">${w.priority}</span>
      </div>
    </button>`).join('') : '<div class="empty-state"><h3>All clear</h3><p>No open work needs a decision.</p></div>';

  const healthy = state.assets.filter(a => a.status === 'Healthy').length;
  const percent = Math.round((healthy / state.assets.length) * 100);
  document.querySelector('#healthDonut').style.setProperty('--percent', percent);
  document.querySelector('#healthPercent').textContent = `${percent}%`;
  document.querySelector('#healthLegend').innerHTML = ['Healthy', 'Attention', 'Down'].map(s =>
    `<div class="legend-row"><span><i class="legend-dot ${statusClass(s)}"></i>${s}</span><strong>${state.assets.filter(a => a.status === s).length}</strong></div>`
  ).join('');

  document.querySelector('#crewList').innerHTML = technicians.map(tech => {
    const jobs = open.filter(w => w.assignee === tech.name);
    const hours = jobs.reduce((sum, w) => sum + Math.max(w.estimatedHours - w.loggedHours, 0), 0);
    const load = Math.min(100, Math.round((hours / 8) * 100));
    return `<div class="crew-row">
      <div class="avatar">${tech.initials}</div>
      <div><h3>${escapeHTML(tech.name)}</h3><p>${tech.trade} · ${jobs.length} open · ${hours.toFixed(1)} h</p></div>
      <div class="load-bar ${load > 85 ? 'hot' : ''}" title="${load}% of shift"><b style="width:${load}%"></b></div>
    </div>`;
  }).join('');

  renderSchedule('#dashboardSchedule', state.schedules.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3), false);
  document.querySelector('#activityList').innerHTML = state.activity.slice(0, 6).map(item =>
    `<div class="activity-item"><i></i><div><p>${escapeHTML(item.text)}</p><small>${escapeHTML(item.at)}</small></div></div>`
  ).join('');

  const overdueLine = overdue.length ? `${overdue.length} overdue job${overdue.length > 1 ? 's' : ''} on the board.` : 'No overdue jobs.';
  document.querySelector('#opsHeadline').textContent = mode === 'technician'
    ? `Kwame, you have ${open.filter(w => w.assignee === 'Kwame Mensah').length} jobs on your board`
    : 'Work that needs a decision on the floor';
  document.querySelector('#opsSubhead').textContent = `${overdueLine} PM compliance is ${compliance}% this cycle.`;
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
  const selected = id => inspector.type === 'work' && inspector.id === id ? 'selected' : '';
  document.querySelector('#workOrderRows').innerHTML = rows.map(w => `
    <tr data-open-wo="${w.id}" class="${selected(w.id)}">
      <td><strong>${escapeHTML(w.title)}</strong><small>${w.id} · ${escapeHTML(w.location)}</small></td>
      <td>${escapeHTML(w.asset)}</td>
      <td><span class="type-badge">${escapeHTML(w.type)}</span></td>
      <td><span class="priority-badge ${w.priority}">${w.priority}</span></td>
      <td>${escapeHTML(w.assignee)}</td>
      <td><strong>${prettyDate(w.due)}</strong>${isOverdue(w) ? '<small class="due-overdue">Overdue</small>' : ''}</td>
      <td><span class="status-badge ${statusClass(w.status)}">${w.status}</span></td>
    </tr>`).join('');
  document.querySelector('#workOrderCards').innerHTML = rows.map(w => `
    <button class="work-card ${selected(w.id)}" data-open-wo="${w.id}">
      <div class="field-card-top">
        <div>
          <div class="wo-id">${w.id} · ${escapeHTML(w.type)}</div>
          <h3>${escapeHTML(w.title)}</h3>
        </div>
        <span class="status-badge ${statusClass(w.status)}">${w.status}</span>
      </div>
      <div class="field-meta">
        <span>${escapeHTML(w.asset)}</span>
        <span>${prettyDate(w.due)}${isOverdue(w) ? ' · Overdue' : ''}</span>
        <span class="priority-badge ${w.priority}">${w.priority}</span>
      </div>
    </button>`).join('');
  document.querySelector('#workEmpty').hidden = rows.length > 0;
  const openCount = openWork().length;
  document.querySelector('#navWorkCount').textContent = openCount;
  const mine = openWork().filter(w => w.assignee === currentUserName()).length;
  const mineBadge = document.querySelector('#navMineCount');
  mineBadge.textContent = mine;
  mineBadge.hidden = mine === 0;
  const reqCount = state.requests.filter(r => r.status === 'Submitted').length;
  const reqBadge = document.querySelector('#navRequestCount');
  reqBadge.textContent = reqCount;
  reqBadge.hidden = reqCount === 0;
}

function renderMyWork() {
  const name = currentUserName();
  const today = daysFromNow(0);
  let jobs = state.workOrders.filter(w => w.assignee === name);
  if (mode === 'planner') jobs = state.workOrders.filter(w => w.status !== 'Completed');
  if (mineFilter === 'active') jobs = jobs.filter(w => w.status !== 'Completed');
  if (mineFilter === 'today') jobs = jobs.filter(w => w.due <= today && w.status !== 'Completed');

  document.querySelector('#myWorkTitle').textContent = mode === 'technician' ? 'Assigned to you' : 'Shift board';
  document.querySelector('#fieldBoard').innerHTML = jobs.length ? jobs.map(w => {
    const progress = taskProgress(w);
    const action = w.status === 'Completed' ? '' : w.status === 'In Progress'
      ? `<button class="action-button primary" data-wo-action="complete" data-id="${w.id}">Complete</button>
         <button class="action-button warn" data-wo-action="hold" data-id="${w.id}">Hold</button>
         <button class="action-button" data-wo-action="time" data-id="${w.id}">Log time</button>`
      : `<button class="action-button primary" data-wo-action="start" data-id="${w.id}">Start job</button>
         <button class="action-button" data-open-wo="${w.id}">Open record</button>`;
    return `<article class="field-card ${w.priority.toLowerCase()}">
      <div class="field-card-top">
        <div>
          <div class="wo-id">${w.id} · ${escapeHTML(w.type)}</div>
          <h3>${escapeHTML(w.title)}</h3>
        </div>
        <span class="status-badge ${statusClass(w.status)}">${w.status}</span>
      </div>
      <div class="field-meta">
        <span><svg><use href="#i-asset"/></svg>${escapeHTML(w.asset)}</span>
        <span><svg><use href="#i-pin"/></svg>${escapeHTML(w.location)}</span>
        <span><svg><use href="#i-clock"/></svg>${prettyDate(w.due)}${isOverdue(w) ? ' · Overdue' : ''}</span>
        <span><svg><use href="#i-user"/></svg>${escapeHTML(w.assignee)}</span>
      </div>
      <div>
        <small>${progress.done}/${progress.total} tasks</small>
        <div class="task-progress"><b style="width:${progress.pct}%"></b></div>
      </div>
      <div class="field-actions">${action}</div>
    </article>`;
  }).join('') : '<div class="empty-state"><svg><use href="#i-check"/></svg><h3>Board is clear</h3><p>No jobs match this filter.</p></div>';
}

function renderAssets() {
  const search = (document.querySelector('#assetSearch')?.value || '').toLowerCase();
  document.querySelector('#assetGrid').innerHTML = state.assets
    .filter(a => [a.id, a.name, a.location, a.qr].join(' ').toLowerCase().includes(search))
    .map(a => {
      const open = openWork().filter(w => w.asset === a.name).length;
      return `<button class="asset-card" data-open-asset="${a.id}">
        <div class="asset-card-head">
          <div class="asset-title">
            <span class="asset-icon"><svg><use href="#i-asset"/></svg></span>
            <div><h3>${escapeHTML(a.name)}</h3><p>${a.id} · ${escapeHTML(a.location)}</p></div>
          </div>
          <span class="status-badge ${statusClass(a.status)}">${a.status}</span>
        </div>
        <div class="asset-meta">
          <div><small>Last service</small><strong>${prettyDate(a.lastService)}</strong></div>
          <div><small>Next service</small><strong>${prettyDate(a.nextService)}</strong></div>
          <div><small>Open work</small><strong>${open}</strong></div>
          <div><small>Criticality</small><strong>${a.criticality || 'B'}</strong></div>
        </div>
      </button>`;
    }).join('');
}

function renderSchedule(target, schedules, full = true) {
  document.querySelector(target).innerHTML = schedules.map(s => full ? `
    <div class="timeline-group">
      <div class="timeline-date">${prettyDate(s.date)}</div>
      <article class="timeline-card">
        <div>
          <h3>${escapeHTML(s.title)}</h3>
          <p>${escapeHTML(s.asset)} · ${escapeHTML(s.owner)} · ${escapeHTML(s.interval)}</p>
        </div>
        <button class="action-button primary" data-generate-pm="${s.id}">Generate WO</button>
      </article>
    </div>` : `
    <button class="schedule-item" data-view-link="maintenance">
      <div class="date-block"><small>${new Date(`${s.date}T12:00:00`).toLocaleDateString('en-GB', { month: 'short' })}</small>${new Date(`${s.date}T12:00:00`).getDate()}</div>
      <div><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.asset)}</p></div>
    </button>`).join('');
}

function renderInventory() {
  const low = state.inventory.filter(p => p.quantity <= p.minimum);
  const units = state.inventory.reduce((sum, p) => sum + p.quantity, 0);
  document.querySelector('#inventorySummary').innerHTML = `
    <div class="mini-stat"><span>SKUs in store</span><strong>${state.inventory.length}</strong></div>
    <div class="mini-stat"><span>Units on hand</span><strong>${units}</strong></div>
    <div class="mini-stat"><span>At or below min</span><strong style="color:var(--critical)">${low.length}</strong></div>`;
  document.querySelector('#inventoryRows').innerHTML = state.inventory.map(p => `
    <tr>
      <td><strong>${escapeHTML(p.name)}</strong></td>
      <td>${p.number}</td>
      <td><strong>${p.quantity}</strong></td>
      <td>${p.minimum}</td>
      <td>${escapeHTML(p.location)}</td>
      <td><span class="status-badge ${p.quantity <= p.minimum ? 'down' : 'healthy'}">${p.quantity <= p.minimum ? 'Reorder' : 'In stock'}</span></td>
    </tr>`).join('');
}

function renderRequests() {
  document.querySelector('#requestGrid').innerHTML = state.requests.length ? state.requests.map(r => `
    <article class="request-card">
      <div>
        <div class="wo-id" style="font-size:.72rem;font-weight:800;letter-spacing:.06em;color:var(--muted)">${r.id}</div>
        <h3>${escapeHTML(r.title)}</h3>
        <p>${escapeHTML(r.asset)} · ${escapeHTML(r.location)} · ${escapeHTML(r.requester)} · ${prettyDate(r.createdAt)}</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="priority-badge ${r.priority}">${r.priority}</span>
        <span class="status-badge ${statusClass(r.status)}">${r.status}</span>
        ${r.status === 'Submitted' ? `<button class="action-button primary" data-convert-request="${r.id}">Convert to WO</button>` : ''}
      </div>
    </article>`).join('') : '<div class="empty-state"><h3>No requests</h3><p>The floor is quiet.</p></div>';
}

function renderReports() {
  const completed = state.workOrders.filter(w => w.status === 'Completed').length;
  document.querySelector('#completedReport').textContent = completed;
  const counts = ['Critical', 'High', 'Medium', 'Low'].map(p => [p, state.workOrders.filter(w => w.status !== 'Completed' && w.priority === p).length]);
  const max = Math.max(1, ...counts.map(([, n]) => n));
  document.querySelector('#priorityChart').innerHTML = counts.map(([p, n]) =>
    `<div class="bar-row"><strong>${p}</strong><div class="bar-track"><div class="bar-fill ${p}" style="width:${n / max * 100}%"></div></div><b>${n}</b></div>`
  ).join('');
  const onTimePm = state.schedules.filter(s => s.date >= daysFromNow(0)).length;
  const compliance = Math.round((onTimePm / Math.max(state.schedules.length, 1)) * 100);
  document.querySelector('#pmCompliance').textContent = `${compliance}%`;
  document.querySelector('#completedCopy').textContent = completed ? 'Closed jobs stay on this device for the shift brief.' : 'No closures logged yet this period.';
  const planned = state.workOrders.filter(w => w.type === 'Preventive' && w.status !== 'Completed').length;
  const unplanned = state.workOrders.filter(w => w.type !== 'Preventive' && w.status !== 'Completed').length;
  const hours = state.workOrders.reduce((sum, w) => sum + (w.loggedHours || 0), 0);
  document.querySelector('#insightPills').innerHTML = `
    <span>${planned} planned open</span>
    <span>${unplanned} unplanned open</span>
    <span>${hours.toFixed(1)} h logged</span>`;
}

function renderInspector() {
  const root = document.querySelector('#inspector');
  const shell = document.querySelector('#appShell');
  if (!inspector.type) {
    root.innerHTML = '';
    root.setAttribute('aria-hidden', 'true');
    shell.classList.remove('inspector-open');
    document.querySelector('#inspectorScrim').classList.remove('show');
    return;
  }
  shell.classList.add('inspector-open');
  document.querySelector('#inspectorScrim').classList.add('show');
  root.setAttribute('aria-hidden', 'false');
  if (inspector.type === 'work') renderWorkInspector();
  if (inspector.type === 'asset') renderAssetInspector();
}

function renderWorkInspector() {
  const w = state.workOrders.find(item => item.id === inspector.id);
  if (!w) { inspector = { type: null, id: null, tab: 'details' }; renderInspector(); return; }
  const asset = findAsset(w.asset);
  const progress = taskProgress(w);
  const tabs = { details: 'Details', tasks: `Tasks (${progress.done}/${progress.total})`, parts: 'Parts', time: 'Time' };
  const actions = w.status === 'Completed' ? '<span class="status-badge completed">Closed</span>' : `
    ${w.status === 'In Progress' ? '' : `<button class="action-button primary" data-wo-action="start" data-id="${w.id}">${w.status === 'On Hold' ? 'Resume' : 'Start'}</button>`}
    ${w.status === 'In Progress' ? `<button class="action-button warn" data-wo-action="hold" data-id="${w.id}">Hold</button>` : ''}
    <button class="action-button" data-wo-action="time" data-id="${w.id}">Log time</button>
    <button class="action-button ${w.status === 'In Progress' ? 'primary' : ''}" data-wo-action="complete" data-id="${w.id}">Complete</button>`;

  const panels = {
    details: `<div class="detail-grid">
      <div><small>Asset</small><strong>${escapeHTML(w.asset)}</strong></div>
      <div><small>Location</small><strong>${escapeHTML(w.location)}</strong></div>
      <div><small>Type</small><strong>${escapeHTML(w.type)}</strong></div>
      <div><small>Priority</small><strong>${escapeHTML(w.priority)}</strong></div>
      <div><small>Assigned</small><strong>${escapeHTML(w.assignee)}</strong></div>
      <div><small>Due</small><strong>${prettyDate(w.due)}${isOverdue(w) ? ' · Overdue' : ''}</strong></div>
      <div><small>Estimate</small><strong>${w.estimatedHours} h</strong></div>
      <div><small>Logged</small><strong>${w.loggedHours} h</strong></div>
      <div class="full"><small>Job notes</small><p>${escapeHTML(w.description) || 'No extra notes.'}</p></div>
      ${asset ? `<div class="full"><button class="wide-button" data-open-asset="${asset.id}">Open asset record</button></div>` : ''}
    </div>`,
    tasks: `${(w.tasks || []).map(t => `
      <div class="task-row">
        <label><input type="checkbox" data-toggle-task="${t.id}" data-id="${w.id}" ${t.done ? 'checked' : ''}><span>${escapeHTML(t.text)}</span></label>
      </div>`).join('') || '<p>No checklist on this job.</p>'}
      <div class="part-add">
        <input id="newTaskText" placeholder="Add a field task">
        <button class="action-button primary" data-add-task="${w.id}">Add</button>
      </div>`,
    parts: `${(w.partsUsed || []).map(p => `<div class="part-row"><div><strong>${escapeHTML(p.name)}</strong><small> qty ${p.qty}</small></div></div>`).join('') || '<p>No parts issued yet.</p>'}
      <div class="part-add">
        <select id="issuePartSelect">${state.inventory.map(p => `<option value="${p.id}">${escapeHTML(p.name)} (${p.quantity})</option>`).join('')}</select>
        <button class="action-button primary" data-issue-part="${w.id}">Issue 1</button>
      </div>`,
    time: `${(w.timeLog || []).map(l => `<div class="log-row"><div><strong>${l.hours} h</strong><p>${escapeHTML(l.note || 'Labor')}</p></div><small>${prettyDate(l.at)}</small></div>`).join('') || '<p>No labor logged.</p>'}
      <p style="margin-top:12px;color:var(--muted)">${w.loggedHours} of ${w.estimatedHours} h estimated.</p>`
  };

  document.querySelector('#inspector').innerHTML = `<div class="inspector-inner">
    <div class="inspector-head">
      <div style="flex:1;min-width:0">
        <p class="wo-id">${w.id}</p>
        <h2>${escapeHTML(w.title)}</h2>
        <span class="status-badge ${statusClass(w.status)}">${w.status}</span>
        <span class="priority-badge ${w.priority}">${w.priority}</span>
      </div>
      <button class="icon-button" id="closeInspector" aria-label="Close record"><svg><use href="#i-close"/></svg></button>
    </div>
    <div class="inspector-actions">${actions}</div>
    <div class="tabs">${Object.entries(tabs).map(([key, label]) =>
      `<button class="tab ${inspector.tab === key ? 'active' : ''}" data-tab="${key}">${label}</button>`).join('')}</div>
    <div class="inspector-body">${panels[inspector.tab]}</div>
  </div>`;
}

function renderAssetInspector() {
  const a = state.assets.find(item => item.id === inspector.id);
  if (!a) { inspector = { type: null, id: null, tab: 'details' }; renderInspector(); return; }
  const related = state.workOrders.filter(w => w.asset === a.name);
  const pms = state.schedules.filter(s => s.asset === a.name);
  document.querySelector('#inspector').innerHTML = `<div class="inspector-inner">
    <div class="inspector-head">
      <div style="flex:1;min-width:0">
        <p class="wo-id">${a.id} · ${escapeHTML(a.qr || a.id)}</p>
        <h2>${escapeHTML(a.name)}</h2>
        <span class="status-badge ${statusClass(a.status)}">${a.status}</span>
      </div>
      <button class="icon-button" id="closeInspector" aria-label="Close record"><svg><use href="#i-close"/></svg></button>
    </div>
    <div class="inspector-actions">
      <button class="action-button primary" data-wo-for-asset="${a.name}">New WO</button>
      <button class="action-button" data-view-link="work-orders">Related work</button>
    </div>
    <div class="inspector-body">
      <div class="detail-grid">
        <div><small>Location</small><strong>${escapeHTML(a.location)}</strong></div>
        <div><small>Criticality</small><strong>${a.criticality || 'B'}</strong></div>
        <div><small>Last service</small><strong>${prettyDate(a.lastService)}</strong></div>
        <div><small>Next service</small><strong>${prettyDate(a.nextService)}</strong></div>
      </div>
      <h3 style="margin:18px 0 8px;font-size:.9rem">Open and recent work</h3>
      ${related.length ? related.slice(0, 6).map(w => `<button class="queue-item" data-open-wo="${w.id}" style="margin-bottom:8px">
        <span class="priority-line ${w.priority}"></span>
        <div><h3>${escapeHTML(w.title)}</h3><p>${w.id} · ${w.status}</p></div>
      </button>`).join('') : '<p>No work history on this asset yet.</p>'}
      <h3 style="margin:18px 0 8px;font-size:.9rem">Preventive plan</h3>
      ${pms.map(s => `<p>${escapeHTML(s.title)} · ${prettyDate(s.date)} · ${escapeHTML(s.interval)}</p>`).join('') || '<p>No PM attached.</p>'}
    </div>
  </div>`;
}

function renderAll() {
  applyMode();
  renderDashboard();
  renderWorkOrders();
  renderMyWork();
  renderAssets();
  renderSchedule('#maintenanceTimeline', state.schedules.slice().sort((a, b) => a.date.localeCompare(b.date)));
  renderInventory();
  renderRequests();
  renderReports();
  populateSelects();
  renderInspector();
  updateBottomNav();
}

function viewMeta(name) {
  return {
    dashboard: { title: mode === 'technician' ? 'Shift overview' : 'Command Center', context: 'Operations · Tema Biogas' },
    'my-work': { title: 'My Work', context: 'Field board · live' },
    'work-orders': { title: 'Work Orders', context: 'Planning · execution' },
    requests: { title: 'Requests', context: 'Floor observations' },
    assets: { title: 'Assets', context: 'Plant register' },
    maintenance: { title: 'Preventive', context: 'Time-based plans' },
    inventory: { title: 'Parts', context: 'Storeroom' },
    reports: { title: 'Insights', context: 'Shift brief' }
  }[name] || { title: 'SafiMaintain', context: 'Field CMMS' };
}

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  const meta = viewMeta(name);
  document.querySelector('#pageTitle').textContent = meta.title;
  document.querySelector('#contextLabel').textContent = meta.context;
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
  document.querySelector('#userAvatar').textContent = mode === 'technician' ? 'KM' : planner.initials;
  document.querySelector('#userName').textContent = mode === 'technician' ? 'Kwame Mensah' : planner.name;
  document.querySelector('#userRole').textContent = mode === 'technician' ? 'Mechanical · Shift A' : planner.role;
  document.querySelector('#shiftLabel').textContent = mode === 'technician' ? 'Shift A · On plant' : 'Shift A · Live';
}

function populateSelects() {
  const assetOptions = state.assets.map(a => `<option value="${escapeHTML(a.name)}">${escapeHTML(a.name)}</option>`).join('');
  document.querySelector('#assetSelect').innerHTML = assetOptions;
  document.querySelector('#requestAssetSelect').innerHTML = assetOptions;
  document.querySelector('#assigneeSelect').innerHTML = technicians.map(t => `<option>${escapeHTML(t.name)}</option>`).join('');
}

function openWorkOrder(id) {
  inspector = { type: 'work', id, tab: 'details' };
  renderWorkOrders();
  renderInspector();
}

function openAsset(id) {
  inspector = { type: 'asset', id, tab: 'details' };
  renderInspector();
}

function closeInspector() {
  inspector = { type: null, id: null, tab: 'details' };
  renderWorkOrders();
  renderInspector();
}

function setWorkStatus(id, status) {
  const item = state.workOrders.find(w => w.id === id);
  if (!item || item.status === 'Completed') return;
  item.status = status;
  if (status === 'Completed') {
    item.tasks = (item.tasks || []).map(t => ({ ...t, done: true }));
    const asset = findAsset(item.asset);
    if (asset) asset.lastService = daysFromNow(0);
  }
  logActivity(`${currentUserName()} marked ${id} ${status.toLowerCase()}`);
  saveState();
  showToast(`${id} · ${status}`);
}

function issuePart(workId, partId) {
  const part = state.inventory.find(p => p.id === partId);
  const work = state.workOrders.find(w => w.id === workId);
  if (!part || !work) return;
  if (part.quantity < 1) { showToast('Not enough stock'); return; }
  part.quantity -= 1;
  const existing = (work.partsUsed || []).find(p => p.partId === partId);
  if (existing) existing.qty += 1;
  else work.partsUsed = [...(work.partsUsed || []), { partId, name: part.name, qty: 1 }];
  logActivity(`${part.name} issued to ${workId}`);
  saveState();
  showToast(`${part.number} issued`);
}

function generatePm(id) {
  const pm = state.schedules.find(s => s.id === id);
  if (!pm) return;
  const exists = state.workOrders.some(w => w.title === pm.title && w.asset === pm.asset && w.status !== 'Completed');
  if (exists) { showToast('A live WO already covers this PM'); return; }
  const wo = {
    id: nextWorkId(), title: pm.title, asset: pm.asset, assetId: pm.assetId, location: findAsset(pm.asset)?.location || 'Plant',
    priority: 'Medium', type: 'Preventive', assignee: pm.owner, due: pm.date, status: 'Open',
    estimatedHours: 2, loggedHours: 0, description: `${pm.interval} preventive task generated from the plan.`,
    createdAt: daysFromNow(0),
    tasks: [
      { id: 't1', text: 'Carry out the planned inspection', done: false },
      { id: 't2', text: 'Record meter / condition notes', done: false },
      { id: 't3', text: 'Close out or raise follow-up work', done: false }
    ],
    partsUsed: [], timeLog: []
  };
  state.workOrders.unshift(wo);
  logActivity(`${wo.id} generated from ${pm.id}`);
  saveState();
  showView('work-orders');
  openWorkOrder(wo.id);
  showToast(`${wo.id} created from PM`);
}

function convertRequest(id) {
  const req = state.requests.find(r => r.id === id);
  if (!req || req.status !== 'Submitted') return;
  const wo = {
    id: nextWorkId(), title: req.title, asset: req.asset, assetId: findAsset(req.asset)?.id || '',
    location: req.location, priority: req.priority, type: 'Corrective', assignee: technicians[0].name,
    due: daysFromNow(1), status: 'Open', estimatedHours: 2, loggedHours: 0,
    description: `Converted from ${req.id} by ${req.requester}. ${req.notes || ''}`,
    createdAt: daysFromNow(0),
    tasks: [
      { id: 't1', text: 'Verify the observation on site', done: false },
      { id: 't2', text: 'Make safe and complete the repair', done: false }
    ],
    partsUsed: [], timeLog: []
  };
  req.status = 'Converted';
  state.workOrders.unshift(wo);
  logActivity(`${req.id} converted to ${wo.id}`);
  saveState();
  showView('work-orders');
  openWorkOrder(wo.id);
  showToast(`${wo.id} created from request`);
}

function openDialog(prefill = {}) {
  const dialog = document.querySelector('#workOrderDialog');
  const form = document.querySelector('#workOrderForm');
  form.reset();
  document.querySelector('[name="due"]').value = daysFromNow(1);
  if (prefill.asset) form.asset.value = prefill.asset;
  if (mode === 'technician') form.assignee.value = 'Kwame Mensah';
  dialog.showModal();
  form.title.focus();
}

function closeDialog() { document.querySelector('#workOrderDialog').close(); }

function openRequestDialog() {
  const dialog = document.querySelector('#requestDialog');
  document.querySelector('#requestForm').reset();
  dialog.showModal();
  dialog.querySelector('[name="title"]').focus();
}

function openTimeDialog(id) {
  timeTarget = id;
  const dialog = document.querySelector('#timeDialog');
  document.querySelector('#timeForm').reset();
  dialog.showModal();
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
  const a = document.createElement('a');
  a.href = url;
  a.download = `safimaint-backup-${daysFromNow(0)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup downloaded');
}

function openScanner() {
  document.querySelector('#scanOverlay').hidden = false;
  document.querySelector('#scanList').innerHTML = state.assets.map(a =>
    `<button data-scan-asset="${a.id}"><strong>${escapeHTML(a.name)}</strong><br><small>${a.qr} · ${escapeHTML(a.location)}</small></button>`
  ).join('');
}

function closeScanner() { document.querySelector('#scanOverlay').hidden = true; }

function renderSearch(query) {
  const box = document.querySelector('#searchResults');
  const q = query.trim().toLowerCase();
  if (!q) { box.hidden = true; box.innerHTML = ''; return; }
  const hits = [
    ...state.workOrders.filter(w => [w.id, w.title, w.asset, w.assignee].join(' ').toLowerCase().includes(q)).slice(0, 4).map(w => ({
      label: w.title, meta: `${w.id} · ${w.status}`, action: () => { showView('work-orders'); openWorkOrder(w.id); }
    })),
    ...state.assets.filter(a => [a.id, a.name, a.location].join(' ').toLowerCase().includes(q)).slice(0, 3).map(a => ({
      label: a.name, meta: `${a.id} · ${a.location}`, action: () => { showView('assets'); openAsset(a.id); }
    }))
  ];
  box.hidden = hits.length === 0;
  box.innerHTML = hits.map((h, i) => `<button class="search-hit" data-hit="${i}"><strong>${escapeHTML(h.label)}</strong><small>${escapeHTML(h.meta)}</small></button>`).join('');
  box._hits = hits;
}

function handleWorkAction(action, id) {
  if (action === 'start') setWorkStatus(id, 'In Progress');
  if (action === 'hold') setWorkStatus(id, 'On Hold');
  if (action === 'complete') setWorkStatus(id, 'Completed');
  if (action === 'time') openTimeDialog(id);
}

function setupEvents() {
  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  document.body.addEventListener('click', e => {
    const viewLink = e.target.closest('[data-view-link]');
    if (viewLink) showView(viewLink.dataset.viewLink);
    const openWo = e.target.closest('[data-open-wo]');
    if (openWo) openWorkOrder(openWo.dataset.openWo);
    const openAssetBtn = e.target.closest('[data-open-asset]');
    if (openAssetBtn) openAsset(openAssetBtn.dataset.openAsset);
    const woAction = e.target.closest('[data-wo-action]');
    if (woAction) handleWorkAction(woAction.dataset.woAction, woAction.dataset.id);
    const generate = e.target.closest('[data-generate-pm]');
    if (generate) generatePm(generate.dataset.generatePm);
    const convert = e.target.closest('[data-convert-request]');
    if (convert) convertRequest(convert.dataset.convertRequest);
    const forAsset = e.target.closest('[data-wo-for-asset]');
    if (forAsset) { closeInspector(); openDialog({ asset: forAsset.dataset.woForAsset }); }
    const tab = e.target.closest('[data-tab]');
    if (tab) { inspector.tab = tab.dataset.tab; renderInspector(); }
    if (e.target.closest('#closeInspector')) closeInspector();
    const addTask = e.target.closest('[data-add-task]');
    if (addTask) {
      const input = document.querySelector('#newTaskText');
      const text = input?.value.trim();
      const work = state.workOrders.find(w => w.id === addTask.dataset.addTask);
      if (work && text) {
        work.tasks.push({ id: `t${Date.now()}`, text, done: false });
        saveState();
      }
    }
    const issue = e.target.closest('[data-issue-part]');
    if (issue) issuePart(issue.dataset.issuePart, document.querySelector('#issuePartSelect').value);
    const scanAsset = e.target.closest('[data-scan-asset]');
    if (scanAsset) {
      closeScanner();
      showView('assets');
      openAsset(scanAsset.dataset.scanAsset);
      showToast('Asset tag read');
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
    if (!box) return;
    const work = state.workOrders.find(w => w.id === box.dataset.id);
    const task = work?.tasks.find(t => t.id === box.dataset.toggleTask);
    if (task) { task.done = box.checked; saveState(); }
  });

  document.querySelectorAll('[data-open-work-order]').forEach(b => b.addEventListener('click', () => openDialog()));
  document.querySelector('#closeDialog').addEventListener('click', closeDialog);
  document.querySelector('#cancelDialog').addEventListener('click', closeDialog);
  document.querySelector('#workSearch').addEventListener('input', renderWorkOrders);
  document.querySelector('#assetSearch').addEventListener('input', renderAssets);
  document.querySelector('#typeFilter').addEventListener('change', e => { typeFilter = e.target.value; renderWorkOrders(); });
  document.querySelector('#overdueOnly').addEventListener('change', e => { overdueOnly = e.target.checked; renderWorkOrders(); });
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    activeFilter = b.dataset.filter;
    document.querySelectorAll('#view-work-orders [data-filter]').forEach(x => x.classList.toggle('active', x === b));
    renderWorkOrders();
  }));
  document.querySelectorAll('[data-mine-filter]').forEach(b => b.addEventListener('click', () => {
    mineFilter = b.dataset.mineFilter;
    document.querySelectorAll('[data-mine-filter]').forEach(x => x.classList.toggle('active', x === b));
    renderMyWork();
  }));
  document.querySelector('#workOrderForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const assetName = form.get('asset');
    const asset = findAsset(assetName);
    const order = {
      id: nextWorkId(),
      title: form.get('title').trim(),
      asset: assetName,
      assetId: asset?.id || '',
      location: asset?.location || 'Plant',
      priority: form.get('priority'),
      type: form.get('type'),
      assignee: form.get('assignee'),
      due: form.get('due'),
      status: 'Open',
      estimatedHours: Number(form.get('hours')) || 2,
      loggedHours: 0,
      description: form.get('description').trim(),
      createdAt: daysFromNow(0),
      tasks: [
        { id: 't1', text: 'Make the area safe and confirm isolation', done: false },
        { id: 't2', text: 'Complete the assigned work', done: false },
        { id: 't3', text: 'Test, tidy, and record the outcome', done: false }
      ],
      partsUsed: [],
      timeLog: []
    };
    state.workOrders.unshift(order);
    logActivity(`${order.id} raised for ${order.asset}`);
    saveState();
    e.currentTarget.reset();
    closeDialog();
    showToast(`${order.id} created`);
    showView('work-orders');
    openWorkOrder(order.id);
  });
  document.querySelector('#requestForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const asset = findAsset(form.get('asset'));
    const req = {
      id: nextRequestId(),
      title: form.get('title').trim(),
      asset: form.get('asset'),
      location: asset?.location || 'Plant',
      requester: form.get('requester').trim(),
      priority: form.get('priority'),
      status: 'Submitted',
      notes: form.get('notes').trim(),
      createdAt: daysFromNow(0)
    };
    state.requests.unshift(req);
    logActivity(`${req.id} submitted by ${req.requester}`);
    saveState();
    document.querySelector('#requestDialog').close();
    showView('requests');
    showToast(`${req.id} submitted`);
  });
  document.querySelector('#timeForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const work = state.workOrders.find(w => w.id === timeTarget);
    if (work) {
      const hours = Number(form.get('hours'));
      work.loggedHours = Number((work.loggedHours + hours).toFixed(2));
      work.timeLog = [...(work.timeLog || []), { hours, note: form.get('note').trim(), at: daysFromNow(0) }];
      if (work.status === 'Open') work.status = 'In Progress';
      logActivity(`${hours} h logged on ${work.id}`);
      saveState();
      showToast('Labor logged');
    }
    document.querySelector('#timeDialog').close();
  });
  document.querySelector('#newRequestButton').addEventListener('click', openRequestDialog);
  document.querySelector('#closeRequestDialog').addEventListener('click', () => document.querySelector('#requestDialog').close());
  document.querySelector('#cancelRequestDialog').addEventListener('click', () => document.querySelector('#requestDialog').close());
  document.querySelector('#closeTimeDialog').addEventListener('click', () => document.querySelector('#timeDialog').close());
  document.querySelector('#cancelTimeDialog').addEventListener('click', () => document.querySelector('#timeDialog').close());
  document.querySelector('#menuButton').addEventListener('click', () => {
    document.querySelector('#sidebar').classList.add('open');
    document.querySelector('#scrim').classList.add('show');
  });
  document.querySelector('#scrim').addEventListener('click', closeMenu);
  document.querySelector('#inspectorScrim').addEventListener('click', closeInspector);
  document.querySelectorAll('#exportButton, #exportButton2').forEach(b => b.addEventListener('click', exportData));
  document.querySelectorAll('#scanButton, #scanFromField, #scanFromAssets, #scanFab').forEach(b => b.addEventListener('click', openScanner));
  document.querySelector('#closeScan').addEventListener('click', closeScanner);
  document.querySelector('#globalSearch').addEventListener('input', e => renderSearch(e.target.value));
  document.querySelector('#globalSearch').addEventListener('keydown', e => {
    if (e.key === 'Escape') { document.querySelector('#searchResults').hidden = true; }
  });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      document.querySelector('#globalSearch').focus();
    }
    if (e.key === 'Escape') { closeInspector(); closeScanner(); }
  });
  document.querySelectorAll('.role-btn').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    localStorage.setItem('safimaint-mode', mode);
    applyMode();
    renderAll();
    showView(mode === 'technician' ? 'my-work' : 'dashboard');
    showToast(mode === 'technician' ? 'Field board · Kwame Mensah' : 'Planner workspace');
  }));
  document.querySelectorAll('.bottom-nav [data-view]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.view === 'dashboard') {
      document.querySelector('#sidebar').classList.add('open');
      document.querySelector('#scrim').classList.add('show');
      return;
    }
    showView(b.dataset.view);
  }));
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
  document.querySelector('#syncHint').textContent = online ? 'Ready to sync when a server is connected' : 'Working from the on-device cache';
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
      if (!input || typeof input.title !== 'string' || !state.assets.some(a => a.name === input.asset)) throw new Error('Valid title and equipment are required.');
      const asset = findAsset(input.asset);
      const order = {
        id: nextWorkId(), status: 'Open', description: '', type: 'Corrective', location: asset?.location || 'Plant',
        assetId: asset?.id || '', estimatedHours: 2, loggedHours: 0, createdAt: daysFromNow(0),
        tasks: [{ id: 't1', text: 'Complete the assigned work', done: false }], partsUsed: [], timeLog: [], ...input
      };
      state.workOrders.unshift(order);
      saveState();
      return order;
    }
  });
}

document.querySelector('#todayLabel').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
setupEvents();
renderAll();
showView(mode === 'technician' ? 'my-work' : 'dashboard');
updateConnection();
registerWebMCP();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
