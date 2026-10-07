'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('dist/index.html','utf8');
const source=fs.readFileSync('dist/service-worker.js','utf8');
const listeners={},cached=[];
const self={location:{origin:'https://safi.test',href:'https://safi.test/service-worker.js'},addEventListener:(name,fn)=>listeners[name]=fn};
vm.runInNewContext(source,{self,URL,caches:{},fetch(){}});
const shell=vm.runInNewContext(source+';APP_SHELL',{self,URL});
for(const match of html.matchAll(/(?:src|href)="(assets\/[^"?]+)(?:\?[^"\s]*)?"/g)){
  assert.ok(fs.existsSync('dist/'+match[1]),'Missing loaded asset '+match[1]);
  assert.ok(shell.includes('./'+match[1]),'Loaded asset missing from offline shell '+match[1]);
}
for(const url of ['https://safi.test/api/health','https://safi.test/api/v1/state','https://safi.test/api/v1/attachments/file/ATT1','https://other.test/map','https://safi.test/private-file']){
  listeners.fetch({request:{url,method:'GET',mode:'cors'},respondWith:()=>cached.push(url)});
}
assert.deepEqual(cached,[],'API and external responses must bypass the cache');
assert.match(source,/startsWith\('safimaint-'\)/,'Only this app may delete its old caches');
assert.match(fs.readFileSync('dist/assets/safimaint-00-config.js','utf8'),/const APP_VERSION = '[^']+'/);
console.log('Current app wiring and private-data cache isolation checks passed.');
