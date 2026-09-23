'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const demoSource=fs.readFileSync('dist/assets/safimaint-demo-v67.js','utf8');
const stockSource=fs.readFileSync('dist/assets/safimaint-familiar-stock-v66.js','utf8');
const indexSource=fs.readFileSync('dist/index.html','utf8');
const serviceWorkerSource=fs.readFileSync('dist/service-worker.js','utf8');
const assetHierarchySource=fs.readFileSync('dist/assets/safimaint-fiix-operating-model-v23.js','utf8');

assert.equal((indexSource.match(/safimaint-demo-v67\.js/g)||[]).length,1);
assert.ok(!indexSource.includes('safimaint-demo-workspace-v67.js'));
assert.ok(!serviceWorkerSource.includes("'./assets/safimaint-demo-workspace-v67.js'"));
assert.match(serviceWorkerSource,/safimaint-flux-v71/);
assert.match(indexSource,/safimaint-stock-first\.css\?v=74/);
assert.match(indexSource,/safimaint-stock-first\.js\?v=74/);
assert.match(indexSource,/safimaint-flux-v71\.css\?v=74/);
assert.match(serviceWorkerSource,/safimaint-stock-first\.css/);
assert.match(serviceWorkerSource,/safimaint-stock-first\.js/);
assert.match(serviceWorkerSource,/safimaint-flux-v71\.css/);
assert.match(assetHierarchySource,/class="safi-hierarchy-svg"/);
assert.match(assetHierarchySource,/assetTypeIcon\('Facility'\)/);
assert.match(assetHierarchySource,/assetTypeIcon\('Equipment'\)/);
assert.match(assetHierarchySource,/assetTypeIcon\('Tool'\)/);

function demoContext(initialState){
  const memory=new Map();
  const context={
    console,structuredClone,
    state:initialState,
    ui:{route:'dashboard'},
    APP_VERSION:68,
    CURRENT_USER:'U-1',
    STORAGE_KEY:'safi',
    localStorage:{
      getItem:key=>memory.has(key)?memory.get(key):null,
      setItem:(key,value)=>memory.set(key,String(value)),
      removeItem:key=>memory.delete(key)
    },
    document:{body:{classList:{remove(){},toggle(){}}},addEventListener(){}},
    window:{},
    freshWorkspace:()=>({meta:{},roles:[],sites:[],stores:[],groups:[],users:[],vendors:[],businesses:[],parts:[],assets:[],workOrders:[],pmSchedules:[],meters:[],meterReadings:[],stockTransactions:[],cycleCounts:[],purchaseRequests:[],purchaseOrders:[],rfqs:[],receipts:[],notifications:[],mailOutbox:[],audit:[]}),
    currentUser(){return context.state.users?.[0]||null},
    day(offset=0){return new Date(Date.UTC(2026,8,22+offset)).toISOString()},
    iso(){return new Date(Date.UTC(2026,8,22)).toISOString()},
    saveState(){memory.set(context.STORAGE_KEY,JSON.stringify(context.state))},
    simpleNavigation(){},
    syncSimpleShell(){},
    render(){},
    toast(){},
    confirm(){return true},
    renderDashboard(){return '<div class="v65-dashboard-actions"></div>'}
  };
  vm.createContext(context);
  vm.runInContext(demoSource,context,{filename:'safimaint-demo-v67.js'});
  return context;
}

const fresh=demoContext({meta:{},assets:[],workOrders:[],parts:[],users:[]});
assert.equal(fresh.state.meta.demo,true);
assert.equal(fresh.state.meta.demoVersion,68);
assert.ok(fresh.state.assets.length>=10);
assert.ok(fresh.state.parts.length>=6);
assert.ok(fresh.state.workOrders.length>=4);
assert.ok(fresh.state.parts.some(part=>part.locations?.some(location=>Number.isFinite(location.min)&&Number.isFinite(location.max))));
assert.ok(fresh.state.workStatusDefinitions.some(status=>status.name==='Work In Progress'));
assert.ok(!fresh.state.workStatusDefinitions.some(status=>status.name==='In Progress'));

