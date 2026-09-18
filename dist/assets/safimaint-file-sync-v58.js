'use strict';

// SafiMaintain attachment sync v58.
// Files remain usable offline in IndexedDB and upload to the shared service when connectivity returns.
(function(){
  const DB='safimaint-field-files-v1',STORE='files';
  let syncing=false,lastRun=null,lastError='';

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('entity','entityKey',{unique:false})}};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)
    })
  }
  async function withStore(mode,fn){
    const db=await openDb();
    try{return await new Promise((resolve,reject)=>{const t=db.transaction(STORE,mode),s=t.objectStore(STORE),req=fn(s);if(req&&'onsuccess'in req){req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)}else{t.oncomplete=()=>resolve(req);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)}})}
    finally{db.close()}
  }
  async function allLocal(){return await withStore('readonly',s=>s.getAll())||[]}
  async function putLocal(record){return await withStore('readwrite',s=>s.put(record))}
  async function localFor(entityType,entityId){return (await allLocal()).filter(f=>f.entityType===entityType&&String(f.entityId)===String(entityId)).sort((a,b)=>String(b.addedAt).localeCompare(String(a.addedAt)))}
  async function pendingCount(){return (await allLocal()).filter(f=>!f.remoteId).length}

  function apiReady(){return navigator.onLine&&typeof safiSync!=='undefined'&&safiSync.apiAvailable}
  async function uploadRecord(record){
    if(!record?.blob||record.remoteId)return record;
    record.syncStatus='Uploading';record.lastSyncError='';await putLocal(record);
    try{
      const fd=new FormData();fd.append('entity_type',record.entityType);fd.append('entity_id',String(record.entityId));fd.append('file',record.blob,record.name||'attachment');
      const response=await fetch('/api/v1/attachments',{method:'POST',body:fd,credentials:'same-origin'});
      if(!response.ok){let detail='HTTP '+response.status;try{const p=await response.json();detail=typeof p.detail==='string'?p.detail:JSON.stringify(p.detail||p)}catch(_ignored){}throw new Error(detail)}
      const remote=await response.json();record.remoteId=remote.id;record.remoteSha256=remote.sha256;record.syncedAt=iso();record.syncStatus='Synced';record.lastSyncError='';await putLocal(record);return record
    }catch(err){record.syncStatus='Error';record.lastSyncError=err.message;await putLocal(record);throw err}
  }
  async function syncPending({quiet=true}={}){
    if(syncing||!apiReady())return{uploaded:0,pending:await pendingCount(),error:lastError};
    syncing=true;let uploaded=0;
    try{
      const files=(await allLocal()).filter(f=>!f.remoteId);
      for(const f of files){try{await uploadRecord(f);uploaded++}catch(err){lastError=err.message}}
      lastRun=iso();if(uploaded&&!quiet)toast(uploaded+' attachment'+(uploaded===1?'':'s')+' synced');
      await repaintVisible();return{uploaded,pending:await pendingCount(),error:lastError}
    }finally{syncing=false;updateSyncBadges()}
  }
  async function remoteFor(entityType,entityId){
    if(!apiReady())return[];
    try{const response=await fetch('/api/v1/attachments/entity/'+encodeURIComponent(entityType)+'/'+encodeURIComponent(entityId),{credentials:'same-origin'});if(!response.ok)return[];const data=await response.json();return data.attachments||[]}catch(_ignored){return[]}
  }
  function fileSize(n){n=Number(n||0);if(n<1024)return n+' B';if(n<1024*1024)return(n/1024).toFixed(n<10240?1:0)+' KB';return(n/(1024*1024)).toFixed(1)+' MB'}
  async function paint(entityType,entityId,target){
    if(!target)return;
    const local=await localFor(entityType,entityId),remote=await remoteFor(entityType,entityId),localRemote=new Set(local.map(f=>f.remoteId).filter(Boolean));
    const localRows=local.map(f=>'<div class="v58-file-row"><span><strong>'+esc(f.name)+'<b class="v58-file-state '+(f.remoteId?'synced':f.syncStatus==='Error'?'error':'pending')+'">'+(f.remoteId?'Synced':f.syncStatus==='Error'?'Sync error':'Device / pending')+'</b></strong><small>'+fileSize(f.size)+' · '+dateTimeFmt(f.addedAt)+(f.lastSyncError?' · '+esc(f.lastSyncError):'')+'</small></span><span class="attachment-actions"><button class="button small" type="button" data-local-file-open="'+esc(f.id)+'">Open</button>'+(!f.remoteId?'<button class="button small" type="button" data-v58-sync-file="'+esc(f.id)+'">Sync</button>':'')+'<button class="button small danger" type="button" data-local-file-delete="'+esc(f.id)+'">'+(f.remoteId?'Remove device copy':'Delete')+'</button></span></div>');
    const remoteRows=remote.filter(r=>!localRemote.has(r.id)).map(r=>'<div class="v58-file-row"><span><strong>'+esc(r.original_name||r.name||'Attachment')+'<b class="v58-file-state synced">Shared</b></strong><small>'+fileSize(r.size_bytes||r.size)+' · '+dateTimeFmt(r.uploaded_at)+' · '+esc(r.uploaded_by||'')+'</small></span><span><button class="button small" type="button" data-v58-remote-file="'+esc(r.id)+'">Open</button></span></div>');
    target.innerHTML=[...localRows,...remoteRows].join('')||'<div class="attachment-empty"><strong>No files yet</strong>Add photos, manuals, certificates or inspection evidence. Files added offline will sync later.</div>'
  }
  async function repaintVisible(){
    const jobs=[...document.querySelectorAll('[data-local-file-list]')].map(el=>paint('asset',el.dataset.localFileList,el));
    jobs.push(...[...document.querySelectorAll('[data-work-file-list]')].map(el=>paint('work',el.dataset.workFileList,el)));
    await Promise.allSettled(jobs)
  }
  async function updateSyncBadges(){
    const pending=await pendingCount();document.querySelectorAll('[data-v58-pending-count]').forEach(el=>el.textContent=String(pending));document.querySelectorAll('[data-v58-last-sync]').forEach(el=>el.textContent=lastRun?dateTimeFmt(lastRun):'Not yet')
  }
  window.SafiAttachmentSync={syncPending,pendingCount,repaintVisible};

  if(window.SafiFileUI){window.SafiFileUI.paint=paint;window.SafiFileUI.refresh=repaintVisible}

  const baseRender=render;
  render=function(){
    baseRender();
    setTimeout(()=>{repaintVisible();updateSyncBadges()},40);
    if(ui.route==='sync-center'){
      const page=document.querySelector('#appView .v50-page');if(page&&!page.querySelector('.v58-sync-card'))page.insertAdjacentHTML('afterbegin','<div class="v58-sync-card"><div><small>Local attachments pending</small><strong data-v58-pending-count>…</strong></div><div><small>Last file sync</small><strong data-v58-last-sync>'+(lastRun?dateTimeFmt(lastRun):'Not yet')+'</strong></div><div><small>Attachment service</small><strong>'+(apiReady()?'Available':'Offline / unavailable')+'</strong></div><div><small>Maximum file size</small><strong>25 MB</strong></div></div>')
    }
  };
  window.render=render;

  document.addEventListener('change',e=>{
    if(e.target.matches('[data-local-file-input],[data-work-file-input],#v53RequestFiles'))setTimeout(()=>syncPending({quiet:true}),500)
  },true);
  document.addEventListener('click',async e=>{
    const sync=e.target.closest('[data-v58-sync-file]');if(sync){e.preventDefault();e.stopImmediatePropagation();const f=await window.SafiFiles?.get(sync.dataset.v58SyncFile);if(!f)return;if(!apiReady()){toast('Shared service is not available yet');return}try{await uploadRecord(f);toast(f.name+' synced');await repaintVisible()}catch(err){toast('File sync failed: '+err.message)}return}
    const remote=e.target.closest('[data-v58-remote-file]');if(remote){e.preventDefault();e.stopImmediatePropagation();window.open('/api/v1/attachments/file/'+encodeURIComponent(remote.dataset.v58RemoteFile),'_blank','noopener');return}
    if(e.target.closest('[data-v55-sync-retry]'))setTimeout(()=>syncPending({quiet:false}),1200)
  },true);

  window.addEventListener('online',()=>setTimeout(()=>syncPending({quiet:true}),1200));
  setTimeout(()=>syncPending({quiet:true}),1800);
  setInterval(()=>syncPending({quiet:true}),60000);
})();