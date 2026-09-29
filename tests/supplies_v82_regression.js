'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-fiix-supplies-v82.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-fiix-supplies-v82.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');
const config=fs.readFileSync('dist/assets/safimaint-00-config.js','utf8');

// The rail matches Fiix's compact module architecture without the old promotional clutter.
for(const label of ['Dashboard','Work orders','Notifications','Assets','Supplies','Reports','Settings'])assert.match(source,new RegExp(label));
for(const child of ['Parts & supplies','Current stock','Batch stock adjustment','Inventory cycle count','Bill of materials groups','Businesses'])assert.match(source,new RegExp(child));
assert.doesNotMatch(source,/Stock control centre/);
assert.doesNotMatch(source,/Daily operations/);
assert.doesNotMatch(source,/Visibility/);
assert.doesNotMatch(source,/People & teams/);

// The list is a location-grouped operational register with familiar toolbar actions.
for(const action of ['New','Import','Export','Print','Print tags','More'])assert.match(source,new RegExp(action));
for(const column of ['Location','Name','Code','On hand','Status'])assert.match(source,new RegExp(column));
assert.match(source,/Grouped by stock location/);
assert.match(source,/data-s82-toggle-store/);
assert.match(source,/data-s82-open-part/);
assert.match(source,/data-s82-category/);
assert.match(source,/data-s82-search/);

// Existing stock-first boundaries stay intact.
assert.match(source,/ui\.s80SupplyMode='record'/);
assert.match(source,/data-route=\"counts\"/);
assert.doesNotMatch(source,/Create purchase order/i);
assert.doesNotMatch(source,/New purchase order/i);

assert.match(css,/grid-template-columns:218px/);
assert.match(css,/\.s82-nav-item/);
assert.match(css,/\.s82-register/);
assert.match(css,/\.s82-table/);
assert.match(css,/@media\(max-width:900px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);

assert.match(index,/safimaint-fiix-supplies-v82\.css\?v=82/);
assert.match(index,/safimaint-fiix-supplies-v82\.js\?v=82/);
assert.match(worker,/const CACHE='safimaint-supplies-v82'/);
assert.match(worker,/safimaint-fiix-supplies-v82\.css/);
assert.match(worker,/safimaint-fiix-supplies-v82\.js/);
assert.match(config,/9\.8\.0-fiix-register-shell/);

console.log('Supplies v82 compact Fiix register and navigation checks passed.');
