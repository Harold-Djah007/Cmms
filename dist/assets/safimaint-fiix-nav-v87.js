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
    try{
      if(typeof navIcon==='function')return navIcon(name);
    }catch(_){}
    if(typeof window.sfIcon==='function')return window.sfIcon(name);
    return '';
  }
  function openDefault(){
    const current=Object.entries(routeGroups).find(([,routes])=>routes.has(ui.route))?.[0]||null;
    if(current)ui.v87Open=current;
    if(typeof ui.v87Open==='undefined')ui.v87Open='assets';
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
    openDefault();
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
        ['receipts','Receipts','stock','purchase.view'],
        ['businesses','Suppliers / businesses','business','inventory.view']
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