'use strict';

// SafiMaintain Supplies v79
// A Fiix-familiar parts workspace centred on stock accuracy, without PO creation.
(function(){
  const supplyRoutes=new Set(['inventory','stock-locations','batch-stock','counts','transactions','bom-groups','businesses']);
  const specialRoutes=new Set(['stock-locations','batch-stock','bom-groups','businesses']);
  ui.s79PartTab=ui.s79PartTab||'stock';
  if(ui.s79SuppliesOpen===undefined)ui.s79SuppliesOpen=true;

  const list=value=>Array.isArray(value)?value:[];
  const qty=p=>typeof partOnHand==='function'?partOnHand(p):list(p?.locations).reduce((n,l)=>n+Number(l.onHand||0),0);
  const low=p=>qty(p)<Number(p.min||0);
  const critical=p=>qty(p)===0&&Number(p.min||0)>0;
  const store=l=>typeof getStore==='function'?getStore(l.storeId):null;
  const supplier=p=>list(state.businesses).find(b=>b.id===p.preferredBusinessId)||(typeof getVendor==='function'?getVendor(p.vendorId):null);
  const can=permission=>!permission||typeof safiCan!=='function'||safiCan(permission);
  const value=p=>qty(p)*Number(p.lastPrice||p.unitCost||0);
  const locationPath=l=>[l.aisle&&'Aisle '+l.aisle,l.row&&'Row '+l.row,l.bin&&'Bin '+l.bin].filter(Boolean).join(' · ')||'Location not detailed';

  function icon(name){
    const paths={
      home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6"/>',
      supplies:'<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/>',
      stock:'<path d="M4 5h16v14H4zM4 10h16M9 10v9"/>',
      batch:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
      count:'<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h3"/><path d="m14 16 2 2 3-4"/>',
      move:'<path d="M5 7h13m0 0-3-3m3 3-3 3M19 17H6m0 0 3 3m-3-3 3-3"/>',
      bom:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8m6-8-4 8"/>',
      business:'<path d="M4 20V7l8-4 8 4v13M8 10h2m4 0h2M8 14h2m4 0h2M10 20v-3h4v3"/>',
      assets:'<circle cx="12" cy="12" r="3"/><path d="M19 15a2 2 0 0 0 1-2v-2a2 2 0 0 0-2-2l-1-2-2-1a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2L7 7 5 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2l2 2 2 1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l2-1Z"/>',
      work:'<path d="M8 5h11v16H5V8zM8 5v3H5m4 5h6m-6 4h6"/>',
      pm:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2M8 3 5 6m11-3 3 3"/>',
      reports:'<path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/>',
      bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      team:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.2a4 4 0 0 1 0 7.6"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19 15l2 2-4 4-2-2-3 1-1 2H7l-1-3-3-2 2-3V9L3 7l4-4 2 2 3-1 1-2h4l1 3 3 2-2 3z"/>',
      alert:'<path d="M12 3 2.7 20h18.6L12 3Z"/><path d="M12 9v4m0 3h.01"/>',
      chevron:'<path d="m8 10 4 4 4-4"/>',
      qr:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 15h2v2h-2zm3 3h2v2h-2zm0-4h2v2h-2zm-4 4h2v2h-2z"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.supplies)+'</svg>';
  }

  function navItem(route,label,glyph,badge='',permission='',child=false){
    if(!can(permission))return'';
    const active=ui.route===route;
    return '<button class="s79-nav-item '+(child?'child ':'')+(active?'active':'')+'" data-route="'+route+'"'+(active?' aria-current="page"':'')+'><span class="s79-nav-icon">'+icon(glyph)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'</button>';
  }
  function suppliesNavigation(){
    const nav=document.getElementById('navigation');if(!nav)return;
    const activeGroup=supplyRoutes.has(ui.route),open=activeGroup||ui.s79SuppliesOpen;
    nav.innerHTML='<div class="s79-nav">'+
      '<p class="s79-nav-label">Daily operations</p>'+navItem('dashboard','Overview','home')+
      '<section class="s79-nav-group '+(activeGroup?'route-active ':'')+(open?'open':'')+'"><button type="button" class="s79-nav-parent" data-s79-supplies-toggle aria-expanded="'+open+'"><span class="s79-nav-icon">'+icon('supplies')+'</span><span>Supplies</span><b id="stockBadge"></b><i>'+icon('chevron')+'</i></button><div class="s79-nav-children" '+(open?'':'hidden')+'>'+navItem('inventory','Parts & supplies','supplies','', 'inventory.view',true)+navItem('stock-locations','Current stock','stock','', 'inventory.view',true)+navItem('batch-stock','Batch stock adjustment','batch','', 'inventory.manage',true)+navItem('counts','Cycle counts','count','', 'inventory.view',true)+navItem('transactions','Stock history','move','', 'inventory.view',true)+navItem('bom-groups','BOM groups','bom','', 'inventory.view',true)+navItem('businesses','Businesses','business','', 'inventory.view',true)+'</div></section>'+
      navItem('assets','Assets','assets','offlineBadge','asset.view')+navItem('work-orders','Work orders','work','workBadge','work.view')+navItem('pm','Preventive maintenance','pm','','pm.manage')+
      '<p class="s79-nav-label">Visibility</p>'+navItem('planning','Reorder list','alert','purchaseBadge','inventory.view')+navItem('reports','Reports & insights','reports','','report.view')+navItem('notifications','Alerts & mail','bell','alertBadge','admin.notifications')+
      '<p class="s79-nav-label">Manage</p>'+navItem('people','People & teams','team','','admin.people')+navItem('security','Administration','settings','','admin.people')+
      '<div class="s79-nav-note"><span>'+icon('supplies')+'</span><div><strong>Stock control centre</strong><small>Count, locate, transfer and trace every maintenance item.</small></div></div></div>';
    nav.setAttribute('aria-label','Primary navigation');
    if(typeof updateBadges==='function')updateBadges();
  }
  simpleNavigation=suppliesNavigation;window.simpleNavigation=suppliesNavigation;

  function health(p){return critical(p)?['Stocked out','danger']:low(p)?['Below minimum','warning']:['In stock','good']}
  function partThumb(){return '<span class="s79-part-thumb">'+icon('supplies')+'</span>'}
  function partsVisible(){
    const q=String(ui.inventorySearch||'').trim().toLowerCase();
    return list(state.parts).filter(p=>{const blob=[p.code,p.name,p.category,p.barcode,supplier(p)?.name].join(' ').toLowerCase();const stateMatch=ui.sfStockFilter==='low'?low(p):ui.sfStockFilter==='zero'?critical(p):ui.sfStockFilter==='healthy'?!low(p):true;return(!q||blob.includes(q))&&stateMatch});
  }
  function sectionHead(title,detail,actions=''){return '<div class="s79-section-head"><div><h3>'+title+'</h3><p>'+detail+'</p></div>'+actions+'</div>'}

  function stockTab(p){
    const rows=list(p.locations),receipts=list(state.stockTransactions).filter(t=>t.partId===p.id&&t.type==='Receipt').slice(0,8);
    return (low(p)?'<div class="s79-callout warning">'+icon('alert')+'<div><strong>'+health(p)[0]+'</strong><span>Verify the physical quantity, transfer stock from another location, or add this item to the external reorder list.</span></div><button class="button small" data-route="planning">Reorder list</button></div>':'')+
      sectionHead('Stock levels per location','Store, aisle, row, bin and control limits','<button class="button small" data-stock-move="'+esc(p.id)+'">Transfer stock</button><button class="button small primary" data-v66-add-location="'+esc(p.id)+'">＋ Add location</button>')+
      '<div class="s79-table-wrap"><table class="s79-table"><thead><tr><th>Status</th><th>Location</th><th>Locator</th><th>On hand</th><th>Min</th><th>Max</th><th>Last movement</th><th></th></tr></thead><tbody>'+(rows.length?rows.map((l,index)=>{const tx=list(state.stockTransactions).find(t=>t.partId===p.id&&t.storeId===l.storeId&&String(t.bin||'')===String(l.bin||''));return '<tr class="s79-click-row" data-v66-open-location="'+esc(p.id)+'|'+index+'"><td><span class="s79-pill '+(l.active===false?'muted':'good')+'"><i></i>'+(l.active===false?'Inactive':'Active')+'</span></td><td><strong>'+esc(store(l)?.name||l.storeId||'Unassigned')+'</strong><small>'+esc(store(l)?.code||'')+'</small></td><td>'+esc(locationPath(l))+'</td><td><strong class="'+(Number(l.onHand||0)<Number(l.min||0)?'s79-low':'')+'">'+Number(l.onHand||0)+' '+esc(p.uom)+'</strong></td><td>'+Number(l.min||0)+'</td><td>'+Number(l.max||0)+'</td><td>'+dateTimeFmt(tx?.at)+'</td><td><span class="s79-row-arrow">→</span></td></tr>'}).join(''):'<tr><td colspan="8"><div class="s79-empty"><strong>No stock locations</strong><span>Add a store, aisle, row and bin to begin tracking this item.</span></div></td></tr>')+'</tbody></table></div>'+
      sectionHead('Recent receipts','Delivered quantities recorded for this item')+'<div class="s79-table-wrap compact"><table class="s79-table"><thead><tr><th>Date</th><th>Reference</th><th>Quantity</th><th>Location</th><th>Received by</th></tr></thead><tbody>'+(receipts.length?receipts.map(t=>'<tr><td>'+dateTimeFmt(t.at)+'</td><td><strong>'+esc(t.reference||'Receipt')+'</strong></td><td>+'+Number(t.qty||0)+' '+esc(p.uom)+'</td><td>'+esc(store(t)?.name||t.storeId)+' · '+esc(t.bin||'')+'</td><td>'+esc(typeof getUser==='function'?(getUser(t.userId)?.name||'System'):'System')+'</td></tr>').join(''):'<tr><td colspan="5"><div class="s79-empty small"><strong>No receipts recorded</strong><span>Receipt movements will appear here.</span></div></td></tr>')+'</tbody></table></div>';
  }
  function countTab(p){
    const rows=list(state.cycleCounts).filter(c=>c.partId===p.id).sort((a,b)=>String(b.at||b.countedAt||'').localeCompare(String(a.at||a.countedAt||'')));
    return sectionHead('Cycle count history','Expected quantity, physical count and posted variance','<button class="button small primary" data-count-part="'+esc(p.id)+'">＋ New cycle count</button>')+'<div class="s79-table-wrap"><table class="s79-table"><thead><tr><th>Count</th><th>Date</th><th>Location</th><th>Expected</th><th>Counted</th><th>Variance</th><th>By</th></tr></thead><tbody>'+(rows.length?rows.map(c=>'<tr><td><strong>'+esc(c.id)+'</strong></td><td>'+dateTimeFmt(c.at||c.countedAt)+'</td><td>'+esc(store(c)?.name||c.storeId)+' · '+esc(c.bin||'')+'</td><td>'+Number(c.expected||0)+'</td><td><strong>'+Number(c.counted||0)+'</strong></td><td><span class="s79-pill '+(Number(c.variance||0)===0?'good':'warning')+'">'+(Number(c.variance||0)>0?'+':'')+Number(c.variance||0)+'</span></td><td>'+esc(typeof getUser==='function'?(getUser(c.userId)?.name||c.userId||'System'):'System')+'</td></tr>').join(''):'<tr><td colspan="7"><div class="s79-empty"><strong>No cycle counts</strong><span>Post a physical count to establish variance history.</span></div></td></tr>')+'</tbody></table></div>';
  }
  function bomTab(p){
    const assets=list(state.assets).filter(a=>list(a.bom).includes(p.id));
    return sectionHead('Asset BOM relationships','Equipment that depends on this stock item','<button class="button small" data-route="assets">Asset hierarchy</button>')+(assets.length?'<div class="s79-card-grid">'+assets.map(a=>'<button class="s79-link-card" data-v66-open-asset="'+esc(a.id)+'"><span>'+icon('assets')+'</span><div><small>'+esc(a.type||'Asset')+'</small><strong>'+esc(a.code)+' · '+esc(a.name)+'</strong><p>Standard quantity '+Number(a.bomQuantities?.[p.id]||1)+' '+esc(p.uom)+'</p></div><b>→</b></button>').join('')+'</div>':'<div class="s79-empty"><strong>Not used on an asset BOM yet</strong><span>Link this item from the Parts / BOM tab of an equipment record.</span></div>');
  }
  function businessesTab(p){
    const ids=new Set([p.preferredBusinessId,p.businessId].filter(Boolean));const legacy=typeof getVendor==='function'?getVendor(p.vendorId):null;
    const rows=[...list(state.businesses).filter(b=>ids.has(b.id)),...(legacy?[legacy]:[])].filter((b,i,a)=>a.findIndex(x=>x.id===b.id)===i);
    return sectionHead('Businesses','Suppliers and manufacturers connected to this part','<button class="button small" data-v56-edit-part="'+esc(p.id)+'">Edit sourcing</button><button class="button small primary" data-route="businesses">Business directory</button>')+(rows.length?'<div class="s79-business-grid">'+rows.map((b,i)=>'<article><span>'+esc((b.name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2))+'</span><div><small>'+(i===0?'Preferred supplier':esc(b.type||'Supplier'))+'</small><strong>'+esc(b.name)+'</strong><p>'+esc(b.contact||'No contact')+' · '+esc(b.phone||'No phone')+'</p><a href="mailto:'+esc(b.email||'')+'">'+esc(b.email||'No email')+'</a></div><b class="s79-pill good">Active</b></article>').join('')+'</div>':'<div class="s79-empty"><strong>No business connected</strong><span>Assign a preferred supplier from Edit sourcing.</span></div>');
  }
  function filesTab(p){
    setTimeout(()=>paintPartFiles(p.id),30);
    return sectionHead('Files','Manuals, photos, specifications and certificates')+'<label class="s79-file-drop"><span>⇧</span><div><strong>Add part documentation</strong><p>Files remain available offline and synchronize with the shared service when connected.</p></div><b class="button primary">Choose files</b><input type="file" multiple data-s79-part-file="'+esc(p.id)+'" hidden></label><div class="attachment-list" data-s79-part-file-list="'+esc(p.id)+'"></div>';
  }
  function customTab(p){
    const fields=Object.entries(p.customFields||{});
    return sectionHead('Custom information','Company-specific codes and part attributes','<button class="button small primary" data-s79-edit-custom="'+esc(p.id)+'">Edit fields</button>')+'<div class="s79-fields"><div><small>Barcode</small><strong>'+esc(p.barcode||'—')+'</strong></div><div><small>Manufacturer</small><strong>'+esc(p.manufacturer||'—')+'</strong></div><div><small>Model</small><strong>'+esc(p.model||'—')+'</strong></div><div><small>Supplier part number</small><strong>'+esc(p.supplierPartNumber||'—')+'</strong></div><div><small>Catalog / reference</small><strong>'+esc(p.catalog||'—')+'</strong></div><div><small>Lead time</small><strong>'+Number(p.leadTimeDays||0)+' days</strong></div><div><small>Currency</small><strong>'+esc(p.currency||'GHS')+'</strong></div><div><small>Unit cost</small><strong>'+money(Number(p.lastPrice||p.unitCost||0))+'</strong></div>'+fields.map(([k,v])=>'<div><small>'+esc(k)+'</small><strong>'+esc(v)+'</strong></div>').join('')+'</div>';
  }
  function historyTab(p){
    const rows=list(state.stockTransactions).filter(t=>t.partId===p.id).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,100);
    return sectionHead('Stock history','Auditable receipts, issues, transfers, adjustments and counts')+'<div class="s79-table-wrap"><table class="s79-table"><thead><tr><th>Date</th><th>Movement</th><th>Location</th><th>Quantity</th><th>Before</th><th>After</th><th>Reference</th><th>User</th></tr></thead><tbody>'+(rows.length?rows.map(t=>'<tr><td>'+dateTimeFmt(t.at)+'</td><td><span class="s79-pill neutral">'+esc(t.type||'Movement')+'</span></td><td>'+esc(store(t)?.name||t.storeId)+' · '+esc(t.bin||'')+'</td><td><strong>'+(Number(t.qty||0)>0?'+':'')+Number(t.qty||0)+' '+esc(p.uom)+'</strong></td><td>'+(t.qtyBefore??'—')+'</td><td>'+(t.qtyAfter??'—')+'</td><td>'+esc(t.reference||t.workOrderId||'—')+'</td><td>'+esc(typeof getUser==='function'?(getUser(t.userId)?.name||t.userId||'System'):'System')+'</td></tr>').join(''):'<tr><td colspan="8"><div class="s79-empty"><strong>No stock history</strong><span>Transactions will appear here.</span></div></td></tr>')+'</tbody></table></div>';
  }
  function partBody(p){return({stock:stockTab,counts:countTab,boms:bomTab,businesses:businessesTab,files:filesTab,custom:customTab,history:historyTab}[ui.s79PartTab]||stockTab)(p)}
  function renderPart(p){
    if(!p)return '<div class="s79-empty large"><strong>Select a part or supply</strong><span>Choose a record from the index to see stock, BOM and history.</span></div>';
    const h=health(p),s=supplier(p),tabs=[['stock','Stock'],['counts','Cycle count'],['boms','BOMs'],['businesses','Businesses'],['files','Files'],['custom','Custom'],['history','History']];
    const qr=window.SafiQR?SafiQR.svg('SM:P:'+p.id+':'+p.code,p.code):icon('qr');
    return '<div class="s79-record-toolbar"><button class="button" data-s79-edit-part="'+esc(p.id)+'">Edit item</button><button class="button" data-stock-move="'+esc(p.id)+'">Stock movement</button><button class="button" data-count-part="'+esc(p.id)+'">Cycle count</button><span></span><button class="button" data-s79-print-tag="'+esc(p.id)+'">'+icon('qr')+' Print tag</button><button class="button primary" data-v66-add-location="'+esc(p.id)+'">＋ Stock location</button></div>'+
      '<header class="s79-part-identity"><div class="s79-part-visual">'+icon('supplies')+'<span>'+esc(p.category||'Part')+'</span></div><div class="s79-part-name"><small>Part / supply</small><h2>'+esc(p.name)+'</h2><p>'+esc(p.code)+' · '+esc(p.category||'Uncategorized')+' · '+esc(p.uom||'ea')+'</p><div class="s79-part-flags"><span class="s79-pill '+h[1]+'"><i></i>'+h[0]+'</span><span class="s79-pill neutral">'+list(p.locations).length+' location'+(list(p.locations).length===1?'':'s')+'</span></div></div><div class="s79-qr">'+qr+'<strong>'+esc(p.code)+'</strong><small>Scan part record</small></div></header>'+
      '<section class="s79-metrics"><div><small>On hand</small><strong>'+qty(p)+' '+esc(p.uom)+'</strong><span>Across active locations</span></div><div><small>Minimum / maximum</small><strong>'+Number(p.min||0)+' / '+Number(p.max||0)+'</strong><span>Replenishment control</span></div><div><small>Preferred supplier</small><strong>'+esc(s?.name||'Not set')+'</strong><span>'+Number(p.leadTimeDays||0)+' day lead time</span></div><div><small>Stock value</small><strong>'+money(value(p))+'</strong><span>'+money(Number(p.lastPrice||p.unitCost||0))+' per '+esc(p.uom)+'</span></div></section>'+
      '<nav class="s79-record-tabs" aria-label="Part record sections">'+tabs.map(([id,label])=>'<button class="'+(ui.s79PartTab===id?'active':'')+'" data-s79-part-tab="'+id+'"'+(ui.s79PartTab===id?' aria-current="page"':'')+'>'+label+'</button>').join('')+'</nav><div class="s79-record-body">'+partBody(p)+'</div>';
  }
  renderPartDetail=renderPart;window.renderPartDetail=renderPart;

  function renderSupplies(){
    const all=list(state.parts),visible=partsVisible(),lowCount=all.filter(low).length,locations=all.reduce((n,p)=>n+list(p.locations).filter(l=>l.active!==false).length,0),total=all.reduce((n,p)=>n+value(p),0);
    if(!getPart(ui.selectedPart)||!visible.some(p=>p.id===ui.selectedPart))ui.selectedPart=visible[0]?.id||all[0]?.id||null;
    const selected=getPart(ui.selectedPart),chip=(id,label,count)=>'<button class="'+(ui.sfStockFilter===id?'active':'')+'" data-sf-stock-filter="'+id+'">'+label+' <b>'+count+'</b></button>';
    return '<div class="s79-page"><header class="s79-page-header"><div><span class="s79-breadcrumb">Supplies / Parts & supplies</span><h1>Parts & supplies</h1><p>Find every maintenance item, control stock by location and trace how it supports equipment.</p></div><div class="s79-page-actions"><button class="button" data-route="batch-stock">Batch adjustment</button><button class="button" data-action="global-stock-move">Stock movement</button><button class="button primary" data-action="add-part">＋ Add part / supply</button></div></header>'+
      '<section class="s79-overview"><button data-route="inventory"><small>Part records</small><strong>'+all.length+'</strong><span>Active catalogue</span></button><button data-route="stock-locations"><small>Stock locations</small><strong>'+locations+'</strong><span>Store / aisle / row / bin</span></button><button class="attention" data-route="planning"><small>Below minimum</small><strong>'+lowCount+'</strong><span>Needs stock attention</span></button><button><small>Inventory value</small><strong>'+money(total)+'</strong><span>Current on-hand value</span></button></section>'+
      '<section class="s79-supplies-workspace"><aside class="s79-part-index"><header><div><small>Parts index</small><strong>'+all.length+' records</strong></div><button data-action="add-part" aria-label="Add part">＋</button></header><label class="s79-search">⌕<input data-filter="inventory" value="'+esc(ui.inventorySearch||'')+'" placeholder="Search code, part or barcode"></label><div class="s79-filters">'+chip('all','All',all.length)+chip('low','Low',lowCount)+chip('zero','Out',all.filter(critical).length)+chip('healthy','Healthy',all.length-lowCount)+'</div><div class="s79-part-list" data-inventory-list>'+visible.map(p=>'<button class="s79-part-row '+(p.id===ui.selectedPart?'active':'')+'" data-select-part="'+esc(p.id)+'" data-inventory-row data-search="'+esc([p.code,p.name,p.category,p.barcode,supplier(p)?.name].join(' ').toLowerCase())+'">'+partThumb()+'<span><strong>'+esc(p.code)+'</strong><b>'+esc(p.name)+'</b><small>'+esc(p.category||'Part')+' · '+list(p.locations).length+' location'+(list(p.locations).length===1?'':'s')+'</small></span><em class="'+(low(p)?'low':'')+'"><strong>'+qty(p)+' '+esc(p.uom)+'</strong><small>'+health(p)[0]+'</small></em></button>').join('')+(visible.length?'':'<div class="s79-empty" data-inventory-empty><strong>No matching supplies</strong><span>Change the search or stock filter.</span></div>')+'</div><footer data-inventory-count>'+visible.length+' of '+all.length+' records</footer></aside><main class="s79-part-record" data-inventory-detail>'+renderPart(selected)+'</main></section></div>';
  }
  renderInventory=renderSupplies;window.renderInventory=renderSupplies;

  function currentStockPage(){
    const rows=[];list(state.parts).forEach(p=>list(p.locations).forEach((l,index)=>rows.push({p,l,index})));const on=rows.reduce((n,x)=>n+Number(x.l.onHand||0),0),below=rows.filter(x=>Number(x.l.onHand||0)<Number(x.l.min||0)).length;
    return '<div class="s79-page">'+pageHeader('Supplies / Current stock','Current stock','See every part by physical store and bin, with location-level control limits.','<button class="button" data-route="batch-stock">Batch adjustment</button><button class="button primary" data-action="global-stock-move">＋ Stock movement</button>')+'<section class="s79-overview"><button><small>Location records</small><strong>'+rows.length+'</strong><span>Across '+list(state.stores).length+' stores</span></button><button><small>Total units</small><strong>'+on+'</strong><span>All units of measure</span></button><button class="attention"><small>Locations below minimum</small><strong>'+below+'</strong><span>Verify or replenish</span></button><button><small>Active parts</small><strong>'+list(state.parts).length+'</strong><span>In the catalogue</span></button></section><section class="s79-panel">'+sectionHead('Stock by location','Select a row to open its full part record')+'<div class="s79-table-wrap"><table class="s79-table"><thead><tr><th>Part / supply</th><th>Store</th><th>Aisle</th><th>Row</th><th>Bin</th><th>On hand</th><th>Min</th><th>Max</th><th>Status</th></tr></thead><tbody>'+rows.map(x=>'<tr class="s79-click-row" data-s79-open-part="'+esc(x.p.id)+'"><td><strong>'+esc(x.p.code)+' · '+esc(x.p.name)+'</strong><small>'+esc(x.p.category||'Part')+'</small></td><td>'+esc(store(x.l)?.name||x.l.storeId)+'</td><td>'+esc(x.l.aisle||'—')+'</td><td>'+esc(x.l.row||'—')+'</td><td>'+esc(x.l.bin||'—')+'</td><td><strong>'+Number(x.l.onHand||0)+' '+esc(x.p.uom)+'</strong></td><td>'+Number(x.l.min||0)+'</td><td>'+Number(x.l.max||0)+'</td><td><span class="s79-pill '+(Number(x.l.onHand||0)<Number(x.l.min||0)?'warning':'good')+'"><i></i>'+(Number(x.l.onHand||0)<Number(x.l.min||0)?'Below min':'Available')+'</span></td></tr>').join('')+'</tbody></table></div></section></div>';
  }
  function batchPage(){
    const rows=[];list(state.parts).forEach(p=>list(p.locations).forEach((l,index)=>rows.push({p,l,index})));
    return '<div class="s79-page">'+pageHeader('Supplies / Batch stock adjustment','Batch stock adjustment','Update several physical quantities together. Only changed rows create auditable adjustment transactions.','<button class="button" data-route="stock-locations">Cancel</button><button class="button primary" data-s79-post-batch>Post '+rows.length+' reviewed rows</button>')+'<div class="s79-callout info">'+icon('batch')+'<div><strong>Enter the new quantity on hand</strong><span>Unchanged values are skipped. Each variance is written to Stock History with before and after quantities.</span></div></div><section class="s79-panel"><div class="s79-table-wrap"><table class="s79-table s79-batch-table"><thead><tr><th>Part / supply</th><th>Store / locator</th><th>Current</th><th>New quantity</th><th>Min / max</th><th>Variance preview</th></tr></thead><tbody>'+rows.map(x=>'<tr data-s79-batch-row="'+esc(x.p.id)+'|'+x.index+'"><td><strong>'+esc(x.p.code)+' · '+esc(x.p.name)+'</strong><small>'+esc(x.p.category||'Part')+'</small></td><td><strong>'+esc(store(x.l)?.name||x.l.storeId)+'</strong><small>'+esc(locationPath(x.l))+'</small></td><td><strong data-s79-before>'+Number(x.l.onHand||0)+' '+esc(x.p.uom)+'</strong></td><td><input type="number" min="0" step="0.01" value="'+Number(x.l.onHand||0)+'" data-s79-batch-input></td><td>'+Number(x.l.min||0)+' / '+Number(x.l.max||0)+'</td><td><span class="s79-variance" data-s79-variance>0 '+esc(x.p.uom)+'</span></td></tr>').join('')+'</tbody></table></div><label class="s79-batch-note"><span>Adjustment note</span><input data-s79-batch-note placeholder="e.g. quarterly stock take"></label></section></div>';
  }
  function bomGroupsPage(){
    const groups=list(state.bomGroups);
    return '<div class="s79-page">'+pageHeader('Supplies / BOM groups','Bill of materials groups','Build reusable spare-part sets and apply them to similar equipment.','<button class="button primary" data-v51-new-bom-group>＋ New BOM group</button>')+'<section class="s79-card-grid">'+(groups.length?groups.map(g=>'<article class="s79-bom-card"><span>'+icon('bom')+'</span><div><small>Reusable BOM</small><h2>'+esc(g.name)+'</h2><p>'+esc(g.description||'Equipment spare-part set')+'</p><div>'+list(g.parts).map(x=>{const p=getPart(x.partId);return '<b>'+esc(p?.code||x.partId)+' × '+Number(x.qty||1)+'</b>'}).join('')+'</div></div><footer><span>'+list(g.assetIds).length+' linked assets</span><button class="button small" data-v51-apply-bom="'+esc(g.id)+'">Apply to asset</button><button class="button small danger" data-v51-delete-bom="'+esc(g.id)+'">Delete</button></footer></article>').join(''):'<div class="s79-empty large"><strong>No BOM groups yet</strong><span>Create a reusable spare-parts set for repeated equipment families.</span><button class="button primary" data-v51-new-bom-group>＋ New BOM group</button></div>')+'</section></div>';
  }
  function businessesPage(){
    const rows=[...list(state.businesses),...list(state.vendors)].filter((b,i,a)=>a.findIndex(x=>x.id===b.id||x.name===b.name)===i);
    return '<div class="s79-page">'+pageHeader('Supplies / Businesses','Businesses','Supplier and manufacturer contacts connected to maintenance parts.','<button class="button primary" data-v47-new-business>＋ Add business</button>')+'<section class="s79-panel">'+sectionHead('Business directory',rows.length+' active records')+'<div class="s79-business-grid directory">'+rows.map(b=>{const linked=list(state.parts).filter(p=>p.preferredBusinessId===b.id||p.businessId===b.id||p.vendorId===b.id||p.vendorId===b.sourceVendorId).length;return '<article><span>'+esc((b.name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2))+'</span><div><small>'+esc(b.type||b.group||'Supplier')+'</small><strong>'+esc(b.name)+'</strong><p>'+esc(b.contact||'No contact')+' · '+esc(b.phone||'No phone')+'</p><a href="mailto:'+esc(b.email||'')+'">'+esc(b.email||'No email')+'</a></div><b>'+linked+' parts</b></article>'}).join('')+'</div></section></div>';
  }
  function pageHeader(kicker,title,text,actions=''){return '<header class="s79-page-header"><div><span class="s79-breadcrumb">'+kicker+'</span><h1>'+title+'</h1><p>'+text+'</p></div><div class="s79-page-actions">'+actions+'</div></header>'}

  async function paintPartFiles(id){
    const target=document.querySelector('[data-s79-part-file-list="'+CSS.escape(String(id))+'"]');if(!target)return;
    if(window.SafiFileUI?.paint)await SafiFileUI.paint('part',id,target);
  }
  function printTag(p){
    const qr=window.SafiQR?SafiQR.svg('SM:P:'+p.id+':'+p.code,p.code):'';const popup=window.open('','_blank','width=520,height=620');if(!popup){toast('Allow pop-ups to print the tag');return}popup.opener=null;
    popup.document.write('<!doctype html><title>'+esc(p.code)+' tag</title><style>body{font-family:Arial,sans-serif;display:grid;place-items:center;min-height:90vh;color:#071b2d}.tag{border:2px solid #0a2440;border-radius:18px;padding:28px;width:300px;text-align:center}.tag svg{width:210px}.tag h1{font-size:25px;margin:12px 0 4px}.tag p{margin:4px;color:#526579}@media print{button{display:none}.tag{border-color:#000}}</style><div class="tag">'+qr+'<h1>'+esc(p.code)+'</h1><strong>'+esc(p.name)+'</strong><p>'+esc(p.category||'Part / supply')+'</p><button onclick="print()">Print tag</button></div>');popup.document.close();
  }

  const previousTitle=routeTitle;
  routeTitle=function(){return({inventory:'Parts & supplies','stock-locations':'Current stock','batch-stock':'Batch stock adjustment','bom-groups':'BOM groups',businesses:'Businesses'}[ui.route]||previousTitle())};window.routeTitle=routeTitle;
  const previousRender=render;
  render=function(){
    previousRender.apply(this,arguments);
    const view=document.getElementById('appView');
    if(view&&specialRoutes.has(ui.route))view.innerHTML=ui.route==='stock-locations'?currentStockPage():ui.route==='batch-stock'?batchPage():ui.route==='bom-groups'?bomGroupsPage():businessesPage();
    suppliesNavigation();document.body.classList.add('safimaint-supplies-v79');document.title=routeTitle()+' · SafiMaintain';
    if(ui.route==='inventory'&&ui.s79PartTab==='files'&&ui.selectedPart)setTimeout(()=>paintPartFiles(ui.selectedPart),30);
  };window.render=render;

  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-s79-supplies-toggle]');if(toggle){event.preventDefault();event.stopImmediatePropagation();ui.s79SuppliesOpen=!ui.s79SuppliesOpen;const group=toggle.closest('.s79-nav-group'),children=group?.querySelector('.s79-nav-children');group?.classList.toggle('open',ui.s79SuppliesOpen);toggle.setAttribute('aria-expanded',String(ui.s79SuppliesOpen));if(children)children.hidden=!ui.s79SuppliesOpen;return}
    const tab=event.target.closest('[data-s79-part-tab]');if(tab){event.preventDefault();event.stopImmediatePropagation();ui.s79PartTab=tab.dataset.s79PartTab;const p=getPart(ui.selectedPart),target=document.querySelector('[data-inventory-detail]');if(target&&p)target.innerHTML=renderPart(p);return}
    const open=event.target.closest('[data-s79-open-part]');if(open){event.preventDefault();event.stopImmediatePropagation();ui.selectedPart=open.dataset.s79OpenPart;ui.s79PartTab='stock';go('inventory');return}
    const print=event.target.closest('[data-s79-print-tag]');if(print){event.preventDefault();event.stopImmediatePropagation();const p=getPart(print.dataset.s79PrintTag);if(p)printTag(p);return}
    const edit=event.target.closest('[data-s79-edit-part]');if(edit){event.preventDefault();event.stopImmediatePropagation();const p=getPart(edit.dataset.s79EditPart);if(!p)return;openModal({eyebrow:p.code+' · Part / supply',title:'Edit item',submitText:'Save item',body:'<div class="form-grid">'+field('code','Part number',p.code,{required:true})+field('name','Description',p.name,{required:true})+field('category','Category',p.category||'')+field('uom','Unit of measure',p.uom||'ea')+field('barcode','Barcode / scan value',p.barcode||'')+field('unitCost','Unit cost',String(p.lastPrice||p.unitCost||0),{type:'number',min:0,step:'.01'})+field('manufacturer','Make / manufacturer',p.manufacturer||'')+field('model','Model',p.model||'')+'</div>',onSubmit:fd=>{const code=String(fd.get('code')||'').trim(),name=String(fd.get('name')||'').trim();if(!code||!name){toast('Part number and description are required');return}if(state.parts.some(x=>x.id!==p.id&&String(x.code).toLowerCase()===code.toLowerCase())){toast('That part number already exists');return}Object.assign(p,{code,name,category:String(fd.get('category')||''),uom:String(fd.get('uom')||'ea'),barcode:String(fd.get('barcode')||''),unitCost:Number(fd.get('unitCost')||0),lastPrice:Number(fd.get('unitCost')||0),manufacturer:String(fd.get('manufacturer')||''),model:String(fd.get('model')||'')});addAudit('PART_UPDATED',p.id,p.code+' '+p.name);saveState();closeModal();render();toast('Part / supply saved')}});return}
    const custom=event.target.closest('[data-s79-edit-custom]');if(custom){event.preventDefault();event.stopImmediatePropagation();const p=getPart(custom.dataset.s79EditCustom);if(!p)return;const text=Object.entries(p.customFields||{}).map(([k,v])=>k+': '+v).join('\n');openModal({eyebrow:p.code+' · Custom information',title:'Edit part fields',submitText:'Save fields',body:'<label class="span-2">One field per line<textarea name="fields" rows="9" placeholder="Manufacturer: SKF\nModel: 6205-2RS">'+esc(text)+'</textarea></label>',onSubmit:fd=>{const values={};String(fd.get('fields')||'').split('\n').forEach(line=>{const i=line.indexOf(':');if(i>0){const k=line.slice(0,i).trim(),v=line.slice(i+1).trim();if(k)values[k]=v}});p.customFields=values;addAudit('PART_CUSTOM_FIELDS_UPDATED',p.id,Object.keys(values).length+' fields');saveState();closeModal();render();toast('Part fields saved')}});return}
    if(event.target.closest('[data-s79-post-batch]')){event.preventDefault();event.stopImmediatePropagation();let changed=0;const note=document.querySelector('[data-s79-batch-note]')?.value.trim()||'Batch stock adjustment';document.querySelectorAll('[data-s79-batch-row]').forEach(row=>{const [pid,index]=row.dataset.s79BatchRow.split('|'),p=getPart(pid),l=p?.locations?.[Number(index)],input=row.querySelector('[data-s79-batch-input]');if(!p||!l||!input)return;const desired=Number(input.value),before=Number(l.onHand||0);if(!Number.isFinite(desired)||desired<0)return;if(desired!==before){postStock(p.id,'Adjustment',desired-before,l.storeId,l.bin,{reference:'Batch adjustment',note});changed++}});if(!changed){toast('No quantities changed');return}addAudit('BATCH_STOCK_ADJUSTMENT','SUPPLIES',changed+' location quantities updated');saveState();render();toast(changed+' stock location'+(changed===1?'':'s')+' adjusted');return}
  },true);
  document.addEventListener('input',event=>{
    const input=event.target.closest('[data-s79-batch-input]');if(!input)return;const row=input.closest('[data-s79-batch-row]'),[pid,index]=row.dataset.s79BatchRow.split('|'),p=getPart(pid),before=Number(p?.locations?.[Number(index)]?.onHand||0),diff=Number(input.value||0)-before,out=row.querySelector('[data-s79-variance]');if(out){out.textContent=(diff>0?'+':'')+diff+' '+(p?.uom||'');out.classList.toggle('changed',diff!==0)}
  },true);
  document.addEventListener('change',async event=>{
    const input=event.target.closest('[data-s79-part-file]');if(!input||!input.files?.length)return;event.stopImmediatePropagation();const files=[...input.files],id=input.dataset.s79PartFile;input.disabled=true;try{for(const file of files)await SafiFiles.add('part',id,file);addAudit('PART_FILES_ADDED',id,files.map(f=>f.name).join(', '));saveState();toast(files.length+' file'+(files.length===1?'':'s')+' added');await paintPartFiles(id);setTimeout(()=>window.SafiAttachmentSync?.syncPending({quiet:true}),300)}catch(err){toast(err.message)}finally{input.value='';input.disabled=false}
  },true);

  suppliesNavigation();if(supplyRoutes.has(ui.route))render();
})();
