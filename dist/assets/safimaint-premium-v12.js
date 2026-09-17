'use strict';

// Premium SafiMaintain home/dashboard experience.
// Uses live workspace state only; no demo records are introduced.
(function(){
  function smIcon(kind){
    const paths={
      asset:'<path d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Zm0 2.3 5.2 2.8L12 11 6.8 8.1 12 5.3ZM6.5 9.7l4.5 2.4v6.2l-4.5-2.4V9.7Zm6.5 8.6v-6.2l4.5-2.4v6.2L13 18.3Z"/>',
      work:'<path d="M14.6 5.4a4.2 4.2 0 0 0-5.2 5.2L3.7 16.3a1.5 1.5 0 0 0 0 2.1l1.9 1.9a1.5 1.5 0 0 0 2.1 0l5.7-5.7a4.2 4.2 0 0 0 5.2-5.2l-2.5 2.5-2.1-.6-.6-2.1 2.5-2.5Z"/>',
      stock:'<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm8-2.2L7 8l5 2.7L17 8l-5-2.7ZM6 9.7v5.6l5 2.8v-5.7L6 9.7Zm7 8.4 5-2.8V9.7l-5 2.7v5.7Z"/>',
      people:'<path d="M8.5 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 20v-2.1c0-2.7 2.4-4.9 5.4-4.9h1.2c3 0 5.4 2.2 5.4 4.9V20h-12Zm12.5 0v-2.1c0-1.5-.5-2.8-1.4-3.9.7-.5 1.6-.8 2.5-.8h.8c2.5 0 4.6 1.8 4.6 4.1V20H15Z"/>',
      alert:'<path d="M12 22a2.4 2.4 0 0 0 2.3-1.7H9.7A2.4 2.4 0 0 0 12 22Zm7-5.3-1.8-2.1V10a5.2 5.2 0 0 0-4.2-5.1V4a1 1 0 1 0-2 0v.9A5.2 5.2 0 0 0 6.8 10v4.6L5 16.7V18h14v-1.3Z"/>',
      plus:'<path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${paths[kind]||paths.asset}</svg>`;
  }

  function liveSnapshot(){
    const assets=Array.isArray(state.assets)?state.assets.filter(a=>a.type!=='Site'):[];
    const online=assets.filter(a=>a.operatingState==='Online').length;
    const offline=assets.filter(a=>a.operatingState==='Offline').length;
    const openWork=Array.isArray(state.workOrders)?state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status)):[];
    const low=Array.isArray(state.parts)?state.parts.filter(p=>{
      try{return partOnHand(p)<Number(p.min)}catch(_){return false}
    }):[];
    const unread=Array.isArray(state.notifications)?state.notifications.filter(n=>n.userId===CURRENT_USER&&!n.read):[];
    return {assets,online,offline,openWork,low,unread};
  }

  function stepButton(number,done,title,sub,attrs){
    return `<button class="sm-step ${done?'done':''}" ${attrs}><span class="sm-step-num">${done?'✓':number}</span><span><strong>${esc(title)}</strong><small>${esc(sub)}</small></span><span class="sm-step-arrow">›</span></button>`;
  }

  function action(kind,title,sub,attrs){
    return `<button class="sm-action" ${attrs}><span class="sm-action-icon">${smIcon(kind)}</span><span><strong>${esc(title)}</strong><small>${esc(sub)}</small></span></button>`;
  }

  function kpi(kind,label,value,hint){
    return `<div class="sm-kpi"><span class="sm-kpi-icon">${smIcon(kind)}</span><div><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(hint)}</span></div><span class="sm-kpi-signal" aria-hidden="true"></span></div>`;
  }

  function renderPremiumDashboard(){
    const user=currentUser();
    const first=(user?.name||'there').trim().split(/\s+/)[0];
    const v=liveSnapshot();
    const hasAssets=v.assets.length>0;
    const hasParts=state.parts.length>0;
    const hasTeam=state.users.length>1;
    const completed=[hasAssets,hasParts,hasTeam].filter(Boolean).length;
    const progress=Math.round(completed/3*100);
    const stateText=hasAssets?`${v.online} of ${v.assets.length} assets online`:'Ready for your first asset';

    return `<div class="sm-home">
      <section class="sm-hero">
        <div class="sm-hero-copy">
          <p class="sm-hero-kicker">Maintenance command center</p>
          <h1>Welcome, ${esc(first)}.</h1>
          <p>Keep maintenance simple: register what you maintain, create work when something needs attention, and add stock or people only when you need them.</p>
          <div class="sm-hero-actions">
            <button class="button primary" data-action="add-asset">＋ Add asset</button>
            <button class="button" data-action="new-work">Create work order</button>
            <button class="button" data-action="add-part">Add stock item</button>
          </div>
        </div>
        <div class="sm-hero-visual" aria-label="Live CMMS asset network status">
          <div class="sm-visual-panel">
            <div class="sm-visual-head"><div><strong>Live asset system</strong><br><span>${esc(stateText)}</span></div><span class="sm-live-pill">Live</span></div>
            <div class="sm-network" aria-hidden="true">
              <span class="sm-wire w1"></span><span class="sm-wire w2"></span><span class="sm-wire w3"></span><span class="sm-wire w4"></span>
              <span class="sm-ring"></span>
              <span class="sm-core">${smIcon('work')}</span>
              <span class="sm-node a"><i></i><span><strong>Assets</strong><small>${v.assets.length} tracked</small></span></span>
              <span class="sm-node b"><i></i><span><strong>Work</strong><small>${v.openWork.length} open</small></span></span>
              <span class="sm-node c"><i></i><span><strong>Stock</strong><small>${v.low.length} alerts</small></span></span>
              <span class="sm-node d"><i></i><span><strong>Team</strong><small>${state.users.length} people</small></span></span>
            </div>
          </div>
        </div>
      </section>

      <section class="sm-kpis" aria-label="Workspace summary">
        ${kpi('asset','Assets',String(v.assets.length),v.offline?`${v.offline} offline`:'No assets offline')}
        ${kpi('work','Open work',String(v.openWork.length),v.openWork.length?'Maintenance requiring attention':'Nothing waiting')}
        ${kpi('stock','Stock items',String(state.parts.length),v.low.length?`${v.low.length} below minimum`:'No low-stock alerts')}
        ${kpi('people','Team',String(state.users.length),state.users.length>1?'People in this workspace':'Only you so far')}
      </section>

      <section class="sm-main-grid">
        <div class="sm-panel">
          <div class="sm-panel-head"><div><h2>Get your CMMS ready</h2><p>Three simple setup steps. You can learn the deeper tools later.</p></div><span class="welcome-pill">${completed}/3 complete</span></div>
          <div class="sm-panel-body">
            <div class="sm-steps">
              ${stepButton(1,hasAssets,hasAssets?'Add another asset':'Add your first asset','Machine, equipment, facility or tool','data-action="add-asset"')}
              ${stepButton(2,hasParts,hasParts?'Add another stock item':'Add your first stock item','Spare part, supply or consumable','data-action="add-part"')}
              ${stepButton(3,hasTeam,hasTeam?'Manage your team':'Add your team','Technicians, stores and planners','data-route="people"')}
            </div>
            <div class="sm-progress"><span style="width:${progress}%"></span></div>
            <div class="sm-progress-copy"><span>Workspace setup</span><strong>${progress}%</strong></div>
            <div class="sm-guidance"><span class="sm-guidance-icon">?</span><div><strong>What do these sections mean?</strong><p><b>Assets</b> are what you maintain. <b>Work</b> is what needs doing. <b>Stock & parts</b> are what maintenance consumes. <b>Team</b> is who performs and manages the work.</p></div></div>
          </div>
        </div>

        <div class="sm-panel">
          <div class="sm-panel-head"><div><h2>Quick actions</h2><p>Go straight to the task you need.</p></div></div>
          <div class="sm-panel-body">
            <div class="sm-actions">
              ${action('work','New work order','Create and assign maintenance','data-action="new-work"')}
              ${action('asset','Add asset','Register equipment or facilities','data-action="add-asset"')}
              ${action('stock','Add stock item','Create a spare or consumable','data-action="add-part"')}
              ${action('people','Manage team','Add people and responsibilities','data-route="people"')}
            </div>
            <div class="sm-guidance"><span class="sm-guidance-icon">●</span><div><strong>${navigator.onLine?'Device online':'Working offline'}</strong><p>${navigator.onLine?'SafiMaintain is ready. Your field workspace remains locally available.':'You can continue working on this device while offline.'}</p></div></div>
          </div>
        </div>
      </section>
    </div>`;
  }

  // Replace only the Home experience; all existing workflows remain unchanged.
  window.renderDashboard=renderPremiumDashboard;

  function refreshHome(){
    if(typeof ui!=='undefined'&&ui.route==='dashboard'&&state?.meta?.onboardingComplete&&typeof render==='function') render();
  }

  window.addEventListener('online',refreshHome);
  window.addEventListener('offline',refreshHome);

  // The simple onboarding script renders before this override loads. Refresh once so
  // an already-configured workspace immediately receives the premium Home screen.
  if(typeof state!=='undefined'&&state?.meta?.onboardingComplete) refreshHome();
})();
