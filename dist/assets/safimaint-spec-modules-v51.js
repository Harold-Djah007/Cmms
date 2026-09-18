'use strict';

// SafiMaintain specification modules v51.
// Adds the functional pages that were missing from the Fiix-style operating map.
(function(){
  ensureSpecState();

  const customRoutes=new Map();
  const reg=(route,fn)=>customRoutes.set(route,fn);
  const control=w=>typeof window.safiWorkStatusControl==='function'?window.safiWorkStatusControl(w):(['Completed','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE');
  const site=()=>safiActiveSite?.();
  const siteAssets=()=>state.assets.filter(a=>a.type!=='Site'&&safiSiteAllowed(a));
  const costOfWork=w=>(w.labor||[]).reduce((n,x)=>n+Number(x.hours||0)*Number(getUser(x.userId)?.hourlyRate||0),0)+(w.parts||[]).reduce((n,x)=>n+Number(x.actual||0)*Number(getPart(x.partId)?.unitCost||0),0)+(w.miscCosts||[]).reduce((n,x)=>n+Number(x.amount||0),0);
  const pill=(text,kind='')=>'<span class="v50-pill '+kind+'">'+esc(text)+'</span>';
  const empty=(a,b)=>'<div class="v50-empty"><strong>'+esc(a)+'</strong><span>'+esc(b)+'</span></div>';
  const genericAssetList=(title,subtitle,filter)=>()=>{
    const rows=siteAssets().filter(filter);
    return '<div class="v50-page">'+pageHead('Asset management',title,subtitle,'<button class="button" data-route="assets">Hierarchy</button><button class="button primary" data-action="add-asset">＋ Add asset</button>')+
      '<div class="v50-toolbar"><input data-v51-asset-search placeholder="Search code, name, location…" value="'+esc(ui.v51AssetSearch||'')+'"><span class="grow"></span><span class="v50-pill">'+rows.length+' records</span></div>'+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Code / asset</th><th>Category</th><th>Parent</th><th>Location</th><th>Criticality</th><th>Open work</th><th>Next PM</th><th>State</th></tr></thead><tbody>'+
      rows.filter(a=>!ui.v51AssetSearch||[a.code,a.name,a.location,a.category].join(' ').toLowerCase().includes(ui.v51AssetSearch.toLowerCase())).map(a=>{const p=getAsset(a.parentId),ow=state.workOrders.filter(w=>(w.assetIds||[]).includes(a.id)&&control(w)!=='CLOSED').length,pm=state.scheduledMaintenance.filter(x=>(x.assetIds||[x.assetId]).includes(a.id)&&!x.paused).sort((x,y)=>String(x.nextDue||'').localeCompare(String(y.nextDue||'')))[0];return '<tr class="clickable" data-v51-open-asset="'+esc(a.id)+'"><td><strong>'+esc(a.code)+' · '+esc(a.name)+'</strong><small>'+esc(a.type)+'</small></td><td>'+esc(a.category||'—')+'</td><td>'+esc(p?.name||'Top level')+'</td><td>'+esc(a.location||getAsset(a.locationId)?.name||'—')+'</td><td>'+esc(a.criticality||'—')+'</td><td>'+ow+'</td><td>'+esc(pm?.nextDue||'—')+'</td><td><span class="v51-asset-status '+(a.operatingState==='Offline'?'offline':'')+'"><i></i>'+esc(a.operatingState||'Unknown')+'</span></td></tr>'}).join('')+
      '</tbody></table></div></div>';
  };
  reg('asset-register',genericAssetList('Asset register','Search and filter the maintainable equipment and locations in the current site.',()=>true));
  reg('equipment',genericAssetList('Equipment','Maintainable equipment, machines and subassemblies.',a=>['Equipment','Subassembly','Machine'].includes(a.type)));
  reg('facilities',genericAssetList('Facilities','Facilities, buildings, production areas and rooms.',a=>['Facility','Production area','Area','Room','Building'].includes(a.type)));
  reg('tools',genericAssetList('Tools','Durable maintenance tools and field equipment.',a=>a.type==='Tool'));

  reg('rotating-assets',()=>{
    const rows=siteAssets().filter(a=>a.rotating);
    return '<div class="v50-page">'+pageHead('Asset management','Rotating assets','Track portable equipment, temporary moves, home locations and returns.','<button class="button primary" data-v51-new-move>＋ Record move</button>')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Asset</th><th>Home / current location</th><th>Current move</th><th>Moved</th><th>Expected return</th><th></th></tr></thead><tbody>'+
      rows.map(a=>{const mv=state.assetMoves.find(m=>m.assetId===a.id&&!m.returnedAt);return '<tr><td><strong>'+esc(a.code)+' · '+esc(a.name)+'</strong><small>'+esc(a.type)+'</small></td><td>'+esc(mv?.toLocation||a.location||'—')+'<small>Home: '+esc(mv?.fromLocation||a.location||'—')+'</small></td><td>'+(mv?pill(mv.moveType,'warn'):pill('At home','good'))+'</td><td>'+dateFmt(mv?.movedAt)+'</td><td>'+dateFmt(mv?.expectedReturn)+'</td><td>'+(mv?'<button class="button small primary" data-v51-return-move="'+esc(mv.id)+'">Return</button>':'<button class="button small" data-v51-move-asset="'+esc(a.id)+'">Move</button>')+'</td></tr>'}).join('')+
      '</tbody></table></div></div>';
  });

  reg('asset-events',()=>{
    const rows=state.assetEvents.filter(e=>safiSiteAllowed(e)).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
    return '<div class="v50-page">'+pageHead('Asset management','Asset events','Operational occurrences that can create maintenance work and become reliability history.','<button class="button primary" data-v51-new-event>＋ Record event</button>')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Date</th><th>Asset</th><th>Event</th><th>Detail</th><th>Related work</th><th>Recorded by</th></tr></thead><tbody>'+
      rows.map(e=>'<tr><td>'+dateTimeFmt(e.at)+'</td><td><strong>'+esc(getAsset(e.assetId)?.code||e.assetId)+'</strong><small>'+esc(getAsset(e.assetId)?.name||'')+'</small></td><td>'+esc(e.type)+'</td><td>'+esc(e.detail||'—')+'</td><td>'+(e.workOrderId?'<button class="button small" data-open-work="'+esc(e.workOrderId)+'">'+esc(e.workOrderId)+'</button>':'—')+'</td><td>'+esc(getUser(e.userId)?.name||e.userId||'System')+'</td></tr>').join('')+
      '</tbody></table></div></div>';
  });

  reg('task-groups',()=>{
    const rows=state.taskGroups.filter(g=>g.status!=='Archived');
    return '<div class="v50-page">'+pageHead('Maintenance','Task groups / SOPs','Reusable procedures that can be attached to work orders and scheduled maintenance.','<button class="button primary" data-v51-new-task-group>＋ Task group</button>')+
      '<div class="v51-module-cards">'+(rows.length?rows.map(g=>'<article class="v51-module-card"><strong>'+esc(g.name)+'</strong><p>'+esc(g.description||'Reusable maintenance procedure')+'</p><p>'+g.tasks.length+' task'+(g.tasks.length===1?'':'s')+'</p><div class="v50-command-actions"><button class="button small" data-v51-edit-task-group="'+esc(g.id)+'">Open</button><button class="button small" data-v51-duplicate-task-group="'+esc(g.id)+'">Duplicate</button><button class="button small danger" data-v51-archive-task-group="'+esc(g.id)+'">Archive</button></div></article>').join(''):empty('No task groups yet','Create reusable SOPs for recurring work.'))+'</div></div>';
  });

  reg('projects',()=>{
    const rows=state.projects.filter(p=>p.siteId===site()?.id||!p.siteId),woFor=p=>state.workOrders.filter(w=>w.projectId===p.id);
    return '<div class="v50-page">'+pageHead('Maintenance','Projects','Group related work orders and planned maintenance into overhaul, shutdown or improvement programmes.','<button class="button primary" data-v51-new-project>＋ Project</button>')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Project</th><th>Status</th><th>Dates</th><th>Work</th><th>Budget</th><th>Actual maintenance cost</th><th></th></tr></thead><tbody>'+
      rows.map(p=>{const ws=woFor(p),actual=ws.reduce((n,w)=>n+costOfWork(w),0);return '<tr><td><strong>'+esc(p.name)+'</strong><small>'+esc(p.id)+' · '+esc(p.description||'')+'</small></td><td>'+status(p.status)+'</td><td>'+dateFmt(p.startDate)+' → '+dateFmt(p.endDate)+'</td><td>'+ws.length+' WOs<small>'+ws.filter(w=>control(w)!=='CLOSED').length+' active</small></td><td>'+money(Number(p.budget||0))+'</td><td>'+money(actual)+'</td><td><button class="button small" data-v51-project-work="'+esc(p.id)+'">Add work</button></td></tr>'}).join('')+
      '</tbody></table></div></div>';
  });

  reg('failure-analysis',()=>{
    const work=state.workOrders.filter(w=>w.type==='Corrective'||w.failureCodes),pairs={};
    work.forEach(w=>{const p=w.failureCodes?.problem||'Not recorded',c=w.failureCodes?.cause||'Not recorded',a=w.failureCodes?.action||'Not recorded',key=[p,c,a].join('|');pairs[key]=pairs[key]||{p,c,a,count:0,cost:0,assets:new Set()};pairs[key].count++;pairs[key].cost+=costOfWork(w);(w.assetIds||[]).forEach(x=>pairs[key].assets.add(x))});
    const rows=Object.values(pairs).sort((a,b)=>b.count-a.count);
    return '<div class="v50-page">'+pageHead('Reliability','Failure analysis','Turn corrective maintenance into structured Problem → Cause → Action knowledge.')+
      '<div class="v50-kpis"><button class="v50-kpi"><small>Corrective records</small><strong>'+work.length+'</strong><span>Failure-capable work orders</span></button><button class="v50-kpi"><small>Structured RCA</small><strong>'+work.filter(w=>w.failureCodes?.problem&&w.failureCodes.problem!=='Not selected').length+'</strong><span>With problem code</span></button><button class="v50-kpi"><small>Repeated patterns</small><strong>'+rows.filter(r=>r.count>1).length+'</strong><span>Recurring PCA combinations</span></button></div>'+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Problem</th><th>Cause</th><th>Action</th><th>Occurrences</th><th>Assets</th><th>Cost</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><strong>'+esc(r.p)+'</strong></td><td>'+esc(r.c)+'</td><td>'+esc(r.a)+'</td><td>'+r.count+'</td><td>'+r.assets.size+'</td><td>'+money(r.cost)+'</td></tr>').join('')+'</tbody></table></div></div>';
  });

  reg('work-insights',()=>{
    const active=state.workOrders.filter(w=>control(w)==='ACTIVE'&&safiSiteAllowed(w)),today=new Date(new Date().toDateString());
    const insights=[];
    active.forEach(w=>{const days=w.due?Math.floor((new Date(w.due)-today)/86400000):null,variance=Number(w.actualHours||0)-Number(w.estimateHours||0),partsRisk=(w.parts||[]).some(x=>partOnHand(getPart(x.partId)||{locations:[]})<Math.max(0,Number(x.planned||0)-Number(x.actual||0)));let score=0,reasons=[];if(days!==null&&days<0){score+=35;reasons.push(Math.abs(days)+'d overdue')}if(['Critical','Emergency','Highest'].includes(w.priority)){score+=30;reasons.push(w.priority+' priority')}if(partsRisk){score+=20;reasons.push('parts at risk')}if(variance>0){score+=15;reasons.push('labor over estimate')}if(score)insights.push({w,score:Math.min(100,score),reasons})});
    insights.sort((a,b)=>b.score-a.score);
    return '<div class="v50-page">'+pageHead('Analytics','Work order insights','Rule-based active-work risk signals using due dates, priority, labor variance and parts readiness.')+
      '<div class="v50-card"><div class="v50-card-head"><div><h2>Active work risk</h2><p>Highest operational risk first</p></div></div><div>'+ (insights.length?insights.map(x=>'<button class="v50-risk" data-open-work="'+esc(x.w.id)+'"><b>'+x.score+'/100</b><div><strong>'+esc(x.w.id)+' · '+esc(x.w.title)+'</strong><small>'+esc(x.reasons.join(' · '))+'</small></div><span class="v50-pill '+(x.score>=60?'bad':'warn')+'">'+esc(x.w.status)+'</span></button>').join(''):empty('No active risk flags','Current active work has no overdue, critical, labor-overrun or parts-risk signals.'))+'</div></div></div>';
  });

  reg('stock-locations',()=>{
    const rows=[];state.parts.forEach(p=>(p.locations||[]).forEach(l=>{const s=getStore(l.storeId);if(!site()||s?.siteId===site().id)rows.push({p,l,s})}));
    return '<div class="v50-page">'+pageHead('Parts & inventory','Stock locations','Inventory by store, aisle/bin and part with minimum/maximum context.','<button class="button" data-action="global-stock-move">Transfer stock</button>')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Store / bin</th><th>Part</th><th>On hand</th><th>Min / max</th><th>Value</th><th>State</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><strong>'+esc(x.s?.name||x.l.storeId)+'</strong><small>'+esc(x.l.bin||'No bin')+'</small></td><td><strong>'+esc(x.p.code)+' · '+esc(x.p.name)+'</strong></td><td>'+Number(x.l.onHand||0)+' '+esc(x.p.uom)+'</td><td>'+Number(x.p.min||0)+' / '+Number(x.p.max||0)+'</td><td>'+money(Number(x.l.onHand||0)*Number(x.p.unitCost||0))+'</td><td>'+(Number(x.l.onHand||0)<Number(x.p.min||0)?pill('Low','bad'):pill('OK','good'))+'</td></tr>').join('')+'</tbody></table></div></div>';
  });

  reg('bom-groups',()=>'<div class="v50-page">'+pageHead('Parts & inventory','BOM groups','Reusable spare-part sets that can be applied to similar equipment.','<button class="button primary" data-v51-new-bom-group>＋ BOM group</button>')+
    '<div class="v51-module-cards">'+(state.bomGroups.length?state.bomGroups.map(g=>'<article class="v51-module-card"><strong>'+esc(g.name)+'</strong><p>'+esc(g.description||'Reusable equipment kit')+'</p><p>'+g.parts.length+' parts · '+(g.assetIds||[]).length+' assets</p><div class="v50-command-actions"><button class="button small" data-v51-apply-bom="'+esc(g.id)+'">Apply to asset</button><button class="button small danger" data-v51-delete-bom="'+esc(g.id)+'">Delete</button></div></article>').join(''):empty('No BOM groups','Create reusable spare-part kits for repeated equipment families.'))+'</div></div>');

  reg('parts-forecaster',()=>{
    const demand={};const add=(pid,q)=>demand[pid]=(demand[pid]||0)+Number(q||0);
    state.workOrders.filter(w=>control(w)==='ACTIVE').forEach(w=>(w.parts||[]).forEach(x=>add(x.partId,Math.max(0,Number(x.planned||0)-Number(x.actual||0)))));
    state.scheduledMaintenance.filter(pm=>!pm.paused&&pm.status!=='Paused').forEach(pm=>(pm.requiredParts||[]).forEach(x=>add(x.partId,x.qty)));
    const rows=state.parts.map(p=>{const on=partOnHand(p),future=demand[p.id]||0,reserve=Number(p.min||0),buy=Math.max(0,Math.ceil(future+reserve-on)),risk=buy>0?'High':future>on?'Medium':'Low';return{p,on,future,reserve,buy,risk}}).sort((a,b)=>b.buy-a.buy);
    return '<div class="v50-page">'+pageHead('Parts & inventory','Parts forecaster','Projected demand from open work and scheduled maintenance compared with stock and minimum reserve.')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Part</th><th>Current</th><th>Future planned need</th><th>Minimum reserve</th><th>Risk</th><th>Suggested buy</th><th></th></tr></thead><tbody>'+rows.map(x=>'<tr><td><strong>'+esc(x.p.code)+' · '+esc(x.p.name)+'</strong><small>'+esc(x.p.category||'')+'</small></td><td>'+x.on+' '+esc(x.p.uom)+'</td><td>'+x.future+' '+esc(x.p.uom)+'</td><td>'+x.reserve+'</td><td>'+pill(x.risk,x.risk==='High'?'bad':x.risk==='Medium'?'warn':'good')+'</td><td><strong>'+x.buy+' '+esc(x.p.uom)+'</strong></td><td>'+(x.buy?'<button class="button small primary" data-v51-buy-part="'+esc(x.p.id)+'|'+x.buy+'">Purchase request</button>':'—')+'</td></tr>').join('')+'</tbody></table></div></div>';
  });

  reg('businesses',()=>'<div class="v50-page">'+pageHead('Parts & inventory','Businesses / suppliers','Vendors, manufacturers, contractors, service providers and customers connected to maintenance records.','<button class="button primary" data-v47-new-business>＋ Business</button>')+
    '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Business</th><th>Type</th><th>Group</th><th>Contact</th><th>Phone / email</th><th>Linked assets</th><th>Linked parts</th></tr></thead><tbody>'+state.businesses.map(b=>'<tr><td><strong>'+esc(b.name)+'</strong><small>'+esc(b.id)+'</small></td><td>'+esc(b.type||'Business')+'</td><td>'+esc(b.group||'—')+'</td><td>'+esc(b.contact||'—')+'</td><td>'+esc(b.phone||'')+'<small>'+esc(b.email||'')+'</small></td><td>'+state.assets.filter(a=>(a.businessLinks||[]).some(l=>l.businessId===b.id)).length+'</td><td>'+state.parts.filter(p=>p.vendorId===b.sourceVendorId||p.businessId===b.id).length+'</td></tr>').join('')+'</tbody></table></div></div>');

  reg('purchase-requests',()=>'<div class="v50-page">'+pageHead('Purchasing','Purchase requests','Maintenance and inventory demand waiting for sourcing, approval or ordering.','<button class="button" data-route="planning">Planning board</button>')+
    '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Request</th><th>Part / item</th><th>Quantity</th><th>Source</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>'+state.purchaseRequests.map(r=>{const p=getPart(r.partId);return '<tr><td><strong>'+esc(r.id)+'</strong><small>'+esc(r.reason||'Purchase demand')+'</small></td><td>'+esc(p?.code||r.partId)+' · '+esc(p?.name||'')+'</td><td>'+Number(r.qty||r.quantity||0)+' '+esc(p?.uom||'')+'</td><td>'+esc(r.workOrderId||r.source||'Stock')+'</td><td>'+status(r.status)+'</td><td>'+dateFmt(r.createdAt)+'</td><td>'+(r.status==='Requested'?'<button class="button small primary" data-approve-pr="'+esc(r.id)+'">Approve</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div></div>');

  reg('rfqs',()=>'<div class="v50-page">'+pageHead('Purchasing','Requests for quote','Collect supplier quotations before committing a purchase order.','<button class="button primary" data-v51-new-rfq>＋ RFQ</button>')+
    '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>RFQ</th><th>Part / quantity</th><th>Supplier</th><th>Status</th><th>Due</th><th>Quote</th><th></th></tr></thead><tbody>'+state.rfqs.map(r=>{const p=getPart(r.partId),b=state.businesses.find(x=>x.id===r.businessId)||getVendor(r.vendorId);return '<tr><td><strong>'+esc(r.id)+'</strong><small>'+esc(r.source||'Manual')+'</small></td><td>'+esc(p?.code||r.partId)+' × '+Number(r.qty||0)+'</td><td>'+esc(b?.name||'—')+'</td><td>'+status(r.status)+'</td><td>'+dateFmt(r.dueDate)+'</td><td>'+((r.quoteAmount||0)?money(Number(r.quoteAmount)):'—')+'</td><td>'+(r.status==='Sent'?'<button class="button small" data-v51-quote-rfq="'+esc(r.id)+'">Record quote</button>':r.status==='Returned'?'<button class="button small primary" data-v51-award-rfq="'+esc(r.id)+'">Award → PO</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div></div>');

  reg('receipts',()=>{
    const rows=(state.stockTransactions||[]).filter(t=>t.type==='Receipt').sort((a,b)=>String(b.at).localeCompare(String(a.at)));
    return '<div class="v50-page">'+pageHead('Purchasing','Receipts','Goods received into stores, including partial purchase-order receipts.','<button class="button" data-route="purchase-orders">Purchase orders</button>')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Date</th><th>Reference / PO</th><th>Part</th><th>Quantity</th><th>Store / bin</th><th>Received by</th></tr></thead><tbody>'+rows.map(t=>{const p=getPart(t.partId),s=getStore(t.storeId);return '<tr><td>'+dateTimeFmt(t.at)+'</td><td><strong>'+esc(t.reference||'Receipt')+'</strong><small>'+esc(t.workOrderId||'')+'</small></td><td>'+esc(p?.code||t.partId)+' · '+esc(p?.name||'')+'</td><td>'+Number(t.qty||0)+' '+esc(p?.uom||'')+'</td><td>'+esc(s?.name||t.storeId)+'<small>'+esc(t.bin||'')+'</small></td><td>'+esc(getUser(t.userId)?.name||t.userId||'System')+'</td></tr>'}).join('')+'</tbody></table></div></div>';
  });

  reg('reports',()=>'<div class="v50-page">'+pageHead('Reports','Report library','Operational reports grouped by maintenance domain. Filters and dates should lead to the underlying records.')+
    '<div class="v51-module-cards">'+[
      ['Maintenance reports','Backlog, overdue work, PM compliance, schedule performance','reliability'],
      ['Asset reports','Availability, downtime, maintenance cost and failure frequency','reliability'],
      ['Labour reports','Hours, utilization, cost and assignment load','labor-availability'],
      ['Inventory reports','Low stock, stock value, usage and cycle count variance','parts-forecaster'],
      ['Purchasing reports','Requests, RFQs, PO status, receipts and spend','purchase-analytics'],
      ['Failure reports','Problem / Cause / Action frequencies and recurring assets','failure-analysis']
    ].map(x=>'<button class="v51-module-card" data-route="'+x[2]+'"><strong>'+x[0]+'</strong><p>'+x[1]+'</p><span>Open report →</span></button>').join('')+'</div></div>');

  reg('analytics',()=>'<div class="v50-page">'+pageHead('Analytics','Maintenance analytics','Interactive operational analysis built from connected SafiMaintain records.')+
    '<div class="v51-module-cards">'+[
      ['Current work orders','Backlog, overdue, priority and parts risk','work-insights'],
      ['Reliability','Availability, MTTR, PM compliance and maintenance cost','reliability'],
      ['Labour availability','Capacity versus assigned maintenance hours','labor-availability'],
      ['Meter history','Current readings, changes and meter-driven maintenance','meter-analytics'],
      ['Purchasing KPIs','PO value, open demand and receipt progress','purchase-analytics'],
      ['Parts forecast','Future PM/work demand compared with current stock','parts-forecaster'],
      ['Failure analysis','Recurring Problem → Cause → Action patterns','failure-analysis']
    ].map(x=>'<button class="v51-module-card" data-route="'+x[2]+'"><strong>'+x[0]+'</strong><p>'+x[1]+'</p><span>Analyze →</span></button>').join('')+'</div></div>');

  reg('labor-availability',()=>{
    const active=state.workOrders.filter(w=>control(w)==='ACTIVE'),rows=state.users.filter(u=>u.active).map(u=>{const assigned=active.filter(w=>(w.assigneeIds||[]).includes(u.id)).reduce((n,w)=>n+Math.max(0,Number(w.estimateHours||0)-Number(w.actualHours||0)),0),cap=Number(u.weeklyCapacityHours||40);return{u,assigned,cap,free:cap-assigned}}).sort((a,b)=>a.free-b.free);
    return '<div class="v50-page">'+pageHead('Analytics','Labour availability','Estimated remaining maintenance load compared with each person’s weekly capacity.')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Person</th><th>Role / group</th><th>Weekly capacity</th><th>Assigned remaining work</th><th>Free capacity</th><th>Load</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><strong>'+esc(x.u.name)+'</strong><small>'+esc(x.u.email||'')+'</small></td><td>'+esc(getRole(x.u.roleId)?.name||'—')+'<small>'+esc((x.u.groupIds||[]).map(id=>getGroup(id)?.name).filter(Boolean).join(', '))+'</small></td><td>'+x.cap.toFixed(1)+' h</td><td>'+x.assigned.toFixed(1)+' h</td><td><strong>'+x.free.toFixed(1)+' h</strong></td><td><div class="v50-progress"><i style="width:'+Math.min(100,Math.round(x.assigned/x.cap*100))+'%"></i></div><small>'+Math.round(x.assigned/x.cap*100)+'%</small></td></tr>').join('')+'</tbody></table></div></div>';
  });

  reg('meter-analytics',()=>{
    const rows=state.meters.map(m=>{const r=m.readings||[],last=r.at(-1),prev=r.at(-2),delta=last&&prev?Number(last.value)-Number(prev.value):0;return{m,last,prev,delta}});
    return '<div class="v50-page">'+pageHead('Analytics','Meter analytics','Latest readings, changes and preventive-maintenance context for asset meters.','<button class="button primary" data-v47-batch-meter>Batch readings</button>')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Asset / meter</th><th>Current</th><th>Previous</th><th>Change</th><th>Last reading</th><th>Meter PM</th></tr></thead><tbody>'+rows.map(x=>{const pm=state.scheduledMaintenance.find(p=>(p.assetIds||[p.assetId]).includes(x.m.assetId)&&p.triggers?.some(t=>t.type==='Meter'));return '<tr><td><strong>'+esc(getAsset(x.m.assetId)?.code||x.m.assetId)+' · '+esc(x.m.name)+'</strong><small>'+esc(getAsset(x.m.assetId)?.name||'')+'</small></td><td>'+esc(x.m.current)+' '+esc(x.m.unit)+'</td><td>'+esc(x.prev?.value??'—')+'</td><td>'+x.delta.toFixed(2)+'</td><td>'+dateTimeFmt(x.last?.at)+'</td><td>'+esc(pm?.name||'—')+'<small>'+esc(pm?.nextDue||'')+'</small></td></tr>'}).join('')+'</tbody></table></div></div>';
  });

  reg('purchase-analytics',()=>{
    const pos=state.purchaseOrders,total=pos.reduce((n,p)=>n+(p.lines||[]).reduce((a,l)=>a+Number(l.qty||0)*Number(l.unitCost||0),0),0),open=pos.filter(p=>!['Received','Cancelled','Closed'].includes(p.status));
    return '<div class="v50-page">'+pageHead('Analytics','Purchasing analytics','Open procurement demand, purchase-order value and receiving progress.')+
      '<div class="v50-kpis"><button class="v50-kpi"><small>Total PO value</small><strong>'+money(total)+'</strong><span>'+pos.length+' purchase orders</span></button><button class="v50-kpi"><small>Open POs</small><strong>'+open.length+'</strong><span>Awaiting approval/order/receipt</span></button><button class="v50-kpi"><small>Open purchase requests</small><strong>'+state.purchaseRequests.filter(r=>!['Received','Closed','Cancelled','Rejected'].includes(r.status)).length+'</strong><span>Demand not closed</span></button><button class="v50-kpi"><small>RFQs in flight</small><strong>'+state.rfqs.filter(r=>['Sent','Returned'].includes(r.status)).length+'</strong><span>Supplier sourcing</span></button></div>'+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>PO</th><th>Supplier</th><th>Status</th><th>Value</th><th>Expected</th><th>Receipt progress</th></tr></thead><tbody>'+pos.map(p=>{const qty=(p.lines||[]).reduce((n,l)=>n+Number(l.qty||0),0),rec=(p.lines||[]).reduce((n,l)=>n+Number(l.receivedQty||0),0);return '<tr><td><strong>'+esc(p.id)+'</strong></td><td>'+esc(getVendor(p.vendorId)?.name||p.vendorId||'—')+'</td><td>'+status(p.status)+'</td><td>'+money((p.lines||[]).reduce((n,l)=>n+Number(l.qty||0)*Number(l.unitCost||0),0))+'</td><td>'+dateFmt(p.expectedDate)+'</td><td>'+rec+'/'+qty+'<div class="v50-progress"><i style="width:'+(qty?Math.min(100,rec/qty*100):0)+'%"></i></div></td></tr>'}).join('')+'</tbody></table></div></div>';
  });

  reg('groups',()=>'<div class="v50-page">'+pageHead('People & access','User groups','Operational teams used for permissions, work assignment, responsibility and notifications.','<button class="button primary" data-v51-new-group>＋ Group</button>')+
    '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Group</th><th>Manager</th><th>Members</th><th>Sites</th><th>Active work</th></tr></thead><tbody>'+state.groups.map(g=>'<tr><td><strong>'+esc(g.name)+'</strong><small>'+esc(g.id)+'</small></td><td>'+esc(getUser(g.managerId)?.name||'—')+'</td><td>'+state.users.filter(u=>(u.groupIds||[]).includes(g.id)).length+'</td><td>'+esc((g.siteIds||state.sites.map(s=>s.id)).map(id=>state.sites.find(s=>s.id===id)?.name).filter(Boolean).join(', '))+'</td><td>'+state.workOrders.filter(w=>w.assigneeGroupId===g.id&&control(w)==='ACTIVE').length+'</td></tr>').join('')+'</tbody></table></div></div>');

  reg('permissions',()=>{
    const perms=['asset.view','asset.edit','asset.state','work.view','work.manage','work.execute','pm.manage','inventory.view','inventory.manage','inventory.issue','inventory.count','purchase.view','purchase.manage','vendor.manage','report.view','admin.people','admin.notifications'];
    return '<div class="v50-page">'+pageHead('People & access','Permissions','Role-based system capabilities. The shared backend enforces these permissions when synchronization is enabled.')+
      '<div class="v50-table-wrap v50-permission-matrix"><table class="v50-table"><thead><tr><th>Permission</th>'+state.roles.map(r=>'<th>'+esc(r.name)+'</th>').join('')+'</tr></thead><tbody>'+perms.map(p=>'<tr><td><strong>'+esc(p)+'</strong></td>'+state.roles.map(r=>'<td><input type="checkbox" data-v51-permission="'+esc(r.id)+'|'+esc(p)+'" '+((r.permissions||[]).includes(p)?'checked':'')+'></td>').join('')+'</tr>').join('')+'</tbody></table></div></div>';
  });

  function settingsListPage(route,title,subtitle,key,fields){
    reg(route,()=>'<div class="v50-page">'+pageHead('Settings',title,subtitle,'<button class="button primary" data-v51-add-setting="'+route+'">＋ Add</button>')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr>'+fields.map(f=>'<th>'+f.label+'</th>').join('')+'<th></th></tr></thead><tbody>'+state[key].map(x=>'<tr>'+fields.map(f=>'<td><strong>'+esc(x[f.key]??'—')+'</strong></td>').join('')+'<td><button class="button small danger" data-v51-delete-setting="'+route+'|'+esc(x.id)+'">Delete</button></td></tr>').join('')+'</tbody></table></div></div>');
  }
  settingsListPage('asset-categories','Asset categories','Standardize asset types, icons/reporting groups and hierarchy meaning.','assetCategories',[{key:'name',label:'Category'},{key:'kind',label:'Class'},{key:'active',label:'Active'}]);
  settingsListPage('priorities','Priorities','Urgency values with response and completion targets.','priorityDefinitions',[{key:'name',label:'Priority'},{key:'level',label:'Level'},{key:'responseMinutes',label:'Response min'},{key:'targetHours',label:'Target hours'}]);
  settingsListPage('maintenance-types','Maintenance types','Standard maintenance classifications for planning and reporting.','maintenanceTypeDefinitions',[{key:'name',label:'Type'},{key:'class',label:'Work class'},{key:'active',label:'Active'}]);
  settingsListPage('meter-units','Meter units','Controlled meter units prevent inconsistent free-text readings.','meterUnits',[{key:'name',label:'Name'},{key:'symbol',label:'Symbol'},{key:'active',label:'Active'}]);

  reg('wo-statuses',()=>'<div class="v50-page">'+pageHead('Settings','Work-order statuses','Display vocabulary mapped to stable system controls: Pending, Active or Closed.','<button class="button primary" data-v44-status-config>＋ Status</button>')+
    '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Status</th><th>System control</th><th>ID</th></tr></thead><tbody>'+state.workStatusDefinitions.map(s=>'<tr><td><strong>'+esc(s.name)+'</strong></td><td>'+pill(s.control,s.control==='CLOSED'?'good':s.control==='PENDING'?'warn':'')+'</td><td>'+esc(s.id)+'</td></tr>').join('')+'</tbody></table></div></div>');

  reg('failure-codes',()=>'<div class="v50-page">'+pageHead('Settings','Failure codes','Structured Problem → Cause → Action hierarchy for repeatable RCA.')+
    '<div class="v50-grid">'+state.failureCodeDefinitions.map(p=>'<section class="v50-card"><div class="v50-card-head"><div><h2>'+esc(p.problem)+'</h2><p>'+p.causes.length+' configured causes</p></div></div><div class="v50-card-body">'+p.causes.map(c=>'<div class="v50-list-row"><span><strong>'+esc(c.name)+'</strong><small>'+esc((c.actions||[]).join(' · '))+'</small></span></div>').join('')+'</div></section>').join('')+'</div></div>');

  reg('event-types',()=>'<div class="v50-page">'+pageHead('Settings','Asset event types','Standard asset occurrences and their automatic-work behavior.')+
    '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Event</th><th>Priority</th><th>Create work</th><th>Active</th><th>Default task</th></tr></thead><tbody>'+(state.assetEventTypes||[]).map(e=>'<tr><td><strong>'+esc(e.name)+'</strong></td><td>'+esc(e.priority)+'</td><td><input type="checkbox" data-v25-event-work="'+esc(e.id)+'" '+(e.createWork?'checked':'')+'></td><td><input type="checkbox" data-v25-event-active="'+esc(e.id)+'" '+(e.active?'checked':'')+'></td><td>'+esc(e.task||'—')+'</td></tr>').join('')+'</tbody></table></div></div>');

  reg('custom-fields',()=>'<div class="v50-page">'+pageHead('Settings','Custom fields','Company-specific fields for assets and work orders.','<button class="button" data-v47-new-custom>＋ Asset field</button><button class="button primary" data-v51-new-work-field>＋ Work-order field</button>')+
    '<div class="v50-grid"><section class="v50-card"><div class="v50-card-head"><div><h2>Asset fields</h2><p>Additional asset master data</p></div></div><div class="v50-list">'+(state.assetCustomFieldDefinitions.length?state.assetCustomFieldDefinitions.map(f=>'<div class="v50-list-row"><span><strong>'+esc(f.name)+'</strong><small>'+esc(f.type||'Text')+'</small></span></div>').join(''):empty('No custom asset fields','Create fields such as pressure rating or SAP code.'))+'</div></section><section class="v50-card"><div class="v50-card-head"><div><h2>Work-order fields</h2><p>Permit, production impact or shutdown information</p></div></div><div class="v50-list">'+(state.workCustomFieldDefinitions.length?state.workCustomFieldDefinitions.map(f=>'<div class="v50-list-row"><span><strong>'+esc(f.name)+'</strong><small>'+esc(f.type||'Text')+(f.required?' · Required':'')+'</small></span></div>').join(''):empty('No custom work fields','Create fields for permit number, impact or shutdown requirements.'))+'</div></section></div></div>');

  reg('workflows',()=>'<div class="v50-page">'+pageHead('Settings','Workflow automation','Respond to operational events with notifications, assignment or priority changes.','<button class="button primary" data-v51-new-workflow>＋ Workflow</button>')+
    '<div class="v50-card">'+(state.workflowRules.length?state.workflowRules.map(r=>'<div class="v51-workflow"><span><strong>WHEN</strong><small>'+esc(r.event)+'</small></span><span><strong>'+esc(r.name)+'</strong><small>'+esc(r.condition||'No extra condition')+'</small></span><span><strong>THEN</strong><small>'+esc(r.actionType)+' '+esc(r.target||'')+'</small></span><button class="button small '+(r.active?'':'primary')+'" data-v51-toggle-workflow="'+esc(r.id)+'">'+(r.active?'Pause':'Enable')+'</button></div>').join(''):empty('No automation rules','Create event-driven rules for emergency work, inspection failure or asset state.'))+'</div></div>');

  reg('import',()=>'<div class="v50-page">'+pageHead('Data management','Import','Bulk-load operational records through a controlled upload → map → validate → preview → import process.')+
    '<div class="v50-grid"><section class="v50-card"><div class="v50-card-head"><div><h2>Import workflow</h2><p>CSV support is available today for assets and work orders</p></div></div><div class="v50-card-body">'+[
      ['1','Upload CSV','Choose the source file and record type.'],['2','Map columns','Match external columns to SafiMaintain fields.'],['3','Validate','Check IDs, parent assets, users, sites and numeric values.'],['4','Preview errors','Correct invalid rows before creating records.'],['5','Import','Create valid records with audit history.']
    ].map(x=>'<div class="v51-import-step"><b>'+x[0]+'</b><div><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div></div>').join('')+'</div></section><section class="v50-card"><div class="v50-card-head"><div><h2>Available imports</h2></div></div><div class="v50-card-body"><div class="v50-command-actions"><button class="button" data-route="assets">Asset CSV import</button><button class="button" data-route="work-orders">Work-order CSV import</button></div><div class="v50-state-note" style="margin-top:10px">The architecture reserves import-job records for parts, users, meters, PM schedules and event history. Those imports should use the same validator rather than separate one-off upload logic.</div></div></section></div></div>');

  reg('export',()=>'<div class="v50-page">'+pageHead('Data management','Export','Export operational records for audit, BI, management review or migration.')+
    '<div class="v51-module-cards">'+[
      ['Full workspace JSON','Complete portable SafiMaintain state','data-action="export-data"'],
      ['Filtered work orders','CSV export of the current Work filter','data-route="work-orders"'],
      ['Reports / analytics','Run a report and export its underlying records','data-route="reports"']
    ].map(x=>'<button class="v51-module-card" '+x[2]+'><strong>'+x[0]+'</strong><p>'+x[1]+'</p><span>Continue →</span></button>').join('')+'</div></div>');

  reg('integrations',()=>'<div class="v50-page">'+pageHead('Settings','API / integrations','External-system connections, synchronization status and integration boundaries.','<button class="button primary" data-v51-new-integration>＋ Connection</button>')+
    '<div class="v50-grid"><section class="v50-card"><div class="v50-card-head"><div><h2>Connected systems</h2><p>ERP, SCADA, PLC, IoT, finance, Power BI, Azure or SAP</p></div></div><div class="v50-list">'+(state.integrationConnections.length?state.integrationConnections.map(c=>'<div class="v50-list-row"><span><strong>'+esc(c.name)+'</strong><small>'+esc(c.type)+' · '+esc(c.endpoint||'No endpoint')+'</small></span>'+pill(c.status||'Configured',c.status==='Healthy'?'good':'warn')+'</div>').join(''):empty('No external integrations configured','The shared API is available when SafiMaintain runs behind its backend.'))+'</div></section><section class="v50-card"><div class="v50-card-head"><div><h2>Shared API contract</h2><p>Current production foundation</p></div></div><div class="v50-card-body"><div class="v51-code">GET  /api/health\nGET  /api/v1/session\nGET  /api/v1/state\nPUT  /api/v1/state\nPOST /api/v1/attachments\nGET  /api/v1/attachments/entity/{type}/{id}</div><div class="v50-state-note" style="margin-top:9px">Machine/ERP-specific endpoints should be implemented as authenticated integration adapters rather than exposing browser storage.</div></div></section></div></div>');

  function showTaskGroup(group){
    const g=group||{id:null,name:'',description:'',tasks:[]};
    openModal({eyebrow:'Task groups / SOPs',title:g.id?'Edit '+g.name:'Create task group',submitText:g.id?'Save changes':'Create task group',body:'<div class="form-grid">'+field('name','Name',g.name,{required:true,span:true})+field('description','Description',g.description||'',{span:true})+field('tasks','Tasks — one per line',(g.tasks||[]).map(t=>t.text).join('\n'),{type:'textarea',required:true,span:true})+field('types','Task types — General, Text, Inspection or Meter',(g.tasks||[]).map(t=>t.type||'General').join('\n'),{type:'textarea',span:true})+'</div>',onSubmit:fd=>{const texts=String(fd.get('tasks')||'').split('\n').map(x=>x.trim()).filter(Boolean),types=String(fd.get('types')||'').split('\n').map(x=>x.trim());const rec=g.id?g:{id:uid('TG'),status:'Active'};rec.name=String(fd.get('name'));rec.description=String(fd.get('description')||'');rec.tasks=texts.map((text,i)=>({id:uid('TGT'),text,type:['General','Text','Inspection','Meter'].includes(types[i])?types[i]:'General',assigneeId:null,estimateHours:0}));if(!g.id)state.taskGroups.push(rec);addAudit(g.id?'TASK_GROUP_UPDATED':'TASK_GROUP_CREATED',rec.id,rec.name);saveState();closeModal();render();toast('Task group saved')}});
  }

  document.addEventListener('input',e=>{if(e.target.matches('[data-v51-asset-search]')){ui.v51AssetSearch=e.target.value;render()}},true);
  document.addEventListener('change',e=>{
    const p=e.target.dataset.v51Permission;if(p){const [rid,perm]=p.split('|'),role=getRole(rid);if(!role)return;role.permissions=role.permissions||[];if(e.target.checked&&!role.permissions.includes(perm))role.permissions.push(perm);if(!e.target.checked)role.permissions=role.permissions.filter(x=>x!==perm);addAudit('ROLE_PERMISSION_CHANGED',rid,perm+'='+e.target.checked);saveState();toast('Permission updated')}
  },true);

  document.addEventListener('click',e=>{
    const oa=e.target.closest('[data-v51-open-asset]');if(oa){e.preventDefault();e.stopImmediatePropagation();ui.selectedAsset=oa.dataset.v51OpenAsset;ui.assetView='record';ui.assetRecordTab='general';go('assets');return}
    if(e.target.closest('[data-v51-new-move]')){e.preventDefault();e.stopImmediatePropagation();const assets=siteAssets().filter(a=>a.rotating&&!state.assetMoves.some(m=>m.assetId===a.id&&!m.returnedAt));if(!assets.length){toast('No available rotating assets');return}showMove(assets[0]);return}
    const ma=e.target.closest('[data-v51-move-asset]');if(ma){e.preventDefault();e.stopImmediatePropagation();showMove(getAsset(ma.dataset.v51MoveAsset));return}
    const rm=e.target.closest('[data-v51-return-move]');if(rm){e.preventDefault();e.stopImmediatePropagation();const m=state.assetMoves.find(x=>x.id===rm.dataset.v51ReturnMove);if(!m)return;m.returnedAt=iso();const a=getAsset(m.assetId);if(a)a.location=m.fromLocation;state.assetEvents.unshift({id:uid('AE'),assetId:m.assetId,type:'Asset returned',at:iso(),userId:CURRENT_USER,detail:'Returned from '+m.toLocation+' to '+m.fromLocation});addAudit('ASSET_MOVE_RETURNED',m.id,m.assetId);saveState();render();toast('Asset returned');return}
    if(e.target.closest('[data-v51-new-event]')){e.preventDefault();e.stopImmediatePropagation();const a=siteAssets()[0];if(a){ui.selectedAsset=a.id;ui.assetView='record';ui.assetRecordTab='meter';go('assets');setTimeout(()=>document.querySelector('[data-v45-event="'+CSS.escape(a.id)+'"]')?.click(),0)}return}
    if(e.target.closest('[data-v51-new-task-group]')){e.preventDefault();e.stopImmediatePropagation();showTaskGroup();return}
    const etg=e.target.closest('[data-v51-edit-task-group]');if(etg){e.preventDefault();e.stopImmediatePropagation();showTaskGroup(state.taskGroups.find(g=>g.id===etg.dataset.v51EditTaskGroup));return}
    const dtg=e.target.closest('[data-v51-duplicate-task-group]');if(dtg){e.preventDefault();e.stopImmediatePropagation();const g=state.taskGroups.find(x=>x.id===dtg.dataset.v51DuplicateTaskGroup);if(!g)return;const copy=structuredClone(g);copy.id=uid('TG');copy.name=g.name+' copy';copy.tasks=(copy.tasks||[]).map(t=>({...t,id:uid('TGT')}));state.taskGroups.push(copy);addAudit('TASK_GROUP_DUPLICATED',copy.id,g.id);saveState();render();return}
    const atg=e.target.closest('[data-v51-archive-task-group]');if(atg){e.preventDefault();e.stopImmediatePropagation();const g=state.taskGroups.find(x=>x.id===atg.dataset.v51ArchiveTaskGroup);if(g){g.status='Archived';saveState();render()}return}
    if(e.target.closest('[data-v51-new-project]')){e.preventDefault();e.stopImmediatePropagation();showProject();return}
    const pw=e.target.closest('[data-v51-project-work]');if(pw){e.preventDefault();e.stopImmediatePropagation();showProjectWork(pw.dataset.v51ProjectWork);return}
    if(e.target.closest('[data-v51-new-bom-group]')){e.preventDefault();e.stopImmediatePropagation();showBomGroup();return}
    const ab=e.target.closest('[data-v51-apply-bom]');if(ab){e.preventDefault();e.stopImmediatePropagation();applyBom(ab.dataset.v51ApplyBom);return}
    const db=e.target.closest('[data-v51-delete-bom]');if(db){e.preventDefault();e.stopImmediatePropagation();state.bomGroups=state.bomGroups.filter(x=>x.id!==db.dataset.v51DeleteBom);saveState();render();return}
    const buy=e.target.closest('[data-v51-buy-part]');if(buy){e.preventDefault();e.stopImmediatePropagation();const [pid,qty]=buy.dataset.v51BuyPart.split('|');const p=getPart(pid);if(!p)return;const pr={id:uid('PR'),partId:pid,qty:Number(qty),quantity:Number(qty),status:'Requested',createdAt:iso(),reason:'Parts forecast shortage',source:'Parts forecaster'};state.purchaseRequests.unshift(pr);addAudit('PURCHASE_REQUEST_CREATED',pr.id,p.code+' × '+qty);dispatchEvent('Purchase request created',pr.id+' created',p.name+' forecast shortage',{partId:pid,relatedId:pr.id});saveState();render();toast('Purchase request created');return}
    if(e.target.closest('[data-v51-new-rfq]')){e.preventDefault();e.stopImmediatePropagation();showRFQ();return}
    const qr=e.target.closest('[data-v51-quote-rfq]');if(qr){e.preventDefault();e.stopImmediatePropagation();recordQuote(qr.dataset.v51QuoteRfq);return}
    const ar=e.target.closest('[data-v51-award-rfq]');if(ar){e.preventDefault();e.stopImmediatePropagation();awardRFQ(ar.dataset.v51AwardRfq);return}
    if(e.target.closest('[data-v51-new-group]')){e.preventDefault();e.stopImmediatePropagation();showGroup();return}
    const addSet=e.target.closest('[data-v51-add-setting]');if(addSet){e.preventDefault();e.stopImmediatePropagation();showSetting(addSet.dataset.v51AddSetting);return}
    const delSet=e.target.closest('[data-v51-delete-setting]');if(delSet){e.preventDefault();e.stopImmediatePropagation();const [route,id]=delSet.dataset.v51DeleteSetting.split('|'),cfg=settingConfig(route);if(!cfg)return;state[cfg.key]=state[cfg.key].filter(x=>x.id!==id);saveState();render();return}
    if(e.target.closest('[data-v51-new-work-field]')){e.preventDefault();e.stopImmediatePropagation();openModal({eyebrow:'Custom fields',title:'Create work-order field',submitText:'Create field',body:'<div class="form-grid">'+field('name','Field name','',{required:true})+field('type','Field type','Text',{type:'select',options:['Text','Number','Date','Yes / No'].map(x=>({value:x,label:x}))})+'<label class="check-row span-2"><input type="checkbox" name="required"> Required before closure</label></div>',onSubmit:fd=>{const f={id:uid('WCF'),name:String(fd.get('name')),type:String(fd.get('type')),required:fd.get('required')==='on'};state.workCustomFieldDefinitions.push(f);saveState();closeModal();render();toast('Work field created')}});return}
    if(e.target.closest('[data-v51-new-workflow]')){e.preventDefault();e.stopImmediatePropagation();showWorkflow();return}
    const tw=e.target.closest('[data-v51-toggle-workflow]');if(tw){e.preventDefault();e.stopImmediatePropagation();const r=state.workflowRules.find(x=>x.id===tw.dataset.v51ToggleWorkflow);if(r){r.active=!r.active;saveState();render()}return}
    if(e.target.closest('[data-v51-new-integration]')){e.preventDefault();e.stopImmediatePropagation();showIntegration();return}
  },true);

  function showMove(a){
    if(!a)return;openModal({eyebrow:'Rotating asset',title:'Move '+a.name,submitText:'Record move',body:'<div class="form-grid">'+field('toLocation','Temporary / new location','',{required:true})+field('moveType','Move type','Temporary',{type:'select',options:['Temporary','Permanent'].map(x=>({value:x,label:x}))})+field('expectedReturn','Expected return','',{type:'date'})+field('note','Move note','',{span:true})+'</div>',onSubmit:fd=>{const m={id:uid('MOVE'),assetId:a.id,fromLocation:a.location||'',toLocation:String(fd.get('toLocation')),moveType:String(fd.get('moveType')),movedAt:iso(),expectedReturn:String(fd.get('expectedReturn')||''),returnedAt:null,note:String(fd.get('note')||''),movedBy:CURRENT_USER};state.assetMoves.unshift(m);a.location=m.toLocation;state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Asset moved',at:iso(),userId:CURRENT_USER,detail:m.fromLocation+' → '+m.toLocation});addAudit('ASSET_MOVED',a.id,m.fromLocation+' → '+m.toLocation);saveState();closeModal();render();toast('Move recorded')}})
  }
  function showProject(){
    openModal({eyebrow:'Maintenance projects',title:'Create project',submitText:'Create project',body:'<div class="form-grid">'+field('name','Project name','',{required:true,span:true})+field('status','Status','Planning',{type:'select',options:['Planning','Planned','Active','On Hold','Completed','Cancelled'].map(x=>({value:x,label:x}))})+field('budget','Budget','0',{type:'number',min:0,step:'.01'})+field('startDate','Start date',day(0),{type:'date'})+field('endDate','End date',day(30),{type:'date'})+field('description','Scope / description','',{type:'textarea',span:true})+'</div>',onSubmit:fd=>{const p={id:uid('PROJ'),name:String(fd.get('name')),status:String(fd.get('status')),budget:Number(fd.get('budget')||0),startDate:String(fd.get('startDate')||''),endDate:String(fd.get('endDate')||''),description:String(fd.get('description')||''),siteId:site()?.id||null,createdAt:iso()};state.projects.unshift(p);addAudit('PROJECT_CREATED',p.id,p.name);saveState();closeModal();render();toast('Project created')}})
  }
  function showProjectWork(pid){
    const p=state.projects.find(x=>x.id===pid);if(!p)return;const available=state.workOrders.filter(w=>!w.projectId||w.projectId===pid);
    openModal({eyebrow:p.id,title:'Project work · '+p.name,submitText:'Save assignment',body:'<div class="form-grid">'+field('workId','Work order','',{type:'select',options:available.map(w=>({value:w.id,label:w.id+' · '+w.title+(w.projectId===pid?' · already linked':'')}))})+'</div>',onSubmit:fd=>{const w=getWork(String(fd.get('workId')));if(!w)return;w.projectId=pid;w.history=w.history||[];w.history.unshift({at:iso(),text:'Added to project '+p.name});addAudit('WORK_PROJECT_ASSIGNED',w.id,p.id);saveState();closeModal();render();toast('Work added to project')}})
  }
  function showBomGroup(){
    openModal({eyebrow:'BOM groups',title:'Create BOM group',submitText:'Create group',body:'<div class="form-grid">'+field('name','Group name','',{required:true})+field('description','Description','')+field('parts','Parts','',{type:'select',options:state.parts.map(p=>({value:p.id,label:p.code+' · '+p.name}))})+field('qty','Standard quantity','1',{type:'number',min:.01,step:'.01'})+'</div>',onSubmit:fd=>{const g={id:uid('BOMG'),name:String(fd.get('name')),description:String(fd.get('description')||''),parts:[{partId:String(fd.get('parts')),qty:Number(fd.get('qty')||1)}],assetIds:[]};state.bomGroups.push(g);addAudit('BOM_GROUP_CREATED',g.id,g.name);saveState();closeModal();render();toast('BOM group created')}})
  }
  function applyBom(gid){
    const g=state.bomGroups.find(x=>x.id===gid);if(!g)return;openModal({eyebrow:g.name,title:'Apply BOM group',submitText:'Apply parts',body:'<div class="form-grid">'+field('assetId','Asset','',{type:'select',options:siteAssets().map(a=>({value:a.id,label:a.code+' · '+a.name}))})+'</div>',onSubmit:fd=>{const a=getAsset(String(fd.get('assetId')));if(!a)return;a.bom=a.bom||[];a.bomQuantities=a.bomQuantities||{};g.parts.forEach(x=>{if(!a.bom.includes(x.partId))a.bom.push(x.partId);a.bomQuantities[x.partId]=Number(x.qty||1)});if(!g.assetIds.includes(a.id))g.assetIds.push(a.id);state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'BOM group applied',at:iso(),userId:CURRENT_USER,detail:g.name});saveState();closeModal();render();toast('BOM group applied')}})
  }
  function showRFQ(){
    const biz=state.businesses.filter(b=>['Vendor','Supplier','Manufacturer','Service Provider','Contractor'].includes(b.type));
    openModal({eyebrow:'Purchasing',title:'Create RFQ',submitText:'Create RFQ',body:'<div class="form-grid">'+field('partId','Part','',{type:'select',options:state.parts.map(p=>({value:p.id,label:p.code+' · '+p.name}))})+field('qty','Quantity','1',{type:'number',min:.01,step:'.01'})+field('businessId','Supplier','',{type:'select',options:biz.map(b=>({value:b.id,label:b.name+' · '+b.type}))})+field('dueDate','Quote due',day(7),{type:'date'})+'</div>',onSubmit:fd=>{const r={id:uid('RFQ'),partId:String(fd.get('partId')),qty:Number(fd.get('qty')||1),businessId:String(fd.get('businessId')||''),status:'Sent',dueDate:String(fd.get('dueDate')),createdAt:iso(),source:'Manual'};state.rfqs.unshift(r);addAudit('RFQ_CREATED',r.id,(getPart(r.partId)?.code||r.partId)+' × '+r.qty);saveState();closeModal();render();toast('RFQ created')}})
  }
  function recordQuote(id){
    const r=state.rfqs.find(x=>x.id===id);if(!r)return;openModal({eyebrow:r.id,title:'Record supplier quote',submitText:'Record quote',body:'<div class="form-grid">'+field('amount','Quote amount','0',{type:'number',min:0,step:'.01'})+field('leadDays','Lead time (days)','7',{type:'number',min:0,step:'1'})+field('note','Quote note','',{span:true})+'</div>',onSubmit:fd=>{r.quoteAmount=Number(fd.get('amount')||0);r.leadDays=Number(fd.get('leadDays')||0);r.quoteNote=String(fd.get('note')||'');r.status='Returned';addAudit('RFQ_QUOTE_RECORDED',r.id,String(r.quoteAmount));saveState();closeModal();render();toast('Quote recorded')}})
  }
  function awardRFQ(id){
    const r=state.rfqs.find(x=>x.id===id),p=r&&getPart(r.partId),b=r&&state.businesses.find(x=>x.id===r.businessId);if(!r||!p)return;
    const legacyVendor=(b?.sourceVendorId&&getVendor(b.sourceVendorId))||state.vendors.find(v=>v.name===b?.name)||state.vendors[0];
    const po={id:uid('PO'),vendorId:legacyVendor?.id||null,businessId:b?.id||null,status:'Ordered',createdAt:iso(),expectedDate:day(Number(r.leadDays||7)),lines:[{partId:p.id,qty:Number(r.qty||0),unitCost:Number(r.quoteAmount||0)/Math.max(1,Number(r.qty||1)),receivedQty:0}],sourceRequestIds:[],sourceRfqId:r.id};state.purchaseOrders.unshift(po);r.status='Awarded';r.purchaseOrderId=po.id;addAudit('RFQ_AWARDED',r.id,po.id);saveState();render();toast(po.id+' created')
  }
  function showGroup(){
    openModal({eyebrow:'People & access',title:'Create group',submitText:'Create group',body:'<div class="form-grid">'+field('name','Group name','',{required:true})+field('managerId','Manager','',{type:'select',options:[{value:'',label:'No manager'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))]})+'</div>',onSubmit:fd=>{const g={id:uid('GRP'),name:String(fd.get('name')),managerId:String(fd.get('managerId')||'')||null,siteIds:state.sites.map(s=>s.id)};state.groups.push(g);addAudit('GROUP_CREATED',g.id,g.name);saveState();closeModal();render();toast('Group created')}})
  }
  function settingConfig(route){return {
    'asset-categories':{key:'assetCategories',fields:['name','kind']},priorities:{key:'priorityDefinitions',fields:['name','level','responseMinutes','targetHours']},
    'maintenance-types':{key:'maintenanceTypeDefinitions',fields:['name','class']},'meter-units':{key:'meterUnits',fields:['name','symbol']}
  }[route]}
  function showSetting(route){
    const cfg=settingConfig(route);if(!cfg)return;const labels={name:'Name',kind:'Class',level:'Level',responseMinutes:'Response minutes',targetHours:'Target hours',class:'Work class',symbol:'Symbol'};
    openModal({eyebrow:'Settings',title:'Add '+route.replaceAll('-',' '),submitText:'Add',body:'<div class="form-grid">'+cfg.fields.map(k=>field(k,labels[k]||k,'',{required:k==='name',type:['level','responseMinutes','targetHours'].includes(k)?'number':'text'})).join('')+'</div>',onSubmit:fd=>{const rec={id:uid('SET'),active:true};cfg.fields.forEach(k=>rec[k]=['level','responseMinutes','targetHours'].includes(k)?Number(fd.get(k)||0):String(fd.get(k)||''));state[cfg.key].push(rec);addAudit('SETTING_CREATED',route,rec.name||rec.id);saveState();closeModal();render();toast('Setting added')}})
  }
  function showWorkflow(){
    const events=['Work order assigned','Work order status changed','Work order closed','Asset taken offline','Asset returned online','Asset event recorded','Stock below minimum','Purchase request created','Inspection failed'];
    openModal({eyebrow:'Workflow automation',title:'Create workflow rule',submitText:'Create rule',body:'<div class="form-grid">'+field('name','Rule name','',{required:true,span:true})+field('event','When event',events[0],{type:'select',options:events.map(x=>({value:x,label:x}))})+field('actionType','Action','Notify group',{type:'select',options:['Notify group','Assign work to group','Escalate priority'].map(x=>({value:x,label:x}))})+field('target','Target group / priority','')+field('condition','Optional condition note','',{span:true})+'</div>',onSubmit:fd=>{const r={id:uid('WFLOW'),name:String(fd.get('name')),event:String(fd.get('event')),actionType:String(fd.get('actionType')),target:String(fd.get('target')||''),condition:String(fd.get('condition')||''),active:true};state.workflowRules.push(r);addAudit('WORKFLOW_CREATED',r.id,r.name);saveState();closeModal();render();toast('Workflow created')}})
  }
  function showIntegration(){
    openModal({eyebrow:'API / integrations',title:'Add integration connection',submitText:'Save connection',body:'<div class="form-grid">'+field('name','Connection name','',{required:true})+field('type','System type','ERP',{type:'select',options:['ERP','SCADA','PLC','IoT','Finance','Power BI','Azure','SAP','Other'].map(x=>({value:x,label:x}))})+field('endpoint','Endpoint / identifier','',{span:true})+'</div>',onSubmit:fd=>{const c={id:uid('INT'),name:String(fd.get('name')),type:String(fd.get('type')),endpoint:String(fd.get('endpoint')||''),status:'Configured',createdAt:iso()};state.integrationConnections.push(c);addAudit('INTEGRATION_CONFIGURED',c.id,c.name);saveState();closeModal();render();toast('Integration saved')}})
  }

  const baseDispatch=dispatchEvent;
  dispatchEvent=function(event,title,message,context={}){
    baseDispatch(event,title,message,context);
    state.workflowRules.filter(r=>r.active&&r.event===event).forEach(r=>{
      const w=context.relatedId&&getWork(context.relatedId);
      if(r.actionType==='Assign work to group'&&w){
        const g=state.groups.find(g=>g.id===r.target||g.name===r.target);if(g){w.assigneeGroupId=g.id;w.history=w.history||[];w.history.unshift({at:iso(),text:'Workflow '+r.name+' assigned '+g.name})}
      }else if(r.actionType==='Escalate priority'&&w){
        if(r.target)w.priority=r.target;
      }else if(r.actionType==='Notify group'){
        const g=state.groups.find(g=>g.id===r.target||g.name===r.target);if(g)state.users.filter(u=>(u.groupIds||[]).includes(g.id)).forEach(u=>state.notifications.unshift({id:uid('N'),userId:u.id,event:'Workflow: '+r.name,title,message,createdAt:iso(),read:false,relatedId:context.relatedId||null}));
      }
      addAudit('WORKFLOW_EXECUTED',r.id,event+' · '+r.actionType);
    });
  };
  window.dispatchEvent=dispatchEvent;

  const previousRender=render;
  render=function(){
    previousRender();
    const fn=customRoutes.get(ui.route);if(fn){const view=document.getElementById('appView');view.innerHTML=fn();document.title=routeTitle()+' · SafiMaintain';document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===ui.route));updateBadges()}
  };
  window.render=render;
  if(customRoutes.has(ui.route))render();
})();