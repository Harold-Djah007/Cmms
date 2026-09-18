'use strict';

// SafiMaintain lifecycle engines v52.
// Request triage and scheduled-maintenance behavior aligned to the functional specification.
(function(){
  ensureSpecState();

  function control(w){return typeof window.safiWorkStatusControl==='function'?window.safiWorkStatusControl(w):(['Completed','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE')}
  function requestNormalize(r){
    let changed=false;
    if(!Array.isArray(r.history)){r.history=[{at:r.createdAt||iso(),text:'Request created by '+(r.requester||'Requester')}];changed=true}
    if(r.reviewedBy===undefined){r.reviewedBy=null;changed=true}
    if(r.reviewerId===undefined){r.reviewerId=null;changed=true}
    if(r.triageNote===undefined){r.triageNote='';changed=true}
    if(r.requestedAt===undefined){r.requestedAt=r.createdAt||iso();changed=true}
    return changed;
  }
  let normalized=false;state.requests.forEach(r=>{if(requestNormalize(r))normalized=true});if(normalized)saveState();

  function reqHistory(r,text){r.history=r.history||[];r.history.unshift({at:iso(),text})}
  function reqCounts(s){return state.requests.filter(r=>r.status===s).length}
  function renderRequestsV52(){
    state.requests.forEach(requestNormalize);
    const statuses=['All','Requested','Need more information','Deferred','Approved','Converted','Rejected','Duplicate'];
    const filter=ui.v52RequestStatus||'All',q=String(ui.v52RequestSearch||'').toLowerCase();
    const rows=state.requests.filter(r=>(filter==='All'||r.status===filter)&&(!q||[r.id,r.summary,r.description,r.requester,getAsset(r.assetId)?.name,getAsset(r.assetId)?.code].join(' ').toLowerCase().includes(q))).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    return '<div class="v50-page">'+pageHead('Maintenance','Work requests','Low-friction maintenance reporting with controlled planner triage before resources are committed.','<button class="button primary" data-action="add-request">＋ New request</button>')+
      '<div class="v52-request-kpis"><div><small>Awaiting triage</small><strong>'+reqCounts('Requested')+'</strong></div><div><small>Need information</small><strong>'+reqCounts('Need more information')+'</strong></div><div><small>Deferred</small><strong>'+reqCounts('Deferred')+'</strong></div><div><small>Converted</small><strong>'+reqCounts('Converted')+'</strong></div><div><small>Rejected / duplicate</small><strong>'+(reqCounts('Rejected')+reqCounts('Duplicate'))+'</strong></div></div>'+
      '<div class="v50-toolbar"><input data-v52-request-search value="'+esc(ui.v52RequestSearch||'')+'" placeholder="Search requests, assets, requester…"><select data-v52-request-status>'+statuses.map(s=>'<option '+(filter===s?'selected':'')+'>'+s+'</option>').join('')+'</select><span class="grow"></span><span class="v50-pill">'+rows.length+' records</span></div>'+
      '<div class="v50-table-wrap"><table class="v50-table"><thead><tr><th>Request</th><th>Asset</th><th>Issue</th><th>Urgency</th><th>Requester</th><th>Status</th><th>Reviewer</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(r=>'<tr class="v52-request-row"><td><strong>'+esc(r.id)+'</strong><small>'+dateTimeFmt(r.createdAt)+'</small></td><td><strong>'+esc(getAsset(r.assetId)?.code||'No asset')+'</strong><small>'+esc(getAsset(r.assetId)?.name||'')+'</small></td><td><strong>'+esc(r.summary||'Maintenance request')+'</strong><small>'+esc(r.description||'')+'</small></td><td>'+status(r.urgency||r.priority||'Normal')+'</td><td>'+esc(r.requester||'—')+'</td><td>'+status(r.status)+'</td><td>'+esc(getUser(r.reviewerId)?.name||'Unassigned')+'</td><td><div class="v52-actions"><button class="button small" data-v52-open-request="'+esc(r.id)+'">Open</button>'+(r.status==='Requested'||r.status==='Need more information'||r.status==='Deferred'?'<button class="button small primary" data-v52-triage-request="'+esc(r.id)+'">Triage</button>':'')+(r.workOrderId?'<button class="button small" data-open-work="'+esc(r.workOrderId)+'">'+esc(r.workOrderId)+'</button>':'')+'</div></td></tr>').join('')+
      '</tbody></table></div></div>';
  }
  renderRequests=renderRequestsV52;window.renderRequests=renderRequestsV52;

  function openRequest(id){
    const r=state.requests.find(x=>x.id===id);if(!r)return;requestNormalize(r);const a=getAsset(r.assetId);
    openModal({eyebrow:r.id+' · '+r.status,title:r.summary||'Maintenance request',body:'<div class="v52-request-detail">'+
      '<div class="v52-request-summary"><div><small>Asset</small><strong>'+esc(a?.code||'—')+' · '+esc(a?.name||'No asset')+'</strong></div><div><small>Urgency</small><strong>'+esc(r.urgency||'Normal')+'</strong></div><div><small>Requester</small><strong>'+esc(r.requester||'—')+'</strong></div><div><small>Requested</small><strong>'+dateTimeFmt(r.requestedAt)+'</strong></div><div><small>Reviewer</small><strong>'+esc(getUser(r.reviewerId)?.name||'Unassigned')+'</strong></div><div><small>Related work</small><strong>'+(r.workOrderId?'<button class="button small" data-open-work="'+esc(r.workOrderId)+'">'+esc(r.workOrderId)+'</button>':'None')+'</strong></div></div>'+
      '<section class="v50-card"><div class="v50-card-head"><div><h2>Description</h2></div></div><div class="v50-card-body">'+esc(r.description||r.summary||'No additional description.')+(r.triageNote?'<div class="v50-state-note" style="margin-top:8px"><strong>Triage note:</strong> '+esc(r.triageNote)+'</div>':'')+'</div></section>'+
      '<section class="v50-card"><div class="v50-card-head"><div><h2>Request history</h2></div></div><div class="v52-timeline">'+(r.history||[]).map(h=>'<div><i></i><span><strong>'+esc(h.text)+'</strong></span><time>'+dateTimeFmt(h.at)+'</time></div>').join('')+'</div></section>'+
      '<div class="v52-actions"><button class="button primary" data-v52-triage-request="'+esc(r.id)+'">Triage request</button>'+(a?'<button class="button" data-v51-open-asset="'+esc(a.id)+'">Open asset</button>':'')+'</div></div>'});
  }
  function triageRequest(id){
    const r=state.requests.find(x=>x.id===id);if(!r)return;const users=state.users.filter(u=>u.active);
    openModal({eyebrow:r.id+' · Triage',title:r.summary||'Review maintenance request',submitText:'Apply decision',body:'<div class="form-grid">'+
      field('decision','Decision','Approve → work order',{type:'select',options:['Approve → work order','Need more information','Defer','Reject','Mark duplicate'].map(x=>({value:x,label:x}))})+
      field('reviewerId','Reviewer',r.reviewerId||CURRENT_USER,{type:'select',options:users.map(u=>({value:u.id,label:u.name}))})+
      field('note','Triage note',r.triageNote||'',{type:'textarea',span:true})+
      field('due','If approved: work due date',day(r.urgency==='Urgent'?1:3),{type:'date'})+
      field('priority','If approved: work priority',r.urgency==='Urgent'?'High':'Medium',{type:'select',options:(state.priorityDefinitions||[]).map(p=>({value:p.name,label:p.name}))})+
      '</div>',onSubmit:fd=>{
        const decision=String(fd.get('decision')),note=String(fd.get('note')||'').trim(),reviewerId=String(fd.get('reviewerId')||CURRENT_USER);r.reviewerId=reviewerId;r.reviewedBy=reviewerId;r.triageNote=note;
        if(decision==='Approve → work order'){const w=createWorkFromRequest(r,String(fd.get('priority')||'Medium'),String(fd.get('due')||day(3)));r.status='Converted';r.workOrderId=w.id;reqHistory(r,'Approved and converted to '+w.id+' by '+(getUser(reviewerId)?.name||'Reviewer')+(note?' — '+note:''));dispatchEvent('Work order assigned',w.id+' assigned',w.title+' was created from request '+r.id,{assetId:r.assetId,assigneeIds:w.assigneeIds,relatedId:w.id});addAudit('REQUEST_CONVERTED',r.id,w.id+' created')}
        else if(decision==='Need more information'){r.status='Need more information';reqHistory(r,'More information requested by '+(getUser(reviewerId)?.name||'Reviewer')+(note?' — '+note:''));addAudit('REQUEST_NEEDS_INFO',r.id,note)}
        else if(decision==='Defer'){r.status='Deferred';reqHistory(r,'Deferred by '+(getUser(reviewerId)?.name||'Reviewer')+(note?' — '+note:''));addAudit('REQUEST_DEFERRED',r.id,note)}
        else if(decision==='Reject'){r.status='Rejected';reqHistory(r,'Rejected by '+(getUser(reviewerId)?.name||'Reviewer')+(note?' — '+note:''));addAudit('REQUEST_REJECTED',r.id,note)}
        else {r.status='Duplicate';reqHistory(r,'Marked duplicate by '+(getUser(reviewerId)?.name||'Reviewer')+(note?' — '+note:''));addAudit('REQUEST_DUPLICATE',r.id,note)}
        saveState();closeModal();render();toast(r.id+' · '+r.status);
      }});
  }
  function createWorkFromRequest(r,priority,due){
    const a=getAsset(r.assetId),assigned=a?.ownerUserId?[a.ownerUserId]:[];
    const w={id:uid('WO'),title:r.summary||'Request '+r.id,assetIds:r.assetId?[r.assetId]:[],type:'Corrective',priority,status:assigned.length?'Assigned':'Open',assigneeIds:assigned,assigneeGroupId:a?.ownerGroupId||null,due,requestedAt:r.createdAt||iso(),suggestedStart:day(0),actualStart:null,estimateHours:1,actualHours:0,source:r.id,instructions:'Converted from '+r.id+', requested by '+(r.requester||'Requester')+'.\n\n'+(r.description||''),tasks:[{id:uid('T'),text:'Inspect reported issue',type:'Inspection',status:'Todo',assigneeId:null,assigneeGroupId:null,estimateHours:.5,suggestedStart:day(0),result:null,resultNote:'',completedAt:null}],parts:[],labor:[],miscCosts:[],failureCodes:{problem:'Not selected',cause:'Not selected',action:'Not selected'},failureNote:'',completionNote:'',customFields:{},projectId:null,createdAt:iso(),completedAt:null,closedAt:null,closedBy:null,history:[{at:iso(),text:'Created from request '+r.id}]};
    state.workOrders.unshift(w);return w;
  }
  convertRequest=function(id){const r=state.requests.find(x=>x.id===id);if(r)triageRequest(id)};
  window.convertRequest=convertRequest;

  function triggerLabel(t){
    if(t.type==='Time')return 'TIME';
    if(t.type==='Meter')return 'MTR';
    return 'EVT';
  }
  function triggerSatisfied(pm,t){
    if(!t.active)return false;
    if(t.type==='Time'){const d=t.nextDue||t.value||pm.nextDue;return /^\d{4}-\d{2}-\d{2}$/.test(String(d||''))&&d<=day(0)}
    if(t.type==='Meter'){
      const assets=pm.assetIds||[pm.assetId].filter(Boolean),m=state.meters.find(x=>assets.includes(x.assetId)&&(t.meterId?x.id===t.meterId:true));if(!m)return false;
      const threshold=Number(t.threshold??String(t.nextDue||t.value||'').replace(/[^0-9.]/g,''));return Number.isFinite(threshold)&&Number(m.current)>=threshold;
    }
    return !!t.satisfied;
  }
  function pmReady(pm){
    const triggers=(pm.triggers||[]).filter(t=>t.active);if(!triggers.length)return false;
    const checks=triggers.map(t=>triggerSatisfied(pm,t));return pm.triggerLogic==='ALL'?checks.every(Boolean):checks.some(Boolean);
  }
  window.safiPmReady=pmReady;
  function pmOpenWork(pm){return state.workOrders.filter(w=>w.source===pm.id&&control(w)!=='CLOSED')}
  function nestedPlans(pm){return (pm.nestedPlanIds||[]).map(id=>state.scheduledMaintenance.find(x=>x.id===id)).filter(Boolean)}
  function nestedWouldCycle(parentId,childIds){
    const visit=(id,seen=new Set())=>{if(id===parentId)return true;if(seen.has(id))return false;seen.add(id);const p=state.scheduledMaintenance.find(x=>x.id===id);return (p?.nestedPlanIds||[]).some(cid=>visit(cid,seen))};
    return childIds.some(id=>visit(id));
  }
  function taskSources(pm,seen=new Set()){
    if(seen.has(pm.id))return[];seen.add(pm.id);
    const groups=new Set(pm.includeTaskGroupIds||[]);if(pm.taskGroupId)groups.add(pm.taskGroupId);
    const tasks=[];
    groups.forEach(gid=>{const g=state.taskGroups.find(x=>x.id===gid);(g?.tasks||[]).forEach(t=>tasks.push({...structuredClone(t),id:uid('T'),status:'Todo',result:null,resultNote:'',completedAt:null,sourcePlanId:pm.id}))});
    (pm.taskTemplate||[]).forEach(text=>tasks.push({id:uid('T'),text,type:'General',status:'Todo',assigneeId:null,assigneeGroupId:null,estimateHours:0,suggestedStart:null,result:null,resultNote:'',completedAt:null,sourcePlanId:pm.id}));
    nestedPlans(pm).forEach(child=>tasks.push(...taskSources(child,seen)));
    return tasks;
  }
  function requiredPartsForPlan(pm,seen=new Set(),totals=new Map()){
    if(seen.has(pm.id))return totals;seen.add(pm.id);
    (pm.requiredParts||[]).forEach(x=>totals.set(x.partId,(totals.get(x.partId)||0)+Number(x.qty||0)));
    nestedPlans(pm).forEach(child=>requiredPartsForPlan(child,seen,totals));
    return [...totals.entries()].map(([partId,qty])=>({partId,qty}));
  }
  function coveredByReadyParent(pm){
    return state.scheduledMaintenance.some(parent=>(parent.nestedPlanIds||[]).includes(pm.id)&&!parent.paused&&parent.status!=='Paused'&&parent.status!=='Archived'&&pmReady(parent));
  }
  function generatePMV52(id,manual=true){
    const pm=state.scheduledMaintenance.find(x=>x.id===id);if(!pm||pm.paused||pm.status==='Paused'||pm.status==='Archived'){toast('This maintenance plan is paused or inactive');return null}
    if(pmOpenWork(pm).length){toast('Open work already exists for '+pm.id);return null}
    if(!manual&&!pmReady(pm))return null;
    const assetIds=(pm.assetIds||[pm.assetId]).filter(Boolean),assets=assetIds.map(getAsset).filter(Boolean);if(!assets.length){toast('This plan has no valid assets');return null}
    const tasks=taskSources(pm),users=pm.assigneeGroupId?state.users.filter(u=>u.active&&(u.groupIds||[]).includes(pm.assigneeGroupId)).map(u=>u.id):[...new Set(assets.map(a=>a.ownerUserId).filter(Boolean))];
    const timeTrigger=(pm.triggers||[]).find(t=>t.type==='Time'&&t.active),due=timeTrigger?.nextDue&&/^\d{4}-\d{2}-\d{2}$/.test(timeTrigger.nextDue)?timeTrigger.nextDue:day(2);
    const w={id:uid('WO'),title:pm.name,assetIds,type:'Preventive',priority:assets.some(a=>a.criticality==='A')?'High':'Medium',status:users.length?'Assigned':'Open',assigneeIds:users,assigneeGroupId:pm.assigneeGroupId||null,due,suggestedStart:day(0),actualStart:null,estimateHours:tasks.reduce((n,t)=>n+Number(t.estimateHours||0),0)||2,actualHours:0,source:pm.id,instructions:'Generated from scheduled maintenance '+pm.id+'.',tasks,parts:requiredPartsForPlan(pm).map(x=>({partId:x.partId,planned:Number(x.qty||0),actual:0})),labor:[],miscCosts:[],failureCodes:{problem:'Not selected',cause:'Not selected',action:'Not selected'},failureNote:'',completionNote:'',customFields:{},projectId:pm.projectId||null,createdAt:iso(),completedAt:null,closedAt:null,closedBy:null,history:[{at:iso(),text:'Generated from '+pm.id+' using '+pm.triggerLogic+' trigger logic'+((pm.nestedPlanIds||[]).length?' with '+pm.nestedPlanIds.length+' nested plan'+(pm.nestedPlanIds.length===1?'':'s'):'')}]};
    state.workOrders.unshift(w);pm.lastGenerated=iso();pm.generatedHistory=pm.generatedHistory||[];pm.generatedHistory.unshift({at:iso(),workOrderId:w.id,triggerSnapshot:(pm.triggers||[]).map(t=>({type:t.type,description:t.description||'',satisfied:triggerSatisfied(pm,t)}))});
    advanceTriggers(pm,w);
    dispatchEvent('Work order assigned',w.id+' assigned',w.title+' was generated from '+pm.id,{assetId:assetIds[0],assigneeIds:w.assigneeIds,relatedId:w.id});addAudit('PM_WORK_GENERATED',pm.id,w.id+' · '+assetIds.length+' assets · '+pm.triggerLogic);saveState();render();toast(w.id+' generated');return w;
  }
  function intervalDays(text){const m=String(text||'').match(/(\d+(?:\.\d+)?)\s*(?:day|days|d)\b/i);if(m)return Number(m[1]);const wk=String(text||'').match(/(\d+(?:\.\d+)?)\s*(?:week|weeks|w)\b/i);if(wk)return Number(wk[1])*7;const mo=String(text||'').match(/(\d+(?:\.\d+)?)\s*(?:month|months)\b/i);if(mo)return Number(mo[1])*30;return null}
  function plusDays(dateLike,n){const d=new Date(dateLike||iso());if(Number.isNaN(d.getTime()))return day(Number(n||0));d.setDate(d.getDate()+Number(n||0));return d.toISOString().slice(0,10)}
  function advanceTriggers(pm,w,seen=new Set()){
    if(seen.has(pm.id))return;seen.add(pm.id);
    (pm.triggers||[]).forEach(t=>{
      if(!t.active)return;
      if(t.type==='Time'&&triggerSatisfied(pm,t)&&pm.scheduleMode!=='Floating'){const d=intervalDays(t.interval||t.description||pm.trigger);if(d)t.nextDue=plusDays(t.nextDue||day(0),d)}
      if(t.type==='Meter'&&triggerSatisfied(pm,t)){const interval=Number(t.interval||String(t.description||pm.trigger||'').replace(/[^0-9.]/g,''));const threshold=Number(t.threshold??String(t.nextDue||'').replace(/[^0-9.]/g,''));if(interval>0&&Number.isFinite(threshold)){t.threshold=threshold+interval;t.nextDue=String(t.threshold)}}
      if(t.type==='Event')t.satisfied=false;
    });
    if(pm.scheduleMode==='Floating')pm.awaitingCompletionWorkOrderId=w.id;
    nestedPlans(pm).filter(pmReady).forEach(child=>advanceTriggers(child,w,seen));
  }
  generatePM=generatePMV52;window.generatePM=generatePMV52;

  function renderPMV52(){
    ensureSpecState();
    const rows=state.scheduledMaintenance.filter(pm=>pm.status!=='Archived'),active=rows.filter(pm=>!pm.paused&&pm.status!=='Paused'),ready=active.filter(pmReady),paused=rows.filter(pm=>pm.paused||pm.status==='Paused');
    return '<div class="v50-page">'+pageHead('Maintenance','Scheduled maintenance','Template and trigger engine for time, meter and event-based preventive work.','<button class="button" data-route="task-groups">Task groups</button><button class="button primary" data-v52-new-pm>＋ Scheduled maintenance</button>')+
      '<div class="v52-pm-kpis"><div><small>Active plans</small><strong>'+active.length+'</strong></div><div><small>Trigger ready</small><strong>'+ready.length+'</strong></div><div><small>Paused</small><strong>'+paused.length+'</strong></div><div><small>Generated active work</small><strong>'+state.workOrders.filter(w=>String(w.source||'').startsWith('PM')&&control(w)==='ACTIVE').length+'</strong></div><div><small>Multi-asset plans</small><strong>'+rows.filter(p=>(p.assetIds||[]).length>1).length+'</strong></div></div>'+
      '<div class="v52-pm-list">'+(rows.length?rows.map(pm=>{
        const assets=(pm.assetIds||[pm.assetId]).filter(Boolean),triggers=pm.triggers||[],groups=[...(pm.includeTaskGroupIds||[])];if(pm.taskGroupId&&!groups.includes(pm.taskGroupId))groups.push(pm.taskGroupId);
        return '<article class="v52-pm"><div class="v52-pm-head"><div><strong>'+esc(pm.id)+' · '+esc(pm.name)+'</strong><small>'+esc(pm.scheduleMode||'Fixed')+' cadence · '+esc(pm.triggerLogic||'ANY')+' trigger logic</small></div><div class="v52-asset-tags">'+assets.map(id=>'<span class="v52-asset-tag">'+esc(getAsset(id)?.code||id)+'</span>').join('')+'</div><div>'+status(pm.paused||pm.status==='Paused'?'Paused':'Active')+'<small>'+(pmReady(pm)?'Trigger condition met':'Waiting for trigger')+'</small></div><div class="v52-actions"><button class="button small" data-v52-edit-pm="'+esc(pm.id)+'">Edit</button><button class="button small" data-v52-toggle-pm="'+esc(pm.id)+'">'+(pm.paused||pm.status==='Paused'?'Resume':'Pause')+'</button><button class="button small primary" data-generate-pm="'+esc(pm.id)+'">Generate</button></div></div>'+
          '<div class="v52-pm-body"><div><h4>Triggers</h4>'+triggers.map(t=>'<div class="v52-trigger"><b>'+triggerLabel(t)+'</b><span><strong>'+esc(t.description||t.type)+'</strong><small>'+esc(t.type==='Time'?(t.nextDue||'No due date'):t.type==='Meter'?('threshold '+(t.threshold??t.nextDue??'—')):(t.eventType||'Any configured event'))+'</small></span><span>'+(triggerSatisfied(pm,t)?'READY':'WAIT')+'</span></div>').join('')+'<small>Logic: '+esc(pm.triggerLogic||'ANY')+'</small></div>'+
          '<div><h4>Procedure & materials</h4><div class="v50-list-row"><span><strong>'+groups.length+' task group'+(groups.length===1?'':'s')+'</strong><small>'+esc(groups.map(id=>state.taskGroups.find(g=>g.id===id)?.name).filter(Boolean).join(', ')||'Inline tasks')+'</small></span></div><div class="v50-list-row"><span><strong>'+(pm.requiredParts||[]).length+' direct required parts</strong><small>'+esc((pm.requiredParts||[]).map(x=>(getPart(x.partId)?.code||x.partId)+' × '+x.qty).join(', ')||'None')+'</small></span></div><div class="v50-list-row"><span><strong>'+(pm.nestedPlanIds||[]).length+' nested plan'+((pm.nestedPlanIds||[]).length===1?'':'s')+'</strong><small>'+esc(nestedPlans(pm).map(x=>x.name).join(' → ')||'None')+'</small></span></div></div>'+
          '<div><h4>Generation history</h4><div class="v52-pm-log">'+((pm.generatedHistory||[]).length?(pm.generatedHistory||[]).slice(0,6).map(h=>'<div><strong>'+esc(h.workOrderId)+'</strong><small>'+dateTimeFmt(h.at)+'</small></div>').join(''):'<small>No generated work yet.</small>')+'</div></div></div></article>';
      }).join(''):'<div class="v50-empty"><strong>No scheduled maintenance</strong><span>Create a plan with time, meter or event triggers.</span></div>')+'</div></div>';
  }
  renderPM=renderPMV52;window.renderPM=renderPMV52;

  function pmForm(existing){
    const pm=existing||{assetIds:[],triggers:[],includeTaskGroupIds:[],nestedPlanIds:[],requiredParts:[],triggerLogic:'ANY',scheduleMode:'Fixed',name:'',assigneeGroupId:null};
    const assets=state.assets.filter(a=>a.type!=='Site'&&safiSiteAllowed(a));
    openModal({eyebrow:'Scheduled maintenance',title:existing?'Edit '+pm.name:'Create scheduled maintenance',submitText:existing?'Save plan':'Create plan',body:'<div class="form-grid">'+
      field('name','Plan name',pm.name,{required:true,span:true})+
      field('scheduleMode','Schedule mode',pm.scheduleMode||'Fixed',{type:'select',options:[{value:'Fixed',label:'Fixed — keep planned cadence'},{value:'Floating',label:'Floating — next interval starts after completion'}]})+
      field('triggerLogic','Multiple trigger logic',pm.triggerLogic||'ANY',{type:'select',options:[{value:'ANY',label:'ANY — generate when any trigger is satisfied'},{value:'ALL',label:'ALL — require every trigger'}]})+
      field('assigneeGroupId','Default assigned group',pm.assigneeGroupId||'',{type:'select',options:[{value:'',label:'No default group'},...state.groups.map(g=>({value:g.id,label:g.name}))]})+
      '<div class="span-2"><label>Assets</label><div class="v52-check-grid">'+assets.map(a=>'<label class="v52-check"><input type="checkbox" name="assetIds" value="'+esc(a.id)+'" '+((pm.assetIds||[]).includes(a.id)?'checked':'')+'> '+esc(a.code)+' · '+esc(a.name)+'</label>').join('')+'</div></div>'+
      '<div class="span-2"><label>Task groups / SOPs</label><div class="v52-check-grid">'+state.taskGroups.filter(g=>g.status!=='Archived').map(g=>'<label class="v52-check"><input type="checkbox" name="taskGroupIds" value="'+esc(g.id)+'" '+((pm.includeTaskGroupIds||[]).includes(g.id)?'checked':'')+'> '+esc(g.name)+'</label>').join('')+'</div></div>'+
      '<div class="span-2"><label>Nested maintenance plans</label><div class="v52-check-grid">'+state.scheduledMaintenance.filter(x=>x.status!=='Archived'&&x.id!==pm.id).map(x=>'<label class="v52-check"><input type="checkbox" name="nestedPlanIds" value="'+esc(x.id)+'" '+((pm.nestedPlanIds||[]).includes(x.id)?'checked':'')+'> '+esc(x.id)+' · '+esc(x.name)+'</label>').join('')+'</div><small class="muted">When this plan generates, nested plan tasks and required parts are folded into the same work order. A due nested plan will not generate a duplicate job at the same time.</small></div>'+
      field('inlineTasks','Additional tasks — one per line',(pm.taskTemplate||[]).join('\n'),{type:'textarea',span:true})+
      '<div class="span-2"><label>Triggers</label><div class="v52-builder" id="v52TriggerBuilder">'+triggerRows(pm.triggers)+'</div><button class="button small" type="button" data-v52-add-trigger>＋ Add trigger</button></div>'+
      '</div>',onSubmit:fd=>{
        const assets=fd.getAll('assetIds').map(String);if(!assets.length){toast('Select at least one asset');return}
        const triggers=readTriggerRows();if(!triggers.length){toast('Add at least one trigger');return}
        const rec=existing?pm:{id:uid('PM'),status:'Active',paused:false,lastGenerated:null,requiredParts:[],generatedHistory:[]};
        rec.name=String(fd.get('name'));rec.assetIds=assets;rec.assetId=assets[0];rec.scheduleMode=String(fd.get('scheduleMode'));rec.triggerLogic=String(fd.get('triggerLogic'));rec.assigneeGroupId=String(fd.get('assigneeGroupId')||'')||null;rec.includeTaskGroupIds=fd.getAll('taskGroupIds').map(String);rec.taskGroupId=rec.includeTaskGroupIds[0]||null;rec.nestedPlanIds=fd.getAll('nestedPlanIds').map(String).filter(id=>id!==rec.id);if(nestedWouldCycle(rec.id,rec.nestedPlanIds)){toast('Nested maintenance would create a circular plan relationship');return}rec.taskTemplate=String(fd.get('inlineTasks')||'').split('\n').map(x=>x.trim()).filter(Boolean);rec.triggers=triggers;const first=triggers[0];rec.triggerType=first.type;rec.trigger=first.description;rec.nextDue=first.nextDue||String(first.threshold??'');
        if(!existing)state.scheduledMaintenance.unshift(rec);addAudit(existing?'PM_PLAN_UPDATED':'PM_PLAN_CREATED',rec.id,rec.name+' · '+rec.assetIds.length+' assets · '+rec.triggerLogic);saveState();closeModal();render();toast(existing?'Plan updated':'Plan created');
      }});
  }
  function triggerRows(triggers){
    const rows=triggers?.length?triggers:[{id:uid('TRG'),type:'Time',description:'Every 30 days',nextDue:day(30),active:true}];
    return rows.map(t=>'<div class="v52-builder-row" data-v52-trigger-row="'+esc(t.id||uid('TRG'))+'"><select data-v52-trigger-type><option '+(t.type==='Time'?'selected':'')+'>Time</option><option '+(t.type==='Meter'?'selected':'')+'>Meter</option><option '+(t.type==='Event'?'selected':'')+'>Event</option></select><input data-v52-trigger-description value="'+esc(t.description||'')+'" placeholder="Every 30 days / every 500 h / emergency stop"><input data-v52-trigger-value value="'+esc(t.type==='Time'?(t.nextDue||''):t.type==='Meter'?(t.threshold??t.nextDue??''):(t.eventType||''))+'" placeholder="Due date / threshold / event"><button class="button small danger" type="button" data-v52-remove-trigger>×</button></div>').join('');
  }
  function readTriggerRows(){
    return [...document.querySelectorAll('[data-v52-trigger-row]')].map(row=>{const type=row.querySelector('[data-v52-trigger-type]').value,description=row.querySelector('[data-v52-trigger-description]').value.trim(),value=row.querySelector('[data-v52-trigger-value]').value.trim(),t={id:row.dataset.v52TriggerRow||uid('TRG'),type,description,active:true,satisfied:false};if(type==='Time')t.nextDue=value||day(30);if(type==='Meter'){t.threshold=Number(value||0);t.nextDue=String(t.threshold);const n=Number(String(description).replace(/[^0-9.]/g,''));if(n>0)t.interval=n}if(type==='Event')t.eventType=value||description;return t}).filter(t=>t.description||t.nextDue||t.threshold||t.eventType);
  }

  function evaluateDuePlans(){
    let generated=0;state.scheduledMaintenance.filter(pm=>!pm.paused&&pm.status!=='Paused'&&pm.status!=='Archived').forEach(pm=>{if(pmReady(pm)&&!pmOpenWork(pm).length&&!coveredByReadyParent(pm)){if(generatePMV52(pm.id,false))generated++}});return generated
  }

  const previousDispatch=dispatchEvent;
  dispatchEvent=function(event,title,message,context={}){
    previousDispatch(event,title,message,context);
    if(event==='Asset event recorded'&&context.assetId){
      state.scheduledMaintenance.filter(pm=>!pm.paused&&pm.status!=='Paused'&&(pm.assetIds||[pm.assetId]).includes(context.assetId)).forEach(pm=>{
        (pm.triggers||[]).filter(t=>t.active&&t.type==='Event').forEach(t=>{const needle=String(t.eventType||t.description||'').toLowerCase();if(!needle||[title,message].join(' ').toLowerCase().includes(needle))t.satisfied=true});
        if(pmReady(pm)&&!pmOpenWork(pm).length&&!coveredByReadyParent(pm))generatePMV52(pm.id,false);
      });
    }
  };
  window.dispatchEvent=dispatchEvent;

  // Add a functional Custom-fields surface to the work-order record without rewriting the execution engine.
  const baseOpenWork=openWorkDrawer;
  openWorkDrawer=function(id){
    baseOpenWork(id);
    setTimeout(()=>injectWorkCustom(id),0);
  };
  window.openWorkDrawer=openWorkDrawer;
  function injectWorkCustom(id){
    const w=getWork(id),tabs=document.querySelector('.v44-tabs');if(!w||!tabs||!state.workCustomFieldDefinitions.length)return;
    if(!tabs.querySelector('[data-v52-work-custom]')){const b=document.createElement('button');b.type='button';b.dataset.v52WorkCustom=id;b.textContent='Custom';tabs.appendChild(b)}
  }
  function showWorkCustom(id){
    const w=getWork(id);if(!w)return;w.customFields=w.customFields||{};
    const defs=state.workCustomFieldDefinitions,body='<div class="v52-custom-work">'+defs.map(d=>'<label class="'+(d.type==='Text'?'wide':'')+'">'+esc(d.name)+(d.required?' *':'')+(d.type==='Yes / No'?'<select name="cf_'+esc(d.id)+'"><option '+(w.customFields[d.id]==='Yes'?'selected':'')+'>Yes</option><option '+(w.customFields[d.id]==='No'?'selected':'')+'>No</option></select>':'<input name="cf_'+esc(d.id)+'" type="'+(d.type==='Number'?'number':d.type==='Date'?'date':'text')+'" value="'+esc(w.customFields[d.id]??'')+'">')+'</label>').join('')+'</div>';
    openModal({eyebrow:w.id+' · Custom fields',title:w.title,submitText:'Save custom fields',body,onSubmit:fd=>{for(const d of defs){const val=String(fd.get('cf_'+d.id)||'');if(d.required&&!val){toast(d.name+' is required');return}w.customFields[d.id]=val}w.history=w.history||[];w.history.unshift({at:iso(),text:'Custom work-order fields updated'});addAudit('WORK_CUSTOM_FIELDS_UPDATED',w.id,defs.length+' fields');saveState();closeModal();setTimeout(()=>openWorkDrawer(w.id),0);toast('Custom fields saved')}})
  }

  document.addEventListener('input',e=>{if(e.target.matches('[data-v52-request-search]')){ui.v52RequestSearch=e.target.value;render()}},true);
  document.addEventListener('change',e=>{if(e.target.matches('[data-v52-request-status]')){ui.v52RequestStatus=e.target.value;render()}},true);
  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-v52-open-request]');if(open){e.preventDefault();e.stopImmediatePropagation();openRequest(open.dataset.v52OpenRequest);return}
    const tr=e.target.closest('[data-v52-triage-request]');if(tr){e.preventDefault();e.stopImmediatePropagation();triageRequest(tr.dataset.v52TriageRequest);return}
    if(e.target.closest('[data-v52-new-pm]')){e.preventDefault();e.stopImmediatePropagation();pmForm();return}
    const edit=e.target.closest('[data-v52-edit-pm]');if(edit){e.preventDefault();e.stopImmediatePropagation();pmForm(state.scheduledMaintenance.find(x=>x.id===edit.dataset.v52EditPm));return}
    const toggle=e.target.closest('[data-v52-toggle-pm]');if(toggle){e.preventDefault();e.stopImmediatePropagation();const pm=state.scheduledMaintenance.find(x=>x.id===toggle.dataset.v52TogglePm);if(!pm)return;pm.paused=!pm.paused;pm.status=pm.paused?'Paused':'Active';addAudit('PM_STATUS_CHANGED',pm.id,pm.status);saveState();render();toast(pm.id+' '+pm.status);return}
    if(e.target.closest('[data-v52-add-trigger]')){e.preventDefault();e.stopImmediatePropagation();document.getElementById('v52TriggerBuilder')?.insertAdjacentHTML('beforeend',triggerRows([{id:uid('TRG'),type:'Time',description:'',nextDue:'',active:true}]));return}
    const rem=e.target.closest('[data-v52-remove-trigger]');if(rem){e.preventDefault();e.stopImmediatePropagation();const rows=document.querySelectorAll('[data-v52-trigger-row]');if(rows.length<=1){toast('A plan needs at least one trigger');return}rem.closest('[data-v52-trigger-row]')?.remove();return}
    const cf=e.target.closest('[data-v52-work-custom]');if(cf){e.preventDefault();e.stopImmediatePropagation();showWorkCustom(cf.dataset.v52WorkCustom);return}
  },true);

  setTimeout(()=>{try{evaluateDuePlans()}catch(err){console.warn('PM trigger evaluation skipped',err)}},850);
  if(ui.route==='requests'||ui.route==='pm')render();
})();