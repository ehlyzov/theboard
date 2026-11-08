// Research probe only; no product imports, browser data, or real user content.
// node docs/research/layout-probe.mjs /absolute/path/to/elk.bundled.js > result.json
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const ELK = require(process.argv[2]);
const pkg = require(resolve(dirname(process.argv[2]), '../package.json'));
assert.equal(pkg.name, 'elkjs');
const options = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.randomSeed': '1',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '200',
  'elk.spacing.edgeEdge': '20',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
  'elk.spacing.edgeNode': '24',
  'elk.spacing.edgeLabel': '12',
  'elk.spacing.labelNode': '16',
  'elk.spacing.labelLabel': '16',
  'elk.layered.mergeEdges': 'false',
  'elk.layered.mergeHierarchyEdges': 'false',
};
function fixture(name, n, pairs) {
  return {
    id: name, layoutOptions: options,
    children: Array.from({length: n}, (_, i) => ({
      id: `n${i}`,
      // Stand-ins for portrait, landscape, and screen+note composite bounds.
      width: i % 3 === 0 ? 630 : i % 3 === 1 ? 230 : 400,
      height: i % 3 === 1 ? 536 : 483,
    })),
    edges: pairs.map(([s,t], i) => ({
      id: `e${i}`, sources: [`n${s}`], targets: [`n${t}`],
      labels: [{id: `l${i}`, text: `Synthetic transition ${i}`, width: 190, height: 54}],
    })),
  };
}
const fixtures = [
  fixture('chain', 6, Array.from({length: 5}, (_, i) => [i,i+1])),
  fixture('branch-cycle-parallel', 8, [
    ...Array.from({length: 7}, (_, i) => [i,i+1]),
    [0,3],[0,5],[3,1],[6,2],[0,3],[3,0],[7,0],
  ]),
  fixture('dense-32', 32, [
    ...Array.from({length: 32}, (_, i) => [i,(i+1)%32]),
    ...Array.from({length: 22}, (_, i) => [i,(i+5)%32]),
    ...Array.from({length: 22}, (_, i) => [i,(i+13)%32]),
  ]),
];
const eps = 1e-6;
const overlap = (a,b) => a.x < b.x+b.width-eps && a.x+a.width > b.x+eps &&
  a.y < b.y+b.height-eps && a.y+a.height > b.y+eps;
const pairsCount = (a, fn) => a.reduce((sum,x,i) => sum+a.slice(i+1).filter(y => fn(x,y)).length,0);
function segmentHit(s, r) {
  if (Math.abs(s.a.y-s.b.y)<eps) return s.a.y>r.y+eps && s.a.y<r.y+r.height-eps &&
    Math.max(s.a.x,s.b.x)>r.x+eps && Math.min(s.a.x,s.b.x)<r.x+r.width-eps;
  return s.a.x>r.x+eps && s.a.x<r.x+r.width-eps &&
    Math.max(s.a.y,s.b.y)>r.y+eps && Math.min(s.a.y,s.b.y)<r.y+r.height-eps;
}
function sharedLength(s,t) {
  if (Math.abs(s.a.y-s.b.y)<eps && Math.abs(t.a.y-t.b.y)<eps && Math.abs(s.a.y-t.a.y)<eps)
    return Math.max(0,Math.min(Math.max(s.a.x,s.b.x),Math.max(t.a.x,t.b.x))-
      Math.max(Math.min(s.a.x,s.b.x),Math.min(t.a.x,t.b.x)));
  if (Math.abs(s.a.x-s.b.x)<eps && Math.abs(t.a.x-t.b.x)<eps && Math.abs(s.a.x-t.a.x)<eps)
    return Math.max(0,Math.min(Math.max(s.a.y,s.b.y),Math.max(t.a.y,t.b.y))-
      Math.max(Math.min(s.a.y,s.b.y),Math.min(t.a.y,t.b.y)));
  return 0;
}
function metrics(g) {
  const nodes = g.children, labels = g.edges.flatMap(e => (e.labels ?? []).map(l => ({...l, edge:e.id})));
  for (const r of [...nodes,...labels])
    assert.ok(['x','y','width','height'].every(k => Number.isFinite(r[k])), 'Missing box geometry');
  assert.ok(g.edges.every(e => e.sections?.length), 'Missing edge routes');
  const segments = g.edges.flatMap(e => (e.sections ?? []).flatMap(s => {
    const p = [s.startPoint,...(s.bendPoints ?? []),s.endPoint];
    return p.slice(1).map((b,i) => ({edge:e.id,a:p[i],b,source:e.sources[0],target:e.targets[0]}));
  }));
  assert.ok(segments.every(s => Math.abs(s.a.x-s.b.x)<eps || Math.abs(s.a.y-s.b.y)<eps), 'Non-orthogonal route');
  let coincidentLength = 0;
  const coincidentPairs = pairsCount(segments,(s,t) => {
    if (s.edge===t.edge) return false;
    const len = sharedLength(s,t); coincidentLength += len;
    return len>eps;
  });
  return {
    nodes:nodes.length,edges:g.edges.length,labels:labels.length,
    nodeOverlapPairs:pairsCount(nodes,overlap),labelOverlapPairs:pairsCount(labels,overlap),
    labelNodeHits:labels.reduce((sum,l) => sum+nodes.filter(n => overlap(l,n)).length,0),
    nonincidentSegmentNodeHits:segments.reduce((sum,s) => sum+nodes.filter(n =>
      n.id!==s.source && n.id!==s.target && segmentHit(s,n)).length,0),
    segmentLabelHits:segments.reduce((sum,s) => sum+labels.filter(l => segmentHit(s,l)).length,0),
    coincidentSegmentPairs:coincidentPairs,coincidentLength,
    properSegmentCrossings:pairsCount(segments,(s,t) => {
      if (s.edge===t.edge) return false;
      const sh = Math.abs(s.a.y-s.b.y)<eps, th = Math.abs(t.a.y-t.b.y)<eps;
      if (sh===th) return false;
      const h = sh?s:t, v = sh?t:s;
      return v.a.x>Math.min(h.a.x,h.b.x)+eps && v.a.x<Math.max(h.a.x,h.b.x)-eps &&
        h.a.y>Math.min(v.a.y,v.b.y)+eps && h.a.y<Math.max(v.a.y,v.b.y)-eps;
    }),
    width:g.width,height:g.height,
  };
}
const results = [];
for (const input of fixtures) {
  const geometries = [], times = [];
  let output;
  for (let i=0;i<3;i++) {
    const engine = new ELK(), start = performance.now();
    output = await engine.layout(structuredClone(input));
    times.push(Number((performance.now()-start).toFixed(1)));
    const box = ({id,x,y,width,height}) => ({id,x,y,width,height});
    geometries.push(JSON.stringify({
      nodes:output.children.map(box),
      edges:output.edges.map(e => ({id:e.id,labels:e.labels?.map(box),
        sections:e.sections?.map(({startPoint,endPoint,bendPoints}) => ({startPoint,endPoint,bendPoints}))})),
    }));
  }
  results.push({fixture:input.id,...metrics(output),ms:times,
    repeatGeometryEqual:geometries.every(g => g===geometries[0])});
  // Confirm that the rectangle checks detect deliberately overlapping boxes.
  const corrupted = structuredClone(output);
  Object.assign(corrupted.children[1], {x:corrupted.children[0].x,y:corrupted.children[0].y});
  assert.ok(metrics(corrupted).nodeOverlapPairs>0);
}
console.log(JSON.stringify({engine:pkg.name,version:pkg.version,node:process.version,
  platform:process.platform,arch:process.arch,options,results},null,2));
