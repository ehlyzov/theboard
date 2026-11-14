import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";
import { MarkerType, type Node, type Edge } from "@xyflow/react";
import { labelLayouts } from "./layout";
import { NOTE_COLORS, type NoteColor } from "./noteColors";
export type RegionComment = {
  id: string;
  text: string;
  status: "open" | "done";
  createdAt: string;
  resolvedAt?: string;
};
export type Stroke = { radius: number; points: { x: number; y: number }[] };
export type Dock = { screenId: string; side: 'left' | 'right' | 'top' | 'bottom' };
export type LayoutSettings = { automatic: boolean; direction: 'RIGHT' | 'DOWN' };
export type EngineMetadata = {name:string;version:string;options:Record<string,string|number|boolean>};
export type Region = {
  strokes?: Stroke[];
  noteIds?: string[];
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  comments: RegionComment[];
};
function regions(value: unknown): Region[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 200) fail();
  const ids = new Set<string>();
  return value.map((r) => {
    const id = text(r.id, 150);
    if (!id || ids.has(id)) fail();
    ids.add(id);
    if (
      ![r.x, r.y, r.width, r.height].every((v) => Number.isFinite(v)) ||
      r.x < 0 ||
      r.y < 0 ||
      r.width <= 0 ||
      r.height <= 0 ||
      r.x + r.width > 1.000001 ||
      r.y + r.height > 1.000001 ||
      !Array.isArray(r.comments) ||
      r.comments.length > 500
    )
      fail();
    const commentIds = new Set<string>();
    const comments = r.comments.map((c: any) => {
      const cid = text(c.id, 150);
      if (!cid || commentIds.has(cid) || !["open", "done"].includes(c.status))
        fail();
      commentIds.add(cid);
      const createdAt = text(c.createdAt, 50);
      if (!Number.isFinite(Date.parse(createdAt))) fail();
      const resolvedAt =
        c.resolvedAt === undefined ? undefined : text(c.resolvedAt, 50);
      if (resolvedAt !== undefined && !Number.isFinite(Date.parse(resolvedAt)))
        fail();
      return {
        id: cid,
        text: text(c.text, 4000),
        status: c.status,
        createdAt,
        ...(resolvedAt ? { resolvedAt } : {}),
      };
    });
    const noteIds = r.noteIds ?? [];
    if (
      !Array.isArray(noteIds) ||
      noteIds.length > 500 ||
      noteIds.some((n: unknown) => typeof n !== "string")
    )
      fail();
    let strokes: Stroke[] | undefined;
    if (r.strokes !== undefined) {
      if (!Array.isArray(r.strokes) || r.strokes.length > 1000) fail();
      strokes = r.strokes.map((s: any) => {
        if (
          !Number.isFinite(s.radius) ||
          s.radius <= 0 ||
          s.radius > 0.2 ||
          !Array.isArray(s.points) ||
          s.points.length > 20000 ||
          s.points.length < 1
        )
          fail();
        return {
          radius: s.radius,
          points: s.points.map((p: any) => {
            if (
              !Number.isFinite(p.x) ||
              !Number.isFinite(p.y) ||
              p.x < 0 ||
              p.x > 1 ||
              p.y < 0 ||
              p.y > 1
            )
              fail();
            return { x: p.x, y: p.y };
          }),
        };
      });
    }
    return {
      id,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      comments,
      noteIds,
      strokes,
    };
  });
}
export type BoardNode = Node<
  {
    title: string;
    image?: string;
    text?: string;
    regions?: Region[];
    imageSize?: { width: number; height: number };
    color?: NoteColor;
    /** Read-only metadata retained from archives predating NOTE-03. */
    status?: "open" | "done";
    createdAt?: string;
    resolvedAt?: string;
    dock?: Dock;
  },
  "screen" | "note"
