import { createContext, useContext, useRef } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useEdges,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { Point } from "./layout";
export const LabelPositions = createContext<Record<string, Point>>({});
export default function LabeledEdge(props: EdgeProps) {
  const [path, x, y] = getSmoothStepPath(props);
  const edges = useEdges();
  const position = useContext(LabelPositions)[props.id] ?? { x, y };
  const drag = useRef<Point | null>(null);
  const { screenToFlowPosition, setEdges } = useReactFlow();
  const index = edges.findIndex((e) => e.id === props.id) + 1;
  return (
    <>
      <BaseEdge path={path} markerEnd={props.markerEnd} style={props.style} />
      <EdgeLabelRenderer>
        {props.label && (
          <>
            <svg className="label-leader" width="1" height="1">
              <line
                x1={x}
                y1={y}
                x2={position.x + 10}
                y2={position.y + 12}
                stroke="#ada4bc"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle cx={x} cy={y} r="3" fill="#93839e" />
            </svg>
            <div
              data-testid={"edge-label-" + props.id}
              className="transition-label nodrag nopan"
              style={{
                transform: `translate(${position.x}px,${position.y}px)`,
              }}
              title={`Переход ${index}: ${props.source} → ${props.target}. Перетащите подпись для настройки.`}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
                drag.current = { x: p.x - position.x, y: p.y - position.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                e.stopPropagation();
                const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
                const labelPosition = {
                  x: p.x - drag.current.x,
                  y: p.y - drag.current.y,
                };
                setEdges((current) =>
                  current.map((edge) =>
                    edge.id === props.id
                      ? { ...edge, data: { ...edge.data, labelPosition } }
                      : edge,
                  ),
                );
              }}
              onPointerUp={(e) => {
                if (drag.current) {
                  drag.current = null;
                  e.stopPropagation();
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              <span className="transition-index">{index}</span>
              <span>{props.label}</span>
            </div>
          </>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
