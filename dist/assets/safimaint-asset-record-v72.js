'use strict';

// SafiMaintain asset record v72
// A complete, Fiix-familiar equipment record rebuilt for SafiMaintain's calmer stock-first workflow.
(function(){
  const hierarchyRenderer=renderAssets;
  const TABS=[
    ['general','General'],['bom','Parts / BOM'],['meter','Meters & events'],['personnel','People'],
    ['warranties','Warranties'],['businesses','Suppliers'],['purchasing','Stock history'],
    ['files','Files'],['custom','Custom'],['financials','Costs'],['log','Timeline']
  ];

  ui.assetRecordTab=ui.assetRecordTab||'general';

  function workFor(a){return (state.workOrders||[]).filter(w=>(w.assetIds||[]).includes(a.id))}
  function eventsFor(a){return (state.assetEvents||[]).filter(e=>e.assetId===a.id)}
  function downtimeFor(a){return (state.downtime||[]).filter(d=>d.assetId===a.id)}
  function metersFor(a){return (state.meters||[]).filter(m=>m.assetId===a.id)}
  function parentOf(a){return getAsset(a?.parentId)}
  function childrenOf(a){return (state.assets||[]).filter(x=>String(x.parentId||'')===String(a.id))}
  function closed(w){return ['Completed','Closed','Cancelled'].includes(String(w.status||''))}
  function activeWork(a){return workFor(a).filter(w=>!closed(w))}
  function bomParts(a){return (a.bom||[]).map(getPart).filter(Boolean)}
  function pathFor(a){const path=[],seen=new Set();let current=a;while(current&&!seen.has(current.id)){seen.add(current.id);path.unshift(current);current=parentOf(current)}return path}
  function relation(a){
    const part=getAsset(a.partOfAssetId),located=getAsset(a.locationId),parent=parentOf(a);
    if(part)return {kind:'Part of equipment',asset:part};
    if(located)return {kind:'Located at',asset:located};
    if(parent)return {kind:String(a.type||'').match(/facility|room|area|site/i)?'Inside location':'Located at',asset:parent};
    return {kind:'Top-level asset',asset:null};
  }
  function totalDowntime(a){return downtimeFor(a).reduce((n,d)=>n+durationHours(d.startedAt,d.endedAt||iso()),0)}
  function laborCost(w){return (w.labor||[]).reduce((n,l)=>n+Number(l.hours||0)*Number(getUser(l.userId)?.hourlyRate||0),0)}
  function partsCost(w){return (w.parts||[]).reduce((n,l)=>n+Number(l.actual||0)*Number(getPart(l.partId)?.unitCost||getPart(l.partId)?.lastPrice||0),0)}
  function otherCost(w){return (w.miscCosts||[]).reduce((n,l)=>n+Number(l.amount||0),0)}
  function lifetimeCost(a){return workFor(a).reduce((n,w)=>n+laborCost(w)+partsCost(w)+otherCost(w),0)}
  function initials(value){return String(value||'—').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}
  function assetIcon(a){
    const type=String(a.type||'').toLowerCase();
    if(/facility|site|room|area/.test(type))return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 54V21l22-11 22 11v33M20 54V41h24v13M20 27h7m10 0h7M20 34h7m10 0h7"/><path class="accent" d="M6 54h52"/></svg>';
    if(type.includes('tool'))return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M39 11a13 13 0 0 0-15 17L9 43a5 5 0 0 0 0 7l5 5a5 5 0 0 0 7 0l15-15a13 13 0 0 0 17-15l-9 9-8-2-2-8 9-9a13 13 0 0 0-4-4Z"/><path class="accent" d="m14 49 3 3"/></svg>';
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="16" width="48" height="34" rx="6"/><path d="M18 16V9m28 7V9M18 50v7m28-7v7M17 28h30M17 38h20"/><circle class="accent" cx="46" cy="39" r="4"/></svg>';
  }
  function qr(code){
    let seed=2166136261,n=17,out='';for(const c of String(code||'ASSET'))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const zone=(x<5&&y<5)||(x>11&&y<5)||(x<5&&y>11);let on=false;
      if(zone){const xx=x>11?x-12:x,yy=y>11?y-12:y;on=xx===0||xx===4||yy===0||yy===4||(xx>1&&xx<4&&yy>1&&yy<4)}
      else{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;on=Boolean(seed&1)}
      out+='<i'+(on?' class="on"':'')+'></i>';
    }
    return out;
  }
  function empty(icon,title,text,action=''){
    return '<div class="ar72-empty"><span>'+icon+'</span><strong>'+esc(title)+'</strong><p>'+esc(text)+'</p>'+action+'</div>';
  }
  function section(title,sub,content,action=''){
    return '<section class="ar72-panel"><header><div><h2>'+esc(title)+'</h2><p>'+esc(sub||'')+'</p></div>'+action+'</header>'+content+'</section>';
  }
  function valueGrid(rows){
    return '<div class="ar72-values">'+rows.map(([label,value,wide])=>'<div class="'+(wide?'wide':'')+'"><span>'+esc(label)+'</span><strong>'+value+'</strong></div>').join('')+'</div>';
  }
  function table(headers,rows){
    return '<div class="ar72-table-wrap"><table class="ar72-table"><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
  }
  function stateTone(a){return a.operatingState==='Offline'?'offline':a.condition==='Attention'||a.condition==='Critical'?'warning':'online'}
  function currentLocation(a){return getAsset(a.locationId)||(/facility|site|room|area/i.test(a.type||'')?parentOf(a):null)||parentOf(a)}
  function coordinates(a){return {lat:Number(a.latitude??5.7041),lng:Number(a.longitude??-0.0312)}}
  function plantMap(a){
    const c=coordinates(a),location=currentLocation(a);
    return '<div class="ar72-map" role="img" aria-label="Plant location map for '+esc(a.name)+'">'+
      '<div class="ar72-map-grid"></div><div class="ar72-map-road r1"></div><div class="ar72-map-road r2"></div><div class="ar72-map-block b1">OPERATIONS</div><div class="ar72-map-block b2">STORES</div><div class="ar72-map-block b3">CHP</div><div class="ar72-map-marker"><i></i><span>'+esc(a.code)+'</span></div><div class="ar72-map-legend"><strong>'+esc(location?.name||a.location||'Location not assigned')+'</strong><span>'+c.lat.toFixed(5)+', '+c.lng.toFixed(5)+'</span></div><a href="https://www.google.com/maps?q='+c.lat+','+c.lng+'" target="_blank" rel="noopener">Open map ↗</a></div>';
  }

  function toolbar(a){
    return '<div class="ar72-toolbar"><div><button class="ar72-icon-button" type="button" data-v45-back aria-label="Back to hierarchy">←</button><span class="ar72-page-type">'+esc(a.type)+' record</span></div><div class="ar72-toolbar-actions"><button class="button" type="button" data-v72-print-tag="'+esc(a.id)+'">Print tag</button><button class="button" type="button" data-fx23-clone="'+esc(a.id)+'">Duplicate</button><button class="button" type="button" data-edit-asset="'+esc(a.id)+'">Edit details</button><button class="button primary" type="button" data-v45-new-work="'+esc(a.id)+'">＋ New work</button></div></div>';
  }
  function identity(a){
    const owner=getUser(a.ownerUserId),rel=relation(a),open=activeWork(a),parts=bomParts(a),meters=metersFor(a),c=coordinates(a);
    return '<section class="ar72-identity '+stateTone(a)+'"><div class="ar72-art"><div class="ar72-art-orbit"></div>'+assetIcon(a)+'<span>'+esc(a.type)+'</span></div><div class="ar72-identity-main">'+
      '<div class="ar72-breadcrumb">'+pathFor(a).map((x,i,arr)=>'<button type="button" data-v45-open="'+esc(x.id)+'">'+esc(x.name)+'</button>'+(i<arr.length-1?'<b>›</b>':'')).join('')+'</div>'+
      '<div class="ar72-title"><div><p>'+esc(a.category||a.type)+' · '+esc(a.code)+'</p><h1>'+esc(a.name)+'</h1></div><button class="ar72-state '+stateTone(a)+'" data-toggle-asset="'+esc(a.id)+'" type="button"><i></i><span><small>Operating state</small><strong>'+esc(a.operatingState||'Unknown')+'</strong></span><b>'+ (a.operatingState==='Online'?'Take offline':'Return online') +' →</b></button></div>'+
      '<p class="ar72-description">'+esc(a.description||'Maintain the complete identity, location, stock relationship and service history for this asset.')+'</p>'+
      '<div class="ar72-facts"><div><span>Relationship</span><strong>'+esc(rel.kind)+'</strong><small>'+esc(rel.asset?.name||'Independent record')+'</small></div><div><span>Condition</span><strong>'+esc(a.condition||'Unknown')+'</strong><small>Criticality '+esc(a.criticality||'—')+'</small></div><div><span>Responsible</span><strong>'+esc(owner?.name||getGroup(a.ownerGroupId)?.name||'Unassigned')+'</strong><small>'+esc(getGroup(a.ownerGroupId)?.name||'No team')+'</small></div><div><span>Coordinates</span><strong>'+c.lat.toFixed(4)+', '+c.lng.toFixed(4)+'</strong><small>'+esc(currentLocation(a)?.name||a.location||'No location')+'</small></div></div>'+ 
      '<div class="ar72-vitals"><span><b>'+open.length+'</b> open work</span><span><b>'+parts.length+'</b> BOM parts</span><span><b>'+meters.length+'</b> meters</span><span><b>'+totalDowntime(a).toFixed(1)+'h</b> downtime</span></div></div>'+ 
      '<aside class="ar72-tag"><div class="ar72-qr">'+qr(a.code)+'</div><strong>'+esc(a.code)+'</strong><span>Scan asset record</span><button type="button" data-v72-print-tag="'+esc(a.id)+'">Print QR tag</button></aside></section>';
  }
  function tabs(){return '<nav class="ar72-tabs" aria-label="Asset record sections">'+TABS.map(([id,label])=>'<button type="button" data-v72-tab="'+id+'" class="'+(ui.assetRecordTab===id?'active':'')+'"><span>'+label+'</span></button>').join('')+'</nav>'}

  function general(a){
    const rel=relation(a),owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId),parent=parentOf(a),kids=childrenOf(a);
    const location=section('Location of asset','Physical placement and equipment relationship',
      '<div class="ar72-location"><div class="ar72-location-summary"><span class="ar72-location-icon">⌖</span><div><small>'+esc(rel.kind)+'</small><strong>'+esc(rel.asset?.name||a.location||'No location assigned')+'</strong><p>'+esc(parent?.code||a.siteId||'')+(a.location?' · '+esc(a.location):'')+'</p></div><button class="button primary" type="button" data-v72-location="'+esc(a.id)+'">Change location</button></div>'+plantMap(a)+'</div>',
      '<span class="ar72-panel-badge">Hierarchy controlled</span>');
    const details=section('General information','Nameplate, responsibility and lifecycle data',valueGrid([
      ['Asset code',esc(a.code)],['Category',esc(a.category||'—')],['Type',esc(a.type||'—')],['Status',status(a.operatingState||'Unknown')],
      ['Manufacturer',esc(a.manufacturer||'—')],['Model',esc(a.model||'—')],['Serial number',esc(a.serial||'—')],['Commissioned',dateFmt(a.commissioned)],
      ['Responsible person',esc(owner?.name||'Unassigned')],['Responsible team',esc(group?.name||'Unassigned')],['Criticality',esc(a.criticality||'—')],['Condition',status(a.condition||'Unknown')],
      ['Account / cost centre',esc(a.account||'Operations')],['Charge department',esc(a.chargeDepartment||group?.name||'Operations')],['Notes',esc(a.notes||a.description||'No operational notes recorded.'),true]
    ]),'<button class="button" type="button" data-edit-asset="'+esc(a.id)+'">Edit information</button>');
    const children=section('Sub-assets','Equipment, components and tools directly below this record',kids.length?'<div class="ar72-child-grid">'+kids.map(k=>'<button type="button" data-v45-open="'+esc(k.id)+'"><span>'+assetIcon(k)+'</span><div><strong>'+esc(k.name)+'</strong><small>'+esc(k.code)+' · '+esc(k.type)+'</small></div><b>→</b></button>').join('')+'</div>':empty('◇','No sub-assets yet','Add equipment, a component or a tool under this record.'),'<button class="button" type="button" data-fx23-add-child="'+esc(a.id)+'">＋ Add sub-asset</button>');
    return location+details+children;
  }
  function bom(a){
    const parts=bomParts(a),open=activeWork(a);
    const rows=parts.map(p=>{const qty=Number(a.bomQuantities?.[p.id]||1),on=partOnHand(p),low=on<Number(p.min||0);return '<tr><td><button class="ar72-link" data-open-part="'+esc(p.id)+'"><strong>'+esc(p.code)+'</strong><span>'+esc(p.name)+'</span></button></td><td>'+qty+' '+esc(p.uom||'ea')+'</td><td><strong class="'+(low?'text-danger':'text-good')+'">'+on+' '+esc(p.uom||'')+'</strong><small>'+ (low?'Below minimum':'Available') +'</small></td><td>'+Number(p.min||0)+' / '+Number(p.max||0)+'</td><td>'+esc((p.locations||[]).map(l=>(getStore(l.storeId)?.name||l.storeId)+' · '+(l.bin||'No bin')).join(', ')||'No location')+'</td><td><div class="ar72-row-actions"><button data-v45-issue-bom="'+esc(a.id)+'|'+esc(p.id)+'">Issue</button><button data-v45-stock-bom="'+esc(a.id)+'|'+esc(p.id)+'">Stock</button><button data-open-part="'+esc(p.id)+'">Open</button></div></td></tr>'});
    return section('Parts / Bill of Materials','Stock items normally required to maintain '+a.code,
      '<div class="ar72-summary"><div><span>Linked parts</span><strong>'+parts.length+'</strong></div><div><span>Below minimum</span><strong>'+parts.filter(p=>partOnHand(p)<Number(p.min||0)).length+'</strong></div><div><span>Open-work demand</span><strong>'+open.reduce((n,w)=>n+(w.parts||[]).reduce((s,l)=>s+Math.max(0,Number(l.planned||0)-Number(l.actual||0)),0),0)+'</strong></div><div><span>Stock value</span><strong>'+money(parts.reduce((n,p)=>n+partOnHand(p)*Number(p.unitCost||p.lastPrice||0),0))+'</strong></div></div>'+ (rows.length?table(['Part','BOM qty','On hand','Min / max','Stock location','Actions'],rows):empty('▣','No BOM parts linked','Connect the spare parts normally used on this asset.')),
      '<div class="ar72-panel-actions"><button class="button" data-route="inventory">Open inventory</button><button class="button primary" data-v45-add-bom="'+esc(a.id)+'">＋ Add part</button></div>');
  }
  function meter(a){
    const meters=metersFor(a),events=[...eventsFor(a).map(e=>({at:e.at,title:e.type,detail:e.detail})),...downtimeFor(a).map(d=>({at:d.startedAt,title:d.endedAt?'Downtime ended':'Asset offline',detail:d.reason||d.reasonCode}))].sort((x,y)=>String(y.at).localeCompare(String(x.at)));
    const meterCards=meters.length?'<div class="ar72-meter-grid">'+meters.map(m=>'<article><header><div><span>'+esc(m.name)+'</span><strong>'+esc(m.current)+' <small>'+esc(m.unit)+'</small></strong></div><button data-v45-meter-reading="'+esc(m.id)+'">＋ Reading</button></header><div class="ar72-spark">'+(m.readings||[]).slice(-10).map((r,i,arr)=>{const values=arr.map(x=>Number(x.value)),min=Math.min(...values),max=Math.max(...values),h=20+80*(Number(r.value)-min)/Math.max(1,max-min);return '<i style="height:'+h+'%"></i>'}).join('')+'</div><p>Last reading '+dateTimeFmt(m.readings?.at(-1)?.at)+'</p></article>').join('')+'</div>':empty('⌁','No meters configured','Add runtime, production, starts or cycle meters to this asset.');
    const timeline=events.length?'<div class="ar72-event-stream">'+events.slice(0,16).map(e=>'<div><i></i><span><strong>'+esc(e.title)+'</strong><small>'+esc(e.detail||'No additional detail')+'</small></span><time>'+dateTimeFmt(e.at)+'</time></div>').join('')+'</div>':empty('◌','No events recorded','State changes, downtime and inspection observations will appear here.');
    return section('Meters','Usage and condition readings',meterCards,'<button class="button primary" data-v45-add-meter="'+esc(a.id)+'">＋ New meter</button>')+section('Events & downtime','Operational events in chronological order',timeline,'<button class="button" data-v45-event="'+esc(a.id)+'">Record event</button>');
  }
  function personnel(a){
    const owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId),users=[...new Set(activeWork(a).flatMap(w=>w.assigneeIds||[]))].map(getUser).filter(Boolean);
    return section('Asset responsibility','Primary ownership and escalation route','<div class="ar72-owner"><span>'+initials(owner?.name||group?.name)+'</span><div><small>Responsible person</small><strong>'+esc(owner?.name||'Unassigned')+'</strong><p>'+esc(owner?.email||'No email')+(group?' · '+esc(group.name):'')+'</p></div><button class="button primary" data-v45-assign="'+esc(a.id)+'">Change assignment</button></div>')+
      section('People on active work','Technicians currently connected to this asset',users.length?'<div class="ar72-people">'+users.map(u=>'<div><span>'+initials(u.name)+'</span><div><strong>'+esc(u.name)+'</strong><small>'+esc(getRole(u.roleId)?.name||'Team member')+' · '+activeWork(a).filter(w=>(w.assigneeIds||[]).includes(u.id)).length+' active work</small></div></div>').join('')+'</div>':empty('◎','Nobody assigned to active work','Technicians will appear here when work is assigned.'));
  }
  function warranties(a){
    const records=(a.warranties||[]).length?a.warranties:(a.warrantyExpiry?[{id:'legacy',provider:a.manufacturer||'Manufacturer warranty',reference:a.serial||a.code,start:a.commissioned,expiry:a.warrantyExpiry,coverage:'Standard equipment warranty',status:new Date(a.warrantyExpiry)>=new Date()?'Active':'Expired'}]:[]);
    const rows=records.map(w=>'<tr><td><strong>'+esc(w.provider||'—')+'</strong><small>'+esc(w.coverage||'No coverage note')+'</small></td><td>'+esc(w.reference||'—')+'</td><td>'+dateFmt(w.start)+'</td><td>'+dateFmt(w.expiry)+'</td><td>'+status(w.status||(new Date(w.expiry)>=new Date()?'Active':'Expired'))+'</td></tr>');
    return section('Warranties','Coverage, expiry and supplier reference',rows.length?table(['Provider','Reference','Start','Expiry','Status'],rows):empty('◇','No warranty recorded','Add warranty coverage so planners can check it before authorising repairs.'),'<button class="button primary" data-v72-add-warranty="'+esc(a.id)+'">＋ Add warranty</button>');
  }
  function businesses(a){
    const ids=new Set(a.businessIds||[]);bomParts(a).forEach(p=>{if(p.vendorId)ids.add(p.vendorId);if(p.preferredBusinessId)ids.add(p.preferredBusinessId)});
    const list=[...(state.vendors||[]),...(state.businesses||[])].filter((v,i,arr)=>ids.has(v.id)&&arr.findIndex(x=>x.id===v.id)===i);
    return section('Suppliers & service businesses','Businesses connected through the asset or its BOM',list.length?'<div class="ar72-business-grid">'+list.map(v=>'<article><span>'+initials(v.name)+'</span><div><strong>'+esc(v.name)+'</strong><small>'+esc(v.contact||'No contact')+'</small><p>'+esc(v.email||'No email')+' · '+esc(v.phone||'No phone')+'</p></div>'+status(v.status||'Active')+'</article>').join('')+'</div>':empty('◫','No business connected','Associate approved suppliers or service contractors with this asset.'),'<button class="button primary" data-v72-businesses="'+esc(a.id)+'">Manage businesses</button>');
  }
  function purchasing(a){
    const pids=new Set(bomParts(a).map(p=>p.id)),workIds=new Set(workFor(a).map(w=>w.id));
    const requests=(state.purchaseRequests||[]).filter(r=>r.assetId===a.id||pids.has(r.partId));
    const movements=(state.stockTransactions||[]).filter(t=>pids.has(t.partId)&&(t.workOrderId?workIds.has(t.workOrderId):true)).sort((x,y)=>String(y.at).localeCompare(String(x.at)));
    const requestRows=requests.map(r=>{const p=getPart(r.partId);return '<tr><td><strong>'+esc(r.id)+'</strong><small>'+dateFmt(r.createdAt)+'</small></td><td>'+esc(p?.code||r.partId)+' · '+esc(p?.name||'')+'</td><td>'+Number(r.requestedQty||r.qty||r.quantity||0)+' '+esc(p?.uom||'')+'</td><td>'+status(r.status||'Requested')+'</td><td>'+esc(r.reason||r.source||'—')+'</td></tr>'});
    const movementRows=movements.slice(0,30).map(t=>{const p=getPart(t.partId);return '<tr><td>'+dateTimeFmt(t.at)+'</td><td>'+esc(p?.code||t.partId)+' · '+esc(p?.name||'')+'</td><td>'+status(t.type||'Movement')+'</td><td><strong class="'+(Number(t.qty)<0?'text-danger':'text-good')+'">'+(Number(t.qty)>0?'+':'')+Number(t.qty)+' '+esc(p?.uom||'')+'</strong></td><td>'+esc(getStore(t.storeId)?.name||t.storeId||'—')+' · '+esc(t.bin||'No bin')+'</td><td>'+esc(t.reference||t.workOrderId||'—')+'</td></tr>'});
    return '<div class="ar72-note"><span>Stock-first purchasing</span><p>SafiMaintain shows replenishment requests and receipts here. Purchase-order creation is intentionally excluded.</p></div>'+section('Replenishment requests','Demand raised for this asset’s spare parts',requestRows.length?table(['Request','Part','Quantity','Status','Reason'],requestRows):empty('↻','No replenishment requests','Requests raised from BOM shortages will appear here.'))+section('Stock movement history','Receipts, issues, transfers and count adjustments for linked parts',movementRows.length?table(['Date','Part','Movement','Quantity','Location','Reference'],movementRows):empty('⇄','No stock movement yet','Issue or receive a BOM part to build this history.'));
  }
  function files(a){return section('Files & evidence','Manuals, photographs, certificates and service documents','<div class="ar72-file-drop"><span>⇧</span><div><strong>Drop operational evidence here</strong><p>Photos and manuals remain available offline and synchronize when the shared service is connected.</p></div><label class="button primary">Choose files<input type="file" multiple data-local-file-input="'+esc(a.id)+'" hidden></label></div><div class="attachment-list" data-local-file-list="'+esc(a.id)+'"></div>','<span class="ar72-panel-badge">25 MB per file</span>')}
  function custom(a){
    const custom=a.customFields||{};const rows=Object.entries(custom);
    return section('Custom fields','Site-specific information that does not belong in the standard record',rows.length?'<div class="ar72-custom-grid">'+rows.map(([k,v])=>'<div><span>'+esc(k)+'</span><strong>'+esc(v||'—')+'</strong></div>').join('')+'</div>':empty('＋','No custom fields','Add plant-specific fields without changing the core asset model.'),'<button class="button primary" data-v72-custom="'+esc(a.id)+'">Edit custom fields</button>');
  }
  function financials(a){
    const work=workFor(a),labor=work.reduce((n,w)=>n+laborCost(w),0),parts=work.reduce((n,w)=>n+partsCost(w),0),other=work.reduce((n,w)=>n+otherCost(w),0),total=labor+parts+other;
    return section('Lifecycle cost','Maintenance cost accumulated from completed and active work','<div class="ar72-cost-hero"><div><span>Lifetime maintenance cost</span><strong>'+money(total)+'</strong><small>'+work.length+' linked work orders</small></div><div class="ar72-cost-ring" style="--progress:'+Math.min(100,Math.round(total/Math.max(1,Number(a.replacementValue||total))*100))+'"><span>'+Math.min(100,Math.round(total/Math.max(1,Number(a.replacementValue||total))*100))+'%</span></div></div><div class="ar72-summary"><div><span>Labour</span><strong>'+money(labor)+'</strong></div><div><span>Parts</span><strong>'+money(parts)+'</strong></div><div><span>Other costs</span><strong>'+money(other)+'</strong></div><div><span>Replacement value</span><strong>'+money(a.replacementValue||0)+'</strong></div></div>'+valueGrid([['Purchase / capital cost',money(a.purchaseCost||0)],['Annual maintenance budget',money(a.maintenanceBudget||0)],['Cost centre',esc(a.account||'Operations')],['Charge department',esc(a.chargeDepartment||getGroup(a.ownerGroupId)?.name||'Operations')]]),'<button class="button primary" data-v45-edit-financial="'+esc(a.id)+'">Edit costs</button>');
  }
  function log(a){
    const rows=[];eventsFor(a).forEach(e=>rows.push({at:e.at,title:e.type,detail:e.detail,user:getUser(e.userId)?.name||'System'}));
    downtimeFor(a).forEach(d=>rows.push({at:d.startedAt,title:'Downtime recorded',detail:d.reason||d.reasonCode,user:getUser(d.reportedBy)?.name||'System'}));
    workFor(a).forEach(w=>rows.push({at:w.createdAt,title:w.id+' created',detail:w.title,user:'Maintenance workflow'}));
    rows.sort((x,y)=>String(y.at).localeCompare(String(x.at)));
    return section('Asset timeline','One audit-friendly history across state, work, stock and meter activity',rows.length?'<div class="ar72-timeline">'+rows.map(r=>'<div><i></i><time>'+dateTimeFmt(r.at)+'</time><span><strong>'+esc(r.title)+'</strong><small>'+esc(r.detail||'')+' · '+esc(r.user)+'</small></span></div>').join('')+'</div>':empty('◌','No history yet','Activity will appear automatically as this asset is used.'));
  }
  function body(a){return ({general,bom,meter,personnel,warranties,businesses,purchasing,files,custom,financials,log}[ui.assetRecordTab]||general)(a)}
  function record(a){
    if(!a)return empty('!','Asset not found','Return to the hierarchy and choose another record.');
    return '<div class="ar72-record">'+toolbar(a)+identity(a)+tabs()+'<main class="ar72-body">'+body(a)+'</main></div>';
  }
  function renderAssetsV72(){return ui.assetView==='record'?record(getAsset(ui.selectedAsset)):hierarchyRenderer()}
  renderAssets=renderAssetsV72;window.renderAssets=renderAssetsV72;

  function refresh(){render();setTimeout(()=>window.SafiFileUI?.refresh?.(true),0)}
  function event(a,type,detail){state.assetEvents=state.assetEvents||[];state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type,at:iso(),userId:CURRENT_USER,detail});addAudit(type.toUpperCase().replace(/\W+/g,'_'),a.id,detail)}
  function assetOptions(filter){return (state.assets||[]).filter(filter).map(x=>({value:x.id,label:x.code+' · '+x.name}))}
  function editLocation(a){
    const isPart=Boolean(a.partOfAssetId),mode=isPart?'partOf':'locatedAt';
    openModal({eyebrow:a.code+' · Asset location',title:'Place '+a.name,submitText:'Save location',body:'<div class="ar72-modal-intro"><strong>Choose the relationship that exists in the plant</strong><span>Locations answer “where is it?” Equipment parents answer “what system is it part of?”</span></div><div class="form-grid">'+field('relationship','Relationship',mode,{type:'select',options:[{value:'locatedAt',label:'Located at a facility, room or area'},{value:'partOf',label:'Part of another equipment asset'},{value:'top',label:'Top-level / unlinked asset'}]})+field('targetId','Location or parent',a.partOfAssetId||a.locationId||a.parentId||'',{type:'select',options:[{value:'',label:'Select a record'},...assetOptions(x=>x.id!==a.id)]})+field('location','Location note',a.location||'',{span:true})+field('latitude','Latitude',String(coordinates(a).lat),{type:'number',step:'.00001'})+field('longitude','Longitude',String(coordinates(a).lng),{type:'number',step:'.00001'})+'</div>',onSubmit:fd=>{
      const relationship=String(fd.get('relationship')),target=String(fd.get('targetId')||'');
      if(relationship!=='top'&&!target){toast('Choose a location or parent asset');return}
      if(relationship==='partOf'){a.partOfAssetId=target;a.locationId=null;a.parentId=target}
      else if(relationship==='locatedAt'){a.locationId=target;a.partOfAssetId=null;a.parentId=target}
      else{a.locationId=null;a.partOfAssetId=null;a.parentId=null}
      a.location=String(fd.get('location')||'');a.latitude=Number(fd.get('latitude'));a.longitude=Number(fd.get('longitude'));
      event(a,'Asset moved',(relationship==='top'?'Set as top-level':'Placed '+relationship+' '+(getAsset(target)?.name||target)));saveState();closeModal();refresh();toast('Asset location updated');
    }});
  }
  function addWarranty(a){openModal({eyebrow:a.code+' · Warranty',title:'Add warranty coverage',submitText:'Save warranty',body:'<div class="form-grid">'+field('provider','Provider / manufacturer',a.manufacturer||'',{required:true})+field('reference','Contract or warranty reference',a.serial||'')+field('start','Start date',a.commissioned||'',{type:'date'})+field('expiry','Expiry date',a.warrantyExpiry||'',{type:'date',required:true})+field('coverage','Coverage details','Parts and labour',{type:'textarea',span:true})+'</div>',onSubmit:fd=>{const w={id:uid('WAR'),provider:String(fd.get('provider')),reference:String(fd.get('reference')),start:String(fd.get('start')),expiry:String(fd.get('expiry')),coverage:String(fd.get('coverage')),status:new Date(String(fd.get('expiry')))>=new Date()?'Active':'Expired'};a.warranties=a.warranties||[];a.warranties.push(w);a.warrantyExpiry=w.expiry;event(a,'Warranty added',w.provider+' · expires '+w.expiry);saveState();closeModal();refresh();toast('Warranty added')}})}
  function manageBusinesses(a){
    const list=[...(state.vendors||[]),...(state.businesses||[])].filter((x,i,arr)=>arr.findIndex(y=>y.id===x.id)===i);
    openModal({eyebrow:a.code+' · Suppliers',title:'Connect a business',submitText:'Save relationship',body:'<div class="ar72-check-list">'+list.map(v=>'<label><input type="checkbox" name="businessId" value="'+esc(v.id)+'" '+((a.businessIds||[]).includes(v.id)?'checked':'')+'><span><strong>'+esc(v.name)+'</strong><small>'+esc(v.contact||v.email||'Supplier / contractor')+'</small></span></label>').join('')+'</div>',onSubmit:fd=>{a.businessIds=fd.getAll('businessId').map(String);event(a,'Business relationships updated',a.businessIds.length+' businesses directly linked');saveState();closeModal();refresh();toast('Business relationships saved')}});
  }
  function editCustom(a){
    const entries=Object.entries(a.customFields||{}),text=entries.map(([k,v])=>k+': '+v).join('\n');
    openModal({eyebrow:a.code+' · Custom data',title:'Edit custom fields',submitText:'Save fields',body:'<div class="ar72-modal-intro"><strong>One field per line</strong><span>Use “Field name: value”. These fields stay attached to this asset.</span></div>'+field('fields','Custom fields',text,{type:'textarea',span:true}),onSubmit:fd=>{const values={};String(fd.get('fields')||'').split('\n').forEach(line=>{const i=line.indexOf(':');if(i>0){const k=line.slice(0,i).trim(),v=line.slice(i+1).trim();if(k)values[k]=v}});a.customFields=values;event(a,'Custom fields updated',Object.keys(values).length+' fields saved');saveState();closeModal();refresh();toast('Custom fields saved')}});
  }
  function printTag(a){
    const popup=window.open('','_blank','width=520,height=680');if(!popup){toast('Allow pop-ups to print the asset tag');return}
    popup.document.write('<!doctype html><html><head><title>'+esc(a.code)+' asset tag</title><style>body{font-family:Arial;display:grid;place-items:center;min-height:90vh}.tag{width:320px;border:3px solid #0a1d31;border-radius:18px;padding:28px;text-align:center}.tag h1{font-size:38px;margin:12px}.tag p{font-size:18px}.qr{display:grid;grid-template-columns:repeat(17,1fr);width:210px;height:210px;margin:22px auto;background:#fff;padding:10px;border:1px solid #aaa}.qr i.on{background:#071522}.tag small{display:block;color:#567}</style></head><body><div class="tag"><b>SAFIMAINTAIN</b><h1>'+esc(a.code)+'</h1><p>'+esc(a.name)+'</p><div class="qr">'+qr(a.code)+'</div><small>Scan to open the asset record</small></div><script>window.onload=()=>window.print()<\/script></body></html>');popup.document.close();
  }

  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-v72-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();ui.assetRecordTab=tab.dataset.v72Tab;refresh();return}
    const location=e.target.closest('[data-v72-location]');if(location){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(location.dataset.v72Location);if(a)editLocation(a);return}
    const warranty=e.target.closest('[data-v72-add-warranty]');if(warranty){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(warranty.dataset.v72AddWarranty);if(a)addWarranty(a);return}
    const business=e.target.closest('[data-v72-businesses]');if(business){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(business.dataset.v72Businesses);if(a)manageBusinesses(a);return}
    const custom=e.target.closest('[data-v72-custom]');if(custom){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(custom.dataset.v72Custom);if(a)editCustom(a);return}
    const tag=e.target.closest('[data-v72-print-tag]');if(tag){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(tag.dataset.v72PrintTag);if(a)printTag(a);return}
  },true);

  if(ui.route==='assets'&&ui.assetView==='record')refresh();
})();
