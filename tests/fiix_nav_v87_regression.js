'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-fiix-nav-v87.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-fiix-nav-v87.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');
const config=fs.readFileSync('dist/assets/safimaint-00-config.js','utf8');
const stockFirst=fs.readFileSync('dist/assets/safimaint-stock-first.js','utf8');

for(const label of ['Dashboard','Maintenance','Notifications','Assets','Supplies','Purchasing','Reports','Settings']) assert.match(source,new RegExp(label));
for(const label of ['All assets','Facilities','Equipment','Tools','Meters','Downtime']) assert.match(source,new RegExp(label));
for(const label of ['Parts & supplies','Current stock','Batch stock adjustment','Cycle counts','Stock history','BOM groups','Businesses']) assert.match(source,new RegExp(label));
for(const label of ['Work orders','Work requests','Scheduled maintenance','Maintenance calendar']) assert.match(source,new RegExp(label));
assert.match(source,/data-v87-toggle/);
assert.match(source,/aria-expanded/);\nassert.match(source,/ui\.v87Open=current\|\|null/);\nassert.match(source,/ui\.v87Open===key\?null:key/);
assert.match(source,/s79-nav-parent/);
assert.match(source,/s79-nav-children/);
assert.match(css,/Fiix navigation behavior with SafiMaintain visual language/);
assert.match(index,/safimaint-fiix-nav-v87\.css\?v=87/);
assert.match(index,/safimaint-fiix-nav-v87\.js\?v=87/);
assert.match(worker,/const CACHE='safimaint-fiix-supplies-v89'/);
assert.match(worker,/safimaint-fiix-nav-v87\.css/);
assert.match(worker,/safimaint-fiix-nav-v87\.js/);
assert.match(config,/9\.9\.3-fiix-nav-safimaint/);
console.log('Fiix-style expandable navigation v87 checks passed.');
