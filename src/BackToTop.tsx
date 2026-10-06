import {useEffect,useState} from 'react';
import {ArrowUp} from 'lucide-react';
export function BackToTop({es}:{es:boolean}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const update=()=>setVisible(window.scrollY>320);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[]);
 return visible?<button className="back-to-top" aria-label={es?'Volver arriba':'Back to top'} title={es?'Volver arriba':'Back to top'} onClick={()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}><ArrowUp size={20}/></button>:null;
}
