'use strict';
(function(){
  const DEMO_VERSION=67;

  function clone(v){return typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v))}
  function currentIdentity(){
    const u=typeof currentUser==='function'?currentUser():state.users?.[0];
    return {name:u?.name||'Harold Djah',email:u?.email||'harold.djah@example.com'};
  }
  function demoState(){
    const identity=currentIdentity(),base=freshWorkspace(),today=day(0);
    const s=base;
    s.meta={version:APP_VERSION,createdAt:iso(),freshWorkspace:true,onboardingComplete:true,demoData:true,demoDataVersion:DEMO_VERSION,demoLoadedAt:iso()};
    s.sites=[{id:'SITE-GH',name:'Safisana Ghana — Demo',code:'SSGH',region:'Greater Accra',timezone:'Africa/Accra',active:true}];
    s.stores=[
      {id:'STORE-MAIN',siteId:'SITE-GH',name:'Main Maintenance Store',code:'MAIN',location:'Operations block'},
      {id:'STORE-CHP',siteId:'SITE-GH',name:'CHP Store',code:'CHP',location:'Power house'},
      {id:'STORE-UTIL',siteId:'SITE-GH',name:'Utilities Store',code:'UTIL',location:'Utilities workshop'}
    ];
    s.groups=[
      {id:'GRP-OPS',name:'Operations',managerId:'U-1',siteIds:['SITE-GH']},
      {id:'GRP-MAINT',name:'Maintenance',managerId:'U-2',siteIds:['SITE-GH']},
      {id:'GRP-STORES',name:'Stores',managerId:'U-4',siteIds:['SITE-GH']},
      {id:'GRP-PROC',name:'Procurement',managerId:'U-5',siteIds:['SITE-GH']}
    ];
    s.users=[
      {id:'U-1',name:identity.name,email:identity.email,roleId:'ROLE-OPS',groupIds:['GRP-OPS'],siteIds:['SITE-GH'],active:true,mfa:false,emailAlerts:true,certifications:['Plant operations'],hourlyRate:55,weeklyCapacityHours:40,lastActive:iso()},
      {id:'U-2',name:'Kwame Mensah',email:'kwame.mensah@example.com',roleId:'ROLE-PLANNER',groupIds:['GRP-MAINT'],siteIds:['SITE-GH'],active:true,mfa:true,emailAlerts:true,certifications:['Maintenance planning','LOTO'],hourlyRate:48,weeklyCapacityHours:40,lastActive:iso()},
      {id:'U-3',name:'Kojo Arthur',email:'kojo.arthur@example.com',roleId:'ROLE-TECH',groupIds:['GRP-MAINT'],siteIds:['SITE-GH'],active:true,mfa:true,emailAlerts:true,certifications:['Mechanical isolation'],hourlyRate:36,weeklyCapacityHours:40,lastActive:iso()},
      {id:'U-4',name:'Ama Owusu',email:'ama.owusu@example.com',roleId:'ROLE-STORE',groupIds:['GRP-STORES'],siteIds:['SITE-GH'],active:true,mfa:false,emailAlerts:true,certifications:['Stores control'],hourlyRate:32,weeklyCapacityHours:40,lastActive:iso()},
      {id:'U-5',name:'Yaw Boateng',email:'yaw.boateng@example.com',roleId:'ROLE-PROC',groupIds:['GRP-PROC'],siteIds:['SITE-GH'],active:true,mfa:true,emailAlerts:true,certifications:[],hourlyRate:40,weeklyCapacityHours:40,lastActive:iso()}
    ];
    s.vendors=[
      {id:'VEN-1',name:'Ghana Industrial Supplies',contact:'Nana Boateng',phone:'+233 24 555 0184',email:'orders@example.com',status:'Active'},
      {id:'VEN-2',name:'PumpTech Ghana',contact:'Esi Amankwah',phone:'+233 30 255 0412',email:'service@example.com',status:'Active'},
      {id:'VEN-3',name:'PowerCare Engineering',contact:'Yaw Asante',phone:'+233 20 555 0971',email:'parts@example.com',status:'Active'}
    ];
    s.businesses=[
      {id:'BUS-1',name:'Ghana Industrial Supplies',type:'Supplier',group:'Mechanical spares',sourceVendorId:'VEN-1',contact:'Nana Boateng',phone:'+233 24 555 0184',email:'orders@example.com',active:true},
      {id:'BUS-2',name:'PumpTech Ghana',type:'Supplier',group:'Pumps & seals',sourceVendorId:'VEN-2',contact:'Esi Amankwah',phone:'+233 30 255 0412',email:'service@example.com',active:true},
      {id:'BUS-3',name:'PowerCare Engineering',type:'Supplier',group:'CHP parts',sourceVendorId:'VEN-3',contact:'Yaw Asante',phone:'+233 20 555 0971',email:'parts@example.com',active:true}
    ];
    s.parts=[
      {id:'PRT-1',code:'BRG-6205',name:'Bearing 6205-2RS',category:'Bearing',uom:'ea',unitCost:88,lastPrice:92,vendorId:'VEN-1',businessId:'BUS-1',preferredBusinessId:'BUS-1',supplierPartNumber:'6205-2RS-C3',leadTimeDays:5,min:6,max:28,reorderQty:10,barcode:'BRG6205',locations:[
        {storeId:'STORE-MAIN',aisle:'A',row:'02',bin:'B-14',onHand:12,min:4,max:20,active:true},
        {storeId:'STORE-CHP',aisle:'C',row:'01',bin:'S-04',onHand:3,min:2,max:8,active:true}
      ]},
      {id:'PRT-2',code:'MS-40-SS',name:'Pump mechanical seal',category:'Seal',uom:'ea',unitCost:320,lastPrice:335,vendorId:'VEN-2',businessId:'BUS-2',preferredBusinessId:'BUS-2',supplierPartNumber:'MS40SS',leadTimeDays:7,min:2,max:8,reorderQty:4,barcode:'MS40SS',locations:[
        {storeId:'STORE-MAIN',aisle:'A',row:'03',bin:'B-12',onHand:1,min:2,max:8,active:true}
      ]},
      {id:'PRT-3',code:'OIL-EP220',name:'Gear oil EP 220',category:'Lubricant',uom:'L',unitCost:46,lastPrice:48,vendorId:'VEN-1',businessId:'BUS-1',preferredBusinessId:'BUS-1',leadTimeDays:3,min:10,max:40,reorderQty:20,barcode:'OILEP220',locations:[
        {storeId:'STORE-MAIN',aisle:'L',row:'01',bin:'Bay-2',onHand:22,min:10,max:40,active:true}
      ]},
      {id:'PRT-4',code:'FLT-G4-20',name:'CHP cabinet filter mat',category:'Filter',uom:'ea',unitCost:27,lastPrice:29,vendorId:'VEN-3',businessId:'BUS-3',preferredBusinessId:'BUS-3',leadTimeDays:10,min:5,max:12,reorderQty:8,barcode:'FLTG420',locations:[
        {storeId:'STORE-CHP',aisle:'C',row:'02',bin:'Shelf-5',onHand:3,min:5,max:12,active:true}
      ]},
      {id:'PRT-5',code:'SPK-2G-408',name:'CHP spark plug',category:'Engine',uom:'ea',unitCost:112,lastPrice:118,vendorId:'VEN-3',businessId:'BUS-3',preferredBusinessId:'BUS-3',leadTimeDays:12,min:6,max:18,reorderQty:12,barcode:'SPK2G408',locations:[
        {storeId:'STORE-CHP',aisle:'C',row:'02',bin:'Bin-2',onHand:12,min:6,max:18,active:true}
      ]},
      {id:'PRT-6',code:'BLT-B72',name:'Drive belt B-72',category:'Drive',uom:'ea',unitCost:95,lastPrice:99,vendorId:'VEN-1',businessId:'BUS-1',preferredBusinessId:'BUS-1',leadTimeDays:6,min:3,max:10,reorderQty:6,barcode:'BLTB72',locations:[
        {storeId:'STORE-UTIL',aisle:'U',row:'04',bin:'Rack-3',onHand:2,min:3,max:10,active:true}
      ]}
    ];
    s.assets=[
      {id:'SITE-ASSET',code:'SSGH',name:'Safisana Ghana',type:'Site',parentId:null,siteId:'SITE-GH',category:'Site',criticality:'A',condition:'Healthy',operatingState:'Online',location:'Ashaiman',ownerUserId:'U-1',ownerGroupId:'GRP-OPS',commissioned:'2017-01-01',bom:[]},
      {id:'FAC-OPS',code:'OPS',name:'Operations Plant',type:'Facility',parentId:'SITE-ASSET',siteId:'SITE-GH',category:'Facility',criticality:'A',condition:'Healthy',operatingState:'Online',location:'Main plant',ownerUserId:'U-1',ownerGroupId:'GRP-OPS',commissioned:'2017-01-01',bom:[]},
      {id:'AREA-CHP',code:'CHP',name:'CHP Room',type:'Area',parentId:'FAC-OPS',siteId:'SITE-GH',category:'Power generation',criticality:'A',condition:'Healthy',operatingState:'Online',location:'Power house',ownerUserId:'U-2',ownerGroupId:'GRP-MAINT',commissioned:'2020-01-01',bom:[]},
      {id:'CHP-01',code:'CHP-01',name:'CHP Unit 01',type:'Equipment',parentId:'AREA-CHP',siteId:'SITE-GH',category:'CHP',criticality:'A',condition:'Healthy',operatingState:'Online',location:'CHP Room',ownerUserId:'U-2',ownerGroupId:'GRP-MAINT',manufacturer:'2G',model:'agenitor 408',serial:'2G-49811',warrantyExpiry:'2027-12-31',commissioned:'2020-09-04',bom:['PRT-1','PRT-4','PRT-5'],bomQuantities:{'PRT-1':2,'PRT-4':2,'PRT-5':4}},
      {id:'CHP-PUMP',code:'CHP-P-01',name:'CHP Cooling Pump',type:'Equipment',parentId:'CHP-01',siteId:'SITE-GH',category:'Pump',criticality:'B',condition:'Healthy',operatingState:'Online',location:'CHP Unit 01',ownerUserId:'U-3',ownerGroupId:'GRP-MAINT',manufacturer:'Grundfos',model:'CM 10-2',serial:'GCP-5108',commissioned:'2020-09-04',bom:['PRT-1'],bomQuantities:{'PRT-1':2}},
      {id:'AREA-DIG',code:'DIG',name:'Digester Area',type:'Area',parentId:'FAC-OPS',siteId:'SITE-GH',category:'Process area',criticality:'A',condition:'Attention',operatingState:'Online',location:'Wet process',ownerUserId:'U-2',ownerGroupId:'GRP-MAINT',commissioned:'2018-02-14',bom:[]},
      {id:'P-201',code:'P-201',name:'Digester Feed Pump 02',type:'Equipment',parentId:'AREA-DIG',siteId:'SITE-GH',category:'Pump',criticality:'A',condition:'Attention',operatingState:'Offline',location:'Digester feed line',ownerUserId:'U-3',ownerGroupId:'GRP-MAINT',manufacturer:'Grundfos',model:'CR 32-4',serial:'GF-88214',warrantyExpiry:'2027-06-10',commissioned:'2021-06-11',bom:['PRT-1','PRT-2'],bomQuantities:{'PRT-1':2,'PRT-2':1},offlineSince:new Date(Date.now()-2*3600000).toISOString(),downtimeReason:'Mechanical seal leakage'},
      {id:'MIX-03',code:'MX-03',name:'Digester Mixer 03',type:'Equipment',parentId:'AREA-DIG',siteId:'SITE-GH',category:'Mixer',criticality:'A',condition:'Healthy',operatingState:'Online',location:'Digester 3',ownerUserId:'U-3',ownerGroupId:'GRP-MAINT',manufacturer:'SEW',model:'X3KR',serial:'SEW-33091',commissioned:'2022-01-19',bom:['PRT-3'],bomQuantities:{'PRT-3':1}},
      {id:'DEW-01',code:'DW-01',name:'Sludge Dewatering Press',type:'Equipment',parentId:'FAC-OPS',siteId:'SITE-GH',category:'Dewatering',criticality:'A',condition:'Attention',operatingState:'Online',location:'Dewatering bay',ownerUserId:'U-3',ownerGroupId:'GRP-MAINT',manufacturer:'Huber',model:'Q-PRESS',serial:'HQP-1208',commissioned:'2021-11-02',bom:['PRT-6'],bomQuantities:{'PRT-6':2}},
      {id:'TOOL-01',code:'SPN-001',name:'Torque Wrench',type:'Tool',parentId:'CHP-01',siteId:'SITE-GH',category:'Tool',criticality:'C',condition:'Healthy',operatingState:'Online',location:'CHP Store',ownerUserId:'U-4',ownerGroupId:'GRP-STORES',manufacturer:'Norbar',model:'Pro 100',serial:'NW-11082',commissioned:'2024-02-01',bom:[]}
    ];
    s.meters=[
      {id:'MTR-1',assetId:'P-201',name:'Run hours',unit:'h',current:1240,readings:[{value:1210,at:day(-16)},{value:1240,at:day(-2)}]},
      {id:'MTR-2',assetId:'CHP-01',name:'Run hours',unit:'h',current:9958,readings:[{value:9830,at:day(-12)},{value:9958,at:day(-1)}]},
      {id:'MTR-3',assetId:'DEW-01',name:'Operating hours',unit:'h',current:3375,readings:[{value:3321,at:day(-15)},{value:3375,at:day(-3)}]}
    ];
    s.failureCodeDefinitions=[
      {id:'FC-LEAK',problem:'Leak',causes:[{id:'FC-LEAK-SEAL',name:'Seal failure',actions:['Replace seal','Re-seat seal']}]},
      {id:'FC-BELT',problem:'Belt tracking',causes:[{id:'FC-BELT-ALIGN',name:'Pulley misalignment',actions:['Realign pulley','Replace pulley']}]}
    ];
    s.workOrders=[
      {id:'WO-2502',title:'Replace feed pump mechanical seal',assetIds:['P-201'],type:'Corrective',priority:'Critical',status:'In Progress',assigneeIds:['U-3'],assigneeGroupId:'GRP-MAINT',due:today,estimateHours:3,actualHours:1.2,source:'Asset downtime',instructions:'Apply LOTO, replace mechanical seal, inspect coupling and complete operational test.',tasks:[{id:'T-21',text:'Apply isolation and verify zero energy',type:'General',status:'Done',assigneeId:'U-3'},{id:'T-22',text:'Replace mechanical seal',type:'General',status:'In Progress',assigneeId:'U-3'},{id:'T-23',text:'Operational test and leak check',type:'Inspection',status:'Todo',assigneeId:'U-3'}],parts:[{partId:'PRT-2',planned:1,actual:0}],labor:[{id:'LAB-1',userId:'U-3',hours:1.2,at:iso()}],createdAt:day(-1),completedAt:null,completionNote:'',failureCodes:{problem:'Leak',cause:'Seal failure',action:'Replace seal'},history:[{at:day(-1),text:'Created from asset downtime event'},{at:iso(),text:'Started by Kojo Arthur'}]},
      {id:'WO-2501',title:'CHP 10,000-hour service',assetIds:['CHP-01'],type:'Preventive',priority:'High',status:'Open',assigneeIds:['U-2','U-3'],assigneeGroupId:'GRP-MAINT',due:day(2),estimateHours:5,actualHours:0,source:'PM-CHP',instructions:'Complete 10,000-hour inspection, ignition checks and cabinet filter replacement.',tasks:[{id:'T-11',text:'Record engine hours',type:'Meter',status:'Todo',assigneeId:'U-3',meterId:'MTR-2'},{id:'T-12',text:'Inspect ignition system',type:'Inspection',status:'Todo',assigneeId:'U-3'},{id:'T-13',text:'Replace cabinet filter mats',type:'General',status:'Todo',assigneeId:'U-3'}],parts:[{partId:'PRT-4',planned:2,actual:0},{partId:'PRT-5',planned:4,actual:0}],labor:[],createdAt:day(-3),completedAt:null,history:[]},
      {id:'WO-2499',title:'Inspect dewatering belt tracking',assetIds:['DEW-01'],type:'Corrective',priority:'Medium',status:'Open',assigneeIds:['U-3'],assigneeGroupId:'GRP-MAINT',due:day(4),estimateHours:2,actualHours:0,source:'REQ-81',instructions:'Inspect belt tracking, rollers and pulley alignment.',tasks:[{id:'T-31',text:'Inspect belt tracking',type:'Inspection',status:'Todo',assigneeId:'U-3'}],parts:[{partId:'PRT-6',planned:1,actual:0}],labor:[],createdAt:day(-1),completedAt:null,history:[]},
      {id:'WO-2498',title:'Correct dewatering pulley alignment',assetIds:['DEW-01'],type:'Corrective',priority:'Medium',status:'Completed',assigneeIds:['U-3'],assigneeGroupId:'GRP-MAINT',due:day(-8),estimateHours:2,actualHours:1.7,source:'Inspection',instructions:'Realign drive pulley and verify belt tracking.',tasks:[{id:'T-41',text:'Realign drive pulley',type:'General',status:'Done',assigneeId:'U-3'}],parts:[{partId:'PRT-6',planned:1,actual:1}],labor:[{id:'LAB-2',userId:'U-3',hours:1.7,at:day(-8)}],createdAt:day(-10),completedAt:day(-8),completionNote:'Pulley alignment corrected and belt tracking verified.',failureCodes:{problem:'Belt tracking',cause:'Pulley misalignment',action:'Realign pulley'},history:[{at:day(-8),text:'Completed by Kojo Arthur'}]}
    ];
    s.scheduledMaintenance=[
      {id:'PM-CHP',name:'CHP 10,000-hour service',assetId:'CHP-01',assetIds:['CHP-01'],status:'Active',triggerLogic:'ANY',assigneeGroupId:'GRP-MAINT',triggers:[{id:'TR-CHP',type:'Meter',meterId:'MTR-2',threshold:10000,description:'Every 500 running hours'}],nextDue:'10,000 h',taskTemplate:['Record engine hours','Inspect ignition system','Replace cabinet filter mats'],requiredParts:[{partId:'PRT-4',qty:2},{partId:'PRT-5',qty:4}],nestedPlanIds:[]},
      {id:'PM-PUMP',name:'Feed pump monthly inspection',assetId:'P-201',assetIds:['P-201'],status:'Active',triggerLogic:'ANY',assigneeGroupId:'GRP-MAINT',triggers:[{id:'TR-PUMP',type:'Time',nextDue:day(18),description:'Every 30 days'}],nextDue:day(18),taskTemplate:['Inspect mechanical seal','Check coupling','Clean suction screen'],requiredParts:[{partId:'PRT-2',qty:1}],nestedPlanIds:[]},
      {id:'PM-MIX',name:'Mixer lubrication',assetId:'MIX-03',assetIds:['MIX-03'],status:'Active',triggerLogic:'ANY',assigneeGroupId:'GRP-MAINT',triggers:[{id:'TR-MIX',type:'Time',nextDue:day(6),description:'Every 30 days'}],nextDue:day(6),taskTemplate:['Lubricate bearing points','Inspect gearbox'],requiredParts:[{partId:'PRT-3',qty:1}],nestedPlanIds:[]}
    ];
    s.requests=[
      {id:'REQ-81',assetId:'DEW-01',summary:'Belt tracking toward left side during operation',description:'Operator noticed the belt drifting left during the afternoon shift.',urgency:'Urgent',requester:'Production operator',createdAt:day(-1),status:'Converted',reviewerId:'U-2',workOrderId:'WO-2499'},
      {id:'REQ-82',assetId:'CHP-01',summary:'Small oil mist around engine cover',description:'Please inspect during next planned stop.',urgency:'Normal',requester:'Operations',createdAt:today,status:'Requested',reviewerId:'U-2'}
    ];
    s.downtime=[{id:'DT-1',assetId:'P-201',startedAt:new Date(Date.now()-2*3600000).toISOString(),endedAt:null,reasonCode:'Mechanical',reason:'Mechanical seal leakage',workOrderId:'WO-2502',reportedBy:'U-1'}];
    s.assetEvents=[
      {id:'AE-1',assetId:'P-201',type:'State change',at:new Date(Date.now()-2*3600000).toISOString(),userId:'U-1',detail:'Online → Offline — mechanical seal leakage',workOrderId:'WO-2502'},
      {id:'AE-2',assetId:'DEW-01',type:'Work completed',at:day(-8),userId:'U-3',detail:'WO-2498 completed',workOrderId:'WO-2498'}
    ];
    s.stockTransactions=[
      {id:'TX-101',partId:'PRT-1',type:'Receipt',qty:10,storeId:'STORE-MAIN',bin:'B-14',aisle:'A',row:'02',reference:'DN-5101',workOrderId:null,at:day(-20),userId:'U-4',note:'Supplier delivery',qtyBefore:2,qtyAfter:12},
      {id:'TX-102',partId:'PRT-1',type:'Receipt',qty:3,storeId:'STORE-CHP',bin:'S-04',aisle:'C',row:'01',reference:'TR-201',workOrderId:null,at:day(-12),userId:'U-4',note:'Stocked CHP satellite store',qtyBefore:0,qtyAfter:3},
      {id:'TX-103',partId:'PRT-2',type:'Receipt',qty:2,storeId:'STORE-MAIN',bin:'B-12',aisle:'A',row:'03',reference:'DN-4481',workOrderId:null,at:day(-10),userId:'U-4',note:'Pump seal delivery',qtyBefore:0,qtyAfter:2},
      {id:'TX-104',partId:'PRT-2',type:'Issue',qty:-1,storeId:'STORE-MAIN',bin:'B-12',aisle:'A',row:'03',reference:'WO-2480',workOrderId:null,at:day(-5),userId:'U-4',note:'Previous pump repair',qtyBefore:2,qtyAfter:1},
      {id:'TX-105',partId:'PRT-4',type:'Receipt',qty:3,storeId:'STORE-CHP',bin:'Shelf-5',aisle:'C',row:'02',reference:'DN-PP-31',workOrderId:null,at:day(-25),userId:'U-4',note:'CHP filter stock',qtyBefore:0,qtyAfter:3},
      {id:'TX-106',partId:'PRT-6',type:'Adjustment',qty:-1,storeId:'STORE-UTIL',bin:'Rack-3',aisle:'U',row:'04',reference:'CNT-31',workOrderId:null,at:day(-2),userId:'U-4',note:'Damaged belt removed',qtyBefore:3,qtyAfter:2}
    ];
    s.cycleCounts=[{id:'CNT-31',partId:'PRT-6',storeId:'STORE-UTIL',bin:'Rack-3',expected:3,counted:2,variance:-1,status:'Posted',at:day(-2),userId:'U-4',note:'One damaged belt removed'}];
    s.inventoryLots=[
      {id:'LOT-1',partId:'PRT-1',storeId:'STORE-MAIN',bin:'B-14',qtyOriginal:12,qtyRemaining:12,unitCost:92,receivedAt:day(-20),reference:'DN-5101',currency:'GHS'},
      {id:'LOT-2',partId:'PRT-1',storeId:'STORE-CHP',bin:'S-04',qtyOriginal:3,qtyRemaining:3,unitCost:92,receivedAt:day(-12),reference:'TR-201',currency:'GHS'},
      {id:'LOT-3',partId:'PRT-2',storeId:'STORE-MAIN',bin:'B-12',qtyOriginal:2,qtyRemaining:1,unitCost:335,receivedAt:day(-10),reference:'DN-4481',currency:'GHS'},
      {id:'LOT-4',partId:'PRT-4',storeId:'STORE-CHP',bin:'Shelf-5',qtyOriginal:3,qtyRemaining:3,unitCost:29,receivedAt:day(-25),reference:'DN-PP-31',currency:'GHS'}
    ];
    s.purchaseRequests=[
      {id:'PR-103',partId:'PRT-2',requestedQty:4,qty:4,quantity:4,status:'Requested',source:'Auto reorder',reason:'Below minimum stock',createdAt:today,createdBy:'SYSTEM',workOrderId:null},
      {id:'PR-102',partId:'PRT-4',requestedQty:8,qty:8,quantity:8,status:'Approved',source:'Auto reorder',reason:'Below minimum stock for CHP filters',createdAt:day(-1),createdBy:'SYSTEM',approvedBy:'U-1',workOrderId:null}
    ];
    s.purchaseOrders=[{id:'PO-2026',vendorId:'VEN-3',businessId:'BUS-3',status:'Ordered',createdAt:day(-3),expectedDate:day(6),lines:[{partId:'PRT-4',qty:8,receivedQty:0,unitCost:29}],sourceRequestIds:['PR-102']}];
    s.rfqs=[{id:'RFQ-77',partId:'PRT-2',qty:4,businessId:'BUS-2',vendorId:'VEN-2',status:'Sent',dueDate:day(3),createdAt:today,source:'Automatic low stock'}];
    s.receipts=[];
    s.projects=[{id:'PROJ-1',siteId:'SITE-GH',name:'CHP 10k-hour maintenance window',status:'Planned',description:'Coordinate CHP service and production coverage.'}];
    s.taskGroups=[{id:'TG-CHP',name:'CHP basic inspection',description:'Reusable CHP inspection checklist',tasks:[{id:'TG-T1',text:'Visual leak inspection'},{id:'TG-T2',text:'Record running hours'}]}];
    s.bomGroups=[];
    s.assetMoves=[];
    s.userNotificationPreferences=[];
    s.assetCategories=[];
    s.priorityDefinitions=[];
    s.maintenanceTypeDefinitions=[];
    s.meterUnits=[];
    s.workCustomFieldDefinitions=[];
    s.assetCustomFieldDefinitions=[];
    s.workflowRules=[];
    s.integrationConnections=[];
    s.savedReports=[];
    s.importJobs=[];
    s.exportJobs=[];
    s.workSavedFilters=[];
    s.assetEventTypes=[];
    s.workStatusDefinitions=[
      {id:'WST-OPEN',name:'Open',control:'ACTIVE'},
      {id:'WST-IP',name:'In Progress',control:'ACTIVE'},
      {id:'WST-COMP',name:'Completed',control:'CLOSED'},
      {id:'WST-CANCEL',name:'Cancelled',control:'CLOSED'}
    ];
    s.notificationRules=[
      {id:'NR-1',event:'Asset taken offline',audiences:['Operations manager','Maintenance planner','Asset owner','Active WO assignees'],inApp:true,email:true},
      {id:'NR-2',event:'Stock below minimum',audiences:['Storekeeper','Procurement'],inApp:true,email:true},
      {id:'NR-3',event:'Purchase request created',audiences:['Procurement','Operations manager'],inApp:true,email:true},
      {id:'NR-4',event:'Work order assigned',audiences:['Assigned users','Maintenance planner'],inApp:true,email:true}
    ];
    s.notifications=[
      {id:'N-1',userId:'U-1',event:'Asset taken offline',title:'P-201 is Offline',message:'Digester Feed Pump 02 is offline because of mechanical seal leakage.',createdAt:new Date(Date.now()-2*3600000).toISOString(),read:false,relatedId:'P-201'},
      {id:'N-2',userId:'U-1',event:'Stock below minimum',title:'Low stock: Pump mechanical seal',message:'MS-40-SS has 1 ea on hand; minimum is 2.',createdAt:today,read:false,relatedId:'PRT-2'}
    ];
    s.mailOutbox=[];
    s.audit=[
      {id:'AUD-1',at:new Date(Date.now()-2*3600000).toISOString(),userId:'U-1',action:'ASSET_STATE_CHANGE',entity:'P-201',detail:'Online → Offline; Mechanical seal leakage'},
      {id:'AUD-2',at:day(-2),userId:'U-4',action:'CYCLE_COUNT_POSTED',entity:'CNT-31',detail:'BLT-B72 variance -1'},
      {id:'AUD-3',at:day(-1),userId:'U-1',action:'PURCHASE_REQUEST_APPROVED',entity:'PR-102',detail:'Approved CHP filter replenishment'}
    ];
    s.purchasingSettings={requirePoApproval:true,poApprovalThreshold:1000,autoRfqOnLowStock:true,costingMethod:'FIFO',defaultCurrency:'GHS'};
    s.workSettings={requireAllTasksOnClose:true,requireLaborOnClose:true,requireCompletionNote:true,requireFailureCodesForCorrective:true};
    s.security={requireMfa:false,sessionTimeoutMinutes:60,auditRetentionDays:365,ssoMode:'Not configured',ipRestrictionMode:'Not configured'};
    s.toolCrib=[];
    return s
  }

  function loadDemo(){
    if(!confirm('Load the SafiMaintain demo workspace? This replaces the current local test records with demo assets, work orders, parts, stock locations and purchasing data.'))return;
    state=demoState();
    ui.selectedAsset='CHP-01';
    ui.selectedPart='PRT-1';
    ui.assetView='hierarchy';
    ui.assetRecordTab='general';
    ui.v66PartTab='stock';
    ui.route='dashboard';
    saveState();
    document.body.classList.remove('first-run');
    simpleNavigation();
    if(typeof syncSimpleShell==='function')syncSimpleShell();
    render();
    toast('Demo data loaded — start with Assets or Stock & parts')
  }

  const previousDashboard=renderDashboard;
  renderDashboard=function(){
    let html=previousDashboard();
    const label=state.meta?.demoData?'Reload demo data':'Load demo data';
    const button='<button class="button v67-demo-button" type="button" data-v67-load-demo>'+label+'</button>';
    if(html.includes('v65-dashboard-actions'))html=html.replace('<div class="v65-dashboard-actions">','<div class="v65-dashboard-actions">'+button);
    else html='<div class="v67-demo-note">Want realistic records for testing? <button class="button small v67-demo-button" data-v67-load-demo>'+label+'</button></div>'+html;
    if(state.meta?.demoData)html='<div class="v67-demo-badge"><i></i>Demo workspace · v'+DEMO_VERSION+'</div>'+html;
    return html
  };
  window.renderDashboard=renderDashboard;

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-v67-load-demo]');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();loadDemo()
  },true);

  window.SafiMaintainDemo={load:loadDemo,build:demoState};
  if(ui.route==='dashboard')render()
})();