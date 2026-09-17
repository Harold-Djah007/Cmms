'use strict';

// SafiMaintain live UI decorator.
// This file does not change brand colours or logo assets. It adds a lightweight,
// truthful system-status layer and an explicitly labelled CMMS preview animation.

(function(){
  let scheduled=false;

  function svgIcon(kind){
    const paths={
      asset:'<path d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Zm0 2.3 5.2 2.8L12 11 6.8 8.1 12 5.3ZM6.5 9.7l4.5 2.4v6.2l-4.5-2.4V9.7Zm6.5 8.6v-6.2l4.5-2.4v6.2L13 18.3Z"/>' ,
      work:'<path d="M14.6 5.4a4.2 4.2 0 0 0-5.2 5.2L3.7 16.3a1.5 1.5 0 0 0 0 2.1l1.9 1.9a1.5 1.5 0 0 0 2.1 0l5.7-5.7a4.2 4.2 0 0 0 5.2-5.2l-2.5 2.5-2.1-.6-.6-2.1 2.5-2.5Z"/>' ,
      stock:'<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm8-2.2L7 8l5 2.7L17 8l-5-2.7ZM6 9.7v5.6l5 2.8v-5.7L6 9.7Zm7 8.4 5-2.8V9.7l-5 2.7v5.7Z"/>'
    };
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">${paths[kind]||paths.asset}</svg>`;
  }

  function operationalAssets(){
    if(typeof state==='undefined'||!Array.isArray(state.assets)) return [];
    return state.assets.filter(a=>a.type!=='Site');
  }

  function liveValues(){
    const assets=operationalAssets();
    const online=assets.filter(a=>a.operatingState==='Online').length;
    const openWork=typeof state!=='undefined'&&Array.isArray(state.workOrders)
      ? state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status)).length : 0;
    const lowStock=typeof state!=='undefined'&&Array.isArray(state.parts)
      ? state.parts.filter(p=>{
          try{return typeof partOnHand==='function'&&partOnHand(p)<Number(p.min)}catch(_){return false}
        }).length : 0;
    return {assets:assets.length,online,openWork,lowStock};
  }

  function ensureLiveBar(){
    const host=document.querySelector('.getting-started');
    if(!host||document.querySelector('.cmms-livebar')) return;
    const v=liveValues();
    const bar=document.createElement('section');
    bar.className='cmms-livebar';
    bar.setAttribute('aria-label','Live workspace status');
    const readiness=v.assets
      ? `${v.online} of ${v.assets} assets online`
      : 'Ready for your first asset';
    bar.innerHTML=`
      <div class="cmms-live-main">
        <span class="cmms-live-dot" aria-hidden="true"></span>
        <div class="cmms-live-copy"><strong>Workspace live</strong><small>${readiness}</small></div>
      </div>
      <div class="cmms-live-metric">
        <span class="cmms-live-icon">${svgIcon('asset')}</span>
        <div class="cmms-live-copy"><strong class="cmms-live-number">${v.assets}</strong><small>Assets tracked</small></div>
      </div>
      <div class="cmms-live-metric">
        <span class="cmms-live-icon">${svgIcon('work')}</span>
        <div class="cmms-live-copy"><strong class="cmms-live-number">${v.openWork}</strong><small>Open work</small></div>
      </div>
      <div class="cmms-live-metric">
        <span class="cmms-live-icon">${svgIcon('stock')}</span>
        <div class="cmms-live-copy"><strong class="cmms-live-number">${v.lowStock}</strong><small>Stock alerts</small></div>
      </div>`;
    host.parentNode.insertBefore(bar,host);
  }

  function updateLiveBar(){
    const bar=document.querySelector('.cmms-livebar');if(!bar)return;
    const v=liveValues();
    const main=bar.querySelector('.cmms-live-main small');
    if(main) main.textContent=v.assets?`${v.online} of ${v.assets} assets online`:'Ready for your first asset';
    const nums=bar.querySelectorAll('.cmms-live-number');
    if(nums[0])nums[0].textContent=v.assets;
    if(nums[1])nums[1].textContent=v.openWork;
    if(nums[2])nums[2].textContent=v.lowStock;
  }

  function ensureOnboardingPreview(){
    const side=document.querySelector('.onboarding-side');
    if(!side||side.querySelector('.cmms-preview')) return;
    const preview=document.createElement('div');
    preview.className='cmms-preview';
    preview.innerHTML=`
      <div class="cmms-preview-head"><strong>Asset CMMS live preview</strong><span class="cmms-preview-badge">Preview</span></div>
      <div class="cmms-machine" aria-hidden="true">
        <span class="cmms-link"></span><span class="cmms-link l2"></span><span class="cmms-link l3"></span>
        <span class="cmms-node n1"></span><span class="cmms-node n2"></span><span class="cmms-node n3"></span><span class="cmms-node n4"></span>
        <span class="cmms-machine-ring"></span><span class="cmms-machine-core"><span class="cmms-gear"></span></span>
      </div>
      <div class="cmms-preview-foot"><span class="cmms-live-dot"></span><span><b>Ready to connect your operation.</b> Add real assets after setup.</span></div>`;
    side.appendChild(preview);
  }

  function staggerCards(){
    document.querySelectorAll('.card,.simple-stat,.starter-card,.record-row,.alert-row').forEach((el,index)=>{
      if(el.dataset.motionReady)return;
      el.dataset.motionReady='true';
      el.style.animationDelay=`${Math.min(index*28,280)}ms`;
    });
  }

  function improveLabels(){
    // Keep language simple without changing any underlying workflow.
    const map={
      'Parts & supplies':'Stock & parts',
      'People & groups':'Team',
      'Scheduled maintenance':'Preventive maintenance'
    };
    document.querySelectorAll('.page-head h1').forEach(el=>{
      if(map[el.textContent.trim()])el.textContent=map[el.textContent.trim()];
    });
  }

  function decorate(){
    scheduled=false;
    ensureOnboardingPreview();
    ensureLiveBar();
    updateLiveBar();
    staggerCards();
    improveLabels();
  }

  function schedule(){
    if(scheduled)return;scheduled=true;requestAnimationFrame(decorate);
  }

  const target=document.getElementById('appView')||document.body;
  const observer=new MutationObserver(schedule);
  observer.observe(target,{childList:true,subtree:true});
  window.addEventListener('online',schedule);
  window.addEventListener('offline',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  schedule();
})();
