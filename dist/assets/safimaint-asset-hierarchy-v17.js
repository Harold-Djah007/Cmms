'use strict';

// SafiMaintain asset hierarchy hardening v17.
// Repairs assets saved with a blank/missing parent and prevents hierarchy traversal
// from hiding valid records. Existing local field data is preserved.
(function(){
  function assetIds(){
    return new Set((Array.isArray(state?.assets)?state.assets:[]).map(a=>String(a.id)));
  }

  function normalizedParent(asset, ids=assetIds()){
    if(!asset) return null;
    const raw=asset.parentId;
    if(raw===null||raw===undefined||String(raw).trim()==='') return null;
    const parent=String(raw);
    if(parent===String(asset.id)||!ids.has(parent)) return null;
    return parent;
  }

  function createsCycle(asset, parentId, byId){
    if(!parentId) return false;
    const seen=new Set([String(asset.id)]);
    let cursor=String(parentId);
    while(cursor){
      if(seen.has(cursor)) return true;
      seen.add(cursor);
      const parent=byId.get(cursor);
      if(!parent) return false;
      const next=parent.parentId;
      if(next===null||next===undefined||String(next).trim()==='') return false;
      cursor=String(next);
    }
    return false;
  }

  function repairHierarchy(){
    if(typeof state==='undefined'||!Array.isArray(state.assets)) return 0;
    const ids=assetIds();
    const byId=new Map(state.assets.map(a=>[String(a.id),a]));
    let repaired=0;

    state.assets.forEach(asset=>{
      let parent=normalizedParent(asset,ids);
      if(parent&&createsCycle(asset,parent,byId)) parent=null;
      const current=asset.parentId===undefined?null:asset.parentId;
      if(current!==parent){
        asset.parentId=parent;
        repaired++;
      }
    });
    return repaired;
  }

  function safeFlattenAssets(parentId=null,depth=0,out=[]){
    const assets=Array.isArray(state?.assets)?state.assets:[];
    const ids=assetIds();
    const seen=new Set(out.map(x=>String(x.asset?.id)));
    const start=(parentId===null||parentId===undefined||String(parentId).trim()==='')?null:String(parentId);

    function parentOf(asset){return normalizedParent(asset,ids)}
    function walk(parent,currentDepth){
      assets
        .filter(a=>parentOf(a)===parent)
        .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')))
        .forEach(asset=>{
          const id=String(asset.id);
          if(seen.has(id)) return;
          seen.add(id);
          out.push({asset,depth:currentDepth});
          walk(id,currentDepth+1);
        });
    }

    walk(start,depth);

    // Root renders must never silently drop valid assets. Any record still unseen is
    // recovered as a visible top-level item instead of disappearing from the register.
    if(start===null&&depth===0){
      assets
        .filter(a=>!seen.has(String(a.id)))
        .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')))
        .forEach(asset=>{
          const id=String(asset.id);
          if(seen.has(id)) return;
          seen.add(id);
          out.push({asset,depth:0});
          walk(id,1);
        });
    }
    return out;
  }

  const originalSaveState=typeof saveState==='function'?saveState:null;
  if(originalSaveState){
    saveState=function(){
      repairHierarchy();
      return originalSaveState();
    };
  }

  // Replace the strict parentId===null traversal used by the original asset register.
  flattenAssets=safeFlattenAssets;
  window.flattenAssets=safeFlattenAssets;

  const repaired=repairHierarchy();
  if(repaired&&originalSaveState){
    originalSaveState();
    if(typeof addAudit==='function'){
      addAudit('ASSET_HIERARCHY_REPAIRED','ASSETS',`${repaired} asset parent reference${repaired===1?'':'s'} normalized`,'SYSTEM');
      originalSaveState();
    }
  }

  // If the user is already on Assets, repaint immediately so recovered assets appear.
  if(typeof ui!=='undefined'&&ui.route==='assets'&&typeof render==='function') render();
})();
