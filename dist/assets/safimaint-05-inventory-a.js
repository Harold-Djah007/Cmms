'use strict';
function renderMeters(){
  return pageHead('Asset management','Meters','Usage history used to drive condition-aware and meter-based preventive maintenance.',
    `<button class="button" data-action="add-meter-reading">＋ Add reading</button>`)
  +`<section class="card">${table(['Meter','Asset','Current','Last reading','History'],state.meters.map(m=>`<tr><td><span class="cell-title">${esc(m.name)}</span><span class="cell-sub">${esc(m.id)}</span></td><td>${esc(getAsset(m.assetId)?.name||m.assetId)}</td><td><b>${esc(m.current)} ${esc(m.unit)}</b></td><td>${dateFmt(m.readings.at(-1)?.at)}</td><td>${m.readings.length} readings</td></tr>`),'No meters')}</section>`;
}
function showMeterReadingForm(){
  openModal({eyebrow:'Meter reading',title:'Add meter reading',body:`<div class="form-grid">
    ${field('meterId','Meter','MTR-1',{type:'select',options:state.meters.map(m=>({value:m.id,label:`${m.name} · ${getAsset(m.assetId)?.code}`}))})}
    ${field('value','Reading','',{type:'number',required:true,step:'0.01'})}
  </div>`,onSubmit:fd=>{
    const m=state.meters.find(x=>x.id===fd.get('meterId'));if(!m)return;
    const value=Number(fd.get('value'));m.current=value;m.readings.push({value,at:iso()});
    addAudit('METER_READING',m.id,`${value} ${m.unit}`);saveState();closeModal();render();toast('Meter reading saved');
  }});
}
function renderDowntime(){
  const active=state.downtime.filter(d=>!d.endedAt);
  const total=state.downtime.reduce((n,d)=>n+durationHours(d.startedAt,d.endedAt||iso()),0);
  return pageHead('Asset management','Downtime','Every offline event carries a reason, duration, responsible work and audit trail.')
  +`<div class="grid metrics">${metric('Active events',active.length,'Assets currently offline',active.length?'red':'')}${metric('Recorded downtime',`${total.toFixed(1)} h`,'Across current local history')}${metric('With corrective WO',state.downtime.filter(d=>d.workOrderId).length,'Closed-loop downtime response','blue')}${metric('Critical offline',active.filter(d=>getAsset(d.assetId)?.criticality==='A').length,'Criticality A assets','amber')}</div>
    <section class="card">${table(['Event','Asset','Started','Ended','Reason','Work order'],state.downtime.map(d=>`<tr><td>${esc(d.id)}</td><td><span class="cell-title">${esc(getAsset(d.assetId)?.code||d.assetId)}</span><span class="cell-sub">${esc(getAsset(d.assetId)?.name||'')}</span></td><td>${dateTimeFmt(d.startedAt)}</td><td>${d.endedAt?dateTimeFmt(d.endedAt):status('Active')}</td><td><span class="cell-title">${esc(d.reasonCode)}</span><span class="cell-sub">${esc(d.reason)}</span></td><td>${d.workOrderId?`<button class="button link" data-open-work="${d.workOrderId}">${esc(d.workOrderId)}</button>`:'—'}</td></tr>`),'No downtime events')}</section>`;
}