const legacy=demoContext({
  meta:{demo:true},
  assets:[],
  users:[],
  parts:[{id:'P',locations:null}],
  workOrders:[{id:'W',status:'In Progress'}]
});
assert.equal(legacy.state.workOrders[0].status,'Work In Progress');
assert.ok(Array.isArray(legacy.state.stockTransactions));
assert.ok(Array.isArray(legacy.state.parts[0].locations));
assert.equal(typeof legacy.window.SafiMaintainDemo.restore,'function');

const brokenDemo=demoContext({meta:{demo:true},assets:[],workOrders:[],parts:[],users:[]});
assert.ok(brokenDemo.state.assets.length>=10);
assert.ok(brokenDemo.state.parts.length>=6);
assert.equal(brokenDemo.state.meta.demoVersion,68);

function stockContext(){
  const context={
    console,
    ui:{route:'none',v66PartTab:'purchasing',selectedPart:'P1'},
    state:{stores:[{id:'S1',name:'Main Store'}],parts:[],assets:[],businesses:[],vendors:[],purchaseRequests:null,rfqs:null,purchaseOrders:null,cycleCounts:null,stockTransactions:null,audit:[],users:[]},
    window:{},
    document:{addEventListener(){}},
    modal:null,
    lastToast:'',
    esc:value=>String(value??''),
    getVendor:()=>null,
    getStore(id){return context.state.stores.find(item=>item.id===id)},
    getUser:()=>null,
    getPart(id){return context.state.parts.find(item=>item.id===id)},
    partOnHand(part){return (part.locations||[]).reduce((total,location)=>total+Number(location.onHand||0),0)},
    money:value=>String(value),
    status:value=>'<span>'+value+'</span>',
    dateTimeFmt:value=>String(value),
    dateFmt:value=>String(value),
    uid:()=> 'PR-X',
    iso:()=> '2026-09-22T00:00:00Z',
    addAudit(){},
    dispatchEvent(){},
    saveState(){},
    toast(value){context.lastToast=value},
    openModal(value){context.modal=value},
    closeModal(){},
    render(){},
    go(){},
    postStock(partId,type,quantity,storeId,bin){
      const part=context.getPart(partId);
      const location=part.locations.find(item=>item.storeId===storeId&&item.bin===bin);
      const before=Number(location.onHand||0);
      location.onHand=before+Number(quantity);
      context.state.stockTransactions=context.state.stockTransactions||[];
      context.state.stockTransactions.unshift({partId,storeId,bin,type,qtyBefore:before,qtyAfter:location.onHand,at:context.iso()});
    },
    renderPartDetail:()=> '',
    showStockLocation:()=> {}
  };
  const part={id:'P1',code:'PART-1',name:'Bearing',category:'Bearing',uom:'ea',locations:[],min:0,max:0};
  context.state.parts=[part];
  vm.createContext(context);
  vm.runInContext(stockSource,context,{filename:'safimaint-familiar-stock-v66.js'});
  return {context,part};
}

const {context:stock,part}=stockContext();
const purchasing=stock.renderPartDetail(part);
assert.match(purchasing,/Preferred supplier/);
assert.match(purchasing,/No purchasing documents/);

stock.showStockLocation(part,null);
for(const name of ['storeId','aisle','row','bin','onHand','min','max','active']){
  assert.match(stock.modal.body,new RegExp('name="'+name+'"'));
}
const values={storeId:'S1',aisle:'A',row:'1',bin:'B-14',onHand:'5',min:'2',max:'10',active:'on'};
stock.modal.onSubmit({get:key=>values[key]??null});
assert.deepEqual(
  JSON.parse(JSON.stringify(part.locations[0])),
  {storeId:'S1',aisle:'A',row:'1',bin:'B-14',onHand:5,min:2,max:10,active:true}
);
assert.equal(stock.state.stockTransactions[0].qtyBefore,0);
assert.equal(stock.state.stockTransactions[0].qtyAfter,5);
stock.ui.v66PartTab='history';
assert.match(stock.renderPartDetail(part),/Qty Before/);
assert.match(stock.renderPartDetail(part),/Qty After/);

console.log('Demo migration and stock-location regression checks passed.');
