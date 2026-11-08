import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";
import { MarkerType, type Node, type Edge } from "@xyflow/react";
export type BoardNode = Node<
  { title: string; image?: string; text?: string },
  "screen" | "note"
>;
export type BoardData = {
  version: 1;
  title: string;
  nodes: BoardNode[];
  edges: Edge[];
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
      request.onsuccess = () => resolve(request.result);
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
      transaction.objectStore("boards").put(data, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}
const fail = () => {
  throw new Error("Некорректный архив доски");
};
function text(v: unknown, max: number) {
  if (typeof v !== "string" || v.length > max) fail();
  return v as string;
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
    if (n.type === "note") data.text = text(n.data?.text ?? "", 12000);
    else {
      screens.add(id);
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
      label: text(e.label ?? "", 500),
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      style: { stroke: "#7c879d", strokeWidth: 2 },
    };
  });
  return { version: 1, title: text(raw.title, 300), nodes, edges };
}
export function exportBoard(board: BoardData): Uint8Array {
  if (board.nodes.length > 500 || board.edges.length > 2000)
    throw new Error("Board size limit");
  text(board.title, 300);
  board.nodes.forEach((n) => {
    text(n.data.title, 300);
    if (n.type === "note") text(n.data.text ?? "", 12000);
  });
  board.edges.forEach((e) => text(e.label ?? "", 500));
  const files: Record<string, Uint8Array> = {};
  const nodes = board.nodes.map((n, index) => {
    const data = { ...n.data };
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
    return { id: n.id, type: n.type, position: n.position, data };
  });
  files["board.json"] = strToU8(
    JSON.stringify(
      {
        version: 1,
        title: board.title,
        nodes,
        edges: board.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
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
