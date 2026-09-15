const STORAGE_KEY = 'safimaint-product-v4';
const CURRENT_USER = 'U-1';

function day(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const seed = {
  users: [
    { id:'U-1', name:'Abena Sarpong', role:'Operations manager' },
    { id:'U-2', name:'Kwame Mensah', role:'Mechanical technician' },
    { id:'U-3', name:'Simeon Sakyi', role:'Maintenance planner' },
    { id:'U-4', name:'Ama Owusu', role:'Electrical technician' }
  ],
  assets: [
    { id:'SITE-1', code:'SSGL', name:'Safisana Ghana Ltd', type:'Site', parentId:null, status:'Healthy', criticality:'A', location:'Ashaiman' },
    { id:'FAC-OPS', code:'OPS', name:'Operations', type:'Facility', parentId:'SITE-1', status:'Healthy', criticality:'A', location:'Main plant' },
    { id:'FAC-LAB', code:'A177', name:'Laboratory', type:'Facility', parentId:'SITE-1', status:'Healthy', criticality:'B', location:'Main plant' },
    { id:'FAC-MIX', code:'MP', name:'Mix Pit', type:'Facility', parentId:'FAC-OPS', status:'Attention', criticality:'A', location:'Process area' },
    { id:'P-201', code:'P-201', name:'Digester Feed Pump 02', type:'Equipment', parentId:'FAC-MIX', status:'Down', criticality:'A', location:'Digester feed line', manufacturer:'Grundfos', model:'CR 32-4', serial:'GF-88214', commissioned:'2021-06-11', bom:['PRT-1','PRT-2'] },
    { id:'MIX-03', code:'MX-03', name:'Digester Mixer 03', type:'Equipment', parentId:'FAC-OPS', status:'Healthy', criticality:'A', location:'Digester 3', manufacturer:'SEW', model:'X3KR', serial:'SEW-33091', commissioned:'2022-01-19', bom:['PRT-3'] },
    { id:'CHP-01', code:'CHP-01', name:'CHP Unit 01', type:'Equipment', parentId:'FAC-OPS', status:'Healthy', criticality:'A', location:'Power house', manufacturer:'2G', model:'agenitor 408', serial:'2G-49811', commissioned:'2020-09-04', bom:['PRT-4','PRT-5'] },
    { id:'WS-01', code:'A170', name:'Tahmo Weather Station', type:'Equipment', parentId:'FAC-OPS', status:'Healthy', criticality:'C', location:'Operations roof', manufacturer:'Tahmo', model:'AWS', serial:'TH-7731', commissioned:'2023-02-13', bom:[] },
    { id:'TOOL-01', code:'A150', name:'Compost Thermometer #1', type:'Tool', parentId:'FAC-OPS', status:'Healthy', criticality:'C', location:'Operations store', manufacturer:'REOTEMP', model:'48in', serial:'CT-150', commissioned:'2023-05-20', bom:[] },
    { id:'DEW-01', code:'DW-01', name:'Sludge Dewatering Press', type:'Equipment', parentId:'FAC-OPS', status:'Attention', criticality:'A', location:'Dewatering bay', manufacturer:'Huber', model:'Q-PRESS', serial:'HQP-1208', commissioned:'2021-11-02', bom:['PRT-6'] }
  ],
  meters: [
    { id:'MTR-1', assetId:'P-201', name:'Run hours', unit:'h', current:1240, readings:[{value:1210,date:day(-16)},{value:1240,date:day(-2)}] },
    { id:'MTR-2', assetId:'CHP-01', name:'Run hours', unit:'h', current:9850, readings:[{value:9725,date:day(-12)},{value:9850,date:day(-1)}] },
    { id:'MTR-3', assetId:'DEW-01', name:'Operating hours', unit:'h', current:3375, readings:[{value:3321,date:day(-15)},{value:3375,date:day(-3)}] },
    { id:'MTR-4', assetId:'WS-01', name:'Service count', unit:'cycles', current:42, readings:[{value:41,date:day(-30)},{value:42,date:day(-1)}] }
  ],
  parts: [
    { id:'PRT-1', code:'BRG-6205', name:'Bearing 6205-2RS', category:'Bearing', unitCost:88, locations:[{name:'Main Store / Bin 08',onHand:8,min:4,max:16}], transactions:[] },
    { id:'PRT-2', code:'MS-40-SS', name:'Pump mechanical seal', category:'Seal', unitCost:320, locations:[{name:'Main Store / Bin 12',onHand:2,min:2,max:8}], transactions:[] },
    { id:'PRT-3', code:'OIL-EP220', name:'Gear oil EP 220', category:'Lubricant', unitCost:46, locations:[{name:'Main Store / Bay 2',onHand:18,min:8,max:30}], transactions:[] },
    { id:'PRT-4', code:'FLT-G4-20', name:'CHP cabinet filter mat', category:'Filter', unitCost:27, locations:[{name:'CHP Store / Shelf 5',onHand:3,min:5,max:12}], transactions:[] },
    { id:'PRT-5', code:'SPK-2G-408', name:'CHP spark plug', category:'Engine', unitCost:112, locations:[{name:'CHP Store / Bin 2',onHand:6,min:6,max:18}], transactions:[] },
    { id:'PRT-6', code:'BLT-B72', name:'Drive belt B-72', category:'Drive', unitCost:95, locations:[{name:'Main Store / Rack 3',onHand:1,min:3,max:10}], transactions:[] }
  ],
  workOrders: [
    {
      id:'WO-2407', title:'Clean mix pit and inspect feed pump', assetId:'P-201', type:'Preventive', priority:'High', status:'Open', assigneeId:'U-2',
      due:day(-1), estimateHours:2, actualMinutes:0, source:'PM-101', instructions:'Isolate the feed pump. Clean the mix pit screen, inspect coupling and seal, then verify vibration before returning the pump to service.',
      tasks:[
        {id:'T-1',type:'General',text:'Apply isolation and verify zero energy',status:'Todo'},
        {id:'T-2',type:'Inspection',text:'Inspect mechanical seal for leakage',status:'Todo',result:null},
        {id:'T-3',type:'Meter',text:'Record pump run hours',status:'Todo',meterId:'MTR-1'},
        {id:'T-4',type:'General',text:'Clean suction screen and work area',status:'Todo'}
      ],
      parts:[{partId:'PRT-2',planned:1,actual:0},{partId:'PRT-1',planned:1,actual:0}],
      createdAt:new Date(Date.now()-86400000*4).toISOString(),
      completedAt:null,
      log:[{at:new Date(Date.now()-86400000*4).toISOString(),text:'Work order generated from PM-101'},{at:new Date(Date.now()-86400000*2).toISOString(),text:'Assigned to Kwame Mensah'}]
    },
    {
      id:'WO-2406', title:'EPA monthly reporting', assetId:'FAC-OPS', type:'Preventive', priority:'High', status:'Open', assigneeId:'U-3',
      due:day(0), estimateHours:1.5, actualMinutes:0, source:'PM-104', instructions:'Compile monthly operating and compliance readings and submit the maintenance section.',
      tasks:[{id:'T-5',type:'General',text:'Verify operating log completeness',status:'Todo'},{id:'T-6',type:'General',text:'Compile maintenance actions for report',status:'Todo'}],
      parts:[],createdAt:new Date(Date.now()-86400000*3).toISOString(),completedAt:null,log:[]
    },
    {
      id:'WO-2405', title:'Monthly cleaning of weather station', assetId:'WS-01', type:'Preventive', priority:'Medium', status:'In Progress', assigneeId:'U-3',
      due:day(3), estimateHours:1, actualMinutes:30, source:'PM-103', instructions:'Clean sensor surfaces and confirm mast, power and telemetry condition.',
      tasks:[{id:'T-7',type:'General',text:'Clean rain gauge and radiation shield',status:'Done'},{id:'T-8',type:'Inspection',text:'Inspect mast and mounting hardware',status:'Todo',result:null}],
      parts:[],createdAt:new Date(Date.now()-86400000*7).toISOString(),completedAt:null,log:[{at:new Date(Date.now()-3600000*3).toISOString(),text:'30 min labor logged by Simeon Sakyi'}]
    },
    {
      id:'WO-2404', title:'Low gas pressure at CHP regulator', assetId:'CHP-01', type:'Corrective', priority:'Medium', status:'Open', assigneeId:'U-4',
      due:day(2), estimateHours:2, actualMinutes:0, source:'Request', instructions:'Check regulator inlet pressure, filter condition and downstream leaks.',
      tasks:[{id:'T-9',type:'Inspection',text:'Leak test gas train',status:'Todo',result:null},{id:'T-10',type:'General',text:'Verify regulator setpoint',status:'Todo'}],
      parts:[{partId:'PRT-4',planned:1,actual:0}],createdAt:new Date(Date.now()-86400000).toISOString(),completedAt:null,log:[]
    },
    {
      id:'WO-2398', title:'Lubricate mixer bearings', assetId:'MIX-03', type:'Preventive', priority:'Medium', status:'Completed', assigneeId:'U-2',
      due:day(-8), estimateHours:1, actualMinutes:55, source:'PM-102', instructions:'Lubricate mixer bearings and inspect gearbox for leakage.',
      tasks:[{id:'T-11',type:'General',text:'Lubricate upper and lower bearing points',status:'Done'}],
      parts:[{partId:'PRT-3',planned:1,actual:1}],createdAt:new Date(Date.now()-86400000*12).toISOString(),completedAt:new Date(Date.now()-86400000*8).toISOString(),
      log:[{at:new Date(Date.now()-86400000*8).toISOString(),text:'Work order completed by Kwame Mensah'}]
    }
  ],
  pm: [
    { id:'PM-101', name:'Feed pump monthly service', assetId:'P-201', status:'Running', mode:'fixed', trigger:{type:'time',intervalDays:30,nextDue:day(18)}, dueLead:2, tasks:[{type:'General',text:'Apply isolation and verify zero energy'},{type:'Inspection',text:'Inspect mechanical seal for leakage'},{type:'Meter',text:'Record pump run hours',meterId:'MTR-1'},{type:'General',text:'Clean suction screen and work area'}], parts:[{partId:'PRT-2',planned:1}] },
    { id:'PM-102', name:'Mixer bearing service', assetId:'MIX-03', status:'Running', mode:'floating', trigger:{type:'time',intervalDays:30,nextDue:day(22)}, dueLead:2, tasks:[{type:'General',text:'Lubricate bearing points'},{type:'Inspection',text:'Inspect gearbox for leakage'}], parts:[{partId:'PRT-3',planned:1}] },
    { id:'PM-103', name:'Weather station monthly care', assetId:'WS-01', status:'Running', mode:'fixed', trigger:{type:'time',intervalDays:30,nextDue:day(3)}, dueLead:1, tasks:[{type:'General',text:'Clean sensing surfaces'},{type:'Inspection',text:'Inspect mast and power condition'}], parts:[] },
    { id:'PM-104', name:'CHP 10,000-hour service', assetId:'CHP-01', status:'Running', mode:'fixed', trigger:{type:'meter',meterId:'MTR-2',intervalValue:500,nextThreshold:10000}, dueLead:3, tasks:[{type:'Inspection',text:'Inspect ignition and cooling systems'},{type:'Meter',text:'Record engine hours',meterId:'MTR-2'},{type:'General',text:'Replace scheduled service consumables'}], parts:[{partId:'PRT-4',planned:2},{partId:'PRT-5',planned:4}] }
  ],
  requests: [
    { id:'REQ-81', assetId:'DEW-01', summary:'Belt is tracking toward the left side during operation', urgency:'Urgent', requester:'Kojo Arthur', createdAt:new Date(Date.now()-3600000*5).toISOString(), status:'Requested' },
    { id:'REQ-80', assetId:'FAC-LAB', summary:'Air conditioner making intermittent rattling noise', urgency:'Normal', requester:'Laboratory', createdAt:new Date(Date.now()-86400000).toISOString(), status:'Requested' }
  ],
  syncQueue:[]
};

let state = loadState();
let route = location.hash.replace('#/','') || 'dashboard';
let woFilter = 'Active';
let selectedAssetId = 'P-201';
let assetTab = 'overview';
let drawerWorkId = null;
let drawerTab = 'overview';
let pendingMeterTask = null;
let scannerStream = null;

function clone(value){ return JSON.parse(JSON.stringify(value)); }
function loadState(){
  try{
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return migrate(parsed || clone(seed));
  }catch(e){ return migrate(clone(seed)); }
}
function migrate(data){
  ['users','assets','meters','parts','workOrders','pm','requests','syncQueue'].forEach(function(key){
    if(!Array.isArray(data[key])) data[key]=clone(seed[key]);
  });
  return data;
}
function save(reason){
  if(reason) state.syncQueue.push({id:'Q-'+Date.now(),at:new Date().toISOString(),reason:reason});
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  updateConnection();
}
function escapeHTML(value){
  return String(value == null ? '' : value).replace(/[&<>'"]/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch];
  });
}
function asset(id){ return state.assets.find(function(x){return x.id===id;}); }
function meter(id){ return state.meters.find(function(x){return x.id===id;}); }
function user(id){ return state.users.find(function(x){return x.id===id;}); }
function part(id){ return state.parts.find(function(x){return x.id===id;}); }
function work(id){ return state.workOrders.find(function(x){return x.id===id;}); }
function pm(id){ return state.pm.find(function(x){return x.id===id;}); }
function assetName(id){ const x=asset(id); return x?x.name:'Unassigned'; }
function userName(id){ const x=user(id); return x?x.name:'Unassigned'; }
function partName(id){ const x=part(id); return x?x.name:'Part'; }
function totalStock(p){ return (p.locations||[]).reduce(function(sum,l){return sum+Number(l.onHand||0);},0); }
function minStock(p){ return (p.locations||[]).reduce(function(sum,l){return sum+Number(l.min||0);},0); }
function statusClass(v){ return String(v||'').toLowerCase().replace(/\s+/g,'-').replace('in-progress','progress'); }
function prettyDate(value){
  if(!value) return '—';
  const d=new Date(value.length===10?value+'T12:00:00':value);
  const t=new Date();t.setHours(12,0,0,0);
  const c=new Date(d);c.setHours(12,0,0,0);
  const diff=Math.round((c-t)/86400000);
  if(diff===0) return 'Today';
  if(diff===1) return 'Tomorrow';
  if(diff===-1) return 'Yesterday';
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}
function formatTime(value){ return new Date(value).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }
function isActive(w){ return w.status!=='Completed' && w.status!=='Closed'; }
function overdue(w){ return isActive(w)&&w.due<day(0); }
function badge(text,cls){ return '<span class="badge '+(cls||statusClass(text))+'">'+escapeHTML(text)+'</span>'; }
function icon(id){ return '<svg><use href="#'+id+'"/></svg>'; }
function toast(message){
  const el=document.getElementById('toast'); if(!el) return;
  el.querySelector('span').textContent=message; el.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(function(){el.classList.remove('show');},2600);
}
function logWork(w,text){
  w.log=w.log||[]; w.log.unshift({at:new Date().toISOString(),text:text});
}
function nextWorkId(){
  const n=Math.max.apply(null,state.workOrders.map(function(w){return Number(String(w.id).replace(/\D/g,''))||0;}).concat([2400]))+1;
  return 'WO-'+n;
}
function nextRequestId(){
  const n=Math.max.apply(null,state.requests.map(function(r){return Number(String(r.id).replace(/\D/g,''))||0;}).concat([80]))+1;
  return 'REQ-'+n;
}
function newTaskId(){ return 'T-'+Date.now()+'-'+Math.floor(Math.random()*1000); }

function updateBadges(){
  document.getElementById('workBadge').textContent=state.workOrders.filter(isActive).length||'';
  document.getElementById('myWorkBadge').textContent=state.workOrders.filter(function(w){return isActive(w)&&w.assigneeId===CURRENT_USER;}).length||'';
  document.getElementById('requestBadge').textContent=state.requests.filter(function(r){return r.status==='Requested';}).length||'';
  document.getElementById('stockBadge').textContent=state.parts.filter(function(p){return totalStock(p)<=minStock(p);}).length||'';
}
function updateConnection(){
  const online=navigator.onLine;
  const dot=document.getElementById('connectionDot');
  dot.classList.toggle('offline',!online);
  document.getElementById('connectionLabel').textContent=online?'Online · saved locally':'Offline · saved locally';
  document.getElementById('syncLabel').textContent=state.syncQueue.length?state.syncQueue.length+' change'+(state.syncQueue.length===1?'':'s')+' awaiting server':'No pending local changes';
}

function navigate(next){
  route=next; location.hash='#/'+next; render();
  document.getElementById('appView').focus({preventScroll:true});
}
function pageHead(kicker,title,subtitle,actions){
  return '<div class="page-head"><div><p class="eyebrow">'+escapeHTML(kicker)+'</p><h1>'+escapeHTML(title)+'</h1><p>'+escapeHTML(subtitle)+'</p></div><div class="page-actions">'+(actions||'')+'</div></div>';
}

function render(){
  updateBadges();
  document.querySelectorAll('.nav-link').forEach(function(b){b.classList.toggle('active',b.dataset.route===route);});
  const view=document.getElementById('appView');
  const pages={
    'dashboard':renderDashboard,'my-work':renderMyWork,'work-orders':renderWorkOrders,'pm':renderPM,
    'requests':renderRequests,'assets':renderAssets,'meters':renderMeters,'inventory':renderInventory,'reports':renderReports
  };
  view.innerHTML=(pages[route]||renderDashboard)();
  bindPageActions();
}

function renderDashboard(){
  const active=state.workOrders.filter(isActive);
  const urgent=active.filter(function(w){return w.priority==='Critical'||w.priority==='High'||overdue(w);}).sort(function(a,b){return a.due.localeCompare(b.due);});
  const low=state.parts.filter(function(p){return totalStock(p)<=minStock(p);});
  const equipment=state.assets.filter(function(a){return a.type==='Equipment';});
  const down=equipment.filter(function(a){return a.status==='Down';});
  const healthy=equipment.filter(function(a){return a.status==='Healthy';});
  const attention=equipment.filter(function(a){return a.status==='Attention';});
  const duePM=state.pm.filter(function(p){return p.status==='Running'&&p.trigger.type==='time'&&p.trigger.nextDue<=day(7);});
  const pmGenerated=state.workOrders.filter(function(w){return w.type==='Preventive'&&new Date(w.createdAt)>=new Date(new Date().getFullYear(),new Date().getMonth(),1);}).length;
  const pmCompleted=state.workOrders.filter(function(w){return w.type==='Preventive'&&w.status==='Completed'&&new Date(w.completedAt)>=new Date(new Date().getFullYear(),new Date().getMonth(),1);}).length;
  const pmCompliance=pmGenerated?Math.round(pmCompleted/pmGenerated*100):100;
  const healthTotal=Math.max(1,equipment.length);
  const decisionHTML=urgent.slice(0,6).map(function(w){
    return '<button class="decision-row" data-open-wo="'+w.id+'"><span class="stripe '+w.priority+'"></span><span><strong>'+escapeHTML(w.title)+'</strong><p>'+escapeHTML(assetName(w.assetId))+' · '+prettyDate(w.due)+' · '+escapeHTML(userName(w.assigneeId))+'</p></span><span class="badges">'+badge(w.priority,w.priority)+' '+badge(w.status)+'</span></button>';
  }).join('') || '<div class="empty"><strong>No urgent work</strong>Nothing is currently overdue or high priority.</div>';
  const pmHTML=state.pm.filter(function(x){return x.status==='Running';}).sort(function(a,b){
    const av=a.trigger.type==='time'?a.trigger.nextDue:'9999-12-31'; const bv=b.trigger.type==='time'?b.trigger.nextDue:'9999-12-31'; return av.localeCompare(bv);
  }).slice(0,4).map(function(p){
    const trig=p.trigger.type==='time'?prettyDate(p.trigger.nextDue):'At '+p.trigger.nextThreshold+' '+escapeHTML(meter(p.trigger.meterId).unit);
    return '<div class="pm-row"><span class="date-tile">'+(p.trigger.type==='time'?prettyDate(p.trigger.nextDue).replace('Today','NOW').replace('Tomorrow','NEXT'):'MTR')+'</span><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(assetName(p.assetId))+'</small></span>'+badge(trig,'healthy')+'</div>';
  }).join('');
  return pageHead('Live maintenance command','Operations overview','Decisions, reliability and planned work for the plant.',
    '<button class="secondary-btn" data-route-jump="requests">'+icon('i-request')+'New request</button><button class="primary-btn" data-new-work>'+icon('i-plus')+'New work order</button>')+
    '<section class="kpi-strip">'+
      '<article class="kpi"><label>Active work</label><strong>'+active.length+'</strong><small>'+active.filter(function(w){return w.priority==='High'||w.priority==='Critical';}).length+' high / critical</small></article>'+
      '<article class="kpi red"><label>Overdue</label><strong>'+active.filter(overdue).length+'</strong><small>Escalate before next round</small></article>'+
      '<article class="kpi blue"><label>PM compliance</label><strong>'+pmCompliance+'%</strong><small>'+duePM.length+' planned items due soon</small></article>'+
      '<article class="kpi amber"><label>Assets down</label><strong>'+down.length+'</strong><small>'+healthy.length+' equipment healthy</small></article>'+
      '<article class="kpi blue"><label>Below minimum</label><strong>'+low.length+'</strong><small>Parts requiring attention</small></article>'+
    '</section>'+
    '<section class="grid-main"><div class="stack">'+
      '<article class="card"><div class="card-head"><div><p class="eyebrow">Decision queue</p><h2>Work needing attention</h2></div><button class="link-btn" data-route-jump="work-orders">Open work board →</button></div><div class="decision-list">'+decisionHTML+'</div></article>'+
      '<article class="card"><div class="card-head"><div><p class="eyebrow">Maintenance plan</p><h2>What the system will generate next</h2></div><button class="link-btn" data-route-jump="pm">Manage PM →</button></div><div class="pm-mini">'+pmHTML+'</div></article>'+
    '</div><div class="stack">'+
      '<article class="card"><div class="card-head"><div><p class="eyebrow">Equipment state</p><h2>Plant availability</h2></div></div><div class="health-summary"><div class="health-bar"><span class="health-good" style="width:'+(healthy.length/healthTotal*100)+'%"></span><span class="health-attn" style="width:'+(attention.length/healthTotal*100)+'%"></span><span class="health-down" style="width:'+(down.length/healthTotal*100)+'%"></span></div><div class="legend"><div class="legend-row"><span><i class="dot"></i>Healthy</span><strong>'+healthy.length+'</strong></div><div class="legend-row"><span><i class="dot attention"></i>Attention</span><strong>'+attention.length+'</strong></div><div class="legend-row"><span><i class="dot down"></i>Down</span><strong>'+down.length+'</strong></div></div><button class="secondary-btn" style="width:100%;margin-top:16px" data-route-jump="assets">Open asset register</button></div></article>'+
      '<article class="card card-pad"><p class="eyebrow">Store readiness</p><h2 style="margin:3px 0 6px;font-size:1.1rem">Parts at risk</h2><p style="color:var(--muted);margin:0 0 14px">'+low.length+' item'+(low.length===1?'':'s')+' at or below minimum stock.</p><button class="secondary-btn" data-route-jump="inventory">Review stores</button></article>'+
    '</div></section>';
}

function renderWorkOrders(){
  const activeFilters=['Active','Open','In Progress','Completed','All'];
  let rows=state.workOrders.slice().sort(function(a,b){return (isActive(b)-isActive(a))||a.due.localeCompare(b.due);});
  if(woFilter==='Active') rows=rows.filter(isActive);
  else if(woFilter!=='All') rows=rows.filter(function(w){return w.status===woFilter;});
  const table=rows.map(function(w){
    return '<tr data-open-wo="'+w.id+'"><td><strong>'+escapeHTML(w.id)+'</strong><small>'+escapeHTML(w.type)+'</small></td><td><strong>'+escapeHTML(w.title)+'</strong><small>'+escapeHTML(assetName(w.assetId))+'</small></td><td>'+badge(w.priority,w.priority)+'</td><td>'+escapeHTML(userName(w.assigneeId))+'</td><td><strong>'+prettyDate(w.due)+'</strong>'+(overdue(w)?'<small style="color:var(--red)">Overdue</small>':'')+'</td><td>'+badge(w.status)+'</td><td>'+escapeHTML(w.source||'Manual')+'</td></tr>';
  }).join('');
  return pageHead('Work management','Work orders','Plan, execute and close maintenance with tasks, parts, labor and history.','<button class="primary-btn" data-new-work>'+icon('i-plus')+'New work order</button>')+
    '<div class="toolbar"><div class="filter-set">'+activeFilters.map(function(f){return '<button class="filter-chip '+(woFilter===f?'active':'')+'" data-wo-filter="'+f+'">'+f+'</button>';}).join('')+'</div><span style="color:var(--muted);font-size:.8rem">'+rows.length+' records</span></div>'+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Work</th><th>Priority</th><th>Assigned</th><th>Due</th><th>Status</th><th>Source</th></tr></thead><tbody>'+table+'</tbody></table></div>';
}

function renderMyWork(){
  const mine=state.workOrders.filter(function(w){return isActive(w)&&w.assigneeId===CURRENT_USER;});
  const rows=mine.map(function(w){return '<button class="decision-row" data-open-wo="'+w.id+'"><span class="stripe '+w.priority+'"></span><span><strong>'+escapeHTML(w.title)+'</strong><p>'+escapeHTML(w.id)+' · '+escapeHTML(assetName(w.assetId))+' · '+prettyDate(w.due)+'</p></span><span class="badges">'+badge(w.priority,w.priority)+' '+badge(w.status)+'</span></button>';}).join('')||'<div class="empty"><strong>No assigned work</strong>Your active work orders will appear here.</div>';
  return pageHead('Technician workspace','My work','The jobs assigned to '+userName(CURRENT_USER)+'.','<button class="primary-btn" data-new-work>'+icon('i-plus')+'New work order</button>')+
    '<article class="card"><div class="card-head"><div><p class="eyebrow">Assigned queue</p><h2>'+mine.length+' active job'+(mine.length===1?'':'s')+'</h2></div></div><div class="decision-list">'+rows+'</div></article>';
}

function renderPM(){
  const cards=state.pm.map(function(p){
    const a=asset(p.assetId); let triggerText='';
    if(p.trigger.type==='time') triggerText='Every '+p.trigger.intervalDays+' days · next '+prettyDate(p.trigger.nextDue);
    else { const m=meter(p.trigger.meterId); triggerText='Every '+p.trigger.intervalValue+' '+m.unit+' · next '+p.trigger.nextThreshold+' '+m.unit; }
    return '<article class="pm-card"><div class="badges">'+badge(p.status,'healthy')+' '+badge(p.mode==='fixed'?'Fixed':'Floating','pending')+'</div><h3>'+escapeHTML(p.name)+'</h3><p>'+escapeHTML(a.name)+' · '+p.tasks.length+' tasks · '+p.parts.length+' planned parts</p><div class="trigger"><span class="trigger-icon">'+icon(p.trigger.type==='time'?'i-calendar':'i-meter')+'</span><span><strong style="display:block;font-size:.78rem">'+(p.trigger.type==='time'?'Time trigger':'Meter trigger')+'</strong><small style="color:var(--muted)">'+escapeHTML(triggerText)+'</small></span></div><footer><button class="secondary-btn" data-generate-pm="'+p.id+'">Generate now</button><button class="quiet-btn" data-open-asset="'+p.assetId+'">Asset</button></footer></article>';
  }).join('');
  return pageHead('Preventive maintenance','Maintenance plans','Reusable job plans that generate work from time or equipment usage.','<button class="secondary-btn" data-run-automation>'+icon('i-sync')+'Evaluate triggers</button>')+
    '<div class="pm-grid">'+cards+'</div>';
}

function renderRequests(){
  const pending=state.requests.filter(function(r){return r.status==='Requested';});
  const cards=state.requests.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}).map(function(r){
    return '<article class="request-card"><header><span>'+badge(r.status,r.status==='Requested'?'pending':'completed')+'</span>'+badge(r.urgency,r.urgency==='Safety critical'?'down':r.urgency==='Urgent'?'attention':'healthy')+'</header><h3>'+escapeHTML(r.summary)+'</h3><p>'+escapeHTML(assetName(r.assetId))+' · '+escapeHTML(r.requester)+' · '+formatTime(r.createdAt)+'</p><footer><strong style="font-size:.76rem">'+escapeHTML(r.id)+'</strong>'+(r.status==='Requested'?'<button class="primary-btn" data-convert-request="'+r.id+'">Create work order</button>':'<span style="color:var(--muted);font-size:.76rem">'+escapeHTML(r.workOrderId||'Converted')+'</span>')+'</footer></article>';
  }).join('');
  return pageHead('Maintenance intake','Requests',pending.length+' request'+(pending.length===1?'':'s')+' waiting for triage.','<button class="primary-btn" data-new-request>'+icon('i-plus')+'New request</button>')+
    '<div class="request-grid">'+cards+'</div>';
}

