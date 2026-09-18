'use strict';
let state = loadState();
const ui = {route:'dashboard',selectedAsset:'P-201',selectedPart:'PRT-2',assetTab:'details',inventorySearch:'',assetSearch:'',workSearch:'',workStatus:'All statuses'};
let modalSubmit = null;

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw);
    if(!parsed||typeof parsed!=='object') return structuredClone(seed);
    // Preserve field records across compatible frontend releases instead of erasing a technician's device cache.
    parsed.meta=parsed.meta||{};
    parsed.meta.version=APP_VERSION;
    return parsed;
  }catch(err){
    console.warn('Could not load local SafiMaintain data',err);
    return structuredClone(seed);
  }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  updateBadges();
}
function getUser(id){return state.users.find(x=>x.id===id)}
function getRole(id){return state.roles.find(x=>x.id===id)}
function getGroup(id){return state.groups.find(x=>x.id===id)}
function getAsset(id){return state.assets.find(x=>x.id===id)}
function getPart(id){return state.parts.find(x=>x.id===id)}
function getVendor(id){return state.vendors.find(x=>x.id===id)}
function getStore(id){return state.stores.find(x=>x.id===id)}
function getWork(id){return state.workOrders.find(x=>x.id===id)}
function partOnHand(part){return part.locations.reduce((n,l)=>n+Number(l.onHand||0),0)}
function activeWorkForAsset(assetId){return state.workOrders.filter(w=>w.assetIds.includes(assetId)&&!['Completed','Cancelled'].includes(w.status))}
function currentUser(){return getUser(CURRENT_USER)}
function addAudit(action,entity,detail,userId=CURRENT_USER){
  state.audit.unshift({id:uid('AUD'),at:iso(),userId,action,entity,detail});
}
function toast(message){
  const el=document.getElementById('toast');
  el.textContent=message;el.classList.add('show');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600);
}
function statusClass(value){
  const v=String(value||'').toLowerCase();
  if(['online','healthy','active','completed','received','approved','available','posted'].some(x=>v.includes(x))) return 'good';
  if(['offline','critical','cancelled','failed','overdue'].some(x=>v.includes(x))) return 'bad';
  if(['attention','urgent','ordered','in progress','checked out'].some(x=>v.includes(x))) return 'warn';
  if(['open','requested','draft'].some(x=>v.includes(x))) return 'info';
  return 'neutral';
}
function status(value){return `<span class="status ${statusClass(value)}">${esc(value)}</span>`}
function routeTitle(){return ({dashboard:'Overview',calendar:'Maintenance calendar','work-orders':'Work orders',pm:'Scheduled maintenance',requests:'Requests',assets:'Assets',meters:'Meters',downtime:'Downtime',inventory:'Parts & supplies',transactions:'Stock transactions',counts:'Cycle counts',planning:'Purchase planning','purchase-orders':'Purchase orders',vendors:'Vendors','tool-crib':'Tool crib',reliability:'Reliability',people:'People & groups',roles:'Roles & permissions',sites:'Sites & stores',notifications:'Mail & alerts',audit:'Audit trail',security:'Security'})[ui.route]||'SafiMaintain'}

