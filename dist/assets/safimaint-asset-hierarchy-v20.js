'use strict';

// SafiMaintain asset hierarchy v20
// Fiix-inspired parent/sub-asset workflow with reliable edit persistence.
(function(){
  const COLLAPSE_KEY='safimaint-asset-hierarchy-collapsed-v20';
  let collapsed=new Set();
  try{collapsed=new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY)||'[]'))}catch(_){collapsed=new Set()}

  const isBlank=v=>v===null||v===undefined||String(v).trim()==='';
  const site=()=>state.sites?.find(s=>s.active)||state.sites?.[0]||null;
  const assets=()=>state.assets.filter(a=>a.type!=='Site'&&(!site()||!a.siteId||a.siteId===site().id));
  const byId=id=>assets().find(a=>String(a.id)===String(id));
  const children=id=>assets().filter(a=>String(a.parentId||'')===String(id||''));
  const roots=()=>{const ids=new Set(assets().map(a=>String(a.id)));return assets().filter(a=>isBlank(a.parentId)||!ids.has(String(a.parentId)))};
  const activeWorkCount=id=>state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status)&&(w.assetIds||[]).some(x=>String(x)===String(id))).length;

  function descendants(id,out=[],seen=new Set()){
    children(id).forEach(c=>{const k=String(c.id);if(seen.has(k))return;seen.add(k);out.push(c);descendants(c.id,out,seen)});
    return out;
  }
  function path(asset){
    const out=[];const seen=new Set();let cur=asset;
    while(cur&&!seen.has(String(cur.id))){seen.add(String(cur.id));out.unshift(cur);cur=isBlank(cur.parentId)?null:byId(cur.parentId)}
    return out;
  }
  function saveCollapsed(){localStorage.setItem(COLLAPSE_KEY,JSON.stringify([...collapsed]))}
  function icon(type){return ({Facility:'▥','Production area':'▦',Equipment:'▣',Subassembly:'⬡',Tool:'⚙'})[type]||'▣'}
  function typeLabel(type){return type==='Production area'?'Area':type||'Asset'}

  function visibleForSearch(q){
    if(!q)return null;
    const visible=new Set();
    assets().forEach(a=>{
      const hay=`${a.code||''} ${a.name||''} ${a.type||''} ${a.category||''} ${a.location||''}`.toLowerCase();
      if(!hay.includes(q))return;
      let cur=a;const seen=new Set();
      while(cur&&!seen.has(String(cur.id))){visible.add(String(cur.id));seen.add(String(cur.id));cur=isBlank(cur.parentId)?null:byId(cur.parentId)}
    });
    return visible;
  }

  function treeNode(asset,depth,visible,q){
    if(visible&&!visible.has(String(asset.id)))return'';
    const kids=children(asset.id).filter(c=>!visible||visible.has(String(c.id)));
    const hasKids=kids.length>0;
    const closed=!q&&collapsed.has(String(asset.id));
    const work=activeWorkCount(asset.id);
    return `<div class="v20-node" style="--depth:${Math.min(depth,8)}">
      <div class="v20-row ${asset.id===ui.selectedAsset?'active':''}">
        <button class="v20-main" type="button" data-select-asset="${asset.id}">
          <span class="v20-type-icon">${icon(asset.type)}</span>
          <span class="v20-copy"><strong>${esc(asset.name)}</strong><small>${esc(asset.code)} · ${esc(typeLabel(asset.type))}${asset.location?` · ${esc(asset.location)}`:''}</small></span>
          <span class="v20-status ${asset.operatingState==='Offline'?'offline':'online'}"><i></i>${esc(asset.operatingState||'Unknown')}</span>
        </button>
        <div class="v20-actions">
          <button type="button" data-v20-add-child="${asset.id}" title="Add sub-asset">＋</button>
          <button type="button" data-edit-asset="${asset.id}" title="Edit asset">✎</button>
          <button type="button" data-v20-delete="${asset.id}" title="Delete asset">⋯</button>
        </div>
      </div>
      <div class="v20-row-meta">
        ${work?`<span>${work} open work order${work===1?'':'s'}</span>`:'<span>No open work</span>'}
        ${hasKids?`<button type="button" data-v20-toggle="${asset.id}">${closed?'View':'Hide'} sub-assets (${kids.length}) <b>${closed?'⌄':'⌃'}</b></button>`:'<span>No sub-assets</span>'}
      </div>
      ${hasKids&&!closed?`<div class="v20-children">${kids.map(c=>treeNode(c,depth+1,visible,q)).join('')}</div>`:''}
    </div>`;
  }

  function treeHtml(){
    const q=String(ui.assetSearch||'').trim().toLowerCase();
    const visible=visibleForSearch(q);
    const list=roots().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    if(!list.length)return `<div class="v20-empty"><strong>No assets yet</strong><span>Create a top-level facility, area or machine, then add sub-assets underneath it.</span><button class="button primary" data-action="add-asset">＋ Add first asset</button></div>`;
    const html=list.map(a=>treeNode(a,0,visible,q)).join('');
    return html||`<div class="v20-empty"><strong>No matching assets</strong><span>Try another search.</span></div>`;
  }

  function hierarchySummary(asset){
    const p=isBlank(asset.parentId)?null:byId(asset.parentId);
    const kids=children(asset.id);
    const currentPath=path(asset);
    return `<section class="v20-hierarchy-card">
      <div class="v20-hierarchy-head"><div><small>Hierarchy</small><h3>${currentPath.map(x=>esc(x.name)).join(' <span>›</span> ')}</h3></div><button class="button" type="button" data-v20-add-child="${asset.id}">＋ Add sub-asset</button></div>
      <div class="v20-hierarchy-grid">
        <button class="v20-relation" type="button" ${p?`data-select-asset="${p.id}"`:''} ${p?'':'disabled'}><span>Parent asset</span><strong>${p?esc(p.name):'Top-level asset'}</strong><small>${p?`${esc(p.code)} · ${esc(typeLabel(p.type))}`:'No parent assigned'}</small></button>
        <div class="v20-relation"><span>Sub-assets</span><strong>${kids.length}</strong><small>${kids.length?'Nested directly under this asset':'No direct sub-assets yet'}</small></div>
      </div>
      ${kids.length?`<div class="v20-subassets">${kids.map(k=>`<button type="button" data-select-asset="${k.id}"><span>${icon(k.type)}</span><span><strong>${esc(k.name)}</strong><small>${esc(k.code)} · ${esc(typeLabel(k.type))}</small></span><b>›</b></button>`).join('')}</div>`:''}
    </section>`;
  }

  function detail(asset){
    if(!asset)return `<section class="card v20-select"><strong>Select an asset</strong><span>Choose an asset from the hierarchy to view its record.</span></section>`;
    let base=renderAssetDetail(asset);
    const controls=`<button class="button" type="button" data-v20-add-child="${asset.id}">＋ Add sub-asset</button><button class="button danger" type="button" data-v20-delete="${asset.id}">Delete</button>`;
    base=base.replace('<div class="detail-actions">',`<div class="detail-actions">${controls}`);
    base=base.replace('<div class="tabs">',`${hierarchySummary(asset)}<div class="tabs">`);
    return base;
  }

  function renderAssetsV20(){
    const list=assets();
    if(!list.some(a=>String(a.id)===String(ui.selectedAsset)))ui.selectedAsset=list[0]?.id||null;
    const s=site();
    return pageHead('Asset management','Asset hierarchy','Create parent-child asset structures, drill into sub-assets, and keep every record connected to the equipment around it.',`<button class="button primary" data-action="add-asset">＋ Add asset</button>`)
      +`<div class="v20-layout">
        <aside class="card v20-browser">
          <div class="v20-site"><img src="assets/safimaint-logo.svg" alt=""><div><small>Current site</small><strong>${esc(s?.name||'Workspace')}</strong><span>${list.length} maintainable asset${list.length===1?'':'s'}</span></div></div>
          <div class="v20-browser-head"><div><h2>Asset hierarchy</h2><p>Open a parent to view the assets nested beneath it.</p></div><button class="button primary" type="button" data-action="add-asset">＋ Top-level</button></div>
          <div class="v20-search"><span>⌕</span><input data-filter="asset" value="${esc(ui.assetSearch||'')}" placeholder="Search asset name or code"><b>${list.length}</b></div>
          <div class="v20-tree">${treeHtml()}</div>
        </aside>
        <main class="v20-detail">${detail(getAsset(ui.selectedAsset))}</main>
      </div>`;
  }

  function parentOptionsFor(asset){
    const banned=new Set(asset?[String(asset.id),...descendants(asset.id).map(a=>String(a.id))]:[]);
    return [{value:'',label:'Top level — no parent'},...assets().filter(a=>!banned.has(String(a.id))).map(a=>({value:a.id,label:`${a.code} · ${a.name} (${typeLabel(a.type)})`}))];
  }

  function placementPreview(parentId,name,type){
    const p=parentId?byId(parentId):null;
    const chain=p?path(p):[];
    const label=name||'New asset';
    return `<div class="v20-placement"><small>Hierarchy preview</small><div>${chain.map(x=>`<span>${esc(x.name)}</span><b>›</b>`).join('')}<strong>${esc(label)}</strong></div><p>${p?`This ${esc(typeLabel(type))} will become a sub-asset of ${esc(p.name)}.`:`This ${esc(typeLabel(type))} will be a top-level asset.`}</p></div>`;
  }

  function openAssetEditor(assetOrId=null,suggestedParentId=null){
    const existing=typeof assetOrId==='string'?getAsset(assetOrId):assetOrId;
    if(existing?.type==='Site')return;
    const id=existing?.id||null;
    const users=[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))];
    const groups=[{value:'',label:'Unassigned'},...state.groups.map(g=>({value:g.id,label:g.name}))];
    const parentDefault=suggestedParentId!==null?suggestedParentId:(existing?.parentId||'');
    const typeOptions=['Facility','Production area','Equipment','Subassembly','Tool'].map(x=>({value:x,label:x}));
    openModal({eyebrow:'Asset hierarchy',title:existing?'Edit asset':'Create asset',submitText:existing?'Save changes':'Create asset',body:`
      <div class="v20-editor-intro"><div><strong>${existing?'Update asset information':'Create the asset, then place it in the hierarchy'}</strong><p>Parent and sub-asset relationships stay visible on the asset record, similar to Fiix hierarchy navigation.</p></div></div>
      <div id="v20Placement">${placementPreview(parentDefault,existing?.name||'',existing?.type||'Equipment')}</div>
      <div class="v20-form-section"><h3>Asset details</h3><div class="form-grid">
        ${field('code','Asset code',existing?.code||'',{required:true})}${field('name','Asset name',existing?.name||'',{required:true})}
        ${field('type','Asset type',existing?.type||'Equipment',{type:'select',options:typeOptions})}${field('category','Category',existing?.category||'Equipment')}
        ${field('location','Location',existing?.location||'')}${field('criticality','Criticality',existing?.criticality||'B',{type:'select',options:['A','B','C'].map(x=>({value:x,label:x}))})}
        ${field('condition','Condition',existing?.condition||'Healthy',{type:'select',options:['Healthy','Attention','Critical'].map(x=>({value:x,label:x}))})}${field('manufacturer','Manufacturer',existing?.manufacturer||'')}
        ${field('model','Model',existing?.model||'')}${field('serial','Serial number',existing?.serial||'')}
      </div></div>
      <div class="v20-form-section"><h3>Hierarchy placement</h3><div class="form-grid">
        ${field('parentId','Parent asset',parentDefault,{type:'select',options:parentOptionsFor(existing)})}
        ${field('ownerUserId','Responsible person',existing?.ownerUserId||'',{type:'select',options:users})}
        ${field('ownerGroupId','Responsible group',existing?.ownerGroupId||'',{type:'select',options:groups})}
        ${field('warrantyExpiry','Warranty expiry',existing?.warrantyExpiry||'',{type:'date'})}
      </div></div>`,onSubmit:fd=>{
        const v=Object.fromEntries(fd.entries());
        const code=String(v.code||'').trim(),name=String(v.name||'').trim();
        if(!code||!name){toast('Asset code and name are required');return}
        const duplicate=state.assets.find(a=>a.type!=='Site'&&String(a.id)!==String(id)&&String(a.code||'').trim().toLowerCase()===code.toLowerCase());
        if(duplicate){toast(`Asset code ${code} is already in use`);return}
        const parentId=String(v.parentId||'').trim()||null;
        if(id){
          const invalid=new Set([String(id),...descendants(id).map(a=>String(a.id))]);
          if(parentId&&invalid.has(String(parentId))){toast('An asset cannot be placed beneath itself or one of its sub-assets');return}
        }
        const live=id?getAsset(id):null;
        const next={code,name,type:v.type,category:v.category,location:v.location,criticality:v.criticality,condition:v.condition,manufacturer:v.manufacturer,model:v.model,serial:v.serial,parentId,ownerUserId:v.ownerUserId||'',ownerGroupId:v.ownerGroupId||'',warrantyExpiry:v.warrantyExpiry||'',siteId:live?.siteId||site()?.id||null};
        let savedId=id;
        if(live){
          Object.assign(live,next);
          state.assetEvents.unshift({id:uid('AE'),assetId:live.id,type:'Asset updated',at:iso(),userId:CURRENT_USER,detail:`${live.code} updated; parent=${parentId||'top level'}`});
          addAudit('ASSET_UPDATED',live.id,`${live.code} ${live.name} updated`);
        }else{
          const created={id:uid('AST'),commissioned:day(0),bom:[],operatingState:'Online',...next};
          state.assets.push(created);savedId=created.id;
          state.assetEvents.unshift({id:uid('AE'),assetId:created.id,type:'Asset created',at:iso(),userId:CURRENT_USER,detail:`${created.code} created; parent=${parentId||'top level'}`});
          addAudit('ASSET_CREATED',created.id,`${created.code} ${created.name}`);
        }
        ui.selectedAsset=savedId;ui.assetSearch='';
        saveState();
        // Verify persistence before repainting. If localStorage write failed, don't hide it.
        try{
          const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
          const persisted=(stored.assets||[]).find(a=>String(a.id)===String(savedId));
          if(!persisted||persisted.name!==name||persisted.code!==code)throw new Error('Persistence verification failed');
        }catch(err){console.error(err);toast('Could not verify the asset update on this device');return}
        closeModal();
        requestAnimationFrame(()=>{render();toast(live?'Asset changes saved':'Asset created')});
      }});

    const form=document.getElementById('modalForm');
    const updatePreview=()=>{
      const parentId=form?.querySelector('[name="parentId"]')?.value||'';
      const name=form?.querySelector('[name="name"]')?.value||'';
      const type=form?.querySelector('[name="type"]')?.value||'Equipment';
      const target=document.getElementById('v20Placement');if(target)target.innerHTML=placementPreview(parentId,name,type);
    };
    form?.querySelector('[name="parentId"]')?.addEventListener('change',updatePreview);
    form?.querySelector('[name="type"]')?.addEventListener('change',updatePreview);
    form?.querySelector('[name="name"]')?.addEventListener('input',updatePreview);
  }

  window.renderAssets=renderAssetsV20;renderAssets=renderAssetsV20;
  window.showAssetForm=openAssetEditor;showAssetForm=openAssetEditor;

  document.addEventListener('click',e=>{
    const edit=e.target.closest('[data-edit-asset]');
    if(edit){e.preventDefault();e.stopImmediatePropagation();openAssetEditor(String(edit.dataset.editAsset));return}
    const child=e.target.closest('[data-v20-add-child]');
    if(child){e.preventDefault();e.stopImmediatePropagation();openAssetEditor(null,String(child.dataset.v20AddChild));return}
    const toggle=e.target.closest('[data-v20-toggle]');
    if(toggle){e.preventDefault();e.stopImmediatePropagation();const id=String(toggle.dataset.v20Toggle);collapsed.has(id)?collapsed.delete(id):collapsed.add(id);saveCollapsed();render();return}
    const del=e.target.closest('[data-v20-delete]');
    if(del){e.preventDefault();e.stopImmediatePropagation();if(typeof window.showDeleteAsset==='function')window.showDeleteAsset(String(del.dataset.v20Delete));return}
  },true);

  if(ui.route==='assets')render();
})();
