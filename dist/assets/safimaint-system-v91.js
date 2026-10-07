'use strict';
// Shared polish belongs here; operational behavior stays in its owning module.
(function(){
  function polish(){
    const view=document.getElementById('appView');
    if(!view)return;
    if(!state.meta?.onboardingComplete&&!state.meta?.demo){showFirstRun();return}
    document.body.classList.remove('first-run');
    if(!state.meta?.demo&&new URLSearchParams(location.search).get('device')==='1'&&!state.parts.length&&!state.workOrders.length&&!view.querySelector('.sm-demo-loader')){
      const loader=document.createElement('div');loader.className='sm-demo-banner sm-demo-loader';
      loader.innerHTML='<span>This is your saved empty workspace. Load sample assets, parts, stock and work orders to test SafiMaintain.</span><button type="button" class="button" data-v67-load-demo>Load demo data</button>';
      view.prepend(loader);
    }
    if(state.meta?.demo&&!view.querySelector('.sm-demo-banner')){
      const banner=document.createElement('div');banner.className='sm-demo-banner';
      banner.innerHTML='<strong>Demo workspace</strong><span>Sample records for exploring SafiMaintain. Use a shared workspace for your team’s operational data.</span>'+(new URLSearchParams(location.search).get('presentation')==='1'?'<button type="button" class="button small" data-sm-demo-tour>Demo walkthrough</button>':'');
      view.prepend(banner);
    }
    // Make list rows and cards usable with a keyboard as well as a pointer.
    view.querySelectorAll('[data-open-work],[data-open-asset],[data-open-part]').forEach(el=>{
      if(!el.matches('button,a,input')){el.tabIndex=0;el.setAttribute('role','button')}
    });
  }
  const previousRender=render;
  render=function(){const result=previousRender.apply(this,arguments);polish();return result};
  window.render=render;
  const tourSteps=[
    ['Maintenance overview','Show today’s work, offline equipment and parts that need attention.','dashboard'],
    ['Asset record','Open the feed pump: location, operating state, BOM, meters and service history.','assets'],
    ['Parts & supplies','Browse stock locations and open a part to show stock levels, receipts and suppliers.','inventory'],
    ['Work execution','Open the seal replacement work order to show tasks, labor, parts and closure requirements.','work-orders'],
    ['Preventive maintenance','Show recurring plans with time and meter triggers, templates and generation history.','pm'],
    ['Operational reporting','Show the live stock-risk report and export its current records.','report-viewer'],
    ['Offline continuity','Explain saved device records and the separate shared-workspace synchronization status.','sync-center']
  ];
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-sm-demo-tour]')&&state.meta?.demo){
      openModal({eyebrow:'Presentation guide',title:'Demo walkthrough',submitText:null,body:'<p class="sm-tour-intro">A short route through the sample workspace. Opening a step does not change operational records.</p><div class="sm-tour-steps">'+tourSteps.map(([title,description],index)=>'<section><span>'+String(index+1).padStart(2,'0')+'</span><div><strong>'+title+'</strong><p>'+description+'</p></div><button type="button" class="button small" data-sm-tour-step="'+index+'">Open step '+(index+1)+'</button></section>').join('')+'</div>'});return;
    }
    const button=event.target.closest('[data-sm-tour-step]');if(!button||!state.meta?.demo)return;
    const index=Number(button.dataset.smTourStep),step=tourSteps[index];if(!step)return;
    closeModal();
    if(index===1){const asset=state.assets.find(a=>a.id==='P-201')||state.assets.find(a=>a.type==='Equipment');if(asset){ui.selectedAsset=asset.id;ui.assetView='record';ui.assetRecordTab='general'}}
    if(index===2){ui.s80SupplyMode='list';ui.s93View='hierarchy';ui.s93Closed=[];ui.inventorySearch='';ui.s93Category='';ui.s80SupplyFilter='all'}
    if(index===5){ui.v55ReportId='stock';ui.v55ReportFrom='';ui.v55ReportTo=''}
    go(step[2]);
    if(index===3){const work=state.workOrders.find(w=>w.id==='WO-2502')||state.workOrders[0];if(work)openWorkDrawer(work.id)}
  });
  document.addEventListener('keydown',event=>{
    if(!['Enter',' '].includes(event.key)||event.target.matches('button,a,input,select,textarea'))return;
    if(event.target.matches('[data-open-work],[data-open-asset],[data-open-part],[data-s80-open-part]')){event.preventDefault();event.target.click()}
  });
  polish();
})();
