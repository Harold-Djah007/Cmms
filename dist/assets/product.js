const STORAGE_KEY = 'safimaint-fiix-v1';
const LEGACY_KEY = 'safimaint-product-v4';
const CURRENT_USER = 'U-1';
const WO_STATUSES = ['Open','On Hold','In Progress','Completed','Closed'];
const MAINT_TYPES = ['Preventive','Corrective','Inspection','Emergency','General'];
const PRIORITIES = ['Critical','High','Medium','Low'];

function day(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const seed = {
  users: [
    { id:'U-1', name:'Abena Sarpong', role:'Operations manager', group:'Managers', email:'abena.sarpong@safisana.org', hourlyRate:95, active:true, emailAlerts:true, mfa:true, lastActive:new Date().toISOString(), certifications:[{name:'Plant operations',expiry:day(180)}] },
    { id:'U-2', name:'Kwame Mensah', role:'Mechanical technician', group:'Technicians', email:'kwame.mensah@safisana.org', hourlyRate:48, active:true, emailAlerts:true, mfa:false, lastActive:new Date(Date.now()-3600000).toISOString(), certifications:[{name:'Lockout / tagout',expiry:day(90)}] },
    { id:'U-3', name:'Simeon Sakyi', role:'Maintenance planner', group:'Planners', email:'simeon.sakyi@safisana.org', hourlyRate:72, active:true, emailAlerts:true, mfa:true, lastActive:new Date(Date.now()-7200000).toISOString(), certifications:[] },
    { id:'U-4', name:'Ama Owusu', role:'Electrical technician', group:'Technicians', email:'ama.owusu@safisana.org', hourlyRate:50, active:true, emailAlerts:true, mfa:false, lastActive:new Date(Date.now()-86400000).toISOString(), certifications:[{name:'LV electrical',expiry:day(40)}] }
  ],
  lookups:{
    downtimeReasons:['Breakdown','Inspection','Planned outage','Safety isolation','Waiting for parts','Other'],
    problems:['Leak','Abnormal vibration','Overheating','No output','Worn component','Failed inspection'],
    causes:['Normal wear','Lack of lubrication','Misalignment','Operator error','Blocked line','Unknown'],
    actions:['Replace','Adjust','Clean','Lubricate','Rebuild','Monitor']
  },
  projects:[{id:'PRJ-1',name:'Q3 reliability campaign'}],
  taskGroups:[
    {id:'TG-1',name:'Pump isolation SOP',tasks:[{type:'General',text:'Apply isolation and verify zero energy',estimateHours:0.25},{type:'Inspection',text:'Inspect mechanical seal for leakage',autoCorrective:true,estimateHours:0.25}]}
  ],
  assets: [
    { id:'REG-WA', code:'WA', name:'West Africa', type:'Region', parentId:null, status:'Healthy', operatingState:'Online', criticality:'A', location:'Regional operations' },
    { id:'SITE-1', code:'SSGL', name:'Safisana Ghana Ltd', type:'Site', parentId:'REG-WA', status:'Healthy', operatingState:'Online', criticality:'A', location:'Ashaiman' },
    { id:'FAC-OPS', code:'OPS', name:'Operations', type:'Facility', parentId:'SITE-1', status:'Healthy', operatingState:'Online', criticality:'A', location:'Main plant' },
    { id:'FAC-LAB', code:'A177', name:'Laboratory', type:'Facility', parentId:'SITE-1', status:'Healthy', operatingState:'Online', criticality:'B', location:'Main plant' },
    { id:'FAC-MIX', code:'MP', name:'Mix Pit', type:'Facility', parentId:'FAC-OPS', status:'Attention', operatingState:'Online', criticality:'A', location:'Process area' },
    { id:'P-201', code:'P-201', name:'Digester Feed Pump 02', type:'Equipment', parentId:'FAC-MIX', status:'Down', operatingState:'Offline', criticality:'A', location:'Digester feed line', manufacturer:'Grundfos', model:'CR 32-4', serial:'GF-88214', commissioned:'2021-06-11', bom:['PRT-1','PRT-2'], vendorId:'SUP-2', responsibleUserIds:['U-2'], warranties:[{provider:'Grundfos Ghana',expiry:day(220),notes:'Mechanical seal and wet-end'}] },
    { id:'MIX-03', code:'MX-03', name:'Digester Mixer 03', type:'Equipment', parentId:'FAC-OPS', status:'Healthy', operatingState:'Online', criticality:'A', location:'Digester 3', manufacturer:'SEW', model:'X3KR', serial:'SEW-33091', commissioned:'2022-01-19', bom:['PRT-3'], vendorId:'SUP-1', responsibleUserIds:['U-2'], warranties:[] },
    { id:'CHP-01', code:'CHP-01', name:'CHP Unit 01', type:'Equipment', parentId:'FAC-OPS', status:'Healthy', operatingState:'Online', criticality:'A', location:'Power house', manufacturer:'2G', model:'agenitor 408', serial:'2G-49811', commissioned:'2020-09-04', bom:['PRT-4','PRT-5'], vendorId:'SUP-3', responsibleUserIds:['U-4'], warranties:[{provider:'PowerCare Engineering',expiry:day(-20),notes:'Engine warranty expired - review replacement'}] },
    { id:'WS-01', code:'A170', name:'Tahmo Weather Station', type:'Equipment', parentId:'FAC-OPS', status:'Healthy', operatingState:'Online', criticality:'C', location:'Operations roof', manufacturer:'Tahmo', model:'AWS', serial:'TH-7731', commissioned:'2023-02-13', bom:[], responsibleUserIds:['U-3'], warranties:[] },
    { id:'TOOL-01', code:'A150', name:'Compost Thermometer #1', type:'Tool', parentId:'FAC-OPS', status:'Healthy', operatingState:'Online', criticality:'C', location:'Operations store', manufacturer:'REOTEMP', model:'48in', serial:'CT-150', commissioned:'2023-05-20', bom:[], cribStatus:'In crib', cribWorkOrderId:null, responsibleUserIds:[] },
    { id:'DEW-01', code:'DW-01', name:'Sludge Dewatering Press', type:'Equipment', parentId:'FAC-OPS', status:'Attention', operatingState:'Online', criticality:'A', location:'Dewatering bay', manufacturer:'Huber', model:'Q-PRESS', serial:'HQP-1208', commissioned:'2021-11-02', bom:['PRT-6'], vendorId:'SUP-1', responsibleUserIds:['U-2'], warranties:[] }
  ],
  meters: [
    { id:'MTR-1', assetId:'P-201', name:'Run hours', unit:'h', current:1240, readings:[{value:1210,date:day(-16)},{value:1240,date:day(-2)}] },
    { id:'MTR-2', assetId:'CHP-01', name:'Run hours', unit:'h', current:9850, readings:[{value:9725,date:day(-12)},{value:9850,date:day(-1)}] },
    { id:'MTR-3', assetId:'DEW-01', name:'Operating hours', unit:'h', current:3375, readings:[{value:3321,date:day(-15)},{value:3375,date:day(-3)}] },
    { id:'MTR-4', assetId:'WS-01', name:'Service count', unit:'cycles', current:42, readings:[{value:41,date:day(-30)},{value:42,date:day(-1)}] }
  ],
  parts: [
    { id:'PRT-1', code:'BRG-6205', name:'Bearing 6205-2RS', category:'Bearing', make:'SKF', model:'6205-2RS', unitCost:88, preferredVendorId:'SUP-1', reorderQty:8, autoReorder:true, locations:[{name:'Main Store / Bin 08',onHand:8,min:4,max:16}], fifoLots:[{qty:8,unitCost:88,receivedAt:new Date(Date.now()-86400000*40).toISOString()}], transactions:[] },
    { id:'PRT-2', code:'MS-40-SS', name:'Pump mechanical seal', category:'Seal', make:'AESSEAL', model:'MS-40', unitCost:320, preferredVendorId:'SUP-2', reorderQty:4, autoReorder:true, locations:[{name:'Main Store / Bin 12',onHand:2,min:2,max:8}], fifoLots:[{qty:2,unitCost:320,receivedAt:new Date(Date.now()-86400000*5).toISOString()}], transactions:[] },
    { id:'PRT-3', code:'OIL-EP220', name:'Gear oil EP 220', category:'Lubricant', make:'Shell', model:'Omala 220', unitCost:46, preferredVendorId:'SUP-1', reorderQty:12, autoReorder:true, locations:[{name:'Main Store / Bay 2',onHand:18,min:8,max:30}], fifoLots:[{qty:18,unitCost:46,receivedAt:new Date(Date.now()-86400000*20).toISOString()}], transactions:[] },
    { id:'PRT-4', code:'FLT-G4-20', name:'CHP cabinet filter mat', category:'Filter', make:'2G', model:'G4-20', unitCost:27, preferredVendorId:'SUP-3', reorderQty:8, autoReorder:true, locations:[{name:'CHP Store / Shelf 5',onHand:3,min:5,max:12}], fifoLots:[{qty:3,unitCost:27,receivedAt:new Date(Date.now()-86400000*12).toISOString()}], transactions:[] },
    { id:'PRT-5', code:'SPK-2G-408', name:'CHP spark plug', category:'Engine', make:'2G', model:'408', unitCost:112, preferredVendorId:'SUP-3', reorderQty:8, autoReorder:true, locations:[{name:'CHP Store / Bin 2',onHand:6,min:6,max:18}], fifoLots:[{qty:6,unitCost:112,receivedAt:new Date(Date.now()-86400000*30).toISOString()}], transactions:[] },
    { id:'PRT-6', code:'BLT-B72', name:'Drive belt B-72', category:'Drive', make:'Gates', model:'B-72', unitCost:95, preferredVendorId:'SUP-1', reorderQty:6, autoReorder:true, locations:[{name:'Main Store / Rack 3',onHand:1,min:3,max:10}], fifoLots:[{qty:1,unitCost:95,receivedAt:new Date(Date.now()-86400000*60).toISOString()}], transactions:[] }
  ],
  suppliers: [
    { id:'SUP-1', name:'Ghana Industrial Supplies', contact:'Nana Boateng', phone:'+233 24 555 0184', email:'orders@gis.example', status:'Active', preferred:true },
    { id:'SUP-2', name:'PumpTech Ghana', contact:'Esi Amankwah', phone:'+233 30 255 0412', email:'service@pumptech.example', status:'Active', preferred:true },
    { id:'SUP-3', name:'PowerCare Engineering', contact:'Yaw Asante', phone:'+233 20 555 0971', email:'parts@powercare.example', status:'Active', preferred:true }
  ],
  receipts: [
    { id:'REC-103', partId:'PRT-2', supplierId:'SUP-2', quantity:2, location:'Main Store / Bin 12', reference:'DN-4481', receivedAt:new Date(Date.now()-86400000*5).toISOString(), receivedBy:'U-1' },
    { id:'REC-102', partId:'PRT-4', supplierId:'SUP-3', quantity:4, location:'CHP Store / Shelf 5', reference:'PO-2025', receivedAt:new Date(Date.now()-86400000*12).toISOString(), receivedBy:'U-3' }
  ],
  cycleCounts: [
    { id:'CNT-31', partId:'PRT-6', location:'Main Store / Rack 3', expected:2, counted:1, variance:-1, countedAt:new Date(Date.now()-86400000*2).toISOString(), countedBy:'U-1', note:'One damaged belt removed', status:'Posted' }
  ],
  purchaseOrders: [
    { id:'PO-2026', supplierId:'SUP-3', partId:'PRT-4', quantity:8, unitCost:27, expectedDate:day(6), status:'Ordered', workOrderId:'', createdAt:new Date(Date.now()-86400000*3).toISOString() },
    { id:'PO-2025', supplierId:'SUP-3', partId:'PRT-4', quantity:4, unitCost:27, expectedDate:day(-12), status:'Received', workOrderId:'', createdAt:new Date(Date.now()-86400000*18).toISOString(), receivedAt:new Date(Date.now()-86400000*12).toISOString() }
  ],
  rfqs: [
    { id:'RFQ-12', vendorId:'SUP-1', partId:'PRT-6', quantity:6, status:'Sent', createdAt:new Date(Date.now()-86400000).toISOString(), notes:'Auto-suggested after belt stock fell below minimum' }
  ],
  purchaseRequests: [
    { id:'PR-1', partId:'PRT-4', quantity:8, vendorId:'SUP-3', reason:'Below minimum after work-order consumption', status:'Open', createdAt:new Date(Date.now()-86400000*2).toISOString(), workOrderId:'' },
    { id:'PR-2', partId:'PRT-6', quantity:6, vendorId:'SUP-1', reason:'Cycle count variance left stock below min', status:'Open', createdAt:new Date(Date.now()-86400000*2).toISOString(), workOrderId:'' }
  ],
  workOrders: [
    {
      id:'WO-2407', title:'Clean mix pit and inspect feed pump', assetId:'P-201', secondaryAssetId:'FAC-MIX', type:'Preventive', priority:'High', status:'Open', assigneeId:'U-2',
      suggestedStart:day(-2), due:day(-1), estimateHours:2, actualMinutes:0, source:'PM-101', sourcePmId:'PM-101', projectId:'PRJ-1',
      instructions:'Isolate the feed pump. Clean the mix pit screen, inspect coupling and seal, then verify vibration before returning the pump to service.',
      tasks:[
        {id:'T-1',type:'General',text:'Apply isolation and verify zero energy',status:'Todo',estimateHours:0.25,hoursSpent:0,notes:''},
        {id:'T-2',type:'Inspection',text:'Inspect mechanical seal for leakage',status:'Todo',result:null,autoCorrective:true,estimateHours:0.25,hoursSpent:0,notes:''},
        {id:'T-3',type:'Meter',text:'Record pump run hours',status:'Todo',meterId:'MTR-1',estimateHours:0.1,hoursSpent:0,notes:''},
        {id:'T-4',type:'General',text:'Clean suction screen and work area',status:'Todo',estimateHours:0.5,hoursSpent:0,notes:''}
      ],
      parts:[{partId:'PRT-2',planned:1,actual:0},{partId:'PRT-1',planned:1,actual:0}],
      laborEntries:[], miscCosts:[], files:[], failureCodes:{problem:'',cause:'',action:''}, completionNotes:'',
      createdAt:new Date(Date.now()-86400000*4).toISOString(), completedAt:null,
      log:[{at:new Date(Date.now()-86400000*4).toISOString(),text:'Work order generated from scheduled maintenance PM-101'},{at:new Date(Date.now()-86400000*2).toISOString(),text:'Assigned to Kwame Mensah'}]
    },
    {
      id:'WO-2406', title:'EPA monthly reporting', assetId:'FAC-OPS', type:'Preventive', priority:'High', status:'Open', assigneeId:'U-3',
      suggestedStart:day(0), due:day(0), estimateHours:1.5, actualMinutes:0, source:'PM-104', sourcePmId:'PM-104',
      instructions:'Compile monthly operating and compliance readings and submit the maintenance section.',
      tasks:[{id:'T-5',type:'General',text:'Verify operating log completeness',status:'Todo',estimateHours:0.5,hoursSpent:0},{id:'T-6',type:'General',text:'Compile maintenance actions for report',status:'Todo',estimateHours:1,hoursSpent:0}],
      parts:[], laborEntries:[], miscCosts:[], files:[], failureCodes:{problem:'',cause:'',action:''}, completionNotes:'',
      createdAt:new Date(Date.now()-86400000*3).toISOString(), completedAt:null, log:[]
    },
    {
      id:'WO-2405', title:'Monthly cleaning of weather station', assetId:'WS-01', type:'Preventive', priority:'Medium', status:'In Progress', assigneeId:'U-3',
      suggestedStart:day(1), due:day(3), estimateHours:1, actualMinutes:30, source:'PM-103', sourcePmId:'PM-103',
      instructions:'Clean sensor surfaces and confirm mast, power and telemetry condition.',
      tasks:[{id:'T-7',type:'General',text:'Clean rain gauge and radiation shield',status:'Done',estimateHours:0.4,hoursSpent:0.5},{id:'T-8',type:'Inspection',text:'Inspect mast and mounting hardware',status:'Todo',result:null,estimateHours:0.3,hoursSpent:0}],
      parts:[], laborEntries:[{userId:'U-3',minutes:30,rate:72,at:new Date(Date.now()-3600000*3).toISOString(),notes:'Started cleaning'}],
      miscCosts:[], files:[], failureCodes:{problem:'',cause:'',action:''}, completionNotes:'',
      createdAt:new Date(Date.now()-86400000*7).toISOString(), completedAt:null,
      log:[{at:new Date(Date.now()-3600000*3).toISOString(),text:'30 min labor logged by Simeon Sakyi'}]
    },
    {
      id:'WO-2404', title:'Low gas pressure at CHP regulator', assetId:'CHP-01', type:'Corrective', priority:'Medium', status:'Open', assigneeId:'U-4',
      suggestedStart:day(1), due:day(2), estimateHours:2, actualMinutes:0, source:'Request',
      instructions:'Check regulator inlet pressure, filter condition and downstream leaks.',
      tasks:[{id:'T-9',type:'Inspection',text:'Leak test gas train',status:'Todo',result:null,autoCorrective:true,estimateHours:0.5,hoursSpent:0},{id:'T-10',type:'General',text:'Verify regulator setpoint',status:'Todo',estimateHours:0.5,hoursSpent:0}],
      parts:[{partId:'PRT-4',planned:1,actual:0}], laborEntries:[], miscCosts:[], files:[], failureCodes:{problem:'',cause:'',action:''}, completionNotes:'',
      createdAt:new Date(Date.now()-86400000).toISOString(), completedAt:null, log:[]
    },
    {
      id:'WO-2403', title:'Dewatering press belt tracking emergency', assetId:'DEW-01', type:'Emergency', priority:'Critical', status:'On Hold', assigneeId:'U-2',
      suggestedStart:day(0), due:day(0), estimateHours:3, actualMinutes:0, source:'REQ-81',
      instructions:'Belt is tracking left. Isolate, inspect rollers and belt, replace if required. Waiting on drive belt stock.',
      tasks:[{id:'T-12',type:'Inspection',text:'Confirm belt tracking defect',status:'Done',result:'Fail',autoCorrective:false,estimateHours:0.25,hoursSpent:0.3},{id:'T-13',type:'General',text:'Replace drive belt and verify tracking',status:'Todo',estimateHours:1.5,hoursSpent:0}],
      parts:[{partId:'PRT-6',planned:1,actual:0}], laborEntries:[], miscCosts:[{description:'Contractor call-out standby',amount:250}], files:[], failureCodes:{problem:'Worn component',cause:'Normal wear',action:''}, completionNotes:'',
      createdAt:new Date(Date.now()-3600000*4).toISOString(), completedAt:null, log:[{at:new Date(Date.now()-3600000*3).toISOString(),text:'Placed on hold — waiting for parts'}]
    },
    {
      id:'WO-2398', title:'Lubricate mixer bearings', assetId:'MIX-03', type:'Preventive', priority:'Medium', status:'Completed', assigneeId:'U-2',
      suggestedStart:day(-8), due:day(-8), estimateHours:1, actualMinutes:55, source:'PM-102', sourcePmId:'PM-102',
      instructions:'Lubricate mixer bearings and inspect gearbox for leakage.',
      tasks:[{id:'T-11',type:'General',text:'Lubricate upper and lower bearing points',status:'Done',estimateHours:1,hoursSpent:0.9}],
      parts:[{partId:'PRT-3',planned:1,actual:1}], laborEntries:[{userId:'U-2',minutes:55,rate:48,at:new Date(Date.now()-86400000*8).toISOString(),notes:''}],
      miscCosts:[], files:[], failureCodes:{problem:'',cause:'',action:'Lubricate'}, completionNotes:'Completed by Kwame Mensah. Gearbox dry, bearings packed.',
      createdAt:new Date(Date.now()-86400000*12).toISOString(), completedAt:new Date(Date.now()-86400000*8).toISOString(),
      log:[{at:new Date(Date.now()-86400000*8).toISOString(),text:'Work order completed by Kwame Mensah'}]
    }
  ],
  pm: [
    { id:'PM-101', name:'Feed pump nested service', assetId:'P-201', status:'Running', mode:'fixed', skipIfOpen:true, dueLead:2, iteration:3,
      trigger:{type:'time',intervalDays:7,nextDue:day(18)},
      nested:[{id:'N1',name:'Weekly care',multiplier:1},{id:'N2',name:'Monthly service',multiplier:4}],
      tasks:[{type:'General',text:'Apply isolation and verify zero energy',nestedId:'N1'},{type:'Inspection',text:'Inspect mechanical seal for leakage',autoCorrective:true,nestedId:'N1'},{type:'Meter',text:'Record pump run hours',meterId:'MTR-1',nestedId:'N1'},{type:'General',text:'Clean suction screen and work area',nestedId:'N2'}],
      parts:[{partId:'PRT-2',planned:1,nestedId:'N2'}], generatedWorkIds:['WO-2407'] },
    { id:'PM-102', name:'Mixer bearing service', assetId:'MIX-03', status:'Running', mode:'floating', skipIfOpen:true, dueLead:2, iteration:1,
      trigger:{type:'time',intervalDays:30,nextDue:day(22)}, nested:[],
      tasks:[{type:'General',text:'Lubricate bearing points'},{type:'Inspection',text:'Inspect gearbox for leakage'}],
      parts:[{partId:'PRT-3',planned:1}], generatedWorkIds:['WO-2398'] },
    { id:'PM-103', name:'Weather station monthly care', assetId:'WS-01', status:'Running', mode:'fixed', skipIfOpen:true, dueLead:1, iteration:1,
      trigger:{type:'time',intervalDays:30,nextDue:day(3)}, nested:[],
      tasks:[{type:'General',text:'Clean sensing surfaces'},{type:'Inspection',text:'Inspect mast and power condition'}],
      parts:[], generatedWorkIds:['WO-2405'] },
    { id:'PM-104', name:'CHP 10,000-hour service', assetId:'CHP-01', status:'Running', mode:'fixed', skipIfOpen:true, dueLead:3, iteration:0,
      trigger:{type:'meter',meterId:'MTR-2',intervalValue:500,nextThreshold:10000}, nested:[],
      tasks:[{type:'Inspection',text:'Inspect ignition and cooling systems'},{type:'Meter',text:'Record engine hours',meterId:'MTR-2'},{type:'General',text:'Replace scheduled service consumables'}],
      parts:[{partId:'PRT-4',planned:2},{partId:'PRT-5',planned:4}], generatedWorkIds:[] },
    { id:'PM-105', name:'Dewatering press breakdown response', assetId:'DEW-01', status:'Running', mode:'fixed', skipIfOpen:false, dueLead:0, iteration:0,
      trigger:{type:'event',eventType:'Breakdown'}, nested:[],
      tasks:[{type:'Inspection',text:'Diagnose breakdown cause',autoCorrective:true},{type:'General',text:'Restore asset to online condition'}],
      parts:[], generatedWorkIds:[] }
  ],
  requests: [
    { id:'REQ-81', assetId:'DEW-01', summary:'Belt is tracking toward the left side during operation', urgency:'Urgent', requester:'Kojo Arthur', createdAt:new Date(Date.now()-3600000*5).toISOString(), status:'Converted', workOrderId:'WO-2403' },
    { id:'REQ-80', assetId:'FAC-LAB', summary:'Air conditioner making intermittent rattling noise', urgency:'Normal', requester:'Laboratory', createdAt:new Date(Date.now()-86400000).toISOString(), status:'Requested' }
  ],
  assetEvents: [
    { id:'AE-1', assetId:'P-201', fromState:'Online', toState:'Offline', reasonCode:'Inspection', reason:'Seal inspection and mix pit cleaning in progress', expectedReturn:day(1)+'T16:00', at:new Date(Date.now()-86400000).toISOString(), userId:'U-1' }
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
  calendarCursor: day(0).slice(0,7),
  syncQueue:[]
};

let state = loadState();
let route = {name:'dashboard', id:null};
let woFilter = 'Active';
let woTypeFilter = 'All';
let selectedAssetId = 'P-201';
let assetTab = 'details';
let recordTab = 'summary';
let smTab = 'details';
let partTab = 'details';
let pendingMeterTask = null;
let scannerStream = null;
let selectedWorkIds = new Set();
let sortKey = 'due';
let sortDir = 'asc';

function clone(value){ return JSON.parse(JSON.stringify(value)); }
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    return migrate(raw ? JSON.parse(raw) : clone(seed));
  }catch(e){ return migrate(clone(seed)); }
}
function migrate(data){
  const arrays=['users','assets','meters','parts','suppliers','receipts','cycleCounts','purchaseOrders','rfqs','purchaseRequests','workOrders','pm','requests','assetEvents','notifications','mailOutbox','auditLog','projects','taskGroups','syncQueue'];
  arrays.forEach(function(key){ if(!Array.isArray(data[key])) data[key]=clone(seed[key]||[]); });
  if(!data.lookups) data.lookups=clone(seed.lookups);
  if(!data.securitySettings) data.securitySettings=clone(seed.securitySettings);
  data.users.forEach(function(u){
    if(u.active==null)u.active=true; if(u.emailAlerts==null)u.emailAlerts=true; if(u.mfa==null)u.mfa=false;
    if(!u.email)u.email=u.name.toLowerCase().replace(/\s+/g,'.')+'@safisana.org';
    if(!u.lastActive)u.lastActive=new Date().toISOString();
    if(u.hourlyRate==null)u.hourlyRate=45; if(!u.group)u.group='Technicians'; if(!u.certifications)u.certifications=[];
  });
  data.assets.forEach(function(a){
    if(!a.operatingState)a.operatingState=a.status==='Down'?'Offline':'Online';
    if(!Array.isArray(a.responsibleUserIds))a.responsibleUserIds=[];
    if(!a.bom)a.bom=[]; if(!a.warranties)a.warranties=[]; if(a.type==='Tool'&&!a.cribStatus)a.cribStatus='In crib';
  });
  if(!data.assets.some(function(a){return a.type==='Region';})){
    data.assets.unshift({id:'REG-WA',code:'WA',name:'West Africa',type:'Region',parentId:null,status:'Healthy',operatingState:'Online',criticality:'A',location:'Regional operations',bom:[],responsibleUserIds:[],warranties:[]});
    const site=data.assets.find(function(a){return a.id==='SITE-1';}); if(site&&!site.parentId) site.parentId='REG-WA';
  }
  data.parts.forEach(function(p){
    if(p.autoReorder==null)p.autoReorder=true; if(!p.reorderQty)p.reorderQty=Math.max(1,minStock(p)||4);
    if(!p.fifoLots)p.fifoLots=[{qty:totalStock(p),unitCost:p.unitCost,receivedAt:new Date().toISOString()}];
    if(!p.transactions)p.transactions=[];
  });
  data.workOrders.forEach(function(w){
    if(!w.suggestedStart)w.suggestedStart=w.due; if(!w.laborEntries)w.laborEntries=[];
    if(!w.miscCosts)w.miscCosts=[]; if(!w.files)w.files=[]; if(!w.failureCodes)w.failureCodes={problem:'',cause:'',action:''};
    if(w.completionNotes==null)w.completionNotes='';
    (w.tasks||[]).forEach(function(t){ if(t.estimateHours==null)t.estimateHours=0.5; if(t.hoursSpent==null)t.hoursSpent=0; if(!t.notes)t.notes=''; });
  });
  data.pm.forEach(function(p){
    if(p.skipIfOpen==null)p.skipIfOpen=true; if(!p.nested)p.nested=[]; if(p.iteration==null)p.iteration=0;
    if(!p.generatedWorkIds)p.generatedWorkIds=[];
  });
  data.requests.forEach(function(r){ if(r.status==='Converted'&&!r.workOrderId) r.status='Requested'; });
  return data;
}
function save(reason){
  if(reason) state.syncQueue.push({id:'Q-'+Date.now(),at:new Date().toISOString(),reason:reason});
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateConnection();
}

