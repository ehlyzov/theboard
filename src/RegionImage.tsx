import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Region, Stroke } from "./boards";
type Props = {
  image: string;
  imageSize?: { width: number; height: number };
  title: string;
  regions: Region[];
  pendingRegion?: Region;
  selected: string | undefined;
  drawing: boolean;
  radius: number;
  activeScreen: boolean;
  blocked: boolean;
  onStart: () => void;
  onCancel: () => void;
  onCreate: (region: Region) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onImageSize: (width: number, height: number) => void;
};
const isEditing = (target: EventTarget | null) =>
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLInputElement &&
    !["file", "button", "checkbox", "range"].includes(target.type)) ||
  (target instanceof HTMLElement && target.isContentEditable);
export default function RegionImage({
  image,
  imageSize,
  title,
  regions,
  pendingRegion,
  selected,
  drawing,
  radius,
  activeScreen,
  blocked,
  onStart,
  onCancel,
  onCreate,
  onSelect,
  onHover,
  onImageSize,
}: Props) {
  const [loadedRatio, setRatio] = useState(1);
  // Hidden focus cards remount before their load event. Use the dimensions
  // already decoded by upload/import so layout never measures a square stub.
  const ratio = imageSize ? imageSize.width / imageSize.height : loadedRatio;
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [active, setActive] = useState<Stroke | null>(null);
  const strokeRef = useRef<Stroke | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  function reset() {
    setStrokes([]);
    setActive(null);
    strokeRef.current = null;
    setCursor(null);
  }
  useEffect(() => {
    if (!drawing) reset();
  }, [drawing]);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (!drawing || !activeScreen || isEditing(e.target)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        reset();
        onCancel();
      } else if (e.key === "Enter" && strokes.length) {
        e.preventDefault();
        onCreate({
          id: crypto.randomUUID(),
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          comments: [],
          noteIds: [],
          strokes,
        });
        reset();
      } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        setStrokes((s) => s.slice(0, -1));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setStrokes([]);
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [drawing, activeScreen, strokes, onCreate, onCancel]);
  const point = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.x) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.y) / r.height)),
    };
  };
  const shape = (r: Region) => ({
    left: r.x * 100 + "%",
    top: r.y * 100 + "%",
    width: r.width * 100 + "%",
    height: r.height * 100 + "%",
  });
  const lines = (items: Stroke[]) =>
    items.map((s, i) => (
      <polyline
        key={i}
        points={s.points
          .map((p) => `${p.x * 1000},${(p.y * 1000) / ratio}`)
          .join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={s.radius * 2000}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ));
  return (
    <div className="screen-image">
      <div
        data-testid="annotation-image"
        className={"annotation-image nodrag " + (drawing ? "drawing" : "")}
        style={{
          width: ratio >= 1 ? 380 : 210,
          height: (ratio >= 1 ? 380 : 210) / ratio,
        }}
        onPointerDown={(e) => {
          if (
            !drawing ||
            blocked ||
            e.button !== 0 ||
            strokes.length >= 1000 ||
            regions.length >= 200
          )
            return;
          e.stopPropagation();
          e.preventDefault();
          onStart();
          const p = point(e);
          const s = { radius, points: [p, { ...p }] };
          strokeRef.current = s;
          setActive(s);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          setCursor(point(e));
          if (strokeRef.current && strokeRef.current.points.length < 20000) {
            e.stopPropagation();
            const s = {
              ...strokeRef.current,
              points: [...strokeRef.current.points, point(e)],
            };
            strokeRef.current = s;
            setActive(s);
          }
        }}
        onPointerLeave={() => {
          if (!strokeRef.current) setCursor(null);
        }}
        onPointerCancel={() => {
          strokeRef.current = null;
          setActive(null);
        }}
        onPointerUp={(e) => {
          if (!strokeRef.current) return;
          e.stopPropagation();
          const completed = strokeRef.current;
          setStrokes((current) => [...current, completed]);
          strokeRef.current = null;
          setActive(null);
        }}
      >
        <img
          src={image}
          alt={title || "Экран приложения"}
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            setRatio(img.naturalWidth / img.naturalHeight);
            onImageSize(img.naturalWidth, img.naturalHeight);
          }}
        />
        {regions.map((r, i) =>
          r.strokes?.length ? (
            <svg
              key={r.id}
              className={"brush-mask " + (selected === r.id ? "selected" : "")}
              viewBox={`0 0 1000 ${1000 / ratio}`}
              style={{ pointerEvents: "none" }}
            >
              <g
                role="button"
                tabIndex={0}
                aria-label={"Область " + (i + 1)}
                style={{ pointerEvents: drawing ? "none" : "stroke" }}
                onPointerEnter={() => onHover(r.id)}
                onPointerLeave={() => onHover(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(r.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(r.id);
                  }
                }}
              >
                {lines(r.strokes)}
              </g>
            </svg>
          ) : (
            <button
              key={r.id}
              type="button"
              className={"region-mask " + (selected === r.id ? "selected" : "")}
              style={{ ...shape(r), pointerEvents: drawing ? "none" : "auto" }}
              aria-label={"Область " + (i + 1)}
              onPointerEnter={() => onHover(r.id)}
              onPointerLeave={() => onHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(r.id);
              }}
            >
              <span>{i + 1}</span>
            </button>
          ),
        )}
        {pendingRegion && (
          pendingRegion.strokes?.length ? (
            <svg data-testid="pending-region-preview" role="img" aria-label="Выделение для заметки"
              className="brush-mask selected" viewBox={`0 0 1000 ${1000 / ratio}`}
              style={{pointerEvents:'none'}}>
              {lines(pendingRegion.strokes)}
            </svg>
          ) : (
            <div data-testid="pending-region-preview" role="img" aria-label="Выделение для заметки"
              className="region-mask selected" style={{...shape(pendingRegion),pointerEvents:'none'}}/>
          )
        )}
        {drawing && (
          <svg className="brush-draft" viewBox={`0 0 1000 ${1000 / ratio}`}>
            {lines([...strokes, ...(active ? [active] : [])])}
          </svg>
        )}
        {drawing && cursor && (
          <div
            className="brush-cursor"
            style={{
              left: cursor.x * 100 + "%",
              top: cursor.y * 100 + "%",
              width: radius * 200 + "%",
              aspectRatio: "1",
            }}
          />
        )}
      </div>
    </div>
  );
}
