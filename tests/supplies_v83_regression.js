'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-fiix-supplies-v83.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-fiix-supplies-v83.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');
const config=fs.readFileSync('dist/assets/safimaint-00-config.js','utf8');

// The rail keeps Fiix's module hierarchy while restoring readable dimensions.
for(const label of ['Dashboard','Work orders','Notifications','Assets','Supplies','Reports','Settings'])assert.match(source,new RegExp(label));
for(const child of ['Parts & supplies','Current stock','Batch adjustment','Cycle counts','Stock history','BOM groups','Businesses'])assert.match(source,new RegExp(child));
assert.match(source,/aria-current="page"/);
assert.match(css,/grid-template-columns:248px/);
assert.match(css,/font-size:13px/);
assert.doesNotMatch(css,/\.s83-nav-group\.contains-active>\.s83-nav-parent\{background/);

// The operational register remains dense, readable and connected to existing stock workflows.
for(const label of ['Stock register','Part / locator','Part number','Category','On hand','Min','Max','Stock status'])assert.match(source,new RegExp(label));
for(const action of ['Stock movement','Cycle count','Add stock item','Import','Export','Print tags'])assert.match(source,new RegExp(action));
assert.match(source,/data-s83-toggle-store/);
assert.match(source,/data-s82-open-part/);
assert.match(source,/data-s82-search/);
assert.match(source,/data-s82-category/);
assert.match(source,/ui\.s80SupplyMode==='record'/);
assert.doesNotMatch(source,/Create purchase order/i);

assert.match(css,/\.s83-page-head/);
assert.match(css,/\.s83-summary/);
assert.match(css,/\.s83-table/);
assert.match(css,/@media\(max-width:900px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);

assert.match(index,/safimaint-fiix-supplies-v83\.css\?v=83/);
assert.match(index,/safimaint-fiix-supplies-v83\.js\?v=83/);
assert.match(worker,/const CACHE='safimaint-fiix-v85'/);
assert.match(worker,/safimaint-fiix-supplies-v83\.css/);
assert.match(worker,/safimaint-fiix-supplies-v83\.js/);
assert.match(config,/9\.9\.1-fiix-desktop-shell/);

console.log('Supplies v83 readable Fiix-familiar shell and register checks passed.');