function parseRoute(){
  const raw=(location.hash.replace(/^#\/?/, '')||'dashboard').split('/');
  const aliases={pm:'scheduled-maintenance',requests:'work-requests',inventory:'parts',reports:'analytics',people:'users',counts:'cycle-counts',suppliers:'vendors'};
  const name=aliases[raw[0]]||raw[0];
  return {name:name, id: raw[1] ? decodeURIComponent(raw[1]) : null};
}
function navigate(next, id){
  const same=route.name===next && String(route.id||'')===String(id||'');
  route={name:next, id:id||null};
  location.hash='#/'+next+(id?'/'+encodeURIComponent(id):'');
  if(!same){ recordTab='summary'; smTab='details'; partTab='details'; }
  render();
  const view=document.getElementById('appView'); if(view) view.focus({preventScroll:true});
}

function escapeHTML(value){ return String(value==null?'':value).replace(/[&<>'"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch];}); }
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
function statusClass(v){ return String(v||'').toLowerCase().replace(/\s+/g,'-').replace('in-progress','progress').replace('on-hold','hold'); }
function prettyDate(value){
  if(!value) return '—';
  const d=new Date(value.length<=10?value+'T12:00:00':value);
  const t=new Date(); t.setHours(12,0,0,0);
  const c=new Date(d); c.setHours(12,0,0,0);
  const diff=Math.round((c-t)/86400000);
  if(diff===0) return 'Today'; if(diff===1) return 'Tomorrow'; if(diff===-1) return 'Yesterday';
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}
function formatTime(value){ return new Date(value).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }
function isActive(w){ return w.status!=='Completed' && w.status!=='Closed'; }
function overdue(w){ return isActive(w)&&w.due<day(0); }
function daysLate(w){ if(!overdue(w)) return 0; return Math.round((new Date(day(0)+'T12:00:00')-new Date(w.due+'T12:00:00'))/86400000); }
function badge(text,cls){ return '<span class="badge '+statusClass(cls||text)+'">'+escapeHTML(text)+'</span>'; }
function icon(id){ return '<svg><use href="#'+id+'"/></svg>'; }
function toast(message){
  const el=document.getElementById('toast'); if(!el) return;
  el.querySelector('span').textContent=message; el.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(function(){el.classList.remove('show');},2600);
}
function logWork(w,text){ w.log=w.log||[]; w.log.unshift({at:new Date().toISOString(),text:text}); }
function nextWorkId(){ const n=Math.max.apply(null,state.workOrders.map(function(w){return Number(String(w.id).replace(/\D/g,''))||0;}).concat([2400]))+1; return 'WO-'+n; }
function nextRequestId(){ const n=Math.max.apply(null,state.requests.map(function(r){return Number(String(r.id).replace(/\D/g,''))||0;}).concat([80]))+1; return 'REQ-'+n; }
function newTaskId(){ return 'T-'+Date.now()+'-'+Math.floor(Math.random()*1000); }
function nextRecordId(prefix,records,start){ const n=Math.max.apply(null,records.map(function(x){return Number(String(x.id).replace(/\D/g,''))||0;}).concat([start||0]))+1; return prefix+'-'+n; }
function addAudit(action,entityType,entityId,detail){ state.auditLog.unshift({id:'AUD-'+Date.now()+'-'+Math.floor(Math.random()*1000),at:new Date().toISOString(),userId:CURRENT_USER,action:action,entityType:entityType,entityId:entityId,detail:detail||''}); }
function optionList(records,label,value,selected){ return records.map(function(x){const v=value(x),l=label(x);return '<option value="'+escapeHTML(v)+'" '+(String(v)===String(selected||'')?'selected':'')+'>'+escapeHTML(l)+'</option>';}).join(''); }

function laborMinutes(w){ return (w.laborEntries||[]).reduce(function(s,e){return s+Number(e.minutes||0);},0) || Number(w.actualMinutes||0); }
function laborCost(w){ return (w.laborEntries||[]).reduce(function(s,e){return s+(Number(e.minutes||0)/60)*Number(e.rate||0);},0) || (laborMinutes(w)/60)*((user(w.assigneeId)||{}).hourlyRate||0); }
function partsCost(w){ return (w.parts||[]).reduce(function(s,x){ const p=part(x.partId); return s+Number(x.actual||0)*Number(p?p.unitCost:0); },0); }
function miscCost(w){ return (w.miscCosts||[]).reduce(function(s,x){return s+Number(x.amount||0);},0); }
function workCost(w){ return laborCost(w)+partsCost(w)+miscCost(w); }
function assetCost(assetId){ return state.workOrders.filter(function(w){return w.assetId===assetId||w.secondaryAssetId===assetId;}).reduce(function(s,w){return s+workCost(w);},0); }
function assetStakeholders(a){
  const ids=new Set();
  state.users.forEach(function(u){if(u.active&&(u.role==='Operations manager'||u.role==='Maintenance planner'))ids.add(u.id);});
  (a.responsibleUserIds||[]).forEach(function(id){if(user(id)&&user(id).active)ids.add(id);});
  state.workOrders.filter(function(w){return (w.assetId===a.id||w.secondaryAssetId===a.id)&&isActive(w);}).forEach(function(w){if(user(w.assigneeId)&&user(w.assigneeId).active)ids.add(w.assigneeId);});
  ids.add(CURRENT_USER); return Array.from(ids);
}
function notifyUsers(userIds,title,message,severity,entityType,entityId,emailCopy){
  const now=new Date().toISOString();
  userIds.forEach(function(userId){
    const u=user(userId); if(!u||!u.active) return;
    state.notifications.unshift({id:'NTF-'+Date.now()+'-'+userId+'-'+Math.floor(Math.random()*1000),userId:userId,title:title,message:message,severity:severity||'Information',entityType:entityType||'',entityId:entityId||'',createdAt:now,read:false});
    if(emailCopy!==false&&u.emailAlerts&&u.email) state.mailOutbox.unshift({id:'MAIL-'+Date.now()+'-'+userId+'-'+Math.floor(Math.random()*1000),userId:userId,to:u.email,subject:'[SafiMaintain] '+title,body:message,status:'Queued locally',createdAt:now,entityId:entityId||''});
  });
}
function unreadCount(){ return state.notifications.filter(function(n){return n.userId===CURRENT_USER&&!n.read;}).length; }

function scheduledCompliance(){
  const start=new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const pmWos=state.workOrders.filter(function(w){return w.type==='Preventive'&&new Date(w.createdAt)>=start;});
  if(!pmWos.length) return 100;
  const onTime=pmWos.filter(function(w){ return (w.status==='Completed'||w.status==='Closed') && w.completedAt && w.completedAt.slice(0,10)<=w.due; }).length;
  return Math.round(onTime/pmWos.length*100);
}
function mttrHours(){
  const closed=state.workOrders.filter(function(w){return (w.type==='Corrective'||w.type==='Emergency')&&w.completedAt;});
  if(!closed.length) return 0;
  const hours=closed.reduce(function(s,w){return s+(new Date(w.completedAt)-new Date(w.createdAt))/3600000;},0);
  return Math.round(hours/closed.length*10)/10;
}

function queueReorder(p, reason, workOrderId){
  if(!p.autoReorder) return;
  if(totalStock(p)>minStock(p)) return;
  const open=state.purchaseRequests.find(function(r){return r.partId===p.id&&r.status==='Open';});
  if(open) return;
  const id=nextRecordId('PR',state.purchaseRequests,0);
  state.purchaseRequests.unshift({id:id,partId:p.id,quantity:p.reorderQty||Math.max(1,minStock(p)),vendorId:p.preferredVendorId||'',reason:reason,status:'Open',createdAt:new Date().toISOString(),workOrderId:workOrderId||''});
  notifyUsers(['U-1','U-3'], p.name+' added to purchase planning board', p.code+' is at or below minimum. A purchase request was created.', 'Warning', 'Part', p.id, true);
}

function consumeFifo(p, qty){
  let left=qty, cost=0;
  p.fifoLots=p.fifoLots||[];
  p.fifoLots.forEach(function(lot){
    if(left<=0) return;
    const take=Math.min(lot.qty, left);
    lot.qty-=take; left-=take; cost+=take*Number(lot.unitCost||p.unitCost||0);
  });
  p.fifoLots=p.fifoLots.filter(function(l){return l.qty>0;});
  return cost;
}

function crumb(items){
  return '<nav class="crumb">'+items.map(function(x,i){
    if(x.route) return '<button type="button" data-route-jump="'+x.route+'">'+escapeHTML(x.label)+'</button>'+(i<items.length-1?'<span>/</span>':'');
    return '<span>'+escapeHTML(x.label)+'</span>';
  }).join('')+'</nav>';
}
function pageHead(kicker,title,subtitle,actions){
  return '<div class="page-head"><div><p class="eyebrow">'+escapeHTML(kicker)+'</p><h1>'+escapeHTML(title)+'</h1><p>'+escapeHTML(subtitle)+'</p></div><div class="page-actions">'+(actions||'')+'</div></div>';
}
function adminStrip(html){ return '<div class="admin-strip">'+html+'</div>'; }
function empty(title,body){ return '<div class="empty"><strong>'+escapeHTML(title)+'</strong>'+escapeHTML(body||'')+'</div>'; }

function setInventoryOpen(open){
  const toggle=document.getElementById('inventoryToggle'), menu=document.getElementById('inventoryMenu');
  if(!toggle||!menu) return;
  toggle.setAttribute('aria-expanded', String(open)); menu.hidden=!open;
}

function updateBadges(){
  const set=function(id,val){ const el=document.getElementById(id); if(el) el.textContent=val||''; };
  set('workBadge', state.workOrders.filter(isActive).length);
  set('myWorkBadge', state.workOrders.filter(function(w){return isActive(w)&&w.assigneeId===CURRENT_USER;}).length);
  set('requestBadge', state.requests.filter(function(r){return r.status==='Requested';}).length);
  const low=state.parts.filter(function(p){return totalStock(p)<=minStock(p);}).length;
  set('stockBadge', low);
  set('planBadge', state.purchaseRequests.filter(function(r){return r.status==='Open';}).length);
  const unread=unreadCount(); set('alertBadge', unread); set('notificationBadge', unread);
}
function updateConnection(){
  const online=navigator.onLine, dot=document.getElementById('connectionDot');
  if(dot) dot.classList.toggle('offline', !online);
  const label=document.getElementById('connectionLabel'); if(label) label.textContent=online?'Online · saved locally':'Offline · saved locally';
  const sync=document.getElementById('syncLabel'); if(sync) sync.textContent=state.syncQueue.length?state.syncQueue.length+' change'+(state.syncQueue.length===1?'':'s')+' awaiting server':'No pending local changes';
}

function render(){
  route=parseRoute();
  updateBadges();
  const inventoryRoutes=['parts','purchase-planning','purchase-orders','rfqs','vendors','receipts','cycle-counts'];
  const inv=inventoryRoutes.includes(route.name);
  document.querySelectorAll('.nav-link[data-route]').forEach(function(b){
    const r=b.dataset.route;
    b.classList.toggle('active', r===route.name && !b.classList.contains('nav-parent'));
  });
  const toggle=document.getElementById('inventoryToggle');
  if(toggle){ toggle.classList.toggle('active', inv); if(inv) setInventoryOpen(true); }
  const view=document.getElementById('appView');
  view.innerHTML=renderCurrent();
  bindPageActions();
}

function renderCurrent(){
  if(route.name==='work-orders'&&route.id) return renderWorkRecord(route.id);
  if(route.name==='scheduled-maintenance'&&route.id) return renderScheduledRecord(route.id);
  if(route.name==='assets'&&route.id){ selectedAssetId=route.id; return renderAssets(); }
  if(route.name==='parts'&&route.id) return renderPartRecord(route.id);
  const pages={
    dashboard:renderDashboard, 'my-work':renderMyWork, 'work-orders':renderWorkOrders,
    'scheduled-maintenance':renderScheduledList, 'work-requests':renderRequests, calendar:renderCalendar,
    assets:renderAssets, meters:renderMeters, 'tool-crib':renderToolCrib,
    parts:renderParts, 'purchase-planning':renderPlanningBoard, 'purchase-orders':renderPurchaseOrders,
    rfqs:renderRfqs, vendors:renderVendors, receipts:renderReceipts, 'cycle-counts':renderCounts,
    analytics:renderAnalytics, users:renderPeople, notifications:renderNotifications,
    settings:renderSettings, audit:renderAudit, security:renderSecurity
  };
  return (pages[route.name]||renderDashboard)();
}

function barRow(label, value, max, cls){
  const pct=max?Math.round(value/max*100):0;
  return '<div class="bar-row"><span>'+escapeHTML(label)+'</span><div class="bar-track"><i class="'+(cls||'')+'" style="width:'+pct+'%"></i></div><strong>'+value+'</strong></div>';
}

function renderDashboard(){
  const active=state.workOrders.filter(isActive);
  const late=active.filter(overdue);
  const high=active.filter(function(w){return w.priority==='Critical'||w.priority==='High';});
  const low=state.parts.filter(function(p){return totalStock(p)<=minStock(p);});
  const offline=state.assets.filter(function(a){return a.type==='Equipment'&&a.operatingState==='Offline';});
  const plan=state.purchaseRequests.filter(function(r){return r.status==='Open';});
  const byUser={}; active.forEach(function(w){ const n=userName(w.assigneeId); byUser[n]=(byUser[n]||0)+1; });
  const byType={}; active.forEach(function(w){ byType[w.type]=(byType[w.type]||0)+1; });
  const byPri={}; active.forEach(function(w){ byPri[w.priority]=(byPri[w.priority]||0)+1; });
  const byAsset={}; active.forEach(function(w){ const n=assetName(w.assetId); byAsset[n]=(byAsset[n]||0)+1; });
  const lateBuckets={'1–3 days':0,'4–7 days':0,'8+ days':0};
  late.forEach(function(w){ const d=daysLate(w); if(d<=3) lateBuckets['1–3 days']++; else if(d<=7) lateBuckets['4–7 days']++; else lateBuckets['8+ days']++; });
  const userMax=Math.max.apply(null, Object.values(byUser).concat([1]));
  const typeMax=Math.max.apply(null, Object.values(byType).concat([1]));
  const assetEntries=Object.keys(byAsset).sort(function(a,b){return byAsset[b]-byAsset[a];}).slice(0,8);
  const dueSoon=state.pm.filter(function(p){return p.status==='Running'&&p.trigger.type==='time'&&p.trigger.nextDue<=day(7);});
  return crumb([{label:'Dashboards'}])+
    pageHead('Dashboards','Active work order insights','Fiix-style command view of active work, scheduled compliance, offline assets and inventory risk.',
      '<button class="secondary-btn" data-new-request>'+icon('i-request')+'Work request</button><button class="primary-btn" data-new-work>'+icon('i-plus')+'New work order</button>')+
    '<section class="kpi-strip">'+
      '<article class="kpi"><label>Active work orders</label><strong>'+active.length+'</strong><small>'+high.length+' high / critical</small></article>'+
      '<article class="kpi red"><label>Late work orders</label><strong>'+late.length+'</strong><small>Past suggested completion</small></article>'+
      '<article class="kpi blue"><label>Scheduled compliance</label><strong>'+scheduledCompliance()+'%</strong><small>'+dueSoon.length+' PMs due in 7 days</small></article>'+
      '<article class="kpi amber"><label>MTTR</label><strong>'+mttrHours()+' h</strong><small>Corrective / emergency close-out</small></article>'+
      '<article class="kpi"><label>Offline assets</label><strong>'+offline.length+'</strong><small>'+low.length+' parts below min · '+plan.length+' purchase requests</small></article>'+
    '</section>'+
    '<section class="widget-grid">'+
      '<article class="card widget"><div class="card-head"><div><p class="eyebrow">Late work</p><h2>How late</h2></div></div><div class="widget-body">'+Object.keys(lateBuckets).map(function(k){return barRow(k, lateBuckets[k], Math.max(late.length,1), 'late');}).join('')+'</div></article>'+
      '<article class="card widget"><div class="card-head"><div><p class="eyebrow">Workload</p><h2>Active WOs by user</h2></div></div><div class="widget-body">'+Object.keys(byUser).map(function(k){return barRow(k, byUser[k], userMax);}).join('')+'</div></article>'+
      '<article class="card widget"><div class="card-head"><div><p class="eyebrow">Maintenance type</p><h2>Active WOs by type</h2></div></div><div class="widget-body">'+Object.keys(byType).map(function(k){return barRow(k, byType[k], typeMax);}).join('')+'</div></article>'+
      '<article class="card widget"><div class="card-head"><div><p class="eyebrow">Priority</p><h2>Active WOs by priority</h2></div></div><div class="widget-body pie-legend">'+PRIORITIES.map(function(p){return '<div><i class="swatch '+statusClass(p)+'"></i><span>'+p+'</span><strong>'+(byPri[p]||0)+'</strong></div>';}).join('')+'</div></article>'+
      '<article class="card widget span-2"><div class="card-head"><div><p class="eyebrow">Assets</p><h2>Top assets with open work orders</h2></div><button class="link-btn" data-route-jump="assets">All assets →</button></div><div class="widget-body">'+assetEntries.map(function(k){return barRow(k, byAsset[k], byAsset[assetEntries[0]]||1);}).join('')+'</div></article>'+
    '</section>'+
    '<section class="grid-main" style="margin-top:14px"><div class="stack">'+
      '<article class="card"><div class="card-head"><div><p class="eyebrow">Needs attention</p><h2>Overdue and high-priority work</h2></div><button class="link-btn" data-route-jump="work-orders">Work orders →</button></div><div class="decision-list">'+
        (high.concat(late.filter(function(w){return w.priority!=='High'&&w.priority!=='Critical';})).slice(0,8).map(function(w){
          return '<button class="decision-row" data-open-wo="'+w.id+'"><span class="stripe '+w.priority+'"></span><span><strong>'+escapeHTML(w.title)+'</strong><p>'+escapeHTML(w.id)+' · '+escapeHTML(assetName(w.assetId))+' · '+prettyDate(w.due)+' · '+escapeHTML(userName(w.assigneeId))+'</p></span><span class="badges">'+badge(w.priority,w.priority)+' '+badge(w.status)+'</span></button>';
        }).join('')||empty('No urgent work','Nothing is currently overdue or high priority.'))+
      '</div></article>'+
    '</div><div class="stack">'+
      '<article class="card"><div class="card-head"><div><p class="eyebrow">Scheduled maintenance</p><h2>Upcoming triggers</h2></div><button class="link-btn" data-route-jump="scheduled-maintenance">Planner →</button></div><div class="pm-mini">'+
        state.pm.filter(function(p){return p.status==='Running';}).map(function(p){
          const trig=p.trigger.type==='time'?prettyDate(p.trigger.nextDue):p.trigger.type==='meter'?'At '+p.trigger.nextThreshold:'On '+p.trigger.eventType;
          return '<div class="pm-row"><span class="date-tile">'+(p.trigger.type==='time'?prettyDate(p.trigger.nextDue).slice(0,6):p.trigger.type==='meter'?'MTR':'EVT')+'</span><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.id)+' · '+escapeHTML(assetName(p.assetId))+'</small></span>'+badge(trig,'healthy')+'</div>';
        }).join('')+
      '</div></article>'+
      '<article class="card card-pad"><p class="eyebrow">Purchase planning board</p><h2 style="margin:3px 0 6px;font-size:1rem">'+plan.length+' automatic reorder'+(plan.length===1?'':'s')+'</h2><p style="color:var(--muted);font-size:.76rem;margin:0 0 12px">Parts consumed below minimum generate purchase requests, matching Fiix auto-reorder.</p><button class="secondary-btn" data-route-jump="purchase-planning">Open planning board</button></article>'+
    '</div></section>';
}

function filteredWorkOrders(assigneeOnly){
  let rows=state.workOrders.slice();
  if(assigneeOnly) rows=rows.filter(function(w){return isActive(w)&&w.assigneeId===CURRENT_USER;});
  else if(woFilter==='Active') rows=rows.filter(isActive);
  else if(woFilter==='My work') rows=rows.filter(function(w){return isActive(w)&&w.assigneeId===CURRENT_USER;});
  else if(woFilter!=='All') rows=rows.filter(function(w){return w.status===woFilter;});
  if(woTypeFilter!=='All') rows=rows.filter(function(w){return w.type===woTypeFilter;});
  const rank={Critical:0,High:1,Medium:2,Low:3};
  rows.sort(function(a,b){
    let av=a[sortKey], bv=b[sortKey];
    if(sortKey==='asset'){av=assetName(a.assetId);bv=assetName(b.assetId);}
    if(sortKey==='assignee'){av=userName(a.assigneeId);bv=userName(b.assigneeId);}
    if(sortKey==='priority'){av=rank[a.priority]??9;bv=rank[b.priority]??9;}
    if(typeof av==='string') return (sortDir==='asc'?1:-1)*String(av).localeCompare(String(bv));
    return (sortDir==='asc'?1:-1)*((av||0)-(bv||0));
  });
  return rows;
}
function sortHead(label,key){ return '<button class="sort-button '+(sortKey===key?'active':'')+'" data-sort-work="'+key+'">'+label+(sortKey===key?(sortDir==='asc'?' ↑':' ↓'):'')+'</button>'; }
function workTable(rows){
  return '<div class="table-wrap"><table class="data-table"><thead><tr><th class="bulk-check"><input type="checkbox" data-select-all-wo aria-label="Select all"></th><th>'+sortHead('Code','id')+'</th><th>'+sortHead('Summary of issue','title')+'</th><th>'+sortHead('Priority','priority')+'</th><th>'+sortHead('Assigned user','assignee')+'</th><th>'+sortHead('Suggested completion','due')+'</th><th>'+sortHead('Status','status')+'</th><th>Maintenance type</th></tr></thead><tbody>'+
    rows.map(function(w){
      return '<tr><td class="bulk-check"><input type="checkbox" data-select-wo="'+w.id+'" '+(selectedWorkIds.has(w.id)?'checked':'')+'></td>'+
        '<td><strong>'+escapeHTML(w.id)+'</strong><small>QR '+escapeHTML(w.id)+'</small></td>'+
        '<td><button class="link-btn" data-open-wo="'+w.id+'"><strong>'+escapeHTML(w.title)+'</strong></button><small>'+escapeHTML(assetName(w.assetId))+(w.secondaryAssetId?' + '+escapeHTML(assetName(w.secondaryAssetId)):'')+'</small></td>'+
        '<td>'+badge(w.priority,w.priority)+'</td><td>'+escapeHTML(userName(w.assigneeId))+'</td>'+
        '<td><strong>'+prettyDate(w.due)+'</strong>'+(overdue(w)?'<small style="color:var(--red)">'+daysLate(w)+' days late</small>':'')+'</td>'+
        '<td>'+badge(w.status)+'</td><td>'+escapeHTML(w.type)+'<small>'+escapeHTML(w.source||'Manual')+'</small></td></tr>';
    }).join('')+'</tbody></table></div>';
}
function renderWorkOrders(){
  const filters=['My work','Active','Open','On Hold','In Progress','Completed','Closed','All'];
  const rows=filteredWorkOrders(false);
  return crumb([{label:'Maintenance'},{label:'Work orders'}])+
    pageHead('Maintenance','Work orders','Create, assign, complete and analyze work orders. Default list shows active work; use My work for the jobs assigned to you.',
      '<button class="primary-btn" data-new-work>'+icon('i-plus')+'New</button>')+
    adminStrip('<button class="tool-btn primary" data-new-work>'+icon('i-plus')+'New</button><button class="tool-btn" data-bulk-action="start" '+(!selectedWorkIds.size?'disabled':'')+'>Start selected</button><button class="tool-btn" data-bulk-action="hold" '+(!selectedWorkIds.size?'disabled':'')+'>On hold</button><button class="tool-btn" data-bulk-action="complete" '+(!selectedWorkIds.size?'disabled':'')+'>Complete selected</button><button class="tool-btn" data-print-work>'+icon('i-file')+'Print</button><span class="spacer"></span><span class="admin-count">'+selectedWorkIds.size+' selected · '+rows.length+' records</span>')+
    '<div class="toolbar"><div class="filter-set">'+filters.map(function(x){return '<button class="filter-chip '+(woFilter===x?'active':'')+'" data-wo-filter="'+x+'">'+x+'</button>';}).join('')+'</div><div class="filter-set">'+['All'].concat(MAINT_TYPES).map(function(x){return '<button class="filter-chip '+(woTypeFilter===x?'active':'')+'" data-wo-type="'+x+'">'+x+'</button>';}).join('')+'</div></div>'+
    workTable(rows);
}
function renderMyWork(){
  woFilter='My work';
  const rows=filteredWorkOrders(true);
  return crumb([{label:'Maintenance'},{label:'My work'}])+
    pageHead('Maintenance','My work','Active work orders assigned to '+userName(CURRENT_USER)+'. This is the Fiix My Work filter, not a separate product.',
      '<button class="primary-btn" data-new-work>'+icon('i-plus')+'New work order</button>')+
    workTable(rows);
}

function recordTabs(tabs, current, attr){
  return '<div class="detail-tabs">'+tabs.map(function(t){return '<button class="detail-tab '+(current===t[0]?'active':'')+'" '+attr+'="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div>';
}

function renderWorkRecord(id){
  const w=work(id); if(!w) return pageHead('Work orders','Record not found','')+'<button class="secondary-btn" data-route-jump="work-orders">Back to work orders</button>';
  const tasksDone=w.tasks.filter(function(t){return t.status==='Done';}).length;
  const a=asset(w.assetId);
  let body='';
  if(recordTab==='summary'){
    body='<div class="record-form">'+
      '<label>Summary of issue<input data-wo-field="title" value="'+escapeHTML(w.title)+'"></label>'+
      '<label>Asset<select data-wo-field="assetId">'+optionList(state.assets,function(x){return x.code+' · '+x.name;},function(x){return x.id;},w.assetId)+'</select></label>'+
      '<label>Additional asset<select data-wo-field="secondaryAssetId"><option value="">None</option>'+optionList(state.assets.filter(function(x){return x.id!==w.assetId;}),function(x){return x.code+' · '+x.name;},function(x){return x.id;},w.secondaryAssetId)+'</select></label>'+
      '<label>Maintenance type<select data-wo-field="type">'+MAINT_TYPES.map(function(t){return '<option '+(w.type===t?'selected':'')+'>'+t+'</option>';}).join('')+'</select></label>'+
      '<label>Priority<select data-wo-field="priority">'+PRIORITIES.map(function(t){return '<option '+(w.priority===t?'selected':'')+'>'+t+'</option>';}).join('')+'</select></label>'+
      '<label>Assign to user<select data-wo-field="assigneeId">'+optionList(state.users.filter(function(u){return u.active;}),function(u){return u.name+' · '+u.role;},function(u){return u.id;},w.assigneeId)+'</select></label>'+
      '<label>Suggested start<input type="date" data-wo-field="suggestedStart" value="'+escapeHTML(w.suggestedStart||w.due)+'"></label>'+
      '<label>Suggested completion<input type="date" data-wo-field="due" value="'+escapeHTML(w.due)+'"></label>'+
      '<label>Estimated time (h)<input type="number" step=".25" data-wo-field="estimateHours" value="'+escapeHTML(w.estimateHours)+'"></label>'+
      '<label>Project<select data-wo-field="projectId"><option value="">None</option>'+optionList(state.projects,function(p){return p.name;},function(p){return p.id;},w.projectId)+'</select></label>'+
      '<label class="span-2">Work instructions / SOP<textarea rows="4" data-wo-field="instructions">'+escapeHTML(w.instructions||'')+'</textarea></label>'+
    '</div><p class="form-note">Changes save when you click Save in the record toolbar, matching Fiix work-order editing.</p>';
  } else if(recordTab==='completion'){
    body='<div class="record-admin-grid">'+
      '<div class="info-cell"><small>Status</small><strong>'+escapeHTML(w.status)+'</strong></div>'+
      '<div class="info-cell"><small>Labor tasks</small><strong>'+tasksDone+' / '+w.tasks.length+'</strong></div>'+
      '<div class="info-cell"><small>Date completed</small><strong>'+(w.completedAt?formatTime(w.completedAt):'Not completed')+'</strong></div>'+
      '<div class="info-cell"><small>Total cost</small><strong>'+money(workCost(w))+'</strong></div>'+
    '</div><label class="block-label">Completion notes<textarea rows="4" data-wo-field="completionNotes">'+escapeHTML(w.completionNotes||'')+'</textarea></label>'+
      (isActive(w)?'<div class="inline-actions"><button class="primary-btn" data-complete-work="'+w.id+'">Complete work order</button><button class="secondary-btn" data-close-work="'+w.id+'">Close, Complete</button></div>':'<button class="secondary-btn" data-close-work="'+w.id+'" '+(w.status==='Closed'?'disabled':'')+'>Close, Complete</button>');
  } else if(recordTab==='tasks'){
    body='<div class="task-list">'+w.tasks.map(function(t){
      let control='';
      if(t.type==='Inspection') control='<span class="badges"><button class="filter-chip '+(t.result==='Pass'?'active':'')+'" data-inspection-result="'+w.id+'|'+t.id+'|Pass">Pass</button><button class="filter-chip '+(t.result==='Fail'?'active':'')+'" data-inspection-result="'+w.id+'|'+t.id+'|Fail">Fail</button><button class="filter-chip '+(t.result==='N/A'?'active':'')+'" data-inspection-result="'+w.id+'|'+t.id+'|N/A">N/A</button></span>';
      else if(t.type==='Meter') control='<button class="secondary-btn" data-meter-task="'+w.id+'|'+t.id+'">'+(t.status==='Done'?'Recorded':'Record reading')+'</button>';
      else control='<input type="checkbox" '+(t.status==='Done'?'checked':'')+' data-task-toggle="'+w.id+'|'+t.id+'">';
      return '<div class="task-item">'+control+'<span><strong>'+escapeHTML(t.text)+'</strong><small>'+escapeHTML(t.type)+' · Est. '+(t.estimateHours||0)+' h · Spent '+(t.hoursSpent||0)+' h'+(t.result?' · '+escapeHTML(t.result):'')+(t.followOnWorkId?' · Follow-on '+escapeHTML(t.followOnWorkId):'')+'</small></span><input class="hours-input" type="number" step=".25" min="0" value="'+(t.hoursSpent||0)+'" data-task-hours="'+w.id+'|'+t.id+'" aria-label="Hours spent"></div>';
    }).join('')+'</div><button class="secondary-btn" data-add-task="'+w.id+'">Add labor task</button>';
  } else if(recordTab==='parts'){
    body='<div class="record-list">'+(w.parts.length?w.parts.map(function(x){
      const p=part(x.partId); const stock=p?totalStock(p):0;
      return '<div class="record-item"><span><strong>'+escapeHTML(p?p.name:x.partId)+'</strong><small>'+escapeHTML(p?p.code:'')+' · Planned '+x.planned+' · Actual '+x.actual+' · On hand '+stock+'</small></span><button class="secondary-btn" data-use-part="'+w.id+'|'+x.partId+'">Issue 1 (FIFO)</button></div>';
    }).join(''):empty('No parts','Add a suggested part from the asset BOM or catalog.'))+'</div>'+
      '<div class="inline-actions"><select id="addPartSelect">'+optionList(state.parts,function(p){return p.code+' · '+p.name;},function(p){return p.id;})+'</select><button class="secondary-btn" data-add-wo-part="'+w.id+'">Add part</button></div>';
  } else if(recordTab==='costs'){
    body='<div class="record-admin-grid"><div class="info-cell"><small>Labor</small><strong>'+money(laborCost(w))+'</strong></div><div class="info-cell"><small>Parts</small><strong>'+money(partsCost(w))+'</strong></div><div class="info-cell"><small>Miscellaneous</small><strong>'+money(miscCost(w))+'</strong></div><div class="info-cell"><small>Work order total</small><strong>'+money(workCost(w))+'</strong></div><div class="info-cell"><small>Asset TCO (this asset)</small><strong>'+money(assetCost(w.assetId))+'</strong></div></div>'+
      '<div class="record-section"><h3>Log labor</h3><div class="inline-actions"><button class="secondary-btn" data-log-labor="'+w.id+'|15">+15 min</button><button class="secondary-btn" data-log-labor="'+w.id+'|30">+30 min</button><button class="secondary-btn" data-log-labor="'+w.id+'|60">+1 hour</button></div><div class="record-list">'+(w.laborEntries||[]).map(function(e){return '<div class="record-item"><span><strong>'+escapeHTML(userName(e.userId))+'</strong><small>'+e.minutes+' min · '+money(e.rate)+'/h · '+formatTime(e.at)+'</small></span></div>';}).join('')+'</div></div>'+
      '<div class="record-section"><h3>Miscellaneous costs</h3>'+(w.miscCosts||[]).map(function(c){return '<div class="record-item"><span>'+escapeHTML(c.description)+'</span><strong>'+money(c.amount)+'</strong></div>';}).join('')+'<div class="inline-actions"><input id="miscDesc" placeholder="Description"><input id="miscAmt" type="number" step=".01" placeholder="Amount"><button class="secondary-btn" data-add-misc="'+w.id+'">Add cost</button></div></div>';
  } else if(recordTab==='details'){
    body='<div class="record-form">'+
      '<label>Problem code<select data-fail-field="problem"><option value=""></option>'+(state.lookups.problems.map(function(x){return '<option '+(w.failureCodes.problem===x?'selected':'')+'>'+escapeHTML(x)+'</option>';}).join(''))+'</select></label>'+
      '<label>Cause code<select data-fail-field="cause"><option value=""></option>'+(state.lookups.causes.map(function(x){return '<option '+(w.failureCodes.cause===x?'selected':'')+'>'+escapeHTML(x)+'</option>';}).join(''))+'</select></label>'+
      '<label>Action code<select data-fail-field="action"><option value=""></option>'+(state.lookups.actions.map(function(x){return '<option '+(w.failureCodes.action===x?'selected':'')+'>'+escapeHTML(x)+'</option>';}).join(''))+'</select></label>'+
      '<label>Source<input value="'+escapeHTML(w.source||'Manual')+'" disabled></label></div><p class="form-note">Failure codes let you report recurring problems, causes and actions — the Fiix troubleshooting model.</p>';
  } else if(recordTab==='files'){
    body='<div class="record-list">'+(w.files||[]).map(function(f){return '<div class="record-item"><span><strong>'+escapeHTML(f.name)+'</strong><small>'+formatTime(f.at)+' · '+escapeHTML(f.note||'')+'</small></span></div>';}).join('')+'</div>'+
      '<label class="secondary-btn file-btn">Attach file<input type="file" accept="image/*,.pdf" data-wo-file="'+w.id+'" hidden></label>'+
      empty('Photos and manuals','Capture or attach files to this work order. Large files stay on this device.');
  } else {
    body='<div class="worklog">'+((w.log||[]).map(function(l){return '<div class="log-row"><time>'+formatTime(l.at)+'</time><span>'+escapeHTML(l.text)+'</span></div>';}).join('')||empty('No work log',''))+'</div>';
  }
  const tabs=[['summary','Summary'],['completion','Completion'],['tasks','Labor tasks'],['parts','Parts'],['costs','Costs'],['details','Additional details'],['files','Files'],['log','Work log']];
  return '<div class="record-page">'+crumb([{label:'Maintenance',route:'work-orders'},{label:'Work orders',route:'work-orders'},{label:w.id}])+
    '<div class="record-bar"><div><p class="eyebrow">Work order</p><h1>'+escapeHTML(w.id)+' · '+escapeHTML(w.title)+'</h1><p>'+escapeHTML(assetName(w.assetId))+(a?' · '+(a.operatingState==='Offline'?'Offline':'Online'):'')+'</p></div>'+
    '<div class="record-bar-actions"><label>Status <select data-wo-status="'+w.id+'">'+WO_STATUSES.map(function(s){return '<option '+(w.status===s?'selected':'')+'>'+s+'</option>';}).join('')+'</select></label>'+
    '<button class="secondary-btn" data-save-wo="'+w.id+'">Save</button>'+
    (w.status==='Open'?'<button class="primary-btn" data-start-work="'+w.id+'">Start work</button>':'')+
    (w.status==='In Progress'?'<button class="primary-btn" data-complete-work="'+w.id+'">Complete</button>':'')+
    '<button class="quiet-btn" data-print-work>'+icon('i-file')+'Print</button></div></div>'+
    '<div class="record-toolbar"><span class="record-code">'+escapeHTML(w.id)+'</span>'+badge(w.status)+badge(w.priority,w.priority)+badge(w.type,'healthy')+'<span class="record-toolbar-sep"></span><span>Assigned: <strong>'+escapeHTML(userName(w.assigneeId))+'</strong></span><span>Due: <strong>'+prettyDate(w.due)+'</strong></span><span>Cost: <strong>'+money(workCost(w))+'</strong></span><span class="record-tag">'+icon('i-scan')+' '+escapeHTML(w.id)+'</span></div>'+
    recordTabs(tabs, recordTab, 'data-record-tab')+'<div class="detail-body">'+body+'</div></div>';
}

function triggerLabel(p){
  if(p.trigger.type==='time') return 'Every '+p.trigger.intervalDays+' days · next '+prettyDate(p.trigger.nextDue);
  if(p.trigger.type==='meter'){ const m=meter(p.trigger.meterId); return 'Every '+p.trigger.intervalValue+' '+(m?m.unit:'')+' · next '+p.trigger.nextThreshold; }
  return 'Event: '+p.trigger.eventType;
}
function renderScheduledList(){
  const rows=state.pm.map(function(p){
    return '<tr data-open-sm="'+p.id+'"><td><strong>'+escapeHTML(p.id)+'</strong></td><td><button class="link-btn" data-open-sm="'+p.id+'"><strong>'+escapeHTML(p.name)+'</strong></button><small>'+escapeHTML(assetName(p.assetId))+'</small></td><td>'+badge(p.trigger.type==='time'?'Time':p.trigger.type==='meter'?'Meter':'Event',p.trigger.type==='time'?'healthy':'pending')+'</td><td>'+escapeHTML(triggerLabel(p))+'</td><td>'+badge(p.mode==='fixed'?'Fixed':'Floating','pending')+'</td><td>'+(p.nested&&p.nested.length?p.nested.length+' nested':'—')+'</td><td>'+badge(p.status,'healthy')+'</td><td><button class="tool-btn" data-generate-pm="'+p.id+'">Generate work order now</button></td></tr>';
  }).join('');
  return crumb([{label:'Maintenance'},{label:'Scheduled maintenance'}])+
    pageHead('Maintenance','Scheduled maintenance','Time, meter and event triggers generate preventive work orders. Nested PMs stack task groups on longer cycles.',
      '<button class="secondary-btn" data-run-automation>'+icon('i-sync')+'Evaluate triggers</button>')+
    adminStrip('<button class="tool-btn primary" data-run-automation>'+icon('i-sync')+'Evaluate triggers</button><span class="spacer"></span><span class="admin-count">'+state.pm.length+' scheduled maintenance records</span>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Scheduled maintenance</th><th>Trigger</th><th>Schedule</th><th>Fixed / floating</th><th>Nested PMs</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderScheduledRecord(id){
  const p=pm(id); if(!p) return pageHead('Scheduled maintenance','Not found','');
  const openChild=state.workOrders.find(function(w){return w.sourcePmId===p.id&&isActive(w);});
  let body='';
  if(smTab==='details'){
    body='<div class="info-grid"><div class="info-cell"><small>Asset</small><strong>'+escapeHTML(assetName(p.assetId))+'</strong></div><div class="info-cell"><small>Status</small><strong>'+escapeHTML(p.status)+'</strong></div><div class="info-cell"><small>Scheduling</small><strong>'+(p.mode==='fixed'?'Fixed':'Floating')+'</strong></div><div class="info-cell"><small>Skip if open WO exists</small><strong>'+(p.skipIfOpen?'Yes':'No')+'</strong></div></div>';
  } else if(smTab==='scheduling'){
    body='<div class="record-section"><h3>Trigger</h3><p>'+escapeHTML(triggerLabel(p))+'</p><p class="form-note">Fixed triggers stay on the original interval. Floating triggers count from the last generated work order.</p></div>';
  } else if(smTab==='tasks'){
    body='<div class="task-list">'+p.tasks.map(function(t){return '<div class="task-item"><span class="task-type">'+escapeHTML(t.type)+'</span><span><strong>'+escapeHTML(t.text)+'</strong><small>'+(t.nestedId?'Nested '+escapeHTML(t.nestedId):'Always included')+(t.autoCorrective?' · failed inspection creates follow-on WO':'')+'</small></span></div>';}).join('')+'</div>';
  } else if(smTab==='parts'){
    body='<div class="record-list">'+(p.parts.map(function(x){return '<div class="record-item"><span><strong>'+escapeHTML(partName(x.partId))+'</strong></span><strong>Planned '+x.planned+'</strong></div>';}).join('')||empty('No suggested parts',''))+'</div>';
  } else if(smTab==='nested'){
    body='<div class="record-list">'+(p.nested.length?p.nested.map(function(n){return '<div class="record-item"><span><strong>'+escapeHTML(n.name)+'</strong><small>Multiplier '+n.multiplier+' · included every '+n.multiplier+' iterations</small></span></div>';}).join(''):empty('No nested PMs','This scheduled maintenance generates one task set every cycle.'))+'</div><p class="form-note">Current iteration: '+(p.iteration||0)+'. Next generation includes every nested PM whose multiplier divides that iteration.</p>';
  } else {
    const logs=(p.generatedWorkIds||[]).map(function(wid){const w=work(wid); return w?'<button class="record-item" data-open-wo="'+wid+'"><span><strong>'+escapeHTML(wid)+'</strong><small>'+escapeHTML(w.title)+' · '+badge(w.status)+'</small></span></button>':'';}).join('');
    body='<div class="record-list">'+(logs||empty('No generated work orders',''))+'</div>';
  }
  return '<div class="record-page">'+crumb([{label:'Maintenance',route:'scheduled-maintenance'},{label:'Scheduled maintenance',route:'scheduled-maintenance'},{label:p.id}])+
    '<div class="record-bar"><div><p class="eyebrow">Scheduled maintenance</p><h1>'+escapeHTML(p.id)+' · '+escapeHTML(p.name)+'</h1><p>'+escapeHTML(assetName(p.assetId))+'</p></div><div class="record-bar-actions"><button class="primary-btn" data-generate-pm="'+p.id+'">Generate work order now</button></div></div>'+
    (openChild?'<div class="form-note">An open work order ('+escapeHTML(openChild.id)+') already exists. Fiix skips auto-generation until it is closed unless skip-if-open is disabled.</div>':'')+
    recordTabs([['details','Details'],['scheduling','Scheduling'],['tasks','Labor tasks'],['parts','Parts'],['nested','Nested PMs'],['log','Log']], smTab, 'data-sm-tab')+
    '<div class="detail-body">'+body+'</div></div>';
}

function renderRequests(){
  const rows=state.requests.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}).map(function(r){
    const actions=r.status==='Requested'?'<button class="tool-btn" data-approve-request="'+r.id+'">Approve</button><button class="tool-btn" data-convert-request="'+r.id+'">Create work order</button><button class="tool-btn" data-decline-request="'+r.id+'">Decline</button>':escapeHTML(r.workOrderId||r.status);
    return '<tr><td><strong>'+escapeHTML(r.id)+'</strong></td><td><strong>'+escapeHTML(r.summary)+'</strong><small>'+escapeHTML(assetName(r.assetId))+' · '+escapeHTML(r.requester)+'</small></td><td>'+badge(r.urgency,r.urgency==='Safety critical'?'down':r.urgency==='Urgent'?'attention':'healthy')+'</td><td>'+formatTime(r.createdAt)+'</td><td>'+badge(r.status,r.status==='Requested'?'pending':'completed')+'</td><td>'+actions+'</td></tr>';
  }).join('');
  return crumb([{label:'Maintenance'},{label:'Work requests'}])+
    pageHead('Maintenance','Work request portal','Guests and operators submit requests, then search, sort and track them. Approved requests become corrective work orders.',
      '<button class="primary-btn" data-new-request>'+icon('i-plus')+'Submit request</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Request</th><th>Priority</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderCalendar(){
  const cursor=state.calendarCursor||day(0).slice(0,7);
  const [y,m]=cursor.split('-').map(Number);
  const first=new Date(y,m-1,1), start=new Date(first); start.setDate(1-first.getDay());
  const cells=[];
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=d.toISOString().slice(0,10);
    const items=state.workOrders.filter(function(w){return w.due===key;});
    cells.push('<div class="cal-cell '+(d.getMonth()!==m-1?'muted':'')+(key===day(0)?' today':'')+'"><strong>'+d.getDate()+'</strong>'+items.map(function(w){return '<button class="cal-wo '+statusClass(w.priority)+'" data-open-wo="'+w.id+'">'+escapeHTML(w.id)+'</button>';}).join('')+'</div>');
  }
  const prev=new Date(y,m-2,1).toISOString().slice(0,7), next=new Date(y,m,1).toISOString().slice(0,7);
  return crumb([{label:'Maintenance'},{label:'Calendar'}])+
    pageHead('Maintenance','Resource calendar','See suggested completion dates by user workload. Open a work order to reschedule it from the Summary tab.',
      '<button class="secondary-btn" data-cal-month="'+prev+'">Prev</button><button class="secondary-btn" data-cal-month="'+next+'">Next</button>')+
    '<p class="eyebrow" style="margin-bottom:8px">'+first.toLocaleDateString('en-GB',{month:'long',year:'numeric'})+'</p>'+
    '<div class="cal-weekdays">Sun Mon Tue Wed Thu Fri Sat'.split(' ').map(function(d){return '<span>'+d+'</span>';}).join('')+'</div>'+
    '<div class="cal-grid">'+cells.join('')+'</div>';
}

function childrenOf(parentId){ return state.assets.filter(function(a){return a.parentId===parentId;}); }
function renderTree(parentId){
  return childrenOf(parentId).map(function(a){
    const kids=childrenOf(a.id);
    return '<div class="tree-node"><div class="tree-line '+(selectedAssetId===a.id?'active':'')+'" data-select-asset="'+a.id+'"><span class="node-icon">'+icon(a.type==='Tool'?'i-tool':'i-asset')+'</span><span><strong style="display:block;font-size:.8rem">'+escapeHTML(a.name)+'</strong><small>'+escapeHTML(a.code)+' · '+escapeHTML(a.type)+'</small></span>'+badge(a.operatingState,a.operatingState==='Online'?'completed':'down')+'</div>'+(kids.length?'<div class="tree-children">'+renderTree(a.id)+'</div>':'')+'</div>';
  }).join('');
}
function assetDetail(a){
  if(!a) return empty('Select an asset','Choose an item in the hierarchy.');
  const meters=state.meters.filter(function(m){return m.assetId===a.id;});
  const wos=state.workOrders.filter(function(w){return w.assetId===a.id||w.secondaryAssetId===a.id;});
  const plans=state.pm.filter(function(p){return p.assetId===a.id;});
  const bom=(a.bom||[]).map(part).filter(Boolean);
  const events=state.assetEvents.filter(function(e){return e.assetId===a.id;}).sort(function(x,y){return y.at.localeCompare(x.at);});
  const responsible=(a.responsibleUserIds||[]).map(userName).join(', ')||'Not assigned';
  let body='';
  if(assetTab==='details'){
    body='<div class="asset-state-banner '+statusClass(a.operatingState)+'"><span class="state-light"></span><div><small>Availability</small><strong>'+escapeHTML(a.operatingState)+'</strong></div><button class="'+(a.operatingState==='Online'?'danger-btn':'primary-btn')+'" data-toggle-asset-state="'+a.id+'">'+icon('i-power')+(a.operatingState==='Online'?'Take offline':'Return online')+'</button></div>'+
      '<div class="info-grid"><div class="info-cell"><small>Category</small><strong>'+escapeHTML(a.type)+'</strong></div><div class="info-cell"><small>Criticality</small><strong>'+escapeHTML(a.criticality)+'</strong></div><div class="info-cell"><small>Assigned user</small><strong>'+escapeHTML(responsible)+'</strong></div><div class="info-cell"><small>Location</small><strong>'+escapeHTML(a.location||'—')+'</strong></div><div class="info-cell"><small>Nameplate</small><strong>'+escapeHTML([a.manufacturer,a.model,a.serial].filter(Boolean).join(' · ')||'—')+'</strong></div><div class="info-cell"><small>Preferred vendor</small><strong>'+escapeHTML(supplierName(a.vendorId))+'</strong></div><div class="info-cell"><small>Total cost of ownership</small><strong>'+money(assetCost(a.id))+'</strong></div></div>';
  } else if(assetTab==='meters'){
    body='<div class="record-list">'+(meters.map(function(m){return '<div class="record-item"><span><strong>'+escapeHTML(m.name)+'</strong><small>Latest '+prettyDate(m.readings[m.readings.length-1].date)+'</small></span><strong>'+m.current+' '+escapeHTML(m.unit)+'</strong></div>';}).join('')||empty('No meters',''))+'</div>';
  } else if(assetTab==='pm'){
    body='<div class="record-list">'+(plans.map(function(p){return '<button class="record-item" data-open-sm="'+p.id+'"><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(triggerLabel(p))+'</small></span>'+badge(p.status,'healthy')+'</button>';}).join('')||empty('No scheduled maintenance',''))+'</div>';
  } else if(assetTab==='bom'){
    body='<div class="record-list">'+(bom.map(function(p){return '<button class="record-item" data-open-part="'+p.id+'"><span><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.code)+'</small></span><strong>'+totalStock(p)+' on hand</strong></button>';}).join('')||empty('No BOM',''))+'</div>';
  } else if(assetTab==='warranty'){
    body='<div class="record-list">'+((a.warranties||[]).map(function(x){return '<div class="record-item"><span><strong>'+escapeHTML(x.provider)+'</strong><small>'+escapeHTML(x.notes||'')+'</small></span>'+badge(x.expiry<day(0)?'Expired':'Expires '+prettyDate(x.expiry),x.expiry<day(0)?'down':'healthy')+'</div>';}).join('')||empty('No warranties',''))+'</div>';
  } else if(assetTab==='work'){
    body='<div class="record-list">'+(wos.map(function(w){return '<button class="record-item" data-open-wo="'+w.id+'"><span><strong>'+escapeHTML(w.id)+' · '+escapeHTML(w.title)+'</strong><small>'+escapeHTML(w.type)+' · '+escapeHTML(userName(w.assigneeId))+'</small></span>'+badge(w.status)+'</button>';}).join('')||empty('No work history',''))+'</div>';
  } else if(assetTab==='downtime'){
    body='<div class="record-list">'+(events.map(function(e){return '<div class="record-item"><span><strong>'+escapeHTML(e.fromState)+' → '+escapeHTML(e.toState)+'</strong><small>'+escapeHTML(e.reasonCode||'')+' · '+escapeHTML(e.reason)+' · '+formatTime(e.at)+'</small></span>'+badge(e.toState,e.toState==='Online'?'completed':'down')+'</div>';}).join('')||empty('No downtime events',''))+'</div>';
  } else {
    body='<div class="record-list">'+(events.map(function(e){return '<div class="record-item"><span><strong>'+escapeHTML(e.toState)+'</strong><small>'+formatTime(e.at)+' · '+escapeHTML(userName(e.userId))+'</small></span></div>';}).join('')||empty('No log',''))+'</div>';
  }
  return '<div class="detail-hero"><div><p class="eyebrow">'+escapeHTML(a.type)+' · '+escapeHTML(a.code)+'</p><h2>'+escapeHTML(a.name)+'</h2><p>'+escapeHTML(a.location||'')+'</p></div><div class="detail-hero-actions"><button class="secondary-btn" data-edit-asset="'+a.id+'">Edit</button><button class="secondary-btn" data-fire-event="'+a.id+'">Log asset event</button><div class="badges">'+badge(a.operatingState,a.operatingState==='Online'?'completed':'down')+' '+badge('Criticality '+a.criticality,'pending')+'</div></div></div>'+
    recordTabs([['details','Details'],['meters','Meter readings'],['pm','Scheduled maint.'],['bom','BOM'],['warranty','Warranties'],['work','Work orders'],['downtime','Downtime'],['log','Log']], assetTab, 'data-asset-tab')+
    '<div class="detail-body">'+body+'</div>';
}
function renderAssets(){
  const selected=asset(selectedAssetId)||state.assets[0];
  return crumb([{label:'Assets'},{label:'All assets'}])+
    pageHead('Assets','All assets','Region → site → facility → equipment → tools. This hierarchy is the Fiix asset tree.',
      '<button class="secondary-btn" id="assetMeterButton">'+icon('i-meter')+'Add reading</button><button class="primary-btn" data-new-asset>'+icon('i-plus')+'New asset</button>')+
    adminStrip('<button class="tool-btn primary" data-new-asset>'+icon('i-plus')+'New</button><button class="tool-btn" data-print-work>Print asset tags</button><span class="spacer"></span><span class="admin-count">'+state.assets.filter(function(a){return a.operatingState==='Offline';}).length+' offline · '+state.assets.length+' records</span>')+
    '<div class="asset-layout"><section class="tree-panel"><div class="tree-head"><p class="eyebrow">Asset hierarchy</p><h2>Regions → sites → facilities → equipment → tools</h2></div><div class="asset-tree">'+renderTree(null)+'</div></section><section class="detail-panel">'+assetDetail(selected)+'</section></div>';
}
function renderMeters(){
  const rows=state.meters.map(function(m){
    const readings=m.readings.slice().sort(function(a,b){return b.date.localeCompare(a.date);});
    return '<tr><td><strong>'+escapeHTML(m.name)+'</strong><small>'+escapeHTML(m.id)+'</small></td><td>'+escapeHTML(assetName(m.assetId))+'</td><td><strong>'+m.current+' '+escapeHTML(m.unit)+'</strong></td><td>'+prettyDate(readings[0].date)+'</td><td>'+readings.length+'</td><td><button class="secondary-btn" data-add-meter="'+m.id+'">Add reading</button></td></tr>';
  }).join('');
  return crumb([{label:'Assets'},{label:'Meters'}])+pageHead('Assets','Meters','Usage readings drive meter-based scheduled maintenance.','<button class="primary-btn" data-add-meter="">'+icon('i-plus')+'Add reading</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Meter</th><th>Asset</th><th>Current</th><th>Last reading</th><th>History</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderToolCrib(){
  const tools=state.assets.filter(function(a){return a.type==='Tool';});
  const rows=tools.map(function(t){
    return '<tr><td><strong>'+escapeHTML(t.name)+'</strong><small>'+escapeHTML(t.code)+'</small></td><td>'+escapeHTML(t.location)+'</td><td>'+badge(t.cribStatus||'In crib',t.cribStatus==='Checked out'?'attention':'completed')+'</td><td>'+(t.cribWorkOrderId||'—')+'</td><td>'+(t.cribStatus==='Checked out'?'<button class="tool-btn" data-crib="in|'+t.id+'">Check in</button>':'<button class="tool-btn" data-crib="out|'+t.id+'">Check out</button>')+'</td></tr>';
  }).join('');
  return crumb([{label:'Assets'},{label:'Tool crib'}])+pageHead('Assets','Tool crib','Check tools in and out so technicians are not delayed by missing equipment.','')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Tool</th><th>Home location</th><th>Status</th><th>Work order</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderParts(){
  const rows=state.parts.map(function(p){
    const qty=totalStock(p), min=minStock(p), low=qty<=min;
    return '<tr><td><button class="link-btn" data-open-part="'+p.id+'"><strong>'+escapeHTML(p.code)+'</strong></button></td><td><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.category)+'</small></td><td>'+qty+'</td><td>'+min+'</td><td>'+escapeHTML(p.locations.map(function(l){return l.name;}).join(', '))+'</td><td>'+money(p.unitCost)+'</td><td>'+escapeHTML(supplierName(p.preferredVendorId))+'</td><td>'+badge(low?'Below min':'In stock',low?'down':'completed')+'</td></tr>';
  }).join('');
  const lowCount=state.parts.filter(function(p){return totalStock(p)<=minStock(p);}).length;
  return crumb([{label:'Inventory'},{label:'Parts & supplies'}])+
    pageHead('Inventory','Parts catalog','Central parts records: type, make, model, cost, vendors, stock and location.','<button class="primary-btn" data-supply-action="part">'+icon('i-plus')+'New part</button>')+
    adminStrip('<button class="tool-btn primary" data-supply-action="part">New part</button><button class="tool-btn" data-supply-action="receive">Receive stock</button><button class="tool-btn" data-route-jump="cycle-counts">Cycle counts</button><span class="spacer"></span><span class="admin-count">'+lowCount+' below minimum</span>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Part code</th><th>Part</th><th>On hand</th><th>Min</th><th>Stock location</th><th>Last cost</th><th>Preferred vendor</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderPartRecord(id){
  const p=part(id); if(!p) return pageHead('Parts','Not found','');
  let body='';
  if(partTab==='details'){
    body='<div class="info-grid"><div class="info-cell"><small>Make / model</small><strong>'+escapeHTML([p.make,p.model].filter(Boolean).join(' · ')||'—')+'</strong></div><div class="info-cell"><small>Category</small><strong>'+escapeHTML(p.category)+'</strong></div><div class="info-cell"><small>Unit cost</small><strong>'+money(p.unitCost)+'</strong></div><div class="info-cell"><small>Reorder qty</small><strong>'+p.reorderQty+'</strong></div><div class="info-cell"><small>Auto-reorder</small><strong>'+(p.autoReorder?'Yes':'No')+'</strong></div><div class="info-cell"><small>Preferred vendor</small><strong>'+escapeHTML(supplierName(p.preferredVendorId))+'</strong></div></div>';
  } else if(partTab==='stock'){
    body='<div class="record-list">'+p.locations.map(function(l){return '<div class="record-item"><span><strong>'+escapeHTML(l.name)+'</strong><small>Min '+l.min+' · Max '+l.max+'</small></span><strong>'+l.onHand+'</strong></div>';}).join('')+'</div><h3 style="font-size:.85rem">FIFO lots</h3><div class="record-list">'+(p.fifoLots||[]).map(function(l){return '<div class="record-item"><span>'+formatTime(l.receivedAt)+'</span><strong>'+l.qty+' @ '+money(l.unitCost)+'</strong></div>';}).join('')+'</div>';
  } else {
    body='<div class="worklog">'+(p.transactions||[]).map(function(t){return '<div class="log-row"><time>'+formatTime(t.at)+'</time><span>'+escapeHTML(t.type)+' '+t.qty+' · '+escapeHTML(t.location||'')+(t.workOrderId?' · '+t.workOrderId:'')+'</span></div>';}).join('')+'</div>';
  }
  return '<div class="record-page">'+crumb([{label:'Inventory',route:'parts'},{label:'Parts catalog',route:'parts'},{label:p.code}])+
    '<div class="record-bar"><div><p class="eyebrow">Part / supply</p><h1>'+escapeHTML(p.code)+' · '+escapeHTML(p.name)+'</h1><p>On hand '+totalStock(p)+' · min '+minStock(p)+'</p></div><div class="record-bar-actions"><button class="secondary-btn" data-supply-action="receive" data-part-id="'+p.id+'">Receive</button><button class="secondary-btn" data-supply-action="count" data-part-id="'+p.id+'">Cycle count</button></div></div>'+
    recordTabs([['details','Details'],['stock','Stock'],['log','Log']], partTab, 'data-part-tab')+'<div class="detail-body">'+body+'</div></div>';
}

function renderPlanningBoard(){
  const rows=state.purchaseRequests.filter(function(r){return r.status==='Open';}).map(function(r){
    const p=part(r.partId);
    return '<tr><td><strong>'+escapeHTML(r.id)+'</strong></td><td><strong>'+escapeHTML(partName(r.partId))+'</strong><small>'+escapeHTML(p?p.code:'')+' · on hand '+(p?totalStock(p):0)+' / min '+(p?minStock(p):0)+'</small></td><td>'+r.quantity+'</td><td>'+escapeHTML(supplierName(r.vendorId))+'</td><td>'+escapeHTML(r.reason)+'</td><td><button class="tool-btn" data-plan-po="'+r.id+'">Create PO</button><button class="tool-btn" data-plan-rfq="'+r.id+'">Create RFQ</button><button class="tool-btn" data-plan-dismiss="'+r.id+'">Dismiss</button></td></tr>';
  }).join('')||'<tr><td colspan="6" class="table-empty">No purchase requests. Parts stay off this board until they fall below minimum.</td></tr>';
  return crumb([{label:'Inventory'},{label:'Purchase planning board'}])+
    pageHead('Inventory','Purchase planning board','When a part is consumed below minimum quantity, Fiix creates a purchase request here for PO or RFQ.','')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Request</th><th>Part</th><th>Reorder qty</th><th>Preferred vendor</th><th>Reason</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderPurchaseOrders(){
  const rows=state.purchaseOrders.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}).map(function(po){
    const next=po.status==='Draft'?'Approve':po.status==='Approved'?'Mark ordered':po.status==='Ordered'?'Receive':'Received';
    return '<tr><td><strong>'+escapeHTML(po.id)+'</strong><small>'+(po.workOrderId?('WO '+po.workOrderId):'Not linked')+'</small></td><td>'+escapeHTML(supplierName(po.supplierId))+'</td><td><strong>'+escapeHTML(partName(po.partId))+'</strong></td><td>'+po.quantity+'</td><td>'+money(po.quantity*po.unitCost)+'</td><td>'+prettyDate(po.expectedDate)+'</td><td>'+badge(po.status,po.status==='Received'?'completed':po.status==='Draft'?'pending':'progress')+'</td><td><button class="tool-btn" data-po-action="'+po.id+'" '+(po.status==='Received'?'disabled':'')+'>'+next+'</button></td></tr>';
  }).join('');
  return crumb([{label:'Inventory'},{label:'Purchase orders'}])+
    pageHead('Inventory','Purchase orders','Draft → Approved → Ordered → Received. Receiving posts a receipt and updates on-hand stock. POs can be linked to work orders.',
      '<button class="primary-btn" data-supply-action="po">'+icon('i-plus')+'New purchase order</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>PO</th><th>Vendor</th><th>Part</th><th>Qty</th><th>Total</th><th>Expected</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderRfqs(){
  const rows=state.rfqs.map(function(r){
    return '<tr><td><strong>'+escapeHTML(r.id)+'</strong></td><td>'+escapeHTML(supplierName(r.vendorId))+'</td><td>'+escapeHTML(partName(r.partId))+'</td><td>'+r.quantity+'</td><td>'+badge(r.status,'pending')+'</td><td>'+formatTime(r.createdAt)+'</td><td>'+(r.status==='Sent'?'<button class="tool-btn" data-rfq-po="'+r.id+'">Convert to PO</button>':'')+'</td></tr>';
  }).join('')||'<tr><td colspan="7" class="table-empty">No RFQs.</td></tr>';
  return crumb([{label:'Inventory'},{label:'RFQs'}])+pageHead('Inventory','Requests for quote','Send RFQs to preferred vendors, then convert quoted lines into purchase orders.','')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>RFQ</th><th>Vendor</th><th>Part</th><th>Qty</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderVendors(){
  const rows=state.suppliers.map(function(s){
    const open=state.purchaseOrders.filter(function(po){return po.supplierId===s.id&&po.status!=='Received';}).length;
    return '<tr><td><strong>'+escapeHTML(s.name)+'</strong><small>'+escapeHTML(s.id)+'</small></td><td>'+escapeHTML(s.contact||'—')+'</td><td>'+escapeHTML(s.phone||'—')+'</td><td>'+escapeHTML(s.email||'—')+'</td><td>'+open+'</td><td>'+badge(s.preferred?'Preferred':'Vendor',s.preferred?'healthy':'pending')+'</td></tr>';
  }).join('');
  return crumb([{label:'Inventory'},{label:'Vendors'}])+pageHead('Inventory','Vendors','Preferred vendors, contacts and purchase history. Fiix stores vendor, part and asset information together.','<button class="primary-btn" data-supply-action="supplier">'+icon('i-plus')+'New vendor</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Vendor</th><th>Contact</th><th>Phone</th><th>Email</th><th>Open POs</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderReceipts(){
  const rows=state.receipts.slice().sort(function(a,b){return b.receivedAt.localeCompare(a.receivedAt);}).map(function(r){
    return '<tr><td><strong>'+escapeHTML(r.id)+'</strong><small>'+escapeHTML(r.reference||'')+'</small></td><td>'+escapeHTML(partName(r.partId))+'</td><td>'+r.quantity+'</td><td>'+escapeHTML(r.location)+'</td><td>'+escapeHTML(supplierName(r.supplierId))+'</td><td>'+formatTime(r.receivedAt)+'</td></tr>';
  }).join('');
  return crumb([{label:'Inventory'},{label:'Receipts'}])+pageHead('Inventory','Receipts','Keep a record of every stock receipt, including PO receipts.','<button class="primary-btn" data-supply-action="receive">'+icon('i-truck')+'Receive stock</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Part</th><th>Qty</th><th>Location</th><th>Vendor</th><th>Received</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderCounts(){
  const rows=state.cycleCounts.slice().sort(function(a,b){return b.countedAt.localeCompare(a.countedAt);}).map(function(c){
    return '<tr><td><strong>'+escapeHTML(c.id)+'</strong></td><td>'+escapeHTML(partName(c.partId))+'</td><td>'+escapeHTML(c.location)+'</td><td>'+c.expected+'</td><td>'+c.counted+'</td><td>'+badge((c.variance>0?'+':'')+c.variance,c.variance===0?'completed':'attention')+'</td><td>'+formatTime(c.countedAt)+'</td></tr>';
  }).join('');
  return crumb([{label:'Inventory'},{label:'Cycle counts'}])+pageHead('Inventory','Cycle counts','Count subsets of inventory without stopping operations. Posting writes the variance and who counted.','<button class="primary-btn" data-supply-action="count">'+icon('i-clipboard')+'New count</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Count</th><th>Part</th><th>Location</th><th>Expected</th><th>Counted</th><th>Variance</th><th>When</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderAnalytics(){
  const completed=state.workOrders.filter(function(w){return w.status==='Completed'||w.status==='Closed';});
  const planned=state.workOrders.filter(function(w){return w.type==='Preventive';}).length;
  const ratio=state.workOrders.length?Math.round(planned/state.workOrders.length*100):0;
  const downtime=state.assetEvents.filter(function(e){return e.toState==='Offline';}).length;
  return crumb([{label:'Analytics'}])+
    pageHead('Analytics','Reports & KPIs','Scheduled compliance, MTTR, planned vs reactive mix, inventory risk and asset cost.','')+
    '<div class="report-grid">'+
      '<article class="report-card"><p class="eyebrow">Scheduled compliance</p><h3>'+scheduledCompliance()+'%</h3><p>Preventive work completed on or before suggested completion this month.</p></article>'+
      '<article class="report-card"><p class="eyebrow">MTTR</p><h3>'+mttrHours()+' hours</h3><p>Average create-to-complete time on corrective and emergency work.</p></article>'+
      '<article class="report-card"><p class="eyebrow">Planned work</p><h3>'+ratio+'% preventive</h3><p>'+planned+' of '+state.workOrders.length+' work orders are preventive.</p></article>'+
      '<article class="report-card"><p class="eyebrow">Backlog</p><h3>'+state.workOrders.filter(isActive).length+' active</h3><p>'+state.workOrders.filter(overdue).length+' late. '+downtime+' recorded downtime events.</p></article>'+
      '<article class="report-card"><p class="eyebrow">Closed labor</p><h3>'+(completed.length?Math.round(completed.reduce(function(s,w){return s+laborMinutes(w);},0)/completed.length):0)+' min avg</h3><p>Average logged labor on completed work.</p></article>'+
      '<article class="report-card"><p class="eyebrow">Inventory</p><h3>'+state.parts.filter(function(p){return totalStock(p)<=minStock(p);}).length+' below min</h3><p>'+state.purchaseRequests.filter(function(r){return r.status==='Open';}).length+' open purchase requests on the planning board.</p></article>'+
    '</div>';
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
    const exp=(u.certifications||[]).filter(function(c){return c.expiry<=day(60);});
    return '<tr><td><strong>'+escapeHTML(u.name)+'</strong><small>'+escapeHTML(u.email)+' · '+escapeHTML(u.group)+' · '+money(u.hourlyRate)+'/h</small></td><td><select class="table-select" data-user-role="'+u.id+'">'+roles.map(function(role){return '<option '+(u.role===role?'selected':'')+'>'+escapeHTML(role)+'</option>';}).join('')+'</select></td><td>'+badge(u.active?'Active':'Inactive',u.active?'completed':'pending')+'</td><td>'+badge(u.mfa?'MFA enrolled':'Not enrolled',u.mfa?'completed':'attention')+'</td><td>'+(exp.length?badge(exp.length+' expiring','attention'):'—')+'</td><td><label class="table-toggle"><input type="checkbox" data-email-alert="'+u.id+'" '+(u.emailAlerts?'checked':'')+'> Email</label></td><td><button class="tool-btn" data-user-active="'+u.id+'">'+(u.active?'Deactivate':'Activate')+'</button></td></tr>';
  }).join('');
  return crumb([{label:'Administration'},{label:'Users & groups'}])+
    pageHead('Administration','Users & groups','User groups, hourly rates, certification tracking and notification preferences.','')+
    '<div class="boundary-banner">'+icon('i-shield')+'<div><strong>Hourly rates feed work-order labor cost</strong><span>Fiix uses user rates on labor tasks to calculate work order and asset cost.</span></div></div>'+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>User</th><th>Role</th><th>Access</th><th>MFA</th><th>Certifications</th><th>Alerts</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderNotifications(){
  const mine=state.notifications.filter(function(n){return n.userId===CURRENT_USER;}).sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);});
  const items=mine.map(function(n){return '<article class="notification-item '+(!n.read?'unread':'')+'"><span class="notification-severity '+statusClass(n.severity)+'">'+icon(n.severity==='Critical'?'i-alert':'i-bell')+'</span><div><div class="notification-title"><strong>'+escapeHTML(n.title)+'</strong>'+badge(n.severity,n.severity)+'</div><p>'+escapeHTML(n.message)+'</p><small>'+formatTime(n.createdAt)+'</small></div><button class="tool-btn" data-mark-notification="'+n.id+'">'+(n.read?'Mark unread':'Mark read')+'</button></article>';}).join('')||empty('No alerts','');
  const outbox=state.mailOutbox.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}).map(function(m){return '<tr><td>'+escapeHTML(m.to)+'</td><td>'+escapeHTML(m.subject)+'</td><td>'+formatTime(m.createdAt)+'</td><td>'+badge(m.status,'pending')+'</td></tr>';}).join('');
  return crumb([{label:'Administration'},{label:'Notifications'}])+
    pageHead('Administration','Notifications','In-app and email copies for assignments, asset downtime and low stock.','<button class="primary-btn" data-compose-message>'+icon('i-mail')+'Announcement</button>')+
    '<div class="admin-strip"><button class="tool-btn" data-mark-all-read>Mark all read</button></div>'+
    '<section class="admin-grid"><article class="card"><div class="card-head"><div><p class="eyebrow">In-app</p><h2>My alerts</h2></div></div><div class="notification-list">'+items+'</div></article><article><div class="table-wrap"><table class="data-table compact-table"><thead><tr><th>To</th><th>Subject</th><th>Created</th><th>Status</th></tr></thead><tbody>'+outbox+'</tbody></table></div></article></section>';
}
function renderSettings(){
  const L=state.lookups;
  function chips(key,arr){ return '<div class="lookup-block"><h3>'+escapeHTML(key)+'</h3><div class="chip-row">'+arr.map(function(x){return '<span class="badge">'+escapeHTML(x)+'</span>';}).join('')+'</div></div>'; }
  return crumb([{label:'Administration'},{label:'CMMS settings'}])+
    pageHead('Administration','CMMS settings','Lookup tables for work-order status, maintenance type, priority, downtime reasons and failure codes.','')+
    '<div class="settings-grid">'+chips('Work order statuses',WO_STATUSES)+chips('Maintenance types',MAINT_TYPES)+chips('Priorities',PRIORITIES)+chips('Downtime reasons',L.downtimeReasons)+chips('Problem codes',L.problems)+chips('Cause codes',L.causes)+chips('Action codes',L.actions)+'</div>'+
    '<p class="form-note">These are the same lookup families Fiix exposes under Settings → CMMS Settings → Lookup Tables.</p>';
}
function renderAudit(){
  const rows=state.auditLog.slice().sort(function(a,b){return b.at.localeCompare(a.at);}).map(function(x){return '<tr><td>'+formatTime(x.at)+'</td><td>'+escapeHTML(userName(x.userId))+'</td><td>'+escapeHTML(x.action)+'</td><td>'+escapeHTML(x.entityType)+' <strong>'+escapeHTML(x.entityId)+'</strong></td><td>'+escapeHTML(x.detail||'—')+'</td></tr>';}).join('');
  return crumb([{label:'Administration'},{label:'Audit trail'}])+pageHead('Administration','Audit trail','Every important change is recorded.','<button class="secondary-btn" data-print-work>Print</button>')+
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Record</th><th>Detail</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderSecurity(){
  const s=state.securitySettings;
  const rows=Object.keys(ROLE_PERMISSIONS).map(function(role){return '<tr><td><strong>'+escapeHTML(role)+'</strong></td><td>'+escapeHTML(ROLE_PERMISSIONS[role])+'</td></tr>';}).join('');
  return crumb([{label:'Administration'},{label:'Security'}])+
    pageHead('Administration','Security','Session timeout, MFA policy and role permissions.','')+
    '<section class="security-layout"><form class="card card-pad security-form" id="securityForm"><p class="eyebrow">Policy</p><h2>Access policy</h2><label>Idle session timeout<select name="sessionTimeout"><option value="15">15 minutes</option><option value="30" '+(s.sessionTimeout===30?'selected':'')+'>30 minutes</option><option value="60" '+(s.sessionTimeout===60?'selected':'')+'>60 minutes</option></select></label><label>Lock after failed attempts<select name="lockAfterAttempts"><option value="3" '+(Number(s.lockAfterAttempts)===3?'selected':'')+'>3</option><option value="5" '+(Number(s.lockAfterAttempts)===5?'selected':'')+'>5</option><option value="10" '+(Number(s.lockAfterAttempts)===10?'selected':'')+'>10</option></select></label><label>Audit retention<select name="auditRetentionDays"><option value="90" '+(Number(s.auditRetentionDays)===90?'selected':'')+'>90 days</option><option value="365" '+(Number(s.auditRetentionDays)===365?'selected':'')+'>365 days</option><option value="730" '+(Number(s.auditRetentionDays)===730?'selected':'')+'>2 years</option></select></label><label class="check-row"><input type="checkbox" name="requireMfaForManagers" '+(s.requireMfaForManagers?'checked':'')+'> Require MFA for managers</label><button class="primary-btn" type="submit">Save policy</button></form><article><div class="table-wrap"><table class="data-table compact-table"><thead><tr><th>Role</th><th>Allowed work</th></tr></thead><tbody>'+rows+'</tbody></table></div></article></section>';
}

function populateSelects(){
  const equipment=state.assets.filter(function(a){return a.type==='Equipment'||a.type==='Facility'||a.type==='Tool';});
  const opts=equipment.map(function(a){return '<option value="'+a.id+'">'+escapeHTML(a.name)+' · '+escapeHTML(a.code)+'</option>';}).join('');
  const wa=document.getElementById('workAssetSelect'); if(wa) wa.innerHTML=opts;
  const ws=document.getElementById('workSecondaryAssetSelect'); if(ws) ws.innerHTML='<option value="">None — single-asset WO</option>'+opts;
  const ra=document.getElementById('requestAssetSelect'); if(ra) ra.innerHTML=opts;
  const asg=document.getElementById('workAssigneeSelect'); if(asg) asg.innerHTML=state.users.filter(function(u){return u.active;}).map(function(u){return '<option value="'+u.id+'">'+escapeHTML(u.name)+' · '+escapeHTML(u.role)+'</option>';}).join('');
  const ms=document.getElementById('meterSelect'); if(ms) ms.innerHTML=state.meters.map(function(m){return '<option value="'+m.id+'">'+escapeHTML(assetName(m.assetId))+' · '+escapeHTML(m.name)+'</option>';}).join('');
  const pr=document.getElementById('workProjectSelect'); if(pr) pr.innerHTML='<option value="">No project</option>'+optionList(state.projects,function(p){return p.name;},function(p){return p.id;});
  const dr=document.getElementById('downtimeReasonSelect'); if(dr) dr.innerHTML=state.lookups.downtimeReasons.map(function(x){return '<option>'+escapeHTML(x)+'</option>';}).join('');
}
function openWorkDialog(assetId){
  populateSelects(); const form=document.getElementById('workForm'); form.reset();
  form.elements.suggestedStart.value=day(0); form.elements.due.value=day(1); if(assetId) form.elements.assetId.value=assetId;
  document.getElementById('workDialog').showModal(); setTimeout(function(){form.elements.title.focus();},0);
}
function openRequestDialog(){
  populateSelects(); const form=document.getElementById('requestForm'); form.reset();
  form.elements.requester.value=userName(CURRENT_USER);
  document.getElementById('requestDialog').showModal();
}
function openMeterDialog(meterId, taskRef){
  populateSelects(); const form=document.getElementById('meterForm'); form.reset();
  if(meterId) form.elements.meterId.value=meterId;
  pendingMeterTask=taskRef||null;
  document.getElementById('meterDialog').showModal();
}
function blankWork(partial){
  const now=new Date().toISOString();
  return Object.assign({
    id:nextWorkId(), status:'Open', suggestedStart:day(0), due:day(1), estimateHours:1, actualMinutes:0,
    secondaryAssetId:'', projectId:'', source:'Manual', instructions:'',
    tasks:[{id:newTaskId(),type:'General',text:'Confirm equipment condition and make work area safe',status:'Todo',estimateHours:0.25,hoursSpent:0},{id:newTaskId(),type:'General',text:'Complete maintenance action and verify operation',status:'Todo',estimateHours:0.75,hoursSpent:0}],
    parts:[], laborEntries:[], miscCosts:[], files:[], failureCodes:{problem:'',cause:'',action:''}, completionNotes:'',
    createdAt:now, completedAt:null, log:[{at:now,text:'Work order created by '+userName(CURRENT_USER)}]
  }, partial);
}

function nestedTasks(p){
  const iteration=(p.iteration||0)+1;
  if(!p.nested||!p.nested.length) return {iteration:iteration, tasks:p.tasks, parts:p.parts};
  const include=new Set(p.nested.filter(function(n){return iteration%n.multiplier===0;}).map(function(n){return n.id;}));
  if(!include.size) p.nested.filter(function(n){return n.multiplier===1;}).forEach(function(n){include.add(n.id);});
  return {
    iteration:iteration,
    tasks:p.tasks.filter(function(t){return !t.nestedId||include.has(t.nestedId);}),
    parts:p.parts.filter(function(x){return !x.nestedId||include.has(x.nestedId);})
  };
}
function createWorkFromPM(p, manual){
  if(!manual && p.skipIfOpen){
    const open=state.workOrders.find(function(w){return w.sourcePmId===p.id&&isActive(w);});
    if(open) return null;
  }
  const pack=nestedTasks(p);
  p.iteration=pack.iteration;
  const w=blankWork({
    title:p.name, assetId:p.assetId, type:'Preventive', priority:'Medium', assigneeId:(asset(p.assetId)&&asset(p.assetId).responsibleUserIds[0])||'U-2',
    due:day(p.dueLead||2), estimateHours:Math.max(1, pack.tasks.length*0.5), source:p.id, sourcePmId:p.id,
    instructions:'Generated from scheduled maintenance '+p.id+'. Complete the planned labor tasks and record actual parts and labor.',
    tasks:pack.tasks.map(function(t){return Object.assign({id:newTaskId(),status:'Todo',result:null,estimateHours:t.estimateHours||0.5,hoursSpent:0,notes:''}, clone(t));}),
    parts:pack.parts.map(function(x){return {partId:x.partId,planned:x.planned||1,actual:0};}),
    log:[{at:new Date().toISOString(),text:(manual?'Manually generated':'Automatically generated')+' from '+p.id+(p.nested&&p.nested.length?' · nested iteration '+p.iteration:'')}]
  });
  p.generatedWorkIds=p.generatedWorkIds||[]; p.generatedWorkIds.unshift(w.id);
  state.workOrders.unshift(w);
  notifyUsers([w.assigneeId], 'Work order assigned: '+w.id, w.title+' was generated from '+p.id+' and assigned to you.', 'Information', 'Work order', w.id, true);
  save('Generated '+w.id+' from '+p.id);
  return w;
}
function advancePM(p){
  if(p.trigger.type==='time'){
    if(p.mode==='floating') p.trigger.nextDue=day(p.trigger.intervalDays);
    else {
      let d=new Date(p.trigger.nextDue+'T12:00:00'); const now=new Date(day(0)+'T12:00:00');
      do { d.setDate(d.getDate()+p.trigger.intervalDays); } while(d<=now);
      p.trigger.nextDue=d.toISOString().slice(0,10);
    }
  } else if(p.trigger.type==='meter'){
    const m=meter(p.trigger.meterId); if(!m) return;
    if(p.mode==='floating') p.trigger.nextThreshold=m.current+p.trigger.intervalValue;
    else while(p.trigger.nextThreshold<=m.current) p.trigger.nextThreshold+=p.trigger.intervalValue;
  }
}
function evaluatePM(showMessage){
  let generated=0;
  state.pm.filter(function(p){return p.status==='Running';}).forEach(function(p){
    let fire=false;
    if(p.trigger.type==='time') fire=p.trigger.nextDue<=day(0);
    else if(p.trigger.type==='meter'){ const m=meter(p.trigger.meterId); fire=!!m&&m.current>=p.trigger.nextThreshold; }
    if(fire){ const w=createWorkFromPM(p,false); if(w){ advancePM(p); generated++; } else if(p.trigger.type==='time'||p.trigger.type==='meter'){ /* skip but do not advance if blocked */ } }
  });
  if(generated){ save('Evaluated scheduled maintenance'); render(); }
  if(showMessage) toast(generated?generated+' work order'+(generated===1?'':'s')+' generated':'No scheduled maintenance trigger is due');
}

function usePart(workId, partId){
  const w=work(workId), p=part(partId); if(!w||!p) return;
  const loc=p.locations.find(function(l){return l.onHand>0;});
  if(!loc){ toast('No stock available for '+p.name); return; }
  loc.onHand-=1;
  consumeFifo(p,1);
  const line=w.parts.find(function(x){return x.partId===partId;}); if(line) line.actual+=1;
  p.transactions.unshift({at:new Date().toISOString(),type:'Issue',qty:-1,workOrderId:w.id,location:loc.name});
  logWork(w,'Issued 1 × '+p.name+' from '+loc.name+' (FIFO)');
  queueReorder(p, 'Consumed on '+w.id, w.id);
  addAudit('Part issued','Work order',w.id,p.code);
  save('Issued part to '+w.id); render(); toast('Part issued to '+w.id);
}
function convertRequest(id, fromApprove){
  const r=state.requests.find(function(x){return x.id===id;}); if(!r||(r.status!=='Requested'&&r.status!=='Approved')) return;
  const w=blankWork({
    title:r.summary, assetId:r.assetId, type:'Corrective',
    priority:r.urgency==='Safety critical'?'Critical':r.urgency==='Urgent'?'High':'Medium',
    assigneeId:'U-2', due:day(r.urgency==='Normal'?3:1), source:r.id,
    instructions:'Created from work request '+r.id+' by '+r.requester+'. Confirm the reported condition, make safe and document the repair.',
    tasks:[{id:newTaskId(),type:'Inspection',text:'Confirm reported condition',status:'Todo',result:null,estimateHours:0.25,hoursSpent:0},{id:newTaskId(),type:'General',text:'Complete repair or containment action',status:'Todo',estimateHours:1,hoursSpent:0}]
  });
  state.workOrders.unshift(w); r.status='Converted'; r.workOrderId=w.id;
  addAudit('Work request converted','Work request',r.id,w.id);
  save('Converted '+r.id+' to '+w.id); render(); toast(w.id+' created');
  if(!fromApprove) navigate('work-orders', w.id);
}
function createFollowOnFromTask(parent, t){
  if(!parent||!t||t.followOnWorkId) return t&&t.followOnWorkId;
  const w=blankWork({
    title:'Corrective action: '+t.text, assetId:parent.assetId, type:'Corrective', priority:'High', assigneeId:parent.assigneeId, due:day(1), source:parent.id,
    instructions:'Generated from a failed inspection task on '+parent.id+'. Confirm the defect, correct it safely and document verification.',
    tasks:[{id:newTaskId(),type:'Inspection',text:'Confirm the reported defect',status:'Todo',result:null},{id:newTaskId(),type:'General',text:'Complete corrective action and verify operation',status:'Todo'}]
  });
  state.workOrders.unshift(w); t.followOnWorkId=w.id; logWork(parent,'Failed inspection generated follow-on '+w.id);
  return w.id;
}
function completeWork(id){
  const w=work(id); if(!w) return;
  const incomplete=w.tasks.filter(function(t){return t.status!=='Done';});
  if(incomplete.length){ toast('Complete all '+incomplete.length+' remaining labor tasks first'); navigate('work-orders', id); recordTab='tasks'; render(); return; }
  w.status='Completed'; w.completedAt=new Date().toISOString();
  if(!String(w.completionNotes||'').trim()) w.completionNotes='Completed by '+userName(CURRENT_USER);
  logWork(w,'Work order completed by '+userName(CURRENT_USER));
  const a=asset(w.assetId); if(a&&a.operatingState==='Offline'&&w.type!=='Preventive'){ /* leave offline until explicitly returned */ }
  addAudit('Work order completed','Work order',id,'');
  save('Completed '+id); render(); toast(id+' completed');
}
function closeWork(id){
  const w=work(id); if(!w) return;
  if(isActive(w)){
    const incomplete=w.tasks.filter(function(t){return t.status!=='Done';});
    if(incomplete.length){ toast('Complete labor tasks before Close, Complete'); navigate('work-orders', id); recordTab='tasks'; render(); return; }
    w.status='Completed'; w.completedAt=w.completedAt||new Date().toISOString();
    if(!String(w.completionNotes||'').trim()) w.completionNotes='Completed by '+userName(CURRENT_USER);
  }
  w.status='Closed';
  logWork(w,'Work order closed by '+userName(CURRENT_USER));
  addAudit('Work order closed','Work order',id,'');
  save('Closed '+id); render(); toast(id+' closed');
}
function saveWorkFields(id){
  const w=work(id); if(!w) return;
  document.querySelectorAll('[data-wo-field]').forEach(function(el){
    const k=el.getAttribute('data-wo-field');
    w[k]=el.type==='number'?Number(el.value):el.value;
  });
  document.querySelectorAll('[data-fail-field]').forEach(function(el){
    w.failureCodes=w.failureCodes||{}; w.failureCodes[el.getAttribute('data-fail-field')]=el.value;
  });
  logWork(w,'Record saved by '+userName(CURRENT_USER));
  addAudit('Work order saved','Work order',id,'');
  save('Saved '+id); toast(id+' saved');
}

function openAssetDialog(id){
  const form=document.getElementById('assetForm'), a=id?asset(id):null; form.reset();
  const descendants=new Set();
  (function collect(parent){ childrenOf(parent).forEach(function(x){ descendants.add(x.id); collect(x.id); }); })(id||'__none__');
  document.getElementById('assetParentSelect').innerHTML='<option value="">No parent (top of hierarchy)</option>'+state.assets.filter(function(x){return !a||x.id!==a.id&&!descendants.has(x.id);}).map(function(x){return '<option value="'+x.id+'">'+escapeHTML(x.code+' · '+x.name)+'</option>';}).join('');
  document.getElementById('assetResponsibleSelect').innerHTML='<option value="">Not assigned</option>'+state.users.filter(function(u){return u.active;}).map(function(u){return '<option value="'+u.id+'">'+escapeHTML(u.name+' · '+u.role)+'</option>';}).join('');
  const vs=document.getElementById('assetVendorSelect'); if(vs) vs.innerHTML='<option value="">None</option>'+optionList(state.suppliers,function(s){return s.name;},function(s){return s.id;},a&&a.vendorId);
  document.getElementById('assetDialogTitle').textContent=a?'Edit asset':'Create asset';
  form.elements.assetId.value=a?a.id:'';
  if(a){
    ['code','name','type','criticality','location','manufacturer','model','serial','commissioned'].forEach(function(k){ if(form.elements[k]) form.elements[k].value=a[k]||''; });
    form.elements.parentId.value=a.parentId||''; form.elements.responsibleUserId.value=(a.responsibleUserIds||[])[0]||'';
    if(form.elements.vendorId) form.elements.vendorId.value=a.vendorId||'';
    if(form.elements.warrantyExpiry) form.elements.warrantyExpiry.value=(a.warranties&&a.warranties[0]&&a.warranties[0].expiry)||'';
  } else { form.elements.criticality.value='B'; form.elements.type.value='Equipment'; }
  document.getElementById('assetDialog').showModal();
}
function openAssetStateDialog(id){
  const a=asset(id); if(!a) return;
  const next=a.operatingState==='Online'?'Offline':'Online', form=document.getElementById('assetStateForm'); form.reset();
  populateSelects();
  form.elements.assetId.value=a.id; form.elements.nextState.value=next; form.elements.createWork.checked=next==='Offline';
  document.getElementById('assetStateTitle').textContent=(next==='Offline'?'Take offline: ':'Return online: ')+a.name;
  document.getElementById('assetStateSubmit').textContent=next==='Offline'?'Confirm offline':'Confirm online';
  document.getElementById('expectedReturnLabel').hidden=next==='Online';
  document.getElementById('correctiveWorkLabel').hidden=next==='Online';
  const recipients=assetStakeholders(a).map(user).filter(Boolean);
  document.getElementById('assetAlertRecipients').innerHTML='<strong>'+recipients.length+' people will be alerted</strong><span>'+escapeHTML(recipients.map(function(u){return u.name+' ('+u.email+')';}).join(', '))+'</span>';
  document.getElementById('assetStateDialog').showModal();
}
function handleAssetSubmit(e){
  e.preventDefault(); const f=new FormData(e.currentTarget), existing=f.get('assetId')?asset(f.get('assetId')):null, code=String(f.get('code')).trim().toUpperCase();
  if(state.assets.some(function(a){return a.code.toUpperCase()===code&&(!existing||a.id!==existing.id);})){ toast('That asset code already exists'); return; }
  const a=existing||{id:nextRecordId('AST',state.assets,0),operatingState:'Online',bom:[],warranties:[],responsibleUserIds:[]};
  Object.assign(a,{code:code,name:String(f.get('name')).trim(),type:f.get('type'),parentId:f.get('parentId')||null,criticality:f.get('criticality'),location:String(f.get('location')).trim(),manufacturer:String(f.get('manufacturer')||'').trim(),model:String(f.get('model')||'').trim(),serial:String(f.get('serial')||'').trim(),commissioned:f.get('commissioned')||'',vendorId:f.get('vendorId')||'',responsibleUserIds:f.get('responsibleUserId')?[f.get('responsibleUserId')]:[]});
  if(f.get('warrantyExpiry')) a.warranties=[{provider:supplierName(a.vendorId)||'Vendor',expiry:f.get('warrantyExpiry'),notes:''}];
  if(!existing) state.assets.push(a);
  selectedAssetId=a.id; assetTab='details';
  addAudit(existing?'Asset updated':'Asset created','Asset',a.id,a.code+' · '+a.name);
  save(existing?'Updated '+a.id:'Created '+a.id); document.getElementById('assetDialog').close(); populateSelects(); render(); toast(a.code+' saved');
}
function handleAssetStateSubmit(e){
  e.preventDefault(); const f=new FormData(e.currentTarget), a=asset(f.get('assetId')); if(!a) return;
  const from=a.operatingState, next=f.get('nextState'), reason=String(f.get('reason')).trim(), now=new Date().toISOString();
  a.operatingState=next; if(next==='Offline') a.status='Down'; else if(a.status==='Down') a.status='Attention';
  state.assetEvents.unshift({id:'AE-'+Date.now(),assetId:a.id,fromState:from,toState:next,reasonCode:f.get('reasonCode')||'',reason:reason,expectedReturn:f.get('expectedReturn')||'',at:now,userId:CURRENT_USER});
  let workId='';
  if(next==='Offline'&&f.get('createWork')){
    const w=blankWork({title:'Restore '+a.name+' to service',assetId:a.id,type:'Corrective',priority:a.criticality==='A'?'Critical':'High',assigneeId:(a.responsibleUserIds||[])[0]||'U-2',due:day(1),source:'Asset state change',instructions:'Asset was taken offline: '+reason+'. Diagnose, correct safely and verify readiness before returning it online.',tasks:[{id:newTaskId(),type:'Inspection',text:'Diagnose reason for outage',status:'Todo',result:null},{id:newTaskId(),type:'General',text:'Complete corrective action',status:'Todo'},{id:newTaskId(),type:'Inspection',text:'Verify safe return to service',status:'Todo',result:null}]});
    state.workOrders.unshift(w); workId=w.id;
  }
  if(next==='Offline'){
    state.pm.filter(function(p){return p.assetId===a.id&&p.trigger.type==='event'&&p.trigger.eventType==='Breakdown';}).forEach(function(p){ createWorkFromPM(p,true); });
  }
  const detail=a.code+' · '+a.name+' was set '+next.toLowerCase()+' by '+userName(CURRENT_USER)+'. Reason: '+reason+(workId?' Corrective work: '+workId+'.':'');
  notifyUsers(assetStakeholders(a), a.name+' is '+next.toLowerCase(), detail, next==='Offline'?'Critical':'Information','Asset',a.id,true);
  addAudit('Asset set '+next.toLowerCase(),'Asset',a.id,reason+(workId?' · '+workId:''));
  save('Changed '+a.id+' to '+next); document.getElementById('assetStateDialog').close(); render(); toast(a.code+' is now '+next.toLowerCase()+(workId?' · '+workId+' created':''));
}

function openSupplyDialog(action, partId){
  const dialog=document.getElementById('supplyDialog'), fields=document.getElementById('supplyFields');
  const title=document.getElementById('supplyDialogTitle'), submit=document.getElementById('supplySubmit');
  document.getElementById('supplyAction').value=action;
  const parts=optionList(state.parts,function(p){return p.code+' · '+p.name;},function(p){return p.id;},partId);
  const vendors='<option value="">Not specified</option>'+optionList(state.suppliers,function(s){return s.name;},function(s){return s.id;});
  const wos='<option value="">Not linked</option>'+optionList(state.workOrders.filter(isActive),function(w){return w.id+' · '+w.title;},function(w){return w.id;});
  if(action==='part'){
    title.textContent='Create part'; submit.textContent='Create part';
    fields.innerHTML='<label>Part code<input name="code" required></label><label>Part name<input name="name" required></label><label>Category<input name="category" required></label><label>Preferred vendor<select name="supplierId">'+vendors+'</select></label><label>Unit cost (GHS)<input name="unitCost" type="number" min="0" step=".01" required value="0"></label><label>Reorder qty<input name="reorderQty" type="number" min="1" value="4"></label><label>Store / bin<input name="location" required value="Main Store / Unassigned"></label><label>Opening stock<input name="onHand" type="number" min="0" required value="0"></label><label>Minimum stock<input name="min" type="number" min="0" required value="0"></label><label>Maximum stock<input name="max" type="number" min="0" required value="0"></label>';
  } else if(action==='receive'){
    title.textContent='Receive stock'; submit.textContent='Post receipt';
    fields.innerHTML='<label class="span-2">Part<select name="partId" required>'+parts+'</select></label><label>Quantity received<input name="quantity" type="number" min="1" required value="1"></label><label>Store / bin<input name="location" required value="Main Store"></label><label>Vendor<select name="supplierId">'+vendors+'</select></label><label>Delivery reference<input name="reference"></label>';
  } else if(action==='count'){
    title.textContent='Post cycle count'; submit.textContent='Post count';
    fields.innerHTML='<label class="span-2">Part<select name="partId" id="countPart" required>'+parts+'</select></label><label>Store / bin<input name="location" id="countLocation" required></label><label>Counted quantity<input name="counted" type="number" min="0" required></label><label class="span-2">Note<input name="note"></label>';
    setTimeout(syncCountLocation,0);
  } else if(action==='po'){
    title.textContent='Create purchase order'; submit.textContent='Create draft PO';
    fields.innerHTML='<label>Vendor<select name="supplierId" required>'+vendors.replace('<option value="">Not specified</option>','')+'</select></label><label>Part<select name="partId" id="poPart" required>'+parts+'</select></label><label>Quantity<input name="quantity" type="number" min="1" required value="1"></label><label>Unit cost (GHS)<input name="unitCost" id="poUnitCost" type="number" min="0" step=".01" required></label><label>Expected date<input name="expectedDate" type="date" required value="'+day(7)+'"></label><label>Linked work order<select name="workOrderId">'+wos+'</select></label><div class="form-note">Draft → Approved → Ordered → Received. Receiving posts stock automatically.</div>';
    setTimeout(syncPOCost,0);
  } else {
    title.textContent='Create vendor'; submit.textContent='Create vendor';
    fields.innerHTML='<label class="span-2">Vendor name<input name="name" required></label><label>Contact person<input name="contact"></label><label>Phone<input name="phone"></label><label class="span-2">Email<input name="email" type="email"></label>';
  }
  dialog.showModal();
}
function syncCountLocation(){ const select=document.getElementById('countPart'), input=document.getElementById('countLocation'); if(!select||!input) return; const p=part(select.value); input.value=p&&p.locations[0]?p.locations[0].name:''; }
function syncPOCost(){ const select=document.getElementById('poPart'), input=document.getElementById('poUnitCost'); if(!select||!input) return; const p=part(select.value); input.value=p?Number(p.unitCost||0).toFixed(2):'0.00'; }
function receivePurchaseOrder(po){
  const p=part(po.partId); if(!p) return;
  const loc=p.locations[0]||{name:'Main Store / Unassigned',onHand:0,min:0,max:0}; if(!p.locations.length) p.locations.push(loc);
  loc.onHand=Number(loc.onHand||0)+Number(po.quantity);
  p.fifoLots=p.fifoLots||[]; p.fifoLots.push({qty:Number(po.quantity),unitCost:Number(po.unitCost),receivedAt:new Date().toISOString()});
  po.status='Received'; po.receivedAt=new Date().toISOString();
  const id=nextRecordId('REC',state.receipts,100);
  state.receipts.unshift({id:id,partId:po.partId,supplierId:po.supplierId,quantity:Number(po.quantity),location:loc.name,reference:po.id,receivedAt:po.receivedAt,receivedBy:CURRENT_USER});
  p.transactions.unshift({at:po.receivedAt,type:'Receipt',qty:Number(po.quantity),location:loc.name,reference:po.id});
}
function handleSupplySubmit(e){
  e.preventDefault(); const f=new FormData(e.currentTarget), action=f.get('action'), now=new Date().toISOString(); let message='Saved';
  if(action==='part'){
    const code=String(f.get('code')).trim().toUpperCase(); if(state.parts.some(function(p){return p.code.toUpperCase()===code;})){ toast('That part code already exists'); return; }
    const id=nextRecordId('PRT',state.parts,0);
    state.parts.push({id:id,code:code,name:String(f.get('name')).trim(),category:String(f.get('category')).trim(),preferredVendorId:f.get('supplierId')||null,unitCost:Number(f.get('unitCost')),reorderQty:Number(f.get('reorderQty')||4),autoReorder:true,locations:[{name:String(f.get('location')).trim(),onHand:Number(f.get('onHand')),min:Number(f.get('min')),max:Number(f.get('max'))}],fifoLots:[{qty:Number(f.get('onHand')),unitCost:Number(f.get('unitCost')),receivedAt:now}],transactions:[]});
    message=id+' created';
  } else if(action==='receive'){
    const p=part(f.get('partId')), qty=Number(f.get('quantity')), location=String(f.get('location')).trim(); if(!p||qty<=0) return;
    let loc=p.locations.find(function(x){return x.name===location;}); if(!loc){ loc={name:location,onHand:0,min:0,max:0}; p.locations.push(loc); }
    loc.onHand=Number(loc.onHand||0)+qty; p.fifoLots=p.fifoLots||[]; p.fifoLots.push({qty:qty,unitCost:p.unitCost,receivedAt:now});
    const id=nextRecordId('REC',state.receipts,100);
    state.receipts.unshift({id:id,partId:p.id,supplierId:f.get('supplierId')||null,quantity:qty,location:location,reference:String(f.get('reference')||'').trim(),receivedAt:now,receivedBy:CURRENT_USER});
    p.transactions.unshift({at:now,type:'Receipt',qty:qty,location:location}); message=id+' posted';
  } else if(action==='count'){
    const p=part(f.get('partId')), location=String(f.get('location')).trim(), counted=Number(f.get('counted')); if(!p||counted<0) return;
    let loc=p.locations.find(function(x){return x.name===location;}); if(!loc){ loc={name:location,onHand:0,min:0,max:0}; p.locations.push(loc); }
    const expected=Number(loc.onHand||0), variance=counted-expected; loc.onHand=counted;
    const id=nextRecordId('CNT',state.cycleCounts,30);
    state.cycleCounts.unshift({id:id,partId:p.id,location:location,expected:expected,counted:counted,variance:variance,countedAt:now,countedBy:CURRENT_USER,note:String(f.get('note')||'').trim(),status:'Posted'});
    p.transactions.unshift({at:now,type:'Cycle count',qty:variance,location:location,reference:id});
    if(variance) notifyUsers(['U-1','U-3'], 'Cycle count variance on '+p.code, 'Expected '+expected+', counted '+counted+'.', variance<0?'Warning':'Information','Part',p.id,true);
    queueReorder(p, 'Cycle count left stock at or below minimum'); message=id+' posted';
  } else if(action==='po'){
    const id=nextRecordId('PO',state.purchaseOrders,2024);
    state.purchaseOrders.unshift({id:id,supplierId:f.get('supplierId'),partId:f.get('partId'),quantity:Number(f.get('quantity')),unitCost:Number(f.get('unitCost')),expectedDate:f.get('expectedDate'),status:'Draft',workOrderId:f.get('workOrderId')||'',createdAt:now});
    message=id+' created as draft';
  } else {
    const id=nextRecordId('SUP',state.suppliers,0);
    state.suppliers.push({id:id,name:String(f.get('name')).trim(),contact:String(f.get('contact')||'').trim(),phone:String(f.get('phone')||'').trim(),email:String(f.get('email')||'').trim(),status:'Active',preferred:false});
    message=id+' vendor created';
  }
  save(message); e.currentTarget.reset(); document.getElementById('supplyDialog').close(); render(); toast(message);
}

function searchAll(query){
  const q=String(query||'').trim().toLowerCase(); if(!q) return [];
  const out=[];
  state.workOrders.forEach(function(w){ if([w.id,w.title,assetName(w.assetId)].join(' ').toLowerCase().includes(q)) out.push({type:'Work order',title:w.id+' · '+w.title,sub:assetName(w.assetId),action:'wo',id:w.id,icon:'i-work'}); });
  state.assets.forEach(function(a){ if([a.id,a.code,a.name,a.location].join(' ').toLowerCase().includes(q)) out.push({type:'Asset',title:a.name,sub:a.code+' · '+a.type,action:'asset',id:a.id,icon:'i-asset'}); });
  state.parts.forEach(function(p){ if([p.id,p.code,p.name].join(' ').toLowerCase().includes(q)) out.push({type:'Part',title:p.name,sub:p.code+' · '+totalStock(p)+' on hand',action:'part',id:p.id,icon:'i-box'}); });
  state.pm.forEach(function(p){ if([p.id,p.name,assetName(p.assetId)].join(' ').toLowerCase().includes(q)) out.push({type:'Scheduled maintenance',title:p.name,sub:p.id,action:'sm',id:p.id,icon:'i-calendar'}); });
  state.suppliers.forEach(function(s){ if([s.id,s.name].join(' ').toLowerCase().includes(q)) out.push({type:'Vendor',title:s.name,sub:s.id,action:'vendor',id:s.id,icon:'i-supplier'}); });
  return out.slice(0,14);
}
function renderSearchResults(){
  const box=document.getElementById('globalSearchInput'), target=document.getElementById('searchResults'), results=searchAll(box.value);
  target.innerHTML=results.length?results.map(function(r){return '<button class="search-result" data-search-action="'+r.action+'|'+r.id+'"><span>'+icon(r.icon)+'</span><span><strong>'+escapeHTML(r.title)+'</strong><small>'+escapeHTML(r.type)+' · '+escapeHTML(r.sub)+'</small></span>'+icon('i-chevron')+'</button>';}).join(''):empty('No matching records','Try a code, asset, work description or part number.');
}
function openTag(code){
  const q=String(code||'').trim().toLowerCase(); if(!q){ toast('Enter a tag code'); return; }
  const w=state.workOrders.find(function(x){return x.id.toLowerCase()===q;});
  if(w){ document.getElementById('scanDialog').close(); navigate('work-orders', w.id); return; }
  const a=state.assets.find(function(x){return x.code.toLowerCase()===q||x.id.toLowerCase()===q;});
  if(a){ document.getElementById('scanDialog').close(); selectedAssetId=a.id; navigate('assets', a.id); return; }
  const p=state.parts.find(function(x){return x.code.toLowerCase()===q||x.id.toLowerCase()===q;});
  if(p){ document.getElementById('scanDialog').close(); navigate('parts', p.id); return; }
  toast('No SafiMaintain record matches that tag');
}
async function startCameraScanner(){
  const help=document.getElementById('scanHelp');
  if(!('BarcodeDetector' in window)){ help.textContent='This browser does not provide BarcodeDetector. Use the tag field instead.'; return; }
  try{
    scannerStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    const video=document.getElementById('scanVideo'); video.srcObject=scannerStream; video.hidden=false; await video.play();
    help.textContent='Point the camera at a QR code or barcode.';
    const detector=new BarcodeDetector({formats:['qr_code','code_128','ean_13','ean_8']});
    const loop=async function(){
      if(!scannerStream) return;
      try{ const codes=await detector.detect(video); if(codes.length){ document.getElementById('scanCode').value=codes[0].rawValue; stopScanner(); openTag(codes[0].rawValue); return; } }catch(e){}
      requestAnimationFrame(loop);
    }; loop();
  }catch(e){ help.textContent='Camera access was not available. Enter the tag code manually.'; }
}
function stopScanner(){ if(scannerStream){ scannerStream.getTracks().forEach(function(t){t.stop();}); scannerStream=null; } const v=document.getElementById('scanVideo'); if(v){ v.srcObject=null; v.hidden=true; } }

function bulkUpdateWork(action){
  if(!selectedWorkIds.size){ toast('Select one or more work orders first'); return; }
  let changed=0;
  selectedWorkIds.forEach(function(id){
    const w=work(id); if(!w) return;
    if(action==='start'&&w.status==='Open'){ w.status='In Progress'; logWork(w,'Work started from bulk action'); changed++; }
    if(action==='hold'&&isActive(w)){ w.status='On Hold'; logWork(w,'Placed on hold'); changed++; }
    if(action==='complete'&&isActive(w)&&w.tasks.every(function(t){return t.status==='Done';})){ w.status='Completed'; w.completedAt=new Date().toISOString(); if(!w.completionNotes) w.completionNotes='Completed by '+userName(CURRENT_USER); logWork(w,'Completed from bulk action'); changed++; }
  });
  if(changed) save('Bulk work-order update');
  selectedWorkIds.clear(); render(); toast(changed?changed+' work order'+(changed===1?'':'s')+' updated':'No selected records met the action rules');
}

function bindPageActions(){
  document.querySelectorAll('[data-select-wo]').forEach(function(box){
    box.addEventListener('click', function(e){ e.stopPropagation(); });
    box.addEventListener('change', function(){ if(box.checked) selectedWorkIds.add(box.dataset.selectWo); else selectedWorkIds.delete(box.dataset.selectWo); render(); });
  });
  const selectAll=document.querySelector('[data-select-all-wo]');
  if(selectAll) selectAll.addEventListener('change', function(){
    const visible=Array.from(document.querySelectorAll('[data-select-wo]')).map(function(x){return x.dataset.selectWo;});
    if(selectAll.checked) visible.forEach(function(id){ selectedWorkIds.add(id); }); else visible.forEach(function(id){ selectedWorkIds.delete(id); });
    render();
  });
  document.querySelectorAll('[data-sort-work]').forEach(function(b){ b.addEventListener('click', function(){ const key=b.dataset.sortWork; if(sortKey===key) sortDir=sortDir==='asc'?'desc':'asc'; else { sortKey=key; sortDir='asc'; } render(); }); });
  document.querySelectorAll('[data-bulk-action]').forEach(function(b){ b.addEventListener('click', function(){ bulkUpdateWork(b.dataset.bulkAction); }); });
  document.querySelectorAll('[data-print-work]').forEach(function(b){ b.addEventListener('click', function(){ window.print(); }); });
  document.querySelectorAll('[data-supply-action]').forEach(function(b){ b.addEventListener('click', function(){ openSupplyDialog(b.dataset.supplyAction, b.dataset.partId||null); }); });
  document.querySelectorAll('[data-po-action]').forEach(function(b){ b.addEventListener('click', function(){
    const po=state.purchaseOrders.find(function(x){return x.id===b.dataset.poAction;}); if(!po) return;
    if(po.status==='Draft') po.status='Approved'; else if(po.status==='Approved') po.status='Ordered'; else if(po.status==='Ordered') receivePurchaseOrder(po);
    save('Updated '+po.id+' to '+po.status); render(); toast(po.id+' is now '+po.status.toLowerCase());
  }); });
  document.querySelectorAll('[data-plan-po]').forEach(function(b){ b.addEventListener('click', function(){
    const r=state.purchaseRequests.find(function(x){return x.id===b.dataset.planPo;}); if(!r) return;
    const p=part(r.partId); const id=nextRecordId('PO',state.purchaseOrders,2024);
    state.purchaseOrders.unshift({id:id,supplierId:r.vendorId,partId:r.partId,quantity:r.quantity,unitCost:p?p.unitCost:0,expectedDate:day(7),status:'Draft',workOrderId:r.workOrderId||'',createdAt:new Date().toISOString()});
    r.status='Converted'; save('PO from planning board'); render(); toast(id+' created from '+r.id);
  }); });
  document.querySelectorAll('[data-plan-rfq]').forEach(function(b){ b.addEventListener('click', function(){
    const r=state.purchaseRequests.find(function(x){return x.id===b.dataset.planRfq;}); if(!r) return;
    const id=nextRecordId('RFQ',state.rfqs,10);
    state.rfqs.unshift({id:id,vendorId:r.vendorId,partId:r.partId,quantity:r.quantity,status:'Sent',createdAt:new Date().toISOString(),notes:r.reason});
    r.status='Converted'; save('RFQ from planning board'); render(); toast(id+' sent');
  }); });
  document.querySelectorAll('[data-plan-dismiss]').forEach(function(b){ b.addEventListener('click', function(){ const r=state.purchaseRequests.find(function(x){return x.id===b.dataset.planDismiss;}); if(!r) return; r.status='Dismissed'; save('Dismissed '+r.id); render(); }); });
  document.querySelectorAll('[data-rfq-po]').forEach(function(b){ b.addEventListener('click', function(){
    const r=state.rfqs.find(function(x){return x.id===b.dataset.rfqPo;}); if(!r) return;
    const p=part(r.partId); const id=nextRecordId('PO',state.purchaseOrders,2024);
    state.purchaseOrders.unshift({id:id,supplierId:r.vendorId,partId:r.partId,quantity:r.quantity,unitCost:p?p.unitCost:0,expectedDate:day(7),status:'Draft',workOrderId:'',createdAt:new Date().toISOString()});
    r.status='Converted'; save('RFQ converted'); render(); toast(id+' created from '+r.id);
  }); });
  document.querySelectorAll('[data-route-jump]').forEach(function(b){ b.addEventListener('click', function(){ navigate(b.dataset.routeJump); }); });
  document.querySelectorAll('[data-new-work]').forEach(function(b){ b.addEventListener('click', function(){ openWorkDialog(); }); });
  document.querySelectorAll('[data-new-request]').forEach(function(b){ b.addEventListener('click', openRequestDialog); });
  document.querySelectorAll('[data-open-wo]').forEach(function(el){ el.addEventListener('click', function(){ navigate('work-orders', el.dataset.openWo); }); });
  document.querySelectorAll('[data-open-sm]').forEach(function(el){ el.addEventListener('click', function(){ navigate('scheduled-maintenance', el.dataset.openSm); }); });
  document.querySelectorAll('[data-open-part]').forEach(function(el){ el.addEventListener('click', function(){ navigate('parts', el.dataset.openPart); }); });
  document.querySelectorAll('[data-wo-filter]').forEach(function(b){ b.addEventListener('click', function(){ woFilter=b.dataset.woFilter; render(); }); });
  document.querySelectorAll('[data-wo-type]').forEach(function(b){ b.addEventListener('click', function(){ woTypeFilter=b.dataset.woType; render(); }); });
  document.querySelectorAll('[data-generate-pm]').forEach(function(b){ b.addEventListener('click', function(){ const p=pm(b.dataset.generatePm); const w=createWorkFromPM(p,true); if(w){ render(); toast(w.id+' generated'); } }); });
  document.querySelectorAll('[data-run-automation]').forEach(function(b){ b.addEventListener('click', function(){ evaluatePM(true); }); });
  document.querySelectorAll('[data-convert-request]').forEach(function(b){ b.addEventListener('click', function(){ convertRequest(b.dataset.convertRequest); }); });
  document.querySelectorAll('[data-approve-request]').forEach(function(b){ b.addEventListener('click', function(){ const r=state.requests.find(function(x){return x.id===b.dataset.approveRequest;}); if(!r) return; r.status='Approved'; save('Approved '+r.id); render(); toast(r.id+' approved'); }); });
  document.querySelectorAll('[data-decline-request]').forEach(function(b){ b.addEventListener('click', function(){ const r=state.requests.find(function(x){return x.id===b.dataset.declineRequest;}); if(!r) return; r.status='Declined'; save('Declined '+r.id); render(); }); });
  document.querySelectorAll('[data-select-asset]').forEach(function(el){ el.addEventListener('click', function(){ selectedAssetId=el.dataset.selectAsset; assetTab='details'; navigate('assets', selectedAssetId); }); });
  document.querySelectorAll('[data-asset-tab]').forEach(function(b){ b.addEventListener('click', function(){ assetTab=b.dataset.assetTab; render(); }); });
  document.querySelectorAll('[data-record-tab]').forEach(function(b){ b.addEventListener('click', function(){ recordTab=b.dataset.recordTab; render(); }); });
  document.querySelectorAll('[data-sm-tab]').forEach(function(b){ b.addEventListener('click', function(){ smTab=b.dataset.smTab; render(); }); });
  document.querySelectorAll('[data-part-tab]').forEach(function(b){ b.addEventListener('click', function(){ partTab=b.dataset.partTab; render(); }); });
  document.querySelectorAll('[data-open-asset]').forEach(function(b){ b.addEventListener('click', function(){ selectedAssetId=b.dataset.openAsset; navigate('assets', selectedAssetId); }); });
  document.querySelectorAll('[data-add-meter]').forEach(function(b){ b.addEventListener('click', function(){ openMeterDialog(b.dataset.addMeter||null,null); }); });
  document.querySelectorAll('[data-new-asset]').forEach(function(b){ b.addEventListener('click', function(){ openAssetDialog(null); }); });
  document.querySelectorAll('[data-edit-asset]').forEach(function(b){ b.addEventListener('click', function(){ openAssetDialog(b.dataset.editAsset); }); });
  document.querySelectorAll('[data-toggle-asset-state]').forEach(function(b){ b.addEventListener('click', function(){ openAssetStateDialog(b.dataset.toggleAssetState); }); });
  document.querySelectorAll('[data-fire-event]').forEach(function(b){ b.addEventListener('click', function(){ openAssetStateDialog(b.dataset.fireEvent); }); });
  document.querySelectorAll('[data-cal-month]').forEach(function(b){ b.addEventListener('click', function(){ state.calendarCursor=b.dataset.calMonth; render(); }); });
  document.querySelectorAll('[data-crib]').forEach(function(b){
    b.addEventListener('click', function(){
      const ref=b.dataset.crib.split('|'), t=asset(ref[1]); if(!t) return;
      if(ref[0]==='out'){ t.cribStatus='Checked out'; const active=state.workOrders.find(function(w){return isActive(w)&&w.assigneeId===CURRENT_USER;}); t.cribWorkOrderId=active?active.id:''; }
      else { t.cribStatus='In crib'; t.cribWorkOrderId=null; }
      addAudit('Tool '+t.cribStatus.toLowerCase(),'Asset',t.id,''); save('Tool crib'); render();
    });
  });
  document.querySelectorAll('[data-user-role]').forEach(function(el){ el.addEventListener('change', function(){ const u=user(el.dataset.userRole); if(!u) return; u.role=el.value; addAudit('Role changed','User',u.id,u.role); save('Role'); render(); }); });
  document.querySelectorAll('[data-email-alert]').forEach(function(el){ el.addEventListener('change', function(){ const u=user(el.dataset.emailAlert); if(!u) return; u.emailAlerts=el.checked; save('Email preference'); }); });
  document.querySelectorAll('[data-user-active]').forEach(function(b){ b.addEventListener('click', function(){ const u=user(b.dataset.userActive); if(!u) return; u.active=!u.active; addAudit(u.active?'User activated':'User deactivated','User',u.id,''); save('User'); render(); }); });
  document.querySelectorAll('[data-mark-notification]').forEach(function(b){ b.addEventListener('click', function(){ const n=state.notifications.find(function(x){return x.id===b.dataset.markNotification;}); if(!n) return; n.read=!n.read; save('Notification'); render(); }); });
  const markAll=document.querySelector('[data-mark-all-read]'); if(markAll) markAll.addEventListener('click', function(){ state.notifications.forEach(function(n){ if(n.userId===CURRENT_USER) n.read=true; }); save('Notifications read'); render(); });
  const compose=document.querySelector('[data-compose-message]'); if(compose) compose.addEventListener('click', function(){ document.getElementById('messageDialog').showModal(); });
  const am=document.getElementById('assetMeterButton'); if(am) am.addEventListener('click', function(){ const m=state.meters.find(function(x){return x.assetId===selectedAssetId;}); openMeterDialog(m?m.id:null,null); });
  const sec=document.getElementById('securityForm'); if(sec) sec.addEventListener('submit', function(e){ e.preventDefault(); const f=new FormData(sec); state.securitySettings.sessionTimeout=Number(f.get('sessionTimeout')); state.securitySettings.lockAfterAttempts=Number(f.get('lockAfterAttempts')); state.securitySettings.auditRetentionDays=Number(f.get('auditRetentionDays')); state.securitySettings.requireMfaForManagers=!!f.get('requireMfaForManagers'); addAudit('Security policy saved','Settings','security',''); save('Security'); toast('Security policy saved'); });

  document.querySelectorAll('[data-wo-status]').forEach(function(sel){
    sel.addEventListener('change', function(){
      const w=work(sel.dataset.woStatus); if(!w) return;
      const next=sel.value;
      if(next==='Closed'){ closeWork(w.id); return; }
      if(next==='Completed'){ completeWork(w.id); return; }
      w.status=next; logWork(w,'Status changed to '+next); save('Status '+w.id); render();
    });
  });
  document.querySelectorAll('[data-save-wo]').forEach(function(b){ b.addEventListener('click', function(){ saveWorkFields(b.dataset.saveWo); }); });
  document.querySelectorAll('[data-start-work]').forEach(function(b){ b.addEventListener('click', function(){ const w=work(b.dataset.startWork); w.status='In Progress'; logWork(w,'Work started by '+userName(CURRENT_USER)); save('Started '+w.id); render(); toast(w.id+' started'); }); });
  document.querySelectorAll('[data-complete-work]').forEach(function(b){ b.addEventListener('click', function(){ completeWork(b.dataset.completeWork); }); });
  document.querySelectorAll('[data-close-work]').forEach(function(b){ b.addEventListener('click', function(){ closeWork(b.dataset.closeWork); }); });
  document.querySelectorAll('[data-log-labor]').forEach(function(b){ b.addEventListener('click', function(){ const ref=b.dataset.logLabor.split('|'), w=work(ref[0]), mins=Number(ref[1]); const u=currentUser(); w.laborEntries=w.laborEntries||[]; w.laborEntries.unshift({userId:CURRENT_USER,minutes:mins,rate:u.hourlyRate||0,at:new Date().toISOString(),notes:''}); w.actualMinutes=laborMinutes(w); logWork(w,mins+' min labor logged by '+u.name); save('Labor'); render(); toast(mins+' minutes logged'); }); });
  document.querySelectorAll('[data-use-part]').forEach(function(b){ b.addEventListener('click', function(){ const ref=b.dataset.usePart.split('|'); usePart(ref[0], ref[1]); }); });
  document.querySelectorAll('[data-add-wo-part]').forEach(function(b){ b.addEventListener('click', function(){ const w=work(b.dataset.addWoPart), sel=document.getElementById('addPartSelect'); if(!w||!sel) return; if(w.parts.some(function(x){return x.partId===sel.value;})){ toast('Part already on this work order'); return; } w.parts.push({partId:sel.value,planned:1,actual:0}); save('Added part'); render(); }); });
  document.querySelectorAll('[data-add-misc]').forEach(function(b){ b.addEventListener('click', function(){ const w=work(b.dataset.addMisc), d=document.getElementById('miscDesc'), a=document.getElementById('miscAmt'); if(!w||!d||!a||!d.value) return; w.miscCosts.push({description:d.value,amount:Number(a.value||0)}); save('Misc cost'); render(); }); });
  document.querySelectorAll('[data-add-task]').forEach(function(b){ b.addEventListener('click', function(){ const w=work(b.dataset.addTask); if(!w) return; const text=prompt('Labor task description'); if(!text) return; w.tasks.push({id:newTaskId(),type:'General',text:text,status:'Todo',estimateHours:0.5,hoursSpent:0,notes:''}); save('Added task'); render(); }); });
  document.querySelectorAll('[data-inspection-result]').forEach(function(b){ b.addEventListener('click', function(){ const ref=b.dataset.inspectionResult.split('|'), w=work(ref[0]), t=w.tasks.find(function(x){return x.id===ref[1];}); t.result=ref[2]; t.status='Done'; logWork(w,'Inspection "'+t.text+'" recorded '+ref[2]); const follow=(ref[2]==='Fail'&&t.autoCorrective)?createFollowOnFromTask(w,t):null; save('Inspection'); render(); toast(follow?'Inspection failed — '+follow+' created':'Inspection result saved'); }); });
  document.querySelectorAll('[data-meter-task]').forEach(function(b){ b.addEventListener('click', function(){ const ref=b.dataset.meterTask.split('|'), w=work(ref[0]), t=w.tasks.find(function(x){return x.id===ref[1];}); openMeterDialog(t.meterId, b.dataset.meterTask); }); });
  document.querySelectorAll('[data-task-toggle]').forEach(function(box){ box.addEventListener('change', function(){ const ref=box.dataset.taskToggle.split('|'), w=work(ref[0]), t=w.tasks.find(function(x){return x.id===ref[1];}); t.status=box.checked?'Done':'Todo'; logWork(w,(box.checked?'Completed: ':'Reopened: ')+t.text); save('Task'); render(); }); });
  document.querySelectorAll('[data-task-hours]').forEach(function(inp){ inp.addEventListener('change', function(){ const ref=inp.dataset.taskHours.split('|'), w=work(ref[0]), t=w.tasks.find(function(x){return x.id===ref[1];}); t.hoursSpent=Number(inp.value||0); const u=currentUser(); if(t.hoursSpent>0){ w.laborEntries.unshift({userId:CURRENT_USER,minutes:Math.round(t.hoursSpent*60),rate:u.hourlyRate||0,at:new Date().toISOString(),notes:t.text}); w.actualMinutes=laborMinutes(w); } save('Task hours'); }); });
  document.querySelectorAll('[data-wo-file]').forEach(function(inp){ inp.addEventListener('change', function(){ const w=work(inp.dataset.woFile), file=inp.files&&inp.files[0]; if(!w||!file) return; w.files=w.files||[]; w.files.unshift({name:file.name,note:file.type,at:new Date().toISOString()}); logWork(w,'Attached '+file.name); save('File'); render(); toast('Attached '+file.name); }); });
}

function setupGlobalEvents(){
  document.querySelectorAll('.nav-link[data-route]').forEach(function(b){ b.addEventListener('click', function(){ navigate(b.dataset.route); closeMobileMenu(); }); });
  const inv=document.getElementById('inventoryToggle'); if(inv) inv.addEventListener('click', function(){ setInventoryOpen(this.getAttribute('aria-expanded')!=='true'); });
  document.getElementById('newWorkButton').addEventListener('click', function(){ openWorkDialog(); });
  document.getElementById('searchButton').addEventListener('click', function(){ document.getElementById('searchDialog').showModal(); setTimeout(function(){ document.getElementById('globalSearchInput').focus(); },0); });
  document.getElementById('globalSearchInput').addEventListener('input', renderSearchResults);
  document.getElementById('scanButton').addEventListener('click', function(){ document.getElementById('scanCode').value=''; document.getElementById('scanDialog').showModal(); });
  document.getElementById('openTagButton').addEventListener('click', function(){ openTag(document.getElementById('scanCode').value); });
  document.getElementById('cameraScanButton').addEventListener('click', startCameraScanner);
  document.getElementById('syncButton').addEventListener('click', function(){ toast('Server sync is not connected yet — '+state.syncQueue.length+' local change'+(state.syncQueue.length===1?'':'s')+' remain safe on this device'); });
  document.getElementById('notificationButton').addEventListener('click', function(){ navigate('notifications'); });
  document.getElementById('menuButton').addEventListener('click', openMobileMenu);
  document.getElementById('mobileScrim').addEventListener('click', closeMobileMenu);
  document.querySelectorAll('[data-close-dialog]').forEach(function(b){ b.addEventListener('click', function(){ const d=document.getElementById(b.dataset.closeDialog); if(d.id==='scanDialog') stopScanner(); d.close(); }); });
  document.getElementById('scanDialog').addEventListener('close', stopScanner);
  document.getElementById('supplyForm').addEventListener('submit', handleSupplySubmit);
  document.getElementById('supplyFields').addEventListener('change', function(e){ if(e.target.id==='countPart') syncCountLocation(); if(e.target.id==='poPart') syncPOCost(); });
  document.getElementById('assetForm').addEventListener('submit', handleAssetSubmit);
  document.getElementById('assetStateForm').addEventListener('submit', handleAssetStateSubmit);
  document.getElementById('messageForm').addEventListener('submit', function(e){
    e.preventDefault(); const f=new FormData(e.currentTarget);
    const audience=f.get('audience');
    const ids=state.users.filter(function(u){ return audience==='All users'||u.role===audience||(audience==='Technician'&&String(u.role).indexOf('technician')>=0); }).map(function(u){return u.id;});
    notifyUsers(ids, String(f.get('subject')), String(f.get('message')), f.get('severity'), 'Announcement', '', !!f.get('emailCopy'));
    addAudit('Announcement sent','Notification','',String(f.get('subject'))); save('Announcement'); document.getElementById('messageDialog').close(); render(); toast('Announcement sent');
  });
  document.getElementById('workForm').addEventListener('submit', function(e){
    e.preventDefault(); const f=new FormData(e.currentTarget);
    const w=blankWork({title:String(f.get('title')).trim(),assetId:f.get('assetId'),secondaryAssetId:f.get('secondaryAssetId')||'',type:f.get('type'),priority:f.get('priority'),assigneeId:f.get('assigneeId'),suggestedStart:f.get('suggestedStart'),due:f.get('due'),estimateHours:Number(f.get('estimateHours')||0),projectId:f.get('projectId')||'',instructions:String(f.get('instructions')||'').trim()});
    state.workOrders.unshift(w); save('Created '+w.id); e.currentTarget.reset(); document.getElementById('workDialog').close();
    notifyUsers([w.assigneeId], 'Work order assigned: '+w.id, w.title, 'Information', 'Work order', w.id, true);
    navigate('work-orders', w.id); toast(w.id+' created');
  });
  document.getElementById('requestForm').addEventListener('submit', function(e){
    e.preventDefault(); const f=new FormData(e.currentTarget), id=nextRequestId();
    state.requests.unshift({id:id,assetId:f.get('assetId'),summary:String(f.get('summary')).trim(),urgency:f.get('urgency'),requester:String(f.get('requester')||userName(CURRENT_USER)).trim(),createdAt:new Date().toISOString(),status:'Requested'});
    notifyUsers(['U-1','U-3'], 'New work request '+id, String(f.get('summary')), f.get('urgency')==='Safety critical'?'Critical':'Information','Work request',id,true);
    save('Created '+id); e.currentTarget.reset(); document.getElementById('requestDialog').close(); navigate('work-requests'); toast(id+' submitted');
  });
  document.getElementById('meterForm').addEventListener('submit', function(e){
    e.preventDefault(); const f=new FormData(e.currentTarget), m=meter(f.get('meterId')), value=Number(f.get('value')); if(!m||!Number.isFinite(value)) return;
    m.current=value; m.readings.push({value:value,date:day(0),note:String(f.get('note')||'').trim()});
    if(pendingMeterTask){ const refs=pendingMeterTask.split('|'), w=work(refs[0]), t=w&&w.tasks.find(function(x){return x.id===refs[1];}); if(t){ t.status='Done'; t.result=value+' '+m.unit; logWork(w,'Recorded '+m.name+': '+value+' '+m.unit); } }
    save('Recorded '+m.name); pendingMeterTask=null; document.getElementById('meterDialog').close(); evaluatePM(false); render(); toast('Meter reading saved');
  });
  document.getElementById('searchResults').addEventListener('click', function(e){
    const b=e.target.closest('[data-search-action]'); if(!b) return; const ref=b.dataset.searchAction.split('|'); document.getElementById('searchDialog').close();
    if(ref[0]==='wo') navigate('work-orders', ref[1]);
    if(ref[0]==='asset'){ selectedAssetId=ref[1]; navigate('assets', ref[1]); }
    if(ref[0]==='part') navigate('parts', ref[1]);
    if(ref[0]==='sm') navigate('scheduled-maintenance', ref[1]);
    if(ref[0]==='vendor') navigate('vendors');
  });
  window.addEventListener('hashchange', function(){ render(); });
  window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection);
  window.addEventListener('keydown', function(e){ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); document.getElementById('searchButton').click(); } });
}
function openMobileMenu(){ document.getElementById('rail').classList.add('open'); document.getElementById('mobileScrim').classList.add('show'); }
function closeMobileMenu(){ document.getElementById('rail').classList.remove('open'); document.getElementById('mobileScrim').classList.remove('show'); }

function init(){
  populateSelects(); setupGlobalEvents(); evaluatePM(false); render(); updateConnection();
  if('serviceWorker' in navigator) window.addEventListener('load', function(){ navigator.serviceWorker.register('service-worker.js').catch(function(){}); });
}
init();
