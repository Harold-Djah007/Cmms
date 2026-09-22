'use strict';

// SafiMaintain shared-service adapter.
// Local storage is always the field cache. The shared API is used only after a successful capability probe.
const SAFI_SYNC_QUEUE='safimaint-sync-queue-v1';
const SAFI_CONFLICT_BACKUP='safimaint-conflict-backup-v1';
const safiSync={mode:'device',revision:0,pending:[],busy:false,lastError:'',identity:null,permissions:[],apiAvailable:false,probed:false};
const localSaveState=saveState;

function syncLabel(){
  if(safiSync.mode==='shared')return 'Shared data current';
  if(safiSync.mode==='saving')return 'Saving securely…';
  if(safiSync.mode==='error')return 'Sync needs attention';
  return navigator.onLine?'Device mode':'Offline · device cache';
}
function paintSync(){
  const text=document.getElementById('connectionText'),sub=document.getElementById('connectionSub');
  if(text)text.textContent=syncLabel();
  if(sub)sub.textContent=safiSync.mode==='shared'
    ?`Revision ${safiSync.revision} · server backed`
    :(safiSync.lastError||'Local field data ready');
  let badge=document.getElementById('syncHealth');
  if(!badge){
    badge=document.createElement('span');
    badge.id='syncHealth';
    badge.className='sync-health';
    document.querySelector('.top-actions')?.prepend(badge);
  }
  if(badge){
    badge.dataset.mode=safiSync.mode;
    badge.textContent=syncLabel();
    badge.title=sub?.textContent||'';
  }
}
async function apiJson(path,options={}){
  const response=await fetch(path,{
    ...options,
    headers:{'Accept':'application/json','Content-Type':'application/json',...(options.headers||{})},
    credentials:'same-origin'
  });
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.includes('application/json')){
    const error=new Error('Shared service is not available at this address');
    error.status=response.status||0;
    throw error;
  }
  const body=await response.json().catch(()=>({}));
  if(!response.ok){
    const error=new Error(typeof body.detail==='string'?body.detail:(body.detail?.message||`Server returned ${response.status}`));
    error.status=response.status;
    error.body=body;
    throw error;
  }
  return body;
}
function staticTestMode(){
  // Never infer device mode from localhost:8080: Docker exposes the real API
  // on that exact address. Plain static servers are detected by the health
  // probe returning a non-JSON/404 response.
  return new URLSearchParams(location.search).get('device')==='1'||localStorage.getItem('safimaint-force-device')==='1';
}
async function probeSharedService(){
  if(staticTestMode()||!navigator.onLine){safiSync.apiAvailable=false;safiSync.probed=true;return false}
  try{
    const response=await fetch('/api/health',{headers:{'Accept':'application/json'},credentials:'same-origin',cache:'no-store'});
    const contentType=response.headers.get('content-type')||'';
    if(!response.ok||!contentType.includes('application/json'))throw new Error('No shared API');
    const body=await response.json();
    safiSync.apiAvailable=body?.status==='ok'&&body?.service==='safimaint';
  }catch(_ignored){safiSync.apiAvailable=false}
  safiSync.probed=true;
  return safiSync.apiAvailable;
}
function queueSnapshot(reason='Operational change'){
  if(!safiSync.apiAvailable)return;
  safiSync.pending=[{state:structuredClone(state),reason,queuedAt:iso()}];
  localStorage.setItem(SAFI_SYNC_QUEUE,JSON.stringify(safiSync.pending));
  flushSync();
}
saveState=function(){
  localSaveState();
  queueSnapshot('SafiMaintain record update');
};
function applyServerState(payload){
  if(!payload?.state||!Number.isInteger(payload.revision))throw new Error('Shared service returned an invalid workspace response');
  state=payload.state;
  safiSync.revision=payload.revision;
  const email=safiSync.identity?.email?.toLowerCase();
  const user=email&&state.users.find(u=>String(u.email||'').toLowerCase()===email);
  if(user)CURRENT_USER=user.id;
  else if(safiSync.identity?.provider==='development')CURRENT_USER=state.users.find(u=>u.active)?.id||CURRENT_USER;
  localSaveState();
  render();
}
function sparseOperationalState(candidate){
  return !candidate||((candidate.assets?.length||0)<3&&(candidate.parts?.length||0)<2&&(candidate.workOrders?.length||0)<2);
}
function shouldBootstrapDemo(payload){
  // Development mode is the repository's acceptance-test workspace. It must
  // stay populated even when an older volume contains a sparse/broken state.
  return safiSync.identity?.provider==='development'&&sparseOperationalState(payload?.state);
}
function developmentDemoState(localCandidate){
  if(localCandidate?.meta?.demo&&!sparseOperationalState(localCandidate))return structuredClone(localCandidate);
  if(window.SafiMaintainDemo?.build)return window.SafiMaintainDemo.build();
  return localCandidate;
}
async function pullServer(){
  const payload=await apiJson('/api/v1/state');
  applyServerState(payload);
  return payload;
}
async function flushSync(){
  if(!safiSync.apiAvailable||safiSync.busy||!navigator.onLine||!safiSync.pending.length)return;
  safiSync.busy=true;safiSync.mode='saving';paintSync();
  try{
    while(safiSync.pending.length){
      const latest=safiSync.pending[safiSync.pending.length-1];
      const result=await apiJson('/api/v1/state',{
        method:'PUT',
        body:JSON.stringify({revision:safiSync.revision,state:latest.state,reason:latest.reason})
      });
      safiSync.revision=result.revision;
      safiSync.pending=[];
      localStorage.removeItem(SAFI_SYNC_QUEUE);
    }
    safiSync.mode='shared';safiSync.lastError='';
  }catch(error){
    if(error.status===409){
      localStorage.setItem(SAFI_CONFLICT_BACKUP,JSON.stringify({savedAt:iso(),state:safiSync.pending.at(-1)?.state||state}));
      safiSync.pending=[];
      localStorage.removeItem(SAFI_SYNC_QUEUE);
      try{
        await pullServer();
        toast('Another device saved first. Server data was loaded; your unsynced copy is preserved for recovery.');
      }catch(_ignored){}
    }else{
      // A failed API request immediately drops back to safe device mode.
      safiSync.apiAvailable=false;
      safiSync.mode='device';
      safiSync.lastError='Shared service unavailable · local field data is safe';
    }
  }finally{
    safiSync.busy=false;
    paintSync();
  }
}
async function startSync(){
  try{safiSync.pending=JSON.parse(localStorage.getItem(SAFI_SYNC_QUEUE)||'[]')}catch(_ignored){safiSync.pending=[]}
  safiSync.mode='device';safiSync.lastError='';paintSync();
  const available=await probeSharedService();
  if(!available){
    // Static test servers such as python -m http.server intentionally stay in device mode.
    safiSync.pending=[];
    localStorage.removeItem(SAFI_SYNC_QUEUE);
    safiSync.mode='device';
    safiSync.lastError='Local field mode';
    paintSync();
    return;
  }
  try{
    const session=await apiJson('/api/v1/session');
    safiSync.identity=session.identity;
    safiSync.permissions=Array.isArray(session.permissions)?session.permissions:[];
    safiSync.revision=session.revision;
    try{
      const localCandidate=structuredClone(state);
      const payload=await apiJson('/api/v1/state');
      if(shouldBootstrapDemo(payload)){
        const demo=developmentDemoState(localCandidate);
        if(!demo||sparseOperationalState(demo))throw new Error('Demo workspace could not be prepared');
        state=demo;
        safiSync.revision=payload.revision;
        const email=safiSync.identity?.email?.toLowerCase();
        const user=email&&state.users.find(u=>String(u.email||'').toLowerCase()===email);
        CURRENT_USER=user?.id||state.users.find(u=>u.active)?.id||CURRENT_USER;
        localSaveState();
        safiSync.pending=[{state:structuredClone(state),reason:'Initialize SafiMaintain demo workspace',queuedAt:iso()}];
        localStorage.setItem(SAFI_SYNC_QUEUE,JSON.stringify(safiSync.pending));
        await flushSync();
        render();
      }else applyServerState(payload);
    }catch(error){
      if(error.status!==404)throw error;
      safiSync.pending=[{state:structuredClone(state),reason:'Initialize SafiMaintain workspace',queuedAt:iso()}];
      localStorage.setItem(SAFI_SYNC_QUEUE,JSON.stringify(safiSync.pending));
      await flushSync();
    }
    if(safiSync.pending.length)await flushSync();
    else{safiSync.mode='shared';safiSync.lastError='';paintSync()}
  }catch(_error){
    safiSync.apiAvailable=false;
    safiSync.mode='device';
    safiSync.lastError='Local field mode';
    paintSync();
  }
}