function renderInventory(){
  const q=String(ui.inventorySearch||'').trim().toLowerCase();
  const all=state.parts.slice();
  const visible=all.filter(p=>!q||`${p.code} ${p.name} ${p.category} ${getVendor(p.vendorId)?.name||''}`.toLowerCase().includes(q));
  if(!getPart(ui.selectedPart)||!visible.some(p=>p.id===ui.selectedPart)) ui.selectedPart=visible[0]?.id||all[0]?.id||null;
  const p=getPart(ui.selectedPart);
  return pageHead('Parts & purchasing','Parts & supplies','Multi-location stock, min/max controls, usage history, BOM links and replenishment demand.',
    `<button class="button" data-action="add-part">＋ Add part</button>`)
  +`<div class="split-view">
    <section class="card record-list">
      <div class="toolbar"><input data-filter="inventory" value="${esc(ui.inventorySearch)}" placeholder="Search parts, codes or suppliers"><span class="grow"></span><small class="muted" data-inventory-count>${visible.length} record${visible.length===1?'':'s'}</small></div>
      <div data-inventory-list>
      ${all.map(part=>{const blob=`${part.code} ${part.name} ${part.category} ${getVendor(part.vendorId)?.name||''}`.toLowerCase(),show=!q||blob.includes(q);return `<button class="record-row ${part.id===ui.selectedPart?'active':''}" data-select-part="${part.id}" data-inventory-row data-search="${esc(blob)}" ${show?'':'hidden'}><span><strong>${esc(part.code)} · ${esc(part.name)}</strong><small>${esc(part.category)} · ${partOnHand(part)} ${esc(part.uom)} on hand</small></span>${partOnHand(part)<Number(part.min)?status('Low stock'):status('In stock')}</button>`}).join('')}
      ${!visible.length?'<div class="empty" data-inventory-empty><strong>No matching parts</strong><span>Try another code, description, category or supplier.</span></div>':''}
      </div>
    </section>
    <section class="card" data-inventory-detail>${renderPartDetail(p)}</section>
  </div>`;
}
function renderPartDetail(p){
  if(!p)return '<div class="empty"><strong>No part selected</strong></div>';
  const onHand=partOnHand(p);
  const tx=state.stockTransactions.filter(t=>t.partId===p.id).slice(0,8);
  const usedOn=state.assets.filter(a=>(a.bom||[]).includes(p.id));
  return `<div class="detail-hero"><div class="detail-title"><div class="asset-avatar">◇</div><div><h2>${esc(p.name)}</h2><p>${esc(p.code)} · ${esc(p.category)} · ${esc(p.uom)}</p></div><div class="detail-actions"><button class="button" data-stock-move="${p.id}">Stock movement</button><button class="button primary" data-count-part="${p.id}">Cycle count</button></div></div>
    <div class="stat-strip"><div><small>On hand</small><strong>${onHand} ${esc(p.uom)}</strong></div><div><small>Minimum</small><strong>${p.min} ${esc(p.uom)}</strong></div><div><small>Maximum</small><strong>${p.max} ${esc(p.uom)}</strong></div><div><small>Unit cost</small><strong>${money(p.unitCost)}</strong></div></div></div>
    <div class="detail-body">
      ${onHand<p.min?`<div class="notice" style="margin-bottom:14px"><strong>Below minimum stock.</strong> SafiMaintain keeps this part on the purchase planning board until replenishment is resolved.</div>`:''}
      <div class="fields">
        <div class="field"><small>Primary vendor</small><strong>${esc(getVendor(p.vendorId)?.name||'—')}</strong></div><div class="field"><small>Barcode</small><strong>${esc(p.barcode||'—')}</strong></div><div class="field"><small>Reorder quantity</small><strong>${p.reorderQty} ${esc(p.uom)}</strong></div>
      </div>
      <h3 class="section-title">Stock locations</h3>
      ${table(['Store','Bin','On hand'],p.locations.map(l=>`<tr><td>${esc(getStore(l.storeId)?.name||l.storeId)}</td><td>${esc(l.bin)}</td><td><b>${l.onHand} ${esc(p.uom)}</b></td></tr>`),'No stock locations')}
      <h3 class="section-title">Used on assets</h3><p class="muted" style="font-size:10px">${usedOn.map(a=>`${esc(a.code)} · ${esc(a.name)}`).join('<br>')||'Not currently listed on an asset BOM.'}</p>
      <h3 class="section-title">Recent transactions</h3>
      ${table(['Type','Qty','Location','Reference','Date'],tx.map(t=>`<tr><td>${status(t.type)}</td><td>${t.qty>0?'+':''}${t.qty} ${esc(p.uom)}</td><td>${esc(getStore(t.storeId)?.code||t.storeId)} / ${esc(t.bin||'')}</td><td>${esc(t.reference||'—')}</td><td>${dateTimeFmt(t.at)}</td></tr>`),'No stock transactions')}
    </div>`;
}
function showPartForm(){
  openModal({eyebrow:'Parts & supplies',title:'Add part',body:`<div class="form-grid">
    ${field('code','Part number','',{required:true})}${field('name','Description','',{required:true})}
    ${field('category','Category','Spare')}${field('uom','Unit of measure','ea')}
    ${field('unitCost','Unit cost (GHS)','0',{type:'number',step:'0.01'})}${field('vendorId','Preferred vendor','VEN-1',{type:'select',options:state.vendors.map(v=>({value:v.id,label:v.name}))})}
    ${field('min','Minimum quantity','0',{type:'number',min:0})}${field('max','Maximum quantity','0',{type:'number',min:0})}
    ${field('reorderQty','Reorder quantity','1',{type:'number',min:1})}${field('barcode','Barcode / QR value','')}
    ${field('storeId','Initial store','STORE-MAIN',{type:'select',options:state.stores.map(s=>({value:s.id,label:s.name}))})}${field('bin','Initial bin','Unassigned')}
    ${field('onHand','Opening stock','0',{type:'number',min:0})}
  </div>`,onSubmit:fd=>{
    const v=Object.fromEntries(fd.entries());
    const part={id:uid('PRT'),code:v.code,name:v.name,category:v.category,uom:v.uom,unitCost:Number(v.unitCost),vendorId:v.vendorId,min:Number(v.min),max:Number(v.max),reorderQty:Number(v.reorderQty),barcode:v.barcode,locations:[{storeId:v.storeId,bin:v.bin,onHand:Number(v.onHand)}]};
    state.parts.push(part);addAudit('PART_CREATED',part.id,`${part.code} ${part.name}`);ensurePurchaseRequest(part,'Opening stock');ui.selectedPart=part.id;saveState();closeModal();render();toast('Part created');
  }});
}
