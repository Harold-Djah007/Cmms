'use strict';

// SafiMaintain v27 — guided Fiix-style creation and placement.
(function(){
  const locationTypes=['Facility','Room','Production area'];
  const equipmentTypes=['Equipment','Subassembly'];

  function kindFor(type){return locationTypes.includes(type)?'location':equipmentTypes.includes(type)?'equipment':'tool'}
  function typeLabel(type){return type==='Production area'?'Room / area':type}
  function assetPath(asset){
    const out=[],seen=new Set();let current=asset;
    while(current&&current.type!=='Site'&&!seen.has(String(current.id))){seen.add(String(current.id));out.unshift(current.name);current=getAsset(current.parentId)}
    return out.join(' › ');
  }
  function descendantsOf(id,out=[],seen=new Set()){
    state.assets.filter(a=>String(a.parentId||'')===String(id)).forEach(a=>{if(seen.has(String(a.id)))return;seen.add(String(a.id));out.push(a);descendantsOf(a.id,out,seen)});return out;
  }
  function eligibleParent(parent,type){
    if(!parent||parent.type==='Site')return false;
    if(type==='Facility')return parent.type==='Facility';
    if(type==='Room'||type==='Production area')return ['Facility','Room','Production area'].includes(parent.type);
    if(equipmentTypes.includes(type))return [...locationTypes,...equipmentTypes].includes(parent.type);
    if(type==='Tool')return [...locationTypes,...equipmentTypes].includes(parent.type);
    return false;
  }
  function parentOptions(existing,kind,suggestedParent){
    const banned=new Set(existing?[String(existing.id),...descendantsOf(existing.id).map(a=>String(a.id))]:[]);
    const allowedTypes=kind==='location'?locationTypes:kind==='equipment'?[...locationTypes,...equipmentTypes]:[...locationTypes,...equipmentTypes];
    const options=state.assets.filter(a=>a.type!=='Site'&&!banned.has(String(a.id))&&allowedTypes.includes(a.type)).sort((a,b)=>assetPath(a).localeCompare(assetPath(b))).map(a=>({value:a.id,label:`${assetPath(a)} · ${a.code}`}));
    const first=kind==='location'?{value:'',label:'Top level — create a main facility'}:{value:'',label:'Choose where this asset belongs'};
    if(suggestedParent&&!options.some(o=>String(o.value)===String(suggestedParent))){const p=getAsset(suggestedParent);if(p&&p.type!=='Site')options.unshift({value:p.id,label:`${assetPath(p)} · ${p.code}`})}
    return [first,...options];
  }
  function semanticPlacement(type,parentId,existing){
    const parent=getAsset(parentId);if(!parent)return {locationId:null,partOfAssetId:null};
    if(locationTypes.includes(type))return {locationId:parent.id,partOfAssetId:null};
    if(locationTypes.includes(parent.type))return {locationId:parent.id,partOfAssetId:null};
    return {locationId:parent.locationId||null,partOfAssetId:parent.id};
  }

  function openKindChooser(parentId=null){
    if(!requirePermission('asset.edit','create assets'))return;
    const parent=getAsset(parentId);
    openModal({eyebrow:'Asset management',title:'Create new asset',body:`
      ${parent?`<div class="v27-parent-context"><small>Creating inside</small><strong>${esc(assetPath(parent))}</strong></div>`:''}
      <p class="v27-intro">What do you want to add?</p>
      <div class="v27-kind-grid">
        <button type="button" data-v27-kind="location" data-v27-parent="${esc(parentId||'')}"><span class="v27-kind-icon facility">▥</span><span><strong>Location or facility</strong><small>Create a main facility, building, room or operational area.</small></span><b>›</b></button>
        <button type="button" data-v27-kind="equipment" data-v27-parent="${esc(parentId||'')}"><span class="v27-kind-icon equipment">▣</span><span><strong>Equipment or machine</strong><small>Place a maintainable machine inside a facility or room.</small></span><b>›</b></button>
        <button type="button" data-v27-kind="tool" data-v27-parent="${esc(parentId||'')}"><span class="v27-kind-icon tool">⚙</span><span><strong>Tool</strong><small>Track a portable tool at a location or with equipment.</small></span><b>›</b></button>
      </div>`});
  }

  function openAssetEditor(existing=null,suggestedParent=null,kind=null){
    if(!requirePermission('asset.edit',existing?'edit assets':'create assets'))return;
    const editId=existing?.id||null;
    kind=kind||kindFor(existing?.type||'Equipment');
    const types=kind==='location'?['Facility','Room']:kind==='equipment'?['Equipment','Subassembly']:['Tool'];
    const defaultType=existing?.type==='Production area'?'Room':existing?.type||types[0];
    const parentDefault=suggestedParent!==null&&suggestedParent!==undefined?suggestedParent:(existing?.parentId||'');
    const users=[{value:'',label:'Unassigned'},...state.users.filter(u=>u.active).map(u=>({value:u.id,label:u.name}))];
    const groups=[{value:'',label:'Unassigned'},...state.groups.map(g=>({value:g.id,label:g.name}))];
    const options=parentOptions(existing,kind,parentDefault);
    openModal({eyebrow:'Asset management',title:existing?`Edit ${existing.name}`:`Create ${kind==='location'?'location / facility':kind==='equipment'?'equipment / machine':'tool'}`,submitText:existing?'Save changes':'Create asset',body:`
      <div class="v27-flow"><span class="done">1</span><b>Choose type</b><i></i><span class="active">2</span><b>Enter details and placement</b></div>
      <div class="v27-editor">
        <section><h3>Identity</h3><div class="form-grid">${field('type','Asset type',defaultType,{type:'select',options:types.map(x=>({value:x,label:typeLabel(x)}))})}${field('code','Asset code',existing?.code||'',{required:true})}${field('name','Asset name',existing?.name||'',{required:true})}${field('category','Category',existing?.category||typeLabel(defaultType))}${field('description','Description',existing?.description||'',{type:'textarea',span:true})}</div></section>
        <section><h3>Place it in the hierarchy</h3><div class="v27-placement-help">${kind==='location'?'A main facility can sit at the top. Rooms and areas must be created inside a facility.':'Choose the facility, room or machine this record belongs beneath.'}</div><div class="form-grid">${field('parentId',kind==='location'?'Inside facility / area':'Located at / part of',parentDefault,{type:'select',options})}${field('location','Physical location note',existing?.location||'')}${field('ownerUserId','Responsible person',existing?.ownerUserId||'',{type:'select',options:users})}${field('ownerGroupId','Responsible group',existing?.ownerGroupId||'',{type:'select',options:groups})}${field('criticality','Criticality',existing?.criticality||'B',{type:'select',options:['A','B','C'].map(x=>({value:x,label:x}))})}${field('condition','Condition',existing?.condition||'Healthy',{type:'select',options:['Healthy','Attention','Critical'].map(x=>({value:x,label:x}))})}</div></section>
        ${kind==='location'?'':`<section><h3>Nameplate data</h3><div class="form-grid">${field('manufacturer','Manufacturer',existing?.manufacturer||'')}${field('model','Model',existing?.model||'')}${field('serial','Serial number',existing?.serial||'')}${field('warrantyExpiry','Warranty expiry',existing?.warrantyExpiry||'',{type:'date'})}</div></section>`}
      </div>`,onSubmit:fd=>{
        const v=Object.fromEntries(fd.entries());let type=String(v.type||types[0]);if(type==='Room')type='Room';
        const code=String(v.code||'').trim(),name=String(v.name||'').trim(),parentId=String(v.parentId||'').trim()||null;
        if(!code||!name){toast('Asset code and name are required');return}
        if(type!=='Facility'&&!parentId){toast(`${typeLabel(type)} must be placed inside a facility, room or equipment record`);return}
        const parent=getAsset(parentId);
        if(parentId&&!eligibleParent(parent,type)){toast(`${typeLabel(type)} cannot be placed under ${parent?.type||'that record'}`);return}
        const duplicate=state.assets.find(a=>a.type!=='Site'&&String(a.id)!==String(editId)&&String(a.code||'').trim().toLowerCase()===code.toLowerCase());
        if(duplicate){toast(`Asset code ${code} is already in use`);return}
        if(editId){const bad=new Set([String(editId),...descendantsOf(editId).map(a=>String(a.id))]);if(parentId&&bad.has(String(parentId))){toast('An asset cannot be placed beneath itself or one of its children');return}}
        const placement=semanticPlacement(type,parentId,existing);
        const values={code,name,type,category:v.category||typeLabel(type),description:v.description||'',parentId,...placement,location:v.location||'',ownerUserId:v.ownerUserId||'',ownerGroupId:v.ownerGroupId||'',criticality:v.criticality,condition:v.condition,manufacturer:v.manufacturer||'',model:v.model||'',serial:v.serial||'',warrantyExpiry:v.warrantyExpiry||'',siteId:existing?.siteId||state.sites?.find(s=>s.active)?.id||state.sites?.[0]?.id||null,lastUpdatedAt:iso()};
        let savedId=editId;
        if(editId){const index=state.assets.findIndex(a=>String(a.id)===String(editId));const before=state.assets[index];state.assets[index]={...before,...values,id:before.id};state.assetEvents.unshift({id:uid('AE'),assetId:before.id,type:'Asset updated',at:iso(),userId:CURRENT_USER,detail:`${code} updated at ${parent?assetPath(parent):'top level'}`});addAudit('ASSET_UPDATED',before.id,`${code} ${name} updated`)}
        else{const created={id:uid('AST'),commissioned:day(0),bom:[],operatingState:'Online',...values};state.assets.push(created);savedId=created.id;state.assetEvents.unshift({id:uid('AE'),assetId:created.id,type:'Asset created',at:iso(),userId:CURRENT_USER,detail:`${code} created ${parent?`inside ${assetPath(parent)}`:'as a main facility'}`});addAudit('ASSET_CREATED',created.id,`${code} ${name}`)}
        ui.selectedAsset=savedId;ui.assetSearch='';ui.assetView='hierarchy';saveState();closeModal();render();toast(existing?'Asset changes saved':`${typeLabel(type)} created in the hierarchy`);
      }});
  }

  function guidedAssetForm(assetOrId=null,suggestedParent=null){
    const existing=typeof assetOrId==='string'?getAsset(assetOrId):assetOrId;
    if(existing)return openAssetEditor(existing,suggestedParent,kindFor(existing.type));
    return openKindChooser(suggestedParent);
  }
  window.showAssetForm=guidedAssetForm;showAssetForm=guidedAssetForm;

  document.addEventListener('click',e=>{
    const choice=e.target.closest('[data-v27-kind]');if(!choice)return;e.preventDefault();e.stopImmediatePropagation();const kind=choice.dataset.v27Kind,parentId=choice.dataset.v27Parent||null;closeModal();openAssetEditor(null,parentId,kind);
  },true);
})();
