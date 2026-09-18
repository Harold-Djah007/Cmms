'use strict';

// SafiMaintain work planning v54.
// Restores multi-asset work, configurable classifications and task-level planning.
(function(){
  ensureSpecState();

  function activeStatusOptions(){return (state.workStatusDefinitions||[]).filter(s=>s.control!=='CLOSED').map(s=>({value:s.name,label:s.name+' · '+s.control}))}
  function priorityOptions(){return (state.priorityDefinitions||[]).filter(x=>x.active!==false).sort((a,b)=>Number(b.level||0)-Number(a.level||0)).map(x=>({value:x.name,label:x.name}))}
  function typeOptions(){return (state.maintenanceTypeDefinitions||[]).filter(x=>x.active!==false).map(x=>({value:x.name,label:x.name+' · '+x.class}))}

  showNewWork=function(){
    const assets=state.assets.filter(a=>a.type!=='Site'&&safiSiteAllowed(a)),users=state.users.filter(u=>u.active&&(!u.siteIds?.length||u.siteIds.includes(safiActiveSite()?.id))),groups=state.groups,projects=state.projects.filter(p=>!p.siteId||p.siteId===safiActiveSite()?.id),taskGroups=state.taskGroups.filter(g=>g.status!=='Archived'),custom=state.workCustomFieldDefinitions||[];
    openModal({eyebrow:'Work management',title:'Create work order',submitText:'Create work order',body:'<div class="form-grid">'+
      field('title','Work summary','',{required:true,span:true})+
      field('description','Description / problem statement','',{type:'textarea',span:true})+
      '<div class="v54-form-section"><strong>Assets</strong><div class="v54-choice-grid">'+assets.map(a=>'<label class="v54-choice"><input type="checkbox" name="assetIds" value="'+esc(a.id)+'"> '+esc(a.code)+' · '+esc(a.name)+'</label>').join('')+'</div></div>'+
      field('type','Maintenance type','Corrective',{type:'select',options:typeOptions()})+
      field('priority','Priority','Medium',{type:'select',options:priorityOptions()})+
      field('status','Initial status','Open',{type:'select',options:activeStatusOptions()})+
      field('projectId','Project','',{type:'select',options:[{value:'',label:'No project'},...projects.map(p=>({value:p.id,label:p.name}))]})+
      field('suggestedStart','Suggested start',day(0),{type:'date',required:true})+
      field('due','Suggested completion / due',day(2),{type:'date',required:true})+
      field('estimateHours','Estimated total labour','1',{type:'number',min:0,step:'.25'})+
      field('assigneeGroupId','Assigned team','',{type:'select',options:[{value:'',label:'No team'},...groups.map(g=>({value:g.id,label:g.name}))]})+
      '<div class="v54-form-section"><strong>Assigned people</strong><div class="v54-choice-grid">'+users.map(u=>'<label class="v54-choice"><input type="checkbox" name="assigneeIds" value="'+esc(u.id)+'"> '+esc(u.name)+' · '+esc(getRole(u.roleId)?.name||'User')+'</label>').join('')+'</div></div>'+
      field('taskGroupId','Task group / SOP','',{type:'select',options:[{value:'',label:'No task group'},...taskGroups.map(g=>({value:g.id,label:g.name}))]})+
      field('instructions','Instructions / safety / acceptance criteria','',{type:'textarea',span:true})+
      (custom.length?'<div class="v54-form-section"><strong>Custom work-order fields</strong><div class="v52-custom-work">'+custom.map(d=>'<label>'+esc(d.name)+(d.required?' <span class="v54-required">*</span>':'')+(d.type==='Yes / No'?'<select name="cf_'+esc(d.id)+'"><option value=""></option><option>Yes</option><option>No</option></select>':'<input name="cf_'+esc(d.id)+'" type="'+(d.type==='Number'?'number':d.type==='Date'?'date':'text')+'">')+'</label>').join('')+'</div></div>':'')+
      '</div>',onSubmit:fd=>{
        const assetIds=fd.getAll('assetIds').map(String);if(!assetIds.length){toast('Select at least one asset');return}
        const start=String(fd.get('suggestedStart')),due=String(fd.get('due'));if(due<start){toast('Due date cannot be before suggested start');return}
        const customValues={};for(const d of custom){const value=String(fd.get('cf_'+d.id)||'');if(d.required&&!value){toast(d.name+' is required');return}customValues[d.id]=value}
        const gid=String(fd.get('taskGroupId')||''),tg=taskGroups.find(g=>g.id===gid),assigneeIds=fd.getAll('assigneeIds').map(String);
        const tasks=(tg?.tasks||[]).map(t=>({id:uid('T'),text:t.text,type:t.type||'General',status:'Todo',assigneeId:t.assigneeId||null,assigneeGroupId:t.assigneeGroupId||null,estimateHours:Number(t.estimateHours||0),suggestedStart:t.suggestedStart||start,result:null,resultNote:'',completedAt:null}));
        const w={id:uid('WO'),title:String(fd.get('title')),description:String(fd.get('description')||''),assetIds,type:String(fd.get('type')),priority:String(fd.get('priority')),status:String(fd.get('status')),assigneeIds,assigneeGroupId:String(fd.get('assigneeGroupId')||'')||null,suggestedStart:start,due,actualStart:null,estimateHours:Number(fd.get('estimateHours')||0),actualHours:0,projectId:String(fd.get('projectId')||'')||null,source:'Manual',instructions:String(fd.get('instructions')||''),tasks,parts:[],labor:[],miscCosts:[],failureCodes:{problem:'Not selected',cause:'Not selected',action:'Not selected'},failureNote:'',completionNote:'',customFields:customValues,createdAt:iso(),completedAt:null,closedAt:null,closedBy:null,history:[{at:iso(),text:'Created by '+(currentUser()?.name||'User')+' for '+assetIds.length+' asset'+(assetIds.length===1?'':'s')}]};
        state.workOrders.unshift(w);assetIds.forEach(aid=>state.assetEvents.unshift({id:uid('AE'),assetId:aid,type:'Work order created',at:iso(),userId:CURRENT_USER,detail:w.id+' · '+w.title,workOrderId:w.id}));addAudit('WORK_ORDER_CREATED',w.id,w.title+' · '+assetIds.length+' assets');dispatchEvent('Work order assigned',w.id+' assigned',w.title,{assetId:assetIds[0],assigneeIds,relatedId:w.id});saveState();closeModal();ui.route='work-orders';render();setTimeout(()=>openWorkDrawer(w.id),0);toast(w.id+' created')
      }});
  };
  window.showNewWork=showNewWork;

  function patchWorkRecord(id){
    const w=getWork(id);if(!w)return;
    const add=document.querySelector('.v44-add-task');
    if(add&&!add.dataset.v54){
      add.dataset.v54='1';add.className='v54-task-form';add.innerHTML='<input data-v54-task-text placeholder="Task instruction"><select data-v54-task-type><option>General</option><option>Text</option><option>Inspection</option><option>Meter</option></select><select data-v54-task-user><option value="">No person</option>'+state.users.filter(u=>u.active).map(u=>'<option value="'+esc(u.id)+'">'+esc(u.name)+'</option>').join('')+'</select><select data-v54-task-group><option value="">No group</option>'+state.groups.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('')+'</select><input data-v54-task-hours type="number" min="0" step=".25" value="0" title="Estimated hours"><input data-v54-task-start type="date" value="'+esc(w.suggestedStart||day(0))+'"><button class="button primary" type="button" data-v54-add-task="'+esc(w.id)+'">Add task</button>';
    }
    document.querySelectorAll('.v44-task').forEach((row,i)=>{
      const t=(w.tasks||[])[i];if(!t||row.dataset.v54)return;row.dataset.v54='1';const info=row.querySelector('div');if(info){const extra=document.createElement('span');extra.className='v54-task-extra';extra.textContent=(t.estimateHours?Number(t.estimateHours).toFixed(2)+' h est. · ':'')+(t.suggestedStart?'start '+t.suggestedStart+' · ':'')+(t.assigneeGroupId?(getGroup(t.assigneeGroupId)?.name||'group'):'');info.appendChild(extra)}const edit=document.createElement('button');edit.type='button';edit.className='button small';edit.dataset.v54EditTask=w.id+'|'+t.id;edit.textContent='Edit';row.appendChild(edit)
    });
    document.querySelectorAll('.w38-part-row').forEach((row,i)=>{
      const line=(w.parts||[])[i];if(!line||row.dataset.v54)return;row.dataset.v54='1';const actions=document.createElement('span');actions.className='v54-part-actions';if(Number(line.actual||0)>0)actions.innerHTML+='<button class="button small" type="button" data-v54-return-part="'+esc(w.id)+'|'+esc(line.partId)+'">Return</button>';const p=getPart(line.partId);if(p&&partOnHand(p)<=0)actions.innerHTML+='<button class="button small" type="button" data-v54-request-part="'+esc(w.id)+'|'+esc(line.partId)+'">Request purchase</button>';row.appendChild(actions)
    });
    const actions=document.querySelector('.v44-record-actions');
    if(actions&&!actions.querySelector('[data-v54-create-pm]'))actions.insertAdjacentHTML('afterbegin','<button class="button" type="button" data-v54-create-pm="'+esc(w.id)+'">Create PM</button>');
  }

  const baseOpenWorkV54=openWorkDrawer;
  openWorkDrawer=function(id){baseOpenWorkV54(id);setTimeout(()=>patchWorkRecord(id),0)};
  window.openWorkDrawer=openWorkDrawer;

  function editTask(w,t){
    openModal({eyebrow:w.id+' · Task',title:'Edit task',submitText:'Save task',body:'<div class="form-grid">'+
      field('text','Task instruction',t.text,{required:true,span:true})+
      field('type','Task type',t.type||'General',{type:'select',options:['General','Text','Inspection','Meter'].map(x=>({value:x,label:x}))})+
      field('assigneeId','Assigned person',t.assigneeId||'',{type:'select',options:[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))]})+
      field('assigneeGroupId','Assigned group',t.assigneeGroupId||'',{type:'select',options:[{value:'',label:'No group'},...state.groups.map(g=>({value:g.id,label:g.name}))]})+
      field('estimateHours','Estimated labour',String(t.estimateHours||0),{type:'number',min:0,step:'.25'})+
      field('suggestedStart','Suggested start',t.suggestedStart||w.suggestedStart||day(0),{type:'date'})+
      '</div>',onSubmit:fd=>{t.text=String(fd.get('text'));t.type=String(fd.get('type'));t.assigneeId=String(fd.get('assigneeId')||'')||null;t.assigneeGroupId=String(fd.get('assigneeGroupId')||'')||null;t.estimateHours=Number(fd.get('estimateHours')||0);t.suggestedStart=String(fd.get('suggestedStart')||'')||null;w.estimateHours=(w.tasks||[]).reduce((n,x)=>n+Number(x.estimateHours||0),0)||w.estimateHours;w.history=w.history||[];w.history.unshift({at:iso(),text:'Task plan updated: '+t.text});addAudit('WORK_TASK_UPDATED',w.id,t.id+' · '+t.text);saveState();closeModal();setTimeout(()=>openWorkDrawer(w.id),0);toast('Task updated')}})
  }

  function returnPart(w,pid){
    const p=getPart(pid),line=w?.parts?.find(x=>x.partId===pid);if(!w||!p||!line||Number(line.actual||0)<=0)return;
    const qty=Number(prompt('Quantity to return from '+w.id,String(line.actual||1)));if(!(qty>0)||qty>Number(line.actual||0)){toast('Enter a valid quantity no greater than the amount used');return}
    const loc=(p.locations||[])[0];if(!loc){toast('Part has no stock location');return}
    const beforeActual=Number(line.actual||0),returnUnit=beforeActual>0&&Number(line.actualCost||0)>0?Number(line.actualCost)/beforeActual:Number(p.lastPrice||p.unitCost||0);
    postStock(pid,'Receipt',qty,loc.storeId,loc.bin,{reference:w.id,workOrderId:w.id,note:'Returned unused material from work order',unitCost:returnUnit});
    line.actual=Math.max(0,beforeActual-qty);if(line.actualCost!==undefined)line.actualCost=Math.max(0,Number(line.actualCost||0)-qty*returnUnit);w.history=w.history||[];w.history.unshift({at:iso(),text:qty+' '+p.uom+' '+p.code+' returned to stock'});addAudit('WORK_PART_RETURNED',w.id,p.code+' × '+qty);saveState();closeModal();setTimeout(()=>openWorkDrawer(w.id),0);toast('Part returned to stock')
  }

  function requestPart(w,pid){
    const p=getPart(pid);if(!w||!p)return;const open=state.purchaseRequests.find(r=>r.partId===pid&&r.workOrderId===w.id&&!['Received','Closed','Cancelled','Rejected'].includes(r.status));if(open){toast(open.id+' already covers this work order');return}
    const line=w.parts.find(x=>x.partId===pid),need=Math.max(1,Number(line?.planned||1)-Number(line?.actual||0)-partOnHand(p));const pr={id:uid('PR'),partId:pid,qty:need,quantity:need,workOrderId:w.id,status:'Requested',createdAt:iso(),reason:'Required for '+w.id,source:'Work order'};state.purchaseRequests.unshift(pr);w.status='Awaiting Parts';w.history=w.history||[];w.history.unshift({at:iso(),text:pr.id+' created for '+p.code+' × '+need});dispatchEvent('Purchase request created',pr.id+' created',p.name+' required for '+w.id,{partId:pid,relatedId:pr.id});addAudit('PURCHASE_REQUEST_CREATED',pr.id,w.id+' · '+p.code);saveState();closeModal();setTimeout(()=>openWorkDrawer(w.id),0);toast(pr.id+' created')
  }

  function createPMFromWork(w){
    const taskGroup={id:uid('TG'),name:w.title+' procedure',description:'Created from '+w.id,tasks:(w.tasks||[]).map(t=>({id:uid('TGT'),text:t.text,type:t.type||'General',assigneeId:t.assigneeId||null,assigneeGroupId:t.assigneeGroupId||null,estimateHours:Number(t.estimateHours||0)})),status:'Active'};state.taskGroups.push(taskGroup);
    const pm={id:uid('PM'),name:w.title+' PM',assetIds:[...(w.assetIds||[])],assetId:w.assetIds?.[0]||null,status:'Active',paused:false,scheduleMode:'Fixed',triggerLogic:'ANY',triggers:[{id:uid('TRG'),type:'Time',description:'Every 30 days',nextDue:day(30),active:true,satisfied:false}],taskGroupId:taskGroup.id,includeTaskGroupIds:[taskGroup.id],taskTemplate:[],requiredParts:(w.parts||[]).map(x=>({partId:x.partId,qty:Number(x.planned||x.actual||1)})),assigneeGroupId:w.assigneeGroupId||null,projectId:w.projectId||null,lastGenerated:null,generatedHistory:[]};state.scheduledMaintenance.unshift(pm);w.history=w.history||[];w.history.unshift({at:iso(),text:'Scheduled maintenance '+pm.id+' created from this work order'});addAudit('PM_CREATED_FROM_WORK',pm.id,w.id);saveState();closeModal();ui.route='pm';render();toast(pm.id+' created — edit its trigger before use')
  }

  document.addEventListener('click',e=>{
    const add=e.target.closest('[data-v54-add-task]');if(add){e.preventDefault();e.stopImmediatePropagation();const w=getWork(add.dataset.v54AddTask),box=e.target.closest('.v54-task-form'),text=box?.querySelector('[data-v54-task-text]')?.value.trim();if(!w||!text){toast('Enter a task instruction');return}const t={id:uid('T'),text,type:box.querySelector('[data-v54-task-type]').value,status:'Todo',assigneeId:box.querySelector('[data-v54-task-user]').value||null,assigneeGroupId:box.querySelector('[data-v54-task-group]').value||null,estimateHours:Number(box.querySelector('[data-v54-task-hours]').value||0),suggestedStart:box.querySelector('[data-v54-task-start]').value||null,result:null,resultNote:'',completedAt:null};w.tasks.push(t);w.estimateHours=(w.tasks||[]).reduce((n,x)=>n+Number(x.estimateHours||0),0)||w.estimateHours;w.history=w.history||[];w.history.unshift({at:iso(),text:'Task added: '+t.text});addAudit('WORK_TASK_ADDED',w.id,t.text);saveState();closeModal();setTimeout(()=>openWorkDrawer(w.id),0);return}
    const edit=e.target.closest('[data-v54-edit-task]');if(edit){e.preventDefault();e.stopImmediatePropagation();const [wid,tid]=edit.dataset.v54EditTask.split('|'),w=getWork(wid),t=w?.tasks?.find(x=>x.id===tid);if(w&&t)editTask(w,t);return}
    const ret=e.target.closest('[data-v54-return-part]');if(ret){e.preventDefault();e.stopImmediatePropagation();const [wid,pid]=ret.dataset.v54ReturnPart.split('|');returnPart(getWork(wid),pid);return}
    const req=e.target.closest('[data-v54-request-part]');if(req){e.preventDefault();e.stopImmediatePropagation();const [wid,pid]=req.dataset.v54RequestPart.split('|');requestPart(getWork(wid),pid);return}
    const pm=e.target.closest('[data-v54-create-pm]');if(pm){e.preventDefault();e.stopImmediatePropagation();const w=getWork(pm.dataset.v54CreatePm);if(w)createPMFromWork(w);return}
  },true);
})();