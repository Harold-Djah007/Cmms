'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('dist/assets/safimaint-assets-v78.js','utf8');
const css=fs.readFileSync('dist/assets/safimaint-assets-v78.css','utf8');
const index=fs.readFileSync('dist/index.html','utf8');
const worker=fs.readFileSync('dist/service-worker.js','utf8');
const config=fs.readFileSync('dist/assets/safimaint-00-config.js','utf8');

// The hierarchy is a new asset atlas, not the previous table with another skin.
assert.match(source,/Live plant register/);
assert.match(source,/Plant navigator/);
assert.match(source,/Structure at a glance/);
assert.match(source,/Operational focus/);
assert.match(source,/Traceable history/);
assert.match(source,/Facility → area → equipment → component/);

// Expansion owns only the branch. It must never invoke the global render path.
const toggleBody=source.match(/function toggleBranch\(button\)\{([\s\S]*?)\n  \}/)?.[1]||'';
assert.ok(toggleBody,'toggleBranch must exist');
assert.doesNotMatch(toggleBody,/render\s*\(/);
assert.doesNotMatch(toggleBody,/innerHTML/);
assert.match(toggleBody,/animateBranch\(branch,expanding\)/);
assert.match(source,/branch\.animate\(/);
assert.match(source,/branch\.hidden=!expand/);
assert.match(source,/focus\(\{preventScroll:true\}\)/);

// Desktop shell is fixed; only its navigation body scrolls.
assert.match(css,/@media\(min-width:901px\)/);
assert.match(css,/\.sidebar\{position:fixed!important/);
assert.match(css,/\.workspace\{[^}]*margin-left:296px!important/);
assert.match(css,/\.sidebar #navigation\{[^}]*overflow-y:auto!important/);

// Asset hierarchy and detailed record have distinct, responsive workspaces.
assert.match(css,/\.ax78-workspace\{display:grid/);
assert.match(css,/\.ax78-explorer/);
assert.match(css,/\.ax78-side/);
assert.match(css,/\.ar72-record\{display:grid!important;grid-template-columns:205px/);
assert.match(css,/\.ar72-tabs\{position:sticky!important/);
assert.match(css,/@media\(max-width:700px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);

assert.match(index,/safimaint-assets-v78\.css\?v=78/);
assert.match(index,/safimaint-assets-v78\.js\?v=78/);
assert.match(worker,/const CACHE='safimaint-supplies-v79'/);
assert.match(worker,/safimaint-assets-v78\.css/);
assert.match(worker,/safimaint-assets-v78\.js/);
assert.match(config,/9\.5\.0-supplies-workspace/);

console.log('Assets v78 atlas, stable expansion and fixed navigation checks passed.');
