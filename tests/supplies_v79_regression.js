'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-supplies-v79.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-supplies-v79.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');
const config=fs.readFileSync('dist/assets/safimaint-00-config.js','utf8');

// Supplies is a first-class module with familiar Fiix information architecture.
assert.match(source,/Parts & supplies/);
assert.match(source,/Current stock/);
assert.match(source,/Batch stock adjustment/);
assert.match(source,/Cycle counts/);
assert.match(source,/Stock history/);
assert.match(source,/BOM groups/);
assert.match(source,/Businesses/);

// The parent is a disclosure, not a route. Only an exact child can be current.
assert.match(source,/data-s79-supplies-toggle/);
assert.match(source,/aria-current="page"/);
assert.doesNotMatch(source,/data-route="supplies"/);
assert.match(source,/const active=ui\.route===route/);

// Stock-taking workflows are functional and append adjustments through postStock.
assert.match(source,/data-s79-batch-row/);
assert.match(source,/postStock\(p\.id,'Adjustment',desired-before/);
assert.match(source,/qtyBefore/);
assert.match(source,/data-v66-open-location/);
assert.match(source,/data-stock-move/);
assert.match(source,/data-count-part/);

// The part record contains the connected areas without adding PO creation.
for(const tab of ['Stock','Cycle count','BOMs','Businesses','Files','Custom','History'])assert.match(source,new RegExp("'"+tab+"'"));
assert.match(source,/SafiQR\.svg/);
assert.match(source,/SafiFiles\.add\('part'/);
assert.doesNotMatch(source,/Create purchase order/i);
assert.doesNotMatch(source,/New purchase order/i);

assert.match(css,/\.s79-supplies-workspace\{display:grid/);
assert.match(css,/\.s79-nav-group/);
assert.match(css,/\.s79-nav-item\.child\.active/);
assert.match(css,/@media\(max-width:650px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);

assert.match(index,/safimaint-supplies-v79\.css\?v=79/);
assert.match(index,/safimaint-supplies-v79\.js\?v=79/);
assert.match(worker,/const CACHE='safimaint-supplies-v79'/);
assert.match(worker,/safimaint-supplies-v79\.css/);
assert.match(worker,/safimaint-supplies-v79\.js/);
assert.match(config,/9\.5\.0-supplies-workspace/);

console.log('Supplies v79 navigation, records and stock-taking checks passed.');
