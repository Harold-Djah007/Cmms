'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-stock-first.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-stock-first.css','utf8');
const flux=fs.readFileSync('dist/assets/safimaint-flux-v71.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');

assert.match(source,/Operations inventory · live/);
assert.match(source,/Stockroom overview/);
assert.match(source,/function renderStockroom/);
assert.match(source,/function renderReorderList/);
assert.match(source,/SafiMaintain does not create purchase orders/);
assert.match(source,/blockedRoutes=new Set\(\['purchase-orders','rfqs','purchase-analytics','purchase-settings'\]\)/);
assert.match(source,/data-motion="'\+motion\+'"/);
assert.match(source,/sf-kpi-motion/);
assert.doesNotMatch(source,/title:'Create purchase order'/);
assert.doesNotMatch(source,/data-po-from-pr=/);

assert.match(css,/@keyframes sfScan/);
assert.match(css,/@keyframes sfConveyor/);
assert.match(css,/@keyframes sfAmbient/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/\[data-action="manual-po"\]/);
assert.match(index,/safimaint-stock-first\.css\?v=70/);
assert.match(index,/safimaint-stock-first\.js\?v=70/);
assert.match(index,/safimaint-flux-v71\.css\?v=71/);
assert.match(worker,/const CACHE='safimaint-flux-v71'/);
assert.match(worker,/safimaint-flux-v71\.css/);
assert.match(flux,/\.sf-kpi\[data-motion="stock"\]/);
assert.match(flux,/\.sf-kpi\[data-motion="alert"\]/);
assert.match(flux,/\.sf-kpi\[data-motion="count"\]/);
assert.match(flux,/\.sf-kpi\[data-motion="work"\]/);
assert.match(flux,/@keyframes sfFluxGrid/);
assert.match(flux,/@keyframes sfParcelA/);
assert.match(flux,/@keyframes sfCountScan/);
assert.match(flux,/@keyframes sfGearTurn/);
assert.match(flux,/@media\(prefers-reduced-motion:reduce\)/);

console.log('Stock-first redesign regression checks passed.');
