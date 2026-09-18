'use strict';

const SIMPLE_ADVANCED_KEY='safimaint-show-advanced';

function freshWorkspace(){
  return {
    meta:{version:APP_VERSION,createdAt:iso(),freshWorkspace:true,onboardingComplete:false},
    sites:[],stores:[],
    roles:[
      {id:'ROLE-OPS',name:'Operations manager',permissions:['asset.view','asset.edit','asset.state','work.view','work.manage','work.execute','pm.manage','inventory.view','inventory.manage','inventory.count','inventory.issue','purchase.view','purchase.manage','purchase.approve','vendor.manage','admin.people','admin.notifications','report.view']},
      {id:'ROLE-PLANNER',name:'Maintenance planner',permissions:['asset.view','asset.edit','asset.state','work.view','work.manage','work.execute','pm.manage','inventory.view','inventory.count','purchase.view','purchase.manage','report.view']},
      {id:'ROLE-TECH',name:'Technician',permissions:['asset.view','asset.state','work.view','work.execute','inventory.view','inventory.issue']},
      {id:'ROLE-STORE',name:'Storekeeper',permissions:['asset.view','work.view','inventory.view','inventory.manage','inventory.count','purchase.view']},
      {id:'ROLE-PROC',name:'Procurement',permissions:['inventory.view','purchase.view','purchase.manage','vendor.manage','report.view']}
    ],
    groups:[],users:[],assets:[],meters:[],vendors:[],parts:[],stockTransactions:[],cycleCounts:[],purchaseRequests:[],purchaseOrders:[],toolCrib:[],workOrders:[],scheduledMaintenance:[],requests:[],downtime:[],assetEvents:[],notifications:[],mailOutbox:[],audit:[],
    notificationRules:[
      {id:'NR-1',event:'Asset taken offline',audiences:['Operations manager','Maintenance planner','Asset owner','Active WO assignees'],inApp:true,email:true},
      {id:'NR-2',event:'Asset returned online',audiences:['Operations manager','Maintenance planner','Asset owner'],inApp:true,email:true},
      {id:'NR-3',event:'Stock below minimum',audiences:['Storekeeper','Procurement'],inApp:true,email:true},
      {id:'NR-4',event:'Purchase request created',audiences:['Procurement','Operations manager'],inApp:true,email:true},
      {id:'NR-5',event:'Work order assigned',audiences:['Assigned users','Maintenance planner'],inApp:true,email:true},
      {id:'NR-6',event:'Purchase order received',audiences:['Storekeeper','Procurement'],inApp:true,email:true}
    ],
    security:{requireMfa:false,sessionTimeoutMinutes:60,auditRetentionDays:365,ssoMode:'Not configured',ipRestrictionMode:'Not configured'}
  };
}

function initials(name){
  return String(name||'You').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'YU';
}
function siteCode(name){
  const words=String(name||'Site').trim().split(/\s+/).filter(Boolean);
  return (words.length>1?words.map(w=>w[0]).join(''):words[0]?.slice(0,4)||'SITE').toUpperCase();
}
function operationalAssets(){return state.assets.filter(a=>a.type!=='Site')}

function navIcon(name){
  const icons={
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
    work:'<path d="m14.7 6.3 3-3a4 4 0 0 1-5.2 5.2L5 16l-2 5 5-2 7.5-7.5a4 4 0 0 1 5.2-5.2l-3 3-3-3Z"/>',
    assets:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/><path d="M10 7h4a3 3 0 0 1 3 3v4M7 10v7h7"/>',
    stock:'<path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>',
    team:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    requests:'<path d="M4 4h16v16H4z"/><path d="M4 14h4l2 3h4l2-3h4M8 8h8M8 11h5"/>',
    pm:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2M18.4 5.6 20 4M4 4l1.6 1.6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    meters:'<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 14 4-4M7 18h10"/>',
    downtime:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9M8 17h8"/>',
    history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    count:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 10l2 2 4-4M8 16h8"/>',
    planning:'<path d="M3 6h18M7 3v6M17 3v6M5 10h14v11H5z"/><path d="M8 14h3M8 17h7"/>',
    purchase:'<path d="M6 3h12l2 4-2 4H6L4 7l2-4Z"/><path d="M7 11v10M17 11v10M4 21h16M9 7h6"/>',
    suppliers:'<path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
    tools:'<path d="M14.7 6.3a4 4 0 0 1-5.2 5.2L4 17l3 3 5.5-5.5a4 4 0 0 1 5.2-5.2l-3 3-3-3 3-3Z"/>',
    reports:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    roles:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><circle cx="12" cy="9" r="2"/><path d="M8.5 16a4 4 0 0 1 7 0"/>',
    sites:'<path d="M12 22s7-6.1 7-13a7 7 0 1 0-14 0c0 6.9 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/>',
    alerts:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    audit:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    security:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10 10V8a2 2 0 0 1 4 0v2"/>'
  };
  return `<svg class="safi-nav-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]||icons.assets}</svg>`;
}

