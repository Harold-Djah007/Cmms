'use strict';

// SafiMaintain semantic live-motion decorator.
// Adds animation that matches each dashboard KPI while preserving real data and branding.
(function(){
  let scheduled=false;

  function wrenchSvg(){
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.6 5.4a4.2 4.2 0 0 0-5.2 5.2L3.7 16.3a1.5 1.5 0 0 0 0 2.1l1.9 1.9a1.5 1.5 0 0 0 2.1 0l5.7-5.7a4.2 4.2 0 0 0 5.2-5.2l-2.5 2.5-2.1-.6-.6-2.1 2.5-2.5Z"/></svg>';
  }

  function ensureBackgroundDetails(){
    const bg=document.querySelector('.sm-live-bg');
    if(!bg) return;
    if(!bg.querySelector('.sm-bg-orb.o1')){
      bg.insertAdjacentHTML('beforeend','<span class="sm-bg-orb o1"></span><span class="sm-bg-orb o2"></span><span class="sm-bg-scan"></span>');
    }
  }

  function liveMarkup(kind){
    if(kind==='assets'){
      return '<span class="asset-ring"></span><span class="asset-ring r2"></span><span class="asset-machine"></span><span class="asset-scan"></span><span class="asset-dot d1"></span><span class="asset-dot d2"></span>';
    }
    if(kind==='work'){
      return '<span class="work-orbit"></span><span class="work-tool">'+wrenchSvg()+'</span><span class="work-task t1"></span><span class="work-task t2"></span>';
    }
    if(kind==='stock'){
      return '<span class="stock-level"></span><span class="stock-conveyor"></span><span class="stock-box b1"></span><span class="stock-box b2"></span><span class="stock-box b3"></span>';
    }
    return '<span class="team-link l1"></span><span class="team-link l2"></span><span class="team-link l3"></span><span class="person p1"></span><span class="person p2"></span><span class="person p3"></span><span class="team-status"></span>';
  }

  function decorateKpis(){
    const kinds=['assets','work','stock','team'];
    document.querySelectorAll('.sm-kpis .sm-kpi').forEach((tile,index)=>{
      const kind=kinds[index]||'assets';
      if(tile.dataset.semanticMotion===kind) return;
      tile.dataset.semanticMotion=kind;
      tile.classList.add('sm-kpi-'+kind);
      const existing=tile.querySelector('.sm-kpi-live');
      if(existing) existing.remove();
      const live=document.createElement('span');
      live.className='sm-kpi-live sm-live-'+kind;
      live.setAttribute('aria-hidden','true');
      live.innerHTML=liveMarkup(kind);
      tile.appendChild(live);
    });
  }

  function decorate(){
    scheduled=false;
    ensureBackgroundDetails();
    decorateKpis();
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(decorate);
  }

  const target=document.querySelector('.workspace')||document.body;
  new MutationObserver(schedule).observe(target,{childList:true,subtree:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  schedule();
})();
