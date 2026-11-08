import { createContext, useContext, useRef } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useEdges,
  useNodes,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { Point } from "./layout";
export const LabelPositions = createContext<Record<string, Point>>({});
export const HoveredTransition = createContext<{
  id: string | null;
  setId: (id: string | null) => void;
  automatic?: boolean;
}>({ id: null, setId: () => {} });
export default function LabeledEdge(props: EdgeProps) {
  const [fallback, fallbackX, fallbackY] = getSmoothStepPath(props);
  const points = props.data?.route as Point[] | undefined;
  const path = points?.length ? points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ') : fallback;
  const midpoint = points?.[Math.floor(points.length/2)];
  const x=midpoint?.x ?? fallbackX, y=midpoint?.y ?? fallbackY;
  const edges = useEdges(),
    nodes = useNodes();
  const position = useContext(LabelPositions)[props.id] ?? { x, y };
  const hover = useContext(HoveredTransition);
  const drag = useRef<Point | null>(null);
  const { screenToFlowPosition, setEdges } = useReactFlow();
  const index = edges.findIndex((e) => e.id === props.id) + 1;
  const active = hover.id === props.id;
  const title = (id: string) =>
    String(nodes.find((n) => n.id === id)?.data.title ?? id);
  const route = title(props.source) + " → " + title(props.target);
  return (
    <>
      <BaseEdge
        data-routed={points?.length ? 'true' : 'false'}
        path={path}
        markerEnd={props.markerEnd}
        style={{
          ...props.style,
          stroke: active ? "#8151ba" : props.style?.stroke,
          strokeWidth: active ? 3 : 2,
          opacity: hover.id && !active ? 0.15 : 1,
        }}
      />
      {active && (
        <g pointerEvents="none">
          <line
            data-testid={"transition-leader-" + props.id}
            x1={position.x + 16}
            y1={position.y + 16}
            x2={x}
            y2={y}
            stroke="#9366ba"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={x} cy={y} r="10" fill="white" stroke="#8151ba" />
          <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fill="#8151ba">
            {index}
          </text>
        </g>
      )}
      <EdgeLabelRenderer>
        {props.label && (
          <div
            data-testid={"edge-label-" + props.id}
            className={
              "transition-label nodrag nopan " + (active ? "is-active" : "")
            }
            style={{
              transform: `translate(${position.x}px,${position.y}px)`,
              opacity: hover.id && !active ? 0.4 : 1,
            }}
            title={
              route +
              " — " +
              String(props.label) +
              " · Перетащите подпись для настройки"
            }
            onPointerEnter={() => hover.setId(props.id)}
            onPointerLeave={() => {
              if (!drag.current) hover.setId(null);
            }}
            onPointerDown={(e) => {
              if (hover.automatic) return;
              if (e.button !== 0) return;
              e.preventDefault();
              e.stopPropagation();
              hover.setId(props.id);
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
                    ? { ...edge, data: { ...edge.data, labelPosition, labelManual:true } }
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
              hover.setId(null);
            }}
          >
            <span className="transition-route">{route}</span>
            <span className="transition-index">{index}</span>
            <span>{props.label}</span>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
