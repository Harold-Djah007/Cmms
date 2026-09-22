'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-stock-first.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-stock-first.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');

assert.match(source,/Operations inventory · live/);
assert.match(source,/Stockroom overview/);
assert.match(source,/function renderStockroom/);
assert.match(source,/function renderReorderList/);
assert.match(source,/SafiMaintain does not create purchase orders/);
assert.match(source,/blockedRoutes=new Set\(\['purchase-orders','rfqs','purchase-analytics','purchase-settings'\]\)/);
assert.doesNotMatch(source,/title:'Create purchase order'/);
assert.doesNotMatch(source,/data-po-from-pr=/);

assert.match(css,/@keyframes sfScan/);
assert.match(css,/@keyframes sfConveyor/);
assert.match(css,/@keyframes sfAmbient/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/\[data-action="manual-po"\]/);
assert.match(index,/safimaint-stock-first\.css\?v=70/);
assert.match(index,/safimaint-stock-first\.js\?v=70/);
assert.match(worker,/const CACHE='safimaint-stock-first-v70'/);

console.log('Stock-first redesign regression checks passed.');
