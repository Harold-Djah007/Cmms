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
    { id:'U-1', name:'Abena Sarpong', role:'Operations manager', email:'abena.sarpong@safisana.org', active:true, emailAlerts:true, mfa:true, lastActive:new Date().toISOString() },
    { id:'U-2', name:'Kwame Mensah', role:'Mechanical technician', email:'kwame.mensah@safisana.org', active:true, emailAlerts:true, mfa:false, lastActive:new Date(Date.now()-3600000).toISOString() },
    { id:'U-3', name:'Simeon Sakyi', role:'Maintenance planner', email:'simeon.sakyi@safisana.org', active:true, emailAlerts:true, mfa:true, lastActive:new Date(Date.now()-7200000).toISOString() },
    { id:'U-4', name:'Ama Owusu', role:'Electrical technician', email:'ama.owusu@safisana.org', active:true, emailAlerts:true, mfa:false, lastActive:new Date(Date.now()-86400000).toISOString() }
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
  suppliers: [
    { id:'SUP-1', name:'Ghana Industrial Supplies', contact:'Nana Boateng', phone:'+233 24 555 0184', email:'orders@gis.example', status:'Active' },
    { id:'SUP-2', name:'PumpTech Ghana', contact:'Esi Amankwah', phone:'+233 30 255 0412', email:'service@pumptech.example', status:'Active' },
    { id:'SUP-3', name:'PowerCare Engineering', contact:'Yaw Asante', phone:'+233 20 555 0971', email:'parts@powercare.example', status:'Active' }
  ],
  receipts: [
    { id:'REC-103', partId:'PRT-2', supplierId:'SUP-2', quantity:2, location:'Main Store / Bin 12', reference:'DN-4481', receivedAt:new Date(Date.now()-86400000*5).toISOString(), receivedBy:'U-1' },
    { id:'REC-102', partId:'PRT-4', supplierId:'SUP-3', quantity:4, location:'CHP Store / Shelf 5', reference:'PO-2025', receivedAt:new Date(Date.now()-86400000*12).toISOString(), receivedBy:'U-3' }
  ],
  cycleCounts: [
    { id:'CNT-31', partId:'PRT-6', location:'Main Store / Rack 3', expected:2, counted:1, variance:-1, countedAt:new Date(Date.now()-86400000*2).toISOString(), countedBy:'U-1', note:'One damaged belt removed', status:'Posted' }
  ],
  purchaseOrders: [
    { id:'PO-2026', supplierId:'SUP-3', partId:'PRT-4', quantity:8, unitCost:27, expectedDate:day(6), status:'Ordered', createdAt:new Date(Date.now()-86400000*3).toISOString() },
    { id:'PO-2025', supplierId:'SUP-3', partId:'PRT-4', quantity:4, unitCost:27, expectedDate:day(-12), status:'Received', createdAt:new Date(Date.now()-86400000*18).toISOString(), receivedAt:new Date(Date.now()-86400000*12).toISOString() }
  ],
  workOrders: [
    {
      id:'WO-2407', title:'Clean mix pit and inspect feed pump', assetId:'P-201', type:'Preventive', priority:'High', status:'Open', assigneeId:'U-2',
      due:day(-1), estimateHours:2, actualMinutes:0, source:'PM-101', instructions:'Isolate the feed pump. Clean the mix pit screen, inspect coupling and seal, then verify vibration before returning the pump to service.',
      tasks:[
        {id:'T-1',type:'General',text:'Apply isolation and verify zero energy',status:'Todo'},
        {id:'T-2',type:'Inspection',text:'Inspect mechanical seal for leakage',status:'Todo',result:null,autoCorrective:true},
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
      tasks:[{id:'T-9',type:'Inspection',text:'Leak test gas train',status:'Todo',result:null,autoCorrective:true},{id:'T-10',type:'General',text:'Verify regulator setpoint',status:'Todo'}],
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
    { id:'PM-101', name:'Feed pump monthly service', assetId:'P-201', status:'Running', mode:'fixed', trigger:{type:'time',intervalDays:30,nextDue:day(18)}, dueLead:2, tasks:[{type:'General',text:'Apply isolation and verify zero energy'},{type:'Inspection',text:'Inspect mechanical seal for leakage',autoCorrective:true},{type:'Meter',text:'Record pump run hours',meterId:'MTR-1'},{type:'General',text:'Clean suction screen and work area'}], parts:[{partId:'PRT-2',planned:1}] },
    { id:'PM-102', name:'Mixer bearing service', assetId:'MIX-03', status:'Running', mode:'floating', trigger:{type:'time',intervalDays:30,nextDue:day(22)}, dueLead:2, tasks:[{type:'General',text:'Lubricate bearing points'},{type:'Inspection',text:'Inspect gearbox for leakage'}], parts:[{partId:'PRT-3',planned:1}] },
    { id:'PM-103', name:'Weather station monthly care', assetId:'WS-01', status:'Running', mode:'fixed', trigger:{type:'time',intervalDays:30,nextDue:day(3)}, dueLead:1, tasks:[{type:'General',text:'Clean sensing surfaces'},{type:'Inspection',text:'Inspect mast and power condition'}], parts:[] },
    { id:'PM-104', name:'CHP 10,000-hour service', assetId:'CHP-01', status:'Running', mode:'fixed', trigger:{type:'meter',meterId:'MTR-2',intervalValue:500,nextThreshold:10000}, dueLead:3, tasks:[{type:'Inspection',text:'Inspect ignition and cooling systems'},{type:'Meter',text:'Record engine hours',meterId:'MTR-2'},{type:'General',text:'Replace scheduled service consumables'}], parts:[{partId:'PRT-4',planned:2},{partId:'PRT-5',planned:4}] }
  ],
  requests: [
    { id:'REQ-81', assetId:'DEW-01', summary:'Belt is tracking toward the left side during operation', urgency:'Urgent', requester:'Kojo Arthur', createdAt:new Date(Date.now()-3600000*5).toISOString(), status:'Requested' },
    { id:'REQ-80', assetId:'FAC-LAB', summary:'Air conditioner making intermittent rattling noise', urgency:'Normal', requester:'Laboratory', createdAt:new Date(Date.now()-86400000).toISOString(), status:'Requested' }
  ],
  assetEvents: [
    { id:'AE-1', assetId:'P-201', fromState:'Online', toState:'Offline', reason:'Seal inspection and mix pit cleaning in progress', expectedReturn:day(1)+'T16:00', at:new Date(Date.now()-86400000).toISOString(), userId:'U-1' }
  ],
  notifications: [
    { id:'NTF-1', userId:'U-1', title:'Digester Feed Pump 02 is offline', message:'P-201 was taken offline for seal inspection and mix pit cleaning.', severity:'Critical', entityType:'Asset', entityId:'P-201', createdAt:new Date(Date.now()-86400000).toISOString(), read:false }
  ],
  mailOutbox: [
    { id:'MAIL-1', userId:'U-1', to:'abena.sarpong@safisana.org', subject:'[SafiMaintain] P-201 is offline', body:'Digester Feed Pump 02 was taken offline for seal inspection and mix pit cleaning.', status:'Queued locally', createdAt:new Date(Date.now()-86400000).toISOString(), entityId:'P-201' }
  ],
  auditLog: [
    { id:'AUD-1', at:new Date(Date.now()-86400000).toISOString(), userId:'U-1', action:'Asset taken offline', entityType:'Asset', entityId:'P-201', detail:'Seal inspection and mix pit cleaning in progress' }
  ],
  securitySettings:{sessionTimeout:30,requireMfaForManagers:true,lockAfterAttempts:5,auditRetentionDays:365},
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
let workspaceMode = localStorage.getItem('safimaint-workspace-mode') || 'planner';
let selectedWorkIds = new Set();
let sortKey = 'due';
let sortDir = 'asc';

function clone(value){ return JSON.parse(JSON.stringify(value)); }
function loadState(){
  try{
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return migrate(parsed || clone(seed));
  }catch(e){ return migrate(clone(seed)); }
}
function migrate(data){
  ['users','assets','meters','parts','suppliers','receipts','cycleCounts','purchaseOrders','workOrders','pm','requests','assetEvents','notifications','mailOutbox','auditLog','syncQueue'].forEach(function(key){
    if(!Array.isArray(data[key])) data[key]=clone(seed[key]);
  });
  data.users.forEach(function(u){if(u.active==null)u.active=true;if(u.emailAlerts==null)u.emailAlerts=true;if(u.mfa==null)u.mfa=false;if(!u.email)u.email=u.name.toLowerCase().replace(/\s+/g,'.')+'@safisana.org';if(!u.lastActive)u.lastActive=new Date().toISOString();});
  data.assets.forEach(function(a){if(!a.operatingState)a.operatingState=a.status==='Down'?'Offline':'Online';if(!Array.isArray(a.responsibleUserIds))a.responsibleUserIds=[];if(!a.bom)a.bom=[];});
  if(!data.securitySettings)data.securitySettings=clone(seed.securitySettings);
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
function supplier(id){ return state.suppliers.find(function(x){return x.id===id;}); }
function work(id){ return state.workOrders.find(function(x){return x.id===id;}); }
function pm(id){ return state.pm.find(function(x){return x.id===id;}); }
function currentUser(){ return user(CURRENT_USER); }
function assetName(id){ const x=asset(id); return x?x.name:'Unassigned'; }
function userName(id){ const x=user(id); return x?x.name:'Unassigned'; }
function partName(id){ const x=part(id); return x?x.name:'Part'; }
function supplierName(id){ const x=supplier(id); return x?x.name:'Not assigned'; }
function money(value){ return 'GHS '+Number(value||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2}); }
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
function badge(text,cls){ return '<span class="badge '+statusClass(cls||text)+'">'+escapeHTML(text)+'</span>'; }
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
function nextRecordId(prefix,records,start){
  const n=Math.max.apply(null,records.map(function(x){return Number(String(x.id).replace(/\D/g,''))||0;}).concat([start||0]))+1;
  return prefix+'-'+n;
}
function addAudit(action,entityType,entityId,detail){
  state.auditLog.unshift({id:'AUD-'+Date.now()+'-'+Math.floor(Math.random()*1000),at:new Date().toISOString(),userId:CURRENT_USER,action:action,entityType:entityType,entityId:entityId,detail:detail||''});
}
function assetStakeholders(a){
  const ids=new Set();
  state.users.forEach(function(u){if(u.active&&(u.role==='Operations manager'||u.role==='Maintenance planner'))ids.add(u.id);});
  (a.responsibleUserIds||[]).forEach(function(id){if(user(id)&&user(id).active)ids.add(id);});
  state.workOrders.filter(function(w){return w.assetId===a.id&&isActive(w);}).forEach(function(w){if(user(w.assigneeId)&&user(w.assigneeId).active)ids.add(w.assigneeId);});
  ids.add(CURRENT_USER);return Array.from(ids);
}
function notifyUsers(userIds,title,message,severity,entityType,entityId,emailCopy){
  const now=new Date().toISOString();
  userIds.forEach(function(userId){
    const u=user(userId);if(!u||!u.active)return;
    state.notifications.unshift({id:'NTF-'+Date.now()+'-'+userId+'-'+Math.floor(Math.random()*1000),userId:userId,title:title,message:message,severity:severity||'Information',entityType:entityType||'',entityId:entityId||'',createdAt:now,read:false});
    if(emailCopy!==false&&u.emailAlerts&&u.email)state.mailOutbox.unshift({id:'MAIL-'+Date.now()+'-'+userId+'-'+Math.floor(Math.random()*1000),userId:userId,to:u.email,subject:'[SafiMaintain] '+title,body:message,status:'Queued locally',createdAt:now,entityId:entityId||''});
  });
}
function unreadCount(){return state.notifications.filter(function(n){return n.userId===CURRENT_USER&&!n.read;}).length;}

function updateBadges(){
  document.getElementById('workBadge').textContent=state.workOrders.filter(isActive).length||'';
  document.getElementById('myWorkBadge').textContent=state.workOrders.filter(function(w){return isActive(w)&&w.assigneeId===CURRENT_USER;}).length||'';
  document.getElementById('requestBadge').textContent=state.requests.filter(function(r){return r.status==='Requested';}).length||'';
  document.getElementById('stockBadge').textContent=state.parts.filter(function(p){return totalStock(p)<=minStock(p);}).length||'';
  const unread=unreadCount();document.getElementById('alertBadge').textContent=unread||'';document.getElementById('notificationBadge').textContent=unread||'';
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
function setSuppliesOpen(open){
  const toggle=document.getElementById('suppliesToggle'),menu=document.getElementById('suppliesMenu');
  if(!toggle||!menu)return;
  toggle.setAttribute('aria-expanded',String(open));menu.hidden=!open;
}
function pageHead(kicker,title,subtitle,actions){
  return '<div class="page-head"><div><p class="eyebrow">'+escapeHTML(kicker)+'</p><h1>'+escapeHTML(title)+'</h1><p>'+escapeHTML(subtitle)+'</p></div><div class="page-actions">'+(actions||'')+'</div></div>';
}

function render(){
  updateBadges();
  document.body.classList.toggle('planner-mode',workspaceMode==='planner');
  document.body.classList.toggle('field-mode',workspaceMode==='field');
  document.querySelectorAll('.mode-btn').forEach(function(b){b.classList.toggle('active',b.dataset.mode===workspaceMode);});
  document.querySelectorAll('.nav-link').forEach(function(b){b.classList.toggle('active',b.dataset.route===route);});
  const suppliesRoutes=['inventory','receipts','counts','purchase-orders','suppliers'];
  const suppliesActive=suppliesRoutes.includes(route);
  const suppliesToggle=document.getElementById('suppliesToggle');
  if(suppliesToggle){suppliesToggle.classList.toggle('active',suppliesActive);if(suppliesActive)setSuppliesOpen(true);}
  const view=document.getElementById('appView');
  const pages={
    'dashboard':renderDashboard,'my-work':renderMyWork,'work-orders':renderWorkOrders,'pm':renderPM,
    'requests':renderRequests,'assets':renderAssets,'meters':renderMeters,'inventory':renderInventory,
    'receipts':renderReceipts,'counts':renderCounts,'purchase-orders':renderPurchaseOrders,'suppliers':renderSuppliers,'reports':renderReports,
    'people':renderPeople,'notifications':renderNotifications,'audit':renderAudit,'security':renderSecurity
  };
  view.innerHTML=(pages[route]||renderDashboard)();
  bindPageActions();
}

function renderDashboard(){
  const active=state.workOrders.filter(isActive);
  const urgent=active.filter(function(w){return w.priority==='Critical'||w.priority==='High'||overdue(w);}).sort(function(a,b){return a.due.localeCompare(b.due);});
  const low=state.parts.filter(function(p){return totalStock(p)<=minStock(p);});
  const equipment=state.assets.filter(function(a){return a.type==='Equipment';});
  const down=equipment.filter(function(a){return a.operatingState==='Offline';});
  const healthy=equipment.filter(function(a){return a.status==='Healthy';});
  const attention=equipment.filter(function(a){return a.status==='Attention';});
  const duePM=state.pm.filter(function(p){return p.status==='Running'&&p.trigger.type==='time'&&p.trigger.nextDue<=day(7);});
  const pmGenerated=state.workOrders.filter(function(w){return w.type==='Preventive'&&new Date(w.createdAt)>=new Date(new Date().getFullYear(),new Date().getMonth(),1);}).length;
  const pmCompleted=state.workOrders.filter(function(w){return w.type==='Preventive'&&w.status==='Completed'&&w.completedAt&&new Date(w.completedAt)>=new Date(new Date().getFullYear(),new Date().getMonth(),1);}).length;
  const pmCompliance=pmGenerated?Math.round(pmCompleted/pmGenerated*100):100;
  const healthTotal=Math.max(1,equipment.length);
  const decisionHTML=urgent.slice(0,7).map(function(w){
    return '<button class="decision-row" data-open-wo="'+w.id+'"><span class="stripe '+w.priority+'"></span><span><strong>'+escapeHTML(w.title)+'</strong><p>'+escapeHTML(w.id)+' · '+escapeHTML(assetName(w.assetId))+' · '+prettyDate(w.due)+' · '+escapeHTML(userName(w.assigneeId))+'</p></span><span class="badges">'+badge(w.priority,w.priority)+' '+badge(w.status)+'</span></button>';
  }).join('') || '<div class="empty"><strong>No urgent work</strong>Nothing is currently overdue or high priority.</div>';
  const pmHTML=state.pm.filter(function(x){return x.status==='Running';}).sort(function(a,b){
    const av=a.trigger.type==='time'?a.trigger.nextDue:'9999-12-31'; const bv=b.trigger.type==='time'?b.trigger.nextDue:'9999-12-31'; return av.localeCompare(bv);
  }).slice(0,5).map(function(p){
    const trig=p.trigger.type==='time'?prettyDate(p.trigger.nextDue):'At '+p.trigger.nextThreshold+' '+escapeHTML(meter(p.trigger.meterId).unit);
    return '<div class="pm-row"><span class="date-tile">'+(p.trigger.type==='time'?prettyDate(p.trigger.nextDue).replace('Today','NOW').replace('Tomorrow','NEXT'):'MTR')+'</span><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.id)+' · '+escapeHTML(assetName(p.assetId))+'</small></span>'+badge(trig,'healthy')+'</div>';
  }).join('');
  return pageHead('Maintenance control center','Operations overview','Planner view of work, assets, preventive maintenance and stores.',
    '<button class="secondary-btn" data-route-jump="requests">'+icon('i-request')+'Request</button><button class="primary-btn" data-new-work>'+icon('i-plus')+'New work order</button>')+
    '<section class="kpi-strip">'+
      '<article class="kpi"><label>Active work</label><strong>'+active.length+'</strong><small>'+active.filter(function(w){return w.priority==='High'||w.priority==='Critical';}).length+' high / critical</small></article>'+
      '<article class="kpi red"><label>Overdue</label><strong>'+active.filter(overdue).length+'</strong><small>Requires planner attention</small></article>'+
      '<article class="kpi blue"><label>PM compliance</label><strong>'+pmCompliance+'%</strong><small>'+duePM.length+' plans due soon</small></article>'+
      '<article class="kpi amber"><label>Assets offline</label><strong>'+down.length+'</strong><small>'+healthy.length+' equipment healthy</small></article>'+
      '<article class="kpi blue"><label>Below minimum</label><strong>'+low.length+'</strong><small>Stock items to replenish</small></article>'+
    '</section>'+
    '<section class="live-ops-strip">'+
      '<article class="live-tile"><div class="live-icon-stage gear-orbit">'+icon('i-work')+'</div><div><strong>Maintenance engine</strong><small>'+active.length+' jobs tracked · '+state.pm.length+' PM plans evaluating</small><span class="live-pulse">Live maintenance state</span></div></article>'+
      '<article class="live-tile"><div class="live-icon-stage scan-stage-mini">'+icon('i-scan')+'</div><div><strong>Tag & equipment scanning</strong><small>Asset, work-order and part tags ready for field lookup</small><span class="live-pulse">Scanner service ready</span></div></article>'+
      '<article class="live-tile"><div class="live-icon-stage stock-stage-mini"><i></i><i></i><i></i><i></i></div><div><strong>Store movement</strong><small>'+low.length+' below minimum · stock issues linked to work orders</small><span class="live-pulse">Inventory counters active</span></div></article>'+
    '</section>'+
    '<section class="grid-main"><div class="stack">'+
      '<article class="card"><div class="card-head"><div><p class="eyebrow">Action queue</p><h2>Work needing a decision</h2></div><button class="link-btn" data-route-jump="work-orders">Open work order list →</button></div><div class="decision-list">'+decisionHTML+'</div></article>'+
      '<article class="card"><div class="card-head"><div><p class="eyebrow">Scheduled maintenance</p><h2>Next PM triggers</h2></div><button class="link-btn" data-route-jump="pm">Scheduled maintenance →</button></div><div class="pm-mini">'+pmHTML+'</div></article>'+
    '</div><div class="stack">'+
      '<article class="card"><div class="card-head"><div><p class="eyebrow">Asset availability</p><h2>Plant health</h2></div></div><div class="health-summary"><div class="health-bar"><span class="health-good" style="width:'+(healthy.length/healthTotal*100)+'%"></span><span class="health-attn" style="width:'+(attention.length/healthTotal*100)+'%"></span><span class="health-down" style="width:'+(down.length/healthTotal*100)+'%"></span></div><div class="legend"><div class="legend-row"><span><i class="dot"></i>Healthy</span><strong>'+healthy.length+'</strong></div><div class="legend-row"><span><i class="dot attention"></i>Attention</span><strong>'+attention.length+'</strong></div><div class="legend-row"><span><i class="dot down"></i>Down</span><strong>'+down.length+'</strong></div></div><button class="secondary-btn" style="width:100%;margin-top:13px" data-route-jump="assets">Asset register</button></div></article>'+
      '<article class="card card-pad"><p class="eyebrow">Stores</p><h2 style="margin:3px 0 6px;font-size:1rem">Inventory attention</h2><p style="color:var(--muted);font-size:.76rem;margin:0 0 12px">'+low.length+' part'+(low.length===1?'':'s')+' at or below minimum stock.</p><button class="secondary-btn" data-route-jump="inventory">Parts & stores</button></article>'+
    '</div></section>';
}

function renderWorkOrders(){
  const filters=['Active','Open','In Progress','Completed','All'];
  let rows=state.workOrders.slice();
  if(woFilter==='Active') rows=rows.filter(isActive);
  else if(woFilter!=='All') rows=rows.filter(function(w){return w.status===woFilter;});
  const priorityRank={Critical:0,High:1,Medium:2,Low:3};
  rows.sort(function(a,b){
    let av=a[sortKey],bv=b[sortKey];
    if(sortKey==='asset') {av=assetName(a.assetId);bv=assetName(b.assetId);}
    if(sortKey==='assignee') {av=userName(a.assigneeId);bv=userName(b.assigneeId);}
    if(sortKey==='priority') {av=priorityRank[a.priority]??9;bv=priorityRank[b.priority]??9;}
    if(typeof av==='string') return (sortDir==='asc'?1:-1)*String(av).localeCompare(String(bv));
    return (sortDir==='asc'?1:-1)*((av||0)-(bv||0));
  });
  const selectedCount=selectedWorkIds.size;
  const sortHead=function(label,key){return '<button class="sort-button '+(sortKey===key?'active':'')+'" data-sort-work="'+key+'">'+label+(sortKey===key?(sortDir==='asc'?' ↑':' ↓'):'')+'</button>';};
  const table=rows.map(function(w){
    return '<tr><td class="bulk-check"><input type="checkbox" data-select-wo="'+w.id+'" '+(selectedWorkIds.has(w.id)?'checked':'')+' aria-label="Select '+w.id+'"></td>'+
      '<td><strong>'+escapeHTML(w.id)+'</strong><small>'+escapeHTML(w.type)+'</small></td>'+
      '<td><button class="link-btn" data-open-wo="'+w.id+'"><strong>'+escapeHTML(w.title)+'</strong></button><small>'+escapeHTML(assetName(w.assetId))+'</small></td>'+
      '<td>'+badge(w.priority,w.priority)+'</td><td>'+escapeHTML(userName(w.assigneeId))+'</td>'+
      '<td><strong>'+prettyDate(w.due)+'</strong>'+(overdue(w)?'<small style="color:var(--red)">Overdue</small>':'')+'</td>'+
      '<td>'+badge(w.status)+'</td><td>'+escapeHTML(w.source||'Manual')+'</td></tr>';
  }).join('');
  return pageHead('Maintenance','Work orders','Plan, assign and execute maintenance from one operational register.',
    '<button class="primary-btn" data-new-work>'+icon('i-plus')+'New</button>')+
    '<div class="admin-strip planner-only"><button class="tool-btn primary" data-new-work>'+icon('i-plus')+'New</button>'+
      '<button class="tool-btn" data-bulk-action="start" '+(!selectedCount?'disabled':'')+'>Start selected</button>'+
      '<button class="tool-btn" data-bulk-action="complete" '+(!selectedCount?'disabled':'')+'>Complete selected</button>'+
      '<button class="tool-btn" data-print-work>'+icon('i-file')+'Print</button>'+
      '<span class="spacer"></span><span class="admin-count">'+selectedCount+' selected · '+rows.length+' records</span></div>'+
    '<div class="toolbar"><div class="filter-set">'+filters.map(function(x){return '<button class="filter-chip '+(woFilter===x?'active':'')+'" data-wo-filter="'+x+'">'+x+'</button>';}).join('')+'</div></div>'+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th class="bulk-check"><input type="checkbox" data-select-all-wo aria-label="Select all"></th>'+
      '<th>'+sortHead('Code','id')+'</th><th>'+sortHead('Description / Asset','title')+'</th><th>'+sortHead('Priority','priority')+'</th>'+
      '<th>'+sortHead('Assigned user','assignee')+'</th><th>'+sortHead('Due','due')+'</th><th>'+sortHead('Status','status')+'</th><th>Type / Source</th></tr></thead>'+
      '<tbody>'+table+'</tbody></table></div>';
}

function renderMyWork(){
  const mine=state.workOrders.filter(function(w){return isActive(w)&&w.assigneeId===CURRENT_USER;});
  const rows=mine.map(function(w){return '<button class="decision-row" data-open-wo="'+w.id+'"><span class="stripe '+w.priority+'"></span><span><strong>'+escapeHTML(w.title)+'</strong><p>'+escapeHTML(w.id)+' · '+escapeHTML(assetName(w.assetId))+' · '+prettyDate(w.due)+'</p></span><span class="badges">'+badge(w.priority,w.priority)+' '+badge(w.status)+'</span></button>';}).join('')||'<div class="empty"><strong>No assigned work</strong>Your active work orders will appear here.</div>';
  return pageHead('Technician workspace','My work','The jobs assigned to '+userName(CURRENT_USER)+'.','<button class="primary-btn" data-new-work>'+icon('i-plus')+'New work order</button>')+
    '<article class="card"><div class="card-head"><div><p class="eyebrow">Assigned queue</p><h2>'+mine.length+' active job'+(mine.length===1?'':'s')+'</h2></div></div><div class="decision-list">'+rows+'</div></article>';
}

function renderPM(){
  const rows=state.pm.map(function(p){
    const a=asset(p.assetId);
    const isTime=p.trigger.type==='time';
    const m=!isTime?meter(p.trigger.meterId):null;
    const trigger=isTime?'Every '+p.trigger.intervalDays+' days':'Every '+p.trigger.intervalValue+' '+(m?m.unit:'');
    const next=isTime?prettyDate(p.trigger.nextDue):(p.trigger.nextThreshold+' '+(m?m.unit:''));
    return '<tr><td><strong>'+escapeHTML(p.id)+'</strong></td><td><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(a?a.name:'')+'</small></td>'+
      '<td>'+badge(isTime?'Time':'Meter',isTime?'healthy':'pending')+'</td><td>'+escapeHTML(trigger)+'</td><td>'+badge(p.mode==='fixed'?'Fixed':'Floating','pending')+'</td>'+
      '<td><strong>'+escapeHTML(next)+'</strong></td><td>'+p.tasks.length+' tasks</td><td>'+p.parts.length+' parts</td><td>'+badge(p.status,'healthy')+'</td>'+
      '<td><button class="tool-btn" data-generate-pm="'+p.id+'">Generate</button></td></tr>';
  }).join('');
  return pageHead('Maintenance','Scheduled maintenance','Time- and meter-driven job plans that generate repeatable work orders.',
    '<button class="secondary-btn" data-run-automation>'+icon('i-sync')+'Evaluate triggers</button>')+
    '<div class="admin-strip planner-only"><button class="tool-btn primary" data-run-automation>'+icon('i-sync')+'Evaluate triggers</button>'+
      '<button class="tool-btn" data-print-work>Print</button><span class="spacer"></span><span class="admin-count">'+state.pm.length+' maintenance plans</span></div>'+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Scheduled maintenance</th><th>Trigger</th><th>Frequency</th><th>Scheduling</th><th>Next</th><th>Tasks</th><th>Parts</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
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
    return '<div class="tree-node"><div class="tree-line '+(selectedAssetId===a.id?'active':'')+'" data-select-asset="'+a.id+'"><span class="node-icon">'+icon('i-asset')+'</span><span><strong style="display:block;font-size:.8rem">'+escapeHTML(a.name)+'</strong><small>'+escapeHTML(a.code)+' · '+escapeHTML(a.type)+'</small></span>'+badge(a.operatingState,a.operatingState==='Online'?'completed':'down')+'</div>'+(kids.length?'<div class="tree-children">'+renderTree(a.id,(depth||0)+1)+'</div>':'')+'</div>';
  }).join('');
}
function assetDetail(a){
  if(!a) return '<div class="empty"><strong>Select an asset</strong>Choose an item in the hierarchy.</div>';
  const meters=state.meters.filter(function(m){return m.assetId===a.id;});
  const wos=state.workOrders.filter(function(w){return w.assetId===a.id;}).slice(0,6);
  const plans=state.pm.filter(function(p){return p.assetId===a.id;});
  const bom=(a.bom||[]).map(part).filter(Boolean);
  const events=state.assetEvents.filter(function(e){return e.assetId===a.id;}).sort(function(x,y){return y.at.localeCompare(x.at);});
  const responsible=(a.responsibleUserIds||[]).map(userName).join(', ')||'Not assigned';
  let body='';
  if(assetTab==='overview'){
    body='<div class="asset-state-banner '+statusClass(a.operatingState)+'"><span class="state-light"></span><div><small>Operational state</small><strong>'+escapeHTML(a.operatingState)+'</strong></div><button class="'+(a.operatingState==='Online'?'danger-btn':'primary-btn')+'" data-toggle-asset-state="'+a.id+'">'+icon('i-power')+(a.operatingState==='Online'?'Take offline':'Return online')+'</button></div>'+
      '<div class="info-grid"><div class="info-cell"><small>Condition</small><strong>'+a.status+'</strong></div><div class="info-cell"><small>Criticality</small><strong>'+a.criticality+'</strong></div><div class="info-cell"><small>Responsible</small><strong>'+escapeHTML(responsible)+'</strong></div><div class="info-cell"><small>Location</small><strong>'+escapeHTML(a.location||'—')+'</strong></div><div class="info-cell"><small>Manufacturer / model</small><strong>'+escapeHTML([a.manufacturer,a.model].filter(Boolean).join(' · ')||'—')+'</strong></div><div class="info-cell"><small>Serial</small><strong>'+escapeHTML(a.serial||'—')+'</strong></div></div>'+
      '<h3 style="margin:20px 0 9px;font-size:.92rem">Recent work</h3><div class="record-list">'+(wos.map(function(w){return '<button class="record-item" data-open-wo="'+w.id+'"><span><strong>'+escapeHTML(w.title)+'</strong><small>'+escapeHTML(w.id)+' · '+prettyDate(w.due)+'</small></span>'+badge(w.status)+'</button>';}).join('')||'<div class="empty">No work history yet.</div>')+'</div>';
  } else if(assetTab==='meters'){
    body='<div class="record-list">'+(meters.map(function(m){return '<div class="record-item"><span><strong>'+escapeHTML(m.name)+'</strong><small>Latest '+prettyDate(m.readings[m.readings.length-1].date)+'</small></span><strong>'+m.current+' '+escapeHTML(m.unit)+'</strong></div>';}).join('')||'<div class="empty">No meters on this asset.</div>')+'</div>';
  } else if(assetTab==='pm'){
    body='<div class="record-list">'+(plans.map(function(p){return '<div class="record-item"><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.trigger.type==='time'?'Next '+prettyDate(p.trigger.nextDue):'Meter trigger at '+p.trigger.nextThreshold)+'</small></span>'+badge(p.status,'healthy')+'</div>';}).join('')||'<div class="empty">No PM plans on this asset.</div>')+'</div>';
  } else if(assetTab==='parts'){
    body='<div class="record-list">'+(bom.map(function(p){return '<div class="record-item"><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.code)+'</small></span><strong>'+totalStock(p)+' in stock</strong></div>';}).join('')||'<div class="empty">No BOM parts linked.</div>')+'</div>';
  } else if(assetTab==='work'){
    body='<div class="record-list">'+(wos.map(function(w){return '<button class="record-item" data-open-wo="'+w.id+'"><span><strong>'+escapeHTML(w.id)+' · '+escapeHTML(w.title)+'</strong><small>'+escapeHTML(w.type)+' · '+escapeHTML(userName(w.assigneeId))+'</small></span>'+badge(w.status)+'</button>';}).join('')||'<div class="empty">No work history.</div>')+'</div>';
  } else {
    body='<div class="record-list">'+(events.map(function(e){return '<div class="record-item"><span><strong>'+escapeHTML(e.fromState)+' → '+escapeHTML(e.toState)+'</strong><small>'+escapeHTML(e.reason)+' · '+formatTime(e.at)+' · '+escapeHTML(userName(e.userId))+'</small></span>'+badge(e.toState,e.toState==='Online'?'completed':'down')+'</div>';}).join('')||'<div class="empty">No operational-state changes recorded.</div>')+'</div>';
  }
  return '<div class="detail-hero"><div><p class="eyebrow">'+escapeHTML(a.type)+' · '+escapeHTML(a.code)+'</p><h2>'+escapeHTML(a.name)+'</h2><p>'+escapeHTML(a.location||'')+'</p></div><div class="detail-hero-actions"><button class="secondary-btn" data-edit-asset="'+a.id+'">Edit / move</button><div class="badges">'+badge(a.operatingState,a.operatingState==='Online'?'completed':'down')+' '+badge(a.status)+' '+badge('Criticality '+a.criticality,'pending')+'</div></div></div>'+
    '<div class="detail-tabs">'+['overview','meters','pm','parts','work','activity'].map(function(t){return '<button class="detail-tab '+(assetTab===t?'active':'')+'" data-asset-tab="'+t+'">'+(t==='pm'?'PM':t[0].toUpperCase()+t.slice(1))+'</button>';}).join('')+'</div><div class="detail-body">'+body+'</div>';
}
function renderAssets(){
  const roots=state.assets.filter(function(a){return a.parentId===null;});
  const selected=asset(selectedAssetId)||roots[0];
  return pageHead('Assets','Asset register','Plant hierarchy, equipment records, meters, BOMs and maintenance history.',
    '<button class="secondary-btn" id="assetMeterButton">'+icon('i-meter')+'Add reading</button><button class="primary-btn" data-new-asset>'+icon('i-plus')+'New asset</button>')+
    '<div class="admin-strip planner-only"><button class="tool-btn primary" data-new-asset>'+icon('i-plus')+'New asset</button><button class="tool-btn" data-print-work>Print asset tags</button><span class="spacer"></span><span class="admin-count">'+state.assets.filter(function(a){return a.operatingState==='Offline';}).length+' offline · '+state.assets.length+' records</span></div>'+
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
  const rows=state.parts.map(function(p){
    const qty=totalStock(p),min=minStock(p),max=(p.locations||[]).reduce(function(sum,l){return sum+Number(l.max||0);},0);
    const low=qty<=min;
    const locations=p.locations.map(function(l){return l.name;}).join(', ');
    return '<tr><td><strong>'+escapeHTML(p.code)+'</strong></td><td><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.category)+'</small></td>'+
      '<td>'+qty+'</td><td>'+min+'</td><td>'+max+'</td><td>'+escapeHTML(locations)+'</td><td>'+money(p.unitCost)+'</td>'+
      '<td>'+badge(low?'Below min':'In stock',low?'down':'completed')+'</td><td><button class="tool-btn" data-supply-action="count" data-part-id="'+p.id+'">Count</button></td></tr>';
  }).join('');
  const lowCount=state.parts.filter(function(p){return totalStock(p)<=minStock(p);}).length;
  return pageHead('Supplies','Parts & stores','Inventory administration with location stock, thresholds and work-order consumption.',
    '<button class="secondary-btn" data-supply-action="count">'+icon('i-clipboard')+'Stock count</button><button class="primary-btn" data-supply-action="receive">'+icon('i-truck')+'Receive stock</button>')+
    '<div class="admin-strip planner-only"><button class="tool-btn primary" data-supply-action="part">'+icon('i-plus')+'New part</button>'+
      '<button class="tool-btn" data-supply-action="receive">Receive stock</button><button class="tool-btn" data-route-jump="counts">Cycle counts</button>'+
      '<button class="tool-btn" data-print-work>Print labels</button><span class="spacer"></span><span class="admin-count">'+lowCount+' below minimum · '+state.parts.length+' parts</span></div>'+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Part code</th><th>Part / category</th><th>On hand</th><th>Min</th><th>Max</th><th>Stock location</th><th>Unit cost</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderReceipts(){
  const rows=state.receipts.slice().sort(function(a,b){return b.receivedAt.localeCompare(a.receivedAt);}).map(function(r){
    return '<tr><td><strong>'+escapeHTML(r.id)+'</strong><small>'+escapeHTML(r.reference||'No reference')+'</small></td><td><strong>'+escapeHTML(partName(r.partId))+'</strong><small>'+escapeHTML(part(r.partId)?part(r.partId).code:'')+'</small></td><td>'+r.quantity+'</td><td>'+escapeHTML(r.location)+'</td><td>'+escapeHTML(supplierName(r.supplierId))+'</td><td>'+formatTime(r.receivedAt)+'</td><td>'+escapeHTML(userName(r.receivedBy))+'</td></tr>';
  }).join('')||'<tr><td colspan="7" class="table-empty">No stock receipts yet.</td></tr>';
  return pageHead('Supplies','Stock receipts','Receive parts into a store and keep a traceable delivery history.','<button class="primary-btn" data-supply-action="receive">'+icon('i-truck')+'Receive stock</button>')+
    '<div class="supply-summary"><span><strong>'+state.receipts.length+'</strong> receipts</span><span><strong>'+state.receipts.reduce(function(s,r){return s+Number(r.quantity||0);},0)+'</strong> units received</span></div>'+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Part</th><th>Quantity</th><th>Store / bin</th><th>Supplier</th><th>Received</th><th>Received by</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderCounts(){
  const rows=state.cycleCounts.slice().sort(function(a,b){return b.countedAt.localeCompare(a.countedAt);}).map(function(c){
    return '<tr><td><strong>'+escapeHTML(c.id)+'</strong></td><td><strong>'+escapeHTML(partName(c.partId))+'</strong><small>'+escapeHTML(part(c.partId)?part(c.partId).code:'')+'</small></td><td>'+escapeHTML(c.location)+'</td><td>'+c.expected+'</td><td>'+c.counted+'</td><td>'+badge((c.variance>0?'+':'')+c.variance,c.variance===0?'completed':'attention')+'</td><td>'+formatTime(c.countedAt)+'</td><td>'+badge(c.status,'completed')+'</td></tr>';
  }).join('')||'<tr><td colspan="8" class="table-empty">No counts posted yet.</td></tr>';
  return pageHead('Supplies','Cycle counts','Verify physical stock and post the variance in one guided step.','<button class="primary-btn" data-supply-action="count">'+icon('i-clipboard')+'New count</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Count</th><th>Part</th><th>Store / bin</th><th>Expected</th><th>Counted</th><th>Variance</th><th>Counted</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderPurchaseOrders(){
  const rows=state.purchaseOrders.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}).map(function(po){
    const next=po.status==='Draft'?'Approve':po.status==='Approved'?'Mark ordered':po.status==='Ordered'?'Receive':'Received';
    return '<tr><td><strong>'+escapeHTML(po.id)+'</strong><small>'+formatTime(po.createdAt)+'</small></td><td>'+escapeHTML(supplierName(po.supplierId))+'</td><td><strong>'+escapeHTML(partName(po.partId))+'</strong><small>'+escapeHTML(part(po.partId)?part(po.partId).code:'')+'</small></td><td>'+po.quantity+'</td><td>'+money(po.unitCost)+'</td><td><strong>'+money(po.quantity*po.unitCost)+'</strong></td><td>'+prettyDate(po.expectedDate)+'</td><td>'+badge(po.status,po.status==='Received'?'completed':po.status==='Draft'?'pending':'progress')+'</td><td><button class="tool-btn" data-po-action="'+po.id+'" '+(po.status==='Received'?'disabled':'')+'>'+next+'</button></td></tr>';
  }).join('')||'<tr><td colspan="9" class="table-empty">No purchase orders yet.</td></tr>';
  return pageHead('Supplies','Purchase orders','A light approval-to-receipt flow for replenishment.','<button class="primary-btn" data-supply-action="po">'+icon('i-plus')+'New purchase order</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>PO</th><th>Supplier</th><th>Part</th><th>Qty</th><th>Unit cost</th><th>Total</th><th>Expected</th><th>Status</th><th>Next action</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderSuppliers(){
  const rows=state.suppliers.map(function(s){
    const open=state.purchaseOrders.filter(function(po){return po.supplierId===s.id&&po.status!=='Received';}).length;
    const supplied=state.receipts.filter(function(r){return r.supplierId===s.id;}).length;
    return '<tr><td><strong>'+escapeHTML(s.name)+'</strong><small>'+escapeHTML(s.id)+'</small></td><td>'+escapeHTML(s.contact||'—')+'</td><td>'+escapeHTML(s.phone||'—')+'</td><td>'+escapeHTML(s.email||'—')+'</td><td>'+open+'</td><td>'+supplied+'</td><td>'+badge(s.status,'completed')+'</td></tr>';
  }).join('')||'<tr><td colspan="7" class="table-empty">No suppliers yet.</td></tr>';
  return pageHead('Supplies','Suppliers','Keep the contacts needed to source and receive maintenance parts.','<button class="primary-btn" data-supply-action="supplier">'+icon('i-plus')+'New supplier</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Supplier</th><th>Contact</th><th>Phone</th><th>Email</th><th>Open POs</th><th>Receipts</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
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

const ROLE_PERMISSIONS={
  'Operations manager':'All assets, stock, work, people, alerts and settings',
  'Maintenance planner':'Assets, stock, work planning, alerts and reports',
  'Mechanical technician':'Assigned work, asset readings and parts issue',
  'Electrical technician':'Assigned work, asset readings and parts issue',
  'Viewer':'Read-only operational records'
};

function renderPeople(){
  const roles=Object.keys(ROLE_PERMISSIONS);
  const rows=state.users.map(function(u){
    const options=roles.map(function(role){return '<option '+(u.role===role?'selected':'')+'>'+escapeHTML(role)+'</option>';}).join('');
    return '<tr><td><strong>'+escapeHTML(u.name)+'</strong><small>'+escapeHTML(u.email)+'</small></td><td><select class="table-select" data-user-role="'+u.id+'">'+options+'</select></td><td>'+badge(u.active?'Active':'Inactive',u.active?'completed':'pending')+'</td><td>'+badge(u.mfa?'MFA enrolled':'Not enrolled',u.mfa?'completed':'attention')+'</td><td><label class="table-toggle"><input type="checkbox" data-email-alert="'+u.id+'" '+(u.emailAlerts?'checked':'')+'> Email alerts</label></td><td>'+formatTime(u.lastActive)+'</td><td><button class="tool-btn" data-user-active="'+u.id+'">'+(u.active?'Deactivate':'Activate')+'</button></td></tr>';
  }).join('');
  return pageHead('Administration','People & access','Manage operational roles, access status and notification preferences.','')+
    '<div class="boundary-banner">'+icon('i-shield')+'<div><strong>Role controls are active in this interface</strong><span>Central sign-in, password policy and server-side permission enforcement require the shared backend milestone.</span></div></div>'+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Person</th><th>Role</th><th>Access</th><th>MFA</th><th>Alerts</th><th>Last active</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderNotifications(){
  const mine=state.notifications.filter(function(n){return n.userId===CURRENT_USER;}).sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);});
  const items=mine.map(function(n){return '<article class="notification-item '+(!n.read?'unread':'')+'"><span class="notification-severity '+statusClass(n.severity)+'">'+icon(n.severity==='Critical'?'i-alert':'i-bell')+'</span><div><div class="notification-title"><strong>'+escapeHTML(n.title)+'</strong>'+badge(n.severity,n.severity)+'</div><p>'+escapeHTML(n.message)+'</p><small>'+formatTime(n.createdAt)+' · '+escapeHTML(n.entityType||'Operations')+(n.entityId?' '+escapeHTML(n.entityId):'')+'</small></div><button class="tool-btn" data-mark-notification="'+n.id+'">'+(n.read?'Mark unread':'Mark read')+'</button></article>';}).join('')||'<div class="empty"><strong>No alerts yet</strong>Asset state, stock and operations alerts will appear here.</div>';
  const outbox=state.mailOutbox.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}).map(function(m){return '<tr><td><strong>'+escapeHTML(m.to)+'</strong></td><td>'+escapeHTML(m.subject)+'</td><td>'+formatTime(m.createdAt)+'</td><td>'+badge(m.status,'pending')+'</td></tr>';}).join('')||'<tr><td colspan="4" class="table-empty">No email copies queued.</td></tr>';
  return pageHead('Administration','Mail & alerts','In-app notifications with traceable email-copy preparation.','<button class="primary-btn" data-compose-message>'+icon('i-mail')+'New announcement</button>')+
    '<div class="boundary-banner warning">'+icon('i-mail')+'<div><strong>Email provider not connected</strong><span>Messages are saved to a local outbox for review. External delivery starts when a mail service and shared backend are connected.</span></div></div>'+
    '<div class="admin-strip"><button class="tool-btn" data-mark-all-read>Mark all read</button><span class="spacer"></span><span class="admin-count">'+unreadCount()+' unread · '+state.mailOutbox.length+' email copies queued</span></div>'+
    '<section class="admin-grid"><article class="card"><div class="card-head"><div><p class="eyebrow">In-app center</p><h2>My alerts</h2></div></div><div class="notification-list">'+items+'</div></article><article><div class="table-title-row"><div><h2>Email outbox</h2><p>Prepared delivery records</p></div></div><div class="table-wrap"><table class="data-table compact-table"><thead><tr><th>Recipient</th><th>Subject</th><th>Created</th><th>Status</th></tr></thead><tbody>'+outbox+'</tbody></table></div></article></section>';
}

function renderAudit(){
  const rows=state.auditLog.slice().sort(function(a,b){return b.at.localeCompare(a.at);}).map(function(x){return '<tr><td>'+formatTime(x.at)+'</td><td><strong>'+escapeHTML(userName(x.userId))+'</strong></td><td>'+escapeHTML(x.action)+'</td><td>'+escapeHTML(x.entityType)+' <strong>'+escapeHTML(x.entityId)+'</strong></td><td>'+escapeHTML(x.detail||'—')+'</td></tr>';}).join('')||'<tr><td colspan="5" class="table-empty">No audited changes yet.</td></tr>';
  return pageHead('Administration','Audit trail','A chronological record of important asset, stock, communication and security changes.','<button class="secondary-btn" data-print-work>'+icon('i-file')+'Print</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Record</th><th>Detail</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderSecurity(){
  const s=state.securitySettings;
  const rows=Object.keys(ROLE_PERMISSIONS).map(function(role){return '<tr><td><strong>'+escapeHTML(role)+'</strong></td><td>'+escapeHTML(ROLE_PERMISSIONS[role])+'</td></tr>';}).join('');
  return pageHead('Administration','Security','Keep access understandable with simple roles, MFA policy and accountable changes.','')+
    '<div class="boundary-banner">'+icon('i-shield')+'<div><strong>Security configuration is saved on this device</strong><span>Production enforcement needs identity management, encrypted server storage and server-side authorization.</span></div></div>'+
    '<section class="security-layout"><form class="card card-pad security-form" id="securityForm"><p class="eyebrow">Policy</p><h2>Access policy</h2><label>Idle session timeout<select name="sessionTimeout"><option value="15">15 minutes</option><option value="30" '+(s.sessionTimeout===30?'selected':'')+'>30 minutes</option><option value="60" '+(s.sessionTimeout===60?'selected':'')+'>60 minutes</option></select></label><label>Lock after failed attempts<select name="lockAfterAttempts"><option value="3" '+(s.lockAfterAttempts===3?'selected':'')+'>3 attempts</option><option value="5" '+(s.lockAfterAttempts===5?'selected':'')+'>5 attempts</option><option value="10" '+(s.lockAfterAttempts===10?'selected':'')+'>10 attempts</option></select></label><label>Audit retention<select name="auditRetentionDays"><option value="90" '+(s.auditRetentionDays===90?'selected':'')+'>90 days</option><option value="365" '+(s.auditRetentionDays===365?'selected':'')+'>365 days</option><option value="730" '+(s.auditRetentionDays===730?'selected':'')+'>2 years</option></select></label><label class="check-row"><input type="checkbox" name="requireMfaForManagers" '+(s.requireMfaForManagers?'checked':'')+'> Require MFA for managers</label><button class="primary-btn" type="submit">Save policy</button></form><article><div class="table-title-row"><div><h2>Role permissions</h2><p>Simple least-privilege model</p></div></div><div class="table-wrap"><table class="data-table compact-table"><thead><tr><th>Role</th><th>Allowed work</th></tr></thead><tbody>'+rows+'</tbody></table></div></article></section>';
}

function openAssetDialog(id){
  const form=document.getElementById('assetForm'),a=id?asset(id):null;form.reset();
  const descendants=new Set();
  (function collect(parent){childrenOf(parent).forEach(function(x){descendants.add(x.id);collect(x.id);});})(id||'__none__');
  document.getElementById('assetParentSelect').innerHTML='<option value="">No parent (top-level site)</option>'+state.assets.filter(function(x){return !a||x.id!==a.id&&!descendants.has(x.id);}).map(function(x){return '<option value="'+x.id+'">'+escapeHTML(x.code+' · '+x.name)+'</option>';}).join('');
  document.getElementById('assetResponsibleSelect').innerHTML='<option value="">Not assigned</option>'+state.users.filter(function(u){return u.active;}).map(function(u){return '<option value="'+u.id+'">'+escapeHTML(u.name+' · '+u.role)+'</option>';}).join('');
  document.getElementById('assetDialogTitle').textContent=a?'Edit asset':'Create asset';form.elements.assetId.value=a?a.id:'';
  if(a){['code','name','type','status','criticality','location','manufacturer','model','serial','commissioned'].forEach(function(k){form.elements[k].value=a[k]||'';});form.elements.parentId.value=a.parentId||'';form.elements.responsibleUserId.value=(a.responsibleUserIds||[])[0]||'';}
  else {form.elements.status.value='Healthy';form.elements.criticality.value='B';form.elements.type.value='Equipment';}
  document.getElementById('assetDialog').showModal();setTimeout(function(){form.elements.code.focus();},0);
}

function openAssetStateDialog(id){
  const a=asset(id);if(!a)return;const next=a.operatingState==='Online'?'Offline':'Online',form=document.getElementById('assetStateForm');form.reset();
  form.elements.assetId.value=a.id;form.elements.nextState.value=next;form.elements.createWork.checked=next==='Offline';
  document.getElementById('assetStateTitle').textContent=(next==='Offline'?'Take offline: ':'Return online: ')+a.name;
  document.getElementById('assetStateSubmit').textContent=next==='Offline'?'Confirm offline':'Confirm online';
  document.getElementById('expectedReturnLabel').hidden=next==='Online';document.getElementById('correctiveWorkLabel').hidden=next==='Online';
  const recipients=assetStakeholders(a).map(user).filter(Boolean);document.getElementById('assetAlertRecipients').innerHTML='<strong>'+recipients.length+' people will be alerted</strong><span>'+escapeHTML(recipients.map(function(u){return u.name+' ('+u.email+')';}).join(', '))+'</span>';
  document.getElementById('assetStateDialog').showModal();setTimeout(function(){form.elements.reason.focus();},0);
}

function handleAssetSubmit(e){
  e.preventDefault();const f=new FormData(e.currentTarget),existing=f.get('assetId')?asset(f.get('assetId')):null,code=String(f.get('code')).trim().toUpperCase();
  if(state.assets.some(function(a){return a.code.toUpperCase()===code&&(!existing||a.id!==existing.id);})){toast('That asset code already exists');return;}
  const a=existing||{id:nextRecordId('AST',state.assets,0),operatingState:'Online',bom:[]};
  Object.assign(a,{code:code,name:String(f.get('name')).trim(),type:f.get('type'),parentId:f.get('parentId')||null,status:f.get('status'),criticality:f.get('criticality'),location:String(f.get('location')).trim(),manufacturer:String(f.get('manufacturer')||'').trim(),model:String(f.get('model')||'').trim(),serial:String(f.get('serial')||'').trim(),commissioned:f.get('commissioned')||'',responsibleUserIds:f.get('responsibleUserId')?[f.get('responsibleUserId')]:[]});
  if(!existing)state.assets.push(a);selectedAssetId=a.id;assetTab='overview';addAudit(existing?'Asset updated':'Asset created','Asset',a.id,a.code+' · '+a.name);save(existing?'Updated '+a.id:'Created '+a.id);document.getElementById('assetDialog').close();populateSelects();render();toast(a.id+(existing?' updated':' created'));
}

function handleAssetStateSubmit(e){
  e.preventDefault();const f=new FormData(e.currentTarget),a=asset(f.get('assetId'));if(!a)return;const from=a.operatingState,next=f.get('nextState'),reason=String(f.get('reason')).trim(),now=new Date().toISOString();
  a.operatingState=next;if(next==='Offline')a.status='Down';else if(a.status==='Down')a.status='Attention';
  state.assetEvents.unshift({id:'AE-'+Date.now(),assetId:a.id,fromState:from,toState:next,reason:reason,expectedReturn:f.get('expectedReturn')||'',at:now,userId:CURRENT_USER});
  let workId='';if(next==='Offline'&&f.get('createWork')){workId=nextWorkId();const assignee=(a.responsibleUserIds||[])[0]||'U-2';state.workOrders.unshift({id:workId,title:'Restore '+a.name+' to service',assetId:a.id,type:'Corrective',priority:a.criticality==='A'?'Critical':'High',status:'Open',assigneeId:assignee,due:day(1),estimateHours:1,actualMinutes:0,source:'Asset state change',instructions:'Asset was taken offline: '+reason+'. Diagnose, correct safely and verify readiness before returning it online.',tasks:[{id:newTaskId(),type:'Inspection',text:'Diagnose reason for outage',status:'Todo',result:null},{id:newTaskId(),type:'General',text:'Complete corrective action',status:'Todo'},{id:newTaskId(),type:'Inspection',text:'Verify safe return to service',status:'Todo',result:null}],parts:[],createdAt:now,completedAt:null,log:[{at:now,text:'Created when '+a.code+' was taken offline'}]});}
  const detail=a.code+' · '+a.name+' was set '+next.toLowerCase()+' by '+userName(CURRENT_USER)+'. Reason: '+reason+(f.get('expectedReturn')?' Expected return: '+formatTime(f.get('expectedReturn'))+'.':'')+(workId?' Corrective work: '+workId+'.':'');
  notifyUsers(assetStakeholders(a),a.name+' is '+next.toLowerCase(),detail,next==='Offline'?'Critical':'Information','Asset',a.id,true);addAudit('Asset set '+next.toLowerCase(),'Asset',a.id,reason+(workId?' · '+workId:''));save('Changed '+a.id+' to '+next);document.getElementById('assetStateDialog').close();render();toast(a.code+' is now '+next.toLowerCase()+(workId?' · '+workId+' created':''));
}

function openWorkDrawer(id,tab){
  const w=work(id); if(!w) return;
  drawerWorkId=id;
  drawerTab=!tab||tab==='overview'?'general':tab;
  const drawer=document.getElementById('recordDrawer');
  const tasksDone=w.tasks.filter(function(t){return t.status==='Done';}).length;
  const progress=Math.round(tasksDone/Math.max(1,w.tasks.length)*100);
  const usedParts=(w.parts||[]).reduce(function(sum,x){return sum+Number(x.actual||0);},0);
  const assetMeters=state.meters.filter(function(m){return m.assetId===w.assetId;});
  let body='';

  if(drawerTab==='general'){
    body='<div class="record-admin-grid">'+
      '<div class="info-cell"><small>Work order status</small><strong>'+escapeHTML(w.status)+'</strong></div>'+
      '<div class="info-cell"><small>Asset</small><strong>'+escapeHTML(assetName(w.assetId))+'</strong></div>'+
      '<div class="info-cell"><small>Maintenance type</small><strong>'+escapeHTML(w.type)+'</strong></div>'+
      '<div class="info-cell"><small>Priority</small><strong>'+escapeHTML(w.priority)+'</strong></div>'+
      '<div class="info-cell"><small>Assigned to</small><strong>'+escapeHTML(userName(w.assigneeId))+'</strong></div>'+
      '<div class="info-cell"><small>Suggested completion</small><strong>'+prettyDate(w.due)+'</strong></div>'+
      '<div class="info-cell"><small>Estimated labor</small><strong>'+w.estimateHours+' h</strong></div>'+
      '<div class="info-cell"><small>Actual labor</small><strong>'+Math.round((w.actualMinutes||0)/6)/10+' h</strong></div>'+
    '</div>'+
    '<div class="record-section"><h3>Summary of issue / work</h3><p>'+escapeHTML(w.title)+'</p></div>'+
    '<div class="record-section"><h3>Work instructions</h3><p>'+escapeHTML(w.instructions||'No work instructions entered.')+'</p></div>'+
    '<div class="record-section"><h3>Source</h3><p>'+escapeHTML(w.source||'Manual')+(w.sourcePmId?' · generated from '+escapeHTML(w.sourcePmId):'')+'</p></div>';
  } else if(drawerTab==='completion'){
    body='<div class="record-admin-grid">'+
      '<div class="info-cell"><small>Status</small><strong>'+escapeHTML(w.status)+'</strong></div>'+
      '<div class="info-cell"><small>Task completion</small><strong>'+tasksDone+' / '+w.tasks.length+'</strong></div>'+
      '<div class="info-cell"><small>Labor logged</small><strong>'+Math.round((w.actualMinutes||0)/6)/10+' h</strong></div>'+
      '<div class="info-cell"><small>Parts issued</small><strong>'+usedParts+'</strong></div>'+
      '<div class="info-cell"><small>Date completed</small><strong>'+(w.completedAt?formatTime(w.completedAt):'Not completed')+'</strong></div>'+
      '<div class="info-cell"><small>Progress</small><strong>'+progress+'%</strong></div>'+
    '</div>'+
    '<div class="record-section"><h3>Close-out readiness</h3><p>'+(tasksDone===w.tasks.length?'All required tasks are complete. The work order can be closed when verification is finished.':'Complete the remaining '+(w.tasks.length-tasksDone)+' task'+((w.tasks.length-tasksDone)===1?'':'s')+' before close-out.')+'</p></div>'+
    (isActive(w)?'<button class="primary-btn" data-complete-work="'+w.id+'">Complete work order</button>':'');
  } else if(drawerTab==='labor'){
    body='<div class="record-admin-grid"><div class="info-cell"><small>Estimated labor</small><strong>'+w.estimateHours+' h</strong></div><div class="info-cell"><small>Actual labor</small><strong>'+Math.round((w.actualMinutes||0)/6)/10+' h</strong></div><div class="info-cell"><small>Variance</small><strong>'+Math.round((((w.actualMinutes||0)/60)-w.estimateHours)*10)/10+' h</strong></div></div>'+
      '<div class="record-section"><h3>Log technician time</h3><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="secondary-btn" data-log-labor="'+w.id+'|15">+15 min</button><button class="secondary-btn" data-log-labor="'+w.id+'|30">+30 min</button><button class="secondary-btn" data-log-labor="'+w.id+'|60">+1 hour</button></div></div>';
  } else if(drawerTab==='tasks'){
    body='<div class="task-list">'+w.tasks.map(function(t){
      let control='';
      if(t.type==='Inspection') control='<span class="badges"><button class="filter-chip '+(t.result==='Pass'?'active':'')+'" data-inspection-result="'+w.id+'|'+t.id+'|Pass">Pass</button><button class="filter-chip '+(t.result==='Fail'?'active':'')+'" data-inspection-result="'+w.id+'|'+t.id+'|Fail">Fail</button></span>';
      else if(t.type==='Meter') control='<button class="secondary-btn" data-meter-task="'+w.id+'|'+t.id+'">'+(t.status==='Done'?'Recorded':'Record')+'</button>';
      else control='<input type="checkbox" '+(t.status==='Done'?'checked':'')+' data-task-toggle="'+w.id+'|'+t.id+'" aria-label="Complete task">';
      return '<div class="task-item">'+(t.type==='Inspection'||t.type==='Meter'?'<span class="task-type">'+escapeHTML(t.type)+'</span>':control)+'<span><strong>'+escapeHTML(t.text)+'</strong><small>'+escapeHTML(t.status==='Done'?'Complete':'To do')+(t.result?' · '+escapeHTML(t.result):'')+(t.followOnWorkId?' · Follow-on '+escapeHTML(t.followOnWorkId):'')+'</small></span>'+(t.type==='Inspection'||t.type==='Meter'?control:'<span class="task-type">'+escapeHTML(t.type)+'</span>')+'</div>';
    }).join('')+'</div>';
  } else if(drawerTab==='parts'){
    body='<div class="record-list">'+(w.parts.length?w.parts.map(function(x){
      const p=part(x.partId); const stock=p?totalStock(p):0;
      return '<div class="record-item"><span><strong>'+escapeHTML(p?p.name:x.partId)+'</strong><small>'+escapeHTML(p?p.code:'')+' · Planned '+x.planned+' · Used '+x.actual+' · Stock '+stock+'</small></span><button class="secondary-btn" data-use-part="'+w.id+'|'+x.partId+'">Issue 1</button></div>';
    }).join(''):'<div class="empty">No parts planned for this work order.</div>')+'</div>';
  } else if(drawerTab==='meters'){
    body='<div class="record-list">'+(assetMeters.length?assetMeters.map(function(m){
      const latest=m.readings.slice().sort(function(a,b){return b.date.localeCompare(a.date);})[0];
      return '<div class="record-item"><span><strong>'+escapeHTML(m.name)+'</strong><small>'+escapeHTML(assetName(m.assetId))+' · Latest '+prettyDate(latest.date)+'</small></span><strong>'+m.current+' '+escapeHTML(m.unit)+'</strong></div>';
    }).join(''):'<div class="empty">No meters are linked to this asset.</div>')+'</div>';
  } else if(drawerTab==='files'){
    body='<div class="empty"><strong>No local attachments yet</strong>Files and photos will be shared across users when the server storage milestone is connected.</div>';
  } else {
    body='<div class="worklog">'+((w.log||[]).slice().sort(function(a,b){return b.at.localeCompare(a.at);}).map(function(l){return '<div class="log-row"><time>'+formatTime(l.at)+'</time><span>'+escapeHTML(l.text)+'</span></div>';}).join('')||'<div class="empty">No activity recorded.</div>')+'</div>';
  }

  const action=isActive(w)?(w.status==='Open'?'<button class="primary-btn" data-start-work="'+w.id+'">Start work</button>':'<button class="primary-btn" data-complete-work="'+w.id+'">Complete</button>'):'';
  const tabs=[
    ['general','General'],['completion','Completion'],['labor','Labor'],['tasks','Tasks'],['parts','Parts'],
    ['meters','Meter readings'],['files','Files'],['log','Work log']
  ];
  drawer.innerHTML=
    '<div class="drawer-head"><div><p class="eyebrow">Work Order Administration</p><h2>'+escapeHTML(w.id)+' · '+escapeHTML(w.title)+'</h2><p>'+escapeHTML(assetName(w.assetId))+' · '+escapeHTML(w.type)+'</p></div><div style="display:flex;gap:7px;align-items:flex-start">'+action+'<button class="icon-btn" data-close-drawer aria-label="Close">'+icon('i-close')+'</button></div></div>'+
    '<div class="record-toolbar planner-only"><span class="record-code">'+escapeHTML(w.id)+'</span><span>'+badge(w.status)+'</span><span>'+badge(w.priority,w.priority)+'</span><span class="record-toolbar-sep"></span><span>Assigned: <strong>'+escapeHTML(userName(w.assigneeId))+'</strong></span><span>Due: <strong>'+prettyDate(w.due)+'</strong></span><span class="record-tag">'+icon('i-scan')+' '+escapeHTML(w.id)+'</span></div>'+
    '<div class="detail-tabs">'+tabs.map(function(t){return '<button class="detail-tab '+(drawerTab===t[0]?'active':'')+'" data-drawer-tab="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div>'+
    '<div class="drawer-body">'+body+'</div>';
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
    if(p.mode==='floating'){
      p.trigger.nextDue=day(p.trigger.intervalDays);
    }else{
      let d=new Date(p.trigger.nextDue+'T12:00:00'); const now=new Date(day(0)+'T12:00:00');
      do{d.setDate(d.getDate()+p.trigger.intervalDays);}while(d<=now);
      p.trigger.nextDue=d.toISOString().slice(0,10);
    }
  }else{
    const m=meter(p.trigger.meterId);
    if(!m) return;
    if(p.mode==='floating') p.trigger.nextThreshold=m.current+p.trigger.intervalValue;
    else while(p.trigger.nextThreshold<=m.current) p.trigger.nextThreshold+=p.trigger.intervalValue;
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
function createFollowOnFromTask(parent,t){
  if(!parent||!t||t.followOnWorkId) return t&&t.followOnWorkId;
  const id=nextWorkId();
  const w={id:id,title:'Corrective action: '+t.text,assetId:parent.assetId,type:'Corrective',priority:'High',status:'Open',assigneeId:parent.assigneeId,due:day(1),estimateHours:1,actualMinutes:0,source:parent.id,instructions:'Generated from a failed inspection task on '+parent.id+'. Confirm the defect, correct it safely and document verification.',tasks:[{id:newTaskId(),type:'Inspection',text:'Confirm the reported defect',status:'Todo',result:null},{id:newTaskId(),type:'General',text:'Complete corrective action and verify operation',status:'Todo'}],parts:[],createdAt:new Date().toISOString(),completedAt:null,log:[{at:new Date().toISOString(),text:'Automatically created from failed inspection on '+parent.id}]};
  state.workOrders.unshift(w);t.followOnWorkId=id;logWork(parent,'Failed inspection generated follow-on '+id);return id;
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
  state.suppliers.forEach(function(s){if([s.id,s.name,s.contact,s.email].join(' ').toLowerCase().includes(q))out.push({type:'Supplier',title:s.name,sub:s.contact||s.id,action:'supplier',id:s.id,icon:'i-supplier'});});
  state.purchaseOrders.forEach(function(po){if([po.id,supplierName(po.supplierId),partName(po.partId),po.status].join(' ').toLowerCase().includes(q))out.push({type:'Purchase order',title:po.id,sub:supplierName(po.supplierId)+' · '+po.status,action:'po',id:po.id,icon:'i-file'});});
  state.pm.forEach(function(p){if([p.id,p.name,assetName(p.assetId)].join(' ').toLowerCase().includes(q))out.push({type:'PM',title:p.name,sub:p.id+' · '+assetName(p.assetId),action:'pm',id:p.id,icon:'i-calendar'});});
  return out.slice(0,14);
}
function renderSearchResults(){
  const box=document.getElementById('globalSearchInput'); const target=document.getElementById('searchResults'); const results=searchAll(box.value);
  target.innerHTML=results.length?results.map(function(r){return '<button class="search-result" data-search-action="'+r.action+'|'+r.id+'"><span>'+icon(r.icon)+'</span><span><strong>'+escapeHTML(r.title)+'</strong><small>'+escapeHTML(r.type)+' · '+escapeHTML(r.sub)+'</small></span>'+icon('i-chevron')+'</button>';}).join(''):'<div class="empty"><strong>No matching records</strong>Try a code, asset, work description, part, supplier or PO number.</div>';
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

function bulkUpdateWork(action){
  if(!selectedWorkIds.size){toast('Select one or more work orders first');return;}
  let changed=0;
  selectedWorkIds.forEach(function(id){
    const w=work(id); if(!w) return;
    if(action==='start'&&w.status==='Open'){w.status='In Progress';logWork(w,'Work started from planner bulk action');changed++;}
    if(action==='complete'&&isActive(w)&&w.tasks.every(function(t){return t.status==='Done';})){w.status='Completed';w.completedAt=new Date().toISOString();logWork(w,'Work order completed from planner bulk action');changed++;}
  });
  if(changed) save('Bulk work-order update');
  selectedWorkIds.clear();render();toast(changed?changed+' work order'+(changed===1?'':'s')+' updated':'No selected records met the action rules');
}

function optionList(records,label,value,selected){
  return records.map(function(x){const v=value(x),l=label(x);return '<option value="'+escapeHTML(v)+'" '+(v===selected?'selected':'')+'>'+escapeHTML(l)+'</option>';}).join('');
}
function openSupplyDialog(action,partId){
  const dialog=document.getElementById('supplyDialog'),fields=document.getElementById('supplyFields');
  const title=document.getElementById('supplyDialogTitle'),submit=document.getElementById('supplySubmit');
  document.getElementById('supplyAction').value=action;
  const parts=optionList(state.parts,function(p){return p.code+' · '+p.name;},function(p){return p.id;},partId);
  const suppliers='<option value="">Not specified</option>'+optionList(state.suppliers,function(s){return s.name;},function(s){return s.id;});
  if(action==='part'){
    title.textContent='Create part';submit.textContent='Create part';fields.innerHTML='<label>Part code<input name="code" required placeholder="Example: BRG-6205"></label><label>Part name<input name="name" required placeholder="Bearing 6205-2RS"></label><label>Category<input name="category" required placeholder="Bearing, filter, lubricant…"></label><label>Preferred supplier<select name="supplierId">'+suppliers+'</select></label><label>Unit cost (GHS)<input name="unitCost" type="number" min="0" step=".01" required value="0"></label><label>Store / bin<input name="location" required value="Main Store / Unassigned"></label><label>Opening stock<input name="onHand" type="number" min="0" required value="0"></label><label>Minimum stock<input name="min" type="number" min="0" required value="0"></label><label>Maximum stock<input name="max" type="number" min="0" required value="0"></label>';
  }else if(action==='receive'){
    title.textContent='Receive stock';submit.textContent='Post receipt';fields.innerHTML='<label class="span-2">Part<select name="partId" required>'+parts+'</select></label><label>Quantity received<input name="quantity" type="number" min="1" step="1" required value="1"></label><label>Store / bin<input name="location" required value="Main Store"></label><label>Supplier<select name="supplierId">'+suppliers+'</select></label><label>Delivery reference<input name="reference" placeholder="Delivery note or invoice"></label>';
  }else if(action==='count'){
    title.textContent='Post cycle count';submit.textContent='Post count';fields.innerHTML='<label class="span-2">Part<select name="partId" id="countPart" required>'+parts+'</select></label><label>Store / bin<input name="location" id="countLocation" required></label><label>Counted quantity<input name="counted" type="number" min="0" step="1" required></label><label class="span-2">Count note<input name="note" placeholder="Reason for variance or condition found"></label>';
    setTimeout(function(){syncCountLocation();},0);
  }else if(action==='po'){
    title.textContent='Create purchase order';submit.textContent='Create draft PO';fields.innerHTML='<label>Supplier<select name="supplierId" required>'+suppliers.replace('<option value="">Not specified</option>','')+'</select></label><label>Part<select name="partId" id="poPart" required>'+parts+'</select></label><label>Quantity<input name="quantity" type="number" min="1" step="1" required value="1"></label><label>Unit cost (GHS)<input name="unitCost" id="poUnitCost" type="number" min="0" step=".01" required></label><label>Expected date<input name="expectedDate" type="date" required value="'+day(7)+'"></label><div class="form-note">Draft → Approved → Ordered → Received. Receiving posts stock automatically.</div>';
    setTimeout(function(){syncPOCost();},0);
  }else{
    title.textContent='Create supplier';submit.textContent='Create supplier';fields.innerHTML='<label class="span-2">Supplier name<input name="name" required></label><label>Contact person<input name="contact"></label><label>Phone<input name="phone"></label><label class="span-2">Email<input name="email" type="email"></label>';
  }
  dialog.showModal();
}
function syncCountLocation(){
  const select=document.getElementById('countPart'),input=document.getElementById('countLocation');if(!select||!input)return;
  const p=part(select.value);input.value=p&&p.locations[0]?p.locations[0].name:'';
}
function syncPOCost(){
  const select=document.getElementById('poPart'),input=document.getElementById('poUnitCost');if(!select||!input)return;
  const p=part(select.value);input.value=p?Number(p.unitCost||0).toFixed(2):'0.00';
}
function receivePurchaseOrder(po){
  const p=part(po.partId);if(!p)return;
  const loc=p.locations[0]||{name:'Main Store / Unassigned',onHand:0,min:0,max:0};if(!p.locations.length)p.locations.push(loc);
  loc.onHand=Number(loc.onHand||0)+Number(po.quantity);po.status='Received';po.receivedAt=new Date().toISOString();
  const id=nextRecordId('REC',state.receipts,100);
  state.receipts.unshift({id:id,partId:po.partId,supplierId:po.supplierId,quantity:Number(po.quantity),location:loc.name,reference:po.id,receivedAt:po.receivedAt,receivedBy:CURRENT_USER});
  p.transactions.unshift({at:po.receivedAt,type:'Receipt',qty:Number(po.quantity),location:loc.name,reference:po.id});
  addAudit('Purchase order received','Purchase order',po.id,po.quantity+' × '+p.code+' received into '+loc.name);
}

function handleSupplySubmit(e){
  e.preventDefault();const f=new FormData(e.currentTarget),action=f.get('action'),now=new Date().toISOString();let message='Supply record saved';
  if(action==='part'){
    const code=String(f.get('code')).trim().toUpperCase();if(state.parts.some(function(p){return p.code.toUpperCase()===code;})){toast('That part code already exists');return;}
    const id=nextRecordId('PRT',state.parts,0);state.parts.push({id:id,code:code,name:String(f.get('name')).trim(),category:String(f.get('category')).trim(),supplierId:f.get('supplierId')||null,unitCost:Number(f.get('unitCost')),locations:[{name:String(f.get('location')).trim(),onHand:Number(f.get('onHand')),min:Number(f.get('min')),max:Number(f.get('max'))}],transactions:[]});addAudit('Part created','Part',id,code+' · '+String(f.get('name')).trim());message=id+' created';
  }else if(action==='receive'){
    const p=part(f.get('partId')),qty=Number(f.get('quantity')),location=String(f.get('location')).trim();if(!p||qty<=0)return;
    let loc=p.locations.find(function(x){return x.name===location;});if(!loc){loc={name:location,onHand:0,min:0,max:0};p.locations.push(loc);}loc.onHand=Number(loc.onHand||0)+qty;
    const id=nextRecordId('REC',state.receipts,100);state.receipts.unshift({id:id,partId:p.id,supplierId:f.get('supplierId')||null,quantity:qty,location:location,reference:String(f.get('reference')||'').trim(),receivedAt:now,receivedBy:CURRENT_USER});p.transactions.unshift({at:now,type:'Receipt',qty:qty,location:location,reference:String(f.get('reference')||'').trim()});addAudit('Stock received','Receipt',id,qty+' × '+p.code+' into '+location);message=id+' posted · '+qty+' received';
  }else if(action==='count'){
    const p=part(f.get('partId')),location=String(f.get('location')).trim(),counted=Number(f.get('counted'));if(!p||counted<0)return;
    let loc=p.locations.find(function(x){return x.name===location;});if(!loc){loc={name:location,onHand:0,min:0,max:0};p.locations.push(loc);}const expected=Number(loc.onHand||0),variance=counted-expected;loc.onHand=counted;
    const id=nextRecordId('CNT',state.cycleCounts,30);state.cycleCounts.unshift({id:id,partId:p.id,location:location,expected:expected,counted:counted,variance:variance,countedAt:now,countedBy:CURRENT_USER,note:String(f.get('note')||'').trim(),status:'Posted'});p.transactions.unshift({at:now,type:'Cycle count',qty:variance,location:location,reference:id});addAudit('Cycle count posted','Cycle count',id,p.code+' expected '+expected+', counted '+counted+', variance '+variance);
    const stockRecipients=state.users.filter(function(u){return u.active&&(u.role==='Operations manager'||u.role==='Maintenance planner');}).map(function(u){return u.id;});
    if(variance!==0)notifyUsers(stockRecipients,'Stock variance: '+p.code,p.name+' at '+location+' counted '+counted+' versus '+expected+' expected (variance '+(variance>0?'+':'')+variance+').','Warning','Cycle count',id,true);
    if(totalStock(p)<=minStock(p))notifyUsers(stockRecipients,'Low stock: '+p.code,p.name+' now has '+totalStock(p)+' on hand against a minimum of '+minStock(p)+'.','Critical','Part',p.id,true);
    message=id+' posted · variance '+(variance>0?'+':'')+variance;
  }else if(action==='po'){
    const id=nextRecordId('PO',state.purchaseOrders,2024);state.purchaseOrders.unshift({id:id,supplierId:f.get('supplierId'),partId:f.get('partId'),quantity:Number(f.get('quantity')),unitCost:Number(f.get('unitCost')),expectedDate:f.get('expectedDate'),status:'Draft',createdAt:now});addAudit('Purchase order created','Purchase order',id,Number(f.get('quantity'))+' × '+partName(f.get('partId')));message=id+' created as draft';
  }else{
    const id=nextRecordId('SUP',state.suppliers,0);state.suppliers.push({id:id,name:String(f.get('name')).trim(),contact:String(f.get('contact')||'').trim(),phone:String(f.get('phone')||'').trim(),email:String(f.get('email')||'').trim(),status:'Active'});addAudit('Supplier created','Supplier',id,String(f.get('name')).trim());message=id+' supplier created';
  }
  save(message);e.currentTarget.reset();document.getElementById('supplyDialog').close();render();toast(message);
}

function bindPageActions(){
  document.querySelectorAll('[data-select-wo]').forEach(function(box){
    box.addEventListener('click',function(e){e.stopPropagation();});
    box.addEventListener('change',function(){if(box.checked)selectedWorkIds.add(box.dataset.selectWo);else selectedWorkIds.delete(box.dataset.selectWo);render();});
  });
  const selectAll=document.querySelector('[data-select-all-wo]');
  if(selectAll)selectAll.addEventListener('change',function(){
    const visible=Array.from(document.querySelectorAll('[data-select-wo]')).map(function(x){return x.dataset.selectWo;});
    if(selectAll.checked)visible.forEach(function(id){selectedWorkIds.add(id);});else visible.forEach(function(id){selectedWorkIds.delete(id);});
    render();
  });
  document.querySelectorAll('[data-sort-work]').forEach(function(b){b.addEventListener('click',function(){const key=b.dataset.sortWork;if(sortKey===key)sortDir=sortDir==='asc'?'desc':'asc';else{sortKey=key;sortDir='asc';}render();});});
  document.querySelectorAll('[data-bulk-action]').forEach(function(b){b.addEventListener('click',function(){bulkUpdateWork(b.dataset.bulkAction);});});
  document.querySelectorAll('[data-print-work]').forEach(function(b){b.addEventListener('click',function(){window.print();});});
  document.querySelectorAll('[data-supply-action]').forEach(function(b){b.addEventListener('click',function(){openSupplyDialog(b.dataset.supplyAction,b.dataset.partId||null);});});
  document.querySelectorAll('[data-po-action]').forEach(function(b){b.addEventListener('click',function(){
    const po=state.purchaseOrders.find(function(x){return x.id===b.dataset.poAction;});if(!po)return;
    if(po.status==='Draft')po.status='Approved';else if(po.status==='Approved')po.status='Ordered';else if(po.status==='Ordered')receivePurchaseOrder(po);
    addAudit('Purchase order '+po.status.toLowerCase(),'Purchase order',po.id,partName(po.partId));save('Updated '+po.id+' to '+po.status);render();toast(po.id+' is now '+po.status.toLowerCase());
  });});
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
  document.querySelectorAll('[data-new-asset]').forEach(function(b){b.addEventListener('click',function(){openAssetDialog();});});
  document.querySelectorAll('[data-edit-asset]').forEach(function(b){b.addEventListener('click',function(){openAssetDialog(b.dataset.editAsset);});});
  document.querySelectorAll('[data-toggle-asset-state]').forEach(function(b){b.addEventListener('click',function(){openAssetStateDialog(b.dataset.toggleAssetState);});});
  document.querySelectorAll('[data-compose-message]').forEach(function(b){b.addEventListener('click',function(){document.getElementById('messageForm').reset();document.getElementById('messageDialog').showModal();});});
  document.querySelectorAll('[data-mark-notification]').forEach(function(b){b.addEventListener('click',function(){const n=state.notifications.find(function(x){return x.id===b.dataset.markNotification;});if(n){n.read=!n.read;save('Updated notification');render();}});});
  document.querySelectorAll('[data-mark-all-read]').forEach(function(b){b.addEventListener('click',function(){state.notifications.filter(function(n){return n.userId===CURRENT_USER;}).forEach(function(n){n.read=true;});save('Marked notifications read');render();});});
  document.querySelectorAll('[data-user-role]').forEach(function(el){el.addEventListener('change',function(){const u=user(el.dataset.userRole);if(!u)return;const old=u.role;u.role=el.value;addAudit('User role changed','User',u.id,old+' → '+u.role);save('Changed '+u.name+' role');render();toast(u.name+' is now '+u.role);});});
  document.querySelectorAll('[data-user-active]').forEach(function(b){b.addEventListener('click',function(){const u=user(b.dataset.userActive);if(!u)return;u.active=!u.active;addAudit(u.active?'User activated':'User deactivated','User',u.id,u.email);save('Changed '+u.name+' access');render();toast(u.name+' is '+(u.active?'active':'inactive'));});});
  document.querySelectorAll('[data-email-alert]').forEach(function(el){el.addEventListener('change',function(){const u=user(el.dataset.emailAlert);if(!u)return;u.emailAlerts=el.checked;addAudit('Email preference changed','User',u.id,u.emailAlerts?'Enabled':'Disabled');save('Changed email preference');render();});});
  document.querySelectorAll('[data-add-meter]').forEach(function(b){b.addEventListener('click',function(){openMeterDialog(b.dataset.addMeter||null,null);});});
  const am=document.getElementById('assetMeterButton');if(am)am.addEventListener('click',function(){const m=state.meters.find(function(x){return x.assetId===selectedAssetId;});openMeterDialog(m?m.id:null,null);});
  const securityForm=document.getElementById('securityForm');if(securityForm)securityForm.addEventListener('submit',function(e){e.preventDefault();const f=new FormData(e.currentTarget);state.securitySettings={sessionTimeout:Number(f.get('sessionTimeout')),lockAfterAttempts:Number(f.get('lockAfterAttempts')),auditRetentionDays:Number(f.get('auditRetentionDays')),requireMfaForManagers:!!f.get('requireMfaForManagers')};addAudit('Security policy updated','Security','POLICY','Session '+state.securitySettings.sessionTimeout+' min · lock '+state.securitySettings.lockAfterAttempts+' attempts');save('Updated security policy');render();toast('Security policy saved');});
}

function setupGlobalEvents(){
  document.querySelectorAll('.mode-btn').forEach(function(b){b.addEventListener('click',function(){workspaceMode=b.dataset.mode;localStorage.setItem('safimaint-workspace-mode',workspaceMode);render();toast(workspaceMode==='planner'?'Planner console enabled':'Field view enabled');});});
  document.querySelectorAll('.nav-link[data-route]').forEach(function(b){b.addEventListener('click',function(){navigate(b.dataset.route);closeMobileMenu();});});
  document.getElementById('suppliesToggle').addEventListener('click',function(){setSuppliesOpen(this.getAttribute('aria-expanded')!=='true');});
  document.getElementById('newWorkButton').addEventListener('click',function(){openWorkDialog();});
  document.getElementById('searchButton').addEventListener('click',function(){document.getElementById('searchDialog').showModal();setTimeout(function(){document.getElementById('globalSearchInput').focus();},0);});
  document.getElementById('notificationButton').addEventListener('click',function(){navigate('notifications');});
  document.getElementById('globalSearchInput').addEventListener('input',renderSearchResults);
  document.getElementById('scanButton').addEventListener('click',function(){document.getElementById('scanCode').value='';document.getElementById('scanDialog').showModal();});
  document.getElementById('openTagButton').addEventListener('click',function(){openTag(document.getElementById('scanCode').value);});
  document.getElementById('cameraScanButton').addEventListener('click',startCameraScanner);
  document.getElementById('syncButton').addEventListener('click',function(){toast('Server sync is not connected yet — '+state.syncQueue.length+' local change'+(state.syncQueue.length===1?'':'s')+' remain safe on this device');});
  document.getElementById('menuButton').addEventListener('click',openMobileMenu);
  document.getElementById('mobileScrim').addEventListener('click',closeMobileMenu);
  document.querySelectorAll('[data-close-dialog]').forEach(function(b){b.addEventListener('click',function(){const d=document.getElementById(b.dataset.closeDialog);if(d.id==='scanDialog')stopScanner();d.close();});});
  document.getElementById('scanDialog').addEventListener('close',stopScanner);
  document.getElementById('supplyForm').addEventListener('submit',handleSupplySubmit);
  document.getElementById('assetForm').addEventListener('submit',handleAssetSubmit);
  document.getElementById('assetStateForm').addEventListener('submit',handleAssetStateSubmit);
  document.getElementById('messageForm').addEventListener('submit',function(e){e.preventDefault();const f=new FormData(e.currentTarget),audience=f.get('audience');let recipients=state.users.filter(function(u){if(!u.active)return false;if(audience==='All users')return true;if(audience==='Technician')return u.role.includes('technician');return u.role===audience;});notifyUsers(recipients.map(function(u){return u.id;}),String(f.get('subject')).trim(),String(f.get('message')).trim(),f.get('severity'),'Announcement','',!!f.get('emailCopy'));addAudit('Announcement sent','Communication','ANN-'+Date.now(),String(f.get('subject')).trim()+' · '+recipients.length+' recipients');save('Sent announcement');e.currentTarget.reset();document.getElementById('messageDialog').close();render();toast('Announcement sent to '+recipients.length+' people');});
  document.getElementById('supplyFields').addEventListener('change',function(e){if(e.target.id==='countPart')syncCountLocation();if(e.target.id==='poPart')syncPOCost();});

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
    const insp=e.target.closest('[data-inspection-result]');if(insp){const ref=insp.dataset.inspectionResult.split('|'),w=work(ref[0]),t=w.tasks.find(function(x){return x.id===ref[1];});t.result=ref[2];t.status='Done';logWork(w,'Inspection "'+t.text+'" recorded '+ref[2]);const follow=(ref[2]==='Fail'&&t.autoCorrective)?createFollowOnFromTask(w,t):null;save('Completed inspection task');updateBadges();openWorkDrawer(w.id,'tasks');toast(follow?'Inspection failed — '+follow+' created':'Inspection result saved');return;}
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
    if(ref[0]==='supplier')navigate('suppliers');
    if(ref[0]==='po')navigate('purchase-orders');
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
