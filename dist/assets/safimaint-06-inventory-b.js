'use strict';
function showStockMove(partId){
  const p=getPart(partId);if(!p)return;
  const locOptions=p.locations.map(l=>({value:`${l.storeId}|${l.bin}`,label:`${getStore(l.storeId)?.name||l.storeId} / ${l.bin} · ${l.onHand} on hand`}));
  const destinationOptions=state.stores.flatMap(s=>['Receiving','Bin 01','Bin 02','Rack 1','Shelf 1'].map(bin=>({value:`${s.id}|${bin}`,label:`${s.name} / ${bin}`})));
  openModal({eyebrow:`${p.code} · ${p.name}`,title:'Stock movement',body:`<div class="form-grid">
    ${field('type','Movement type','Receipt',{type:'select',options:['Receipt','Issue','Transfer','Adjustment'].map(x=>({value:x,label:x}))})}
    ${field('location','Source / receiving location',locOptions[0]?.value||'STORE-MAIN|Unassigned',{type:'select',options:locOptions.length?locOptions:[{value:'STORE-MAIN|Unassigned',label:'Main Maintenance Store / Unassigned'}]})}
    ${field('qty','Quantity','1',{type:'number',required:true,step:'0.01'})}
    ${field('destination','Transfer destination','STORE-MAIN|Receiving',{type:'select',options:destinationOptions})}
    ${field('reference','Reference','')}${field('workOrderId','Work order','',{type:'select',options:[{value:'',label:'None'},...state.workOrders.filter(w=>w.status!=='Completed').map(w=>({value:w.id,label:`${w.id} · ${w.title}`}))]})}
    ${field('note','Movement note','',{type:'textarea',span:true})}
  </div><div class="notice info" style="margin-top:14px">For an Adjustment, use a negative quantity to reduce stock and a positive quantity to increase stock.</div>`,submitText:'Post movement',onSubmit:fd=>{
    try{
      const [storeId,bin]=String(fd.get('location')).split('|');
      const [toStoreId,toBin]=String(fd.get('destination')).split('|');
      postStock(partId,String(fd.get('type')),Number(fd.get('qty')),storeId,bin,{toStoreId,toBin,reference:String(fd.get('reference')||''),workOrderId:String(fd.get('workOrderId')||'')||null,note:String(fd.get('note')||'')});
      saveState();closeModal();render();toast('Stock movement posted');
    }catch(err){toast(err.message)}
  }});
}
function showCycleCount(partId=null){
  const partOptions=state.parts.map(p=>({value:p.id,label:`${p.code} · ${p.name}`}));
  const selected=getPart(partId||partOptions[0]?.value);
  const loc=selected?.locations[0];
  openModal({eyebrow:'Inventory control',title:'Post cycle count',body:`<div class="form-grid">
    ${field('partId','Part',selected?.id||'',{type:'select',options:partOptions})}
    ${field('storeId','Store',loc?.storeId||'STORE-MAIN',{type:'select',options:state.stores.map(s=>({value:s.id,label:s.name}))})}
    ${field('bin','Bin',loc?.bin||'Unassigned')}${field('counted','Counted quantity',String(loc?.onHand??0),{type:'number',required:true,step:'0.01'})}
    ${field('note','Count note','',{type:'textarea',span:true})}
  </div><div class="notice info" style="margin-top:14px">Expected quantity is taken from current system stock at the selected location. Posting the count creates an auditable variance adjustment.</div>`,submitText:'Post count',onSubmit:fd=>{
    const p=getPart(String(fd.get('partId')));const storeId=String(fd.get('storeId'));const bin=String(fd.get('bin'));const loc=stockLocation(p,storeId,bin);
    const expected=Number(loc.onHand),counted=Number(fd.get('counted')),variance=counted-expected;
    const count={id:uid('CNT'),partId:p.id,storeId,bin,expected,counted,variance,status:'Posted',at:iso(),userId:CURRENT_USER,note:String(fd.get('note')||'')};
    state.cycleCounts.unshift(count);
    if(variance!==0) postStock(p.id,'Adjustment',variance,storeId,bin,{reference:count.id,note:count.note});
    addAudit('CYCLE_COUNT_POSTED',count.id,`${p.code}: expected ${expected}, counted ${counted}, variance ${variance}`);ensurePurchaseRequest(p,'Cycle count');
    saveState();closeModal();render();toast(`${count.id} posted`);
  }});
}
function renderTransactions(){
  return pageHead('Parts & purchasing','Stock transactions','Immutable-style movement history for receipts, issues, transfers and adjustments.',
    `<button class="button primary" data-action="global-stock-move">＋ Stock movement</button>`)
  +`<section class="card">${table(['Transaction','Part','Type','Quantity','Location','Reference','By','Date'],state.stockTransactions.map(t=>{const p=getPart(t.partId);return `<tr><td>${esc(t.id)}</td><td><span class="cell-title">${esc(p?.code||t.partId)}</span><span class="cell-sub">${esc(p?.name||'')}</span></td><td>${status(t.type)}</td><td>${t.qty>0?'+':''}${t.qty} ${esc(p?.uom||'')}</td><td>${esc(getStore(t.storeId)?.code||t.storeId)} / ${esc(t.bin||'')}</td><td>${esc(t.reference||t.workOrderId||'—')}</td><td>${esc(getUser(t.userId)?.name||t.userId||'System')}</td><td>${dateTimeFmt(t.at)}</td></tr>`}),'No stock transactions')}</section>`;
}
function renderCounts(){
  return pageHead('Parts & purchasing','Cycle counts','Count stock without stopping operations and keep who/when/variance history.',
    `<button class="button primary" data-action="cycle-count">＋ New cycle count</button>`)
  +`<section class="card">${table(['Count','Part','Location','Expected','Counted','Variance','By','Date'],state.cycleCounts.map(c=>`<tr><td>${esc(c.id)}</td><td>${esc(getPart(c.partId)?.code||c.partId)}</td><td>${esc(getStore(c.storeId)?.code||c.storeId)} / ${esc(c.bin)}</td><td>${c.expected}</td><td>${c.counted}</td><td>${c.variance>0?'+':''}${c.variance}</td><td>${esc(getUser(c.userId)?.name||c.userId)}</td><td>${dateTimeFmt(c.at)}</td></tr>`),'No cycle counts')}</section>`;
}
function renderPlanning(){
  const open=state.purchaseRequests.filter(r=>!['Received','Closed','Cancelled'].includes(r.status));
  return pageHead('Parts & purchasing','Purchase planning','Demand created from low stock, work consumption and cycle-count variance.')
  +`<section class="card">${table(['Request','Part','On hand','Requested','Source','Reason','Status',''],open.map(r=>{const p=getPart(r.partId);return `<tr><td><span class="cell-title">${esc(r.id)}</span><span class="cell-sub">${dateFmt(r.createdAt)}</span></td><td><span class="cell-title">${esc(p?.code||r.partId)}</span><span class="cell-sub">${esc(p?.name||'')}</span></td><td>${p?partOnHand(p):'—'}</td><td>${r.requestedQty} ${esc(p?.uom||'')}</td><td>${esc(r.source)}</td><td>${esc(r.reason)}</td><td>${status(r.status)}</td><td class="right">${r.status==='Open'?`<button class="button small" data-approve-pr="${r.id}">Approve</button>`:''}${r.status==='Approved'?`<button class="button small primary" data-po-from-pr="${r.id}">Create PO</button>`:''}</td></tr>`}),'No purchase requests')}</section>`;
}
function approvePR(id){
  const r=state.purchaseRequests.find(x=>x.id===id);if(!r||r.status!=='Open')return;r.status='Approved';r.approvedBy=CURRENT_USER;r.approvedAt=iso();addAudit('PURCHASE_REQUEST_APPROVED',r.id,`Approved ${r.requestedQty} of ${getPart(r.partId)?.code}`);saveState();render();toast(`${r.id} approved`);
}
function createPOFromPR(id){
  const r=state.purchaseRequests.find(x=>x.id===id);if(!r||r.status!=='Approved')return;const p=getPart(r.partId);
  const po={id:uid('PO'),vendorId:p.vendorId,status:'Ordered',createdAt:iso(),expectedDate:day(7),lines:[{partId:p.id,qty:r.requestedQty,unitCost:p.unitCost}],sourceRequestIds:[r.id]};
  state.purchaseOrders.unshift(po);r.status='Ordered';r.purchaseOrderId=po.id;addAudit('PURCHASE_ORDER_CREATED',po.id,`Created from ${r.id}`);saveState();render();toast(`${po.id} created`);
}
function renderPOs(){
  return pageHead('Parts & purchasing','Purchase orders','Approved demand through ordering and receiving.',
    `<button class="button" data-action="manual-po">＋ New purchase order</button>`)
  +`<section class="card">${table(['Purchase order','Vendor','Lines','Total','Status','Expected',''],state.purchaseOrders.map(po=>`<tr><td><span class="cell-title">${esc(po.id)}</span><span class="cell-sub">${dateFmt(po.createdAt)}</span></td><td>${esc(getVendor(po.vendorId)?.name||po.vendorId)}</td><td>${po.lines.map(l=>`${esc(getPart(l.partId)?.code||l.partId)} × ${l.qty}`).join('<br>')}</td><td>${money(po.lines.reduce((n,l)=>n+l.qty*l.unitCost,0))}</td><td>${status(po.status)}</td><td>${dateFmt(po.expectedDate)}</td><td class="right">${po.status!=='Received'?`<button class="button small primary" data-receive-po="${po.id}">Receive</button>`:''}</td></tr>`),'No purchase orders')}</section>`;
}
function receivePO(id){
  const po=state.purchaseOrders.find(x=>x.id===id);if(!po||po.status==='Received')return;
  po.lines.forEach(line=>{const p=getPart(line.partId);const loc=p.locations[0]||{storeId:'STORE-MAIN',bin:'Receiving',onHand:0};postStock(p.id,'Receipt',line.qty,loc.storeId,loc.bin,{reference:po.id,note:`Received against ${po.id}`})});
  po.status='Received';po.receivedAt=iso();(po.sourceRequestIds||[]).forEach(rid=>{const r=state.purchaseRequests.find(r=>r.id===rid);if(r)r.status='Received'});
  addAudit('PURCHASE_ORDER_RECEIVED',po.id,'All lines received');saveState();render();toast(`${po.id} received and stock updated`);
}
function renderVendors(){
  return pageHead('Parts & purchasing','Vendors','Supplier master records used by parts and purchase orders.',
    `<button class="button" data-action="add-vendor">＋ Add vendor</button>`)
  +`<section class="card">${table(['Vendor','Contact','Phone','Email','Status'],state.vendors.map(v=>`<tr><td><span class="cell-title">${esc(v.name)}</span><span class="cell-sub">${esc(v.id)}</span></td><td>${esc(v.contact||'—')}</td><td>${esc(v.phone||'—')}</td><td>${esc(v.email||'—')}</td><td>${status(v.status)}</td></tr>`),'No vendors')}</section>`;
}
function renderToolCrib(){
  return pageHead('Parts & purchasing','Tool crib','Durable tools are tracked separately from consumable inventory.')
  +`<section class="card">${table(['Tool','Description','Store','Status','Holder','Due back',''],state.toolCrib.map(t=>`<tr><td>${esc(t.code)}</td><td>${esc(t.name)}</td><td>${esc(getStore(t.storeId)?.name||t.storeId)}</td><td>${status(t.status)}</td><td>${esc(getUser(t.holderUserId)?.name||'—')}</td><td>${dateFmt(t.dueBack)}</td><td class="right"><button class="button small" data-tool-toggle="${t.id}">${t.status==='Available'?'Check out':'Check in'}</button></td></tr>`),'No tools')}</section>`;
}
