import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
const [major,minor]=process.versions.node.split('.').map(Number);
if(major!==24||minor<12)throw Error('Use Node >=24.12 and <25 for this release.');
const base=resolve(process.env.AUTH_DATA_DIR??'server/data');mkdirSync(base,{recursive:true,mode:0o700});const directory=mkdtempSync(join(base,'.readiness-'));
try{const db=new DatabaseSync(join(directory,'probe.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE readiness(value INTEGER); INSERT INTO readiness VALUES(1)');if(db.prepare('SELECT value FROM readiness').get().value!==1)throw Error('SQLite write/read failed');db.close();console.log('OK: Node compatible, node:sqlite available, private data directory writable, SQLite WAL read/write works. Existing databases unchanged.');}finally{rmSync(directory,{recursive:true,force:true});}
