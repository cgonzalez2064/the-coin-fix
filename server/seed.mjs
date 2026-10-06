import {randomUUID} from 'node:crypto';
import {openStore} from './store.mjs';
import {hashPassword,checkPassword} from './crypto.mjs';
const email=process.env.DEMO_EMAIL?.trim().toLowerCase(),password=process.env.DEMO_PASSWORD;
if(!email||!password)throw Error('Set DEMO_EMAIL and DEMO_PASSWORD only in the server environment.');
if(process.env.NODE_ENV==='production'&&password.length<15)throw Error('Production bootstrap requires at least 15 characters. Never copy the demo database.');
const {db}=openStore();
const existing=db.prepare('SELECT id,password FROM users WHERE email=?').get(email);
if(existing){if(!existing.password.startsWith('scrypt-v2:')&&await checkPassword(password,existing.password)){db.prepare('UPDATE users SET password=? WHERE id=?').run(await hashPassword(password),existing.id);console.log('Local password hash upgraded; credential unchanged.');}else console.log('Local account already exists; no credentials changed.');}
else{db.prepare('INSERT INTO users(id,email,password,owner) VALUES(?,?,?,1)').run(randomUUID(),email,await hashPassword(password));console.log('Local owner account created.');}
db.close();
