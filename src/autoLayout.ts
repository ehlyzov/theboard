import type { BoardNode, LayoutSettings } from './boards';
import type { Edge } from '@xyflow/react';
import { nodeSize, AUTO_LAYOUT_OPTIONS } from './layout';

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
    const {default:ELK}=await import('elkjs/lib/elk.bundled.js');
    const graph = await new ELK().layout({id:'root',layoutOptions:{...AUTO_LAYOUT_OPTIONS,'elk.direction':direction},children:nodes.filter(n=>!n.data.dock).map(n=>{
      const el=[...document.querySelectorAll<HTMLElement>('[data-board-node-id]')].find(el=>el.dataset.boardNodeId===n.id);
      const size=el?{width:el.offsetWidth,height:el.offsetHeight}:nodeSize(n);
      return {id:n.id,...size};
    }),edges:edges.map(e=>({id:e.id,sources:[e.source],targets:[e.target],
          labels:e.label?[{id:'label-'+e.id,text:String(e.label),...labelSizes.get(e.id)!}]:[]}))} as import('elkjs/lib/elk-api').ElkNode);
    return {positions:new Map(graph.children!.map(n=>[n.id,{x:n.x!,y:n.y!}])),
      edges:new Map(graph.edges!.map(e=>[e.id,{
        route:e.sections!.flatMap(s=>[s.startPoint,...(s.bendPoints??[]),s.endPoint]),
        labelPosition:e.labels?.[0]?{x:e.labels[0].x!,y:e.labels[0].y!}:undefined,
        labelManual:false,
      }]))};
  } finally {measure.remove();}
}
