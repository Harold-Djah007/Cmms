'use strict';

// SafiMaintain platform states v55.
// Full search, report viewer, field home, offline/conflict center, localization and explicit permission/error states.
(function(){
  ensureSpecState();

  const CONFLICT_KEY='safimaint-conflict-backup-v1';
  ui.v55SearchQuery=ui.v55SearchQuery||'';
  ui.v55ReportId=ui.v55ReportId||null;
  ui.v55ReportFrom=ui.v55ReportFrom||'';
  ui.v55ReportTo=ui.v55ReportTo||'';

  state.meta=state.meta||{};
  state.meta.localization=state.meta.localization||{locale:'en-GH',currency:'GHS',timezone:'Africa/Accra',dateStyle:'medium'};
  window.SafiLocalization=state.meta.localization;

  function localPermissions(){
    const user=currentUser(),role=user&&getRole(user.roleId),local=new Set(role?.permissions||[]);
    if(typeof safiSync!=='undefined'&&safiSync.identity&&Array.isArray(safiSync.permissions)){
      const remote=new Set(safiSync.permissions);
      // Docker development is explicitly trusted by the API. Keep the first
      // shared render usable while the session permission list is refreshing.
      if(safiSync.identity.provider==='development'&&remote.size===0)return new Set(['*']);
      if(remote.has('*'))return remote;
      // In device/fresh-workspace mode keep the locally configured role usable
      // until the shared identity maps to the same persisted user.
      if(remote.size)return remote;
    }
    return local;
  }
  function can(permission){
    const set=localPermissions();return set.has('*')||set.has(permission);
  }
  window.safiCan=can;

  async function refreshSharedPermissions(){
    if(typeof safiSync==='undefined'||!safiSync.apiAvailable)return;
    try{const session=await apiJson('/api/v1/session');safiSync.permissions=session.permissions||[];safiSync.identity=session.identity||safiSync.identity;paintSync();if(ui.route)render()}catch(_ignored){}
  }
  window.addEventListener('load',()=>setTimeout(refreshSharedPermissions,1200),{once:true});
  window.addEventListener('online',()=>setTimeout(refreshSharedPermissions,800));

  const routePermission={
    'work-orders':'work.view',calendar:'work.view',pm:'pm.manage',projects:'work.view','task-groups':'work.view',
    assets:'asset.view','asset-register':'asset.view',equipment:'asset.view',facilities:'asset.view',tools:'asset.view','rotating-assets':'asset.view',meters:'asset.view',downtime:'asset.view','asset-events':'asset.view',
    inventory:'inventory.view','stock-locations':'inventory.view',transactions:'inventory.view',counts:'inventory.view','bom-groups':'inventory.view','parts-forecaster':'inventory.view','tool-crib':'inventory.view',
    planning:'purchase.view','purchase-requests':'purchase.view',rfqs:'purchase.view','purchase-orders':'purchase.view',receipts:'purchase.view','purchase-analytics':'purchase.view',
    reports:'report.view','report-viewer':'report.view',analytics:'report.view',reliability:'report.view','work-insights':'report.view','failure-analysis':'report.view','labor-availability':'report.view','meter-analytics':'report.view',
    people:'admin.people',groups:'admin.people',roles:'admin.people',permissions:'admin.people',sites:'admin.people','asset-categories':'admin.people',priorities:'admin.people','maintenance-types':'admin.people','wo-statuses':'admin.people','failure-codes':'admin.people','meter-units':'admin.people','event-types':'admin.people','custom-fields':'admin.people',workflows:'admin.notifications',security:'admin.people',audit:'admin.people',localization:'admin.people',integrations:'admin.people'
  };
  function deniedPage(permission){
    return '<div class="v55-denied"><div class="lock">🔒</div><h2>Access is restricted</h2><p>Your current role does not include <code>'+esc(permission)+'</code>. SafiMaintain keeps the page visible in the navigation architecture so it is clear the capability exists, but operational records are not exposed without the required permission.</p><button class="button" data-route="dashboard">Return home</button></div>';
  }

  function searchRecords(q){
    q=String(q||'').trim().toLowerCase();if(q.length<2)return [];
    const out=[],hit=(kind,title,sub,route,id,blob)=>{if(String(blob||[title,sub].join(' ')).toLowerCase().includes(q))out.push({kind,title,sub,route,id})};
    state.assets.forEach(a=>hit('Asset',a.code+' · '+a.name,[a.type,a.location,a.serial,a.category].filter(Boolean).join(' · '),'assets',a.id,[a.id,a.code,a.name,a.description,a.serial,a.model,a.manufacturer,a.location,a.category].join(' ')));
    state.workOrders.forEach(w=>hit('Work order',w.id+' · '+w.title,[w.status,w.priority,w.type].join(' · '),'work-orders',w.id,[w.id,w.title,w.description,w.status,w.priority,w.type,w.instructions,(w.assetIds||[]).map(id=>getAsset(id)?.name).join(' ')].join(' ')));
    state.parts.forEach(p=>hit('Part',p.code+' · '+p.name,partOnHand(p)+' '+p.uom+' on hand','inventory',p.id,[p.id,p.code,p.name,p.description,p.category,p.barcode,p.manufacturer,p.model].join(' ')));
    state.requests.forEach(r=>hit('Request',r.id+' · '+r.summary,r.status+' · '+(r.requester||''),'requests',r.id,[r.id,r.summary,r.description,r.requester,r.status,getAsset(r.assetId)?.name].join(' ')));
    state.scheduledMaintenance.forEach(p=>hit('Scheduled maintenance',p.id+' · '+p.name,p.status+' · '+(p.triggerLogic||'ANY'),'pm',p.id,[p.id,p.name,p.status,(p.triggers||[]).map(t=>t.description).join(' '),(p.assetIds||[p.assetId]).map(id=>getAsset(id)?.name).join(' ')].join(' ')));
    state.projects.forEach(p=>hit('Project',p.id+' · '+p.name,p.status||'','projects',p.id,[p.id,p.name,p.description,p.status].join(' ')));
    state.purchaseOrders.forEach(p=>hit('Purchase order',p.id+' · '+(getVendor(p.vendorId)?.name||'Supplier'),p.status||'','purchase-orders',p.id,[p.id,p.status,getVendor(p.vendorId)?.name,(p.lines||[]).map(l=>getPart(l.partId)?.name).join(' ')].join(' ')));
    state.purchaseRequests.forEach(r=>hit('Purchase request',r.id+' · '+(getPart(r.partId)?.name||r.partId),r.status||'','purchase-requests',r.id,[r.id,r.status,r.reason,getPart(r.partId)?.code,getPart(r.partId)?.name].join(' ')));
    state.rfqs.forEach(r=>hit('RFQ',r.id+' · '+(getPart(r.partId)?.name||r.partId),r.status||'','rfqs',r.id,[r.id,r.status,getPart(r.partId)?.code,getPart(r.partId)?.name,state.businesses.find(b=>b.id===r.businessId)?.name].join(' ')));
    state.businesses.forEach(b=>hit('Business',b.name,[b.type,b.group].filter(Boolean).join(' · '),'businesses',b.id,[b.id,b.name,b.type,b.group,b.contact,b.phone,b.email].join(' ')));
    state.users.forEach(u=>hit('Person',u.name,getRole(u.roleId)?.name||'User','people',u.id,[u.id,u.name,u.email,getRole(u.roleId)?.name,(u.groupIds||[]).map(id=>getGroup(id)?.name).join(' ')].join(' ')));
    state.meters.forEach(m=>hit('Meter',(getAsset(m.assetId)?.code||m.assetId)+' · '+m.name,m.current+' '+m.unit,'meters',m.id,[m.id,m.name,m.unit,m.current,getAsset(m.assetId)?.name].join(' ')));
    return out.slice(0,120);
  }
  window.safiSearchRecords=searchRecords;

  function groupedSearchHtml(q,limitPer=6){
    const results=searchRecords(q),groups={};results.forEach(r=>(groups[r.kind]??=[]).push(r));
    if(!results.length)return '<div class="v50-empty"><strong>No matching records</strong><span>Try a code, asset name, work number, supplier, person or part.</span></div>';
    return '<div class="v55-search-groups">'+Object.entries(groups).map(([kind,rows])=>'<section class="v55-search-group"><h3>'+esc(kind)+' · '+rows.length+'</h3>'+rows.slice(0,limitPer).map(r=>'<button class="v55-search-row" type="button" data-v55-result="'+esc(r.kind)+'|'+esc(r.id)+'|'+esc(r.route)+'"><span><strong>'+esc(r.title)+'</strong><small>'+esc(r.sub||'')+'</small></span><span class="v55-search-kind">'+esc(kind)+'</span></button>').join('')+'</section>').join('')+'</div>';
  }

  showSearch=function(){
    const d=document.getElementById('searchModal'),f=document.getElementById('searchForm');
    f.innerHTML='<input class="search-input" name="q" autocomplete="off" placeholder="Search assets, work, requests, parts, POs, people…" autofocus><div class="search-results" id="searchResults"><div class="empty"><strong>Search the entire CMMS</strong><span>Enter at least two characters.</span></div></div><div class="v55-search-footer"><button class="button" type="button" data-v55-search-page>Open full search</button></div>';
    d.showModal();setTimeout(()=>f.elements.q?.focus(),50);
  };
  window.showSearch=showSearch;
  updateSearch=function(q){
    ui.v55SearchQuery=String(q||'');const box=document.getElementById('searchResults');if(!box)return;
    box.innerHTML=ui.v55SearchQuery.trim().length<2?'<div class="empty"><strong>Search the entire CMMS</strong><span>Enter at least two characters.</span></div>':groupedSearchHtml(ui.v55SearchQuery,4);
  };
  window.updateSearch=updateSearch;

  function renderSearchPage(){
    const q=ui.v55SearchQuery||'';
    return '<div class="v55-search-page">'+pageHead('Global','Search','Search operational records across the connected maintenance system.')+
      '<div class="v55-search-box"><input id="v55FullSearch" value="'+esc(q)+'" placeholder="Search codes, names, work orders, suppliers, users…"><button class="button" data-v55-clear-search>Clear</button></div>'+
      '<div data-v55-full-results>'+(q.trim().length>=2?groupedSearchHtml(q,50):'<div class="v50-empty"><strong>Start with any record identifier</strong><span>Examples: pump, WO-12, bearing, contractor, purchase order or technician name.</span></div>')+'</div></div>';
  }

  const reportDefs={
    backlog:{group:'Maintenance',name:'Work backlog',description:'Active work with age, due date, assignment and priority.',columns:['WO','Title','Asset','Status','Priority','Due','Estimate h'],rows:()=>state.workOrders.filter(w=>safiWorkStatusControl?.(w)!=='CLOSED'&&safiSiteAllowed(w)).map(w=>[w.id,w.title,getAsset(w.assetIds?.[0])?.name||'',w.status,w.priority,w.due||'',Number(w.estimateHours||0)])},
    overdue:{group:'Maintenance',name:'Overdue work',description:'Active jobs past suggested completion.',columns:['WO','Title','Asset','Priority','Due','Days overdue'],rows:()=>{const t=new Date(new Date().toDateString());return state.workOrders.filter(w=>safiWorkStatusControl?.(w)!=='CLOSED'&&w.due&&new Date(w.due)<t&&safiSiteAllowed(w)).map(w=>[w.id,w.title,getAsset(w.assetIds?.[0])?.name||'',w.priority,w.due,Math.max(1,Math.floor((t-new Date(w.due))/86400000))])}},
    assets:{group:'Assets',name:'Asset availability',description:'Operating state, criticality and open work by asset.',columns:['Code','Asset','Type','Criticality','State','Open work'],rows:()=>state.assets.filter(a=>a.type!=='Site'&&safiSiteAllowed(a)).map(a=>[a.code,a.name,a.type,a.criticality||'',a.operatingState||'',state.workOrders.filter(w=>(w.assetIds||[]).includes(a.id)&&safiWorkStatusControl?.(w)!=='CLOSED').length])},
    downtime:{group:'Assets',name:'Downtime history',description:'Downtime reason, duration and linked corrective work.',columns:['Asset','Started','Ended','Reason','Hours','Work order'],rows:()=>state.downtime.filter(d=>safiSiteAllowed(d)).map(d=>[getAsset(d.assetId)?.name||d.assetId,d.startedAt||'',d.endedAt||'',d.reason||d.reasonCode||'',durationHours(d.startedAt,d.endedAt||iso()).toFixed(2),d.workOrderId||''])},
    stock:{group:'Inventory',name:'Stock risk',description:'On-hand quantity compared with configured minimum and maximum.',columns:['Part','Name','On hand','Minimum','Maximum','Unit cost','Value'],rows:()=>state.parts.map(p=>[p.code,p.name,partOnHand(p),Number(p.min||0),Number(p.max||0),Number(p.unitCost||0),(partOnHand(p)*Number(p.unitCost||0)).toFixed(2)])},
    purchases:{group:'Purchasing',name:'Purchase order status',description:'Purchase orders, values, expected dates and receipt progress.',columns:['PO','Supplier','Status','Created','Expected','Value','Receipt %'],rows:()=>state.purchaseOrders.map(p=>{const qty=(p.lines||[]).reduce((n,l)=>n+Number(l.qty||0),0),rec=(p.lines||[]).reduce((n,l)=>n+Number(l.receivedQty||0),0),value=(p.lines||[]).reduce((n,l)=>n+Number(l.qty||0)*Number(l.unitCost||0),0);return[p.id,getVendor(p.vendorId)?.name||state.businesses.find(b=>b.id===p.businessId)?.name||'',p.status,p.createdAt||'',p.expectedDate||'',value.toFixed(2),qty?Math.round(rec/qty*100):0]})},
    labor:{group:'Labour',name:'Logged labour',description:'Actual hours and labour cost by work order and person.',columns:['WO','Person','Hours','Rate','Cost','Date'],rows:()=>state.workOrders.flatMap(w=>(w.labor||[]).map(l=>{const u=getUser(l.userId),rate=Number(u?.hourlyRate||0);return[w.id,u?.name||l.userId,Number(l.hours||0),rate,(Number(l.hours||0)*rate).toFixed(2),l.at||'']}))},
    failures:{group:'Reliability',name:'Failure records',description:'Corrective work with structured Problem → Cause → Action.',columns:['WO','Asset','Problem','Cause','Action','Completed'],rows:()=>state.workOrders.filter(w=>w.failureCodes&&w.failureCodes.problem&&w.failureCodes.problem!=='Not selected').map(w=>[w.id,getAsset(w.assetIds?.[0])?.name||'',w.failureCodes.problem,w.failureCodes.cause,w.failureCodes.action,w.completedAt||''])}
  };

  function reportLibrary(){
    const groups={};Object.entries(reportDefs).forEach(([id,r])=>(groups[r.group]??=[]).push([id,r]));
    return '<div class="v50-page">'+pageHead('Reports','Report library','Operational reports use the same connected records as assets, work, inventory and purchasing.')+
      Object.entries(groups).map(([group,defs])=>'<section><div class="v50-group-title">'+esc(group)+'</div><div class="v55-report-grid">'+defs.map(([id,r])=>'<button class="v55-report-card" data-v55-report="'+id+'"><small>'+esc(group)+'</small><strong>'+esc(r.name)+'</strong><p>'+esc(r.description)+'</p></button>').join('')+'</div></section>').join('')+'</div>';
  }
  function reportFilteredRows(def){
    const from=ui.v55ReportFrom,to=ui.v55ReportTo;
    if(!from&&!to)return def.rows();
    const rows=def.rows();
    // Date filtering is intentionally conservative: any ISO-like value in a row may qualify.
    return rows.filter(row=>{const dates=row.filter(v=>/^\d{4}-\d{2}-\d{2}/.test(String(v||''))).map(v=>String(v).slice(0,10));if(!dates.length)return true;return dates.some(d=>(!from||d>=from)&&(!to||d<=to))});
  }
  function reportViewer(){
    const def=reportDefs[ui.v55ReportId]||reportDefs.backlog,rows=reportFilteredRows(def);
    return '<div class="v50-page">'+pageHead('Reports',def.name,def.description,'<button class="button" data-route="reports">← Report library</button><button class="button primary" data-v55-export-report>Export CSV</button>')+
      '<div class="v55-report-controls"><label>From <input type="date" data-v55-report-from value="'+esc(ui.v55ReportFrom||'')+'"></label><label>To <input type="date" data-v55-report-to value="'+esc(ui.v55ReportTo||'')+'"></label><span class="grow"></span><span class="v50-pill">'+rows.length+' rows</span></div>'+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr>'+def.columns.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v??'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></div>';
  }
  function exportReport(){
    const def=reportDefs[ui.v55ReportId]||reportDefs.backlog,rows=reportFilteredRows(def),escapeCsv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    const csv=[def.columns.map(escapeCsv).join(','),...rows.map(r=>r.map(escapeCsv).join(','))].join('\n'),blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='safimaint-'+(ui.v55ReportId||'report')+'-'+day(0)+'.csv';a.click();URL.revokeObjectURL(url);addAudit('REPORT_EXPORTED',ui.v55ReportId||'report',rows.length+' rows');saveState();toast('Report exported');
  }

  function conflictBackup(){
    try{return JSON.parse(localStorage.getItem(CONFLICT_KEY)||'null')}catch(_ignored){return null}
  }
  function syncCenter(){
    const sync=typeof safiSync!=='undefined'?safiSync:{mode:'device',revision:0,pending:[],apiAvailable:false,lastError:'Shared adapter not loaded'},backup=conflictBackup(),online=navigator.onLine;
    const mode=sync.mode==='error'?'error':online?'':'offline';
    return '<div class="v50-page">'+pageHead('Field & synchronization','Offline / sync centre','Know exactly what is stored on this device, what is shared, and whether a conflict copy exists.','<button class="button" data-v55-sync-retry>Retry shared sync</button>')+
      '<div class="v55-offline-banner '+mode+'"><i></i><span><strong>'+(online?'Network available':'Device is offline')+'</strong><small>'+esc(syncLabel?.()||sync.mode)+' · '+esc(sync.lastError||'Field cache ready')+'</small></span></div>'+
      '<div class="v55-state-grid"><div><small>Mode</small><strong>'+esc(sync.mode||'device')+'</strong></div><div><small>Server API</small><strong>'+(sync.apiAvailable?'Available':'Not connected')+'</strong></div><div><small>Shared revision</small><strong>'+Number(sync.revision||0)+'</strong></div><div><small>Queued snapshots</small><strong>'+Number(sync.pending?.length||0)+'</strong></div></div>'+
      '<div class="v50-grid"><section class="v55-state-card"><h3>Device data</h3><p>SafiMaintain keeps an operational browser cache for field continuity. When the shared API is available, a validated snapshot is synchronized using optimistic concurrency.</p><div class="v50-command-actions" style="margin-top:9px"><button class="button" data-v55-export-device>Export device backup</button>'+(sync.apiAvailable?'<button class="button primary" data-v55-pull-server>Reload shared state</button>':'')+'</div></section>'+
      '<section class="v55-state-card"><h3>Identity & permissions</h3><p>'+(sync.identity?esc(sync.identity.email||sync.identity.name||'Signed in'):'Device-mode identity')+'</p><p>'+[...localPermissions()].sort().map(x=>'<span class="v50-pill">'+esc(x)+'</span>').join(' ')+'</p></section></div>'+
      (backup?'<section class="v55-conflict"><strong>Conflict recovery copy available</strong><p>Another device saved before this device. SafiMaintain preserved the unsynced local snapshot before loading the shared version. Recovery replaces the current device copy only; it does not silently overwrite the server.</p><div class="v50-command-actions"><button class="button" data-v55-download-conflict>Download recovery JSON</button><button class="button" data-v55-restore-conflict>Load recovery copy on device</button><button class="button danger" data-v55-discard-conflict>Discard recovery copy</button></div><small>Saved '+dateTimeFmt(backup.savedAt)+'</small></section>':'<section class="v55-state-card"><h3>No unresolved conflict copy</h3><p>If another device wins an optimistic-concurrency race, SafiMaintain preserves this device’s unsynced state here before loading server data.</p></section>')+
      '</div>';
  }

  function fieldHome(){
    const u=currentUser(),jobs=state.workOrders.filter(w=>safiWorkStatusControl?.(w)!=='CLOSED'&&safiSiteAllowed(w)&&((w.assigneeIds||[]).includes(u?.id)||(u?.groupIds||[]).includes(w.assigneeGroupId))),offline=state.assets.filter(a=>a.operatingState==='Offline'&&safiSiteAllowed(a)).length;
    return '<div class="v55-mobile"><section class="v55-mobile-hero"><small>Field home · '+esc(safiActiveSite?.()?.name||'Current site')+'</small><h1>'+esc((u?.name||'Technician').split(' ')[0])+'’s shift</h1><p>'+jobs.length+' assigned open work · '+offline+' offline assets · '+(navigator.onLine?'network available':'offline device mode')+'</p></section>'+
      '<div class="v55-mobile-actions"><button class="v55-touch" data-route="operator-portal"><em>🔧</em><b>My work</b><span>Open assigned work orders and execute tasks.</span></button><button class="v55-touch" data-v55-field-scan><em>▦</em><b>Scan asset / WO</b><span>Open equipment, part or work order by QR/barcode.</span></button><button class="v55-touch" data-route="request-portal"><em>＋</em><b>Report an issue</b><span>Create a low-friction maintenance request.</span></button><button class="v55-touch" data-route="assets"><em>◫</em><b>Assets</b><span>Search equipment, history, meters and documents.</span></button><button class="v55-touch" data-route="inventory"><em>▣</em><b>Parts</b><span>Check stock and issue materials to work.</span></button><button class="v55-touch" data-route="sync-center"><em>↻</em><b>Offline / sync</b><span>See device state, queue and conflict recovery.</span></button></div>'+
      '<section class="v50-card"><div class="v50-card-head"><div><h2>Next assigned jobs</h2><p>Tap to open the complete work record</p></div></div><div class="v53-operator-work">'+jobs.sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999'))).slice(0,8).map(w=>'<div class="v53-operator-job"><span><strong>'+esc(w.id)+' · '+esc(w.title)+'</strong><small>'+esc(getAsset(w.assetIds?.[0])?.name||'No asset')+' · '+esc(w.priority)+' · '+dateFmt(w.due)+'</small></span><button class="button small primary" data-open-work="'+esc(w.id)+'">Open</button></div>').join('')+(jobs.length?'':'<div class="v50-empty"><strong>No assigned open work</strong><span>New assignments appear here after synchronization.</span></div>')+'</div></section></div>';
  }

  function localizationPage(){
    const l=state.meta.localization||{};
    return '<div class="v50-page">'+pageHead('Settings','Localization','Configure how SafiMaintain displays currency, dates and time for this workspace.')+
      '<section class="v55-state-card"><div class="v55-locale"><label>Locale<select id="v55Locale"><option value="en-GH" '+(l.locale==='en-GH'?'selected':'')+'>English — Ghana</option><option value="en-GB" '+(l.locale==='en-GB'?'selected':'')+'>English — United Kingdom</option><option value="en-US" '+(l.locale==='en-US'?'selected':'')+'>English — United States</option><option value="fr-FR" '+(l.locale==='fr-FR'?'selected':'')+'>Français — France</option></select></label><label>Currency<select id="v55Currency"><option '+(l.currency==='GHS'?'selected':'')+'>GHS</option><option '+(l.currency==='USD'?'selected':'')+'>USD</option><option '+(l.currency==='EUR'?'selected':'')+'>EUR</option><option '+(l.currency==='GBP'?'selected':'')+'>GBP</option></select></label><label>Timezone<input id="v55Timezone" value="'+esc(l.timezone||'Africa/Accra')+'"></label><label>Date style<select id="v55DateStyle"><option value="medium" '+(l.dateStyle==='medium'?'selected':'')+'>Medium</option><option value="short" '+(l.dateStyle==='short'?'selected':'')+'>Short</option><option value="long" '+(l.dateStyle==='long'?'selected':'')+'>Long</option></select></label></div><div class="v50-command-actions" style="margin-top:10px"><button class="button primary" data-v55-save-locale>Save localization</button></div></section></div>';
  }

  function errorPage(err){
    return '<div class="v55-error"><h2>This view could not be rendered</h2><p>SafiMaintain kept your current records unchanged. You can return home, retry the page, or export the workspace if the issue repeats.</p><pre>'+esc(err?.stack||err?.message||String(err))+'</pre><div class="v50-command-actions"><button class="button" data-route="dashboard">Home</button><button class="button primary" data-v55-retry-render>Retry</button></div></div>';
  }

  const oldTitle=routeTitle;
  routeTitle=function(){const map={'search-results':'Search','report-viewer':'Report','sync-center':'Offline / sync','field-home':'Field home',localization:'Localization'};return map[ui.route]||oldTitle()};
  window.routeTitle=routeTitle;

  const oldNav=simpleNavigation;
  simpleNavigation=function(){
    oldNav();
    const everyday=document.querySelector('.v50-nav-core');if(everyday&&!everyday.querySelector('[data-route="field-home"]'))everyday.insertAdjacentHTML('beforeend','<button class="nav-item" data-route="field-home"><span class="nav-icon">'+navIcon('work')+'</span><span>Field home</span></button>');
    const settings=[...document.querySelectorAll('.v50-nav-group')].find(x=>x.querySelector('summary')?.textContent.trim()==='Settings')?.querySelector('div');
    if(settings&&!settings.querySelector('[data-route="sync-center"]'))settings.insertAdjacentHTML('beforeend','<button class="nav-item" data-route="sync-center"><span class="nav-icon">'+navIcon('history')+'</span><span>Offline / sync</span></button><button class="nav-item" data-route="localization"><span class="nav-icon">'+navIcon('sites')+'</span><span>Localization</span></button>');
  };
  window.simpleNavigation=simpleNavigation;

  const priorRender=render;
  render=function(){
    try{
      const required=routePermission[ui.route];
      if(required&&!can(required)){
        const view=document.getElementById('appView');view.innerHTML=deniedPage(required);document.title=routeTitle()+' · SafiMaintain';simpleNavigation();syncSimpleShell();document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===ui.route));return;
      }
      priorRender();
      let html=null;
      if(ui.route==='search-results')html=renderSearchPage();
      else if(ui.route==='reports')html=reportLibrary();
      else if(ui.route==='report-viewer')html=reportViewer();
      else if(ui.route==='sync-center')html=syncCenter();
      else if(ui.route==='field-home')html=fieldHome();
      else if(ui.route==='localization')html=localizationPage();
      if(html!==null){const view=document.getElementById('appView');view.innerHTML=html;document.title=routeTitle()+' · SafiMaintain';document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===ui.route))}
      simpleNavigation();syncSimpleShell();applyActionPermissions();
    }catch(err){
      console.error(err);document.getElementById('appView').innerHTML=errorPage(err);simpleNavigation();syncSimpleShell();
    }
  };
  window.render=render;

  function lock(selector,permission,label){
    if(can(permission))return;document.querySelectorAll(selector).forEach(el=>{el.disabled=true;el.classList.add('v55-action-locked');el.title='Requires '+permission;el.setAttribute('aria-label',(el.getAttribute('aria-label')||label||el.textContent.trim())+' — requires '+permission)});
  }
  function applyActionPermissions(){
    lock('[data-action="new-work"],#newWorkButton','work.manage','Create work');
    lock('[data-action="add-user"]','admin.people','Add person');
    lock('[data-action="add-pm"],[data-v52-new-pm]','pm.manage','Create scheduled maintenance');
    lock('[data-action="global-stock-move"]','inventory.manage','Move stock');
    lock('[data-v51-new-rfq]','purchase.manage','Create RFQ');
    lock('[data-v51-new-workflow]','admin.notifications','Create automation');
  }

  function openResult(kind,id,route){
    closeModal();if(kind==='Asset'){ui.selectedAsset=id;ui.assetView='record';ui.assetRecordTab='general';go('assets');return}
    if(kind==='Work order'){go('work-orders');setTimeout(()=>openWorkDrawer(id),0);return}
    if(kind==='Part'){ui.selectedPart=id;go('inventory');return}
    if(kind==='Request'){go('requests');setTimeout(()=>document.querySelector('[data-v52-open-request="'+CSS.escape(id)+'"]')?.click(),0);return}
    if(kind==='Scheduled maintenance'){go('pm');return}
    go(route||'dashboard');
  }

  document.addEventListener('input',e=>{
    if(e.target.id==='v55FullSearch'){ui.v55SearchQuery=e.target.value;const box=document.querySelector('[data-v55-full-results]');if(box)box.innerHTML=ui.v55SearchQuery.trim().length>=2?groupedSearchHtml(ui.v55SearchQuery,50):'<div class="v50-empty"><strong>Start with any record identifier</strong><span>Examples: pump, WO-12, bearing, contractor, purchase order or technician name.</span></div>'}
  },true);
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-v55-report-from]')){ui.v55ReportFrom=e.target.value;render()}
    if(e.target.matches('[data-v55-report-to]')){ui.v55ReportTo=e.target.value;render()}
  },true);
  document.addEventListener('click',async e=>{
    const result=e.target.closest('[data-v55-result]');if(result){e.preventDefault();e.stopImmediatePropagation();const [kind,id,route]=result.dataset.v55Result.split('|');openResult(kind,id,route);return}
    if(e.target.closest('[data-v55-search-page]')){e.preventDefault();e.stopImmediatePropagation();const q=document.querySelector('#searchForm [name="q"]')?.value||ui.v55SearchQuery;ui.v55SearchQuery=q;closeModal();go('search-results');return}
    if(e.target.closest('[data-v55-clear-search]')){e.preventDefault();e.stopImmediatePropagation();ui.v55SearchQuery='';render();return}
    const report=e.target.closest('[data-v55-report]');if(report){e.preventDefault();e.stopImmediatePropagation();ui.v55ReportId=report.dataset.v55Report;ui.v55ReportFrom='';ui.v55ReportTo='';go('report-viewer');return}
    if(e.target.closest('[data-v55-export-report]')){e.preventDefault();e.stopImmediatePropagation();exportReport();return}
    if(e.target.closest('[data-v55-field-scan]')){e.preventDefault();e.stopImmediatePropagation();showScanner();return}
    if(e.target.closest('[data-v55-sync-retry]')){e.preventDefault();e.stopImmediatePropagation();if(typeof startSync==='function'){toast('Retrying shared service…');await startSync();await refreshSharedPermissions();render()}return}
    if(e.target.closest('[data-v55-pull-server]')){e.preventDefault();e.stopImmediatePropagation();try{await pullServer();toast('Shared state reloaded')}catch(err){toast(err.message)}return}
    if(e.target.closest('[data-v55-export-device]')){e.preventDefault();e.stopImmediatePropagation();exportData();return}
    if(e.target.closest('[data-v55-download-conflict]')){e.preventDefault();e.stopImmediatePropagation();const b=conflictBackup();if(!b)return;const blob=new Blob([JSON.stringify(b,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='safimaint-conflict-recovery-'+day(0)+'.json';a.click();URL.revokeObjectURL(url);return}
    if(e.target.closest('[data-v55-restore-conflict]')){e.preventDefault();e.stopImmediatePropagation();const b=conflictBackup();if(!b?.state)return;state=structuredClone(b.state);localSaveState?.();toast('Recovery copy loaded on this device. Review before syncing.');render();return}
    if(e.target.closest('[data-v55-discard-conflict]')){e.preventDefault();e.stopImmediatePropagation();localStorage.removeItem(CONFLICT_KEY);render();toast('Recovery copy discarded');return}
    if(e.target.closest('[data-v55-save-locale]')){e.preventDefault();e.stopImmediatePropagation();const loc={locale:document.getElementById('v55Locale')?.value||'en-GH',currency:document.getElementById('v55Currency')?.value||'GHS',timezone:document.getElementById('v55Timezone')?.value.trim()||'Africa/Accra',dateStyle:document.getElementById('v55DateStyle')?.value||'medium'};try{new Intl.DateTimeFormat(loc.locale,{timeZone:loc.timezone}).format(new Date())}catch(_err){toast('Timezone is not valid');return}state.meta.localization=loc;window.SafiLocalization=loc;addAudit('LOCALIZATION_UPDATED','WORKSPACE',loc.locale+' · '+loc.currency+' · '+loc.timezone);saveState();render();toast('Localization saved');return}
    if(e.target.closest('[data-v55-retry-render]')){e.preventDefault();e.stopImmediatePropagation();render();return}
  },true);

  // Make the persistent top search open the expanded search experience.
  document.getElementById('globalSearchButton')?.addEventListener('contextmenu',e=>{e.preventDefault();ui.v55SearchQuery='';go('search-results')});

  render();
})();
