/* Local layout experiment. Source content is never modified. */
(async () => {
  const {board,docks,engineVersion} = JSON.parse(document.getElementById('input-data').textContent);
  const $ = id => document.getElementById(id), svgNS = 'http://www.w3.org/2000/svg';
  const byId = new Map(board.nodes.map(n => [n.id,n]));
  const cards = new Map(), labels = new Map(), paths = new Map(), nav = new Map();
  let result, layout, selected, focused = false, running = false, view = {x:30,y:50,z:1};
  const groupFor = id => docks[id]?.screenId ?? id;
  const note = n => {
    const el = document.createElement('section'); el.className='note'; el.dataset.noteId=n.id;
    const title = document.createElement('strong'); title.textContent=n.data.title;
    const text = document.createElement('div'); text.textContent=n.data.text ?? '';
    el.append(title,text); return el;
  };
  const short = id => byId.get(id).data.title.split(' · ')[0];
  $('board-title').textContent=board.title;
  $('counts').textContent=`${board.nodes.filter(n => n.type==='screen').length} экрана · ${board.nodes.filter(n => n.type==='note').length} заметки · ${board.edges.length} переходов`;
  for (const n of board.nodes) {
    if (docks[n.id]) continue;
    const el = document.createElement('article'); el.dataset.nodeId=n.id;
    if (n.type==='screen') {
      el.className='composite';
      const title=document.createElement('div');title.className='screen-title';title.textContent=n.data.title;
      const img=document.createElement('img');img.className='screen-image';img.src=n.data.image.split('/').map(encodeURIComponent).join('/');img.alt=n.data.title;
      el.append(title,img);
      for (const child of board.nodes.filter(v => docks[v.id]?.screenId===n.id)) el.append(note(child));
      const button=document.createElement('button');button.textContent=n.data.title;
      button.onclick=() => { select(n.id); goTo(n.id); };nav.set(n.id,button);$('screen-list').append(button);
      el.onclick=() => select(n.id);
    } else {el.className='free-note';el.append(note(n));}
    cards.set(n.id,el);$('cards').append(el);
  }
  for (const [i,e] of board.edges.entries()) {
    const label=document.createElement('div');label.className='label';label.dataset.edgeId=e.id;
    const route=document.createElement('strong');route.textContent=`${short(e.source)} → ${short(e.target)}`;
    const number=document.createElement('span');number.className='number';number.textContent=String(i+1);
    label.append(route,number,document.createTextNode(e.label ?? ''));
    label.title=`${byId.get(e.source).data.title} → ${byId.get(e.target).data.title}`;
    label.onpointerenter=() => highlight(e.id);label.onpointerleave=() => highlight(null);
    labels.set(e.id,label);$('labels').append(label);
    const path=document.createElementNS(svgNS,'path');path.dataset.edgeId=e.id;path.setAttribute('marker-end','url(#arrowhead)');
    paths.set(e.id,path);$('paths').append(path);
  }
  function transform() {
    $('world').style.transform=`translate(${view.x}px,${view.y}px) scale(${view.z})`;
    $('zoom').textContent=Math.round(view.z*100)+'%';
  }
  function zoom(z, x=$('canvas').clientWidth/2, y=$('canvas').clientHeight/2) {
    z=Math.min(4,Math.max(.015,z));const k=z/view.z;
    view={x:x-(x-view.x)*k,y:y-(y-view.y)*k,z}; transform();
  }
  function goTo(id) {
    const n=result?.children.find(v => v.id===groupFor(id));if(!n)return;
    const z=Math.min(1,($('canvas').clientHeight-160)/n.height,($('canvas').clientWidth-100)/n.width);
    view={x:70-n.x*z,y:100-n.y*z,z};transform();
  }
  function fit() {
    if(!result)return;
    const visible=result.children.filter(n => !cards.get(n.id).hidden);
    const minX=Math.min(...visible.map(n=>n.x)), minY=Math.min(...visible.map(n=>n.y));
    const w=Math.max(...visible.map(n=>n.x+n.width))-minX, h=Math.max(...visible.map(n=>n.y+n.height))-minY;
    const z=Math.max(.015,Math.min(1,($('canvas').clientWidth-100)/w,($('canvas').clientHeight-150)/h));
    view={x:50-minX*z,y:100-minY*z,z};transform();
  }
  function select(id) {
    selected=id;for(const [key,el] of nav)el.classList.toggle('selected',key===id);
    visibility();
  }
  function visibility() {
    const ids=new Set([selected,...board.edges.filter(e=>e.source===selected).map(e=>e.target)]);
    for(const [id,button]of nav)button.classList.toggle('out-of-focus',focused&&!ids.has(id));
    for(const [id,el]of cards)el.hidden=focused&&!ids.has(id);
    for(const e of board.edges){const hidden=focused&&e.source!==selected;paths.get(e.id).style.display=hidden?'none':'';labels.get(e.id).hidden=hidden;}
    highlight(null);
  }
  function nearest(p, points) {
    let best,dist=Infinity;
    for(let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
      const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
      const q={x:a.x+t*dx,y:a.y+t*dy},d=(p.x-q.x)**2+(p.y-q.y)**2;
      if(d<dist){best=q;dist=d;}
    }return best;
  }
  function highlight(id) {
    $('leaders').replaceChildren();
    for(const [key,p]of paths){p.classList.toggle('active',key===id);p.style.opacity=id&&key!==id?'.13':'';}
    for(const [key,l]of labels){l.classList.toggle('active',key===id);l.style.opacity=id&&key!==id?'.3':'';}
    const e=board.edges.find(e=>e.id===id);
    for(const [key,c]of cards)c.classList.toggle('active',!!e&&(key===e.source||key===e.target));
    if(!e||!layout)return;
    const edge=layout.edges[id],l=edge.label;
    const center={x:l.x+l.width/2,y:l.y+l.height/2},q=nearest(center,edge.points);
    const line=document.createElementNS(svgNS,'line');line.dataset.edgeId=id;
    for(const [k,v]of Object.entries({x1:center.x,y1:center.y,x2:q.x,y2:q.y}))line.setAttribute(k,v);
    $('leaders').append(line);
  }
  const overlap=(a,b)=>a.x<b.x+b.width-1e-6&&a.x+a.width>b.x+1e-6&&a.y<b.y+b.height-1e-6&&a.y+a.height>b.y+1e-6;
  const pairs=(a,f)=>a.reduce((sum,x,i)=>sum+a.slice(i+1).filter(y=>f(x,y)).length,0);
  function metrics(g) {
    const nodes=g.children,ls=g.edges.flatMap(e=>e.labels),segments=g.edges.flatMap(e=>e.sections.flatMap(s=>{
      const ps=[s.startPoint,...(s.bendPoints??[]),s.endPoint];return ps.slice(1).map((b,i)=>({a:ps[i],b,id:e.id,source:e.sources[0],target:e.targets[0]}));
    }));
    const hit=(s,r)=>Math.abs(s.a.y-s.b.y)<1e-6?s.a.y>r.y+1e-6&&s.a.y<r.y+r.height-1e-6&&Math.max(s.a.x,s.b.x)>r.x+1e-6&&Math.min(s.a.x,s.b.x)<r.x+r.width-1e-6:s.a.x>r.x+1e-6&&s.a.x<r.x+r.width-1e-6&&Math.max(s.a.y,s.b.y)>r.y+1e-6&&Math.min(s.a.y,s.b.y)<r.y+r.height-1e-6;
    const shared=(s,t)=>{
      if(s.id===t.id)return false;
      for(const [a,b]of [['x','y'],['y','x']])if(Math.abs(s.a[a]-s.b[a])<1e-6&&Math.abs(t.a[a]-t.b[a])<1e-6&&Math.abs(s.a[a]-t.a[a])<1e-6&&Math.min(Math.max(s.a[b],s.b[b]),Math.max(t.a[b],t.b[b]))-Math.max(Math.min(s.a[b],s.b[b]),Math.min(t.a[b],t.b[b]))>1e-6)return true;
      return false;
    };
    return {nodeOverlapPairs:pairs(nodes,overlap),labelOverlapPairs:pairs(ls,overlap),
      labelNodeHits:ls.reduce((sum,l)=>sum+nodes.filter(n=>overlap(l,n)).length,0),
      segmentNodeHits:segments.reduce((sum,s)=>sum+nodes.filter(n=>n.id!==s.source&&n.id!==s.target&&hit(s,n)).length,0),
      segmentLabelHits:segments.reduce((sum,s)=>sum+ls.filter(l=>hit(s,l)).length,0),
      coincidentSegmentPairs:pairs(segments,shared),
      properSegmentCrossings:pairs(segments,(s,t)=>{
        if(s.id===t.id)return false;const sh=Math.abs(s.a.y-s.b.y)<1e-6,th=Math.abs(t.a.y-t.b.y)<1e-6;if(sh===th)return false;
        const h=sh?s:t,v=sh?t:s;return v.a.x>Math.min(h.a.x,h.b.x)+1e-6&&v.a.x<Math.max(h.a.x,h.b.x)-1e-6&&h.a.y>Math.min(v.a.y,v.b.y)+1e-6&&h.a.y<Math.max(v.a.y,v.b.y)-1e-6;
      }),width:g.width,height:g.height};
  }
  async function arrange() {
    if(running)return;running=true;$('loading').hidden=false;$('export').disabled=true;$('direction').disabled=true;
    try {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img=>img.decode()));
      // offsetWidth/Height are unscaled board units, even after zoom/focus changes.
      for(const el of [...cards.values(),...labels.values()])el.hidden=false;
      const options={'elk.algorithm':'layered','elk.direction':$('direction').value,'elk.edgeRouting':'ORTHOGONAL',
        'elk.randomSeed':'1','elk.spacing.nodeNode':'100','elk.layered.spacing.nodeNodeBetweenLayers':'180',
        'elk.spacing.edgeNode':'24','elk.spacing.edgeEdge':'20','elk.layered.spacing.edgeEdgeBetweenLayers':'20',
        'elk.spacing.edgeLabel':'12','elk.spacing.labelNode':'16','elk.spacing.labelLabel':'16',
        'elk.layered.mergeEdges':'false','elk.layered.mergeHierarchyEdges':'false'};
      const graph={id:'root',layoutOptions:options,
        children:[...cards].map(([id,el])=>({id,width:el.offsetWidth,height:el.offsetHeight})),
        edges:board.edges.map(e=>({id:e.id,sources:[e.source],targets:[e.target],
          labels:[{id:`label-${e.id}`,text:e.label??'',width:labels.get(e.id).offsetWidth,height:labels.get(e.id).offsetHeight}]}))};
      const start=performance.now(); result=await new ELK().layout(graph);
      const elapsed=performance.now()-start;
      layout={engine:{name:'elk-layered',version:engineVersion,options},docks:structuredClone(docks),nodes:{},edges:{}};
      for(const n of result.children) {
        const el=cards.get(n.id);el.style.left=n.x+'px';el.style.top=n.y+'px';
        layout.nodes[n.id]={x:n.x,y:n.y,width:n.width,height:n.height};
        for(const child of el.querySelectorAll('[data-note-id]'))if(child.dataset.noteId!==n.id)
          layout.nodes[child.dataset.noteId]={x:n.x+child.offsetLeft,y:n.y+child.offsetTop,width:child.offsetWidth,height:child.offsetHeight};
      }
      for(const e of result.edges) {
        const ps=e.sections.flatMap(s=>[s.startPoint,...(s.bendPoints??[]),s.endPoint]);
        paths.get(e.id).setAttribute('d',ps.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' '));
        const l=e.labels[0],el=labels.get(e.id);el.style.left=l.x+'px';el.style.top=l.y+'px';
        layout.edges[e.id]={points:ps,label:{x:l.x,y:l.y,width:l.width,height:l.height},manual:false};
      }
      const report={engineVersion,direction:options['elk.direction'],screens:board.nodes.filter(n=>n.type==='screen').length,
        notes:board.nodes.filter(n=>n.type==='note').length,edges:board.edges.length,dockedNotes:Object.keys(docks).length,
        ...metrics(result),layoutMs:Math.round(elapsed)};
      $('metrics').textContent=JSON.stringify(report,null,2);
      const defects=report.nodeOverlapPairs+report.labelOverlapPairs+report.labelNodeHits+report.segmentNodeHits+report.segmentLabelHits+report.coincidentSegmentPairs;
      $('status').textContent=`${defects?'Есть геометрические конфликты':'Наложений не обнаружено'} · пересечений: ${report.properSegmentCrossings}`;
      window.layoutExample={board:structuredClone(board),layout,report};
      visibility();$('loading').hidden=true;$('export').disabled=false;
      if(!selected){select(board.nodes.find(n=>n.type==='screen').id);goTo(selected);}
      else fit();
    } catch(error){$('loading').textContent='Не удалось построить диаграмму: '+error.message;console.error(error);}
    finally{running=false;$('direction').disabled=false;}
  }
  $('fit').onclick=fit;$('first').onclick=()=>{select(board.nodes.find(n=>n.type==='screen').id);goTo(selected);};
  $('direction').onchange=arrange;
  $('focus').onclick=()=>{focused=!focused;$('focus').setAttribute('aria-pressed',focused);$('focus').textContent='Фокус: '+(focused?'вкл.':'выкл.');visibility();fit();};
  $('search').oninput=e=>{const q=e.target.value.toLocaleLowerCase();for(const el of nav.values())el.hidden=!el.textContent.toLocaleLowerCase().includes(q);};
  $('plus').onclick=()=>zoom(view.z*1.25);$('minus').onclick=()=>zoom(view.z/1.25);
  $('export').onclick=()=>{
    const output=structuredClone(board);for(const n of output.nodes)delete n.position;output.layout=layout;
    const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='board-layout-example.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('diagnostics-button').onclick=()=>$('diagnostics').showModal();$('close-dialog').onclick=()=>$('diagnostics').close();
  let space=false,drag;
  window.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();space=true;}});
  window.addEventListener('keyup',e=>{if(e.code==='Space')space=false;});window.addEventListener('blur',()=>{space=false;drag=null;});
  $('canvas').addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    if(e.target.closest('.canvas-toolbar,.zoom')&&!space&&!e.altKey)return;
    if(!space&&!e.altKey&&e.target.closest('.composite,.free-note,.label'))return;
    e.preventDefault();e.stopPropagation();drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};$('canvas').setPointerCapture(e.pointerId);
  },true);
  $('canvas').addEventListener('pointermove',e=>{if(drag){view.x=drag.vx+e.clientX-drag.x;view.y=drag.vy+e.clientY-drag.y;transform();}});
  for(const type of ['pointerup','pointercancel'])$('canvas').addEventListener(type,e=>{if(drag){drag=null;$('canvas').releasePointerCapture(e.pointerId);}});
  $('canvas').addEventListener('wheel',e=>{e.preventDefault();const r=$('canvas').getBoundingClientRect();zoom(view.z*Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
  transform();await arrange();
})();