function childrenOf(parentId){ return state.assets.filter(function(a){return a.parentId===parentId;}); }
function renderTree(parentId,depth){
  return childrenOf(parentId).map(function(a){
    const kids=childrenOf(a.id);
    return '<div class="tree-node"><div class="tree-line '+(selectedAssetId===a.id?'active':'')+'" data-select-asset="'+a.id+'"><span class="node-icon">'+icon('i-asset')+'</span><span><strong style="display:block;font-size:.8rem">'+escapeHTML(a.name)+'</strong><small>'+escapeHTML(a.code)+' · '+escapeHTML(a.type)+'</small></span>'+badge(a.status)+'</div>'+(kids.length?'<div class="tree-children">'+renderTree(a.id,(depth||0)+1)+'</div>':'')+'</div>';
  }).join('');
}
function assetDetail(a){
  if(!a) return '<div class="empty"><strong>Select an asset</strong>Choose an item in the hierarchy.</div>';
  const meters=state.meters.filter(function(m){return m.assetId===a.id;});
  const wos=state.workOrders.filter(function(w){return w.assetId===a.id;}).slice(0,6);
  const plans=state.pm.filter(function(p){return p.assetId===a.id;});
  const bom=(a.bom||[]).map(part).filter(Boolean);
  let body='';
  if(assetTab==='overview'){
    body='<div class="info-grid"><div class="info-cell"><small>Status</small><strong>'+a.status+'</strong></div><div class="info-cell"><small>Criticality</small><strong>'+a.criticality+'</strong></div><div class="info-cell"><small>Location</small><strong>'+escapeHTML(a.location||'—')+'</strong></div><div class="info-cell"><small>Manufacturer</small><strong>'+escapeHTML(a.manufacturer||'—')+'</strong></div><div class="info-cell"><small>Model</small><strong>'+escapeHTML(a.model||'—')+'</strong></div><div class="info-cell"><small>Serial</small><strong>'+escapeHTML(a.serial||'—')+'</strong></div></div>'+
      '<h3 style="margin:20px 0 9px;font-size:.92rem">Recent work</h3><div class="record-list">'+(wos.map(function(w){return '<button class="record-item" data-open-wo="'+w.id+'"><span><strong>'+escapeHTML(w.title)+'</strong><small>'+escapeHTML(w.id)+' · '+prettyDate(w.due)+'</small></span>'+badge(w.status)+'</button>';}).join('')||'<div class="empty">No work history yet.</div>')+'</div>';
  } else if(assetTab==='meters'){
    body='<div class="record-list">'+(meters.map(function(m){return '<div class="record-item"><span><strong>'+escapeHTML(m.name)+'</strong><small>Latest '+prettyDate(m.readings[m.readings.length-1].date)+'</small></span><strong>'+m.current+' '+escapeHTML(m.unit)+'</strong></div>';}).join('')||'<div class="empty">No meters on this asset.</div>')+'</div>';
  } else if(assetTab==='pm'){
    body='<div class="record-list">'+(plans.map(function(p){return '<div class="record-item"><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.trigger.type==='time'?'Next '+prettyDate(p.trigger.nextDue):'Meter trigger at '+p.trigger.nextThreshold)+'</small></span>'+badge(p.status,'healthy')+'</div>';}).join('')||'<div class="empty">No PM plans on this asset.</div>')+'</div>';
  } else if(assetTab==='parts'){
    body='<div class="record-list">'+(bom.map(function(p){return '<div class="record-item"><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.code)+'</small></span><strong>'+totalStock(p)+' in stock</strong></div>';}).join('')||'<div class="empty">No BOM parts linked.</div>')+'</div>';
  } else {
    body='<div class="record-list">'+(wos.map(function(w){return '<div class="record-item"><span><strong>'+escapeHTML(w.id)+' · '+escapeHTML(w.title)+'</strong><small>'+escapeHTML(w.type)+' · '+escapeHTML(userName(w.assigneeId))+'</small></span>'+badge(w.status)+'</div>';}).join('')||'<div class="empty">No history.</div>')+'</div>';
  }
  return '<div class="detail-hero"><div><p class="eyebrow">'+escapeHTML(a.type)+' · '+escapeHTML(a.code)+'</p><h2>'+escapeHTML(a.name)+'</h2><p>'+escapeHTML(a.location||'')+'</p></div><div class="badges">'+badge(a.status)+' '+badge('Criticality '+a.criticality,'pending')+'</div></div>'+
    '<div class="detail-tabs">'+['overview','meters','pm','parts','history'].map(function(t){return '<button class="detail-tab '+(assetTab===t?'active':'')+'" data-asset-tab="'+t+'">'+t[0].toUpperCase()+t.slice(1)+'</button>';}).join('')+'</div><div class="detail-body">'+body+'</div>';
}
function renderAssets(){
  const roots=state.assets.filter(function(a){return a.parentId===null;});
  const selected=asset(selectedAssetId)||roots[0];
  return pageHead('Asset care','Asset register','A hierarchy that mirrors the real plant so work, meters and parts stay tied to equipment.','<button class="secondary-btn" id="assetMeterButton">'+icon('i-meter')+'Add reading</button>')+
    '<div class="asset-layout"><section class="tree-panel"><div class="tree-head"><p class="eyebrow">Plant hierarchy</p><h2>Sites → facilities → equipment → tools</h2></div><div class="asset-tree">'+renderTree(null,0)+'</div></section><section class="detail-panel">'+assetDetail(selected)+'</section></div>';
}

function renderMeters(){
  const rows=state.meters.map(function(m){
    const readings=m.readings.slice().sort(function(a,b){return b.date.localeCompare(a.date);});
    return '<tr><td><strong>'+escapeHTML(m.name)+'</strong><small>'+escapeHTML(m.id)+'</small></td><td>'+escapeHTML(assetName(m.assetId))+'</td><td><strong>'+m.current+' '+escapeHTML(m.unit)+'</strong></td><td>'+prettyDate(readings[0].date)+'</td><td>'+readings.length+' readings</td><td><button class="secondary-btn" data-add-meter="'+m.id+'">Add reading</button></td></tr>';
  }).join('');
  return pageHead('Condition & usage','Meters','Usage readings can drive maintenance triggers and provide field evidence.','<button class="primary-btn" data-add-meter="">'+icon('i-plus')+'Add reading</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Meter</th><th>Asset</th><th>Current</th><th>Last reading</th><th>History</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderInventory(){
  const cards=state.parts.map(function(p){
    const qty=totalStock(p),min=minStock(p),max=(p.locations||[]).reduce(function(sum,l){return sum+Number(l.max||0);},0)||Math.max(qty,1);
    const pct=Math.min(100,qty/max*100), low=qty<=min;
    return '<article class="part-card"><div class="badges">'+badge(p.category,'healthy')+' '+(low?badge('Reorder','down'):badge('Available','completed'))+'</div><h3>'+escapeHTML(p.name)+'</h3><p>'+escapeHTML(p.code)+' · GHS '+Number(p.unitCost).toFixed(2)+' / unit</p><div class="stock-level"><div class="stock-top"><span>On hand <strong>'+qty+'</strong></span><span>Min '+min+'</span></div><div class="stock-track"><div class="stock-fill '+(low?'low':'')+'" style="width:'+pct+'%"></div></div></div><div class="record-list">'+p.locations.map(function(l){return '<div class="record-item"><span><strong>'+escapeHTML(l.name)+'</strong><small>Min '+l.min+' · Max '+l.max+'</small></span><strong>'+l.onHand+'</strong></div>';}).join('')+'</div></article>';
  }).join('');
  return pageHead('Inventory','Parts & stores','Stock by location, reorder thresholds and consumption tied to maintenance.','')+'<div class="parts-grid">'+cards+'</div>';
}

function renderReports(){
  const completed=state.workOrders.filter(function(w){return w.status==='Completed';});
  const avgLabor=completed.length?Math.round(completed.reduce(function(s,w){return s+(w.actualMinutes||0);},0)/completed.length):0;
  const planned=state.workOrders.filter(function(w){return w.type==='Preventive';}).length;
  const ratio=state.workOrders.length?Math.round(planned/state.workOrders.length*100):0;
  const backlog=state.workOrders.filter(isActive).length;
  const overdueCount=state.workOrders.filter(overdue).length;
  return pageHead('Insights','Reliability','A concise view of maintenance performance from the records in this field build.','')+
    '<div class="report-grid"><article class="report-card"><p class="eyebrow">Backlog</p><h3>'+backlog+' active work orders</h3><p>'+overdueCount+' overdue. Use this to drive weekly planning.</p></article><article class="report-card"><p class="eyebrow">Planned work</p><h3>'+ratio+'% preventive</h3><p>'+planned+' of '+state.workOrders.length+' recorded jobs are preventive.</p></article><article class="report-card"><p class="eyebrow">Labor</p><h3>'+avgLabor+' min average</h3><p>Average logged labor on completed work in the local dataset.</p></article></div>'+
    '<article class="card card-pad" style="margin-top:14px"><p class="eyebrow">Deployment note</p><h2 style="margin:2px 0 8px;font-size:1.1rem">This build is deliberately honest about sync</h2><p style="margin:0;color:var(--muted)">Field actions are fully saved on this device and queued for future synchronization. A shared server is not connected yet, so the Sync control will not pretend data has reached other users.</p></article>';
}

function openWorkDrawer(id,tab){
  const w=work(id); if(!w) return;
  drawerWorkId=id; drawerTab=tab||drawerTab||'overview';
  const drawer=document.getElementById('recordDrawer');
  const tasksDone=w.tasks.filter(function(t){return t.status==='Done';}).length;
  const progress=Math.round(tasksDone/Math.max(1,w.tasks.length)*100);
  let body='';
  if(drawerTab==='overview'){
    body='<div class="work-summary"><div class="info-cell"><small>Asset</small><strong>'+escapeHTML(assetName(w.assetId))+'</strong></div><div class="info-cell"><small>Assigned</small><strong>'+escapeHTML(userName(w.assigneeId))+'</strong></div><div class="info-cell"><small>Due</small><strong>'+prettyDate(w.due)+'</strong></div><div class="info-cell"><small>Estimated labor</small><strong>'+w.estimateHours+' h</strong></div><div class="info-cell"><small>Actual labor</small><strong>'+Math.round((w.actualMinutes||0)/6)/10+' h</strong></div><div class="info-cell"><small>Task progress</small><strong>'+progress+'%</strong></div></div><h3 style="font-size:.9rem;margin:18px 0 7px">Work instructions</h3><p style="color:var(--muted);margin:0">'+escapeHTML(w.instructions||'No instructions entered.')+'</p>';
  } else if(drawerTab==='tasks'){
    body='<div class="task-list">'+w.tasks.map(function(t){
      let control='';
      if(t.type==='Inspection') control='<span class="badges"><button class="filter-chip '+(t.result==='Pass'?'active':'')+'" data-inspection-result="'+w.id+'|'+t.id+'|Pass">Pass</button><button class="filter-chip '+(t.result==='Fail'?'active':'')+'" data-inspection-result="'+w.id+'|'+t.id+'|Fail">Fail</button></span>';
      else if(t.type==='Meter') control='<button class="secondary-btn" data-meter-task="'+w.id+'|'+t.id+'">'+(t.status==='Done'?'Recorded':'Record')+'</button>';
      else control='<input type="checkbox" '+(t.status==='Done'?'checked':'')+' data-task-toggle="'+w.id+'|'+t.id+'" aria-label="Complete task">';
      return '<div class="task-item">'+(t.type==='Inspection'||t.type==='Meter'?'<span class="task-type">'+escapeHTML(t.type)+'</span>':control)+'<span><strong>'+escapeHTML(t.text)+'</strong><small>'+escapeHTML(t.status==='Done'?'Complete':'To do')+(t.result?' · '+escapeHTML(t.result):'')+'</small></span>'+(t.type==='Inspection'||t.type==='Meter'?control:'<span class="task-type">'+escapeHTML(t.type)+'</span>')+'</div>';
    }).join('')+'</div>';
  } else if(drawerTab==='parts'){
    body='<div class="record-list">'+(w.parts.length?w.parts.map(function(x){
      const p=part(x.partId); const stock=p?totalStock(p):0;
      return '<div class="record-item"><span><strong>'+escapeHTML(p?p.name:x.partId)+'</strong><small>Planned '+x.planned+' · Used '+x.actual+' · Stock '+stock+'</small></span><button class="secondary-btn" data-use-part="'+w.id+'|'+x.partId+'">Use 1</button></div>';
    }).join(''):'<div class="empty">No parts planned for this work order.</div>')+'</div>';
  } else if(drawerTab==='labor'){
    body='<div class="info-grid"><div class="info-cell"><small>Estimated</small><strong>'+w.estimateHours+' h</strong></div><div class="info-cell"><small>Logged</small><strong>'+Math.round((w.actualMinutes||0)/6)/10+' h</strong></div><div class="info-cell"><small>Variance</small><strong>'+Math.round((((w.actualMinutes||0)/60)-w.estimateHours)*10)/10+' h</strong></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="secondary-btn" data-log-labor="'+w.id+'|15">+15 min</button><button class="secondary-btn" data-log-labor="'+w.id+'|30">+30 min</button><button class="secondary-btn" data-log-labor="'+w.id+'|60">+1 hour</button></div>';
  } else {
    body='<div class="worklog">'+((w.log||[]).slice().sort(function(a,b){return b.at.localeCompare(a.at);}).map(function(l){return '<div class="log-row"><time>'+formatTime(l.at)+'</time><span>'+escapeHTML(l.text)+'</span></div>';}).join('')||'<div class="empty">No activity recorded.</div>')+'</div>';
  }
  const action=isActive(w)?(w.status==='Open'?'<button class="primary-btn" data-start-work="'+w.id+'">Start work</button>':'<button class="primary-btn" data-complete-work="'+w.id+'">Complete work order</button>'):'';
  drawer.innerHTML='<div class="drawer-head"><div><p class="eyebrow">'+escapeHTML(w.id)+' · '+escapeHTML(w.type)+'</p><h2>'+escapeHTML(w.title)+'</h2><p>'+escapeHTML(assetName(w.assetId))+'</p></div><div style="display:flex;gap:8px;align-items:flex-start">'+action+'<button class="icon-btn" data-close-drawer aria-label="Close">'+icon('i-close')+'</button></div></div><div class="detail-tabs">'+['overview','tasks','parts','labor','log'].map(function(t){return '<button class="detail-tab '+(drawerTab===t?'active':'')+'" data-drawer-tab="'+t+'">'+t[0].toUpperCase()+t.slice(1)+'</button>';}).join('')+'</div><div class="drawer-body"><div class="badges" style="justify-content:flex-start;margin-bottom:14px">'+badge(w.priority,w.priority)+' '+badge(w.status)+' '+badge(w.source||'Manual','healthy')+'</div>'+body+'</div>';
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false');
}
function closeDrawer(){ const d=document.getElementById('recordDrawer');d.classList.remove('open');d.setAttribute('aria-hidden','true');drawerWorkId=null; }

function populateSelects(){
  const equipment=state.assets.filter(function(a){return a.type==='Equipment'||a.type==='Facility';});
  const opts=equipment.map(function(a){return '<option value="'+a.id+'">'+escapeHTML(a.name)+' · '+escapeHTML(a.code)+'</option>';}).join('');
  document.getElementById('workAssetSelect').innerHTML=opts;
  document.getElementById('requestAssetSelect').innerHTML=opts;
  document.getElementById('workAssigneeSelect').innerHTML=state.users.map(function(u){return '<option value="'+u.id+'">'+escapeHTML(u.name)+' · '+escapeHTML(u.role)+'</option>';}).join('');
  document.getElementById('meterSelect').innerHTML=state.meters.map(function(m){return '<option value="'+m.id+'">'+escapeHTML(assetName(m.assetId))+' · '+escapeHTML(m.name)+'</option>';}).join('');
}

function openWorkDialog(assetId){
  populateSelects(); const form=document.getElementById('workForm'); form.reset();
  form.elements.due.value=day(1); if(assetId) form.elements.assetId.value=assetId;
  document.getElementById('workDialog').showModal(); setTimeout(function(){form.elements.title.focus();},0);
}
function openRequestDialog(){
  populateSelects(); document.getElementById('requestForm').reset(); document.getElementById('requestDialog').showModal();
}
function openMeterDialog(meterId,taskRef){
  populateSelects(); const form=document.getElementById('meterForm');form.reset(); if(meterId) form.elements.meterId.value=meterId;
  pendingMeterTask=taskRef||null; document.getElementById('meterDialog').showModal();
}

function createWorkFromPM(p,manual){
  const id=nextWorkId();
  const w={id:id,title:p.name,assetId:p.assetId,type:'Preventive',priority:'Medium',status:'Open',assigneeId:'U-2',due:day(p.dueLead||2),estimateHours:1.5,actualMinutes:0,source:p.id,sourcePmId:p.id,instructions:'Generated from '+p.id+'. Complete the planned tasks and record actual parts and labor.',tasks:p.tasks.map(function(t){return Object.assign({id:newTaskId(),status:'Todo',result:null},clone(t));}),parts:p.parts.map(function(x){return {partId:x.partId,planned:x.planned||1,actual:0};}),createdAt:new Date().toISOString(),completedAt:null,log:[{at:new Date().toISOString(),text:(manual?'Manually generated':'Automatically generated')+' from '+p.id}]};
  state.workOrders.unshift(w); save('Generated '+id+' from '+p.id); return w;
}
function advancePM(p){
  if(p.trigger.type==='time'){
    let d=new Date(p.trigger.nextDue+'T12:00:00'); const now=new Date(day(0)+'T12:00:00');
    do{d.setDate(d.getDate()+p.trigger.intervalDays);}while(d<=now);
    p.trigger.nextDue=d.toISOString().slice(0,10);
  }else{
    const m=meter(p.trigger.meterId);
    while(m&&p.trigger.nextThreshold<=m.current) p.trigger.nextThreshold+=p.trigger.intervalValue;
  }
}
function evaluatePM(showMessage){
  let generated=0;
  state.pm.filter(function(p){return p.status==='Running';}).forEach(function(p){
    let fire=false;
    if(p.trigger.type==='time') fire=p.trigger.nextDue<=day(0);
    else { const m=meter(p.trigger.meterId); fire=!!m&&m.current>=p.trigger.nextThreshold; }
    if(fire){createWorkFromPM(p,false);advancePM(p);generated++;}
  });
  if(generated){save('Evaluated PM triggers');render();}
  if(showMessage) toast(generated?generated+' work order'+(generated===1?'':'s')+' generated':'No PM trigger is due');
}

function usePart(workId,partId){
  const w=work(workId),p=part(partId); if(!w||!p) return;
  const loc=p.locations.find(function(l){return l.onHand>0;});
  if(!loc){toast('No stock available for '+p.name);return;}
  loc.onHand-=1;
  const line=w.parts.find(function(x){return x.partId===partId;}); if(line) line.actual+=1;
  p.transactions.unshift({at:new Date().toISOString(),type:'Issue',qty:-1,workOrderId:w.id,location:loc.name});
  logWork(w,'Issued 1 × '+p.name+' from '+loc.name);
  save('Issued part to '+w.id); openWorkDrawer(w.id,'parts'); updateBadges(); toast('Part issued to '+w.id);
}
function convertRequest(id){
  const r=state.requests.find(function(x){return x.id===id;}); if(!r||r.status!=='Requested')return;
  const wid=nextWorkId();
  const w={id:wid,title:r.summary,assetId:r.assetId,type:'Corrective',priority:r.urgency==='Safety critical'?'Critical':r.urgency==='Urgent'?'High':'Medium',status:'Open',assigneeId:'U-2',due:day(r.urgency==='Normal'?3:1),estimateHours:1,actualMinutes:0,source:r.id,instructions:'Created from maintenance request '+r.id+'. Confirm the reported condition, make safe and document the repair.',tasks:[{id:newTaskId(),type:'Inspection',text:'Confirm reported condition',status:'Todo',result:null},{id:newTaskId(),type:'General',text:'Complete repair or containment action',status:'Todo'}],parts:[],createdAt:new Date().toISOString(),completedAt:null,log:[{at:new Date().toISOString(),text:'Created from '+r.id+' by '+r.requester}]};
  state.workOrders.unshift(w);r.status='Converted';r.workOrderId=wid;save('Converted '+r.id+' to '+wid);render();toast(wid+' created');
}
function completeWork(id){
  const w=work(id);if(!w)return;
  const incomplete=w.tasks.filter(function(t){return t.status!=='Done';});
  if(incomplete.length){toast('Complete all '+incomplete.length+' remaining tasks first');openWorkDrawer(id,'tasks');return;}
  w.status='Completed';w.completedAt=new Date().toISOString();logWork(w,'Work order completed by '+userName(CURRENT_USER));
  if(asset(w.assetId)&&asset(w.assetId).status==='Down') asset(w.assetId).status='Attention';
  save('Completed '+id);render();openWorkDrawer(id,'overview');toast(id+' completed');
}

function searchAll(query){
  const q=String(query||'').trim().toLowerCase();
  if(!q) return [];
  const out=[];
  state.workOrders.forEach(function(w){if([w.id,w.title,assetName(w.assetId)].join(' ').toLowerCase().includes(q))out.push({type:'Work order',title:w.id+' · '+w.title,sub:assetName(w.assetId),action:'wo',id:w.id,icon:'i-work'});});
  state.assets.forEach(function(a){if([a.id,a.code,a.name,a.location].join(' ').toLowerCase().includes(q))out.push({type:'Asset',title:a.name,sub:a.code+' · '+a.type,action:'asset',id:a.id,icon:'i-asset'});});
  state.parts.forEach(function(p){if([p.id,p.code,p.name].join(' ').toLowerCase().includes(q))out.push({type:'Part',title:p.name,sub:p.code+' · '+totalStock(p)+' in stock',action:'part',id:p.id,icon:'i-box'});});
  state.pm.forEach(function(p){if([p.id,p.name,assetName(p.assetId)].join(' ').toLowerCase().includes(q))out.push({type:'PM',title:p.name,sub:p.id+' · '+assetName(p.assetId),action:'pm',id:p.id,icon:'i-calendar'});});
  return out.slice(0,14);
}
function renderSearchResults(){
  const box=document.getElementById('globalSearchInput'); const target=document.getElementById('searchResults'); const results=searchAll(box.value);
  target.innerHTML=results.length?results.map(function(r){return '<button class="search-result" data-search-action="'+r.action+'|'+r.id+'"><span>'+icon(r.icon)+'</span><span><strong>'+escapeHTML(r.title)+'</strong><small>'+escapeHTML(r.type)+' · '+escapeHTML(r.sub)+'</small></span>'+icon('i-chevron')+'</button>';}).join(''):'<div class="empty"><strong>No matching records</strong>Try a code, asset name, work description or part number.</div>';
}

function openTag(code){
  const q=String(code||'').trim().toLowerCase();
  if(!q){toast('Enter a tag code');return;}
  const w=state.workOrders.find(function(x){return x.id.toLowerCase()===q;});
  if(w){document.getElementById('scanDialog').close();openWorkDrawer(w.id,'overview');return;}
  const a=state.assets.find(function(x){return x.code.toLowerCase()===q||x.id.toLowerCase()===q;});
  if(a){document.getElementById('scanDialog').close();selectedAssetId=a.id;assetTab='overview';navigate('assets');return;}
  const p=state.parts.find(function(x){return x.code.toLowerCase()===q||x.id.toLowerCase()===q;});
  if(p){document.getElementById('scanDialog').close();navigate('inventory');toast(p.name+' · '+totalStock(p)+' in stock');return;}
  toast('No SafiMaintain record matches that tag');
}

async function startCameraScanner(){
  const help=document.getElementById('scanHelp');
  if(!('BarcodeDetector' in window)){help.textContent='This browser does not provide BarcodeDetector. Use the tag field instead.';return;}
  try{
    scannerStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    const video=document.getElementById('scanVideo'); video.srcObject=scannerStream;video.hidden=false;await video.play();
    help.textContent='Point the camera at a QR code or barcode.';
    const detector=new BarcodeDetector({formats:['qr_code','code_128','ean_13','ean_8']});
    const loop=async function(){
      if(!scannerStream)return;
      try{const codes=await detector.detect(video);if(codes.length){document.getElementById('scanCode').value=codes[0].rawValue;stopScanner();openTag(codes[0].rawValue);return;}}catch(e){}
      requestAnimationFrame(loop);
    };loop();
  }catch(e){help.textContent='Camera access was not available. Enter the tag code manually.';}
}
function stopScanner(){ if(scannerStream){scannerStream.getTracks().forEach(function(t){t.stop();});scannerStream=null;}const v=document.getElementById('scanVideo');if(v){v.srcObject=null;v.hidden=true;}}

function bindPageActions(){
  document.querySelectorAll('[data-route-jump]').forEach(function(b){b.addEventListener('click',function(){navigate(b.dataset.routeJump);});});
  document.querySelectorAll('[data-new-work]').forEach(function(b){b.addEventListener('click',function(){openWorkDialog();});});
  document.querySelectorAll('[data-new-request]').forEach(function(b){b.addEventListener('click',openRequestDialog);});
  document.querySelectorAll('[data-open-wo]').forEach(function(el){el.addEventListener('click',function(){openWorkDrawer(el.dataset.openWo,'overview');});});
  document.querySelectorAll('[data-wo-filter]').forEach(function(b){b.addEventListener('click',function(){woFilter=b.dataset.woFilter;render();});});
  document.querySelectorAll('[data-generate-pm]').forEach(function(b){b.addEventListener('click',function(){const p=pm(b.dataset.generatePm);const w=createWorkFromPM(p,true);save('Generated '+w.id);render();toast(w.id+' generated');});});
  document.querySelectorAll('[data-run-automation]').forEach(function(b){b.addEventListener('click',function(){evaluatePM(true);});});
  document.querySelectorAll('[data-convert-request]').forEach(function(b){b.addEventListener('click',function(){convertRequest(b.dataset.convertRequest);});});
  document.querySelectorAll('[data-select-asset]').forEach(function(el){el.addEventListener('click',function(){selectedAssetId=el.dataset.selectAsset;assetTab='overview';render();});});
  document.querySelectorAll('[data-asset-tab]').forEach(function(b){b.addEventListener('click',function(){assetTab=b.dataset.assetTab;render();});});
  document.querySelectorAll('[data-open-asset]').forEach(function(b){b.addEventListener('click',function(){selectedAssetId=b.dataset.openAsset;assetTab='overview';navigate('assets');});});
  document.querySelectorAll('[data-add-meter]').forEach(function(b){b.addEventListener('click',function(){openMeterDialog(b.dataset.addMeter||null,null);});});
  const am=document.getElementById('assetMeterButton');if(am)am.addEventListener('click',function(){const m=state.meters.find(function(x){return x.assetId===selectedAssetId;});openMeterDialog(m?m.id:null,null);});
}

function setupGlobalEvents(){
  document.querySelectorAll('.nav-link').forEach(function(b){b.addEventListener('click',function(){navigate(b.dataset.route);closeMobileMenu();});});
  document.getElementById('newWorkButton').addEventListener('click',function(){openWorkDialog();});
  document.getElementById('searchButton').addEventListener('click',function(){document.getElementById('searchDialog').showModal();setTimeout(function(){document.getElementById('globalSearchInput').focus();},0);});
  document.getElementById('globalSearchInput').addEventListener('input',renderSearchResults);
  document.getElementById('scanButton').addEventListener('click',function(){document.getElementById('scanCode').value='';document.getElementById('scanDialog').showModal();});
  document.getElementById('openTagButton').addEventListener('click',function(){openTag(document.getElementById('scanCode').value);});
  document.getElementById('cameraScanButton').addEventListener('click',startCameraScanner);
  document.getElementById('syncButton').addEventListener('click',function(){toast('Server sync is not connected yet — '+state.syncQueue.length+' local change'+(state.syncQueue.length===1?'':'s')+' remain safe on this device');});
  document.getElementById('menuButton').addEventListener('click',openMobileMenu);
  document.getElementById('mobileScrim').addEventListener('click',closeMobileMenu);
  document.querySelectorAll('[data-close-dialog]').forEach(function(b){b.addEventListener('click',function(){const d=document.getElementById(b.dataset.closeDialog);if(d.id==='scanDialog')stopScanner();d.close();});});
  document.getElementById('scanDialog').addEventListener('close',stopScanner);

  document.getElementById('workForm').addEventListener('submit',function(e){
    e.preventDefault();const f=new FormData(e.currentTarget),id=nextWorkId();
    const w={id:id,title:String(f.get('title')).trim(),assetId:f.get('assetId'),type:f.get('type'),priority:f.get('priority'),status:'Open',assigneeId:f.get('assigneeId'),due:f.get('due'),estimateHours:Number(f.get('estimateHours')||0),actualMinutes:0,source:'Manual',instructions:String(f.get('instructions')||'').trim(),tasks:[{id:newTaskId(),type:'General',text:'Confirm equipment condition and make work area safe',status:'Todo'},{id:newTaskId(),type:'General',text:'Complete maintenance action and verify operation',status:'Todo'}],parts:[],createdAt:new Date().toISOString(),completedAt:null,log:[{at:new Date().toISOString(),text:'Work order created by '+userName(CURRENT_USER)}]};
    state.workOrders.unshift(w);save('Created '+id);e.currentTarget.reset();document.getElementById('workDialog').close();render();openWorkDrawer(id,'overview');toast(id+' created');
  });

  document.getElementById('requestForm').addEventListener('submit',function(e){
    e.preventDefault();const f=new FormData(e.currentTarget),id=nextRequestId();
    state.requests.unshift({id:id,assetId:f.get('assetId'),summary:String(f.get('summary')).trim(),urgency:f.get('urgency'),requester:userName(CURRENT_USER),createdAt:new Date().toISOString(),status:'Requested'});
    save('Created '+id);e.currentTarget.reset();document.getElementById('requestDialog').close();render();toast(id+' submitted');
  });

  document.getElementById('meterForm').addEventListener('submit',function(e){
    e.preventDefault();const f=new FormData(e.currentTarget),m=meter(f.get('meterId')),value=Number(f.get('value'));if(!m||!Number.isFinite(value))return;
    m.current=value;m.readings.push({value:value,date:day(0),note:String(f.get('note')||'').trim()});
    if(pendingMeterTask){const refs=pendingMeterTask.split('|'),w=work(refs[0]),t=w&&w.tasks.find(function(x){return x.id===refs[1];});if(t){t.status='Done';t.result=value+' '+m.unit;logWork(w,'Recorded '+m.name+': '+value+' '+m.unit);}}
    save('Recorded '+m.name);pendingMeterTask=null;document.getElementById('meterDialog').close();evaluatePM(false);render();if(drawerWorkId)openWorkDrawer(drawerWorkId,'tasks');toast('Meter reading saved');
  });

  document.getElementById('recordDrawer').addEventListener('click',function(e){
    const close=e.target.closest('[data-close-drawer]');if(close){closeDrawer();return;}
    const tab=e.target.closest('[data-drawer-tab]');if(tab&&drawerWorkId){drawerTab=tab.dataset.drawerTab;openWorkDrawer(drawerWorkId,drawerTab);return;}
    const start=e.target.closest('[data-start-work]');if(start){const w=work(start.dataset.startWork);w.status='In Progress';logWork(w,'Work started by '+userName(CURRENT_USER));save('Started '+w.id);render();openWorkDrawer(w.id,'overview');toast(w.id+' started');return;}
    const done=e.target.closest('[data-complete-work]');if(done){completeWork(done.dataset.completeWork);return;}
    const labor=e.target.closest('[data-log-labor]');if(labor){const ref=labor.dataset.logLabor.split('|'),w=work(ref[0]),mins=Number(ref[1]);w.actualMinutes=(w.actualMinutes||0)+mins;logWork(w,mins+' min labor logged by '+userName(CURRENT_USER));save('Logged labor on '+w.id);openWorkDrawer(w.id,'labor');toast(mins+' minutes logged');return;}
    const use=e.target.closest('[data-use-part]');if(use){const ref=use.dataset.usePart.split('|');usePart(ref[0],ref[1]);return;}
    const insp=e.target.closest('[data-inspection-result]');if(insp){const ref=insp.dataset.inspectionResult.split('|'),w=work(ref[0]),t=w.tasks.find(function(x){return x.id===ref[1];});t.result=ref[2];t.status='Done';logWork(w,'Inspection "'+t.text+'" recorded '+ref[2]);save('Completed inspection task');openWorkDrawer(w.id,'tasks');toast('Inspection result saved');return;}
    const mt=e.target.closest('[data-meter-task]');if(mt){const ref=mt.dataset.meterTask.split('|'),w=work(ref[0]),t=w.tasks.find(function(x){return x.id===ref[1];});openMeterDialog(t.meterId,mt.dataset.meterTask);return;}
  });
  document.getElementById('recordDrawer').addEventListener('change',function(e){
    const box=e.target.closest('[data-task-toggle]');if(!box)return;const ref=box.dataset.taskToggle.split('|'),w=work(ref[0]),t=w.tasks.find(function(x){return x.id===ref[1];});t.status=box.checked?'Done':'Todo';logWork(w,(box.checked?'Completed: ':'Reopened: ')+t.text);save('Updated task on '+w.id);openWorkDrawer(w.id,'tasks');
  });

  document.getElementById('searchResults').addEventListener('click',function(e){
    const b=e.target.closest('[data-search-action]');if(!b)return;const ref=b.dataset.searchAction.split('|');document.getElementById('searchDialog').close();
    if(ref[0]==='wo')openWorkDrawer(ref[1],'overview');
    if(ref[0]==='asset'){selectedAssetId=ref[1];assetTab='overview';navigate('assets');}
    if(ref[0]==='part')navigate('inventory');
    if(ref[0]==='pm')navigate('pm');
  });

  window.addEventListener('hashchange',function(){route=location.hash.replace('#/','')||'dashboard';render();});
  window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);
  window.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('searchButton').click();}if(e.key==='Escape')closeDrawer();});
}
function openMobileMenu(){document.getElementById('rail').classList.add('open');document.getElementById('mobileScrim').classList.add('show');}
function closeMobileMenu(){document.getElementById('rail').classList.remove('open');document.getElementById('mobileScrim').classList.remove('show');}

function init(){
  populateSelects();setupGlobalEvents();evaluatePM(false);render();updateConnection();
  if('serviceWorker' in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('service-worker.js').catch(function(){});});
}
init();
