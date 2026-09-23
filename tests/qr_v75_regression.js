'use strict';

const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');

const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('dist/assets/safimaint-qr-v75.js','utf8'),context);

const qr=context.window.SafiQR;
assert.ok(qr,'QR encoder should be exposed');
assert.equal(qr.version,3);

const matrix=qr.matrix('CHP');
assert.equal(matrix.length,29);
assert.ok(matrix.every(row=>row.length===29));
assert.ok(matrix.every(row=>row.every(cell=>typeof cell==='boolean')));

// Three finder centres and the version-3 alignment centre must be dark.
assert.equal(matrix[3][3],true);
assert.equal(matrix[3][25],true);
assert.equal(matrix[25][3],true);
assert.equal(matrix[22][22],true);

const fingerprint=crypto.createHash('sha256').update(matrix.map(row=>row.map(v=>v?'1':'0').join('')).join('\n')).digest('hex');
assert.equal(fingerprint,'c5a5493bcc9edf5b609233485310f07f81afd2971e93645c8109e2cdea4fafa3');

const svg=qr.svg('CHP','CHP');
assert.match(svg,/^<svg/);
assert.match(svg,/viewBox="0 0 37 37"/);
assert.match(svg,/aria-label="QR code for CHP"/);
assert.match(svg,/<path fill="#071522"/);
assert.throws(()=>qr.matrix('X'.repeat(54)),/capacity/);

console.log('Functional QR v75 regression checks passed.');
