import {round,gtq,txGTQ,runRate,type Snapshot} from './model';
import {scheduledEvents,isSettled} from './cashflow';
export function spendingProjection(data:Snapshot,month:string,asOf:string){
 const actual=data.transactions.filter(t=>t.date.startsWith(month)&&t.date<=asOf&&t.type==='expense').reduce((n,t)=>n+txGTQ(t),0);
 const planned=scheduledEvents(data,month).filter(e=>e.date&&e.date.startsWith(month)&&e.flow==='expense'&&e.status==='confirmed'&&data.entities.some(r=>r.id===e.sourceId&&r.kind==='recurring'&&r.txType!=='payment')&&!isSettled(data,e)).reduce((n,e)=>n+gtq(e.amount,e.currency,data.settings.fx),0)+data.transactions.filter(t=>t.type==='expense'&&t.date.startsWith(month)&&t.date>asOf).reduce((n,t)=>n+txGTQ(t),0);
 const budget=data.entities.filter(e=>e.kind==='category'&&e.active).reduce((n,e)=>n+gtq(e.amount,e.currency,data.settings.fx),0);
 const days=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();const elapsed=asOf<month+'-01'?0:asOf.slice(0,7)===month?Number(asOf.slice(8)):days;
 const pace=elapsed?round(actual/elapsed*days):0;
 return {actual:round(actual),planned:round(planned),pace,budget:round(budget),projected:round(Math.max(budget,actual+planned,pace)),elapsed,days};
}

export function monthsBetween(from:string,to:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(from)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(to))return NaN;
 return (Number(to.slice(0,4))-Number(from.slice(0,4)))*12+Number(to.slice(5))-Number(from.slice(5));
}
export function savingsProjection(initial:number,monthly:number,months:number){
 if(![initial,monthly,months].every(Number.isFinite)||initial<0||monthly<0||months<0||months>600||!Number.isInteger(months))throw Error('Invalid savings projection');
 return Array.from({length:months+1},(_,month)=>({month,value:round(initial+monthly*month)}));
}
export function savingsBaseline(data:Snapshot,asOf:string){
 const current=asOf.slice(0,7);const contributions=data.transactions.filter(t=>t.type==='contribution'&&t.date<=asOf&&monthsBetween(t.date.slice(0,7),current)>=1&&monthsBetween(t.date.slice(0,7),current)<=3&&data.entities.some(e=>e.id===t.targetId&&e.kind==='goal'&&(e.goalType?e.goalType!=='investment':!/invers|invest/i.test(e.name)))).reduce((n,t)=>n+txGTQ(t),0);
 return {monthly:round(contributions/3),income:runRate(data.entities,data.settings.fx),budget:round(data.entities.filter(e=>e.kind==='category'&&e.active).reduce((n,e)=>n+gtq(e.amount,e.currency,data.settings.fx),0))};
}
