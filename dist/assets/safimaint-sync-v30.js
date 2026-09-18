'use strict';

// Shared-service adapter. Local storage remains the field cache; the API is authoritative when available.
const SAFI_SYNC_QUEUE='safimaint-sync-queue-v1';
const SAFI_CONFLICT_BACKUP='safimaint-conflict-backup-v1';
const safiSync={mode:'device',revision:0,pending:[],busy:false,lastError:'',identity:null};
const localSaveState=saveState;

function syncLabel(){
  if(safiSync.mode==='shared')return 'Shared data current';
  if(safiSync.mode==='saving')return 'Saving securely…';
  if(safiSync.mode==='error')return 'Sync needs attention';
  return navigator.onLine?'Device mode':'Offline · changes queued';
}
function paintSync(){
  const text=document.getElementById('connectionText'),sub=document.getElementById('connectionSub');
  if(text)text.textContent=syncLabel();
  if(sub)sub.textContent=safiSync.mode==='shared'?`Revision ${safiSync.revision} · server backed`:safiSync.lastError||'Field cache ready';
  let badge=document.getElementById('syncHealth');
  if(!badge){badge=document.createElement('span');badge.id='syncHealth';badge.className='sync-health';document.querySelector('.top-actions')?.prepend(badge)}
  if(badge){badge.dataset.mode=safiSync.mode;badge.textContent=syncLabel();badge.title=sub?.textContent||''}
}
function queueSnapshot(reason='Operational change'){
  const snapshot=structuredClone(state);
  safiSync.pending=[{state:snapshot,reason,queuedAt:iso()}];
  localStorage.setItem(SAFI_SYNC_QUEUE,JSON.stringify(safiSync.pending));
  flushSync();
}
saveState=function(){
  localSaveState();
  queueSnapshot('SafiMaintain record update');
};
async function apiJson(path,options={}){
  const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})},credentials:'same-origin'});
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.includes('application/json'))throw new Error('Shared service is not available at this address');
  const body=await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error(typeof body.detail==='string'?body.detail:(body.detail?.message||`Server returned ${response.status}`));error.status=response.status;error.body=body;throw error}
  return body;
}
function applyServerState(payload){
  if(!payload?.state||!Number.isInteger(payload.revision))throw new Error('Shared service returned an invalid workspace response');
  state=payload.state;
  safiSync.revision=payload.revision;
  const email=safiSync.identity?.email?.toLowerCase();
  const user=email&&state.users.find(u=>String(u.email||'').toLowerCase()===email);
  if(user)CURRENT_USER=user.id;
  localSaveState();
  render();
}
async function pullServer(){
  const payload=await apiJson('/api/v1/state');
  applyServerState(payload);
  return payload;
}
async function flushSync(){
  if(safiSync.busy||!navigator.onLine||!safiSync.pending.length)return;
  safiSync.busy=true;safiSync.mode='saving';paintSync();
  try{
    while(safiSync.pending.length){
      const latest=safiSync.pending[safiSync.pending.length-1];
      const result=await apiJson('/api/v1/state',{method:'PUT',body:JSON.stringify({revision:safiSync.revision,state:latest.state,reason:latest.reason})});
      safiSync.revision=result.revision;
      safiSync.pending=[];
      localStorage.removeItem(SAFI_SYNC_QUEUE);
    }
    safiSync.mode='shared';safiSync.lastError='';
  }catch(error){
    if(error.status===409){
      localStorage.setItem(SAFI_CONFLICT_BACKUP,JSON.stringify({savedAt:iso(),state:safiSync.pending.at(-1)?.state||state}));
      safiSync.pending=[];localStorage.removeItem(SAFI_SYNC_QUEUE);
      try{await pullServer();toast('Another device saved first. Server data loaded; your unsynced copy was preserved for recovery.')}catch(_ignored){}
    }else if(!error.status){
      safiSync.mode='device';safiSync.lastError='Server unavailable · changes queued';
    }else{
      safiSync.mode='error';safiSync.lastError=error.message;
      toast(`Save rejected: ${error.message}`);
    }
  }finally{safiSync.busy=false;paintSync()}
}
async function startSync(){
  try{safiSync.pending=JSON.parse(localStorage.getItem(SAFI_SYNC_QUEUE)||'[]')}catch(_ignored){safiSync.pending=[]}
  paintSync();
  try{
    const session=await apiJson('/api/v1/session');
    safiSync.identity=session.identity;safiSync.revision=session.revision;
    try{await pullServer()}catch(error){
      if(error.status!==404)throw error;
      safiSync.pending=[{state:structuredClone(state),reason:'Initialize SafiMaintain workspace',queuedAt:iso()}];
      await flushSync();
    }
    if(safiSync.pending.length)await flushSync();
    else{safiSync.mode='shared';paintSync()}
  }catch(error){
    safiSync.mode=error.status===401?'device':'device';
    safiSync.lastError=error.status===401?'Sign in through the shared service to synchronize':'Shared service unavailable · working safely on this device';
    paintSync();
  }
}

