'use strict';
function showNewWork(){
  const assetOptions=state.assets.filter(a=>!['Site'].includes(a.type)).map(a=>({value:a.id,label:`${a.code} · ${a.name}`}));
  const userOptions=state.users.filter(u=>u.active).map(u=>({value:u.id,label:`${u.name} · ${getRole(u.roleId)?.name||''}`}));
  openModal({eyebrow:'Work management',title:'Create work order',body:`<div class="form-grid">
    ${field('title','Work summary','',{required:true,span:true})}
    ${field('assetId','Asset',assetOptions[0]?.value||'',{type:'select',options:assetOptions})}
    ${field('type','Maintenance type','Corrective',{type:'select',options:['Corrective','Preventive','Inspection','Project'].map(x=>({value:x,label:x}))})}
    ${field('priority','Priority','Medium',{type:'select',options:['Low','Medium','High','Critical'].map(x=>({value:x,label:x}))})}
    ${field('assigneeId','Assigned to',userOptions[0]?.value||'',{type:'select',options:[{value:'',label:'Unassigned'},...userOptions]})}
    ${field('due','Due date',day(2),{type:'date',required:true})}
    ${field('estimateHours','Estimated hours','1',{type:'number',min:0,step:'0.25'})}
    ${field('instructions','Instructions','',{type:'textarea',span:true})}
  </div>`,submitText:'Create work order',onSubmit:fd=>{
    const assignee=String(fd.get('assigneeId')||'');
    const w={id:uid('WO'),title:String(fd.get('title')),assetIds:[String(fd.get('assetId'))],type:String(fd.get('type')),priority:String(fd.get('priority')),status:'Open',assigneeIds:assignee?[assignee]:[],due:String(fd.get('due')),estimateHours:Number(fd.get('estimateHours')||0),actualHours:0,source:'Manual',instructions:String(fd.get('instructions')||''),tasks:[],parts:[],createdAt:iso(),completedAt:null,history:[{at:iso(),text:`Created by ${currentUser().name}`}]};
    state.workOrders.unshift(w);addAudit('WORK_ORDER_CREATED',w.id,w.title);
    dispatchEvent('Work order assigned',`${w.id} assigned`,w.title,{assigneeIds:w.assigneeIds,relatedId:w.id});
    saveState();closeModal();ui.route='work-orders';render();toast(`${w.id} created`);
  }});
}
function showNewRequest(){
  const assetOptions=state.assets.filter(a=>a.type!=='Site').map(a=>({value:a.id,label:`${a.code} · ${a.name}`}));
  openModal({eyebrow:'Maintenance request',title:'Submit request',body:`<div class="form-grid">
    ${field('assetId','Asset',assetOptions[0]?.value||'',{type:'select',options:assetOptions})}
    ${field('urgency','Urgency','Normal',{type:'select',options:['Normal','Urgent'].map(x=>({value:x,label:x}))})}
    ${field('requester','Requested by','Operations',{required:true})}
    ${field('summary','Issue summary','',{type:'textarea',required:true,span:true})}
  </div>`,submitText:'Submit request',onSubmit:fd=>{
    const r={id:uid('REQ'),assetId:String(fd.get('assetId')),summary:String(fd.get('summary')),urgency:String(fd.get('urgency')),requester:String(fd.get('requester')),createdAt:iso(),status:'Requested'};
    state.requests.unshift(r);addAudit('REQUEST_CREATED',r.id,r.summary);saveState();closeModal();render();toast(`${r.id} submitted`);
  }});
}
function showNewVendor(){
  openModal({eyebrow:'Supplier master',title:'Add vendor',body:`<div class="form-grid">
    ${field('name','Vendor name','',{required:true})}${field('contact','Contact person','')}
    ${field('phone','Phone','')}${field('email','Email','',{type:'email'})}
  </div>`,onSubmit:fd=>{
    const v={id:uid('VEN'),name:String(fd.get('name')),contact:String(fd.get('contact')||''),phone:String(fd.get('phone')||''),email:String(fd.get('email')||''),status:'Active'};
    state.vendors.push(v);addAudit('VENDOR_CREATED',v.id,v.name);saveState();closeModal();render();toast('Vendor created');
  }});
}
function showNewUser(){
  openModal({eyebrow:'People & access',title:'Add person',body:`<div class="form-grid">
    ${field('name','Full name','',{required:true})}${field('email','Email','',{type:'email',required:true})}
    ${field('roleId','Role','ROLE-TECH',{type:'select',options:state.roles.map(r=>({value:r.id,label:r.name}))})}
    ${field('groupId','Primary group','GRP-MAINT',{type:'select',options:state.groups.map(g=>({value:g.id,label:g.name}))})}
    <label class="check-row"><input type="checkbox" name="emailAlerts" checked> Receive email copies</label>
    <label class="check-row"><input type="checkbox" name="mfa"> MFA enrolled</label>
  </div>`,onSubmit:fd=>{
    const u={id:uid('U'),name:String(fd.get('name')),email:String(fd.get('email')),roleId:String(fd.get('roleId')),groupIds:[String(fd.get('groupId'))],active:true,mfa:fd.get('mfa')==='on',emailAlerts:fd.get('emailAlerts')==='on',certifications:[],lastActive:null};
    state.users.push(u);addAudit('USER_CREATED',u.id,`${u.name} · ${getRole(u.roleId)?.name}`);saveState();closeModal();render();toast('Person added');
  }});
}

