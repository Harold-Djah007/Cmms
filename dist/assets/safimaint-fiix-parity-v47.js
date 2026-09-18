'use strict';

// SafiMaintain Fiix parity workflows v47.
(function(){
  const selectedWork=new Set();
  ui.v47WorkFilter=ui.v47WorkFilter||'all';
  ui.v47WorkType=ui.v47WorkType||'all';
  ui.v47WorkPriority=ui.v47WorkPriority||'all';
  ui.v47WorkAsset=ui.v47WorkAsset||'all';

  function ensureV47(){
    let changed=false;
    if(!Array.isArray(state.businesses)){
      state.businesses=(state.vendors||[]).map(v=>({id:'BUS-'+v.id,name:v.name,type:'Vendor',group:'Supplier',contact:v.contact||'',phone:v.phone||'',email:v.email||'',sourceVendorId:v.id,status:v.status||'Active'}));
      changed=true;
    }
    if(!Array.isArray(state.assetCustomFieldDefinitions)){state.assetCustomFieldDefinitions=[];changed=true}
    if(!Array.isArray(state.workSavedFilters)){
      state.workSavedFilters=[
        {id:'all',name:'All work',builtin:true},
        {id:'active',name:'Active work',builtin:true,control:'ACTIVE'},
        {id:'pending',name:'Pending work',builtin:true,control:'PENDING'},
        {id:'overdue',name:'Overdue',builtin:true,overdue:true},
        {id:'mine',name:'My work',builtin:true,mine:true}
      ];changed=true;
    }
    (state.assets||[]).forEach(a=>{if(!Array.isArray(a.businessLinks)){a.businessLinks=[];changed=true}if(!a.customFields){a.customFields={};changed=true}});
    if(changed)saveState();
  }
  ensureV47();

  function ctl(w){return typeof window.safiWorkStatusControl==='function'?window.safiWorkStatusControl(w):(['Completed','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE')}
  function assetLabel(w){return (w.assetIds||[]).map(id=>getAsset(id)?.name||id).join(', ')||'No asset'}
  function assigneeLabel(w){return (w.assigneeIds||[]).map(id=>getUser(id)?.name).filter(Boolean).join(', ')||'Unassigned'}
  function taskPct(w){const all=w.tasks||[],done=all.filter(t=>t.status==='Done').length;return {done,total:all.length,pct:all.length?Math.round(done/all.length*100):0}}
  function wCost(w){
    const labor=(w.labor||[]).reduce((n,x)=>n+Number(x.hours||0)*Number(getUser(x.userId)?.hourlyRate||0),0);
    const parts=(w.parts||[]).reduce((n,x)=>n+Number(x.actual||0)*Number(getPart(x.partId)?.unitCost||0),0);
    const misc=(w.miscCosts||[]).reduce((n,x)=>n+Number(x.amount||0),0);
    return labor+parts+misc;
  }
  function linkedBusinessesForWork(w){
    const ids=new Set((w.assetIds||[]).flatMap(aid=>(getAsset(aid)?.businessLinks||[]).map(l=>l.businessId)));
    return [...ids].map(id=>state.businesses.find(b=>b.id===id)).filter(Boolean);
  }
  function filteredWork(){
    const q=String(ui.workSearch||'').trim().toLowerCase();
    const saved=state.workSavedFilters.find(f=>f.id===ui.v47WorkFilter)||state.workSavedFilters[0];
    return state.workOrders.filter(w=>{
      if(q&&!([w.id,w.title,w.status,w.priority,w.type,assetLabel(w),assigneeLabel(w)].join(' ').toLowerCase().includes(q)))return false;
      if(saved?.control&&ctl(w)!==saved.control)return false;
      if(saved?.overdue&&!(ctl(w)==='ACTIVE'&&w.due&&new Date(w.due)<new Date(new Date().toDateString())))return false;
      if(saved?.mine&&!(w.assigneeIds||[]).includes(CURRENT_USER))return false;
      if(saved?.status&&w.status!==saved.status)return false;
      if(saved?.type&&w.type!==saved.type)return false;
      if(saved?.priority&&w.priority!==saved.priority)return false;
      if(saved?.assetId&&!(w.assetIds||[]).includes(saved.assetId))return false;
      if(ui.v47WorkType!=='all'&&w.type!==ui.v47WorkType)return false;
      if(ui.v47WorkPriority!=='all'&&w.priority!==ui.v47WorkPriority)return false;
      if(ui.v47WorkAsset!=='all'&&!(w.assetIds||[]).includes(ui.v47WorkAsset))return false;
      return true;
    });
  }
  function renderWorkV47(){
    ensureV47();const rows=filteredWork(),active=state.workOrders.filter(w=>ctl(w)==='ACTIVE').length,closed=state.workOrders.filter(w=>ctl(w)==='CLOSED').length;
    return pageHead('Work management','Work orders','Filter, bulk-manage, import, export, print and execute maintenance work from one register.',
      '<button class="button primary" data-action="new-work">＋ New work order</button>')+
      '<div class="v47-toolbar"><button class="button primary" data-action="new-work">＋ New</button><button class="button" data-v47-import-work>⇧ Import</button><button class="button" data-v47-export-work>⇩ Export</button><button class="button" data-v47-print-work>▧ Print</button><button class="button danger" data-v47-delete-work '+(selectedWork.size?'':'disabled')+'>Delete'+(selectedWork.size?' ('+selectedWork.size+')':'')+'</button><button class="button" data-v47-save-filter>Save filter</button><span class="grow"></span><span class="v47-count">'+rows.length+' shown · '+active+' active · '+closed+' closed</span></div>'+
      '<div class="v47-filterbar"><input data-filter="work" value="'+esc(ui.workSearch||'')+'" placeholder="Search code, description, asset, assignee…"><select data-v47-saved-filter>'+state.workSavedFilters.map(f=>'<option value="'+esc(f.id)+'" '+(f.id===ui.v47WorkFilter?'selected':'')+'>'+esc(f.name)+'</option>').join('')+'</select><select data-v47-work-type><option value="all">All types</option>'+[...new Set(state.workOrders.map(w=>w.type))].filter(Boolean).sort().map(x=>'<option '+(ui.v47WorkType===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select><select data-v47-work-priority><option value="all">All priorities</option>'+['Low','Medium','High','Critical'].map(x=>'<option '+(ui.v47WorkPriority===x?'selected':'')+'>'+x+'</option>').join('')+'</select><select data-v47-work-asset><option value="all">All assets</option>'+state.assets.filter(a=>a.type!=='Site').map(a=>'<option value="'+esc(a.id)+'" '+(ui.v47WorkAsset===a.id?'selected':'')+'>'+esc(a.code)+' · '+esc(a.name)+'</option>').join('')+'</select></div>'+
      '<section class="card"><div class="table-wrap"><div class="v47-wo-head"><div><input class="v47-select" type="checkbox" data-v47-select-all '+(rows.length&&rows.every(w=>selectedWork.has(String(w.id)))?'checked':'')+'></div><div>Code / description</div><div>Asset</div><div>Assigned</div><div>Priority</div><div>Type</div><div>Status</div><div>Business</div><div>Cost / due</div></div>'+
      rows.map(w=>{const p=taskPct(w),biz=linkedBusinessesForWork(w);return '<div class="v47-wo-row '+(selectedWork.has(String(w.id))?'selected':'')+'" data-open-work="'+esc(w.id)+'"><span><input class="v47-select" type="checkbox" data-v47-select-work="'+esc(w.id)+'" '+(selectedWork.has(String(w.id))?'checked':'')+'></span><span><strong>'+esc(w.id)+' · '+esc(w.title)+'</strong><small>'+p.done+'/'+p.total+' tasks · '+p.pct+'% complete</small></span><span><strong>'+esc(assetLabel(w))+'</strong><small>'+(w.assetIds||[]).map(id=>esc(getAsset(id)?.code||id)).join(', ')+'</small></span><span><strong>'+esc(assigneeLabel(w))+'</strong><small>'+Number(w.actualHours||0).toFixed(2)+' h actual</small></span><span>'+status(w.priority)+'</span><span><strong>'+esc(w.type)+'</strong></span><span>'+status(w.status)+'<small>'+ctl(w)+'</small></span><span><strong>'+esc(biz.map(b=>b.name).join(', ')||'—')+'</strong><small>'+esc(biz.map(b=>b.type).join(', '))+'</small></span><span><strong>'+money(wCost(w))+'</strong><small>'+dateFmt(w.due)+'</small></span></div>'}).join('')+
      (!rows.length?'<div class="empty"><strong>No matching work orders</strong><span>Change the saved filter, type, priority, asset or search text.</span></div>':'')+'</div></section><input hidden type="file" accept=".csv,text/csv" id="v47WorkCsv">';
  }
  renderWorkOrders=renderWorkV47;window.renderWorkOrders=renderWorkV47;

  function csvEscape(v){v=String(v??'');return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
  function download(name,text,type='text/csv'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
  function exportWork(){
    const rows=filteredWork(),head=['Code','Description','Priority','Asset Code','Type','Assigned To','Status','Due','Estimated Hours','Actual Hours','Source'];
    const body=rows.map(w=>[w.id,w.title,w.priority,getAsset(w.assetIds?.[0])?.code||'',w.type,assigneeLabel(w),w.status,w.due,w.estimateHours||0,w.actualHours||0,w.source||''].map(csvEscape).join(','));
    download('safimaint-work-orders-'+day(0)+'.csv',[head.join(','),...body].join('\n'));addAudit('WORK_ORDERS_EXPORTED','WORK',rows.length+' rows');saveState();toast(rows.length+' work orders exported');
  }
  function parseCsvLine(line){const out=[];let cur='',quote=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quote&&line[i+1]==='"'){cur+='"';i++}else quote=!quote}else if(ch===','&&!quote){out.push(cur.trim());cur=''}else cur+=ch}out.push(cur.trim());return out}
  function importWork(file){
    const rd=new FileReader();rd.onload=()=>{const lines=String(rd.result||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);if(lines.length<2){toast('CSV needs a header and at least one row');return}
      const headers=parseCsvLine(lines[0]).map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,'')),at=(row,names)=>{for(const n of names){const i=headers.indexOf(n);if(i>=0)return row[i]||''}return''};let count=0;
      lines.slice(1).map(parseCsvLine).forEach(row=>{const title=at(row,['description','title','workdescription']);if(!title)return;const code=at(row,['code','workorder','workordercode'])||uid('WO');if(state.workOrders.some(w=>String(w.id).toLowerCase()===code.toLowerCase()))return;const ac=at(row,['assetcode','asset']);const asset=state.assets.find(a=>String(a.code).toLowerCase()===String(ac).toLowerCase());const assignee=at(row,['assignedto','assignee']);const user=state.users.find(u=>[u.name,u.email].some(v=>String(v||'').toLowerCase()===String(assignee).toLowerCase()));
        state.workOrders.unshift({id:code,title,assetIds:asset?[asset.id]:[],type:at(row,['type','maintenancetype'])||'Corrective',priority:at(row,['priority'])||'Medium',status:at(row,['status'])||'Open',assigneeIds:user?[user.id]:[],assigneeGroupId:null,due:at(row,['due','duedate'])||day(2),estimateHours:Number(at(row,['estimatedhours','estimatehours'])||0),actualHours:Number(at(row,['actualhours'])||0),source:at(row,['source'])||'CSV import',instructions:at(row,['instructions','notes'])||'',tasks:[],parts:[],labor:[],miscCosts:[],failureCodes:{problem:'Not selected',cause:'Not selected',action:'Not selected'},failureNote:'',completionNote:'',createdAt:iso(),completedAt:null,closedAt:null,closedBy:null,history:[{at:iso(),text:'Imported from CSV'}]});count++});
      addAudit('WORK_ORDERS_IMPORTED','WORK',count+' rows');saveState();render();toast(count+' work order'+(count===1?'':'s')+' imported')};rd.readAsText(file);
  }
  function deleteSelectedWork(){
    if(!selectedWork.size)return;if(!confirm('Permanently delete '+selectedWork.size+' selected work order'+(selectedWork.size===1?'':'s')+'? This removes the records from this device.'))return;
    const ids=new Set(selectedWork);state.workOrders=state.workOrders.filter(w=>!ids.has(String(w.id)));state.downtime.forEach(d=>{if(d.workOrderId&&ids.has(String(d.workOrderId)))d.workOrderId=null});state.scheduledMaintenance.forEach(pm=>{if(pm.awaitingCompletionWorkOrderId&&ids.has(String(pm.awaitingCompletionWorkOrderId)))pm.awaitingCompletionWorkOrderId=null});ids.forEach(id=>addAudit('WORK_ORDER_DELETED',id,'Deleted from work-order register'));selectedWork.clear();saveState();render();toast('Selected work orders deleted');
  }
  function saveFilter(){
    openModal({eyebrow:'Work-order filters',title:'Save current filter',submitText:'Save filter',body:'<div class="form-grid">'+field('name','Filter name','',{required:true,span:true})+'</div>',onSubmit:fd=>{const f={id:uid('WF'),name:String(fd.get('name')),type:ui.v47WorkType!=='all'?ui.v47WorkType:null,priority:ui.v47WorkPriority!=='all'?ui.v47WorkPriority:null,assetId:ui.v47WorkAsset!=='all'?ui.v47WorkAsset:null};state.workSavedFilters.push(f);ui.v47WorkFilter=f.id;addAudit('WORK_FILTER_CREATED',f.id,f.name);saveState();closeModal();render();toast('Filter saved')}});
  }

  function bizById(id){return state.businesses.find(b=>b.id===id)}
  function businessTab(a){
    const links=(a.businessLinks||[]).map(l=>({l,b:bizById(l.businessId)})).filter(x=>x.b);
    return '<section class="v45-section"><div class="v45-section-head"><strong>Businesses</strong><div class="v45-section-actions"><span>Vendors, customers, service providers and contractors</span><button class="button small" data-v47-new-business>＋ New business</button><button class="button small primary" data-v47-link-business="'+esc(a.id)+'">＋ Link business</button></div></div>'+
      (links.length?'<div class="v47-business-list"><table class="v47-business-table"><thead><tr><th>Business</th><th>Business group / type</th><th>Business asset number</th><th>Primary</th><th>Contact</th><th></th></tr></thead><tbody>'+links.map(({l,b})=>'<tr><td><strong>'+esc(b.name)+'</strong><small>'+esc(b.status||'Active')+'</small></td><td>'+esc(b.group||b.type||'Business')+'<small>'+esc(b.type||'')+'</small></td><td>'+esc(l.businessAssetNumber||'—')+'</td><td>'+(l.primary?'<span class="v47-primary">Primary</span>':'—')+'</td><td>'+esc(b.contact||'—')+'<small>'+esc(b.email||b.phone||'')+'</small></td><td><button class="button small danger" data-v47-unlink-business="'+esc(a.id)+'|'+esc(b.id)+'">Remove</button></td></tr>').join('')+'</tbody></table></div>':'<div class="v45-empty"><strong>No businesses linked</strong><span>Associate the vendor, customer, service provider, contractor or manufacturer responsible for this asset.</span></div>')+
      '</section>';
  }
  function customTab(a){
    const defs=state.assetCustomFieldDefinitions;
    return '<section class="v45-section"><div class="v45-section-head"><strong>Custom asset fields</strong><div class="v45-section-actions"><span>Site-specific asset information</span><button class="button small" data-v47-new-custom>＋ New field</button><button class="button small primary" data-v47-edit-custom="'+esc(a.id)+'">Edit values</button></div></div>'+
      (defs.length?'<div class="v47-custom-grid">'+defs.map(d=>'<div><small>'+esc(d.name)+'</small><strong>'+esc(a.customFields?.[d.id]??'—')+'</strong></div>').join('')+'</div>':'<div class="v45-empty"><strong>No custom fields configured</strong><span>Add company-specific fields such as permit number, production line, inspection class or SAP code.</span></div>')+
      '</section>';
  }
  function patchAssetRecord(){
    if(ui.route!=='assets'||ui.assetView!=='record')return;const a=getAsset(ui.selectedAsset),tabs=document.querySelector('.v45-tabs'),body=document.querySelector('.v45-body');if(!a||!tabs||!body)return;
    if(!tabs.querySelector('[data-v47-tab="businesses"]')){
      const files=tabs.querySelector('[data-v45-tab="files"]');
      const biz=document.createElement('button');biz.type='button';biz.dataset.v47Tab='businesses';biz.textContent='Businesses';
      const custom=document.createElement('button');custom.type='button';custom.dataset.v47Tab='custom';custom.textContent='Custom';
      files?.before(biz,custom);
    }
    tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',(b.dataset.v47Tab||b.dataset.v45Tab)===ui.assetRecordTab));
    if(ui.assetRecordTab==='businesses')body.innerHTML=businessTab(a);
    if(ui.assetRecordTab==='custom')body.innerHTML=customTab(a);
  }

  const previousRender=render;
  render=function(){previousRender();patchAssetRecord()};
  window.render=render;

  function renderMetersV47(){
    const readings=state.meters.flatMap(m=>(m.readings||[]).map(r=>({m,r}))).sort((a,b)=>String(b.r.at).localeCompare(String(a.r.at)));
    return pageHead('Asset management','Meters','Track runtime, cycles and other readings that drive condition and preventive maintenance.',
      '<button class="button" data-v47-batch-meter>▦ Batch meter reading</button><button class="button primary" data-action="add-meter-reading">＋ Add reading</button>')+
      '<section class="card"><div class="card-head"><div><h2>Meter register</h2><p>'+state.meters.length+' configured meters across '+new Set(state.meters.map(m=>m.assetId)).size+' assets</p></div><div class="v47-meter-head"><span class="grow"></span><button class="button small" data-v47-batch-meter>Batch meter reading</button></div></div>'+
      table(['Meter','Asset','Current','Last reading','Readings',''],state.meters.map(m=>{const last=(m.readings||[]).at(-1);return '<tr><td><span class="cell-title">'+esc(m.name)+'</span><span class="cell-sub">'+esc(m.id)+'</span></td><td>'+esc(getAsset(m.assetId)?.code||m.assetId)+' · '+esc(getAsset(m.assetId)?.name||'')+'</td><td><b>'+esc(m.current)+' '+esc(m.unit)+'</b></td><td>'+dateTimeFmt(last?.at)+'</td><td>'+(m.readings||[]).length+'</td><td class="right"><button class="button small" data-v45-meter-reading="'+esc(m.id)+'">Add reading</button></td></tr>'}),'No meters configured')+'</section>'+
      '<section class="card" style="margin-top:12px"><div class="card-head"><div><h2>Recent readings</h2><p>Latest posted meter activity</p></div></div>'+table(['Date','Asset','Meter','Reading','User / note'],readings.slice(0,25).map(x=>'<tr><td>'+dateTimeFmt(x.r.at)+'</td><td>'+esc(getAsset(x.m.assetId)?.code||x.m.assetId)+'</td><td>'+esc(x.m.name)+'</td><td><b>'+esc(x.r.value)+' '+esc(x.m.unit)+'</b></td><td>'+esc(getUser(x.r.userId)?.name||x.r.userId||'—')+'<span class="cell-sub">'+esc(x.r.note||'')+'</span></td></tr>'),'No readings')+'</section>';
  }
  renderMeters=renderMetersV47;window.renderMeters=renderMetersV47;

  function showBatchMeters(){
    if(!state.meters.length){toast('No meters are configured');return}
    openModal({eyebrow:'Metering',title:'Batch meter reading',submitText:'Post readings',body:'<div class="v47-import-help">Enter only the readings you captured. Blank rows are skipped. A reading cannot be lower than the current value.</div><div class="v47-batch-grid" style="margin-top:10px">'+state.meters.map(m=>'<div class="v47-batch-row"><div><strong>'+esc(getAsset(m.assetId)?.code||m.assetId)+' · '+esc(m.name)+'</strong><small>'+esc(getAsset(m.assetId)?.name||'')+'</small></div><div><strong>'+esc(m.current)+' '+esc(m.unit)+'</strong><small>Current</small></div><input name="meter_'+esc(m.id)+'" type="number" min="'+Number(m.current)+'" step=".01" placeholder="New reading"><input name="note_'+esc(m.id)+'" placeholder="Optional note"></div>').join('')+'</div>',onSubmit:fd=>{let count=0;state.meters.forEach(m=>{const raw=String(fd.get('meter_'+m.id)||'').trim();if(!raw)return;const value=Number(raw);if(!Number.isFinite(value)||value<Number(m.current))return;m.current=value;m.readings.push({value,at:iso(),userId:CURRENT_USER,note:String(fd.get('note_'+m.id)||''),batch:true});state.assetEvents.unshift({id:uid('AE'),assetId:m.assetId,type:'Meter reading',at:iso(),userId:CURRENT_USER,detail:m.name+' = '+value+' '+m.unit+' · batch entry'});addAudit('BATCH_METER_READING',m.id,value+' '+m.unit);count++});if(!count){toast('No valid new readings were entered');return}saveState();closeModal();render();toast(count+' meter reading'+(count===1?'':'s')+' posted')}});
  }

  document.addEventListener('click',e=>{
    const cb=e.target.closest('[data-v47-select-work]');if(cb){e.preventDefault();e.stopImmediatePropagation();const id=String(cb.dataset.v47SelectWork);selectedWork.has(id)?selectedWork.delete(id):selectedWork.add(id);render();return}
    const all=e.target.closest('[data-v47-select-all]');if(all){e.preventDefault();e.stopImmediatePropagation();const rows=filteredWork();const allSelected=rows.length&&rows.every(w=>selectedWork.has(String(w.id)));rows.forEach(w=>allSelected?selectedWork.delete(String(w.id)):selectedWork.add(String(w.id)));render();return}
    if(e.target.closest('[data-v47-export-work]')){e.preventDefault();e.stopImmediatePropagation();exportWork();return}
    if(e.target.closest('[data-v47-print-work]')){e.preventDefault();e.stopImmediatePropagation();window.print();return}
    if(e.target.closest('[data-v47-delete-work]')){e.preventDefault();e.stopImmediatePropagation();deleteSelectedWork();return}
    if(e.target.closest('[data-v47-save-filter]')){e.preventDefault();e.stopImmediatePropagation();saveFilter();return}
    if(e.target.closest('[data-v47-import-work]')){e.preventDefault();e.stopImmediatePropagation();document.getElementById('v47WorkCsv')?.click();return}
    const at=e.target.closest('[data-v47-tab]');if(at){e.preventDefault();e.stopImmediatePropagation();ui.assetRecordTab=at.dataset.v47Tab;render();return}
    if(e.target.closest('[data-v47-batch-meter]')){e.preventDefault();e.stopImmediatePropagation();showBatchMeters();return}
    if(e.target.closest('[data-v47-new-business]')){e.preventDefault();e.stopImmediatePropagation();openModal({eyebrow:'Business master',title:'Add business',submitText:'Create business',body:'<div class="form-grid">'+field('name','Business name','',{required:true})+field('type','Relationship type','Vendor',{type:'select',options:['Vendor','Customer','Service Provider','Contractor','Manufacturer','Other'].map(x=>({value:x,label:x}))})+field('group','Business group','')+field('contact','Contact person','')+field('phone','Phone','')+field('email','Email','',{type:'email'})+'</div>',onSubmit:fd=>{const b={id:uid('BUS'),name:String(fd.get('name')),type:String(fd.get('type')),group:String(fd.get('group')||''),contact:String(fd.get('contact')||''),phone:String(fd.get('phone')||''),email:String(fd.get('email')||''),status:'Active'};state.businesses.push(b);addAudit('BUSINESS_CREATED',b.id,b.name+' · '+b.type);saveState();closeModal();render();toast('Business created')}});return}
    const link=e.target.closest('[data-v47-link-business]');if(link){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(link.dataset.v47LinkBusiness);if(!a)return;const available=state.businesses.filter(b=>!(a.businessLinks||[]).some(l=>l.businessId===b.id));openModal({eyebrow:a.code+' · Businesses',title:'Link business',submitText:'Link business',body:'<div class="form-grid">'+field('businessId','Business','',{type:'select',options:available.map(b=>({value:b.id,label:b.name+' · '+b.type}))})+field('businessAssetNumber','Business asset number','')+'<label class="check-row span-2"><input type="checkbox" name="primary"> Primary business relationship for this asset</label></div>',onSubmit:fd=>{const bid=String(fd.get('businessId')||'');if(!bid){toast('Choose a business');return}if(fd.get('primary')==='on')a.businessLinks.forEach(l=>l.primary=false);a.businessLinks.push({businessId:bid,businessAssetNumber:String(fd.get('businessAssetNumber')||''),primary:fd.get('primary')==='on'});state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Business linked',at:iso(),userId:CURRENT_USER,detail:(bizById(bid)?.name||bid)+' linked'});addAudit('ASSET_BUSINESS_LINKED',a.id,bid);saveState();closeModal();render();toast('Business linked')}});return}
    const unlink=e.target.closest('[data-v47-unlink-business]');if(unlink){e.preventDefault();e.stopImmediatePropagation();const [aid,bid]=unlink.dataset.v47UnlinkBusiness.split('|'),a=getAsset(aid);if(!a)return;a.businessLinks=(a.businessLinks||[]).filter(l=>l.businessId!==bid);addAudit('ASSET_BUSINESS_UNLINKED',aid,bid);saveState();render();return}
    if(e.target.closest('[data-v47-new-custom]')){e.preventDefault();e.stopImmediatePropagation();openModal({eyebrow:'Asset configuration',title:'Create custom field',submitText:'Create field',body:'<div class="form-grid">'+field('name','Field name','',{required:true})+field('type','Field type','Text',{type:'select',options:['Text','Number','Date','Yes / No'].map(x=>({value:x,label:x}))})+'</div>',onSubmit:fd=>{const d={id:uid('CF'),name:String(fd.get('name')),type:String(fd.get('type'))};state.assetCustomFieldDefinitions.push(d);addAudit('ASSET_CUSTOM_FIELD_CREATED',d.id,d.name);saveState();closeModal();render();toast('Custom field created')}});return}
    const edit=e.target.closest('[data-v47-edit-custom]');if(edit){e.preventDefault();e.stopImmediatePropagation();const a=getAsset(edit.dataset.v47EditCustom);if(!a)return;const defs=state.assetCustomFieldDefinitions;if(!defs.length){toast('Create a custom field first');return}const body='<div class="form-grid">'+defs.map(d=>field('cf_'+d.id,d.name,String(a.customFields?.[d.id]??''),{type:d.type==='Number'?'number':d.type==='Date'?'date':d.type==='Yes / No'?'select':'text',options:d.type==='Yes / No'?[{value:'Yes',label:'Yes'},{value:'No',label:'No'}]:undefined})).join('')+'</div>';openModal({eyebrow:a.code+' · Custom fields',title:'Edit custom asset data',submitText:'Save values',body,onSubmit:fd=>{a.customFields=a.customFields||{};defs.forEach(d=>a.customFields[d.id]=String(fd.get('cf_'+d.id)||''));state.assetEvents.unshift({id:uid('AE'),assetId:a.id,type:'Custom data updated',at:iso(),userId:CURRENT_USER,detail:defs.map(d=>d.name).join(', ')});addAudit('ASSET_CUSTOM_FIELDS_UPDATED',a.id,defs.length+' fields');saveState();closeModal();render();toast('Custom values saved')}});return}
  },true);

  document.addEventListener('change',e=>{
    if(e.target.id==='v47WorkCsv'&&e.target.files?.[0]){importWork(e.target.files[0]);e.target.value='';return}
    if(e.target.matches('[data-v47-saved-filter]')){ui.v47WorkFilter=e.target.value;render();return}
    if(e.target.matches('[data-v47-work-type]')){ui.v47WorkType=e.target.value;render();return}
    if(e.target.matches('[data-v47-work-priority]')){ui.v47WorkPriority=e.target.value;render();return}
    if(e.target.matches('[data-v47-work-asset]')){ui.v47WorkAsset=e.target.value;render();return}
  },true);

  patchAssetRecord();
  if(ui.route==='work-orders'||ui.route==='meters')render();
})();