const STORAGE_KEY = 'safimaint-pilot-v1';

const seedData = {
  workOrders: [
    { id: 'WO-1048', title: 'Inspect unusual vibration', asset: 'Digester Feed Pump 02', priority: 'Critical', assignee: 'Kwame Mensah', due: daysFromNow(-1), status: 'Open', description: 'Strong vibration noticed during morning round.' },
    { id: 'WO-1047', title: 'Replace worn drive belt', asset: 'Sludge Dewatering Press', priority: 'High', assignee: 'Esi Agyeman', due: daysFromNow(0), status: 'In Progress', description: 'Replacement belt is available in stores.' },
    { id: 'WO-1046', title: 'Check gas pressure reading', asset: 'Biogas Blower 01', priority: 'Medium', assignee: 'Yaw Boateng', due: daysFromNow(1), status: 'Open', description: 'Verify gauge against portable instrument.' },
    { id: 'WO-1045', title: 'Clean electrical cabinet filters', asset: 'CHP Unit 01', priority: 'Low', assignee: 'Ama Owusu', due: daysFromNow(2), status: 'Open', description: '' },
    { id: 'WO-1044', title: 'Lubricate mixer bearings', asset: 'Digester Mixer 03', priority: 'Medium', assignee: 'Kwame Mensah', due: daysFromNow(-3), status: 'Completed', description: 'Routine lubrication completed.' }
  ],
  assets: [
    { id: 'AST-001', name: 'Digester Feed Pump 02', location: 'Digester Hall', status: 'Down', lastService: daysFromNow(-41), nextService: daysFromNow(3) },
    { id: 'AST-002', name: 'Sludge Dewatering Press', location: 'Dewatering Bay', status: 'Attention', lastService: daysFromNow(-28), nextService: daysFromNow(0) },
    { id: 'AST-003', name: 'Biogas Blower 01', location: 'Gas Room', status: 'Healthy', lastService: daysFromNow(-12), nextService: daysFromNow(14) },
    { id: 'AST-004', name: 'CHP Unit 01', location: 'Power House', status: 'Healthy', lastService: daysFromNow(-7), nextService: daysFromNow(2) },
    { id: 'AST-005', name: 'Digester Mixer 03', location: 'Digester 3', status: 'Healthy', lastService: daysFromNow(-3), nextService: daysFromNow(27) },
    { id: 'AST-006', name: 'Effluent Transfer Pump', location: 'Treatment Line', status: 'Attention', lastService: daysFromNow(-35), nextService: daysFromNow(5) }
  ],
  schedules: [
    { id: 'PM-201', title: 'Weekly safety inspection', asset: 'Sludge Dewatering Press', date: daysFromNow(0), owner: 'Esi Agyeman', interval: 'Every week' },
    { id: 'PM-202', title: 'Air filter inspection', asset: 'CHP Unit 01', date: daysFromNow(2), owner: 'Ama Owusu', interval: 'Every month' },
    { id: 'PM-203', title: 'Seal and bearing check', asset: 'Digester Feed Pump 02', date: daysFromNow(3), owner: 'Kwame Mensah', interval: 'Every month' },
    { id: 'PM-204', title: 'Oil level and leak check', asset: 'Effluent Transfer Pump', date: daysFromNow(5), owner: 'Yaw Boateng', interval: 'Every two weeks' },
    { id: 'PM-205', title: 'Full blower service', asset: 'Biogas Blower 01', date: daysFromNow(14), owner: 'Kwame Mensah', interval: 'Every quarter' }
  ],
  inspections: [
    { id: 'INSP-101', title: 'Daily digester round', asset: 'Digester Mixer 03', frequency: 'Daily', due: daysFromNow(0), owner: 'Kwame Mensah', items: ['Check oil leaks and unusual noise','Verify guard and coupling condition','Record visible vibration condition','Confirm area is clean and safe'] },
    { id: 'INSP-102', title: 'CHP pre-start safety check', asset: 'CHP Unit 01', frequency: 'Before start', due: daysFromNow(0), owner: 'Ama Owusu', items: ['Check oil and coolant levels','Inspect for leaks','Confirm ventilation path is clear','Verify emergency stop is accessible'] },
    { id: 'INSP-103', title: 'Weekly dewatering inspection', asset: 'Sludge Dewatering Press', frequency: 'Weekly', due: daysFromNow(1), owner: 'Esi Agyeman', items: ['Inspect belt tracking','Check wash-water nozzles','Inspect rollers and scraper','Check safety guards'] }
  ],
  inspectionHistory: [],
  inventory: [
    { id: 'PRT-001', name: 'Pump mechanical seal', number: 'MS-40-SS', quantity: 2, minimum: 2, location: 'Store A · Bin 12' },
    { id: 'PRT-002', name: 'Drive belt B-72', number: 'BLT-B72', quantity: 1, minimum: 3, location: 'Store A · Rack 3' },
    { id: 'PRT-003', name: 'Bearing 6205-2RS', number: 'BRG-6205', quantity: 8, minimum: 4, location: 'Store A · Bin 08' },
    { id: 'PRT-004', name: 'Hydraulic oil ISO 46', number: 'OIL-ISO46', quantity: 24, minimum: 10, location: 'Store B · Bay 2' },
    { id: 'PRT-005', name: 'Cabinet filter mat', number: 'FLT-G4-20', quantity: 3, minimum: 5, location: 'Store A · Shelf 5' }
  ]
};

