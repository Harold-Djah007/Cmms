'use strict';
const seed = {
  meta:{version:APP_VERSION,createdAt:iso()},
  sites:[
    {id:'SITE-GH',name:'Safisana Ghana',code:'SSGH',region:'Greater Accra',timezone:'Africa/Accra',active:true}
  ],
  stores:[
    {id:'STORE-MAIN',siteId:'SITE-GH',name:'Main Maintenance Store',code:'MAIN',location:'Operations block'},
    {id:'STORE-CHP',siteId:'SITE-GH',name:'CHP Store',code:'CHP',location:'Power house'}
  ],
  roles:[
    {id:'ROLE-OPS',name:'Operations manager',permissions:['asset.view','asset.edit','asset.state','work.view','work.manage','inventory.view','purchase.view','admin.people','admin.notifications','report.view']},
    {id:'ROLE-PLANNER',name:'Maintenance planner',permissions:['asset.view','asset.edit','asset.state','work.view','work.manage','pm.manage','inventory.view','purchase.manage','report.view']},
    {id:'ROLE-TECH',name:'Technician',permissions:['asset.view','asset.state','work.view','work.execute','inventory.view','inventory.issue']},
    {id:'ROLE-STORE',name:'Storekeeper',permissions:['asset.view','work.view','inventory.view','inventory.manage','inventory.count','purchase.view']},
    {id:'ROLE-PROC',name:'Procurement',permissions:['inventory.view','purchase.view','purchase.manage','vendor.manage','report.view']},
  ],
  groups:[
    {id:'GRP-OPS',name:'Operations',managerId:'U-1'},
    {id:'GRP-MAINT',name:'Maintenance',managerId:'U-3'},
    {id:'GRP-STORES',name:'Stores',managerId:'U-4'},
    {id:'GRP-PROC',name:'Procurement',managerId:'U-5'}
  ],
  users:[
    {id:'U-1',name:'Abena Sarpong',email:'abena.sarpong@safisana.org',roleId:'ROLE-OPS',groupIds:['GRP-OPS'],active:true,mfa:true,emailAlerts:true,certifications:['Plant operations'],lastActive:iso()},
    {id:'U-2',name:'Kwame Mensah',email:'kwame.mensah@safisana.org',roleId:'ROLE-TECH',groupIds:['GRP-MAINT'],active:true,mfa:true,emailAlerts:true,certifications:['Mechanical isolation','LOTO'],lastActive:iso()},
    {id:'U-3',name:'Simeon Sakyi',email:'simeon.sakyi@safisana.org',roleId:'ROLE-PLANNER',groupIds:['GRP-MAINT'],active:true,mfa:true,emailAlerts:true,certifications:['Maintenance planning'],lastActive:iso()},
    {id:'U-4',name:'Ama Owusu',email:'ama.owusu@safisana.org',roleId:'ROLE-STORE',groupIds:['GRP-STORES'],active:true,mfa:false,emailAlerts:true,certifications:['Stores control'],lastActive:iso()},
    {id:'U-5',name:'Yaw Boateng',email:'yaw.boateng@safisana.org',roleId:'ROLE-PROC',groupIds:['GRP-PROC'],active:true,mfa:true,emailAlerts:true,certifications:[],lastActive:iso()}
  ],
  assets:[
    {id:'SITE-ASSET',code:'SSGH',name:'Safisana Ghana',type:'Site',parentId:null,siteId:'SITE-GH',category:'Site',criticality:'A',condition:'Healthy',operatingState:'Online',location:'Ashaiman',ownerUserId:'U-1',ownerGroupId:'GRP-OPS',manufacturer:'',model:'',serial:'',warrantyExpiry:'',commissioned:'2017-01-01',bom:[]},
    {id:'FAC-OPS',code:'OPS',name:'Operations',type:'Facility',parentId:'SITE-ASSET',siteId:'SITE-GH',category:'Facility',criticality:'A',condition:'Healthy',operatingState:'Online',location:'Main plant',ownerUserId:'U-1',ownerGroupId:'GRP-OPS',manufacturer:'',model:'',serial:'',warrantyExpiry:'',commissioned:'2017-01-01',bom:[]},
    {id:'AREA-MIX',code:'MIX',name:'Mix Pit',type:'Production area',parentId:'FAC-OPS',siteId:'SITE-GH',category:'Process area',criticality:'A',condition:'Attention',operatingState:'Online',location:'Wet process',ownerUserId:'U-1',ownerGroupId:'GRP-OPS',manufacturer:'',model:'',serial:'',warrantyExpiry:'',commissioned:'2018-02-14',bom:[]},
    {id:'P-201',code:'P-201',name:'Digester Feed Pump 02',type:'Equipment',parentId:'AREA-MIX',siteId:'SITE-GH',category:'Pump',criticality:'A',condition:'Attention',operatingState:'Offline',location:'Digester feed line',ownerUserId:'U-2',ownerGroupId:'GRP-MAINT',manufacturer:'Grundfos',model:'CR 32-4',serial:'GF-88214',warrantyExpiry:'2027-06-10',commissioned:'2021-06-11',bom:['PRT-1','PRT-2'],offlineSince:new Date(Date.now()-2*3600000).toISOString(),downtimeReason:'Mechanical seal leakage'},
    {id:'MIX-03',code:'MX-03',name:'Digester Mixer 03',type:'Equipment',parentId:'FAC-OPS',siteId:'SITE-GH',category:'Mixer',criticality:'A',condition:'Healthy',operatingState:'Online',location:'Digester 3',ownerUserId:'U-2',ownerGroupId:'GRP-MAINT',manufacturer:'SEW',model:'X3KR',serial:'SEW-33091',warrantyExpiry:'',commissioned:'2022-01-19',bom:['PRT-3']},
    {id:'CHP-01',code:'CHP-01',name:'CHP Unit 01',type:'Equipment',parentId:'FAC-OPS',siteId:'SITE-GH',category:'CHP',criticality:'A',condition:'Healthy',operatingState:'Online',location:'Power house',ownerUserId:'U-3',ownerGroupId:'GRP-MAINT',manufacturer:'2G',model:'agenitor 408',serial:'2G-49811',warrantyExpiry:'2026-12-31',commissioned:'2020-09-04',bom:['PRT-4','PRT-5']},
    {id:'DEW-01',code:'DW-01',name:'Sludge Dewatering Press',type:'Equipment',parentId:'FAC-OPS',siteId:'SITE-GH',category:'Dewatering',criticality:'A',condition:'Attention',operatingState:'Online',location:'Dewatering bay',ownerUserId:'U-2',ownerGroupId:'GRP-MAINT',manufacturer:'Huber',model:'Q-PRESS',serial:'HQP-1208',warrantyExpiry:'',commissioned:'2021-11-02',bom:['PRT-6']},
    {id:'TOOL-01',code:'A150',name:'Compost Thermometer #1',type:'Tool',parentId:'FAC-OPS',siteId:'SITE-GH',category:'Instrument',criticality:'C',condition:'Healthy',operatingState:'Online',location:'Operations store',ownerUserId:'U-4',ownerGroupId:'GRP-STORES',manufacturer:'REOTEMP',model:'48in',serial:'CT-150',warrantyExpiry:'',commissioned:'2023-05-20',bom:[]}
  ],
  meters:[
    {id:'MTR-1',assetId:'P-201',name:'Run hours',unit:'h',current:1240,readings:[{value:1210,at:day(-16)},{value:1240,at:day(-2)}]},
    {id:'MTR-2',assetId:'CHP-01',name:'Run hours',unit:'h',current:9850,readings:[{value:9725,at:day(-12)},{value:9850,at:day(-1)}]},
    {id:'MTR-3',assetId:'DEW-01',name:'Operating hours',unit:'h',current:3375,readings:[{value:3321,at:day(-15)},{value:3375,at:day(-3)}]}
  ],
  vendors:[
    {id:'VEN-1',name:'Ghana Industrial Supplies',contact:'Nana Boateng',phone:'+233 24 555 0184',email:'orders@gis.example',status:'Active'},
    {id:'VEN-2',name:'PumpTech Ghana',contact:'Esi Amankwah',phone:'+233 30 255 0412',email:'service@pumptech.example',status:'Active'},
    {id:'VEN-3',name:'PowerCare Engineering',contact:'Yaw Asante',phone:'+233 20 555 0971',email:'parts@powercare.example',status:'Active'}
  ],
  parts:[
    {id:'PRT-1',code:'BRG-6205',name:'Bearing 6205-2RS',category:'Bearing',uom:'ea',unitCost:88,vendorId:'VEN-1',min:4,max:16,reorderQty:8,locations:[{storeId:'STORE-MAIN',bin:'Bin 08',onHand:8}],barcode:'BRG6205'},
    {id:'PRT-2',code:'MS-40-SS',name:'Pump mechanical seal',category:'Seal',uom:'ea',unitCost:320,vendorId:'VEN-2',min:2,max:8,reorderQty:4,locations:[{storeId:'STORE-MAIN',bin:'Bin 12',onHand:1}],barcode:'MS40SS'},
    {id:'PRT-3',code:'OIL-EP220',name:'Gear oil EP 220',category:'Lubricant',uom:'L',unitCost:46,vendorId:'VEN-1',min:8,max:30,reorderQty:12,locations:[{storeId:'STORE-MAIN',bin:'Bay 2',onHand:18}],barcode:'OILEP220'},
    {id:'PRT-4',code:'FLT-G4-20',name:'CHP cabinet filter mat',category:'Filter',uom:'ea',unitCost:27,vendorId:'VEN-3',min:5,max:12,reorderQty:8,locations:[{storeId:'STORE-CHP',bin:'Shelf 5',onHand:3}],barcode:'FLTG420'},
    {id:'PRT-5',code:'SPK-2G-408',name:'CHP spark plug',category:'Engine',uom:'ea',unitCost:112,vendorId:'VEN-3',min:6,max:18,reorderQty:12,locations:[{storeId:'STORE-CHP',bin:'Bin 2',onHand:6}],barcode:'SPK2G408'},
    {id:'PRT-6',code:'BLT-B72',name:'Drive belt B-72',category:'Drive',uom:'ea',unitCost:95,vendorId:'VEN-1',min:3,max:10,reorderQty:6,locations:[{storeId:'STORE-MAIN',bin:'Rack 3',onHand:1}],barcode:'BLTB72'}
  ],
  stockTransactions:[
    {id:'TX-1',partId:'PRT-2',type:'Receipt',qty:2,storeId:'STORE-MAIN',bin:'Bin 12',reference:'DN-4481',workOrderId:null,at:day(-5),userId:'U-4',note:'Supplier delivery'},
    {id:'TX-2',partId:'PRT-6',type:'Adjustment',qty:-1,storeId:'STORE-MAIN',bin:'Rack 3',reference:'CNT-31',workOrderId:null,at:day(-2),userId:'U-4',note:'Damaged belt removed'}
  ],
  cycleCounts:[
    {id:'CNT-31',partId:'PRT-6',storeId:'STORE-MAIN',bin:'Rack 3',expected:2,counted:1,variance:-1,status:'Posted',at:day(-2),userId:'U-4',note:'One damaged belt removed'}
  ],
  purchaseRequests:[
    {id:'PR-103',partId:'PRT-2',requestedQty:4,status:'Open',source:'Auto reorder',reason:'Below minimum stock',createdAt:day(0),createdBy:'SYSTEM'},
    {id:'PR-102',partId:'PRT-4',requestedQty:8,status:'Open',source:'Auto reorder',reason:'Below minimum stock',createdAt:day(-1),createdBy:'SYSTEM'},
    {id:'PR-101',partId:'PRT-6',requestedQty:6,status:'Approved',source:'Cycle count',reason:'Below minimum stock after count',createdAt:day(-2),createdBy:'U-4',approvedBy:'U-1'}
  ],
  purchaseOrders:[
    {id:'PO-2026',vendorId:'VEN-3',status:'Ordered',createdAt:day(-3),expectedDate:day(6),lines:[{partId:'PRT-4',qty:8,unitCost:27}],sourceRequestIds:['PR-102']}
  ],
  toolCrib:[
    {id:'TL-1',code:'TOOL-TQ01',name:'Torque wrench 20–200 Nm',status:'Checked out',holderUserId:'U-2',dueBack:day(1),storeId:'STORE-MAIN'},
    {id:'TL-2',code:'TOOL-IR01',name:'Infrared thermometer',status:'Available',holderUserId:null,dueBack:null,storeId:'STORE-MAIN'}
  ],
  workOrders:[
    {id:'WO-2407',title:'Repair feed pump seal leakage',assetIds:['P-201'],type:'Corrective',priority:'Critical',status:'In Progress',assigneeIds:['U-2','U-3'],due:day(0),estimateHours:3,actualHours:1.25,source:'Asset downtime',instructions:'Apply LOTO, replace mechanical seal, inspect coupling and confirm vibration before return to service.',tasks:[{id:'T-1',text:'Apply isolation and verify zero energy',type:'General',status:'Done'},{id:'T-2',text:'Replace mechanical seal',type:'General',status:'In Progress'},{id:'T-3',text:'Inspect coupling alignment',type:'Inspection',status:'Todo'}],parts:[{partId:'PRT-2',planned:1,actual:0}],createdAt:day(-1),completedAt:null,history:[{at:day(-1),text:'Created from asset downtime event'},{at:iso(),text:'Started by Kwame Mensah'}]},
    {id:'WO-2406',title:'Monthly CHP inspection',assetIds:['CHP-01'],type:'Preventive',priority:'High',status:'Open',assigneeIds:['U-3'],due:day(2),estimateHours:2,actualHours:0,source:'PM-104',instructions:'Complete monthly inspection checklist and record run hours.',tasks:[{id:'T-4',text:'Inspect ignition and cooling system',type:'Inspection',status:'Todo'},{id:'T-5',text:'Record engine hours',type:'Meter',status:'Todo'}],parts:[{partId:'PRT-4',planned:2,actual:0}],createdAt:day(-3),completedAt:null,history:[]},
    {id:'WO-2398',title:'Lubricate mixer bearings',assetIds:['MIX-03'],type:'Preventive',priority:'Medium',status:'Completed',assigneeIds:['U-2'],due:day(-8),estimateHours:1,actualHours:.9,source:'PM-102',instructions:'Lubricate bearing points and inspect gearbox.',tasks:[{id:'T-6',text:'Lubricate bearing points',type:'General',status:'Done'}],parts:[{partId:'PRT-3',planned:1,actual:1}],createdAt:day(-12),completedAt:day(-8),history:[{at:day(-8),text:'Completed by Kwame Mensah'}]}
  ],
  scheduledMaintenance:[
    {id:'PM-101',name:'Feed pump monthly service',assetId:'P-201',status:'Active',triggerType:'Time',trigger:'Every 30 days',nextDue:day(18),lastGenerated:day(-12),taskTemplate:['Apply isolation','Inspect mechanical seal','Clean suction screen'],requiredParts:[{partId:'PRT-2',qty:1}]},
    {id:'PM-102',name:'Mixer bearing service',assetId:'MIX-03',status:'Active',triggerType:'Time',trigger:'Every 30 days',nextDue:day(22),lastGenerated:day(-8),taskTemplate:['Lubricate bearing points','Inspect gearbox'],requiredParts:[{partId:'PRT-3',qty:1}]},
    {id:'PM-104',name:'CHP 10,000-hour service',assetId:'CHP-01',status:'Active',triggerType:'Meter',trigger:'Every 500 h',nextDue:'10,000 h',lastGenerated:day(-90),taskTemplate:['Inspect ignition system','Inspect cooling system','Record run hours'],requiredParts:[{partId:'PRT-4',qty:2},{partId:'PRT-5',qty:4}]}
  ],
  requests:[
    {id:'REQ-81',assetId:'DEW-01',summary:'Belt tracking toward left side during operation',urgency:'Urgent',requester:'Kojo Arthur',createdAt:iso(),status:'Requested'},
    {id:'REQ-80',assetId:'FAC-OPS',summary:'Air conditioner making intermittent rattling noise',urgency:'Normal',requester:'Laboratory',createdAt:day(-1),status:'Requested'}
  ],
  downtime:[
    {id:'DT-1',assetId:'P-201',startedAt:new Date(Date.now()-2*3600000).toISOString(),endedAt:null,reasonCode:'Mechanical',reason:'Mechanical seal leakage',workOrderId:'WO-2407',reportedBy:'U-1'}
  ],
  assetEvents:[
    {id:'AE-1',assetId:'P-201',type:'State change',at:new Date(Date.now()-2*3600000).toISOString(),userId:'U-1',detail:'Set Offline — Mechanical seal leakage'},
    {id:'AE-2',assetId:'MIX-03',type:'Work completed',at:day(-8),userId:'U-2',detail:'WO-2398 completed'}
  ],
  notificationRules:[
    {id:'NR-1',event:'Asset taken offline',audiences:['Operations manager','Maintenance planner','Asset owner','Active WO assignees'],inApp:true,email:true},
    {id:'NR-2',event:'Asset returned online',audiences:['Operations manager','Maintenance planner','Asset owner','Active WO assignees'],inApp:true,email:true},
    {id:'NR-3',event:'Stock below minimum',audiences:['Storekeeper','Procurement','Maintenance planner'],inApp:true,email:true},
    {id:'NR-4',event:'Work order assigned',audiences:['Assigned users'],inApp:true,email:true},
    {id:'NR-5',event:'Purchase request created',audiences:['Procurement','Operations manager'],inApp:true,email:true}
  ],
  notifications:[
    {id:'N-1',userId:'U-1',event:'Asset taken offline',title:'P-201 is Offline',message:'Digester Feed Pump 02 was taken offline: Mechanical seal leakage.',createdAt:new Date(Date.now()-2*3600000).toISOString(),read:false,relatedId:'P-201'},
    {id:'N-2',userId:'U-1',event:'Stock below minimum',title:'Low stock: Pump mechanical seal',message:'MS-40-SS has 1 ea on hand; minimum is 2.',createdAt:day(-1),read:false,relatedId:'PRT-2'}
  ],
  mailOutbox:[
    {id:'MAIL-1',to:'abena.sarpong@safisana.org',subject:'[SafiMaintain] P-201 is Offline',body:'Digester Feed Pump 02 was taken offline: Mechanical seal leakage.',createdAt:new Date(Date.now()-2*3600000).toISOString(),status:'Queued locally'}
  ],
  audit:[
    {id:'AUD-1',at:new Date(Date.now()-2*3600000).toISOString(),userId:'U-1',action:'ASSET_STATE_CHANGE',entity:'P-201',detail:'Online → Offline; Mechanical seal leakage'},
    {id:'AUD-2',at:day(-2),userId:'U-4',action:'CYCLE_COUNT_POSTED',entity:'CNT-31',detail:'BLT-B72 variance -1'}
  ],
  security:{
    requireMfa:true,
    sessionTimeoutMinutes:30,
    ssoMode:'Not configured',
    ipRestrictionMode:'Backend required',
    auditRetentionDays:365,
    passwordPolicy:'Backend required'
  }
};
