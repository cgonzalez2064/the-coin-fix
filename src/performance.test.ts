import {it,expect} from 'vitest';
import {areaTotals} from './budgetAreas';
import {analytics} from './analytics';
import {entity} from './test-fixtures';
import {seed} from './seed-public';
import {allocations} from './cashflow';
import type {Transaction} from './model';
it('measures analytical and cash-flow workloads with 10,000 records',()=>{
 const s=seed(),account=s.entities.find(e=>e.kind==='account')!;s.entities.push(entity('recurring','Income',30000,{flow:'income',day:16}));s.transactions=Array.from({length:10000},(_,i):Transaction=>({id:crypto.randomUUID(),name:'Synthetic performance record',type:i%10===0?'income':'expense',amount:i%10===0?1000:5,currency:'GTQ',fx:7.5,date:'2026-10-'+String(i%6+1).padStart(2,'0'),accountId:account.id,targetId:'',categoryId:s.entities.find(e=>e.kind==='category')!.id,member:'Shared',share:100,note:''}));
 const timings=[];for(let run=0;run<2;run++){const start=performance.now();const a=analytics(s.transactions,'2026-10','2026-10-06',21560);const plan=allocations(s,'2026-10','2026-10-06');const areas=areaTotals(s,'2026-10','2026-10-06');expect(areas.reduce((n,r)=>n+r.spent,0)).toBe(45000);timings.push(Number((performance.now()-start).toFixed(2)));expect(a.income).toBe(1000000);expect(a.expenses).toBe(45000);expect(plan.windows.every(w=>Number.isFinite(w.amount))).toBe(true);}
 console.info('Synthetic analytics + allocations + area totals, 10,000 records, ms:',timings.join(', '));
});
