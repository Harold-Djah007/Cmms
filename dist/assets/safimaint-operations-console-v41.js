'use strict';

// SafiMaintain operations console v41.
// Replaces the earlier hub/network animation with a compact maintenance control-console.
(function(){
  let scheduled=false;

  function svg(kind){
    if(kind==='pulse')return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 5.5a4 4 0 0 0-5 5L4 16a1.5 1.5 0 0 0 0 2l2 2a1.5 1.5 0 0 0 2 0l5.5-5.5a4 4 0 0 0 5-5L16 12l-2-.6-.6-2 2.5-2.5a4 4 0 0 0-1.4-1.4Z"/></svg>';
  }
  function snap(){
    const assets=(state.assets||[]).filter(a=>a.type!=='Site');
    const online=assets.filter(a=>a.operatingState==='Online').length;
    const offline=assets.filter(a=>a.operatingState==='Offline').length;
    const work=(state.workOrders||[]).filter(w=>!['Completed','Cancelled'].includes(w.status));
    const low=(state.parts||[]).filter(p=>{try{return partOnHand(p)<Number(p.min)}catch(_){return false}});
    const active=(state.users||[]).filter(u=>u.active!==false);
    const assetHealth=assets.length?Math.round((online/assets.length)*100):100;
    const workPct=work.length?Math.min(92,28+work.filter(w=>w.status==='In Progress').length*16):8;
    return {assets,online,offline,work,low,active,assetHealth,workPct};
  }
  function bars(){
    return [42,66,51,78,59,84,63,72,55,81,67,76].map((h,i)=>'<i style="height:'+h+'%;animation-delay:'+(i*.14)+'s"></i>').join('');
  }
  function stockSegments(low){
    return Array.from({length:6},(_,i)=>'<i class="'+(low&&i===5?'warn':'ok')+'"></i>').join('');
  }
  function people(count){
    const max=Math.max(3,Math.min(5,count));
    return Array.from({length:max},(_,i)=>'<span class="sm41-person '+(i<count?'active':'')+'">'+(i+1)+'</span>').join('');
  }
  function consoleMarkup(v){
    return '<div class="sm41-console" aria-label="Live maintenance operations status">'+
      '<div class="sm41-head"><div><span class="sm41-head-icon">'+svg('pulse')+'</span><span><strong>Maintenance operations</strong><small>Live workspace telemetry</small></span></div><span class="sm41-live">Monitoring</span></div>'+
      '<div class="sm41-body">'+
        '<section class="sm41-card sm41-health"><small>Asset health</small><div class="sm41-health-value"><b>'+v.assetHealth+'%</b><span>'+v.online+' / '+v.assets.length+' online</span></div><div class="sm41-health-bars">'+bars()+'</div><div class="sm41-health-foot"><span>'+v.offline+' offline</span><b>'+(v.offline?'Attention':'Stable')+'</b></div></section>'+
        '<section class="sm41-card sm41-cycle"><div><small>Work execution</small><strong>'+v.work.length+' open</strong><em>'+v.work.filter(w=>w.status==='In Progress').length+' in progress</em></div><div class="sm41-cycle-ring" style="--sm41-work-angle:'+v.workPct+'%"><span>'+v.workPct+'%</span></div></section>'+
        '<section class="sm41-card"><small>Parts readiness</small><strong>'+(v.low.length?String(v.low.length)+' alert'+(v.low.length===1?'':'s'):'Ready')+'</strong><em>'+(v.low.length?'Below minimum stock':'No low-stock exceptions')+'</em><div class="sm41-stock-track">'+stockSegments(v.low.length)+'</div><span class="sm41-stock-pulse"></span></section>'+
        '<section class="sm41-card"><small>Technician coverage</small><strong>'+v.active.length+' active</strong><em>Available workspace members</em><div class="sm41-team-row">'+people(v.active.length)+'</div></section>'+
      '</div>'+
      '<div class="sm41-systemline"><span>System pulse nominal</span><span>Field cache ready</span><i class="sm41-pulse-line"></i></div>'+
    '</div>';
  }
  function replaceHero(){
    const visual=document.querySelector('.sm-hero-visual');
    if(!visual)return;
    if(visual.dataset.sm41==='1')return;
    visual.dataset.sm41='1';
    visual.innerHTML=consoleMarkup(snap());
  }
  function decorateKpis(){
    const kinds=['asset','work','stock','team'];
    document.querySelectorAll('.sm-kpis .sm-kpi').forEach((tile,index)=>{
      if(tile.querySelector('.sm41-kpi-meter'))return;
      const meter=document.createElement('span');
      meter.className='sm41-kpi-meter '+kinds[index];
      meter.setAttribute('aria-hidden','true');
      meter.innerHTML=[22,46,68,41,57].map((h,i)=>'<i style="height:'+h+'%;animation-delay:'+(i*.25)+'s"></i>').join('');
      tile.appendChild(meter);
    });
  }
  function decorate(){
    scheduled=false;
    replaceHero();
    decorateKpis();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(decorate);
  }
  const view=document.getElementById('appView');
  if(view)new MutationObserver(schedule).observe(view,{childList:true});
  window.addEventListener('online',schedule);
  window.addEventListener('offline',schedule);
  schedule();
})();
