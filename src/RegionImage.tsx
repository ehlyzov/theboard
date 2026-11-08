import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Region, Stroke } from "./boards";
type Props = {
  image: string;
  title: string;
  regions: Region[];
  selected: string | undefined;
  onCreate: (region: Region) => void;
  onSelect: (id: string) => void;
};
export default function RegionImage({
  image,
  title,
  regions,
  selected,
  onCreate,
  onSelect,
}: Props) {
  const [drawing, setDrawing] = useState(false);
  const [ratio, setRatio] = useState(1);
  const [radius, setRadius] = useState(0.06);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [active, setActive] = useState<Stroke | null>(null);
  const strokeRef = useRef<Stroke | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  function cancel() {
    setDrawing(false);
    setStrokes([]);
    setActive(null);
    strokeRef.current = null;
    setCursor(null);
  }
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
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
    <>
      <div className="screen-image">
        <div
          data-testid="annotation-image"
          className={"annotation-image nodrag " + (drawing ? "drawing" : "")}
          style={{
            width: ratio > 210 / 290 ? 210 : 290 * ratio,
            height: ratio > 210 / 290 ? 210 / ratio : 290,
          }}
          onPointerDown={(e) => {
            if (!drawing || e.button !== 0 || strokes.length>=1000) return;
            e.stopPropagation();
            e.preventDefault();
            const p = point(e);
            const s = { radius, points: [p, { ...p }] };
            strokeRef.current = s;
            setActive(s);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const p = point(e);
            setCursor(p);
            if (strokeRef.current && strokeRef.current.points.length<20000) {
              e.stopPropagation();
              const s = {
                ...strokeRef.current,
                points: [...strokeRef.current.points, p],
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
            }}
          />
          {regions.map((r, i) =>
            r.strokes?.length ? (
              <svg
                key={r.id}
                className={
                  "brush-mask " + (selected === r.id ? "selected" : "")
                }
                viewBox={`0 0 1000 ${1000 / ratio}`}
                style={{ pointerEvents: "none" }}
              >
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={"Область " + (i + 1)}
                  style={{pointerEvents:drawing?"none":"stroke"}}
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
                className={
                  "region-mask " + (selected === r.id ? "selected" : "")
                }
                style={{
                  ...shape(r),
                  pointerEvents: drawing ? "none" : "auto",
                }}
                aria-label={"Область " + (i + 1)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(r.id);
                }}
              >
                <span>{i + 1}</span>
              </button>
            ),
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
      {!drawing ? (
        <button
          type="button"
          className="region-tool nodrag"
          disabled={regions.length >= 200}
          onClick={() => setDrawing(true)}
        >
          Выделить область
        </button>
      ) : (
        <div className="brush-tools nodrag nowheel">
          <label>
            Радиус кисти: {Math.round(radius * 100)}%
            <input
              aria-label="Радиус кисти"
              type="range"
              min="1"
              max="20"
              value={radius * 100}
              onChange={(e) => setRadius(Number(e.target.value) / 100)}
            />
          </label>
          <button
            disabled={!strokes.length}
            onClick={() => setStrokes((s) => s.slice(0, -1))}
          >
            Отменить мазок
          </button>
          <button disabled={!strokes.length} onClick={() => setStrokes([])}>
            Очистить выделение
          </button>
          <button
            disabled={!strokes.length}
            onClick={() => {
              const region = {
                id: crypto.randomUUID(),
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                comments: [],
                noteIds: [],
                strokes,
              };
              onCreate(region);
              cancel();
            }}
          >
            Завершить выделение
          </button>
          <button onClick={cancel}>Отменить рисование</button>
        </div>
      )}
    </>
  );
}
