'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const syncSource=fs.readFileSync('dist/assets/safimaint-sync-v30.js','utf8');
const permissionSource=fs.readFileSync('dist/assets/safimaint-platform-states-v55.js','utf8');

const memory=new Map();
let committed=null;
const response=(body,status=200)=>({ok:status>=200&&status<300,status,headers:{get:name=>name.toLowerCase()==='content-type'?'application/json':''},async json(){return body}});
const context={
  console,structuredClone,URLSearchParams,
  state:{meta:{freshWorkspace:true},users:[],assets:[],parts:[],workOrders:[]},
  CURRENT_USER:'U-1',
  navigator:{onLine:true},
  location:{hostname:'localhost',port:'8000',search:''},
  localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)},
  document:{getElementById(){return null},querySelector(){return null},createElement(){return {dataset:{},textContent:'',title:'',className:''}},addEventListener(){}},
  window:{addEventListener(){},SafiMaintainDemo:{build(){return {meta:{demo:true},users:[{id:'U-1',active:true}],assets:[{},{},{}],parts:[{},{}],workOrders:[{},{}]}}}},
  saveState(){},render(){},paintSync(){},iso(){return '2026-09-22T00:00:00Z'},toast(){},
  async fetch(path,options={}){
    if(path==='/api/health')return response({status:'ok',service:'safimaint'});
    if(path==='/api/v1/session')return response({identity:{provider:'development',email:'local@example.com'},permissions:['*'],revision:1});
    if(path==='/api/v1/state'&&options.method==='PUT'){
      committed=JSON.parse(options.body);
      return response({revision:2,stateHash:'demo'});
    }
    if(path==='/api/v1/state')return response({revision:1,state:{meta:{freshWorkspace:true},users:[],assets:[],parts:[],workOrders:[]}});
    throw new Error('Unexpected request '+path);
  }
};
vm.createContext(context);
vm.runInContext(syncSource,context,{filename:'safimaint-sync-v30.js'});
vm.runInContext("safiSync.identity={provider:'development',email:'local@example.com'}",context);

assert.equal(vm.runInContext('staticTestMode()',context),false);
assert.equal(vm.runInContext("shouldBootstrapDemo({revision:1,state:{meta:{freshWorkspace:true},assets:[],parts:[],workOrders:[]}})",context),true);
assert.equal(vm.runInContext("shouldBootstrapDemo({revision:12,state:{meta:{freshWorkspace:false},assets:[],parts:[],workOrders:[]}})",context),true);
assert.equal(vm.runInContext("shouldBootstrapDemo({revision:9,state:{meta:{freshWorkspace:false},assets:[{},{},{}],parts:[{},{}],workOrders:[{},{}]}})",context),false);
assert.equal(vm.runInContext("sparseOperationalState(developmentDemoState(state))",context),false);
assert.match(permissionSource,/identity\.provider==='development'&&remote\.size===0/);
assert.match(permissionSource,/if\(remote\.has\('\*'\)\)return remote/);

(async()=>{
  await vm.runInContext('startSync()',context);
  assert.ok(committed,'shared startup should commit a populated demo snapshot');
  assert.equal(committed.revision,1);
  assert.ok(committed.state.assets.length>=3);
  assert.ok(committed.state.parts.length>=2);
  assert.equal(vm.runInContext("safiSync.mode",context),'shared');
  console.log('Shared bootstrap and development-permission regression checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