function showNewPM(){
  const assets=state.assets.filter(a=>['Equipment','Subassembly','Facility','Production area'].includes(a.type));
  openModal({eyebrow:'Scheduled maintenance',title:'Create maintenance plan',body:`<div class="form-grid">
    ${field('name','Plan name','',{required:true,span:true})}
    ${field('assetId','Asset',assets[0]?.id||'',{type:'select',options:assets.map(a=>({value:a.id,label:`${a.code} · ${a.name}`}))})}
    ${field('triggerType','Trigger type','Time',{type:'select',options:['Time','Meter','Event'].map(x=>({value:x,label:x}))})}
    ${field('trigger','Trigger description','Every 30 days',{required:true})}
    ${field('nextDue','Next due',day(30),{type:'date'})}
    ${field('tasks','Tasks (one per line)','Inspect equipment\nClean and lubricate\nFunctional test',{type:'textarea',span:true})}
  </div>`,submitText:'Create plan',onSubmit:fd=>{
    const pm={id:uid('PM'),name:String(fd.get('name')),assetId:String(fd.get('assetId')),status:'Active',triggerType:String(fd.get('triggerType')),trigger:String(fd.get('trigger')),nextDue:String(fd.get('nextDue')||day(30)),lastGenerated:null,taskTemplate:String(fd.get('tasks')||'').split('\n').map(x=>x.trim()).filter(Boolean),requiredParts:[]};
    state.scheduledMaintenance.unshift(pm);addAudit('PM_PLAN_CREATED',pm.id,pm.name);saveState();closeModal();render();toast(`${pm.id} created`);
  }});
}
function showManualPO(){
  openModal({eyebrow:'Purchasing',title:'Create purchase order',body:`<div class="form-grid">
    ${field('vendorId','Vendor','VEN-1',{type:'select',options:state.vendors.map(v=>({value:v.id,label:v.name}))})}
    ${field('partId','Part','PRT-1',{type:'select',options:state.parts.map(p=>({value:p.id,label:`${p.code} · ${p.name}`}))})}
    ${field('qty','Quantity','1',{type:'number',required:true,min:1,step:'1'})}
    ${field('expectedDate','Expected date',day(7),{type:'date',required:true})}
  </div>`,submitText:'Create PO',onSubmit:fd=>{
    const p=getPart(String(fd.get('partId'))),qty=Number(fd.get('qty'));
    const po={id:uid('PO'),vendorId:String(fd.get('vendorId')),status:'Ordered',createdAt:iso(),expectedDate:String(fd.get('expectedDate')),lines:[{partId:p.id,qty,unitCost:p.unitCost}],sourceRequestIds:[]};
    state.purchaseOrders.unshift(po);addAudit('PURCHASE_ORDER_CREATED',po.id,`Manual PO for ${p.code} × ${qty}`);saveState();closeModal();render();toast(`${po.id} created`);
  }});
}
let scanStream=null, scanTimer=null;
function stopScanner(){
  if(scanTimer){clearTimeout(scanTimer);scanTimer=null}
  if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}
}
function resolveCode(code){
  const q=String(code||'').trim().toLowerCase();
  const a=state.assets.find(x=>x.code.toLowerCase()===q||x.id.toLowerCase()===q);
  const p=state.parts.find(x=>x.code.toLowerCase()===q||String(x.barcode||'').toLowerCase()===q);
  if(a){ui.selectedAsset=a.id;go('assets');return true}
  if(p){ui.selectedPart=p.id;go('inventory');return true}
  return false;
}
async function showScanner(){
  if(!('BarcodeDetector' in window)||!navigator.mediaDevices?.getUserMedia){
    const code=prompt('Camera scanning is not supported in this browser. Enter an asset or part code instead.');
    if(code&&!resolveCode(code))toast('No matching asset or part');
    return;
  }
  openModal({eyebrow:'QR & barcode lookup',title:'Scan asset or part',body:`<video id="scanVideo" autoplay playsinline style="width:100%;max-height:380px;background:#101820;border-radius:10px"></video><div class="notice info" style="margin-top:12px">Point the camera at a QR code or barcode linked to an asset or part. Manual fallback: <button class="button link" type="button" data-action="manual-scan">enter code</button>.</div>`});
  try{
    scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
    const video=document.getElementById('scanVideo');if(!video)return;video.srcObject=scanStream;await video.play();
    const detector=new BarcodeDetector({formats:['qr_code','code_128','code_39','ean_13','ean_8']});
    const tick=async()=>{
      if(!scanStream||!document.getElementById('scanVideo'))return;
      try{
        const codes=await detector.detect(video);
        if(codes.length){
          const value=codes[0].rawValue;stopScanner();closeModal();
          if(!resolveCode(value))toast(`Scanned ${value}, but no matching record was found`);
          return;
        }
      }catch(_){}
      scanTimer=setTimeout(tick,350);
    };
    tick();
  }catch(err){stopScanner();closeModal();toast('Camera access was not available')}
}

