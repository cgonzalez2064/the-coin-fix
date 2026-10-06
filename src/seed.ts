// Public deployment seed: intentionally contains no personal finance records.
import type {Entity,Snapshot} from './model';
export function entity(kind:Entity['kind'],name:string,amount=0,extras:Partial<Entity>={}):Entity{return {id:crypto.randomUUID(),kind,name,amount,currency:'GTQ',apr:null,minimum:0,minimumUSD:0,day:0,start:'',frequency:'monthly',flow:'expense',active:true,overdue:false,note:'',...(kind==='category'?{budgetGroup:'variable' as const}:{}),...extras};}
export function seed():Snapshot{return {entities:[entity('account','Cuenta / Account'),...['Vivienda','Alimentación','Transporte','Salud','Ocio','Regalos','Emergencias'].map(name=>entity('category',name,0,{budgetGroup:['Vivienda','Alimentación','Transporte','Salud'].includes(name)?'essential':'variable'})),entity('goal','Mini fondo emergencia',5000,{enName:'Mini emergency fund'})],transactions:[],events:[],settings:{budgetRevision:3,language:'es',theme:'dark',fx:7.64136,fxUpdated:'Referencia histórica / Historical reference',fxSource:'reference',displayCurrency:'GTQ',autoFx:false,members:[{name:'Yo / Me',role:'owner',contribution:0}]}};}

export function categoryRenames():[string,string][]{return [];}

export function budgetRows():[string,string,number,'essential'|'variable'|'provision'][] {return [];}
export const budgetAliases:Record<string,string>={};