function syncSimpleShell(){
  const user=currentUser();
  const site=state.sites[0];
  const siteCard=document.querySelector('#siteButton span:nth-child(2)');
  if(siteCard) siteCard.innerHTML=`<strong>${esc(site?.name||'Your site')}</strong><small>${site?'Main site':'Set up your site'}</small>`;
  const chip=document.querySelector('.user-chip');
  if(chip&&user) chip.innerHTML=`<span>${esc(initials(user.name))}</span><div><strong>${esc(user.name)}</strong><small>${esc(getRole(user.roleId)?.name||'User')}</small></div>`;
}

function simpleNavigation(){
  const nav=document.getElementById('navigation');if(!nav)return;
  nav.innerHTML=`
    <section>
      <p>Everyday</p>
      <button class="nav-item" data-route="dashboard"><span class="nav-icon">${navIcon('home')}</span><span>Home</span></button>
      <button class="nav-item" data-route="work-orders"><span class="nav-icon">${navIcon('work')}</span><span>Work</span><b id="workBadge"></b></button>
      <button class="nav-item" data-route="assets"><span class="nav-icon">${navIcon('assets')}</span><span>Assets</span><b id="offlineBadge"></b></button>
      <button class="nav-item" data-route="inventory"><span class="nav-icon">${navIcon('stock')}</span><span>Stock & parts</span><b id="stockBadge"></b></button>
      <button class="nav-item" data-route="people"><span class="nav-icon">${navIcon('team')}</span><span>Team</span></button>
    </section>
    <section id="advancedNav" class="advanced-nav">
      <p>More tools</p>
      <button class="nav-item" data-route="requests"><span class="nav-icon">${navIcon('requests')}</span><span>Requests</span><b id="requestBadge"></b></button>
      <button class="nav-item" data-route="pm"><span class="nav-icon">${navIcon('pm')}</span><span>Preventive maintenance</span></button>
      <button class="nav-item" data-route="calendar"><span class="nav-icon">${navIcon('calendar')}</span><span>Calendar</span></button>
      <button class="nav-item" data-route="meters"><span class="nav-icon">${navIcon('meters')}</span><span>Meters</span></button>
      <button class="nav-item" data-route="downtime"><span class="nav-icon">${navIcon('downtime')}</span><span>Downtime</span></button>
      <button class="nav-item" data-route="transactions"><span class="nav-icon">${navIcon('history')}</span><span>Stock history</span></button>
      <button class="nav-item" data-route="counts"><span class="nav-icon">${navIcon('count')}</span><span>Cycle counts</span></button>
      <button class="nav-item" data-route="planning"><span class="nav-icon">${navIcon('planning')}</span><span>Purchase planning</span><b id="purchaseBadge"></b></button>
      <button class="nav-item" data-route="purchase-orders"><span class="nav-icon">${navIcon('purchase')}</span><span>Purchase orders</span></button>
      <button class="nav-item" data-route="vendors"><span class="nav-icon">${navIcon('suppliers')}</span><span>Suppliers</span></button>
      <button class="nav-item" data-route="tool-crib"><span class="nav-icon">${navIcon('tools')}</span><span>Tools</span></button>
      <button class="nav-item" data-route="reliability"><span class="nav-icon">${navIcon('reports')}</span><span>Reports</span></button>
      <button class="nav-item" data-route="roles"><span class="nav-icon">${navIcon('roles')}</span><span>Roles & permissions</span></button>
      <button class="nav-item" data-route="sites"><span class="nav-icon">${navIcon('sites')}</span><span>Sites & stores</span></button>
      <button class="nav-item" data-route="notifications"><span class="nav-icon">${navIcon('alerts')}</span><span>Alerts & mail</span><b id="alertBadge"></b></button>
      <button class="nav-item" data-route="audit"><span class="nav-icon">${navIcon('audit')}</span><span>Audit trail</span></button>
      <button class="nav-item" data-route="security"><span class="nav-icon">${navIcon('security')}</span><span>Security</span></button>
    </section>
    <button class="more-tools-toggle" id="advancedToggle" type="button"></button>`;
  const show=localStorage.getItem(SIMPLE_ADVANCED_KEY)==='true';
  setAdvanced(show);
  document.getElementById('advancedToggle')?.addEventListener('click',()=>setAdvanced(!document.body.classList.contains('show-advanced')));
}
function setAdvanced(show){
  document.body.classList.toggle('show-advanced',!!show);
  localStorage.setItem(SIMPLE_ADVANCED_KEY,String(!!show));
  const button=document.getElementById('advancedToggle');
  if(button) button.textContent=show?'− Hide extra tools':'+ Show more tools';
}

