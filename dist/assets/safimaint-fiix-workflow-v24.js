'use strict';

// SafiMaintain v24 — work-order execution model aligned to established CMMS patterns.
(function(){
  const priorities=['Low','Medium','High','Critical'];
  const statuses=['Open','In Progress','Completed','Cancelled'];
  const problemCodes=['Not selected','Leak','Noise / vibration','Overheating','No output','Low output','Electrical fault','Mechanical damage','Process deviation','Inspection finding','Other'];
  const causeCodes=['Not selected','Wear','Lack of lubrication','Contamination','Misalignment','Loose connection','Overload','Operator damage','Component failure','Unknown','Other'];
  const actionCodes=['Not selected','Inspect','Adjust','Clean','Lubricate','Repair','Replace','Reset','Calibrate','Monitor','Other'];

  function openCount(){return state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status)).length}
  function overdueCount(){return state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status)&&w.due&&new Date(w.due)<new Date(new Date().toDateString())).length}
  function completedThisMonth(){const now=new Date();return state.workOrders.filter(w=>w.status==='Completed'&&w.completedAt&&new Date(w.completedAt).getMonth()===now.getMonth()&&new Date(w.completedAt).getFullYear()===now.getFullYear()).length}
  function assetNames(w){return (w.assetIds||[]).map(id=>getAsset(id)?.name||id).join(', ')||'No asset'}
  function assignees(w){return (w.assigneeIds||[]).map(id=>getUser(id)?.name).filter(Boolean).join(', ')||'Unassigned'}
  function taskProgress(w){const all=w.tasks||[],done=all.filter(t=>t.status==='Done').length;return {done,total:all.length,pct:all.length?Math.round(done/all.length*100):0}}

  function renderWorkOrdersV24(){
    const q=String(ui.workSearch||'').toLowerCase();
    const rows=state.workOrders.filter(w=>(ui.workStatus==='All statuses'||w.status===ui.workStatus)&&(!q||`${w.id} ${w.title} ${w.status} ${w.priority} ${assetNames(w)} ${assignees(w)}`.toLowerCase().includes(q)));
    return pageHead('Work management','Work orders','Plan, assign, execute and close maintenance work with tasks, parts, failure data and history in one record.',`<button class="button primary" data-action="new-work">＋ New work order</button>`)
      +`<div class="fx24-kpis"><div><small>Open work</small><strong>${openCount()}</strong></div><div class="${overdueCount()?'warn':''}"><small>Overdue</small><strong>${overdueCount()}</strong></div><div><small>Completed this month</small><strong>${completedThisMonth()}</strong></div><div><small>Unassigned</small><strong>${state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status)&&!(w.assigneeIds||[]).length).length}</strong></div></div>
      <section class="card fx24-list"><div class="fx24-toolbar"><div class="fx24-search"><span>⌕</span><input data-filter="work" value="${esc(ui.workSearch||'')}" placeholder="Search work orders, assets or assignees"></div><select data-work-status>${['All statuses',...statuses].map(s=>`<option ${ui.workStatus===s?'selected':''}>${s}</option>`).join('')}</select><span>${rows.length} records</span></div>
      <div class="fx24-table-head"><div>Work order</div><div>Asset</div><div>Assigned to</div><div>Tasks</div><div>Priority</div><div>Status</div><div>Due</div></div>
      <div class="fx24-table-body">${rows.map(w=>{const p=taskProgress(w);return `<button class="fx24-row" type="button" data-open-work="${w.id}"><span><strong>${esc(w.id)}</strong><small>${esc(w.title)}</small></span><span>${esc(assetNames(w))}</span><span>${esc(assignees(w))}</span><span><i class="fx24-progress"><b style="width:${p.pct}%"></b></i><small>${p.done}/${p.total||0}</small></span><span>${status(w.priority)}</span><span>${status(w.status)}</span><span>${dateFmt(w.due)}</span></button>`}).join('')||'<div class="fx24-empty">No work orders match the current filters.</div>'}</div></section>`;
  }

  function taskHtml(w){
    return `<div class="fx24-task-list">${(w.tasks||[]).map((t,i)=>`<div class="fx24-task ${t.status==='Done'?'done':''}"><button type="button" data-fx24-task="${w.id}|${t.id}" aria-label="Toggle task">${t.status==='Done'?'✓':''}</button><div><strong>${esc(t.text)}</strong><small>${esc(t.type||'General')} · ${t.status==='Done'?'Completed':'To do'}</small></div></div>`).join('')||'<div class="fx24-empty-inline">No tasks have been added.</div>'}</div>`;
  }
  function partsHtml(w){return `<div class="fx24-parts">${(w.parts||[]).map(x=>{const p=getPart(x.partId);return `<div><span><strong>${esc(p?.name||x.partId)}</strong><small>${esc(p?.code||'')} · planned ${x.planned||0}</small></span><b>${x.actual||0} issued</b>${p?`<button type="button" data-stock-move="${p.id}">Issue / move</button>`:''}</div>`}).join('')||'<div class="fx24-empty-inline">No parts planned.</div>'}</div>`}
  function historyHtml(w){return `<div class="fx24-history">${(w.history||[]).map(h=>`<div><i></i><span><strong>${esc(h.text)}</strong><small>${dateTimeFmt(h.at)}</small></span></div>`).join('')||'<div class="fx24-empty-inline">No work history yet.</div>'}</div>`}

  function openWorkDrawerV24(id){
    const w=getWork(id);if(!w)return;
    w.failureCodes=w.failureCodes||{problem:'Not selected',cause:'Not selected',action:'Not selected'};
    const p=taskProgress(w);
    const assetLinks=(w.assetIds||[]).map(aid=>{const a=getAsset(aid);return a?`<button type="button" data-open-asset="${a.id}">${esc(a.code)} · ${esc(a.name)}</button>`:esc(aid)}).join('');
    openModal({eyebrow:`${w.id} · ${w.type}`,title:w.title,submitText:'Save work order',body:`
      <div class="fx24-record">
        <div class="fx24-record-top"><div class="fx24-record-status"><span>${status(w.status)}</span><span>${status(w.priority)}</span><small>${p.done}/${p.total} tasks complete</small></div><div class="fx24-record-actions"><button class="button" type="button" data-fx24-add-task="${w.id}">＋ Task</button><button class="button" type="button" data-fx24-quick="${w.id}">Quick complete tasks</button></div></div>
        <div class="fx24-summary-grid"><div><small>Asset</small><strong>${assetLinks||'No asset linked'}</strong></div><div><small>Assigned to</small><strong>${esc(assignees(w))}</strong></div><div><small>Due date</small><strong>${dateFmt(w.due)}</strong></div><div><small>Source</small><strong>${esc(w.source||'Manual')}</strong></div></div>
        <div class="fx24-instructions"><small>Instructions</small><p>${esc(w.instructions||'No instructions recorded.')}</p></div>
        <div class="fx24-edit-grid">
          ${field('status','Work order status',w.status,{type:'select',options:statuses.map(x=>({value:x,label:x}))})}
          ${field('priority','Priority',w.priority,{type:'select',options:priorities.map(x=>({value:x,label:x}))})}
          ${field('problem','Problem code',w.failureCodes.problem,{type:'select',options:problemCodes.map(x=>({value:x,label:x}))})}
          ${field('cause','Cause code',w.failureCodes.cause,{type:'select',options:causeCodes.map(x=>({value:x,label:x}))})}
          ${field('actionCode','Action code',w.failureCodes.action,{type:'select',options:actionCodes.map(x=>({value:x,label:x}))})}
          ${field('completionNote','Completion / work note','',{type:'textarea',span:true})}
        </div>
        <div class="fx24-columns"><section><div class="fx24-section-head"><strong>Tasks</strong><span>${p.pct}% complete</span></div>${taskHtml(w)}</section><section><div class="fx24-section-head"><strong>Parts usage</strong><span>${(w.parts||[]).length} planned</span></div>${partsHtml(w)}</section></div>
        <section class="fx24-history-section"><div class="fx24-section-head"><strong>Work log / history</strong><span>${(w.history||[]).length} events</span></div>${historyHtml(w)}</section>
      </div>`,onSubmit:fd=>{
        const newStatus=String(fd.get('status')||w.status),newPriority=String(fd.get('priority')||w.priority),note=String(fd.get('completionNote')||'').trim();
        if(newStatus==='Completed'&&(w.tasks||[]).some(t=>t.status!=='Done')){toast('Complete the remaining tasks before closing the work order');return}
        const oldStatus=w.status;w.status=newStatus;w.priority=newPriority;w.failureCodes={problem:String(fd.get('problem')||'Not selected'),cause:String(fd.get('cause')||'Not selected'),action:String(fd.get('actionCode')||'Not selected')};
        if(note)w.history.unshift({at:iso(),text:`Work note by ${currentUser()?.name||'User'}: ${note}`});
        if(oldStatus!==newStatus){w.history.unshift({at:iso(),text:`Status changed ${oldStatus} → ${newStatus}`});if(newStatus==='Completed'&&!w.completedAt)w.completedAt=iso();if(newStatus!=='Completed')w.completedAt=null}
        addAudit('WORK_ORDER_UPDATED',w.id,`Status=${w.status}; priority=${w.priority}; problem=${w.failureCodes.problem}; cause=${w.failureCodes.cause}; action=${w.failureCodes.action}`);saveState();closeModal();render();toast(`${w.id} saved`);
      }});
    document.getElementById('modal')?.classList.add('fx24-modal');
  }

  window.renderWorkOrders=renderWorkOrdersV24;renderWorkOrders=renderWorkOrdersV24;
  window.openWorkDrawer=openWorkDrawerV24;openWorkDrawer=openWorkDrawerV24;

  document.addEventListener('click',e=>{
    const task=e.target.closest('[data-fx24-task]');if(task){e.preventDefault();e.stopImmediatePropagation();const [wid,tid]=task.dataset.fx24Task.split('|');const w=getWork(wid),t=w?.tasks?.find(x=>String(x.id)===String(tid));if(!w||!t)return;t.status=t.status==='Done'?'Todo':'Done';w.history.unshift({at:iso(),text:`Task ${t.status==='Done'?'completed':'reopened'}: ${t.text}`});addAudit('WORK_TASK_STATUS',w.id,`${t.text}: ${t.status}`);saveState();openWorkDrawerV24(w.id);return}
    const quick=e.target.closest('[data-fx24-quick]');if(quick){e.preventDefault();e.stopImmediatePropagation();const w=getWork(quick.dataset.fx24Quick);if(!w)return;(w.tasks||[]).forEach(t=>t.status='Done');w.history.unshift({at:iso(),text:`All tasks quick-completed by ${currentUser()?.name||'User'}`});addAudit('WORK_TASKS_QUICK_COMPLETE',w.id,'All tasks marked Done');saveState();openWorkDrawerV24(w.id);return}
    const add=e.target.closest('[data-fx24-add-task]');if(add){e.preventDefault();e.stopImmediatePropagation();const w=getWork(add.dataset.fx24AddTask);if(!w)return;const text=prompt('Task description');if(!text?.trim())return;w.tasks=w.tasks||[];w.tasks.push({id:uid('T'),text:text.trim(),type:'General',status:'Todo'});w.history.unshift({at:iso(),text:`Task added: ${text.trim()}`});addAudit('WORK_TASK_ADDED',w.id,text.trim());saveState();openWorkDrawerV24(w.id);return}
  },true);
})();