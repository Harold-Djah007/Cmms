'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-supplies-v80.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-supplies-v80.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');
const config=fs.readFileSync('dist/assets/safimaint-00-config.js','utf8');

// The default is a compact Fiix-familiar list, not the old split-pane dashboard.
assert.match(source,/s80-list-table/);
assert.match(source,/Parts and supplies/);
assert.match(source,/data-s80-open-part/);
assert.match(source,/Back to parts/);
assert.doesNotMatch(source,/s80-overview/);

// A selected item becomes one full editable record with familiar sections.
for(const section of ['Stock','Cycle Count','BOMs','Businesses','Receipts','Files','Custom','Log'])assert.match(source,new RegExp("'"+section+"'"));
for(const field of ['Account','Charge department','Inventory code','UNSPSC code','Barcode','Make','Model','Last price','Preferred supplier','Notes'])assert.match(source,new RegExp(field));
assert.match(source,/data-s80-save/);
assert.match(source,/PART_UPDATED/);
assert.match(source,/data-s80-duplicate/);

// Stock taking remains the primary workflow and purchasing creation is absent.
assert.match(source,/Stock levels per location/);
assert.match(source,/Qty on hand/);
assert.match(source,/Min qty/);
assert.match(source,/Max qty/);
assert.match(source,/data-v66-add-location/);
assert.match(source,/data-v66-open-location/);
assert.match(source,/data-count-part/);
assert.match(source,/data-stock-move/);
assert.doesNotMatch(source,/Create purchase order/i);
assert.doesNotMatch(source,/New purchase order/i);

// QR, files, responsive behavior and cache activation stay wired.
assert.match(source,/SafiQR\.svg/);
assert.match(source,/SafiFiles\.add\('part'/);
assert.match(css,/\.s80-record-actions/);
assert.match(css,/\.s80-tabs/);
assert.match(css,/@media\(max-width:720px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(index,/safimaint-supplies-v80\.css\?v=80/);
assert.match(index,/safimaint-supplies-v80\.js\?v=80/);
assert.match(worker,/const CACHE='safimaint-supplies-v80'/);
assert.match(worker,/safimaint-supplies-v80\.css/);
assert.match(worker,/safimaint-supplies-v80\.js/);
assert.match(config,/9\.6\.0-fiix-supplies-records/);

console.log('Supplies v80 Fiix-familiar list, record and stock controls passed.');
