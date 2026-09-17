'use strict';
function renderAssets(){
  const q=ui.assetSearch.toLowerCase();
  const flat=flattenAssets().filter(x=>!q||`${x.asset.code} ${x.asset.name} ${x.asset.type} ${x.asset.location}`.toLowerCase().includes(q));
  if(!getAsset(ui.selectedAsset)) ui.selectedAsset=flat[0]?.asset.id||state.assets[0]?.id;
  const a=getAsset(ui.selectedAsset);
  return pageHead('Asset management','Asset register','Hierarchy, ownership, nameplate data, BOM, work history and operational state in one asset record.',
    `<button class="button" data-action="add-asset">＋ Add asset</button>`)
  +`<div class="split-view">
    <section class="card record-list">
      <div class="toolbar"><input data-filter="asset" value="${esc(ui.assetSearch)}" placeholder="Search asset hierarchy"></div>
      ${flat.map(({asset,depth})=>`<button class="record-row ${asset.id===ui.selectedAsset?'active':''} indent-${Math.min(depth,4)}" data-select-asset="${asset.id}"><span><strong>${assetIcon(asset)} ${esc(asset.name)}</strong><small>${esc(asset.code)} · ${esc(asset.type)} · ${esc(asset.location)}</small></span>${status(asset.operatingState)}</button>`).join('')}
    </section>
    <section class="card">${renderAssetDetail(a)}</section>
  </div>`;
}
function renderAssetDetail(a){
  if(!a)return '<div class="empty"><strong>No asset selected</strong></div>';
  const owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId);
  const active=activeWorkForAsset(a.id);
  const events=state.assetEvents.filter(e=>e.assetId===a.id);
  const meterList=state.meters.filter(m=>m.assetId===a.id);
  const work=state.workOrders.filter(w=>w.assetIds.includes(a.id));
  const bom=(a.bom||[]).map(getPart).filter(Boolean);
  const downtime=state.downtime.filter(d=>d.assetId===a.id);
  const totalDowntime=downtime.reduce((n,d)=>n+durationHours(d.startedAt,d.endedAt||iso()),0);
  let body='';
  if(ui.assetTab==='details'){
    body=`<div class="fields">
      <div class="field"><small>Asset code</small><strong>${esc(a.code)}</strong></div><div class="field"><small>Category</small><strong>${esc(a.category)}</strong></div><div class="field"><small>Criticality</small><strong>${esc(a.criticality)}</strong></div>
      <div class="field"><small>Parent</small><strong>${esc(getAsset(a.parentId)?.name||'Top level')}</strong></div><div class="field"><small>Location</small><strong>${esc(a.location)}</strong></div><div class="field"><small>Condition</small><strong>${status(a.condition)}</strong></div>
      <div class="field"><small>Manufacturer</small><strong>${esc(a.manufacturer||'—')}</strong></div><div class="field"><small>Model</small><strong>${esc(a.model||'—')}</strong></div><div class="field"><small>Serial</small><strong>${esc(a.serial||'—')}</strong></div>
      <div class="field"><small>Assigned person</small><strong>${esc(owner?.name||'Unassigned')}</strong></div><div class="field"><small>Assigned group</small><strong>${esc(group?.name||'Unassigned')}</strong></div><div class="field"><small>Commissioned</small><strong>${dateFmt(a.commissioned)}</strong></div>
      <div class="field"><small>Warranty expiry</small><strong>${dateFmt(a.warrantyExpiry)}</strong></div><div class="field"><small>Total downtime recorded</small><strong>${totalDowntime.toFixed(1)} h</strong></div><div class="field"><small>Active work orders</small><strong>${active.length}</strong></div>
    </div>
    ${a.operatingState==='Offline'?`<div class="notice" style="margin-top:15px"><strong>Asset is Offline.</strong> ${esc(a.downtimeReason||'No reason recorded')} · since ${dateTimeFmt(a.offlineSince)}</div>`:''}
    <h3 class="section-title">Meters</h3>${meterList.map(m=>`<div class="setting-row"><div><strong>${esc(m.name)}</strong><small>Latest reading ${dateFmt(m.readings.at(-1)?.at)}</small></div><b>${esc(m.current)} ${esc(m.unit)}</b></div>`).join('')||'<p class="muted">No meters linked.</p>'}`;
  }else if(ui.assetTab==='work'){
    body=table(['Work order','Type','Status','Due'],work.map(w=>`<tr class="clickable" data-open-work="${w.id}"><td><span class="cell-title">${esc(w.id)}</span><span class="cell-sub">${esc(w.title)}</span></td><td>${esc(w.type)}</td><td>${status(w.status)}</td><td>${dateFmt(w.due)}</td></tr>`),'No work history');
  }else if(ui.assetTab==='bom'){
    body=table(['Part','Description','On hand','Min','Primary vendor'],bom.map(p=>`<tr data-open-part="${p.id}" class="clickable"><td><span class="cell-title">${esc(p.code)}</span></td><td>${esc(p.name)}</td><td>${partOnHand(p)} ${esc(p.uom)}</td><td>${p.min}</td><td>${esc(getVendor(p.vendorId)?.name||'—')}</td></tr>`),'No BOM parts');
  }else{
    body=`<div class="timeline">${events.map(e=>`<div class="event"><strong>${esc(e.type)} · ${esc(e.detail)}</strong><small>${dateTimeFmt(e.at)} · ${esc(getUser(e.userId)?.name||e.userId||'System')}</small></div>`).join('')||'<div class="empty"><span>No asset events yet.</span></div>'}</div>`;
  }
  return `<div class="detail-hero"><div class="detail-title"><div class="asset-avatar">${assetIcon(a)}</div><div><h2>${esc(a.name)}</h2><p>${esc(a.code)} · ${esc(a.type)} · ${esc(a.location)}</p></div><div class="detail-actions"><button class="button" data-edit-asset="${a.id}">Edit</button><button class="button ${a.operatingState==='Online'?'danger':'primary'}" data-toggle-asset="${a.id}">${a.operatingState==='Online'?'Take offline':'Return online'}</button></div></div>
      <div class="stat-strip"><div><small>Operating state</small><strong>${status(a.operatingState)}</strong></div><div><small>Condition</small><strong>${status(a.condition)}</strong></div><div><small>Criticality</small><strong>${esc(a.criticality)}</strong></div><div><small>Responsible</small><strong>${esc(owner?.name||group?.name||'Unassigned')}</strong></div></div>
    </div>
    <div class="tabs">${[['details','Details'],['work','Work history'],['bom','BOM & parts'],['events','Asset log']].map(([id,label])=>`<button class="tab ${ui.assetTab===id?'active':''}" data-asset-tab="${id}">${label}</button>`).join('')}</div>
    <div class="detail-body">${body}</div>`;
}
function showAssetForm(asset=null){
  const parentOptions=[{value:'',label:'Top level'},...state.assets.filter(a=>a.id!==asset?.id).map(a=>({value:a.id,label:`${a.code} · ${a.name}`}))];
  const userOptions=[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))];
  const groupOptions=[{value:'',label:'Unassigned'},...state.groups.map(g=>({value:g.id,label:g.name}))];
  openModal({eyebrow:'Asset management',title:asset?'Edit asset':'Add asset',body:`<div class="form-grid">
    ${field('code','Asset code',asset?.code||'',{required:true})}${field('name','Asset name',asset?.name||'',{required:true})}
    ${field('type','Asset type',asset?.type||'Equipment',{type:'select',options:['Site','Facility','Production area','Equipment','Subassembly','Tool'].map(x=>({value:x,label:x}))})}
    ${field('parentId','Parent asset',asset?.parentId||'',{type:'select',options:parentOptions})}
    ${field('category','Category',asset?.category||'Equipment')}${field('criticality','Criticality',asset?.criticality||'B',{type:'select',options:['A','B','C'].map(x=>({value:x,label:x}))})}
    ${field('location','Location',asset?.location||'')}${field('condition','Condition',asset?.condition||'Healthy',{type:'select',options:['Healthy','Attention','Critical'].map(x=>({value:x,label:x}))})}
    ${field('ownerUserId','Responsible person',asset?.ownerUserId||'',{type:'select',options:userOptions})}${field('ownerGroupId','Responsible group',asset?.ownerGroupId||'',{type:'select',options:groupOptions})}
    ${field('manufacturer','Manufacturer',asset?.manufacturer||'')}${field('model','Model',asset?.model||'')}
    ${field('serial','Serial number',asset?.serial||'')}${field('warrantyExpiry','Warranty expiry',asset?.warrantyExpiry||'',{type:'date'})}
  </div>`,submitText:asset?'Save changes':'Create asset',onSubmit:fd=>{
    const values=Object.fromEntries(fd.entries());
    if(asset){Object.assign(asset,values);addAudit('ASSET_UPDATED',asset.id,`Asset profile updated`);ui.selectedAsset=asset.id}
    else{
      const a={id:uid('AST'),siteId:'SITE-GH',commissioned:day(0),bom:[],operatingState:'Online',...values};
      state.assets.push(a);state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Asset created',at:iso(),userId:CURRENT_USER,detail:`${a.code} created`});addAudit('ASSET_CREATED',a.id,`${a.code} ${a.name}`);ui.selectedAsset=a.id;
    }
    saveState();closeModal();render();toast(asset?'Asset updated':'Asset created');
  }});
}
function showAssetStateModal(id){
  const a=getAsset(id);if(!a)return;const next=a.operatingState==='Online'?'Offline':'Online';
  openModal({eyebrow:'Operational state',title:`Set ${a.code} ${next}`,danger:next==='Offline',submitText:next==='Offline'?'Take asset offline':'Return asset online',body:`
    <div class="notice ${next==='Online'?'info':''}" style="margin-bottom:14px">This change creates an asset-history and audit event. Configured stakeholders receive in-app alerts and an email copy is queued locally.</div>
    <div class="form-grid">
      ${field('reasonCode','Reason code',next==='Offline'?'Mechanical':'Restored',{type:'select',options:(next==='Offline'?['Mechanical','Electrical','Process','Safety','Planned maintenance','Other']:['Restored','Testing complete','Temporary bypass','Other']).map(x=>({value:x,label:x}))})}
      ${field('reason','Reason / completion note','',{type:'textarea',required:true,span:true})}
      ${next==='Offline'?'<label class="check-row span-2"><input type="checkbox" name="createWork" checked> Create a corrective work order automatically</label>':''}
    </div>`,onSubmit:fd=>{
      const reason=String(fd.get('reason')||'').trim();if(!reason){toast('A reason is required');return}
      changeAssetState(id,next,reason,String(fd.get('reasonCode')||'Other'),fd.get('createWork')==='on');closeModal();render();toast(`${a.code} set ${next}`);
    }});
}
