'use strict';

// SafiMaintain Assets v78
// A new asset atlas with stable, in-place hierarchy expansion. This layer keeps
// the mature v72 asset record and replaces only the hierarchy experience.
(function(){
  const previousAssetRenderer=renderAssets;
  const COLLAPSED_KEY='safimaint-v23-collapsed';
  let collapsed=new Set();
  try{collapsed=new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY)||'[]').map(String))}catch(_){collapsed=new Set()}

  const locationTypes=new Set(['Facility','Department','Room','Area','Production area']);
  const allAssets=()=>{
    const current=(state.sites||[]).find(s=>s.active)||(state.sites||[])[0];
    return (state.assets||[]).filter(a=>a.type!=='Site'&&(!current||!a.siteId||a.siteId===current.id));
  };
  const assetById=id=>allAssets().find(a=>String(a.id)===String(id));
  const childrenOf=id=>allAssets().filter(a=>String(a.parentId||'')===String(id||''));
  const roots=()=>{const ids=new Set(allAssets().map(a=>String(a.id)));return allAssets().filter(a=>!a.parentId||!ids.has(String(a.parentId)))};
  const closed=w=>['Completed','Closed','Cancelled'].includes(String(w.status||''));
  const workFor=a=>(state.workOrders||[]).filter(w=>(w.assetIds||[]).some(id=>String(id)===String(a.id)));
  const activeWork=a=>workFor(a).filter(w=>!closed(w));
  const kindOf=a=>locationTypes.has(a.type)?'location':a.type==='Tool'?'tool':'equipment';
  const relationOf=a=>locationTypes.has(a.type)?(a.parentId?'Inside location':'Top-level facility'):a.partOfAssetId?'Part of equipment':a.locationId||a.parentId?'Located at':'Placement required';
  const site=()=>((state.sites||[]).find(s=>s.active)||(state.sites||[])[0]||{});
  const saveCollapsed=()=>localStorage.setItem(COLLAPSED_KEY,JSON.stringify([...collapsed]));
  const icon=a=>typeof assetIcon==='function'?assetIcon(a):'<span aria-hidden="true">◇</span>';
  const hierarchyIcon=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="5" rx="1.3"/><rect x="2.5" y="16.5" width="6" height="5" rx="1.3"/><rect x="15.5" y="16.5" width="6" height="5" rx="1.3"/><path d="M12 7.5v4.5M5.5 16.5v-2.5h13v2.5"/></svg>';
  const pulseIcon=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l2.2-5.5 4.1 11 2.2-5.5H21"/></svg>';
  const boxIcon=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></svg>';

  function scopeMatches(a){
    const scope=ui.assetScope||'all';
    return scope==='all'||(scope==='facilities'&&locationTypes.has(a.type))||(scope==='equipment'&&['Equipment','Subassembly'].includes(a.type))||(scope==='tools'&&a.type==='Tool'||scope==='attention'&&(a.operatingState==='Offline'||activeWork(a).length));
  }
  function visibleIds(){
    const query=String(ui.assetSearch||'').trim().toLowerCase();
    if(!query&&(ui.assetScope||'all')==='all')return null;
    const visible=new Set();
    allAssets().forEach(a=>{
      const hay=[a.name,a.code,a.type,a.category,a.location,a.description].join(' ').toLowerCase();
      if((query&&!hay.includes(query))||!scopeMatches(a))return;
      let current=a;const seen=new Set();
      while(current&&!seen.has(String(current.id))){seen.add(String(current.id));visible.add(String(current.id));current=assetById(current.parentId)}
    });
    return visible;
  }
  function treeMarkup(){
    const visible=visibleIds();
    const query=String(ui.assetSearch||'').trim();
    let rendered=0;
    function node(a,depth){
      if(visible&&!visible.has(String(a.id)))return'';
      rendered++;
      const kids=childrenOf(a.id).filter(k=>!visible||visible.has(String(k.id))).sort((x,y)=>String(x.name||'').localeCompare(String(y.name||'')));
      const isCollapsed=!query&&collapsed.has(String(a.id));
      const work=activeWork(a).length;
      const kind=kindOf(a);
      return '<article class="ax78-tree-item" data-ax78-item="'+esc(a.id)+'" style="--asset-depth:'+Math.min(depth,9)+'">'+
        '<div class="ax78-node" data-kind="'+kind+'" draggable="true" data-fx23-drag="'+esc(a.id)+'" data-fx23-drop="'+esc(a.id)+'">'+
          '<button class="ax78-toggle '+(kids.length?'':'empty')+' '+(isCollapsed?'collapsed':'')+'" type="button" '+(kids.length?'data-ax78-toggle="'+esc(a.id)+'" aria-expanded="'+String(!isCollapsed)+'"':'disabled')+' aria-label="'+(isCollapsed?'Expand ':'Collapse ')+esc(a.name)+'"><span></span></button>'+
          '<button class="ax78-open" type="button" data-fx23-open="'+esc(a.id)+'"><span class="ax78-asset-icon">'+icon(a)+'</span><span class="ax78-name"><strong>'+esc(a.name)+'</strong><small>'+esc(a.code)+' · '+esc(a.type)+'</small></span></button>'+
          '<span class="ax78-relation">'+esc(relationOf(a))+'</span>'+
          '<span class="ax78-work '+(work?'has-work':'')+'">'+(work?work+' open':'No open work')+'</span>'+
          '<span class="ax78-state '+(a.operatingState==='Offline'?'offline':'online')+'"><i></i>'+esc(a.operatingState||'Unknown')+'</span>'+
          '<button class="ax78-more" type="button" data-fx23-rowmenu="'+esc(a.id)+'" aria-label="Actions for '+esc(a.name)+'">•••</button>'+
        '</div>'+
        (kids.length?'<div class="ax78-branch" data-ax78-branch="'+esc(a.id)+'" '+(isCollapsed?'hidden':'')+'>'+kids.map(k=>node(k,depth+1)).join('')+'</div>':'')+
      '</article>';
    }
    const html=roots().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))).map(a=>node(a,0)).join('');
    if(rendered)return html;
    return '<div class="ax78-empty"><span>'+hierarchyIcon()+'</span><strong>'+(allAssets().length?'No assets match this view':'Build your first asset structure')+'</strong><p>'+(allAssets().length?'Change the search or filter to reveal more records.':'Start with a facility, then place rooms, equipment, components and tools beneath it.')+'</p><button class="button primary" data-action="add-asset">＋ Add asset</button></div>';
  }
  function attentionMarkup(){
    const list=allAssets().filter(a=>a.operatingState==='Offline'||activeWork(a).length).sort((a,b)=>(b.operatingState==='Offline')-(a.operatingState==='Offline')||activeWork(b).length-activeWork(a).length).slice(0,5);
    return list.length?list.map(a=>'<button type="button" class="ax78-attention-row" data-fx23-open="'+esc(a.id)+'"><span class="ax78-mini-icon">'+icon(a)+'</span><span><strong>'+esc(a.name)+'</strong><small>'+esc(a.code)+' · '+(a.operatingState==='Offline'?'Offline':activeWork(a).length+' active work order'+(activeWork(a).length===1?'':'s'))+'</small></span><b>→</b></button>').join(''):'<div class="ax78-clear"><i></i><strong>No immediate asset exceptions</strong><span>All equipment is online with no open asset work.</span></div>';
  }
  function recentEvents(){
    const events=[...(state.assetEvents||[])].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,5);
    return events.length?events.map(event=>{const a=assetById(event.assetId);return '<div class="ax78-event"><i></i><span><strong>'+esc(event.type||'Asset update')+'</strong><small>'+esc(a?.name||event.assetId||'Asset')+' · '+esc(event.detail||'Record updated')+'</small></span><time>'+dateTimeFmt(event.at)+'</time></div>'}).join(''):'<div class="ax78-clear"><strong>No asset activity yet</strong><span>State, hierarchy and maintenance changes will appear here.</span></div>';
  }
  function atlas(){
    const assets=allAssets(),online=assets.filter(a=>a.operatingState==='Online').length,offline=assets.filter(a=>a.operatingState==='Offline').length;
    const locations=assets.filter(a=>locationTypes.has(a.type)).length,equipment=assets.filter(a=>['Equipment','Subassembly'].includes(a.type)).length,tools=assets.filter(a=>a.type==='Tool').length;
    const work=assets.reduce((sum,a)=>sum+activeWork(a).length,0),bomLinks=assets.reduce((sum,a)=>sum+(a.bom||[]).length,0);
    const healthy=assets.filter(a=>a.operatingState!=='Offline'&&!['Attention','Critical'].includes(a.condition)).length;
    const readiness=assets.length?Math.round(healthy/assets.length*100):100;
    return '<div class="ax78-page">'+
      '<header class="ax78-header"><div class="ax78-heading"><span class="ax78-kicker"><i></i> Live plant register</span><h1>Assets</h1><p>See where every maintainable item belongs, what needs attention and which spare parts keep it running.</p></div><div class="ax78-header-actions"><button class="button" data-fx23-import>Import</button><button class="button primary" data-action="add-asset">＋ Add asset</button></div><div class="ax78-health"><span class="ax78-health-ring" style="--health:'+readiness+'"><b>'+readiness+'%</b></span><span><small>Asset readiness</small><strong>'+online+' online</strong><em>'+offline+' offline</em></span></div></header>'+
      '<section class="ax78-stats"><button data-ax78-scope="all"><span>'+hierarchyIcon()+'</span><small>Total register</small><strong>'+assets.length+'</strong><em>'+locations+' locations</em></button><button data-ax78-scope="equipment"><span>'+pulseIcon()+'</span><small>Equipment</small><strong>'+equipment+'</strong><em>'+online+' available</em></button><button data-ax78-scope="attention" class="attention"><span>'+pulseIcon()+'</span><small>Needs attention</small><strong>'+Math.max(offline,assets.filter(a=>activeWork(a).length).length)+'</strong><em>'+work+' open jobs</em></button><button data-route="inventory"><span>'+boxIcon()+'</span><small>Stock connections</small><strong>'+bomLinks+'</strong><em>Linked BOM items</em></button></section>'+
      '<section class="ax78-workspace">'+
        '<article class="ax78-explorer"><header><div><span>Plant navigator</span><h2>'+esc(site().name||'Current site')+'</h2><p>Facility → area → equipment → component</p></div><div class="ax78-view-actions"><button type="button" data-ax78-expand>Expand all</button><button type="button" data-ax78-collapse>Collapse all</button></div></header>'+
          '<div class="ax78-tools"><label><span>⌕</span><input type="search" data-ax78-search value="'+esc(ui.assetSearch||'')+'" placeholder="Search name, code or location"></label><div class="ax78-scopes">'+[['all','All'],['facilities','Locations'],['equipment','Equipment'],['tools','Tools'],['attention','Attention']].map(([id,label])=>'<button type="button" data-ax78-scope="'+id+'" class="'+((ui.assetScope||'all')===id?'active':'')+'">'+label+'</button>').join('')+'</div></div>'+
          '<div class="ax78-column-head"><span>Asset and location</span><span>Relationship</span><span>Work</span><span>State</span><span></span></div><div class="ax78-tree" data-ax78-tree>'+treeMarkup()+'</div><footer><span><i></i> Drag any record onto a valid parent to move it</span><b>'+assets.length+' assets</b></footer>'+
        '</article>'+
        '<aside class="ax78-side">'+
          '<section class="ax78-topology"><header><div><span>Structure at a glance</span><h2>Your plant model</h2></div><b>Live</b></header><div class="ax78-flow"><button data-ax78-scope="facilities"><i>'+assetTypeIcon('Facility')+'</i><span><small>Locations</small><strong>'+locations+'</strong></span></button><em></em><button data-ax78-scope="equipment"><i>'+assetTypeIcon('Equipment')+'</i><span><small>Equipment</small><strong>'+equipment+'</strong></span></button><em></em><button data-ax78-scope="tools"><i>'+assetTypeIcon('Tool')+'</i><span><small>Tools</small><strong>'+tools+'</strong></span></button></div></section>'+
          '<section class="ax78-panel"><header><div><span>Operational focus</span><h2>Asset attention</h2></div><button data-ax78-scope="attention">View all</button></header><div class="ax78-attention-list">'+attentionMarkup()+'</div></section>'+
          '<section class="ax78-panel"><header><div><span>Traceable history</span><h2>Recent activity</h2></div><button data-route="audit">Audit</button></header><div class="ax78-events">'+recentEvents()+'</div></section>'+
        '</aside>'+
      '</section><input id="fx23CsvInput" type="file" accept=".csv,text/csv" hidden></div>';
  }

  function renderAssetsV78(){
    return ui.assetView==='record'?previousAssetRenderer():atlas();
  }
  renderAssets=renderAssetsV78;window.renderAssets=renderAssetsV78;

  function animateBranch(branch,expand){
    if(!branch)return;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    branch.getAnimations().forEach(animation=>animation.cancel());
    if(expand)branch.hidden=false;
    if(reduced){branch.hidden=!expand;return}
    const height=branch.scrollHeight;
    const animation=branch.animate(expand?
      [{height:'0px',opacity:.25,transform:'translateY(-6px)'},{height:height+'px',opacity:1,transform:'translateY(0)'}]:
      [{height:height+'px',opacity:1,transform:'translateY(0)'},{height:'0px',opacity:.25,transform:'translateY(-6px)'}],
      {duration:expand?260:210,easing:'cubic-bezier(.2,.8,.2,1)'});
    animation.onfinish=()=>{branch.hidden=!expand;branch.style.height='';branch.style.opacity='';branch.style.transform=''};
  }
  function toggleBranch(button){
    const id=String(button.dataset.ax78Toggle),branch=document.querySelector('[data-ax78-branch="'+CSS.escape(id)+'"]');
    const expanding=collapsed.has(id)||branch?.hidden;
    if(expanding)collapsed.delete(id);else collapsed.add(id);
    saveCollapsed();button.classList.toggle('collapsed',!expanding);button.setAttribute('aria-expanded',String(expanding));button.setAttribute('aria-label',(expanding?'Collapse ':'Expand ')+(button.closest('.ax78-node')?.querySelector('.ax78-name strong')?.textContent||'asset'));
    animateBranch(branch,expanding);button.focus({preventScroll:true});
  }
  function setAll(expand){
    document.querySelectorAll('[data-ax78-toggle]').forEach(button=>{
      const id=String(button.dataset.ax78Toggle),branch=document.querySelector('[data-ax78-branch="'+CSS.escape(id)+'"]');
      if(expand)collapsed.delete(id);else collapsed.add(id);
      button.classList.toggle('collapsed',!expand);button.setAttribute('aria-expanded',String(expand));
      if(branch)branch.hidden=!expand;
    });
    saveCollapsed();
  }
  function rerenderAtlas(){
    const view=document.getElementById('appView');
    if(!view||ui.route!=='assets'||ui.assetView==='record')return;
    view.innerHTML=atlas();
  }

  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-ax78-toggle]');
    if(toggle){event.preventDefault();event.stopImmediatePropagation();toggleBranch(toggle);return}
    const scope=event.target.closest('[data-ax78-scope]');
    if(scope){event.preventDefault();event.stopImmediatePropagation();ui.assetScope=scope.dataset.ax78Scope;rerenderAtlas();return}
    if(event.target.closest('[data-ax78-expand]')){event.preventDefault();event.stopImmediatePropagation();setAll(true);return}
    if(event.target.closest('[data-ax78-collapse]')){event.preventDefault();event.stopImmediatePropagation();setAll(false);return}
  },true);
  let searchTimer=0;
  document.addEventListener('input',event=>{
    if(!event.target.matches('[data-ax78-search]'))return;
    ui.assetSearch=event.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>rerenderAtlas(),120);
  },true);
  document.addEventListener('dragend',()=>{
    document.querySelectorAll('.ax78-node.dragging,.ax78-node.drop-target').forEach(node=>node.classList.remove('dragging','drop-target'));
  });

  if(ui.route==='assets'&&ui.assetView!=='record')render();
})();
