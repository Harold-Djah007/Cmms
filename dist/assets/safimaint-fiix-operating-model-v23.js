'use strict';

// SafiMaintain v23 — Fiix-inspired operating model for assets.
// List-first hierarchy, separate record workspace, drag/drop, clone and CSV import.
(function(){
  const KEY='safimaint-v23-collapsed';
  let collapsed=new Set();
  let selected=new Set();
  try{collapsed=new Set(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch(_){collapsed=new Set()}
  ui.assetView=ui.assetView||'hierarchy';
  ui.assetScope=ui.assetScope||'all';
  ui.assetSearch=ui.assetSearch||'';
  ui.assetRecordTab=ui.assetRecordTab||'general';

  const isBlank=v=>v===null||v===undefined||String(v).trim()==='';
  const site=()=>state.sites?.find(s=>s.active)||state.sites?.[0]||null;
  const assets=()=>state.assets.filter(a=>a.type!=='Site'&&(!site()||!a.siteId||a.siteId===site().id));
  const byId=id=>assets().find(a=>String(a.id)===String(id));
  const parentOf=a=>isBlank(a?.parentId)?null:byId(a.parentId);
  const children=id=>assets().filter(a=>String(a.parentId||'')===String(id||''));
  const descendants=(id,out=[],seen=new Set())=>{children(id).forEach(c=>{const k=String(c.id);if(seen.has(k))return;seen.add(k);out.push(c);descendants(c.id,out,seen)});return out};
  const roots=()=>{const ids=new Set(assets().map(a=>String(a.id)));return assets().filter(a=>isBlank(a.parentId)||!ids.has(String(a.parentId)))};
  const workFor=a=>state.workOrders.filter(w=>(w.assetIds||[]).some(x=>String(x)===String(a.id)));
  const activeWork=a=>workFor(a).filter(w=>!['Completed','Cancelled'].includes(w.status));
  const metersFor=a=>state.meters.filter(m=>String(m.assetId)===String(a.id));
  const downtimeFor=a=>state.downtime.filter(d=>String(d.assetId)===String(a.id));
  const eventsFor=a=>state.assetEvents.filter(e=>String(e.assetId)===String(a.id));
  const bomFor=a=>(a.bom||[]).map(getPart).filter(Boolean);
  const saveCollapsed=()=>localStorage.setItem(KEY,JSON.stringify([...collapsed]));
  const typeIcon=a=>assetIcon(a);

  function scopeMatch(a){
    return ui.assetScope==='all'||
      (ui.assetScope==='facilities'&&['Facility','Department','Room','Area','Production area'].includes(a.type))||
      (ui.assetScope==='equipment'&&['Equipment','Subassembly'].includes(a.type))||
      (ui.assetScope==='tools'&&a.type==='Tool');
  }
  function pathFor(a){
    const out=[];const seen=new Set();let cur=a;
    while(cur&&!seen.has(String(cur.id))){seen.add(String(cur.id));out.unshift(cur);cur=parentOf(cur)}
    return out;
  }
  function visibleSet(){
    const q=String(ui.assetSearch||'').trim().toLowerCase();
    if(!q&&ui.assetScope==='all')return null;
    const visible=new Set();
    assets().forEach(a=>{
      const hay=`${a.name||''} ${a.code||''} ${a.type||''} ${a.category||''} ${a.location||''} ${a.description||''}`.toLowerCase();
      if((q&&!hay.includes(q))||!scopeMatch(a))return;
      let cur=a;const seen=new Set();
      while(cur&&!seen.has(String(cur.id))){visible.add(String(cur.id));seen.add(String(cur.id));cur=parentOf(cur)}
    });
    return visible;
  }

  function hierarchyRows(){
    const visible=visibleSet();
    const q=String(ui.assetSearch||'').trim();
    let count=0;
    function row(a,depth){
      if(visible&&!visible.has(String(a.id)))return'';
      count++;
      const kids=children(a.id).filter(c=>!visible||visible.has(String(c.id)));
      const shut=!q&&collapsed.has(String(a.id));
      const work=activeWork(a).length;
      const isLocation=['Facility','Department','Room','Area','Production area'].includes(a.type);
      const kind=isLocation?'location':a.type==='Tool'?'tool':'equipment';
      const relation=isLocation?(a.parentId?'Part of location':'Top-level facility'):a.partOfAssetId?'Part of equipment':a.locationId?'Located at':'Unplaced';
      const desc=a.description||`${relation} · ${a.category||a.type||'Asset'}`;
      return `<div class="fx23-row ${ui.selectedAsset===a.id?'selected':''}" draggable="true" data-kind="${kind}" data-fx23-drag="${a.id}" data-fx23-drop="${a.id}" style="--depth:${Math.min(depth,9)}">
        <div class="fx23-cell fx23-location">
          <input class="fx23-check" type="checkbox" data-fx23-select="${a.id}" ${selected.has(String(a.id))?'checked':''} aria-label="Select ${esc(a.name)}">
          <button class="fx23-expand ${kids.length?'':'empty'}" type="button" ${kids.length?`data-fx23-toggle="${a.id}"`:''} aria-label="${shut?'Expand':'Collapse'} ${esc(a.name)}">${kids.length?(shut?'＋':'−'):''}</button>
          <button class="fx23-asset-name" type="button" data-fx23-open="${a.id}"><span class="fx23-asset-icon">${typeIcon(a)}</span><span><strong>${esc(a.name)}</strong><small><b>${esc(a.type)}</b><i>${esc(relation)}</i>${kids.length?`<i>${kids.length} directly below</i>`:''}</small></span></button>
        </div>
        <div class="fx23-cell fx23-desc">${esc(desc)}</div>
        <div class="fx23-cell fx23-code"><strong>${esc(a.code)}</strong></div>
        <div class="fx23-cell fx23-state"><span class="fx23-state-pill ${a.operatingState==='Offline'?'offline':''}"><i></i>${esc(a.operatingState||'Unknown')}</span>${work?`<button type="button" data-fx23-open="${a.id}" class="fx23-work-pill">${work} open work</button>`:''}</div>
        <div class="fx23-cell fx23-more"><button type="button" data-fx23-rowmenu="${a.id}" aria-label="Asset actions">⋯</button></div>
      </div>${kids.length&&!shut?`<div class="fx23-children">${kids.map(k=>row(k,depth+1)).join('')}</div>`:''}`;
    }
    const html=roots().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))).map(a=>row(a,0)).join('');
    if(count)return html;
    return `<div class="fx23-empty"><strong>${assets().length?'No matching assets':'No assets yet'}</strong><span>${assets().length?'Try another filter or search term.':'Create a facility, area, equipment item or tool to start the hierarchy.'}</span><button class="button primary" data-action="add-asset">＋ Add asset</button></div>`;
  }

  function scopeCount(scope){
    if(scope==='all')return assets().length;
    return assets().filter(a=>scope==='facilities'?['Facility','Department','Room','Area','Production area'].includes(a.type):scope==='equipment'?['Equipment','Subassembly'].includes(a.type):a.type==='Tool').length;
  }

  function hierarchyView(){
    const s=site();
    const online=assets().filter(a=>a.operatingState==='Online').length;
    const offline=assets().filter(a=>a.operatingState==='Offline').length;
    const openWork=assets().reduce((total,a)=>total+activeWork(a).length,0);
    return pageHead('Asset management','Asset hierarchy','See exactly where every facility, area, machine and component belongs.',`<button class="button" data-fx23-import>Import CSV</button><button class="button primary" data-action="add-asset">＋ Add asset</button>`)
      +`<section class="fx23-shell card">
        <div class="fx23-model">
          <div class="fx31-model-title"><span>⌘</span><div><strong>Your asset map</strong><small>Build it the way the site exists in the field</small></div></div>
          <div class="fx31-flow"><span><i>01</i><b>Facility</b></span><em>›</em><span><i>02</i><b>Department / room</b></span><em>›</em><span><i>03</i><b>Equipment</b></span><em>›</em><span><i>04</i><b>Component / tool</b></span></div>
          <small>Categories help with filtering. The tree should show only real locations and equipment relationships.</small>
        </div>
        <div class="fx23-titlebar">
          <div class="fx23-title"><span class="fx23-title-icon">▦</span><div><strong>Asset structure</strong><small>${esc(s?.name||'Current workspace')}</small></div></div>
          <div class="fx31-summary"><span><b>${assets().length}</b> assets</span><span class="online"><i></i><b>${online}</b> online</span><span class="offline"><i></i><b>${offline}</b> offline</span><span><b>${openWork}</b> open work</span></div>
          <div class="fx23-filter"><label for="fx23Scope">Show</label><select id="fx23Scope"><option value="all" ${ui.assetScope==='all'?'selected':''}>All assets</option><option value="facilities" ${ui.assetScope==='facilities'?'selected':''}>Facilities & areas</option><option value="equipment" ${ui.assetScope==='equipment'?'selected':''}>Equipment</option><option value="tools" ${ui.assetScope==='tools'?'selected':''}>Tools</option></select><span>⌄</span></div>
        </div>
        <div class="fx23-subbar">
          <div class="fx23-guidance"><strong>Explore the structure</strong><span>Expand a row to see what belongs beneath it. Select a name to open its record.</span></div>
          <div class="fx23-search"><span>⌕</span><input data-filter="asset" value="${esc(ui.assetSearch||'')}" placeholder="Find an asset, location or code"><button type="button" data-fx23-expand-all>Expand all</button><button type="button" data-fx23-collapse-all>Collapse all</button></div>
        </div>
        <div class="fx23-table">
          <div class="fx23-head"><div><input id="fx23SelectAll" type="checkbox" aria-label="Select all visible assets"><span>Location / asset</span></div><div>Description</div><div>Code</div><div>Status / work</div><div></div></div>
          <div class="fx23-body">${hierarchyRows()}</div>
        </div>
        <div class="fx23-footer"><span>${selected.size?`${selected.size} selected · `:''}Drag an asset onto another asset to move it in the hierarchy.</span><span>${assets().length} total asset${assets().length===1?'':'s'}</span></div>
      </section>
      <input id="fx23CsvInput" type="file" accept=".csv,text/csv" hidden>`;
  }

  function qrPattern(code){
    let seed=0;for(const ch of String(code||'ASSET'))seed=(seed*31+ch.charCodeAt(0))>>>0;
    let out='';const n=13;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const finder=(r<4&&c<4)||(r<4&&c>8)||(r>8&&c<4);
      let on;
      if(finder){const rr=r>8?r-9:r,cc=c>8?c-9:c;on=rr===0||rr===3||cc===0||cc===3||(rr>0&&rr<3&&cc>0&&cc<3)}
      else{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;on=(seed&1)===1}
      out+=`<i class="${on?'on':''}"></i>`;
    }
    return out;
  }

  function recordTabs(a){
    const tabs=[['general','General'],['bom','Parts / BOM'],['meter','Metering / Events'],['personnel','Personnel'],['work','Work history'],['files','Files'],['financials','Financials'],['log','Log']];
    return `<div class="fx23-tabs">${tabs.map(([id,label])=>`<button type="button" data-fx23-tab="${id}" class="${ui.assetRecordTab===id?'active':''}">${label}</button>`).join('')}</div>`;
  }
  function detailGrid(rows){return `<div class="fx23-detail-grid">${rows.map(([l,v])=>`<div><small>${esc(l)}</small><strong>${v}</strong></div>`).join('')}</div>`}
  function generalRecord(a){
    const owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId),p=parentOf(a),kids=children(a.id);
    const isLocation=['Facility','Department','Room','Area','Production area'].includes(a.type);
    const dt=downtimeFor(a),hours=dt.reduce((n,d)=>n+durationHours(d.startedAt,d.endedAt||iso()),0);
    return `<section class="fx23-section"><div class="fx23-section-head"><strong>General information</strong><small>Asset master record</small></div>${detailGrid([
      ['Asset code',esc(a.code)],['Asset type',esc(a.type)],['Category',esc(a.category||'—')],['Criticality',esc(a.criticality||'—')],
      ['Hierarchy parent',p?`<button data-fx23-open="${p.id}">${esc(p.name)}</button>`:'Top level'],['Sub-assets',String(kids.length)],['Located at',isLocation?'—':esc(getAsset(a.locationId)?.name||a.location||'—')],['Part of',isLocation?esc(p?.name||'—'):esc(getAsset(a.partOfAssetId)?.name||'—')],['Condition',status(a.condition||'Unknown')],
      ['Manufacturer',esc(a.manufacturer||'—')],['Model',esc(a.model||'—')],['Serial number',esc(a.serial||'—')],['Commissioned',dateFmt(a.commissioned)],
      ['Responsible person',esc(owner?.name||'Unassigned')],['Responsible group',esc(group?.name||'Unassigned')],['Warranty expiry',dateFmt(a.warrantyExpiry)],['Total downtime',`${hours.toFixed(1)} h`]
    ])}</section><section class="fx23-section"><div class="fx23-section-head"><strong>Sub-assets</strong><button class="button" type="button" data-fx23-add-child="${a.id}">＋ Add sub-asset</button></div><div class="fx23-subassets">${kids.map(k=>`<button type="button" data-fx23-open="${k.id}"><span>${typeIcon(k)}</span><div><strong>${esc(k.name)}</strong><small>${esc(k.code)} · ${esc(k.type)}</small></div><b>›</b></button>`).join('')||'<div class="fx23-inline-empty">No sub-assets linked.</div>'}</div></section>`;
  }
  function bomRecord(a){const b=bomFor(a);return `<section class="fx23-section"><div class="fx23-section-head"><strong>Parts / BOM</strong><small>${b.length} linked</small></div>${table(['Code','Part','On hand','Min','Vendor'],b.map(p=>`<tr class="clickable" data-open-part="${p.id}"><td><b>${esc(p.code)}</b></td><td>${esc(p.name)}</td><td>${partOnHand(p)} ${esc(p.uom)}</td><td>${p.min}</td><td>${esc(getVendor(p.vendorId)?.name||'—')}</td></tr>`),'No BOM parts linked')}</section>`}
  function meterRecord(a){const m=metersFor(a),d=downtimeFor(a);return `<section class="fx23-section"><div class="fx23-section-head"><strong>Metering / events</strong><small>${m.length} meter${m.length===1?'':'s'}</small></div><div class="fx23-meter-grid">${m.map(x=>`<div><span><strong>${esc(x.name)}</strong><small>Latest ${dateFmt(x.readings?.at(-1)?.at)}</small></span><b>${esc(x.current)} ${esc(x.unit)}</b></div>`).join('')||'<div class="fx23-inline-empty">No meters linked.</div>'}</div><div class="fx23-event-list">${d.slice(0,10).map(x=>`<div><strong>${esc(x.reasonCode||'Downtime')}</strong><small>${dateTimeFmt(x.startedAt)}${x.endedAt?` → ${dateTimeFmt(x.endedAt)}`:' · Active'}</small><p>${esc(x.reason||'')}</p></div>`).join('')}</div></section>`}
  function personnelRecord(a){const u=getUser(a.ownerUserId),g=getGroup(a.ownerGroupId);return `<section class="fx23-section"><div class="fx23-section-head"><strong>Personnel</strong><small>Ownership and accountability</small></div>${detailGrid([['Responsible person',esc(u?.name||'Unassigned')],['Role',esc(getRole(u?.roleId)?.name||'—')],['Responsible group',esc(g?.name||'Unassigned')],['Email',esc(u?.email||'—')]])}</section>`}
  function workRecord(a){const w=workFor(a);return `<section class="fx23-section"><div class="fx23-section-head"><strong>Work history</strong><small>${activeWork(a).length} active</small></div>${table(['Work order','Type','Priority','Status','Due'],w.map(x=>`<tr class="clickable" data-open-work="${x.id}"><td><b>${esc(x.id)}</b><small>${esc(x.title)}</small></td><td>${esc(x.type)}</td><td>${esc(x.priority||'—')}</td><td>${status(x.status)}</td><td>${dateFmt(x.due)}</td></tr>`),'No work orders linked')}</section>`}
  function filesRecord(){return `<section class="fx23-section"><div class="fx23-section-head"><strong>Files</strong><button class="button" type="button" disabled>＋ Add file</button></div><div class="fx23-inline-empty">No manuals, photos or attachments have been added yet.</div></section>`}
  function financialRecord(a){const w=workFor(a),parts=w.reduce((n,wo)=>n+(wo.parts||[]).reduce((s,l)=>s+(Number(l.actual||0)*(Number(getPart(l.partId)?.lastPrice||0))),0),0);return `<section class="fx23-section"><div class="fx23-section-head"><strong>Financials</strong><small>Maintenance cost snapshot</small></div>${detailGrid([['Work orders',String(w.length)],['Recorded parts cost',parts.toLocaleString(undefined,{maximumFractionDigits:2})],['Purchase cost basis','From inventory issue history'],['Capital value','Not recorded']])}</section>`}
  function logRecord(a){const ev=eventsFor(a);return `<section class="fx23-section"><div class="fx23-section-head"><strong>Asset log</strong><small>${ev.length} events</small></div><div class="timeline">${ev.map(e=>`<div class="event"><strong>${esc(e.type)} · ${esc(e.detail)}</strong><small>${dateTimeFmt(e.at)} · ${esc(getUser(e.userId)?.name||e.userId||'System')}</small></div>`).join('')||'<div class="fx23-inline-empty">No asset events yet.</div>'}</div></section>`}
  function recordBody(a){return ({general:generalRecord,bom:bomRecord,meter:meterRecord,personnel:personnelRecord,work:workRecord,files:filesRecord,financials:financialRecord,log:logRecord}[ui.assetRecordTab]||generalRecord)(a)}

  function recordView(a){
    if(!a){ui.assetView='hierarchy';return hierarchyView()}
    const p=parentOf(a),kids=children(a.id),owner=getUser(a.ownerUserId),group=getGroup(a.ownerGroupId);
    return `<div class="fx23-record-page">
      <div class="fx23-commandbar"><div><button class="button" type="button" data-fx23-back>‹ Back</button><button class="button primary" type="button" data-edit-asset="${a.id}">Save / Edit</button><button class="button" type="button" data-fx23-print>▧ Print</button><button class="button" type="button" data-fx23-clone="${a.id}">Clone</button><button class="button" type="button" data-fx23-more="${a.id}">More ▾</button></div><div><button class="button" type="button" data-fx23-add-child="${a.id}">＋ Sub-asset</button><button class="button ${a.operatingState==='Online'?'danger':'primary'}" type="button" data-toggle-asset="${a.id}">${a.operatingState==='Online'?'Take offline':'Return online'}</button></div></div>
      <section class="fx23-record-head">
        <aside class="fx23-summary"><div class="fx23-photo"><img src="assets/safimaint-logo.svg" alt=""><span>${typeIcon(a)}</span></div><strong>${esc(a.name)}</strong><small>${esc(a.code)}</small><em>${esc(a.type)}</em><div class="fx23-path">${pathFor(a).map((x,i,arr)=>`<button type="button" data-fx23-open="${x.id}">${esc(x.name)}</button>${i<arr.length-1?'<b>›</b>':''}`).join('')}</div></aside>
        <main class="fx23-nameplate"><div class="fx23-name-row"><div><small>${esc(a.type)}</small><h1>${esc(a.name)}</h1></div><span class="fx23-state-big ${a.operatingState==='Offline'?'offline':''}"><i></i>${esc(a.operatingState||'Unknown')}</span></div><div class="fx23-description">${esc(a.description||'No asset description has been added yet.')}</div><div class="fx23-name-fields"><div><small>Code</small><strong>${esc(a.code)}</strong></div><div><small>Category</small><strong>${esc(a.category||'—')}</strong></div><div><small>Location</small><strong>${esc(a.location||'—')}</strong></div><div><small>Parent asset</small><strong>${esc(p?.name||'Top level')}</strong></div><div><small>Sub-assets</small><strong>${kids.length}</strong></div><div><small>Responsible</small><strong>${esc(owner?.name||group?.name||'Unassigned')}</strong></div></div></main>
        <aside class="fx23-tag"><div class="fx23-qr">${qrPattern(a.code)}</div><small>ASSET TAG</small><strong>${esc(a.code)}</strong></aside>
      </section>
      ${recordTabs(a)}
      <div class="fx23-record-body">${recordBody(a)}</div>
    </div>`;
  }

  function renderAssetsV23(){
    if(ui.assetView==='record')return recordView(byId(ui.selectedAsset)||getAsset(ui.selectedAsset));
    return hierarchyView();
  }

  function cloneAsset(id){
    const src=getAsset(id);if(!src)return;
    const clone=structuredClone(src);clone.id=uid('AST');clone.code=`${src.code}-COPY`;clone.name=`${src.name} Copy`;clone.operatingState='Online';clone.bom=[...(src.bom||[])];clone.commissioned=day(0);delete clone.offlineSince;delete clone.downtimeReason;
    state.assets.push(clone);state.assetEvents.unshift({id:uid('AE'),assetId:clone.id,type:'Asset cloned',at:iso(),userId:CURRENT_USER,detail:`Cloned from ${src.code}`});addAudit('ASSET_CLONED',clone.id,`${clone.code} cloned from ${src.code}`);ui.selectedAsset=clone.id;saveState();showAssetForm(clone);
  }

  function moveAsset(childId,parentId){
    const child=getAsset(childId),parent=getAsset(parentId);if(!child||!parent||child.type==='Site'||parent.type==='Site'||String(child.id)===String(parent.id))return;
    const banned=new Set(descendants(child.id).map(a=>String(a.id)));if(banned.has(String(parent.id))){toast('Cannot move an asset under one of its own sub-assets');return}
    const childIsLocation=['Facility','Department','Room','Area','Production area'].includes(child.type),parentIsLocation=['Facility','Department','Room','Area','Production area'].includes(parent.type),parentIsEquipment=['Equipment','Subassembly'].includes(parent.type);
    if(childIsLocation&&!parentIsLocation){toast('A facility, room or area can only sit inside another location');return}
    if(!childIsLocation&&!parentIsLocation&&!parentIsEquipment){toast('Equipment and tools can only be placed at a location or under equipment');return}
    child.parentId=parent.id;child.siteId=parent.siteId||site()?.id||child.siteId;
    if(childIsLocation||parentIsLocation){child.locationId=parent.id;child.partOfAssetId=null}else{child.locationId=parent.locationId||null;child.partOfAssetId=parent.id}
    state.assetEvents.unshift({id:uid('AE'),assetId:child.id,type:'Hierarchy change',at:iso(),userId:CURRENT_USER,detail:`Moved under ${parent.name}`});addAudit('ASSET_REPARENTED',child.id,`${child.code} moved under ${parent.code}`);saveState();render();toast(`${child.name} moved under ${parent.name}`);
  }

  function importCsv(file){
    const reader=new FileReader();
    reader.onload=()=>{
      const text=String(reader.result||'').replace(/^\uFEFF/,'');const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2){toast('CSV needs a header row and at least one asset');return}
      const parse=line=>{const out=[];let cur='',quote=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quote&&line[i+1]==='"'){cur+='"';i++}else quote=!quote}else if(ch===','&&!quote){out.push(cur.trim());cur=''}else cur+=ch}out.push(cur.trim());return out};
      const headers=parse(lines[0]).map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,''));const rows=lines.slice(1).map(parse);let added=0;const codeMap=new Map(assets().map(a=>[String(a.code).toLowerCase(),a]));
      const fieldAt=(row,names)=>{for(const n of names){const i=headers.indexOf(n);if(i>=0)return row[i]||''}return''};
      const pending=[];
      rows.forEach(row=>{const code=fieldAt(row,['code','assetcode']);const name=fieldAt(row,['name','assetname','location']);if(!code||!name||codeMap.has(code.toLowerCase()))return;const a={id:uid('AST'),siteId:site()?.id||null,parentId:null,code,name,type:fieldAt(row,['type','assettype'])||'Equipment',category:fieldAt(row,['category'])||'Equipment',location:fieldAt(row,['locationname','area'])||'',description:fieldAt(row,['description'])||'',criticality:fieldAt(row,['criticality'])||'B',condition:'Healthy',operatingState:'Online',ownerUserId:'',ownerGroupId:'',manufacturer:fieldAt(row,['manufacturer'])||'',model:fieldAt(row,['model'])||'',serial:fieldAt(row,['serial','serialnumber'])||'',commissioned:day(0),warrantyExpiry:'',bom:[]};state.assets.push(a);codeMap.set(code.toLowerCase(),a);pending.push({a,parentCode:fieldAt(row,['parentcode','parentassetcode'])});added++});
      pending.forEach(x=>{if(x.parentCode){const p=codeMap.get(x.parentCode.toLowerCase());if(p)x.a.parentId=p.id}});
      if(added){addAudit('ASSET_CSV_IMPORT','assets',`${added} assets imported from CSV`);saveState();render();toast(`${added} asset${added===1?'':'s'} imported`)}else toast('No new assets found in CSV');
    };reader.readAsText(file);
  }

  window.renderAssets=renderAssetsV23;renderAssets=renderAssetsV23;

  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-fx23-open]');if(open){e.preventDefault();e.stopImmediatePropagation();ui.selectedAsset=open.dataset.fx23Open;ui.assetView='record';ui.assetRecordTab='general';render();return}
    const back=e.target.closest('[data-fx23-back]');if(back){e.preventDefault();e.stopImmediatePropagation();ui.assetView='hierarchy';render();return}
    const toggle=e.target.closest('[data-fx23-toggle]');if(toggle){e.preventDefault();e.stopImmediatePropagation();const id=String(toggle.dataset.fx23Toggle);collapsed.has(id)?collapsed.delete(id):collapsed.add(id);saveCollapsed();render();return}
    const scope=e.target.closest('[data-fx23-scope]');if(scope){e.preventDefault();e.stopImmediatePropagation();ui.assetScope=scope.dataset.fx23Scope;render();return}
    if(e.target.closest('[data-fx23-expand-all]')){e.preventDefault();e.stopImmediatePropagation();collapsed.clear();saveCollapsed();render();return}
    if(e.target.closest('[data-fx23-collapse-all]')){e.preventDefault();e.stopImmediatePropagation();collapsed=new Set(assets().filter(a=>children(a.id).length).map(a=>String(a.id)));saveCollapsed();render();return}
    const select=e.target.closest('[data-fx23-select]');if(select){e.stopImmediatePropagation();const id=String(select.dataset.fx23Select);select.checked?selected.add(id):selected.delete(id);render();return}
    const tab=e.target.closest('[data-fx23-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();ui.assetRecordTab=tab.dataset.fx23Tab;render();return}
    const child=e.target.closest('[data-fx23-add-child]');if(child){e.preventDefault();e.stopImmediatePropagation();(window.showFiixAssetCreator||showAssetForm)(null,String(child.dataset.fx23AddChild));return}
    const clone=e.target.closest('[data-fx23-clone]');if(clone){e.preventDefault();e.stopImmediatePropagation();cloneAsset(clone.dataset.fx23Clone);return}
    if(e.target.closest('[data-fx23-print]')){e.preventDefault();e.stopImmediatePropagation();window.print();return}
    if(e.target.closest('[data-fx23-import]')){e.preventDefault();e.stopImmediatePropagation();document.getElementById('fx23CsvInput')?.click();return}
  },true);

  document.addEventListener('change',e=>{
    if(e.target.id==='fx23Scope'){ui.assetScope=e.target.value;render();return}
    if(e.target.id==='fx23SelectAll'){const visible=visibleSet();const ids=assets().filter(a=>!visible||visible.has(String(a.id))).map(a=>String(a.id));if(e.target.checked)ids.forEach(id=>selected.add(id));else ids.forEach(id=>selected.delete(id));render();return}
    if(e.target.id==='fx23CsvInput'&&e.target.files?.[0]){importCsv(e.target.files[0]);e.target.value='';return}
  },true);

  let dragged=null;
  document.addEventListener('dragstart',e=>{const row=e.target.closest('[data-fx23-drag]');if(!row)return;dragged=row.dataset.fx23Drag;e.dataTransfer.effectAllowed='move';row.classList.add('dragging')});
  document.addEventListener('dragend',e=>{dragged=null;document.querySelectorAll('.fx23-row.dragging,.fx23-row.drop-target').forEach(x=>x.classList.remove('dragging','drop-target'))});
  document.addEventListener('dragover',e=>{const row=e.target.closest('[data-fx23-drop]');if(!row||!dragged||row.dataset.fx23Drop===dragged)return;e.preventDefault();row.classList.add('drop-target')});
  document.addEventListener('dragleave',e=>{e.target.closest('[data-fx23-drop]')?.classList.remove('drop-target')});
  document.addEventListener('drop',e=>{const row=e.target.closest('[data-fx23-drop]');if(!row||!dragged)return;e.preventDefault();row.classList.remove('drop-target');moveAsset(dragged,row.dataset.fx23Drop);dragged=null});

  // Generic tree clicks from older layers should open the v23 record view too.
  document.addEventListener('click',e=>{const b=e.target.closest('[data-select-asset]');if(!b)return;ui.selectedAsset=b.dataset.selectAsset;ui.assetView='record'},true);

  if(ui.route==='assets')render();
})();
