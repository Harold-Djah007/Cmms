'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const asset={id:'A-1',code:'P-201',name:'Digester Feed Pump 02',type:'Equipment',parentId:'L-1',locationId:'L-1',siteId:'S-1',category:'Pump',criticality:'A',condition:'Attention',operatingState:'Offline',location:'Digester line',latitude:5.7,longitude:-.03,ownerUserId:'U-1',ownerGroupId:'G-1',manufacturer:'Grundfos',model:'CR 32-4',serial:'GF-1',commissioned:'2021-01-01',warrantyExpiry:'2027-01-01',bom:['P-1'],bomQuantities:{'P-1':1},customFields:{Duty:'Primary'},businessIds:['V-1']};
const location={id:'L-1',code:'DIG',name:'Digester Area',type:'Production area',parentId:null,operatingState:'Online',condition:'Healthy',bom:[]};
const part={id:'P-1',code:'MS-40',name:'Mechanical seal',uom:'ea',min:2,max:8,unitCost:100,vendorId:'V-1',locations:[{storeId:'ST-1',bin:'B-1',onHand:1}]};
const state={assets:[location,asset],parts:[part],workOrders:[],assetEvents:[],downtime:[],meters:[],scheduledMaintenance:[],users:[{id:'U-1',name:'Test User',roleId:'R-1'}],groups:[{id:'G-1',name:'Maintenance'}],roles:[{id:'R-1',name:'Planner'}],vendors:[{id:'V-1',name:'PumpTech',status:'Active'}],businesses:[],stores:[{id:'ST-1',name:'Main Store'}],purchaseRequests:[],stockTransactions:[]};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context={
  console,state,ui:{route:'assets',assetView:'record',selectedAsset:'A-1',assetRecordTab:'general'},CURRENT_USER:'U-1',
  renderAssets:()=>'<div>hierarchy</div>',render:()=>{},setTimeout:()=>{},confirm:()=>true,
  window:{open:()=>null},document:{addEventListener:()=>{}},
  getAsset:id=>state.assets.find(x=>x.id===id),getPart:id=>state.parts.find(x=>x.id===id),getUser:id=>state.users.find(x=>x.id===id),getGroup:id=>state.groups.find(x=>x.id===id),getRole:id=>state.roles.find(x=>x.id===id),getStore:id=>state.stores.find(x=>x.id===id),
  partOnHand:p=>(p.locations||[]).reduce((n,l)=>n+Number(l.onHand||0),0),durationHours:()=>2,
  esc,money:v=>'GHS '+Number(v||0).toFixed(2),dateFmt:v=>v||'—',dateTimeFmt:v=>v||'—',status:v=>'<span>'+esc(v)+'</span>',iso:()=>new Date().toISOString(),uid:p=>p+'-1',
  field:()=>'',openModal:()=>{},closeModal:()=>{},toast:()=>{},saveState:()=>{},addAudit:()=>{},getVendor:()=>null,currentUser:()=>state.users[0]
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync('dist/assets/safimaint-asset-record-v72.js','utf8'),context);

for(const tab of ['general','bom','meter','personnel','warranties','businesses','purchasing','files','custom','financials','log']){
  context.ui.assetRecordTab=tab;
  const html=context.window.renderAssets();
  assert.match(html,/ar72-record/);
  assert.match(html,/Digester Feed Pump 02/);
  assert.match(html,/data-v72-tab/);
  assert.ok(html.length>1500,tab+' should render a substantial asset record');
}

context.ui.assetRecordTab='general';
const general=context.window.renderAssets();
assert.match(general,/ar72-map/);
assert.match(general,/ar72-qr/);
assert.match(general,/data-toggle-asset="A-1"/);
assert.match(general,/Change location/);

console.log('Asset record v72 DOM smoke checks passed.');
