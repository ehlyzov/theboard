# Board placement and routing

Date: 2026-11-08. Status: original engineering research and synthetic feasibility
probe. The layered approach is now integrated in W004; see the current
[board format](../board-format.md) for implemented behavior. Fixed-node routing
remains pending, and technical results are separate from human acceptance. This document
addresses LAYOUT-01, ROUTE-01, DOCK-01 and the owner's request to investigate
placement methods, including chip placement. Product requirements remain in
[the requirement ledger](../product/requirements.md).

## Recommendation

Use **ELK Layered through elkjs for explicit automatic arrangement**, with real
card and label dimensions. Treat a screen and its docked notes as one composite
obstacle. Preserve ordinary note IDs and graph relationships.

For **routing after manual moves while keeping card coordinates fixed**,
evaluate **libavoid through a browser WebAssembly binding**. Do not assume that
ELK Layered can keep arbitrary manually fixed coordinates. Start with ELK's own
orthogonal routes for automatic arrangement; add the second engine only after
its browser, label-obstacle and persistence probe passes. The two engines solve
different editing operations, not competing versions of the same operation.

This is a constrained, multi-objective layout problem. We should seek a good
feasible drawing, measure its defects, and improve it. We cannot promise a
globally optimal drawing or a drawing without any crossings for arbitrary UFDs.
Distinct paths crossing at a point and two paths following the same segment
are different defects; the owner's coincident-line complaint concerns the latter.

## What the literature contributes

The following summaries distinguish published mechanisms from our proposed
adaptation. Source dates are publication dates, not search-engine crawl dates.

