'use strict';

// SafiMaintain adaptive layout v36.
// Adds behavior that CSS alone cannot provide on tablets and phones.
(function(){
  const sidebar=document.getElementById('sidebar');
  const scrim=document.getElementById('scrim');
  const mobile=window.matchMedia('(max-width:1100px)');

  function closeNav(){
    if(!sidebar||!scrim)return;
    sidebar.classList.remove('open');
    scrim.classList.remove('show');
  }

  function syncViewport(){
    document.documentElement.dataset.viewport =
      window.innerWidth<=600 ? 'phone' :
      window.innerWidth<=820 ? 'tablet' :
      window.innerWidth<=1100 ? 'compact' : 'desktop';
    if(!mobile.matches)closeNav();
  }

  document.addEventListener('click',function(e){
    if(!mobile.matches)return;
    const target=e.target.closest('[data-route],[data-open-asset],[data-open-part],[data-open-work],[data-select-asset]');
    if(target)closeNav();
  },true);

  document.addEventListener('focusin',function(e){
    const wrap=e.target.closest('.table-wrap,.fx23-table,.fx24-list,.v21-tabs,.fx23-tabs');
    if(wrap)wrap.setAttribute('tabindex','0');
  });

  let resizeTimer=null;
  window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(syncViewport,80);
  },{passive:true});
  window.addEventListener('orientationchange',syncViewport,{passive:true});

  syncViewport();
})();