const syncRender=render;
render=function(){
  syncRender();
  paintSync();
};

if(typeof renderSecurity==='function'){
  const serverSecurity=renderSecurity;
  renderSecurity=function(){
    const html=serverSecurity();
    const summary=safiSync.mode==='shared'
      ?'<div class="notice info"><strong>Shared controls active:</strong> identity and permissions are enforced by the SafiMaintain API.</div>'
      :'<div class="notice info"><strong>Device mode:</strong> this test build is using the browser field cache. No failing server sync calls are made.</div>';
    return html+summary;
  };
}
if(typeof renderNotifications==='function'){
  const serverNotifications=renderNotifications;
  renderNotifications=function(){
    const html=serverNotifications();
    if(!safiSync.apiAvailable)return html;
    return html.replace('<button class="button" data-action="mark-alerts-read">Mark all read</button>',
      '<button class="button" data-action="mark-alerts-read">Mark all read</button><button class="button primary" data-mail-flush>Send queued mail</button>');
  };
}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-mail-flush]');
  if(!button||!safiSync.apiAvailable)return;
  event.preventDefault();
  button.disabled=true;button.textContent='Sending…';
  try{
    const result=await apiJson('/api/v1/mail/flush',{method:'POST',body:'{}'});
    await pullServer();
    toast(`${result.sent} email${result.sent===1?'':'s'} delivered`);
  }catch(error){toast(error.message)}
  finally{button.disabled=false;button.textContent='Send queued mail'}
});
window.addEventListener('online',async()=>{
  paintSync();
  if(!safiSync.apiAvailable)await startSync();
  else flushSync();
});
window.addEventListener('offline',()=>{
  safiSync.apiAvailable=false;
  safiSync.mode='device';
  safiSync.lastError='Offline · local field data ready';
  paintSync();
});
window.addEventListener('load',startSync,{once:true});