>;
export type BoardData = {
  version: 1;
  title: string;
  nodes: BoardNode[];
  edges: Edge[];
  layoutSettings?: LayoutSettings;
  layoutEngine?: EngineMetadata;
};
const MAX = 180 * 1024 * 1024;
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("theboard", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("boards");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadBoard(id: string): Promise<BoardData | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("boards").objectStore("boards").get(id);
      request.onsuccess = () =>
        resolve(request.result ? migrateBoard(request.result) : undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
export async function saveBoard(id: string, data: BoardData) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("boards", "readwrite");
      transaction.objectStore("boards").put(migrateBoard(data), id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}
function fail(): never {
  throw new Error("Некорректный архив доски");
}
function text(v: unknown, max: number) {
  if (typeof v !== "string" || v.length > max) fail();
  return v as string;
}
function connectionFace(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !['left','right','top','bottom'].includes(value)) fail();
  return value as string;
}
export async function importBoard(file: File): Promise<BoardData> {
  if (file.size > MAX) throw new Error("Архив слишком большой (до 180 МБ)");
  let total = 0;
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: (entry) => {
      total += entry.originalSize;
      if (total > MAX) throw new Error("Распакованный архив превышает 180 МБ");
      return true;
    },
  });
  if (!entries["board.json"]) fail();
  const raw = JSON.parse(strFromU8(entries["board.json"]));
  if (
    raw.version !== 1 ||
    !Array.isArray(raw.nodes) ||
    !Array.isArray(raw.edges) ||
    raw.nodes.length > 500 ||
    raw.edges.length > 2000
  )
    fail();
  const ids = new Set<string>();
  const screens = new Set<string>();
  const nodes: BoardNode[] = [];
  for (const n of raw.nodes) {
    n.position = raw.layout?.nodes?.[n.id] ?? n.position;
    const id = text(n.id, 150);
    if (
      !id ||
      ids.has(id) ||
      !["screen", "note"].includes(n.type) ||
      !Number.isFinite(n.position?.x) ||
      !Number.isFinite(n.position?.y)
    )
      fail();
    ids.add(id);
    const data: BoardNode["data"] = { title: text(n.data?.title, 300) };
    if (n.type === "note") {
      data.text = text(n.data?.text ?? "", 12000);
      if (n.data?.color !== undefined) {
        if (!Object.hasOwn(NOTE_COLORS, n.data.color)) fail();
        data.color = n.data.color;
      }
      if (n.data?.status !== undefined) {
        if (!["open", "done"].includes(n.data.status)) fail();
        data.status = n.data.status;
      }
      if (n.data?.createdAt) data.createdAt = text(n.data.createdAt, 50);
      if (n.data?.resolvedAt) data.resolvedAt = text(n.data.resolvedAt, 50);
    } else {
      screens.add(id);
      data.regions = regions(n.data?.regions);
      const path = text(n.data?.image, 300);
      if (
        !/^assets\/[^\\\x00-\x1f]+\.(png|jpe?g|webp)$/i.test(path) ||
        path.includes("..") ||
        !entries[path]
      )
        fail();
      const bytes = entries[path];
      if (bytes.length > 10 * 1024 * 1024) fail();
      const mime = /\.png$/i.test(path)
        ? "image/png"
        : /\.webp$/i.test(path)
          ? "image/webp"
          : "image/jpeg";
      const blob = new Blob([new Uint8Array(bytes)], { type: mime });
      const bitmap = await createImageBitmap(blob);
      data.imageSize = { width: bitmap.width, height: bitmap.height };
      const pixels = bitmap.width * bitmap.height;
      bitmap.close();
      if (pixels > 40_000_000) fail();
      data.image = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(blob);
      });
    }
    nodes.push({
      id,
      type: n.type,
      position: { x: n.position.x, y: n.position.y },
      data,
      dragHandle: ".node-grip",
    });
  }
  const edgeIds = new Set<string>();
  for (const [noteId, dock] of Object.entries(raw.layout?.docks ?? {}) as [string, any][]) {
    const note = nodes.find(n => n.id === noteId && n.type === 'note');
    if (!note || !screens.has(dock?.screenId) || !['left','right','top','bottom'].includes(dock?.side)) fail();
    note.data.dock = {screenId:dock.screenId,side:dock.side};
  }
  const edges: Edge[] = raw.edges.map((e: any) => {
    const id = text(e.id, 150);
    if (
      !id ||
      edgeIds.has(id) ||
      !screens.has(e.source) ||
      !screens.has(e.target) ||
      e.source === e.target
    )
      fail();
    edgeIds.add(id);
    return {
      id,
      source: e.source,
      target: e.target,
      sourceHandle: connectionFace(e.sourceHandle),
      targetHandle: connectionFace(e.targetHandle),
      label: text(e.label ?? "", 500),
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      style: { stroke: "#7c879d", strokeWidth: 2 },
      data: (() => {
        const layout = raw.layout?.edges?.[id];
        if (!layout) return undefined;
        const data: Record<string, unknown> = {};
        if (layout.points !== undefined) {
          if (!Array.isArray(layout.points) || layout.points.length < 2 || layout.points.length > 2000) fail();
          data.route = layout.points.map(validPoint);
        }
        if (layout.label && (layout.manual || data.route)) {
          data.labelPosition = validPoint(layout.label);
          data.labelManual = Boolean(layout.manual);
        }
        return data;
      })(),
    };
  });
  for (const n of nodes)
    for (const region of n.data.regions ?? [])
      for (const noteId of region.noteIds ?? [])
        if (!nodes.some((note) => note.id === noteId && note.type === "note"))
          fail();
  if (raw.layout?.automatic !== undefined && typeof raw.layout.automatic !== 'boolean') fail();
  if (raw.layout?.direction !== undefined && !['RIGHT','DOWN'].includes(raw.layout.direction)) fail();
  let layoutEngine:EngineMetadata|undefined;
  if(raw.layout?.engine){
    const e=raw.layout.engine,options=e.options??{};
    if(typeof options!=='object'||Array.isArray(options)||Object.keys(options).length>100)fail();
    for(const [key,value]of Object.entries(options)){
      text(key,200);
      if(typeof value==='string')text(value,500);
      else if(typeof value!=='boolean' && !(typeof value==='number'&&Number.isFinite(value)))fail();
    }
    layoutEngine={name:text(e.name,100),version:text(e.version,100),options};
  }
  return migrateBoard({
    version: 1,
    title: text(raw.title, 300),
    nodes,
    edges,
    layoutSettings: {automatic: raw.layout?.automatic ?? false, direction:raw.layout?.direction ?? 'RIGHT'},
    layoutEngine,
  });
}
export function exportBoard(board: BoardData): Uint8Array {
  if (board.nodes.length > 500 || board.edges.length > 2000)
    throw new Error("Board size limit");
  text(board.title, 300);
  board.nodes.forEach((n) => {
    text(n.data.title, 300);
    regions(n.data.regions);
    if (n.type === "note") text(n.data.text ?? "", 12000);
  });
  board.edges.forEach((e) => text(e.label ?? "", 500));
  for (const n of board.nodes)
    for (const r of n.data.regions ?? [])
      for (const id of r.noteIds ?? [])
        if (!board.nodes.some((note) => note.type === "note" && note.id === id))
          fail();
  board = migrateBoard(board);
  if (board.nodes.length > 500) throw new Error("Board size limit");
  const labelPositions=labelLayouts(board.nodes,board.edges);
  const files: Record<string, Uint8Array> = {};
  const nodes = board.nodes.map((n, index) => {
    const data = { ...n.data };
    delete data.dock;
    if (n.type === "screen") {
      const match = /^data:image\/(png|jpeg|webp);base64,(.*)$/.exec(
        data.image ?? "",
      );
      if (!match) fail();
      const path = `assets/screen-${index}.${match![1]}`;
      const binary = atob(match![2]);
      files[path] = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      data.image = path;
    }
    return { id: n.id, type: n.type, data };
  });
  files["board.json"] = strToU8(
    JSON.stringify(
      {
        version: 1,
        title: board.title,
        nodes,
        layout: {
          ...board.layoutSettings,
          engine: board.layoutEngine,
          docks: Object.fromEntries(board.nodes.filter(n => n.data.dock).map(n => [n.id,n.data.dock])),
          nodes: Object.fromEntries(board.nodes.map((n) => [n.id, n.position])),
          edges: Object.fromEntries(
            board.edges.map(e => [e.id, {
              label:labelPositions[e.id],
              manual: Boolean(e.data?.labelManual ?? (e.data?.labelPosition && !e.data?.route)),
              points:e.data?.route,
            }]),
          ),
        },
        edges: board.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          ...(e.sourceHandle ? {sourceHandle:e.sourceHandle} : {}),
          ...(e.targetHandle ? {targetHandle:e.targetHandle} : {}),
          label: e.label ?? "",
        })),
      },
      null,
      2,
    ),
  );
  if (Object.values(files).reduce((size, file) => size + file.length, 0) > MAX)
    throw new Error("Archive size limit");
  return zipSync(files, { level: 3 });
}

