'use strict';

// SafiMaintain asset explorer v19.
// Keeps the site/workspace outside the maintainable asset hierarchy, provides a
// polished tree explorer, and adds safe hard-delete support for asset records.
(function(){
  const COLLAPSE_KEY='safimaint-asset-explorer-collapsed-v19';
  let collapsed=new Set();
  try{collapsed=new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY)||'[]'))}catch(_){collapsed=new Set()}

  function saveCollapsed(){localStorage.setItem(COLLAPSE_KEY,JSON.stringify([...collapsed]))}
  function isBlank(v){return v===null||v===undefined||String(v).trim()===''}
  function siteAssetIds(){return new Set((state.assets||[]).filter(a=>a.type==='Site').map(a=>String(a.id)))}
  function currentSite(){return (state.sites||[]).find(s=>s.active)!==(undefined)?(state.sites||[]).find(s=>s.active):(state.sites||[])[0]||null}
  function allMaintainable(){return (state.assets||[]).filter(a=>a.type!=='Site')}
  function siteMaintainable(){
    const site=currentSite();
    if(!site)return allMaintainable();
    return allMaintainable().filter(a=>!a.siteId||a.siteId===site.id);
  }

  function detachSiteRoots(){
    if(!Array.isArray(state.assets))return 0;
    const sites=siteAssetIds();
    const ids=new Set(state.assets.map(a=>String(a.id)));
    let changed=0;
    state.assets.forEach(a=>{
      if(a.type==='Site'){
        if(a.parentId!==null){a.parentId=null;changed++}
        return;
      }
      const raw=isBlank(a.parentId)?null:String(a.parentId);
      if(raw&&sites.has(raw)){a.parentId=null;changed++;return}
      if(raw&&(!ids.has(raw)||raw===String(a.id))){a.parentId=null;changed++}
    });
    return changed;
  }

  function childrenOf(id,source=siteMaintainable()){
    return source.filter(a=>String(a.parentId||'')===String(id||''));
  }
  function descendantsOf(id,out=[],source=siteMaintainable(),seen=new Set()){
    childrenOf(id,source).forEach(c=>{
      const key=String(c.id);if(seen.has(key))return;seen.add(key);out.push(c);descendantsOf(c.id,out,source,seen);
    });
    return out;
  }
  function topLevel(source=siteMaintainable()){
    const ids=new Set(source.map(a=>String(a.id)));
    return source.filter(a=>isBlank(a.parentId)||!ids.has(String(a.parentId)));
  }
  function pathFor(asset){
    if(!asset)return[];
    const source=siteMaintainable();
    const byId=new Map(source.map(a=>[String(a.id),a]));
    const result=[];const seen=new Set();let cur=asset;
    while(cur&&cur.type!=='Site'&&!seen.has(String(cur.id))){
      seen.add(String(cur.id));result.unshift(cur);
      cur=isBlank(cur.parentId)?null:byId.get(String(cur.parentId));
    }
    return result;
  }

  function typeLabel(type){
    return ({Facility:'Facility','Production area':'Area',Equipment:'Equipment',Subassembly:'Subassembly',Tool:'Tool'})[type]||type||'Asset';
  }
  function iconSvg(type){
    const icons={
      Facility:'<path d="M4 20V6.7L12 3l8 3.7V20h-6v-5h-4v5H4Zm3-3h1v-2H7v2Zm0-4h1v-2H7v2Zm0-4h1V7H7v2Zm4 4h2v-2h-2v2Zm0-4h2V7h-2v2Zm5 4h1v-2h-1v2Zm0-4h1V7h-1v2Z"/>',
      'Production area':'<path d="M4 5h16v4H4V5Zm0 6h7v8H4v-8Zm9 0h7v8h-7v-8Zm-7 2v4h3v-4H6Zm9 0v4h3v-4h-3Z"/>',
      Equipment:'<path d="M7 3h10v4h2v14H5V7h2V3Zm2 2v2h6V5H9Zm-1 6v7h8v-7H8Zm2 2h4v3h-4v-3Z"/>',
      Subassembly:'<path d="M12 2 7.8 4.4v4.8L3.6 11.6v4.8L7.8 18.8 12 16.4l4.2 2.4 4.2-2.4v-4.8l-4.2-2.4V4.4L12 2Zm0 2.3 2.2 1.2L12 6.8 9.8 5.5 12 4.3ZM5.6 12.7l2.2-1.2 2.2 1.2v2.5l-2.2 1.3-2.2-1.3v-2.5Zm8.4 0 2.2-1.2 2.2 1.2v2.5l-2.2 1.3-2.2-1.3v-2.5Z"/>',
      Tool:'<path d="M14.6 5.4a4.2 4.2 0 0 0-5.2 5.2L3.7 16.3a1.5 1.5 0 0 0 0 2.1l1.9 1.9a1.5 1.5 0 0 0 2.1 0l5.7-5.7a4.2 4.2 0 0 0 5.2-5.2l-2.5 2.5-2.1-.6-.6-2.1 2.5-2.5Z"/>'
    };
    const path=icons[type]||icons.Equipment;
    return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${path}</svg>`;
  }

  function visibleIdsForSearch(q,source){
    if(!q)return null;
    const byId=new Map(source.map(a=>[String(a.id),a]));
    const visible=new Set();
    source.forEach(a=>{
      const text=`${a.code||''} ${a.name||''} ${a.type||''} ${a.category||''} ${a.location||''}`.toLowerCase();
      if(!text.includes(q))return;
      let cur=a;const seen=new Set();
      while(cur&&!seen.has(String(cur.id))){
        const key=String(cur.id);visible.add(key);seen.add(key);
        cur=isBlank(cur.parentId)?null:byId.get(String(cur.parentId));
      }
    });
    return visible;
  }

  function statusMeta(asset){
    const online=asset.operatingState==='Online';
    const childCount=childrenOf(asset.id).length;
    return `<span class="asset-v19-type">${esc(typeLabel(asset.type))}</span>${childCount?`<span class="asset-v19-count" title="${childCount} direct child asset${childCount===1?'':'s'}">${childCount}</span>`:''}<span class="asset-v19-state ${online?'online':'offline'}"><i></i>${esc(asset.operatingState||'Unknown')}</span>`;
  }

  function treeHtml(q){
    const source=siteMaintainable();
    const visible=visibleIdsForSearch(q,source);
    const byParent=new Map();
    source.forEach(a=>{
      const key=isBlank(a.parentId)?'__ROOT__':String(a.parentId);
      if(!byParent.has(key))byParent.set(key,[]);
      byParent.get(key).push(a);
    });
    byParent.forEach(list=>list.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))));
    const roots=topLevel(source).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    let rendered=0;
    function node(asset,depth){
      if(visible&&!visible.has(String(asset.id)))return'';
      rendered++;
      const children=(byParent.get(String(asset.id))||[]).filter(c=>!visible||visible.has(String(c.id)));
      const hasChildren=children.length>0;
      const isCollapsed=!q&&collapsed.has(String(asset.id));
      const title=`${asset.code||''} · ${typeLabel(asset.type)}${asset.location?` · ${asset.location}`:''}`;
      return `<div class="asset-tree-node asset-v19-node" style="--tree-depth:${Math.min(depth,9)}">
        ${hasChildren?`<button class="asset-tree-toggle asset-v19-toggle" type="button" data-v19-tree-toggle="${asset.id}" aria-label="${isCollapsed?'Expand':'Collapse'} ${esc(asset.name)}"><span>${isCollapsed?'›':'⌄'}</span></button>`:`<span class="asset-tree-toggle asset-v19-toggle empty"><span>·</span></span>`}
        <button class="asset-tree-row asset-v19-row ${asset.id===ui.selectedAsset?'active':''}" type="button" data-select-asset="${asset.id}" title="${esc(asset.name)}">
          <span class="asset-tree-icon asset-v19-icon">${iconSvg(asset.type)}</span>
          <span class="asset-tree-copy"><strong>${esc(asset.name)}</strong><small>${esc(title)}</small></span>
          <span class="asset-tree-meta asset-v19-meta">${statusMeta(asset)}</span>
        </button>
        <div class="asset-v19-row-actions">
          <button type="button" class="asset-v19-mini" data-v19-add-child="${asset.id}" title="Add child asset" aria-label="Add child under ${esc(asset.name)}">＋</button>
          <button type="button" class="asset-v19-mini" data-v19-menu="${asset.id}" title="More actions" aria-label="More actions for ${esc(asset.name)}">•••</button>
        </div>
      </div>${hasChildren&&!isCollapsed?children.map(c=>node(c,depth+1)).join(''):''}`;
    }
    const html=roots.map(r=>node(r,0)).join('');
    if(rendered)return html;
    return q?`<div class="asset-tree-empty asset-v19-empty"><strong>No matching assets</strong><span>Try another name, code, type, category or location.</span></div>`:`<div class="asset-tree-empty asset-v19-empty"><strong>No assets yet</strong><span>Add a facility, area, machine, subassembly or tool to start your hierarchy.</span><button type="button" class="button primary" data-action="add-asset">＋ Add your first asset</button></div>`;
  }

  function siteContext(){
    const site=currentSite();
    const count=siteMaintainable().length;
    const offline=siteMaintainable().filter(a=>a.operatingState==='Offline').length;
    return `<div class="asset-v19-site-context">
      <div class="asset-v19-site-brand">
        <span class="asset-v19-logo"><img src="assets/safimaint-logo.svg" alt=""></span>
        <span><small>Current site</small><strong>${esc(site?.name||'Workspace')}</strong><em>${esc(site?.code||'SITE')} · ${count} asset${count===1?'':'s'}${offline?` · ${offline} offline`:''}</em></span>
      </div>
      <button class="button primary asset-v19-add" type="button" data-action="add-asset">＋ Add asset</button>
    </div>`;
  }

  function breadcrumb(asset){
    const path=pathFor(asset);
    return `<div class="asset-breadcrumb asset-v19-breadcrumb"><span class="asset-v19-breadcrumb-label">Asset path</span>${path.map((p,i)=>i===path.length-1?`<strong>${esc(p.name)}</strong>`:`<button type="button" data-select-asset="${p.id}">${esc(p.name)}</button><span class="sep">›</span>`).join('')}</div>`;
  }

  function detailFor(asset){
    if(!asset)return `<section class="card asset-v19-welcome"><div class="asset-v19-welcome-icon">${iconSvg('Equipment')}</div><h2>Select an asset</h2><p>Choose a record from the hierarchy to view work history, BOM, meters, condition and operational state.</p></section>`;
    let html=renderAssetDetail(asset);
    const extra=`<button class="button asset-v19-child-button" type="button" data-v19-add-child="${asset.id}">＋ Add child</button><button class="button danger asset-v19-delete-button" type="button" data-v19-delete="${asset.id}">Delete asset</button>`;
    html=html.replace('<div class="detail-actions">',`<div class="detail-actions">${extra}`);
    return `${breadcrumb(asset)}${html}`;
  }

  function renderExplorer(){
    const repaired=detachSiteRoots();
    if(repaired)saveState();
    const source=siteMaintainable();
    if(!source.some(a=>a.id===ui.selectedAsset))ui.selectedAsset=source[0]?.id||null;
    const q=String(ui.assetSearch||'').trim().toLowerCase();
    const selected=getAsset(ui.selectedAsset);
    const titleCount=source.length?` ${source.length}`:'';
    return pageHead('Asset management',`Asset register${titleCount}`,'Build the hierarchy around the equipment you actually maintain. Your site stays as workspace context, not as an asset parent.',`<button class="button primary" data-action="add-asset">＋ Add asset</button>`)
      +`<div class="asset-hierarchy-shell asset-v19-shell">
        <section class="card asset-tree-card asset-v19-explorer">
          ${siteContext()}
          <div class="asset-tree-head asset-v19-head">
            <div class="asset-tree-head-row asset-v19-head-row">
              <div class="asset-v19-heading"><span class="asset-v19-heading-icon">${iconSvg('Subassembly')}</span><span><h2>Asset hierarchy</h2><p>Organize assets by facility, area, equipment and components.</p></span></div>
              <div class="asset-tree-controls asset-v19-controls"><button class="button" type="button" id="assetV19ExpandAll">Expand all</button><button class="button" type="button" id="assetV19CollapseAll">Collapse all</button></div>
            </div>
            <div class="asset-v19-search-wrap"><span>⌕</span><input class="asset-tree-search" data-filter="asset" value="${esc(ui.assetSearch||'')}" placeholder="Search assets by name, code, type or location"><kbd>${source.length}</kbd></div>
          </div>
          <div class="asset-tree-scroll asset-v19-scroll">${treeHtml(q)}</div>
          <div class="asset-v19-legend"><span><i class="online"></i> Online</span><span><i class="offline"></i> Offline</span><span class="asset-v19-tip">＋ adds a child asset</span></div>
        </section>
        <section class="asset-detail-stack asset-v19-detail">${detailFor(selected)}</section>
      </div>`;
  }

  function forbiddenParents(asset){
    if(!asset)return new Set();
    return new Set([String(asset.id),...descendantsOf(asset.id).map(a=>String(a.id))]);
  }

  function premiumAssetForm(asset=null,suggestedParentId=null){
    if(asset?.type==='Site')return;
    const site=currentSite();
    const excluded=forbiddenParents(asset);
    const parents=siteMaintainable().filter(a=>!excluded.has(String(a.id)));
    const defaultParent=suggestedParentId!==null?suggestedParentId:(asset?.parentId||'');
    const parentOptions=[{value:'',label:'Top level — no parent'},...parents.map(a=>({value:a.id,label:`${a.code} · ${a.name} (${typeLabel(a.type)})`}))];
    const userOptions=[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))];
    const groupOptions=[{value:'',label:'Unassigned'},...state.groups.map(g=>({value:g.id,label:g.name}))];
    const typeOptions=['Facility','Production area','Equipment','Subassembly','Tool'].map(x=>({value:x,label:x}));
    openModal({eyebrow:'Asset register',title:asset?'Edit asset':'Add asset',body:`<div class="asset-v19-form-intro"><span>${iconSvg(asset?.type||'Equipment')}</span><div><strong>${asset?'Update the asset record':'Place the asset where it belongs'}</strong><p>The site is already selected. Choose a parent only when this asset belongs under another facility, area, machine or component.</p></div></div><div class="form-grid">
      ${field('code','Asset code',asset?.code||'',{required:true})}${field('name','Asset name',asset?.name||'',{required:true})}
      ${field('type','Asset type',asset?.type||'Equipment',{type:'select',options:typeOptions})}${field('parentId','Parent asset',defaultParent,{type:'select',options:parentOptions})}
      ${field('category','Category',asset?.category||'Equipment')}${field('criticality','Criticality',asset?.criticality||'B',{type:'select',options:['A','B','C'].map(x=>({value:x,label:x}))})}
      ${field('location','Location',asset?.location||'')}${field('condition','Condition',asset?.condition||'Healthy',{type:'select',options:['Healthy','Attention','Critical'].map(x=>({value:x,label:x}))})}
      ${field('ownerUserId','Responsible person',asset?.ownerUserId||'',{type:'select',options:userOptions})}${field('ownerGroupId','Responsible group',asset?.ownerGroupId||'',{type:'select',options:groupOptions})}
      ${field('manufacturer','Manufacturer',asset?.manufacturer||'')}${field('model','Model',asset?.model||'')}
      ${field('serial','Serial number',asset?.serial||'')}${field('warrantyExpiry','Warranty expiry',asset?.warrantyExpiry||'',{type:'date'})}
    </div>`,submitText:asset?'Save changes':'Create asset',onSubmit:fd=>{
      const values=Object.fromEntries(fd.entries());
      values.code=String(values.code||'').trim();values.name=String(values.name||'').trim();values.parentId=String(values.parentId||'').trim()||null;
      if(!values.code||!values.name){toast('Asset code and name are required');return}
      const duplicate=state.assets.find(a=>a!==asset&&a.type!=='Site'&&String(a.code||'').trim().toLowerCase()===values.code.toLowerCase());
      if(duplicate){toast(`Asset code ${values.code} is already in use`);return}
      if(values.parentId&&forbiddenParents(asset).has(String(values.parentId))){toast('An asset cannot be placed under itself or one of its children');return}
      const siteId=asset?.siteId||site?.id||null;
      if(asset){
        Object.assign(asset,values,{siteId});
        state.assetEvents.unshift({id:uid('AE'),assetId:asset.id,type:'Asset updated',at:iso(),userId:CURRENT_USER,detail:`Hierarchy/profile updated${values.parentId?` under ${getAsset(values.parentId)?.name||'parent'}`:' as top level'}`});
        addAudit('ASSET_UPDATED',asset.id,'Asset profile and hierarchy updated');ui.selectedAsset=asset.id;
      }else{
        const a={id:uid('AST'),siteId,commissioned:day(0),bom:[],operatingState:'Online',...values};
        state.assets.push(a);
        state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Asset created',at:iso(),userId:CURRENT_USER,detail:`${a.code} created${a.parentId?` under ${getAsset(a.parentId)?.name||'parent'}`:' as top level'}`});
        addAudit('ASSET_CREATED',a.id,`${a.code} ${a.name}`);ui.selectedAsset=a.id;
      }
      saveState();closeModal();render();toast(asset?'Asset updated':'Asset added to hierarchy');
    }});
  }

  function activeWorkForIds(ids){
    return (state.workOrders||[]).filter(w=>!['Completed','Cancelled'].includes(w.status)&&(w.assetIds||[]).some(id=>ids.has(String(id))));
  }

  function dependencySummary(asset,branchIds){
    const ids=branchIds;
    return {
      work:activeWorkForIds(ids),
      pm:(state.scheduledMaintenance||[]).filter(x=>ids.has(String(x.assetId))),
      meters:(state.meters||[]).filter(x=>ids.has(String(x.assetId))),
      downtime:(state.downtime||[]).filter(x=>ids.has(String(x.assetId))),
      children:descendantsOf(asset.id)
    };
  }

  function showDeleteAsset(assetId){
    const asset=getAsset(assetId);if(!asset||asset.type==='Site')return;
    const descendants=descendantsOf(asset.id);
    const branchIds=new Set([String(asset.id),...descendants.map(a=>String(a.id))]);
    const deps=dependencySummary(asset,branchIds);
    const directChildren=childrenOf(asset.id);
    const blocker=activeWorkForIds(branchIds);
    const strategyField=directChildren.length?field('childStrategy','Child assets','reparent',{type:'select',options:[
      {value:'reparent',label:`Keep ${directChildren.length} direct child${directChildren.length===1?'':'ren'} and move them up one level`},
      {value:'branch',label:`Delete this entire branch (${branchIds.size} assets)`}
    ]}):'';
    const blocked=blocker.length>0;
    const summary=`<div class="asset-v19-delete-summary"><div><small>Child assets</small><strong>${descendants.length}</strong></div><div><small>PM schedules</small><strong>${deps.pm.length}</strong></div><div><small>Meters</small><strong>${deps.meters.length}</strong></div><div><small>Downtime records</small><strong>${deps.downtime.length}</strong></div></div>`;
    const blockerHtml=blocked?`<div class="notice" style="margin-bottom:16px"><strong>Deletion is blocked while maintenance is active.</strong> ${blocker.length} open/in-progress work order${blocker.length===1?' is':'s are'} linked to this asset branch. Complete or cancel them first so field history is not corrupted.</div>`:'';
    openModal({eyebrow:'Asset deletion',title:`Delete ${asset.name}?`,danger:true,submitText:'Delete permanently',body:`${blockerHtml}<div class="asset-v19-danger"><strong>This permanently removes the asset record.</strong><p>Completed work orders remain in history but their deleted asset link is removed. PM schedules, meters, downtime and asset-event records for deleted assets are also removed.</p></div>${summary}<div class="form-grid">${strategyField}${field('confirmCode',`Type ${asset.code} to confirm`,'',{required:true,span:!directChildren.length})}</div>`,onSubmit:blocked?null:fd=>{
      const confirmCode=String(fd.get('confirmCode')||'').trim();if(confirmCode!==String(asset.code)){toast(`Type ${asset.code} exactly to confirm deletion`);return}
      const strategy=String(fd.get('childStrategy')||'reparent');
      const idsToDelete=new Set([String(asset.id)]);
      if(strategy==='branch')descendants.forEach(a=>idsToDelete.add(String(a.id)));
      const liveBlock=activeWorkForIds(idsToDelete);if(liveBlock.length){toast('Complete or cancel linked active work before deleting');return}

      if(strategy==='reparent'){
        const newParent=isBlank(asset.parentId)?null:asset.parentId;
        directChildren.forEach(child=>{
          child.parentId=newParent;
          state.assetEvents.unshift({id:uid('AE'),assetId:child.id,type:'Hierarchy change',at:iso(),userId:CURRENT_USER,detail:`Parent ${asset.name} deleted; moved ${newParent?`under ${getAsset(newParent)?.name||'parent'}`:'to top level'}`});
        });
      }

      const deletedRecords=state.assets.filter(a=>idsToDelete.has(String(a.id)));
      const deletedNames=deletedRecords.map(a=>`${a.code} ${a.name}`).join(', ');
      (state.workOrders||[]).forEach(w=>{
        const before=(w.assetIds||[]).length;
        w.assetIds=(w.assetIds||[]).filter(id=>!idsToDelete.has(String(id)));
        if(before!==w.assetIds.length){
          w.history=w.history||[];
          w.history.unshift({at:iso(),text:`Deleted asset reference removed: ${deletedNames}`});
        }
      });
      state.scheduledMaintenance=(state.scheduledMaintenance||[]).filter(x=>!idsToDelete.has(String(x.assetId)));
      state.meters=(state.meters||[]).filter(x=>!idsToDelete.has(String(x.assetId)));
      state.downtime=(state.downtime||[]).filter(x=>!idsToDelete.has(String(x.assetId)));
      state.assetEvents=(state.assetEvents||[]).filter(x=>!idsToDelete.has(String(x.assetId)));
      if(Array.isArray(state.requests))state.requests=state.requests.filter(x=>!x.assetId||!idsToDelete.has(String(x.assetId)));
      state.assets=state.assets.filter(a=>!idsToDelete.has(String(a.id)));
      idsToDelete.forEach(id=>collapsed.delete(id));saveCollapsed();
      addAudit('ASSET_DELETED',asset.id,`${deletedNames} permanently deleted; strategy=${strategy}`);
      ui.selectedAsset=(asset.parentId&&getAsset(asset.parentId)?.type!=='Site'?asset.parentId:null)||siteMaintainable()[0]?.id||null;
      saveState();closeModal();render();toast(`${strategy==='branch'?idsToDelete.size+' assets':'Asset'} deleted`);
    }});
    if(blocked){
      const form=document.getElementById('modalForm');
      const actions=form?.querySelector('.modal-actions');
      if(actions)actions.innerHTML='<button class="button" type="button" data-modal-close>Close</button>';
    }
  }

  function closeRowMenu(){document.querySelector('.asset-v19-menu-pop')?.remove()}
  function showRowMenu(button,assetId){
    closeRowMenu();const asset=getAsset(assetId);if(!asset)return;
    const menu=document.createElement('div');menu.className='asset-v19-menu-pop';menu.setAttribute('role','menu');
    menu.innerHTML=`<button type="button" data-select-asset="${asset.id}">View details</button><button type="button" data-v19-add-child="${asset.id}">＋ Add child asset</button><button type="button" data-edit-asset="${asset.id}">Edit asset</button><div></div><button type="button" class="danger" data-v19-delete="${asset.id}">Delete asset</button>`;
    document.body.appendChild(menu);
    const r=button.getBoundingClientRect();
    const width=210;const left=Math.min(window.innerWidth-width-12,Math.max(12,r.right-width));
    const top=Math.min(window.innerHeight-230,r.bottom+7);
    menu.style.left=`${left}px`;menu.style.top=`${Math.max(12,top)}px`;
  }

  const repaired=detachSiteRoots();
  if(repaired&&typeof saveState==='function')saveState();

  window.renderAssets=renderExplorer;renderAssets=renderExplorer;
  window.showAssetForm=premiumAssetForm;showAssetForm=premiumAssetForm;
  window.showDeleteAsset=showDeleteAsset;

  document.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-v19-tree-toggle]');
    if(toggle){e.preventDefault();e.stopImmediatePropagation();const id=String(toggle.dataset.v19TreeToggle);collapsed.has(id)?collapsed.delete(id):collapsed.add(id);saveCollapsed();render();return}
    if(e.target.closest('#assetV19ExpandAll')){e.preventDefault();e.stopImmediatePropagation();collapsed.clear();saveCollapsed();render();return}
    if(e.target.closest('#assetV19CollapseAll')){e.preventDefault();e.stopImmediatePropagation();collapsed=new Set(siteMaintainable().filter(a=>childrenOf(a.id).length).map(a=>String(a.id)));saveCollapsed();render();return}
    const child=e.target.closest('[data-v19-add-child]');
    if(child){e.preventDefault();e.stopImmediatePropagation();closeRowMenu();premiumAssetForm(null,String(child.dataset.v19AddChild));return}
    const del=e.target.closest('[data-v19-delete]');
    if(del){e.preventDefault();e.stopImmediatePropagation();closeRowMenu();showDeleteAsset(String(del.dataset.v19Delete));return}
    const menu=e.target.closest('[data-v19-menu]');
    if(menu){e.preventDefault();e.stopImmediatePropagation();showRowMenu(menu,String(menu.dataset.v19Menu));return}
    if(!e.target.closest('.asset-v19-menu-pop'))closeRowMenu();
  },true);

  window.addEventListener('resize',closeRowMenu,{passive:true});
  window.addEventListener('scroll',closeRowMenu,{passive:true,capture:true});

  if(typeof ui!=='undefined'&&ui.route==='assets'&&typeof render==='function')render();
})();