| Primary source | Relevant result | Application to TheBoard |
| --- | --- | --- |
| Hegemann & Wolff, [A Simple Pipeline for Orthogonal Graph Drawing](https://arxiv.org/html/2309.01671v2), GD 2023 | Separates placement, overlap removal, ports, obstacle-avoiding routing, path ordering and segment nudging. Its LP nudging balances channel distances; compactness can trade off against crossings and bends. | Route all edges together; moving each label or offsetting each edge independently misses shared-channel congestion. Use as an algorithmic reference, not a drop-in browser dependency. |
| Domrös, [Layered overview](https://eclipse.dev/elk/blog/posts/2025/25-08-21-layered.html), 2025 | Explains ELK's cycle handling, layering, crossing reduction, coordinate assignment and routing. Labels participate in layering rather than being placed only after the drawing is complete. | Reserve label space before routing. Keep semantic source/target unchanged when internal cycle handling produces backward edges. |
| [ELK Layered reference](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html), maintained documentation | Supports directed layered drawings, orthogonal routes, explicit ports, edge labels, parallel edges and compound graphs. | Strong match for UFDs, fixed attachment sides and composite cards. These capabilities are not a guarantee that every input meets every readability constraint. |
| Spönemann, [Edge Routing with Libavoid](https://eclipse.dev/elk/blog/posts/2022/22-11-17-libavoid.html), 2022; [Adaptagrams routing options](https://www.adaptagrams.org/documentation/namespaceAvoid.html) | Explains fixed-node routing separately from layered placement. Libavoid provides obstacle avoidance and nudging controls, including paths with common endpoints. | Candidate for manual editing. The ELK Java integration is not automatically available in elkjs; a separate browser binding is required. |
| Kahng, Varadarajan & Wang, [Hier-RTLMP](https://arxiv.org/abs/2304.11761v2), 2023 | Uses hierarchy and dataflow for multilevel macro placement. | Borrow the composite-block abstraction: arrange a screen with its attached notes, rather than discovering their relationship from proximity. |
| Agnesina et al., [AutoDMP](https://research.nvidia.com/publication/2023-03_autodmp-automated-dreamplace-based-macro-placement), ISPD 2023 | Couples GPU-accelerated mixed-size placement with multi-objective parameter search. | Borrow explicit quality objectives and evaluation of multiple candidates. Its chip scale, compute requirements and physical objectives differ from browser UFD readability. |
| Lee et al., [Chip Placement with Diffusion Models](https://proceedings.mlr.press/v267/lee25y.html), ICML 2025 | Trains on synthetic circuits and uses guided diffusion sampling for placement on unseen circuits. | Evidence that modern chip placement includes learned candidate generation; it does not establish a need for training or inference in this small offline editor. |
| Uchendu et al., [See it to Place it](https://arxiv.org/abs/2603.28733v3), October 2026 revision | Uses VLM proposals to constrain a base placer to regions, with evolutionary search evaluated using post-placement wirelength. | Useful as a generate/evaluate/refine pattern. Reported circuit improvements do not transfer to diagram comprehension; do not add an external model dependency to the initial layout system. |

The chip analogy is useful at the level of **blocks, ports, channels, congestion
and legalization**. A screenshot must not be rotated, resized arbitrarily or
packed as tightly as possible merely to reduce wirelength. Text readability,
transition direction and preserving the user's arrangement matter here.

## Alternatives and selection

These are engineering judgments based on the sources above and TheBoard's
requirements, not published rankings or comparative benchmark results.

| Approach | Fit | Decision |
| --- | --- | --- |
| Current midpoint + label grid search | Small repair near an existing path | Interim only: cannot solve global placement or shared routes. |
| Force/stress placement | Free-form associative maps | Not the first UFD default: direction, ports, note bounds and labels still require additional constraints and routing. |
| ELK layered placement and orthogonal routing | Directed flows with branches, returns, labels and ports | First automatic-arrangement candidate. |
| Libavoid with fixed rectangles | Rerouting after manual moves | Conditional second component; browser feasibility still untested. |
| Exact MIP/constraint solver | Small constrained subproblems, diagnostics | Possible later label/channel repair; no need to build the whole editor around an exact solver now. |
| Learned chip placer | Circuit-specific optimization | No initial dependency; lacks evidence of benefit for this product. |

[elkjs](https://github.com/kieler/elkjs) accepts JSON geometry, returns geometry
without rendering, and supports Web Workers. That fits the existing React Flow
renderer and declarative archives. Preserve its returned bend points: continuing
to render every edge with an independent `getSmoothStepPath` would discard much
of the layout result.

The inspected sources declare [EPL-2.0 for elkjs](https://github.com/kieler/elkjs/blob/master/LICENSE.md)
and [LGPL-2.1-or-later for libavoid-js](https://github.com/Aksem/libavoid-js).
Retain applicable notices and source information when packaging dependencies.
The browser binding is a separate integration choice, not an implication that
the native ELK plugin runs in a browser. No project-wide license choice is made
by this document.

## Proposed algorithm

1. **Measure.** Wait for local fonts and images, then obtain actual screen,
   note, document and wrapped-label bounds in board coordinates. The current
   character-count label estimate is insufficient. Keep image proportions and
   mask geometry unchanged. Do not use zoomed CSS pixels as layout units.
2. **Build composite obstacles.** Compute each screen's core bounds plus its
   explicitly docked notes. A note fills its attachment side; its content needs
   enough space to remain readable. Resolve multiple notes/corners using a
   deterministic local arrangement before global placement. Do not infer a
   docking relationship from nearby coordinates. Shared or undocked notes remain
   separate objects; note-link connectors are not navigation transitions.
3. **Construct a layout graph.** Use one rectangle per composite, actual label
   rectangles, and distinct ports for incident edges. Port sides reflect manual
   choices and the outer composite boundary. Supply navigation edges only to
   flow layering; preserve every original ID, direction, label and return path.
4. **Place and route.** Run ELK Layered, initially left-to-right with orthogonal
   edges. Reserve channels and label space. Disable edge merging, use separate
   port slots and retain path identity for parallel transitions. Cycles get
   return routes, not deleted edges. Pack disconnected components separately.
5. **Validate the complete geometry.** Check node/label overlaps, routes through
   obstacles, shared collinear segments, port attachment and manual constraints.
   A visually opaque label is not proof that no unrelated line passes under it.
6. **Repair with a bounded search.** If channel or label capacity is insufficient,
   widen the affected channel, increase relevant spacing and recompute. Try a
   small recorded set of spacing configurations; retain the best valid candidate.
   Do not move an ambiguous label arbitrarily far from its route. Report an
   unresolved conflict rather than silently accepting the original bad position.
7. **Commit atomically.** Present/apply one layout change with Undo. Keep all
   semantic data unchanged. Save the resulting coordinates, ports, bend points,
   label bounds, engine version and options so reopening does not require rerunning
   the engine or reproducing its implementation details.

For manual moves, keep the moved geometry and other manually fixed geometry.
Reroute against the new composite rectangles using the fixed-node router. Keep
manual label rectangles as obstacles for unrelated edges. The associated route
must approach its label consistently; libavoid alone is not a label-placement
engine. An implementation probe must establish a label attachment/checkpoint
strategy, such as splitting the route at a reserved label box, without allowing
other edges through that box. Revalidate after every repair. If fixed geometry
makes the requested spacing infeasible, retain the user's geometry and surface
the conflict; automatic rearrangement is a separate operation.

ELK's interactive strategies reuse ordering and some coordinates. They are
**not a general promise of arbitrary fixed x/y coordinates**. Do not run global
layered arrangement silently during dragging, reload, focus-mode changes or
ordinary text edits. New UI actions and any pin controls here are proposals;
the owner's already requested manual layout must be preserved.

### Constraints and objectives

Feasibility comes before compactness:

- Preserve content, IDs, relationships, attachment sides and explicit manual
  constraints. No screenshot rotation, cropping or semantic edge reversal.
- No unrelated card/label overlaps or edge traversal through their interiors.
  Docked items intentionally share their boundary, not their interior.
- Separate coincident segments and respect configured object/lane clearances.
  Distinct port slots avoid long shared stems at common endpoints. A deliberately
  fixed common port may make total separation impossible; identify that constraint.
- Make each label unambiguously associated with its own route.

Among feasible candidates, reduce crossings first, then unnecessary bends and
route length, while balancing drawing area/aspect ratio. In local editing,
displacement of unaffected objects has higher priority than global compactness.
Weights and clearances are tunable engineering parameters, not proven universal
readability constants. Minimum clearances are validated separately from the
zero-area-overlap counts in the probe below.

### Declarative persistence proposal

Continue using the existing separate `layout` section. Extend it through an
explicit compatible format change; **the following fields are a proposal and
are not currently guaranteed to import or roundtrip**:

```json
{
  "layout": {
    "engine": {"name":"elk-layered","version":"0.12.1","seed":1,"options":{}},
    "nodes": {"screen-a":{"x":100,"y":100,"width":630,"height":536,"manual":true}},
    "docks": {"note-a":{"screenId":"screen-a","side":"right","order":0}},
    "edges": {
      "open-b": {
        "sourcePort":{"side":"right","offset":0.4},
        "targetPort":{"side":"left","offset":0.5},
        "points":[{"x":730,"y":314},{"x":850,"y":314},{"x":850,"y":700}],
        "label":{"x":770,"y":350,"width":190,"height":54},
        "manual":false
      }
    }
  }
}
```

Use stable input order, pinned engine/options and seed for repeatable calculations,
but persist actual results as the authoritative visual state. Layout edits should
be readable diffs. A move changes layout, not note text or transition meaning.
Node/edge `manual` flags in this example need precise separate position/label/route
semantics before implementation. Focus is a visibility filter, not a new layout.

## Observed feasibility probe

[The probe](layout-probe.mjs) runs isolated elkjs **0.12.1**, installed outside
the product, on three fully synthetic flat graphs. Card rectangles include
stand-ins for portrait/landscape screens and screen+note composites. Labels use
fixed 190×54 rectangles; no real board content or screenshot is included.
Package/version was verified against the npm registry on 2026-11-08.

Results: [raw JSON](layout-probe-results.json). Node v25.3.0, macOS arm64; three
fresh engine instances per input, seed 1. These are individual wall-clock
measurements, not a browser p95 or a performance guarantee.

| Fixture | Nodes / labeled edges | Box overlaps; route-obstacle hits; coincident segment pairs | Proper segment crossings | Runtime, three runs |
| --- | --- | --- | --- | --- |
| Chain | 6 / 5 | 0; 0; 0 | 0 | 44.2 / 10.2 / 7.2 ms |
| Branches, cycles, parallel edges | 8 / 14 | 0; 0; 0 | 0 | 16.0 / 12.6 / 10.3 ms |
| Dense cyclic graph | 32 / 76 | 0; 0; 0 | 160 | 72.6 / 54.6 / 56.6 ms |

Every run produced routes and finite node/label boxes. Coordinate geometry was
identical across three runs for each input (generated engine-internal IDs are
excluded). The probe also deliberately overlaps two node boxes and checks that
the overlap detector detects it. It is a feasibility probe, not independent
acceptance or a comparison against competing engines.

Important limitation: the dense result spans about **20,684×5,654 board units**.
It separates paths but retains many crossings and creates a very large drawing.
Zero coincidences does not establish good readability or optimality. Component
grouping, label sizing and spacing must be evaluated visually on actual UFDs.

Reproduce without changing product dependencies:

```sh
probe_dir=$(mktemp -d)
npm install --prefix "$probe_dir" --ignore-scripts --no-audit --no-fund elkjs@0.12.1
node docs/research/layout-probe.mjs "$probe_dir/node_modules/elkjs/lib/elk.bundled.js"
```

Metrics use strict rectangle interiors and a 1e-6 coordinate tolerance.
Route-node hits exclude the edge's two incident nodes. Segment-label hits include
the associated label. Coincidences count positive-length collinear intersections
between different edges; proper crossings count horizontal/vertical segment
intersections strictly inside both segments. These checks do not establish
minimum clearance, proper endpoint attachment or human comprehension.

## Bounded next implementation slice

Implement measured composite bounds and an ELK adapter on synthetic fixtures,
render its actual routes/labels, and preserve them through Undo, reload and ZIP
roundtrip. Test branches, returns, parallel transitions, long labels, mixed image
ratios, each docking side, disconnected objects and explicit manual edits.

Then prove fixed-node WASM rerouting with label obstacles before depending on it
for editing. Package workers, fonts and WASM locally; do not fetch them from a
CDN at layout time. Offline startup itself remains a separate pending requirement.

Acceptance must include geometry diagnostics plus a visible diagram where a
person can trace labeled source→destination transitions. Measure movement,
crossings, bends, drawing area, lane clearances, label attachment and browser
latency. Preserve graph data exactly and report infeasible fixed constraints.
Use synthetic public fixtures and private local boards separately; never publish
another project's screenshots or graph content as benchmarks.

**NOT_RUN at the original research checkpoint:** libavoid browser integration, real DOM text measurement, docking
implementation, manual-pinning solver behavior, private-board comparative
benchmark, accessibility/readability study and independent product review of
this proposed algorithm. No product dependency, active board or running UI was
changed by the research probe.

## Mask-linked ordinary notes (W009,2026-11-09)

Navigation edges alone do not express annotation proximity. Undocked notes
referenced by a screen mask are now measured satellites in a reserved layout
box around that screen's existing composite. For RIGHT, notes stack below; for
DOWN, notes form a row to the right, with32 canvas pixels between boxes. An
explicit dock takes precedence. Shared notes choose the lowest visible screen
ID as primary owner, and each note is placed once; all semantic links survive.
The same adapter handles full automatic and transient focus placement. Manual
mode never applies the grouping.

ELK sees the reserved obstacle, not an additional navigation edge. Each real
incident edge has a separate port spread along the actual composite side.
[ELK port constraints](https://eclipse.dev/elk/reference/options/org-eclipse-elk-portConstraints.html)
provide FIXED_POS; the adapter bridges empty reserved padding to the actual
composite endpoint when the engine fixes the port to the box border. This keeps
routes outside satellite boxes without changing source/target IDs. Ports and
clusters are temporary solver objects; only ordinary node coordinates and real
edge geometry enter the portable layout. No note is silently docked/duplicated.

Engine metadata records `theboard.annotationPlacement: satellites-v1` and
`theboard.annotationGap:32` alongside the real ELK settings. These descriptive
TheBoard options are not passed to ELK. Limitations: primary ownership cannot
put a shared note next to several distant screens simultaneously, and many
annotations enlarge the reserved box. This remains a feasible-layout heuristic,
not an optimality or universal no-crossing guarantee.
