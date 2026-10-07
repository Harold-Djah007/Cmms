'use strict';
// Layout follows the location hierarchy and Stock form in Fiix's published v5 guides.
(function(){
  // Local SVGs keep the stockroom icons crisp at every display scale and offline.
  const iconPaths={
    store:'<path d="M3 9 12 4l9 5v11H3Z"/><path d="M3 9h18M7 20v-7h10v7M7 16h10M11 13v7"/>',
    part:'<path d="m4 7 8-4 8 4v10l-8 4-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
    bearing:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m6 6 2 2m8 8 2 2M6 18l2-2m8-8 2-2"/>',
    seal:'<ellipse cx="12" cy="9" rx="8" ry="5"/><path d="M4 9v6c0 3 16 3 16 0V9"/><ellipse cx="12" cy="9" rx="3" ry="2"/>',
    lubricant:'<path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z"/><path d="M9 15c0 2 1 3 3 3"/>',
    filter:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16m4-16v16m4-16v16M4 9h16M4 15h16"/>',
    engine:'<path d="M5 8h10l3 3h3v7h-3l-3 2H5V8Zm3-4h6M11 4v4M2 11v6m0-3h3"/>',
    drive:'<circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/><path d="M6 8h12M6 16h12"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    import:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
    export:'<path d="M12 15V3m-4 4 4-4 4 4M4 16v5h16v-5"/>',
    print:'<path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6Z"/><path d="M17 11h1"/>',
    adjust:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    count:'<path d="M9 4H5v17h14V4h-4M9 3h6v4H9Z"/><path d="m8 13 2 2 5-5M8 18h7"/>',
    hierarchy:'<rect x="9" y="3" width="6" height="5" rx="1"/><path d="M12 8v5M5 17v-4h14v4"/><rect x="2" y="17" width="6" height="4" rx="1"/><rect x="16" y="17" width="6" height="4" rx="1"/>',
    list:'<path d="M9 5h12M9 12h12M9 19h12"/><rect x="3" y="4" width="2" height="2"/><rect x="3" y="11" width="2" height="2"/><rect x="3" y="18" width="2" height="2"/>',
    save:'<path d="M4 3h13l4 4v14H3V3Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
    back:'<path d="m10 5-7 7 7 7M3 12h18"/>',
    files:'<path d="M14 7v10a4 4 0 0 1-8 0V7a6 6 0 0 1 12 0v10a2 2 0 0 1-4 0V5"/>',
    business:'<path d="M4 21V7l8-4 8 4v14M2 21h20M9 21v-5h6v5M8 8h1m6 0h1M8 12h1m6 0h1"/>',
    log:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'
  };
  const svg=(name,extra='')=>'<svg class="s93-icon '+extra+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(iconPaths[name]||iconPaths.part)+'</svg>';
  const partIcon=p=>svg(String(p.category||'').toLowerCase(),'s93-item-icon');
  const list=v=>Array.isArray(v)?v:[];
  const quantity=p=>list(p.locations).filter(l=>l.active!==false).reduce((sum,l)=>sum+Number(l.onHand||0),0);
  const store=id=>getStore(id)?.name||id||'Unassigned';
  const supplier=p=>[...list(state.businesses),...list(state.vendors)].find(b=>b.id===(p.preferredBusinessId||p.businessId||p.vendorId))?.name||'—';
  const low=p=>quantity(p)<Number(p.min||0);
  const hasDraft=id=>Boolean(ui.s93Dirty?.[id]&&ui.s93Draft?.[id]);
  function draftStatus(page,id){
    let status=page.querySelector('[data-s93-draft-status]');
    if(!status){status=document.createElement('div');status.dataset.s93DraftStatus='';status.className='s93-draft-status';status.setAttribute('role','status');page.querySelector('.s80-record-actions')?.append(status)}
    status.innerHTML=hasDraft(id)?'<span>Unsaved changes · kept while you browse</span><button type="button" data-s93-discard="'+esc(id)+'">Discard edits</button>':'<span>All changes saved</span>';
  }
  ui.s93View=ui.s93View||'hierarchy';ui.s93Closed=ui.s93Closed||[];
  function row(p,locations,group=''){
    const search=[p.name,p.code,p.category,p.barcode,p.description,...locations.map(l=>store(l.storeId)+' '+(l.bin||''))].join(' ').toLowerCase();
    if(ui.s93View==='hierarchy'){
      const onHand=locations.reduce((sum,l)=>sum+Number(l.onHand||0),0);
      return '<tr data-s80-part-row data-s80-open-part="'+esc(p.id)+'" data-search="'+esc(search)+'" data-category="'+esc(p.category||'')+'" data-s93-group="'+esc(group)+'" tabindex="0" role="button"><td><input type="checkbox" aria-label="Select '+esc(p.name)+'" onclick="event.stopPropagation()"></td><td class="s93-tree-label"><span class="s93-tree-part" aria-hidden="true">'+partIcon(p)+'</span><strong>'+esc(p.name)+'</strong> <em>on hand: '+onHand+' '+esc(p.uom||'ea')+'</em></td><td>'+esc(p.name)+'</td><td>'+esc(p.code)+'</td></tr>';
    }
    return '<tr data-s80-part-row data-s80-open-part="'+esc(p.id)+'" data-search="'+esc(search)+'" data-category="'+esc(p.category||'')+'" data-s93-group="'+esc(group)+'" tabindex="0" role="button"><td><input type="checkbox" aria-label="Select '+esc(p.name)+'" onclick="event.stopPropagation()"></td><td class="s93-name">'+(group?'<span class="s93-indent">↳</span>':'')+'<strong>'+esc(p.name)+'</strong><small>'+esc(p.category||'Part / supply')+'</small></td><td>'+esc(p.code)+'</td><td>'+money(p.lastPrice||p.unitCost||0)+'</td><td>'+quantity(p)+' '+esc(p.uom||'ea')+'<small>Min '+Number(p.min||0)+' · Max '+Number(p.max||0)+'</small></td><td>'+esc(locations.map(l=>store(l.storeId)+(l.bin?' / '+l.bin:'')).join('; ')||'Unassigned')+'</td><td>'+esc(p.category||'Parts and supplies')+'</td><td>'+'<span class="sm-stock-status '+(quantity(p)<=0?'out':low(p)?'low':'healthy')+'">'+(quantity(p)<=0?'Stocked out':low(p)?'Below minimum':'In stock')+'</span>'+'</td><td>'+esc(supplier(p))+'</td></tr>';
  }
  function register(){
    const parts=[...list(state.parts)],filter=ui.s80SupplyFilter||'all';
    const sorters=ui.s93View==='hierarchy'?[null,p=>p.name,p=>p.name,p=>p.code]:[null,p=>p.name,p=>p.code,p=>Number(p.lastPrice||p.unitCost||0),p=>quantity(p),p=>list(p.locations).map(l=>store(l.storeId)).join(' '),p=>p.category,p=>low(p)?'Below minimum':quantity(p)<=0?'Stocked out':'In stock',supplier];
    if(ui.s93Sort){const value=sorters[ui.s93Sort.index];parts.sort((a,b)=>String(value(a)||'').localeCompare(String(value(b)||''),undefined,{numeric:true})*ui.s93Sort.direction)}
    const visible=parts.filter(p=>filter==='all'||filter==='low'&&low(p)||filter==='out'&&quantity(p)<=0||filter==='healthy'&&quantity(p)>0&&!low(p));
    const groups=new Map();visible.forEach(p=>{const locations=list(p.locations).filter(l=>l.active!==false);for(const id of new Set(locations.length?locations.map(l=>l.storeId):[''])){if(!groups.has(id))groups.set(id,[]);groups.get(id).push({part:p,locations:locations.filter(l=>l.storeId===id)})}});
    const rows=ui.s93View==='list'?visible.map(p=>row(p,list(p.locations).filter(l=>l.active!==false))).join(''):[...groups].map(([id,entries])=> '<tr class="s93-location" data-s93-location="'+esc(id)+'"><td><input type="checkbox" aria-label="Select location '+esc(store(id))+'"></td><td><button type="button" data-s93-toggle="'+esc(id)+'" aria-expanded="'+!ui.s93Closed.includes(id)+'"><span class="s93-tree-toggle">'+svg(ui.s93Closed.includes(id)?'plus':'minus')+'</span><span class="s93-tree-store" aria-hidden="true">'+svg('store')+'</span>'+esc(store(id))+'</button></td><td>'+esc(store(id))+'</td><td>'+esc(getStore(id)?.code||id||'—')+'</td></tr>' +entries.map(e=>row(e.part,e.locations,id)).join('')).join('');
    const categories=[...new Set(parts.map(p=>p.category).filter(Boolean))].sort();
    return '<div class="s93-list '+(ui.s93View==='hierarchy'?'s93-location-workspace':'')+'"><header class="s93-actionbar"><button class="button primary" data-action="add-part">'+svg('plus')+'New</button><button class="button" data-route="import">'+svg('import')+'Import</button><button class="button" data-route="export">'+svg('export')+'Export</button><button class="button" data-s93-print>'+svg('print')+'Print</button><button class="button" data-route="batch-stock">'+svg('adjust')+'Adjust stock</button><button class="button" data-route="counts">'+svg('count')+'Cycle count</button></header><section class="s93-register"><header class="s93-register-head"><div class="s93-title"><h1>Parts &amp; supplies</h1><p>Find a part, check its stock and open its record.</p></div><div class="s93-view"><button data-s93-view="hierarchy" aria-pressed="'+(ui.s93View==='hierarchy')+'" title="Group parts by stock location">'+svg('hierarchy')+'Locations</button><button data-s93-view="list" aria-pressed="'+(ui.s93View==='list')+'" title="Show one row per part">'+svg('list')+'Catalog</button></div><label>Category<select data-s80-category><option value="">All parts and supplies</option>'+categories.map(c=>'<option '+(ui.s93Category===c?'selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label><label class="s93-search">Search<input data-s80-list-search value="'+esc(ui.inventorySearch||'')+'" placeholder="Name, code, barcode or location"></label></header><div class="s93-availability">'+(ui.s93View==='hierarchy'?'<button data-s93-expand-all>Expand locations</button><button data-s93-collapse-all>Collapse locations</button>':'')+[['all','All',parts.length],['low','Below minimum',parts.filter(low).length],['out','Stocked out',parts.filter(p=>quantity(p)<=0).length],['healthy','In stock',parts.filter(p=>quantity(p)>0&&!low(p)).length]].map(([id,label,count])=>'<button data-s80-filter="'+id+'" aria-pressed="'+(filter===id)+'">'+label+' ('+count+')</button>').join('')+'</div><div class="s93-table-scroll"><table class="s93-table '+(ui.s93View==='hierarchy'?'s93-tree':'')+'"><thead><tr>'+ (ui.s93View==='hierarchy'?'<th></th><th>Location</th><th>Name</th><th>Code</th>':'<th></th><th>Name / location</th><th>Code</th><th>Last price</th><th>Total stock</th><th>Stock location</th><th>Category</th><th>Status</th><th>Preferred supplier</th>')+'</tr></thead><tbody>'+rows+'</tbody></table><div data-s80-no-results hidden>No matching parts. Change the search or filter.</div></div><footer><span data-s80-visible-count>'+visible.length+'</span> part records · Select a part to open its record.</footer></section></div>';
  }
  function filterRows(){
    const q=String(document.querySelector('[data-s80-list-search]')?.value||'').trim().toLowerCase(),category=document.querySelector('[data-s80-category]')?.value||'';const ids=new Set();
    document.querySelectorAll('[data-s80-part-row]').forEach(row=>{const match=(!q||row.dataset.search.includes(q))&&(!category||row.dataset.category===category);row.dataset.matches=String(match);row.hidden=!match||ui.s93View==='hierarchy'&&ui.s93Closed.includes(row.dataset.s93Group)&&!q&&!category;if(match)ids.add(row.dataset.s80OpenPart)});
    document.querySelectorAll('[data-s93-location]').forEach(row=>{row.hidden=![...document.querySelectorAll('[data-s80-part-row]')].some(r=>r.dataset.s93Group===row.dataset.s93Location&&r.dataset.matches==='true')});
    const count=document.querySelector('[data-s80-visible-count]');if(count)count.textContent=ids.size;const empty=document.querySelector('[data-s80-no-results]');if(empty)empty.hidden=ids.size>0;
  }
  window.safiCapturePartDraft=function(id){const form=document.querySelector('[data-s80-record-form]');if(!form)return;ui.s93Draft=ui.s93Draft||{};ui.s93Draft[id]={...(ui.s93Draft[id]||{}),...Object.fromEntries(new FormData(form))}};
  const oldRecord=renderPartDetail;
  renderPartDetail=function(part){return oldRecord(part?{...part,...ui.s93Draft?.[part.id]}:part)};window.renderPartDetail=renderPartDetail;
  renderInventory=function(){return ui.s80SupplyMode==='record'?renderPartDetail(getPart(ui.selectedPart)):register()};window.renderInventory=renderInventory;
  function recordLayout(){
    const page=document.querySelector('.s80-record-page');if(!page||page.dataset.s93)return;page.dataset.s93='true';page.classList.add('s93-record');
    page.querySelector('.s81-record-summary')?.remove();
    const part=getPart(ui.selectedPart),heading=page.querySelector('.s80-record-heading');
    draftStatus(page,part.id);
    heading.querySelector('[name="name"]')?.setAttribute('aria-label','Part / supply name');heading.querySelector('[name="description"]')?.setAttribute('aria-label','Description');
    const title=document.createElement('h1');title.className='s93-record-title';title.textContent='Part/Supply: '+part.name+' ('+part.code+')';heading.before(title);
    const photo=heading.querySelector('.s80-part-photo');if(photo){photo.querySelector('svg')?.remove();photo.insertAdjacentHTML('afterbegin',partIcon(part));photo.querySelector('button')?.remove();const stock=document.createElement('div');stock.innerHTML='<small>'+esc(part.code)+'</small><strong>Stock: '+quantity(part)+' '+esc(part.uom||'ea')+'</strong>';photo.append(stock)}
    const stack=page.querySelector('.s80-stock-grid');if(stack){const levels=stack.querySelector('.s80-record-section'),receipts=page.querySelector('.s80-receipt-preview');const left=document.createElement('div');left.className='s93-stock-left';stack.prepend(left);if(levels)left.append(levels);if(receipts)left.append(receipts);const hint=document.createElement('p');hint.className='s93-stock-help';hint.textContent='Set stock levels for each location. Use Receive stock for deliveries and Adjust stock for corrections.';left.prepend(hint)}
    const actionIcons={'[data-s80-back]':'back','[data-s80-save]':'save','[data-s80-save-close]':'save','[data-s80-print]':'print'};
    Object.entries(actionIcons).forEach(([selector,name])=>{const button=page.querySelector(selector);if(button){button.textContent=button.textContent.replace('←','').trim();button.insertAdjacentHTML('afterbegin',svg(name))}});
    const tabIcons={stock:'store',counts:'count',boms:'hierarchy',businesses:'business',receipts:'import',files:'files',custom:'adjust',history:'log'};
    page.querySelectorAll('[data-s80-tab]').forEach(button=>button.insertAdjacentHTML('afterbegin',svg(tabIcons[button.dataset.s80Tab])));
    const actions=page.querySelector('.s80-record-actions');actions?.querySelector('[data-v90-list]')?.remove();
    heading.querySelector('.v90-record-kicker')?.remove();heading.querySelector('.v90-record-state')?.remove();
    page.querySelector('.s81-editing-chip')?.remove();
    const receipts=page.querySelector('.s80-receipt-preview header');if(receipts){const receive=document.createElement('button');receive.type='button';receive.className='s80-mini';receive.dataset.stockMove=part.id;receive.textContent='Receive stock';receipts.append(receive)}
  }
  const previousRender=render;render=function(){const result=previousRender.apply(this,arguments);if(ui.route==='inventory'){filterRows();document.querySelectorAll('.s93-table th').forEach((th,index)=>{if(index){th.dataset.s93Sort=index;th.tabIndex=0;th.setAttribute('role','button');th.title='Sort by '+th.textContent;th.setAttribute('aria-sort',ui.s93Sort?.index===index?(ui.s93Sort.direction===1?'ascending':'descending'):'none')}});requestAnimationFrame(recordLayout)}return result};window.render=render;
  document.addEventListener('click',event=>{
    const discard=event.target.closest('[data-s93-discard]');if(discard){delete ui.s93Draft?.[discard.dataset.s93Discard];delete ui.s93Dirty?.[discard.dataset.s93Discard];render();return}
    const view=event.target.closest('[data-s93-view]');if(view){ui.s93View=view.dataset.s93View;ui.s93Sort=null;render();return}
    if(event.target.closest('[data-s93-expand-all]')){ui.s93Closed=[];render();return}
    if(event.target.closest('[data-s93-collapse-all]')){ui.s93Closed=[...document.querySelectorAll('[data-s93-location]')].map(row=>row.dataset.s93Location);render();return}
    const toggle=event.target.closest('[data-s93-toggle]');if(toggle){const id=toggle.dataset.s93Toggle;ui.s93Closed=ui.s93Closed.includes(id)?ui.s93Closed.filter(x=>x!==id):[...ui.s93Closed,id];render();return}
    const sort=event.target.closest('[data-s93-sort]');if(sort){const index=Number(sort.dataset.s93Sort);ui.s93Sort={index,direction:ui.s93Sort?.index===index?-ui.s93Sort.direction:1};render();return}
    if(event.target.closest('[data-s93-print]'))window.print();
  });
  function keepDraft(event){
    const form=event.target.closest('[data-s80-record-form]');if(!form||!event.target.name||event.target.type==='file')return;
    const id=form.dataset.s80RecordForm;ui.s93Dirty=ui.s93Dirty||{};ui.s93Dirty[id]=true;safiCapturePartDraft(id);draftStatus(form.closest('.s80-record-page'),id);
  }
  document.addEventListener('input',event=>{if(event.target.matches('[data-s80-list-search]'))filterRows();keepDraft(event)});
  document.addEventListener('change',keepDraft);
  window.addEventListener('beforeunload',event=>{if(Object.keys(ui.s93Dirty||{}).some(hasDraft)){event.preventDefault();event.returnValue=''}});
  document.addEventListener('change',event=>{if(event.target.matches('[data-s80-category]')){ui.s93Category=event.target.value;filterRows()}});
  document.addEventListener('keydown',event=>{if(event.target.matches('[data-s93-sort]')&&['Enter',' '].includes(event.key)){event.preventDefault();event.target.click()}});
})();
