'use strict';

// SafiMaintain document-aligned platform core v50.
// Establishes the connected CMMS data model, site context and complete-but-grouped navigation.
(function(){
  const arrays={
    projects:[],assetMoves:[],bomGroups:[],rfqs:[],receipts:[],businesses:[],taskGroups:[],
    failureCodeDefinitions:[],assetCategories:[],priorityDefinitions:[],maintenanceTypeDefinitions:[],
    meterUnits:[],workCustomFieldDefinitions:[],assetCustomFieldDefinitions:[],workflowRules:[],
    integrationConnections:[],savedReports:[],importJobs:[],exportJobs:[],workSavedFilters:[]
  };
  const defaults={
    assetCategories:[
      {id:'CAT-FAC',name:'Facility',kind:'Location',active:true},
      {id:'CAT-AREA',name:'Area / Room',kind:'Location',active:true},
      {id:'CAT-EQUIP',name:'Equipment',kind:'Maintainable',active:true},
      {id:'CAT-SUB',name:'Subassembly',kind:'Maintainable',active:true},
      {id:'CAT-TOOL',name:'Tool',kind:'Maintainable',active:true},
      {id:'CAT-VEH',name:'Vehicle / Rotating asset',kind:'Rotating',active:true}
    ],
    priorityDefinitions:[
      {id:'PRI-EMERGENCY',name:'Emergency',level:5,responseMinutes:15,targetHours:2,color:'red',active:true},
      {id:'PRI-CRITICAL',name:'Critical',level:4,responseMinutes:30,targetHours:4,color:'red',active:true},
      {id:'PRI-HIGH',name:'High',level:3,responseMinutes:120,targetHours:24,color:'amber',active:true},
      {id:'PRI-MEDIUM',name:'Medium',level:2,responseMinutes:480,targetHours:72,color:'blue',active:true},
      {id:'PRI-LOW',name:'Low',level:1,responseMinutes:1440,targetHours:168,color:'gray',active:true}
    ],
    maintenanceTypeDefinitions:[
      {id:'MT-PM',name:'Preventive',class:'Planned',active:true},{id:'MT-PRED',name:'Predictive',class:'Planned',active:true},
      {id:'MT-CORR',name:'Corrective',class:'Reactive',active:true},{id:'MT-EMER',name:'Emergency',class:'Reactive',active:true},
      {id:'MT-INSP',name:'Inspection',class:'Planned',active:true},{id:'MT-SAFE',name:'Safety',class:'Planned',active:true},
      {id:'MT-ELEC',name:'Electrical',class:'Mixed',active:true},{id:'MT-CAL',name:'Calibration',class:'Planned',active:true},
      {id:'MT-PROJ',name:'Project',class:'Planned',active:true},{id:'MT-METER',name:'Meter Reading',class:'Planned',active:true}
    ],
    meterUnits:[
      {id:'MU-H',name:'Hours',symbol:'h',active:true},{id:'MU-CYCLE',name:'Cycles',symbol:'cycles',active:true},
      {id:'MU-START',name:'Starts',symbol:'starts',active:true},{id:'MU-KM',name:'Kilometres',symbol:'km',active:true},
      {id:'MU-BAR',name:'Pressure',symbol:'bar',active:true},{id:'MU-C',name:'Temperature',symbol:'°C',active:true},
      {id:'MU-KWH',name:'Energy',symbol:'kWh',active:true},{id:'MU-M3',name:'Volume',symbol:'m³',active:true}
    ],
    failureCodeDefinitions:[
      {id:'FC-VIB',problem:'Excessive vibration',causes:[{id:'CAUSE-MIS',name:'Misalignment',actions:['Realign','Replace coupling']},{id:'CAUSE-BRG',name:'Bearing wear',actions:['Lubricate','Replace bearing']}]},
      {id:'FC-LEAK',problem:'Leak',causes:[{id:'CAUSE-SEAL',name:'Seal failure',actions:['Replace seal','Inspect shaft']},{id:'CAUSE-LOOSE',name:'Loose connection',actions:['Tighten','Replace fitting']}]},
      {id:'FC-HEAT',problem:'Overheating',causes:[{id:'CAUSE-COOL',name:'Blocked cooling',actions:['Clean cooling path','Replace filter']},{id:'CAUSE-LOAD',name:'Overload',actions:['Reduce load','Investigate process']}]}
    ]
  };

  function ensureSpecState(){
    let changed=false;
    Object.entries(arrays).forEach(([key,value])=>{if(!Array.isArray(state[key])){state[key]=structuredClone(value);changed=true}});
    Object.entries(defaults).forEach(([key,value])=>{if(!state[key].length){state[key]=structuredClone(value);changed=true}});
    state.meta=state.meta||{};
    if(!state.meta.activeSiteId&&state.sites?.[0]){state.meta.activeSiteId=state.sites[0].id;changed=true}
    state.users.forEach(u=>{
      if(!Array.isArray(u.siteIds)){u.siteIds=state.sites.map(s=>s.id);changed=true}
      if(u.weeklyCapacityHours===undefined){u.weeklyCapacityHours=40;changed=true}
    });
    state.assets.forEach(a=>{
      if(a.rotating===undefined){a.rotating=['Tool','Vehicle','Portable equipment','Rotating asset'].includes(a.type);changed=true}
      if(!Array.isArray(a.businessLinks)){a.businessLinks=[];changed=true}
      if(!a.customFields){a.customFields={};changed=true}
    });
    state.workOrders.forEach(w=>{
      if(w.projectId===undefined){w.projectId=null;changed=true}
      if(w.suggestedStart===undefined){w.suggestedStart=w.createdAt?.slice?.(0,10)||day(0);changed=true}
      if(w.actualStart===undefined){w.actualStart=null;changed=true}
      if(!w.customFields){w.customFields={};changed=true}
      (w.tasks||[]).forEach(t=>{
        if(t.estimateHours===undefined){t.estimateHours=0;changed=true}
        if(t.suggestedStart===undefined){t.suggestedStart=null;changed=true}
        if(t.assigneeGroupId===undefined){t.assigneeGroupId=null;changed=true}
      });
    });
    state.scheduledMaintenance.forEach(pm=>{
      if(!Array.isArray(pm.assetIds)){pm.assetIds=pm.assetId?[pm.assetId]:[];changed=true}
      if(!Array.isArray(pm.triggers)){
        pm.triggers=[{id:uid('TRG'),type:pm.triggerType||'Time',description:pm.trigger||'',nextDue:pm.nextDue||'',active:true,satisfied:false}];changed=true
      }
      if(!pm.triggerLogic){pm.triggerLogic='ANY';changed=true}
      if(!Array.isArray(pm.includeTaskGroupIds)){pm.includeTaskGroupIds=[];changed=true}
      if(pm.paused===undefined){pm.paused=pm.status==='Paused';changed=true}
    });
    if(changed)saveState();
  }
  window.ensureSpecState=ensureSpecState;
  ensureSpecState();

  function activeSite(){return state.sites.find(s=>s.id===state.meta.activeSiteId)||state.sites[0]||null}
  function siteAllowed(record){
    const site=activeSite();if(!site)return true;
    if(record.siteId)return record.siteId===site.id;
    if(record.assetId)return getAsset(record.assetId)?.siteId===site.id;
    if(record.assetIds?.length)return record.assetIds.some(id=>getAsset(id)?.siteId===site.id);
    return true;
  }
  window.safiActiveSite=activeSite;
  window.safiSiteAllowed=siteAllowed;

  const oldRouteTitle=routeTitle;
  const titles={
    'asset-register':'Asset register',equipment:'Equipment',facilities:'Facilities',tools:'Tools','rotating-assets':'Rotating assets','asset-events':'Asset events',
    'task-groups':'Task groups / SOPs',projects:'Projects','failure-analysis':'Failure analysis','work-insights':'Work order insights',
    'stock-locations':'Stock locations','bom-groups':'BOM groups','parts-forecaster':'Parts forecaster',businesses:'Businesses / suppliers',
    'purchase-requests':'Purchase requests',rfqs:'RFQs',receipts:'Receipts',reports:'Reports',analytics:'Analytics','labor-availability':'Labour availability',
    'meter-analytics':'Meter analytics','purchase-analytics':'Purchasing analytics',groups:'User groups',permissions:'Permissions',
    'asset-categories':'Asset categories',priorities:'Priorities','maintenance-types':'Maintenance types','wo-statuses':'Work-order statuses',
    'failure-codes':'Failure codes','meter-units':'Meter units','event-types':'Asset event types','custom-fields':'Custom fields',workflows:'Workflow automation',
    import:'Import',export:'Export',integrations:'API / integrations'
  };
  routeTitle=function(){return titles[ui.route]||oldRouteTitle()};
  window.routeTitle=routeTitle;

  function item(route,label,icon,badge=''){
    return '<button class="nav-item" data-route="'+route+'"><span class="nav-icon">'+navIcon(icon)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'</button>';
  }
  function group(label,open,items){
    return '<details class="v50-nav-group" '+(open?'open':'')+'><summary>'+label+'</summary><div>'+items.join('')+'</div></details>';
  }
  simpleNavigation=function(){
    const nav=document.getElementById('navigation');if(!nav)return;
    const site=activeSite();
    nav.innerHTML=
      '<div class="v50-site-context"><i></i><div><strong>'+esc(site?.name||'No active site')+'</strong><small>Current operating context</small></div></div>'+
      '<section class="v50-nav-core"><p>Everyday</p>'+
        item('dashboard','Home','home')+
        item('work-orders','Work','work','workBadge')+
        item('assets','Assets','assets','offlineBadge')+
        item('inventory','Stock & parts','stock','stockBadge')+
        item('people','Team','team')+
      '</section>'+
      '<section id="advancedNav" class="advanced-nav">'+
        group('Assets',true,[
          item('asset-register','Asset register','assets'),item('assets','Asset hierarchy','assets'),item('equipment','Equipment','assets'),
          item('facilities','Facilities','sites'),item('tools','Tools','tools'),item('rotating-assets','Rotating assets','history'),
          item('meters','Meter readings','meters'),item('asset-events','Asset events','alerts'),item('downtime','Downtime','downtime')
        ])+
        group('Maintenance',true,[
          item('requests','Work requests','requests','requestBadge'),item('work-orders','Work orders','work','workBadge'),item('calendar','Calendar / planner','calendar'),
          item('pm','Scheduled maintenance','pm'),item('task-groups','Task groups / SOPs','count'),item('projects','Projects','planning'),
          item('failure-analysis','Failure analysis','reports'),item('work-insights','Work insights','reports')
        ])+
        group('Parts & inventory',false,[
          item('inventory','Parts & supplies','stock','stockBadge'),item('stock-locations','Stock locations','sites'),item('transactions','Stock history','history'),
          item('counts','Cycle counts','count'),item('bom-groups','BOM groups','assets'),item('parts-forecaster','Parts forecaster','reports'),
          item('businesses','Businesses / suppliers','suppliers'),item('tool-crib','Tool crib','tools')
        ])+
        group('Purchasing',false,[
          item('planning','Planning board','planning','purchaseBadge'),item('purchase-requests','Purchase requests','requests'),
          item('rfqs','RFQs','suppliers'),item('purchase-orders','Purchase orders','purchase'),item('receipts','Receipts','stock')
        ])+
        group('Reports & analytics',false,[
          item('reports','Report library','reports'),item('analytics','Analytics','reports'),item('reliability','Reliability','reports'),
          item('labor-availability','Labour availability','team'),item('meter-analytics','Meter analytics','meters'),item('purchase-analytics','Purchasing analytics','purchase')
        ])+
        group('People & access',false,[item('people','Users','team'),item('groups','User groups','team'),item('roles','Roles','roles'),item('permissions','Permissions','security')])+
        group('Settings',false,[
          item('sites','Sites & stores','sites'),item('asset-categories','Asset categories','assets'),item('priorities','Priorities','alerts'),
          item('maintenance-types','Maintenance types','work'),item('wo-statuses','WO statuses','work'),item('failure-codes','Failure codes','reports'),
          item('meter-units','Meter units','meters'),item('event-types','Asset event types','alerts'),item('custom-fields','Custom fields','assets'),
          item('notifications','Notifications','alerts','alertBadge'),item('workflows','Workflow automation','pm'),item('import','Import','history'),
          item('export','Export','history'),item('integrations','API / integrations','security'),item('audit','Audit trail','audit'),item('security','Security','security')
        ])+
      '</section><button class="more-tools-toggle" id="advancedToggle" type="button"></button>';
    const show=localStorage.getItem(SIMPLE_ADVANCED_KEY)==='true';setAdvanced(show);
    document.getElementById('advancedToggle')?.addEventListener('click',()=>setAdvanced(!document.body.classList.contains('show-advanced')));
  };
  window.simpleNavigation=simpleNavigation;

  function showSiteSelector(){
    const user=currentUser(),allowed=(user?.siteIds?.length?state.sites.filter(s=>user.siteIds.includes(s.id)):state.sites);
    openModal({eyebrow:'Operating context',title:'Choose site',body:'<div class="v50-site-select">'+allowed.map(s=>'<button type="button" data-v50-site="'+esc(s.id)+'"><strong>'+esc(s.name)+'</strong><small>'+esc(s.region||'')+' · '+esc(s.timezone||'')+'</small></button>').join('')+'</div>'});
  }
  document.getElementById('siteButton')?.addEventListener('click',showSiteSelector);
  document.addEventListener('click',e=>{
    const s=e.target.closest('[data-v50-site]');if(!s)return;
    state.meta.activeSiteId=s.dataset.v50Site;saveState();closeModal();simpleNavigation();syncSimpleShell();render();toast('Site context changed');
  },true);

  function dashboardV50(){
    const site=activeSite(),assets=state.assets.filter(a=>a.type!=='Site'&&siteAllowed(a)),work=state.workOrders.filter(siteAllowed);
    const control=w=>typeof window.safiWorkStatusControl==='function'?window.safiWorkStatusControl(w):(['Completed','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE');
    const active=work.filter(w=>control(w)==='ACTIVE'),overdue=active.filter(w=>w.due&&new Date(w.due)<new Date(new Date().toDateString()));
    const critical=active.filter(w=>['Critical','Emergency','Highest'].includes(w.priority)),offline=assets.filter(a=>a.operatingState==='Offline');
    const duePm=state.scheduledMaintenance.filter(pm=>!pm.paused&&pm.status!=='Paused'&&(pm.assetIds||[pm.assetId]).some(id=>siteAllowed(getAsset(id)||{}))).filter(pm=>{const d=pm.triggers?.find(t=>t.type==='Time')?.nextDue||pm.nextDue;return /^\d{4}-\d{2}-\d{2}$/.test(String(d||''))&&d<=day(7)}); 
    const low=state.parts.filter(p=>p.locations?.some(l=>getStore(l.storeId)?.siteId===site?.id)&&partOnHand(p)<Number(p.min||0));
    const pendingBuy=state.purchaseRequests.filter(r=>!['Received','Closed','Cancelled','Rejected'].includes(r.status));
    const completed=work.filter(w=>control(w)==='CLOSED'&&w.status==='Completed');
    const planned=completed.filter(w=>['Preventive','Inspection','Predictive','Calibration','Meter Reading'].includes(w.type)).length;
    const pmPct=completed.length?Math.round(planned/completed.length*100):100;
    const maintenanceCost=work.reduce((n,w)=>n+(w.labor||[]).reduce((a,x)=>a+Number(x.hours||0)*Number(getUser(x.userId)?.hourlyRate||0),0)+(w.parts||[]).reduce((a,x)=>a+Number(x.actual||0)*Number(getPart(x.partId)?.unitCost||0),0)+(w.miscCosts||[]).reduce((a,x)=>a+Number(x.amount||0),0),0);
    const risks=[
      ...overdue.slice(0,4).map(w=>({level:'bad',title:w.id+' · '+w.title,detail:(getAsset(w.assetIds?.[0])?.name||'No asset')+' · '+Math.max(1,Math.floor((Date.now()-new Date(w.due))/86400000))+'d overdue',route:'work-orders'})),
      ...offline.slice(0,3).map(a=>({level:'bad',title:a.code+' · '+a.name+' offline',detail:a.downtimeReason||'Asset unavailable',route:'downtime'})),
      ...low.slice(0,3).map(p=>({level:'warn',title:p.code+' · '+p.name+' low stock',detail:partOnHand(p)+' '+p.uom+' on hand · min '+p.min,route:'planning'}))
    ].slice(0,7);
    const upcoming=active.filter(w=>w.due).sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,7);
    return '<div class="v50-page">'+pageHead('Maintenance command center','Maintenance dashboard',(site?.name||'Current site')+' · connected view of work, assets, PM, stock and purchasing.','<button class="button" data-route="reports">Reports</button><button class="button primary" data-action="new-work">＋ New work</button>')+
      '<div class="v50-kpis">'+
        '<button class="v50-kpi" data-route="work-orders"><small>Open work</small><strong>'+active.length+'</strong><span>'+overdue.length+' overdue</span></button>'+
        '<button class="v50-kpi" data-route="work-orders"><small>Critical / emergency</small><strong>'+critical.length+'</strong><span>Requires priority attention</span></button>'+
        '<button class="v50-kpi" data-route="downtime"><small>Offline assets</small><strong>'+offline.length+'</strong><span>'+assets.length+' maintainable assets</span></button>'+
        '<button class="v50-kpi" data-route="pm"><small>PM due soon</small><strong>'+duePm.length+'</strong><span>'+pmPct+'% planned work mix</span></button>'+
        '<button class="v50-kpi" data-route="planning"><small>Stock / purchasing</small><strong>'+low.length+'</strong><span>'+pendingBuy.length+' open purchase demands</span></button>'+
      '</div>'+
      '<div class="v50-grid"><section class="v50-card"><div class="v50-card-head"><div><h2>Operational exceptions</h2><p>Items that need maintenance attention now</p></div><button class="button small" data-route="work-insights">View insights</button></div><div class="v50-list">'+
        (risks.length?risks.map(r=>'<button class="v50-list-row" data-route="'+r.route+'"><span><strong>'+esc(r.title)+'</strong><small>'+esc(r.detail)+'</small></span><span class="v50-pill '+r.level+'">Review</span></button>').join(''):'<div class="v50-empty"><strong>No urgent exceptions</strong><span>Current tracked operations are within configured thresholds.</span></div>')+
      '</div></section><section class="v50-card"><div class="v50-card-head"><div><h2>Upcoming work</h2><p>Nearest suggested completion dates</p></div><button class="button small" data-route="calendar">Planner</button></div><div class="v50-list">'+
        (upcoming.length?upcoming.map(w=>'<button class="v50-list-row" data-open-work="'+esc(w.id)+'"><span><strong>'+esc(w.id)+' · '+esc(w.title)+'</strong><small>'+esc(getAsset(w.assetIds?.[0])?.name||'No asset')+' · '+esc(w.status)+'</small></span><span>'+dateFmt(w.due)+'</span></button>').join(''):'<div class="v50-empty"><strong>No scheduled work</strong><span>Create a work order or preventive plan.</span></div>')+
      '</div></section></div>'+
      '<div class="v50-grid"><section class="v50-card"><div class="v50-card-head"><div><h2>Maintenance performance</h2><p>Operational consequence of recorded work</p></div><button class="button small" data-route="analytics">Analytics</button></div><div class="v50-card-body">'+
        '<div class="v50-risk"><b>Planned work</b><div><div class="v50-progress"><i style="width:'+pmPct+'%"></i></div><small>'+pmPct+'% of completed work is planned maintenance</small></div><strong>'+planned+'/'+completed.length+'</strong></div>'+
        '<div class="v50-risk"><b>Cost</b><div><strong>Maintenance cost recorded</strong><small>Labor + consumed parts + miscellaneous WO costs</small></div><strong>'+money(maintenanceCost)+'</strong></div>'+
      '</div></section><section class="v50-card"><div class="v50-card-head"><div><h2>System readiness</h2><p>Data that makes downstream planning reliable</p></div></div><div class="v50-card-body"><div class="v50-state-note">Assets drive work; work consumes labour and parts; stock creates purchase demand; closed work updates history, failure knowledge, cost and reliability. Keep those links complete rather than entering isolated records.</div></div></section></div>'+
    '</div>';
  }
  renderDashboard=dashboardV50;window.renderDashboard=dashboardV50;

  const originalRenderV50=render;
  render=function(){ensureSpecState();originalRenderV50();simpleNavigation();syncSimpleShell()};
  window.render=render;
  simpleNavigation();syncSimpleShell();
  if(ui.route==='dashboard')render();
})();