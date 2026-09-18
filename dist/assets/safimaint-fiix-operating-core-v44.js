'use strict';

// SafiMaintain Fiix operating model v44.
// Makes work orders the connected center of requests, PM, task execution, meters, labor, parts, cost and history.
(function(){
  const DEFAULT_STATUSES=[
    {id:'WS-REQUESTED',name:'Requested',control:'PENDING'},
    {id:'WS-OPEN',name:'Open',control:'ACTIVE'},
    {id:'WS-ASSIGNED',name:'Assigned',control:'ACTIVE'},
    {id:'WS-INPROGRESS',name:'Work In Progress',control:'ACTIVE'},
    {id:'WS-WAITPARTS',name:'Awaiting Parts',control:'ACTIVE'},
    {id:'WS-WAITSHUTDOWN',name:'Waiting Production Shutdown',control:'ACTIVE'},
    {id:'WS-COMPLETED',name:'Completed',control:'CLOSED'},
    {id:'WS-CANCELLED',name:'Cancelled',control:'CLOSED'}
  ];
  const MAINT_TYPES=['Corrective','Preventive','Inspection','Safety','Damage','Electrical','Upgrade','Project','Meter Reading'];
  const PROBLEMS=['Not selected','Leak','Noise / vibration','Overheating','No output','Low output','Electrical fault','Mechanical damage','Process deviation','Inspection finding','Other'];
  const CAUSES=['Not selected','Wear','Lack of lubrication','Contamination','Misalignment','Loose connection','Overload','Operator damage','Component failure','Unknown','Other'];
  const ACTIONS=['Not selected','Inspect','Adjust','Clean','Lubricate','Repair','Replace','Reset','Calibrate','Monitor','Other'];
  ui.v44WorkTab=ui.v44WorkTab||'overview';

  function ensureModel(){
    let changed=false;
    if(!Array.isArray(state.workStatusDefinitions)||!state.workStatusDefinitions.length){state.workStatusDefinitions=structuredClone(DEFAULT_STATUSES);changed=true}
    if(!Array.isArray(state.taskGroups)){state.taskGroups=[];changed=true}
    if(!state.workSettings){state.workSettings={requireAllTasksOnClose:true,requireLaborOnClose:true,requireCompletionNote:true,requireFailureCodesForCorrective:true};changed=true}
    state.users.forEach(u=>{if(u.hourlyRate===undefined){u.hourlyRate=0;changed=true}});
    state.scheduledMaintenance.forEach(pm=>{if(!pm.scheduleMode){pm.scheduleMode='Fixed';changed=true}if(!pm.assigneeGroupId){pm.assigneeGroupId=null}});
    state.workOrders.forEach(w=>{
      if(w.status==='In Progress'){w.status='Work In Progress';changed=true}
      if(w.status==='On Hold'){w.status='Awaiting Parts';changed=true}
      if(normalizeWork(w))changed=true
    });
    const ensureRule=(id,event,audiences)=>{
      if(!state.notificationRules.some(r=>r.event===event)){state.notificationRules.push({id,event,audiences,inApp:true,email:true});changed=true}
    };
    ensureRule('NR-WORK-STATUS','Work order status changed',['Assigned users','Maintenance planner']);
    ensureRule('NR-WORK-CLOSED','Work order closed',['Assigned users','Maintenance planner','Operations manager']);
    if(changed)saveState();
  }
  function normalizeWork(w){
    let changed=false;
    const set=(k,v)=>{if(w[k]===undefined){w[k]=v;changed=true}};
    set('labor',[]);set('miscCosts',[]);set('completionNote','');set('closedAt',w.completedAt||null);set('closedBy',null);set('failureNote','');
    if(!w.failureCodes){w.failureCodes={problem:'Not selected',cause:'Not selected',action:'Not selected'};changed=true}
    (w.tasks||[]).forEach(t=>{if(t.result===undefined){t.result=null;changed=true}if(t.resultNote===undefined){t.resultNote='';changed=true}if(t.assigneeId===undefined){t.assigneeId=null;changed=true}if(t.completedAt===undefined){t.completedAt=t.status==='Done'?iso():null;changed=true}});
    return changed;
  }
  ensureModel();

  function statusDef(name){return state.workStatusDefinitions.find(s=>s.name===name)||{name,control:['Completed','Cancelled'].includes(name)?'CLOSED':'ACTIVE'}}
  function controlOf(w){return statusDef(w.status).control}
  function isClosed(w){return controlOf(w)==='CLOSED'}
  function activeWork(){return state.workOrders.filter(w=>controlOf(w)==='ACTIVE')}
  function pendingWork(){return state.workOrders.filter(w=>controlOf(w)==='PENDING')}
  function closedWork(){return state.workOrders.filter(w=>controlOf(w)==='CLOSED')}
  window.safiWorkStatusControl=controlOf;

  function taskProgress(w){const all=w.tasks||[],done=all.filter(t=>t.status==='Done').length;return{done,total:all.length,pct:all.length?Math.round(done/all.length*100):0}}
  function assetText(w){return (w.assetIds||[]).map(id=>getAsset(id)?.name||id).join(', ')||'No asset'}
  function assigneeText(w){const people=(w.assigneeIds||[]).map(id=>getUser(id)?.name).filter(Boolean);const group=w.assigneeGroupId?getGroup(w.assigneeGroupId)?.name:null;return [...people,group].filter(Boolean).join(', ')||'Unassigned'}
  function laborCost(w){return (w.labor||[]).reduce((n,x)=>n+Number(x.hours||0)*Number(getUser(x.userId)?.hourlyRate||0),0)}
  function partsCost(w){return (w.parts||[]).reduce((n,x)=>n+Number(x.actual||0)*Number(getPart(x.partId)?.unitCost||0),0)}
  function miscCost(w){return (w.miscCosts||[]).reduce((n,x)=>n+Number(x.amount||0),0)}
  function totalCost(w){return laborCost(w)+partsCost(w)+miscCost(w)}
  function workHistory(w,text){w.history=w.history||[];w.history.unshift({at:iso(),text})}
  function fmtControl(w){const c=controlOf(w);return '<span class="v44-control '+c+'">'+c+'</span>'}

  function renderWorkOrdersV44(){
    ensureModel();
    const q=String(ui.workSearch||'').toLowerCase();
    const filter=ui.workStatus||'All statuses';
    const rows=state.workOrders.filter(w=>(filter==='All statuses'||w.status===filter)&&(!q||([w.id,w.title,w.status,w.priority,assetText(w),assigneeText(w)].join(' ').toLowerCase().includes(q))));
    const overdue=activeWork().filter(w=>w.due&&new Date(w.due)<new Date(new Date().toDateString())).length;
    const wait=activeWork().filter(w=>w.status==='Awaiting Parts').length;
    const thisMonth=closedWork().filter(w=>w.closedAt&&new Date(w.closedAt).getMonth()===new Date().getMonth()&&new Date(w.closedAt).getFullYear()===new Date().getFullYear()).length;
    return pageHead('Work management','Work orders','The operational center for planning, task execution, labor, parts, evidence, failure data, completion and asset history.',
      '<button class="button" type="button" data-v44-status-config>Workflow statuses</button><button class="button primary" data-action="new-work">＋ New work order</button>')+
      '<div class="v44-work-kpis"><div><small>Pending</small><strong>'+pendingWork().length+'</strong></div><div><small>Active</small><strong>'+activeWork().length+'</strong></div><div><small>Awaiting parts</small><strong>'+wait+'</strong></div><div><small>Overdue</small><strong>'+overdue+'</strong></div><div><small>Closed this month</small><strong>'+thisMonth+'</strong></div></div>'+
      '<section class="card"><div class="v44-work-toolbar"><input data-filter="work" value="'+esc(ui.workSearch||'')+'" placeholder="Search work orders, assets or assignees"><select data-work-status><option>All statuses</option>'+state.workStatusDefinitions.map(s=>'<option '+(filter===s.name?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select><span class="grow"></span><small class="muted">'+rows.length+' records</small></div>'+
      '<div class="table-wrap"><div class="v44-work-head"><div>Work order</div><div>Asset</div><div>Assigned</div><div>Tasks</div><div>Labor</div><div>Priority</div><div>Status</div><div>Cost</div></div>'+
      rows.map(w=>{const p=taskProgress(w);return '<button class="v44-work-row" type="button" data-open-work="'+esc(w.id)+'"><span><strong>'+esc(w.id)+' · '+esc(w.title)+'</strong><small>'+esc(w.type)+' · '+fmtControl(w)+'</small></span><span>'+esc(assetText(w))+'</span><span>'+esc(assigneeText(w))+'</span><span><strong>'+p.done+'/'+p.total+'</strong><small>'+p.pct+'% complete</small></span><span><strong>'+Number(w.actualHours||0).toFixed(2)+' h</strong><small>'+Number(w.estimateHours||0).toFixed(2)+' h est.</small></span><span>'+status(w.priority)+'</span><span>'+status(w.status)+'<small>'+fmtControl(w)+'</small></span><span><strong>'+money(totalCost(w))+'</strong><small>'+dateFmt(w.due)+'</small></span></button>'}).join('')+
      (!rows.length?'<div class="empty"><strong>No matching work orders</strong><span>Change the search or workflow-status filter.</span></div>':'')+'</div></section>';
  }
  renderWorkOrders=renderWorkOrdersV44;window.renderWorkOrders=renderWorkOrdersV44;

  function options(list,value){return list.map(x=>'<option '+(x===value?'selected':'')+'>'+esc(x)+'</option>').join('')}
  function tabButton(key,label){return '<button type="button" data-v44-tab="'+key+'" class="'+(ui.v44WorkTab===key?'active':'')+'">'+label+'</button>'}
  function summary(w){
    const p=taskProgress(w);
    return '<div class="v44-summary">'+
      '<div><small>Assets</small><strong>'+(w.assetIds||[]).map(id=>{const a=getAsset(id);return a?'<button type="button" data-open-asset="'+esc(a.id)+'">'+esc(a.code)+' · '+esc(a.name)+'</button>':esc(id)}).join('<br>')+'</strong></div>'+
      '<div><small>Assigned to</small><strong>'+esc(assigneeText(w))+'</strong></div>'+
      '<div><small>Due / priority</small><strong>'+dateFmt(w.due)+' · '+esc(w.priority)+'</strong></div>'+
      '<div><small>Source</small><strong>'+esc(w.source||'Manual')+'</strong></div>'+
      '<div><small>Task progress</small><strong>'+p.done+' / '+p.total+' · '+p.pct+'%</strong></div>'+
      '<div><small>Labor</small><strong>'+Number(w.actualHours||0).toFixed(2)+' h / '+Number(w.estimateHours||0).toFixed(2)+' h est.</strong></div>'+
      '<div><small>Maintenance type</small><strong>'+esc(w.type)+'</strong></div>'+
      '<div><small>Total cost</small><strong>'+money(totalCost(w))+'</strong></div>'+
    '</div>';
  }
  function overviewTab(w){
    return summary(w)+'<section class="v44-section"><div class="v44-section-head"><strong>Work instructions</strong><span>Execution scope</span></div><div class="v44-section-body" style="white-space:pre-wrap;font-size:10.5px;line-height:1.6">'+esc(w.instructions||'No instructions recorded.')+'</div></section>'+
      (isClosed(w)?'<div class="v44-readonly"><strong>Closed record.</strong> Reopen the work order before changing execution data. Closed work remains available for asset history, reporting and audit.</div>':'');
  }
  function taskKind(t){return t.type==='Inspection'?'INSP':t.type==='Meter'?'MTR':'TASK'}
  function taskResult(t){if(t.type==='Inspection')return t.result?('Inspection: '+t.result):'Result required';if(t.type==='Meter')return t.meterReading!==undefined&&t.meterReading!==null?('Reading: '+t.meterReading):'Reading required';return t.status==='Done'?'Completed':'To do'}
  function tasksTab(w){
    const readonly=isClosed(w);
    const userOptions=state.users.filter(u=>u.active).map(u=>'<option value="'+esc(u.id)+'">'+esc(u.name)+'</option>').join('');
    return '<section class="v44-section"><div class="v44-section-head"><strong>Tasks / procedure</strong><span>'+taskProgress(w).done+' of '+taskProgress(w).total+' complete</span></div>'+
      ((w.tasks||[]).length?(w.tasks||[]).map(t=>'<div class="v44-task '+(t.status==='Done'?'done':'')+'"><span class="v44-task-kind">'+taskKind(t)+'</span><div><strong>'+esc(t.text)+'</strong><small>'+esc(t.type||'General')+(t.assigneeId?' · '+esc(getUser(t.assigneeId)?.name||t.assigneeId):'')+(t.resultNote?' · '+esc(t.resultNote):'')+'</small></div><span class="v44-task-result">'+esc(taskResult(t))+'</span>'+(readonly?'':'<button class="button small" type="button" data-v44-task-action="'+esc(w.id)+'|'+esc(t.id)+'">'+(t.status==='Done'?'Reopen':'Record')+'</button>')+'</div>').join(''):'<div class="empty"><strong>No tasks yet</strong><span>Add structured maintenance steps or use a task group.</span></div>')+
      (readonly?'':'<div class="v44-add-task"><input data-v44-task-text placeholder="Task instruction"><select data-v44-task-type><option>General</option><option>Inspection</option><option>Meter</option></select><select data-v44-task-user><option value="">No task assignee</option>'+userOptions+'</select><button class="button primary" type="button" data-v44-add-task="'+esc(w.id)+'">Add task</button></div>')+
    '</section>';
  }
  function laborTab(w){
    const readonly=isClosed(w),users=state.users.filter(u=>u.active);
    return '<section class="v44-section"><div class="v44-section-head"><strong>Labor / work log</strong><span>'+Number(w.actualHours||0).toFixed(2)+' h · '+money(laborCost(w))+'</span></div>'+
      ((w.labor||[]).length?(w.labor||[]).map(x=>'<div class="w38-labor-row"><div><strong>'+esc(getUser(x.userId)?.name||x.userId)+'</strong><small>'+esc((w.tasks||[]).find(t=>t.id===x.taskId)?.text||'General work')+' · '+esc(x.note||'No note')+'</small></div><strong>'+Number(x.hours||0).toFixed(2)+' h</strong><small>'+money(Number(x.hours||0)*Number(getUser(x.userId)?.hourlyRate||0))+' · '+dateTimeFmt(x.at)+'</small></div>').join(''):'<div class="empty"><strong>No labor logged</strong><span>Technician hours drive labor cost and planning variance.</span></div>')+
      (readonly?'':'<div class="w38-labor-form"><select data-v44-labor-user>'+users.map(u=>'<option value="'+esc(u.id)+'">'+esc(u.name)+' · '+money(Number(u.hourlyRate||0))+'/h</option>').join('')+'</select><select data-v44-labor-task><option value="">General work</option>'+(w.tasks||[]).map(t=>'<option value="'+esc(t.id)+'">'+esc(t.text)+'</option>').join('')+'</select><input data-v44-labor-hours type="number" min=".01" step=".25" placeholder="Hours"><input data-v44-labor-note placeholder="Work performed / note"><button class="button primary" type="button" data-v44-log-labor="'+esc(w.id)+'">Log work</button></div>')+
    '</section>';
  }
  function partsTab(w){
    const readonly=isClosed(w);
    return '<section class="v44-section"><div class="v44-section-head"><strong>Parts & materials</strong><span>'+money(partsCost(w))+' consumed</span></div>'+
      ((w.parts||[]).length?(w.parts||[]).map(x=>{const p=getPart(x.partId);return '<div class="w38-part-row"><div><strong>'+esc(p?.code||x.partId)+' · '+esc(p?.name||'Unknown')+'</strong><small>'+partOnHand(p||{locations:[]})+' '+esc(p?.uom||'')+' on hand · '+money(Number(p?.unitCost||0))+' each</small></div><span>Planned <b>'+Number(x.planned||0)+'</b></span><span>Used <b>'+Number(x.actual||0)+'</b></span>'+(readonly?'':'<button class="button" type="button" data-v44-issue-part="'+esc(w.id)+'|'+esc(x.partId)+'">Issue</button>')+'</div>'}).join(''):'<div class="empty"><strong>No parts planned</strong><span>Add BOM or stock items required for this job.</span></div>')+
      (readonly?'':'<div class="w38-part-add"><select data-v44-part>'+state.parts.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.code)+' · '+esc(p.name)+' · '+partOnHand(p)+' '+esc(p.uom)+'</option>').join('')+'</select><input data-v44-part-qty type="number" min=".01" step=".01" value="1"><button class="button primary" type="button" data-v44-add-part="'+esc(w.id)+'">Add planned part</button></div>')+
    '</section>';
  }
  function filesTab(w){return '<section class="v44-section"><div class="v44-section-head"><strong>Files, photos & evidence</strong>'+(isClosed(w)?'<span>Read only</span>':'<span><button class="button small" type="button" data-work-file-pick="'+esc(w.id)+'">＋ Add files</button><input class="file-input-hidden" type="file" multiple data-work-file-input="'+esc(w.id)+'" accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,text/csv,.doc,.docx,.xls,.xlsx"></span>')+'</div><div class="attachment-list" data-work-file-list="'+esc(w.id)+'"><div class="attachment-empty"><strong>No files yet</strong>Add before/after photos, permits, manuals or inspection evidence.</div></div></section>'}
  function costsTab(w){
    const readonly=isClosed(w);
    return '<div class="v44-cost-grid"><div class="v44-cost"><small>Labor cost</small><strong>'+money(laborCost(w))+'</strong></div><div class="v44-cost"><small>Parts cost</small><strong>'+money(partsCost(w))+'</strong></div><div class="v44-cost"><small>Miscellaneous</small><strong>'+money(miscCost(w))+'</strong></div><div class="v44-cost"><small>Total work cost</small><strong>'+money(totalCost(w))+'</strong></div></div>'+
      '<section class="v44-section"><div class="v44-section-head"><strong>Miscellaneous costs</strong><span>Contractor, transport, rental or external services</span></div>'+
      ((w.miscCosts||[]).length?(w.miscCosts||[]).map(x=>'<div class="v44-misc-row"><strong>'+esc(x.description)+'</strong><span>'+money(Number(x.amount||0))+'</span>'+(readonly?'':'<button class="button small danger" data-v44-remove-cost="'+esc(w.id)+'|'+esc(x.id)+'">Remove</button>')+'</div>').join(''):'<div class="empty"><strong>No miscellaneous costs</strong><span>Labor and parts are already calculated separately.</span></div>')+
      (readonly?'':'<div class="v44-misc-add"><input data-v44-cost-desc placeholder="e.g. contractor, crane rental, transport"><input data-v44-cost-amount type="number" min="0" step=".01" placeholder="Amount"><button class="button primary" data-v44-add-cost="'+esc(w.id)+'">Add cost</button></div>')+
      '</section>';
  }
  function failureTab(w){
    const readonly=isClosed(w);
    if(readonly)return '<section class="v44-section"><div class="v44-section-head"><strong>Failure / corrective data</strong><span>Read only</span></div><div class="v44-section-body"><div class="v44-summary"><div><small>Problem</small><strong>'+esc(w.failureCodes.problem)+'</strong></div><div><small>Cause</small><strong>'+esc(w.failureCodes.cause)+'</strong></div><div><small>Action</small><strong>'+esc(w.failureCodes.action)+'</strong></div><div><small>Root-cause note</small><strong>'+esc(w.failureNote||'—')+'</strong></div></div></div></section>';
    return '<section class="v44-section"><div class="v44-section-head"><strong>Failure / corrective data</strong><span>Turns repairs into reliability history</span></div><div class="v44-section-body"><div class="w38-failure"><label>Problem<select data-v44-failure="problem">'+options(PROBLEMS,w.failureCodes.problem)+'</select></label><label>Cause<select data-v44-failure="cause">'+options(CAUSES,w.failureCodes.cause)+'</select></label><label>Action<select data-v44-failure="action">'+options(ACTIONS,w.failureCodes.action)+'</select></label><label class="wide">Root-cause / completion finding<textarea data-v44-failure-note placeholder="What failed, why, and what prevents recurrence?">'+esc(w.failureNote||'')+'</textarea></label></div><div style="margin-top:9px"><button class="button primary" data-v44-save-failure="'+esc(w.id)+'">Save failure data</button></div></div></section>';
  }
  function historyTab(w){return '<section class="v44-section"><div class="v44-section-head"><strong>Work log / audit history</strong><span>'+(w.history||[]).length+' events</span></div>'+((w.history||[]).length?(w.history||[]).map(h=>'<div class="w38-history-row"><i></i><div><strong>'+esc(h.text)+'</strong><small>'+dateTimeFmt(h.at)+'</small></div></div>').join(''):'<div class="empty"><strong>No history yet</strong></div>')+'</section>'}
  function bodyFor(w){return ui.v44WorkTab==='tasks'?tasksTab(w):ui.v44WorkTab==='labor'?laborTab(w):ui.v44WorkTab==='parts'?partsTab(w):ui.v44WorkTab==='files'?filesTab(w):ui.v44WorkTab==='costs'?costsTab(w):ui.v44WorkTab==='failure'?failureTab(w):ui.v44WorkTab==='history'?historyTab(w):overviewTab(w)}
  function openWorkV44(id){
    const w=getWork(id);if(!w)return;normalizeWork(w);
    const readonly=isClosed(w);
    openModal({eyebrow:w.id+' · '+w.type,title:w.title,body:'<div class="v44-record">'+
      '<div class="v44-record-banner"><div class="v44-record-title">'+status(w.status)+fmtControl(w)+'<strong>'+esc(assetText(w))+'</strong><small>'+esc(assigneeText(w))+'</small></div><div class="v44-record-actions">'+
        (readonly?'<button class="button primary" type="button" data-v44-reopen="'+esc(w.id)+'">Reopen work</button>':'<select data-v44-status="'+esc(w.id)+'">'+state.workStatusDefinitions.map(s=>'<option '+(s.name===w.status?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select>')+
      '</div></div>'+
      '<nav class="v44-tabs">'+tabButton('overview','Overview')+tabButton('tasks','Tasks')+tabButton('labor','Labor')+tabButton('parts','Parts')+tabButton('files','Files')+tabButton('costs','Costs')+tabButton('failure','Failure')+tabButton('history','History')+'</nav>'+bodyFor(w)+'</div>'});
    document.getElementById('modal')?.classList.add('w38-modal');
    setTimeout(()=>window.SafiFileUI?.paint('work',w.id,document.querySelector('[data-work-file-list="'+CSS.escape(w.id)+'"]')),0);
  }
  openWorkDrawer=openWorkV44;window.openWorkDrawer=openWorkV44;
  function refreshWork(id){closeModal();setTimeout(()=>openWorkV44(id),0)}

  function closureIssues(w){
    const issues=[];
    if(state.workSettings.requireAllTasksOnClose&&(w.tasks||[]).some(t=>t.status!=='Done'))issues.push('Complete all work-order tasks');
    if(state.workSettings.requireLaborOnClose&&Number(w.actualHours||0)<=0)issues.push('Log actual labor');
    if(state.workSettings.requireFailureCodesForCorrective&&w.type==='Corrective'&&['problem','cause','action'].some(k=>!w.failureCodes?.[k]||w.failureCodes[k]==='Not selected'))issues.push('Record Problem, Cause and Action failure codes');
    if(state.workSettings.requireCompletionNote&&!String(w.completionNote||'').trim())issues.push('Enter a completion note');
    return issues;
  }
  function closeDialog(w,targetStatus){
    const initial=closureIssues(w);
    openModal({eyebrow:'Work-order closure',title:'Close '+w.id,submitText:'Close work order',body:
      '<div class="notice info">Closing means no further work is expected. SafiMaintain keeps the record read-only until it is explicitly reopened.</div>'+
      '<div class="v44-close-check">'+
        '<div class="'+((w.tasks||[]).every(t=>t.status==='Done')?'ok':'bad')+'">'+((w.tasks||[]).every(t=>t.status==='Done')?'✓':'!')+' Mandatory tasks completed</div>'+
        '<div class="'+(Number(w.actualHours||0)>0?'ok':'bad')+'">'+(Number(w.actualHours||0)>0?'✓':'!')+' Actual labor recorded</div>'+
        '<div class="'+(w.type!=='Corrective'||!['problem','cause','action'].some(k=>!w.failureCodes?.[k]||w.failureCodes[k]==='Not selected')?'ok':'bad')+'">'+(w.type!=='Corrective'?'✓':(!['problem','cause','action'].some(k=>!w.failureCodes?.[k]||w.failureCodes[k]==='Not selected')?'✓':'!'))+' Failure data recorded</div>'+
      '</div>'+
      '<div class="form-grid">'+field('completionNote','Completion note',w.completionNote||'',{type:'textarea',required:true,span:true})+
      '<label class="check-row span-2"><input type="checkbox" name="returnAssets" checked> Return linked offline assets to service</label></div>'+
      (initial.length?'<div class="notice" style="margin-top:10px"><strong>Still required:</strong> '+esc(initial.join(' · '))+'</div>':''),
      onSubmit:fd=>{
        w.completionNote=String(fd.get('completionNote')||'').trim();
        const issues=closureIssues(w);if(issues.length){toast(issues[0]);return}
        const now=iso();w.status=targetStatus;w.completedAt=now;w.closedAt=now;w.closedBy=CURRENT_USER;
        workHistory(w,'Closed as '+targetStatus+' by '+(currentUser()?.name||'User')+' — '+w.completionNote);
        if(fd.get('returnAssets')==='on'){
          (w.assetIds||[]).forEach(aid=>{const a=getAsset(aid);if(!a||a.operatingState!=='Offline')return;a.operatingState='Online';delete a.offlineSince;delete a.downtimeReason;const d=state.downtime.find(x=>x.assetId===aid&&!x.endedAt);if(d){d.endedAt=now;d.returnToServiceNote=w.completionNote;d.returnedBy=CURRENT_USER}state.assetEvents.unshift({id:uid('AE'),assetId:aid,type:'Return to service',at:now,userId:CURRENT_USER,detail:'Returned online from '+w.id,workOrderId:w.id});dispatchEvent('Asset returned online',a.code+' is Online',a.name+' returned to service from '+w.id,{assetId:aid,relatedId:w.id})});
        }
        const pm=state.scheduledMaintenance.find(p=>p.id===w.source);
        if(pm&&pm.scheduleMode==='Floating'&&pm.triggerType==='Time'){const days=parseIntervalDays(pm.trigger);if(days)pm.nextDue=addDaysISO(now,days);pm.awaitingCompletionWorkOrderId=null}
        addAudit('WORK_ORDER_CLOSED',w.id,targetStatus+' · '+w.completionNote);dispatchEvent('Work order closed',w.id+' closed',w.title+' was closed as '+targetStatus,{assigneeIds:w.assigneeIds,relatedId:w.id});saveState();closeModal();render();toast(w.id+' closed');
      }});
  }
  function parseIntervalDays(text){const m=String(text||'').match(/(\d+(?:\.\d+)?)\s*day/i);return m?Number(m[1]):null}
  function addDaysISO(dateLike,days){const d=new Date(dateLike);d.setDate(d.getDate()+Number(days));return d.toISOString().slice(0,10)}

  function completeGeneralTask(w,t){
    openModal({eyebrow:'Task completion',title:t.text,submitText:'Complete task',body:'<div class="form-grid">'+field('hours','Time spent (hours)','0.25',{type:'number',min:0,step:'.25'})+field('note','Completion note','',{type:'textarea',span:true})+'</div>',onSubmit:fd=>{const hours=Number(fd.get('hours')||0),note=String(fd.get('note')||'').trim();t.status='Done';t.completedAt=iso();t.completedBy=CURRENT_USER;t.result='Completed';t.resultNote=note;if(hours>0){w.labor.push({id:uid('LAB'),userId:CURRENT_USER,taskId:t.id,hours,note,at:iso()});w.actualHours=Number(w.labor.reduce((n,x)=>n+Number(x.hours||0),0).toFixed(2))}if(w.status==='Open')w.status='Work In Progress';workHistory(w,'Task completed: '+t.text+(note?' — '+note:''));addAudit('WORK_TASK_COMPLETED',w.id,t.text);saveState();refreshWork(w.id)}});
  }
  function completeInspectionTask(w,t){
    openModal({eyebrow:'Inspection task',title:t.text,submitText:'Record inspection',body:'<div class="form-grid">'+field('result','Inspection result','PASS',{type:'select',options:[{value:'PASS',label:'PASS'},{value:'FAIL',label:'FAIL'}]})+field('hours','Time spent (hours)','0.25',{type:'number',min:0,step:'.25'})+field('note','Inspection notes','',{type:'textarea',required:true,span:true})+'<label class="check-row span-2"><input type="checkbox" name="followup" checked> Create corrective follow-up work when result is FAIL</label></div>',onSubmit:fd=>{const result=String(fd.get('result')),note=String(fd.get('note')||'').trim(),hours=Number(fd.get('hours')||0);t.status='Done';t.completedAt=iso();t.completedBy=CURRENT_USER;t.result=result;t.resultNote=note;if(hours>0){w.labor.push({id:uid('LAB'),userId:CURRENT_USER,taskId:t.id,hours,note:'Inspection: '+note,at:iso()});w.actualHours=Number(w.labor.reduce((n,x)=>n+Number(x.hours||0),0).toFixed(2))}workHistory(w,'Inspection '+result+': '+t.text+' — '+note);if(result==='FAIL'&&fd.get('followup')==='on'){const fw={id:uid('WO'),title:'Follow-up: '+t.text,assetIds:[...(w.assetIds||[])],type:'Corrective',priority:['Critical','High'].includes(w.priority)?w.priority:'High',status:'Open',assigneeIds:[...(w.assigneeIds||[])],assigneeGroupId:w.assigneeGroupId||null,due:day(1),estimateHours:1,actualHours:0,source:w.id+' · inspection '+t.id,instructions:'Inspection failed on '+w.id+'. Finding: '+note,tasks:[{id:uid('T'),text:'Investigate and correct failed inspection: '+t.text,type:'General',status:'Todo',result:null,resultNote:'',assigneeId:null,completedAt:null}],parts:[],labor:[],miscCosts:[],failureCodes:{problem:'Inspection finding',cause:'Not selected',action:'Not selected'},failureNote:note,completionNote:'',createdAt:iso(),completedAt:null,closedAt:null,closedBy:null,history:[{at:iso(),text:'Created automatically from failed inspection '+w.id+' / '+t.id}]};state.workOrders.unshift(fw);workHistory(w,'Follow-up work '+fw.id+' created from failed inspection');dispatchEvent('Work order assigned',fw.id+' created',fw.title,{assigneeIds:fw.assigneeIds,relatedId:fw.id})}addAudit('WORK_INSPECTION_RECORDED',w.id,t.text+'='+result);saveState();refreshWork(w.id)}});
  }
  function completeMeterTask(w,t){
    const meters=state.meters.filter(m=>(w.assetIds||[]).includes(m.assetId));
    if(!meters.length){toast('No meter is linked to the work-order assets');return}
    openModal({eyebrow:'Meter-reading task',title:t.text,submitText:'Post reading',body:'<div class="form-grid">'+field('meterId','Meter',meters[0].id,{type:'select',options:meters.map(m=>({value:m.id,label:(getAsset(m.assetId)?.code||m.assetId)+' · '+m.name+' · current '+m.current+' '+m.unit}))})+field('value','New reading','',{type:'number',required:true,step:'.01'})+field('hours','Time spent (hours)','0.1',{type:'number',min:0,step:'.1'})+field('note','Reading note','',{span:true})+'</div>',onSubmit:fd=>{const meter=state.meters.find(m=>m.id===String(fd.get('meterId'))),value=Number(fd.get('value')),hours=Number(fd.get('hours')||0),note=String(fd.get('note')||'');if(!meter||!Number.isFinite(value)){toast('Enter a valid reading');return}if(value<Number(meter.current)){toast('Reading cannot be lower than the current meter value');return}meter.current=value;meter.readings.push({value,at:iso(),userId:CURRENT_USER,note,workOrderId:w.id,taskId:t.id});t.status='Done';t.completedAt=iso();t.completedBy=CURRENT_USER;t.result='Reading';t.meterId=meter.id;t.meterReading=value;t.resultNote=note;if(hours>0){w.labor.push({id:uid('LAB'),userId:CURRENT_USER,taskId:t.id,hours,note:'Meter reading '+value+' '+meter.unit,at:iso()});w.actualHours=Number(w.labor.reduce((n,x)=>n+Number(x.hours||0),0).toFixed(2))}workHistory(w,'Meter task completed: '+meter.name+' = '+value+' '+meter.unit);evaluateMeterPM(meter);addAudit('WORK_METER_READING',w.id,meter.id+'='+value+' '+meter.unit);saveState();refreshWork(w.id)}});
  }
  function evaluateMeterPM(meter){
    state.scheduledMaintenance.filter(pm=>pm.status==='Active'&&pm.triggerType==='Meter'&&pm.assetId===meter.assetId).forEach(pm=>{const threshold=Number(String(pm.nextDue||'').replace(/[^0-9.]/g,''));if(!Number.isFinite(threshold)||Number(meter.current)<threshold)return;if(state.workOrders.some(w=>w.source===pm.id&&controlOf(w)!=='CLOSED'))return;generatePM(pm.id)});
  }

  function renderPMV44(){
    ensureModel();
    return pageHead('Work management','Scheduled maintenance','Reusable maintenance templates with fixed/floating time schedules, meter triggers and task groups.',
      '<button class="button" data-v44-new-taskgroup>＋ Task group</button><button class="button primary" data-action="add-pm">＋ Scheduled maintenance</button>')+
      '<div class="v44-pm-grid"><section class="card">'+table(['Plan','Asset','Trigger','Cadence','Next due','Task source','Status',''],state.scheduledMaintenance.map(pm=>'<tr><td><span class="cell-title">'+esc(pm.id)+'</span><span class="cell-sub">'+esc(pm.name)+'</span></td><td>'+esc(getAsset(pm.assetId)?.name||pm.assetId)+'</td><td>'+esc(pm.triggerType)+' · '+esc(pm.trigger)+'</td><td>'+esc(pm.scheduleMode||'Fixed')+'</td><td>'+esc(pm.nextDue||'—')+'</td><td>'+esc(pm.taskGroupId?state.taskGroups.find(g=>g.id===pm.taskGroupId)?.name||'Task group':(pm.taskTemplate||[]).length+' tasks')+'</td><td>'+status(pm.status)+'</td><td class="right"><button class="button small" data-generate-pm="'+esc(pm.id)+'">Generate work</button></td></tr>'),'No scheduled maintenance')+'</section>'+
      '<section class="card"><div class="card-head"><div><h2>Task groups / SOPs</h2><p>Reusable maintenance procedures for repetitive work</p></div></div><div class="v44-taskgroups">'+(state.taskGroups.length?state.taskGroups.map(g=>'<div class="v44-taskgroup"><strong>'+esc(g.name)+'</strong><small>'+esc(g.description||'Reusable procedure')+' · '+g.tasks.length+' tasks</small><ol>'+g.tasks.slice(0,6).map(t=>'<li>'+esc(t.text)+' <small>('+esc(t.type)+')</small></li>').join('')+'</ol></div>').join(''):'<div class="empty"><strong>No task groups yet</strong><span>Create an SOP once and reuse it on scheduled or corrective work.</span></div>')+'</div></section></div>';
  }
  renderPM=renderPMV44;window.renderPM=renderPMV44;

  function showNewPMV44(){
    const assets=state.assets.filter(a=>a.type!=='Site'),groups=state.groups||[];
    openModal({eyebrow:'Scheduled maintenance',title:'Create maintenance plan',submitText:'Create plan',body:'<div class="form-grid">'+
      field('name','Plan name','',{required:true,span:true})+
      field('assetId','Asset',assets[0]?.id||'',{type:'select',options:assets.map(a=>({value:a.id,label:a.code+' · '+a.name}))})+
      field('triggerType','Trigger type','Time',{type:'select',options:['Time','Meter','Event'].map(x=>({value:x,label:x}))})+
      field('trigger','Trigger / interval','Every 30 days',{required:true})+
      field('nextDue','Next due / threshold',day(30),{required:true})+
      field('scheduleMode','Schedule mode','Fixed',{type:'select',options:[{value:'Fixed',label:'Fixed — keep planned cadence'},{value:'Floating',label:'Floating — next interval starts after completion'}]})+
      field('taskGroupId','Task group / SOP','',{type:'select',options:[{value:'',label:'No task group — use task lines below'},...state.taskGroups.map(g=>({value:g.id,label:g.name}))]})+
      field('assigneeGroupId','Assigned group','',{type:'select',options:[{value:'',label:'No default group'},...groups.map(g=>({value:g.id,label:g.name}))]})+
      field('tasks','Tasks (one per line)','',{type:'textarea',span:true})+
      '</div>',onSubmit:fd=>{const gid=String(fd.get('taskGroupId')||''),group=state.taskGroups.find(g=>g.id===gid);const pm={id:uid('PM'),name:String(fd.get('name')),assetId:String(fd.get('assetId')),status:'Active',triggerType:String(fd.get('triggerType')),trigger:String(fd.get('trigger')),nextDue:String(fd.get('nextDue')),scheduleMode:String(fd.get('scheduleMode')||'Fixed'),taskGroupId:gid||null,assigneeGroupId:String(fd.get('assigneeGroupId')||'')||null,lastGenerated:null,taskTemplate:group?group.tasks.map(t=>t.text):String(fd.get('tasks')||'').split('\n').map(x=>x.trim()).filter(Boolean),requiredParts:[]};state.scheduledMaintenance.unshift(pm);addAudit('PM_PLAN_CREATED',pm.id,pm.name+' · '+pm.scheduleMode);saveState();closeModal();render();toast(pm.id+' created')}});
  }
  showNewPM=showNewPMV44;window.showNewPM=showNewPMV44;

  function generatePMV44(id){
    const pm=state.scheduledMaintenance.find(x=>x.id===id);if(!pm||pm.status!=='Active')return;
    if(state.workOrders.some(w=>w.source===pm.id&&controlOf(w)!=='CLOSED')){toast('An open work order already exists for '+pm.id);return}
    const asset=getAsset(pm.assetId),group=state.taskGroups.find(g=>g.id===pm.taskGroupId);
    const tasks=group?group.tasks.map(t=>({id:uid('T'),text:t.text,type:t.type||'General',status:'Todo',assigneeId:t.assigneeId||null,result:null,resultNote:'',completedAt:null})):(pm.taskTemplate||[]).map(text=>({id:uid('T'),text,type:'General',status:'Todo',assigneeId:null,result:null,resultNote:'',completedAt:null}));
    const users=pm.assigneeGroupId?state.users.filter(u=>u.active&&(u.groupIds||[]).includes(pm.assigneeGroupId)).map(u=>u.id):asset?.ownerUserId?[asset.ownerUserId]:[];
    const wo={id:uid('WO'),title:pm.name,assetIds:[pm.assetId],type:'Preventive',priority:asset?.criticality==='A'?'High':'Medium',status:users.length?'Assigned':'Open',assigneeIds:users,assigneeGroupId:pm.assigneeGroupId||null,due:pm.triggerType==='Time'&&/^\d{4}-\d{2}-\d{2}$/.test(String(pm.nextDue))?String(pm.nextDue):day(2),estimateHours:2,actualHours:0,source:pm.id,instructions:'Generated from scheduled maintenance '+pm.id+'.',tasks,parts:(pm.requiredParts||[]).map(x=>({partId:x.partId,planned:x.qty,actual:0})),labor:[],miscCosts:[],failureCodes:{problem:'Not selected',cause:'Not selected',action:'Not selected'},failureNote:'',completionNote:'',createdAt:iso(),completedAt:null,closedAt:null,closedBy:null,history:[{at:iso(),text:'Generated automatically from '+pm.id}]};
    state.workOrders.unshift(wo);pm.lastGenerated=iso();
    if(pm.triggerType==='Time'&&pm.scheduleMode==='Fixed'){const days=parseIntervalDays(pm.trigger);if(days)pm.nextDue=addDaysISO(pm.nextDue||iso(),days)}
    if(pm.triggerType==='Time'&&pm.scheduleMode==='Floating')pm.awaitingCompletionWorkOrderId=wo.id;
    if(pm.triggerType==='Meter'){const threshold=Number(String(pm.nextDue||'').replace(/[^0-9.]/g,'')),interval=Number(String(pm.trigger||'').replace(/[^0-9.]/g,''));if(Number.isFinite(threshold)&&Number.isFinite(interval)&&interval>0){const meter=state.meters.find(m=>m.assetId===pm.assetId);pm.nextDue=(threshold+interval).toLocaleString()+' '+(meter?.unit||'')}}
    dispatchEvent('Work order assigned',wo.id+' assigned',wo.title+' was generated from '+pm.id,{assigneeIds:wo.assigneeIds,relatedId:wo.id});addAudit('PM_WORK_GENERATED',pm.id,wo.id+' created · '+pm.scheduleMode);saveState();render();toast(wo.id+' generated');
  }
  generatePM=generatePMV44;window.generatePM=generatePMV44;

  function autoGenerateDuePM(){
    const today=day(0);
    state.scheduledMaintenance.filter(pm=>pm.status==='Active'&&pm.triggerType==='Time'&&/^\d{4}-\d{2}-\d{2}$/.test(String(pm.nextDue))&&pm.nextDue<=today).forEach(pm=>{if(!state.workOrders.some(w=>w.source===pm.id&&controlOf(w)!=='CLOSED'))generatePMV44(pm.id)});
  }

  function renderPeopleV44(){
    return pageHead('Administration','People & groups','People, maintenance responsibilities, access context and labor costing.','<button class="button" data-action="add-user">＋ Add person</button>')+
      '<section class="card">'+table(['Person','Role','Groups','Labor rate','MFA','Status',''],state.users.map(u=>'<tr><td><span class="cell-title">'+esc(u.name)+'</span><span class="cell-sub">'+esc(u.email)+'</span></td><td>'+esc(getRole(u.roleId)?.name||u.roleId)+'</td><td>'+esc((u.groupIds||[]).map(id=>getGroup(id)?.name).filter(Boolean).join(', ')||'—')+'</td><td><span class="v44-rate"><b>'+money(Number(u.hourlyRate||0))+'/h</b><button class="button small" data-v44-rate="'+esc(u.id)+'">Edit</button></span></td><td>'+(u.mfa?status('Enabled'):status('Not enrolled'))+'</td><td>'+status(u.active?'Active':'Inactive')+'</td><td class="right"><button class="button small" data-toggle-user="'+esc(u.id)+'">'+(u.active?'Deactivate':'Activate')+'</button></td></tr>'),'No people')+'</section>'+
      '<div class="grid two" style="margin-top:14px"><section class="card"><div class="card-head"><div><h2>Groups</h2><p>Assignment, notification and responsibility groups</p></div></div>'+table(['Group','Manager','Members'],state.groups.map(g=>'<tr><td><b>'+esc(g.name)+'</b></td><td>'+esc(getUser(g.managerId)?.name||'—')+'</td><td>'+state.users.filter(u=>(u.groupIds||[]).includes(g.id)).length+'</td></tr>'),'No groups')+'</section><section class="card pad"><h3 style="margin-top:0">Labor costing</h3><p class="muted">Logged work hours × each technician\'s labor rate become work-order labor cost. Parts and miscellaneous costs are added separately.</p></section></div>';
  }
  renderPeople=renderPeopleV44;window.renderPeople=renderPeopleV44;

  function renderReliabilityV44(){
    ensureModel();
    const equip=state.assets.filter(a=>['Equipment','Subassembly'].includes(a.type)),offline=equip.filter(a=>a.operatingState==='Offline');
    const closed=closedWork().filter(w=>w.status==='Completed'),corrective=state.workOrders.filter(w=>w.type==='Corrective'),corrClosed=corrective.filter(w=>isClosed(w)&&w.completedAt);
    const mttr=corrClosed.length?corrClosed.reduce((n,w)=>n+Math.max(0,(new Date(w.completedAt)-new Date(w.createdAt))/3600000),0)/corrClosed.length:0;
    const preventive=state.workOrders.filter(w=>w.type==='Preventive'),pmClosed=preventive.filter(w=>isClosed(w)).length,pmCompliance=preventive.length?Math.round(pmClosed/preventive.length*100):100;
    const overdue=activeWork().filter(w=>w.due&&new Date(w.due)<new Date(new Date().toDateString())).length;
    const laborHours=state.workOrders.reduce((n,w)=>n+Number(w.actualHours||0),0),cost=state.workOrders.reduce((n,w)=>n+totalCost(w),0);
    const assetCosts=equip.map(a=>({a,cost:state.workOrders.filter(w=>(w.assetIds||[]).includes(a.id)).reduce((n,w)=>n+totalCost(w),0),failures:corrective.filter(w=>(w.assetIds||[]).includes(a.id)).length})).sort((x,y)=>y.cost-x.cost);
    return pageHead('Insights','Reliability & maintenance performance','KPIs calculated from actual work, downtime, labor, parts, failure and PM records.')+
      '<div class="v44-report-grid"><div><small>Availability</small><strong>'+(equip.length?Math.round((equip.length-offline.length)/equip.length*100):100)+'%</strong><span>'+offline.length+' equipment offline</span></div><div><small>PM compliance</small><strong>'+pmCompliance+'%</strong><span>'+pmClosed+' / '+preventive.length+' PM work closed</span></div><div><small>MTTR</small><strong>'+mttr.toFixed(1)+' h</strong><span>Completed corrective work</span></div><div><small>Active backlog</small><strong>'+activeWork().length+'</strong><span>'+overdue+' overdue</span></div><div><small>Labor logged</small><strong>'+laborHours.toFixed(1)+' h</strong><span>Across all work orders</span></div><div><small>Maintenance cost</small><strong>'+money(cost)+'</strong><span>Labor + parts + misc.</span></div></div>'+
      '<div class="grid two"><section class="card"><div class="card-head"><div><h2>Maintenance cost by asset</h2><p>Work-order costs accumulated against equipment</p></div></div>'+table(['Asset','Work cost','Corrective jobs'],assetCosts.map(x=>'<tr><td><span class="cell-title">'+esc(x.a.code)+' · '+esc(x.a.name)+'</span></td><td>'+money(x.cost)+'</td><td>'+x.failures+'</td></tr>'),'No equipment')+'</section><section class="card"><div class="card-head"><div><h2>Planned vs reactive work</h2><p>Maintenance mix and current risk</p></div></div>'+table(['Maintenance type','Total','Active','Closed'],MAINT_TYPES.map(type=>{const all=state.workOrders.filter(w=>w.type===type);return all.length?'<tr><td><b>'+esc(type)+'</b></td><td>'+all.length+'</td><td>'+all.filter(w=>controlOf(w)==='ACTIVE').length+'</td><td>'+all.filter(w=>controlOf(w)==='CLOSED').length+'</td></tr>':''}).filter(Boolean),'No work history')+'</section></div>';
  }
  renderReliability=renderReliabilityV44;window.renderReliability=renderReliabilityV44;

  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-v44-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();const id=String(document.querySelector('.modal-head p')?.textContent||'').split(' · ')[0];ui.v44WorkTab=tab.dataset.v44Tab;refreshWork(id);return}
    const task=e.target.closest('[data-v44-task-action]');if(task){e.preventDefault();e.stopImmediatePropagation();const [wid,tid]=task.dataset.v44TaskAction.split('|'),w=getWork(wid),t=w?.tasks?.find(x=>String(x.id)===tid);if(!w||!t)return;if(t.status==='Done'){t.status='Todo';t.completedAt=null;t.completedBy=null;t.result=null;t.resultNote='';workHistory(w,'Task reopened: '+t.text);saveState();refreshWork(w.id);return}if(t.type==='Inspection')completeInspectionTask(w,t);else if(t.type==='Meter')completeMeterTask(w,t);else completeGeneralTask(w,t);return}
    const add=e.target.closest('[data-v44-add-task]');if(add){e.preventDefault();e.stopImmediatePropagation();const w=getWork(add.dataset.v44AddTask),box=e.target.closest('.v44-add-task'),text=box?.querySelector('[data-v44-task-text]')?.value.trim(),type=box?.querySelector('[data-v44-task-type]')?.value||'General',assigneeId=box?.querySelector('[data-v44-task-user]')?.value||null;if(!w||!text){toast('Enter a task instruction');return}w.tasks.push({id:uid('T'),text,type,status:'Todo',assigneeId,result:null,resultNote:'',completedAt:null});workHistory(w,'Task added: '+text);addAudit('WORK_TASK_ADDED',w.id,text+' · '+type);saveState();refreshWork(w.id);return}
    const log=e.target.closest('[data-v44-log-labor]');if(log){e.preventDefault();e.stopImmediatePropagation();const w=getWork(log.dataset.v44LogLabor),box=e.target.closest('.w38-labor-form'),hours=Number(box?.querySelector('[data-v44-labor-hours]')?.value||0);if(!w||!(hours>0)){toast('Enter labor hours greater than zero');return}const userId=box.querySelector('[data-v44-labor-user]')?.value||CURRENT_USER,taskId=box.querySelector('[data-v44-labor-task]')?.value||null,note=box.querySelector('[data-v44-labor-note]')?.value.trim()||'';w.labor.push({id:uid('LAB'),userId,taskId,hours,note,at:iso()});w.actualHours=Number(w.labor.reduce((n,x)=>n+Number(x.hours||0),0).toFixed(2));if(w.status==='Open'||w.status==='Assigned')w.status='Work In Progress';workHistory(w,hours.toFixed(2)+' h logged by '+(getUser(userId)?.name||userId)+(note?' — '+note:''));addAudit('WORK_LABOR_LOGGED',w.id,hours+' h');saveState();refreshWork(w.id);return}
    const addPart=e.target.closest('[data-v44-add-part]');if(addPart){e.preventDefault();e.stopImmediatePropagation();const w=getWork(addPart.dataset.v44AddPart),box=e.target.closest('.w38-part-add'),partId=box?.querySelector('[data-v44-part]')?.value,qty=Number(box?.querySelector('[data-v44-part-qty]')?.value||0);if(!w||!partId||!(qty>0)){toast('Choose a part and quantity');return}let line=w.parts.find(x=>x.partId===partId);if(line)line.planned=Number(line.planned||0)+qty;else w.parts.push({partId,planned:qty,actual:0});workHistory(w,'Planned '+qty+' '+(getPart(partId)?.uom||'')+' '+(getPart(partId)?.code||partId));saveState();refreshWork(w.id);return}
    const issue=e.target.closest('[data-v44-issue-part]');if(issue){e.preventDefault();e.stopImmediatePropagation();const [wid,pid]=issue.dataset.v44IssuePart.split('|'),w=getWork(wid),p=getPart(pid);if(!w||!p)return;const qty=Number(prompt('Quantity to issue to '+wid,'1'));if(!(qty>0))return;const loc=(p.locations||[]).find(l=>Number(l.onHand||0)>=qty);if(!loc){w.status='Awaiting Parts';workHistory(w,'Moved to Awaiting Parts — insufficient '+p.code);saveState();toast('Insufficient stock. Work order moved to Awaiting Parts');refreshWork(w.id);return}try{postStock(p.id,'Issue',qty,loc.storeId,loc.bin,{reference:wid,workOrderId:wid,note:'Issued from work order'});workHistory(w,qty+' '+p.uom+' '+p.code+' issued from inventory');saveState();refreshWork(w.id)}catch(err){toast(err.message)}return}
    const addCost=e.target.closest('[data-v44-add-cost]');if(addCost){e.preventDefault();e.stopImmediatePropagation();const w=getWork(addCost.dataset.v44AddCost),box=e.target.closest('.v44-misc-add'),description=box?.querySelector('[data-v44-cost-desc]')?.value.trim(),amount=Number(box?.querySelector('[data-v44-cost-amount]')?.value||0);if(!w||!description||!(amount>0)){toast('Enter a cost description and amount');return}w.miscCosts.push({id:uid('COST'),description,amount,at:iso(),userId:CURRENT_USER});workHistory(w,'Miscellaneous cost added: '+description+' · '+money(amount));addAudit('WORK_MISC_COST',w.id,description+' '+amount);saveState();refreshWork(w.id);return}
    const remCost=e.target.closest('[data-v44-remove-cost]');if(remCost){e.preventDefault();e.stopImmediatePropagation();const [wid,cid]=remCost.dataset.v44RemoveCost.split('|'),w=getWork(wid);if(!w)return;w.miscCosts=w.miscCosts.filter(x=>x.id!==cid);saveState();refreshWork(w.id);return}
    const saveFailure=e.target.closest('[data-v44-save-failure]');if(saveFailure){e.preventDefault();e.stopImmediatePropagation();const w=getWork(saveFailure.dataset.v44SaveFailure);if(!w)return;document.querySelectorAll('[data-v44-failure]').forEach(el=>w.failureCodes[el.dataset.v44Failure]=el.value);w.failureNote=document.querySelector('[data-v44-failure-note]')?.value.trim()||'';workHistory(w,'Failure data updated: '+w.failureCodes.problem+' / '+w.failureCodes.cause+' / '+w.failureCodes.action);addAudit('WORK_FAILURE_UPDATED',w.id,w.failureCodes.problem+' / '+w.failureCodes.cause+' / '+w.failureCodes.action);saveState();toast('Failure data saved');refreshWork(w.id);return}
    const reopen=e.target.closest('[data-v44-reopen]');if(reopen){e.preventDefault();e.stopImmediatePropagation();const w=getWork(reopen.dataset.v44Reopen);if(!w)return;if(!confirm('Reopen '+w.id+' for additional work?'))return;w.status='Work In Progress';w.closedAt=null;w.closedBy=null;w.completedAt=null;workHistory(w,'Work order reopened by '+(currentUser()?.name||'User'));addAudit('WORK_ORDER_REOPENED',w.id,w.title);saveState();refreshWork(w.id);return}
    if(e.target.closest('[data-v44-status-config]')){e.preventDefault();e.stopImmediatePropagation();openModal({eyebrow:'Work management',title:'Workflow statuses',submitText:'Add status',body:'<div class="notice info">Display names can match your company terminology while the control keeps workflow logic stable: PENDING, ACTIVE or CLOSED.</div><div style="margin-top:10px">'+state.workStatusDefinitions.map(s=>'<div class="setting-row"><div><strong>'+esc(s.name)+'</strong><small>'+esc(s.id)+'</small></div><span class="v44-control '+esc(s.control)+'">'+esc(s.control)+'</span></div>').join('')+'</div><div class="form-grid" style="margin-top:12px">'+field('name','New status name','',{required:true})+field('control','Status control','ACTIVE',{type:'select',options:['PENDING','ACTIVE','CLOSED'].map(x=>({value:x,label:x}))})+'</div>',onSubmit:fd=>{const name=String(fd.get('name')||'').trim();if(!name)return;if(state.workStatusDefinitions.some(s=>s.name.toLowerCase()===name.toLowerCase())){toast('That status already exists');return}state.workStatusDefinitions.push({id:uid('WS'),name,control:String(fd.get('control'))});addAudit('WORK_STATUS_CREATED',name,String(fd.get('control')));saveState();closeModal();render();toast('Workflow status added')}});return}
    if(e.target.closest('[data-v44-new-taskgroup]')){e.preventDefault();e.stopImmediatePropagation();openModal({eyebrow:'Task groups / SOPs',title:'Create reusable task group',submitText:'Create task group',body:'<div class="form-grid">'+field('name','Task group name','',{required:true,span:true})+field('description','Description','',{span:true})+field('tasks','Tasks — one per line','',{type:'textarea',required:true,span:true})+field('types','Task types — optional, one per line','General\nGeneral\nInspection',{type:'textarea',span:true})+'</div>',onSubmit:fd=>{const lines=String(fd.get('tasks')||'').split('\n').map(x=>x.trim()).filter(Boolean),types=String(fd.get('types')||'').split('\n').map(x=>x.trim());if(!lines.length){toast('Add at least one task');return}const g={id:uid('TG'),name:String(fd.get('name')),description:String(fd.get('description')||''),tasks:lines.map((text,i)=>({id:uid('TGT'),text,type:['General','Inspection','Meter'].includes(types[i])?types[i]:'General',assigneeId:null}))};state.taskGroups.push(g);addAudit('TASK_GROUP_CREATED',g.id,g.name+' · '+g.tasks.length+' tasks');saveState();closeModal();render();toast('Task group created')}});return}
    const rate=e.target.closest('[data-v44-rate]');if(rate){e.preventDefault();e.stopImmediatePropagation();const u=getUser(rate.dataset.v44Rate);if(!u)return;openModal({eyebrow:'Labor costing',title:'Set rate · '+u.name,submitText:'Save rate',body:'<div class="form-grid">'+field('rate','Hourly labor rate',String(u.hourlyRate||0),{type:'number',min:0,step:'.01'})+'</div>',onSubmit:fd=>{u.hourlyRate=Number(fd.get('rate')||0);addAudit('USER_LABOR_RATE_UPDATED',u.id,String(u.hourlyRate));saveState();closeModal();render();toast('Labor rate saved')}});return}
  },true);

  document.addEventListener('change',e=>{
    const statusSelect=e.target.closest('[data-v44-status]');if(!statusSelect)return;
    e.preventDefault();e.stopImmediatePropagation();const w=getWork(statusSelect.dataset.v44Status);if(!w)return;const next=statusSelect.value,def=statusDef(next);
    if(def.control==='CLOSED'){closeModal();setTimeout(()=>closeDialog(w,next),0);return}
    const prev=w.status;w.status=next;if(next==='Work In Progress'&&!w.startedAt)w.startedAt=iso();workHistory(w,'Status changed '+prev+' → '+next+' by '+(currentUser()?.name||'User'));addAudit('WORK_STATUS_CHANGED',w.id,prev+' → '+next);dispatchEvent('Work order status changed',w.id+' → '+next,w.title,{assigneeIds:w.assigneeIds,relatedId:w.id});saveState();refreshWork(w.id);
  },true);

  const previousShowNewWork=showNewWork;
  showNewWork=function(){
    const assets=state.assets.filter(a=>a.type!=='Site'),users=state.users.filter(u=>u.active),groups=state.groups||[];
    openModal({eyebrow:'Work management',title:'Create work order',submitText:'Create work order',body:'<div class="form-grid">'+
      field('title','Issue / work summary','',{required:true,span:true})+
      field('assetId','Primary asset',assets[0]?.id||'',{type:'select',options:assets.map(a=>({value:a.id,label:a.code+' · '+a.name}))})+
      field('type','Maintenance type','Corrective',{type:'select',options:MAINT_TYPES.map(x=>({value:x,label:x}))})+
      field('priority','Priority','Medium',{type:'select',options:['Low','Medium','High','Critical'].map(x=>({value:x,label:x}))})+
      field('status','Initial status','Open',{type:'select',options:state.workStatusDefinitions.filter(s=>s.control!=='CLOSED').map(s=>({value:s.name,label:s.name+' · '+s.control}))})+
      field('assigneeId','Assigned technician','',{type:'select',options:[{value:'',label:'Unassigned'},...users.map(u=>({value:u.id,label:u.name}))]})+
      field('assigneeGroupId','Assigned group','',{type:'select',options:[{value:'',label:'No group'},...groups.map(g=>({value:g.id,label:g.name}))]})+
      field('due','Suggested completion date',day(2),{type:'date',required:true})+
      field('estimateHours','Estimated labor (hours)','1',{type:'number',min:0,step:'.25'})+
      field('taskGroupId','Task group / SOP','',{type:'select',options:[{value:'',label:'No task group'},...state.taskGroups.map(g=>({value:g.id,label:g.name}))]})+
      field('instructions','Instructions / safety / acceptance criteria','',{type:'textarea',span:true})+
      '</div>',onSubmit:fd=>{const aid=String(fd.get('assetId')),group=state.taskGroups.find(g=>g.id===String(fd.get('taskGroupId')||'')),assigneeId=String(fd.get('assigneeId')||''),assigneeGroupId=String(fd.get('assigneeGroupId')||'');const w={id:uid('WO'),title:String(fd.get('title')),assetIds:[aid],type:String(fd.get('type')),priority:String(fd.get('priority')),status:String(fd.get('status')),assigneeIds:assigneeId?[assigneeId]:[],assigneeGroupId:assigneeGroupId||null,due:String(fd.get('due')),estimateHours:Number(fd.get('estimateHours')||0),actualHours:0,source:'Manual',instructions:String(fd.get('instructions')||''),tasks:group?group.tasks.map(t=>({id:uid('T'),text:t.text,type:t.type,status:'Todo',assigneeId:t.assigneeId||null,result:null,resultNote:'',completedAt:null})):[],parts:[],labor:[],miscCosts:[],failureCodes:{problem:'Not selected',cause:'Not selected',action:'Not selected'},failureNote:'',completionNote:'',createdAt:iso(),completedAt:null,closedAt:null,closedBy:null,history:[{at:iso(),text:'Created by '+(currentUser()?.name||'User')}]};state.workOrders.unshift(w);addAudit('WORK_ORDER_CREATED',w.id,w.title);dispatchEvent('Work order assigned',w.id+' assigned',w.title,{assigneeIds:w.assigneeIds,relatedId:w.id});saveState();closeModal();ui.route='work-orders';render();toast(w.id+' created')}});
  };
  window.showNewWork=showNewWork;

  setTimeout(()=>{try{autoGenerateDuePM()}catch(err){console.warn('Scheduled maintenance evaluation skipped',err)}},600);
  if(ui.route==='work-orders'||ui.route==='pm'||ui.route==='reliability'||ui.route==='people')render();
})();
