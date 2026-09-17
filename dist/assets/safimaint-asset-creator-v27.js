'use strict';

// SafiMaintain v28 — one canonical, Fiix-style asset creation flow.
(function(){
  const LOCATION_TYPES=['Facility','Room','Production area'];
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
  function editorBody(existing,kind,suggestedParent){
    const suggested=getAsset(suggestedParent);
    const locationDefault=suggested&&LOCATION_TYPES.includes(suggested.type)?suggested.id:(suggested?.locationId||currentLocationId(existing));
    const partDefault=suggested&&EQUIPMENT_TYPES.includes(suggested.type)?suggested.id:currentPartOfId(existing);
    if(kind==='location'){
      const parentDefault=suggested&&LOCATION_TYPES.includes(suggested.type)?suggested.id:(existing?.parentId||'');
      return `<div class="v27-editor"><section><h3>Location identity</h3><div class="form-grid">${identityFields(existing,['Facility','Room'],existing?.type==='Production area'?'Room':existing?.type||'Facility')}</div></section><section><h3>Where is it?</h3><div class="v27-placement-help"><strong>Facility:</strong> may be top level. <strong>Room / area:</strong> must sit inside a facility or another area.</div><div class="form-grid">${field('locationParentId','Inside facility / area',parentDefault,{type:'select',options:optionsFor(locationAssets(),'Top level — main facility',existing)})}${responsibilityFields(existing)}</div></section></div>`;
    }
    const types=kind==='equipment'?['Equipment','Subassembly']:['Tool'];
    return `<div class="v27-editor"><section><h3>${kind==='tool'?'Tool':'Equipment'} identity</h3><div class="form-grid">${identityFields(existing,types,existing?.type||types[0])}</div></section><section><h3>Placement</h3><div class="v27-placement-help"><strong>Located at</strong> is the physical facility or room. <strong>Part of</strong> is optional and links a component or tool to a machine.</div><div class="form-grid">${field('locationId','Located at',locationDefault,{type:'select',options:optionsFor(locationAssets(),'Select a facility or room',existing)})}${field('partOfAssetId','Part of (optional)',partDefault,{type:'select',options:optionsFor(equipmentAssets(),'Not part of another machine',existing)})}</div></section><section><h3>Responsibility</h3><div class="form-grid">${responsibilityFields(existing)}</div></section><details class="v27-advanced" ${existing?'open':''}><summary>Nameplate & purchase details</summary><div class="form-grid">${field('manufacturer','Manufacturer',existing?.manufacturer||'')}${field('model','Model',existing?.model||'')}${field('serial','Serial number',existing?.serial||'')}${field('warrantyExpiry','Warranty expiry',existing?.warrantyExpiry||'',{type:'date'})}</div></details></div>`;
  }

  function openAssetEditor(existing=null,suggestedParent=null,kind=null){
    if(!requirePermission('asset.edit',existing?'edit assets':'create assets'))return;
    if(existing?.type==='Site')return;
    const editId=existing?.id||null;kind=kind||kindFor(existing?.type||'Equipment');
    openModal({eyebrow:'Asset management',title:existing?`Edit ${existing.name}`:kind==='location'?'Add a location or facility':kind==='equipment'?'Add equipment or machine':'Add a tool',submitText:existing?'Save changes':'Create record',body:`<div class="v27-flow"><span class="done">✓</span><b>Choose type</b><i></i><span class="active">2</span><b>Details & placement</b></div>${editorBody(existing,kind,suggestedParent)}`,onSubmit:fd=>{
      const v=Object.fromEntries(fd.entries());const type=String(v.type||'Equipment');const code=String(v.code||'').trim(),name=String(v.name||'').trim();
      if(!code||!name){toast('Asset code and name are required');return}
      const duplicate=allAssets().find(a=>String(a.id)!==String(editId)&&String(a.code||'').trim().toLowerCase()===code.toLowerCase());if(duplicate){toast(`Asset code ${code} is already in use`);return}
      let locationId=null,partOfAssetId=null,parentId=null;
      if(kind==='location'){
        parentId=String(v.locationParentId||'').trim()||null;locationId=parentId;
        if(type!=='Facility'&&!parentId){toast('A room or area must be placed inside a facility');return}
        if(parentId&&!LOCATION_TYPES.includes(getAsset(parentId)?.type)){toast('A location can only be placed inside a facility or area');return}
      }else{
        locationId=String(v.locationId||'').trim()||null;partOfAssetId=String(v.partOfAssetId||'').trim()||null;
        if(!locationId){toast(`${typeLabel(type)} must have a facility or room in Located at`);return}
        if(!LOCATION_TYPES.includes(getAsset(locationId)?.type)){toast('Located at must be a facility, room or area');return}
        if(partOfAssetId&&!EQUIPMENT_TYPES.includes(getAsset(partOfAssetId)?.type)){toast('Part of must be equipment or a machine');return}
        parentId=partOfAssetId||locationId;
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
})();
