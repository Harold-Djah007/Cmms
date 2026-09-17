'use strict';

// SafiMaintain asset hierarchy v18.
// Treats Site as a hierarchy root, not a maintainable equipment asset.
(function(){
  const COLLAPSE_KEY='safimaint-asset-tree-collapsed-v18';
  let collapsed=new Set();
  try{collapsed=new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY)||'[]'))}catch(_){collapsed=new Set()}

  function saveCollapsed(){localStorage.setItem(COLLAPSE_KEY,JSON.stringify([...collapsed]))}
  function isBlank(v){return v===null||v===undefined||String(v).trim()===''}
  function siteRoots(){return (state.assets||[]).filter(a=>a.type==='Site')}
  function rootForSite(siteId){return siteRoots().find(a=>a.siteId===siteId)||siteRoots()[0]||null}
  function maintainableAssets(){return (state.assets||[]).filter(a=>a.type!=='Site')}

  function normalizeHierarchyToSites(){
    if(!Array.isArray(state.assets)||!state.assets.length)return 0;
    const ids=new Set(state.assets.map(a=>String(a.id)));
    let changed=0;
    state.assets.forEach(a=>{
      if(a.type==='Site'){
        if(a.parentId!==null){a.parentId=null;changed++}
        return;
      }
      const validParent=!isBlank(a.parentId)&&ids.has(String(a.parentId))&&String(a.parentId)!==String(a.id);
      if(!validParent){
        const root=rootForSite(a.siteId);
        if(root&&a.parentId!==root.id){a.parentId=root.id;changed++}
        else if(!root&&!isBlank(a.parentId)){a.parentId=null;changed++}
      }
    });
    if(changed&&typeof saveState==='function') saveState();
    return changed;
  }

  function childrenOf(id){return state.assets.filter(a=>String(a.parentId||'')===String(id||''))}
  function descendantsOf(id,out=[]){
    childrenOf(id).forEach(c=>{out.push(c);descendantsOf(c.id,out)});
    return out;
  }
  function pathFor(asset){
    if(!asset)return[];
    const byId=new Map(state.assets.map(a=>[String(a.id),a]));
    const result=[];const seen=new Set();let cur=asset;
    while(cur&&!seen.has(String(cur.id))){
      seen.add(String(cur.id));result.unshift(cur);
      cur=isBlank(cur.parentId)?null:byId.get(String(cur.parentId));
    }
    return result;
  }

  function visibleIdsForSearch(q){
    if(!q)return null;
    const byId=new Map(state.assets.map(a=>[String(a.id),a]));
    const visible=new Set();
    state.assets.forEach(a=>{
      const text=`${a.code||''} ${a.name||''} ${a.type||''} ${a.category||''} ${a.location||''}`.toLowerCase();
      if(!text.includes(q))return;
      let cur=a;const seen=new Set();
      while(cur&&!seen.has(String(cur.id))){visible.add(String(cur.id));seen.add(String(cur.id));cur=isBlank(cur.parentId)?null:byId.get(String(cur.parentId))}
    });
    return visible;
  }

  function rowMeta(asset, childCount){
    if(asset.type==='Site')return `<span class="asset-tree-type">Site root</span>${childCount?`<span class="asset-tree-count">${childCount}</span>`:''}`;
    return `${status(asset.operatingState)}${childCount?`<span class="asset-tree-count">${childCount}</span>`:''}`;
  }

  function treeHtml(q){
    const visible=visibleIdsForSearch(q);
    const byParent=new Map();
    state.assets.forEach(a=>{
      const key=isBlank(a.parentId)?'__ROOT__':String(a.parentId);
      if(!byParent.has(key))byParent.set(key,[]);
      byParent.get(key).push(a);
    });
    byParent.forEach(list=>list.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))));
    const roots=siteRoots().length?siteRoots():state.assets.filter(a=>isBlank(a.parentId));
    let rendered=0;
    function node(asset,depth){
      if(visible&&!visible.has(String(asset.id)))return'';
      rendered++;
      const children=(byParent.get(String(asset.id))||[]).filter(c=>!visible||visible.has(String(c.id)));
      const hasChildren=children.length>0;
      const isCollapsed=!q&&collapsed.has(String(asset.id));
      const root=asset.type==='Site';
      const icon=assetIcon(asset);
      return `<div class="asset-tree-node" style="--tree-depth:${Math.min(depth,8)}">
        ${hasChildren?`<button class="asset-tree-toggle" type="button" data-tree-toggle="${asset.id}" aria-label="${isCollapsed?'Expand':'Collapse'} ${esc(asset.name)}">${isCollapsed?'›':'⌄'}</button>`:`<span class="asset-tree-toggle empty">·</span>`}
        <button class="asset-tree-row ${asset.id===ui.selectedAsset?'active':''} ${root?'site-root':''}" type="button" data-select-asset="${asset.id}">
          <span class="asset-tree-icon">${icon}</span>
          <span class="asset-tree-copy"><strong>${esc(asset.name)}</strong><small>${root?`${esc(asset.code)} · Site`: `${esc(asset.code)} · ${esc(asset.type)}${asset.location?` · ${esc(asset.location)}`:''}`}</small></span>
          <span class="asset-tree-meta">${rowMeta(asset,children.length)}</span>
        </button>
      </div>${hasChildren&&!isCollapsed?children.map(c=>node(c,depth+1)).join(''):''}`;
    }
    let html=roots.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))).map(r=>node(r,0)).join('');
    // Defensive recovery: show any unreachable records instead of hiding data.
    const reachable=new Set();
    roots.forEach(r=>{reachable.add(String(r.id));descendantsOf(r.id).forEach(a=>reachable.add(String(a.id)))});
    const leftovers=state.assets.filter(a=>!reachable.has(String(a.id))&&(!visible||visible.has(String(a.id))));
    if(leftovers.length)html+=leftovers.map(a=>node(a,0)).join('');
    return rendered?html:`<div class="asset-tree-empty">No assets match “${esc(q)}”.</div>`;
  }

  function siteDetail(siteAsset){
    const descendants=descendantsOf(siteAsset.id).filter(a=>a.type!=='Site');
    const direct=childrenOf(siteAsset.id);
    const online=descendants.filter(a=>a.operatingState==='Online').length;
    const offline=descendants.filter(a=>a.operatingState==='Offline').length;
    const site=state.sites.find(s=>s.id===siteAsset.siteId);
    return `<section class="card site-overview">
      <div class="site-overview-hero">
        <div class="site-overview-title"><span class="site-overview-icon">⌂</span><div><h2>${esc(siteAsset.name)}</h2><p>${esc(site?.code||siteAsset.code)} · Site hierarchy root${site?.region?` · ${esc(site.region)}`:''}</p></div></div>
        <div class="site-root-note"><strong>This is your site, not a machine asset.</strong> Use it as the top of the hierarchy, then place facilities, process areas, equipment and subassemblies underneath it.</div>
      </div>
      <div class="site-overview-stats">
        <div class="site-overview-stat"><small>Maintainable assets</small><strong>${descendants.length}</strong></div>
        <div class="site-overview-stat"><small>Direct child groups</small><strong>${direct.length}</strong></div>
        <div class="site-overview-stat"><small>Online</small><strong>${online}</strong></div>
        <div class="site-overview-stat"><small>Offline</small><strong>${offline}</strong></div>
      </div>
      <div class="site-overview-body">
        <div class="site-children-title"><h3>Top-level hierarchy</h3><button class="button" type="button" data-action="add-asset">＋ Add under this site</button></div>
        <div class="site-child-grid">${direct.map(a=>`<button class="site-child-card" type="button" data-select-asset="${a.id}"><span class="asset-tree-icon">${assetIcon(a)}</span><span><strong>${esc(a.name)}</strong><small>${esc(a.code)} · ${esc(a.type)} · ${childrenOf(a.id).length} child${childrenOf(a.id).length===1?'':'ren'}</small></span></button>`).join('')||'<div class="empty"><strong>No hierarchy yet</strong><span>Add a facility, area, or equipment asset under this site.</span></div>'}</div>
      </div>
    </section>`;
  }

  function breadcrumb(asset){
    const path=pathFor(asset);
    return `<div class="asset-breadcrumb">${path.map((p,i)=>i===path.length-1?`<strong>${esc(p.name)}</strong>`:`<button type="button" data-select-asset="${p.id}">${esc(p.name)}</button><span class="sep">›</span>`).join('')}</div>`;
  }

  function detailFor(asset){
    if(!asset)return '<section class="card"><div class="empty"><strong>No asset selected</strong></div></section>';
    if(asset.type==='Site')return siteDetail(asset);
    return `${breadcrumb(asset)}${renderAssetDetail(asset)}`;
  }

  function renderHierarchyAssets(){
    normalizeHierarchyToSites();
    const q=String(ui.assetSearch||'').trim().toLowerCase();
    const flat=flattenAssets();
    if(!getAsset(ui.selectedAsset))ui.selectedAsset=flat[0]?.asset.id||state.assets[0]?.id||null;
    const selected=getAsset(ui.selectedAsset);
    return pageHead('Asset management','Asset hierarchy','Organize your operation as Site → Facility / Area → Equipment → Subassembly / Tool, then drill into each record.',`<button class="button primary" data-action="add-asset">＋ Add asset</button>`)
      +`<div class="asset-hierarchy-shell">
        <section class="card asset-tree-card">
          <div class="asset-tree-head">
            <div class="asset-tree-head-row"><div><h2>Hierarchy</h2><p>Expand a branch to find equipment underneath it.</p></div><div class="asset-tree-controls"><button class="button" type="button" id="assetExpandAll">Expand all</button><button class="button" type="button" id="assetCollapseAll">Collapse all</button></div></div>
            <input class="asset-tree-search" data-filter="asset" value="${esc(ui.assetSearch||'')}" placeholder="Search hierarchy by name, code or type">
          </div>
          <div class="asset-tree-scroll">${treeHtml(q)}</div>
        </section>
        <section class="asset-detail-stack">${detailFor(selected)}</section>
      </div>`;
  }

  function forbiddenParents(asset){
    if(!asset)return new Set();
    return new Set([String(asset.id),...descendantsOf(asset.id).map(a=>String(a.id))]);
  }

  function hierarchyAssetForm(asset=null){
    if(asset?.type==='Site'){
      toast('Site details are managed under Sites & stores. Add equipment beneath the site instead.');
      ui.route='sites';render();return;
    }
    const excluded=forbiddenParents(asset);
    const root=rootForSite(asset?.siteId||state.sites[0]?.id);
    const parentAssets=state.assets.filter(a=>!excluded.has(String(a.id)));
    const defaultParent=asset?.parentId||root?.id||'';
    const parentOptions=parentAssets.map(a=>({value:a.id,label:`${a.type==='Site'?'SITE':a.code} · ${a.name} (${a.type})`}));
    if(!parentOptions.length)parentOptions.push({value:'',label:'No parent'});
    const userOptions=[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))];
    const groupOptions=[{value:'',label:'Unassigned'},...state.groups.map(g=>({value:g.id,label:g.name}))];
    const typeOptions=['Facility','Production area','Equipment','Subassembly','Tool'].map(x=>({value:x,label:x}));
    if(asset?.type&&!typeOptions.some(o=>o.value===asset.type))typeOptions.unshift({value:asset.type,label:asset.type});
    openModal({eyebrow:'Asset hierarchy',title:asset?'Edit asset':'Add asset',body:`<div class="notice info" style="margin-bottom:16px"><strong>Choose where this belongs.</strong> Every maintainable asset should sit under your site, facility, area, or another equipment record.</div><div class="form-grid">
      ${field('code','Asset code',asset?.code||'',{required:true})}${field('name','Asset name',asset?.name||'',{required:true})}
      ${field('type','Asset type',asset?.type||'Equipment',{type:'select',options:typeOptions})}${field('parentId','Parent in hierarchy',defaultParent,{type:'select',options:parentOptions,required:true})}
      ${field('category','Category',asset?.category||'Equipment')}${field('criticality','Criticality',asset?.criticality||'B',{type:'select',options:['A','B','C'].map(x=>({value:x,label:x}))})}
      ${field('location','Location',asset?.location||'')}${field('condition','Condition',asset?.condition||'Healthy',{type:'select',options:['Healthy','Attention','Critical'].map(x=>({value:x,label:x}))})}
      ${field('ownerUserId','Responsible person',asset?.ownerUserId||'',{type:'select',options:userOptions})}${field('ownerGroupId','Responsible group',asset?.ownerGroupId||'',{type:'select',options:groupOptions})}
      ${field('manufacturer','Manufacturer',asset?.manufacturer||'')}${field('model','Model',asset?.model||'')}
      ${field('serial','Serial number',asset?.serial||'')}${field('warrantyExpiry','Warranty expiry',asset?.warrantyExpiry||'',{type:'date'})}
    </div>`,submitText:asset?'Save changes':'Create asset',onSubmit:fd=>{
      const values=Object.fromEntries(fd.entries());
      values.code=String(values.code||'').trim();values.name=String(values.name||'').trim();values.parentId=String(values.parentId||'').trim()||root?.id||null;
      const duplicate=state.assets.find(a=>a!==asset&&String(a.code||'').trim().toLowerCase()===values.code.toLowerCase());
      if(duplicate){toast(`Asset code ${values.code} is already in use`);return}
      const parent=getAsset(values.parentId);
      const siteId=parent?.siteId||asset?.siteId||state.sites[0]?.id||null;
      if(asset){Object.assign(asset,values,{siteId});addAudit('ASSET_UPDATED',asset.id,'Asset profile and hierarchy updated');ui.selectedAsset=asset.id}
      else{
        const a={id:uid('AST'),siteId,commissioned:day(0),bom:[],operatingState:'Online',...values};
        state.assets.push(a);state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Asset created',at:iso(),userId:CURRENT_USER,detail:`${a.code} created under ${parent?.name||'site'}`});addAudit('ASSET_CREATED',a.id,`${a.code} ${a.name}`);ui.selectedAsset=a.id;
      }
      saveState();closeModal();render();toast(asset?'Asset updated':'Asset added to hierarchy');
    }});
  }

  normalizeHierarchyToSites();
  window.renderAssets=renderHierarchyAssets;
  renderAssets=renderHierarchyAssets;
  window.showAssetForm=hierarchyAssetForm;
  showAssetForm=hierarchyAssetForm;

  document.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-tree-toggle]');
    if(toggle){e.preventDefault();e.stopPropagation();const id=String(toggle.dataset.treeToggle);collapsed.has(id)?collapsed.delete(id):collapsed.add(id);saveCollapsed();render();return}
    if(e.target.closest('#assetExpandAll')){e.preventDefault();collapsed.clear();saveCollapsed();render();return}
    if(e.target.closest('#assetCollapseAll')){e.preventDefault();collapsed=new Set(state.assets.filter(a=>childrenOf(a.id).length).map(a=>String(a.id)));siteRoots().forEach(a=>collapsed.delete(String(a.id)));saveCollapsed();render();return}
  },true);

  if(typeof ui!=='undefined'&&ui.route==='assets'&&typeof render==='function')render();
})();
