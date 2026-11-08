import { getSmoothStepPath, Position, type Edge } from "@xyflow/react";
import type { BoardNode } from "./boards";
export type Point = { x: number; y: number };
export const AUTO_LAYOUT_OPTIONS = {
  'elk.algorithm':'layered','elk.edgeRouting':'ORTHOGONAL','elk.randomSeed':'1',
  'elk.spacing.nodeNode':'100','elk.layered.spacing.nodeNodeBetweenLayers':'180',
  'elk.spacing.edgeNode':'24','elk.spacing.edgeEdge':'20','elk.layered.spacing.edgeEdgeBetweenLayers':'20',
  'elk.spacing.edgeLabel':'12','elk.spacing.labelNode':'16','elk.spacing.labelLabel':'16',
  'elk.layered.mergeEdges':'false','elk.layered.mergeHierarchyEdges':'false',
};
type Rect = Point & { width: number; height: number };
export function nodeSize(n: BoardNode) {
  const ratio =
    (n.data.imageSize?.width ?? 210) / (n.data.imageSize?.height ?? 290);
  return {
    width:
      n.measured?.width ??
      (n.type === "screen" ? (ratio >= 1 ? 400 : 230) : 230),
    height:
      n.measured?.height ??
      (n.type === "screen" ? 82 + (ratio >= 1 ? 380 : 210) / ratio : 183),
  };
}
const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.width + 10 &&
  a.x + a.width + 10 > b.x &&
  a.y < b.y + b.height + 10 &&
  a.y + a.height + 10 > b.y;
export function freePosition(
  preferred: Point,
  width: number,
  height: number,
  obstacles: Rect[],
): Point {
  for (let ring = 0; ring < 50; ring++)
    for (let y = -ring; y <= ring; y++)
      for (let x = -ring; x <= ring; x++) {
        if (ring && Math.max(Math.abs(x), Math.abs(y)) !== ring) continue;
        const p = {
          x: preferred.x + x * (width + 16),
          y: preferred.y + y * (height + 16),
        };
        if (!obstacles.some((b) => intersects({ ...p, width, height }, b)))
          return p;
      }
  return preferred;
}
export function labelLayouts(
  nodes: BoardNode[],
  edges: Edge[],
): Record<string, Point> {
  const obstacles: Rect[] = nodes
    .filter((n) => !n.hidden)
    .map((n) => ({ ...n.position, ...nodeSize(n) }));
  const result: Record<string, Point> = {};
  for (const edge of edges) {
    if (!edge.label || edge.hidden) continue;
    const source = nodes.find((n) => n.id === edge.source),
      target = nodes.find((n) => n.id === edge.target);
    if (!source || !target) continue;
    const s = nodeSize(source),
      t = nodeSize(target);
    const [, x, y] = getSmoothStepPath({
      sourceX: source.position.x + s.width,
      sourceY: source.position.y + s.height / 2,
      sourcePosition: Position.Right,
      targetX: target.position.x,
      targetY: target.position.y + t.height / 2,
      targetPosition: Position.Left,
    });
    const width = 240,
      height = Math.max(
        30,
        Math.ceil(String(edge.label).length / (width / 7 - 5)) * 16 + 40,
      );
    const manual = edge.data?.labelPosition as Point | undefined;
    const p = manual ?? freePosition(
      { x: x - width / 2, y: y - height / 2 },
      width,
      height,
      obstacles,
    );
    result[edge.id] = p;
    obstacles.push({ ...p, width, height });
  }
  return result;
}
