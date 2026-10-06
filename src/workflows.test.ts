import 'fake-indexeddb/auto';
import {it,expect,afterEach} from 'vitest';
import {db,initialize,snapshot,replaceSnapshot,selectDatabase} from './db';
import {entity} from './test-fixtures';
import {balance,spending,txSchema,validateReferences,type Transaction} from './model';
import {analytics} from './analytics';
import {scheduledEvents,isSettled} from './cashflow';
import {encodeBackup,decodeBackup} from './services';
afterEach(async()=>{await db.delete();selectDatabase('workflow-test');});
it('completes income → custom category → expense → recurrence → backup/restore',async()=>{
 selectDatabase('workflow-test');await initialize(true);const base=await snapshot();const account=base.entities.find(e=>e.kind==='account')!;const category=entity('category','Regalos',500);const source=entity('recurring','Aporte de integrante',1000,{flow:'income',day:16});const recurrence=entity('recurring','Compra mensual',150,{flow:'expense',day:31,start:'2026-11-01',categoryId:category.id,txType:'expense'});
 const tx=(type:Transaction['type'],amount:number,extra:Partial<Transaction>={}):Transaction=>txSchema.parse({id:crypto.randomUUID(),name:'Workflow',type,amount,currency:'GTQ',fx:7.5,date:'2026-10-06',accountId:account.id,targetId:'',categoryId:type==='expense'?category.id:'',member:'Integrante nuevo',share:100,note:'',...extra});
 const received=tx('income',1000,{recurrenceId:source.id}),expense=tx('expense',150,{recurrenceId:recurrence.id});const next={...base,entities:[...base.entities,category,source,recurrence],transactions:[received,expense],settings:{...base.settings,members:[{name:'Integrante nuevo',role:'adult' as const,contribution:1000}]}};
 validateReferences(next);await replaceSnapshot(next);expect(balance(account,(await snapshot()).transactions,7.5)).toBe(850);expect(spending((await snapshot()).transactions,category.id)).toBe(150);expect(analytics(next.transactions,'2026-10','2026-10-06',500).net).toBe(850);
 expect(scheduledEvents(next,'2026-11').find(e=>e.sourceId===recurrence.id)?.date).toBe('2026-11-30');const backup=await decodeBackup(await encodeBackup(await snapshot()));await db.transactions.clear();await replaceSnapshot(backup);expect((await snapshot()).transactions).toHaveLength(2);expect((await snapshot()).settings.members?.[0].contribution).toBe(1000);
});
it('recording scheduled receipt on another date settles its original event once',async()=>{selectDatabase('workflow-test');await initialize(true);const s=await snapshot();const a=s.entities.find(e=>e.kind==='account')!;const source=entity('recurring','Income',1000,{flow:'income',day:16});s.entities.push(source);const event=scheduledEvents(s,'2026-10').find(e=>e.sourceId===source.id)!;s.transactions.push({id:crypto.randomUUID(),name:'Income received early',type:'income',amount:1000,currency:'GTQ',fx:7.5,date:'2026-10-06',accountId:a.id,targetId:'',categoryId:'',member:'Shared',share:100,note:'',eventId:event.id,recurrenceId:source.id});expect(isSettled(s,event)).toBe(true);expect(balance(a,s.transactions,7.5)).toBe(1000);});
it('separates new account databases without losing another account records',async()=>{selectDatabase('workflow-a');await initialize(true);const first=await snapshot();await db.entities.update(first.entities.find(e=>e.kind==='account')!.id,{amount:222});selectDatabase('workflow-b');await initialize(true);expect((await snapshot()).entities.find(e=>e.kind==='account')!.amount).toBe(0);await db.delete();selectDatabase('workflow-a');expect((await snapshot()).entities.find(e=>e.kind==='account')!.amount).toBe(222);});
