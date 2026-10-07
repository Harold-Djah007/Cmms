'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const {chromium}=require('playwright');

async function main(){
  const url=process.env.SAFIMAINT_TEST_URL||'http://127.0.0.1:8766';
  const server=process.env.SAFIMAINT_TEST_URL?null:spawn(process.env.PYTHON||'python',['-m','http.server','8766','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore',windowsHide:true});
  let browser;
  try{
    for(let attempt=0;attempt<40;attempt++){
      try{const response=await fetch(url);if(response.ok)break}catch(_ignored){}
      if(attempt===39)throw new Error('Local preview server did not start');
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    browser=await chromium.launch({headless:true,...(process.env.SAFIMAINT_BROWSER_PATH?{executablePath:process.env.SAFIMAINT_BROWSER_PATH}:{})});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url+'/?device=1');await page.waitForFunction(()=>typeof window.SafiMaintainDemo==='object');
    await page.waitForSelector('.mw-home');
    assert.equal(await page.locator('#newWorkButton').isDisabled(),false,'Demo owner must be able to use the persistent New work action');
    assert.equal(await page.locator('.mw-breadcrumbs [aria-current]').innerText(),'Maintenance overview');
    const openWork=await page.evaluate(()=>safiMaintenanceOverview().open.length);
    assert.equal(Number(await page.locator('.mw-metric[data-mw-scope="open"] strong').innerText()),openWork);
    await page.locator('.mw-metric[data-mw-scope="overdue"]').click();
    assert.equal(await page.locator('[data-mw-work]').count(),Math.min(12,await page.evaluate(()=>safiMaintenanceOverview().overdue.length)));
    await page.locator('.mw-metric[data-mw-scope="open"]').click();
    await page.locator('[data-mw-search]').fill('no-job-matches-xyz');
    assert.equal(await page.locator('[data-mw-work]').count(),0);
    await page.locator('[data-mw-search]').fill('');
    await page.locator('[data-mw-open-work]').first().click();
    assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);await page.evaluate(()=>closeModal());
    await page.evaluate(()=>{window.__acceptanceCan=safiCan;window.safiCan=permission=>permission==='asset.view';render()});
    assert.equal(await page.locator('.mw-work-panel').count(),0);
    assert.equal(await page.locator('.mw-home [data-action="new-work"]').count(),0);
    assert.equal(await page.locator('.mw-home .mw-panel').count(),1);
    await page.evaluate(()=>{window.safiCan=window.__acceptanceCan;delete window.__acceptanceCan;render()});
    const routes=['dashboard','work-orders','requests','pm','calendar','assets','facilities','equipment','tools','meters','downtime','inventory','stock-locations','batch-stock','counts','transactions','bom-groups','businesses','planning','vendors','reports','people','roles','permissions','sites','notifications','audit','sync-center','security'];
    const visualAudit=[];
    for(const route of routes){
      await page.evaluate(route=>go(route),route);
      assert.ok((await page.locator('#appView').innerText()).length>100,'Empty route '+route);
      if(process.env.SAFIMAINT_VISUAL_AUDIT){
        for(const width of [1440,390]){
          await page.setViewportSize({width,height:1000});
          const findings=await page.locator('#appView').evaluate(view=>{
            const visible=el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;
            const buttons=[...view.querySelectorAll('button')].filter(visible);
            return {overflow:document.documentElement.scrollWidth>innerWidth+1,
              smallButtons:buttons.filter(el=>parseFloat(getComputedStyle(el).fontSize)<11).map(el=>el.textContent.trim()).slice(0,12),
              unnamedButtons:buttons.filter(el=>!el.textContent.trim()&&!el.getAttribute('aria-label')&&!el.getAttribute('title')).map(el=>el.outerHTML.slice(0,180))};
          });
          visualAudit.push({route,width,...findings});
          fs.mkdirSync('.test-tmp/pages',{recursive:true});
          await page.screenshot({path:'.test-tmp/pages/'+route+'-'+width+'.png',fullPage:true});
        }
        await page.setViewportSize({width:1440,height:1000});
      }
    }
    if(visualAudit.length)fs.writeFileSync('.test-tmp/visual-audit.json',JSON.stringify(visualAudit,null,2));
    const searchablePart=await page.evaluate(()=>state.parts[0]);
    await page.locator('#globalSearchButton').click();
    await page.locator('#searchForm [name="q"]').fill(searchablePart.code);
    await page.locator('[data-v55-result="Part|'+searchablePart.id+'|inventory"]').click();
    assert.equal(await page.locator('#searchModal').evaluate(el=>el.open),false,'Search must close when opening its result');
    await page.waitForSelector('[data-s80-record-form="'+searchablePart.id+'"]');
    const searchedKinds=await page.evaluate(()=>{
      const role=getRole(currentUser().roleId),saved=role.permissions;
      try{role.permissions=['asset.view'];return safiSearchRecords('CHP').map(r=>r.kind)}finally{role.permissions=saved}
    });
    assert.ok(searchedKinds.length>0);
    assert.ok(searchedKinds.every(kind=>['Asset','Meter'].includes(kind)),'Search must respect the current role');
    await page.evaluate(()=>go('reports'));
    await page.locator('[data-v55-report="backlog"]').click();
    await page.locator('[data-v55-report-from]').fill('2099-01-01');
    assert.equal(await page.locator('.v50-table tbody tr').count(),0,'Future report range must exclude current backlog');
    await page.locator('[data-v55-report-from]').fill('');
    assert.ok(await page.locator('.v50-table tbody tr').count()>0);
    await page.evaluate(()=>{window.__reportTitle=state.workOrders[0].title;state.workOrders[0].title='=HYPERLINK("https://example.invalid")';render()});
    const downloaded=page.waitForEvent('download');await page.locator('[data-v55-export-report]').click();
    const report=await downloaded,reportCsv=fs.readFileSync(await report.path(),'utf8');
    assert.ok(reportCsv.includes("'=HYPERLINK"),'Spreadsheet export must neutralize formulas in record names');
    await page.evaluate(()=>{state.workOrders[0].title=window.__reportTitle;delete window.__reportTitle;go('reports')});
    await page.locator('[data-v55-report="stock"]').click();
    assert.equal(await page.locator('[data-v55-report-from]').count(),0,'Current-stock report must not offer ineffective date filters');
    assert.equal(await page.locator('.v50-table tbody tr').count(),await page.evaluate(()=>state.parts.length));
    await page.evaluate(()=>{ui.assetView='hierarchy';go('assets')});
    await page.waitForSelector('.ax78-register');
    assert.equal(await page.evaluate(()=>{const press=state.assets.find(a=>a.id==='DEW-01');const bay=state.assets.find(a=>a.id===press?.parentId);return bay?.name==='Dewatering Bay'&&press.locationId===bay.id}),true,'Press must be placed under its dewatering location');
    await page.locator('[data-ax78-collapse]').click();
    assert.equal(await page.locator('[data-ax78-toggle][aria-expanded="true"]').count(),0);
    await page.locator('[data-ax78-expand]').click();
    assert.equal(await page.locator('.ax78-node').evaluateAll(nodes=>nodes.every(el=>el.getBoundingClientRect().height<55)),true,'Leaf rows must remain as compact as parent rows');
    const equipment=await page.evaluate(()=>state.assets.find(a=>a.type==='Equipment'));
    assert.ok(equipment,'Demo must include maintainable equipment');
    await page.locator('[data-ax78-search]').fill(equipment.code);
    await page.waitForTimeout(200);
    assert.ok(await page.locator('.ax78-code').allTextContents().then(values=>values.includes(equipment.code)));
    await page.locator('[data-fx23-open="'+equipment.id+'"]').click();
    await page.waitForSelector('.ar72-record');
    assert.equal(await page.locator('.ar72-tabs').evaluate(el=>getComputedStyle(el).display),'flex');
    for(const tab of ['bom','meter','personnel','businesses','files','log']){
      await page.locator('[data-v72-tab="'+tab+'"]').click();
      assert.equal(await page.locator('[data-v72-tab="'+tab+'"].active').count(),1);
      assert.ok((await page.locator('.ar72-body').innerText()).trim().length>20,'Empty asset tab '+tab);
    }
    fs.mkdirSync('.test-tmp',{recursive:true});
    await page.screenshot({path:'.test-tmp/asset-record.png',fullPage:true});
    await page.evaluate(()=>{ui.assetView='hierarchy';ui.assetSearch='';go('assets')});
    await page.screenshot({path:'.test-tmp/asset-register.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Asset register must fit mobile width');
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>go('notifications'));
    assert.equal(await page.locator('[data-v87-group="settings"].route-active').count(),0,'Notifications must not activate Settings');
    assert.equal(await page.locator('#navigation [aria-current="page"]').count(),1);
    await page.evaluate(()=>{ui.s80SupplyMode='list';go('inventory')});
    await page.waitForSelector('.s93-register');
    assert.equal(await page.locator('[data-s80-filter]').count(),4);
    assert.equal(await page.locator('[data-s93-view="hierarchy"]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.locator('[data-s80-part-row]:visible').count()>=await page.evaluate(()=>state.parts.length),'Default hierarchy must reveal the parts beneath expanded locations');
    await page.locator('[data-s93-view="hierarchy"]').click();
    assert.ok(await page.locator('.s93-table thead').innerText().then(t=>t.includes('Location')&&t.includes('Name')&&t.includes('Code')));
    assert.ok(await page.locator('[data-s93-location]').count()>0);
    assert.equal(await page.evaluate(()=>[...document.querySelectorAll('[data-s80-part-row]')].every(row=>{const part=state.parts.find(p=>p.id===row.dataset.s80OpenPart);const quantity=(part.locations||[]).filter(l=>l.active!==false&&String(l.storeId||'')===row.dataset.s93Group).reduce((sum,l)=>sum+Number(l.onHand||0),0);return row.querySelector('em')?.textContent==='on hand: '+quantity+' '+(part.uom||'ea')})),true,'Hierarchy stock annotations must reflect each location, not global totals');
    await page.locator('[data-s93-toggle]').first().click();
    assert.equal(await page.locator('[data-s93-toggle]').first().getAttribute('aria-expanded'),'false');
    await page.locator('[data-s93-collapse-all]').click();
    assert.equal(await page.locator('[data-s80-part-row]:visible').count(),0);
    await page.locator('[data-s93-expand-all]').click();
    assert.ok(await page.locator('[data-s80-part-row]:visible').count()>0);
    const attentionCount=await page.evaluate(()=>safiNavigationAttention('supplies').length);
    assert.equal(await page.locator('#navigation .sm-nav-attention').count(),0,'Expanded navigation must contain pages only');
    const partBadge=page.locator('[data-v87-group="supplies"] .child').filter({has:page.locator('[data-route="inventory"]')}).locator('.sm-child-count');
    assert.equal(Number(await partBadge.innerText()),attentionCount);
    await partBadge.click();
    assert.equal(await page.locator('#modal [data-sm-attention="part"]').count(),attentionCount);
    if(attentionCount){
      const source=page.locator('#modal [data-sm-attention="part"]').first();
      const id=await source.getAttribute('data-record-id');await source.click();
      assert.equal(await page.evaluate(()=>ui.selectedPart),id);
      assert.equal(await page.locator('[data-s80-record-form]').count(),1);
      await page.waitForSelector('.s93-stock-left .s80-receipt-preview');
      assert.equal(await page.locator('.s81-record-summary').count(),0);
      const originalName=await page.evaluate(id=>getPart(id).name,id);
      await page.locator('[data-s80-record-form] [name="name"]').fill(originalName+' draft');
      assert.ok((await page.locator('[data-s93-draft-status]').innerText()).includes('Unsaved changes'));
      await page.locator('[data-s80-back]').click();
      assert.equal(await page.evaluate(id=>getPart(id).name,id),originalName,'Leaving a record must not silently save edits');
      await page.locator('[data-s80-open-part="'+id+'"]').first().click();
      await page.waitForSelector('[data-s93-draft-status]');
      assert.equal(await page.locator('[data-s80-record-form] [name="name"]').inputValue(),originalName+' draft','Back navigation lost the draft');
      await page.locator('[data-s93-discard]').click();
      assert.equal(await page.locator('[data-s80-record-form] [name="name"]').inputValue(),originalName);
      const originalPrice=await page.evaluate(id=>getPart(id).lastPrice,id);
      await page.locator('[data-s80-record-form] [name="lastPrice"]').fill('-1');
      await page.locator('[data-s80-tab="files"]').click();
      await page.locator('[data-s80-save]').click();
      assert.equal(await page.evaluate(id=>getPart(id).lastPrice,id),originalPrice,'An invalid hidden-tab price must not be committed');
      await page.locator('[data-s93-discard]').click();
      await page.locator('[data-s80-tab="stock"]').click();
      await page.locator('[data-s80-record-form] [name="account"]').fill('Acceptance account');
      await page.locator('[data-s80-tab="files"]').click();
      await page.locator('[data-s80-save]').click();
      assert.equal(await page.evaluate(id=>getPart(id).account,id),'Acceptance account');
      await page.locator('[data-s80-part-file]').setInputFiles({name:'board-demo-note.txt',mimeType:'text/plain',buffer:Buffer.from('SafiMaintain acceptance attachment')});
      await page.waitForFunction(()=>document.querySelector('[data-s80-part-file-list]')?.textContent.includes('board-demo-note.txt'));
      await page.locator('[data-s80-tab="stock"]').click();
      await page.waitForSelector('.s93-stock-left');
      await page.locator('[data-v66-open-location]').first().click();
      assert.equal(await page.locator('#modalForm [name="bin"]').count(),1);await page.evaluate(()=>closeModal());
      await page.screenshot({path:'.test-tmp/supply-record.png',fullPage:true});
    }
    await page.evaluate(()=>{ui.s80SupplyMode='list';go('inventory')});
    await page.locator('[data-s93-view="list"]').click();
    await page.locator('[data-s80-filter="low"]').click();
    assert.equal(await page.locator('[data-s80-part-row]').count(),attentionCount);
    await page.locator('[data-s80-filter="all"]').click();
    await page.locator('[data-s80-list-search]').fill('no-part-matches-xyz');
    assert.equal(await page.locator('[data-s80-part-row]:visible').count(),0);
    await page.locator('[data-s80-list-search]').fill('');
    await page.locator('th[data-s93-sort="4"]').click();
    const stockQuantities=await page.locator('[data-s80-part-row] td:nth-child(5)').allTextContents();
    assert.deepEqual(stockQuantities.map(parseFloat),stockQuantities.map(parseFloat).sort((a,b)=>a-b));
    await page.locator('[data-s93-view="hierarchy"]').click();
    fs.mkdirSync('.test-tmp',{recursive:true});await page.screenshot({path:'.test-tmp/inventory.png',fullPage:true});
    const requestId=await page.evaluate(()=>{const r={id:'REQ-ACCEPT',summary:'Board inspection request',assetId:state.assets.find(a=>a.type==='Equipment')?.id||state.assets[0].id,status:'Requested',urgency:'Normal',requester:'Acceptance',createdAt:iso(),description:'Inspect equipment',history:[]};state.requests.push(r);go('requests');return r.id});
    await page.locator('[data-v52-triage-request="'+requestId+'"]').click();
    await page.locator('#modalForm [name="note"]').fill('Approved during board workflow rehearsal');
    await page.locator('#modalForm button[type="submit"]').click();
    assert.equal(await page.evaluate(id=>state.requests.find(r=>r.id===id).status,requestId),'Converted');
    assert.ok(await page.evaluate(id=>state.workOrders.some(w=>w.source===id),requestId));
    const generated=await page.evaluate(()=>{const asset=state.assets.find(a=>a.type==='Equipment')||state.assets[0];state.scheduledMaintenance.push({id:'PM-BOARD-ACCEPT',name:'Board recurring inspection',assetIds:[asset.id],scheduleMode:'Floating',status:'Active',triggerLogic:'ANY',triggers:[{id:'TRG-BOARD',type:'Time',active:true,nextDue:day(0),description:'Every 7 days'}],taskTemplate:[],requiredParts:[]});go('pm');return state.workOrders.length});
    await page.locator('[data-generate-pm="PM-BOARD-ACCEPT"]').click();
    assert.equal(await page.evaluate(()=>state.workOrders.length),generated+1);
    await page.locator('[data-generate-pm="PM-BOARD-ACCEPT"]').click();
    assert.equal(await page.evaluate(()=>state.workOrders.length),generated+1,'PM created duplicate open work');
    await page.evaluate(()=>go('work-orders'));
    const count=await page.locator('[data-work-search-row]:visible').count();assert.ok(count>0);
    await page.locator('[data-filter="work"]').fill('no-such-work-xyz');
    assert.equal(await page.locator('[data-work-search-row]:visible').count(),0);
    await page.locator('[data-filter="work"]').fill('');
    assert.equal(await page.locator('[data-work-search-row]:visible').count(),count);
    await page.evaluate(()=>showNewWork());
    assert.equal(await page.locator('.safi-advanced-fields').count(),1);
    await page.locator('#modalForm [name="title"]').fill('Acceptance inspection');
    await page.locator('#modalForm [name="type"]').selectOption('Preventive');
    await page.locator('#modalForm [name="assetIds"]').first().check();
    await page.locator('#modalForm button[type="submit"]').click();
    await page.waitForFunction(()=>state.workOrders.some(w=>w.title==='Acceptance inspection'));
    const inventory=await page.evaluate(()=>{
      closeModal();const part=state.parts.find(p=>p.locations.some(l=>l.active!==false&&l.onHand>=2));
      const location=part.locations.find(l=>l.active!==false&&l.onHand>=2);
      const before=JSON.stringify({parts:state.parts,lots:state.inventoryLots,transactions:state.stockTransactions});
      let rejected=false;try{postStock(part.id,'Issue',1000000,location.storeId,location.bin)}catch(_error){rejected=true}
      const unchanged=before===JSON.stringify({parts:state.parts,lots:state.inventoryLots,transactions:state.stockTransactions});
      const quantity=location.onHand,work=state.workOrders.find(w=>w.title==='Acceptance inspection');
      postStock(part.id,'Issue',1,location.storeId,location.bin,{workOrderId:work.id});
      const issued=location.onHand===quantity-1&&work.parts.find(l=>l.partId===part.id)?.actual===1;
      return {rejected,unchanged,issued};
    });
    assert.deepEqual(inventory,{rejected:true,unchanged:true,issued:true});
    await page.evaluate(()=>{
      const work=state.workOrders.find(w=>w.title==='Acceptance inspection');
      work.actualHours=1;work.labor=[{id:'LAB-ACCEPT',userId:CURRENT_USER,hours:1}];
      state.scheduledMaintenance.push({id:'PM-ACCEPT',name:'Floating acceptance',assetIds:work.assetIds,
        scheduleMode:'Floating',status:'Active',awaitingCompletionWorkOrderId:work.id,nextDue:day(-1),
        triggers:[{id:'TRG-ACCEPT',type:'Time',active:true,description:'Every 7 days',nextDue:day(-1)}]});
      openWorkDrawer(work.id);
    });
    await page.locator('[data-v44-status]').selectOption('Completed');
    await page.locator('#modalForm [name="completionNote"]').fill('Inspection completed and verified.');
    await page.locator('#modalForm button[type="submit"]').click();
    const plan=await page.evaluate(()=>{
      const pm=state.scheduledMaintenance.find(p=>p.id==='PM-ACCEPT');
      return {waiting:pm.awaitingCompletionWorkOrderId,ready:safiPmReady(pm),sameDate:pm.nextDue===pm.triggers[0].nextDue};
    });
    assert.deepEqual(plan,{waiting:null,ready:false,sameDate:true});
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>{ui.s80SupplyMode='list';go('inventory')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile inventory overflows');
    await page.locator('[data-s80-part-row]:visible').first().press('Enter');
    await page.waitForSelector('.s93-stock-left');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile part record overflows');
    await page.screenshot({path:'.test-tmp/supply-record-mobile.png',fullPage:true});
    await page.evaluate(()=>go('dashboard'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile page overflows');
    assert.ok((await page.locator('#sidebar').boundingBox()).x<0,'Mobile navigation should start closed');
    await page.locator('#menuButton').click();assert.equal(await page.locator('#sidebar').evaluate(e=>e.classList.contains('open')),true);
    await page.locator('#scrim').click({position:{x:370,y:400}});
    await page.waitForFunction(()=>navigator.serviceWorker?.controller);
    await page.context().setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof window.SafiMaintainDemo==='object');
    assert.ok(await page.evaluate(()=>state.workOrders.some(w=>w.title==='Acceptance inspection')),'Offline reload lost device records');
    assert.equal(await page.evaluate(async()=>{try{await fetch('/api/health');return true}catch(_error){return false}}),false,'API must not be served from the shell cache');
    await page.context().setOffline(false);
    assert.deepEqual(errors,[]);
    const fresh=await browser.newPage();fresh.on('pageerror',error=>errors.push(error.message));
    await fresh.goto(url);await fresh.locator('#firstRunForm [name="name"]').fill('Acceptance operator');
    await fresh.locator('#firstRunForm [name="email"]').fill('operator@example.com');
    await fresh.locator('#firstRunForm [name="site"]').fill('Acceptance site');
    await fresh.locator('#firstRunForm button[type="submit"]').click();
    await fresh.waitForFunction(()=>state.meta.onboardingComplete);
    await fresh.reload();
    await fresh.waitForFunction(()=>state.meta.onboardingComplete);
    assert.deepEqual(await fresh.evaluate(()=>({site:state.sites[0].name,parts:state.parts.length,demo:!!state.meta.demo})),{site:'Acceptance site',parts:0,demo:false});
    await fresh.goto(url+'/?device=1&presentation=1');
    await fresh.waitForSelector('.mw-home');
    assert.equal(await fresh.evaluate(()=>state.meta.demo),true);
    assert.ok(await fresh.evaluate(()=>state.parts.length>0&&state.workOrders.length>0));
    await fresh.reload();await fresh.waitForSelector('.mw-home');
    assert.equal(await fresh.evaluate(()=>state.meta.demo),true);
    await fresh.goto(url);await fresh.waitForSelector('.mw-home');
    assert.deepEqual(await fresh.evaluate(()=>({site:state.sites[0].name,parts:state.parts.length,demo:!!state.meta.demo})),{site:'Acceptance site',parts:0,demo:false});
    await fresh.close();assert.deepEqual(errors,[]);
    fs.mkdirSync('.test-tmp',{recursive:true});await page.screenshot({path:'.test-tmp/mobile.png'});
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.test-tmp/desktop.png'});
    console.log('PASS: 29 pages; dashboard filters and role visibility; work creation and closure; floating PM; atomic FIFO issue; mobile layout; offline reload; workspace persistence; isolated presentation demo.');
  }finally{if(browser)await browser.close();if(server)server.kill()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
