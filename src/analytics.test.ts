import {it,expect} from 'vitest';
import {analytics} from './analytics';
import {memberSchema,defaultMembers,type Transaction} from './model';
const t=(type:Transaction['type'],amount:number,date='2026-10-06'):Transaction=>({id:crypto.randomUUID(),name:'Test',type,amount,date,currency:'GTQ',fx:7.5,accountId:crypto.randomUUID(),targetId:'',categoryId:'',member:'Shared',share:100,note:''});
it('separates transfers, debt service and savings from consumption',()=>{const a=analytics([t('income',1000),t('expense',200),t('payment',100),t('contribution',50),t('transfer',400),t('income',9000,'2026-10-25')],'2026-10','2026-10-06',500);expect(a.net).toBe(650);expect(a.budgetUse).toBe(40);expect(a.debtRatio).toBe(10);expect(a.savingsRate).toBe(70);expect(a.trend[5].income).toBe(1000);});
it('does not invent ratios when income and budget are zero',()=>{const a=analytics([t('expense',20)],'2026-10','2026-10-06',0);expect(a.debtRatio).toBeNull();expect(a.savingsRate).toBeNull();expect(a.budgetUse).toBeNull();expect(a.net).toBe(-20);});
it('starts with a generic owner and permits custom members',()=>{expect(defaultMembers).toEqual([{name:'Yo',role:'owner',contribution:0}]);expect(memberSchema.parse({name:'Persona nueva',role:'adult',contribution:500}).contribution).toBe(500);});