function userIdsForAudience(rule, context={}){
  const ids=new Set();
  for(const audience of rule.audiences||[]){
    if(audience==='Operations manager') state.users.filter(u=>u.active&&getRole(u.roleId)?.name==='Operations manager').forEach(u=>ids.add(u.id));
    if(audience==='Maintenance planner') state.users.filter(u=>u.active&&getRole(u.roleId)?.name==='Maintenance planner').forEach(u=>ids.add(u.id));
    if(audience==='Storekeeper') state.users.filter(u=>u.active&&getRole(u.roleId)?.name==='Storekeeper').forEach(u=>ids.add(u.id));
    if(audience==='Procurement') state.users.filter(u=>u.active&&getRole(u.roleId)?.name==='Procurement').forEach(u=>ids.add(u.id));
    if(audience==='Asset owner'&&context.assetId){
      const a=getAsset(context.assetId); if(a?.ownerUserId) ids.add(a.ownerUserId);
      if(a?.ownerGroupId) state.users.filter(u=>u.active&&u.groupIds.includes(a.ownerGroupId)).forEach(u=>ids.add(u.id));
    }
    if(audience==='Active WO assignees'&&context.assetId) activeWorkForAsset(context.assetId).flatMap(w=>w.assigneeIds).forEach(id=>ids.add(id));
    if(audience==='Assigned users'&&(context.assigneeIds||[]).length) context.assigneeIds.forEach(id=>ids.add(id));
  }
  return [...ids].filter(id=>getUser(id)?.active);
}
function dispatchEvent(event,title,message,context={}){
  const rule=state.notificationRules.find(r=>r.event===event);
  if(!rule) return;
  const recipients=userIdsForAudience(rule,context);
  recipients.forEach(userId=>{
    if(rule.inApp) state.notifications.unshift({id:uid('N'),userId,event,title,message,createdAt:iso(),read:false,relatedId:context.relatedId||context.assetId||context.partId||null});
    const u=getUser(userId);
    if(rule.email&&u?.emailAlerts&&u.email) state.mailOutbox.unshift({id:uid('MAIL'),to:u.email,subject:`[SafiMaintain] ${title}`,body:message,createdAt:iso(),status:'Queued locally'});
  });
}
function ensurePurchaseRequest(part, source='Automatic reorder'){
  const onHand=partOnHand(part);
  if(onHand>=Number(part.min)) return null;
  const existing=state.purchaseRequests.find(r=>r.partId===part.id&&!['Received','Cancelled','Closed'].includes(r.status));
  if(existing) return existing;
  const req={id:uid('PR'),partId:part.id,requestedQty:Number(part.reorderQty||Math.max(1,Number(part.max)-onHand)),status:'Open',source,reason:`On hand ${onHand} ${part.uom}; minimum ${part.min}`,createdAt:iso(),createdBy:'SYSTEM'};
  state.purchaseRequests.unshift(req);
  addAudit('PURCHASE_REQUEST_CREATED',req.id,`${part.code}: ${req.requestedQty} ${part.uom} requested automatically`,'SYSTEM');
  dispatchEvent('Purchase request created',`${req.id} created for ${part.code}`,`${part.name} is below minimum stock. ${req.requestedQty} ${part.uom} has been placed on the purchase planning board.`,{partId:part.id,relatedId:req.id});
  return req;
}
function stockLocation(part,storeId,bin){
  let loc=part.locations.find(l=>l.storeId===storeId&&l.bin===bin);
  if(!loc){loc={storeId,bin,onHand:0};part.locations.push(loc)}
  return loc;
}
function postStock(partId,type,qty,storeId,bin,{reference='',workOrderId=null,note='',toStoreId=null,toBin=null}={}){
  const part=getPart(partId); if(!part) return;
  qty=Number(qty);
  const source=stockLocation(part,storeId,bin);
  if(type==='Receipt'){source.onHand+=Math.abs(qty)}
  else if(type==='Issue'){if(source.onHand<Math.abs(qty)) throw new Error('Not enough stock in the selected location.');source.onHand-=Math.abs(qty)}
  else if(type==='Adjustment'){source.onHand+=qty}
  else if(type==='Transfer'){
    if(source.onHand<Math.abs(qty)) throw new Error('Not enough stock in the selected location.');
    source.onHand-=Math.abs(qty);
    stockLocation(part,toStoreId,toBin).onHand+=Math.abs(qty);
  }
  const tx={id:uid('TX'),partId,type,qty:type==='Issue'?-Math.abs(qty):type==='Receipt'?Math.abs(qty):qty,storeId,bin,toStoreId,toBin,reference,workOrderId,at:iso(),userId:CURRENT_USER,note};
  state.stockTransactions.unshift(tx);
  if(type==='Issue'&&workOrderId){
    const work=getWork(workOrderId);
    if(work){
      let line=work.parts.find(x=>x.partId===partId);
      if(!line){line={partId,planned:0,actual:0};work.parts.push(line)}
      line.actual=Number(line.actual||0)+Math.abs(qty);
      work.history.unshift({at:iso(),text:`${Math.abs(qty)} ${part.uom} ${part.code} issued from stock`});
    }
  }
  addAudit('STOCK_TRANSACTION',tx.id,`${type} ${part.code}: ${tx.qty} ${part.uom}${workOrderId?` against ${workOrderId}`:''}`);
  if(type!=='Transfer'&&partOnHand(part)<Number(part.min)){
    dispatchEvent('Stock below minimum',`Low stock: ${part.name}`,`${part.code} has ${partOnHand(part)} ${part.uom} on hand; minimum is ${part.min}.`,{partId:part.id,relatedId:part.id});
    ensurePurchaseRequest(part,type==='Issue'?'Work order consumption':'Inventory movement');
  }
  return tx;
}
function changeAssetState(assetId,nextState,reason,reasonCode,createWork){
  const asset=getAsset(assetId); if(!asset||asset.operatingState===nextState) return;
  const previous=asset.operatingState;
  asset.operatingState=nextState;
  const event={id:uid('AE'),assetId,type:'State change',at:iso(),userId:CURRENT_USER,detail:`${previous} → ${nextState} — ${reasonCode}: ${reason}`};
  state.assetEvents.unshift(event);
  if(nextState==='Offline'){
    asset.offlineSince=iso();asset.downtimeReason=reason;
    const dt={id:uid('DT'),assetId,startedAt:asset.offlineSince,endedAt:null,reasonCode,reason,workOrderId:null,reportedBy:CURRENT_USER};
    state.downtime.unshift(dt);
    if(createWork){
      const wo={id:uid('WO'),title:`Restore ${asset.name} to service`,assetIds:[assetId],type:'Corrective',priority:asset.criticality==='A'?'Critical':'High',status:'Open',assigneeIds:asset.ownerUserId?[asset.ownerUserId]:[],due:day(1),estimateHours:2,actualHours:0,source:'Asset downtime',instructions:`Investigate and correct downtime cause: ${reasonCode} — ${reason}`,tasks:[{id:uid('T'),text:'Diagnose downtime cause',type:'Inspection',status:'Todo'},{id:uid('T'),text:'Complete corrective work and functional test',type:'General',status:'Todo'}],parts:[],createdAt:iso(),completedAt:null,history:[{at:iso(),text:`Created automatically from downtime event ${dt.id}`}]};
      state.workOrders.unshift(wo);dt.workOrderId=wo.id;
      dispatchEvent('Work order assigned',`${wo.id} assigned`,`${wo.title} has been assigned from the asset downtime event.`,{assigneeIds:wo.assigneeIds,relatedId:wo.id});
    }
    dispatchEvent('Asset taken offline',`${asset.code} is Offline`,`${asset.name} was taken offline. ${reasonCode}: ${reason}`,{assetId,relatedId:assetId});
  }else{
    delete asset.offlineSince;delete asset.downtimeReason;
    const open=state.downtime.find(d=>d.assetId===assetId&&!d.endedAt);if(open) open.endedAt=iso();
    dispatchEvent('Asset returned online',`${asset.code} is Online`,`${asset.name} returned to service. Reason recorded: ${reason}`,{assetId,relatedId:assetId});
  }
  addAudit('ASSET_STATE_CHANGE',assetId,`${previous} → ${nextState}; ${reasonCode}: ${reason}`);
  saveState();
}
function openModal({title,eyebrow='SafiMaintain',body,submitText='Save',danger=false,onSubmit}){
  const dialog=document.getElementById('modal'),form=document.getElementById('modalForm');
  modalSubmit=onSubmit||null;
  form.innerHTML=`<div class="modal-head"><div><p>${esc(eyebrow)}</p><h2>${esc(title)}</h2></div><button class="modal-close" type="button" data-modal-close>×</button></div><div class="modal-body">${body}</div><div class="modal-actions"><button class="button" type="button" data-modal-close>Cancel</button>${onSubmit?`<button class="button ${danger?'danger':'primary'}" type="submit">${esc(submitText)}</button>`:''}</div>`;
  dialog.showModal();
}
function closeModal(){stopScanner();const d=document.getElementById('modal');if(d.open)d.close();modalSubmit=null}
function field(name,label,value='',opts={}){
  if(opts.type==='select'){
    return `<label class="${opts.span?'span-2':''}">${esc(label)}<select name="${esc(name)}" ${opts.required?'required':''}>${opts.options.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`).join('')}</select></label>`;
  }
  if(opts.type==='textarea') return `<label class="${opts.span?'span-2':''}">${esc(label)}<textarea name="${esc(name)}" ${opts.required?'required':''}>${esc(value)}</textarea></label>`;
  return `<label class="${opts.span?'span-2':''}">${esc(label)}<input name="${esc(name)}" type="${opts.type||'text'}" value="${esc(value)}" ${opts.required?'required':''} ${opts.min!==undefined?`min="${opts.min}"`:''} ${opts.step?`step="${opts.step}"`:''}></label>`;
}
function pageHead(eyebrow,title,sub,actions=''){
  return `<div class="page-head"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p></div><div class="head-actions">${actions}</div></div>`;
}
function metric(label,value,hint,tone=''){
  return `<div class="card metric"><div class="metric-top"><span class="label">${esc(label)}</span><span class="dot ${tone}"></span></div><div class="value">${esc(value)}</div><div class="hint">${esc(hint)}</div></div>`;
}
function table(headers,rows,empty='No records'){
  if(!rows.length) return `<div class="empty"><strong>${esc(empty)}</strong><span>Nothing to show for the current filters.</span></div>`;
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function flattenAssets(parentId=null,depth=0,out=[]){
  state.assets.filter(a=>a.parentId===parentId).sort((a,b)=>a.name.localeCompare(b.name)).forEach(a=>{out.push({asset:a,depth});flattenAssets(a.id,depth+1,out)});
  return out;
}
function assetIcon(a){return a.type==='Site'?'⌂':a.type==='Facility'?'▥':['Department','Room','Area','Production area'].includes(a.type)?'▦':a.type==='Tool'?'⚙':'▣'}
function durationHours(start,end=iso()){
  if(!start) return 0;return Math.max(0,(new Date(end)-new Date(start))/3600000);
}
