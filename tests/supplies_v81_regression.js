'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-supplies-v81.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-supplies-v81.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');
const config=fs.readFileSync('dist/assets/safimaint-00-config.js','utf8');

// Current Fiix v6 interaction patterns are applied to the stock-first list.
for(const control of ['Search','Filters','Customize view'])assert.match(source,new RegExp(control));
assert.match(source,/data-s81-sort/);
assert.match(source,/s81HiddenColumns/);
assert.match(source,/data-s81-page-size/);
assert.match(source,/Previous page/);
assert.match(source,/Next page/);
assert.match(source,/localeCompare/);

// The selected part remains an operational record, not a decorative dashboard.
for(const metric of ['On hand','Minimum \/ maximum','Preferred supplier','Inventory value'])assert.match(source,new RegExp(metric));
assert.match(source,/Across .* active location/);
assert.match(source,/Editable record/);

// SafiMaintain stays focused on stock taking and does not add PO creation.
assert.doesNotMatch(source,/Create purchase order/i);
assert.doesNotMatch(source,/New purchase order/i);

// The visual system is modern, responsive and motion-accessible.
assert.match(css,/--s81-blue:/);
assert.match(css,/\.s81-list-controls/);
assert.match(css,/\.s81-pagination/);
assert.match(css,/\.s81-record-summary/);
assert.match(css,/@media\(max-width:720px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);

assert.match(index,/safimaint-supplies-v81\.css\?v=81/);
assert.match(index,/safimaint-supplies-v81\.js\?v=81/);
assert.match(worker,/const CACHE='safimaint-supplies-v81'/);
assert.match(worker,/safimaint-supplies-v81\.css/);
assert.match(worker,/safimaint-supplies-v81\.js/);
assert.match(config,/9\.7\.0-current-fiix-supplies/);

console.log('Supplies v81 current Fiix-informed list and record checks passed.');
