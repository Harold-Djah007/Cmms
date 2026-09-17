'use strict';

// SafiMaintain semantic motion v15.
// Makes the live CMMS background easier to see and labels each KPI's semantic animation.
(function(){
  let scheduled=false;

  function ensureBackdrop(){
    const home=document.querySelector('.sm-home');
    if(!home||home.querySelector('.sm15-backdrop')) return;
    const backdrop=document.createElement('div');
    backdrop.className='sm15-backdrop';
    backdrop.setAttribute('aria-hidden','true');
    backdrop.innerHTML=`
      <span class="sm15-route r1"></span><span class="sm15-route r2"></span>
      <span class="sm15-route r3"></span><span class="sm15-route r4"></span>
      <span class="sm15-point p1"></span><span class="sm15-point p2"></span><span class="sm15-point p3"></span>
      <span class="sm15-point p4"></span><span class="sm15-point p5"></span><span class="sm15-point p6"></span>
      <span class="sm15-sweep"></span>`;
    home.prepend(backdrop);
  }

  function semanticCaption(tile,kind){
    const live=tile.querySelector('.sm-kpi-live');
    if(!live||live.querySelector('.sm-live-caption')) return;
    const labels={assets:'Monitoring',work:'Work cycle',stock:'Stock flow',team:'Connected'};
    const label=document.createElement('span');
    label.className='sm-live-caption';
    label.textContent=labels[kind]||'Live';
    live.appendChild(label);
  }

  function decorateTiles(){
    const kinds=['assets','work','stock','team'];
    document.querySelectorAll('.sm-kpis .sm-kpi').forEach((tile,index)=>{
      const kind=kinds[index]||'assets';
      tile.classList.add('sm-kpi-'+kind);
      semanticCaption(tile,kind);
    });
  }

  function decorate(){
    scheduled=false;
    ensureBackdrop();
    decorateTiles();
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
