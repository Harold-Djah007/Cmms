'use strict';

// SafiMaintain purchasing and inventory costing v56.
(function(){
  ensureSpecState();

  function ensurePurchasingState(){
    let changed=false;
    if(!Array.isArray(state.inventoryLots)){state.inventoryLots=[];changed=true}
    if(!state.purchasingSettings){
      state.purchasingSettings={requirePoApproval:true,poApprovalThreshold:1000,autoRfqOnLowStock:true,costingMethod:'FIFO',defaultCurrency:'GHS'};
      changed=true;
    }
    const ops=state.roles.find(r=>/operations manager|administrator|system coordinator/i.test(r.name||''));
    if(ops&&!ops.permissions.includes('purchase.approve')){ops.permissions.push('purchase.approve');changed=true}
    state.parts.forEach(p=>{
      if(p.lastPrice===undefined){p.lastPrice=Number(p.unitCost||0);changed=true}
      if(p.currency===undefined){p.currency=state.purchasingSettings.defaultCurrency||'GHS';changed=true}
      if(p.preferredBusinessId===undefined){
        const v=getVendor(p.vendorId),b=state.businesses.find(x=>x.sourceVendorId===p.vendorId||x.name===v?.name);
        p.preferredBusinessId=b?.id||null;changed=true
      }
      if(p.supplierPartNumber===undefined){p.supplierPartNumber='';changed=true}
      if(p.catalog===undefined){p.catalog='';changed=true}
      if(p.leadTimeDays===undefined){p.leadTimeDays=7;changed=true}
    });
    state.purchaseRequests.forEach(r=>{
      if(r.requestedQty===undefined){r.requestedQty=Number(r.qty??r.quantity??0);changed=true}
      if(r.qty===undefined){r.qty=Number(r.requestedQty||0);changed=true}
    });
    state.purchaseOrders.forEach(po=>{
      if(po.approvalStatus===undefined){po.approvalStatus=po.status==='Awaiting Approval'?'Pending':po.approvedAt?'Approved':'Not required';changed=true}
      (po.lines||[]).forEach(l=>{if(l.receivedQty===undefined){l.receivedQty=0;changed=true}})
    });
    if(!state.meta.inventoryLotsBootstrapped){
      state.parts.forEach(p=>(p.locations||[]).forEach(l=>{
        const qty=Number(l.onHand||0);if(qty<=0)return;
        state.inventoryLots.push({id:uid('LOT'),partId:p.id,storeId:l.storeId,bin:l.bin||'',qtyOriginal:qty,qtyRemaining:qty,unitCost:Number(p.lastPrice||p.unitCost||0),receivedAt:state.meta.createdAt||iso(),reference:'Opening balance',currency:p.currency||'GHS'});
      }));
      state.meta.inventoryLotsBootstrapped=true;changed=true
    }
    if(changed)saveState();
  }
  ensurePurchasingState();

  function canApprove(){return typeof safiCan==='function'?safiCan('purchase.approve'):hasPermission('purchase.approve')}
  function poTotal(po){return (po.lines||[]).reduce((n,l)=>n+Number(l.qty||0)*Number(l.unitCost||0),0)}
  function supplierForPart(p){return state.businesses.find(b=>b.id===p?.preferredBusinessId)||state.businesses.find(b=>b.sourceVendorId===p?.vendorId)||getVendor(p?.vendorId)}
  function businessVendorId(businessId){
    const b=state.businesses.find(x=>x.id===businessId);return b?.sourceVendorId||state.vendors.find(v=>v.name===b?.name)?.id||null
  }
  function approvalRequired(total){
    const s=state.purchasingSettings;return !!s.requirePoApproval&&Number(total)>=Number(s.poApprovalThreshold||0)
  }
  function createPurchaseOrder({businessId=null,vendorId=null,lines=[],sourceRequestIds=[],sourceRfqId=null,expectedDate=null,note=''}) {
    const normalized=lines.map(l=>({...l,qty:Number(l.qty||0),unitCost:Number(l.unitCost||0),receivedQty:Number(l.receivedQty||0)}));
    const temp={lines:normalized},total=poTotal(temp),needsApproval=approvalRequired(total);
    const po={id:uid('PO'),businessId:businessId||null,vendorId:vendorId||businessVendorId(businessId),status:needsApproval?'Awaiting Approval':'Ordered',approvalStatus:needsApproval?'Pending':'Not required',createdAt:iso(),orderedAt:needsApproval?null:iso(),expectedDate:expectedDate||day(7),lines:normalized,sourceRequestIds:[...sourceRequestIds],sourceRfqId:sourceRfqId||null,note,createdBy:CURRENT_USER};
    state.purchaseOrders.unshift(po);
    sourceRequestIds.forEach(rid=>{const r=state.purchaseRequests.find(x=>x.id===rid);if(r){r.status=needsApproval?'PO Awaiting Approval':'Ordered';r.purchaseOrderId=po.id}});
    addAudit('PURCHASE_ORDER_CREATED',po.id,(needsApproval?'Awaiting approval · ':'Ordered · ')+money(total));
    dispatchEvent('Purchase order created',po.id+' created',(needsApproval?'Approval required. ':'Order created. ')+money(total),{relatedId:po.id});
    saveState();return po;
  }
  window.safiCreatePurchaseOrder=createPurchaseOrder;

  function addLot(partId,storeId,bin,qty,unitCost,reference,currency='GHS'){
    qty=Math.abs(Number(qty||0));if(!qty)return null;
    const lot={id:uid('LOT'),partId,storeId,bin:bin||'',qtyOriginal:qty,qtyRemaining:qty,unitCost:Number(unitCost||0),receivedAt:iso(),reference:reference||'Receipt',currency};
    state.inventoryLots.push(lot);return lot
  }
  function consumeLots(partId,storeId,bin,qty){
    let remaining=Math.abs(Number(qty||0)),cost=0;
    const lots=state.inventoryLots.filter(l=>l.partId===partId&&l.storeId===storeId&&String(l.bin||'')===String(bin||'')&&Number(l.qtyRemaining||0)>0).sort((a,b)=>String(a.receivedAt).localeCompare(String(b.receivedAt)));
    for(const lot of lots){
      if(remaining<=0)break;
      const take=Math.min(remaining,Number(lot.qtyRemaining||0));lot.qtyRemaining=Number(lot.qtyRemaining||0)-take;remaining-=take;cost+=take*Number(lot.unitCost||0)
    }
    if(remaining>0){const p=getPart(partId);cost+=remaining*Number(p?.lastPrice||p?.unitCost||0)}
    return {cost,quantity:Math.abs(Number(qty||0)),average:Math.abs(Number(qty||0))?cost/Math.abs(Number(qty||0)):0}
  }
  function inventoryValue(partId=null){
    return state.inventoryLots.filter(l=>(!partId||l.partId===partId)&&Number(l.qtyRemaining||0)>0).reduce((n,l)=>n+Number(l.qtyRemaining||0)*Number(l.unitCost||0),0)
  }
  window.safiInventoryValue=inventoryValue;

  const previousPostStock=postStock;
  postStock=function(partId,type,qty,storeId,bin,opts={}){
    const p=getPart(partId),quantity=Math.abs(Number(qty||0));
    if(!p)return previousPostStock(partId,type,qty,storeId,bin,opts);
    let costInfo=null;
    if(['Issue','Transfer'].includes(type)||(type==='Adjustment'&&Number(qty)<0))costInfo=consumeLots(partId,storeId,bin,quantity);
    const tx=previousPostStock(partId,type,qty,storeId,bin,opts);if(!tx)return tx;
    if(type==='Receipt'||(type==='Adjustment'&&Number(qty)>0)){
      const unitCost=Number(opts.unitCost??p.lastPrice??p.unitCost??0);addLot(partId,storeId,bin,quantity,unitCost,opts.reference||tx.id,p.currency||'GHS');p.lastPrice=unitCost||p.lastPrice;p.unitCost=Number(p.unitCost||unitCost||0);
      tx.unitCost=unitCost;tx.extendedCost=quantity*unitCost;
    }else if(type==='Issue'||(type==='Adjustment'&&Number(qty)<0)){
      tx.unitCost=costInfo?.average||0;tx.extendedCost=costInfo?.cost||0;tx.costingMethod='FIFO';
      if(type==='Issue'&&opts.workOrderId){const w=getWork(opts.workOrderId),line=w?.parts?.find(x=>x.partId===partId);if(line)line.actualCost=Number(line.actualCost||0)+Number(costInfo?.cost||0)}
    }else if(type==='Transfer'){
      tx.unitCost=costInfo?.average||0;tx.extendedCost=costInfo?.cost||0;tx.costingMethod='FIFO';
      addLot(partId,opts.toStoreId,opts.toBin,quantity,costInfo?.average||p.lastPrice||p.unitCost||0,opts.reference||tx.id,p.currency||'GHS');
      const receipt=state.stockTransactions.find(x=>x.id===tx.linkedTransactionId);if(receipt){receipt.unitCost=costInfo?.average||0;receipt.extendedCost=costInfo?.cost||0;receipt.costingMethod='FIFO'}
    }
    ensureLowStockSourcing(p);
    return tx;
  };
  window.postStock=postStock;

  function ensureLowStockSourcing(p){
    if(!p||partOnHand(p)>=Number(p.min||0)||!state.purchasingSettings.autoRfqOnLowStock)return;
    const business=supplierForPart(p);if(!business)return;
    const open=state.rfqs.some(r=>r.partId===p.id&&['Sent','Returned','Draft'].includes(r.status));
    if(open)return;
    const qty=Math.max(Number(p.reorderQty||1),Math.max(0,Number(p.max||p.min||0)-partOnHand(p)));
    const rfq={id:uid('RFQ'),partId:p.id,qty,businessId:business.id||null,vendorId:business.sourceVendorId||p.vendorId||null,status:'Sent',dueDate:day(Math.max(1,Number(p.leadTimeDays||7)-2)),createdAt:iso(),source:'Automatic low stock',autoCreated:true};
    state.rfqs.unshift(rfq);addAudit('RFQ_AUTO_CREATED',rfq.id,p.code+' × '+qty);dispatchEvent('Low stock RFQ created',rfq.id+' sent for '+p.code,'Preferred supplier sourcing started automatically.',{partId:p.id,relatedId:rfq.id})
  }

  approvePR=function(id){
    if(!requirePermission('purchase.manage','approve purchase requests'))return;
    const r=state.purchaseRequests.find(x=>x.id===id);if(!r||!['Open','Requested'].includes(r.status))return;
    r.status='Approved';r.approvedBy=CURRENT_USER;r.approvedAt=iso();r.requestedQty=Number(r.requestedQty||r.qty||r.quantity||0);
    addAudit('PURCHASE_REQUEST_APPROVED',r.id,'Approved '+r.requestedQty+' '+(getPart(r.partId)?.uom||''));saveState();render();toast(r.id+' approved')
  };
  window.approvePR=approvePR;

  createPOFromPR=function(id){
    if(!requirePermission('purchase.manage','create purchase orders'))return;
    const r=state.purchaseRequests.find(x=>x.id===id);if(!r||r.status!=='Approved')return;const p=getPart(r.partId);if(!p)return;
    const business=supplierForPart(p),qty=Number(r.requestedQty||r.qty||r.quantity||0),po=createPurchaseOrder({businessId:business?.id||null,vendorId:p.vendorId||business?.sourceVendorId||null,lines:[{partId:p.id,qty,unitCost:Number(p.lastPrice||p.unitCost||0),receivedQty:0}],sourceRequestIds:[r.id],expectedDate:day(Number(p.leadTimeDays||7))});
    render();toast(po.id+' created'+(po.status==='Awaiting Approval'?' · approval required':''))
  };
  window.createPOFromPR=createPOFromPR;

  showManualPO=function(){
    if(!requirePermission('purchase.manage','create purchase orders'))return;
    const suppliers=state.businesses.filter(b=>['Vendor','Supplier','Manufacturer','Service Provider','Contractor'].includes(b.type));
    openModal({eyebrow:'Purchasing',title:'Create purchase order',submitText:'Create PO',body:'<div class="form-grid">'+
      field('businessId','Supplier',suppliers[0]?.id||'',{type:'select',options:suppliers.map(b=>({value:b.id,label:b.name+' · '+b.type}))})+
      field('partId','Part',state.parts[0]?.id||'',{type:'select',options:state.parts.map(p=>({value:p.id,label:p.code+' · '+p.name}))})+
      field('qty','Quantity','1',{type:'number',required:true,min:.01,step:'.01'})+
      field('unitCost','Unit price','0',{type:'number',required:true,min:0,step:'.01'})+
      field('expectedDate','Expected date',day(7),{type:'date',required:true})+
      field('note','PO note','',{span:true})+'</div>',onSubmit:fd=>{const p=getPart(String(fd.get('partId'))),qty=Number(fd.get('qty')),cost=Number(fd.get('unitCost'));if(!p||!(qty>0)){toast('Choose a valid part and quantity');return}const po=createPurchaseOrder({businessId:String(fd.get('businessId')||'')||null,lines:[{partId:p.id,qty,unitCost:cost,receivedQty:0}],expectedDate:String(fd.get('expectedDate')),note:String(fd.get('note')||'')});closeModal();render();toast(po.id+' created'+(po.status==='Awaiting Approval'?' · approval required':''))}});
  };
  window.showManualPO=showManualPO;

  function approvePO(id){
    if(!canApprove()){toast('Purchase approval permission is required.');return}
    const po=state.purchaseOrders.find(x=>x.id===id);if(!po||po.status!=='Awaiting Approval')return;
    po.status='Approved';po.approvalStatus='Approved';po.approvedBy=CURRENT_USER;po.approvedAt=iso();addAudit('PURCHASE_ORDER_APPROVED',po.id,money(poTotal(po)));dispatchEvent('Purchase order approved',po.id+' approved',money(poTotal(po))+' approved for ordering.',{relatedId:po.id});saveState();render();toast(po.id+' approved')
  }
  function placeOrder(id){
    if(!requirePermission('purchase.manage','place purchase orders'))return;
    const po=state.purchaseOrders.find(x=>x.id===id);if(!po||!['Approved','Draft'].includes(po.status))return;
    po.status='Ordered';po.orderedAt=iso();(po.sourceRequestIds||[]).forEach(rid=>{const r=state.purchaseRequests.find(x=>x.id===rid);if(r)r.status='Ordered'});addAudit('PURCHASE_ORDER_PLACED',po.id,'Order placed');dispatchEvent('Purchase order placed',po.id+' ordered','Supplier order placed.',{relatedId:po.id});saveState();render();toast(po.id+' ordered')
  }

  receivePO=function(id){
    if(!requirePermission('purchase.manage','receive purchase orders'))return;
    const po=state.purchaseOrders.find(x=>x.id===id);if(!po||!['Ordered','Partially received'].includes(po.status)){toast('PO must be ordered before goods can be received');return}
    const outstanding=(po.lines||[]).map((line,index)=>({line,index,remaining:Math.max(0,Number(line.qty||0)-Number(line.receivedQty||0))})).filter(x=>x.remaining>0);
    if(!outstanding.length){po.status='Received';po.receivedAt=po.receivedAt||iso();saveState();render();return}
    openModal({eyebrow:'Goods receipt',title:'Receive '+po.id,submitText:'Post receipt',body:'<div class="notice info" style="margin-bottom:12px">Post only what physically arrived. Remaining quantities stay open on the purchase order.</div><div class="form-grid">'+
      outstanding.map(({line,index,remaining})=>{const p=getPart(line.partId);return '<label>'+esc(p?.code||line.partId)+' · remaining '+remaining+'<input name="line_'+index+'" type="number" min="0" max="'+remaining+'" step="0.01" value="'+remaining+'"></label>'}).join('')+
      field('storeId','Receiving store',state.stores[0]?.id||'',{type:'select',options:state.stores.map(s=>({value:s.id,label:s.name}))})+
      field('bin','Receiving bin','Receiving')+field('reference','Delivery note / GRN','',{span:true})+'</div>',onSubmit:fd=>{
        const storeId=String(fd.get('storeId')),bin=String(fd.get('bin')||'Receiving'),reference=String(fd.get('reference')||po.id);let receivedAny=false,receiptLines=[];
        outstanding.forEach(({line,index,remaining})=>{const amount=Math.max(0,Math.min(remaining,Number(fd.get('line_'+index)||0)));if(!amount)return;postStock(line.partId,'Receipt',amount,storeId,bin,{reference,note:'Received against '+po.id,unitCost:Number(line.unitCost||0)});line.receivedQty=Number(line.receivedQty||0)+amount;receiptLines.push({partId:line.partId,qty:amount,unitCost:Number(line.unitCost||0)});const p=getPart(line.partId);if(p){p.lastPrice=Number(line.unitCost||p.lastPrice||0);p.unitCost=Number(line.unitCost||p.unitCost||0)}receivedAny=true});
        if(!receivedAny){toast('Enter at least one quantity to receive');return}
        const complete=po.lines.every(l=>Number(l.receivedQty||0)>=Number(l.qty||0));po.status=complete?'Received':'Partially received';po.lastReceivedAt=iso();if(complete)po.receivedAt=iso();
        const receipt={id:uid('REC'),purchaseOrderId:po.id,storeId,bin,reference,receivedAt:iso(),receivedBy:CURRENT_USER,lines:receiptLines};state.receipts.unshift(receipt);
        (po.sourceRequestIds||[]).forEach(rid=>{const pr=state.purchaseRequests.find(x=>x.id===rid);if(pr)pr.status=complete?'Received':'Ordered'});
        addAudit(complete?'PURCHASE_ORDER_RECEIVED':'PURCHASE_ORDER_PARTIAL_RECEIPT',po.id,reference+' · '+receiptLines.length+' lines');dispatchEvent('Purchase order received',po.id+(complete?' received':' partially received'),reference,{relatedId:po.id});saveState();closeModal();render();toast(complete?po.id+' fully received':po.id+' partial receipt posted')
      }});
  };
  window.receivePO=receivePO;

  function poSupplier(po){return state.businesses.find(b=>b.id===po.businessId)||getVendor(po.vendorId)}
  function showPODetail(id){
    const po=state.purchaseOrders.find(x=>x.id===id);if(!po)return;const supplier=poSupplier(po),total=poTotal(po),qty=po.lines.reduce((n,l)=>n+Number(l.qty||0),0),rec=po.lines.reduce((n,l)=>n+Number(l.receivedQty||0),0);
    openModal({eyebrow:po.id+' · '+po.status,title:supplier?.name||'Purchase order',body:'<div class="v56-po-detail"><div class="v56-po-summary"><div><small>Supplier</small><strong>'+esc(supplier?.name||'—')+'</strong></div><div><small>Total</small><strong>'+money(total)+'</strong></div><div><small>Expected</small><strong>'+dateFmt(po.expectedDate)+'</strong></div><div><small>Receipt progress</small><strong>'+rec+' / '+qty+'</strong></div><div><small>Approval</small><strong>'+esc(po.approvalStatus||'—')+'</strong></div><div><small>Approved by</small><strong>'+esc(getUser(po.approvedBy)?.name||'—')+'</strong></div><div><small>Ordered</small><strong>'+dateTimeFmt(po.orderedAt)+'</strong></div><div><small>Source</small><strong>'+esc((po.sourceRequestIds||[]).join(', ')||po.sourceRfqId||'Manual')+'</strong></div></div>'+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Part</th><th>Ordered</th><th>Received</th><th>Unit price</th><th>Line total</th></tr></thead><tbody>'+po.lines.map(l=>{const p=getPart(l.partId);return '<tr><td><strong>'+esc(p?.code||l.partId)+' · '+esc(p?.name||'')+'</strong></td><td>'+Number(l.qty||0)+' '+esc(p?.uom||'')+'</td><td>'+Number(l.receivedQty||0)+'</td><td>'+money(Number(l.unitCost||0))+'</td><td>'+money(Number(l.qty||0)*Number(l.unitCost||0))+'</td></tr>'}).join('')+'</tbody></table></div>'+
      '<div class="v56-po-actions">'+(po.status==='Awaiting Approval'?'<button class="button primary" data-v56-approve-po="'+esc(po.id)+'">Approve PO</button>':'')+(po.status==='Approved'?'<button class="button primary" data-v56-place-po="'+esc(po.id)+'">Place order</button>':'')+(['Ordered','Partially received'].includes(po.status)?'<button class="button primary" data-receive-po="'+esc(po.id)+'">Receive goods</button>':'')+'</div></div>'});
  }

  renderPOs=function(){
    const awaiting=state.purchaseOrders.filter(p=>p.status==='Awaiting Approval').length,ordered=state.purchaseOrders.filter(p=>p.status==='Ordered').length,partial=state.purchaseOrders.filter(p=>p.status==='Partially received').length,totalOpen=state.purchaseOrders.filter(p=>!['Received','Cancelled','Closed'].includes(p.status)).reduce((n,p)=>n+poTotal(p),0);
    return '<div class="v50-page">'+pageHead('Purchasing','Purchase orders','Controlled approval, ordering, partial receiving and inventory valuation.','<button class="button" data-route="purchase-settings">Purchasing settings</button><button class="button primary" data-action="manual-po">＋ Purchase order</button>')+
      '<div class="v56-source-grid"><div><small>Awaiting approval</small><strong>'+awaiting+'</strong></div><div><small>Ordered</small><strong>'+ordered+'</strong></div><div><small>Partial receipts</small><strong>'+partial+'</strong></div><div><small>Open PO value</small><strong>'+money(totalOpen)+'</strong></div></div>'+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>PO / supplier</th><th>Lines</th><th>Total</th><th>Status</th><th>Approval</th><th>Expected</th><th>Receipt</th><th></th></tr></thead><tbody>'+
      state.purchaseOrders.map(po=>{const supplier=poSupplier(po),qty=po.lines.reduce((n,l)=>n+Number(l.qty||0),0),rec=po.lines.reduce((n,l)=>n+Number(l.receivedQty||0),0),pct=qty?Math.round(rec/qty*100):0;return '<tr><td><strong>'+esc(po.id)+' · '+esc(supplier?.name||'No supplier')+'</strong><small>'+dateFmt(po.createdAt)+'</small></td><td>'+po.lines.length+'</td><td><strong>'+money(poTotal(po))+'</strong></td><td>'+status(po.status)+'</td><td>'+esc(po.approvalStatus||'—')+'</td><td>'+dateFmt(po.expectedDate)+'</td><td>'+pct+'%<div class="v56-value-bar"><i style="width:'+pct+'%"></i></div></td><td><div class="v56-po-actions"><button class="button small" data-v56-open-po="'+esc(po.id)+'">Open</button>'+(po.status==='Awaiting Approval'&&canApprove()?'<button class="button small primary" data-v56-approve-po="'+esc(po.id)+'">Approve</button>':'')+(po.status==='Approved'?'<button class="button small primary" data-v56-place-po="'+esc(po.id)+'">Order</button>':'')+(['Ordered','Partially received'].includes(po.status)?'<button class="button small primary" data-receive-po="'+esc(po.id)+'">Receive</button>':'')+'</div></td></tr>'}).join('')+
      '</tbody></table></div></div>';
  };
  window.renderPOs=renderPOs;

  renderPlanning=function(){
    const low=state.parts.filter(p=>partOnHand(p)<Number(p.min||0)),prs=state.purchaseRequests.filter(r=>!['Received','Closed','Cancelled','Rejected'].includes(r.status)),quotes=state.rfqs.filter(r=>r.status==='Returned');
    return '<div class="v50-page">'+pageHead('Purchasing','Planning board','Consolidate maintenance demand, low stock and supplier quotations before committing spend.')+
      '<div class="v56-source-grid"><div><small>Open requests</small><strong>'+prs.length+'</strong></div><div><small>Low stock</small><strong>'+low.length+'</strong></div><div><small>Quotes returned</small><strong>'+quotes.length+'</strong></div><div><small>Awaiting PO approval</small><strong>'+state.purchaseOrders.filter(p=>p.status==='Awaiting Approval').length+'</strong></div></div>'+
      '<div class="v50-grid"><section class="v50-card"><div class="v50-card-head"><div><h2>Purchase requests</h2><p>Maintenance and inventory demand</p></div></div><div class="v50-list">'+(prs.length?prs.map(r=>{const p=getPart(r.partId);return '<div class="v50-list-row"><span><strong>'+esc(r.id)+' · '+esc(p?.code||r.partId)+'</strong><small>'+Number(r.requestedQty||r.qty||r.quantity||0)+' '+esc(p?.uom||'')+' · '+esc(r.reason||r.source||'Demand')+'</small></span><span class="v52-actions">'+status(r.status)+(r.status==='Requested'||r.status==='Open'?'<button class="button small" data-approve-pr="'+esc(r.id)+'">Approve</button>':'')+(r.status==='Approved'?'<button class="button small primary" data-po-from-pr="'+esc(r.id)+'">Create PO</button>':'')+'</span></div>'}).join(''):'<div class="v50-empty"><strong>No open purchase requests</strong><span>Demand created from work or inventory appears here.</span></div>')+'</div></section>'+
      '<section class="v50-card"><div class="v50-card-head"><div><h2>Low-stock sourcing</h2><p>Preferred supplier and reorder policy</p></div></div><div class="v50-list">'+(low.length?low.map(p=>'<div class="v50-list-row"><span><strong>'+esc(p.code)+' · '+esc(p.name)+'</strong><small>'+partOnHand(p)+' on hand · min '+p.min+' · supplier '+esc(supplierForPart(p)?.name||'not configured')+'</small></span><button class="button small" data-v56-source-part="'+esc(p.id)+'">Source</button></div>').join(''):'<div class="v50-empty"><strong>No low-stock exceptions</strong><span>Current stock meets configured minimums.</span></div>')+'</div></section></div></div>';
  };
  window.renderPlanning=renderPlanning;

  function renderPartDetailV56(p){
    if(!p)return '<div class="v50-empty"><strong>No part selected</strong><span>Select a part to view stock and sourcing.</span></div>';
    const onHand=partOnHand(p),supplier=supplierForPart(p),lots=state.inventoryLots.filter(l=>l.partId===p.id&&Number(l.qtyRemaining||0)>0).sort((a,b)=>String(a.receivedAt).localeCompare(String(b.receivedAt))),tx=state.stockTransactions.filter(t=>t.partId===p.id).slice(0,12),usedOn=state.assets.filter(a=>(a.bom||[]).includes(p.id)),value=inventoryValue(p.id);
    return '<div class="detail-hero"><div class="detail-title"><div class="asset-avatar">◇</div><div><h2>'+esc(p.name)+'</h2><p>'+esc(p.code)+' · '+esc(p.category)+' · '+esc(p.uom)+'</p></div><div class="detail-actions"><button class="button" data-stock-move="'+esc(p.id)+'">Stock movement</button><button class="button" data-v56-edit-part="'+esc(p.id)+'">Edit sourcing</button><button class="button primary" data-count-part="'+esc(p.id)+'">Cycle count</button></div></div>'+
      '<div class="stat-strip"><div><small>On hand</small><strong>'+onHand+' '+esc(p.uom)+'</strong></div><div><small>Minimum / max</small><strong>'+p.min+' / '+p.max+'</strong></div><div><small>Last price</small><strong>'+money(p.lastPrice||p.unitCost)+'</strong></div><div><small>FIFO value</small><strong>'+money(value)+'</strong></div></div></div>'+
      '<div class="detail-body">'+(onHand<Number(p.min||0)?'<div class="notice" style="margin-bottom:12px"><strong>Below minimum.</strong> Sourcing demand is active; preferred-supplier RFQ automation follows the purchasing policy.</div>':'')+
      '<div class="fields"><div class="field"><small>Preferred supplier</small><strong>'+esc(supplier?.name||'—')+'</strong></div><div class="field"><small>Supplier part number</small><strong>'+esc(p.supplierPartNumber||'—')+'</strong></div><div class="field"><small>Catalog</small><strong>'+esc(p.catalog||'—')+'</strong></div><div class="field"><small>Lead time</small><strong>'+Number(p.leadTimeDays||0)+' days</strong></div><div class="field"><small>Reorder quantity</small><strong>'+Number(p.reorderQty||0)+' '+esc(p.uom)+'</strong></div><div class="field"><small>Currency</small><strong>'+esc(p.currency||'GHS')+'</strong></div></div>'+
      '<h3 class="section-title">Stock by location</h3>'+table(['Store','Bin','On hand'],p.locations.map(l=>'<tr><td>'+esc(getStore(l.storeId)?.name||l.storeId)+'</td><td>'+esc(l.bin||'')+'</td><td><b>'+Number(l.onHand||0)+' '+esc(p.uom)+'</b></td></tr>'),'No stock locations')+
      '<h3 class="section-title">FIFO cost layers</h3><div class="v56-lots">'+(lots.length?lots.map(l=>'<div class="v56-lot"><span><strong>'+esc(l.reference||l.id)+'</strong><small>'+dateTimeFmt(l.receivedAt)+' · '+esc(getStore(l.storeId)?.code||l.storeId)+' / '+esc(l.bin||'')+'</small></span><span>'+Number(l.qtyRemaining||0)+' '+esc(p.uom)+'</span><span class="v56-cost-chip">'+money(l.unitCost)+'/unit</span><strong>'+money(Number(l.qtyRemaining||0)*Number(l.unitCost||0))+'</strong></div>').join(''):'<div class="v50-empty"><strong>No open FIFO layers</strong><span>New receipts create cost layers.</span></div>')+'</div>'+
      '<h3 class="section-title">Used on assets</h3><p class="muted" style="font-size:9px">'+(usedOn.map(a=>esc(a.code)+' · '+esc(a.name)).join('<br>')||'Not currently listed on an asset BOM.')+'</p>'+
      '<h3 class="section-title">Recent transactions</h3>'+table(['Type','Qty','Location','Reference','FIFO cost','Date'],tx.map(t=>'<tr><td>'+status(t.type)+'</td><td>'+((Number(t.qty||0)>0)?'+':'')+Number(t.qty||0)+' '+esc(p.uom)+'</td><td>'+esc(getStore(t.storeId)?.code||t.storeId)+' / '+esc(t.bin||'')+'</td><td>'+esc(t.reference||'—')+'</td><td>'+money(t.extendedCost||0)+'</td><td>'+dateTimeFmt(t.at)+'</td></tr>'),'No stock transactions')+'</div>';
  }
  renderPartDetail=renderPartDetailV56;window.renderPartDetail=renderPartDetailV56;

  function editPartSourcing(p){
    const suppliers=state.businesses.filter(b=>['Vendor','Supplier','Manufacturer','Service Provider','Contractor'].includes(b.type));
    openModal({eyebrow:p.code+' · Sourcing',title:p.name,submitText:'Save sourcing',body:'<div class="form-grid">'+
      field('preferredBusinessId','Preferred supplier',p.preferredBusinessId||'',{type:'select',options:[{value:'',label:'No preferred supplier'},...suppliers.map(b=>({value:b.id,label:b.name+' · '+b.type}))]})+
      field('supplierPartNumber','Supplier part number',p.supplierPartNumber||'')+
      field('catalog','Catalog / reference',p.catalog||'')+
      field('currency','Currency',p.currency||'GHS',{type:'select',options:['GHS','USD','EUR','GBP'].map(x=>({value:x,label:x}))})+
      field('leadTimeDays','Lead time (days)',String(p.leadTimeDays||7),{type:'number',min:0,step:'1'})+
      field('reorderQty','Reorder quantity',String(p.reorderQty||1),{type:'number',min:.01,step:'.01'})+
      field('min','Minimum stock',String(p.min||0),{type:'number',min:0,step:'.01'})+
      field('max','Maximum stock',String(p.max||0),{type:'number',min:0,step:'.01'})+'</div>',onSubmit:fd=>{const min=Number(fd.get('min')||0),max=Number(fd.get('max')||0);if(max&&min>max){toast('Minimum cannot exceed maximum');return}p.preferredBusinessId=String(fd.get('preferredBusinessId')||'')||null;p.vendorId=businessVendorId(p.preferredBusinessId)||p.vendorId;p.supplierPartNumber=String(fd.get('supplierPartNumber')||'');p.catalog=String(fd.get('catalog')||'');p.currency=String(fd.get('currency')||'GHS');p.leadTimeDays=Number(fd.get('leadTimeDays')||0);p.reorderQty=Number(fd.get('reorderQty')||1);p.min=min;p.max=max;addAudit('PART_SOURCING_UPDATED',p.id,supplierForPart(p)?.name||'No supplier');ensureLowStockSourcing(p);saveState();closeModal();render();toast('Sourcing details saved')}});
  }

  showPartForm=function(){
    if(!requirePermission('inventory.manage','create parts'))return;
    const suppliers=state.businesses.filter(b=>['Vendor','Supplier','Manufacturer','Service Provider','Contractor'].includes(b.type));
    openModal({eyebrow:'Parts & supplies',title:'Add part',submitText:'Create part',body:'<div class="form-grid">'+
      field('code','Part number','',{required:true})+field('name','Description','',{required:true})+
      field('category','Category','Spare')+field('uom','Unit of measure','ea')+
      field('unitCost','Opening / standard cost','0',{type:'number',step:'0.01',min:0})+
      field('preferredBusinessId','Preferred supplier',suppliers[0]?.id||'',{type:'select',options:[{value:'',label:'No preferred supplier'},...suppliers.map(b=>({value:b.id,label:b.name}))]})+
      field('supplierPartNumber','Supplier part number','')+field('catalog','Catalog / reference','')+
      field('currency','Currency','GHS',{type:'select',options:['GHS','USD','EUR','GBP'].map(x=>({value:x,label:x}))})+
      field('leadTimeDays','Lead time (days)','7',{type:'number',min:0,step:'1'})+
      field('min','Minimum quantity','0',{type:'number',min:0,step:'.01'})+field('max','Maximum quantity','0',{type:'number',min:0,step:'.01'})+
      field('reorderQty','Reorder quantity','1',{type:'number',min:.01,step:'.01'})+field('barcode','Barcode / QR value','')+
      field('storeId','Initial store',state.stores[0]?.id||'',{type:'select',options:state.stores.map(s=>({value:s.id,label:s.name}))})+field('bin','Initial bin','Unassigned')+
      field('onHand','Opening stock','0',{type:'number',min:0,step:'.01'})+'</div>',onSubmit:fd=>{const v=Object.fromEntries(fd.entries()),min=Number(v.min||0),max=Number(v.max||0);if(max&&min>max){toast('Minimum cannot exceed maximum');return}const cost=Number(v.unitCost||0),part={id:uid('PRT'),code:v.code,name:v.name,category:v.category,uom:v.uom,unitCost:cost,lastPrice:cost,preferredBusinessId:v.preferredBusinessId||null,vendorId:businessVendorId(v.preferredBusinessId)||null,supplierPartNumber:v.supplierPartNumber||'',catalog:v.catalog||'',currency:v.currency||'GHS',leadTimeDays:Number(v.leadTimeDays||0),min,max,reorderQty:Number(v.reorderQty||1),barcode:v.barcode||'',locations:[{storeId:v.storeId,bin:v.bin,onHand:Number(v.onHand||0)}]};state.parts.push(part);if(Number(v.onHand||0)>0)addLot(part.id,v.storeId,v.bin,Number(v.onHand),cost,'Opening stock',part.currency);addAudit('PART_CREATED',part.id,part.code+' '+part.name);ensurePurchaseRequest(part,'Opening stock');ensureLowStockSourcing(part);ui.selectedPart=part.id;saveState();closeModal();render();toast('Part created')}});
  };
  window.showPartForm=showPartForm;

  function sourcePart(id){
    const p=getPart(id);if(!p)return;const business=supplierForPart(p);if(!business){toast('Configure a preferred supplier first');editPartSourcing(p);return}
    const qty=Math.max(Number(p.reorderQty||1),Math.max(0,Number(p.max||p.min||0)-partOnHand(p))),rfq={id:uid('RFQ'),partId:p.id,qty,businessId:business.id||null,vendorId:business.sourceVendorId||p.vendorId||null,status:'Sent',dueDate:day(Math.max(1,Number(p.leadTimeDays||7)-2)),createdAt:iso(),source:'Planning board'};
    state.rfqs.unshift(rfq);addAudit('RFQ_CREATED',rfq.id,p.code+' × '+qty);saveState();go('rfqs');toast(rfq.id+' created')
  }

  function purchaseSettingsPage(){
    const s=state.purchasingSettings;
    return '<div class="v50-page">'+pageHead('Purchasing','Purchasing settings','Control approvals, automatic sourcing and inventory cost behavior.')+
      '<section class="v55-state-card"><div class="v56-settings"><label class="v56-setting-check"><input id="v56RequireApproval" type="checkbox" '+(s.requirePoApproval?'checked':'')+'> Require PO approval at/above threshold</label><label>Approval threshold<input id="v56ApprovalThreshold" type="number" min="0" step="0.01" value="'+Number(s.poApprovalThreshold||0)+'"></label><label class="v56-setting-check"><input id="v56AutoRfq" type="checkbox" '+(s.autoRfqOnLowStock?'checked':'')+'> Automatically create RFQ for low stock with preferred supplier</label><label>Inventory costing<select id="v56CostMethod"><option selected>FIFO</option></select></label><label>Default purchasing currency<select id="v56Currency"><option '+(s.defaultCurrency==='GHS'?'selected':'')+'>GHS</option><option '+(s.defaultCurrency==='USD'?'selected':'')+'>USD</option><option '+(s.defaultCurrency==='EUR'?'selected':'')+'>EUR</option><option '+(s.defaultCurrency==='GBP'?'selected':'')+'>GBP</option></select></label></div><div class="v50-command-actions" style="margin-top:10px"><button class="button primary" data-v56-save-settings>Save purchasing policy</button></div></section>'+
      '<section class="v55-state-card"><h3>Approval separation</h3><p>Users with <b>purchase.manage</b> can source, create and receive orders. Users with <b>purchase.approve</b> can release spend that crosses the approval threshold. The shared API validates these changes again before commit.</p></section></div>';
  }
  function costingPage(){
    const total=inventoryValue(),activeLots=state.inventoryLots.filter(l=>Number(l.qtyRemaining||0)>0),parts=state.parts.map(p=>({p,value:inventoryValue(p.id)})).sort((a,b)=>b.value-a.value);
    return '<div class="v50-page">'+pageHead('Parts & inventory','Inventory costing','FIFO cost layers and current stock valuation derived from actual receipts and issues.')+
      '<div class="v56-source-grid"><div><small>Total FIFO value</small><strong>'+money(total)+'</strong></div><div><small>Active cost layers</small><strong>'+activeLots.length+'</strong></div><div><small>Parts valued</small><strong>'+parts.filter(x=>x.value>0).length+'</strong></div><div><small>Costing method</small><strong>FIFO</strong></div></div>'+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Part</th><th>On hand</th><th>Last price</th><th>FIFO value</th><th>Open lots</th></tr></thead><tbody>'+parts.map(x=>'<tr><td><strong>'+esc(x.p.code)+' · '+esc(x.p.name)+'</strong></td><td>'+partOnHand(x.p)+' '+esc(x.p.uom)+'</td><td>'+money(x.p.lastPrice||x.p.unitCost)+'</td><td><strong>'+money(x.value)+'</strong></td><td>'+activeLots.filter(l=>l.partId===x.p.id).length+'</td></tr>').join('')+'</tbody></table></div></div>';
  }

  const oldTitle=routeTitle;
  routeTitle=function(){return ui.route==='purchase-settings'?'Purchasing settings':ui.route==='inventory-costing'?'Inventory costing':oldTitle()};
  window.routeTitle=routeTitle;
  const oldNav=simpleNavigation;
  simpleNavigation=function(){oldNav();const p=[...document.querySelectorAll('.v50-nav-group')].find(x=>x.querySelector('summary')?.textContent.trim()==='Purchasing')?.querySelector('div');if(p&&!p.querySelector('[data-route="purchase-settings"]'))p.insertAdjacentHTML('beforeend','<button class="nav-item" data-route="purchase-settings"><span class="nav-icon">'+navIcon('security')+'</span><span>Purchasing settings</span></button>');const inv=[...document.querySelectorAll('.v50-nav-group')].find(x=>x.querySelector('summary')?.textContent.trim()==='Parts & inventory')?.querySelector('div');if(inv&&!inv.querySelector('[data-route="inventory-costing"]'))inv.insertAdjacentHTML('beforeend','<button class="nav-item" data-route="inventory-costing"><span class="nav-icon">'+navIcon('reports')+'</span><span>Inventory costing</span></button>')};
  window.simpleNavigation=simpleNavigation;
  const baseRender=render;
  render=function(){ensurePurchasingState();baseRender();let html=null;if(ui.route==='purchase-settings')html=purchaseSettingsPage();if(ui.route==='inventory-costing')html=costingPage();if(html!==null){document.getElementById('appView').innerHTML=html;document.title=routeTitle()+' · SafiMaintain';document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===ui.route))}simpleNavigation();syncSimpleShell()};
  window.render=render;

  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-v56-open-po]');if(open){e.preventDefault();e.stopImmediatePropagation();showPODetail(open.dataset.v56OpenPo);return}
    const approve=e.target.closest('[data-v56-approve-po]');if(approve){e.preventDefault();e.stopImmediatePropagation();approvePO(approve.dataset.v56ApprovePo);return}
    const place=e.target.closest('[data-v56-place-po]');if(place){e.preventDefault();e.stopImmediatePropagation();placeOrder(place.dataset.v56PlacePo);return}
    const edit=e.target.closest('[data-v56-edit-part]');if(edit){e.preventDefault();e.stopImmediatePropagation();const p=getPart(edit.dataset.v56EditPart);if(p)editPartSourcing(p);return}
    const source=e.target.closest('[data-v56-source-part]');if(source){e.preventDefault();e.stopImmediatePropagation();sourcePart(source.dataset.v56SourcePart);return}
    if(e.target.closest('[data-v56-save-settings]')){e.preventDefault();e.stopImmediatePropagation();if(!canApprove()&&!hasPermission('purchase.manage')){toast('Purchasing permission is required');return}state.purchasingSettings.requirePoApproval=!!document.getElementById('v56RequireApproval')?.checked;state.purchasingSettings.poApprovalThreshold=Number(document.getElementById('v56ApprovalThreshold')?.value||0);state.purchasingSettings.autoRfqOnLowStock=!!document.getElementById('v56AutoRfq')?.checked;state.purchasingSettings.costingMethod='FIFO';state.purchasingSettings.defaultCurrency=document.getElementById('v56Currency')?.value||'GHS';addAudit('PURCHASING_POLICY_UPDATED','WORKSPACE','Approval threshold '+state.purchasingSettings.poApprovalThreshold);saveState();render();toast('Purchasing policy saved');return}
  },true);

  render();
})();