'use strict';
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
let failures=0;
for(const file of fs.readdirSync('tests').filter(name=>name.endsWith('.js')&&name!=='run_regressions.js').sort()){
  const result=spawnSync(process.execPath,['tests/'+file],{encoding:'utf8'});
  if(result.status!==0){failures++;console.error('FAIL '+file+'\n'+result.stdout+result.stderr)}
  else console.log('PASS '+file);
}
process.exitCode=failures?1:0;
