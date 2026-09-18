'use strict';
(function(){
  function ensureStockLocationFields(){
    let changed=false;
    state.parts.forEach(p=>{
      p.locations=p.locations||[];
      p.locations.forEach((l,i)=>{
        if(l.aisle===undefined){l.aisle='';changed=true}
        if(l.row===undefined){l.row='';changed=true}
        if(l.active===undefined){l.active=true;changed=true}
        if(l.min===undefined){l.min=i===0?Number(p.min||0):0;changed=true}
        if(l.max===undefined){l.max=i===0?Number(p.max||0):0;changed=true}
      });
    });
    if(changed)saveState();
  }
  ensureStockLocationFields();

  function locName(l){return getStore(l.storeId)?.name||l.storeId||'Unassigned store'}
  function locPath(l){return [l.aisle&&'Aisle '+l.aisle,l.row&&'Row '+l.row,l.bin&&'Bin '+l.bin].filter(Boolean)}
  function aggregatePolicy(p){
    const active=(p.locations||[]).filter(l=>l.active!==false);
    p.min=active.reduce((n,l)=>n+Number(l.min||0),0);
    p.max=active.reduce((n,l)=>n+Number(l.max||0),0);
  }
  function locationTx(p,l){
    return state.stockTransactions.filter(t=>t.partId===p.id&&t.storeId===l.storeId&&String(t.bin||'')===String(l.bin||'')).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,60)
  }
  function beforeAfter(tx){
    const before=tx.qtyBefore!==undefined?Number(tx.qtyBefore):null,after=tx.qtyAfter!==undefined?Number(tx.qtyAfter):null;
    return [before===null?'—':before,after===null?'—':after]
  }

  const previousPostStock=postStock;
  postStock=function(partId,type,qty,storeId,bin,opts={}){
    const p=getPart(partId),l=p?.locations?.find(x=>x.storeId===storeId&&String(x.bin||'')===String(bin||'')),before=Number(l?.onHand||0);
    if(l&&l.active===false&&type!=='Receipt')throw new Error('This stock location is inactive.');
    const tx=previousPostStock(partId,type,qty,storeId,bin,opts);
    const loc=p?.locations?.find(x=>x.storeId===storeId&&String(x.bin||'')===String(bin||''));
    if(tx){tx.qtyBefore=before;tx.qtyAfter=Number(loc?.onHand||0);tx.aisle=loc?.aisle||'';tx.row=loc?.row||''}
    return tx
  };
  window.postStock=postStock;

  function requestPurchase(p,l){
    const existing=state.purchaseRequests.find(r=>r.partId===p.id&&!['Received','Closed','Cancelled','Rejected'].includes(r.status));
    if(existing){toast(existing.id+' already covers this part');return existing}
    const total=partOnHand(p),target=Number(l?.max||p.max||0),qty=Math.max(1,Number(p.reorderQty||0),target>total?target-total:1);
    const pr={id:uid('PR'),partId:p.id,qty,quantity:qty,requestedQty:qty,status:'Requested',createdAt:iso(),reason:'Manual stock replenishment request'+(l?' · '+locName(l)+' / '+locPath(l).join(' / '):''),source:'Stock profile',storeId:l?.storeId||null,bin:l?.bin||'',workOrderId:null};
    state.purchaseRequests.unshift(pr);addAudit('PURCHASE_REQUEST_CREATED',pr.id,p.code+' × '+qty);dispatchEvent('Purchase request created',pr.id+' created',p.name+' · '+qty+' '+p.uom,{partId:p.id,relatedId:pr.id});saveState();toast(pr.id+' submitted');return pr
  }

  function showStockLocation(p,index=null){
    if(!p)return;ensureStockLocationFields();
    const existing=index!==null?p.locations[index]:null,l=existing||{storeId:state.stores[0]?.id||'',aisle:'',row:'',bin:'Unassigned',onHand:0,min:0,max:0,active:true};
    const tx=existing?locationTx(p,l):[];
    openModal({eyebrow:'Stock · '+p.code,title:existing?'Stock location':'Add stock location',submitText:existing?'Save stock settings':'Add location',body:
      '<div class="v62-stock-modal">'+
      '<div class="v62-stock-head"><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.code)+' · '+esc(p.category)+' · '+esc(p.uom)+'</small></span><b class="v62-state '+(l.active===false?'off':'')+'"><i></i>'+(l.active===false?'Inactive':'Active')+'</b></div>'+
      '<div class="v62-stock-note">Quantity on hand is transaction-controlled. Use Stock movement or Cycle count to change quantity so SafiMaintain preserves the inventory audit trail.</div>'+
      '<div class="v62-stock-fields">'+
      '<label>Location / store<select name="storeId">'+state.stores.map(s=>'<option value="'+esc(s.id)+'" '+(s.id===l.storeId?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label>'+
      '<label>Aisle<input name="aisle" value="'+esc(l.aisle||'')+'" placeholder="e.g. A3"></label>'+
      '<label>Row<input name="row" value="'+esc(l.row||'')+'" placeholder="e.g. 02"></label>'+
      '<label>Bin<input name="bin" value="'+esc(l.bin||'')+'" required placeholder="e.g. B-14"></label>'+
      '<label>Qty on hand<input value="'+Number(l.onHand||0)+'" readonly></label>'+
      '<label>Minimum qty<input name="min" type="number" min="0" step="0.01" value="'+Number(l.min||0)+'"></label>'+
      '<label>Maximum qty<input name="max" type="number" min="0" step="0.01" value="'+Number(l.max||0)+'"></label>'+
      '<label class="v62-stock-toggle"><input name="active" type="checkbox" '+(l.active!==false?'checked':'')+'> Active stock location</label>'+
      '</div>'+
      (existing?'<div class="v62-stock-actions"><button class="button" type="button" data-stock-move="'+esc(p.id)+'">Stock movement</button><button class="button" type="button" data-count-part="'+esc(p.id)+'">Cycle count</button><span class="grow"></span><button class="button v62-request" type="button" data-v62-request="'+esc(p.id)+'|'+index+'">Submit purchase request</button></div>':'')+
      (existing?'<div><h3 class="section-title">Stock history</h3><div class="v62-stock-history"><table><thead><tr><th>Date</th><th>User</th><th>Description</th><th>Qty before</th><th>Qty after</th><th>Reference</th></tr></thead><tbody>'+(
        tx.length?tx.map(t=>{const ba=beforeAfter(t);return '<tr><td>'+dateTimeFmt(t.at)+'</td><td>'+esc(getUser(t.userId)?.name||t.userId||'System')+'</td><td>'+esc(t.type+(t.note?' · '+t.note:''))+'</td><td>'+ba[0]+'</td><td>'+ba[1]+'</td><td>'+esc(t.reference||'—')+'</td></tr>'}).join(''):'<tr><td colspan="6">No stock movements recorded for this location.</td></tr>')+
      '</tbody></table></div></div>':'')+
      '</div>',onSubmit:fd=>{
        const min=Number(fd.get('min')||0),max=Number(fd.get('max')||0),bin=String(fd.get('bin')||'').trim();if(!bin){toast('Bin is required');return}if(max>0&&min>max){toast('Minimum quantity cannot exceed maximum quantity');return}
        const values={storeId:String(fd.get('storeId')),aisle:String(fd.get('aisle')||'').trim(),row:String(fd.get('row')||'').trim(),bin,min,max,active:fd.get('active')==='on'};
        const duplicate=p.locations.find((x,i)=>i!==index&&x.storeId===values.storeId&&String(x.aisle||'')===values.aisle&&String(x.row||'')===values.row&&String(x.bin||'')===values.bin);
        if(duplicate){toast('That stock location already exists for this part');return}
        if(existing)Object.assign(existing,values);else p.locations.push({...values,onHand:0});
        aggregatePolicy(p);addAudit(existing?'STOCK_LOCATION_UPDATED':'STOCK_LOCATION_CREATED',p.id,locName(values)+' · '+locPath(values).join(' / '));saveState();closeModal();render();toast(existing?'Stock settings saved':'Stock location added')
      }});
  }
  window.showStockLocation=showStockLocation;

  function stockLocationRows(p){
    return (p.locations||[]).map((l,i)=>'<div class="v62-location-row '+(l.active===false?'inactive':'')+'"><span><strong>'+esc(locName(l))+'</strong><small><span class="v62-locator">'+(locPath(l).length?locPath(l).map(x=>'<span>'+esc(x)+'</span>').join(''):'<span>No aisle/row/bin detail</span>')+'</span></small></span><span><small>On hand</small><b class="'+(Number(l.onHand||0)<Number(l.min||0)?'low':'')+'">'+Number(l.onHand||0)+' '+esc(p.uom)+'</b></span><span><small>Min</small><b>'+Number(l.min||0)+'</b></span><span><small>Max</small><b>'+Number(l.max||0)+'</b></span><span class="v62-hide-md"><small>Status</small><b>'+(l.active===false?'Inactive':'Active')+'</b></span><span class="v62-hide-md"><small>Last move</small><b>'+dateFmt(locationTx(p,l)[0]?.at)+'</b></span><button class="button small" type="button" data-v62-stock-location="'+esc(p.id)+'|'+i+'">Open</button></div>').join('')
  }

  const oldRenderPart=renderPartDetail;
  renderPartDetail=function(p){
    if(!p)return oldRenderPart(p);
    const html=oldRenderPart(p),marker='<h3 class="section-title">Stock locations</h3>';
    const start=html.indexOf(marker);
    if(start<0)return html;
    const next=html.indexOf('<h3 class="section-title">',start+marker.length);
    const replacement='<h3 class="section-title">Stock locations</h3><div class="v62-stock-actions" style="margin-bottom:8px"><span class="grow"></span><button class="button small primary" type="button" data-v62-add-location="'+esc(p.id)+'">＋ Add stock location</button></div><div class="v62-location-list">'+(p.locations?.length?stockLocationRows(p):'<div class="v50-empty"><strong>No stock locations</strong><span>Add a store/bin record to begin managing inventory for this part.</span></div>')+'</div>';
    return next>=0?html.slice(0,start)+replacement+html.slice(next):html.slice(0,start)+replacement
  };
  window.renderPartDetail=renderPartDetail;

  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-v62-stock-location]');if(open){e.preventDefault();e.stopImmediatePropagation();const [pid,idx]=open.dataset.v62StockLocation.split('|'),p=getPart(pid);if(p)showStockLocation(p,Number(idx));return}
    const add=e.target.closest('[data-v62-add-location]');if(add){e.preventDefault();e.stopImmediatePropagation();const p=getPart(add.dataset.v62AddLocation);if(p)showStockLocation(p,null);return}
    const req=e.target.closest('[data-v62-request]');if(req){e.preventDefault();e.stopImmediatePropagation();const [pid,idx]=req.dataset.v62Request.split('|'),p=getPart(pid);if(p)requestPurchase(p,p.locations[Number(idx)]);return}
  },true);

  if(ui.route==='inventory')render();
})();