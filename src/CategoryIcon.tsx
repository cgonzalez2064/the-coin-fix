import {Home,Utensils,Plug,KeyRound,Car,HeartPulse,Users,PawPrint,Clapperboard,UserRound,Shapes,Gift,ShieldPlus,ShoppingBasket,Fuel,GraduationCap,Wifi,Scissors,Stethoscope} from 'lucide-react';
import {inferArea} from './budgetAreas';
export function CategoryIcon({name,area,size=19}:{name:string;area?:string;size?:number}){
 const group=area??inferArea(name);const icons:Record<string,typeof Home>={Hogar:Home,Alimentación:Utensils,Servicios:Plug,Renta:KeyRound,Transporte:Car,Salud:HeartPulse,Familia:Users,Mascota:PawPrint,Ocio:Clapperboard,Personal:UserRound,Otros:Shapes};
 const rules:[RegExp,typeof Home][]=[[/regalo|gift/i,Gift],[/emergenc/i,ShieldPlus],[/supermerc|grocer/i,ShoppingBasket],[/combust|fuel/i,Fuel],[/univers|educat/i,GraduationCap],[/internet|wifi|móvil/i,Wifi],[/cabello|groom|hair/i,Scissors],[/medicin|veterin/i,Stethoscope]];
 const Icon=rules.find(([pattern])=>pattern.test(name))?.[1]??icons[group]??Shapes;
 return <Icon size={size} aria-hidden="true" strokeWidth={1.7}/>;
}
