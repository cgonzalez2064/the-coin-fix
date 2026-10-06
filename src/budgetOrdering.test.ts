import {describe,it,expect} from 'vitest';
import {moveBudgetItem} from './budgetOrdering';
describe('budget drag ordering',()=>{
 it('moves before or after a target without mutating source',()=>{const ids=['a','b','c','d'];expect(moveBudgetItem(ids,'d','b')).toEqual(['a','d','b','c']);expect(moveBudgetItem(ids,'a','c',true)).toEqual(['b','c','a','d']);expect(ids).toEqual(['a','b','c','d']);});
 it('preserves hidden rows between visible drag targets',()=>expect(moveBudgetItem(['a','hidden','b','c'],'c','a')).toEqual(['c','a','hidden','b']));
 it('ignores missing targets and dragging onto itself',()=>{expect(moveBudgetItem(['a','b'],'a','a')).toEqual(['a','b']);expect(moveBudgetItem(['a','b'],'x','b')).toEqual(['a','b']);});
});
