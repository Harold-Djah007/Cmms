'use strict';
(function(){
  const list=v=>Array.isArray(v)?v:[];
  const can=p=>!p||typeof safiCan!=='function'||safiCan(p);
  const routeGroups={
    maintenance:new Set(['work-orders','requests','pm','calendar','task-groups','projects']),
    assets:new Set(['assets','asset-register','facilities','equipment','tools','meters','downtime']),
    supplies:new Set(['inventory','stock-locations','batch-stock','counts','transactions','bom-groups','businesses']),
    purchasing:new Set(['planning','purchase-requests','receipts','vendors']),
    settings:new Set(['sites','people','groups','roles','permissions','notifications','workflows','audit','sync-center','security'])
  };
  const icons={
    dashboard:'home',maintenance:'work',notifications:'bell',assets:'assets',
    supplies:'supplies',purchasing:'business',reports:'reports',settings:'settings',
    allassets:'assets',facility:'assets',equipment:'assets',tools:'assets',
    inventory:'supplies',stock:'stock',batch:'batch',count:'count',history:'move',
    bom:'bom',business:'business',calendar:'pm',requests:'work',pm:'pm',people:'team',
    roles:'team',security:'settings',sites:'assets',audit:'reports',sync:'move'
  };
  function icon(name){
    const paths={
      home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6"/>',
      work:'<path d="M8 5h11v16H5V8zM8 5v3H5m4 5h6m-6 4h6"/>',
      bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      assets:'<circle cx="12" cy="12" r="3"/><path d="M19 15a2 2 0 0 0 1-2v-2a2 2 0 0 0-2-2l-1-2-2-1a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2L7 7 5 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2l2 2 2 1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l2-1Z"/>',
      stock:'<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/>',
      supplies:'<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/>',
      business:'<path d="M4 20V7l8-4 8 4v13M8 10h2m4 0h2M8 14h2m4 0h2M10 20v-3h4v3"/>',
      reports:'<path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19 15l2 2-4 4-2-2-3 1-1 2H7l-1-3-3-2 2-3V9L3 7l4-4 2 2 3-1 1-2h4l1 3 3 2-2 3z"/>',
      pm:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2M8 3 5 6m11-3 3 3"/>',
      team:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.2a4 4 0 0 1 0 7.6"/>',
      move:'<path d="M5 7h13m0 0-3-3m3 3-3 3M19 17H6m0 0 3 3m-3-3 3-3"/>',
      batch:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
      count:'<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h3"/><path d="m14 16 2 2 3-4"/>',
      bom:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8m6-8-4 8"/>',
      chevron:'<path d="m8 10 4 4 4-4"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.stock)+'</svg>';
  }
  let lastRoute=ui.route;
  function groupForRoute(route){
    return Object.entries(routeGroups).find(([,routes])=>routes.has(route))?.[0]||null;
  }
  function syncOpenGroup(){
    if(typeof ui.v87Open==='undefined')ui.v87Open=groupForRoute(ui.route)||'assets';
    if(ui.route!==lastRoute){
      const current=groupForRoute(ui.route);
      ui.v87Open=current||null;
      lastRoute=ui.route;
    }
    return ui.v87Open;
  }
  function child(route,label,glyph,permission=''){
    if(!can(permission))return'';
    return '<button class="s79-nav-item child '+(ui.route===route?'active':'')+'" data-route="'+route+'"'+(ui.route===route?' aria-current="page"':'')+'><span class="s79-nav-icon">'+icon(icons[glyph]||glyph)+'</span><span>'+label+'</span></button>';
  }
  function direct(route,label,glyph,permission='',badge=''){
    if(!can(permission))return'';
    return '<button class="s79-nav-item '+(ui.route===route?'active':'')+'" data-route="'+route+'"'+(ui.route===route?' aria-current="page"':'')+'><span class="s79-nav-icon">'+icon(icons[glyph]||glyph)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'</button>';
  }
  function group(key,label,glyph,route,badge,permission,items){
    if(!can(permission))return'';
    const active=routeGroups[key]?.has(ui.route);
    const open=ui.v87Open===key;
    const visible=items.map(item=>child(...item)).join('');
    return '<section class="s79-nav-group '+(active?'route-active ':'')+(open?'open':'')+'" data-v87-group="'+key+'">'+
      '<button type="button" class="s79-nav-parent" data-v87-toggle="'+key+'" aria-expanded="'+open+'">'+
        '<span class="s79-nav-icon">'+icon(icons[glyph]||glyph)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'<i>'+icon('chevron')+'</i>'+
      '</button>'+
      '<div class="s79-nav-children" '+(open?'':'hidden')+'>'+visible+'</div>'+
    '</section>';
  }
  function navigation(){
    const nav=document.getElementById('navigation');if(!nav)return;
    syncOpenGroup();
    nav.innerHTML='<div class="s79-nav">'+
      direct('dashboard','Dashboard','dashboard')+
      group('maintenance','Maintenance','maintenance','work-orders','workBadge','work.view',[
        ['work-orders','Work orders','maintenance','work.view'],
        ['requests','Work requests','requests','work.view'],
        ['pm','Scheduled maintenance','pm','pm.manage'],
        ['calendar','Maintenance calendar','calendar','work.view']
      ])+
      direct('notifications','Notifications','notifications','admin.notifications','alertBadge')+
      group('assets','Assets','assets','assets','offlineBadge','asset.view',[
        ['assets','All assets','allassets','asset.view'],
        ['facilities','Facilities','facility','asset.view'],
        ['equipment','Equipment','equipment','asset.view'],
        ['tools','Tools','tools','asset.view'],
        ['meters','Meters','equipment','asset.view'],
        ['downtime','Downtime','history','asset.view']
      ])+
      group('supplies','Supplies','supplies','inventory','stockBadge','inventory.view',[
        ['inventory','Parts & supplies','inventory','inventory.view'],
        ['stock-locations','Current stock','stock','inventory.view'],
        ['batch-stock','Batch stock adjustment','batch','inventory.manage'],
        ['counts','Cycle counts','count','inventory.view'],
        ['transactions','Stock history','history','inventory.view'],
        ['bom-groups','BOM groups','bom','inventory.view'],
        ['businesses','Businesses','business','inventory.view']
      ])+
      group('purchasing','Purchasing','purchasing','planning','purchaseBadge','inventory.view',[
        ['planning','Purchase planning','business','inventory.view'],
        ['purchase-requests','Purchase requests','requests','purchase.view'],
        ['receipts','Receipts','stock','purchase.view']
      ])+
      direct('reports','Reports','reports','report.view')+
      group('settings','Settings','settings','security','','admin.people',[
        ['sites','Sites & stores','sites','admin.people'],
        ['people','People & groups','people','admin.people'],
        ['roles','Roles','roles','admin.people'],
        ['permissions','Permissions','security','admin.people'],
        ['workflows','Workflow automation','pm','admin.notifications'],
        ['audit','Audit trail','audit','admin.people'],
        ['sync-center','Offline / sync','sync',null],
        ['security','Security','security','admin.people']
      ])+
    '</div>';
    nav.setAttribute('aria-label','Primary navigation');
    if(typeof updateBadges==='function')updateBadges();
  }
  simpleNavigation=navigation;window.simpleNavigation=navigation;window.safiFiixNavV87=navigation;

  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-v87-toggle]');
    if(!toggle)return;
    event.preventDefault();event.stopImmediatePropagation();
    const key=toggle.dataset.v87Toggle;
    ui.v87Open=ui.v87Open===key?null:key;
    navigation();
    const section=document.querySelector('[data-v87-group="'+CSS.escape(key)+'"]');
    if(section&&ui.v87Open===key)section.scrollIntoView({block:'nearest'});
  },true);

  const previousRender=window.render;
  if(typeof previousRender==='function'){
    window.render=function(){
      const result=previousRender.apply(this,arguments);
      navigation();
      return result;
    };
    render=window.render;
  }
  navigation();
})();