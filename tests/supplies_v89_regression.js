'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/assets/safimaint-fiix-supplies-v89.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');
const v80=fs.readFileSync('dist/assets/safimaint-supplies-v80.js','utf8');

assert.match(index,/safimaint-fiix-supplies-v89\.css\?v=89/);
assert.match(worker,/safimaint-fiix-supplies-v89\.css/);
assert.match(css,/Fiix-familiar Parts & Supplies polish/);
assert.match(css,/\.s80-commandbar/);
assert.match(css,/\.s80-record-actions/);
assert.match(css,/\.s80-record-heading/);
assert.match(css,/\.s80-tabs/);
assert.match(css,/\.s80-stock-grid/);
for(const label of ['Parts list','Current stock','Stock history','Stock levels per location','Cycle Count','BOMs','Businesses','Receipts','Files','Custom','Log']) assert.match(v80,new RegExp(label));
assert.match(worker,/const CACHE='safimaint-fiix-supplies-v90'/);
console.log('Fiix-familiar Supplies v89 checks passed.');
