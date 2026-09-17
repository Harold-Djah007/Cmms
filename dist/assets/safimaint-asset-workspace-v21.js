'use strict';

// SafiMaintain asset workspace v21
// Record-first CMMS asset experience inspired by the interaction patterns of
// established maintenance systems, while retaining SafiMaintain branding.
(function(){
  const TREE_KEY='safimaint-asset-workspace-tree-v21';
  let collapsed=new Set();
  try{collapsed=new Set(JSON.parse(localStorage.getItem(TREE_KEY)||'[]'))}catch(_){collapsed=new Set()}
  ui.assetRecordTab=ui.assetRecordTab||'general';
  ui.assetScope=ui.assetScope||'all';

  const isBlank=v=>v===null||v===undefined||String(v).trim()==='';
  const currentSite=()=>state.sites?.find(s=>s.active)||state.sites?.[0]||null;
  const allAssets=()=>state.assets.filter(a=>a.type!=='Site'&&(!currentSite()||!a.siteId||a.siteId===currentSite().id));
  const localAsset=id=>allAssets().find(a=>String(a.id)===String(id));
  const children=id=>allAssets().filter(a=>String(a.parentId||'')===String(id||''));
  const descendants=(id,out=[],seen=new Set())=>{children(id).forEach(c=>{const k=String(c.id);if(seen.has(k))return;seen.add(k);out.push(c);descendants(c.id,out,seen)});return out};
  const parentOf=a=>isBlank(a?.parentId)?null:localAsset(a.parentId);
  const roots=()=>{const ids=new Set(allAssets().map(a=>String(a.id)));return allAssets().filter(a=>isBlank(a.parentId)||!ids.has(String(a.parentId)))};
  const workFor=a=>state.workOrders.filter(w=>(w.assetIds||[]).some(id=>String(id)===String(a.id)));
  const activeWorkFor=a=>workFor(a).filter(w=>!['Completed','Cancelled'].includes(w.status));
  const metersFor=a=>state.meters.filter(m=>String(m.assetId)===String(a.id));
  const downtimeFor=a=>state.downtime.filter(d=>String(d.assetId)===String(a.id));
  const eventsFor=a=>state.assetEvents.filter(e=>String(e.assetId)===String(a.id));
  const bomFor=a=>(a.bom||[]).map(getPart).filter(Boolean);
  const scopeMatch=a=>ui.assetScope==='all'||(ui.assetScope==='facilities'&&['Facility','Production area'].includes(a.type))||(ui.assetScope==='equipment'&&['Equipment','Subassembly'].includes(a.type))||(ui.assetScope==='tools'&&a.type==='Tool');

  function saveCollapsed(){localStorage.setItem(TREE_KEY,JSON.stringify([...collapsed]))}
  function typeIcon(a){return assetIcon(a)}
  function pathFor(asset){
    const out=[];const seen=new Set();let cur=asset;
    while(cur&&!seen.has(String(cur.id))){seen.add(String(cur.id));out.unshift(cur);cur=parentOf(cur)}
    return out;
  }
  function visibleIds(q){
    if(!q&&ui.assetScope==='all')return null;
    const visible=new Set();
    allAssets().forEach(a=>{
      const hay=`${a.code||''} ${a.name||''} ${a.type||''} ${a.category||''} ${a.location||''}`.toLowerCase();
      const hit=(!q||hay.includes(q))&&scopeMatch(a);
      if(!hit)return;
      let cur=a;const seen=new Set();
      while(cur&&!seen.has(String(cur.id))){visible.add(String(cur.id));seen.add(String(cur.id));cur=parentOf(cur)}
    });
    return visible;
  }
  function treeRows(){
    const q=String(ui.assetSearch||'').trim().toLowerCase();
    const visible=visibleIds(q);
    const rootList=roots().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    let rendered=0;
    function row(a,depth){
      if(visible&&!visible.has(String(a.id)))return'';
      const kids=children(a.id).filter(c=>!visible||visible.has(String(c.id)));
      const shut=!q&&collapsed.has(String(a.id));rendered++;
      return `<div class="v21-tree-node" style="--depth:${Math.min(depth,8)}">
        <div class="v21-tree-line ${a.id===ui.selectedAsset?'active':''}">
          <button class="v21-chevron ${kids.length?'':'empty'}" type="button" ${kids.length?`data-v21-toggle="${a.id}"`:''}>${kids.length?(shut?'›':'⌄'):'·'}</button>
          <button class="v21-tree-main" type="button" data-select-asset="${a.id}">
            <span class="v21-tree-icon">${typeIcon(a)}</span>
            <span><strong>${esc(a.name)}</strong><small>${esc(a.code)} · ${esc(a.type)}</small></span>
          </button>
          <span class="v21-tree-state ${a.operatingState==='Offline'?'offline':''}"><i></i>${esc(a.operatingState||'—')}</span>
          <button class="v21-tree-add" type="button" data-v21-add-child="${a.id}" title="Add sub-asset">＋</button>
        </div>
        ${kids.length&&!shut?`<div class="v21-tree-children">${kids.map(k=>row(k,depth+1)).join('')}</div>`:''}
      </div>`;
    }
    const html=rootList.map(a=>row(a,0)).join('');
    if(rendered)return html;
    return `<div class="v21-tree-empty"><strong>${allAssets().length?'No matching assets':'No assets yet'}</strong><span>${allAssets().length?'Change the search or asset type filter.':'Create a facility, area, machine or tool to start the hierarchy.'}</span><button class="button primary" type="button" data-action="add-asset">＋ Add asset</button></div>`;
  }

  function tagPattern(text){
    let seed=2166136261;
    for(const ch of String(text||'ASSET')){seed^=ch.charCodeAt(0);seed=Math.imul(seed,16777619)}
    const size=11,cells=[];
    function finder(r,c){return (r<3&&c<3)||(r<3&&c>=size-3)||(r>=size-3&&c<3)}
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      let on;
      if(finder(r,c)){
        const rr=r>=size-3?r-(size-3):r,cc=c>=size-3?c-(size-3):c;
        on=rr===0||rr===2||cc===0||cc===2||(rr===1&&cc===1);
      }else{
        seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;on=((seed>>>0)&3)!==0;
      }
      cells.push(`<i class="${on?'on':''}"></i>`);
    }
    return cells.join('');
  }

  function recordToolbar(a){
    return `<div class="v21-record-toolbar">
      <div class="v21-toolbar-left"><button class="button" type="button" data-v21-back>‹ Back</button><button class="button primary" type="button" data-edit-asset="${a.id}">Edit</button><button class="button" type="button" data-v21-print>▧ Print</button><button class="button" type="button" data-v21-more>More ▾</button></div>
      <div class="v21-toolbar-right"><button class="button" type="button" data-v21-add-child="${a.id}">＋ Sub-asset</button><button class="button ${a.operatingState==='Online'?'danger':'primary'}" type="button" data-toggle-asset="${a.id}">${a.operatingState==='Online'?'Take offline':'Return online'}</button></div>
    </div>`;
  }

  function identityPanel(a){
    const parent=parentOf(a),kids=children(a.id),owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId);
    const path=pathFor(a);
    return `<section class="v21-identity">
      <div class="v21-asset-card">
        <div class="v21-asset-picture"><img src="assets/safimaint-logo.svg" alt=""><span>${typeIcon(a)}</span></div>
        <strong>${esc(a.name)}</strong><small>${esc(a.code)}</small><em>${esc(a.type)}</em>
        <div class="v21-mini-path">${path.map((p,i)=>`<button type="button" data-select-asset="${p.id}">${esc(p.name)}</button>${i<path.length-1?'<b>›</b>':''}`).join('')}</div>
      </div>
      <div class="v21-nameplate">
        <div class="v21-nameplate-title"><small>${esc(a.type)}</small><h2>${esc(a.name)}</h2></div>
        <div class="v21-description">${esc(a.description||'No asset description has been added yet.')}</div>
        <div class="v21-nameplate-fields">
          <div><small>Code</small><strong>${esc(a.code)}</strong></div><div><small>Category</small><strong>${esc(a.category||'—')}</strong></div><div><small>Location</small><strong>${esc(a.location||'—')}</strong></div>
          <div><small>Parent asset</small><strong>${esc(parent?.name||'Top level')}</strong></div><div><small>Sub-assets</small><strong>${kids.length}</strong></div><div><small>Responsible</small><strong>${esc(owner?.name||group?.name||'Unassigned')}</strong></div>
        </div>
      </div>
      <div class="v21-record-status">
        <span class="v21-online ${a.operatingState==='Offline'?'offline':''}"><i></i>${esc(a.operatingState||'Unknown')}</span>
        <div class="v21-tag" aria-label="Asset identification tag"><div class="v21-tag-grid">${tagPattern(a.code)}</div><small>ASSET TAG</small><strong>${esc(a.code)}</strong></div>
      </div>
    </section>`;
  }

  const tabs=[['general','General'],['bom','Parts / BOM'],['metering','Metering / Events'],['personnel','Personnel'],['work','Work history'],['files','Files'],['financials','Financials'],['log','Log']];
  function tabStrip(){return `<div class="v21-tabs">${tabs.map(([id,label])=>`<button type="button" class="${ui.assetRecordTab===id?'active':''}" data-v21-tab="${id}">${label}</button>`).join('')}</div>`}
  function infoTable(rows){return `<div class="v21-info-table">${rows.map(([label,value])=>`<div><small>${esc(label)}</small><strong>${value}</strong></div>`).join('')}</div>`}

  function generalTab(a){
    const owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId),kids=children(a.id),parent=parentOf(a);
    const dt=downtimeFor(a),total=dt.reduce((n,d)=>n+durationHours(d.startedAt,d.endedAt||iso()),0);
    return `<div class="v21-section-block"><div class="v21-section-title"><h3>General information</h3><span>Asset master record</span></div>${infoTable([
      ['Asset code',esc(a.code)],['Asset type',esc(a.type)],['Category',esc(a.category||'—')],['Criticality',esc(a.criticality||'—')],
      ['Parent asset',parent?`<button data-select-asset="${parent.id}">${esc(parent.name)}</button>`:'Top level'],['Sub-assets',String(kids.length)],['Location',esc(a.location||'—')],['Condition',status(a.condition||'Unknown')],
      ['Manufacturer',esc(a.manufacturer||'—')],['Model',esc(a.model||'—')],['Serial number',esc(a.serial||'—')],['Commissioned',dateFmt(a.commissioned)],
      ['Responsible person',esc(owner?.name||'Unassigned')],['Responsible group',esc(group?.name||'Unassigned')],['Warranty expiry',dateFmt(a.warrantyExpiry)],['Total downtime',`${total.toFixed(1)} h`]
    ])}</div>
    <div class="v21-section-block"><div class="v21-section-title"><h3>Sub-assets</h3><button class="button" type="button" data-v21-add-child="${a.id}">＋ Add sub-asset</button></div><div class="v21-subasset-grid">${kids.map(k=>`<button type="button" data-select-asset="${k.id}"><span>${typeIcon(k)}</span><div><strong>${esc(k.name)}</strong><small>${esc(k.code)} · ${esc(k.type)}</small></div><b>›</b></button>`).join('')||'<div class="v21-inline-empty">No sub-assets are linked to this asset.</div>'}</div></div>`;
  }
  function bomTab(a){
    const bom=bomFor(a);
    return `<div class="v21-section-block"><div class="v21-section-title"><h3>Parts / BOM</h3><span>${bom.length} linked part${bom.length===1?'':'s'}</span></div>${table(['Code','Part','On hand','Minimum','Vendor'],bom.map(p=>`<tr class="clickable" data-open-part="${p.id}"><td><b>${esc(p.code)}</b></td><td>${esc(p.name)}</td><td>${partOnHand(p)} ${esc(p.uom)}</td><td>${p.min}</td><td>${esc(getVendor(p.vendorId)?.name||'—')}</td></tr>`),'No BOM parts linked')}</div>`;
  }
  function meteringTab(a){
    const meters=metersFor(a),events=eventsFor(a).slice(0,8),dt=downtimeFor(a).slice(0,8);
    return `<div class="v21-two-col"><div class="v21-section-block"><div class="v21-section-title"><h3>Metering</h3><span>${meters.length} meter${meters.length===1?'':'s'}</span></div>${meters.map(m=>`<div class="v21-meter"><div><strong>${esc(m.name)}</strong><small>Latest ${dateFmt(m.readings?.at(-1)?.at)}</small></div><b>${esc(m.current)} ${esc(m.unit)}</b></div>`).join('')||'<div class="v21-inline-empty">No meters linked.</div>'}</div><div class="v21-section-block"><div class="v21-section-title"><h3>Downtime / events</h3><span>${dt.length} recent</span></div>${dt.map(d=>`<div class="v21-event"><strong>${esc(d.reasonCode||'Downtime')}</strong><small>${dateTimeFmt(d.startedAt)}${d.endedAt?` → ${dateTimeFmt(d.endedAt)}`:' · Active'}</small><p>${esc(d.reason||'')}</p></div>`).join('')||events.map(e=>`<div class="v21-event"><strong>${esc(e.type)}</strong><small>${dateTimeFmt(e.at)}</small><p>${esc(e.detail)}</p></div>`).join('')||'<div class="v21-inline-empty">No events recorded.</div>'}</div></div>`;
  }
  function personnelTab(a){
    const owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId);
    return `<div class="v21-section-block"><div class="v21-section-title"><h3>Personnel</h3><span>Ownership and accountability</span></div>${infoTable([['Responsible person',esc(owner?.name||'Unassigned')],['Role',esc(getRole(owner?.roleId)?.name||'—')],['Responsible group',esc(group?.name||'Unassigned')],['Email',esc(owner?.email||'—')]])}</div>`;
  }
  function workTab(a){
    const work=workFor(a);
    return `<div class="v21-section-block"><div class="v21-section-title"><h3>Work history</h3><span>${activeWorkFor(a).length} active</span></div>${table(['Work order','Type','Priority','Status','Due'],work.map(w=>`<tr class="clickable" data-open-work="${w.id}"><td><b>${esc(w.id)}</b><small>${esc(w.title)}</small></td><td>${esc(w.type)}</td><td>${esc(w.priority||'—')}</td><td>${status(w.status)}</td><td>${dateFmt(w.due)}</td></tr>`),'No work orders linked')}</div>`;
  }
  function filesTab(){return `<div class="v21-section-block"><div class="v21-section-title"><h3>Files</h3><span>Manuals, photos and certificates</span></div><div class="v21-empty-record"><strong>No files attached</strong><span>Document attachment storage will appear here when a backend file service is connected.</span></div></div>`}
  function financialsTab(){return `<div class="v21-section-block"><div class="v21-section-title"><h3>Financials</h3><span>Asset cost context</span></div><div class="v21-empty-record"><strong>No financial data yet</strong><span>Purchase cost, replacement value and lifetime maintenance cost can be tracked here when configured.</span></div></div>`}
  function logTab(a){
    const events=eventsFor(a);
    return `<div class="v21-section-block"><div class="v21-section-title"><h3>Asset log</h3><span>${events.length} event${events.length===1?'':'s'}</span></div><div class="v21-log">${events.map(e=>`<div><i></i><span><strong>${esc(e.type)}</strong><p>${esc(e.detail)}</p><small>${dateTimeFmt(e.at)} · ${esc(getUser(e.userId)?.name||e.userId||'System')}</small></span></div>`).join('')||'<div class="v21-inline-empty">No asset events yet.</div>'}</div></div>`;
  }
  function tabBody(a){
    return ({general:generalTab,bom:bomTab,metering:meteringTab,personnel:personnelTab,work:workTab,files:filesTab,financials:financialsTab,log:logTab}[ui.assetRecordTab]||generalTab)(a);
  }

  function assetRecord(a){
    if(!a)return `<section class="v21-record v21-record-empty"><img src="assets/safimaint-logo.svg" alt=""><h2>Select an asset record</h2><p>Choose an asset from the hierarchy on the left.</p></section>`;
    return `<section class="v21-record">${recordToolbar(a)}${identityPanel(a)}${tabStrip()}<div class="v21-record-body">${tabBody(a)}</div></section>`;
  }

  function assetBrowser(){
    const s=currentSite(),count=allAssets().length;
    const scopes=[['all','All assets',count],['facilities','Facilities',allAssets().filter(a=>['Facility','Production area'].includes(a.type)).length],['equipment','Equipment',allAssets().filter(a=>['Equipment','Subassembly'].includes(a.type)).length],['tools','Tools',allAssets().filter(a=>a.type==='Tool').length]];
    return `<aside class="v21-browser">
      <div class="v21-browser-brand"><img src="assets/safimaint-logo.svg" alt=""><div><small>Current site</small><strong>${esc(s?.name||'Workspace')}</strong></div></div>
      <div class="v21-scope">${scopes.map(([id,label,n])=>`<button type="button" class="${ui.assetScope===id?'active':''}" data-v21-scope="${id}"><span>${esc(label)}</span><b>${n}</b></button>`).join('')}</div>
      <div class="v21-browser-title"><div><h2>Asset hierarchy</h2><p>Parent assets and sub-assets</p></div><button type="button" data-action="add-asset">＋</button></div>
      <div class="v21-browser-search"><span>⌕</span><input data-filter="asset" value="${esc(ui.assetSearch||'')}" placeholder="Search assets"></div>
      <div class="v21-tree">${treeRows()}</div>
    </aside>`;
  }

  function renderAssetsV21(){
    const list=allAssets();
    if(!list.some(a=>String(a.id)===String(ui.selectedAsset)))ui.selectedAsset=list[0]?.id||null;
    return `<div class="v21-page-head"><div><p>ASSET MANAGEMENT</p><h1>Assets</h1><span>Maintain the full asset record, hierarchy, parts, meters, people and history in one workspace.</span></div><button class="button primary" type="button" data-action="add-asset">＋ Add asset</button></div><div class="v21-workspace">${assetBrowser()}${assetRecord(getAsset(ui.selectedAsset))}</div>`;
  }

  function parentOptions(asset){
    const banned=new Set(asset?[String(asset.id),...descendants(asset.id).map(a=>String(a.id))]:[]);
    return [{value:'',label:'Top level — no parent'},...allAssets().filter(a=>!banned.has(String(a.id))).map(a=>({value:a.id,label:`${a.code} · ${a.name} (${a.type})`}))];
  }
  function robustAssetEditor(assetOrId=null,suggestedParent=null){
    const existing=typeof assetOrId==='string'?getAsset(assetOrId):assetOrId;
    if(existing?.type==='Site')return;
    const editId=existing?.id||null;
    const userOptions=[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))];
    const groupOptions=[{value:'',label:'Unassigned'},...state.groups.map(g=>({value:g.id,label:g.name}))];
    const parentDefault=suggestedParent!==null?suggestedParent:(existing?.parentId||'');
    openModal({eyebrow:'Asset record',title:existing?'Edit asset':'Create asset',submitText:existing?'Save changes':'Create asset',body:`<div class="v21-edit-note"><strong>${existing?'Edit the master asset record':'Create a new asset record'}</strong><span>Changes are saved locally and immediately reloaded into this asset workspace.</span></div><div class="v21-edit-sections"><section><h3>Identity</h3><div class="form-grid">${field('code','Asset code',existing?.code||'',{required:true})}${field('name','Asset name',existing?.name||'',{required:true})}${field('type','Asset type',existing?.type||'Equipment',{type:'select',options:['Facility','Production area','Equipment','Subassembly','Tool'].map(x=>({value:x,label:x}))})}${field('category','Category',existing?.category||'Equipment')}${field('description','Description',existing?.description||'',{type:'textarea',span:true})}</div></section><section><h3>Hierarchy & responsibility</h3><div class="form-grid">${field('parentId','Parent asset',parentDefault,{type:'select',options:parentOptions(existing)})}${field('location','Location',existing?.location||'')}${field('ownerUserId','Responsible person',existing?.ownerUserId||'',{type:'select',options:userOptions})}${field('ownerGroupId','Responsible group',existing?.ownerGroupId||'',{type:'select',options:groupOptions})}${field('criticality','Criticality',existing?.criticality||'B',{type:'select',options:['A','B','C'].map(x=>({value:x,label:x}))})}${field('condition','Condition',existing?.condition||'Healthy',{type:'select',options:['Healthy','Attention','Critical'].map(x=>({value:x,label:x}))})}</div></section><section><h3>Nameplate data</h3><div class="form-grid">${field('manufacturer','Manufacturer',existing?.manufacturer||'')}${field('model','Model',existing?.model||'')}${field('serial','Serial number',existing?.serial||'')}${field('warrantyExpiry','Warranty expiry',existing?.warrantyExpiry||'',{type:'date'})}</div></section></div>`,onSubmit:fd=>{
      const v=Object.fromEntries(fd.entries());
      const code=String(v.code||'').trim(),name=String(v.name||'').trim(),parentId=String(v.parentId||'').trim()||null;
      if(!code||!name){toast('Asset code and name are required');return}
      const duplicate=state.assets.find(a=>a.type!=='Site'&&String(a.id)!==String(editId)&&String(a.code||'').trim().toLowerCase()===code.toLowerCase());
      if(duplicate){toast(`Asset code ${code} is already in use`);return}
      if(editId){const bad=new Set([String(editId),...descendants(editId).map(a=>String(a.id))]);if(parentId&&bad.has(String(parentId))){toast('An asset cannot be its own parent or sit beneath one of its sub-assets');return}}
      const values={code,name,type:v.type,category:v.category,description:v.description||'',parentId,location:v.location||'',ownerUserId:v.ownerUserId||'',ownerGroupId:v.ownerGroupId||'',criticality:v.criticality,condition:v.condition,manufacturer:v.manufacturer||'',model:v.model||'',serial:v.serial||'',warrantyExpiry:v.warrantyExpiry||'',siteId:existing?.siteId||currentSite()?.id||null,lastUpdatedAt:iso()};
      let savedId=editId;
      if(editId){
        const index=state.assets.findIndex(a=>String(a.id)===String(editId));if(index<0){toast('Asset record could not be found');return}
        const before=state.assets[index];state.assets[index]={...before,...values,id:before.id};
        state.assetEvents.unshift({id:uid('AE'),assetId:before.id,type:'Asset updated',at:iso(),userId:CURRENT_USER,detail:`${code} master record updated`});addAudit('ASSET_UPDATED',before.id,`${code} ${name} updated`);
      }else{
        const created={id:uid('AST'),commissioned:day(0),bom:[],operatingState:'Online',...values};state.assets.push(created);savedId=created.id;state.assetEvents.unshift({id:uid('AE'),assetId:created.id,type:'Asset created',at:iso(),userId:CURRENT_USER,detail:`${code} asset created`});addAudit('ASSET_CREATED',created.id,`${code} ${name}`);
      }
      ui.selectedAsset=savedId;ui.assetSearch='';
      try{
        saveState();
        const persisted=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
        const saved=(persisted?.assets||[]).find(a=>String(a.id)===String(savedId));
        if(!saved||saved.code!==code||saved.name!==name||String(saved.parentId||'')!==String(parentId||''))throw new Error('Saved asset did not match submitted values');
        state=persisted;
      }catch(err){console.error('Asset save verification failed',err);toast('Asset changes could not be verified on this device');return}
      closeModal();
      requestAnimationFrame(()=>{render();toast(existing?'Asset changes saved':'Asset created')});
    }});
  }

  window.renderAssets=renderAssetsV21;renderAssets=renderAssetsV21;
  window.showAssetForm=robustAssetEditor;showAssetForm=robustAssetEditor;

  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-v21-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();ui.assetRecordTab=tab.dataset.v21Tab;render();return}
    const scope=e.target.closest('[data-v21-scope]');if(scope){e.preventDefault();e.stopImmediatePropagation();ui.assetScope=scope.dataset.v21Scope;render();return}
    const toggle=e.target.closest('[data-v21-toggle]');if(toggle){e.preventDefault();e.stopImmediatePropagation();const id=String(toggle.dataset.v21Toggle);collapsed.has(id)?collapsed.delete(id):collapsed.add(id);saveCollapsed();render();return}
    const child=e.target.closest('[data-v21-add-child]');if(child){e.preventDefault();e.stopImmediatePropagation();(window.showFiixAssetCreator||robustAssetEditor)(null,String(child.dataset.v21AddChild));return}
    const back=e.target.closest('[data-v21-back]');if(back){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(ui.selectedAsset),p=parentOf(a);ui.selectedAsset=p?.id||roots()[0]?.id||null;render();return}
    const print=e.target.closest('[data-v21-print]');if(print){e.preventDefault();e.stopImmediatePropagation();window.print();return}
    const more=e.target.closest('[data-v21-more]');if(more){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(ui.selectedAsset);if(!a)return;const menu=document.createElement('div');document.querySelector('.v21-more-menu')?.remove();menu.className='v21-more-menu';menu.innerHTML=`<button type="button" data-v21-add-child="${a.id}">＋ Add sub-asset</button><button type="button" data-edit-asset="${a.id}">Edit asset</button><button type="button" data-v21-delete="${a.id}">Delete asset</button>`;document.body.appendChild(menu);const r=more.getBoundingClientRect();menu.style.left=`${Math.max(12,r.right-190)}px`;menu.style.top=`${r.bottom+6}px`;return}
    const del=e.target.closest('[data-v21-delete]');if(del){e.preventDefault();e.stopImmediatePropagation();document.querySelector('.v21-more-menu')?.remove();if(typeof showDeleteAsset==='function')showDeleteAsset(String(del.dataset.v21Delete));return}
    if(!e.target.closest('.v21-more-menu'))document.querySelector('.v21-more-menu')?.remove();
  },true);

  if(ui.route==='assets')render();
})();
