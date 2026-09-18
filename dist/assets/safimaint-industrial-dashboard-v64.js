'use strict';
(function(){
  function workControl(w){return typeof safiWorkStatusControl==='function'?safiWorkStatusControl(w):(['Completed','Closed','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE')}
  function icon(kind){
    const m={
      asset:'<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 6V3m8 3V3M8 18v3m8-3v3M8 10h8m-8 4h5"/>',
      work:'<path d="M14.7 6.3a4 4 0 0 1-5.2 5.2L5 16l-2 5 5-2 7.5-7.5a4 4 0 0 1 5.2-5.2l-3 3-3-3 3-3Z"/>',
      pm:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2M7 3l-2 2m12-2 2 2"/>',
      stock:'<path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>',
      team:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a5 5 0 0 1 10 0v2m3-11a3 3 0 0 1 0 6m1 1a5 5 0 0 1 4 4"/>'
    };return '<svg viewBox="0 0 24 24">'+(m[kind]||m.asset)+'</svg>'
  }
  function machine(){
    return '<svg class="v64-machine-svg" viewBox="0 0 280 120" aria-hidden="true">'+
      '<path class="line" d="M12 91h256M38 91V78h195v13"/>'+
      '<rect class="shell" x="42" y="40" width="88" height="44" rx="8"/><rect class="soft" x="50" y="48" width="18" height="28" rx="3"/>'+
      '<g class="v64-rotor"><circle class="line" cx="92" cy="62" r="15"/><path class="line" d="M92 47v30M77 62h30M81.5 51.5l21 21m0-21-21 21"/></g>'+
      '<rect class="dark v64-shaft-pulse" x="128" y="58" width="38" height="8" rx="3"/>'+
      '<circle class="shell" cx="194" cy="62" r="30"/><circle class="line" cx="194" cy="62" r="16"/><path class="line" d="M194 46c8 4 12 9 12 16s-4 12-12 16c-8-4-12-9-12-16s4-12 12-16Z"/>'+
      '<path class="line" d="M224 54h32v-18h14M224 70h32v18h14"/><circle class="accent v64-flow-dot" cx="242" cy="54" r="3"/>'+
      '<rect class="dark" x="70" y="84" width="30" height="7" rx="2"/><rect class="dark" x="180" y="88" width="28" height="4" rx="2"/>'+
      '</svg>'
  }
  function dashboard64(){
    const user=currentUser(),site=typeof safiActiveSite==='function'?safiActiveSite():state.sites?.[0],allowed=x=>!site||typeof safiSiteAllowed!=='function'||safiSiteAllowed(x);
    const assets=state.assets.filter(a=>a.type!=='Site'&&allowed(a)),work=state.workOrders.filter(allowed),active=work.filter(w=>workControl(w)!=='CLOSED');
    const offline=assets.filter(a=>a.operatingState==='Offline'),online=Math.max(0,assets.length-offline.length),over=active.filter(w=>w.due&&w.due<day(0)),critical=active.filter(w=>['Critical','Emergency','Highest'].includes(w.priority));
    const low=state.parts.filter(p=>partOnHand(p)<Number(p.min||0)),people=state.users.filter(u=>u.active).length;
    const pmActive=state.scheduledMaintenance.filter(pm=>!pm.paused&&pm.status!=='Paused'&&pm.status!=='Archived'),due=pmActive.filter(pm=>{const d=pm.triggers?.find(t=>t.type==='Time')?.nextDue||pm.nextDue;return /^\d{4}-\d{2}-\d{2}$/.test(String(d||''))&&d<=day(7)});
    const availability=assets.length?Math.round(online/assets.length*100):100,assignment=active.length?Math.round(active.filter(w=>(w.assigneeIds||[]).length||w.assigneeGroupId).length/active.length*100):100,stockReady=state.parts.length?Math.round(state.parts.filter(p=>partOnHand(p)>=Number(p.min||0)).length/state.parts.length*100):100;
    const upcoming=active.filter(w=>w.due).sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,6);
    const risks=[...over.map(w=>({t:w.id+' · '+w.title,d:(getAsset(w.assetIds?.[0])?.name||'No asset')+' · overdue',route:'work-orders',tone:'bad'})),...offline.map(a=>({t:a.code+' · '+a.name+' offline',d:a.downtimeReason||'Asset unavailable',route:'downtime',tone:'bad'})),...low.map(p=>({t:p.code+' · '+p.name+' below minimum',d:partOnHand(p)+' '+p.uom+' on hand · minimum '+p.min,route:'planning',tone:'warn'}))].slice(0,6);
    const health=critical.length?'Attention':offline.length?'Review':'Normal';
    return '<div class="v64-dashboard">'+
      '<section class="v64-hero"><div class="v64-copy"><div class="v64-eyebrow"><i></i>Maintenance command center</div><h1>Welcome, '+esc(user?.name?.split(' ')[0]||'there')+'.</h1><p>Run maintenance from the condition of your assets, the work that is due, the parts needed to execute it, and the people responsible. The dashboard stays quiet when operations are healthy and surfaces exceptions when they need attention.</p><div class="v64-actions"><button class="button primary" data-action="add-asset">＋ Add asset</button><button class="button" data-action="new-work">Create work order</button><button class="button" data-action="add-part">Add stock item</button></div></div>'+
      '<aside class="v64-telemetry"><div class="v64-telemetry-head"><span><strong>Live condition monitor</strong><small>'+assets.length+' maintainable assets · '+pmActive.length+' active PM plans</small></span><b class="v64-live-pill"><i></i>'+health.toUpperCase()+'</b></div><div class="v64-machine-stage"><span class="v64-machine-label"><i></i>FIELD TELEMETRY / ASSET HEALTH</span>'+machine()+'<span class="v64-signal"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div><div class="v64-telemetry-grid"><div><small>Availability</small><strong>'+availability+'%</strong><span>'+online+' online / '+offline.length+' offline</span></div><div><small>Maintenance load</small><strong>'+active.length+'</strong><span>'+critical.length+' critical · '+over.length+' overdue</span></div><div><small>PM horizon</small><strong>'+due.length+'</strong><span>due within 7 days</span></div></div></aside></section>'+
      '<section class="v64-kpis">'+
        '<button class="v64-kpi" data-route="assets"><div class="v64-kpi-top"><span class="v64-kpi-icon">'+icon('asset')+'</span><span class="v64-kpi-label">Assets</span></div><strong class="v64-kpi-value">'+assets.length+'</strong><span class="v64-kpi-desc">'+offline.length+' offline · '+online+' online</span><span class="v64-mini assets"></span></button>'+
        '<button class="v64-kpi" data-route="work-orders"><div class="v64-kpi-top"><span class="v64-kpi-icon">'+icon('work')+'</span><span class="v64-kpi-label">Open work</span></div><strong class="v64-kpi-value">'+active.length+'</strong><span class="v64-kpi-desc">'+over.length+' overdue · '+critical.length+' critical</span><span class="v64-mini work"><i></i><i></i><i></i></span></button>'+
        '<button class="v64-kpi" data-route="pm"><div class="v64-kpi-top"><span class="v64-kpi-icon">'+icon('pm')+'</span><span class="v64-kpi-label">PM due soon</span></div><strong class="v64-kpi-value">'+due.length+'</strong><span class="v64-kpi-desc">Time, meter and event-driven plans</span><span class="v64-mini pm"></span></button>'+
        '<button class="v64-kpi" data-route="planning"><div class="v64-kpi-top"><span class="v64-kpi-icon">'+icon('stock')+'</span><span class="v64-kpi-label">Stock alerts</span></div><strong class="v64-kpi-value">'+low.length+'</strong><span class="v64-kpi-desc">'+state.parts.length+' stock items monitored</span><span class="v64-mini stock"><i></i><i></i><i></i></span></button>'+
        '<button class="v64-kpi" data-route="people"><div class="v64-kpi-top"><span class="v64-kpi-icon">'+icon('team')+'</span><span class="v64-kpi-label">Team</span></div><strong class="v64-kpi-value">'+people+'</strong><span class="v64-kpi-desc">'+assignment+'% of open work assigned</span><span class="v64-mini team"><i></i></span></button>'+
      '</section>'+
      '<section class="v64-grid"><article class="v64-panel"><div class="v64-panel-head"><span><h2>Operational attention</h2><p>Only the conditions that currently require maintenance attention</p></span><button class="button small" data-route="maintenance-outlook">Outlook</button></div>'+(risks.length?risks.map(x=>'<button class="v64-row" data-route="'+x.route+'"><span><strong>'+esc(x.t)+'</strong><small>'+esc(x.d)+'</small></span><span class="v50-pill '+x.tone+'">Review</span></button>').join(''):'<div class="v64-empty"><strong>No urgent exceptions</strong><span>Tracked operations are within the configured maintenance thresholds.</span></div>')+'</article>'+
      '<article class="v64-panel"><div class="v64-panel-head"><span><h2>Upcoming work</h2><p>Nearest due maintenance work</p></span><button class="button small" data-route="calendar">Planner</button></div>'+(upcoming.length?upcoming.map(w=>'<button class="v64-row" data-open-work="'+esc(w.id)+'"><span><strong>'+esc(w.id)+' · '+esc(w.title)+'</strong><small>'+esc(getAsset(w.assetIds?.[0])?.name||'No asset')+' · '+esc(w.status)+'</small></span><span>'+dateFmt(w.due)+'</span></button>').join(''):'<div class="v64-empty"><strong>No scheduled work</strong><span>Create a work order or preventive-maintenance plan.</span></div>')+'</article></section>'+
      '<section class="v64-panel"><div class="v64-panel-head"><span><h2>Maintenance readiness</h2><p>Execution readiness across assets, assignments and spare parts</p></span><button class="button small" data-route="reports">Reports</button></div><div class="v64-readiness">'+[['Asset availability',availability],['Assigned work',assignment],['Stock readiness',stockReady]].map(x=>'<div class="v64-ready"><b>'+x[0]+'</b><span><i style="width:'+x[1]+'%"></i></span><em>'+x[1]+'%</em></div>').join('')+'</div></section>'+
    '</div>'
  }
  renderDashboard=dashboard64;window.renderDashboard=dashboard64;
  const previous=render;
  render=function(){const result=previous.apply(this,arguments);document.querySelector('.v60-live-bg')?.remove();return result};
  window.render=render;
  if(ui.route==='dashboard')render()
})();