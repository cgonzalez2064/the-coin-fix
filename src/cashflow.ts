import {balance,gtq,round,spending,txGTQ,type Snapshot,type CashEvent} from './model';
export function scheduledEvents(s:Snapshot,month:string):CashEvent[]{
 const days=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
 const events=s.events.filter(e=>e.date.startsWith(month)||!e.date);
 for(const r of s.entities.filter(e=>e.kind==='recurring'&&e.active&&e.day>0)){
  const date=`${month}-${String(Math.min(r.day,days)).padStart(2,'0')}`;
  if(r.start&&date<r.start)continue;
  if(r.frequency==='bimonthly'){if(!r.start)continue;const delta=(Number(month.slice(0,4))-Number(r.start.slice(0,4)))*12+Number(month.slice(5))-Number(r.start.slice(5,7));if(delta%2!==0)continue;}
  // Semimonthly schedules need two explicitly dated events; never invent a second day.
  if(r.frequency==='semimonthly')continue;
  if(events.some(e=>e.sourceId===r.id&&(e.date===date||e.occurrenceDate===date)))continue;
  events.push({id:`schedule:${r.id}:${date}`,name:r.name,date,amount:r.amount,currency:r.currency,flow:r.flow,status:'confirmed',sourceId:r.id});
 }
 return events.sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.flow.localeCompare(b.flow));
}
export function isSettled(s:Snapshot,e:CashEvent){return s.transactions.some(t=>t.eventId===e.id||t.note==='Event '+e.id||(e.sourceId&&t.recurrenceId===e.sourceId&&t.date===e.date));}
export function cashflow(s:Snapshot,month:string,asOf:string){
 const start=month+'-01',end=month+'-31';
 const cutoff=asOf<start||asOf>end?start:asOf;
 const accounts=s.entities.filter(e=>e.kind==='account');
 const opening=round(accounts.reduce((n,a)=>n+balance(a,s.transactions.filter(t=>t.date<cutoff),s.settings.fx),0));
 const events=scheduledEvents(s,month).filter(e=>e.date&&e.status==='confirmed'&&!isSettled(s,e));
 const rows=[...events.map(e=>({id:e.id,name:e.name,date:e.date,flow:e.flow,amount:gtq(e.amount,e.currency,s.settings.fx),event:e})),...s.transactions.filter(t=>t.date>=cutoff&&t.date.startsWith(month)&&t.type!=='transfer').map(t=>({id:t.id,name:t.name,date:t.date,flow:t.type==='income'?'income' as const:'expense' as const,amount:txGTQ(t),event:null}))].sort((a,b)=>a.date.localeCompare(b.date)||(a.flow==='income'?-1:1));
 let running=opening;let funding='Saldo inicial / Opening balance';
 const timeline=rows.map(r=>{if(r.flow==='income')funding=r.name+' · '+r.date;running=round(running+(r.flow==='income'?r.amount:-r.amount));return {...r,balance:running,funding};});
 return {opening,timeline,minimum:Math.min(opening,...timeline.map(r=>r.balance)),pending:scheduledEvents(s,month).filter(e=>e.status==='pending'||!e.date)};
}
export function allocations(s:Snapshot,month:string,asOf:string){
 const plan=cashflow(s,month,asOf);const from=month===asOf.slice(0,7)?asOf:month+'-01';
 const next=new Date(Number(month.slice(0,4)),Number(month.slice(5)),1,12);const until=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-01`;
 const transactionIndex=new Map(s.transactions.map(t=>[t.id,t]));
 const categories=s.entities.filter(e=>e.kind==='category'&&e.active).map(c=>{
  const spent=spending(s.transactions.filter(t=>t.date.startsWith(month)&&t.date<=asOf),c.id);
  const committed=plan.timeline.filter(r=>r.flow==='expense'&&(r.event?s.entities.find(e=>e.id===r.event?.sourceId)?.categoryId===c.id:transactionIndex.get(r.id)?.categoryId===c.id&&r.date>asOf)).reduce((n,r)=>n+r.amount,0);
  return {id:c.id,name:c.name,remaining:Math.max(0,gtq(c.amount,c.currency,s.settings.fx)-spent-committed)};
 });
 const budget=round(categories.reduce((n,c)=>n+c.remaining,0));
 const emergency=s.entities.find(e=>e.kind==='goal'&&e.name==='Mini fondo emergencia');
 const saved=emergency?s.transactions.filter(t=>t.type==='contribution'&&t.targetId===emergency.id&&t.date<=asOf).reduce((n,t)=>n+txGTQ(t),0):0;
 const reserve=emergency?Math.max(0,gtq(emergency.amount,emergency.currency,s.settings.fx)-saved):0;
 const boundaries=[from,...plan.timeline.filter(r=>r.flow==='income'&&r.date>from).map(r=>r.date),until].filter((d,i,a)=>a.indexOf(d)===i).sort();
 let allocated=0;
 const windows=boundaries.slice(0,-1).map((date,i)=>{
  const end=boundaries[i+1];const duration=(Date.parse(end)-Date.parse(date))/86400000;const remainingDays=(Date.parse(until)-Date.parse(date))/86400000;
  const desired=round((budget-allocated)*duration/Math.max(1,remainingDays));
  const atStart=plan.timeline.filter(r=>r.date<=date).at(-1)?.balance??plan.opening;
  const futureFloor=Math.min(atStart,...plan.timeline.filter(r=>r.date>date).map(r=>r.balance));
  const cap=Math.max(0,futureFloor-allocated-reserve);const amount=round(Math.min(desired,cap));allocated=round(allocated+amount);
  return {date,end,desired,amount,categories:categories.filter(c=>c.remaining>0).map(c=>({...c,amount:round(budget?amount*c.remaining/budget:0)}))};
 });
 return {budget,reserve,windows};
}
