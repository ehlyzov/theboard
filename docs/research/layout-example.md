# Running a local layout example

The owner requested a concrete example on supplied local UFD data. The generator
creates a separate **read-only interactive preview**, not an import into the main
editor. It does not access IndexedDB or change an existing board. Source assets
and semantic JSON remain unchanged; only exported visual layout is new.

The input is a v1 board folder (`board.json` and local PNG/JPEG/WebP assets).
Provide an explicit docking map in another JSON file; no association is inferred
from coordinates or note text:

```json
{"note-home":{"screenId":"home","side":"bottom"}}
```

This example supports bottom docking only, with notes spanning the screen's
width. Notes retain their IDs and text. Other notes are separate objects. It
does not complete the editor's required four-side dock/undock feature (DOCK-01).

Install the pinned research engine outside the product, then generate into a
new folder outside the input folder:

```sh
engine_dir=$(mktemp -d)
npm install --prefix "$engine_dir" --ignore-scripts --no-audit --no-fund elkjs@0.12.1
node scripts/layout-example.mjs /absolute/input-board /absolute/new-example \
  "$engine_dir/node_modules/elkjs/lib/elk.bundled.js" /absolute/docks.json
python3 -m http.server 4182 --bind 127.0.0.1 --directory /absolute/new-example
```

The generator refuses an existing output directory, validates references and
copies only referenced local images. Keep private inputs and generated previews
outside this public repository. The generated folder includes the ELK license;
the upstream source is [elkjs](https://github.com/kieler/elkjs).

Open `http://127.0.0.1:4182/`. The preview loads local images/fonts, measures
actual card and wrapped-label boxes, runs ELK, and renders its bend points.
Choose a screen in the sidebar, pan with drag/Space/Alt, zoom up to 400%, fit the
whole diagram, or view the selected screen's outgoing neighborhood. Switching
direction recomputes layout. Hovering a transition label highlights its path and
endpoints and shows its dashed leader; leaders are hidden at rest.

The diagnostic dialog reports rectangle overlaps, route-obstacle intersections,
positive-length coincident segments and proper segment crossings. These are
geometric checks, not independent acceptance or a comprehension study.

“Save layout” downloads the original semantic nodes/edges with geometry in
`layout`: engine/options, docking, node boxes, edge points and label boxes.
Legacy inline node positions are removed in that download. The example's route
and docking extensions are **experimental**: the current main editor does not
roundtrip/render all of them. Keep the generated preview folder together with
its local assets for viewing; `source-board.json` retains the supplied source.
Reload currently recomputes this example; it is not the editor's saved workspace.

## Observed local result

On the supplied private UFD: 32 screens, 33 notes, 76 directed labeled edges;
32 explicitly docked note pairs and one standalone legend. With measured boxes,
the RIGHT layout had zero measured node overlaps, label overlaps, label-node
hits, nonincident route-node hits, route-label hits and coincident segment pairs.
It retained 64 proper segment crossings, with bounds about 8,624×7,645 board
units. These numbers describe this specific input/configuration, not a universal
guarantee or a comparison against the different synthetic fixture.

The local private handoff holds the exact input/output paths, resulting JSON,
screenshots and semantic equality checks. No real board content belongs here.
