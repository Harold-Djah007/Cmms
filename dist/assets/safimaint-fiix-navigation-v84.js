'use strict';
(function(){
  const groups=[
    {key:'maintenance',label:'Maintenance',icon:'work',route:'work-orders',badge:'workBadge',items:[
      ['work-orders','Work orders','work.view'],
      ['requests','Work requests','work.view'],
      ['pm','Scheduled maintenance','pm.manage'],
      ['calendar','Calendar / planner','work.view'],
      ['task-groups','Task groups / SOPs','work.view'],
      ['projects','Projects','work.view']
    ]},
    {key:'assets',label:'Assets',icon:'assets',route:'assets',badge:'offlineBadge',items:[
      ['assets','All assets','asset.view'],
      ['facilities','Facilities','asset.view'],
      ['equipment','Equipment','asset.view'],
      ['tools','Tools','asset.view'],
      ['meters','Meters','asset.view'],
      ['downtime','Downtime','asset.view'],
      ['asset-register','Asset register','asset.view']
    ]},
    {key:'supplies',label:'Supplies',icon:'stock',route:'inventory',badge:'stockBadge',items:[
      ['inventory','Parts & supplies','inventory.view'],
      ['stock-locations','Stock locations','inventory.view'],
      ['counts','Cycle counts','inventory.view'],
      ['transactions','Stock history','inventory.view'],
      ['bom-groups','BOM groups','inventory.view'],
      ['tool-crib','Tool crib','inventory.view']
    ]},
    {key:'purchasing',label:'Purchasing',icon:'purchase',route:'planning',items:[
      ['planning','Purchase planning','purchase.view'],
      ['businesses','Suppliers / businesses','purchase.view'],
      ['purchase-requests','Purchase requests','purchase.view'],
      ['rfqs','RFQs','purchase.view'],
      ['purchase-orders','Purchase orders','purchase.view'],
      ['receipts','Receipts','purchase.view']
    ]},
    {key:'settings',label:'Settings',icon:'security',route:'security',items:[
      ['sites','Sites & stores','admin.people'],
      ['people','People & groups','admin.people'],
      ['roles','Roles','admin.people'],
      ['permissions','Permissions','admin.people'],
      ['notifications','Notification rules','admin.notifications'],
      ['workflows','Workflow automation','admin.notifications'],
      ['audit','Audit trail','admin.people'],
      ['sync-center','Offline / sync',null],
      ['security','Security','admin.people']
    ]}
  ];
  const routeGroup={dashboard:'dashboard',notifications:'notifications',reports:'reports'};
  groups.forEach(g=>{routeGroup[g.route]=g.key;g.items.forEach(i=>routeGroup[i[0]]=g.key)});
  function can(p){return !p||typeof safiCan!=='function'||safiCan(p)}
  function icon(name){try{return navIcon(name)}catch(_){return ''}}
  function openForRoute(){
    const current=routeGroup[ui.route];
    if(groups.some(g=>g.key===current)) ui.v84Open=current;
    if(typeof ui.v84Open==='undefined') ui.v84Open='assets';
    return ui.v84Open;
  }
  function leaf(item){
    if(!can(item[2]))return '';
    return '<button class="v84-leaf '+(ui.route===item[0]?'active':'')+'" data-route="'+item[0]+'">'+item[1]+'</button>';
  }
  function group(g,opened){
    const active=routeGroup[ui.route]===g.key;
    return '<div class="v84-row '+(active?'active ':'')+(opened===g.key?'open':'')+'" data-v84-group="'+g.key+'">'+
      '<div class="v84-head"><button class="v84-main" data-route="'+g.route+'"><span class="nav-icon">'+icon(g.icon)+'</span><span class="v84-label">'+g.label+'</span>'+(g.badge?'<b id="'+g.badge+'"></b>':'')+'</button>'+
      '<button class="v84-toggle" type="button" data-v84-toggle="'+g.key+'" aria-label="Expand '+g.label+'">›</button></div>'+
      '<div class="v84-sub">'+g.items.map(leaf).join('')+'</div></div>';
  }
  function renderFiixNav(){
    const nav=document.getElementById('navigation');if(!nav)return;
    const opened=openForRoute();
    nav.innerHTML='<div class="v84-nav">'+
      '<div class="v84-row '+(ui.route==='dashboard'?'active':'')+'"><div class="v84-head"><button class="v84-main" data-route="dashboard"><span class="nav-icon">'+icon('home')+'</span><span class="v84-label">Dashboard</span></button><span></span></div></div>'+
      group(groups[0],opened)+
      '<div class="v84-row '+(ui.route==='notifications'?'active':'')+'"><div class="v84-head"><button class="v84-main" data-route="notifications"><span class="nav-icon">'+icon('alerts')+'</span><span class="v84-label">Notifications</span><b id="noticeNavBadge"></b></button><span></span></div></div>'+
      group(groups[1],opened)+group(groups[2],opened)+group(groups[3],opened)+
      '<div class="v84-row '+(ui.route==='reports'?'active':'')+'"><div class="v84-head"><button class="v84-main" data-route="reports"><span class="nav-icon">'+icon('reports')+'</span><span class="v84-label">Reports</span></button><span></span></div></div>'+
      '<div class="v84-divider"></div>'+group(groups[4],opened)+
      '</div>';
    if(typeof updateBadges==='function') updateBadges();
  }
  window.safiFiixNavigation=renderFiixNav;

  document.addEventListener('click',function(e){
    const toggle=e.target.closest('[data-v84-toggle]');
    if(!toggle)return;
    e.preventDefault();e.stopImmediatePropagation();
    const key=toggle.dataset.v84Toggle;
    ui.v84Open=ui.v84Open===key?null:key;
    renderFiixNav();
  },true);

  const previousRender=window.render;
  if(typeof previousRender==='function'){
    window.render=function(){
      const out=previousRender.apply(this,arguments);
      renderFiixNav();
      return out;
    };
    render=window.render;
  }
  renderFiixNav();
})();