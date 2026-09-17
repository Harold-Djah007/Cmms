'use strict';

// SafiMaintain v25 — closes the loop between asset events, work, meters and alerts.
(function(){
  const defaultEventTypes=[
    {id:'EVT-BREAKDOWN',name:'Breakdown',priority:'Critical',createWork:true,active:true,task:'Diagnose failure and restore the asset to service'},
    {id:'EVT-SAFETY',name:'Safety stop',priority:'Critical',createWork:true,active:true,task:'Make the area safe and investigate the safety stop'},
    {id:'EVT-INSPECTION',name:'Inspection finding',priority:'High',createWork:true,active:true,task:'Inspect the finding and complete corrective action'},
    {id:'EVT-OBSERVATION',name:'Operator observation',priority:'Medium',createWork:false,active:true,task:'Review the operator observation'}
  ];

  function ensureConnectedState(){
    state.assetEventTypes=Array.isArray(state.assetEventTypes)&&state.assetEventTypes.length?state.assetEventTypes:structuredClone(defaultEventTypes);
    state.userNotificationPreferences=Array.isArray(state.userNotificationPreferences)?state.userNotificationPreferences:[];
    state.users.forEach(u=>{
      const role=getRole(u.roleId)?.name||'';
      if(!state.userNotificationPreferences.some(p=>p.userId===u.id)) state.userNotificationPreferences.push({userId:u.id,inApp:true,email:!!u.emailAlerts,scope:['Operations manager','Maintenance planner'].includes(role)?'All permitted assets':'Relevant assets'});
    });
    if(!state.notificationRules.some(r=>r.event==='Asset event recorded')) state.notificationRules.push({id:'NR-EVENT',event:'Asset event recorded',audiences:['Operations manager','Maintenance planner','Asset owner'],inApp:true,email:true});
  }
  ensureConnectedState();

  function preference(userId){return state.userNotificationPreferences.find(p=>p.userId===userId)||{inApp:true,email:true,scope:'Relevant assets'}}
  function isRelevant(userId,context={}){
    if(!context.assetId)return true;
    const a=getAsset(context.assetId),u=getUser(userId);if(!a||!u)return false;
    if(a.ownerUserId===userId||(a.ownerGroupId&&(u.groupIds||[]).includes(a.ownerGroupId)))return true;
    if(activeWorkForAsset(a.id).some(w=>(w.assigneeIds||[]).includes(userId)))return true;
    return (context.assigneeIds||[]).includes(userId);
  }

  // Delivery follows the rule audience first, then each person's selected channels and asset scope.
  dispatchEvent=function(event,title,message,context={}){
    ensureConnectedState();
    const rule=state.notificationRules.find(r=>r.event===event);if(!rule)return;
    userIdsForAudience(rule,context).forEach(userId=>{
      const pref=preference(userId);if(pref.scope==='Relevant assets'&&!isRelevant(userId,context))return;
      const u=getUser(userId);
      if(rule.inApp&&pref.inApp) state.notifications.unshift({id:uid('N'),userId,event,title,message,createdAt:iso(),read:false,relatedId:context.relatedId||context.assetId||context.partId||null});
      if(rule.email&&pref.email&&u?.emailAlerts&&u.email) state.mailOutbox.unshift({id:uid('MAIL'),to:u.email,subject:`[SafiMaintain] ${title}`,body:message,createdAt:iso(),status:'Queued locally'});
    });
  };
  window.dispatchEvent=dispatchEvent;

  function makeWorkFromEvent(asset,eventType,detail){
    const wo={id:uid('WO'),title:`${eventType.name}: ${asset.name}`,assetIds:[asset.id],type:eventType.name==='Inspection finding'?'Inspection':'Corrective',priority:eventType.priority,status:'Open',assigneeIds:asset.ownerUserId?[asset.ownerUserId]:[],due:day(eventType.priority==='Critical'?0:2),estimateHours:2,actualHours:0,source:`Asset event · ${eventType.name}`,instructions:detail,tasks:[{id:uid('T'),text:eventType.task,type:'Inspection',status:'Todo'}],parts:[],createdAt:iso(),completedAt:null,history:[{at:iso(),text:`Created automatically from ${eventType.name} asset event`}]};
    state.workOrders.unshift(wo);return wo;
  }

  function showAssetEventForm(assetId){
    if(!requirePermission('asset.edit','record asset events'))return;
    const asset=getAsset(assetId);if(!asset)return;
    const types=state.assetEventTypes.filter(t=>t.active);
    openModal({eyebrow:'Asset event',title:`Record event · ${asset.code}`,submitText:'Record event',body:`<div class="notice info" style="margin-bottom:14px">The event is written to the asset log. Event types configured for follow-up will create a linked work order automatically.</div><div class="form-grid">${field('eventTypeId','Event type',types[0]?.id||'',{type:'select',options:types.map(t=>({value:t.id,label:`${t.name} · ${t.priority}`}))})}${field('detail','What happened?','',{type:'textarea',required:true,span:true})}<label class="check-row span-2"><input type="checkbox" name="notify" checked> Alert the responsible maintenance parties</label></div>`,onSubmit:fd=>{
      const type=state.assetEventTypes.find(t=>t.id===String(fd.get('eventTypeId'))),detail=String(fd.get('detail')||'').trim();if(!type||!detail){toast('Choose an event type and describe what happened');return}
      const event={id:uid('AE'),assetId:asset.id,eventTypeId:type.id,type:type.name,at:iso(),userId:CURRENT_USER,detail,workOrderId:null};
      state.assetEvents.unshift(event);let wo=null;if(type.createWork){wo=makeWorkFromEvent(asset,type,detail);event.workOrderId=wo.id}
      addAudit('ASSET_EVENT_RECORDED',event.id,`${asset.code} · ${type.name}${wo?` · ${wo.id} created`:''}`);
      if(fd.get('notify')==='on') dispatchEvent('Asset event recorded',`${type.name}: ${asset.code}`,`${asset.name} — ${detail}${wo?` A work order (${wo.id}) was created.`:''}`,{assetId:asset.id,assigneeIds:wo?.assigneeIds||[],relatedId:event.id});
      saveState();closeModal();render();toast(wo?`${type.name} recorded · ${wo.id} created`:`${type.name} recorded`);
    }});
  }
  window.showAssetEventForm=showAssetEventForm;

  function meterThreshold(pm){const n=Number(String(pm.nextDue||'').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:null}
  function meterInterval(pm){const n=Number(String(pm.trigger||'').replace(/[^0-9.]/g,''));return Number.isFinite(n)&&n>0?n:null}
  function evaluateMeterPlans(meter){
    const created=[];
    state.scheduledMaintenance.filter(pm=>pm.status==='Active'&&pm.triggerType==='Meter'&&pm.assetId===meter.assetId).forEach(pm=>{
      const threshold=meterThreshold(pm);if(threshold===null||Number(meter.current)<threshold)return;
      if(state.workOrders.some(w=>w.source===pm.id&&!['Completed','Cancelled'].includes(w.status)))return;
      generatePM(pm.id);created.push(pm.id);
      const interval=meterInterval(pm);if(interval)pm.nextDue=`${(threshold+interval).toLocaleString()} ${meter.unit}`;
    });
    return created;
  }
  function postMeterReading(meter,value,note=''){
    if(!Number.isFinite(value))return [];
    if(Number(value)<Number(meter.current)){throw new Error(`${meter.name} cannot be lower than its current reading (${meter.current} ${meter.unit}).`)}
    meter.current=value;meter.readings.push({value,at:iso(),userId:CURRENT_USER,note});addAudit('METER_READING',meter.id,`${value} ${meter.unit}${note?` · ${note}`:''}`);return evaluateMeterPlans(meter);
  }

  showMeterReadingForm=function(){
    openModal({eyebrow:'Meter reading',title:'Add meter reading',body:`<div class="form-grid">${field('meterId','Meter',state.meters[0]?.id||'',{type:'select',options:state.meters.map(m=>({value:m.id,label:`${m.name} · ${getAsset(m.assetId)?.code} · ${m.current} ${m.unit}`}))})}${field('value','Reading','',{type:'number',required:true,step:'0.01'})}${field('note','Reading note','',{span:true})}</div>`,onSubmit:fd=>{const m=state.meters.find(x=>x.id===String(fd.get('meterId')));if(!m)return;try{const plans=postMeterReading(m,Number(fd.get('value')),String(fd.get('note')||''));saveState();closeModal();render();toast(plans.length?`Reading saved · ${plans.length} PM work order generated`:'Meter reading saved')}catch(err){toast(err.message)}}});
  };
  window.showMeterReadingForm=showMeterReadingForm;

  function showBatchMeterReadings(){
    openModal({eyebrow:'Meter readings',title:'Batch meter readings',submitText:'Post readings',body:`<div class="notice info" style="margin-bottom:14px">Leave a reading blank to skip it. Meter-based maintenance generates only when its threshold is reached and no open work already exists for that plan.</div><div class="v25-meter-batch">${state.meters.map(m=>`<label><span><strong>${esc(getAsset(m.assetId)?.code||m.assetId)} · ${esc(m.name)}</strong><small>Current ${esc(m.current)} ${esc(m.unit)}</small></span><input name="meter_${esc(m.id)}" type="number" step="0.01" min="${esc(m.current)}" placeholder="New reading"></label>`).join('')}</div>`,onSubmit:fd=>{let posted=0,generated=0;try{state.meters.forEach(m=>{const raw=fd.get(`meter_${m.id}`);if(raw==='')return;generated+=postMeterReading(m,Number(raw),'Batch entry').length;posted++});if(!posted){toast('Enter at least one meter reading');return}saveState();closeModal();render();toast(`${posted} reading${posted===1?'':'s'} posted${generated?` · ${generated} PM work generated`:''}`)}catch(err){toast(err.message)}}});
  }

  renderMeters=function(){
    return pageHead('Asset management','Meters','Record one or many readings. Meter thresholds create scheduled work without duplicate open orders.',`<button class="button" data-action="batch-meter-reading">Batch readings</button><button class="button primary" data-action="add-meter-reading">＋ Add reading</button>`)+`<section class="card">${table(['Meter','Asset','Current','Next meter PM','Last reading','History'],state.meters.map(m=>{const pm=state.scheduledMaintenance.find(p=>p.status==='Active'&&p.triggerType==='Meter'&&p.assetId===m.assetId);return `<tr><td><span class="cell-title">${esc(m.name)}</span><span class="cell-sub">${esc(m.id)}</span></td><td>${esc(getAsset(m.assetId)?.name||m.assetId)}</td><td><b>${esc(m.current)} ${esc(m.unit)}</b></td><td>${esc(pm?.nextDue||'—')}</td><td>${dateFmt(m.readings.at(-1)?.at)}</td><td>${m.readings.length} readings</td></tr>`}),'No meters')}</section>`;
  };
  window.renderMeters=renderMeters;

  const baseRenderNotifications=renderNotifications;
  renderNotifications=function(){
    ensureConnectedState();
    return baseRenderNotifications()+`<section class="card v25-admin-card"><div class="card-head"><div><h2>Personal delivery settings</h2><p>Choose each person’s channels and how broadly asset alerts may reach them</p></div></div>${table(['Person','Role','Asset scope','In-app','Email'],state.users.map(u=>{const p=preference(u.id);return `<tr><td><span class="cell-title">${esc(u.name)}</span><span class="cell-sub">${esc(u.email||'No email')}</span></td><td>${esc(getRole(u.roleId)?.name||'—')}</td><td><select data-v25-user-scope="${u.id}"><option ${p.scope==='Relevant assets'?'selected':''}>Relevant assets</option><option ${p.scope==='All permitted assets'?'selected':''}>All permitted assets</option></select></td><td><input type="checkbox" data-v25-user-channel="${u.id}|inApp" ${p.inApp?'checked':''}></td><td><input type="checkbox" data-v25-user-channel="${u.id}|email" ${p.email?'checked':''} ${u.email?'':'disabled'}></td></tr>`}),'No people')}</section><section class="card v25-admin-card"><div class="card-head"><div><h2>Asset event types</h2><p>Standard events and whether they automatically create accountable work</p></div><button class="button" data-v25-add-event-type>＋ Event type</button></div>${table(['Event type','Default priority','Create work','Status'],state.assetEventTypes.map(t=>`<tr><td><b>${esc(t.name)}</b><span class="cell-sub">${esc(t.task)}</span></td><td>${status(t.priority)}</td><td><input type="checkbox" data-v25-event-work="${t.id}" ${t.createWork?'checked':''}></td><td><input type="checkbox" data-v25-event-active="${t.id}" ${t.active?'checked':''}></td></tr>`),'No event types')}</section>`;
  };
  window.renderNotifications=renderNotifications;

  function assetMenu(asset,anchor){
    document.querySelector('.v25-asset-menu')?.remove();const menu=document.createElement('div');menu.className='v21-more-menu v25-asset-menu';menu.innerHTML=`<button type="button" data-v25-event="${asset.id}">Record asset event</button><button type="button" data-edit-asset="${asset.id}">Edit asset</button><button type="button" data-fx23-clone="${asset.id}">Clone asset</button><div></div><button type="button" class="danger" data-v21-delete="${asset.id}">Delete asset</button>`;document.body.appendChild(menu);const r=anchor.getBoundingClientRect();menu.style.left=`${Math.max(12,r.right-210)}px`;menu.style.top=`${r.bottom+6}px`;
  }

  document.addEventListener('click',e=>{
    const event=e.target.closest('[data-v25-event]');if(event){e.preventDefault();e.stopImmediatePropagation();document.querySelector('.v25-asset-menu')?.remove();showAssetEventForm(String(event.dataset.v25Event));return}
    const more=e.target.closest('[data-fx23-more],[data-fx23-rowmenu]');if(more){e.preventDefault();e.stopImmediatePropagation();const id=more.dataset.fx23More||more.dataset.fx23Rowmenu,a=getAsset(id);if(a)assetMenu(a,more);return}
    if(e.target.closest('[data-action="batch-meter-reading"]')){e.preventDefault();e.stopImmediatePropagation();showBatchMeterReadings();return}
    if(e.target.closest('[data-v25-add-event-type]')){e.preventDefault();e.stopImmediatePropagation();openModal({eyebrow:'Administration',title:'Add asset event type',body:`<div class="form-grid">${field('name','Event name','',{required:true})}${field('priority','Default priority','Medium',{type:'select',options:['Low','Medium','High','Critical'].map(x=>({value:x,label:x}))})}${field('task','Default work task','Investigate and resolve the event',{required:true,span:true})}<label class="check-row span-2"><input type="checkbox" name="createWork" checked> Create a work order automatically</label></div>`,onSubmit:fd=>{const t={id:uid('EVT'),name:String(fd.get('name')),priority:String(fd.get('priority')),task:String(fd.get('task')),createWork:fd.get('createWork')==='on',active:true};state.assetEventTypes.push(t);addAudit('ASSET_EVENT_TYPE_CREATED',t.id,t.name);saveState();closeModal();render();toast('Asset event type added')}});return}
  },true);

  document.addEventListener('change',e=>{
    if(e.target.dataset.v25UserChannel){const [id,key]=e.target.dataset.v25UserChannel.split('|'),p=preference(id);p[key]=e.target.checked;addAudit('USER_NOTIFICATION_UPDATED',id,`${key} ${p[key]?'enabled':'disabled'}`);saveState();toast('Delivery setting saved');return}
    if(e.target.dataset.v25UserScope){const p=preference(e.target.dataset.v25UserScope);p.scope=e.target.value;addAudit('USER_NOTIFICATION_UPDATED',p.userId,`scope=${p.scope}`);saveState();toast('Alert scope saved');return}
    if(e.target.dataset.v25EventWork){const t=state.assetEventTypes.find(x=>x.id===e.target.dataset.v25EventWork);if(t){t.createWork=e.target.checked;addAudit('ASSET_EVENT_TYPE_UPDATED',t.id,`createWork=${t.createWork}`);saveState();toast('Event workflow saved')}return}
    if(e.target.dataset.v25EventActive){const t=state.assetEventTypes.find(x=>x.id===e.target.dataset.v25EventActive);if(t){t.active=e.target.checked;addAudit('ASSET_EVENT_TYPE_UPDATED',t.id,`active=${t.active}`);saveState();toast('Event status saved')}return}
  },true);

  saveState();
  if(ui.route==='meters'||ui.route==='notifications')render();
})();
