import {describe,it,expect} from 'vitest';
import {entity} from './test-fixtures';
import {monthlySourceValue,sortIncomeSources} from './incomeOrdering';
describe('income ordering',()=>{
 it('compares currencies and payment frequencies without mutating input',()=>{
  const usd=entity('recurring','USD',100,{currency:'USD',flow:'income',frequency:'semimonthly'});
  const gtq=entity('recurring','GTQ',1000,{flow:'income'});
  const occasional=entity('recurring','Occasional',1800,{flow:'income',frequency:'bimonthly'});
  const values=[occasional,gtq,usd];
  expect(sortIncomeSources(values,7.5).map(e=>e.name)).toEqual(['USD','GTQ','Occasional']);
  expect(values.map(e=>e.name)).toEqual(['Occasional','GTQ','USD']);
  expect(monthlySourceValue(usd,7.5)).toBe(1500);
 });
 it('excludes expenses and resolves equal amounts by name',()=>{
  const a=entity('recurring','A',100,{flow:'income'}),b=entity('recurring','B',100,{flow:'income',active:false});
  expect(sortIncomeSources([b,entity('category','Other',1000),a],8).map(e=>e.name)).toEqual(['A','B']);
 });
});
