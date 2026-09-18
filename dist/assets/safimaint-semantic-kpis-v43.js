'use strict';

// SafiMaintain semantic KPI instruments v43.
(function(){
  let scheduled=false;

  const scenes={
    asset:`<span class="sm43-scene sm43-assets" aria-hidden="true">
      <svg viewBox="0 0 108 82">
        <circle class="base health-ring" cx="54" cy="42" r="31" stroke-dasharray="5 5"/>
        <circle class="soft" cx="54" cy="42" r="24"/>
        <g class="asset-body">
          <rect class="solid" x="39" y="31" width="30" height="24" rx="5"/>
          <circle class="ink" cx="54" cy="43" r="7"/>
          <path class="ink" d="M47 31v-6h14v6M45 55v5m18-5v5M69 38h7v10h-7"/>
        </g>
        <path class="scan" d="M25 42h58"/>
        <circle class="sensor s1" cx="28" cy="24" r="3"/>
        <circle class="sensor s2" cx="81" cy="31" r="3"/>
        <circle class="sensor s3" cx="75" cy="64" r="3"/>
        <text x="6" y="76">HEALTH</text>
      </svg></span>`,
    work:`<span class="sm43-scene sm43-work" aria-hidden="true">
      <svg viewBox="0 0 108 82">
        <rect class="sheet" x="22" y="10" width="59" height="62" rx="6"/>
        <rect class="soft" x="38" y="6" width="27" height="10" rx="4"/>
        <path class="task-line" d="M43 29h25M43 43h25M43 57h25"/>
        <path class="task-progress p1" d="M43 29h25"/><path class="task-progress p2" d="M43 43h25"/><path class="task-progress p3" d="M43 57h25"/>
        <path class="check c1" d="m29 27 3 3 6-7"/><path class="check c2" d="m29 41 3 3 6-7"/><path class="check c3" d="m29 55 3 3 6-7"/>
        <g class="wrench"><path class="accent" stroke-width="2" d="M85 53a7 7 0 0 0-8 8l-9 9 4 4 9-9a7 7 0 0 0 8-8l-4 3-3-1-1-3 4-3Z"/></g>
        <text x="5" y="77">TASKS</text>
      </svg></span>`,
    stock:`<span class="sm43-scene sm43-stock" aria-hidden="true">
      <svg viewBox="0 0 108 82">
        <path class="shelf" d="M14 20h59M14 43h59M14 66h59M18 17v52M69 17v52"/>
        <rect class="box" x="23" y="25" width="14" height="13" rx="2"/><rect class="box" x="43" y="25" width="15" height="13" rx="2"/>
        <rect class="box" x="23" y="48" width="14" height="13" rx="2"/><rect class="box issue-box" x="44" y="48" width="15" height="13" rx="2"/>
        <path class="issue-arrow" d="M71 55h23v15"/><path class="accent" d="m90 67 4 4 4-4"/>
        <circle class="stock-dot" cx="91" cy="55" r="3"/>
        <text x="74" y="29">WO</text><rect class="soft" x="80" y="33" width="18" height="12" rx="3"/>
        <text x="5" y="77">STORES</text>
      </svg></span>`,
    team:`<span class="sm43-scene sm43-team" aria-hidden="true">
      <svg viewBox="0 0 108 82">
        <path class="connection" d="M27 33C45 10 65 10 83 31M27 33C45 59 66 60 84 52"/>
        <circle class="person" cx="27" cy="33" r="11"/><circle class="person active" cx="83" cy="31" r="11"/><circle class="person" cx="84" cy="53" r="10"/>
        <path class="ink" d="M23 33a4 4 0 1 1 8 0m-9 7c2-4 9-4 11 0M79 31a4 4 0 1 1 8 0m-9 7c2-4 9-4 11 0M80 53a4 4 0 1 1 8 0m-9 7c2-4 9-4 11 0"/>
        <circle class="assignment" cx="0" cy="0" r="5"/>
        <circle class="tech-pulse" cx="83" cy="31" r="13"/>
        <text x="6" y="76">TEAM</text>
      </svg></span>`
  };

  function decorate(){
    scheduled=false;
    const kinds=['asset','work','stock','team'];
    document.querySelectorAll('.sm-kpis .sm-kpi').forEach((tile,index)=>{
      tile.querySelector('.sm41-kpi-meter')?.remove();
      if(tile.querySelector('.sm43-scene'))return;
      tile.insertAdjacentHTML('beforeend',scenes[kinds[index]]||scenes.asset);
    });
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(decorate)}
  const view=document.getElementById('appView');
  if(view)new MutationObserver(schedule).observe(view,{childList:true,subtree:false});
  schedule();
})();
