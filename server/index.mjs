import {createServer} from 'node:http';
import {randomUUID,randomBytes} from 'node:crypto';
import {z} from 'zod';
z.config({jitless:true});
import {initializeShared,sharedAction} from './shared.mjs';
import {openStore} from './store.mjs';
import {token,digest,hashPassword,checkPassword,base32,validStep,encrypt,decrypt} from './crypto.mjs';
export async function createAuthServer({directory,origin=process.env.APP_ORIGIN??'http://127.0.0.1:5175',production=process.env.NODE_ENV==='production'}={}){
 if(production&&(!origin.startsWith('https://')||!process.env.TURNSTILE_SECRET_KEY||!process.env.TURNSTILE_SITE_KEY))throw Error('Production requires HTTPS and Turnstile server/site keys.');
 const {db,key}=openStore(directory);initializeShared(db);const dummy=await hashPassword(token());
 const credentials=z.object({email:z.string().trim().toLowerCase().email().max(254),password:z.string().min(1).max(128),code:z.string().max(64).optional(),challenge:z.string().max(100).optional(),answer:z.string().max(2048).optional()}).strict();
 const publicUser=u=>({id:u.id,email:u.email,owner:!!u.owner,mfa:!!u.mfa});
 function limit(k,max=12){const now=Date.now();const row=db.prepare('SELECT * FROM limits WHERE key=?').get(k);const count=row&&row.expires>now?row.count+1:1;db.prepare('INSERT OR REPLACE INTO limits VALUES(?,?,?)').run(k,count,row&&row.expires>now?row.expires:now+900000);return count<=max;}
 async function captcha(input){
  if(!input.answer||!input.challenge&&!production)return false;
  if(production){const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:input.answer}),signal:AbortSignal.timeout(7000)});const result=await response.json();return result.success===true&&result.hostname===new URL(origin).hostname;}
  const row=db.prepare('DELETE FROM challenges WHERE hash=? RETURNING *').get(digest(input.challenge));return !!row&&row.expires>Date.now()&&row.answer===digest(input.answer.trim());
 }
 function pending(u,stage){const id=token();db.prepare('INSERT INTO pending_auth VALUES(?,?,?,?)').run(digest(id),u.id,stage,Date.now()+300000);return {verification:id,step:stage};}
 function mfa(u,code){if(!u.mfa)return true;const step=validStep(decrypt(u.mfa,key),code,u.last_step);if(step!==null){db.prepare('UPDATE users SET last_step=? WHERE id=?').run(step,u.id);return true;}return !!db.prepare('DELETE FROM recovery WHERE user_id=? AND hash=? RETURNING hash').get(u.id,digest(code));}
 const server=createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"});res.end(JSON.stringify(value));};
  try{
   if(!req.url?.startsWith('/api/auth/')||!['GET','POST'].includes(req.method)){send(404,{error:'Not found'});return;}
   if(req.headers.origin&&req.headers.origin!==origin){send(403,{error:'Origin rejected'});return;}
   const ip=req.socket.remoteAddress??'unknown'; // Never trust arbitrary forwarded IP headers.
   if(!limit('request:'+ip,180)){send(429,{error:'Demasiados intentos. Espera 15 minutos.'});return;}
   const cookie=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('coin_session='))?.slice(13)??'';
   const session=/^[a-f0-9]{64}$/.test(cookie)?db.prepare('SELECT * FROM sessions WHERE hash=? AND expires>?').get(digest(cookie),Date.now()):null;
   const user=session?db.prepare('SELECT * FROM users WHERE id=?').get(session.user_id):null;
   if(req.method==='GET'&&req.url==='/api/auth/session'){send(200,{user:user?publicUser(user):null,csrf:session?.csrf??null});return;}
   if(req.method==='GET'&&req.url==='/api/auth/challenge'){
    if(production){send(200,{siteKey:process.env.TURNSTILE_SITE_KEY,production:true});return;}
    const id=token(),a=randomBytes(1)[0]%9+1,b=randomBytes(1)[0]%9+1;db.prepare('INSERT INTO challenges VALUES(?,?,?)').run(digest(id),digest(String(a+b)),Date.now()+300000);send(200,{id,prompt:`${a} + ${b}`,production:false});return;
   }
   if(req.method!=='POST'||req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json')){send(403,{error:'Request rejected'});return;}
   let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>(req.url==='/api/auth/shared'?5_000_000:8192)){send(413,{error:'Request too large'});return;}}
   const input=JSON.parse(raw);
   const issueSession=u=>{const id=token(),csrf=token(),now=Date.now();db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(digest(id),u.id,csrf,now+8*3600000,now);res.setHeader('Set-Cookie',`coin_session=${id}; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=28800${production?'; Secure':''}`);send(200,{user:publicUser(u),csrf});};
   if(req.url==='/api/auth/verify'){const v=z.object({verification:z.string().regex(/^[a-f0-9]{64}$/),code:z.string().max(64).optional(),challenge:z.string().max(100).optional(),answer:z.string().max(2048).optional()}).strict().parse(input);const ticket=db.prepare('SELECT * FROM pending_auth WHERE hash=? AND expires>?').get(digest(v.verification),Date.now());if(!ticket||!limit('verify:'+digest(v.verification),5)){send(401,{error:'Verificación inválida o vencida. Vuelve a iniciar sesión.'});return;}const u=db.prepare('SELECT * FROM users WHERE id=?').get(ticket.user_id);if(!u){send(401,{error:'Verificación inválida.'});return;}if(ticket.stage==='captcha'){if(!await captcha(v)){send(400,{error:'Verificación CAPTCHA inválida o vencida.'});return;}db.prepare('DELETE FROM pending_auth WHERE hash=?').run(ticket.hash);if(u.mfa){send(200,pending(u,'mfa'));return;}}else{if(!limit('mfa-login:'+u.id,10)||!mfa(u,v.code??'')){send(401,{error:'Código de verificación inválido.'});return;}db.prepare('DELETE FROM pending_auth WHERE hash=?').run(ticket.hash);}issueSession(u);return;}
   if(['/api/auth/login','/api/auth/register'].includes(req.url)){
    const parsed=credentials.safeParse(input);if(!parsed.success){send(400,{error:'Revisa los campos.'});return;}const v=parsed.data;
    if(!limit('login:'+ip,15)||!limit('account:'+digest(v.email),10)){send(429,{error:'Demasiados intentos. Espera 15 minutos.'});return;}
    let u=db.prepare('SELECT * FROM users WHERE email=?').get(v.email);
    if(req.url.endsWith('/register')){
     if(!await captcha(v)){send(400,{error:'Verificación CAPTCHA inválida o vencida.'});return;}
     if(production){send(403,{error:'El registro público requiere verificación de correo; todavía no está habilitado.'});return;}
     if(v.password.length<15){send(400,{error:'Usa una contraseña de al menos 15 caracteres.'});return;}
     if(u){await checkPassword(v.password,dummy);send(400,{error:'No se pudo crear la cuenta.'});return;}
     db.prepare('INSERT INTO users(id,email,password) VALUES(?,?,?)').run(randomUUID(),v.email,await hashPassword(v.password));u=db.prepare('SELECT * FROM users WHERE email=?').get(v.email);
    }else{
     const correct=await checkPassword(v.password,u?.password??dummy);
     if(!u||!correct){send(401,{error:'Credenciales o código de verificación inválidos.'});return;}
     if(!u.password.startsWith('scrypt-v2:'))db.prepare('UPDATE users SET password=? WHERE id=?').run(await hashPassword(v.password),u.id);
     if(!v.answer){send(200,pending(u,'captcha'));return;}
     if(!await captcha(v)){send(400,{error:'Verificación CAPTCHA inválida o vencida.'});return;}
     if(u.mfa&&!v.code){send(200,pending(u,'mfa'));return;}
     if(!mfa(u,v.code??'')){send(401,{error:'Credenciales o código de verificación inválidos.'});return;}
    }
    issueSession(u);return;
   }
   if(!user||req.headers['x-csrf-token']!==session.csrf){send(403,{error:'Sesión inválida. Inicia sesión de nuevo.'});return;}
   if(req.url==='/api/auth/shared'){const result=sharedAction(db,user,input);send(result.status,result.body);return;}
   if(req.url==='/api/auth/logout'){db.prepare('DELETE FROM sessions WHERE hash=?').run(session.hash);res.setHeader('Set-Cookie',`coin_session=; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=0${production?'; Secure':''}`);send(200,{ok:true});return;}
   if(!limit('mfa:'+user.id,10)){send(429,{error:'Demasiados intentos.'});return;}
   if(req.url==='/api/auth/mfa/start'){
    const v=z.object({password:z.string().min(1).max(128)}).strict().parse(input);if(user.mfa||!await checkPassword(v.password,user.password)){send(403,{error:'No se pudo iniciar la configuración.'});return;}
    const secret=base32(randomBytes(20));db.prepare('INSERT OR REPLACE INTO enroll VALUES(?,?,?)').run(user.id,encrypt(secret,key),Date.now()+600000);send(200,{secret,uri:`otpauth://totp/The%20Coin%20Fix:${encodeURIComponent(user.email)}?secret=${secret}&issuer=The%20Coin%20Fix&algorithm=SHA1&digits=6&period=30`});return;
   }
   if(req.url==='/api/auth/mfa/confirm'){
    const v=z.object({code:z.string().regex(/^\d{6}$/)}).strict().parse(input);const pending=db.prepare('SELECT * FROM enroll WHERE user_id=? AND expires>?').get(user.id,Date.now());const step=pending?validStep(decrypt(pending.secret,key),v.code):null;
    if(step===null){send(400,{error:'Código inválido o configuración vencida.'});return;}
    const codes=Array.from({length:8},()=>randomBytes(12).toString('hex'));
    db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET mfa=?,last_step=? WHERE id=?').run(pending.secret,step,user.id);db.prepare('DELETE FROM recovery WHERE user_id=?').run(user.id);for(const c of codes)db.prepare('INSERT INTO recovery VALUES(?,?)').run(user.id,digest(c));db.prepare('DELETE FROM enroll WHERE user_id=?').run(user.id);db.prepare('DELETE FROM sessions WHERE user_id=? AND hash<>?').run(user.id,session.hash);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
    send(200,{codes});return;
   }
   send(404,{error:'Not found'});
  }catch{send(400,{error:'No se pudo completar la solicitud.'});}
 });
 const cleanup=setInterval(()=>{for(const table of ['sessions','challenges','limits','enroll','pending_auth'])db.prepare(`DELETE FROM ${table} WHERE expires<?`).run(Date.now());},60000);cleanup.unref();server.on('close',()=>{clearInterval(cleanup);db.close();});return server;
}
if(import.meta.url===`file://${process.argv[1]}`){const server=await createAuthServer();server.listen(Number(process.env.AUTH_PORT??3001),'127.0.0.1',()=>console.log('Identity server ready on loopback port '+(process.env.AUTH_PORT??3001)));}