function renderSimpleHome(){
  const user=currentUser();
  const assets=operationalAssets();
  const openWork=state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status));
  const low=state.parts.filter(p=>partOnHand(p)<Number(p.min));
  const completed=[assets.length>0,state.parts.length>0,state.users.length>1].filter(Boolean).length;
  return pageHead('Home',`Welcome${user?.name?`, ${esc(user.name.split(' ')[0])}`:''}`,'Use SafiMaintain one step at a time. Start with an asset, then create work and add stock when you need it.')
  +`<section class="getting-started card">
      <div class="getting-started-copy"><span class="welcome-pill">${completed}/3 setup steps</span><h2>Start here</h2><p>You do not need to learn the whole CMMS at once. Add the real information from your operation as you go.</p></div>
      <div class="starter-grid">
        <button class="starter-card ${assets.length?'done':''}" data-action="add-asset"><span>1</span><div><strong>${assets.length?'Add another asset':'Add your first asset'}</strong><small>Machine, equipment, facility or tool</small></div><b>›</b></button>
        <button class="starter-card ${state.parts.length?'done':''}" data-action="add-part"><span>2</span><div><strong>${state.parts.length?'Add another part':'Add your first stock item'}</strong><small>Spare part, supply or consumable</small></div><b>›</b></button>
        <button class="starter-card ${state.users.length>1?'done':''}" data-route="people"><span>3</span><div><strong>${state.users.length>1?'Manage your team':'Add your team'}</strong><small>Technicians, stores and planners</small></div><b>›</b></button>
      </div>
    </section>
    <div class="simple-stats">
      <button class="simple-stat" data-route="assets"><small>Assets</small><strong>${assets.length}</strong><span>${state.assets.filter(a=>a.operatingState==='Offline').length} offline</span></button>
      <button class="simple-stat" data-route="work-orders"><small>Open work</small><strong>${openWork.length}</strong><span>Create and track maintenance</span></button>
      <button class="simple-stat" data-route="inventory"><small>Stock items</small><strong>${state.parts.length}</strong><span>${low.length} below minimum</span></button>
      <button class="simple-stat" data-route="people"><small>People</small><strong>${state.users.length}</strong><span>Your maintenance team</span></button>
    </div>
    <section class="card simple-help"><div><span class="help-icon">?</span><div><strong>Where should I go?</strong><p><b>Assets</b> = what you maintain. <b>Work</b> = what needs doing. <b>Stock & parts</b> = what maintenance consumes. <b>Team</b> = who does the work.</p></div></div><button class="button" id="homeMoreTools" type="button">Show more tools</button></section>`;
}
renderDashboard=renderSimpleHome;

const originalRender=render;
render=function(){
  originalRender();
  syncSimpleShell();
  document.getElementById('homeMoreTools')?.addEventListener('click',()=>{setAdvanced(true);document.getElementById('advancedToggle')?.scrollIntoView({block:'nearest'});});
};

