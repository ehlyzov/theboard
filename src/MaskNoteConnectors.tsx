import {useLayoutEffect,useState} from 'react';
import {ViewportPortal,useReactFlow,useViewport} from '@xyflow/react';
import type {BoardNode,Region} from './boards';

type Point={x:number;y:number};
type Rect=Point&{width:number;height:number};
type Selection={screenId:string;regionId:string}|null;
type Link={screenId:string;regionId:string;noteId:string;path:string};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

// A free note uses the Euclidean nearest boundary point. A docked note uses
// the same closest face and a monotone Manhattan approach normal to that face.
function connector(from:Point,box:Rect,docked:boolean){
  const faces=[
    {axis:'x',point:{x:box.x,y:clamp(from.y,box.y,box.y+box.height)}},
    {axis:'x',point:{x:box.x+box.width,y:clamp(from.y,box.y,box.y+box.height)}},
    {axis:'y',point:{x:clamp(from.x,box.x,box.x+box.width),y:box.y}},
    {axis:'y',point:{x:clamp(from.x,box.x,box.x+box.width),y:box.y+box.height}},
  ];
  faces.sort((a,b)=>Math.hypot(a.point.x-from.x,a.point.y-from.y)-Math.hypot(b.point.x-from.x,b.point.y-from.y));
  const {point:to,axis}=faces[0];
  const knee=axis==='x'?{x:from.x,y:to.y}:{x:to.x,y:from.y};
  const points=docked?[from,knee,to]:[from,to];
  return points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
}
function center(region:Region):Point{
  const points=region.strokes?.flatMap(s=>s.points);
  return points?.length?{x:points.reduce((s,p)=>s+p.x,0)/points.length,y:points.reduce((s,p)=>s+p.y,0)/points.length}
    :{x:region.x+region.width/2,y:region.y+region.height/2};
}

export default function MaskNoteConnectors({nodes,selected,hovered}:{nodes:BoardNode[];selected:Selection;hovered:Selection}){
  const {zoom,x,y}=useViewport();
  const {screenToFlowPosition}=useReactFlow();
  const [links,setLinks]=useState<Link[]>([]);
  useLayoutEffect(()=>{
    let frame=0;
    const elements=new Map([...document.querySelectorAll<HTMLElement>('[data-board-node-id]')].map(el=>[el.dataset.boardNodeId!,el]));
    const byId=new Map(nodes.map(n=>[n.id,n]));
    const bounds=(el:HTMLElement):Rect=>{
      const r=el.getBoundingClientRect();
      return {...screenToFlowPosition({x:r.x,y:r.y},{snapToGrid:false}),width:r.width/zoom,height:r.height/zoom};
    };
    const measure=()=>{
      const next:Link[]=[];
      for(const screen of nodes.filter(n=>n.type==='screen'&&!n.hidden)){
        const image=elements.get(screen.id)?.querySelector<HTMLElement>('[data-testid="annotation-image"]');
        if(!image || !image.getClientRects().length)continue;
        const imageBox=bounds(image);
        for(const region of screen.data.regions??[]){
          const c=center(region),from={x:imageBox.x+c.x*imageBox.width,y:imageBox.y+c.y*imageBox.height};
          for(const noteId of region.noteIds??[]){
            const note=byId.get(noteId),element=elements.get(noteId);
            if(!note||!element||!element.getClientRects().length)continue;
            next.push({screenId:screen.id,regionId:region.id,noteId,path:connector(from,bounds(element),Boolean(note.data.dock))});
          }
        }
      }
      setLinks(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
    const observer=new ResizeObserver(schedule);
    for(const element of elements.values())observer.observe(element);
    schedule();
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[nodes,zoom,x,y,screenToFlowPosition]);
  return <ViewportPortal><svg className="mask-note-connectors" width="1" height="1" aria-hidden="true">
    {links.map(link=>{
      const active=[selected,hovered].some(s=>s?.screenId===link.screenId&&s.regionId===link.regionId);
      return <g key={JSON.stringify([link.screenId,link.regionId,link.noteId])}>
        {active&&<path className="mask-note-halo" d={link.path} fill="none" stroke="white" strokeWidth="3.5" vectorEffect="non-scaling-stroke"/>}
        <path className="mask-note-connector" data-note-id={link.noteId} data-screen-id={link.screenId}
          data-region-id={link.regionId} data-active={active} d={link.path} fill="none"
          stroke={active?'#8250bd':'#c7b6db'} strokeWidth={active?1.5:1} vectorEffect="non-scaling-stroke"/>
      </g>;
    })}
  </svg></ViewportPortal>;
}