// Replace the disabled record placeholder with real, permission-checked server attachments.
filesRecord=function(a){return `<section class="fx23-section"><div class="fx23-section-head"><strong>Files</strong><button class="button" type="button" data-attachment-pick="${esc(a.id)}">＋ Add file</button><input class="file-input-hidden" type="file" data-attachment-input="${esc(a.id)}" accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,text/csv"></div><div class="attachment-list" data-attachment-list="${esc(a.id)}"><div class="fx23-inline-empty">Loading manuals, photos and attachments…</div></div></section>`};
async function loadAttachments(assetId){
  const target=document.querySelector(`[data-attachment-list="${CSS.escape(assetId)}"]`);if(!target)return;
  try{
    const payload=await apiJson(`/api/v1/attachments/entity/asset/${encodeURIComponent(assetId)}`);
    target.innerHTML=payload.attachments.length?payload.attachments.map(file=>`<div class="attachment-row"><div><strong>${esc(file.original_name)}</strong><small>${Math.ceil(file.size_bytes/1024)} KB · ${dateTimeFmt(file.uploaded_at)} · ${esc(file.uploaded_by)}</small></div><a class="button small" href="/api/v1/attachments/file/${encodeURIComponent(file.id)}" target="_blank" rel="noopener">Open</a></div>`).join(''):'<div class="fx23-inline-empty">No manuals, photos or attachments have been added yet.</div>';
  }catch(error){target.innerHTML=`<div class="notice">Files require the shared service. ${esc(error.message)}</div>`}
}
document.addEventListener('click',event=>{
  const pick=event.target.closest('[data-attachment-pick]');if(!pick)return;
  event.preventDefault();document.querySelector(`[data-attachment-input="${CSS.escape(pick.dataset.attachmentPick)}"]`)?.click();
});
document.addEventListener('change',async event=>{
  const input=event.target.closest('[data-attachment-input]');if(!input||!input.files?.[0])return;
  const file=input.files[0],form=new FormData();form.append('entity_type','asset');form.append('entity_id',input.dataset.attachmentInput);form.append('file',file);
  try{
    const response=await fetch('/api/v1/attachments',{method:'POST',body:form,credentials:'same-origin'});
    const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.detail||`Upload failed (${response.status})`);
    toast(`${file.name} uploaded`);await loadAttachments(input.dataset.attachmentInput);
  }catch(error){toast(error.message)}finally{input.value=''}
});
const syncRender=render;
render=function(){syncRender();paintSync();if(ui.route==='assets'&&ui.assetRecordTab==='files'&&ui.selectedAsset)loadAttachments(ui.selectedAsset)};
const serverSecurity=renderSecurity;
renderSecurity=function(){
  const html=serverSecurity();
  const summary=safiSync.mode==='shared'
    ?'<div class="notice info"><strong>Shared controls active:</strong> identity is supplied by the hosting authentication layer, permissions are enforced again by the API, commits are versioned, and audit history is stored server-side.</div>'
    :'<div class="notice"><strong>Device mode:</strong> this browser is operating from its field cache. Deploy and sign in through the shared service to enforce organization-wide access controls.</div>';
  return html.replace(/<div class="notice"><strong>Important:<\/strong>[\s\S]*?<\/div>/,summary)
    +`<section class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Shared-service status</h3><div class="setting-row"><div><strong>Connection</strong><small>Durable organization data</small></div>${status(safiSync.mode==='shared'?'Active':'Device mode')}</div><div class="setting-row"><div><strong>Signed-in identity</strong><small>Provided by Microsoft Entra / hosting authentication</small></div><b>${esc(safiSync.identity?.email||'Not connected')}</b></div><div class="setting-row"><div><strong>Server revision</strong><small>Optimistic concurrency checkpoint</small></div><b>${esc(safiSync.revision||'—')}</b></div></section>`;
};
const serverNotifications=renderNotifications;
renderNotifications=function(){
  let html=serverNotifications();
  html=html.replace('email is queued locally in this prototype. A backend mail provider is required to actually send it.','messages remain queued until the configured SMTP relay confirms delivery. A Sent status is written only after provider acceptance.');
  return html.replace('<button class="button" data-action="mark-alerts-read">Mark all read</button>','<button class="button" data-action="mark-alerts-read">Mark all read</button><button class="button primary" data-mail-flush>Send queued mail</button>');
};
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-mail-flush]');if(!button)return;
  event.preventDefault();button.disabled=true;button.textContent='Sending…';
  try{const result=await apiJson('/api/v1/mail/flush',{method:'POST',body:'{}'});await pullServer();toast(`${result.sent} email${result.sent===1?'':'s'} delivered`)}
  catch(error){toast(error.message)}finally{button.disabled=false;button.textContent='Send queued mail'}
});
window.addEventListener('online',()=>{paintSync();flushSync()});
window.addEventListener('offline',()=>{safiSync.mode='device';safiSync.lastError='Offline · changes queued';paintSync()});
window.addEventListener('load',startSync,{once:true});
