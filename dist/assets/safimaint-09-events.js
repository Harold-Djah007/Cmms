'use strict';
document.addEventListener('click',e=>{
  const b=e.target.closest('button,[data-open-asset],[data-open-part],[data-open-work]');if(!b)return;
  if(b.dataset.route){go(b.dataset.route);return}
  if(b.dataset.modalClose!==undefined){closeModal();return}
  if(b.dataset.openAsset){ui.selectedAsset=b.dataset.openAsset;go('assets');return}
  if(b.dataset.openPart){ui.selectedPart=b.dataset.openPart;go('inventory');return}
  if(b.dataset.openWork){openWorkDrawer(b.dataset.openWork);return}
  if(b.dataset.selectAsset){ui.selectedAsset=b.dataset.selectAsset;render();return}
  if(b.dataset.selectPart){ui.selectedPart=b.dataset.selectPart;render();return}
  if(b.dataset.assetTab){ui.assetTab=b.dataset.assetTab;render();return}
  if(b.dataset.editAsset){showAssetForm(getAsset(b.dataset.editAsset));return}
  if(b.dataset.toggleAsset){showAssetStateModal(b.dataset.toggleAsset);return}
  if(b.dataset.stockMove){showStockMove(b.dataset.stockMove);return}
  if(b.dataset.countPart){showCycleCount(b.dataset.countPart);return}
  if(b.dataset.generatePm){generatePM(b.dataset.generatePm);return}
  if(b.dataset.convertRequest){convertRequest(b.dataset.convertRequest);return}
  if(b.dataset.approvePr){approvePR(b.dataset.approvePr);return}
  if(b.dataset.poFromPr){createPOFromPR(b.dataset.poFromPr);return}
  if(b.dataset.receivePo){receivePO(b.dataset.receivePo);return}
  if(b.dataset.toolToggle){
    const t=state.toolCrib.find(x=>x.id===b.dataset.toolToggle);if(!t)return;
    if(t.status==='Available'){t.status='Checked out';t.holderUserId='U-2';t.dueBack=day(2);addAudit('TOOL_CHECKOUT',t.id,`Checked out to ${getUser(t.holderUserId)?.name}`)}
    else{t.status='Available';t.holderUserId=null;t.dueBack=null;addAudit('TOOL_CHECKIN',t.id,'Returned to tool crib')}
    saveState();render();toast(`Tool ${t.status.toLowerCase()}`);return;
  }
  if(b.dataset.toggleUser){
    const u=getUser(b.dataset.toggleUser);if(!u)return;u.active=!u.active;addAudit('USER_STATUS',u.id,u.active?'Activated':'Deactivated');saveState();render();toast(`${u.name} ${u.active?'activated':'deactivated'}`);return;
  }
  if(b.dataset.searchAsset){document.getElementById('searchModal').close();ui.selectedAsset=b.dataset.searchAsset;go('assets');return}
  if(b.dataset.searchPart){document.getElementById('searchModal').close();ui.selectedPart=b.dataset.searchPart;go('inventory');return}
  if(b.dataset.searchWork){document.getElementById('searchModal').close();openWorkDrawer(b.dataset.searchWork);return}
  const action=b.dataset.action;
  if(action==='new-work') showNewWork();
  if(action==='add-pm') showNewPM();
  if(action==='manual-po') showManualPO();
  if(action==='manual-scan'){const code=prompt('Enter asset or part code');if(code){stopScanner();closeModal();if(!resolveCode(code))toast('No matching asset or part')}}
  if(action==='add-asset') showAssetForm();
  if(action==='add-part') showPartForm();
  if(action==='global-stock-move') showGlobalStockMove();
  if(action==='cycle-count') showCycleCount();
  if(action==='add-meter-reading') showMeterReadingForm();
  if(action==='add-request') showNewRequest();
  if(action==='add-vendor') showNewVendor();
  if(action==='add-user') showNewUser();
  if(action==='mark-alerts-read'){state.notifications.filter(n=>n.userId===CURRENT_USER).forEach(n=>n.read=true);saveState();render();toast('Alerts marked read')}
  if(action==='export-data') exportData();
  if(action==='reset-demo'){if(confirm('Reset all local SafiMaintain demo data on this device?')){localStorage.removeItem(STORAGE_KEY);state=structuredClone(seed);saveState();go('dashboard');toast('Demo data reset')}}
});
document.addEventListener('input',e=>{
  if(e.target.matches('[data-filter="asset"]')){ui.assetSearch=e.target.value;render()}
  if(e.target.matches('[data-filter="inventory"]')){ui.inventorySearch=e.target.value;render()}
  if(e.target.matches('[data-filter="work"]')){ui.workSearch=e.target.value;render()}
  if(e.target.closest('#searchForm')&&e.target.name==='q') updateSearch(e.target.value);
});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-work-status]')){ui.workStatus=e.target.value;render();return}
  if(e.target.dataset.ruleChannel){
    const [id,key]=e.target.dataset.ruleChannel.split('|');const rule=state.notificationRules.find(r=>r.id===id);
    if(rule){rule[key]=e.target.checked;addAudit('NOTIFICATION_RULE_UPDATED',id,`${key} ${e.target.checked?'enabled':'disabled'} for ${rule.event}`);saveState();toast('Notification rule saved')}
    return;
  }
  if(e.target.dataset.security){
    const key=e.target.dataset.security;state.security[key]=key==='requireMfa'?e.target.value==='true':Number(e.target.value)||e.target.value;
    addAudit('SECURITY_POLICY_UPDATED',key,`${key} set to ${state.security[key]}`);saveState();toast('Security policy saved');
  }
});
document.getElementById('modalForm').addEventListener('submit',e=>{
  e.preventDefault();if(!modalSubmit)return;const fd=new FormData(e.currentTarget);modalSubmit(fd);
});
document.getElementById('siteButton').addEventListener('click',()=>go('sites'));
document.getElementById('globalSearchButton').addEventListener('click',showSearch);
document.getElementById('newWorkButton').addEventListener('click',showNewWork);
document.getElementById('noticeButton').addEventListener('click',()=>go('notifications'));
document.getElementById('menuButton').addEventListener('click',()=>{document.getElementById('sidebar').classList.add('open');document.getElementById('scrim').classList.add('show')});
document.getElementById('scrim').addEventListener('click',()=>{document.getElementById('sidebar').classList.remove('open');document.getElementById('scrim').classList.remove('show')});
document.getElementById('scanButton').addEventListener('click',showScanner);
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();showSearch()}
  if(e.key==='Escape'){document.getElementById('sidebar').classList.remove('open');document.getElementById('scrim').classList.remove('show')}
});
window.addEventListener('online',()=>updateConnection(true));
window.addEventListener('offline',()=>updateConnection(false));
function updateConnection(online=navigator.onLine){
  const dot=document.getElementById('connectionDot'),txt=document.getElementById('connectionText'),sub=document.getElementById('connectionSub');
  dot.classList.toggle('offline',!online);txt.textContent=online?'Device data ready':'Working offline';sub.textContent=online?'Local-first field mode':'Changes remain on this device';
}
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));

updateConnection();render();saveState();
