'use strict';
(function(){
  const DEMO_FLAG='safimaint-demo-workspace-v67';
  const DEMO_BACKUP='safimaint-pre-demo-backup-v67';

  function demoState(){
    const d=structuredClone(seed);
    d.meta=d.meta||{};d.meta.demo=true;d.meta.demoVersion=67;d.meta.demoLoadedAt=iso();

    // Keep the current tester's identity so loading the demo does not suddenly
    // change the person shown in the header.
    const current=state.users?.find(u=>u.id===CURRENT_USER);
    if(current){
      const idx=d.users.findIndex(u=>u.id===CURRENT_USER);
      if(idx>=0)d.users[idx]={...d.users[idx],name:current.name,email:current.email,roleId:current.roleId||d.users[idx].roleId,groupIds:current.groupIds||d.users[idx].groupIds,active:true};
      else d.users.unshift(structuredClone(current));
    }

    // Enrich stock locations so the familiar Fiix-style Stock tab is immediately testable.
    const locs={
      'PRT-1':{aisle:'A',row:'02',bin:'Bin 08',min:4,max:16,active:true},
      'PRT-2':{aisle:'A',row:'03',bin:'Bin 12',min:2,max:8,active:true},
      'PRT-3':{aisle:'B',row:'01',bin:'Bay 2',min:8,max:30,active:true},
      'PRT-4':{aisle:'C',row:'01',bin:'Shelf 5',min:5,max:12,active:true},
      'PRT-5':{aisle:'C',row:'02',bin:'Bin 2',min:6,max:18,active:true},
      'PRT-6':{aisle:'B',row:'03',bin:'Rack 3',min:3,max:10,active:true}
    };
    d.parts.forEach(p=>{
      p.locations=p.locations||[];
      p.locations.forEach(l=>Object.assign(l,locs[p.id]||{aisle:'',row:'',min:Number(p.min||0),max:Number(p.max||0),active:true}));
      p.lastPrice=Number(p.lastPrice??p.unitCost??0);
      p.currency=p.currency||'GHS';
      p.leadTimeDays=Number(p.leadTimeDays||7);
    });

    // Add a second location to a familiar bearing so multi-location stock can be tested.
    const bearing=d.parts.find(p=>p.id==='PRT-1');
    if(bearing&&!bearing.locations.some(l=>l.storeId==='STORE-CHP')){
      bearing.locations.push({storeId:'STORE-CHP',aisle:'C',row:'04',bin:'Shelf 2',onHand:2,min:1,max:4,active:true});
      bearing.min=5;bearing.max=20;
    }

    // Give asset BOM quantities so the embedded Parts/BOM tab has meaningful demand.
    const pump=d.assets.find(a=>a.id==='P-201');if(pump)pump.bomQuantities={'PRT-1':2,'PRT-2':1};
    const chp=d.assets.find(a=>a.id==='CHP-01');if(chp)chp.bomQuantities={'PRT-4':2,'PRT-5':4};
    const mixer=d.assets.find(a=>a.id==='MIX-03');if(mixer)mixer.bomQuantities={'PRT-3':1};
    const dew=d.assets.find(a=>a.id==='DEW-01');if(dew)dew.bomQuantities={'PRT-6':2};

    // Quantity-before/after makes the new stock history immediately visible.
    const p2=d.parts.find(p=>p.id==='PRT-2');
    const p6=d.parts.find(p=>p.id==='PRT-6');
    if(d.stockTransactions?.[0])Object.assign(d.stockTransactions[0],{qtyBefore:0,qtyAfter:2,aisle:'A',row:'03'});
    if(d.stockTransactions?.[1])Object.assign(d.stockTransactions[1],{qtyBefore:2,qtyAfter:1,aisle:'B',row:'03'});

    // A couple of extra realistic demo transactions for Stock History.
    d.stockTransactions=d.stockTransactions||[];
    d.stockTransactions.unshift(
      {id:'TX-DEMO-3',partId:'PRT-1',type:'Receipt',qty:4,storeId:'STORE-MAIN',bin:'Bin 08',reference:'GRN-2409',workOrderId:null,at:day(-10),userId:'U-4',note:'Bearing replenishment',qtyBefore:4,qtyAfter:8,aisle:'A',row:'02',unitCost:88,extendedCost:352},
      {id:'TX-DEMO-4',partId:'PRT-4',type:'Issue',qty:-2,storeId:'STORE-CHP',bin:'Shelf 5',reference:'WO-2406',workOrderId:'WO-2406',at:day(-2),userId:'U-3',note:'Issued for monthly CHP inspection',qtyBefore:5,qtyAfter:3,aisle:'C',row:'01',unitCost:27,extendedCost:54}
    );

    // Ensure arrays introduced by later releases exist even if the seed predates them.
    ['businesses','inventoryLots','rfqs','receipts','downtime','assetEvents','notifications','mailOutbox','audit','auditLog','taskGroups','projects'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});
    if(!d.purchasingSettings)d.purchasingSettings={requirePoApproval:true,poApprovalThreshold:2000,autoRfqOnLowStock:false,costingMethod:'FIFO',defaultCurrency:'GHS'};
    return d
  }

  function workspaceSparse(){
    return (state.assets?.filter(a=>a.type!=='Site').length||0)<=4 && (state.parts?.length||0)<=1 && (state.workOrders?.length||0)<=2
  }

  function loadDemo({automatic=false}={}){
    if(!localStorage.getItem(DEMO_BACKUP))localStorage.setItem(DEMO_BACKUP,JSON.stringify(state));
    state=demoState();
    ui.selectedAsset='CHP-01';
    ui.selectedPart='PRT-4';
    ui.assetRecordTab='details';
    ui.v66PartTab='stock';
    localStorage.setItem(DEMO_FLAG,'1');
    saveState();
    render();
    if(!automatic)toast('Demo workspace loaded')
  }
  window.safiLoadDemoWorkspace=loadDemo;

  function restorePrevious(){
    const raw=localStorage.getItem(DEMO_BACKUP);
    if(!raw){toast('No pre-demo backup is available');return}
    try{
      state=JSON.parse(raw);localStorage.removeItem(DEMO_FLAG);localStorage.removeItem(DEMO_BACKUP);saveState();render();toast('Previous workspace restored')
    }catch(_){toast('Could not restore the previous workspace')}
  }

  function demoBanner(){
    if(!state.meta?.demo)return'';
    return '<div class="v67-demo-banner"><span class="v67-demo-badge"><i></i>Demo data</span><span><strong>Safisana maintenance demo workspace</strong><small>Use the sample assets, work orders, PMs, stock locations and purchasing records to test SafiMaintain.</small></span><span class="grow"></span><button class="button" type="button" data-v67-demo-reload>Reload demo</button><button class="button" type="button" data-v67-demo-restore>Restore my data</button></div>'
  }

  const previousDashboard=renderDashboard;
  renderDashboard=function(){
    return demoBanner()+previousDashboard()
  };
  window.renderDashboard=renderDashboard;

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-v67-demo-reload]')){e.preventDefault();e.stopImmediatePropagation();if(confirm('Reload the SafiMaintain demo data? Changes made to demo records will be reset.'))loadDemo();return}
    if(e.target.closest('[data-v67-demo-restore]')){e.preventDefault();e.stopImmediatePropagation();if(confirm('Restore the workspace you had before loading demo data?'))restorePrevious();return}
    if(e.target.closest('[data-v67-load-demo]')){e.preventDefault();e.stopImmediatePropagation();loadDemo();return}
  },true);

  // The user explicitly requested demo data for testing. Auto-load it once only when
  // the current local workspace is still sparse, preserving a restorable backup.
  if(!localStorage.getItem(DEMO_FLAG)&&workspaceSparse()){
    loadDemo({automatic:true});
  }else if(ui.route==='dashboard'){
    render()
  }
})();