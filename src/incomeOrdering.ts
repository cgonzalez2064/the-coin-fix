import {type Entity} from './model';

/** Compare sources in one currency and period, without changing receipt dates. */
export function monthlySourceValue(source:Entity,fx:number):number {
 const frequency=source.frequency==='semimonthly'?2:source.frequency==='bimonthly'?0.5:1;
 return Math.round(source.amount*(source.currency==='USD'?fx:1)*frequency*100)/100;
}
export function sortIncomeSources(entities:Entity[],fx:number):Entity[] {
 return entities.filter(e=>e.kind==='recurring'&&e.flow==='income').sort((a,b)=>monthlySourceValue(b,fx)-monthlySourceValue(a,fx)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
