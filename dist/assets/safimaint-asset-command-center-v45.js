'use strict';

// SafiMaintain asset command center v45.
// Keeps the existing hierarchy browser and turns the opened asset into the operational home of the equipment.
(function(){
  const hierarchyRenderer=renderAssets;
  ui.assetRecordTab=ui.assetRecordTab||'general';

  function linkedWork(a){return (state.workOrders||[]).filter(w=>(w.assetIds||[]).includes(a.id)).sort((x,y)=>String(y.createdAt||'').localeCompare(String(x.createdAt||'')))}
  function control(w){return typeof window.safiWorkStatusControl==='function'?window.safiWorkStatusControl(w):(['Completed','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE')}
  function activeWork(a){return linkedWork(a).filter(w=>control(w)!=='CLOSED')}
  function closedWork(a){return linkedWork(a).filter(w=>control(w)==='CLOSED')}
  function meters(a){return (state.meters||[]).filter(m=>m.assetId===a.id)}
  function kids(a){return (state.assets||[]).filter(x=>String(x.parentId||'')===String(a.id))}
  function parent(a){return getAsset(a.parentId)}
  function evs(a){return (state.assetEvents||[]).filter(e=>e.assetId===a.id)}
  function dt(a){return (state.downtime||[]).filter(d=>d.assetId===a.id)}
  function bom(a){return (a.bom||[]).map(id=>getPart(id)).filter(Boolean)}
  function nextPM(a){return (state.scheduledMaintenance||[]).filter(p=>p.assetId===a.id&&p.status==='Active').sort((x,y)=>String(x.nextDue||'').localeCompare(String(y.nextDue||'')))[0]||null}
  function workLaborCost(w){return (w.labor||[]).reduce((n,x)=>n+Number(x.hours||0)*Number(getUser(x.userId)?.hourlyRate||0),0)}
  function workPartsCost(w){return (w.parts||[]).reduce((n,x)=>n+Number(x.actual||0)*Number(getPart(x.partId)?.unitCost||0),0)}
  function workMiscCost(w){return (w.miscCosts||[]).reduce((n,x)=>n+Number(x.amount||0),0)}
  function workCost(w){return workLaborCost(w)+workPartsCost(w)+workMiscCost(w)}
  function lifetimeCost(a){return linkedWork(a).reduce((n,w)=>n+workCost(w),0)}
  function downtimeHours(a){return dt(a).reduce((n,d)=>n+durationHours(d.startedAt,d.endedAt||iso()),0)}
  function lastCompleted(a){return closedWork(a).filter(w=>w.status==='Completed').sort((x,y)=>String(y.completedAt||y.closedAt||'').localeCompare(String(x.completedAt||x.closedAt||'')))[0]||null}
  function path(a){const out=[],seen=new Set();let cur=a;while(cur&&!seen.has(cur.id)){seen.add(cur.id);out.unshift(cur);cur=parent(cur)}return out}
  function icon(a){
    const t=String(a.type||'').toLowerCase();
    if(t.includes('tool'))return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14.5 5.5a4 4 0 0 0-5 5L4 16a1.4 1.4 0 0 0 0 2l2 2a1.4 1.4 0 0 0 2 0l5.5-5.5a4 4 0 0 0 5-5L16 12l-2-.6-.6-2 2.5-2.5a4 4 0 0 0-1.4-1.4Z"/></svg>';
    if(t.includes('facility')||t.includes('area')||t.includes('room'))return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V8l8-4 8 4v12M8 20v-5h8v5M8 9h2m4 0h2m-8 3h2m4 0h2"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 6V3m8 3V3M8 18v3m8-3v3M8 10h8m-8 4h5"/></svg>';
  }
  function qr(code){
    let seed=0,out='',n=13;for(const ch of String(code||'ASSET'))seed=(seed*31+ch.charCodeAt(0))>>>0;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){const finder=(r<4&&c<4)||(r<4&&c>8)||(r>8&&c<4);let on;if(finder){const rr=r>8?r-9:r,cc=c>8?c-9:c;on=rr===0||rr===3||cc===0||cc===3||(rr>0&&rr<3&&cc>0&&cc<3)}else{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;on=(seed&1)===1}out+='<i class="'+(on?'on':'')+'"></i>'}return out;
  }
  function grid(rows){return '<div class="v45-grid">'+rows.map(([l,v])=>'<div><small>'+esc(l)+'</small><strong>'+v+'</strong></div>').join('')+'</div>'}
  function empty(title,text){return '<div class="v45-empty"><strong>'+esc(title)+'</strong><span>'+esc(text)+'</span></div>'}
  function tabStrip(){
    const tabs=[['general','General'],['bom','Parts / BOM'],['meter','Metering / Events'],['personnel','Personnel'],['work','Work history'],['files','Files'],['financials','Financials'],['log','Asset log']];
    return '<nav class="v45-tabs">'+tabs.map(([id,label])=>'<button type="button" data-v45-tab="'+id+'" class="'+(ui.assetRecordTab===id?'active':'')+'">'+label+'</button>').join('')+'</nav>';
  }
  function healthStrip(a){
    const aw=activeWork(a),pm=nextPM(a),m=meters(a),last=lastCompleted(a),hours=downtimeHours(a);
    return '<div class="v45-health">'+
      '<div class="'+(a.condition==='Healthy'?'good':'alert')+'"><small>Condition</small><strong>'+esc(a.condition||'Unknown')+'</strong></div>'+
      '<div class="'+(aw.length?'alert':'good')+'"><small>Open work</small><strong>'+aw.length+'</strong></div>'+
      '<div><small>Next PM</small><strong>'+esc(pm?.nextDue||'Not scheduled')+'</strong></div>'+
      '<div><small>Meters</small><strong>'+m.length+'</strong></div>'+
      '<div><small>Total downtime</small><strong>'+hours.toFixed(1)+' h</strong></div>'+
      '<div><small>Last completed</small><strong>'+(last?dateFmt(last.completedAt||last.closedAt):'None')+'</strong></div>'+
    '</div>';
  }
  function header(a){
    const p=parent(a),sub=kids(a),owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId);
    return '<div class="v45-commandbar"><div><button class="button" type="button" data-v45-back>‹ Back</button><button class="button primary" type="button" data-edit-asset="'+esc(a.id)+'">Edit asset</button><button class="button" type="button" data-v45-print>▧ Print</button><button class="button" type="button" data-fx23-clone="'+esc(a.id)+'">Clone</button><button class="button" type="button" data-fx23-more="'+esc(a.id)+'">More ▾</button></div><div><button class="button primary" type="button" data-v45-new-work="'+esc(a.id)+'">＋ Work order</button><button class="button" type="button" data-v45-new-pm="'+esc(a.id)+'">＋ PM</button><button class="button" type="button" data-fx23-add-child="'+esc(a.id)+'">＋ Sub-asset</button><button class="button" type="button" data-v45-event="'+esc(a.id)+'">Record event</button><button class="button '+(a.operatingState==='Online'?'danger':'primary')+'" type="button" data-toggle-asset="'+esc(a.id)+'">'+(a.operatingState==='Online'?'Take offline':'Return online')+'</button></div></div>'+
      '<section class="v45-identity">'+
        '<aside class="v45-portrait"><div class="v45-iconbox">'+icon(a)+'</div><div><strong>'+esc(a.name)+'</strong><small>'+esc(a.code)+'</small><span class="v45-kind">'+esc(a.type)+'</span><div class="v45-path">'+path(a).map((x,i,arr)=>'<button type="button" data-v45-open="'+esc(x.id)+'">'+esc(x.name)+'</button>'+(i<arr.length-1?'<b>›</b>':'')).join('')+'</div></div></aside>'+
        '<main class="v45-main"><div class="v45-title"><div><small>'+esc(a.type)+'</small><h1>'+esc(a.name)+'</h1></div><span class="v45-status '+(a.operatingState==='Offline'?'offline':'')+'"><i></i>'+esc(a.operatingState||'Unknown')+'</span></div><div class="v45-desc">'+esc(a.description||'No asset description has been added yet.')+'</div><div class="v45-nameplate"><div><small>Code</small><strong>'+esc(a.code)+'</strong></div><div><small>Category</small><strong>'+esc(a.category||'—')+'</strong></div><div><small>Location</small><strong>'+esc(getAsset(a.locationId)?.name||a.location||'—')+'</strong></div><div><small>Parent asset</small><strong>'+esc(p?.name||'Top level')+'</strong></div><div><small>Sub-assets</small><strong>'+sub.length+'</strong></div><div><small>Responsible</small><strong>'+esc(owner?.name||group?.name||'Unassigned')+'</strong></div></div></main>'+
        '<aside class="v45-tag"><div class="fx23-qr">'+qr(a.code)+'</div><small>ASSET TAG</small><strong>'+esc(a.code)+'</strong></aside>'+
      '</section>'+healthStrip(a);
  }

  function general(a){
    const p=parent(a),sub=kids(a),owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId),pm=nextPM(a),last=lastCompleted(a);
    return '<section class="v45-section"><div class="v45-section-head"><strong>Asset master record</strong><span>Identity, hierarchy and maintenance context</span></div>'+
      grid([
        ['Asset code',esc(a.code)],['Asset type',esc(a.type)],['Category',esc(a.category||'—')],['Criticality',esc(a.criticality||'—')],
        ['Hierarchy parent',p?'<button data-v45-open="'+esc(p.id)+'">'+esc(p.name)+'</button>':'Top level'],['Located at',esc(getAsset(a.locationId)?.name||a.location||'—')],['Part of',esc(getAsset(a.partOfAssetId)?.name||'—')],['Condition',status(a.condition||'Unknown')],
        ['Manufacturer',esc(a.manufacturer||'—')],['Model',esc(a.model||'—')],['Serial number',esc(a.serial||'—')],['Commissioned',dateFmt(a.commissioned)],
        ['Responsible person',esc(owner?.name||'Unassigned')],['Responsible group',esc(group?.name||'Unassigned')],['Warranty expiry',dateFmt(a.warrantyExpiry)],['Next PM',esc(pm?.name||'Not scheduled')],
        ['Last completed work',last?'<button data-open-work="'+esc(last.id)+'">'+esc(last.id)+' · '+esc(last.title)+'</button>':'None'],['Open work',String(activeWork(a).length)],['Lifetime maintenance cost',money(lifetimeCost(a))],['Total downtime',downtimeHours(a).toFixed(1)+' h']
      ])+'</section>'+
      '<section class="v45-section"><div class="v45-section-head"><strong>Sub-assets</strong><div class="v45-section-actions"><span>'+sub.length+' directly below</span><button class="button small" type="button" data-fx23-add-child="'+esc(a.id)+'">＋ Add sub-asset</button></div></div><div class="v45-subassets">'+(sub.length?sub.map(k=>'<button type="button" data-v45-open="'+esc(k.id)+'"><span>'+icon(k)+'</span><div><strong>'+esc(k.name)+'</strong><small>'+esc(k.code)+' · '+esc(k.type)+'</small></div><b>›</b></button>').join(''):empty('No sub-assets','Add a maintainable component, equipment item or tool beneath this record.'))+'</div></section>';
  }

  function bomTab(a){
    const parts=bom(a),workIds=new Set(linkedWork(a).map(w=>w.id)),usage=(state.stockTransactions||[]).filter(t=>t.workOrderId&&workIds.has(t.workOrderId)&&Number(t.qty)<0);
    return '<section class="v45-section"><div class="v45-section-head"><strong>Parts / Bill of Materials</strong><div class="v45-section-actions"><span>'+parts.length+' linked</span><button class="button small primary" type="button" data-v45-add-bom="'+esc(a.id)+'">＋ Add BOM part</button></div></div>'+
      (parts.length?'<div class="v45-table-wrap"><table class="v45-table"><thead><tr><th>Part</th><th>BOM qty</th><th>On hand</th><th>Minimum</th><th>Unit cost</th><th>Vendor</th><th></th></tr></thead><tbody>'+parts.map(p=>'<tr><td><strong>'+esc(p.code)+' · '+esc(p.name)+'</strong><small>'+esc(p.category||'Part')+'</small></td><td>'+Number(a.bomQuantities?.[p.id]||1)+' '+esc(p.uom)+'</td><td>'+partOnHand(p)+' '+esc(p.uom)+'</td><td>'+Number(p.min||0)+'</td><td>'+money(Number(p.unitCost||0))+'</td><td>'+esc(getVendor(p.vendorId)?.name||'—')+'</td><td><button class="button small" data-open-part="'+esc(p.id)+'">Open</button> <button class="button small danger" data-v45-remove-bom="'+esc(a.id)+'|'+esc(p.id)+'">Remove</button></td></tr>').join('')+'</tbody></table></div>':empty('No BOM parts linked','Add the spare parts normally used on this asset.'))+
      '</section>'+
      '<section class="v45-section"><div class="v45-section-head"><strong>Recent parts usage</strong><span>'+usage.length+' issue transaction'+(usage.length===1?'':'s')+'</span></div>'+
      (usage.length?'<div class="v45-table-wrap"><table class="v45-table"><thead><tr><th>Date</th><th>Part</th><th>Quantity</th><th>Work order</th><th>Reference</th></tr></thead><tbody>'+usage.slice(0,15).map(t=>{const p=getPart(t.partId);return '<tr><td>'+dateTimeFmt(t.at)+'</td><td><strong>'+esc(p?.code||t.partId)+'</strong><small>'+esc(p?.name||'')+'</small></td><td>'+Math.abs(Number(t.qty))+' '+esc(p?.uom||'')+'</td><td><button class="button small" data-open-work="'+esc(t.workOrderId)+'">'+esc(t.workOrderId)+'</button></td><td>'+esc(t.reference||'—')+'</td></tr>'}).join('')+'</tbody></table></div>':empty('No parts consumed yet','Parts issued to linked work orders appear here automatically.'))+
      '</section>';
  }

  function meterBars(m){
    const vals=(m.readings||[]).slice(-8).map(r=>Number(r.value));if(!vals.length)return '';
    const min=Math.min(...vals),max=Math.max(...vals),span=Math.max(1,max-min);
    return vals.map(v=>'<i style="height:'+(15+((v-min)/span)*85)+'%"></i>').join('');
  }
  function meterTab(a){
    const ms=meters(a),plans=(state.scheduledMaintenance||[]).filter(p=>p.assetId===a.id&&p.status==='Active'),down=dt(a);
    return '<section class="v45-section"><div class="v45-section-head"><strong>Metering</strong><div class="v45-section-actions"><span>'+ms.length+' meter'+(ms.length===1?'':'s')+'</span><button class="button small primary" data-v45-add-meter="'+esc(a.id)+'">＋ New meter</button></div></div>'+
      (ms.length?'<div class="v45-meter-list">'+ms.map(m=>{const plan=plans.find(p=>p.triggerType==='Meter');return '<div class="v45-meter"><div class="v45-meter-top"><div><strong>'+esc(m.name)+'</strong><small>Last update '+dateTimeFmt(m.readings?.at(-1)?.at)+'</small></div><b>'+esc(m.current)+' '+esc(m.unit)+'</b></div><div class="v45-meter-spark">'+meterBars(m)+'</div><small>'+(plan?'Next maintenance threshold: '+esc(plan.nextDue):'No meter-triggered PM linked')+'</small><div class="v45-meter-actions"><button class="button small primary" data-v45-meter-reading="'+esc(m.id)+'">Add reading</button><button class="button small" data-route="pm">PM plans</button></div></div>'}).join('')+'</div>':empty('No meters linked','Create runtime, hours, cycles, starts or production meters for this asset.'))+
      '</section>'+
      '<section class="v45-section"><div class="v45-section-head"><strong>Downtime & asset events</strong><div class="v45-section-actions"><span>'+down.length+' downtime record'+(down.length===1?'':'s')+'</span><button class="button small" data-v45-event="'+esc(a.id)+'">Record event</button></div></div>'+
      ((down.length||evs(a).length)?'<div class="v45-event-list">'+[
        ...down.map(d=>({at:d.startedAt,title:(d.reasonCode||'Downtime')+' · '+(d.endedAt?'Ended':'Active'),detail:d.reason||'',right:d.endedAt?durationHours(d.startedAt,d.endedAt).toFixed(1)+' h':'Active'})),
        ...evs(a).map(e=>({at:e.at,title:e.type,detail:e.detail,right:''}))
      ].sort((x,y)=>String(y.at).localeCompare(String(x.at))).slice(0,15).map(e=>'<div class="v45-event"><i></i><div><strong>'+esc(e.title)+'</strong><small>'+esc(e.detail)+'</small></div><time>'+esc(e.right||dateTimeFmt(e.at))+'</time></div>').join('')+'</div>':empty('No events recorded','Downtime, state changes and custom asset events appear here.'))+
      '</section>';
  }

  function personnelTab(a){
    const u=getUser(a.ownerUserId),g=getGroup(a.ownerGroupId),assigned=[...new Set(activeWork(a).flatMap(w=>w.assigneeIds||[]))].map(getUser).filter(Boolean);
    return '<section class="v45-section"><div class="v45-section-head"><strong>Responsibility</strong><button class="button small primary" data-v45-assign="'+esc(a.id)+'">Change responsibility</button></div>'+
      '<div class="v45-person"><span class="v45-avatar">'+esc((u?.name||g?.name||'U').split(/\s+/).map(x=>x[0]).slice(0,2).join(''))+'</span><div><strong>'+esc(u?.name||'No responsible person')+'</strong><small>'+esc(getRole(u?.roleId)?.name||'No role')+(g?' · '+esc(g.name):'')+(u?.email?' · '+esc(u.email):'')+'</small></div><button class="button" data-v45-assign="'+esc(a.id)+'">Assign</button></div></section>'+
      '<section class="v45-section"><div class="v45-section-head"><strong>People on active work</strong><span>'+assigned.length+' technician'+(assigned.length===1?'':'s')+'</span></div>'+
      (assigned.length?'<div class="v45-table-wrap"><table class="v45-table"><thead><tr><th>Person</th><th>Role</th><th>Active work on asset</th><th>Labor rate</th></tr></thead><tbody>'+assigned.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong><small>'+esc(x.email||'')+'</small></td><td>'+esc(getRole(x.roleId)?.name||'—')+'</td><td>'+activeWork(a).filter(w=>(w.assigneeIds||[]).includes(x.id)).length+'</td><td>'+money(Number(x.hourlyRate||0))+'/h</td></tr>').join('')+'</tbody></table></div>':empty('Nobody assigned to active work','Technicians assigned to current work orders appear here.'))+
      '</section>';
  }

  function workTab(a){
    const work=linkedWork(a),active=activeWork(a),closed=closedWork(a),overdue=active.filter(w=>w.due&&new Date(w.due)<new Date(new Date().toDateString())).length;
    return '<section class="v45-section"><div class="v45-section-head"><strong>Work history</strong><div class="v45-section-actions"><span>'+active.length+' active · '+closed.length+' closed</span><button class="button small primary" data-v45-new-work="'+esc(a.id)+'">＋ New work order</button></div></div>'+
      '<div class="v45-metrics"><div class="v45-metric"><small>Active</small><strong>'+active.length+'</strong></div><div class="v45-metric"><small>Overdue</small><strong>'+overdue+'</strong></div><div class="v45-metric"><small>Completed</small><strong>'+closed.filter(w=>w.status==='Completed').length+'</strong></div><div class="v45-metric"><small>Lifetime work cost</small><strong>'+money(lifetimeCost(a))+'</strong></div></div>'+
      (work.length?'<div class="v45-table-wrap"><table class="v45-table"><thead><tr><th>Work order</th><th>Type</th><th>Priority</th><th>Status</th><th>Tasks</th><th>Labor</th><th>Cost</th><th>Due / completed</th></tr></thead><tbody>'+work.map(w=>{const done=(w.tasks||[]).filter(t=>t.status==='Done').length;return '<tr class="clickable" data-open-work="'+esc(w.id)+'"><td><strong>'+esc(w.id)+'</strong><small>'+esc(w.title)+'</small></td><td>'+esc(w.type)+'</td><td>'+status(w.priority)+'</td><td>'+status(w.status)+'</td><td>'+done+'/'+(w.tasks||[]).length+'</td><td>'+Number(w.actualHours||0).toFixed(2)+' h</td><td>'+money(workCost(w))+'</td><td>'+dateFmt(w.completedAt||w.closedAt||w.due)+'</td></tr>'}).join('')+'</tbody></table></div>':empty('No work orders linked','Create the first maintenance job directly from this asset record.'))+
      '</section>';
  }

  function filesTab(a){
    return '<section class="v45-section"><div class="v45-section-head"><strong>Files & documentation</strong><div class="v45-section-actions"><span>Manuals, photos, certificates and drawings</span><button class="button small primary" type="button" data-local-file-pick="'+esc(a.id)+'">＋ Add files</button><input class="file-input-hidden" type="file" multiple data-local-file-input="'+esc(a.id)+'" accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,text/csv,.doc,.docx,.xls,.xlsx"></div></div><div class="attachment-list" data-local-file-list="'+esc(a.id)+'">'+empty('No files yet','Add manuals, certificates, before/after photos or asset drawings.')+'</div></section>';
  }

  function financialTab(a){
    const work=linkedWork(a),labor=work.reduce((n,w)=>n+workLaborCost(w),0),parts=work.reduce((n,w)=>n+workPartsCost(w),0),misc=work.reduce((n,w)=>n+workMiscCost(w),0);
    return '<div class="v45-costs"><div class="v45-cost"><small>Labor cost</small><strong>'+money(labor)+'</strong></div><div class="v45-cost"><small>Parts cost</small><strong>'+money(parts)+'</strong></div><div class="v45-cost"><small>Misc. work cost</small><strong>'+money(misc)+'</strong></div><div class="v45-cost"><small>Lifetime maintenance</small><strong>'+money(labor+parts+misc)+'</strong></div></div>'+
      '<section class="v45-section"><div class="v45-section-head"><strong>Asset financial profile</strong><button class="button small primary" data-v45-edit-financial="'+esc(a.id)+'">Edit values</button></div>'+
      grid([['Purchase / capital cost',money(Number(a.purchaseCost||0))],['Replacement value',money(Number(a.replacementValue||0))],['Annual maintenance budget',money(Number(a.maintenanceBudget||0))],['Lifetime maintenance cost',money(labor+parts+misc)],['Work orders',String(work.length)],['Downtime hours',downtimeHours(a).toFixed(1)+' h'],['Cost basis','Labor + parts + miscellaneous WO costs'],['Warranty expiry',dateFmt(a.warrantyExpiry)]])+'</section>';
  }

  function logTab(a){
    const work=linkedWork(a),workIds=new Set(work.map(w=>w.id)),rows=[];
    evs(a).forEach(e=>rows.push({at:e.at,title:e.type,detail:e.detail,user:getUser(e.userId)?.name||e.userId||'System'}));
    dt(a).forEach(d=>{rows.push({at:d.startedAt,title:'Downtime started',detail:(d.reasonCode||'Downtime')+' · '+(d.reason||''),user:getUser(d.reportedBy)?.name||d.reportedBy||'System'});if(d.endedAt)rows.push({at:d.endedAt,title:'Returned to service',detail:(d.returnToServiceNote||'Downtime ended'),user:getUser(d.returnedBy)?.name||d.returnedBy||'System'})});
    work.forEach(w=>{rows.push({at:w.createdAt,title:'Work order created · '+w.id,detail:w.title,user:'System'});if(w.closedAt||w.completedAt)rows.push({at:w.closedAt||w.completedAt,title:'Work order closed · '+w.id,detail:w.completionNote||w.title,user:getUser(w.closedBy)?.name||'System'})});
    (state.stockTransactions||[]).filter(t=>t.workOrderId&&workIds.has(t.workOrderId)).forEach(t=>rows.push({at:t.at,title:'Part '+String(t.type||'movement').toLowerCase(),detail:(getPart(t.partId)?.code||t.partId)+' · '+Math.abs(Number(t.qty))+' '+(getPart(t.partId)?.uom||'')+' · '+t.workOrderId,user:getUser(t.userId)?.name||t.userId||'System'}));
    rows.sort((x,y)=>String(y.at||'').localeCompare(String(x.at||'')));
    return '<section class="v45-section"><div class="v45-section-head"><strong>Complete asset log</strong><span>'+rows.length+' chronological events</span></div><div class="v45-log">'+(rows.length?rows.map(r=>'<div class="v45-log-row"><i></i><div><strong>'+esc(r.title)+'</strong><small>'+esc(r.detail||'')+' · '+esc(r.user||'System')+'</small></div><time>'+dateTimeFmt(r.at)+'</time></div>').join(''):empty('No asset history yet','Work, downtime, parts usage, moves and state changes will build this timeline automatically.'))+'</div></section>';
  }

  function body(a){
    return ({general,bom:bomTab,meter:meterTab,personnel:personnelTab,work:workTab,files:filesTab,financials:financialTab,log:logTab}[ui.assetRecordTab]||general)(a);
  }
  function record(a){
    if(!a)return empty('Asset not found','Return to the hierarchy and select another asset.');
    return '<div class="v45-record">'+header(a)+tabStrip()+'<div class="v45-body">'+body(a)+'</div></div>';
  }
  function renderAssetsV45(){
    if(ui.assetView==='record'){
      const a=getAsset(ui.selectedAsset);
      return record(a);
    }
    return hierarchyRenderer();
  }
  renderAssets=renderAssetsV45;window.renderAssets=renderAssetsV45;

  function refresh(){render();setTimeout(()=>window.SafiFileUI?.refresh?.(true),0)}
  function showAssetWork(a){
    const users=(state.users||[]).filter(u=>u.active),groups=state.groups||[],taskGroups=state.taskGroups||[];
    openModal({eyebrow:a.code+' · '+a.name,title:'Create work order',submitText:'Create work order',body:'<div class="form-grid">'+
      field('title','Work summary','',{required:true,span:true})+
      field('type','Maintenance type','Corrective',{type:'select',options:['Corrective','Preventive','Inspection','Safety','Damage','Electrical','Upgrade','Project','Meter Reading'].map(x=>({value:x,label:x}))})+
      field('priority','Priority',a.criticality==='A'?'High':'Medium',{type:'select',options:['Low','Medium','High','Critical'].map(x=>({value:x,label:x}))})+
      field('assigneeId','Assigned technician',a.ownerUserId||'',{type:'select',options:[{value:'',label:'Unassigned'},...users.map(u=>({value:u.id,label:u.name}))]})+
      field('assigneeGroupId','Assigned group',a.ownerGroupId||'',{type:'select',options:[{value:'',label:'No group'},...groups.map(g=>({value:g.id,label:g.name}))]})+
      field('due','Suggested completion date',day(2),{type:'date',required:true})+
      field('estimateHours','Estimated labor (hours)','1',{type:'number',min:0,step:'.25'})+
      field('taskGroupId','Task group / SOP','',{type:'select',options:[{value:'',label:'No task group'},...taskGroups.map(g=>({value:g.id,label:g.name}))]})+
      field('instructions','Instructions / safety / acceptance criteria','',{type:'textarea',span:true})+
      '</div>',onSubmit:fd=>{
        const group=taskGroups.find(g=>g.id===String(fd.get('taskGroupId')||'')),assigneeId=String(fd.get('assigneeId')||'');
        const w={id:uid('WO'),title:String(fd.get('title')),assetIds:[a.id],type:String(fd.get('type')),priority:String(fd.get('priority')),status:assigneeId?'Assigned':'Open',assigneeIds:assigneeId?[assigneeId]:[],assigneeGroupId:String(fd.get('assigneeGroupId')||'')||null,due:String(fd.get('due')),estimateHours:Number(fd.get('estimateHours')||0),actualHours:0,source:'Asset record',instructions:String(fd.get('instructions')||''),tasks:group?group.tasks.map(t=>({id:uid('T'),text:t.text,type:t.type||'General',status:'Todo',assigneeId:t.assigneeId||null,result:null,resultNote:'',completedAt:null})):[],parts:[],labor:[],miscCosts:[],failureCodes:{problem:'Not selected',cause:'Not selected',action:'Not selected'},failureNote:'',completionNote:'',createdAt:iso(),completedAt:null,closedAt:null,closedBy:null,history:[{at:iso(),text:'Created from asset '+a.code+' by '+(currentUser()?.name||'User')}]};
        state.workOrders.unshift(w);state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Work order created',at:iso(),userId:CURRENT_USER,detail:w.id+' · '+w.title});addAudit('WORK_ORDER_CREATED',w.id,w.title+' · '+a.code);dispatchEvent('Work order assigned',w.id+' assigned',w.title,{assigneeIds:w.assigneeIds,assetId:a.id,relatedId:w.id});saveState();closeModal();ui.assetRecordTab='work';refresh();toast(w.id+' created');
      }});
  }
  function showPM(a){
    const groups=state.groups||[],taskGroups=state.taskGroups||[];
    openModal({eyebrow:a.code+' · '+a.name,title:'Create scheduled maintenance',submitText:'Create PM',body:'<div class="form-grid">'+
      field('name','Plan name',a.name+' preventive maintenance',{required:true,span:true})+
      field('triggerType','Trigger type','Time',{type:'select',options:['Time','Meter','Event'].map(x=>({value:x,label:x}))})+
      field('trigger','Trigger / interval','Every 30 days',{required:true})+
      field('nextDue','Next due / threshold',day(30),{required:true})+
      field('scheduleMode','Schedule mode','Fixed',{type:'select',options:[{value:'Fixed',label:'Fixed — planned cadence'},{value:'Floating',label:'Floating — after completion'}]})+
      field('taskGroupId','Task group / SOP','',{type:'select',options:[{value:'',label:'No task group'},...taskGroups.map(g=>({value:g.id,label:g.name}))]})+
      field('assigneeGroupId','Assigned group',a.ownerGroupId||'',{type:'select',options:[{value:'',label:'No default group'},...groups.map(g=>({value:g.id,label:g.name}))]})+
      field('tasks','Tasks (one per line)','',{type:'textarea',span:true})+'</div>',onSubmit:fd=>{
        const gid=String(fd.get('taskGroupId')||''),group=taskGroups.find(g=>g.id===gid);
        const pm={id:uid('PM'),name:String(fd.get('name')),assetId:a.id,status:'Active',triggerType:String(fd.get('triggerType')),trigger:String(fd.get('trigger')),nextDue:String(fd.get('nextDue')),scheduleMode:String(fd.get('scheduleMode')||'Fixed'),taskGroupId:gid||null,assigneeGroupId:String(fd.get('assigneeGroupId')||'')||null,lastGenerated:null,taskTemplate:group?group.tasks.map(t=>t.text):String(fd.get('tasks')||'').split('\n').map(x=>x.trim()).filter(Boolean),requiredParts:[]};
        state.scheduledMaintenance.unshift(pm);state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Scheduled maintenance created',at:iso(),userId:CURRENT_USER,detail:pm.id+' · '+pm.name});addAudit('PM_PLAN_CREATED',pm.id,pm.name+' · '+a.code);saveState();closeModal();refresh();toast(pm.id+' created');
      }});
  }

  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-v45-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();ui.assetRecordTab=tab.dataset.v45Tab;refresh();return}
    const back=e.target.closest('[data-v45-back]');if(back){e.preventDefault();e.stopImmediatePropagation();ui.assetView='hierarchy';render();return}
    const open=e.target.closest('[data-v45-open]');if(open){e.preventDefault();e.stopImmediatePropagation();ui.selectedAsset=open.dataset.v45Open;ui.assetView='record';ui.assetRecordTab='general';refresh();return}
    if(e.target.closest('[data-v45-print]')){e.preventDefault();e.stopImmediatePropagation();window.print();return}
    const nw=e.target.closest('[data-v45-new-work]');if(nw){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(nw.dataset.v45NewWork);if(a)showAssetWork(a);return}
    const npm=e.target.closest('[data-v45-new-pm]');if(npm){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(npm.dataset.v45NewPm);if(a)showPM(a);return}
    const addBom=e.target.closest('[data-v45-add-bom]');if(addBom){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(addBom.dataset.v45AddBom);if(!a)return;const available=state.parts.filter(p=>!(a.bom||[]).includes(p.id));openModal({eyebrow:a.code+' · BOM',title:'Add part to asset',submitText:'Add to BOM',body:'<div class="form-grid">'+field('partId','Part','',{type:'select',options:available.map(p=>({value:p.id,label:p.code+' · '+p.name+' · '+partOnHand(p)+' '+p.uom+' on hand'}))})+field('qty','Standard quantity','1',{type:'number',min:.01,step:'.01'})+'</div>',onSubmit:fd=>{const pid=String(fd.get('partId')||'');if(!pid){toast('Choose a part');return}a.bom=a.bom||[];if(!a.bom.includes(pid))a.bom.push(pid);a.bomQuantities=a.bomQuantities||{};a.bomQuantities[pid]=Number(fd.get('qty')||1);state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'BOM updated',at:iso(),userId:CURRENT_USER,detail:(getPart(pid)?.code||pid)+' added to BOM'});addAudit('ASSET_BOM_UPDATED',a.id,(getPart(pid)?.code||pid)+' added');saveState();closeModal();refresh();toast('BOM updated')}});return}
    const remBom=e.target.closest('[data-v45-remove-bom]');if(remBom){e.preventDefault();e.stopImmediatePropagation();const [aid,pid]=remBom.dataset.v45RemoveBom.split('|'),a=getAsset(aid);if(!a)return;if(!confirm('Remove '+(getPart(pid)?.code||pid)+' from this asset BOM?'))return;a.bom=(a.bom||[]).filter(x=>x!==pid);if(a.bomQuantities)delete a.bomQuantities[pid];state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'BOM updated',at:iso(),userId:CURRENT_USER,detail:(getPart(pid)?.code||pid)+' removed from BOM'});saveState();refresh();return}
    const addMeter=e.target.closest('[data-v45-add-meter]');if(addMeter){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(addMeter.dataset.v45AddMeter);if(!a)return;openModal({eyebrow:a.code+' · Metering',title:'Create meter',submitText:'Create meter',body:'<div class="form-grid">'+field('name','Meter name','Run hours',{required:true})+field('unit','Unit','h',{required:true})+field('current','Current reading','0',{type:'number',min:0,step:'.01'})+'</div>',onSubmit:fd=>{const value=Number(fd.get('current')||0),m={id:uid('MTR'),assetId:a.id,name:String(fd.get('name')),unit:String(fd.get('unit')),current:value,readings:[{value,at:iso(),userId:CURRENT_USER,note:'Initial reading'}]};state.meters.push(m);state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Meter created',at:iso(),userId:CURRENT_USER,detail:m.name+' · '+m.current+' '+m.unit});addAudit('METER_CREATED',m.id,a.code+' · '+m.name);saveState();closeModal();refresh();toast('Meter created')}});return}
    const reading=e.target.closest('[data-v45-meter-reading]');if(reading){e.preventDefault();e.stopImmediatePropagation();const m=state.meters.find(x=>x.id===reading.dataset.v45MeterReading),a=m&&getAsset(m.assetId);if(!m||!a)return;openModal({eyebrow:a.code+' · '+m.name,title:'Add meter reading',submitText:'Post reading',body:'<div class="form-grid">'+field('value','New reading',String(m.current),{type:'number',required:true,min:0,step:'.01'})+field('note','Reading note','',{span:true})+'</div>',onSubmit:fd=>{const value=Number(fd.get('value'));if(!Number.isFinite(value)||value<Number(m.current)){toast('Reading must be a valid value not lower than the current reading');return}m.current=value;m.readings.push({value,at:iso(),userId:CURRENT_USER,note:String(fd.get('note')||'')});state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Meter reading',at:iso(),userId:CURRENT_USER,detail:m.name+' = '+value+' '+m.unit});(state.scheduledMaintenance||[]).filter(p=>p.assetId===a.id&&p.status==='Active'&&p.triggerType==='Meter').forEach(pm=>{const threshold=Number(String(pm.nextDue||'').replace(/[^0-9.]/g,''));if(Number.isFinite(threshold)&&value>=threshold&&!state.workOrders.some(w=>w.source===pm.id&&control(w)!=='CLOSED')){try{generatePM(pm.id)}catch(_){}}});addAudit('METER_READING',m.id,value+' '+m.unit);saveState();closeModal();refresh();toast('Reading posted')}});return}
    const assign=e.target.closest('[data-v45-assign]');if(assign){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(assign.dataset.v45Assign);if(!a)return;openModal({eyebrow:a.code+' · Responsibility',title:'Assign asset responsibility',submitText:'Save assignment',body:'<div class="form-grid">'+field('ownerUserId','Responsible person',a.ownerUserId||'',{type:'select',options:[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))]})+field('ownerGroupId','Responsible group',a.ownerGroupId||'',{type:'select',options:[{value:'',label:'Unassigned'},...state.groups.map(g=>({value:g.id,label:g.name}))]})+'</div>',onSubmit:fd=>{a.ownerUserId=String(fd.get('ownerUserId')||'');a.ownerGroupId=String(fd.get('ownerGroupId')||'');state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Responsibility changed',at:iso(),userId:CURRENT_USER,detail:'Responsible: '+(getUser(a.ownerUserId)?.name||getGroup(a.ownerGroupId)?.name||'Unassigned')});addAudit('ASSET_RESPONSIBILITY_CHANGED',a.id,a.ownerUserId||a.ownerGroupId||'Unassigned');saveState();closeModal();refresh();toast('Responsibility saved')}});return}
    const event=e.target.closest('[data-v45-event]');if(event){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(event.dataset.v45Event);if(!a)return;openModal({eyebrow:a.code+' · Asset event',title:'Record asset event',submitText:'Record event',body:'<div class="form-grid">'+field('type','Event type','Inspection note',{type:'select',options:['Inspection note','Observation','Condition change','Move note','Service note','Safety note','Other'].map(x=>({value:x,label:x}))})+field('detail','Event detail','',{type:'textarea',required:true,span:true})+'</div>',onSubmit:fd=>{const ev={id:uid('AE'),assetId:a.id,type:String(fd.get('type')),at:iso(),userId:CURRENT_USER,detail:String(fd.get('detail'))};state.assetEvents.unshift(ev);addAudit('ASSET_EVENT',a.id,ev.type+' · '+ev.detail);saveState();closeModal();refresh();toast('Asset event recorded')}});return}
    const fin=e.target.closest('[data-v45-edit-financial]');if(fin){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(fin.dataset.v45EditFinancial);if(!a)return;openModal({eyebrow:a.code+' · Financials',title:'Asset financial profile',submitText:'Save financials',body:'<div class="form-grid">'+field('purchaseCost','Purchase / capital cost',String(a.purchaseCost||0),{type:'number',min:0,step:'.01'})+field('replacementValue','Replacement value',String(a.replacementValue||0),{type:'number',min:0,step:'.01'})+field('maintenanceBudget','Annual maintenance budget',String(a.maintenanceBudget||0),{type:'number',min:0,step:'.01'})+'</div>',onSubmit:fd=>{a.purchaseCost=Number(fd.get('purchaseCost')||0);a.replacementValue=Number(fd.get('replacementValue')||0);a.maintenanceBudget=Number(fd.get('maintenanceBudget')||0);state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Financial profile updated',at:iso(),userId:CURRENT_USER,detail:'Asset financial values updated'});saveState();closeModal();refresh();toast('Financial profile saved')}});return}
  },true);

  if(ui.route==='assets'&&ui.assetView==='record')render();
})();