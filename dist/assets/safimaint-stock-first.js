'use strict';

// SafiMaintain 9: Fiix-familiar maintenance structure with a simpler stock-taking centre.
(function(){
  const blockedRoutes=new Set(['purchase-orders','rfqs','purchase-analytics','purchase-settings']);
  ui.sfStockFilter=ui.sfStockFilter||'all';
  ui.sfPartTab=ui.sfPartTab||'stock';

  function svg(path,extra=''){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+extra+'</svg>'
  }
  function sfIcon(name){
    const icons={
      home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6"/>',
      stock:'<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/>',
      count:'<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h3"/><path d="m14.5 16.5 1.5 1.5 3-3"/>',
      move:'<path d="M5 7h13m0 0-3-3m3 3-3 3M19 17H6m0 0 3 3m-3-3 3-3"/>',
      assets:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06A1.7 1.7 0 0 0 19.4 9c.25.62.85 1.02 1.52 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
      work:'<path d="M9 5h10v16H5V9z"/><path d="M9 5v4H5m4 4h6m-6 4h6"/>',
      pm:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2M8 3 5 6m11-3 3 3"/>',
      reports:'<path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/>',
      team:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.9l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.52V21h-4v-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1H3v-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.9l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.9-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.25.62.85 1 1.52 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
      search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      scan:'<path d="M4 8V4h4m8 0h4v4M4 16v4h4m8 0h4v-4M8 12h8"/>',
      alert:'<path d="M12 3 2.7 20h18.6L12 3Z"/><path d="M12 9v4m0 3h.01"/>',
      store:'<path d="M3 9h18l-2-5H5L3 9Z"/><path d="M5 9v11h14V9M9 20v-6h6v6"/>',
      part:'<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/>',
      chevron:'<path d="m9 18 6-6-6-6"/>'
    };
    return svg(icons[name]||icons.part)
  }
  function arr(value){return Array.isArray(value)?value:[]}
  function onHand(p){return typeof partOnHand==='function'?partOnHand(p):arr(p?.locations).reduce((n,l)=>n+Number(l.onHand||0),0)}
  function isLow(p){return onHand(p)<Number(p.min||0)}
  function isCritical(p){return onHand(p)===0&&Number(p.min||0)>0}
  function can(permission){return !permission||typeof safiCan!=='function'||safiCan(permission)}
  function currentRoute(route){
    if(route==='dashboard')return ui.route==='dashboard';
    if(route==='inventory')return ['inventory','transactions','counts','planning','stock-locations','inventory-costing','bom-groups','parts-forecaster'].includes(ui.route);
    if(route==='assets')return ['assets','asset-register','facilities','equipment','tools','meters','downtime','asset-events'].includes(ui.route);
    if(route==='work-orders')return ['work-orders','requests','calendar','pm','task-groups','projects','field-home'].includes(ui.route);
    if(route==='reports')return ['reports','analytics','reliability','maintenance-outlook','failure-analysis','work-insights'].includes(ui.route);
    if(route==='security')return ['security','sites','roles','permissions','notifications','workflows','import','export','audit','localization','sync-center','people','groups'].includes(ui.route);
    return ui.route===route
  }

  function navItem(route,label,icon,badge='',permission=''){
    if(!can(permission))return'';
    return '<button class="sf-nav-item '+(currentRoute(route)?'active':'')+'" data-route="'+route+'"><span class="nav-icon">'+sfIcon(icon)+'</span><span>'+label+'</span>'+(badge?'<b id="'+badge+'"></b>':'')+'</button>'
  }
  function stockNavigation(){
    const nav=document.getElementById('navigation');if(!nav)return;
    nav.innerHTML='<div class="sf-nav">'+
      '<div class="sf-nav-label">Daily operations</div>'+navItem('dashboard','Overview','home')+navItem('inventory','Stockroom','stock','stockBadge','inventory.view')+navItem('counts','Cycle counts','count','','inventory.view')+navItem('transactions','Stock movements','move','','inventory.view')+navItem('assets','Assets','assets','offlineBadge','asset.view')+navItem('work-orders','Work orders','work','workBadge','work.view')+navItem('pm','Preventive maintenance','pm','','pm.manage')+
      '<div class="sf-nav-label">Visibility</div>'+navItem('planning','Reorder list','alert','purchaseBadge','inventory.view')+navItem('reports','Reports & insights','reports','','report.view')+navItem('notifications','Alerts & mail','bell','alertBadge','admin.notifications')+
      '<div class="sf-nav-label">Manage</div>'+navItem('people','People & teams','team','','admin.people')+navItem('security','Administration','settings','','admin.people')+
      '<div class="sf-nav-note"><strong>Stock-first workspace</strong><span>Count, receive, issue and locate parts without a purchasing maze.</span></div></div>';
    if(typeof updateBadges==='function')updateBadges()
  }
  simpleNavigation=stockNavigation;window.simpleNavigation=stockNavigation;

  function heroVisual(){
    return '<div class="sf-warehouse" aria-hidden="true"><div class="sf-warehouse-head"><span>MAIN MAINTENANCE STORE</span><span>Live stock</span></div><div class="sf-shelf"><i class="sf-box a"></i><i class="sf-box b"></i><i class="sf-box c"></i><i class="sf-box d"></i></div><i class="sf-scan-beam"></i><i class="sf-conveyor"></i></div>'
  }
  function kpi(label,value,hint,route,icon,tone='',percent=70){
    return '<button class="sf-kpi '+tone+'" data-route="'+route+'"><div class="sf-kpi-top"><span class="sf-kpi-icon">'+sfIcon(icon)+'</span></div><small>'+label+'</small><strong>'+value+'</strong><em>'+hint+'</em><span class="sf-kpi-bar"><i style="width:'+Math.max(3,Math.min(100,percent))+'%"></i></span></button>'
  }
  function recentMovementDays(){
    const labels=[],values=[],today=new Date();
    for(let offset=6;offset>=0;offset--){
      const d=new Date(today);d.setDate(today.getDate()-offset);const key=d.toISOString().slice(0,10);
      labels.push(d.toLocaleDateString('en-GB',{weekday:'short'}).slice(0,2));
      values.push(arr(state.stockTransactions).filter(t=>String(t.at||'').slice(0,10)===key).length)
    }
    const max=Math.max(1,...values);return labels.map((label,i)=>({label,value:values[i],height:Math.max(7,Math.round(values[i]/max*88))}))
  }
  function stockDashboard(){
    const parts=arr(state.parts),low=parts.filter(isLow),critical=parts.filter(isCritical),locations=parts.reduce((n,p)=>n+arr(p.locations).filter(l=>l.active!==false).length,0),counts=arr(state.cycleCounts),today=day(0),month=today.slice(0,7),countedThisMonth=new Set(counts.filter(c=>String(c.at||'').slice(0,7)===month).map(c=>c.partId)).size,coverage=parts.length?Math.round(countedThisMonth/parts.length*100):100,assets=arr(state.assets).filter(a=>a.type!=='Site'),offline=assets.filter(a=>a.operatingState==='Offline'),openWork=arr(state.workOrders).filter(w=>!['Completed','Closed','Cancelled'].includes(w.status)),recent=arr(state.stockTransactions).slice(0,6),bars=recentMovementDays(),stores=arr(state.stores),totalValue=parts.reduce((sum,p)=>sum+onHand(p)*Number(p.lastPrice||p.unitCost||0),0),readiness=parts.length?Math.round(parts.filter(p=>!isLow(p)).length/parts.length*100):100,user=typeof currentUser==='function'?currentUser():null;
    return '<div class="sf-dashboard">'+
      '<section class="sf-hero"><div class="sf-hero-copy"><div class="sf-live-label"><i></i> Stockroom control centre</div><h1>Know what is on the shelf before maintenance needs it.</h1><p>Welcome, '+esc(user?.name?.split(' ')[0]||'Harold')+'. SafiMaintain connects Fiix-style parts, assets and work history in a calmer workspace built around daily stock taking.</p><div class="sf-hero-actions"><button class="button primary" data-action="cycle-count">'+sfIcon('count')+'Start cycle count</button><button class="button" data-action="global-stock-move">'+sfIcon('move')+'Post stock movement</button><button class="button" data-action="add-part">'+sfIcon('part')+'Add stock item</button></div></div>'+heroVisual()+'</section>'+ 
      '<section class="sf-kpis">'+kpi('Stock items',parts.length,locations+' locations','inventory','stock','',100)+kpi('Below minimum',low.length,critical.length+' stocked out','inventory','alert',low.length?'sf-kpi-alert':'',parts.length?100-low.length/parts.length*100:100)+kpi('Count coverage',coverage+'%',countedThisMonth+' counted this month','counts','count','',coverage)+kpi('Open work',openWork.length,'Parts linked to maintenance','work-orders','work',openWork.some(w=>w.priority==='Critical')?'sf-kpi-bad':'',Math.min(100,openWork.length*12))+kpi('Offline assets',offline.length,assets.length+' maintainable assets','assets','assets',offline.length?'sf-kpi-bad':'',assets.length?(assets.length-offline.length)/assets.length*100:100)+'</section>'+ 
      '<section class="sf-dash-grid"><article class="sf-panel"><div class="sf-panel-head"><div><h2>Stock attention</h2><p>Items that need a count, transfer or external reorder</p></div><button class="button small" data-route="planning">View reorder list</button></div><div class="sf-list">'+(low.length?low.slice(0,6).map(p=>'<button class="sf-attention-row" data-open-part="'+esc(p.id)+'"><span class="sf-row-icon '+(isCritical(p)?'bad':'low')+'">'+sfIcon(isCritical(p)?'alert':'part')+'</span><span><strong>'+esc(p.code)+' · '+esc(p.name)+'</strong><small>'+esc(p.category||'Stock item')+' · minimum '+Number(p.min||0)+' '+esc(p.uom)+'</small></span><span class="sf-row-qty"><b>'+onHand(p)+' '+esc(p.uom)+'</b><span>'+(isCritical(p)?'Stocked out':'Low stock')+'</span></span></button>').join(''):'<div class="sf-empty"><strong>Stock levels are healthy</strong><span>No items are currently below their configured minimum.</span></div>')+'</div></article>'+ 
      '<article class="sf-panel"><div class="sf-panel-head"><div><h2>7-day movement activity</h2><p>Receipts, issues, transfers and adjustments</p></div><div class="sf-live-label"><i></i> Live</div></div><div class="sf-activity-chart">'+bars.map(b=>'<div class="sf-chart-col" title="'+b.value+' movement'+(b.value===1?'':'s')+'"><i style="height:'+b.height+'%"></i><small>'+b.label+'</small></div>').join('')+'</div><div class="sf-summary-list"><div class="sf-summary-row"><span>Inventory value</span><b>'+money(totalValue)+'</b></div><div class="sf-summary-row"><span>Stock readiness</span><b>'+readiness+'%</b></div><div class="sf-summary-row"><span>Active stores</span><b>'+stores.length+'</b></div></div></article></section>'+ 
      '<section class="sf-dash-grid"><article class="sf-panel"><div class="sf-panel-head"><div><h2>Recent stock movements</h2><p>Auditable changes to on-hand quantities</p></div><button class="button small" data-route="transactions">Open history</button></div><div class="sf-list">'+(recent.length?recent.map(t=>{const p=typeof getPart==='function'?getPart(t.partId):null;return '<button class="sf-attention-row" data-open-part="'+esc(t.partId)+'"><span class="sf-row-icon">'+sfIcon('move')+'</span><span><strong>'+esc(t.type||'Movement')+' · '+esc(p?.name||t.partId)+'</strong><small>'+esc(t.reference||t.note||'Stock transaction')+' · '+dateTimeFmt(t.at)+'</small></span><span class="sf-row-qty"><b>'+(Number(t.qty||0)>0?'+':'')+Number(t.qty||0)+' '+esc(p?.uom||'')+'</b><span>'+esc(typeof getStore==='function'?(getStore(t.storeId)?.code||t.storeId||'Store'):'Store')+'</span></span></button>'}).join(''):'<div class="sf-empty"><strong>No stock movement yet</strong><span>Receive, issue, transfer or count stock to begin the ledger.</span></div>')+'</div></article>'+ 
      '<article class="sf-panel"><div class="sf-panel-head"><div><h2>Connected maintenance</h2><p>Stock remains tied to the equipment and work it supports</p></div><button class="button small" data-route="assets">Asset hierarchy</button></div><div class="sf-summary-list"><div class="sf-summary-row"><span>Maintainable assets</span><b>'+assets.length+'</b></div><div class="sf-summary-row"><span>Parts linked to asset BOMs</span><b>'+parts.filter(p=>assets.some(a=>arr(a.bom).includes(p.id))).length+'</b></div><div class="sf-summary-row"><span>Open maintenance work</span><b>'+openWork.length+'</b></div><div class="sf-summary-row"><span>Cycle counts recorded</span><b>'+counts.length+'</b></div></div></article></section>'+ 
    '</div>'
  }
  renderDashboard=stockDashboard;window.renderDashboard=stockDashboard;

  function partThumb(){return '<span class="sf-part-thumb">'+sfIcon('part')+'</span>'}
  function filteredParts(){
    const query=String(ui.inventorySearch||'').trim().toLowerCase();
    return arr(state.parts).filter(p=>{
      const text=[p.code,p.name,p.category,p.barcode].join(' ').toLowerCase();
      const matchText=!query||text.includes(query),matchStatus=ui.sfStockFilter==='low'?isLow(p):ui.sfStockFilter==='zero'?isCritical(p):ui.sfStockFilter==='healthy'?!isLow(p):true;
      return matchText&&matchStatus
    })
  }
  function renderStockroom(){
    const parts=arr(state.parts),visible=filteredParts(),low=parts.filter(isLow),zero=parts.filter(isCritical),locations=parts.reduce((n,p)=>n+arr(p.locations).length,0),value=parts.reduce((n,p)=>n+onHand(p)*Number(p.lastPrice||p.unitCost||0),0);
    if(!getPart(ui.selectedPart)||!visible.some(p=>p.id===ui.selectedPart))ui.selectedPart=visible[0]?.id||parts[0]?.id||null;
    const selected=getPart(ui.selectedPart);
    const chip=(key,label,count)=>'<button class="sf-filter-chip '+(ui.sfStockFilter===key?'active':'')+'" data-sf-stock-filter="'+key+'">'+label+(count!==undefined?' · '+count:'')+'</button>';
    return '<div class="sf-stock-page"><header class="sf-page-head"><div><div class="sf-live-label"><i></i> Fiix-familiar inventory</div><h1>Stockroom</h1><p>Parts, locations, counts and movement history in one clear workspace.</p></div><div class="sf-head-actions"><button class="button" data-action="global-stock-move">'+sfIcon('move')+' Stock movement</button><button class="button" data-action="cycle-count">'+sfIcon('count')+' Cycle count</button><button class="button primary" data-action="add-part">＋ Add stock item</button></div></header>'+ 
      '<section class="sf-stock-summary"><div class="sf-mini-stat"><span>Stock items</span><strong>'+parts.length+'</strong></div><div class="sf-mini-stat"><span>Storage locations</span><strong>'+locations+'</strong></div><div class="sf-mini-stat"><span>Below minimum</span><strong>'+low.length+'</strong></div><div class="sf-mini-stat"><span>Inventory value</span><strong>'+money(value)+'</strong></div></section>'+ 
      '<section class="sf-stock-workspace"><aside class="sf-stock-list"><div class="sf-list-tools"><div class="sf-list-search">'+sfIcon('search')+'<input data-filter="inventory" value="'+esc(ui.inventorySearch||'')+'" placeholder="Search part, code or barcode"></div><div class="sf-filter-chips">'+chip('all','All',parts.length)+chip('low','Low',low.length)+chip('zero','Stocked out',zero.length)+chip('healthy','Healthy',parts.length-low.length)+'</div></div><div class="sf-part-list" data-inventory-list>'+visible.map(p=>'<button class="sf-part-row '+(p.id===ui.selectedPart?'active':'')+'" data-select-part="'+esc(p.id)+'" data-inventory-row data-search="'+esc([p.code,p.name,p.category,p.barcode].join(' ').toLowerCase())+'">'+partThumb()+'<span><strong>'+esc(p.code)+' · '+esc(p.name)+'</strong><small>'+esc(p.category||'Stock item')+' · '+arr(p.locations).length+' location'+(arr(p.locations).length===1?'':'s')+'</small></span><span class="sf-part-level '+(isLow(p)?'low':'')+'"><b>'+onHand(p)+' '+esc(p.uom)+'</b><span>'+(isCritical(p)?'Stocked out':isLow(p)?'Below minimum':'Available')+'</span></span></button>').join('')+(visible.length?'':'<div class="sf-empty" data-inventory-empty><strong>No matching parts</strong><span>Change the search or stock filter.</span></div>')+'</div><div class="sf-list-count" data-inventory-count>'+visible.length+' of '+parts.length+' stock items</div></aside><main class="sf-part-record" data-inventory-detail>'+renderPartDetail(selected)+'</main></section></div>'
  }
  renderInventory=renderStockroom;window.renderInventory=renderStockroom;

  function locationName(l){return typeof getStore==='function'?(getStore(l.storeId)?.name||l.storeId||'Unassigned'):(l.storeId||'Unassigned')}
  function partStockTab(p){
    const locations=arr(p.locations);
    return (isLow(p)?'<div class="sf-restock-note">'+sfIcon('alert')+'<span><strong>'+(isCritical(p)?'This item is stocked out':'This item is below minimum')+'</strong><span>Review the bin quantity, post a count, transfer available stock, or add it to the external reorder list.</span></span><button class="button small" data-route="planning">Reorder list</button></div>':'')+
      '<div class="sf-section-head"><strong>Stock levels per location</strong><span>'+locations.length+' active record'+(locations.length===1?'':'s')+'</span></div><div class="sf-table-wrap"><table class="sf-table"><thead><tr><th>Status</th><th>Store / location</th><th>Aisle</th><th>Row</th><th>Bin</th><th>On hand</th><th>Min</th><th>Max</th></tr></thead><tbody>'+(locations.length?locations.map((l,index)=>'<tr data-v66-open-location="'+esc(p.id)+'|'+index+'"><td>'+status(l.active===false?'Inactive':'Active')+'</td><td><strong>'+esc(locationName(l))+'</strong></td><td>'+esc(l.aisle||'—')+'</td><td>'+esc(l.row||'—')+'</td><td>'+esc(l.bin||'—')+'</td><td class="'+(Number(l.onHand||0)<Number(l.min||0)?'sf-low-cell':'')+'">'+Number(l.onHand||0)+' '+esc(p.uom)+'</td><td>'+Number(l.min||0)+'</td><td>'+Number(l.max||0)+'</td></tr>').join(''):'<tr><td colspan="8"><div class="sf-empty"><strong>No stock location</strong><span>Add the first store, aisle, row and bin for this item.</span></div></td></tr>')+'</tbody></table></div><div style="margin-top:10px"><button class="button small primary" data-v66-add-location="'+esc(p.id)+'">＋ Add stock location</button></div>'
  }
  function partCountTab(p){
    const counts=arr(state.cycleCounts).filter(c=>c.partId===p.id).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
    return '<div class="sf-section-head"><strong>Cycle count history</strong><button class="button small primary" data-count-part="'+esc(p.id)+'">＋ New count</button></div><div class="sf-table-wrap"><table class="sf-table"><thead><tr><th>Date</th><th>Location</th><th>Expected</th><th>Counted</th><th>Variance</th><th>Counted by</th></tr></thead><tbody>'+(counts.length?counts.map(c=>'<tr><td>'+dateTimeFmt(c.at)+'</td><td>'+esc(locationName({storeId:c.storeId}))+' / '+esc(c.bin||'')+'</td><td>'+Number(c.expected||0)+'</td><td><strong>'+Number(c.counted||0)+'</strong></td><td class="'+(Number(c.variance||0)!==0?'sf-low-cell':'')+'">'+(Number(c.variance||0)>0?'+':'')+Number(c.variance||0)+'</td><td>'+esc(getUser(c.userId)?.name||c.userId||'System')+'</td></tr>').join(''):'<tr><td colspan="6"><div class="sf-empty"><strong>Not counted yet</strong><span>Start a cycle count to establish the physical stock record.</span></div></td></tr>')+'</tbody></table></div>'
  }
  function partBomTab(p){
    const assets=arr(state.assets).filter(a=>arr(a.bom).includes(p.id));
    return '<div class="sf-section-head"><strong>Used on assets / BOMs</strong><span>'+assets.length+' linked asset'+(assets.length===1?'':'s')+'</span></div>'+(assets.length?'<div class="sf-two-col">'+assets.map(a=>'<div class="sf-info-card"><small>'+esc(a.type||'Asset')+'</small><strong>'+esc(a.code)+' · '+esc(a.name)+'</strong><div style="margin-top:10px"><button class="button small" data-v66-open-asset="'+esc(a.id)+'">Open asset</button></div></div>').join('')+'</div>':'<div class="sf-empty"><strong>No asset BOM link</strong><span>Add this part from an asset record when the equipment requires it.</span></div>')
  }
  function partHistoryTab(p){
    const tx=arr(state.stockTransactions).filter(t=>t.partId===p.id).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,80);
    return '<div class="sf-section-head"><strong>Stock movement history</strong><span>'+tx.length+' recent record'+(tx.length===1?'':'s')+'</span></div><div class="sf-table-wrap"><table class="sf-table"><thead><tr><th>Date</th><th>Movement</th><th>Location</th><th>Quantity</th><th>Before</th><th>After</th><th>Reference</th></tr></thead><tbody>'+(tx.length?tx.map(t=>'<tr><td>'+dateTimeFmt(t.at)+'</td><td>'+status(t.type||'Movement')+'</td><td>'+esc(locationName({storeId:t.storeId}))+' / '+esc(t.bin||'')+'</td><td><strong>'+(Number(t.qty||0)>0?'+':'')+Number(t.qty||0)+' '+esc(p.uom)+'</strong></td><td>'+(t.qtyBefore??'—')+'</td><td>'+(t.qtyAfter??'—')+'</td><td>'+esc(t.reference||t.workOrderId||'—')+'</td></tr>').join(''):'<tr><td colspan="7"><div class="sf-empty"><strong>No stock history</strong><span>Movements and count adjustments will appear here.</span></div></td></tr>')+'</tbody></table></div>'
  }
  function partBody(p){return ui.sfPartTab==='counts'?partCountTab(p):ui.sfPartTab==='assets'?partBomTab(p):ui.sfPartTab==='history'?partHistoryTab(p):partStockTab(p)}
  renderPartDetail=function(p){
    if(!p)return '<div class="sf-empty"><strong>Select a stock item</strong><span>Choose a part from the list to open its record.</span></div>';
    const quantity=onHand(p),supplier=arr(state.businesses).find(b=>b.id===p.preferredBusinessId)||getVendor(p.vendorId),locations=arr(p.locations),tabs=[['stock','Stock levels'],['counts','Cycle counts'],['assets','Used on assets'],['history','Movement history']];
    return '<div class="sf-part-toolbar"><button class="button" data-v56-edit-part="'+esc(p.id)+'">Edit item</button><button class="button" data-stock-move="'+esc(p.id)+'">Stock movement</button><button class="button" data-count-part="'+esc(p.id)+'">Cycle count</button><span class="grow"></span><button class="button primary" data-v66-add-location="'+esc(p.id)+'">＋ Stock location</button></div><div class="sf-part-hero"><div class="sf-part-image">'+sfIcon('part')+'</div><div class="sf-part-title"><small>Stock item</small><h2>'+esc(p.name)+'</h2><p>'+esc(p.category||'Uncategorized')+' · '+esc(p.uom||'ea')+' · '+locations.length+' storage location'+(locations.length===1?'':'s')+'</p></div><div class="sf-part-health"><span class="sf-stock-state '+(isLow(p)?'low':'')+'"><i></i>'+(isCritical(p)?'Stocked out':isLow(p)?'Below minimum':'In stock')+'</span><div class="sf-part-number"><small>PART NUMBER</small><strong>'+esc(p.code)+'</strong></div></div></div><div class="sf-part-metrics"><div><small>On hand</small><strong>'+quantity+' '+esc(p.uom)+'</strong></div><div><small>Minimum / maximum</small><strong>'+Number(p.min||0)+' / '+Number(p.max||0)+'</strong></div><div><small>Preferred supplier</small><strong>'+esc(supplier?.name||'Not set')+'</strong></div><div><small>Stock value</small><strong>'+money(quantity*Number(p.lastPrice||p.unitCost||0))+'</strong></div></div><div class="sf-part-tabs">'+tabs.map(t=>'<button class="sf-part-tab '+(ui.sfPartTab===t[0]?'active':'')+'" data-sf-part-tab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div><div class="sf-part-body">'+partBody(p)+'</div>'
  };
  window.renderPartDetail=renderPartDetail;

  function renderReorderList(){
    const parts=arr(state.parts).filter(isLow).sort((a,b)=>(isCritical(b)-isCritical(a))||(Number(a.min||0)-onHand(a))-(Number(b.min||0)-onHand(b))),value=parts.reduce((n,p)=>n+Math.max(0,Number(p.max||p.min||0)-onHand(p))*Number(p.lastPrice||p.unitCost||0),0);
    return '<div class="sf-restock-page"><header class="sf-page-head"><div><div class="sf-live-label"><i></i> Inventory control</div><h1>Reorder list</h1><p>A simple handoff list for external purchasing. SafiMaintain does not create purchase orders.</p></div><div class="sf-head-actions"><button class="button" data-action="cycle-count">Verify with count</button><button class="button primary" data-route="inventory">Open stockroom</button></div></header><section class="sf-stock-summary"><div class="sf-mini-stat"><span>Items to review</span><strong>'+parts.length+'</strong></div><div class="sf-mini-stat"><span>Stocked out</span><strong>'+parts.filter(isCritical).length+'</strong></div><div class="sf-mini-stat"><span>Suggested restock value</span><strong>'+money(value)+'</strong></div><div class="sf-mini-stat"><span>Workflow</span><strong>External buy</strong></div></section><section class="sf-panel"><div class="sf-panel-head"><div><h2>Stock replenishment signals</h2><p>Confirm physical quantity before placing an order in your purchasing system</p></div></div><div class="sf-table-wrap sf-restock-table"><table class="sf-table"><thead><tr><th>Part</th><th>On hand</th><th>Min / max</th><th>Suggested qty</th><th>Priority</th><th>Supplier</th><th></th></tr></thead><tbody>'+(parts.length?parts.map(p=>{const supplier=arr(state.businesses).find(b=>b.id===p.preferredBusinessId)||getVendor(p.vendorId),suggest=Math.max(1,Number(p.reorderQty||0),Number(p.max||p.min||0)-onHand(p));return '<tr><td>'+partThumb()+'<strong>'+esc(p.code)+' · '+esc(p.name)+'</strong><small>'+esc(p.category||'Stock item')+'</small></td><td><strong>'+onHand(p)+' '+esc(p.uom)+'</strong></td><td>'+Number(p.min||0)+' / '+Number(p.max||0)+'</td><td><strong>'+suggest+' '+esc(p.uom)+'</strong></td><td><span class="sf-priority '+(isCritical(p)?'critical':'')+'">'+(isCritical(p)?'Critical':'Reorder')+'</span></td><td>'+esc(supplier?.name||'Not set')+'</td><td><button class="button small" data-sf-open-part="'+esc(p.id)+'">Review stock</button></td></tr>'}).join(''):'<tr><td colspan="7"><div class="sf-empty"><strong>Nothing to reorder</strong><span>All tracked items meet their minimum stock level.</span></div></td></tr>')+'</tbody></table></div></section></div>'
  }
  renderPlanning=renderReorderList;window.renderPlanning=renderReorderList;

  const oldRouteTitle=routeTitle;
  routeTitle=function(){const map={dashboard:'Overview',inventory:'Stockroom',counts:'Cycle counts',transactions:'Stock movements',planning:'Reorder list'};return map[ui.route]||oldRouteTitle()};window.routeTitle=routeTitle;
  const oldGo=go;
  go=function(route){if(blockedRoutes.has(route)){toast('Purchase orders are not part of SafiMaintain. Use the reorder list for external buying.');route='planning'}return oldGo(route)};window.go=go;

  function polishShell(){
    stockNavigation();
    const search=document.getElementById('globalSearchButton');if(search){const spans=search.querySelectorAll('span');if(spans[1])spans[1].textContent='Search parts, assets, work orders…'}
    const scan=document.getElementById('scanButton');if(scan)scan.innerHTML=sfIcon('scan')+' Scan';
    document.querySelectorAll('[data-action="manual-po"],[data-po-from-pr],[data-v56-new-po],[data-v56-create-po]').forEach(el=>el.remove());
    document.body.classList.add('safimaint-stock-first')
  }
  const previousRender=render;
  render=function(){
    if(blockedRoutes.has(ui.route))ui.route='planning';
    const result=previousRender.apply(this,arguments);polishShell();return result
  };
  window.render=render;

  document.addEventListener('click',event=>{
    const blocked=event.target.closest('[data-action="manual-po"],[data-po-from-pr],[data-v56-new-po],[data-v56-create-po],[data-route="purchase-orders"],[data-route="rfqs"],[data-route="purchase-analytics"]');
    if(blocked){event.preventDefault();event.stopImmediatePropagation();toast('SafiMaintain uses a simple external reorder list instead of purchase orders.');go('planning');return}
    const filter=event.target.closest('[data-sf-stock-filter]');if(filter){event.preventDefault();event.stopImmediatePropagation();ui.sfStockFilter=filter.dataset.sfStockFilter;render();return}
    const tab=event.target.closest('[data-sf-part-tab]');if(tab){event.preventDefault();event.stopImmediatePropagation();ui.sfPartTab=tab.dataset.sfPartTab;const p=getPart(ui.selectedPart),target=document.querySelector('[data-inventory-detail]');if(target&&p)target.innerHTML=renderPartDetail(p);return}
    const open=event.target.closest('[data-sf-open-part]');if(open){event.preventDefault();event.stopImmediatePropagation();ui.selectedPart=open.dataset.sfOpenPart;ui.sfStockFilter='all';ui.sfPartTab='stock';go('inventory')}
  },true);

  polishShell();render()
})();
