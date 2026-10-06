import {describe,it,expect} from 'vitest';
import {seed,entity} from './test-fixtures';
import {gtq,runRate,payoff,spending,balance,debtBalance,validateReferences,txSchema,type Transaction} from './model';
import {encodeBackup,decodeBackup} from './services';
const s=seed();const a=s.entities.find(e=>e.kind==='account')!;
const tx=(extras:Partial<Transaction>={}):Transaction=>({id:crypto.randomUUID(),name:'Test',type:'expense',amount:100,currency:'USD',fx:7.5,date:'2026-10-05',accountId:a.id,targetId:'',categoryId:'',member:'Shared',share:60,note:'',...extras});
describe('financial invariants',()=>{
 it('preserves correct Employer B monthly run-rate and bimonthly normalization',()=>expect(runRate(s.entities,7.64136)).toBe(24424.08));
 it('seeds conservative budget at 8,100 and debt total 6,000',()=>{expect(s.entities.filter(e=>e.kind==='category').reduce((n,e)=>n+e.amount,0)).toBe(8100);expect(s.entities.filter(e=>e.kind==='debt').reduce((n,e)=>n+e.amount,0)).toBeCloseTo(6000);});
 it('counts only dated confirmed receipts for October',()=>expect(s.events.filter(e=>e.status==='confirmed'&&e.flow==='income'&&e.date.startsWith('2026-10')).reduce((n,e)=>n+gtq(e.amount,e.currency,s.settings.fx),0)).toBeCloseTo(15282.72));
 it('freezes historical FX and keeps household share out of cash balances',()=>{const t=tx();expect(spending([t])).toBe(750);expect(balance(a,[t],9)).toBe(-750);});
 it('transfers conserve total cash across currencies',()=>{const b=entity('account','USD',0,{currency:'USD'});const t=tx({type:'transfer',targetId:b.id});expect(balance(a,[t],8)+balance(b,[t],8)).toBe(0);});
 it('reduces debt only by payments targeted at that debt',()=>{const d=entity('debt','Card',1000);expect(debtBalance(d,[tx({type:'payment',targetId:d.id,amount:100,currency:'GTQ'})],8)).toBe(900);});
 it('refuses to fabricate a payoff date for unknown APR',()=>expect(payoff(s.entities.filter(e=>e.kind==='debt'),[],8,30000,'avalanche').error).toBe('unknown'));
 it('pays a zero-interest loan in the correct months',()=>expect(payoff([entity('debt','Loan',1000,{apr:0})],[],8,250,'avalanche').months).toBe(4));
 it('rejects payments that miss minimums',()=>expect(payoff([entity('debt','Loan',1000,{apr:20,minimum:100})],[],8,50,'avalanche').error).toBe('insufficient'));
 it('validates impossible dates and invalid transfers',()=>{expect(txSchema.safeParse(tx({date:'2026-02-31'})).success).toBe(false);expect(()=>validateReferences({...s,transactions:[tx({type:'transfer',targetId:a.id})]})).toThrow();});
 it('rejects corruption and roundtrips backups',async()=>{const raw=await encodeBackup(s);expect(await decodeBackup(raw)).toEqual(s);const env=JSON.parse(raw);env.payload=env.payload.replace('Employer A','Changed');await expect(decodeBackup(JSON.stringify(env))).rejects.toThrow();});
});
