'use strict';
(function(){
  const groups=[
    {key:'work',label:'Work',icon:'work',route:'work-orders',badge:'workBadge',items:[
      ['work-orders','Work orders','work','work.view'],
      ['requests','Work requests','requests','work.view'],
      ['pm','Scheduled maintenance','pm','pm.manage'],
      ['calendar','Planner / calendar','calendar','work.view'],
      ['task-groups','Task groups / SOPs','count','work.view'],
      ['projects','Projects','planning','work.view']
    ]},
    {key:'assets',label:'Assets',icon:'assets',route:'assets',badge:'offlineBadge',items:[
      ['assets','All assets / hierarchy','assets','asset.view'],
      ['asset-register','Asset register','assets','asset.view'],
      ['facilities','Facilities','sites','asset.view'],
      ['equipment','Equipment','assets','asset.view'],
      ['tools','Tools','tools','asset.view'],
      ['meters','Meters','meters','asset.view'],
      ['downtime','Downtime','downtime','asset.view']
    ]},
    {key:'stock',label:'Stock & parts',icon:'stock',route:'inventory',badge:'stockBadge',items:[
      ['inventory','Parts & supplies','stock','inventory.view'],
      ['stock-locations','Stock locations','sites','inventory.view'],
      ['transactions','Stock history','history','inventory.view'],
      ['counts','Cycle counts','count','inventory.view'],
      ['bom-groups','BOM groups','assets','inventory.view'],
      ['tool-crib','Tool crib','tools','inventory.view']
    ]},
    {key:'purchasing',label:'Purchasing',icon:'purchase',route:'planning',items:[
      ['planning','Purchase planning','planning','purchase.view'],
      ['businesses','Suppliers / businesses','suppliers','purchase.view'],
      ['purchase-requests','Purchase requests','requests','purchase.view'],
      ['rfqs','RFQs','suppliers','purchase.view'],
      ['purchase-orders','Purchase orders','purchase','purchase.view'],
      ['receipts','Receipts','stock','purchase.view'],
      ['inventory-costing','Inventory costing','reports','inventory.view']
    ]},
    {key:'team',label:'Team',icon:'team',route:'people',items:[
      ['people','People','team','admin.people'],
      ['groups','Groups','team','admin.people'],
      ['labor-availability','Labour availability','team','report.view'],
      ['field-home','Field home','work','work.view']
    ]},
    {key:'reports',label:'Reports',icon:'reports',route:'reports',items:[
      ['reports','Report library','reports','report.view'],
      ['analytics','Analytics','reports','report.view'],
      ['reliability','Reliability','reports','report.view'],
      ['maintenance-outlook','Maintenance outlook','reports','report.view'],
      ['failure-analysis','Failure analysis','reports','report.view']
    ]}
  ];
  const admin=[
    ['sites','Sites & stores','sites','admin.people'],
    ['roles','Roles','roles','admin.people'],
    ['permissions','Permissions','security','admin.people'],
    ['failure-codes','Failure codes','reports','admin.people'],
    ['notifications','Notifications','alerts','admin.notifications'],
    ['workflows','Workflow automation','pm','admin.notifications'],
    ['import','Import','history','admin.people'],
    ['export','Export','history','admin.people'],
    ['audit','Audit trail','audit','admin.people'],
    ['localization','Localization','sites','admin.people'],
    ['sync-center','Offline / sync','history',null],
    ['security','Security','security','admin.people']
  ];
  const routeGroup={dashboard:'home'};groups.forEach(g=>{routeGroup[g.route]=g.key;g.items.forEach(i=>routeGroup[i[0]]=g.key)});admin.forEach(i=>routeGroup[i[0]]='admin');
  function can(p){return !p||typeof safiCan!=='function'||safiCan(p)}
  function ico(name){try{return navIcon(name)}catch(_){return ''}}
  function leaf(item){
    if(!can(item[3]))return'';
    return '<button class="v65-nav-leaf '+(ui.route===item[0]?'active':'')+'" data-route="'+item[0]+'"><span class="nav-icon">'+ico(item[2])+'</span><span>'+item[1]+'</span></button>'
  }
  function openKey(){
    const current=routeGroup[ui.route];
    if(!ui.v65NavOpen)ui.v65NavOpen=current&&current!=='home'?current:'work';
    return ui.v65NavOpen
  }
  simpleNavigation=function(){
    const nav=document.getElementById('navigation');if(!nav)return;const opened=openKey();
    nav.innerHTML='<div class="v65-nav"><div class="v65-nav-caption">Maintenance</div>'+
      '<div class="v65-nav-module '+(ui.route==='dashboard'?'active':'')+'"><div class="v65-nav-head"><button class="v65-nav-main" data-route="dashboard"><span class="nav-icon">'+ico('home')+'</span><span>Home</span></button><span></span></div></div>'+
      groups.map(g=>'<div class="v65-nav-module '+(routeGroup[ui.route]===g.key?'active ':'')+(opened===g.key?'open':'')+'" data-v65-module="'+g.key+'"><div class="v65-nav-head"><button class="v65-nav-main" data-route="'+g.route+'"><span class="nav-icon">'+ico(g.icon)+'</span><span>'+g.label+'</span>'+(g.badge?'<b id="'+g.badge+'"></b>':'')+'</button><button class="v65-nav-toggle" type="button" data-v65-toggle="'+g.key+'" aria-label="Expand '+g.label+'">›</button></div><div class="v65-subnav">'+g.items.map(leaf).join('')+'</div></div>').join('')+
      '<div class="v65-nav-divider"></div><div class="v65-nav-caption">Administration</div><div class="v65-nav-module '+(routeGroup[ui.route]==='admin'?'active ':'')+(opened==='admin'?'open':'')+'" data-v65-module="admin"><div class="v65-nav-head"><button class="v65-nav-main" data-route="security"><span class="nav-icon">'+ico('security')+'</span><span>Settings</span></button><button class="v65-nav-toggle" type="button" data-v65-toggle="admin">›</button></div><div class="v65-subnav">'+admin.map(leaf).join('')+'</div></div></div>'
  };
  window.simpleNavigation=simpleNavigation;

  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-v65-toggle]');if(!t)return;
    e.preventDefault();e.stopImmediatePropagation();
    const key=t.dataset.v65Toggle,module=document.querySelector('[data-v65-module="'+CSS.escape(key)+'"]'),isOpen=module?.classList.contains('open');
    document.querySelectorAll('.v65-nav-module.open').forEach(x=>x.classList.remove('open'));
    ui.v65NavOpen=isOpen?null:key;if(!isOpen)module?.classList.add('open')
  },true);

  function control(w){return typeof safiWorkStatusControl==='function'?safiWorkStatusControl(w):(['Completed','Closed','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE')}
  function dashboard(){
    const site=typeof safiActiveSite==='function'?safiActiveSite():state.sites?.[0],allowed=x=>!site||typeof safiSiteAllowed!=='function'||safiSiteAllowed(x),assets=state.assets.filter(a=>a.type!=='Site'&&allowed(a)),work=state.workOrders.filter(allowed),open=work.filter(w=>control(w)!=='CLOSED'),offline=assets.filter(a=>a.operatingState==='Offline'),over=open.filter(w=>w.due&&w.due<day(0)),critical=open.filter(w=>['Critical','Emergency','Highest'].includes(w.priority)),low=state.parts.filter(p=>partOnHand(p)<Number(p.min||0)),pm=state.scheduledMaintenance.filter(x=>!x.paused&&x.status!=='Paused'&&x.status!=='Archived'),due=pm.filter(x=>{const d=x.triggers?.find(t=>t.type==='Time')?.nextDue||x.nextDue;return /^\d{4}-\d{2}-\d{2}$/.test(String(d||''))&&d<=day(7)}),upcoming=open.filter(w=>w.due).sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,7),activity=(state.audit||[]).slice(0,7),availability=assets.length?Math.round((assets.length-offline.length)/assets.length*100):100,assignment=open.length?Math.round(open.filter(w=>(w.assigneeIds||[]).length||w.assigneeGroupId).length/open.length*100):100,stock=state.parts.length?Math.round(state.parts.filter(p=>partOnHand(p)>=Number(p.min||0)).length/state.parts.length*100):100;
    const statusCard=(label,value,desc,route,tone='')=>'<button class="v65-status '+tone+'" data-route="'+route+'"><small>'+label+'</small><strong>'+value+'</strong><span>'+desc+'</span><i></i></button>';
    return '<div class="v65-dashboard"><div class="v65-dashboard-head"><div><h1>Maintenance dashboard</h1><p>'+esc(site?.name||'Current site')+' · work, assets, preventive maintenance, inventory and maintenance history.</p></div><div class="v65-dashboard-actions"><button class="button" data-route="reports">Reports</button><button class="button primary" data-action="new-work">＋ New work</button></div></div>'+
      '<section class="v65-status-strip">'+
        statusCard('Open work',open.length,over.length+' overdue','work-orders',over.length?'attn':'')+
        statusCard('Critical / emergency',critical.length,'Requires priority attention','work-orders',critical.length?'bad':'')+
        statusCard('Offline assets',offline.length,assets.length+' maintainable assets','assets',offline.length?'bad':'')+
        statusCard('PM due soon',due.length,pm.length+' active PM plans','pm',due.length?'attn':'')+
        statusCard('Stock alerts',low.length,state.parts.length+' stock items','planning',low.length?'attn':'')+
      '</section>'+
      '<section class="v65-dash-grid"><article class="v65-widget"><div class="v65-widget-head"><span><strong>Upcoming work</strong><small>Nearest due work orders</small></span><span class="v65-mini-live"><i></i>LIVE</span></div><div class="v65-widget-body">'+(upcoming.length?upcoming.map(w=>'<button class="v65-dash-row" data-open-work="'+esc(w.id)+'"><span><strong>'+esc(w.id)+' · '+esc(w.title)+'</strong><small>'+esc(getAsset(w.assetIds?.[0])?.name||'No asset')+' · '+esc(w.status)+'</small></span><span>'+dateFmt(w.due)+'</span></button>').join(''):'<div class="v65-empty"><strong>No scheduled work</strong><span>Create a work order or preventive-maintenance plan.</span></div>')+'</div></article>'+
      '<article class="v65-widget"><div class="v65-widget-head"><span><strong>Maintenance readiness</strong><small>Execution readiness</small></span><button class="button small" data-route="maintenance-outlook">Outlook</button></div><div class="v65-bars">'+[['Asset availability',availability],['Assigned work',assignment],['Stock readiness',stock]].map(x=>'<div class="v65-bar"><b>'+x[0]+'</b><span><i style="width:'+x[1]+'%"></i></span><em>'+x[1]+'%</em></div>').join('')+'</div></article></section>'+
      '<section class="v65-dash-grid"><article class="v65-widget"><div class="v65-widget-head"><span><strong>Maintenance activity</strong><small>Latest recorded changes</small></span><button class="button small" data-route="audit">Audit</button></div><div class="v65-widget-body">'+(activity.length?activity.map(a=>'<div class="v65-dash-row"><span><strong>'+esc(a.action||'Activity')+'</strong><small>'+esc(a.entity||'')+(a.detail?' · '+esc(a.detail):'')+'</small></span><span>'+dateTimeFmt(a.at)+'</span></div>').join(''):'<div class="v65-empty"><strong>No recent activity</strong><span>Work and asset changes will appear here.</span></div>')+'</div></article>'+
      '<article class="v65-widget"><div class="v65-widget-head"><span><strong>Exceptions</strong><small>Items that need attention</small></span><button class="button small" data-route="reports">View reports</button></div><div class="v65-widget-body">'+((over.length||offline.length||low.length)?[
        ...over.slice(0,3).map(w=>'<button class="v65-dash-row" data-open-work="'+esc(w.id)+'"><span><strong>'+esc(w.id)+' overdue</strong><small>'+esc(w.title)+'</small></span><span class="v50-pill bad">Work</span></button>'),
        ...offline.slice(0,2).map(a=>'<button class="v65-dash-row" data-route="assets"><span><strong>'+esc(a.code)+' offline</strong><small>'+esc(a.name)+'</small></span><span class="v50-pill bad">Asset</span></button>'),
        ...low.slice(0,2).map(p=>'<button class="v65-dash-row" data-route="planning"><span><strong>'+esc(p.code)+' below minimum</strong><small>'+partOnHand(p)+' '+esc(p.uom)+' on hand</small></span><span class="v50-pill warn">Stock</span></button>')
      ].join(''):'<div class="v65-empty"><strong>No urgent exceptions</strong><span>Current maintenance state is inside configured thresholds.</span></div>')+'</div></article></section></div>'
  }
  renderDashboard=dashboard;window.renderDashboard=dashboard;

  const previousRender=render;
  render=function(){const out=previousRender.apply(this,arguments);simpleNavigation();return out};
  window.render=render;
  simpleNavigation();if(ui.route==='dashboard')render()
})();