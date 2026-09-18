'use strict';

// SafiMaintain work execution v38.
// A connected work-order record inspired by mature CMMS field workflows.
(function(){
  const statuses=['Open','In Progress','On Hold','Completed','Cancelled'];
  const priorities=['Low','Medium','High','Critical'];
  const problemCodes=['Not selected','Leak','Noise / vibration','Overheating','No output','Low output','Electrical fault','Mechanical damage','Process deviation','Inspection finding','Other'];
  const causeCodes=['Not selected','Wear','Lack of lubrication','Contamination','Misalignment','Loose connection','Overload','Operator damage','Component failure','Unknown','Other'];
  const actionCodes=['Not selected','Inspect','Adjust','Clean','Lubricate','Repair','Replace','Reset','Calibrate','Monitor','Other'];
  ui.workRecordTab=ui.workRecordTab||'overview';

  function normalize(w){
    w.tasks=w.tasks||[];w.parts=w.parts||[];w.history=w.history||[];w.labor=w.labor||[];
    w.failureCodes=w.failureCodes||{problem:'Not selected',cause:'Not selected',action:'Not selected'};
    w.failureNote=w.failureNote||'';
    w.assetIds=w.assetIds||[];w.assigneeIds=w.assigneeIds||[];
    w.actualHours=Number(w.actualHours||w.labor.reduce((n,x)=>n+Number(x.hours||0),0));
    return w;
  }
  function progress(w){normalize(w);const done=w.tasks.filter(t=>t.status==='Done').length;return {done,total:w.tasks.length,pct:w.tasks.length?Math.round(done/w.tasks.length*100):0}}
  function assetText(w){return (w.assetIds||[]).map(id=>getAsset(id)?.name||id).join(', ')||'No asset'}
  function assigneeText(w){return (w.assigneeIds||[]).map(id=>getUser(id)?.name).filter(Boolean).join(', ')||'Unassigned'}
  function refresh(id){closeModal();setTimeout(()=>openWorkDrawerV38(id),0)}
  function history(w,text){w.history.unshift({at:iso(),text})}
  function tabButton(key,label){return '<button type="button" data-w38-tab="'+key+'" class="'+(ui.workRecordTab===key?'active':'')+'">'+label+'</button>'}

  function overview(w){
    const p=progress(w);
    const assets=(w.assetIds||[]).map(id=>getAsset(id)).filter(Boolean);
    return '<div class="w38-shell">'+
      '<div class="w38-grid">'+
      '<div><small>Assets</small><strong>'+(assets.length?assets.map(a=>'<button type="button" data-open-asset="'+esc(a.id)+'">'+esc(a.code)+' · '+esc(a.name)+'</button>').join('<br>'):'No asset linked')+'</strong></div>'+
      '<div><small>Assigned to</small><strong>'+esc(assigneeText(w))+'</strong></div>'+
      '<div><small>Due</small><strong>'+dateFmt(w.due)+'</strong></div>'+
      '<div><small>Source</small><strong>'+esc(w.source||'Manual')+'</strong></div>'+
      '<div><small>Estimated labor</small><strong>'+Number(w.estimateHours||0).toFixed(2)+' h</strong></div>'+
      '<div><small>Actual labor</small><strong>'+Number(w.actualHours||0).toFixed(2)+' h</strong></div>'+
      '<div><small>Tasks</small><strong>'+p.done+' / '+p.total+' completed</strong></div>'+
      '<div><small>Created</small><strong>'+dateTimeFmt(w.createdAt)+'</strong></div>'+
      '</div>'+
      '<section class="w38-section"><div class="w38-section-head"><strong>Work instructions</strong><span>Technician scope</span></div><div class="w38-section-body w38-instructions">'+esc(w.instructions||'No instructions recorded.')+'</div></section>'+
      (p.total&&p.done===p.total&&w.status!=='Completed'?'<div class="w38-ready"><b>✓</b><span><strong>Ready to close.</strong> All tasks are complete. Review labor, parts and failure data, then complete the work order.</span></div>':'')+
      '</div>';
  }
  function tasks(w){
    const p=progress(w);
    return '<section class="w38-section"><div class="w38-section-head"><strong>Tasks</strong><span>'+p.done+' of '+p.total+' complete</span></div>'+
      (w.tasks.length?w.tasks.map(t=>'<div class="w38-task '+(t.status==='Done'?'done':'')+'"><button type="button" data-w38-task="'+esc(w.id)+'|'+esc(t.id)+'">'+(t.status==='Done'?'✓':'')+'</button><div><strong>'+esc(t.text)+'</strong><small>'+esc(t.type||'General')+' · '+(t.status==='Done'?'Completed':'To do')+'</small></div><span class="w38-task-time">'+(t.completedAt?dateTimeFmt(t.completedAt):'')+'</span></div>').join(''):'<div class="w38-empty"><strong>No tasks yet</strong>Add clear technician steps below.</div>')+
      '<div class="w38-inline-form"><input data-w38-task-text placeholder="Add a task instruction"><select data-w38-task-type><option>General</option><option>Inspection</option><option>Safety</option><option>Lubrication</option><option>Measurement</option></select><button class="button primary" type="button" data-w38-add-task="'+esc(w.id)+'">Add task</button></div></section>';
  }
  function labor(w){
    const userOptions=(state.users||[]).filter(u=>u.active).map(u=>'<option value="'+esc(u.id)+'">'+esc(u.name)+'</option>').join('');
    const taskOptions='<option value="">General work</option>'+w.tasks.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.text)+'</option>').join('');
    return '<section class="w38-section"><div class="w38-section-head"><strong>Labor / work log</strong><span>'+Number(w.actualHours||0).toFixed(2)+' h recorded</span></div>'+
      (w.labor.length?w.labor.map(x=>'<div class="w38-labor-row"><div><strong>'+esc(getUser(x.userId)?.name||x.userId||'Technician')+'</strong><small>'+esc((w.tasks.find(t=>t.id===x.taskId)?.text)||'General work')+' · '+esc(x.note||'No note')+'</small></div><strong>'+Number(x.hours||0).toFixed(2)+' h</strong><small>'+dateTimeFmt(x.at)+'</small></div>').join(''):'<div class="w38-empty"><strong>No labor logged</strong>Record technician time and notes as work is performed.</div>')+
      '<div class="w38-labor-form"><select data-w38-labor-user>'+userOptions+'</select><select data-w38-labor-task>'+taskOptions+'</select><input data-w38-labor-hours type="number" min="0.01" step="0.25" placeholder="Hours"><input data-w38-labor-note placeholder="Work performed / note"><button class="button primary" type="button" data-w38-log-work="'+esc(w.id)+'">Log work</button></div></section>';
  }
  function parts(w){
    const options=(state.parts||[]).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.code)+' · '+esc(p.name)+' · '+partOnHand(p)+' '+esc(p.uom)+' available</option>').join('');
    return '<section class="w38-section"><div class="w38-section-head"><strong>Parts & materials</strong><span>'+w.parts.length+' planned lines</span></div>'+
      (w.parts.length?w.parts.map(x=>{const p=getPart(x.partId);return '<div class="w38-part-row"><div><strong>'+esc(p?.code||x.partId)+' · '+esc(p?.name||'Unknown part')+'</strong><small>'+partOnHand(p||{locations:[]})+' '+esc(p?.uom||'')+' on hand</small></div><span>Planned <b>'+Number(x.planned||0)+'</b></span><span>Issued <b>'+Number(x.actual||0)+'</b></span><button class="button" type="button" data-w38-issue="'+esc(w.id)+'|'+esc(x.partId)+'">Issue to WO</button></div>'}).join(''):'<div class="w38-empty"><strong>No planned parts</strong>Add expected materials before or during the job.</div>')+
      '<div class="w38-part-add"><select data-w38-part>'+options+'</select><input data-w38-part-qty type="number" min="0.01" step="0.01" value="1"><button class="button primary" type="button" data-w38-add-part="'+esc(w.id)+'">Add planned part</button></div></section>';
  }
  function files(w){
    return '<section class="w38-section"><div class="w38-section-head"><strong>Photos & files</strong><button class="button" type="button" data-work-file-pick="'+esc(w.id)+'">＋ Add files</button><input class="file-input-hidden" type="file" multiple data-work-file-input="'+esc(w.id)+'" accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,text/csv,.doc,.docx,.xls,.xlsx"></div><div class="attachment-list" data-work-file-list="'+esc(w.id)+'"><div class="attachment-empty"><strong>No files yet</strong>Add before/after photos, manuals, permits or inspection evidence.</div></div></section>';
  }
  function failure(w){
    const opts=(list,value)=>list.map(x=>'<option '+(x===value?'selected':'')+'>'+esc(x)+'</option>').join('');
    return '<section class="w38-section"><div class="w38-section-head"><strong>Failure & corrective data</strong><span>Standardized reliability history</span></div><div class="w38-section-body"><div class="w38-failure">'+
      '<label>Problem<select name="w38Problem">'+opts(problemCodes,w.failureCodes.problem)+'</select></label>'+
      '<label>Cause<select name="w38Cause">'+opts(causeCodes,w.failureCodes.cause)+'</select></label>'+
      '<label>Action<select name="w38Action">'+opts(actionCodes,w.failureCodes.action)+'</select></label>'+
      '<label class="wide">Failure / root-cause note<textarea name="w38FailureNote" placeholder="What failed, why, and what prevents recurrence?">'+esc(w.failureNote||'')+'</textarea></label>'+
      '</div></div></section>';
  }
  function historyTab(w){
    return '<section class="w38-section"><div class="w38-section-head"><strong>Work history</strong><span>'+w.history.length+' events</span></div>'+
      (w.history.length?w.history.map(h=>'<div class="w38-history-row"><i></i><div><strong>'+esc(h.text)+'</strong><small>'+dateTimeFmt(h.at)+'</small></div></div>').join(''):'<div class="w38-empty">No history recorded.</div>')+'</section>';
  }
  function tabBody(w){
    if(ui.workRecordTab==='tasks')return tasks(w);
    if(ui.workRecordTab==='labor')return labor(w);
    if(ui.workRecordTab==='parts')return parts(w);
    if(ui.workRecordTab==='files')return files(w);
    if(ui.workRecordTab==='failure')return failure(w);
    if(ui.workRecordTab==='history')return historyTab(w);
    return overview(w);
  }

  function openWorkDrawerV38(id){
    const w=getWork(id);if(!w)return;normalize(w);const p=progress(w);
    openModal({eyebrow:w.id+' · '+w.type,title:w.title,submitText:'Save work order',body:
      '<div class="w38-shell">'+
      '<div class="w38-banner"><div class="w38-banner-main">'+status(w.status)+status(w.priority)+'<strong>'+esc(assetText(w))+'</strong><small>'+p.done+'/'+p.total+' tasks · '+Number(w.actualHours||0).toFixed(2)+' h labor</small></div><div class="w38-banner-actions">'+
      (w.status==='Open'?'<button class="button primary" type="button" data-w38-start="'+esc(w.id)+'">Start work</button>':'')+
      (!['Completed','Cancelled'].includes(w.status)?'<button class="button" type="button" data-w38-complete="'+esc(w.id)+'">Complete</button>':'')+
      '</div></div>'+
      '<nav class="w38-tabs">'+tabButton('overview','Overview')+tabButton('tasks','Tasks')+tabButton('labor','Labor')+tabButton('parts','Parts')+tabButton('files','Files')+tabButton('failure','Failure')+tabButton('history','History')+'</nav>'+
      tabBody(w)+'</div>',
      onSubmit:fd=>{
        const problem=fd.get('w38Problem'),cause=fd.get('w38Cause'),action=fd.get('w38Action'),note=fd.get('w38FailureNote');
        if(problem!==null)w.failureCodes.problem=String(problem);
        if(cause!==null)w.failureCodes.cause=String(cause);
        if(action!==null)w.failureCodes.action=String(action);
        if(note!==null)w.failureNote=String(note);
        addAudit('WORK_ORDER_UPDATED',w.id,'Work record saved');
        history(w,'Work order saved by '+(currentUser()?.name||'User'));
        saveState();closeModal();render();toast(w.id+' saved');
      }});
    document.getElementById('modal')?.classList.add('w38-modal');
    setTimeout(()=>window.SafiFileUI?.paint('work',w.id,document.querySelector('[data-work-file-list="'+CSS.escape(w.id)+'"]')),0);
  }
  window.openWorkDrawer=openWorkDrawerV38;openWorkDrawer=openWorkDrawerV38;

  const oldRender=renderWorkOrders;
  renderWorkOrders=function(){
    (state.workOrders||[]).forEach(normalize);
    return oldRender();
  };
  window.renderWorkOrders=renderWorkOrders;

  function selectValues(fd,name){return fd.getAll(name).map(String).filter(Boolean)}
  function showNewWorkV38(){
    const assets=(state.assets||[]).filter(a=>a.type!=='Site');
    const users=(state.users||[]).filter(u=>u.active);
    openModal({eyebrow:'Work management',title:'Create work order',submitText:'Create work order',body:
      '<div class="w38-create-help"><strong>Build the execution record once.</strong> Link the right assets and people, add clear task steps, and technicians can then log labor, parts, photos and failure data against the same work order.</div>'+
      '<div class="w38-create-grid">'+
      '<label class="wide">Work summary<input name="title" required placeholder="What maintenance work is required?"></label>'+
      '<label>Maintenance type<select name="type"><option>Corrective</option><option>Preventive</option><option>Inspection</option><option>Project</option></select></label>'+
      '<label>Priority<select name="priority">'+priorities.map(x=>'<option>'+x+'</option>').join('')+'</select></label>'+
      '<label>Due date<input name="due" type="date" required value="'+day(2)+'"></label>'+
      '<label>Estimated hours<input name="estimateHours" type="number" min="0" step="0.25" value="1"></label>'+
      '<label>Assets<select class="w38-multi" name="assetIds" multiple required>'+assets.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.code)+' · '+esc(a.name)+'</option>').join('')+'</select><small>Use Ctrl/Cmd to select multiple assets.</small></label>'+
      '<label>Assigned technicians<select class="w38-multi" name="assigneeIds" multiple>'+users.map(u=>'<option value="'+esc(u.id)+'">'+esc(u.name)+' · '+esc(getRole(u.roleId)?.name||'')+'</option>').join('')+'</select><small>Use Ctrl/Cmd to select multiple people.</small></label>'+
      '<label class="wide">Instructions<textarea name="instructions" placeholder="Safety, isolation, sequence, acceptance criteria…"></textarea></label>'+
      '<label class="wide">Initial tasks — one per line<textarea name="tasks" placeholder="Inspect condition\nIsolate equipment\nPerform maintenance\nFunctional test"></textarea></label>'+
      '</div>',
      onSubmit:fd=>{
        const assetIds=selectValues(fd,'assetIds');if(!assetIds.length){toast('Select at least one asset');return}
        const tasks=String(fd.get('tasks')||'').split('\n').map(x=>x.trim()).filter(Boolean).map(text=>({id:uid('T'),text,type:'General',status:'Todo',completedAt:null}));
        const w={id:uid('WO'),title:String(fd.get('title')),assetIds,type:String(fd.get('type')),priority:String(fd.get('priority')),status:'Open',assigneeIds:selectValues(fd,'assigneeIds'),due:String(fd.get('due')),estimateHours:Number(fd.get('estimateHours')||0),actualHours:0,source:'Manual',instructions:String(fd.get('instructions')||''),tasks,parts:[],labor:[],failureCodes:{problem:'Not selected',cause:'Not selected',action:'Not selected'},failureNote:'',createdAt:iso(),completedAt:null,history:[{at:iso(),text:'Created by '+(currentUser()?.name||'User')}]};
        state.workOrders.unshift(w);addAudit('WORK_ORDER_CREATED',w.id,w.title);dispatchEvent('Work order assigned',w.id+' assigned',w.title,{assigneeIds:w.assigneeIds,relatedId:w.id});saveState();closeModal();ui.route='work-orders';render();toast(w.id+' created');
      }});
  }
  window.showNewWork=showNewWorkV38;showNewWork=showNewWorkV38;

  document.addEventListener('click',async e=>{
    const tab=e.target.closest('[data-w38-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();ui.workRecordTab=tab.dataset.w38Tab;const id=document.querySelector('.w38-banner [data-w38-start],.w38-banner [data-w38-complete]')?.dataset.w38Start||document.querySelector('.w38-banner [data-w38-complete]')?.dataset.w38Complete||String(document.querySelector('.modal-head p')?.textContent||'').split(' · ')[0];refresh(id);return}
    const start=e.target.closest('[data-w38-start]');if(start){e.preventDefault();e.stopImmediatePropagation();const w=getWork(start.dataset.w38Start);if(!w)return;w.status='In Progress';history(w,'Work started by '+(currentUser()?.name||'User'));addAudit('WORK_ORDER_STARTED',w.id,w.title);saveState();refresh(w.id);return}
    const complete=e.target.closest('[data-w38-complete]');if(complete){e.preventDefault();e.stopImmediatePropagation();const w=getWork(complete.dataset.w38Complete);if(!w)return;normalize(w);if(w.tasks.some(t=>t.status!=='Done')){toast('Complete the remaining tasks before closing this work order');return}w.status='Completed';w.completedAt=iso();history(w,'Work order completed by '+(currentUser()?.name||'User'));addAudit('WORK_ORDER_COMPLETED',w.id,w.title);saveState();refresh(w.id);return}
    const task=e.target.closest('[data-w38-task]');if(task){e.preventDefault();e.stopImmediatePropagation();const [wid,tid]=task.dataset.w38Task.split('|'),w=getWork(wid),t=w?.tasks?.find(x=>String(x.id)===tid);if(!w||!t)return;t.status=t.status==='Done'?'Todo':'Done';t.completedAt=t.status==='Done'?iso():null;history(w,'Task '+(t.status==='Done'?'completed: ':'reopened: ')+t.text);addAudit('WORK_TASK_STATUS',w.id,t.text+'='+t.status);saveState();if(w.tasks.length&&w.tasks.every(x=>x.status==='Done'))toast('All tasks complete — review the record and close the work order');refresh(w.id);return}
    const addTask=e.target.closest('[data-w38-add-task]');if(addTask){e.preventDefault();e.stopImmediatePropagation();const w=getWork(addTask.dataset.w38AddTask),box=e.target.closest('.w38-inline-form'),input=box?.querySelector('[data-w38-task-text]'),type=box?.querySelector('[data-w38-task-type]')?.value||'General';const text=input?.value.trim();if(!w||!text){toast('Enter a task instruction');return}w.tasks.push({id:uid('T'),text,type,status:'Todo',completedAt:null});history(w,'Task added: '+text);addAudit('WORK_TASK_ADDED',w.id,text);saveState();refresh(w.id);return}
    const log=e.target.closest('[data-w38-log-work]');if(log){e.preventDefault();e.stopImmediatePropagation();const w=getWork(log.dataset.w38LogWork),box=e.target.closest('.w38-labor-form');if(!w||!box)return;const hours=Number(box.querySelector('[data-w38-labor-hours]')?.value||0);if(!(hours>0)){toast('Enter labor hours greater than zero');return}const rec={id:uid('LAB'),userId:box.querySelector('[data-w38-labor-user]')?.value||CURRENT_USER,taskId:box.querySelector('[data-w38-labor-task]')?.value||null,hours,note:box.querySelector('[data-w38-labor-note]')?.value.trim()||'',at:iso()};w.labor.push(rec);w.actualHours=Number(w.labor.reduce((n,x)=>n+Number(x.hours||0),0).toFixed(2));if(w.status==='Open')w.status='In Progress';history(w,hours.toFixed(2)+' h logged by '+(getUser(rec.userId)?.name||'Technician')+(rec.note?' — '+rec.note:''));addAudit('WORK_LABOR_LOGGED',w.id,hours+'h');saveState();refresh(w.id);return}
    const addPart=e.target.closest('[data-w38-add-part]');if(addPart){e.preventDefault();e.stopImmediatePropagation();const w=getWork(addPart.dataset.w38AddPart),box=e.target.closest('.w38-part-add'),partId=box?.querySelector('[data-w38-part]')?.value,qty=Number(box?.querySelector('[data-w38-part-qty]')?.value||0);if(!w||!partId||!(qty>0)){toast('Choose a part and quantity');return}let line=w.parts.find(x=>x.partId===partId);if(line)line.planned=Number(line.planned||0)+qty;else w.parts.push({partId,planned:qty,actual:0});history(w,'Planned '+qty+' '+(getPart(partId)?.uom||'')+' '+(getPart(partId)?.code||partId));addAudit('WORK_PART_PLANNED',w.id,partId+' x '+qty);saveState();refresh(w.id);return}
    const issue=e.target.closest('[data-w38-issue]');if(issue){e.preventDefault();e.stopImmediatePropagation();const [wid,partId]=issue.dataset.w38Issue.split('|'),w=getWork(wid),p=getPart(partId);if(!w||!p)return;const raw=prompt('Quantity to issue to '+wid,'1'),qty=Number(raw);if(!(qty>0))return;const loc=(p.locations||[]).find(l=>Number(l.onHand||0)>=qty);if(!loc){toast('Not enough stock in any single location');return}try{postStock(p.id,'Issue',qty,loc.storeId,loc.bin,{reference:wid,workOrderId:wid,note:'Issued from work order'});saveState();toast(qty+' '+p.uom+' issued');refresh(w.id)}catch(err){toast(err.message)}return}
    const pick=e.target.closest('[data-work-file-pick]');if(pick){e.preventDefault();e.stopImmediatePropagation();document.querySelector('[data-work-file-input="'+CSS.escape(pick.dataset.workFilePick)+'"]')?.click();return}
  },true);

  document.getElementById('modal')?.addEventListener('close',()=>document.getElementById('modal')?.classList.remove('w38-modal','fx24-modal'));

  document.addEventListener('change',async e=>{
    const input=e.target.closest('[data-work-file-input]');if(!input||!input.files?.length)return;
    const files=[...input.files];input.disabled=true;
    try{
      for(const file of files)await window.SafiFiles.add('work',input.dataset.workFileInput,file);
      const w=getWork(input.dataset.workFileInput);if(w){history(w,files.length+' file'+(files.length===1?'':'s')+' added: '+files.map(f=>f.name).join(', '));addAudit('WORK_FILES_ADDED',w.id,files.map(f=>f.name).join(', '));saveState()}
      toast(files.length===1?files[0].name+' added':files.length+' files added');
      await window.SafiFileUI?.paint('work',input.dataset.workFileInput,document.querySelector('[data-work-file-list="'+CSS.escape(input.dataset.workFileInput)+'"]'));
    }catch(err){toast(err.message)}
    finally{input.value='';input.disabled=false}
  },true);
})();
