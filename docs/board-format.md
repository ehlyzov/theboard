# Declarative board format v1

A portable board is a ZIP containing `board.json` and image files in `assets/`.
The JSON is UTF-8, readable, editable, and independent of React or browser state.
Agents can generate the folder directly. Stable IDs express relationships;
array order is not an identity. Coordinates are explicit canvas pixels.

```json
{
  "version": 1,
  "title": "Example flow",
  "nodes": [
    {"id":"home","type":"screen","position":{"x":70,"y":100},"data":{"title":"Home","image":"assets/home.png"}},
    {"id":"details","type":"screen","position":{"x":410,"y":100},"data":{"title":"Details","image":"assets/details.png"}},
    {"id":"comment","type":"note","position":{"x":70,"y":520},"data":{"title":"Audit","text":"Explain the alternate path."}}
  ],
  "edges": [
    {"id":"open-details","source":"home","target":"details","label":"Select an item"}
  ]
}
```

Node IDs and edge IDs must be unique within their own collections. Supported
node types are `screen` and `note`. Positions must have finite numeric `x/y`.
Edges refer to two different screen IDs and are always directed. `label` is
plain text. Notes use `data.text`. The importer reconstructs visual arrowheads;
there is no executable code, callback, HTML template, or hidden workflow state
in the document. Source versions and audit explanations can be explicit notes
and screen titles. Preserve baseline/updated provenance when preparing boards.

Image paths must be relative `assets/` paths, without `..`, ending in PNG,
JPG/JPEG, or WebP. Images must be included and decodable, up to 10 MB and
40 megapixels each. Limits: 500 nodes, 2,000 edges, 180 MB compressed or
uncompressed archive content. External image URLs and SVG are not accepted.
Import validates before saving and creates a new UUID board, preserving existing
boards. Unknown fields are not part of v1 and are not guaranteed to roundtrip.

## Agent CLI

Only Python's standard library is needed:

```sh
python3 scripts/board_archive.py pack /absolute/board-folder /absolute/new-board.zip
python3 scripts/board_archive.py unpack /absolute/board.zip /absolute/new-folder
```

Both commands refuse to overwrite an existing destination. They validate
relationships and paths; the browser importer additionally decodes images and
validates field lengths. The exported ZIP is the canonical portable form;
IndexedDB is a local working copy, not a server or a shareable URL.

The UI stores each board under its own ID in IndexedDB (`theboard`, `boards`).
Open an existing local ID using `http://127.0.0.1:4173/?board=<id>`. A different
browser/profile/origin needs the ZIP; the ID alone does not transfer the data.
Wait for the saved indicator before closing. Save errors are shown explicitly;
export an archive when browser storage is unavailable or full. Simultaneous
editing of the same ID in multiple tabs is not coordinated.

## Image masks and note links

Screen `data.regions` is optional (up to 200). Each region has a stable `id`,
normalized bounding box `x/y/width/height`, `noteIds` pointing to ordinary note
nodes, and `strokes`: arrays of `{radius, points:[{x,y}]}`. Coordinates range
from 0 to 1 relative to the original image; radius is a fraction of image width
(up to 0.2), retained per stroke. Screenshots remain unmodified. Up to 1,000
strokes per mask and 20,000 points per stroke are accepted.

Optional legacy `comments` are migrated into ordinary note nodes, retaining
text, open/done status, and timestamps; new masks use note links, not a separate
comment workflow. Notes optionally store `status: open|done`, `createdAt`, and
`resolvedAt`. Done notes remain present. Deleting a region removes only the
mask/links; Undo restores it, while notes and images remain unchanged.

Canvas viewport and last opened board are browser-local workspace preferences
in localStorage, separate from portable content. They restore after reload;
portable archives retain all board geometry and mask-to-note relationships.

## Separate visual layout

New exports store node coordinates in `layout.nodes[nodeId] = {x,y}` and edge
label coordinates in `layout.edges[edgeId] = {label:{x,y},manual:boolean}`.
Semantic `nodes`/`edges` do not carry exported node positions. Older archives
with inline node.position remain importable; layout.nodes takes precedence.
In manual mode, drag nodes by their header and drag edge labels. A dashed
leader identifies the label's transition only on hover, together with endpoint
and path highlighting. Graph IDs, source/target, and labels retain meaning.

`layout.automatic` is a boolean (default false); `layout.direction` is `RIGHT`
or `DOWN`. The current editor uses measured composite card/label bounds and
ELK Layered 0.12.1. `layout.engine` retains the generating engine name, version
and options as passive provenance. It does not execute code or select a remote
engine. Generated `layout.edges[edgeId].points` is an array of `{x,y}` route
vertices; the editor renders these actual routes. `label` stores its top-left
position and `manual` records manual label placement. Older archives remain
valid without these optional extensions.

Docking remains visual layout, separate from note content:

```json
{"layout":{"docks":{"note-home":{"screenId":"home","side":"bottom"}}}}
```

The note is still an ordinary `nodes` entry with the same ID, text, title,
color, completion status and mask links. Sides are `left`, `right`, `top` and
`bottom`. A docked note spans the attachment side; the composite moves as one
obstacle and routing attaches to its outer boundary. Deleting a screen undocks
its notes rather than deleting them. Archives preserve this mapping; legacy
archives without it contain independent notes.

Automatic mode reruns on relevant graph/content/docking changes, with stale
calculations discarded. Manual mode retains the current positions. Enabling
automatic mode opens a reset warning; cancel leaves geometry unchanged.
Manually dragging nodes invalidates generated paths and uses the existing
manual routing. General obstacle-aware routing with arbitrary fixed positions
remains pending; manual mode is not a claim of collision-free routing.

Focus changes visibility and viewport framing only. The current screen and its
direct destinations remain the focused set. If fitting that set would shrink
the view below50%, framing centers the current composite instead; destinations
remain available by panning or clicking their emphasized sidebar entries.
Clicking the current sidebar entry always recenters it. This does not move
objects or alter stored graph relationships.

Normal import creates a new board. “Replace board from ZIP” validates first,
saves the old board under a recovery ID, then replaces the current board while
keeping its URL. Invalid archives leave it unchanged. A recovery link remains
available in that browser; transient old-mask Undo state is cleared on replace.

## Temporary focus view

Focus computes a separate compact view of the current screen, its outgoing
destinations and visible notes. Its node positions, routes and label placements
are runtime-only: they never replace the canonical `layout` exported here or
the board stored in IndexedDB. Reload recomputes that view. Leaving focus
restores canonical placement and the normal-view viewport. Ordinary content
edits and explicit global layout controls retain their existing persistence.
