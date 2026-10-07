'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const state={workOrders:[
  {id:'late',status:'Open',due:'2026-10-05',assigneeIds:['U1']},
  {id:'today',status:'Open',due:'2026-10-06',assigneeIds:[],groupIds:['G1']},
  {id:'later',status:'Open',due:'2026-10-07',assigneeIds:[]},
  {id:'closed',status:'Resolved',due:'2026-10-04',assigneeIds:['U1']},
  {id:'cancelled',status:'Cancelled',due:'2026-10-03'}],
  assets:[{id:'A1',operatingState:'Offline'},{id:'A2',operatingState:'Online'}],
  parts:[{id:'P1',min:2,locations:[{onHand:1},{onHand:100,active:false}]},{id:'P2',min:2,locations:[{onHand:3}]}],
  requests:[{status:'Requested'},{status:'Accepted'}],
  scheduledMaintenance:[{id:'ready',status:'Active'},{id:'paused',status:'Paused'},{id:'waiting',status:'Active',awaitingCompletionWorkOrderId:'late'}]};
const context={state,ui:{},CURRENT_USER:'U1',day:()=> '2026-10-06',routeTitle:()=> 'Workspace',render(){},renderDashboard(){},safiPmReady:()=>true,document:{addEventListener(){}},window:{safiPmReady:()=>true,safiWorkStatusControl:w=>['Resolved','Cancelled'].includes(w.status)?'CLOSED':'ACTIVE'}};
vm.createContext(context);vm.runInContext(fs.readFileSync('dist/assets/safimaint-maintenance-workspace.js','utf8'),context);
const result=context.window.safiMaintenanceOverview();
const ids=key=>Array.from(result[key],r=>r.id);
assert.deepEqual(ids('open'),['late','today','later']);assert.deepEqual(ids('overdue'),['late']);
assert.deepEqual(ids('dueToday'),['today']);assert.deepEqual(ids('mine'),['late']);
assert.deepEqual(ids('unassigned'),['later']);assert.deepEqual(ids('low'),['P1']);
assert.deepEqual(ids('offline'),['A1']);assert.deepEqual(ids('plans'),['ready']);
assert.equal(result.requests.length,1);
state.workOrders=[];state.parts=[];
assert.equal(context.window.safiMaintenanceOverview().open.length,0);
assert.equal(context.window.safiMaintenanceOverview().low.length,0);
console.log('Maintenance queues exclude closed work, include group assignments, and ignore inactive stock.');
