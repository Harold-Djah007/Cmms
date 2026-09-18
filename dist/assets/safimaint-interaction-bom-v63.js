'use strict';
(function(){
  function escapeCss(value){try{return CSS.escape(String(value))}catch(_){return String(value).replace(/["\\]/g,'\\$&')}}
  function focusSelector(el){
    if(!el||!['INPUT','TEXTAREA','SELECT'].includes(el.tagName))return null;
    if(el.id)return '#'+escapeCss(el.id);
    const attrs=['data-filter','data-v51-asset-search','data-v52-request-search','data-v57-notice-search','name'];
    for(const attr of attrs){
      const val=el.getAttribute(attr);
      if(val!==null)return el.tagName.toLowerCase()+'['+attr+'="'+escapeCss(val)+'"]';
    }
    return null;
  }
  function captureFocus(){
    const el=document.activeElement,selector=focusSelector(el);if(!selector)return null;
    return {selector,start:typeof el.selectionStart==='number'?el.selectionStart:null,end:typeof el.selectionEnd==='number'?el.selectionEnd:null,scrollTop:el.scrollTop||0};
  }
  function restoreFocus(snap){
    if(!snap)return false;
    const el=document.querySelector(snap.selector);if(!el)return false;
    try{
      el.focus({preventScroll:true});
      if(typeof el.setSelectionRange==='function'&&snap.start!==null)el.setSelectionRange(snap.start,snap.end??snap.start);
      el.scrollTop=snap.scrollTop||0;
      return true;
    }catch(_){return false}
  }
  const previous=render;
  render=function(){
    const snap=captureFocus();
    const result=previous.apply(this,arguments);
    if(snap&&!restoreFocus(snap))requestAnimationFrame(()=>restoreFocus(snap));
    return result
  };
  window.render=render;
  window.SafiMaintainInteraction={captureFocus,restoreFocus};
})();