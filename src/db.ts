import {defaultAreas,inferArea} from './budgetAreas';
import Dexie,{type Table} from 'dexie';
import {snapshotSchema,validateReferences,type Snapshot,type Entity,type Transaction,type CashEvent,type Settings} from './model';
import {seed,categoryRenames,budgetRows,budgetAliases,entity} from './seed';
import {seed as neutralSeed} from './seed-public';
class FinanceDB extends Dexie {
 entities!:Table<Entity,string>;transactions!:Table<Transaction,string>;events!:Table<CashEvent,string>;settings!:Table<{id:string;value:Settings},string>;
 constructor(name='finanzas-private-v1'){super(name);this.version(1).stores({entities:'id,kind',transactions:'id,date,accountId,targetId,categoryId',events:'id,date',settings:'id'});}
}
export let db=new FinanceDB();
export function selectDatabase(id:string,owner=false){db.close();db=new FinanceDB(owner?'finanzas-private-v1':'coin-user-'+id);}

export async function initialize(neutral=false){
 await db.transaction('rw',db.entities,db.transactions,db.events,db.settings,async()=>{
  if(!await db.settings.get('main')){const initial=neutral?neutralSeed():seed();await db.entities.bulkAdd(initial.entities);await db.events.bulkAdd(initial.events);await db.settings.add({id:'main',value:initial.settings});}
  for(const [before,after] of categoryRenames())await db.entities.where('kind').equals('category').filter(e=>e.name===before).modify({name:after});
  const areaSettings=(await db.settings.get('main'))!;if((areaSettings.value.areaRevision??0)<1){await db.entities.where('kind').equals('category').modify(e=>{e.budgetArea=e.budgetArea??inferArea(e.name);});await db.settings.put({...areaSettings,value:{...areaSettings.value,budgetAreas:areaSettings.value.budgetAreas??defaultAreas,householdAreas:areaSettings.value.householdAreas??['Hogar','Renta','Servicios','Alimentación'],areaRevision:1}});}
  const settings=(await db.settings.get('main'))!;const revision=settings.value.budgetRevision??0;
  // One-time owner update preserves category IDs and all transaction references.
  if(!neutral&&revision<2&&budgetRows().length){
   const current=await db.entities.where('kind').equals('category').toArray();
   for(const [name,enName,amount,budgetGroup] of budgetRows()){const existing=current.find(e=>e.name===name||e.name===budgetAliases[name]);await db.entities.put({...existing??entity('category',name),name,enName,amount,budgetGroup});}
   const specified=new Set(budgetRows().map(r=>r[0]));await db.entities.where('kind').equals('category').filter(e=>!specified.has(e.name)).modify({budgetGroup:'provision'});
  }
  if(revision<3){
   for(const name of ['Regalos','Emergencias'])if(!await db.entities.where('kind').equals('category').filter(e=>e.name===name).count())await db.entities.add(entity('category',name,0,{budgetGroup:'provision'}));
   await db.settings.put({...settings,value:{...settings.value,budgetRevision:3}});
  }
 });
}

export async function snapshot():Promise<Snapshot>{const [entities,transactions,events,settings]=await Promise.all([db.entities.toArray(),db.transactions.toArray(),db.events.toArray(),db.settings.get('main')]);if(!settings)throw Error('Not initialized');return {entities,transactions,events,settings:settings.value};}
export async function replaceSnapshot(input:unknown){const s=snapshotSchema.parse(input);validateReferences(s);await db.transaction('rw',db.entities,db.transactions,db.events,db.settings,async()=>{await Promise.all([db.entities.clear(),db.transactions.clear(),db.events.clear()]);await db.entities.bulkAdd(s.entities);await db.transactions.bulkAdd(s.transactions);await db.events.bulkAdd(s.events);await db.settings.put({id:'main',value:s.settings});});}
