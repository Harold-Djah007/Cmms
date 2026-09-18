'use strict';

// SafiMaintain strict Problem → Cause → Action failure hierarchy v59.
(function(){
  ensureSpecState();

  const additionalDefaults=[
    {id:'FC-NOISE',problem:'Noise / vibration',causes:[{id:'CAUSE-BEARING',name:'Bearing wear',actions:['Lubricate','Replace bearing']},{id:'CAUSE-MISALIGN',name:'Misalignment',actions:['Adjust alignment','Replace coupling']}]},
    {id:'FC-NOOUTPUT',problem:'No output',causes:[{id:'CAUSE-POWER',name:'Power loss',actions:['Restore supply','Repair electrical fault']},{id:'CAUSE-COMP',name:'Component failure',actions:['Repair','Replace']}]},
    {id:'FC-LOWOUTPUT',problem:'Low output',causes:[{id:'CAUSE-WEAR',name:'Wear',actions:['Adjust','Repair','Replace']},{id:'CAUSE-BLOCK',name:'Restriction / contamination',actions:['Clean','Replace filter']}]},
    {id:'FC-ELEC',problem:'Electrical fault',causes:[{id:'CAUSE-WIRE',name:'Loose connection',actions:['Tighten','Repair wiring']},{id:'CAUSE-COMP-E',name:'Component failure',actions:['Replace component','Reset']}]},
    {id:'FC-DAMAGE',problem:'Mechanical damage',causes:[{id:'CAUSE-IMPACT',name:'Impact / operator damage',actions:['Repair','Replace']},{id:'CAUSE-FATIGUE',name:'Fatigue / wear',actions:['Repair','Replace']}]},
    {id:'FC-PROCESS',problem:'Process deviation',causes:[{id:'CAUSE-PROC',name:'Process condition',actions:['Adjust process','Monitor']},{id:'CAUSE-SENSOR',name:'Instrument / sensor fault',actions:['Calibrate','Replace sensor']}]},
    {id:'FC-INSP',problem:'Inspection finding',causes:[{id:'CAUSE-DEGRADE',name:'Condition degradation',actions:['Monitor','Repair','Replace']},{id:'CAUSE-SAFETY',name:'Safety non-conformance',actions:['Make safe','Correct non-conformance']}]},
    {id:'FC-OTHER',problem:'Other',causes:[{id:'CAUSE-UNKNOWN',name:'Unknown',actions:['Inspect','Monitor']},{id:'CAUSE-OTHER',name:'Other',actions:['Repair','Replace','Adjust','Clean','Lubricate','Reset','Calibrate']}]}
  ];
  let added=false;additionalDefaults.forEach(d=>{if(!state.failureCodeDefinitions.some(x=>x.problem===d.problem)){state.failureCodeDefinitions.push(d);added=true}});if(added)saveState();

  function definition(problem){return state.failureCodeDefinitions.find(d=>d.problem===problem)}
  function causeDef(problem,cause){return definition(problem)?.causes?.find(c=>c.name===cause)}
  function opts(values,selected){return ['Not selected',...values.filter(Boolean)].map(x=>'<option '+(x===selected?'selected':'')+'>'+esc(x)+'</option>').join('')}
  function patchFailureControls(id){
    const w=getWork(id),problem=document.querySelector('[data-v44-failure="problem"]'),cause=document.querySelector('[data-v44-failure="cause"]'),action=document.querySelector('[data-v44-failure="action"]');if(!w||!problem||!cause||!action)return;
    const problems=state.failureCodeDefinitions.map(d=>d.problem);
    if(w.failureCodes.problem!=='Not selected'&&!problems.includes(w.failureCodes.problem))problems.push(w.failureCodes.problem);
    problem.innerHTML=opts(problems,w.failureCodes.problem);
    const def=definition(problem.value),causes=(def?.causes||[]).map(c=>c.name);if(w.failureCodes.cause!=='Not selected'&&!causes.includes(w.failureCodes.cause))causes.push(w.failureCodes.cause);
    cause.innerHTML=opts(causes,w.failureCodes.cause);
    const cdef=causeDef(problem.value,cause.value),actions=[...(cdef?.actions||[])];if(w.failureCodes.action!=='Not selected'&&!actions.includes(w.failureCodes.action))actions.push(w.failureCodes.action);
    action.innerHTML=opts(actions,w.failureCodes.action);
    const body=problem.closest('.v44-section-body');if(body&&!body.querySelector('.v59-pca-note'))body.insertAdjacentHTML('beforeend','<div class="v59-pca-note"><b>Structured RCA:</b> select the observed Problem first. SafiMaintain then limits Cause to that problem and Action to that cause. This keeps reliability reports consistent.</div>')
  }
  function refreshCauseAction(){
    const problem=document.querySelector('[data-v44-failure="problem"]'),cause=document.querySelector('[data-v44-failure="cause"]'),action=document.querySelector('[data-v44-failure="action"]');if(!problem||!cause||!action)return;
    cause.innerHTML=opts((definition(problem.value)?.causes||[]).map(c=>c.name),'Not selected');action.innerHTML=opts([],'Not selected')
  }
  function refreshAction(){
    const problem=document.querySelector('[data-v44-failure="problem"]'),cause=document.querySelector('[data-v44-failure="cause"]'),action=document.querySelector('[data-v44-failure="action"]');if(!problem||!cause||!action)return;
    action.innerHTML=opts(causeDef(problem.value,cause.value)?.actions||[],'Not selected')
  }

  const previousOpen=openWorkDrawer;
  openWorkDrawer=function(id){previousOpen(id);setTimeout(()=>patchFailureControls(id),30)};
  window.openWorkDrawer=openWorkDrawer;

  function codeSettings(){
    return '<div class="v50-page">'+pageHead('Settings','Failure codes','Manage the strict Problem → Cause → Action hierarchy used for corrective-work RCA.','<button class="button primary" data-v59-add-problem>＋ Problem</button>')+
      '<div class="v59-code-grid">'+state.failureCodeDefinitions.map(p=>'<article class="v59-problem"><div class="v59-problem-head"><span><strong>'+esc(p.problem)+'</strong><small>'+esc(p.id)+' · '+(p.causes||[]).length+' causes</small></span><button class="button small danger" data-v59-delete-problem="'+esc(p.id)+'">Delete</button></div>'+
      (p.causes||[]).map(c=>'<div class="v59-cause"><div><strong>'+esc(c.name)+'</strong><button class="button small" data-v59-add-action="'+esc(p.id)+'|'+esc(c.id)+'">＋ Action</button></div><div class="v59-actions">'+(c.actions||[]).map(a=>'<span class="v59-action">'+esc(a)+' <button data-v59-delete-action="'+esc(p.id)+'|'+esc(c.id)+'|'+encodeURIComponent(a)+'">×</button></span>').join('')+'</div></div>').join('')+
      '<div class="v59-add-row"><button class="button small primary" data-v59-add-cause="'+esc(p.id)+'">＋ Add cause</button></div></article>').join('')+'</div></div>';
  }

  const baseRender=render;
  render=function(){baseRender();if(ui.route==='failure-codes'){document.getElementById('appView').innerHTML=codeSettings();document.title='Failure codes · SafiMaintain';document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route==='failure-codes'))}if(document.querySelector('[data-v44-failure="problem"]')){const id=document.querySelector('[data-v44-save-failure]')?.dataset.v44SaveFailure;if(id)patchFailureControls(id)}};
  window.render=render;

  function addProblem(){
    openModal({eyebrow:'Failure codes',title:'Add problem',submitText:'Create problem',body:'<div class="form-grid">'+field('problem','Problem name','',{required:true,span:true})+'</div>',onSubmit:fd=>{const name=String(fd.get('problem')||'').trim();if(!name)return;if(state.failureCodeDefinitions.some(x=>x.problem.toLowerCase()===name.toLowerCase())){toast('That problem already exists');return}state.failureCodeDefinitions.push({id:uid('FC'),problem:name,causes:[]});addAudit('FAILURE_PROBLEM_CREATED',name,name);saveState();closeModal();render();toast('Problem created')}})
  }
  function addCause(pid){
    const p=state.failureCodeDefinitions.find(x=>x.id===pid);if(!p)return;openModal({eyebrow:p.problem,title:'Add cause',submitText:'Create cause',body:'<div class="form-grid">'+field('cause','Cause name','',{required:true,span:true})+'</div>',onSubmit:fd=>{const name=String(fd.get('cause')||'').trim();if(!name)return;if((p.causes||[]).some(x=>x.name.toLowerCase()===name.toLowerCase())){toast('That cause already exists');return}p.causes=p.causes||[];p.causes.push({id:uid('CAUSE'),name,actions:[]});addAudit('FAILURE_CAUSE_CREATED',p.id,name);saveState();closeModal();render();toast('Cause created')}})
  }
  function addAction(pid,cid){
    const p=state.failureCodeDefinitions.find(x=>x.id===pid),c=p?.causes?.find(x=>x.id===cid);if(!c)return;openModal({eyebrow:p.problem+' → '+c.name,title:'Add action',submitText:'Create action',body:'<div class="form-grid">'+field('action','Action name','',{required:true,span:true})+'</div>',onSubmit:fd=>{const name=String(fd.get('action')||'').trim();if(!name)return;if((c.actions||[]).some(x=>x.toLowerCase()===name.toLowerCase())){toast('That action already exists');return}c.actions=c.actions||[];c.actions.push(name);addAudit('FAILURE_ACTION_CREATED',c.id,name);saveState();closeModal();render();toast('Action created')}})
  }

  document.addEventListener('change',e=>{
    if(e.target.matches('[data-v44-failure="problem"]'))refreshCauseAction();
    if(e.target.matches('[data-v44-failure="cause"]'))refreshAction()
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-v59-add-problem]')){e.preventDefault();e.stopImmediatePropagation();addProblem();return}
    const cause=e.target.closest('[data-v59-add-cause]');if(cause){e.preventDefault();e.stopImmediatePropagation();addCause(cause.dataset.v59AddCause);return}
    const action=e.target.closest('[data-v59-add-action]');if(action){e.preventDefault();e.stopImmediatePropagation();const [p,c]=action.dataset.v59AddAction.split('|');addAction(p,c);return}
    const da=e.target.closest('[data-v59-delete-action]');if(da){e.preventDefault();e.stopImmediatePropagation();const [pid,cid,value]=da.dataset.v59DeleteAction.split('|'),p=state.failureCodeDefinitions.find(x=>x.id===pid),c=p?.causes?.find(x=>x.id===cid);if(c){c.actions=c.actions.filter(x=>x!==decodeURIComponent(value));saveState();render()}return}
    const dp=e.target.closest('[data-v59-delete-problem]');if(dp){e.preventDefault();e.stopImmediatePropagation();const p=state.failureCodeDefinitions.find(x=>x.id===dp.dataset.v59DeleteProblem);if(!p)return;if(state.workOrders.some(w=>w.failureCodes?.problem===p.problem)){toast('This problem is already used in work history and cannot be deleted');return}state.failureCodeDefinitions=state.failureCodeDefinitions.filter(x=>x.id!==p.id);saveState();render();return}
  },true);
})();