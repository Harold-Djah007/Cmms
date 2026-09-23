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
assert.match(index,/safimaint-stock-first\.css\?v=74/);
assert.match(index,/safimaint-stock-first\.js\?v=76/);
assert.match(index,/safimaint-flux-v71\.css\?v=76/);
assert.match(worker,/const CACHE='safimaint-supplies-v79'/);
assert.match(worker,/safimaint-flux-v71\.css/);
assert.match(worker,/safimaint-asset-record-v72\.(css|js)/);
assert.match(flux,/\.sf-kpi\[data-motion="stock"\]/);
assert.match(flux,/\.sf-kpi\[data-motion="alert"\]/);
assert.match(flux,/\.sf-kpi\[data-motion="count"\]/);
assert.match(flux,/\.sf-kpi\[data-motion="work"\]/);
assert.match(flux,/font-size:14px/);
assert.match(flux,/@keyframes sfFluxGrid/);
assert.match(flux,/@keyframes sfParcelA/);
assert.match(flux,/@keyframes sfCountScan/);
assert.match(flux,/@keyframes sfGearTurn/);
assert.match(flux,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(source,/return ui\.route===route/);
assert.match(source,/aria-current="page"/);
assert.match(source,/dataset\.activeRoute/);
assert.match(source,/scrollIntoView\(\{block:'nearest'/);
assert.match(source,/aria-label','Primary navigation'/);
assert.doesNotMatch(source,/if\(route==='inventory'\)return \[/);
assert.match(flux,/height:calc\(100dvh - 20px\)/);
assert.match(flux,/scrollbar-gutter:stable/);
assert.match(flux,/overscroll-behavior:contain/);
assert.match(flux,/\.sidebar-foot\{[^}]*flex:0 0 auto/);

console.log('Stock-first redesign regression checks passed.');
