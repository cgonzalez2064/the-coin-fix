/** Move one item without changing hidden items' relative order or category. */
export function moveBudgetItem(ids:string[],from:string,to:string,after=false):string[]{
 if(from===to||!ids.includes(from)||!ids.includes(to))return [...ids];
 const next=ids.filter(id=>id!==from);next.splice(next.indexOf(to)+(after?1:0),0,from);return next;
}
