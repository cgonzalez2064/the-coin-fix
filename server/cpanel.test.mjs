import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('cPanel CommonJS wrapper starts ESM identity service and creates private SQLite',async()=>{
 const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
 const directory=mkdtempSync(join(tmpdir(),'coin-cpanel-test-'));const child=spawn(process.execPath,['server/cpanel/app.js'],{env:{...process.env,NODE_ENV:'development',PORT:String(port),AUTH_DATA_DIR:directory},stdio:'ignore'});
 try{let response;for(let attempt=0;attempt<40;attempt++){try{response=await fetch(`http://127.0.0.1:${port}/api/auth/session`);break;}catch{await new Promise(resolve=>setTimeout(resolve,50));}}assert.equal(response?.status,200);assert.equal((await response.json()).user,null);}finally{if(child.exitCode===null){const stopped=new Promise(resolve=>child.once('exit',resolve));child.kill();await stopped;}rmSync(directory,{recursive:true,force:true});}
});
