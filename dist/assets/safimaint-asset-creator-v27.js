'use strict';

// SafiMaintain v29 — Fiix hierarchy rules: physical location + system/subsystem.
(function(){
  const LOCATION_TYPES=['Facility','Department','Room','Area','Production area'];
  const EQUIPMENT_TYPES=['Equipment','Subassembly'];

  function kindFor(type){return LOCATION_TYPES.includes(type)?'location':EQUIPMENT_TYPES.includes(type)?'equipment':'tool'}
  function typeLabel(type){return type==='Production area'?'Room / area':type}
  function allAssets(){return state.assets.filter(a=>a.type!=='Site')}
  function locationAssets(){return allAssets().filter(a=>LOCATION_TYPES.includes(a.type))}
  function equipmentAssets(){return allAssets().filter(a=>EQUIPMENT_TYPES.includes(a.type))}
  function assetPath(asset){
    const out=[],seen=new Set();let current=asset;
    while(current&&current.type!=='Site'&&!seen.has(String(current.id))){seen.add(String(current.id));out.unshift(current.name);current=getAsset(current.parentId)}
    return out.join(' › ');
  }
  function descendantsOf(id,out=[],seen=new Set()){
    state.assets.filter(a=>String(a.parentId||'')===String(id)).forEach(a=>{if(seen.has(String(a.id)))return;seen.add(String(a.id));out.push(a);descendantsOf(a.id,out,seen)});return out;
  }
  function optionsFor(items,first,existing){
    const banned=new Set(existing?[String(existing.id),...descendantsOf(existing.id).map(a=>String(a.id))]:[]);
    return [{value:'',label:first},...items.filter(a=>!banned.has(String(a.id))).sort((a,b)=>assetPath(a).localeCompare(assetPath(b))).map(a=>({value:a.id,label:`${assetPath(a)} · ${a.code}`}))];
  }
  function currentLocationId(existing){
    if(existing?.locationId&&getAsset(existing.locationId))return existing.locationId;
    const parent=getAsset(existing?.parentId);return parent&&LOCATION_TYPES.includes(parent.type)?parent.id:(parent?.locationId||'');
  }
  function currentPartOfId(existing){
    if(existing?.partOfAssetId&&getAsset(existing.partOfAssetId))return existing.partOfAssetId;
    const parent=getAsset(existing?.parentId);return parent&&EQUIPMENT_TYPES.includes(parent.type)?parent.id:'';
  }

  function openKindChooser(parentId=null){
    if(!requirePermission('asset.edit','create assets'))return;
    const parent=getAsset(parentId);
    openModal({eyebrow:'Asset management',title:'Create new asset',body:`
      ${parent?`<div class="v27-parent-context"><small>Add beneath</small><strong>${esc(assetPath(parent))}</strong></div>`:''}
      <p class="v27-intro">Choose the kind of record first. SafiMaintain will only ask for fields that belong to it.</p>
      <div class="v27-kind-grid">
        <button type="button" data-v27-kind="location" data-v27-parent="${esc(parentId||'')}"><span class="v27-kind-icon facility">▥</span><span><strong>Locations or Facilities</strong><small>Facility, building, room, area or department</small></span><b>›</b></button>
        <button type="button" data-v27-kind="equipment" data-v27-parent="${esc(parentId||'')}"><span class="v27-kind-icon equipment">▣</span><span><strong>Equipment or Machines</strong><small>Maintainable equipment located in a facility or room</small></span><b>›</b></button>
        <button type="button" data-v27-kind="tool" data-v27-parent="${esc(parentId||'')}"><span class="v27-kind-icon tool">⚒</span><span><strong>Tools</strong><small>Portable tools located in a facility or assigned to equipment</small></span><b>›</b></button>
      </div>`});
  }

  function identityFields(existing,typeOptions,defaultType){
    return `${field('type','Record type',defaultType,{type:'select',options:typeOptions.map(x=>({value:x,label:typeLabel(x)}))})}${field('code','Asset code',existing?.code||'',{required:true})}${field('name','Name',existing?.name||'',{required:true})}${field('category','Category',existing?.category||typeLabel(defaultType))}${field('description','Description',existing?.description||'',{type:'textarea',span:true})}`;
  }
  function responsibilityFields(existing){
    const users=[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))];
    const groups=[{value:'',label:'Unassigned'},...state.groups.map(g=>({value:g.id,label:g.name}))];
    return `${field('ownerUserId','Responsible person',existing?.ownerUserId||'',{type:'select',options:users})}${field('ownerGroupId','Responsible group',existing?.ownerGroupId||'',{type:'select',options:groups})}${field('criticality','Criticality',existing?.criticality||'B',{type:'select',options:['A','B','C'].map(x=>({value:x,label:x}))})}${field('condition','Condition',existing?.condition||'Healthy',{type:'select',options:['Healthy','Attention','Critical'].map(x=>({value:x,label:x}))})}`;
  }
  function relationshipChoice(value,title,description,checked){
    return `<label class="v27-relation-choice ${checked?'selected':''}"><input type="radio" name="placementMode" value="${esc(value)}" ${checked?'checked':''}><span><strong>${esc(title)}</strong><small>${esc(description)}</small></span><b>✓</b></label>`;
  }
  function editorBody(existing,kind,suggestedParent){
    const suggested=getAsset(suggestedParent);
    const locationDefault=suggested&&LOCATION_TYPES.includes(suggested.type)?suggested.id:(suggested?.locationId||currentLocationId(existing));
    const partDefault=suggested&&EQUIPMENT_TYPES.includes(suggested.type)?suggested.id:currentPartOfId(existing);
    if(kind==='location'){
      const parentDefault=suggested&&LOCATION_TYPES.includes(suggested.type)?suggested.id:(existing?.parentId||'');
      const mode=parentDefault?'partOf':'top';
      return `<div class="v27-editor"><section><h3>Location identity</h3><div class="form-grid">${identityFields(existing,['Facility','Department','Room','Area'],existing?.type==='Production area'?'Area':existing?.type||'Facility')}</div><p class="v27-category-note">Categories group similar records for filtering. They do not create levels in the hierarchy.</p></section><section><h3>Position in the hierarchy</h3><div class="v27-placement-help">Match the real facility layout. Begin with the main facility, then add its departments, rooms and areas beneath it.</div><div class="v27-relation-grid">${relationshipChoice('top','This is a top-level facility','Use only for the main facility or building.',mode==='top')}${relationshipChoice('partOf','This location is part of','Place a room, department or area inside an existing location.',mode==='partOf')}</div><div class="v27-relation-panel ${mode==='partOf'?'':'hidden'}" data-v27-panel="partOf">${field('locationParentId','Parent facility / location',parentDefault,{type:'select',options:optionsFor(locationAssets(),'Select the parent facility',existing)})}</div></section><section><h3>Responsibility</h3><div class="form-grid">${responsibilityFields(existing)}</div></section></div>`;
    }
    const types=kind==='equipment'?['Equipment','Subassembly']:['Tool'];
    const mode=partDefault?'partOf':'locatedAt';
    const subject=kind==='tool'?'tool':'equipment';
    return `<div class="v27-editor"><section><h3>${kind==='tool'?'Tool':'Equipment'} identity</h3><div class="form-grid">${identityFields(existing,types,existing?.type||types[0])}</div><p class="v27-category-note">Use Category for similar asset types. Use the hierarchy only for physical location and system relationships.</p></section><section><h3>Position in the hierarchy</h3><div class="v27-placement-help">Choose the one relationship that describes this ${subject} in real life.</div><div class="v27-relation-grid">${relationshipChoice('locatedAt',`This ${subject} is located at`,'Place it directly inside a facility, department, room or area.',mode==='locatedAt')}${relationshipChoice('partOf',`This ${subject} is part of`,'Make it a child component of an equipment system.',mode==='partOf')}</div><div class="v27-relation-panel ${mode==='locatedAt'?'':'hidden'}" data-v27-panel="locatedAt">${field('locationId','Facility / room',locationDefault,{type:'select',options:optionsFor(locationAssets(),'Select its physical location',existing)})}</div><div class="v27-relation-panel ${mode==='partOf'?'':'hidden'}" data-v27-panel="partOf">${field('partOfAssetId','Parent equipment',partDefault,{type:'select',options:optionsFor(equipmentAssets(),'Select the parent equipment',existing)})}<p class="v27-inherit-note">The physical location will be inherited from the parent equipment.</p></div></section><section><h3>Responsibility</h3><div class="form-grid">${responsibilityFields(existing)}</div></section><details class="v27-advanced" ${existing?'open':''}><summary>Nameplate & purchase details</summary><div class="form-grid">${field('manufacturer','Manufacturer',existing?.manufacturer||'')}${field('model','Model',existing?.model||'')}${field('serial','Serial number',existing?.serial||'')}${field('warrantyExpiry','Warranty expiry',existing?.warrantyExpiry||'',{type:'date'})}</div></details></div>`;
  }

  function openAssetEditor(existing=null,suggestedParent=null,kind=null){
    if(!requirePermission('asset.edit',existing?'edit assets':'create assets'))return;
    if(existing?.type==='Site')return;
    const editId=existing?.id||null;kind=kind||kindFor(existing?.type||'Equipment');
    openModal({eyebrow:'Asset management',title:existing?`Edit ${existing.name}`:kind==='location'?'Add a location or facility':kind==='equipment'?'Add equipment or machine':'Add a tool',submitText:existing?'Save changes':'Create record',body:`<div class="v27-flow"><span class="done">✓</span><b>Choose type</b><i></i><span class="active">2</span><b>Details & placement</b></div>${editorBody(existing,kind,suggestedParent)}`,onSubmit:fd=>{
      const v=Object.fromEntries(fd.entries());const type=String(v.type||'Equipment');const code=String(v.code||'').trim(),name=String(v.name||'').trim();
      if(!code||!name){toast('Asset code and name are required');return}
      const duplicate=allAssets().find(a=>String(a.id)!==String(editId)&&String(a.code||'').trim().toLowerCase()===code.toLowerCase());if(duplicate){toast(`Asset code ${code} is already in use`);return}
      const placementMode=String(v.placementMode||'');let locationId=null,partOfAssetId=null,parentId=null;
      if(kind==='location'){
        if(placementMode==='top'){
          if(type!=='Facility'){toast('Only a facility can be a top-level asset. Place the department, room or area inside a facility.');return}
        }else{
          parentId=String(v.locationParentId||'').trim()||null;locationId=parentId;
          if(!parentId){toast('Select the facility or location this record is part of');return}
        }
        if(parentId&&!LOCATION_TYPES.includes(getAsset(parentId)?.type)){toast('A location can only be placed inside a facility or area');return}
      }else{
        if(placementMode==='partOf'){
          partOfAssetId=String(v.partOfAssetId||'').trim()||null;
          const parentEquipment=getAsset(partOfAssetId);
          if(!parentEquipment||!EQUIPMENT_TYPES.includes(parentEquipment.type)){toast('Select the equipment this record is part of');return}
          locationId=parentEquipment.locationId||null;parentId=partOfAssetId;
        }else{
          locationId=String(v.locationId||'').trim()||null;
          if(!locationId||!LOCATION_TYPES.includes(getAsset(locationId)?.type)){toast('Select the facility, room or area where this asset is located');return}
          parentId=locationId;
        }
      }
      if(editId){const bad=new Set([String(editId),...descendantsOf(editId).map(a=>String(a.id))]);if(parentId&&bad.has(String(parentId))){toast('A record cannot be placed beneath itself or one of its children');return}}
      const values={code,name,type,category:v.category||typeLabel(type),description:v.description||'',parentId,locationId,partOfAssetId,location:locationId?assetPath(getAsset(locationId)):'',ownerUserId:v.ownerUserId||'',ownerGroupId:v.ownerGroupId||'',criticality:v.criticality||'B',condition:v.condition||'Healthy',manufacturer:v.manufacturer||'',model:v.model||'',serial:v.serial||'',warrantyExpiry:v.warrantyExpiry||'',siteId:existing?.siteId||state.sites?.find(s=>s.active)?.id||state.sites?.[0]?.id||null,lastUpdatedAt:iso()};
      let savedId=editId;
      if(editId){const index=state.assets.findIndex(a=>String(a.id)===String(editId));if(index<0){toast('Asset record could not be found');return}const before=state.assets[index];state.assets[index]={...before,...values,id:before.id};state.assetEvents.unshift({id:uid('AE'),assetId:before.id,type:'Asset updated',at:iso(),userId:CURRENT_USER,detail:`${code} placement and master record updated`});addAudit('ASSET_UPDATED',before.id,`${code} ${name} updated`)}
      else{const created={id:uid('AST'),commissioned:day(0),bom:[],operatingState:'Online',...values};state.assets.push(created);savedId=created.id;state.assetEvents.unshift({id:uid('AE'),assetId:created.id,type:'Asset created',at:iso(),userId:CURRENT_USER,detail:`${code} created in ${locationId?assetPath(getAsset(locationId)):'the top-level hierarchy'}`});addAudit('ASSET_CREATED',created.id,`${code} ${name}`)}
      ui.selectedAsset=savedId;ui.assetSearch='';ui.assetView='hierarchy';saveState();closeModal();render();toast(existing?'Asset changes saved':`${typeLabel(type)} created`);
    }});
  }

  function showFiixAssetCreator(assetOrId=null,suggestedParent=null){
    const existing=typeof assetOrId==='string'?getAsset(assetOrId):assetOrId;
    if(existing)return openAssetEditor(existing,suggestedParent,kindFor(existing.type));
    return openKindChooser(suggestedParent);
  }
  window.showFiixAssetCreator=showFiixAssetCreator;
  window.showAssetForm=showFiixAssetCreator;showAssetForm=showFiixAssetCreator;

  document.addEventListener('click',e=>{
    const choice=e.target.closest('[data-v27-kind]');if(!choice)return;e.preventDefault();e.stopImmediatePropagation();const kind=choice.dataset.v27Kind,parentId=choice.dataset.v27Parent||null;closeModal();openAssetEditor(null,parentId,kind);
  },true);
  document.addEventListener('change',e=>{
    const radio=e.target.closest('input[name="placementMode"]');if(!radio)return;
    const editor=radio.closest('.v27-editor');if(!editor)return;
    editor.querySelectorAll('.v27-relation-choice').forEach(x=>x.classList.toggle('selected',x.contains(radio)));
    editor.querySelectorAll('[data-v27-panel]').forEach(x=>x.classList.toggle('hidden',x.dataset.v27Panel!==radio.value));
  },true);
})();
