import type { BoardNode, LayoutSettings } from './boards';
import type { Edge } from '@xyflow/react';
import { nodeSize, AUTO_LAYOUT_OPTIONS } from './layout';

export const ANNOTATION_LAYOUT_OPTIONS = {
  'theboard.annotationPlacement':'satellites-v1',
  'theboard.annotationGap':32,
} as const;
export const annotationNoteIds = (node:BoardNode) =>
  [...new Set((node.data.regions??[]).flatMap(region=>region.noteIds??[]))].sort();

// Geometry only. The caller discards stale results and commits one React update.
export async function arrangeBoard(nodes: BoardNode[], edges: Edge[], direction: LayoutSettings['direction']) {
  await document.fonts.ready;
  const measure = document.createElement('div');
  measure.style.cssText = 'position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none';
  document.body.append(measure);
  const labelSizes = new Map<string,{width:number;height:number}>();
  try {
    for (const [i,edge] of edges.entries()) {
      const label = document.createElement('div'); label.className='transition-label';
      label.style.position='relative'; label.style.width='240px';
      const route=document.createElement('span');route.className='transition-route';
      route.textContent=String(nodes.find(n=>n.id===edge.source)?.data.title ?? edge.source)+' → '+String(nodes.find(n=>n.id===edge.target)?.data.title ?? edge.target);
      const index=document.createElement('span');index.className='transition-index';index.textContent=String(i+1);
      label.append(route,index,document.createTextNode(String(edge.label??'')));measure.append(label);
      labelSizes.set(edge.id,{width:label.offsetWidth,height:label.offsetHeight});
    }
    const elements=new Map([...document.querySelectorAll<HTMLElement>('[data-board-node-id]')].map(el=>[el.dataset.boardNodeId!,el]));
    const dockOffsets=new Map<string,{screenId:string;x:number;y:number}>();
    for(const note of nodes.filter(n=>n.data.dock)){
      const screenId=note.data.dock!.screenId,parent=elements.get(screenId),child=elements.get(note.id);
      if(!parent||!child)throw new Error('Composite note is not measured');
      const p=parent.getBoundingClientRect(),c=child.getBoundingClientRect(),scale=p.width/parent.offsetWidth;
      if(!scale)throw new Error('Composite bounds are unavailable');
      dockOffsets.set(note.id,{screenId,x:(c.x-p.x)/scale,y:(c.y-p.y)/scale});
    }
    const sizes=new Map(nodes.map(n=>{
      const el=elements.get(n.id);
      const size=el?{width:el.offsetWidth,height:el.offsetHeight}:nodeSize(n);
      return [n.id,size] as const;
    }));
    // A satellite reserves space with its source but remains an ordinary note.
    // Shared notes use the lowest visible screen ID; explicit docks take priority.
    const byId=new Map(nodes.map(n=>[n.id,n])),owners=new Map<string,string>();
    for(const screen of nodes.filter(n=>n.type==='screen').sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){
      for(const id of annotationNoteIds(screen)){
        const note=byId.get(id);
        if(note?.type==='note'&&!note.data.dock&&!owners.has(id))owners.set(id,screen.id);
      }
    }
    const satellites=new Map<string,{screenId:string;x:number;y:number}>();
    const bounds=new Map([...sizes].map(([id,size])=>[id,{...size}]));
    const grouped=new Set(owners.values()),gap=ANNOTATION_LAYOUT_OPTIONS['theboard.annotationGap'];
    for(const screenId of grouped){
      const size=sizes.get(screenId)!,box=bounds.get(screenId)!;
      let cursor=(direction==='RIGHT'?size.height:size.width)+gap;
      for(const [id,owner]of [...owners].sort(([a],[b])=>a<b?-1:a>b?1:0)){
        if(owner!==screenId)continue;
        const note=sizes.get(id)!;
        satellites.set(id,{screenId,x:direction==='RIGHT'?0:cursor,y:direction==='RIGHT'?cursor:0});
        if(direction==='RIGHT'){box.width=Math.max(box.width,note.width);box.height=cursor+note.height;cursor=box.height+gap;}
        else{box.height=Math.max(box.height,note.height);box.width=cursor+note.width;cursor=box.width+gap;}
      }
    }
    const reserved=new Set([...nodes.map(n=>n.id),...edges.map(e=>e.id)]);
    let nextPort=0;
    const portId=()=>{let id;do{id='__theboard_layout_port_'+nextPort++;}while(reserved.has(id));reserved.add(id);return id;};
    const sourcePorts=new Map<string,{id:string;x:number;y:number}>(),targetPorts=new Map<string,{id:string;x:number;y:number}>();
    const children=nodes.filter(n=>!n.data.dock&&!owners.has(n.id)).map(n=>{
      const size=sizes.get(n.id)!,box=bounds.get(n.id)!;
      if(!grouped.has(n.id))return {id:n.id,...box};
      const ports=(source:boolean)=>{
        const incident=edges.filter(e=>(source?e.source:e.target)===n.id);
        return incident.map((edge,i)=>{
          const fraction=(i+1)/(incident.length+1),down=direction==='DOWN';
          const anchor={id:portId(),
            x:down ? size.width*fraction : (source ? size.width : 0),
            y:down ? (source ? size.height : 0) : size.height*fraction,
          };
          (source?sourcePorts:targetPorts).set(edge.id,anchor);
          const side=down ? (source?'SOUTH':'NORTH') : (source?'EAST':'WEST');
          return {...anchor,width:0,height:0,layoutOptions:{'elk.port.side':side}};
        });
      };
      return {id:n.id,...box,ports:[...ports(true),...ports(false)],layoutOptions:{'elk.portConstraints':'FIXED_POS'}};
    });
    const {default:ELK}=await import('elkjs/lib/elk.bundled.js');
    const graph = await new ELK().layout({id:'root',layoutOptions:{...AUTO_LAYOUT_OPTIONS,'elk.direction':direction},children,
      edges:edges.map(e=>({id:e.id,sources:[sourcePorts.get(e.id)?.id??e.source],targets:[targetPorts.get(e.id)?.id??e.target],
          labels:e.label?[{id:'label-'+e.id,text:String(e.label),...labelSizes.get(e.id)!}]:[]}))} as import('elkjs/lib/elk-api').ElkNode);
    const positions=new Map(graph.children!.map(n=>[n.id,{x:n.x!,y:n.y!}]));
    // Commit hidden children's coordinates in the same result as their parent.
    // A focus filter may hide them before the post-render anchor observer runs.
    for(const [id,offset]of dockOffsets){const p=positions.get(offset.screenId)!;positions.set(id,{x:p.x+offset.x,y:p.y+offset.y});}
    for(const [id,offset]of satellites){const p=positions.get(offset.screenId)!;positions.set(id,{x:p.x+offset.x,y:p.y+offset.y});}
    const edgesById=new Map(edges.map(e=>[e.id,e]));
    return {positions,
      edges:new Map(graph.edges!.map(e=>{
        const route=e.sections!.flatMap(s=>[s.startPoint,...(s.bendPoints??[]),s.endPoint]);
        const original=edgesById.get(e.id)!;
        // ELK fixes ports to the reserved box border. Bridge any empty padding
        // back to the actual composite boundary, never to a satellite note.
        for(const [anchor,nodeId,source]of [[sourcePorts.get(e.id),original.source,true],[targetPorts.get(e.id),original.target,false]] as const){
          if(!anchor)continue;
          const p=positions.get(nodeId)!,point={x:p.x+anchor.x,y:p.y+anchor.y},end=source?route[0]:route[route.length-1];
          if(Math.hypot(point.x-end.x,point.y-end.y)>.001){if(source)route.unshift(point);else route.push(point);}
        }
        return [e.id,{
        route,
        labelPosition:e.labels?.[0]?{x:e.labels[0].x!,y:e.labels[0].y!}:undefined,
        labelManual:false,
      }];}))};
  } finally {measure.remove();}
}
