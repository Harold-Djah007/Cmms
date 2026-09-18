'use strict';

// SafiMaintain field-quality UX v37.
// Provides local/offline attachments plus restrained CMMS telemetry and transitions.
(function(){
  const DB='safimaint-field-files-v1',STORE='files';
  let pageTimer=null;

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        const store=db.createObjectStore(STORE,{keyPath:'id'});
        store.createIndex('entity','entityKey',{unique:false});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function tx(mode,run){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const t=db.transaction(STORE,mode),s=t.objectStore(STORE);
      let result;
      try{result=run(s,t)}catch(err){db.close();reject(err);return}
      t.oncomplete=()=>{db.close();resolve(result)};
      t.onerror=()=>{db.close();reject(t.error)};
      t.onabort=()=>{db.close();reject(t.error||new Error('File operation cancelled'))};
    });
  }
  const SafiFiles={
    async add(entityType,entityId,file){
      if(file.size>25*1024*1024)throw new Error('File exceeds the 25 MB field limit');
      const record={id:uid('FILE'),entityType,entityId:String(entityId),entityKey:entityType+':'+entityId,name:file.name||'attachment',type:file.type||'application/octet-stream',size:file.size,addedAt:iso(),addedBy:currentUser()?.name||'User',blob:file};
      await tx('readwrite',store=>store.put(record));
      return record;
    },
    async list(entityType,entityId){
      const db=await openDb();
      return new Promise((resolve,reject)=>{
        const t=db.transaction(STORE,'readonly'),idx=t.objectStore(STORE).index('entity');
        const req=idx.getAll(entityType+':'+entityId);
        req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>String(b.addedAt).localeCompare(String(a.addedAt))));
        req.onerror=()=>reject(req.error);
        t.oncomplete=()=>db.close();
      });
    },
    async get(id){
      const db=await openDb();
      return new Promise((resolve,reject)=>{
        const t=db.transaction(STORE,'readonly'),req=t.objectStore(STORE).get(id);
        req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);t.oncomplete=()=>db.close();
      });
    },
    async remove(id){await tx('readwrite',store=>store.delete(id))}
  };
  window.SafiFiles=SafiFiles;

  function fileSize(n){
    if(n<1024)return n+' B';
    if(n<1024*1024)return (n/1024).toFixed(n<10240?1:0)+' KB';
    return (n/(1024*1024)).toFixed(1)+' MB';
  }
  async function paintFileList(entityType,entityId,target){
    if(!target)return;
    try{
      const files=await SafiFiles.list(entityType,entityId);
      target.innerHTML=files.length?files.map(f=>'<div class="attachment-row"><div><strong>'+esc(f.name)+'</strong><small>'+fileSize(f.size)+' · '+dateTimeFmt(f.addedAt)+' · '+esc(f.addedBy)+'</small></div><div class="attachment-actions"><button class="button small" type="button" data-local-file-open="'+esc(f.id)+'">Open</button><button class="button small danger" type="button" data-local-file-delete="'+esc(f.id)+'">Delete</button></div></div>').join(''):'<div class="attachment-empty"><strong>No files yet</strong>Add manuals, inspection photos, certificates, drawings or other asset records.</div>';
    }catch(err){target.innerHTML='<div class="notice">Files could not be loaded: '+esc(err.message)+'</div>'}
  }
  async function refreshVisibleFiles(force=false){
    const assetList=document.querySelector('[data-local-file-list]');
    if(assetList&&(force||assetList.dataset.safiFilesReady!=='1')){
      assetList.dataset.safiFilesReady='1';
      await paintFileList('asset',assetList.dataset.localFileList,assetList);
    }
    document.querySelectorAll('[data-work-file-list]').forEach(el=>{
      if(force||el.dataset.safiFilesReady!=='1'){
        el.dataset.safiFilesReady='1';
        paintFileList('work',el.dataset.workFileList,el);
      }
    });
  }
  window.SafiFileUI={paint:paintFileList,refresh:refreshVisibleFiles};

  document.addEventListener('click',async e=>{
    const pick=e.target.closest('[data-local-file-pick]');
    if(pick){e.preventDefault();document.querySelector('[data-local-file-input="'+CSS.escape(pick.dataset.localFilePick)+'"]')?.click();return}
    const open=e.target.closest('[data-local-file-open]');
    if(open){
      e.preventDefault();const f=await SafiFiles.get(open.dataset.localFileOpen);if(!f)return;
      const url=URL.createObjectURL(f.blob),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return;
    }
    const del=e.target.closest('[data-local-file-delete]');
    if(del){
      e.preventDefault();const f=await SafiFiles.get(del.dataset.localFileDelete);if(!f)return;
      if(!confirm('Delete '+f.name+' from this device?'))return;
      await SafiFiles.remove(f.id);addAudit('FILE_DELETED',f.entityId,f.name);saveState();toast('File deleted');refreshVisibleFiles(true);return;
    }
  },true);
  document.addEventListener('change',async e=>{
    const input=e.target.closest('[data-local-file-input]');
    if(!input||!input.files?.length)return;
    const files=[...input.files];input.disabled=true;
    try{
      for(const file of files)await SafiFiles.add('asset',input.dataset.localFileInput,file);
      addAudit('FILES_ADDED',input.dataset.localFileInput,files.map(f=>f.name).join(', '));saveState();
      toast(files.length===1?files[0].name+' added':files.length+' files added');
      await refreshVisibleFiles(true);
    }catch(err){toast(err.message)}
    finally{input.value='';input.disabled=false}
  },true);

  function ensureTelemetry(){
    const home=document.querySelector('.sm-home');if(!home)return;
    if(!home.querySelector('.sm37-telemetry')){
      const layer=document.createElement('div');layer.className='sm37-telemetry';layer.setAttribute('aria-hidden','true');
      layer.innerHTML='<span class="sm37-route r1"><i></i></span><span class="sm37-route r2"><i></i></span><span class="sm37-route r3"><i></i></span><span class="sm37-route r4"><i></i></span><span class="sm37-node n1"></span><span class="sm37-node n2"></span><span class="sm37-node n3"></span><span class="sm37-node n4"></span><span class="sm37-node n5"></span>';
      home.prepend(layer);
    }
    const hero=home.querySelector('.sm-visual-head strong');if(hero)hero.textContent='Operations telemetry';
    const live=home.querySelector('.sm-live-pill');if(live)live.textContent='Monitoring';
  }
  function snapshot(){
    const assets=(state.assets||[]).filter(a=>a.type!=='Site'),offline=assets.filter(a=>a.operatingState==='Offline').length;
    const open=(state.workOrders||[]).filter(w=>!['Completed','Cancelled'].includes(w.status)).length;
    const low=(state.parts||[]).filter(p=>{try{return partOnHand(p)<Number(p.min)}catch(_){return false}}).length;
    const team=(state.users||[]).filter(u=>u.active!==false).length;
    return {offline,open,low,team};
  }
  function decorateKpis(){
    const v=snapshot(),meta=[
      ['Asset health',v.offline?v.offline+' alert'+(v.offline===1?'':'s'):'Nominal'],
      ['Work queue',v.open?v.open+' active':'Clear'],
      ['Stock level',v.low?v.low+' low':'Normal'],
      ['Team status',v.team+' active']
    ];
    document.querySelectorAll('.sm-kpis .sm-kpi').forEach((tile,i)=>{
      const live=tile.querySelector('.sm-kpi-live');if(!live)return;
      let head=live.querySelector('.sm37-instrument-head');
      if(!head){head=document.createElement('span');head.className='sm37-instrument-head';head.innerHTML='<span></span><b></b>';live.appendChild(head)}
      head.querySelector('span').textContent=meta[i]?.[0]||'Telemetry';head.querySelector('b').textContent=meta[i]?.[1]||'Live';
      if(!live.querySelector('.sm37-instrument-foot')){const foot=document.createElement('span');foot.className='sm37-instrument-foot';live.appendChild(foot)}
    });
  }
  let lastAnimatedRoute=null;
  function animatePage(){
    const view=document.getElementById('appView');if(!view)return;
    const route=String(ui?.route||'');
    if(route===lastAnimatedRoute)return;
    lastAnimatedRoute=route;
    view.classList.remove('sm37-page-enter');
    requestAnimationFrame(()=>{
      view.classList.add('sm37-page-enter');
      clearTimeout(pageTimer);
      pageTimer=setTimeout(()=>view.classList.remove('sm37-page-enter'),260);
    });
  }
  let scheduled=false;
  function decorate(){
    scheduled=false;ensureTelemetry();decorateKpis();refreshVisibleFiles();animatePage();
  }
  function schedule(){
    if(scheduled)return;scheduled=true;requestAnimationFrame(decorate);
  }
  const view=document.getElementById('appView');
  if(view)new MutationObserver(schedule).observe(view,{childList:true});
  schedule();
})();