let state = loadState();
let activeFilter = 'all';
let deferredInstall;

function daysFromNow(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return migrateState(stored ? JSON.parse(stored) : structuredClone(seedData));
  } catch (_) { return migrateState(structuredClone(seedData)); }
}

function migrateState(data) {
  const next = data && typeof data === 'object' ? data : {};
  ['workOrders','assets','schedules','inventory','inspections','inspectionHistory'].forEach(key => {
    if (!Array.isArray(next[key])) next[key] = structuredClone(seedData[key] || []);
  });
  if (!next.inspections.length) next.inspections = structuredClone(seedData.inspections);
  return next;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
}

function prettyDate(date) {
  const d = new Date(`${date}T12:00:00`);
  const today = new Date(); today.setHours(12,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

function statusClass(status) { return status.toLowerCase().replace('in ', '').replaceAll(' ', '-'); }
function isOverdue(order) { return order.status !== 'Completed' && order.due < daysFromNow(0); }

function renderDashboard() {
  const open = state.workOrders.filter(w => w.status !== 'Completed');
  const overdue = open.filter(isOverdue);
  const lowParts = state.inventory.filter(p => p.quantity <= p.minimum);
  const down = state.assets.filter(a => a.status === 'Down');
  const metrics = [
    ['Open work orders', open.length, `${open.filter(w=>w.priority==='Critical').length} critical`, 'i-work', ''],
    ['Overdue jobs', overdue.length, overdue.length ? 'Needs attention today' : 'Everything is on time', 'i-alert', 'danger'],
    ['Equipment down', down.length, `${state.assets.length - down.length} available`, 'i-asset', 'amber'],
    ['Low-stock parts', lowParts.length, 'Reorder before next service', 'i-box', 'blue']
  ];
  document.querySelector('#metricGrid').innerHTML = metrics.map(([label,value,note,icon,tone]) => `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${tone}"><svg><use href="#${icon}"/></svg></span></div><div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div></article>`).join('');

  const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const priorities = [...open].sort((a,b) => (rank[a.priority] - rank[b.priority]) || a.due.localeCompare(b.due)).slice(0,4);
  document.querySelector('#priorityList').innerHTML = priorities.length ? priorities.map(w => `<div class="priority-item"><span class="priority-line ${w.priority}"></span><div><h3>${escapeHTML(w.title)}</h3><p>${escapeHTML(w.asset)} · ${prettyDate(w.due)} · ${escapeHTML(w.assignee)}</p></div><span class="status-badge ${statusClass(w.status)}">${w.status}</span></div>`).join('') : '<div class="empty-state"><h3>All clear</h3><p>No open work needs attention.</p></div>';

  const healthy = state.assets.filter(a => a.status === 'Healthy').length;
  const percent = Math.round((healthy / state.assets.length) * 100);
  document.querySelector('#healthDonut').style.setProperty('--percent', percent);
  document.querySelector('#healthPercent').textContent = `${percent}%`;
  document.querySelector('#healthLegend').innerHTML = ['Healthy','Attention','Down'].map(s => `<div class="legend-row"><span><i class="legend-dot ${statusClass(s)}"></i>${s}</span><strong>${state.assets.filter(a=>a.status===s).length}</strong></div>`).join('');
  renderSchedule('#dashboardSchedule', state.schedules.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3), false);
}

function renderWorkOrders() {
  const search = (document.querySelector('#workSearch')?.value || '').toLowerCase();
  const rows = state.workOrders.filter(w => (activeFilter === 'all' || w.status === activeFilter) && [w.id,w.title,w.asset,w.assignee].join(' ').toLowerCase().includes(search));
  document.querySelector('#workOrderRows').innerHTML = rows.map(w => `<tr><td><strong>${escapeHTML(w.title)}</strong><small>${w.id}</small></td><td>${escapeHTML(w.asset)}</td><td><span class="priority-badge ${w.priority}">${w.priority}</span></td><td>${escapeHTML(w.assignee)}</td><td><strong>${prettyDate(w.due)}</strong>${isOverdue(w)?'<small style="color:var(--danger)">Overdue</small>':''}</td><td><span class="status-badge ${statusClass(w.status)}">${w.status}</span></td><td>${w.status === 'Completed' ? '<span aria-label="Completed">✓</span>' : `<button class="row-action" data-progress="${w.id}">${w.status === 'Open' ? 'Start job' : 'Complete'}</button>`}</td></tr>`).join('');
  document.querySelector('#workEmpty').hidden = rows.length > 0;
  document.querySelector('#navWorkCount').textContent = state.workOrders.filter(w=>w.status!=='Completed').length;
}

function renderAssets() {
  const search = (document.querySelector('#assetSearch')?.value || '').toLowerCase();
  document.querySelector('#assetGrid').innerHTML = state.assets.filter(a => [a.id,a.name,a.location].join(' ').toLowerCase().includes(search)).map(a => `<article class="asset-card"><div class="asset-card-head"><div class="asset-title"><span class="asset-icon"><svg><use href="#i-asset"/></svg></span><div><h3>${escapeHTML(a.name)}</h3><p>${a.id} · ${escapeHTML(a.location)}</p></div></div><span class="status-badge ${statusClass(a.status)}">${a.status}</span></div><div class="asset-meta"><div><small>Last service</small><strong>${prettyDate(a.lastService)}</strong></div><div><small>Next service</small><strong>${prettyDate(a.nextService)}</strong></div></div></article>`).join('');
}

function renderSchedule(target, schedules, full = true) {
  document.querySelector(target).innerHTML = schedules.map(s => full ? `<div class="timeline-group"><div class="timeline-date">${prettyDate(s.date)}</div><article class="timeline-card"><div><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.asset)} · ${escapeHTML(s.owner)}</p></div><span class="status-badge healthy">${escapeHTML(s.interval)}</span></article></div>` : `<article class="schedule-item"><div class="date-block"><small>${new Date(`${s.date}T12:00:00`).toLocaleDateString('en-GB',{month:'short'})}</small>${new Date(`${s.date}T12:00:00`).getDate()}</div><div><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.asset)}</p></div></article>`).join('');
}

function renderInspections() {
  const today = daysFromNow(0);
  const due = state.inspections.filter(i => i.due <= today);
  document.querySelector('#navInspectionCount').textContent = due.length;
  document.querySelector('#inspectionGrid').innerHTML = state.inspections.map(i => {
    const isDue = i.due <= today;
    return `<article class="inspection-card"><div class="inspection-card-head"><span class="inspection-icon"><svg><use href="#i-clipboard"/></svg></span><span class="status-badge ${isDue?'attention':'healthy'}">${isDue?'Due '+prettyDate(i.due):'Due '+prettyDate(i.due)}</span></div><h3>${escapeHTML(i.title)}</h3><p>${escapeHTML(i.asset)} · ${escapeHTML(i.frequency)}</p><div class="inspection-meta"><span>Owner</span><strong>${escapeHTML(i.owner)}</strong><span>Checks</span><strong>${i.items.length}</strong></div><button class="wide-button" data-run-inspection="${i.id}">Run inspection</button></article>`;
  }).join('');
  const history = [...state.inspectionHistory].sort((a,b)=>b.completedAt.localeCompare(a.completedAt)).slice(0,8);
  document.querySelector('#inspectionHistory').innerHTML = history.length ? history.map(h => `<div class="activity-item"><span class="activity-icon"><svg><use href="#i-check"/></svg></span><div><strong>${escapeHTML(h.title)}</strong><p>${escapeHTML(h.asset)} · ${new Date(h.completedAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p></div><span class="status-badge completed">${h.passed}/${h.total} passed</span></div>`).join('') : '<div class="empty-state compact"><h3>No inspections recorded yet</h3><p>Completed field checks will appear here.</p></div>';
}

function openInspection(id) {
  const inspection = state.inspections.find(i=>i.id===id);
  if (!inspection) return;
  document.querySelector('[name="inspectionId"]').value = id;
  document.querySelector('#inspectionDialogTitle').textContent = inspection.title;
  document.querySelector('#inspectionChecklist').innerHTML = inspection.items.map((item,index)=>`<label class="check-item"><input type="checkbox" name="check-${index}" required><span><strong>${escapeHTML(item)}</strong><small>Tap when checked and acceptable</small></span></label>`).join('');
  document.querySelector('#inspectionForm [name="notes"]').value = '';
  document.querySelector('#inspectionDialog').showModal();
}

function renderInventory() {
  const low = state.inventory.filter(p=>p.quantity<=p.minimum);
  const units = state.inventory.reduce((sum,p)=>sum+p.quantity,0);
  document.querySelector('#inventorySummary').innerHTML = `<div class="mini-stat"><span>Different parts</span><strong>${state.inventory.length}</strong></div><div class="mini-stat"><span>Total units in store</span><strong>${units}</strong></div><div class="mini-stat"><span>Need reorder</span><strong style="color:var(--danger)">${low.length}</strong></div>`;
  document.querySelector('#inventoryRows').innerHTML = state.inventory.map(p => `<tr><td><strong>${escapeHTML(p.name)}</strong></td><td>${p.number}</td><td><strong>${p.quantity}</strong></td><td>${p.minimum}</td><td>${escapeHTML(p.location)}</td><td><span class="status-badge ${p.quantity<=p.minimum?'down':'healthy'}">${p.quantity<=p.minimum?'Reorder':'In stock'}</span></td></tr>`).join('');
}

function renderReports() {
  document.querySelector('#completedReport').textContent = state.workOrders.filter(w=>w.status==='Completed').length;
  const counts = ['Critical','High','Medium','Low'].map(p=>[p,state.workOrders.filter(w=>w.status!=='Completed'&&w.priority===p).length]);
  const max = Math.max(1,...counts.map(([,n])=>n));
  document.querySelector('#priorityChart').innerHTML = counts.map(([p,n])=>`<div class="bar-row"><strong>${p}</strong><div class="bar-track"><div class="bar-fill ${p}" style="width:${n/max*100}%"></div></div><b>${n}</b></div>`).join('');
}

function renderAll() {
  renderDashboard(); renderWorkOrders(); renderAssets();
  renderSchedule('#maintenanceTimeline', state.schedules.slice().sort((a,b)=>a.date.localeCompare(b.date)));
  renderInventory(); renderInspections(); renderReports(); populateAssetSelect();
}

function showView(name) {
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  const titles = { dashboard: greeting(), 'work-orders':'Work Orders', assets:'Equipment', maintenance:'Maintenance Plan', inventory:'Spare Parts', inspections:'Inspections', reports:'Reports' };
  document.querySelector('#pageTitle').textContent = titles[name] || 'SafiMaintain';
  closeMenu(); window.scrollTo({top:0,behavior:'smooth'});
}

function greeting() { const h=new Date().getHours(); return h<12?'Good morning':h<18?'Good afternoon':'Good evening'; }
function populateAssetSelect() { document.querySelector('#assetSelect').innerHTML = state.assets.map(a=>`<option>${escapeHTML(a.name)}</option>`).join(''); }
function openDialog() { const dialog=document.querySelector('#workOrderDialog'); document.querySelector('[name="due"]').value=daysFromNow(1); dialog.showModal(); document.querySelector('[name="title"]').focus(); }
function closeDialog() { document.querySelector('#workOrderDialog').close(); }
function showToast(message) { const t=document.querySelector('#toast'); t.querySelector('span').textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800); }
function closeMenu() { document.querySelector('#sidebar').classList.remove('open'); document.querySelector('#scrim').classList.remove('show'); }

