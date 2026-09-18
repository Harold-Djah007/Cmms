'use strict';
// SafiMaintain workflow hardening based on Fiix's public CMMS operating model.
// Client workflow checks provide immediate feedback; the shared API repeats authorization before accepting changes.

function hasPermission(permission){
  const user=currentUser();
  const role=user&&getRole(user.roleId);
  return !!(user&&user.active&&role&&role.permissions.includes(permission));
}
function requirePermission(permission,label='perform this action'){
  if(hasPermission(permission)) return true;
  toast(`You do not have permission to ${label}.`);
  addAudit('PERMISSION_DENIED',permission,`${currentUser()?.name||CURRENT_USER} attempted to ${label}`);
  saveState();
  return false;
}

// Gate the highest-risk operational actions. This is useful workflow control in the field build,
// while real authorization must still be enforced by the future backend/API.
const _showAssetForm=showAssetForm;
showAssetForm=function(asset=null){
  if(!requirePermission('asset.edit',asset?'edit assets':'create assets')) return;
  return _showAssetForm(asset);
};
const _showAssetStateModal=showAssetStateModal;
showAssetStateModal=function(id){
  if(!requirePermission('asset.state','change asset operating state')) return;
  return _showAssetStateModal(id);
};
const _showStockMove=showStockMove;
showStockMove=function(partId){
  if(!requirePermission('inventory.manage','post stock movements')) return;
  return _showStockMove(partId);
};
const _showCycleCount=showCycleCount;
showCycleCount=function(partId=null){
  if(!requirePermission('inventory.count','post cycle counts')) return;
  return _showCycleCount(partId);
};
const _approvePR=approvePR;
approvePR=function(id){
  if(!requirePermission('purchase.manage','approve purchase requests')) return;
  return _approvePR(id);
};
const _createPOFromPR=createPOFromPR;
createPOFromPR=function(id){
  if(!requirePermission('purchase.manage','create purchase orders')) return;
  return _createPOFromPR(id);
};

// Preserve a proper two-sided inventory trail for transfers.
const _postStock=postStock;
postStock=function(partId,type,qty,storeId,bin,opts={}){
  const tx=_postStock(partId,type,qty,storeId,bin,opts);
  if(!tx||type!=='Transfer') return tx;
  const part=getPart(partId);
  const quantity=Math.abs(Number(qty));
  const transferId=tx.id;
  tx.qty=-quantity;
  tx.direction='Out';
  const receipt={
    id:uid('TX'),partId,type:'Transfer receipt',qty:quantity,
    storeId:opts.toStoreId,bin:opts.toBin,toStoreId:storeId,toBin:bin,
    reference:opts.reference||transferId,workOrderId:null,at:tx.at,userId:CURRENT_USER,
    note:opts.note||`Transfer received from ${getStore(storeId)?.code||storeId} / ${bin}`,
    linkedTransactionId:transferId,direction:'In'
  };
  tx.linkedTransactionId=receipt.id;
  state.stockTransactions.unshift(receipt);
  addAudit('STOCK_TRANSFER_RECEIVED',receipt.id,`${part?.code||partId}: +${quantity} ${part?.uom||''} at ${getStore(opts.toStoreId)?.code||opts.toStoreId} / ${opts.toBin}`);
  return tx;
};

