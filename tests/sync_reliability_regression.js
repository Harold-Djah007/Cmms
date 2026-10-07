'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('dist/assets/safimaint-sync-v30.js','utf8');
const response=(body,status=200)=>({ok:status<400,status,headers:{get:()=> 'application/json'},json:async()=>body});
function harness(fetch){
  const memory=new Map(),events={};
  const context={console,structuredClone,URLSearchParams,navigator:{onLine:true},location:{search:''},
    state:{meta:{serverRevision:4},users:[],assets:[],parts:[],workOrders:[],value:'first'},CURRENT_USER:'U1',
    localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},
    document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({dataset:{}}),addEventListener(){}},
    window:{addEventListener:(name,fn)=>events[name]=fn},saveState(){},render(){},toast(){},iso:()=> 'now',fetch};
  vm.createContext(context);vm.runInContext(source,context);
  return {context,memory,events,run:code=>vm.runInContext(code,context)};
}
(async()=>{
  let release,first=true;const writes=[];
  const h=harness(async(path,options)=>{
    writes.push(JSON.parse(options.body));
    if(first){first=false;await new Promise(resolve=>release=resolve)}
    return response({revision:writes.length+4});
  });
  h.run('safiSync.apiAvailable=true;safiSync.sharedWorkspace=true;safiSync.revision=4;queueSnapshot()');
  h.run("state.value='second';queueSnapshot()");
  release();
  while(h.run('safiSync.busy'))await new Promise(resolve=>setImmediate(resolve));
  assert.equal(writes.length,2,'edits during an in-flight save must also be committed');
  assert.equal(writes[1].state.value,'second');
  assert.equal(writes[1].revision,5);
  assert.equal(h.memory.has('safimaint-sync-queue-v1'),false);

  const offline=harness(async()=>{throw new Error('network unavailable')});
  offline.run('safiSync.sharedWorkspace=true;safiSync.revision=4');
  offline.context.navigator.onLine=false;
  offline.run("state.value='offline edit';queueSnapshot()");
  assert.equal(JSON.parse(offline.memory.get('safimaint-sync-queue-v1'))[0].baseRevision,4);
  await offline.run('startSync()');
  assert.ok(offline.memory.has('safimaint-sync-queue-v1'),'failed probe must retain the queue');

  let submitted;
  offline.context.navigator.onLine=true;
  offline.context.fetch=async(path,options={})=>{
    if(path==='/api/health')return response({status:'ok',service:'safimaint'});
    if(path==='/api/v1/session')return response({identity:{email:'user@example.com'},permissions:['asset.view'],revision:9});
    if(options.method==='PUT'){submitted=JSON.parse(options.body);return response({detail:{message:'conflict'}},409)}
    return response({revision:9,state:{meta:{serverRevision:9},users:[],value:'server'}});
  };
  await offline.run('startSync()');
  assert.equal(submitted.revision,4,'reconnect must use the offline base revision');
  const backup=JSON.parse(offline.memory.get('safimaint-conflict-backup-v1'));
  assert.equal(backup.state.value,'offline edit');
  assert.equal(offline.context.state.value,'server');
  console.log('Sync race, offline persistence and reconnect conflict checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
