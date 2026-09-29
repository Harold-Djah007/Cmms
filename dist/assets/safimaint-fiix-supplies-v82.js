'use strict';
(()=>{
  const supplyRoutes=new Set(['inventory','stock-locations','batch-stock','counts','transactions','bom-groups','businesses']);
  ui.s82SuppliesOpen=ui.s82SuppliesOpen!==false;
  ui.s82ClosedStores=Array.isArray(ui.s82ClosedStores)?ui.s82ClosedStores:[];
  ui.s82Category=ui.s82Category||'';
  ui.s82SelectedParts=Array.isArray(ui.s82SelectedParts)?ui.s82SelectedParts:[];

  const list=value=>Array.isArray(value)?value:[];
  const can=permission=>!permission||typeof safiCan!=='function'||safiCan(permission);
  const qty=part=>list(part?.locations).filter(location=>location.active!==false).reduce((sum,location)=>sum+Number(location.onHand||0),0);
  const locationQty=(part,storeId)=>list(part?.locations).filter(location=>location.active!==false&&String(location.storeId||'UNASSIGNED')===String(storeId)).reduce((sum,location)=>sum+Number(location.onHand||0),0);
  const low=part=>qty(part)<Number(part.min||0);
  const out=part=>qty(part)<=0;
  const stores=()=>{const rows=list(state.stores).map(store=>({id:String(store.id),name:store.name||store.code||store.id,code:store.code||''}));const known=new Set(rows.map(store=>store.id));list(state.parts).forEach(part=>list(part.locations).forEach(location=>{const id=String(location.storeId||'UNASSIGNED');if(!known.has(id)){rows.push({id,name:id==='UNASSIGNED'?'Unassigned stock':id,code:''});known.add(id)}}));return rows};

  function icon(name){
    const paths={
      dashboard:'<path d="M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z"/>',
      work:'<path d="M7 4h10v3h3v13H4V7h3V4Zm2 3h6V6H9v1Zm-2 4h10M7 15h7"/>',
      bell:'<path d="M18 9a6 6 0 0 0-12 0c0 6-3 6-3 8h18c0-2-3-2-3-8Zm-8 11h4"/>',
      assets:'<circle cx="12" cy="12" r="3"/><path d="m19 15 2 2-4 4-2-2-3 1-1 2H7l-1-3-3-2 2-3V9L3 7l4-4 2 2 3-1 1-2h4l1 3 3 2-2 3v5Z"/>',
      supplies:'<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/>',
      reports:'<path d="M4 20V9m5 11V4m5 16v-7m5 7V7"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19 15l2 2-4 4-2-2-3 1-1 2H7l-1-3-3-2 2-3V9L3 7l4-4 2 2 3-1 1-2h4l1 3 3 2-2 3v5Z"/>',
      location:'<path d="M4 20h16M6 20V8l6-4 6 4v12M9 11h2m2 0h2m-6 4h2m2 0h2"/>',
      item:'<path d="m5 8 7-4 7 4-7 4-7-4Z"/><path d="M5 8v8l7 4 7-4V8M12 12v8"/>',
      chevron:'<path d="m9 7 5 5-5 5"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.item)+'</svg>';
  }

  function navItem(route,label,glyph,permission='',child=false,badge=''){
    if(!can(permission))return'';
    const active=ui.route===route;
    return '<button class="s82-nav-item '+(child?'child ':'')+(active?'active':'')+'" data-route="'+route+'"'+(active?' aria-current="page"':'')+'><span class="s82-nav-icon">'+icon(glyph)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'</button>';
  }
  function compactNavigation(){
    const nav=document.getElementById('navigation');if(!nav)return;
    const activeGroup=supplyRoutes.has(ui.route),open=activeGroup||ui.s82SuppliesOpen;
    nav.innerHTML='<div class="s82-nav">'+
      navItem('dashboard','Dashboard','dashboard')+
      navItem('work-orders','Work orders','work','work.view',false,'workBadge')+
      navItem('notifications','Notifications','bell','admin.notifications',false,'alertBadge')+
      navItem('assets','Assets','assets','asset.view',false,'offlineBadge')+
      '<section class="s82-nav-group '+(activeGroup?'route-active ':'')+(open?'open':'')+'"><button type="button" class="s82-nav-parent" data-s82-supplies-toggle aria-expanded="'+open+'"><span class="s82-nav-icon">'+icon('supplies')+'</span><span>Supplies</span><i>'+icon('chevron')+'</i></button><div class="s82-nav-children" '+(open?'':'hidden')+'>'+
        navItem('inventory','Parts & supplies','item','inventory.view',true)+
        navItem('stock-locations','Current stock','location','inventory.view',true)+
        navItem('batch-stock','Batch stock adjustment','item','inventory.manage',true)+
        navItem('counts','Inventory cycle count','item','inventory.view',true)+
        navItem('bom-groups','Bill of materials groups','item','inventory.view',true)+
        navItem('businesses','Businesses','item','inventory.view',true)+
      '</div></section>'+
      navItem('reports','Reports','reports','report.view')+
      navItem('security','Settings','settings','admin.people')+
      '</div>';
    nav.setAttribute('aria-label','Primary navigation');
    if(typeof updateBadges==='function')updateBadges();
  }
  simpleNavigation=compactNavigation;window.simpleNavigation=compactNavigation;

  function partStatus(part){return out(part)?['Stocked out','out']:low(part)?['Below minimum','low']:['In stock','good']}
  function statusBadge(part){const value=partStatus(part);return '<span class="s82-status '+value[1]+'"><i></i>'+value[0]+'</span>'}
  function storeRows(store){
    const closed=ui.s82ClosedStores.includes(store.id);
    const rows=[];
    list(state.parts).forEach(part=>{
      const onHand=locationQty(part,store.id);const has=list(part.locations).some(location=>String(location.storeId||'UNASSIGNED')===store.id);
      if(!has)return;
      const search=[store.name,store.code,part.name,part.code,part.category,part.barcode].join(' ').toLowerCase();
      rows.push('<tr class="s82-part-row" '+(closed?'hidden ':'')+'data-s82-store-child="'+esc(store.id)+'" data-s82-part-row data-search="'+esc(search)+'" data-category="'+esc(part.category||'')+'"><td><input type="checkbox" data-s82-select="'+esc(part.id)+'" '+(ui.s82SelectedParts.includes(part.id)?'checked':'')+' aria-label="Select '+esc(part.name)+'"></td><td class="s82-tree-cell"><span class="s82-branch"></span><span class="s82-part-icon">'+icon('item')+'</span></td><td><button type="button" class="s82-part-link" data-s82-open-part="'+esc(part.id)+'"><strong>'+esc(part.name)+'</strong><small>'+esc(part.category||'Part / supply')+'</small></button></td><td><strong>'+esc(part.code)+'</strong></td><td>'+onHand+' '+esc(part.uom||'ea')+'</td><td>'+statusBadge(part)+'</td><td><button type="button" class="s82-open" data-s82-open-part="'+esc(part.id)+'" aria-label="Open '+esc(part.name)+'">›</button></td></tr>');
    });
    const total=list(state.parts).reduce((sum,part)=>sum+locationQty(part,store.id),0);
    const group='<tr class="s82-store-row" data-s82-store="'+esc(store.id)+'"><td><input type="checkbox" aria-label="Select '+esc(store.name)+' location"></td><td class="s82-tree-cell"><button type="button" data-s82-toggle-store="'+esc(store.id)+'" aria-label="'+(closed?'Expand ':'Collapse ')+esc(store.name)+'"><span class="s82-expand '+(closed?'closed':'')+'">›</span><span class="s82-store-icon">'+icon('location')+'</span></button></td><td><button type="button" class="s82-store-name" data-s82-toggle-store="'+esc(store.id)+'"><strong>'+esc(store.name)+'</strong><small>Stock location</small></button></td><td>'+esc(store.code||'—')+'</td><td><strong>'+total+'</strong></td><td><span class="s82-location-label">Location</span></td><td></td></tr>';
    return group+rows.join('');
  }
  function listPage(){
    const parts=list(state.parts),categories=[...new Set(parts.map(part=>part.category).filter(Boolean))].sort();
    return '<div class="s82-page"><header class="s82-page-title"><h1>Parts / Supplies</h1><span>'+parts.length+' records</span></header><section class="s82-toolbar" aria-label="Parts and supplies actions"><button type="button" data-action="add-part">＋ New</button><button type="button" data-route="import">⇩ Import</button><button type="button" data-route="export">⇧ Export</button><button type="button" data-s82-print>▣ Print</button><button type="button" data-s82-print-tags>▦ Print tags</button><button type="button" class="s82-disabled" disabled>Delete</button><details><summary>More⌄</summary><div><button type="button" data-route="stock-locations">Current stock</button><button type="button" data-route="batch-stock">Batch stock adjustment</button><button type="button" data-route="counts">Inventory cycle count</button><button type="button" data-route="transactions">Stock history</button></div></details></section><section class="s82-register"><div class="s82-filterbar"><strong>Parts/Supplies</strong><label><span>⌕</span><input data-s82-search placeholder="Search parts, supplies or locations" value="'+esc(ui.inventorySearch||'')+'"></label><label class="s82-category">Filter by category:<select data-s82-category><option value="">Parts and Supplies</option>'+categories.map(category=>'<option '+(ui.s82Category===category?'selected':'')+'>'+esc(category)+'</option>').join('')+'</select></label><button type="button" data-s82-refresh aria-label="Refresh">↻</button></div><div class="s82-table-wrap"><table class="s82-table"><thead><tr><th><input type="checkbox" data-s82-select-all aria-label="Select all parts"></th><th>Location</th><th>Name</th><th>Code</th><th>On hand</th><th>Status</th><th></th></tr></thead><tbody>'+stores().map(storeRows).join('')+'</tbody></table><div class="s82-empty" data-s82-empty hidden>No matching parts or supplies.</div></div><footer class="s82-footer"><span><b data-s82-visible>'+parts.length+'</b> parts and supplies</span><span>Grouped by stock location</span></footer></section></div>';
  }

  const recordRenderer=renderPartDetail;
  function renderInventoryV82(){return ui.s80SupplyMode==='record'?recordRenderer(getPart(ui.selectedPart)):listPage()}
  renderInventory=renderInventoryV82;window.renderInventory=renderInventoryV82;

  function filterRows(){
    const query=String(document.querySelector('[data-s82-search]')?.value||'').trim().toLowerCase(),category=document.querySelector('[data-s82-category]')?.value||'';let visible=0;
    document.querySelectorAll('[data-s82-part-row]').forEach(row=>{const collapsed=!query&&!category&&ui.s82ClosedStores.includes(row.dataset.s82StoreChild),show=(!query||row.dataset.search.includes(query))&&(!category||row.dataset.category===category)&&!collapsed;row.hidden=!show;if(show)visible++});
    document.querySelectorAll('[data-s82-store]').forEach(group=>{const id=group.dataset.s82Store,match=[...document.querySelectorAll('[data-s82-store-child="'+CSS.escape(id)+'"]')].some(row=>!row.hidden);group.hidden=!match&&Boolean(query||category)});
    const unique=new Set([...document.querySelectorAll('[data-s82-part-row]')].filter(row=>!row.hidden).map(row=>row.querySelector('[data-s82-select]')?.dataset.s82Select).filter(Boolean));const count=document.querySelector('[data-s82-visible]');if(count)count.textContent=unique.size;const empty=document.querySelector('[data-s82-empty]');if(empty)empty.hidden=visible!==0;
  }
  function updateSelection(){document.querySelectorAll('[data-s82-select]').forEach(input=>input.checked=ui.s82SelectedParts.includes(input.dataset.s82Select))}

  const previousRender=render;
  render=function(){const output=previousRender.apply(this,arguments);document.body.classList.add('safimaint-supplies-v82');compactNavigation();return output};window.render=render;
  document.addEventListener('click',event=>{
    const toggleNav=event.target.closest('[data-s82-supplies-toggle]');if(toggleNav){event.preventDefault();event.stopImmediatePropagation();ui.s82SuppliesOpen=!ui.s82SuppliesOpen;compactNavigation();return}
    const toggleStore=event.target.closest('[data-s82-toggle-store]');if(toggleStore){event.preventDefault();event.stopImmediatePropagation();const id=toggleStore.dataset.s82ToggleStore,index=ui.s82ClosedStores.indexOf(id);if(index>=0)ui.s82ClosedStores.splice(index,1);else ui.s82ClosedStores.push(id);render();return}
    const open=event.target.closest('[data-s82-open-part]');if(open){event.preventDefault();event.stopImmediatePropagation();ui.selectedPart=open.dataset.s82OpenPart;ui.s80SupplyMode='record';ui.s80SupplyTab='stock';render();return}
    if(event.target.closest('[data-s82-refresh]')){event.preventDefault();render();toast('Parts and supplies refreshed');return}
    if(event.target.closest('[data-s82-print]')){event.preventDefault();window.print();return}
    if(event.target.closest('[data-s82-print-tags]')){event.preventDefault();if(ui.s82SelectedParts.length!==1){toast('Select one part to print its tag');return}ui.selectedPart=ui.s82SelectedParts[0];ui.s80SupplyMode='record';render();setTimeout(()=>document.querySelector('[data-s80-print]')?.click(),20);return}
  },true);
  document.addEventListener('input',event=>{if(event.target.matches('[data-s82-search]')){ui.inventorySearch=event.target.value;filterRows()}},true);
  document.addEventListener('change',event=>{
    if(event.target.matches('[data-s82-category]')){ui.s82Category=event.target.value;filterRows();return}
    if(event.target.matches('[data-s82-select]')){const id=event.target.dataset.s82Select;if(event.target.checked&&!ui.s82SelectedParts.includes(id))ui.s82SelectedParts.push(id);if(!event.target.checked)ui.s82SelectedParts=ui.s82SelectedParts.filter(value=>value!==id);return}
    if(event.target.matches('[data-s82-select-all]')){ui.s82SelectedParts=event.target.checked?list(state.parts).map(part=>part.id):[];updateSelection()}
  },true);
  document.body.classList.add('safimaint-supplies-v82');compactNavigation();if(ui.route==='inventory')render();
})();
