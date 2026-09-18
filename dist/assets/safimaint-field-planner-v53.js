'use strict';

// SafiMaintain field execution and planner v53.
(function(){
  ensureSpecState();
  ui.v53PlannerOffset=Number(ui.v53PlannerOffset||0);

  function control(w){return typeof window.safiWorkStatusControl==='function'?window.safiWorkStatusControl(w):(['Completed','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE')}
  function dateISO(d){return new Date(d).toISOString().slice(0,10)}
  function weekStart(offset=0){const d=new Date();d.setHours(0,0,0,0);const dayNo=(d.getDay()+6)%7;d.setDate(d.getDate()-dayNo+offset*7);return d}
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function sameDay(a,b){return String(a||'').slice(0,10)===String(b||'').slice(0,10)}
  function resourceRows(){
    const people=state.users.filter(u=>u.active&&(!u.siteIds?.length||u.siteIds.includes(safiActiveSite()?.id))).map(u=>({id:'U:'+u.id,name:u.name,sub:getRole(u.roleId)?.name||'User',userId:u.id,capacity:Number(u.weeklyCapacityHours||40)}));
    const groups=state.groups.map(g=>({id:'G:'+g.id,name:g.name,sub:'Group · '+state.users.filter(u=>(u.groupIds||[]).includes(g.id)).length+' people',groupId:g.id,capacity:state.users.filter(u=>u.active&&(u.groupIds||[]).includes(g.id)).reduce((n,u)=>n+Number(u.weeklyCapacityHours||40),0)}));
    return [...people,...groups,{id:'UNASSIGNED',name:'Unassigned',sub:'Needs assignment',capacity:0}];
  }
  function jobsForResource(r){
    return state.workOrders.filter(w=>control(w)==='ACTIVE'&&safiSiteAllowed(w)).filter(w=>r.userId?(w.assigneeIds||[]).includes(r.userId):r.groupId?w.assigneeGroupId===r.groupId:(!(w.assigneeIds||[]).length&&!w.assigneeGroupId));
  }
  function renderPlanner(){
    const start=weekStart(ui.v53PlannerOffset),days=Array.from({length:7},(_,i)=>addDays(start,i)),today=day(0),resources=resourceRows();
    return '<div class="v50-page">'+pageHead('Maintenance','Calendar / planner','Plan work by assignee or group, visualize priority/late jobs, and rebalance workload.',
      '<div class="v53-planner-controls"><button class="button" data-v53-week="-1">‹ Previous</button><button class="button" data-v53-week="0">Today</button><button class="button" data-v53-week="1">Next ›</button><button class="button primary" data-action="new-work">＋ New work</button></div>')+
      '<div class="v53-planner"><div class="v53-planner-grid"><div class="v53-plan-head"><strong>Resource</strong><small>Weekly assigned hours</small></div>'+
      days.map(d=>'<div class="v53-plan-head"><strong>'+d.toLocaleDateString(undefined,{weekday:'short'})+'</strong><small>'+d.toLocaleDateString(undefined,{day:'2-digit',month:'short'})+'</small></div>').join('')+
      resources.map(r=>{const jobs=jobsForResource(r),remaining=jobs.reduce((n,w)=>n+Math.max(0,Number(w.estimateHours||0)-Number(w.actualHours||0)),0),pct=r.capacity?Math.round(remaining/r.capacity*100):0;return '<div class="v53-resource"><strong>'+esc(r.name)+'</strong><small>'+esc(r.sub)+' · '+remaining.toFixed(1)+' h</small>'+(r.capacity?'<div class="v53-capacity"><i class="'+(pct>100?'over':'')+'" style="width:'+Math.min(100,pct)+'%"></i></div>':'')+'</div>'+
        days.map(d=>{const date=dateISO(d),list=jobs.filter(w=>sameDay(w.suggestedStart||w.due,date));return '<div class="v53-daycell '+(date===today?'today':'')+'">'+list.map(w=>{const overdue=w.due&&w.due<today,pri=String(w.priority||'').toLowerCase();return '<button class="v53-job '+(overdue?'overdue ': '')+(pri.includes('critical')||pri.includes('emergency')?'critical':pri.includes('high')?'high':'')+'" data-v53-plan-work="'+esc(w.id)+'"><strong>'+esc(w.id)+' · '+esc(w.title)+'</strong><small>'+esc(getAsset(w.assetIds?.[0])?.code||'No asset')+' · '+esc(w.priority)+'</small></button>'}).join('')+'</div>'}).join('')}).join('')+
      '</div></div></div>';
  }
  renderCalendar=renderPlanner;window.renderCalendar=renderPlanner;

  function planWork(id){
    const w=getWork(id);if(!w)return;
    openModal({eyebrow:w.id+' · Planner',title:w.title,submitText:'Save plan',body:'<div class="form-grid">'+
      field('suggestedStart','Suggested start',w.suggestedStart||day(0),{type:'date',required:true})+
      field('due','Suggested completion',w.due||day(2),{type:'date',required:true})+
      field('assigneeId','Primary technician',(w.assigneeIds||[])[0]||'',{type:'select',options:[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))]})+
      field('groupId','Assigned group',w.assigneeGroupId||'',{type:'select',options:[{value:'',label:'No group'},...state.groups.map(g=>({value:g.id,label:g.name}))]})+
      field('estimateHours','Estimated labor hours',String(w.estimateHours||0),{type:'number',min:0,step:'.25'})+
      '</div>',onSubmit:fd=>{const start=String(fd.get('suggestedStart')),due=String(fd.get('due'));if(due<start){toast('Completion date cannot be before start date');return}w.suggestedStart=start;w.due=due;const uid=String(fd.get('assigneeId')||'');w.assigneeIds=uid?[uid]:[];w.assigneeGroupId=String(fd.get('groupId')||'')||null;w.estimateHours=Number(fd.get('estimateHours')||0);w.status=w.assigneeIds.length||w.assigneeGroupId?(w.status==='Open'?'Assigned':w.status):w.status;w.history=w.history||[];w.history.unshift({at:iso(),text:'Planner updated schedule and assignment'});addAudit('WORK_PLANNED',w.id,start+' → '+due);dispatchEvent('Work order assigned',w.id+' planned',w.title,{assetId:w.assetIds?.[0],assigneeIds:w.assigneeIds,relatedId:w.id});saveState();closeModal();render();toast('Work plan updated')}});
  }

  function requestPortal(){
    const assets=state.assets.filter(a=>a.type!=='Site'&&safiSiteAllowed(a));
    return '<div class="v53-portal"><section class="v53-portal-hero"><p class="eyebrow">Maintenance request portal</p><h1>Report something that needs attention</h1><p>You do not need to know maintenance planning. Select the equipment, explain the issue and SafiMaintain will send it for triage.</p></section>'+
      '<section class="v53-portal-form"><div class="form-grid"><label>Asset<select id="v53RequestAsset">'+assets.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.code)+' · '+esc(a.name)+'</option>').join('')+'</select></label><label>Urgency<select id="v53RequestUrgency"><option>Normal</option><option>Urgent</option><option>Safety critical</option></select></label><label class="span-2">What is wrong?<input id="v53RequestSummary" placeholder="e.g. Pump is leaking at the mechanical seal"></label><label class="span-2">What did you observe?<textarea id="v53RequestDescription" placeholder="Describe symptoms, location, when it started and any immediate safety concern."></textarea></label><label>Your name<input id="v53Requester" value="'+esc(currentUser()?.name||'')+'" placeholder="Requester name"></label><div style="display:flex;align-items:end"><button class="button primary" type="button" data-v53-submit-request>Submit request</button></div></div></section></div>';
  }

  function operatorPortal(){
    const u=currentUser(),assigned=state.workOrders.filter(w=>control(w)==='ACTIVE'&&safiSiteAllowed(w)&&((w.assigneeIds||[]).includes(u?.id)||(u?.groupIds||[]).includes(w.assigneeGroupId))),assets=state.assets.filter(a=>a.type!=='Site'&&safiSiteAllowed(a)).slice(0,12);
    return '<div class="v53-portal"><section class="v53-portal-hero"><p class="eyebrow">Field / operator portal</p><h1>'+esc(u?.name||'Operator')+'’s maintenance work</h1><p>A simplified field view for finding assets, opening assigned work, completing tasks, recording information and adding evidence.</p></section>'+
      '<div class="v50-grid"><section class="v50-card"><div class="v50-card-head"><div><h2>Assigned open work</h2><p>'+assigned.length+' work orders</p></div></div><div class="v53-operator-work">'+(assigned.length?assigned.map(w=>'<div class="v53-operator-job"><span><strong>'+esc(w.id)+' · '+esc(w.title)+'</strong><small>'+esc(getAsset(w.assetIds?.[0])?.name||'No asset')+' · '+esc(w.status)+' · '+dateFmt(w.due)+'</small></span><button class="button small primary" data-open-work="'+esc(w.id)+'">Open work</button></div>').join(''):'<div class="v50-empty"><strong>No assigned work</strong><span>Your assigned maintenance appears here.</span></div>')+'</div></section>'+
      '<section class="v50-card"><div class="v50-card-head"><div><h2>Nearby / current-site assets</h2><p>Open an asset or scan its tag</p></div><button class="button small" id="v53Scan">Scan</button></div><div class="v53-portal-assets">'+assets.map(a=>'<button class="v53-portal-asset" data-v51-open-asset="'+esc(a.id)+'"><strong>'+esc(a.code)+' · '+esc(a.name)+'</strong><small>'+esc(a.type)+' · '+esc(a.operatingState)+'</small></button>').join('')+'</div></section></div></div>';
  }

  function submitPortalRequest(){
    const assetId=document.getElementById('v53RequestAsset')?.value,summary=document.getElementById('v53RequestSummary')?.value.trim(),description=document.getElementById('v53RequestDescription')?.value.trim(),requester=document.getElementById('v53Requester')?.value.trim(),urgency=document.getElementById('v53RequestUrgency')?.value||'Normal';
    if(!assetId||!summary||!requester){toast('Asset, issue summary and requester are required');return}
    const r={id:uid('WR'),assetId,summary,description,urgency,requester,status:'Requested',createdAt:iso(),requestedAt:iso(),reviewerId:null,reviewedBy:null,triageNote:'',workOrderId:null,history:[{at:iso(),text:'Request submitted by '+requester}]};state.requests.unshift(r);addAudit('REQUEST_CREATED',r.id,summary);dispatchEvent('Maintenance request created',r.id+' submitted',summary,{assetId,relatedId:r.id});saveState();toast(r.id+' submitted');go('requests');
  }

  const baseResolve=resolveCode;
  resolveCode=function(code){
    const q=String(code||'').trim().toLowerCase();
    const work=state.workOrders.find(w=>String(w.id).toLowerCase()===q||String(w.code||'').toLowerCase()===q);
    if(work){go('work-orders');setTimeout(()=>openWorkDrawer(work.id),0);return true}
    return baseResolve(code);
  };
  window.resolveCode=resolveCode;

  const priorOpen=openWorkDrawer;
  openWorkDrawer=function(id){
    priorOpen(id);
    setTimeout(()=>{const actions=document.querySelector('.v44-record-actions');if(actions&&!actions.querySelector('[data-v53-print-work]'))actions.insertAdjacentHTML('afterbegin','<button class="button" type="button" data-v53-print-work="'+esc(id)+'">▧ Print / PDF</button>')},0);
  };
  window.openWorkDrawer=openWorkDrawer;

  function printWork(id){
    const w=getWork(id);if(!w)return;const assets=(w.assetIds||[]).map(id=>getAsset(id)).filter(Boolean),tasks=w.tasks||[],labor=w.labor||[],parts=w.parts||[];
    const laborCost=labor.reduce((n,x)=>n+Number(x.hours||0)*Number(getUser(x.userId)?.hourlyRate||0),0),partCost=parts.reduce((n,x)=>n+Number(x.actual||0)*Number(getPart(x.partId)?.unitCost||0),0),misc=(w.miscCosts||[]).reduce((n,x)=>n+Number(x.amount||0),0);
    const sheet=document.createElement('section');sheet.className='v53-print-sheet';sheet.id='v53PrintSheet';sheet.innerHTML='<h1>'+esc(w.id)+' · '+esc(w.title)+'</h1><p>'+esc(w.instructions||'')+'</p>'+
      '<div class="v53-print-meta"><div><small>Status</small><strong>'+esc(w.status)+'</strong></div><div><small>Priority</small><strong>'+esc(w.priority)+'</strong></div><div><small>Type</small><strong>'+esc(w.type)+'</strong></div><div><small>Due</small><strong>'+dateFmt(w.due)+'</strong></div><div><small>Asset(s)</small><strong>'+esc(assets.map(a=>a.code+' · '+a.name).join(', ')||'None')+'</strong></div><div><small>Assigned</small><strong>'+esc((w.assigneeIds||[]).map(id=>getUser(id)?.name).filter(Boolean).join(', ')||getGroup(w.assigneeGroupId)?.name||'Unassigned')+'</strong></div><div><small>Actual labor</small><strong>'+Number(w.actualHours||0).toFixed(2)+' h</strong></div><div><small>Total cost</small><strong>'+money(laborCost+partCost+misc)+'</strong></div></div>'+
      '<h3>Tasks</h3><table class="v53-print-table"><thead><tr><th>Task</th><th>Type</th><th>Result</th><th>Status</th></tr></thead><tbody>'+tasks.map(t=>'<tr><td>'+esc(t.text)+'</td><td>'+esc(t.type||'General')+'</td><td>'+esc(t.result||t.resultNote||'—')+'</td><td>'+esc(t.status)+'</td></tr>').join('')+'</tbody></table>'+
      '<h3>Parts</h3><table class="v53-print-table"><thead><tr><th>Part</th><th>Planned</th><th>Used</th><th>Cost</th></tr></thead><tbody>'+parts.map(x=>{const p=getPart(x.partId);return '<tr><td>'+esc(p?.code||x.partId)+' · '+esc(p?.name||'')+'</td><td>'+Number(x.planned||0)+'</td><td>'+Number(x.actual||0)+'</td><td>'+money(Number(x.actual||0)*Number(p?.unitCost||0))+'</td></tr>'}).join('')+'</tbody></table>'+
      '<h3>Completion / failure</h3><p><strong>Completion note:</strong> '+esc(w.completionNote||'—')+'</p><p><strong>Problem:</strong> '+esc(w.failureCodes?.problem||'—')+' &nbsp; <strong>Cause:</strong> '+esc(w.failureCodes?.cause||'—')+' &nbsp; <strong>Action:</strong> '+esc(w.failureCodes?.action||'—')+'</p>';
    document.body.appendChild(sheet);window.print();setTimeout(()=>sheet.remove(),500);
  }

  // Extend the document-aligned navigation with the two simplified field portals.
  const oldSimpleNavigation=simpleNavigation;
  simpleNavigation=function(){
    oldSimpleNavigation();
    const maintenance=[...document.querySelectorAll('.v50-nav-group')].find(x=>x.querySelector('summary')?.textContent.trim()==='Maintenance');
    const wrap=maintenance?.querySelector('div');
    if(wrap&&!wrap.querySelector('[data-route="request-portal"]'))wrap.insertAdjacentHTML('beforeend','<button class="nav-item" data-route="request-portal"><span class="nav-icon">'+navIcon('requests')+'</span><span>Request portal</span></button><button class="nav-item" data-route="operator-portal"><span class="nav-icon">'+navIcon('team')+'</span><span>Operator / field portal</span></button>');
  };
  window.simpleNavigation=simpleNavigation;

  const baseRouteTitle=routeTitle;
  routeTitle=function(){return ui.route==='request-portal'?'Request portal':ui.route==='operator-portal'?'Operator portal':baseRouteTitle()};
  window.routeTitle=routeTitle;

  const baseRender=render;
  render=function(){
    baseRender();
    if(ui.route==='request-portal'||ui.route==='operator-portal'){
      const view=document.getElementById('appView');view.innerHTML=ui.route==='request-portal'?requestPortal():operatorPortal();document.title=routeTitle()+' · SafiMaintain';document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===ui.route));
    }
    simpleNavigation();syncSimpleShell();
  };
  window.render=render;

  document.addEventListener('click',e=>{
    const week=e.target.closest('[data-v53-week]');if(week){e.preventDefault();e.stopImmediatePropagation();const n=Number(week.dataset.v53Week);ui.v53PlannerOffset=n===0?0:ui.v53PlannerOffset+n;render();return}
    const plan=e.target.closest('[data-v53-plan-work]');if(plan){e.preventDefault();e.stopImmediatePropagation();planWork(plan.dataset.v53PlanWork);return}
    if(e.target.closest('[data-v53-submit-request]')){e.preventDefault();e.stopImmediatePropagation();submitPortalRequest();return}
    if(e.target.closest('#v53Scan')){e.preventDefault();e.stopImmediatePropagation();showScanner();return}
    const print=e.target.closest('[data-v53-print-work]');if(print){e.preventDefault();e.stopImmediatePropagation();printWork(print.dataset.v53PrintWork);return}
  },true);

  if(['calendar','request-portal','operator-portal'].includes(ui.route))render();
})();