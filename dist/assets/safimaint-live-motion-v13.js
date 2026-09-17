'use strict';

// Decorative live CMMS background for the current premium dashboard.
// It never fabricates operational values and does not change branding.
(function(){
  function ensureBackground(){
    const workspace=document.querySelector('.workspace');
    if(!workspace||workspace.querySelector('.sm-live-bg')) return;

    const layer=document.createElement('div');
    layer.className='sm-live-bg';
    layer.setAttribute('aria-hidden','true');
    layer.innerHTML=`
      <span class="sm-bg-link l1"></span>
      <span class="sm-bg-link l2"></span>
      <span class="sm-bg-link l3"></span>
      <span class="sm-bg-link l4"></span>
      <span class="sm-bg-node n1"></span>
      <span class="sm-bg-node n2"></span>
      <span class="sm-bg-node n3"></span>
      <span class="sm-bg-node n4"></span>
      <span class="sm-bg-node n5"></span>
      <span class="sm-bg-node n6"></span>`;

    workspace.insertBefore(layer,workspace.firstChild);
  }

  function kickTiles(){
    document.querySelectorAll('.sm-kpi').forEach((tile,index)=>{
      if(tile.dataset.liveMotion==='true') return;
      tile.dataset.liveMotion='true';
      tile.style.setProperty('--sm-motion-index',index);
    });
  }

  function decorate(){
    ensureBackground();
    kickTiles();
  }

  const target=document.querySelector('.workspace')||document.body;
  const observer=new MutationObserver(()=>requestAnimationFrame(decorate));
  observer.observe(target,{childList:true,subtree:true});
  window.addEventListener('resize',decorate,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)decorate()});
  decorate();
})();