// A saved mask belongs to one or more surviving ordinary notes. Draft masks
// are kept outside BoardData until the editor attaches a note.
export function pruneUnlinkedRegions(nodes: BoardNode[]): BoardNode[] {
  const notes = new Set(nodes.filter(n => n.type === "note").map(n => n.id));
  return nodes.map(n => ({...n, data: {...n.data,
    regions: n.data.regions?.map(r => ({...r,
      noteIds: [...new Set((r.noteIds ?? []).filter(id => notes.has(id)))],
    })).filter(r => r.noteIds.length > 0),
  }}));
}

export function removeBoardNodes(nodes: BoardNode[], ids: Set<string>): BoardNode[] {
  return pruneUnlinkedRegions(nodes.filter(n => !ids.has(n.id)).map(n => ({...n,
    data: {...n.data, dock: n.data.dock && ids.has(n.data.dock.screenId) ? undefined : n.data.dock},
  })));
}

export function migrateBoard(board: BoardData): BoardData {
  const additions: BoardNode[] = [];
  const nodes = board.nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      regions: n.data.regions?.map((r) => {
        const noteIds = [...(r.noteIds ?? [])];
        for (const c of r.comments ?? []) {
          const id = crypto.randomUUID();
          additions.push({
            id,
            type: "note",
            position: {
              x: n.position.x + 280,
              y: n.position.y + additions.length * 210,
            },
            dragHandle: ".node-grip",
            data: {
              title: "Migrated annotation",
              text: c.text,
              status: c.status,
              createdAt: c.createdAt,
              resolvedAt: c.resolvedAt,
            },
          });
          noteIds.push(id);
        }
        return { ...r, noteIds, comments: [] };
      }),
    },
  }));
  // Convert legacy history before removing genuinely note-less masks.
  return { ...board, nodes: pruneUnlinkedRegions([...nodes, ...additions]) };
}

function validPoint(p: any) {
  if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) fail();
  return { x: p.x, y: p.y };
}
