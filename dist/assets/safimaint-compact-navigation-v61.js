'use strict';
(function(){
  const hubs={
    work:{title:'Work',desc:'Plan, execute and close maintenance without leaving the work area.',route:'work-orders',icon:'work',sections:[
      ['Work management',[['work-orders','Work orders','Plan and execute jobs','work','work.view'],['requests','Work requests','Triage reported issues','requests','work.view'],['calendar','Planner','Schedule work visually','calendar','work.view'],['pm','Preventive maintenance','Time, meter and event plans','pm','pm.manage']]],
      ['Standards & analysis',[['task-groups','Task groups / SOPs','Reusable procedures','count','work.view'],['projects','Projects','Group shutdowns and campaigns','planning','work.view'],['failure-analysis','Failure analysis','Problem → Cause → Action','reports','report.view'],['work-insights','Work insights','Backlog and execution signals','reports','report.view']]]
    ]},
    assets:{title:'Assets',desc:'Everything about what you maintain lives under one asset area.',route:'assets',icon:'assets',sections:[
      ['Asset structure',[['assets','Asset hierarchy','Parent / child structure','assets','asset.view'],['asset-register','Asset register','Searchable master list','assets','asset.view'],['equipment','Equipment','Machines and maintainable equipment','assets','asset.view'],['facilities','Facilities','Sites, buildings and areas','sites','asset.view']]],
      ['Condition & history',[['tools','Tools','Maintainable tools','tools','asset.view'],['meters','Meters','Readings and thresholds','meters','asset.view'],['asset-events','Asset events','Condition/event history','alerts','asset.view'],['downtime','Downtime','Availability and outage history','downtime','asset.view']]]
    ]},
    stock:{title:'Stock & parts',desc:'Parts, stores, replenishment and purchasing stay together.',route:'inventory',icon:'stock',sections:[
      ['Inventory',[['inventory','Parts & supplies','Part master and stock','stock','inventory.view'],['stock-locations','Stock locations','Stores, bins and quantities','sites','inventory.view'],['transactions','Stock history','Receipts, issues and transfers','history','inventory.view'],['counts','Cycle counts','Verify physical stock','count','inventory.view'],['bom-groups','BOM groups','Reusable parts lists','assets','inventory.view'],['parts-forecaster','Parts forecaster','Future maintenance demand','reports','inventory.view']]],
      ['Sourcing & purchasing',[['businesses','Suppliers / businesses','Vendor master records','suppliers','purchase.view'],['planning','Purchase planning','Demand and low-stock sourcing','planning','purchase.view'],['purchase-requests','Purchase requests','Approve maintenance demand','requests','purchase.view'],['rfqs','RFQs','Request supplier quotations','suppliers','purchase.view'],['purchase-orders','Purchase orders','Approve, order and receive','purchase','purchase.view'],['receipts','Receipts','Goods received history','stock','purchase.view'],['inventory-costing','Inventory costing','FIFO value and layers','reports','inventory.view'],['tool-crib','Tool crib','Check-out controlled tools','tools','inventory.view']]]
    ]},
    team:{title:'Team',desc:'People, groups and access are managed in one place.',route:'people',icon:'team',sections:[
      ['People & access',[['people','People','Users and responsibilities','team','admin.people'],['groups','User groups','Maintenance teams and stores','team','admin.people'],['roles','Roles','Role templates','roles','admin.people'],['permissions','Permissions','Access matrix','security','admin.people'],['labor-availability','Labour availability','Capacity and loading','team','report.view'],['field-home','Field home','Technician-focused workspace','work','work.view']]]
    ]},
    reports:{title:'Reports',desc:'Operational, reliability and planning insight without crowding daily navigation.',route:'reports',icon:'reports',sections:[
      ['Analysis',[['reports','Report library','Operational reports','reports','report.view'],['analytics','Analytics','Maintenance KPIs','reports','report.view'],['reliability','Reliability','MTBF, MTTR and downtime','reports','report.view'],['maintenance-outlook','Maintenance outlook','Forward risk signals','reports','report.view'],['meter-analytics','Meter analytics','Usage and threshold trends','meters','report.view'],['purchase-analytics','Purchasing analytics','Spend and supplier insight','purchase','purchase.view']]]
    ]},
    settings:{title:'Settings',desc:'Configuration stays out of the daily workflow until you need it.',route:'security',icon:'security',sections:[
      ['Workspace',[['sites','Sites & stores','Operating locations','sites','admin.people'],['asset-categories','Asset categories','Asset classifications','assets','admin.people'],['priorities','Priorities','Work priority rules','alerts','admin.people'],['maintenance-types','Maintenance types','Work classifications','work','admin.people'],['wo-statuses','Work-order statuses','Lifecycle controls','work','admin.people'],['failure-codes','Failure codes','RCA hierarchy','reports','admin.people']]],
      ['System',[['custom-fields','Custom fields','Extra record data','assets','admin.people'],['notifications','Notifications','Alert rules and mail','alerts','admin.notifications'],['workflows','Workflow automation','Event-driven rules','pm','admin.notifications'],['import','Import','Bring existing data in','history','admin.people'],['export','Export','Export workspace data','history','admin.people'],['integrations','API / integrations','External connections','security','admin.people'],['audit','Audit trail','Who changed what','audit','admin.people'],['localization','Localization','Currency, timezone and dates','sites','admin.people'],['sync-center','Offline / sync','Device and server state','history',null],['security','Security','Workspace security policy','security','admin.people']]]
    ]}
  };
  const routeHub={};Object.entries(hubs).forEach(([k,h])=>{routeHub[h.route]=k;h.sections.forEach(([,items])=>items.forEach(i=>routeHub[i[0]]=k))});
  function allowed(p){return !p||typeof safiCan!=='function'||safiCan(p)}
  function navSvg(name){try{return navIcon(name)}catch(_){return ''}}
  function closeHub(){document.querySelector('.v61-hub')?.classList.remove('open');document.querySelector('.v61-hub-backdrop')?.classList.remove('open')}
  function ensureHub(){
    if(document.querySelector('.v61-hub'))return;
    document.body.insertAdjacentHTML('beforeend','<div class="v61-hub-backdrop"></div><aside class="v61-hub" aria-label="Context tools"><div class="v61-hub-head"><div><small>Context tools</small><h2></h2><p></p></div><button class="v61-hub-close" type="button" aria-label="Close">×</button></div><div class="v61-hub-body"></div></aside>')
  }
  function openHub(key){
    ensureHub();const h=hubs[key],hub=document.querySelector('.v61-hub');if(!h||!hub)return;
    hub.querySelector('h2').textContent=h.title;hub.querySelector('.v61-hub-head p').textContent=h.desc;
    hub.querySelector('.v61-hub-body').innerHTML=h.sections.map(([label,items])=>{const visible=items.filter(i=>allowed(i[4]));if(!visible.length)return'';return '<section class="v61-hub-section"><p>'+esc(label)+'</p><div class="v61-hub-grid">'+visible.map(i=>'<button class="v61-tool '+(ui.route===i[0]?'current':'')+'" data-route="'+esc(i[0])+'"><span class="nav-icon">'+navSvg(i[3])+'</span><span><strong>'+esc(i[1])+'</strong><small>'+esc(i[2])+'</small></span></button>').join('')+'</div></section>'}).join('');
    hub.classList.add('open');document.querySelector('.v61-hub-backdrop').classList.add('open')
  }
  function primaryRow(key,label,route,icon,badge){
    const active=routeHub[ui.route]===key||ui.route===route;
    return '<div class="v61-nav-row '+(active?'active':'')+'"><button class="v61-nav-main" data-route="'+route+'"><span class="nav-icon">'+navSvg(icon)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'</button><button class="v61-nav-more" data-v61-hub="'+key+'" type="button" aria-label="Open '+label+' tools">›</button></div>'
  }
  simpleNavigation=function(){
    const nav=document.getElementById('navigation');if(!nav)return;
    nav.innerHTML='<p class="v61-nav-label">Workspace</p><div class="v61-main-nav">'+
      primaryRow('home','Home','dashboard','home','')+
      primaryRow('work','Work','work-orders','work','workBadge')+
      primaryRow('assets','Assets','assets','assets','offlineBadge')+
      primaryRow('stock','Stock & parts','inventory','stock','stockBadge')+
      primaryRow('team','Team','people','team','')+
      primaryRow('reports','Reports','reports','reports','')+
      '</div><div class="v61-utils"><button class="v61-utility" data-route="field-home"><span class="nav-icon">'+navSvg('work')+'</span><span>Field home</span></button><button class="v61-utility" data-v61-hub="settings"><span class="nav-icon">'+navSvg('security')+'</span><span>Settings & administration</span></button></div>';
    ensureHub()
  };
  window.simpleNavigation=simpleNavigation;
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-v61-hub]');if(b){e.preventDefault();e.stopImmediatePropagation();openHub(b.dataset.v61Hub);return}
    if(e.target.closest('.v61-hub-close,.v61-hub-backdrop')){e.preventDefault();closeHub();return}
    if(e.target.closest('.v61-tool[data-route]'))setTimeout(closeHub,80)
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeHub()});
  const base=render;render=function(){base();simpleNavigation()};window.render=render;simpleNavigation()
})();