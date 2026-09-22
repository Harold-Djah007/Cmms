'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-asset-record-v72.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-asset-record-v72.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');

for(const label of ['General','Parts / BOM','Meters & events','People','Warranties','Suppliers','Stock history','Files','Custom','Costs','Timeline']){
  assert.match(source,new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
}

assert.match(source,/function editLocation/);
assert.match(source,/function addWarranty/);
assert.match(source,/function manageBusinesses/);
assert.match(source,/function editCustom/);
assert.match(source,/data-toggle-asset/);
assert.match(source,/Print QR tag/);
assert.match(source,/Purchase-order creation is intentionally excluded/);
assert.match(source,/data-local-file-list/);
assert.match(source,/latitude/);
assert.match(source,/longitude/);
assert.match(index,/safimaint-asset-record-v72\.css\?v=72/);
assert.match(index,/safimaint-asset-record-v72\.js\?v=72/);
assert.match(worker,/const CACHE='safimaint-nav-exact-v73'/);
assert.match(worker,/safimaint-asset-record-v72\.css/);
assert.match(worker,/safimaint-asset-record-v72\.js/);
assert.match(css,/@keyframes ar72Orbit/);
assert.match(css,/@keyframes ar72Marker/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/\.ar72-map/);
assert.match(css,/\.ar72-qr/);

console.log('Asset record v72 regression checks passed.');
