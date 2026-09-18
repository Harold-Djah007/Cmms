'use strict';

// SafiMaintain operational awareness v57.
(function(){
  ensureSpecState();
  ui.v57NoticeFilter=ui.v57NoticeFilter||'All';
  ui.v57NoticeSearch=ui.v57NoticeSearch||'';

  function noticeCategory(n){
    const s=[n.event,n.title,n.message].join(' ').toLowerCase();
    if(/stock|part|inventory|cycle/.test(s))return'Inventory';
    if(/purchase|rfq|supplier|order|receipt/.test(s))return'Purchasing';
    if(/asset|offline|online|downtime|meter/.test(s))return'Assets';
    if(/work|task|inspection|maintenance|assigned|closed/.test(s))return'Work';
    return'Other';
  }
  function relatedTarget(n){
    const id=String(n.relatedId||'');
    if(!id)return null;
    if(getWork(id))return{kind:'work',id};
    if(getAsset(id))return{kind:'asset',id};
    if(getPart(id))return{kind:'part',id};
    if(state.purchaseOrders.some(x=>x.id===id))return{kind:'po',id};
    if(state.purchaseRequests.some(x=>x.id===id))return{kind:'pr',id};
    if(state.rfqs.some(x=>x.id===id))return{kind:'rfq',id};
    if(state.requests.some(x=>x.id===id))return{kind:'request',id};
    return null;
  }
  function dayBucket(value){
    if(!value)return'OLDER';const d=new Date(value),today=new Date();today.setHours(0,0,0,0);const yd=new Date(today);yd.setDate(yd.getDate()-1);
    if(d>=today)return'TODAY';if(d>=yd)return'YESTERDAY';return'OLDER'
  }
  function renderNotificationCentre(){
    const mine=state.notifications.filter(n=>n.userId===CURRENT_USER),filter=ui.v57NoticeFilter,q=String(ui.v57NoticeSearch||'').toLowerCase();
    const rows=mine.filter(n=>(filter==='All'||filter==='Unread'&&!n.read||noticeCategory(n)===filter)&&(!q||[n.title,n.message,n.event].join(' ').toLowerCase().includes(q))).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    const buckets=['TODAY','YESTERDAY','OLDER'];
    return '<div class="v50-page">'+pageHead('Alerts','Notification centre','Assignments, inspections, asset state, inventory and purchasing events for the current user.','<button class="button" data-v57-read-all>Mark all read</button>')+
      '<div class="v57-health-grid"><div><small>Unread</small><strong>'+mine.filter(n=>!n.read).length+'</strong></div><div><small>Work</small><strong>'+mine.filter(n=>noticeCategory(n)==='Work').length+'</strong></div><div><small>Inventory / purchasing</small><strong>'+mine.filter(n=>['Inventory','Purchasing'].includes(noticeCategory(n))).length+'</strong></div><div><small>Total retained</small><strong>'+mine.length+'</strong></div></div>'+
      '<div class="v57-notice-toolbar"><input data-v57-notice-search value="'+esc(ui.v57NoticeSearch||'')+'" placeholder="Search alerts…"><select data-v57-notice-filter>'+['All','Unread','Work','Assets','Inventory','Purchasing','Other'].map(x=>'<option '+(filter===x?'selected':'')+'>'+x+'</option>').join('')+'</select><span class="grow"></span><span class="v50-pill" data-v57-notice-count>'+rows.length+' shown</span></div>'+
      '<div class="v57-notice-list">'+(rows.length?buckets.map(bucket=>{const list=rows.filter(n=>dayBucket(n.createdAt)===bucket);if(!list.length)return'';return '<div class="v57-day-label" data-v57-bucket="'+bucket+'">'+bucket+'</div>'+list.map(n=>{const target=relatedTarget(n),blob=[n.title,n.message,n.event].join(' ').toLowerCase();return '<div class="v57-notice '+(n.read?'':'unread')+'" data-v57-notice-row data-v57-bucket-row="'+bucket+'" data-search="'+esc(blob)+'"><i></i><span><strong>'+esc(n.title)+'</strong><small>'+esc(n.message||n.event||'')+'</small></span><time>'+dateTimeFmt(n.createdAt)+'</time><span class="v57-notice-actions">'+(target?'<button class="button small" data-v57-open-notice="'+esc(n.id)+'">Open record</button>':'')+(!n.read?'<button class="button small" data-v57-read="'+esc(n.id)+'">Mark read</button>':'')+'</span></div>'}).join('')}).join(''):'<div class="v50-empty" data-v57-notice-empty><strong>No matching notifications</strong><span>New operational alerts will appear here.</span></div>')+'</div>'+
      '<section class="v50-card"><div class="v50-card-head"><div><h2>Email delivery queue</h2><p>Queued/Sent state is separate from in-app notification state</p></div>'+(typeof safiSync!=='undefined'&&safiSync.apiAvailable?'<button class="button primary" data-mail-flush>Send queued mail</button>':'')+'</div>'+table(['Recipient','Subject','Status','Created'],state.mailOutbox.slice(0,30).map(m=>'<tr><td>'+esc(m.to)+'</td><td><strong>'+esc(m.subject)+'</strong></td><td>'+status(m.status)+'</td><td>'+dateTimeFmt(m.createdAt)+'</td></tr>'),'No email records')+'</section>'+
      '<section class="v50-card"><div class="v50-card-head"><div><h2>Notification rules</h2><p>Operational events and their audiences/channels</p></div></div>'+table(['Event','Audience','In-app','Email'],state.notificationRules.map(r=>'<tr><td><b>'+esc(r.event)+'</b></td><td>'+esc((r.audiences||[]).join(', '))+'</td><td><input type="checkbox" data-rule-channel="'+esc(r.id)+'|inApp" '+(r.inApp?'checked':'')+'></td><td><input type="checkbox" data-rule-channel="'+esc(r.id)+'|email" '+(r.email?'checked':'')+'></td></tr>'),'No rules')+'</section></div>';
  }
  renderNotifications=renderNotificationCentre;window.renderNotifications=renderNotificationCentre;

  function openNotification(id){
    const n=state.notifications.find(x=>x.id===id);if(!n)return;n.read=true;const t=relatedTarget(n);saveState();if(!t){render();return}
    if(t.kind==='work'){go('work-orders');setTimeout(()=>openWorkDrawer(t.id),0)}
    else if(t.kind==='asset'){ui.selectedAsset=t.id;ui.assetView='record';ui.assetRecordTab='general';go('assets')}
    else if(t.kind==='part'){ui.selectedPart=t.id;go('inventory')}
    else if(t.kind==='po'){go('purchase-orders');setTimeout(()=>document.querySelector('[data-v56-open-po="'+CSS.escape(t.id)+'"]')?.click(),0)}
    else if(t.kind==='pr')go('purchase-requests');
    else if(t.kind==='rfq')go('rfqs');
    else if(t.kind==='request'){go('requests');setTimeout(()=>document.querySelector('[data-v52-open-request="'+CSS.escape(t.id)+'"]')?.click(),0)}
  }

  function meterOutlook(){
    const rows=[];
    state.scheduledMaintenance.filter(pm=>!pm.paused&&pm.status!=='Paused').forEach(pm=>{
      (pm.triggers||[]).filter(t=>t.active&&t.type==='Meter').forEach(t=>{
        const assetIds=pm.assetIds||[pm.assetId].filter(Boolean),meter=state.meters.find(m=>assetIds.includes(m.assetId)&&(t.meterId?m.id===t.meterId:true));if(!meter)return;
        const threshold=Number(t.threshold??t.nextDue??0),remaining=threshold-Number(meter.current||0),interval=Number(t.interval||String(t.description||'').replace(/[^0-9.]/g,''))||Math.max(1,threshold),pct=Math.max(0,Math.min(100,(remaining/interval)*100));
        rows.push({pm,meter,remaining,pct,asset:getAsset(meter.assetId)})
      })
    });
    return rows.sort((a,b)=>a.remaining-b.remaining).slice(0,8);
  }
  function partsOutlook(){
    const demand={};const add=(id,q)=>demand[id]=(demand[id]||0)+Number(q||0);
    state.workOrders.filter(w=>typeof safiWorkStatusControl==='function'?safiWorkStatusControl(w)!=='CLOSED':!['Completed','Cancelled'].includes(w.status)).forEach(w=>(w.parts||[]).forEach(x=>add(x.partId,Math.max(0,Number(x.planned||0)-Number(x.actual||0)))));
    state.scheduledMaintenance.filter(pm=>!pm.paused&&pm.status!=='Paused').forEach(pm=>{
      const direct=pm.requiredParts||[];direct.forEach(x=>add(x.partId,x.qty));
      (pm.nestedPlanIds||[]).map(id=>state.scheduledMaintenance.find(x=>x.id===id)).filter(Boolean).forEach(child=>(child.requiredParts||[]).forEach(x=>add(x.partId,x.qty)))
    });
    return state.parts.map(p=>{const current=partOnHand(p),future=demand[p.id]||0,reserve=Number(p.min||0),shortage=Math.max(0,future+reserve-current);return{p,current,future,reserve,shortage}}).filter(x=>x.shortage>0).sort((a,b)=>b.shortage-a.shortage).slice(0,8);
  }
  function laborOutlook(){
    const start=new Date();start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+7);
    return state.users.filter(u=>u.active).map(u=>{
      const jobs=state.workOrders.filter(w=>(w.assigneeIds||[]).includes(u.id)&&(!w.suggestedStart||new Date(w.suggestedStart)<=end)&&(!w.due||new Date(w.due)>=start)&&!['Completed','Cancelled'].includes(w.status));
      const hours=jobs.reduce((n,w)=>n+Math.max(0,Number(w.estimateHours||0)-Number(w.actualHours||0)),0),capacity=Number(u.weeklyCapacityHours||40);return{u,hours,capacity,over:Math.max(0,hours-capacity),jobs:jobs.length}
    }).filter(x=>x.hours>0).sort((a,b)=>b.over-a.over||b.hours-a.hours).slice(0,8);
  }
  function purchaseRisks(){
    const risks=[];
    state.purchaseOrders.filter(po=>['Ordered','Partially received'].includes(po.status)&&po.expectedDate).forEach(po=>{
      (po.lines||[]).forEach(line=>{
        const needJobs=state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status)&&(w.parts||[]).some(x=>x.partId===line.partId&&Number(x.planned||0)>Number(x.actual||0))&&w.due);
        const earliest=needJobs.sort((a,b)=>String(a.due).localeCompare(String(b.due)))[0];if(earliest&&po.expectedDate>earliest.due)risks.push({po,line,w:earliest,p:getPart(line.partId),days:Math.max(1,Math.ceil((new Date(po.expectedDate)-new Date(earliest.due))/86400000))})
      })
    });
    return risks.sort((a,b)=>b.days-a.days).slice(0,8);
  }
  function outlookPage(){
    const meters=meterOutlook(),parts=partsOutlook(),labor=laborOutlook(),purch=purchaseRisks();
    return '<div class="v50-page">'+pageHead('Planning intelligence','Maintenance outlook','Forward-looking signals from meters, planned work, stock demand, labour capacity and supplier dates.')+
      '<div class="v57-health-grid"><div><small>Meter PM approaching</small><strong>'+meters.filter(x=>x.remaining>=0).length+'</strong></div><div><small>Projected part shortages</small><strong>'+parts.length+'</strong></div><div><small>People over capacity</small><strong>'+labor.filter(x=>x.over>0).length+'</strong></div><div><small>PO schedule risks</small><strong>'+purch.length+'</strong></div></div>'+
      '<div class="v57-outlook"><section class="v57-outlook-card"><div class="v57-outlook-head"><div><h2>Meter / PM horizon</h2><p>Current reading → next configured threshold</p></div><button class="button small" data-route="pm">Plans</button></div><div class="v57-outlook-body">'+(meters.length?meters.map(x=>'<div class="v57-forecast-row"><span><strong>'+esc(x.asset?.code||x.meter.assetId)+' · '+esc(x.meter.name)+'</strong><small>'+esc(x.pm.name)+' · current '+x.meter.current+' '+esc(x.meter.unit)+'</small><div class="v57-meter-gauge"><i class="'+(x.remaining<=0?'bad':x.pct<20?'warn':'')+'" style="width:'+Math.max(2,100-x.pct)+'%"></i></div></span><span>Next '+esc(String(x.meter.current+Math.max(0,x.remaining)))+' '+esc(x.meter.unit)+'</span><b class="v57-risk-badge '+(x.remaining<=0?'bad':x.pct<20?'warn':'')+'">'+(x.remaining<=0?'DUE':esc(x.remaining.toFixed(1)+' remaining'))+'</b></div>').join(''):'<div class="v50-empty"><strong>No meter-driven PM horizon</strong><span>Add meter triggers to scheduled maintenance.</span></div>')+'</div></section>'+
      '<section class="v57-outlook-card"><div class="v57-outlook-head"><div><h2>Projected stock shortages</h2><p>Open work + PM demand + reserve − current stock</p></div><button class="button small" data-route="parts-forecaster">Forecaster</button></div><div class="v57-outlook-body">'+(parts.length?parts.map(x=>'<div class="v57-forecast-row"><span><strong>'+esc(x.p.code)+' · '+esc(x.p.name)+'</strong><small>Current '+x.current+' · planned '+x.future+' · reserve '+x.reserve+'</small></span><span>'+esc(supplierForOutlook(x.p))+'</span><b class="v57-risk-badge bad">Short '+x.shortage+' '+esc(x.p.uom)+'</b></div>').join(''):'<div class="v50-empty"><strong>No projected shortage</strong><span>Current stock covers known work, PM usage and minimum reserve.</span></div>')+'</div></section>'+
      '<section class="v57-outlook-card"><div class="v57-outlook-head"><div><h2>Labour capacity next 7 days</h2><p>Remaining estimated hours versus weekly capacity</p></div><button class="button small" data-route="labor-availability">Labour</button></div><div class="v57-outlook-body">'+(labor.length?labor.map(x=>'<div class="v57-forecast-row"><span><strong>'+esc(x.u.name)+'</strong><small>'+x.jobs+' jobs · '+x.hours.toFixed(1)+' h assigned · '+x.capacity.toFixed(1)+' h capacity</small></span><span>'+esc(getRole(x.u.roleId)?.name||'')+'</span><b class="v57-risk-badge '+(x.over>0?'bad':'')+'">'+(x.over>0?x.over.toFixed(1)+' h over':Math.max(0,x.capacity-x.hours).toFixed(1)+' h free')+'</b></div>').join(''):'<div class="v50-empty"><strong>No near-term assigned labour</strong><span>Planned work will populate the capacity outlook.</span></div>')+'</div></section>'+
      '<section class="v57-outlook-card"><div class="v57-outlook-head"><div><h2>Supply schedule risk</h2><p>Supplier promise compared with maintenance due date</p></div><button class="button small" data-route="purchase-orders">Purchase orders</button></div><div class="v57-outlook-body">'+(purch.length?purch.map(x=>'<div class="v57-forecast-row"><span><strong>'+esc(x.po.id)+' · '+esc(x.p?.code||x.line.partId)+'</strong><small>Needed by '+dateFmt(x.w.due)+' for '+esc(x.w.id)+' · promised '+dateFmt(x.po.expectedDate)+'</small></span><span>'+esc(x.p?.name||'')+'</span><b class="v57-risk-badge bad">'+x.days+'d late risk</b></div>').join(''):'<div class="v50-empty"><strong>No PO-to-work schedule conflict</strong><span>Supplier promise dates currently meet linked maintenance needs.</span></div>')+'</div></section></div></div>';
  }
  function supplierForOutlook(p){return state.businesses.find(b=>b.id===p.preferredBusinessId)?.name||getVendor(p.vendorId)?.name||'No supplier'}

  const baseAddAudit=addAudit;
  addAudit=function(action,entity,detail){
    const before=state.audit?.[0]?.id;baseAddAudit(action,entity,detail);const record=state.audit?.[0];if(record&&record.id!==before){record.source=(typeof safiSync!=='undefined'&&safiSync.apiAvailable)?'Shared web':'Device/web';record.siteId=safiActiveSite?.()?.id||null}return record
  };
  window.addAudit=addAudit;

  function renderAuditV57(){
    const rows=state.audit.slice(0,500);
    return '<div class="v50-page">'+pageHead('Administration','Activity / audit trail','Append-only operational history with actor, object, timestamp, detail and source.','<button class="button" data-action="export-data">Export JSON</button>')+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Object</th><th>Detail / change</th><th>Source</th></tr></thead><tbody>'+rows.map(a=>'<tr class="v57-audit-row"><td>'+dateTimeFmt(a.at)+'</td><td>'+esc(getUser(a.userId)?.name||a.userId||'System')+'</td><td><strong>'+esc(a.action)+'</strong></td><td>'+esc(a.entity||'—')+'</td><td>'+esc(a.detail||'—')+'</td><td>'+esc(a.source||'Legacy/device')+'</td></tr>').join('')+'</tbody></table></div></div>';
  }
  renderAudit=renderAuditV57;window.renderAudit=renderAuditV57;

  const oldTitle=routeTitle;
  routeTitle=function(){return ui.route==='maintenance-outlook'?'Maintenance outlook':oldTitle()};
  window.routeTitle=routeTitle;
  const oldNav=simpleNavigation;
  simpleNavigation=function(){oldNav();const reports=[...document.querySelectorAll('.v50-nav-group')].find(x=>x.querySelector('summary')?.textContent.trim()==='Reports & analytics')?.querySelector('div');if(reports&&!reports.querySelector('[data-route="maintenance-outlook"]'))reports.insertAdjacentHTML('afterbegin','<button class="nav-item" data-route="maintenance-outlook"><span class="nav-icon">'+navIcon('reports')+'</span><span>Maintenance outlook</span></button>')};
  window.simpleNavigation=simpleNavigation;

  const baseRender=render;
  render=function(){baseRender();if(ui.route==='maintenance-outlook'){document.getElementById('appView').innerHTML=outlookPage();document.title=routeTitle()+' · SafiMaintain';document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===ui.route))}simpleNavigation();syncSimpleShell()};
  window.render=render;

  document.addEventListener('input',e=>{if(e.target.matches('[data-v57-notice-search]')){ui.v57NoticeSearch=e.target.value;const q=ui.v57NoticeSearch.trim().toLowerCase(),rows=[...document.querySelectorAll('[data-v57-notice-row]')];let shown=0;rows.forEach(row=>{const hit=!q||String(row.dataset.search||'').includes(q);row.hidden=!hit;if(hit)shown++});document.querySelectorAll('[data-v57-bucket]').forEach(label=>{const bucket=label.dataset.v57Bucket;label.hidden=!document.querySelector('[data-v57-bucket-row="'+CSS.escape(bucket)+'"]:not([hidden])')});const count=document.querySelector('[data-v57-notice-count]');if(count)count.textContent=shown+' shown';let empty=document.querySelector('[data-v57-notice-empty]');if(!shown&&!empty){empty=document.createElement('div');empty.className='v50-empty';empty.dataset.v57NoticeEmpty='';empty.innerHTML='<strong>No matching notifications</strong><span>Try another search term.</span>';document.querySelector('.v57-notice-list')?.appendChild(empty)}if(empty)empty.hidden=shown>0}},true);
  document.addEventListener('change',e=>{if(e.target.matches('[data-v57-notice-filter]')){ui.v57NoticeFilter=e.target.value;render()}},true);
  document.addEventListener('click',e=>{
    const read=e.target.closest('[data-v57-read]');if(read){e.preventDefault();e.stopImmediatePropagation();const n=state.notifications.find(x=>x.id===read.dataset.v57Read);if(n){n.read=true;saveState();render()}return}
    if(e.target.closest('[data-v57-read-all]')){e.preventDefault();e.stopImmediatePropagation();state.notifications.filter(n=>n.userId===CURRENT_USER).forEach(n=>n.read=true);saveState();render();toast('Notifications marked read');return}
    const open=e.target.closest('[data-v57-open-notice]');if(open){e.preventDefault();e.stopImmediatePropagation();openNotification(open.dataset.v57OpenNotice);return}
  },true);

  if(['notifications','audit','maintenance-outlook'].includes(ui.route))render();
})();