function exportData() {
  const blob = new Blob([JSON.stringify({ exportedAt:new Date().toISOString(), data:state }, null, 2)], {type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`safimaint-backup-${daysFromNow(0)}.json`; a.click(); URL.revokeObjectURL(url); showToast('Backup downloaded');
}

function setupEvents() {
  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-view-link]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewLink)));
  document.querySelectorAll('[data-open-work-order]').forEach(b=>b.addEventListener('click',openDialog));
  document.querySelector('#closeDialog').addEventListener('click',closeDialog); document.querySelector('#cancelDialog').addEventListener('click',closeDialog);
  document.querySelector('#workSearch').addEventListener('input',renderWorkOrders); document.querySelector('#assetSearch').addEventListener('input',renderAssets);
  document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderWorkOrders();}));
  document.querySelector('#workOrderRows').addEventListener('click',e=>{const id=e.target.dataset.progress;if(!id)return;const item=state.workOrders.find(w=>w.id===id);if(!item)return;if(item.status==='Open'){item.status='In Progress';saveState();showToast(`${id} started`);}else{item.status='Completed';item.completedAt=new Date().toISOString();saveState();showToast(`${id} completed`);}});
  document.querySelector('#workOrderForm').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const next=Math.max(...state.workOrders.map(w=>Number(w.id.split('-')[1])),1000)+1;state.workOrders.unshift({id:`WO-${next}`,title:form.get('title').trim(),asset:form.get('asset'),priority:form.get('priority'),assignee:form.get('assignee').trim(),due:form.get('due'),status:'Open',description:form.get('description').trim()});saveState();e.currentTarget.reset();closeDialog();showToast(`WO-${next} created`);showView('work-orders');});
  document.querySelector('#menuButton').addEventListener('click',()=>{document.querySelector('#sidebar').classList.add('open');document.querySelector('#scrim').classList.add('show');}); document.querySelector('#scrim').addEventListener('click',closeMenu);
  document.querySelectorAll('#exportButton,#exportButton2').forEach(b=>b.addEventListener('click',exportData));
  document.querySelector('#inspectionGrid').addEventListener('click',e=>{const button=e.target.closest('[data-run-inspection]');if(button)openInspection(button.dataset.runInspection);});
  document.querySelector('#closeInspectionDialog').addEventListener('click',()=>document.querySelector('#inspectionDialog').close());
  document.querySelector('#cancelInspectionDialog').addEventListener('click',()=>document.querySelector('#inspectionDialog').close());
  document.querySelector('#inspectionForm').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const inspection=state.inspections.find(i=>i.id===form.get('inspectionId'));if(!inspection)return;const passed=inspection.items.filter((_,index)=>form.get(`check-${index}`)==='on').length;state.inspectionHistory.unshift({id:`LOG-${Date.now()}`,inspectionId:inspection.id,title:inspection.title,asset:inspection.asset,completedAt:new Date().toISOString(),passed,total:inspection.items.length,notes:String(form.get('notes')||'').trim()});inspection.due=nextInspectionDate(inspection.frequency);saveState();document.querySelector('#inspectionDialog').close();showToast('Inspection saved offline');});
  document.querySelector('#importButton').addEventListener('click',()=>document.querySelector('#importFile').click());
  document.querySelector('#importFile').addEventListener('change',importBackup);
  window.addEventListener('online',updateConnection); window.addEventListener('offline',updateConnection);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;document.querySelector('#installButton').hidden=false;});
  document.querySelector('#installButton').addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;document.querySelector('#installButton').hidden=true;});
}

