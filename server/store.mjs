import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,writeFileSync,readFileSync,chmodSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
export function openStore(directory=process.env.AUTH_DATA_DIR??'server/data'){
 mkdirSync(directory,{recursive:true,mode:0o700});chmodSync(directory,0o700);
 const keyPath=resolve(directory,'mfa.key');if(!existsSync(keyPath))writeFileSync(keyPath,randomBytes(32),{mode:0o600});const key=readFileSync(keyPath);if(key.length!==32)throw Error('Invalid encryption key');
 const path=resolve(directory,'auth.sqlite');const db=new DatabaseSync(path);chmodSync(path,0o600);db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,owner INTEGER NOT NULL DEFAULT 0,mfa TEXT,last_step INTEGER NOT NULL DEFAULT -1);
 CREATE TABLE IF NOT EXISTS recovery(user_id TEXT NOT NULL REFERENCES users(id),hash TEXT UNIQUE NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS challenges(hash TEXT PRIMARY KEY,answer TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS pending_auth(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),stage TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS enroll(user_id TEXT PRIMARY KEY REFERENCES users(id),secret TEXT NOT NULL,expires INTEGER NOT NULL);`);
 return {db,key};
}
