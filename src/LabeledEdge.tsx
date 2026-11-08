import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useEdges,
  type EdgeProps,
} from "@xyflow/react";
export default function LabeledEdge(props: EdgeProps) {
  const [path, x, y] = getSmoothStepPath(props);
  const edges = useEdges();
  const peers = edges.filter(
    (e) =>
      (e.source === props.source && e.target === props.target) ||
      (e.source === props.target && e.target === props.source),
  );
  const index = peers.findIndex((e) => e.id === props.id);
  const offset = (index - (peers.length - 1) / 2) * 28;
  return (
    <>
      <BaseEdge path={path} markerEnd={props.markerEnd} style={props.style} />
      <EdgeLabelRenderer>
        {props.label && (
          <div
            className="transition-label nodrag nopan"
            style={{
              transform: `translate(-50%,-50%) translate(${x}px,${y + offset}px)`,
            }}
          >
            {props.label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