function nextInspectionDate(frequency) {
  const offsets = { 'Daily':1, 'Before start':1, 'Weekly':7, 'Monthly':30 };
  return daysFromNow(offsets[frequency] || 7);
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const restored = payload.data || payload;
    if (!restored || !Array.isArray(restored.workOrders) || !Array.isArray(restored.assets)) throw new Error('Invalid backup');
    state = migrateState(restored);
    saveState();
    showToast('Backup restored successfully');
  } catch (_) {
    showToast('Backup could not be restored');
  } finally {
    event.target.value = '';
  }
}

function updateConnection() { const online=navigator.onLine; document.querySelector('#connectionDot').classList.toggle('offline',!online); document.querySelector('#connectionText').textContent=online?'Online · changes saved':'Offline · changes saved'; }

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = tool => { try { Promise.resolve(context.registerTool(tool)).catch(()=>{}); } catch (_) {} };
  register({ name:'list_open_work_orders', title:'List open work orders', description:'Return the current non-completed maintenance work orders visible in SafiMaintain.', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:{readOnlyHint:true,untrustedContentHint:false}, execute:()=>state.workOrders.filter(w=>w.status!=='Completed') });
  register({ name:'create_work_order', title:'Create work order', description:'Create a maintenance work order and update the visible SafiMaintain list.', inputSchema:{type:'object',properties:{title:{type:'string',minLength:3},asset:{type:'string'},priority:{type:'string',enum:['Low','Medium','High','Critical']},assignee:{type:'string'},due:{type:'string',format:'date'}},required:['title','asset','priority','assignee','due'],additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute:input=>{if(!input||typeof input.title!=='string'||!state.assets.some(a=>a.name===input.asset))throw new Error('Valid title and equipment are required.');const next=Math.max(...state.workOrders.map(w=>Number(w.id.split('-')[1])),1000)+1;const order={id:`WO-${next}`,status:'Open',description:'',...input};state.workOrders.unshift(order);saveState();return order;} });
}

document.querySelector('#todayLabel').textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
document.querySelector('#pageTitle').textContent = greeting();
setupEvents(); renderAll(); updateConnection(); registerWebMCP();
if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
