'use strict';
(()=>{
  const supplyRoutes=new Set(['inventory','stock-locations','batch-stock','counts','transactions','bom-groups','businesses']);
  ui.s83SuppliesOpen=ui.s83SuppliesOpen!==false;

  const list=value=>Array.isArray(value)?value:[];
  const can=permission=>!permission||typeof safiCan!=='function'||safiCan(permission);
  const onHand=part=>list(part?.locations).filter(location=>location.active!==false).reduce((sum,location)=>sum+Number(location.onHand||0),0);
  const statusFor=(part,location)=>{
    const current=Number(location?.onHand??onHand(part));
    const minimum=Number(location?.min??part?.min??0);
    return current<=0?['Stocked out','out']:current<minimum?['Below minimum','low']:['In stock','good'];
  };
  const allStores=()=>{
    const rows=list(state.stores).map(store=>({id:String(store.id),name:store.name||store.code||store.id,code:store.code||''}));
    const known=new Set(rows.map(store=>store.id));
    list(state.parts).forEach(part=>list(part.locations).forEach(location=>{
      const id=String(location.storeId||'UNASSIGNED');
      if(!known.has(id)){rows.push({id,name:id==='UNASSIGNED'?'Unassigned stock':id,code:''});known.add(id)}
    }));
    return rows;
  };

  function icon(name){
    const paths={
      dashboard:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
      work:'<path d="M8 5h8M9 3h6v4H9zM6 5H4v16h16V5h-2M8 12h8M8 16h5"/>',
      bell:'<path d="M18 9a6 6 0 0 0-12 0c0 5-2 6-3 8h18c-1-2-3-3-3-8ZM10 21h4"/>',
      assets:'<circle cx="12" cy="12" r="3"/><path d="M19 15l2 2-4 4-2-2-3 1-1 2H7l-1-3-3-2 2-3V9L3 7l4-4 2 2 3-1 1-2h4l1 3 3 2-2 3v5Z"/>',
      supplies:'<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/>',
      reports:'<path d="M5 20V10m7 10V4m7 16v-7"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19 15l2 2-4 4-2-2-3 1-1 2H7l-1-3-3-2 2-3V9L3 7l4-4 2 2 3-1 1-2h4l1 3 3 2-2 3v5Z"/>',
      location:'<path d="M4 21h16M6 21V8l6-4 6 4v13M9 11h2m2 0h2m-6 4h2m2 0h2"/>',
      item:'<path d="m5 8 7-4 7 4-7 4-7-4Z"/><path d="M5 8v8l7 4 7-4V8M12 12v8"/>',
      adjust:'<path d="M4 7h11m0 0-3-3m3 3-3 3M20 17H9m0 0 3 3m-3-3 3-3"/>',
      count:'<path d="M7 4h10v3h3v14H4V7h3V4Zm2 3h6V5H9v2Zm-1 5h8m-8 4h5"/>',
      bom:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="12" cy="18" r="2"/><path d="m8 7 8 0M7 8l4 8m6-7-4 7"/>',
      business:'<path d="M4 21V7h9v14M13 11h7v10M7 11h2m-2 4h2m7 0h2M2 21h20"/>',
      chevron:'<path d="m9 7 5 5-5 5"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.item)+'</svg>';
  }

  function navItem(route,label,glyph,permission='',child=false,badge=''){
    if(!can(permission))return'';
    const active=ui.route===route;
    return '<button class="s83-nav-link '+(child?'child ':'')+(active?'active':'')+'" data-route="'+route+'"'+(active?' aria-current="page"':'')+'><span class="s83-nav-icon">'+icon(glyph)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'</button>';
  }
  function navigation(){
    const nav=document.getElementById('navigation');if(!nav)return;
    const inSupplies=supplyRoutes.has(ui.route),open=inSupplies||ui.s83SuppliesOpen;
    nav.innerHTML='<div class="s83-nav"><span class="s83-nav-caption">Maintenance</span>'+
      navItem('dashboard','Dashboard','dashboard')+
      navItem('work-orders','Work orders','work','work.view',false,'workBadge')+
      navItem('notifications','Notifications','bell','admin.notifications',false,'alertBadge')+
      navItem('assets','Assets','assets','asset.view',false,'offlineBadge')+
      '<section class="s83-nav-group '+(inSupplies?'contains-active ':'')+(open?'open':'')+'"><button class="s83-nav-parent" type="button" data-s83-supplies-toggle aria-expanded="'+open+'"><span class="s83-nav-icon">'+icon('supplies')+'</span><span>Supplies</span><i>'+icon('chevron')+'</i></button><div class="s83-nav-children" '+(open?'':'hidden')+'>'+
        navItem('inventory','Parts & supplies','item','inventory.view',true)+
        navItem('stock-locations','Current stock','location','inventory.view',true)+
        navItem('batch-stock','Batch adjustment','adjust','inventory.manage',true)+
        navItem('counts','Cycle counts','count','inventory.view',true)+
        navItem('transactions','Stock history','adjust','inventory.view',true)+
        navItem('bom-groups','BOM groups','bom','inventory.view',true)+
        navItem('businesses','Businesses','business','inventory.view',true)+
      '</div></section><span class="s83-nav-caption second">Insights & setup</span>'+
      navItem('reports','Reports','reports','report.view')+
      navItem('security','Settings','settings','admin.people')+
      '</div>';
    nav.setAttribute('aria-label','Primary navigation');
    if(typeof updateBadges==='function')updateBadges();
  }
  simpleNavigation=navigation;window.simpleNavigation=navigation;

  function statusBadge(part,location){const value=statusFor(part,location);return '<span class="s83-stock-state '+value[1]+'"><i></i>'+value[0]+'</span>'}
  function locator(location){return [location?.aisle&&'Aisle '+location.aisle,location?.row&&'Row '+location.row,location?.bin&&'Bin '+location.bin].filter(Boolean).join(' · ')||'Locator not set'}
  function storeRows(store){
    const closed=list(ui.s82ClosedStores).includes(store.id),rows=[];
    list(state.parts).forEach(part=>list(part.locations).forEach((location,index)=>{
      if(String(location.storeId||'UNASSIGNED')!==store.id)return;
      const search=[store.name,store.code,part.name,part.code,part.category,part.barcode,locator(location)].join(' ').toLowerCase();
      rows.push('<tr class="s83-part-row '+(closed?'is-collapsed':'')+'" data-s82-store-child="'+esc(store.id)+'" data-s82-part-row data-search="'+esc(search)+'" data-category="'+esc(part.category||'')+'" data-s83-store-child="'+esc(store.id)+'"><td><input type="checkbox" data-s82-select="'+esc(part.id)+'" '+(list(ui.s82SelectedParts).includes(part.id)?'checked':'')+' aria-label="Select '+esc(part.name)+'"></td><td><button class="s83-part-main" type="button" data-s82-open-part="'+esc(part.id)+'"><span class="s83-part-glyph">'+icon('item')+'</span><span><strong>'+esc(part.name)+'</strong><small>'+esc(locator(location))+'</small></span></button></td><td><strong class="s83-code">'+esc(part.code)+'</strong></td><td>'+esc(part.category||'Part / supply')+'</td><td class="s83-number"><strong>'+Number(location.onHand||0)+'</strong> '+esc(part.uom||'ea')+'</td><td class="s83-number">'+Number(location.min??part.min??0)+'</td><td class="s83-number">'+Number(location.max??part.max??0)+'</td><td>'+statusBadge(part,location)+'</td><td><button class="s83-row-open" type="button" data-s82-open-part="'+esc(part.id)+'" aria-label="Open '+esc(part.name)+'">'+icon('chevron')+'</button></td></tr>');
    }));
    if(!rows.length)return'';
    const total=list(state.parts).reduce((sum,part)=>sum+list(part.locations).filter(location=>String(location.storeId||'UNASSIGNED')===store.id).reduce((n,location)=>n+Number(location.onHand||0),0),0);
    return '<tr class="s83-store-row '+(closed?'collapsed':'')+'" data-s82-store="'+esc(store.id)+'"><td></td><td colspan="3"><button type="button" data-s83-toggle-store="'+esc(store.id)+'" aria-expanded="'+(!closed)+'"><span class="s83-group-chevron">'+icon('chevron')+'</span><span class="s83-store-glyph">'+icon('location')+'</span><span><strong>'+esc(store.name)+'</strong><small>'+esc(store.code||'Stock location')+'</small></span></button></td><td class="s83-number"><strong>'+total+'</strong></td><td colspan="3"><span class="s83-location-pill">Stock location</span></td><td></td></tr>'+rows.join('');
  }

  function listPage(){
    const parts=list(state.parts),categories=[...new Set(parts.map(part=>part.category).filter(Boolean))].sort(),low=parts.filter(part=>statusFor(part)[1]!=='good').length;
    return '<div class="s83-page"><header class="s83-page-head"><div><span>Supplies</span><h1>Parts & supplies</h1><p>Find stock, check quantities and open the complete record for any maintenance item.</p></div><div class="s83-head-actions"><button class="s83-button" type="button" data-action="global-stock-move">'+icon('adjust')+' Stock movement</button><button class="s83-button" type="button" data-route="counts">'+icon('count')+' Cycle count</button><button class="s83-button primary" type="button" data-action="add-part">＋ Add stock item</button></div></header><section class="s83-summary" aria-label="Inventory summary"><span><b>'+parts.length+'</b> part records</span><span><b>'+allStores().length+'</b> stock locations</span><span class="'+(low?'attention':'')+'"><b>'+low+'</b> need attention</span><span><b>'+parts.reduce((sum,part)=>sum+onHand(part),0)+'</b> total units on hand</span></section><section class="s83-register"><div class="s83-register-head"><div><h2>Stock register</h2><span><b data-s82-visible>'+parts.length+'</b> visible items</span></div><div class="s83-register-actions"><button type="button" data-route="import">Import</button><button type="button" data-route="export">Export</button><button type="button" data-s82-print>Print</button><button type="button" data-s82-print-tags>Print tags</button></div></div><div class="s83-filters"><label class="s83-search"><span>⌕</span><input data-s82-search placeholder="Search part name, code, barcode or location" value="'+esc(ui.inventorySearch||'')+'"></label><label><span>Category</span><select data-s82-category><option value="">All categories</option>'+categories.map(category=>'<option '+(ui.s82Category===category?'selected':'')+'>'+esc(category)+'</option>').join('')+'</select></label><button class="s83-refresh" type="button" data-s82-refresh aria-label="Refresh supplies">↻</button></div><div class="s83-table-wrap"><table class="s83-table"><thead><tr><th><input type="checkbox" data-s82-select-all aria-label="Select all parts"></th><th>Part / locator</th><th>Part number</th><th>Category</th><th>On hand</th><th>Min</th><th>Max</th><th>Stock status</th><th></th></tr></thead><tbody>'+allStores().map(storeRows).join('')+'</tbody></table><div class="s83-empty" data-s82-empty hidden><span>'+icon('supplies')+'</span><strong>No matching stock</strong><p>Try another part number, category or location.</p></div></div><footer class="s83-register-foot"><span>Grouped by stock location</span><span>Select one item to print its QR stock tag</span></footer></section></div>';
  }

  const recordRenderer=renderPartDetail;
  function renderInventoryV83(){return ui.s80SupplyMode==='record'?recordRenderer(getPart(ui.selectedPart)):listPage()}
  renderInventory=renderInventoryV83;window.renderInventory=renderInventoryV83;

  function filterRows(){
    const query=String(document.querySelector('[data-s82-search]')?.value||'').trim().toLowerCase(),category=document.querySelector('[data-s82-category]')?.value||'';let visible=0;
    document.querySelectorAll('[data-s82-part-row]').forEach(row=>{const collapsed=!query&&!category&&list(ui.s82ClosedStores).includes(row.dataset.s82StoreChild),show=(!query||row.dataset.search.includes(query))&&(!category||row.dataset.category===category)&&!collapsed;row.hidden=!show;row.classList.toggle('is-collapsed',collapsed);if(show)visible++});
    document.querySelectorAll('[data-s82-store]').forEach(group=>{const id=group.dataset.s82Store,match=[...document.querySelectorAll('[data-s82-store-child="'+CSS.escape(id)+'"]')].some(row=>!row.hidden);group.hidden=!match&&Boolean(query||category)});
    const count=document.querySelector('[data-s82-visible]');if(count)count.textContent=visible;const empty=document.querySelector('[data-s82-empty]');if(empty)empty.hidden=visible!==0;
  }

  const previousRender=render;
  render=function(){const output=previousRender.apply(this,arguments);document.body.classList.add('safimaint-supplies-v83');navigation();return output};window.render=render;
  document.addEventListener('click',event=>{
    const supplyToggle=event.target.closest('[data-s83-supplies-toggle]');if(supplyToggle){event.preventDefault();event.stopImmediatePropagation();ui.s83SuppliesOpen=!ui.s83SuppliesOpen;navigation();return}
    const storeToggle=event.target.closest('[data-s83-toggle-store]');if(storeToggle){event.preventDefault();event.stopImmediatePropagation();const id=storeToggle.dataset.s83ToggleStore;ui.s82ClosedStores=list(ui.s82ClosedStores);const index=ui.s82ClosedStores.indexOf(id);if(index>=0)ui.s82ClosedStores.splice(index,1);else ui.s82ClosedStores.push(id);const closed=ui.s82ClosedStores.includes(id);storeToggle.setAttribute('aria-expanded',String(!closed));storeToggle.closest('.s83-store-row')?.classList.toggle('collapsed',closed);document.querySelectorAll('[data-s83-store-child="'+CSS.escape(id)+'"]').forEach(row=>{row.classList.toggle('is-collapsed',closed);row.hidden=closed});return}
  },true);
  document.addEventListener('input',event=>{if(event.target.matches('[data-s82-search]'))filterRows()},true);
  document.addEventListener('change',event=>{if(event.target.matches('[data-s82-category]'))filterRows()},true);

  document.body.classList.add('safimaint-supplies-v83');navigation();if(ui.route==='inventory')render();
})();
