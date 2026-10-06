import {txGTQ,round,type Transaction} from './model';
export function analytics(transactions:Transaction[],month:string,asOf:string,budget:number){
 const tx=transactions.filter(t=>t.date.startsWith(month)&&t.date<=asOf);
 const total=(type:Transaction['type'])=>round(tx.filter(t=>t.type===type).reduce((n,t)=>n+txGTQ(t),0));
 const income=total('income'),expenses=total('expense'),debtPayments=total('payment'),contributions=total('contribution');
 const net=round(income-expenses-debtPayments-contributions);
 const days=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
 let received=0,spent=0;const trend=Array.from({length:days},(_,i)=>{const date=`${month}-${String(i+1).padStart(2,'0')}`;for(const t of tx.filter(t=>t.date===date)){if(t.type==='income')received+=txGTQ(t);if(t.type==='expense')spent+=txGTQ(t);}return {day:i+1,income:round(received),expenses:round(spent)};});
 return {income,expenses,debtPayments,contributions,net,budgetUse:budget>0?expenses/budget*100:null,savingsRate:income>0?(income-expenses-debtPayments)/income*100:null,debtRatio:income>0?debtPayments/income*100:null,trend};
}
