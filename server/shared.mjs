import {z} from 'zod';
import {snapshotSchema,validateReferences} from '../src/model.ts';
import {randomUUID} from 'node:crypto';
export function initializeShared(db){db.exec(`CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY,owner_id TEXT UNIQUE NOT NULL REFERENCES users(id),revision INTEGER NOT NULL,payload TEXT NOT NULL);CREATE TABLE IF NOT EXISTS workspace_members(workspace_id TEXT NOT NULL REFERENCES workspaces(id),email TEXT UNIQUE NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','contributor','viewer')),PRIMARY KEY(workspace_id,email));`);}
export function membership(db,user){return db.prepare('SELECT w.*,m.role FROM workspace_members m JOIN workspaces w ON w.id=m.workspace_id WHERE m.email=?').get(user.email);}
export function sharedAction(db,user,input){
 const v=z.discriminatedUnion('action',[z.object({action:z.literal('status')}).strict(),z.object({action:z.literal('activate'),snapshot:snapshotSchema}).strict(),z.object({action:z.literal('save'),revision:z.number().int().min(1),snapshot:snapshotSchema}).strict(),z.object({action:z.literal('invite'),email:z.string().trim().toLowerCase().email().max(254),role:z.enum(['admin','contributor','viewer'])}).strict(),z.object({action:z.literal('remove'),email:z.string().trim().toLowerCase().email().max(254)}).strict()]).parse(input);
 let w=membership(db,user);
 const fail=(status,error)=>({status,body:{error}});
 if(v.action==='activate'){
  if(!user.owner||w)return fail(403,'Solo el propietario puede activar un presupuesto compartido.');validateReferences(v.snapshot);
  const id=randomUUID();db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO workspaces VALUES(?,?,1,?)').run(id,user.id,JSON.stringify(v.snapshot));db.prepare('INSERT INTO workspace_members VALUES(?,?,?)').run(id,user.email,'admin');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}w=membership(db,user);
 }
 if(!w)return v.action==='status'?{status:200,body:{workspace:null}}:fail(403,'No tienes acceso al presupuesto compartido.');
 if(['invite','remove'].includes(v.action)){
  if(w.role!=='admin')return fail(403,'Solo un administrador puede gestionar permisos.');
  const owner=db.prepare('SELECT email FROM users WHERE id=?').get(w.owner_id);if(v.email===owner.email)return fail(403,'El propietario conserva siempre el rol administrador.');
  const existing=db.prepare('SELECT * FROM workspace_members WHERE email=?').get(v.email);if(existing&&existing.workspace_id!==w.id)return fail(409,'Este correo ya pertenece a otro presupuesto compartido.');
  if(v.action==='invite')db.prepare('INSERT INTO workspace_members VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET role=excluded.role').run(w.id,v.email,v.role);
  else db.prepare('DELETE FROM workspace_members WHERE workspace_id=? AND email=?').run(w.id,v.email);
 }
 if(v.action==='save'){
  if(v.revision!==w.revision)return fail(409,'El presupuesto cambió en otro dispositivo. Recarga antes de guardar.');validateReferences(v.snapshot);
  const before=JSON.parse(w.payload),next=v.snapshot;
  if(w.role!=='admin'){
   if(JSON.stringify(before.entities)!==JSON.stringify(next.entities)||JSON.stringify(before.events)!==JSON.stringify(next.events)||JSON.stringify(before.settings)!==JSON.stringify(next.settings))return fail(403,'No puedes modificar configuración, categorías ni programación.');
   const previous=new Map(before.transactions.map(t=>[t.id,t]));const added=next.transactions.filter(t=>!previous.has(t.id));
   if(next.transactions.length!==previous.size+added.length||before.transactions.some(t=>JSON.stringify(next.transactions.find(n=>n.id===t.id))!==JSON.stringify(t)))return fail(403,'Solo puedes agregar movimientos, no editar o eliminar.');
   if(added.some(t=>!(w.role==='contributor'?['income','expense']:['expense']).includes(t.type)))return fail(403,'Tipo de movimiento no permitido por tu rol.');
  }
  const result=db.prepare('UPDATE workspaces SET payload=?,revision=revision+1 WHERE id=? AND revision=?').run(JSON.stringify(next),w.id,v.revision);if(!result.changes)return fail(409,'Conflicto de versión.');w=membership(db,user);
 }
 return {status:200,body:{workspace:{id:w.id,role:w.role,revision:w.revision,snapshot:JSON.parse(w.payload),members:w.role==='admin'?db.prepare('SELECT email,role FROM workspace_members WHERE workspace_id=? ORDER BY email').all(w.id):[]}}};
}
