'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-fiix-operating-model-v23.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-assets-v77.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');

assert.match(source,/Asset command centre/);
assert.match(source,/Live asset register/);
assert.match(source,/ax77-metrics/);
assert.match(source,/ax77-pulse/);
assert.match(source,/document\.documentElement\.classList\.add\('fx23-updating'\)/);
assert.match(source,/focus\(\{preventScroll:true\}\)/);
assert.match(source,/window\.scrollTo\(0,y\)/);
assert.match(source,/\['Completed','Closed','Cancelled'\]/);
assert.match(source,/branch\.classList\.add\('is-expanding'\)/);
assert.match(source,/branch\.classList\.add\('is-collapsing'\)/);

assert.match(css,/\.ax77-page\{[^}]*animation:none!important/);
assert.match(css,/html\.fx23-updating/);
assert.match(css,/\.ax77-hero/);
assert.match(css,/\.ax77-page \.fx23-row:hover/);
assert.match(css,/\.ar72-record\{[^}]*animation:none!important/);
assert.match(css,/\.ar72-tabs\{position:sticky/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);

assert.match(index,/safimaint-assets-v77\.css\?v=77/);
assert.match(index,/safimaint-fiix-operating-model-v23\.js\?v=77/);
assert.match(worker,/const CACHE='safimaint-supplies-v81'/);
assert.match(worker,/safimaint-assets-v77\.css/);

console.log('Assets v77 design and stable hierarchy regression checks passed.');