function showFirstRun(){
  document.body.classList.add('first-run');
  const view=document.getElementById('appView');
  view.innerHTML=`<div class="onboarding-wrap">
    <section class="onboarding-card">
      <div class="onboarding-brand"><img src="assets/safimaint-logo.svg" alt="SafiMaintain"><span>Fresh workspace</span></div>
      <p class="eyebrow">Welcome to SafiMaintain</p>
      <h1>Set up your workspace</h1>
      <p class="onboarding-lead">This version starts empty. No demo assets, fake people, work orders or stock have been added.</p>
      <form id="firstRunForm" class="onboarding-form">
        <label>Your name<input name="name" required autocomplete="name" placeholder="e.g. Harold Djah"></label>
        <label>Your email<input name="email" type="email" autocomplete="email" placeholder="you@company.com"></label>
        <label class="wide">Site / facility name<input name="site" required placeholder="e.g. Safisana Ghana"></label>
        <div class="onboarding-note wide"><strong>We will create only the basics:</strong> your account, your site, and an empty main store. Everything else starts at zero.</div>
        <button class="button primary wide onboarding-submit" type="submit">Create my workspace →</button>
      </form>
    </section>
    <aside class="onboarding-side"><span>Simple by default</span><h2>You only need four ideas.</h2><div class="onboarding-idea"><b>1</b><div><strong>Assets</strong><small>The things you maintain</small></div></div><div class="onboarding-idea"><b>2</b><div><strong>Work</strong><small>The maintenance to be done</small></div></div><div class="onboarding-idea"><b>3</b><div><strong>Stock</strong><small>Parts and supplies used</small></div></div><div class="onboarding-idea"><b>4</b><div><strong>Team</strong><small>The people responsible</small></div></div></aside>
  </div>`;
  document.getElementById('firstRunForm').addEventListener('submit',e=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget),name=String(fd.get('name')||'').trim(),email=String(fd.get('email')||'').trim(),siteName=String(fd.get('site')||'').trim();
    if(!name||!siteName)return;
    const code=siteCode(siteName);
    state.sites.push({id:'SITE-GH',name:siteName,code,region:'',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',active:true});
    state.stores.push({id:'STORE-MAIN',siteId:'SITE-GH',name:'Main Store',code:'MAIN',location:siteName});
    state.groups.push({id:'GRP-OPS',name:'Operations',managerId:'U-1'},{id:'GRP-MAINT',name:'Maintenance',managerId:'U-1'},{id:'GRP-STORES',name:'Stores',managerId:'U-1'},{id:'GRP-PROC',name:'Procurement',managerId:'U-1'});
    state.users.push({id:'U-1',name,email,roleId:'ROLE-OPS',groupIds:['GRP-OPS'],active:true,mfa:false,emailAlerts:!!email,certifications:[],lastActive:iso()});
    state.assets.push({id:'SITE-ASSET',code,name:siteName,type:'Site',parentId:null,siteId:'SITE-GH',category:'Site',criticality:'A',condition:'Healthy',operatingState:'Online',location:siteName,ownerUserId:'U-1',ownerGroupId:'GRP-OPS',manufacturer:'',model:'',serial:'',warrantyExpiry:'',commissioned:day(0),bom:[]});
    state.meta.onboardingComplete=true;state.meta.setupAt=iso();
    addAudit('WORKSPACE_CREATED','SITE-GH',`${siteName} workspace created`);
    saveState();document.body.classList.remove('first-run');simpleNavigation();syncSimpleShell();ui.route='dashboard';render();toast('Your fresh workspace is ready');
  });
}

// Keep a new workspace genuinely blank and prevent creation of work before an asset exists.
document.addEventListener('click',e=>{
  const b=e.target.closest('#newWorkButton,[data-action="new-work"]');
  if(b&&!operationalAssets().length){
    e.preventDefault();e.stopImmediatePropagation();
    toast('Add your first asset before creating maintenance work.');
    ui.route='assets';render();setTimeout(()=>showAssetForm(),40);
  }
},true);

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-action="reset-demo"],[data-action="reset-workspace"]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(confirm('Start over with a completely empty SafiMaintain workspace on this device?')){
    state=freshWorkspace();saveState();showFirstRun();
  }
},true);

const originalRenderSecuritySimple=renderSecurity;
renderSecurity=function(){
  return pageHead('Administration','Security & workspace','Keep advanced controls out of the way until you need them.')
  +`<div class="grid two"><section class="card pad"><h3 style="margin-top:0">Security settings</h3>
    <div class="setting-row"><div><strong>Require MFA</strong><small>Policy setting for privileged users</small></div><select data-security="requireMfa"><option value="true" ${state.security.requireMfa?'selected':''}>Required</option><option value="false" ${!state.security.requireMfa?'selected':''}>Optional</option></select></div>
    <div class="setting-row"><div><strong>Session timeout</strong><small>Configured session lifetime</small></div><select data-security="sessionTimeoutMinutes">${[15,30,60,120].map(n=>`<option value="${n}" ${state.security.sessionTimeoutMinutes===n?'selected':''}>${n} minutes</option>`).join('')}</select></div>
  </section><section class="card pad"><h3 style="margin-top:0">Start over</h3><p class="muted">Removes all local SafiMaintain records from this browser and returns to the first-time setup screen.</p><button class="button danger" data-action="reset-workspace">Reset workspace</button></section></div>`;
};

(function bootSimpleExperience(){
  if(!state.meta?.freshWorkspace){state=freshWorkspace();saveState();}
  simpleNavigation();syncSimpleShell();
  if(!state.meta.onboardingComplete) showFirstRun();
  else {document.body.classList.remove('first-run');ui.route='dashboard';render();}
})();
