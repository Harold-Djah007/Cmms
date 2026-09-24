'use strict';
(()=>{
  ui.s81SortIndex=Number.isInteger(ui.s81SortIndex)?ui.s81SortIndex:1;
  ui.s81SortDirection=ui.s81SortDirection||'asc';
  ui.s81PageSize=ui.s81PageSize||25;
  ui.s81HiddenColumns=Array.isArray(ui.s81HiddenColumns)?ui.s81HiddenColumns:[];

  const columnNames=['Select','Part / supply','Category','On hand','Min','Max','Locations','Last price','Status','Open'];
  const qty=part=>(part?.locations||[]).filter(location=>location.active!==false).reduce((sum,location)=>sum+Number(location.onHand||0),0);
  const locations=part=>(part?.locations||[]).filter(location=>location.active!==false).length;

  function summary(part){
    const supplier=[...(state.businesses||[]),...(state.vendors||[])].find(item=>item.id===(part.preferredBusinessId||part.businessId||part.vendorId));
    return '<section class="s81-record-summary"><div><span>On hand</span><strong>'+qty(part)+' '+esc(part.uom||'ea')+'</strong><small>Across '+locations(part)+' active location'+(locations(part)===1?'':'s')+'</small></div><div><span>Minimum / maximum</span><strong>'+Number(part.min||0)+' / '+Number(part.max||0)+'</strong><small>Replenishment thresholds</small></div><div><span>Preferred supplier</span><strong>'+esc(supplier?.name||'Not assigned')+'</strong><small>'+Number(part.leadTimeDays||0)+' day lead time</small></div><div><span>Inventory value</span><strong>'+money(qty(part)*Number(part.lastPrice||part.unitCost||0))+'</strong><small>'+money(Number(part.lastPrice||part.unitCost||0))+' per '+esc(part.uom||'ea')+'</small></div></section>';
  }
  function listControls(){
    return '<div class="s81-list-controls"><button type="button" data-s81-focus-search>⌕ Search</button><button type="button" data-s81-filters>≡ Filters</button><button type="button" data-s81-customize>⚙ Customize view</button></div>';
  }
  function pagination(total){
    return '<div class="s81-pagination"><label>Show <select data-s81-page-size><option '+(ui.s81PageSize===25?'selected':'')+'>25</option><option '+(ui.s81PageSize===50?'selected':'')+'>50</option><option '+(ui.s81PageSize===100?'selected':'')+'>100</option></select></label><span>'+total+' records</span><button type="button" disabled aria-label="Previous page">‹</button><label>Page <input value="1" aria-label="Current page"> of 1</label><button type="button" disabled aria-label="Next page">›</button></div>';
  }
  function applyColumns(){
    const table=document.querySelector('.s80-list-table');if(!table)return;
    columnNames.forEach((_,index)=>table.querySelectorAll('tr>*:nth-child('+(index+1)+')').forEach(cell=>cell.hidden=ui.s81HiddenColumns.includes(index)));
  }
  function applySort(){
    const table=document.querySelector('.s80-list-table'),body=table?.tBodies?.[0];if(!body)return;
    const rows=[...body.rows],index=ui.s81SortIndex,direction=ui.s81SortDirection==='asc'?1:-1;
    rows.sort((left,right)=>left.cells[index].textContent.trim().localeCompare(right.cells[index].textContent.trim(),undefined,{numeric:true,sensitivity:'base'})*direction).forEach(row=>body.appendChild(row));
    table.querySelectorAll('th').forEach((heading,headingIndex)=>{heading.classList.toggle('s81-sorted',headingIndex===index);heading.dataset.direction=headingIndex===index?ui.s81SortDirection:''});
  }
  function enhance(){
    document.body.classList.add('safimaint-supplies-v81');
    if(ui.route!=='inventory')return;
    const title=document.querySelector('.s80-titlebar>div:first-child');if(title&&!title.querySelector('.s81-release-chip'))title.insertAdjacentHTML('afterbegin','<span class="s81-release-chip">Stock control</span>');
    const command=document.querySelector('.s80-commandbar');if(command&&!command.querySelector('.s81-list-controls'))command.insertAdjacentHTML('beforeend',listControls());
    const footer=document.querySelector('.s80-list-footer');if(footer)footer.innerHTML=pagination(document.querySelectorAll('[data-s80-part-row]').length);
    const headings=document.querySelectorAll('.s80-list-table th');headings.forEach((heading,index)=>{if(index>0&&index<9){heading.dataset.s81Sort=String(index);heading.tabIndex=0;heading.title='Sort by '+columnNames[index]}});
    const record=document.querySelector('.s80-record-heading'),part=typeof getPart==='function'?getPart(ui.selectedPart):null;if(record&&part&&!document.querySelector('.s81-record-summary'))record.insertAdjacentHTML('afterend',summary(part));
    const toolbar=document.querySelector('.s80-record-actions');if(toolbar&&!toolbar.querySelector('.s81-editing-chip'))toolbar.insertAdjacentHTML('beforeend','<span class="s81-editing-chip"><i></i> Editable record</span>');
    applyColumns();applySort();
  }
  function customize(){
    openModal({eyebrow:'Parts and supplies',title:'Customize list view',submitText:'Apply columns',body:'<p class="modal-help">Choose the columns technicians need. Part / supply always remains visible.</p><div class="s81-column-picker">'+columnNames.map((name,index)=>index===1?'':'<label><input type="checkbox" name="column" value="'+index+'" '+(!ui.s81HiddenColumns.includes(index)?'checked':'')+'> <span>'+name+'</span></label>').join('')+'</div>',onSubmit:data=>{const shown=data.getAll('column').map(Number);ui.s81HiddenColumns=columnNames.map((_,index)=>index).filter(index=>index!==1&&!shown.includes(index));closeModal();render();toast('Parts list columns updated')}});
  }
  const previousRender=render;
  render=function(){previousRender.apply(this,arguments);requestAnimationFrame(enhance)};window.render=render;
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-s81-focus-search]')){document.querySelector('[data-s80-list-search]')?.focus();return}
    if(event.target.closest('[data-s81-filters]')){document.querySelector('.s80-filterset')?.scrollIntoView({behavior:'smooth',block:'center'});document.querySelector('.s80-filterset button')?.focus();return}
    if(event.target.closest('[data-s81-customize]')){event.preventDefault();event.stopImmediatePropagation();customize();return}
    const heading=event.target.closest('[data-s81-sort]');if(heading){const index=Number(heading.dataset.s81Sort);ui.s81SortDirection=ui.s81SortIndex===index&&ui.s81SortDirection==='asc'?'desc':'asc';ui.s81SortIndex=index;applySort()}
  },true);
  document.addEventListener('keydown',event=>{const heading=event.target.closest?.('[data-s81-sort]');if(heading&&(event.key==='Enter'||event.key===' ')){event.preventDefault();heading.click()}},true);
  document.addEventListener('change',event=>{if(event.target.matches('[data-s81-page-size]')){ui.s81PageSize=Number(event.target.value);toast('Showing up to '+ui.s81PageSize+' records per page')}},true);
  if(ui.route==='inventory')enhance();
})();