function showGlobalStockMove(){
  openModal({eyebrow:'Inventory',title:'Choose part for movement',body:`<div class="form-grid">${field('partId','Part','PRT-1',{type:'select',options:state.parts.map(p=>({value:p.id,label:`${p.code} · ${p.name}`}))})}</div>`,submitText:'Continue',onSubmit:fd=>{const id=String(fd.get('partId'));closeModal();setTimeout(()=>showStockMove(id),50)}});
}
function showSearch(){
  const d=document.getElementById('searchModal'),f=document.getElementById('searchForm');
  f.innerHTML=`<input class="search-input" name="q" autocomplete="off" placeholder="Search assets, work orders, parts…" autofocus><div class="search-results" id="searchResults"><div class="empty"><strong>Start typing</strong><span>Search across operational records.</span></div></div>`;
  d.showModal();
  setTimeout(()=>f.elements.q?.focus(),50);
}
function updateSearch(q){
  const box=document.getElementById('searchResults');if(!box)return;
  q=String(q||'').trim().toLowerCase();
  if(q.length<2){box.innerHTML='<div class="empty"><strong>Start typing</strong><span>Enter at least two characters.</span></div>';return}
  const results=[];
  state.assets.filter(a=>`${a.code} ${a.name} ${a.location}`.toLowerCase().includes(q)).slice(0,8).forEach(a=>results.push({kind:'Asset',title:`${a.code} · ${a.name}`,sub:a.location,action:`data-search-asset="${a.id}"`}));
  state.workOrders.filter(w=>`${w.id} ${w.title}`.toLowerCase().includes(q)).slice(0,8).forEach(w=>results.push({kind:'Work order',title:`${w.id} · ${w.title}`,sub:w.status,action:`data-search-work="${w.id}"`}));
  state.parts.filter(p=>`${p.code} ${p.name}`.toLowerCase().includes(q)).slice(0,8).forEach(p=>results.push({kind:'Part',title:`${p.code} · ${p.name}`,sub:`${partOnHand(p)} ${p.uom} on hand`,action:`data-search-part="${p.id}"`}));
  box.innerHTML=results.length?results.slice(0,18).map(r=>`<button class="search-result" type="button" ${r.action}><span><strong>${esc(r.title)}</strong><small>${esc(r.kind)} · ${esc(r.sub)}</small></span><span>›</span></button>`).join(''):'<div class="empty"><strong>No matches</strong><span>Try another asset code, work number or part.</span></div>';
}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`safimaint-export-${day(0)}.json`;a.click();URL.revokeObjectURL(url);
  addAudit('DATA_EXPORTED','LOCAL','Full local JSON export');saveState();toast('Export created');
}
function updateBadges(){
  const set=(id,value,danger=false)=>{const el=document.getElementById(id);if(!el)return;el.textContent=value||'';el.classList.toggle('show',Number(value)>0);el.classList.toggle('danger',danger&&Number(value)>0)};
  set('workBadge',state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status)).length);
  set('requestBadge',state.requests.filter(r=>r.status==='Requested').length);
  set('offlineBadge',state.assets.filter(a=>a.operatingState==='Offline').length,true);
  set('stockBadge',state.parts.filter(p=>partOnHand(p)<p.min).length,true);
  set('purchaseBadge',state.purchaseRequests.filter(r=>!['Received','Closed','Cancelled'].includes(r.status)).length);
  const unread=state.notifications.filter(n=>n.userId===CURRENT_USER&&!n.read).length;
  set('alertBadge',unread,true);set('topNoticeBadge',unread,true);
}
function render(){
  document.title=`${routeTitle()} · SafiMaintain`;
  document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===ui.route));
  const map={
    dashboard:renderDashboard,calendar:renderCalendar,'work-orders':renderWorkOrders,pm:renderPM,requests:renderRequests,
    assets:renderAssets,meters:renderMeters,downtime:renderDowntime,inventory:renderInventory,transactions:renderTransactions,
    counts:renderCounts,planning:renderPlanning,'purchase-orders':renderPOs,vendors:renderVendors,'tool-crib':renderToolCrib,
    reliability:renderReliability,people:renderPeople,roles:renderRoles,sites:renderSites,notifications:renderNotifications,
    audit:renderAudit,security:renderSecurity
  };
  const view=document.getElementById('appView');view.innerHTML=(map[ui.route]||renderDashboard)();view.focus({preventScroll:true});updateBadges();
}
function go(route){ui.route=route;render();document.getElementById('sidebar').classList.remove('open');document.getElementById('scrim').classList.remove('show')}
