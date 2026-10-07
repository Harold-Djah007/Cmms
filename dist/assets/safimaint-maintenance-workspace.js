'use strict';
// A maintenance-first home: every count has a drill-down and comes from saved records.
(function(){
  const list=v=>Array.isArray(v)?v:[];
  const can=p=>typeof safiCan==='function'&&safiCan(p);
  const isClosed=w=>typeof window.safiWorkStatusControl==='function'?window.safiWorkStatusControl(w)==='CLOSED':['Completed','Closed','Cancelled'].includes(w.status);
  const quantity=p=>list(p.locations).filter(l=>l.active!==false).reduce((n,l)=>n+Number(l.onHand||0),0);
  function overview(){
    const today=day(0),open=list(state.workOrders).filter(w=>!isClosed(w));
    const overdue=open.filter(w=>w.due&&String(w.due).slice(0,10)<today),dueToday=open.filter(w=>String(w.due||'').slice(0,10)===today);
    return {open,overdue,dueToday,mine:open.filter(w=>list(w.assigneeIds).includes(CURRENT_USER)),unassigned:open.filter(w=>!list(w.assigneeIds).length&&!list(w.groupIds).length),
      offline:list(state.assets).filter(a=>a.operatingState==='Offline'),low:list(state.parts).filter(p=>quantity(p)<Number(p.min||0)),
      requests:list(state.requests).filter(r=>r.status==='Requested'),plans:list(state.scheduledMaintenance).filter(p=>!['Paused','Inactive','Completed','Cancelled','Draft'].includes(p.status)&&!p.awaitingCompletionWorkOrderId&&typeof window.safiPmReady==='function'&&safiPmReady(p))};
  }
  window.safiMaintenanceOverview=overview;
  const priorTitle=routeTitle;
  routeTitle=function(){return ({dashboard:'Maintenance overview',requests:'Work requests',assets:'All assets',inventory:'Parts & supplies',transactions:'Stock history',planning:'Reorder list',businesses:'Suppliers & businesses',notifications:'Notifications'})[ui.route]||priorTitle()};window.routeTitle=routeTitle;
  const scopes={open:'Open work',overdue:'Overdue',dueToday:'Due today',mine:'My work',unassigned:'Unassigned'};
  ui.maintenanceScope=ui.maintenanceScope||'open';
  function empty(title,body,action=''){return '<div class="mw-empty"><strong>'+esc(title)+'</strong><p>'+esc(body)+'</p>'+action+'</div>'}
  function metric(scope,label,rows,hint,tone=''){
    return '<button class="mw-metric '+tone+'" data-mw-scope="'+scope+'" aria-pressed="'+(ui.maintenanceScope===scope)+'"><span>'+label+'</span><strong>'+rows.length+'</strong><small>'+hint+'</small></button>';
  }
  function workRow(w){
    const done=list(w.tasks).filter(t=>t.status==='Done').length,assigned=list(w.assigneeIds).map(id=>getUser(id)?.name||id).join(', ')||list(w.groupIds).map(id=>getGroup(id)?.name||id).join(', ')||'Unassigned';
    const assets=list(w.assetIds).map(id=>getAsset(id)?.name||id).join(', ')||'No asset assigned';
    const overdue=w.due&&String(w.due).slice(0,10)<day(0);
    return '<tr data-mw-work="'+esc(w.id)+'"><td><button type="button" data-mw-open-work="'+esc(w.id)+'"><small>'+esc(w.id)+'</small><strong>'+esc(w.title||'Untitled work order')+'</strong></button></td><td>'+esc(assets)+'</td><td>'+esc(assigned)+'</td><td>'+status(w.priority||'Medium')+'</td><td>'+status(w.status||'Open')+'</td><td class="'+(overdue?'mw-overdue':'')+'">'+(w.due?dateFmt(w.due):'No due date')+'</td><td>'+(list(w.tasks).length?done+' / '+w.tasks.length+' done':'No checklist')+'</td></tr>';
  }
  function attentionRow(kind,record,title,note){return '<button class="mw-attention" data-mw-record="'+kind+'" data-record-id="'+esc(record.id)+'"><span><strong>'+esc(title)+'</strong><small>'+esc(note)+'</small></span><span aria-hidden="true">›</span></button>'}
  function home(){
    const data=overview(),scope=scopes[ui.maintenanceScope]?ui.maintenanceScope:'open',query=String(ui.maintenanceSearch||'').trim().toLowerCase();
    const rank={Critical:0,High:1,Medium:2,Low:3};
    const rows=data[scope].filter(w=>[w.id,w.title,...list(w.assetIds).map(id=>getAsset(id)?.name),...list(w.assigneeIds).map(id=>getUser(id)?.name)].join(' ').toLowerCase().includes(query)).sort((a,b)=>(rank[a.priority]??2)-(rank[b.priority]??2)||String(a.due||'9999').localeCompare(String(b.due||'9999')));
    const create=can('work.manage')?'<button class="button primary" data-action="new-work">＋ New work order</button>':'';
    return '<div class="mw-home"><header class="mw-page-heading"><div><h1>Maintenance overview</h1><p>Prioritize today’s work, keep equipment running, and see what needs attention.</p></div><div class="mw-heading-actions">'+(can('work.view')?'<button class="button" data-route="calendar">Maintenance calendar</button>':'')+create+'</div></header>'+
      (can('work.view')?'<section class="mw-metrics" aria-label="Work overview">'+metric('open','Open work orders',data.open,'All work awaiting completion')+metric('overdue','Overdue',data.overdue,'Open work past its due date','mw-risk')+metric('dueToday','Due today',data.dueToday,'Open work scheduled for today')+metric('mine','Assigned to me',data.mine,'Open work assigned to you')+'</section><section class="mw-panel mw-work-panel"><header><div><h2>Work queue</h2><p>Critical work first, then earliest due date.</p></div><button class="mw-link" data-route="work-orders">Open work register →</button></header><div class="mw-queue-tools"><div class="mw-scopes" aria-label="Filter work queue">'+Object.entries(scopes).map(([id,label])=>'<button data-mw-scope="'+id+'" aria-pressed="'+(scope===id)+'">'+label+' <b>'+data[id].length+'</b></button>').join('')+'</div><label><span class="mw-sr-only">Search work queue</span><input data-mw-search value="'+esc(ui.maintenanceSearch||'')+'" placeholder="Search work, asset or assignee"></label></div><div class="mw-table-scroll"><table class="mw-work-table"><thead><tr><th>Work order</th><th>Asset</th><th>Assigned to</th><th>Priority</th><th>Status</th><th>Due date</th><th>Checklist</th></tr></thead><tbody>'+rows.slice(0,12).map(workRow).join('')+'</tbody></table>'+(rows.length?'':empty(query?'No matching work':'No '+scopes[scope].toLowerCase(),query?'Try a different search or queue filter.':'This queue is clear. Choose another filter to see the rest of your work.',scope==='open'?create:''))+'</div><footer>'+Math.min(12,rows.length)+' of '+rows.length+' matching work orders · '+esc(scopes[scope])+'</footer></section>':'')+
      '<div class="mw-attention-grid">'+
      (can('asset.view')?'<section class="mw-panel"><header><div><h2>Equipment attention</h2><p>'+data.offline.length+' offline assets</p></div><button class="mw-link" data-route="assets">All assets →</button></header>'+ (data.offline.length?data.offline.slice(0,5).map(a=>attentionRow('asset',a,(a.code||a.id)+' · '+a.name,'Offline · Review related work and downtime')).join(''):empty(state.assets.length?'No offline assets':'Add your equipment',state.assets.length?'No assets are currently marked offline.':'Start with the equipment your team maintains.','<button class="button" data-route="assets">Open assets</button>'))+'</section>':'')+
      (can('inventory.view')?'<section class="mw-panel"><header><div><h2>Parts to replenish</h2><p>'+data.low.length+' parts below minimum</p></div><button class="mw-link" data-route="planning">Reorder list →</button></header>'+ (data.low.length?data.low.slice(0,5).map(p=>attentionRow('part',p,p.name,quantity(p)+' '+(p.uom||'ea')+' on hand · Minimum '+Number(p.min||0))).join(''):empty(state.parts.length?'No parts below minimum':'Set up your parts',state.parts.length?'All recorded part totals meet their configured minimum.':'Add the parts and stock locations that support your equipment.','<button class="button" data-route="inventory">Open parts & supplies</button>'))+'</section>':'')+
      (can('pm.manage')?'<section class="mw-panel"><header><div><h2>Preventive maintenance</h2><p>'+data.plans.length+' plans ready to generate work</p></div><button class="mw-link" data-route="pm">Maintenance plans →</button></header>'+(data.plans.length?data.plans.slice(0,5).map(p=>attentionRow('plan',p,p.name||p.id,'Trigger reached · Review and generate work')).join(''):empty('No plans ready',state.scheduledMaintenance.length?'Existing plans have not reached their next trigger.':'Create a plan to schedule recurring maintenance.'))+'</section>':'')+
      (can('work.view')?'<section class="mw-panel"><header><div><h2>Incoming requests</h2><p>'+data.requests.length+' awaiting review</p></div><button class="mw-link" data-route="requests">Review requests →</button></header>'+(data.requests.length?data.requests.slice(0,5).map(r=>attentionRow('request',r,r.summary||r.title||r.description||r.id,'Requested · Review before creating work')).join(''):empty('No requests awaiting review','New requests will appear here when submitted.'))+'</section>':'')+
      '</div>'+(!can('work.view')&&!can('asset.view')&&!can('inventory.view')?empty('Your workspace is ready','Use the navigation to open the areas available to your role.'):'')+'</div>';
  }
  renderDashboard=home;window.renderDashboard=home;
  const roots={dashboard:['Workspace','dashboard'],calendar:['Work','work-orders'],'work-orders':['Work','work-orders'],requests:['Work','work-orders'],pm:['Work','work-orders'],assets:['Assets','assets'],equipment:['Assets','assets'],facilities:['Assets','assets'],tools:['Assets','assets'],meters:['Assets','assets'],downtime:['Assets','assets'],inventory:['Inventory','inventory'],'stock-locations':['Inventory','inventory'],'batch-stock':['Inventory','inventory'],counts:['Inventory','inventory'],transactions:['Inventory','inventory'],'bom-groups':['Inventory','inventory'],businesses:['Inventory','inventory'],planning:['Inventory','inventory']};
  function shell(){
    if(document.body.classList.contains('first-run'))return;
    const view=document.getElementById('appView');if(!view||view.querySelector('.mw-breadcrumbs'))return;
    const root=roots[ui.route]||['Workspace','dashboard'],crumb=document.createElement('nav');crumb.className='mw-breadcrumbs';crumb.setAttribute('aria-label','Breadcrumb');
    const part=ui.route==='inventory'&&ui.s80SupplyMode==='record'?getPart(ui.selectedPart):null;
    const asset=ui.route==='assets'&&ui.assetView==='record'?getAsset(ui.selectedAsset):null;
    const names={dashboard:'Maintenance overview',requests:'Work requests',assets:'All assets',inventory:'Parts & supplies',transactions:'Stock history',planning:'Reorder list',businesses:'Suppliers & businesses',notifications:'Notifications'};
    const title=part?'Parts & supplies':asset?'All assets':names[ui.route]||(typeof routeTitle==='function'?routeTitle():'Workspace');
    document.title=(part||asset?(part||asset).name:title)+' · SafiMaintain';
    crumb.innerHTML='<button data-mw-breadcrumb="'+root[1]+'">'+root[0]+'</button><span aria-hidden="true">/</span>'+((part||asset)?'<button data-mw-breadcrumb="'+ui.route+'">'+esc(title)+'</button><span aria-hidden="true">/</span><span aria-current="page">'+esc((part||asset).code|| (part||asset).name)+'</span>':'<span aria-current="page">'+esc(title)+'</span>');
    view.prepend(crumb);
  }
  const previousRender=render;render=function(){const result=previousRender.apply(this,arguments);shell();return result};window.render=render;
  document.addEventListener('click',event=>{
    const scope=event.target.closest('[data-mw-scope]');if(scope){ui.maintenanceScope=scope.dataset.mwScope;render();return}
    const work=event.target.closest('[data-mw-open-work]');if(work&&can('work.view')){openWorkDrawer(work.dataset.mwOpenWork);return}
    const crumb=event.target.closest('[data-mw-breadcrumb]');if(crumb){const route=crumb.dataset.mwBreadcrumb;if(route==='inventory')ui.s80SupplyMode='list';if(route==='assets')ui.assetView='hierarchy';go(route);return}
    const record=event.target.closest('[data-mw-record]');if(!record)return;const id=record.dataset.recordId,kind=record.dataset.mwRecord;
    if(kind==='part'&&can('inventory.view')){ui.selectedPart=id;ui.s80SupplyMode='record';ui.s80SupplyTab='stock';go('inventory')}
    if(kind==='asset'&&can('asset.view')){ui.selectedAsset=id;ui.assetView='record';ui.assetRecordTab='general';go('assets')}
    if(kind==='plan'&&can('pm.manage')){go('pm');document.querySelector('[data-v52-edit-pm="'+CSS.escape(id)+'"]')?.click()}
    if(kind==='request'&&can('work.view')){go('requests');document.querySelector('[data-v52-open-request="'+CSS.escape(id)+'"]')?.click()}
  });
  document.addEventListener('input',event=>{
    if(!event.target.matches('[data-mw-search]'))return;ui.maintenanceSearch=event.target.value;const position=event.target.selectionStart;render();const input=document.querySelector('[data-mw-search]');input?.focus();input?.setSelectionRange(position,position);
  });
  if(typeof document.getElementById==='function'&&document.getElementById('appView'))render();
})();
