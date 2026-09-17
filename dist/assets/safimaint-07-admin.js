'use strict';
function renderReliability(){
  const equipment=state.assets.filter(a=>['Equipment','Subassembly'].includes(a.type));
  const offline=equipment.filter(a=>a.operatingState==='Offline');
  const open=state.workOrders.filter(w=>!['Completed','Cancelled'].includes(w.status));
  const completed=state.workOrders.filter(w=>w.status==='Completed');
  const pm=state.workOrders.filter(w=>w.type==='Preventive');
  const pmDone=pm.filter(w=>w.status==='Completed').length;
  const compliance=pm.length?Math.round(pmDone/pm.length*100):100;
  const stockValue=state.parts.reduce((n,p)=>n+partOnHand(p)*Number(p.unitCost),0);
  return pageHead('Insights','Reliability','Practical maintenance indicators calculated from the current operational records.')
  +`<div class="grid metrics">
    ${metric('Equipment availability',`${equipment.length?Math.round((equipment.length-offline.length)/equipment.length*100):100}%`,`${offline.length} tracked equipment offline`,offline.length?'amber':'')}
    ${metric('PM completion',`${compliance}%`,`${pmDone} of ${pm.length} preventive work orders completed`,'blue')}
    ${metric('Open corrective work',open.filter(w=>w.type==='Corrective').length,'Corrective backlog',open.some(w=>w.priority==='Critical')?'red':'')}
    ${metric('Inventory value',money(stockValue),'Current on-hand value')}
  </div>
  <div class="grid two">
    <section class="card"><div class="card-head"><div><h2>Downtime by asset</h2><p>Recorded hours in the local history</p></div></div>
      <div style="padding:15px">${equipment.map(a=>{const h=state.downtime.filter(d=>d.assetId===a.id).reduce((n,d)=>n+durationHours(d.startedAt,d.endedAt||iso()),0);const max=Math.max(1,...equipment.map(x=>state.downtime.filter(d=>d.assetId===x.id).reduce((n,d)=>n+durationHours(d.startedAt,d.endedAt||iso()),0)));return `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:4px"><b>${esc(a.code)} · ${esc(a.name)}</b><span>${h.toFixed(1)} h</span></div><div class="kpi-bar"><span style="width:${Math.min(100,h/max*100)}%"></span></div></div>`}).join('')}</div>
    </section>
    <section class="card"><div class="card-head"><div><h2>Parts at risk</h2><p>Below minimum and active replenishment</p></div></div>
      ${table(['Part','On hand','Min','Planning status'],state.parts.filter(p=>partOnHand(p)<p.min).map(p=>{const r=state.purchaseRequests.find(r=>r.partId===p.id&&!['Received','Closed','Cancelled'].includes(r.status));return `<tr><td><span class="cell-title">${esc(p.code)}</span><span class="cell-sub">${esc(p.name)}</span></td><td>${partOnHand(p)}</td><td>${p.min}</td><td>${r?status(r.status):'—'}</td></tr>`}),'No low-stock risks')}
    </section>
  </div>`;
}
function renderPeople(){
  return pageHead('Administration','People & groups','Users, team relationships, activation, MFA visibility and certification context.',
    `<button class="button" data-action="add-user">＋ Add person</button>`)
  +`<section class="card">${table(['Person','Role','Groups','MFA','Email alerts','Status',''],state.users.map(u=>`<tr><td><span class="cell-title">${esc(u.name)}</span><span class="cell-sub">${esc(u.email)}</span></td><td>${esc(getRole(u.roleId)?.name||u.roleId)}</td><td>${esc(u.groupIds.map(id=>getGroup(id)?.name).filter(Boolean).join(', ')||'—')}</td><td>${u.mfa?status('Enabled'):status('Not enrolled')}</td><td>${u.emailAlerts?'On':'Off'}</td><td>${status(u.active?'Active':'Inactive')}</td><td class="right"><button class="button small" data-toggle-user="${u.id}">${u.active?'Deactivate':'Activate'}</button></td></tr>`),'No people')}</section>
    <div class="grid two" style="margin-top:14px">
      <section class="card"><div class="card-head"><div><h2>Groups</h2><p>Manager/team relationships</p></div></div>${table(['Group','Manager','Members'],state.groups.map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${esc(getUser(g.managerId)?.name||'—')}</td><td>${state.users.filter(u=>u.groupIds.includes(g.id)).length}</td></tr>`),'No groups')}</section>
      <section class="card pad"><h3 style="margin-top:0">Security posture</h3><div class="notice info">This static field build can show configuration and retain audit history on this device. Real authentication, MFA enforcement, SSO, IP restrictions and cross-user authorization require the shared backend milestone.</div></section>
    </div>`;
}
const permissionLabels=[
  ['asset.view','View assets'],['asset.edit','Edit assets'],['asset.state','Change operating state'],['work.manage','Manage work'],['work.execute','Execute work'],['inventory.manage','Manage inventory'],['inventory.count','Post cycle counts'],['purchase.manage','Manage purchasing'],['admin.people','Administer users'],['admin.notifications','Configure notifications']
];
function renderRoles(){
  const roleIds=['ROLE-OPS','ROLE-PLANNER','ROLE-TECH','ROLE-STORE','ROLE-PROC'];
  return pageHead('Administration','Roles & permissions','Role-based access model aligned to maintenance responsibilities.')
  +`<section class="card pad"><div class="permission-grid">
    <div class="head">Permission</div>${roleIds.map(id=>`<div class="head">${esc(getRole(id)?.name||id)}</div>`).join('')}
    ${permissionLabels.map(([perm,label])=>`<div><b>${esc(label)}</b><br><small class="muted">${esc(perm)}</small></div>${roleIds.map(id=>`<div class="${getRole(id)?.permissions.includes(perm)?'yes':'no'}">${getRole(id)?.permissions.includes(perm)?'✓ Allowed':'—'}</div>`).join('')}`).join('')}
  </div><div class="notice info" style="margin-top:14px">Permissions are modeled here so workflows and data ownership are explicit. Server-side enforcement is intentionally not claimed by this browser-only build.</div></section>`;
}
function renderSites(){
  return pageHead('Administration','Sites & stores','Physical structure for asset visibility and stock ownership.')
  +`<div class="grid two">
    <section class="card"><div class="card-head"><div><h2>Sites</h2><p>Operational tenant structure</p></div></div>${table(['Site','Region','Time zone','Status'],state.sites.map(s=>`<tr><td><span class="cell-title">${esc(s.name)}</span><span class="cell-sub">${esc(s.code)}</span></td><td>${esc(s.region)}</td><td>${esc(s.timezone)}</td><td>${status(s.active?'Active':'Inactive')}</td></tr>`),'No sites')}</section>
    <section class="card"><div class="card-head"><div><h2>Stores</h2><p>Inventory ownership locations</p></div></div>${table(['Store','Code','Location'],state.stores.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.code)}</td><td>${esc(s.location)}</td></tr>`),'No stores')}</section>
  </div>`;
}
function renderNotifications(){
  const mine=state.notifications.filter(n=>n.userId===CURRENT_USER);
  return pageHead('Administration','Mail & alerts','Rules, in-app notifications and a transparent email queue for maintenance events.',
    `<button class="button" data-action="mark-alerts-read">Mark all read</button>`)
  +`<div class="grid two">
    <section class="card"><div class="card-head"><div><h2>Notification inbox</h2><p>Current user · ${esc(currentUser().name)}</p></div></div><div class="alert-list" style="padding:12px">
      ${mine.map(n=>`<div class="alert-row ${n.read?'':'unread'}"><div class="alert-icon">●</div><div><strong>${esc(n.title)}</strong><small>${esc(n.message)}</small></div><time>${dateTimeFmt(n.createdAt)}</time></div>`).join('')||'<div class="empty"><strong>No notifications</strong></div>'}
    </div></section>
    <section class="card"><div class="card-head"><div><h2>Email outbox</h2><p>Prepared delivery records</p></div></div>
      <div class="notice" style="margin:12px"><strong>No false delivery state:</strong> email is queued locally in this prototype. A backend mail provider is required to actually send it.</div>
      ${table(['Recipient','Subject','Status','Created'],state.mailOutbox.slice(0,20).map(m=>`<tr><td>${esc(m.to)}</td><td><span class="cell-title">${esc(m.subject)}</span></td><td>${status(m.status)}</td><td>${dateTimeFmt(m.createdAt)}</td></tr>`),'No email records')}
    </section>
  </div>
  <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Notification rules</h2><p>Who should know when operational events happen</p></div></div>
    ${table(['Event','Audience','In-app','Email'],state.notificationRules.map(r=>`<tr><td><b>${esc(r.event)}</b></td><td>${esc(r.audiences.join(', '))}</td><td><input type="checkbox" data-rule-channel="${r.id}|inApp" ${r.inApp?'checked':''} aria-label="In-app ${esc(r.event)}"></td><td><input type="checkbox" data-rule-channel="${r.id}|email" ${r.email?'checked':''} aria-label="Email ${esc(r.event)}"></td></tr>`),'No rules')}
  </section>`;
}
function renderAudit(){
  return pageHead('Administration','Audit trail','Traceable history of critical operational and administrative changes.',
    `<button class="button" data-action="export-data">Export JSON</button>`)
  +`<section class="card">${table(['Time','Actor','Action','Entity','Detail'],state.audit.map(a=>`<tr><td>${dateTimeFmt(a.at)}</td><td>${esc(getUser(a.userId)?.name||a.userId||'System')}</td><td><b>${esc(a.action)}</b></td><td>${esc(a.entity)}</td><td>${esc(a.detail)}</td></tr>`),'No audit events')}</section>`;
}
function renderSecurity(){
  return pageHead('Administration','Security','Policy configuration with clear separation between local settings and backend-enforced controls.')
  +`<div class="grid two">
    <section class="card pad">
      <h3 style="margin-top:0">Session & access policy</h3>
      <div class="setting-row"><div><strong>Require MFA</strong><small>Expected for privileged users</small></div><select data-security="requireMfa"><option value="true" ${state.security.requireMfa?'selected':''}>Required</option><option value="false" ${!state.security.requireMfa?'selected':''}>Optional</option></select></div>
      <div class="setting-row"><div><strong>Session timeout</strong><small>Configured session lifetime</small></div><select data-security="sessionTimeoutMinutes">${[15,30,60,120].map(n=>`<option value="${n}" ${state.security.sessionTimeoutMinutes===n?'selected':''}>${n} minutes</option>`).join('')}</select></div>
      <div class="setting-row"><div><strong>Audit retention</strong><small>Desired server retention policy</small></div><select data-security="auditRetentionDays">${[90,180,365,730].map(n=>`<option value="${n}" ${state.security.auditRetentionDays===n?'selected':''}>${n} days</option>`).join('')}</select></div>
      <div class="setting-row"><div><strong>Single sign-on</strong><small>SAML 2.0 / OpenID Connect</small></div><span class="muted">${esc(state.security.ssoMode)}</span></div>
      <div class="setting-row"><div><strong>IP restrictions</strong><small>Network-level access restriction</small></div><span class="muted">${esc(state.security.ipRestrictionMode)}</span></div>
    </section>
    <section class="card pad"><h3 style="margin-top:0">Enforcement boundary</h3>
      <div class="notice"><strong>Important:</strong> this deployment is a static, offline-capable field prototype. Browser storage cannot securely enforce identity, MFA, SSO, password policy or tenant isolation. Those controls must live in the shared API/authentication service before production rollout.</div>
      <h3 class="section-title">Current local checks</h3>
      <div class="setting-row"><div><strong>Configured MFA coverage</strong><small>Users marked enrolled</small></div><b>${state.users.filter(u=>u.mfa).length}/${state.users.filter(u=>u.active).length}</b></div>
      <div class="setting-row"><div><strong>Audit events</strong><small>Critical changes retained on this device</small></div><b>${state.audit.length}</b></div>
      <div class="setting-row"><div><strong>Data persistence</strong><small>Local browser storage + service worker shell</small></div>${status('Enabled')}</div>
      <button class="button danger" style="margin-top:15px" data-action="reset-demo">Reset local demo data</button>
    </section>
  </div>`;
}
