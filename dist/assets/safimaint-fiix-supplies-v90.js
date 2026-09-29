'use strict';
(function(){
  function enhanceList(){
    const page=document.querySelector('.s80-list-page');
    if(!page||page.dataset.fiixV90)return;
    page.dataset.fiixV90='true';
    const titlebar=page.querySelector('.s80-titlebar');
    const command=page.querySelector('.s80-commandbar');
    if(titlebar){
      const heading=titlebar.querySelector('h1');
      if(heading)heading.textContent='Parts & supplies';
      const sub=titlebar.querySelector('p');
      if(sub)sub.textContent='Maintain part records, stock levels, locations, counts and inventory history.';
    }
    if(command&&!command.querySelector('[data-v90-new]')){
      command.insertAdjacentHTML('afterbegin',
        '<button class="s80-command v90-primary" type="button" data-v90-new>＋ New</button>'+
        '<button class="s80-command" type="button" data-v90-print-list>Print</button>'+
        '<button class="s80-command" type="button" data-v90-print-tags>Print tags</button>'+
        '<span class="v90-command-separator" aria-hidden="true"></span>'
      );
    }
    const tools=page.querySelector('.s80-list-tools');
    if(tools&&!tools.querySelector('.v90-list-caption')){
      tools.insertAdjacentHTML('afterbegin','<div class="v90-list-caption"><strong>Parts / Supplies</strong><small>Search and filter the inventory register</small></div>');
    }
  }
  function enhanceRecord(){
    const page=document.querySelector('.s80-record-page');
    if(!page||page.dataset.fiixV90)return;
    page.dataset.fiixV90='true';
    const heading=page.querySelector('.s80-record-heading');
    if(heading&&!heading.querySelector('.v90-record-state')){
      const core=heading.querySelector('.s80-record-core');
      if(core)core.insertAdjacentHTML('afterbegin','<div class="v90-record-kicker">Part / supply record</div>');
      const qr=heading.querySelector('.s80-record-qr');
      if(qr)qr.insertAdjacentHTML('afterbegin','<span class="v90-record-state"><i></i> Active</span>');
    }
    const actions=page.querySelector('.s80-record-actions');
    if(actions&&!actions.querySelector('[data-v90-list]')){
      const back=actions.querySelector('[data-s80-back]');
      if(back)back.insertAdjacentHTML('afterend','<button class="s80-btn" type="button" data-v90-list>List</button>');
    }
  }
  function enhance(){
    if(ui.route!=='inventory')return;
    enhanceList();
    enhanceRecord();
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-v90-new]')){event.preventDefault();event.stopImmediatePropagation();document.querySelector('[data-action="add-part"]')?.click();return}
    if(event.target.closest('[data-v90-print-list]')){event.preventDefault();event.stopImmediatePropagation();window.print();return}
    if(event.target.closest('[data-v90-print-tags]')){event.preventDefault();event.stopImmediatePropagation();toast('Select a part, open its record, then use Print tag.');return}
    if(event.target.closest('[data-v90-list]')){event.preventDefault();event.stopImmediatePropagation();ui.s80SupplyMode='list';render();return}
  },true);
  const previousRender=window.render;
  if(typeof previousRender==='function'){
    window.render=function(){const result=previousRender.apply(this,arguments);requestAnimationFrame(enhance);return result};
    render=window.render;
  }
  requestAnimationFrame(enhance);
})();