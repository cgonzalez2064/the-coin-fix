import { z } from 'zod';
z.config({jitless:true});
const isoDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
const money=z.number().finite().min(0).max(1e10);
const text=z.string().trim().min(1).max(160);
export const currency=z.enum(['GTQ','USD']);
export const entitySchema=z.object({id:z.string().uuid(),kind:z.enum(['account','category','recurring','debt','goal']),name:text,enName:text.optional(),budgetOrder:z.number().int().min(0).max(100000).optional(),budgetArea:z.string().trim().min(1).max(80).optional(),installments:z.object({months:z.number().int().min(1).max(600),monthly:z.number().finite().positive().max(1e10),start:isoDate}).strict().optional(),budgetGroup:z.enum(['essential','variable','provision']).optional(),householdMember:z.string().trim().min(1).max(80).optional(),goalType:z.enum(['emergency','savings','investment']).optional(),amount:money,currency,apr:z.number().min(0).max(200).nullable(),minimum:money,minimumUSD:money,day:z.number().int().min(0).max(31),start:isoDate.or(z.literal('')),frequency:z.enum(['monthly','semimonthly','bimonthly']),flow:z.enum(['income','expense']),active:z.boolean(),overdue:z.boolean(),note:z.string().max(2000),categoryId:z.string().uuid().or(z.literal("")).optional(),flexible:z.boolean().optional(),targetId:z.string().uuid().or(z.literal("")).optional(),txType:z.enum(["expense","income","payment"]).optional()}).strict();
export type Entity=z.infer<typeof entitySchema>;
export const txSchema=z.object({id:z.string().uuid(),name:text,type:z.enum(['income','expense','transfer','payment','contribution']),amount:money.positive(),currency,fx:z.number().finite().positive().max(100),date:isoDate,accountId:z.string().uuid(),targetId:z.string().uuid().or(z.literal('')),categoryId:z.string().uuid().or(z.literal('')),member:z.string().trim().min(1).max(80),share:z.number().min(0).max(100),note:z.string().max(2000),recurrenceId:z.string().uuid().or(z.literal("")).optional(),eventId:z.string().max(150).optional()}).strict();
export type Transaction=z.infer<typeof txSchema>;
export const eventSchema=z.object({id:z.string().uuid(),name:text,date:isoDate.or(z.literal('')),amount:money,currency,flow:z.enum(['income','expense']),status:z.enum(['confirmed','pending']),sourceId:z.string().uuid().or(z.literal('')),occurrenceDate:isoDate.optional()}).strict();
export type CashEvent=z.infer<typeof eventSchema>;
export const memberSchema=z.object({name:z.string().trim().min(1).max(80),role:z.enum(['owner','partner','adult','child','pet']),contribution:money}).strict().refine(m=>m.role!=='pet'||m.contribution===0,{message:'Pets cannot contribute income'});
export type HouseholdMember=z.infer<typeof memberSchema>;
export const defaultMembers:HouseholdMember[]=[{name:'Yo',role:'owner',contribution:0}];
export const settingsSchema=z.object({profileName:z.string().trim().min(1).max(80).optional(),language:z.enum(['es','en']),theme:z.enum(['dark','light','midnight','sand','system']),fx:z.number().finite().positive().max(100),fxUpdated:z.string().max(100),fxSource:z.enum(['reference','manual','online']),displayCurrency:currency,autoFx:z.boolean(),areaRevision:z.number().int().min(0).optional(),budgetAreas:z.array(z.string().trim().min(1).max(80)).max(30).refine(a=>new Set(a.map(v=>v.toLowerCase())).size===a.length).optional(),householdAreas:z.array(z.string().trim().min(1).max(80)).max(30).optional(),budgetRevision:z.number().int().min(0).optional(),members:z.array(memberSchema).max(30).refine(a=>new Set(a.map(m=>m.name.toLowerCase())).size===a.length).optional()}).strict();
export type Settings=z.infer<typeof settingsSchema>;
export const snapshotSchema=z.object({entities:z.array(entitySchema).max(10000),transactions:z.array(txSchema).max(100000),events:z.array(eventSchema).max(10000),settings:settingsSchema}).strict();
export type Snapshot=z.infer<typeof snapshotSchema>;
export const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export const gtq=(amount:number,c:'GTQ'|'USD',fx:number)=>round(c==='USD'?amount*fx:amount);
export const txGTQ=(t:Transaction)=>gtq(t.amount,t.currency,t.fx);
export function balance(a:Entity,tx:Transaction[],fx:number){return round(gtq(a.amount,a.currency,fx)+tx.reduce((s,t)=>s+(t.targetId===a.id&&t.type==='transfer'?txGTQ(t):0)+(t.accountId===a.id?(t.type==='income'?txGTQ(t):-txGTQ(t)):0),0));}
export function debtBalance(d:Entity,tx:Transaction[],fx:number){return round(Math.max(0,gtq(d.amount,d.currency,fx)-tx.filter(t=>t.type==='payment'&&t.targetId===d.id).reduce((s,t)=>s+txGTQ(t),0)));}
export const spending=(tx:Transaction[],category?:string)=>round(tx.filter(t=>t.type==='expense'&&(!category||t.categoryId===category)).reduce((s,t)=>s+txGTQ(t),0));
export const runRate=(entities:Entity[],fx:number)=>round(entities.filter(e=>e.kind==='recurring'&&e.active&&e.flow==='income').reduce((s,e)=>s+(e.currency==='USD'?e.amount*fx:e.amount)*(e.frequency==='semimonthly'?2:e.frequency==='bimonthly'?0.5:1),0));
export function payoff(debts:Entity[],tx:Transaction[],fx:number,payment:number,method:'avalanche'|'snowball'){
 if(debts.some(d=>debtBalance(d,tx,fx)>0&&d.apr===null))return {error:'unknown',months:0,interest:0};
 const list=debts.map(d=>({balance:debtBalance(d,tx,fx),apr:d.apr??0,min:gtq(d.minimum,'GTQ',fx)+gtq(d.minimumUSD,'USD',fx)})).filter(d=>d.balance>0);
 let interest=0;
 for(let month=1;month<=600;month++){
  for(const d of list){const cost=round(d.balance*d.apr/1200);interest+=cost;d.balance+=cost;}
  const mins=list.reduce((s,d)=>s+Math.min(d.min,d.balance),0);
  if(payment<mins||payment<=0)return {error:'insufficient',months:0,interest:round(interest)};
  let left=payment;
  for(const d of list){const pay=Math.min(d.min,d.balance);d.balance-=pay;left-=pay;}
  list.sort((a,b)=>method==='avalanche'?b.apr-a.apr:a.balance-b.balance);
  for(const d of list){const pay=Math.min(d.balance,left);d.balance-=pay;left-=pay;}
  if(list.every(d=>d.balance<0.01))return {error:'',months:month,interest:round(interest)};
 }
 return {error:'limit',months:600,interest:round(interest)};
}
export function validateReferences(s:Snapshot){
 const ids=new Set(s.entities.map(e=>e.id));if(ids.size!==s.entities.length||new Set(s.transactions.map(t=>t.id)).size!==s.transactions.length||new Set(s.events.map(e=>e.id)).size!==s.events.length)throw Error('Duplicate IDs');
 const kind=(id:string,k:Entity['kind'])=>s.entities.some(e=>e.id===id&&e.kind===k);
 for(const t of s.transactions){if(!kind(t.accountId,'account')||(t.categoryId&&!kind(t.categoryId,'category'))||(t.type==='transfer'&&(!kind(t.targetId,'account')||t.targetId===t.accountId))||(t.type==='payment'&&!kind(t.targetId,'debt'))||(t.type==='contribution'&&!kind(t.targetId,'goal')))throw Error('Invalid reference');}
 for(const r of s.entities)if(r.kind==="recurring"&&r.txType==="payment"&&(!r.targetId||!kind(r.targetId,"debt")))throw Error("Invalid recurring debt");
 for(const r of s.entities)if(r.categoryId&&!kind(r.categoryId,"category"))throw Error("Invalid recurrence category");
 for(const t of s.transactions)if(t.recurrenceId&&!kind(t.recurrenceId,"recurring"))throw Error("Invalid recurrence source");
 for(const e of s.events)if(e.sourceId&&!kind(e.sourceId,'recurring'))throw Error('Invalid event source');
}