// Fiix-style receiving: support partial receipts instead of forcing an entire PO closed in one click.
function receivePO(id){
  if(!requirePermission('purchase.manage','receive purchase orders')) return;
  const po=state.purchaseOrders.find(x=>x.id===id);if(!po||po.status==='Received')return;
  const outstanding=po.lines.map((line,index)=>({line,index,remaining:Math.max(0,Number(line.qty)-Number(line.receivedQty||0))})).filter(x=>x.remaining>0);
  if(!outstanding.length){
    po.status='Received';po.receivedAt=po.receivedAt||iso();saveState();render();return;
  }
  openModal({eyebrow:'Purchase order receiving',title:`Receive ${po.id}`,submitText:'Post receipt',body:`
    <div class="notice info" style="margin-bottom:14px">Receive one or more lines now. The PO stays Partially received until every ordered quantity is posted.</div>
    <div class="form-grid">
      ${outstanding.map(({line,index,remaining})=>{
        const p=getPart(line.partId);return `<label>${esc(p?.code||line.partId)} · remaining ${remaining}<input name="line_${index}" type="number" min="0" max="${remaining}" step="0.01" value="${remaining}"></label>`;
      }).join('')}
      ${field('storeId','Receiving store','STORE-MAIN',{type:'select',options:state.stores.map(s=>({value:s.id,label:s.name}))})}
      ${field('bin','Receiving bin','Receiving')}
      ${field('reference','Delivery note / GRN','',{span:true})}
    </div>`,onSubmit:fd=>{
      const storeId=String(fd.get('storeId'));const bin=String(fd.get('bin'));const reference=String(fd.get('reference')||po.id);
      let receivedAny=false;
      outstanding.forEach(({line,index,remaining})=>{
        const amount=Math.max(0,Math.min(remaining,Number(fd.get(`line_${index}`)||0)));
        if(!amount)return;
        postStock(line.partId,'Receipt',amount,storeId,bin,{reference,note:`Received against ${po.id}`});
        line.receivedQty=Number(line.receivedQty||0)+amount;receivedAny=true;
      });
      if(!receivedAny){toast('Enter at least one quantity to receive.');return}
      const complete=po.lines.every(line=>Number(line.receivedQty||0)>=Number(line.qty));
      po.status=complete?'Received':'Partially received';
      po.lastReceivedAt=iso();if(complete)po.receivedAt=iso();
      (po.sourceRequestIds||[]).forEach(rid=>{const r=state.purchaseRequests.find(r=>r.id===rid);if(r)r.status=complete?'Received':'Ordered'});
      addAudit(complete?'PURCHASE_ORDER_RECEIVED':'PURCHASE_ORDER_PARTIAL_RECEIPT',po.id,complete?'All PO lines received':`Partial receipt posted with reference ${reference}`);
      dispatchEvent('Purchase order received',`${po.id} ${complete?'received':'partially received'}`,`${po.id} has a new receipt posted against ${reference}.`,{relatedId:po.id});
      saveState();closeModal();render();toast(complete?`${po.id} fully received`:`${po.id} partial receipt posted`);
    }});
}

// Make purchase-order progress visible in the main list.
function renderPOs(){
  return pageHead('Parts & purchasing','Purchase orders','Approved demand through ordering, partial receiving and close-out.',
    `<button class="button" data-action="manual-po">＋ New purchase order</button>`)
  +`<section class="card">${table(['Purchase order','Vendor','Lines / receipt progress','Total','Status','Expected',''],state.purchaseOrders.map(po=>`<tr><td><span class="cell-title">${esc(po.id)}</span><span class="cell-sub">${dateFmt(po.createdAt)}</span></td><td>${esc(getVendor(po.vendorId)?.name||po.vendorId)}</td><td>${po.lines.map(l=>{const p=getPart(l.partId);return `${esc(p?.code||l.partId)} × ${l.qty} <span class="cell-sub">received ${Number(l.receivedQty||0)}/${l.qty}</span>`}).join('<br>')}</td><td>${money(po.lines.reduce((n,l)=>n+l.qty*l.unitCost,0))}</td><td>${status(po.status)}</td><td>${dateFmt(po.expectedDate)}</td><td class="right">${po.status!=='Received'?`<button class="button small primary" data-receive-po="${po.id}">Receive</button>`:''}</td></tr>`),'No purchase orders')}</section>`;
}

// Strengthen return-to-service records: the completion note is copied to downtime history and linked WO history.
const _changeAssetState=changeAssetState;
changeAssetState=function(assetId,nextState,reason,reasonCode,createWork){
  const before=getAsset(assetId)?.operatingState;
  _changeAssetState(assetId,nextState,reason,reasonCode,createWork);
  if(before==='Offline'&&nextState==='Online'){
    const dt=state.downtime.find(d=>d.assetId===assetId&&d.endedAt);
    if(dt){
      dt.returnToServiceNote=reason;
      dt.returnToServiceCode=reasonCode;
      dt.returnedBy=CURRENT_USER;
      if(dt.workOrderId){
        const wo=getWork(dt.workOrderId);
        if(wo) wo.history.unshift({at:iso(),text:`Asset returned to service — ${reasonCode}: ${reason}`});
      }
      saveState();
    }
  }
};

// Add an explicit permission boundary note to the admin screen so local controls are not mistaken for security.
const _renderSecurity=renderSecurity;
renderSecurity=function(){
  return _renderSecurity()+`<section class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Workflow authorization</h3><p class="muted">SafiMaintain gates asset changes, stock movements, counts and purchasing actions by the signed-in user's role. When connected, the API independently validates the same change before committing a new revision.</p></section>`;
};
