'use strict';
(function(){
  const list=v=>Array.isArray(v)?v:[];
  const supplyRoutes=new Set(['inventory','stock-locations','batch-stock','counts','transactions','bom-groups','businesses','planning','purchase-orders','purchase-requests','rfqs','receipts']);
  const groups=[
    {key:'assets',label:'Assets',icon:'assets',route:'assets',badge:'offlineBadge',items:[
      ['assets','All assets','asset.view'],['facilities','Facilities','asset.view'],['equipment','Equipment','asset.view'],['tools','Tools','asset.view']
    ]},
    {key:'supplies',label:'Supplies',icon:'stock',route:'inventory',badge:'stockBadge',items:[
      ['inventory','Parts & supplies','inventory.view'],['stock-locations','Current stock','inventory.view'],['counts','Cycle counts','inventory.view'],
      ['transactions','Stock history','inventory.view'],['bom-groups','BOM groups','inventory.view'],['businesses','Businesses','inventory.view']
    ]},
    {key:'purchasing',label:'Purchasing',icon:'purchase',route:'planning',items:[
      ['planning','Purchase planning','purchase.view'],['purchase-requests','Purchase requests','purchase.view'],['rfqs','RFQs','purchase.view'],['purchase-orders','Purchase orders','purchase.view'],['receipts','Receipts','purchase.view']
    ]}
  ];
  const routeGroup={dashboard:'dashboard','work-orders':'work',notifications:'notifications',reports:'reports',security:'settings'};
  groups.forEach(g=>{routeGroup[g.route]=g.key;g.items.forEach(i=>routeGroup[i[0]]=g.key)});
  function can(p){return !p||typeof safiCan!=='function'||safiCan(p)}
  function icon(name){try{return navIcon(name)}catch(_){return''}}
  function navItem(route,label,glyph,permission,badge){
    if(!can(permission))return'';
    return '<button class="v85-item '+(ui.route===route?'active':'')+'" data-route="'+route+'"><span class="nav-icon">'+icon(glyph)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'</button>';
  }
  function navGroup(g){
    const active=routeGroup[ui.route]===g.key;
    if(!ui.v85Open&&active)ui.v85Open=g.key;
    const open=ui.v85Open===g.key;
    const children=g.items.filter(i=>can(i[2])).map(i=>'<button class="v85-item '+(ui.route===i[0]?'active':'')+'" data-route="'+i[0]+'">'+i[1]+'</button>').join('');
    return '<div class="v85-group '+(active?'active ':'')+(open?'open':'')+'" data-v85-group="'+g.key+'"><button class="v85-parent" type="button" data-v85-toggle="'+g.key+'"><span class="nav-icon">'+icon(g.icon)+'</span><span>'+g.label+'</span>'+(g.badge?'<b id="'+g.badge+'"></b>':'')+'<span class="v85-toggle">›</span></button><div class="v85-sub">'+children+'</div></div>';
  }
  function navigation(){
    const nav=document.getElementById('navigation');if(!nav)return;
    nav.innerHTML='<div class="v85-nav">'+
      navItem('dashboard','Dashboard','home','')+
      navItem('work-orders','Maintenance','work','work.view','workBadge')+
      navItem('notifications','Notifications','alerts','admin.notifications','topNoticeBadge')+
      navGroup(groups[0])+navGroup(groups[1])+navGroup(groups[2])+
      navItem('reports','Reports','reports','report.view')+
      '<div class="v85-divider"></div>'+
      navItem('security','Settings','security','admin.people')+
      '</div>';
    if(typeof updateBadges==='function')updateBadges();
  }
  window.safiFiixNavigationV85=navigation;
  simpleNavigation=navigation;window.simpleNavigation=navigation;

  const onHand=p=>list(p?.locations).filter(l=>l.active!==false).reduce((n,l)=>n+Number(l.onHand||0),0);
  const stores=()=>{
    const rows=list(state.stores).map(s=>({id:String(s.id),name:s.name||s.code||s.id,code:s.code||''}));
    const known=new Set(rows.map(x=>x.id));
    list(state.parts).forEach(p=>list(p.locations).forEach(l=>{const id=String(l.storeId||'UNASSIGNED');if(!known.has(id)){rows.push({id,name:id==='UNASSIGNED'?'Unassigned stock':id,code:''});known.add(id)}}));
    return rows;
  };
  const stockState=(p,l)=>{const q=Number(l?.onHand??onHand(p)),m=Number(l?.min??p?.min??0);return q<=0?['Out','out']:q<m?['Low','low']:['OK','good']};
  const locator=l=>[l?.aisle&&'Aisle '+l.aisle,l?.row&&'Row '+l.row,l?.bin&&'Bin '+l.bin].filter(Boolean).join(' / ')||'—';

  function rowsForStore(store){
    const isOpen=!list(ui.v85ClosedStores).includes(store.id),rows=[];
    list(state.parts).forEach(p=>list(p.locations).forEach(l=>{
      if(String(l.storeId||'UNASSIGNED')!==store.id)return;
      const st=stockState(p,l);
      const search=[p.name,p.code,p.category,p.barcode,store.name,locator(l)].join(' ').toLowerCase();
      rows.push('<tr data-v85-part-row data-v85-store-child="'+esc(store.id)+'" data-search="'+esc(search)+'" data-category="'+esc(p.category||'')+'" '+(isOpen?'':'hidden')+'><td><input type="checkbox" data-s82-select="'+esc(p.id)+'"></td><td><button class="v85-part" type="button" data-s82-open-part="'+esc(p.id)+'">'+esc(p.name)+'</button></td><td class="v85-code">'+esc(p.code||'—')+'</td><td>'+esc(p.category||'Part / supply')+'</td><td>'+esc(store.name)+'</td><td>'+esc(locator(l))+'</td><td class="v85-num">'+Number(l.onHand||0)+'</td><td class="v85-num">'+Number(l.min??p.min??0)+'</td><td class="v85-num">'+Number(l.max??p.max??0)+'</td><td><span class="v85-state '+st[1]+'">'+st[0]+'</span></td></tr>');
    }));
    if(!rows.length)return'';
    return '<tr class="v85-store '+(isOpen?'open':'')+'" data-v85-store="'+esc(store.id)+'"><td></td><td colspan="9"><button class="v85-storebtn" type="button" data-v85-toggle-store="'+esc(store.id)+'"><span class="arr">›</span>'+esc(store.name)+(store.code?' ('+esc(store.code)+')':'')+'</button></td></tr>'+rows.join('');
  }

  function suppliesList(){
    const parts=list(state.parts),cats=[...new Set(parts.map(p=>p.category).filter(Boolean))].sort(),low=parts.filter(p=>stockState(p)[1]!=='good').length,total=parts.reduce((n,p)=>n+onHand(p),0);
    return '<div class="v85-supplies">'+
      '<div class="v85-titlebar"><div><h1>Parts & Supplies</h1><p>Inventory records and stock by location</p></div></div>'+
      '<div class="v85-toolbar"><button class="v85-toolbtn primary" data-action="add-part">New</button><button class="v85-toolbtn" data-route="import">Import</button><button class="v85-toolbtn" data-route="export">Export</button><button class="v85-toolbtn" data-s82-print>Print</button><button class="v85-toolbtn" data-s82-print-tags>Print Tags</button><button class="v85-toolbtn" data-action="global-stock-move">Move Stock</button><button class="v85-toolbtn" data-route="counts">Cycle Count</button><span class="spacer"></span><input class="v85-search" data-v85-search placeholder="Search parts, code, barcode, location"><select class="v85-select" data-v85-category><option value="">All categories</option>'+cats.map(c=>'<option>'+esc(c)+'</option>').join('')+'</select></div>'+
      '<div class="v85-layout"><aside class="v85-filterpane"><div class="v85-filterhead">Parts & Supplies</div><div class="v85-filterbody"><div class="v85-filtergroup"><strong>Quick filters</strong><label class="v85-check"><input type="checkbox" data-v85-low> Below minimum</label><label class="v85-check"><input type="checkbox" data-v85-out> Stocked out</label></div><div class="v85-filtergroup"><strong>View</strong><label class="v85-check"><input type="checkbox" checked disabled> Group by stock location</label><label class="v85-check"><input type="checkbox" checked disabled> Active inventory only</label></div><div class="v85-stats"><b>'+parts.length+'</b> part records<br><b>'+stores().length+'</b> stock locations<br><b>'+low+'</b> need attention<br><b>'+total+'</b> total units on hand</div></div></aside>'+
      '<section class="v85-grid"><table class="v85-table"><thead><tr><th style="width:32px"><input type="checkbox" data-s82-select-all></th><th style="width:22%">Part</th><th style="width:10%">Part No.</th><th style="width:11%">Category</th><th style="width:13%">Stock Location</th><th style="width:14%">Locator</th><th style="width:7%">On Hand</th><th style="width:6%">Min</th><th style="width:6%">Max</th><th style="width:8%">Status</th></tr></thead><tbody>'+stores().map(rowsForStore).join('')+'</tbody></table><div class="v85-foot"><span><b data-v85-visible>'+parts.length+'</b> visible records</span><span>Double-click or select a part to open its full record</span></div></section></div></div>';
  }

  const priorInventory=window.renderInventory||renderInventory;
  function renderInventoryV85(){
    if(ui.s80SupplyMode==='record'&&typeof renderPartDetail==='function')return renderPartDetail(getPart(ui.selectedPart));
    return suppliesList();
  }
  renderInventory=renderInventoryV85;window.renderInventory=renderInventoryV85;

  function applyFilters(){
    const q=String(document.querySelector('[data-v85-search]')?.value||'').trim().toLowerCase();
    const cat=document.querySelector('[data-v85-category]')?.value||'';
    const low=document.querySelector('[data-v85-low]')?.checked;
    const out=document.querySelector('[data-v85-out]')?.checked;
    let visible=0;
    document.querySelectorAll('[data-v85-part-row]').forEach(row=>{
      const cells=row.children,qty=Number(cells[6]?.textContent||0),min=Number(cells[7]?.textContent||0);
      const match=(!q||row.dataset.search.includes(q))&&(!cat||row.dataset.category===cat)&&(!low||qty<min)&&(!out||qty<=0);
      const storeOpen=!list(ui.v85ClosedStores).includes(row.dataset.v85StoreChild);
      row.hidden=!(match&&storeOpen);if(match&&storeOpen)visible++;
    });
    document.querySelectorAll('[data-v85-store]').forEach(s=>{
      const id=s.dataset.v85Store;
      const matches=[...document.querySelectorAll('[data-v85-store-child="'+CSS.escape(id)+'"]')].some(r=>!r.hidden);
      s.hidden=Boolean(q||cat||low||out)&&!matches;
    });
    const outEl=document.querySelector('[data-v85-visible]');if(outEl)outEl.textContent=visible;
  }

  document.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-v85-toggle]');
    if(toggle){e.preventDefault();e.stopImmediatePropagation();ui.v85Open=ui.v85Open===toggle.dataset.v85Toggle?null:toggle.dataset.v85Toggle;navigation();return}
    const store=e.target.closest('[data-v85-toggle-store]');
    if(store){e.preventDefault();e.stopImmediatePropagation();const id=store.dataset.v85ToggleStore;ui.v85ClosedStores=list(ui.v85ClosedStores);const i=ui.v85ClosedStores.indexOf(id);if(i>=0)ui.v85ClosedStores.splice(i,1);else ui.v85ClosedStores.push(id);render();return}
  },true);
  document.addEventListener('input',e=>{if(e.target.matches('[data-v85-search],[data-v85-low],[data-v85-out]'))applyFilters()},true);
  document.addEventListener('change',e=>{if(e.target.matches('[data-v85-category]'))applyFilters()},true);

  const prevRender=window.render;
  if(typeof prevRender==='function'){
    window.render=function(){const out=prevRender.apply(this,arguments);document.body.classList.add('safimaint-v85');navigation();return out};
    render=window.render;
  }
  document.body.classList.add('safimaint-v85');navigation();
  if(ui.route==='inventory')render();
})();