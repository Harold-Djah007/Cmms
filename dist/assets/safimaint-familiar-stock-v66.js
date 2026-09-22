'use strict';

// v66 keeps the Fiix inventory interaction pattern familiar while reducing the number of tabs/actions.
(function(){
  ui.v66PartTab=ui.v66PartTab||'stock';

  function supplier(p){
    return state.businesses?.find(b=>b.id===p.preferredBusinessId)||getVendor(p.vendorId)||null
  }
  function partValue(p){
    return typeof safiInventoryValue==='function'?safiInventoryValue(p.id):partOnHand(p)*Number(p.lastPrice||p.unitCost||0)
  }
  function locName(l){return getStore(l.storeId)?.name||l.storeId||'Unassigned'}
  function txFor(p,l=null){
    return (state.stockTransactions||[]).filter(t=>t.partId===p.id&&(!l||(t.storeId===l.storeId&&String(t.bin||'')===String(l.bin||'')))).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))
  }
  function aggregate(p){
    const active=(p.locations||[]).filter(l=>l.active!==false);
    p.min=active.reduce((n,l)=>n+Number(l.min||0),0);
    p.max=active.reduce((n,l)=>n+Number(l.max||0),0);
  }
  function makePurchaseRequest(p,l=null){
    state.purchaseRequests=Array.isArray(state.purchaseRequests)?state.purchaseRequests:[];
    const existing=state.purchaseRequests.find(r=>r.partId===p.id&&!['Received','Closed','Cancelled','Rejected'].includes(r.status));
    if(existing){toast(existing.id+' already covers '+p.code);return existing}
    const current=partOnHand(p),target=Math.max(Number(l?.max||0),Number(p.max||0),Number(p.min||0)),qty=Math.max(1,Number(p.reorderQty||1),target>current?target-current:1);
    const pr={id:uid('PR'),partId:p.id,qty,quantity:qty,requestedQty:qty,status:'Requested',createdAt:iso(),reason:'Stock replenishment'+(l?' · '+locName(l)+' / '+(l.bin||''):'') ,source:'Part stock record',storeId:l?.storeId||null,bin:l?.bin||'',workOrderId:null};
    state.purchaseRequests.unshift(pr);addAudit('PURCHASE_REQUEST_CREATED',pr.id,p.code+' × '+qty);dispatchEvent('Purchase request created',pr.id+' created',p.name+' · '+qty+' '+p.uom,{partId:p.id,relatedId:pr.id});saveState();toast(pr.id+' submitted');return pr
  }
  function partIcon(){
    return '<svg viewBox="0 0 64 64"><path d="M12 20 32 10l20 10-20 10-20-10Z"/><path d="M12 20v24l20 10 20-10V20M32 30v24"/><path d="M22 15l20 10"/></svg>'
  }
  function stockTab(p){
    const rows=p.locations||[];
    return '<section class="v66-section"><div class="v66-section-head"><strong>Stock Levels Per Location</strong><span>'+rows.length+' location'+(rows.length===1?'':'s')+'</span></div>'+
      '<div class="v66-stock-help"><b>Simple rule:</b> use the + button to add a storage location. Set the aisle, row, bin, minimum and maximum. SafiMaintain keeps the quantity history automatically.</div>'+
      '<div class="v66-stock-grid"><table class="v66-stock-table"><thead><tr><th>Status</th><th>Location</th><th>Aisle</th><th>Row</th><th>Bin</th><th>Qty On Hand</th><th>Min Qty</th><th>Max Qty</th></tr></thead><tbody>'+
      (rows.length?rows.map((l,i)=>'<tr data-v66-open-location="'+esc(p.id)+'|'+i+'" class="'+(l.active===false?'inactive':'')+'"><td>'+status(l.active===false?'Inactive':'Active')+'</td><td><strong>'+esc(locName(l))+'</strong></td><td>'+esc(l.aisle||'—')+'</td><td>'+esc(l.row||'—')+'</td><td>'+esc(l.bin||'—')+'</td><td class="'+(Number(l.onHand||0)<Number(l.min||0)?'low':'')+'">'+Number(l.onHand||0)+' '+esc(p.uom)+'</td><td>'+Number(l.min||0)+'</td><td>'+Number(l.max||0)+'</td></tr>').join(''):'<tr><td colspan="8"><div class="v66-empty"><strong>No stock locations yet</strong><span>Click + below to add the first stock location.</span></div></td></tr>')+
      '</tbody></table></div><div class="v66-add-stock"><button class="button v66-grid-add" type="button" data-v66-add-location="'+esc(p.id)+'" title="Add stock location">＋</button></div>'+
      '<div class="v66-help-line">Tip: click any stock-location row to edit its location, quantity limits and active state.</div></section>'
  }
  function cycleTab(p){
    const counts=(state.cycleCounts||[]).filter(c=>c.partId===p.id).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))),last=counts[0];
    return '<section class="v66-section"><div class="v66-section-head"><strong>Cycle Count</strong><div class="v66-inline-actions"><button class="button primary" data-count-part="'+esc(p.id)+'">＋ New cycle count</button></div></div>'+
      '<div class="v66-cycle-summary"><div><small>System quantity</small><strong>'+partOnHand(p)+' '+esc(p.uom)+'</strong></div><div><small>Last counted</small><strong>'+(last?last.counted+' '+esc(p.uom):'Never')+'</strong></div><div><small>Last variance</small><strong>'+(last?(last.variance>0?'+':'')+last.variance:'—')+'</strong></div></div>'+
      '<div class="v66-stock-grid"><table class="v66-history-table"><thead><tr><th>Date</th><th>Location</th><th>Expected</th><th>Counted</th><th>Variance</th><th>By</th></tr></thead><tbody>'+(counts.length?counts.map(c=>'<tr><td>'+dateTimeFmt(c.at)+'</td><td>'+esc(getStore(c.storeId)?.name||c.storeId)+' / '+esc(c.bin||'')+'</td><td>'+c.expected+'</td><td>'+c.counted+'</td><td>'+(c.variance>0?'+':'')+c.variance+'</td><td>'+esc(getUser(c.userId)?.name||c.userId||'System')+'</td></tr>').join(''):'<tr><td colspan="6">No cycle counts recorded.</td></tr>')+'</tbody></table></div></section>'
  }
  function bomTab(p){
    const assets=(state.assets||[]).filter(a=>(a.bom||[]).includes(p.id));
    return '<section class="v66-section"><div class="v66-section-head"><strong>BOMs / Used On Assets</strong><span>'+assets.length+' asset'+(assets.length===1?'':'s')+'</span></div><div class="v66-bom-list">'+
      (assets.length?assets.map(a=>'<div class="v66-bom-row"><span><strong>'+esc(a.code)+' · '+esc(a.name)+'</strong><small>'+esc(a.type)+' · standard quantity '+Number(a.bomQuantities?.[p.id]||1)+' '+esc(p.uom)+'</small></span><button class="button small" data-v66-open-asset="'+esc(a.id)+'">Open asset</button></div>').join(''):'<div class="v66-empty"><strong>Not used on an asset BOM yet</strong><span>Add this part from an asset record → Parts / BOM.</span></div>')+
      '</div></section>'
  }
  function purchasingTab(p){
    const s=supplier(p),prs=(state.purchaseRequests||[]).filter(r=>r.partId===p.id).slice(0,8),rfqs=(state.rfqs||[]).filter(r=>r.partId===p.id).slice(0,8),pos=(state.purchaseOrders||[]).filter(po=>(po.lines||[]).some(l=>l.partId===p.id)).slice(0,8);
    return '<section class="v66-section"><div class="v66-section-head"><strong>Purchasing</strong><div class="v66-inline-actions"><button class="button" data-v56-edit-part="'+esc(p.id)+'">Edit sourcing</button><button class="button primary" data-v66-request-part="'+esc(p.id)+'">Submit purchase request</button></div></div>'+
      '<div class="v66-purchase-grid"><div><small>Preferred supplier</small><strong>'+esc(s?.name||'Not configured')+'</strong></div><div><small>Lead time</small><strong>'+Number(p.leadTimeDays||0)+' days</strong></div><div><small>Reorder quantity</small><strong>'+Number(p.reorderQty||0)+' '+esc(p.uom)+'</strong></div></div>'+
      '<div class="v66-stock-grid"><table class="v66-history-table"><thead><tr><th>Document</th><th>Type</th><th>Quantity</th><th>Status</th><th>Date / Due</th></tr></thead><tbody>'+
      ([...prs.map(r=>({id:r.id,type:'Purchase request',qty:Number(r.requestedQty||r.qty||0),st:r.status,date:r.createdAt})),...rfqs.map(r=>({id:r.id,type:'RFQ',qty:Number(r.qty||0),st:r.status,date:r.dueDate||r.createdAt})),...pos.map(po=>({id:po.id,type:'Purchase order',qty:(po.lines||[]).filter(l=>l.partId===p.id).reduce((n,l)=>n+Number(l.qty||0),0),st:po.status,date:po.expectedDate||po.createdAt}))].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,12).map(x=>'<tr><td><strong>'+esc(x.id)+'</strong></td><td>'+x.type+'</td><td>'+x.qty+' '+esc(p.uom)+'</td><td>'+status(x.st)+'</td><td>'+dateFmt(x.date)+'</td></tr>').join('')||'<tr><td colspan="5">No purchasing documents for this part.</td></tr>')+
      '</tbody></table></div></section>'
  }
  function historyTab(p){
    const tx=txFor(p).slice(0,80);
    return '<section class="v66-section"><div class="v66-section-head"><strong>Stock History</strong><span>'+tx.length+' recent transaction'+(tx.length===1?'':'s')+'</span></div><div class="v66-stock-grid"><table class="v66-history-table"><thead><tr><th>Date</th><th>User</th><th>Description</th><th>Location</th><th>Qty Before</th><th>Qty After</th><th>Reference</th></tr></thead><tbody>'+
      (tx.length?tx.map(t=>'<tr><td>'+dateTimeFmt(t.at)+'</td><td>'+esc(getUser(t.userId)?.name||t.userId||'System')+'</td><td>'+esc(t.type+(t.note?' · '+t.note:''))+'</td><td>'+esc(locName({storeId:t.storeId}))+' / '+esc(t.bin||'')+'</td><td>'+(t.qtyBefore??'—')+'</td><td>'+(t.qtyAfter??'—')+'</td><td>'+esc(t.reference||t.workOrderId||'—')+'</td></tr>').join(''):'<tr><td colspan="7">No stock history yet.</td></tr>')+
      '</tbody></table></div></section>'
  }
  function tabBody(p){
    if(ui.v66PartTab==='cycle')return cycleTab(p);
    if(ui.v66PartTab==='boms')return bomTab(p);
    if(ui.v66PartTab==='purchasing')return purchasingTab(p);
    if(ui.v66PartTab==='history')return historyTab(p);
    return stockTab(p)
  }

  renderPartDetail=function(p){
    if(!p)return '<div class="v66-empty"><strong>No part selected</strong><span>Select a part from the list.</span></div>';
    p.locations=Array.isArray(p.locations)?p.locations:[];
    const on=partOnHand(p),value=partValue(p),s=supplier(p),tabs=[['stock','Stock'],['cycle','Cycle Count'],['boms','BOMs'],['purchasing','Purchasing'],['history','History']];
    return '<div class="v66-part-record">'+
      '<div class="v66-part-command"><button class="button" data-v56-edit-part="'+esc(p.id)+'">Edit</button><button class="button" data-stock-move="'+esc(p.id)+'">Stock movement</button><button class="button" data-count-part="'+esc(p.id)+'">Cycle count</button><span class="grow"></span><button class="button primary" data-v66-request-part="'+esc(p.id)+'">Submit purchase request</button></div>'+
      '<div class="v66-part-head"><div class="v66-part-picture">'+partIcon()+'</div><div class="v66-part-title"><small>Stock item</small><h2>'+esc(p.name)+'</h2><p>'+esc(p.code)+' · '+esc(p.category)+' · '+esc(p.uom)+'</p><div class="v66-part-meta"><div><small>Qty on hand</small><strong>'+on+' '+esc(p.uom)+'</strong></div><div><small>Min / Max</small><strong>'+Number(p.min||0)+' / '+Number(p.max||0)+'</strong></div><div><small>Preferred supplier</small><strong>'+esc(s?.name||'—')+'</strong></div><div><small>Stock value</small><strong>'+money(value)+'</strong></div></div></div><div class="v66-part-status"><span class="v66-active"><i></i>Active</span><div class="v66-part-code"><small>PART NUMBER</small><strong>'+esc(p.code)+'</strong></div></div></div>'+
      '<div class="v66-part-tabs">'+tabs.map(t=>'<button class="v66-part-tab '+(ui.v66PartTab===t[0]?'active':'')+'" data-v66-part-tab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'+
      '<div class="v66-part-body">'+tabBody(p)+'</div></div>'
  };
  window.renderPartDetail=renderPartDetail;

  showStockLocation=function(p,index=null){
    if(!p)return;
    if(!Array.isArray(state.stores)||!state.stores.length){toast('Create a store in Sites & stores before adding stock');go('sites');return}
    p.locations=Array.isArray(p.locations)?p.locations:[];
    const existing=index!==null?p.locations[index]:null;
    const l=existing||{storeId:state.stores[0]?.id||'',aisle:'',row:'',bin:'',onHand:0,min:0,max:0,active:true};
    const history=existing?txFor(p,l).slice(0,30):[];
    openModal({eyebrow:'Stock · '+p.code,title:existing?'Stock Location':'Add Stock Location',submitText:'OK',body:
      '<div class="v66-location-modal"><div class="v66-location-note">This follows the familiar Fiix stock-location workflow. Set where the part is stored, its current quantity, and the minimum/maximum levels used for replenishment.</div>'+
      '<div class="v66-location-fields">'+
        '<label>Location<select name="storeId" required>'+state.stores.map(s=>'<option value="'+esc(s.id)+'" '+(s.id===l.storeId?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label>'+
        '<label>Aisle<input name="aisle" value="'+esc(l.aisle||'')+'" placeholder="e.g. A3"></label>'+
        '<label>Row<input name="row" value="'+esc(l.row||'')+'" placeholder="e.g. 02"></label>'+
        '<label>Bin<input name="bin" value="'+esc(l.bin||'')+'" required placeholder="e.g. B-14"></label>'+
        '<label>Qty on hand<input name="onHand" type="number" min="0" step="0.01" value="'+Number(l.onHand||0)+'"></label>'+
        '<label>Min qty<input name="min" type="number" min="0" step="0.01" value="'+Number(l.min||0)+'"></label>'+
        '<label>Max qty<input name="max" type="number" min="0" step="0.01" value="'+Number(l.max||0)+'"></label>'+
        '<label class="v66-active-check"><input name="active" type="checkbox" '+(l.active!==false?'checked':'')+'> Active</label>'+
      '</div>'+
      (existing?'<section class="v66-section"><div class="v66-section-head"><strong>Stock History</strong><span>'+history.length+' recent</span></div><div class="v66-stock-grid"><table class="v66-history-table"><thead><tr><th>Date</th><th>User</th><th>Description</th><th>Qty Before</th><th>Qty After</th></tr></thead><tbody>'+(history.length?history.map(t=>'<tr><td>'+dateTimeFmt(t.at)+'</td><td>'+esc(getUser(t.userId)?.name||t.userId||'System')+'</td><td>'+esc(t.type+(t.note?' · '+t.note:''))+'</td><td>'+(t.qtyBefore??'—')+'</td><td>'+(t.qtyAfter??'—')+'</td></tr>').join(''):'<tr><td colspan="5">No movements yet.</td></tr>')+'</tbody></table></div></section>':'')+
      '<div class="v66-modal-actions">'+(existing?'<button class="button" type="button" data-count-part="'+esc(p.id)+'">Cycle count</button><button class="button" type="button" data-stock-move="'+esc(p.id)+'">Stock movement</button>':'')+'<span class="grow"></span><button class="button" type="button" data-v66-modal-request="'+esc(p.id)+'|'+(index===null?'':index)+'">Submit Purchase Request</button></div></div>',
      onSubmit:fd=>{
        const storeId=String(fd.get('storeId')||''),aisle=String(fd.get('aisle')||'').trim(),row=String(fd.get('row')||'').trim(),bin=String(fd.get('bin')||'').trim(),desired=Number(fd.get('onHand')||0),min=Number(fd.get('min')||0),max=Number(fd.get('max')||0),active=fd.get('active')==='on';
        if(!bin){toast('Bin is required');return}
        if(desired<0||min<0||max<0){toast('Stock quantities cannot be negative');return}
        if(max>0&&min>max){toast('Minimum quantity cannot exceed maximum quantity');return}
        if(existing&&Number(existing.onHand||0)>0&&(existing.storeId!==storeId||String(existing.bin||'')!==bin)){toast('Move the stock first before changing its store or bin.');return}
        const duplicate=p.locations.find((x,i)=>i!==index&&x.storeId===storeId&&String(x.bin||'').trim().toLowerCase()===bin.toLowerCase());
        if(duplicate){toast('That store and bin already exist for this part');return}
        if(existing){
          const before=Number(existing.onHand||0),diff=desired-before;
          Object.assign(existing,{storeId,aisle,row,bin,min,max,active});
          if(diff!==0)postStock(p.id,'Adjustment',diff,storeId,bin,{reference:'Stock location update',note:'Quantity adjusted from stock location record'});
          addAudit('STOCK_LOCATION_UPDATED',p.id,locName(existing)+' / '+bin);
        }else{
          const created={storeId,aisle,row,bin,onHand:0,min,max,active};p.locations.push(created);
          if(desired>0)postStock(p.id,'Adjustment',desired,storeId,bin,{reference:'Opening stock',note:'Opening quantity for new stock location'});
          addAudit('STOCK_LOCATION_CREATED',p.id,locName(created)+' / '+bin);
        }
        aggregate(p);saveState();closeModal();render();toast(existing?'Stock location saved':'Stock location added')
      }});
  };
  window.showStockLocation=showStockLocation;

  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-v66-part-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();ui.v66PartTab=tab.dataset.v66PartTab;const p=getPart(ui.selectedPart);const target=document.querySelector('[data-inventory-detail]');if(target&&p)target.innerHTML=renderPartDetail(p);return}
    const row=e.target.closest('[data-v66-open-location]');if(row){e.preventDefault();e.stopImmediatePropagation();const [pid,idx]=row.dataset.v66OpenLocation.split('|'),p=getPart(pid);if(p)showStockLocation(p,Number(idx));return}
    const add=e.target.closest('[data-v66-add-location]');if(add){e.preventDefault();e.stopImmediatePropagation();const p=getPart(add.dataset.v66AddLocation);if(p)showStockLocation(p,null);return}
    const request=e.target.closest('[data-v66-request-part]');if(request){e.preventDefault();e.stopImmediatePropagation();const p=getPart(request.dataset.v66RequestPart);if(p){makePurchaseRequest(p);ui.v66PartTab='purchasing';render()}return}
    const modalReq=e.target.closest('[data-v66-modal-request]');if(modalReq){e.preventDefault();e.stopImmediatePropagation();const [pid,idx]=modalReq.dataset.v66ModalRequest.split('|'),p=getPart(pid);if(p)makePurchaseRequest(p,idx===''?null:p.locations[Number(idx)]);return}
    const asset=e.target.closest('[data-v66-open-asset]');if(asset){e.preventDefault();e.stopImmediatePropagation();ui.selectedAsset=asset.dataset.v66OpenAsset;ui.assetView='record';ui.assetRecordTab='bom';go('assets');return}
  },true);

  if(ui.route==='inventory')render();
})();