import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  type ChangeEvent,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
  useUpdateNodeInternals,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  ViewportPortal,
} from "@xyflow/react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  GripHorizontal,
  Highlighter,
  ImagePlus,
  Layers2,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  Scan,
  StickyNote,
  Trash2,
  Palette,
  Pin,
  X,
} from "lucide-react";

import {
  loadBoard,
  saveBoard,
  importBoard,
  exportBoard,
  type BoardNode,
  type BoardData,
  type Region,
  type Dock,
  type EngineMetadata,
} from "./boards";

import RegionImage from "./RegionImage";
import { NOTE_COLORS, COLOR_NAMES, type NoteColor } from "./noteColors";
import LabeledEdge, { LabelPositions, HoveredTransition } from "./LabeledEdge";
import { labelLayouts, freePosition, nodeSize, AUTO_LAYOUT_OPTIONS, focusFrame } from "./layout";
import { arrangeBoard, annotationNoteIds, ANNOTATION_LAYOUT_OPTIONS } from './autoLayout';
const edgeTypes = { smoothstep: LabeledEdge };
type PendingRegion = { screenId: string; region: Region; existing?: boolean };

type Actions = {
  pendingRegion: PendingRegion | null;
  nodes: BoardNode[];
  dockNote: (id: string, dock?: Dock) => void;
  selectNote: (id: string) => void;
  hoveredFlowNodes: string[];
  tool: "select" | "brush";
  brushRadius: number;
  changeBrushRadius: (radius: number) => void;
  brushScreenId: string | null;
  activateBrush: (id: string) => void;
  hoverScreen: (id: string | null) => void;
  startBrush: (id: string) => void;
  cancelBrush: () => void;
  deleteRegion: (screenId: string, regionId: string) => void;
  hoverRegion: (screenId: string, regionId: string | null) => void;
  createRegion: (screenId: string, region: Region) => void;
  linkedNoteIds: string[];
  regionSelection: { screenId: string; regionId: string } | null;
  selectRegion: (screenId: string, regionId: string) => void;
  update: (id: string, patch: Partial<BoardNode["data"]>) => void;
  remove: (id: string) => void;
  begin: (id: string) => void;
  finish: (id: string) => void;
  connecting: string | null;
};
const ActionsContext = createContext<Actions>(null!);

function ScreenNode({ id, data, selected }: NodeProps<BoardNode>) {
  const actions = useContext(ActionsContext);
  const {zoom}=useViewport();
  const docked=actions.nodes.filter(n=>n.data.dock?.screenId===id);
  const side=(s:Dock['side'])=>docked.filter(n=>n.data.dock?.side===s);
  const coreWidth=data.imageSize && data.imageSize.width>=data.imageSize.height?400:230;
  const slot=(s:Dock['side'],column:string,row:number)=><div className={'docked-slot docked-'+s} style={{gridColumn:column,gridRow:row}}>
    {side(s).map(n=><NoteNode key={n.id} id={n.id} data={n.data} selected={Boolean(n.selected)}/>)}</div>;
  return (
    <article
      data-testid="screen-node"
      data-board-node-id={id}
      onPointerEnter={() => actions.hoverScreen(id)}
      onPointerLeave={() => actions.hoverScreen(null)}
      style={{
        width:coreWidth+(side('left').length+side('right').length)*230,
        position:'relative',display:'grid',
        gridTemplateColumns:`${side('left').length*230}px ${coreWidth-2}px ${side('right').length*230}px`,
        gridTemplateRows:'auto auto auto',
      }}
      className={`screen-card ${actions.hoveredFlowNodes.includes(id) ? "flow-highlighted" : ""} ${selected ? "is-selected" : ""} ${actions.connecting === id ? "is-source" : ""}`}
    >
      {slot('top','1 / 4',1)}
      {slot('left','1',2)}
      <div className="screen-core" style={{gridColumn:2,gridRow:2,width:coreWidth-2}}>
      <div className="node-grip">
        <span>
          <Scan size={13} /> ЭКРАН
        </span>
        <GripHorizontal size={16} />
        <div className="screen-tools nodrag">
        <button
          className="icon-button"
          aria-label="Кисть выделения"
          aria-pressed={actions.tool === "brush" && actions.brushScreenId === id}
          disabled={Boolean(actions.brushScreenId && actions.brushScreenId !== id)}
          title={actions.brushScreenId && actions.brushScreenId !== id
            ? "Завершите выделение на другом экране: Enter; отмена: Esc"
            : "Выделить область маркером · B · [ ] размер кисти"}
          onClick={(event) => { event.stopPropagation(); actions.activateBrush(id); }}
        >
          <Highlighter size={15} />
        </button>
        {actions.tool === "brush" && actions.brushScreenId === id && (
          <div className="marker-size-control nodrag nopan"
            style={{top:`calc(100% + ${6/zoom}px)`,transform:`scale(${1/zoom})`}}
            onPointerDown={event=>event.stopPropagation()}
            onClick={event=>event.stopPropagation()}
            title="Размер маркера · [ уменьшить · ] увеличить">
            <input type="range" min="1" max="20" step="1"
              aria-label="Размер маркера"
              aria-valuetext={Math.round(actions.brushRadius*100)+'%'}
              value={Math.round(actions.brushRadius*100)}
              onChange={event=>actions.changeBrushRadius(Number(event.target.value)/100)}/>
            <output>{Math.round(actions.brushRadius*100)}%</output>
          </div>
        )}
        <button
          className="icon-button nodrag"
          aria-label="Удалить экран"
          onClick={() => actions.remove(id)}
        >
          <Trash2 size={14} />
        </button>
        </div>
      </div>
      <RegionImage
        image={data.image!}
        imageSize={data.imageSize}
        title={data.title}
        regions={data.regions ?? []}
        pendingRegion={actions.pendingRegion?.screenId === id && !actions.pendingRegion.existing
          ? actions.pendingRegion.region : undefined}
        selected={
          actions.regionSelection?.screenId === id
            ? actions.regionSelection.regionId
            : undefined
        }
        drawing={actions.tool === "brush" && actions.brushScreenId === id}
        radius={actions.brushRadius}
        activeScreen={actions.brushScreenId === id}
        blocked={Boolean(actions.brushScreenId && actions.brushScreenId !== id)}
        onStart={() => actions.startBrush(id)}
        onCancel={actions.cancelBrush}
        onImageSize={(width, height) => {
          if (
            data.imageSize?.width !== width ||
            data.imageSize?.height !== height
          )
            actions.update(id, { imageSize: { width, height } });
        }}
        onDelete={(regionId) => actions.deleteRegion(id, regionId)}
        onHover={(regionId) => actions.hoverRegion(id, regionId)}
        onCreate={(r) => actions.createRegion(id, r)}
        onSelect={(r) => actions.selectRegion(id, r)}
      />
      <div className="screen-caption">
        <input
          className="nodrag"
          aria-label="Название экрана"
          value={data.title}
          onChange={(e) => actions.update(id, { title: e.target.value })}
          maxLength={120}
        />
      </div>
      </div>
      {slot('right','3',2)}
      {slot('bottom','1 / 4',3)}
      <Handle
        type="target"
        position={Position.Left}
        role="button"
        tabIndex={0}
        aria-label="Завершить стрелку"
        title="Завершить стрелку"
        onClick={(e) => {
          e.stopPropagation();
          actions.finish(id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            actions.finish(id);
          }
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        role="button"
        tabIndex={0}
        aria-label="Начать стрелку"
        title="Начать стрелку"
        onClick={(e) => {
          e.stopPropagation();
          actions.begin(id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            actions.begin(id);
          }
        }}
      />
    </article>
  );
}

function NoteNode({ id, data, selected }: Pick<NodeProps<BoardNode>,'id'|'data'|'selected'>) {
  const actions = useContext(ActionsContext);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dockOpen,setDockOpen]=useState(false);
  const [dockScreen,setDockScreen]=useState(data.dock?.screenId??'');
  const [dockSide,setDockSide]=useState<Dock['side']>(data.dock?.side??'bottom');
  const area=useRef<HTMLTextAreaElement>(null);
  useEffect(()=>{
    if (!data.dock || !['top','bottom'].includes(data.dock.side) || !area.current) return;
    const el=area.current;
    const resize=()=>{el.style.height='0px';el.style.height=Math.max(96,el.scrollHeight)+'px';};
    resize();let width=el.clientWidth;
    const observer=new ResizeObserver(()=>{if(el.clientWidth!==width){width=el.clientWidth;resize();}});
    observer.observe(el);return()=>observer.disconnect();
  },[data.text,data.dock?.side]);
  return (
    <article
      data-testid="note-node"
      data-board-node-id={id}
      onClick={e=>{if(data.dock){e.stopPropagation();actions.selectNote(id);}}}
      style={{ background: NOTE_COLORS[data.color ?? "yellow"] }}
      className={`note-card ${data.dock?'is-docked':''} ${selected ? "is-selected" : ""} ${actions.linkedNoteIds.includes(id) ? "is-linked" : ""}`}
    >
      <div className="node-grip">
        <span>
          <StickyNote size={13} /> ЗАМЕТКА
        </span>
        <GripHorizontal size={16} />
        <button className="icon-button nodrag" aria-label={data.dock?'Отклеить заметку':'Приклеить заметку'}
          onClick={()=>{if(data.dock)actions.dockNote(id);else{setDockScreen(actions.nodes.find(n=>n.type==='screen')?.id??'');setDockOpen(v=>!v);}}}><Pin size={13}/></button>
        <button
          className="icon-button nodrag"
          aria-label="Цвет заметки"
          aria-expanded={paletteOpen}
          onClick={() => setPaletteOpen((v) => !v)}
        >
          <Palette size={14} />
        </button>
        <button
          className="icon-button nodrag"
          aria-label="Удалить заметку"
          onClick={() => actions.remove(id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {paletteOpen && (
        <div className="note-palette nodrag">
          {Object.entries(NOTE_COLORS).map(([color, value]) => (
            <button
              key={color}
              aria-label={"Пастельный цвет: " + COLOR_NAMES[color as NoteColor]}
              aria-pressed={data.color === color}
              style={{ background: value }}
              onClick={() => {
                actions.update(id, { color: color as NoteColor });
                setPaletteOpen(false);
              }}
            />
          ))}
        </div>
      )}
      {dockOpen && <div className="dock-picker nodrag">
        <label>Экран<select aria-label="Экран для приклеивания" value={dockScreen} onChange={e=>setDockScreen(e.target.value)}>
          {actions.nodes.filter(n=>n.type==='screen').map(n=><option key={n.id} value={n.id}>{n.data.title}</option>)}
        </select></label>
        <label>Сторона<select aria-label="Сторона приклеивания" value={dockSide} onChange={e=>setDockSide(e.target.value as Dock['side'])}>
          <option value="left">Слева</option><option value="right">Справа</option><option value="top">Сверху</option><option value="bottom">Снизу</option>
        </select></label>
        <button disabled={!dockScreen} onClick={()=>{actions.dockNote(id,{screenId:dockScreen,side:dockSide});setDockOpen(false);}}>Приклеить</button>
        <button onClick={()=>setDockOpen(false)}>Отмена</button>
      </div>}
      {data.title&&data.title!=='Заметка'&&<div className="note-heading">{data.title}</div>}
      <textarea
        ref={area}
        className="nodrag nowheel"
        aria-label="Текст заметки"
        placeholder="Что важно в этом шаге?"
        value={data.text || ""}
        onChange={(e) => actions.update(id, { text: e.target.value })}
        maxLength={12000}
      />
    </article>
  );
}

const nodeTypes = { screen: ScreenNode, note: NoteNode };

async function readImage(
  file: File,
): Promise<{ image: string; imageSize: { width: number; height: number } }> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("format");
  const image = await createImageBitmap(file);
  const imageSize = { width: image.width, height: image.height };
  const pixels = image.width * image.height;
  image.close();
  if (pixels > 40_000_000) throw new Error("size");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ image: String(reader.result), imageSize });
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

function workspace(id: string) {
  try {
    const w = JSON.parse(
      localStorage.getItem("theboard:workspace:" + id) || "null",
    );
    if (
      w &&
      [w.x, w.y, w.zoom].every(Number.isFinite) &&
      w.zoom >= 0.05 &&
      w.zoom <= 4
    )
      return w;
  } catch {}
  return { x: 0, y: 0, zoom: 0.9 };
}
function currentBoard() {
  try {
    return (
      new URLSearchParams(location.search).get("board") ||
      localStorage.getItem("theboard:last-board") ||
      "default"
    );
  } catch {
    return new URLSearchParams(location.search).get("board") || "default";
  }
}
function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<BoardNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const updateNodeInternals=useUpdateNodeInternals();
  const [automatic,setAutomatic]=useState(false);
  const [layoutEngine,setLayoutEngine]=useState<EngineMetadata>();
  const [direction,setDirection]=useState<'RIGHT'|'DOWN'>('RIGHT');
  const [autoWarning,setAutoWarning]=useState(false);
  const fitAfterArrange=useRef(false);
  const [arranging,setArranging]=useState(false);
  const [anchors,setAnchors]=useState<Record<string,{core:{x:number;y:number};notes:Record<string,{x:number;y:number;width:number;height:number}>}>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [regionSelection, setRegionSelection] = useState<{
    screenId: string;
    regionId: string;
  } | null>(null);
  const [hoveredTransition, setHoveredTransition] = useState<string | null>(
    null,
  );
  const activeTransition = edges.find((e) => e.id === hoveredTransition);
  const [tool, setTool] = useState<"select" | "brush">("select");
  const [brushRadius, setBrushRadius] = useState(0.06);
  const [brushScreenId, setBrushScreenId] = useState<string | null>(null);
  const hoveredScreenRef = useRef<string | null>(null);
  const brushContextRef = useRef<string | undefined>(undefined);
  const [hoveredRegion, setHoveredRegion] = useState<{
    screenId: string;
    regionId: string;
  } | null>(null);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if(autoWarning)return;
      if (
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLInputElement &&
          !["file", "checkbox", "range", "button"].includes(e.target.type)) ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      )
        return;
      if (e.code === "KeyB" && !e.ctrlKey && !e.metaKey) {
        const id = brushScreenId ?? hoveredScreenRef.current ?? brushContextRef.current;
        if (id && nodes.some(n => n.id === id && n.type === "screen")) {
          setBrushScreenId(id);
          setTool("brush");
        } else setError("Выберите экран или нажмите маркер в его шапке");
        e.preventDefault();
      }
      if (e.key === "Escape") {
        setTool("select");
        setBrushScreenId(null);
      }
      if (
        tool === "brush" &&
        (e.code === "BracketRight" || e.code === "BracketLeft")
      ) {
        e.preventDefault();
        setBrushRadius((r) =>
          Math.max(
            0.01,
            Math.min(0.2, r + (e.code === "BracketRight" ? 0.01 : -0.01)),
          ),
        );
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [tool,autoWarning,brushScreenId,nodes]);
  const [pendingRegion, setPendingRegion] = useState<PendingRegion | null>(null);
  const [noteChoice, setNoteChoice] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [deletedRegion, setDeletedRegion] = useState<{
    screenId: string;
    region: Region;
  } | null>(null);
  const selectedScreen = nodes.find((n) => n.id === regionSelection?.screenId);
  const hoverMask = nodes
    .find((n) => n.id === hoveredRegion?.screenId)
    ?.data.regions?.find((r) => r.id === hoveredRegion?.regionId);
  const selectedRegion = selectedScreen?.data.regions?.find(
    (r) => r.id === regionSelection?.regionId,
  );
  useEffect(() => {
    setNoteChoice("");
    setNewNoteText("");
  }, [regionSelection?.screenId, regionSelection?.regionId]);
  function attachNote(existingId: string | undefined) {
    if (!pendingRegion) return;
    if (!existingId && !newNoteText.trim()) return;
    const noteId = existingId || crypto.randomUUID();
    const { screenId, region, existing } = pendingRegion;
    setNodes((current) => {
      const screen = current.find((n) => n.id === screenId);
      if (!screen) return current;
      const linked = {
        ...region,
        noteIds: Array.from(new Set([...(region.noteIds ?? []), noteId])),
      };
      const result = current.map((n) =>
        n.id === screenId
          ? {
              ...n,
              data: {
                ...n.data,
                regions: existing
                  ? (n.data.regions ?? []).map((r) =>
                      r.id === region.id ? linked : r,
                    )
                  : [...(n.data.regions ?? []), linked],
              },
            }
          : n,
      );
      if (!existingId)
        result.push({
          id: noteId,
          type: "note",
          dragHandle: ".node-grip",
          position: freePosition(
            { x: screen.position.x + 280, y: screen.position.y + 80 },
            230,
            183,
            current.map((n) => ({ ...n.position, ...nodeSize(n) })),
          ),
          data: {
            title: "Заметка области",
            text: newNoteText.trim(),
            status: "open",
          },
        });
      return result;
    });
    setRegionSelection({ screenId, regionId: region.id });
    setPendingRegion(null);
  }
  const [focusEnabled, setFocusEnabled] = useState(() =>
    Boolean(workspace(currentBoard()).focusEnabled),
  );
  const [currentScreenId, setCurrentScreenId] = useState<string | undefined>(
    () => workspace(currentBoard()).currentScreenId,
  );
  const brushScreens = nodes.filter(n => n.type === "screen");
  brushContextRef.current = brushScreens.find(n => n.selected)?.id
    ?? currentScreenId ?? (brushScreens.length === 1 ? brushScreens[0].id : undefined);
  const focusIds = new Set(
    currentScreenId
      ? [
          currentScreenId,
          ...edges
            .filter((e) => e.source === currentScreenId)
            .map((e) => e.target),
        ]
      : [],
  );
  const focusedNoteIds = new Set(
    nodes
      .filter((n) => focusIds.has(n.id))
      .flatMap((n) => (n.data.regions ?? []).flatMap((r) => r.noteIds ?? [])),
  );
  const focusActive =
    focusEnabled &&
    !arranging && Boolean(nodes.find((n) => n.id === currentScreenId && n.type === "screen"));
  const focusNodes = nodes.filter(n => focusIds.has(n.id) ||
    (n.data.dock ? focusIds.has(n.data.dock.screenId) : focusedNoteIds.has(n.id)));
  const focusEdges = edges.filter(e => e.source === currentScreenId);
  const focusKey = focusActive ? JSON.stringify({ source:currentScreenId,direction,
    nodes:focusNodes.map(n=>({id:n.id,type:n.type,title:n.data.title,text:n.data.text,dock:n.data.dock,imageSize:n.data.imageSize,measured:n.measured,noteIds:annotationNoteIds(n)})),
    edges:focusEdges.map(e=>({id:e.id,source:e.source,target:e.target,label:e.label})),
  }) : null;
  const [focusLayout,setFocusLayout] = useState<{key:string;result?:Awaited<ReturnType<typeof arrangeBoard>>} | null>(null);
  const focusGeometry = focusKey && focusLayout?.key === focusKey ? focusLayout.result : undefined;
  // Canonical nodes/edges remain the only input to save/export. Focus geometry
  // exists solely in these controlled React Flow props, never in board state.
  const displayNodes = nodes.map(n=>({...n,
    zIndex:tool==='brush'&&brushScreenId===n.id ? 1000 : n.zIndex,
    position:focusGeometry?.positions.get(n.id) ?? n.position,
    hidden:Boolean(n.data.dock)||(focusActive&&!focusIds.has(n.id)&&!focusedNoteIds.has(n.id)),
  }));
  const displayEdges = focusActive
    ? edges.map((e) => ({ ...e, hidden: e.source !== currentScreenId,
      data:{...e.data,route:undefined,labelPosition:undefined,labelManual:false,...focusGeometry?.edges.get(e.id)},
    }))
    : edges;
  const labelPositions = useMemo(
    () => labelLayouts(displayNodes, displayEdges),
    [displayNodes, displayEdges],
  );
  const [help, setHelp] = useState(false);
  const [boardId] = useState(() => currentBoard());
  const [title, setTitle] = useState("Новый поток");
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Загрузка…");
  const archiveInput = useRef<HTMLInputElement>(null);
  const replacementInput = useRef<HTMLInputElement>(null);
  const [backupId, setBackupId] = useState<string | null>(() => {
    try { return localStorage.getItem('theboard:backup:' + currentBoard()); }
    catch { return null; }
  });
  const saveSequence = useRef(0);
  const snapshot = (): BoardData => ({ version: 1, title, nodes, edges,layoutSettings:{automatic,direction},layoutEngine });
  useEffect(() => {
    let disposed = false;
    loadBoard(boardId)
      .then((saved) => {
        if (disposed) return;
        if (saved) {
          setTitle(saved.title);
          setNodes(saved.nodes);
          setEdges(saved.edges);
          setAutomatic(saved.layoutSettings?.automatic??false);
          setDirection(saved.layoutSettings?.direction??'RIGHT');
          setLayoutEngine(saved.layoutEngine);
        }
        setReady(true);
      })
      .catch(() => {
        if (!disposed) {
          setError(
            "Не удалось открыть локальное хранилище. Доска не загружена; изменения отключены. Повторите открытие после восстановления доступа.",
          );
          setSaveStatus("Ошибка хранения");
        }
      });
    return () => {
      disposed = true;
    };
  }, [boardId]);
  useEffect(() => {
    if (!ready) return;
    const sequence = ++saveSequence.current;
    setSaveStatus("Сохранение…");
    // Start transaction on every committed edit; do not debounce away changes before reload.
    saveBoard(boardId, snapshot())
      .then(() => {
        if (sequence === saveSequence.current)
          setSaveStatus("Сохранено в браузере");
      })
      .catch(() => {
        if (sequence === saveSequence.current) {
          setSaveStatus("Ошибка сохранения");
          setError(
            "Не удалось сохранить доску. Экспортируйте архив перед закрытием.",
          );
        }
      });
  }, [ready, title, nodes, edges, boardId,automatic,direction,layoutEngine]);
  const layoutSignature=JSON.stringify({nodes:nodes.map(n=>({id:n.id,type:n.type,title:n.data.title,text:n.data.text,dock:n.data.dock,imageSize:n.data.imageSize,noteIds:annotationNoteIds(n)})),
    edges:edges.map(e=>({id:e.id,source:e.source,target:e.target,label:e.label}))});
  useEffect(()=>{
    if(!ready||!automatic||!nodes.length)return;
    let disposed=false;
    setArranging(true);
    const timer=setTimeout(()=>{
      requestAnimationFrame(()=>void arrangeBoard(nodes,edges,direction).then(result=>{
        if(disposed)return;
        setNodes(current=>current.map(n=>({...n,position:result.positions.get(n.id)??n.position})));
        setEdges(current=>current.map(e=>({...e,data:{...e.data,...result.edges.get(e.id)}})));
        setLayoutEngine({name:'elk-layered',version:'0.12.1',options:{...AUTO_LAYOUT_OPTIONS,'elk.direction':direction,...ANNOTATION_LAYOUT_OPTIONS}});
        requestAnimationFrame(()=>{
          updateNodeInternals([...result.positions.keys()]);
          if(fitAfterArrange.current){
            fitAfterArrange.current=false;
            const placed=nodes.map(n=>({...n,position:result.positions.get(n.id)??n.position}));
            void fitView({nodes:focusEnabled&&currentScreenId?focusFrame(placed,focusIds,currentScreenId,{width:board.current?.clientWidth??1000,height:board.current?.clientHeight??800}):undefined,padding:.15,maxZoom:1,duration:150});
          }
        });
      }).catch(()=>{if(!disposed){setAutomatic(false);setError('Не удалось рассчитать компоновку. Текущее расположение сохранено.');}})
        .finally(()=>{if(!disposed)setArranging(false);}));
    },120);
    return()=>{disposed=true;clearTimeout(timer);};
  },[ready,automatic,direction,layoutSignature]);
  useEffect(()=>{if(!automatic)setArranging(false);},[automatic]);
  useEffect(()=>{if(autoWarning)(document.getElementById('auto-layout-warning') as HTMLDialogElement|null)?.showModal();},[autoWarning]);
  async function openArchive(event: ChangeEvent<HTMLInputElement>, replace = false) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const imported = await importBoard(file);
      if (replace) {
        const recoveryId = crypto.randomUUID();
        // Validate first, then persist a recoverable original before replacing it.
        await saveBoard(recoveryId, snapshot());
        await saveBoard(boardId, imported);
        try { localStorage.setItem('theboard:backup:' + boardId, recoveryId); } catch {}
        setBackupId(recoveryId);
        setTitle(imported.title); setNodes(imported.nodes); setEdges(imported.edges);
        setAutomatic(imported.layoutSettings?.automatic??false);setDirection(imported.layoutSettings?.direction??'RIGHT');setAutoWarning(false);
        setLayoutEngine(imported.layoutEngine);
        setFocusEnabled(false); setCurrentScreenId(undefined); setRegionSelection(null);
        setHoveredRegion(null); setPendingRegion(null); setConnecting(null);
        setDeletedRegion(null); setHoveredTransition(null); setNoteChoice(''); setNewNoteText('');
        setTool('select'); setBrushScreenId(null); setLoading(false);
        return;
      }
      const id = crypto.randomUUID();
      await saveBoard(id, imported);
      location.assign("?board=" + id);
    } catch (e) {
      setError(
        "Не удалось импортировать: " +
          (e instanceof Error ? e.message : "ошибка архива"),
      );
      setLoading(false);
    } finally {
      if (archiveInput.current) archiveInput.current.value = "";
      if (replacementInput.current) replacementInput.current.value = "";
    }
  }
  function downloadArchive() {
    try {
      const bytes = exportBoard(snapshot());
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], { type: "application/zip" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "theboard-" + boardId + ".zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Не удалось экспортировать доску");
    }
  }

  const spaceDown = useRef(false);
  const panGesture = useRef<{
    x: number;
    y: number;
    viewport: { x: number; y: number; zoom: number };
  } | null>(null);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        spaceDown.current = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceDown.current = false;
    };
    const blur = () => {
      spaceDown.current = false;
      panGesture.current = null;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  const input = useRef<HTMLInputElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const {
    fitView,
    zoomIn,
    zoomOut,
    screenToFlowPosition,
    getViewport,
    setViewport,
  } = useReactFlow<BoardNode>();
  const viewport = useViewport();
  const { zoom } = viewport;
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const next:typeof anchors={};const notePositions=new Map<string,{x:number;y:number}>();
      for(const screen of nodes.filter(n=>n.type==='screen')){
        const el=[...document.querySelectorAll<HTMLElement>('[data-testid="screen-node"]')].find(el=>el.dataset.boardNodeId===screen.id);
        const core=el?.querySelector<HTMLElement>('.screen-core');if(!el||!core)continue;
        const rect=el.getBoundingClientRect(),c=core.getBoundingClientRect(),scale=rect.width/el.offsetWidth||zoom;
        const notes:Record<string,{x:number;y:number;width:number;height:number}>={};
        for(const child of el.querySelectorAll<HTMLElement>('[data-testid="note-node"]')){
          const r=child.getBoundingClientRect(),id=child.dataset.boardNodeId!;
          const box={x:screen.position.x+(r.x-rect.x)/scale,y:screen.position.y+(r.y-rect.y)/scale,width:child.offsetWidth,height:child.offsetHeight};
          notes[id]=box;notePositions.set(id,{x:box.x,y:box.y});
        }
        next[screen.id]={core:{x:(c.x-rect.x)/scale,y:(c.y-rect.y)/scale},notes};
      }
      setAnchors(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
      setNodes(current=>current.some(n=>{const p=notePositions.get(n.id);return p&&(Math.abs(p.x-n.position.x)>.2||Math.abs(p.y-n.position.y)>.2);})?
        current.map(n=>{const p=notePositions.get(n.id);return p?{...n,position:p}:n;}):current);
    });return()=>cancelAnimationFrame(frame);
  },[nodes,zoom]);
  const [initialViewport] = useState(() => workspace(boardId));
  const normalViewport = useRef(initialViewport);
  const wasFocused = useRef(focusEnabled);
  const restoringViewport = useRef(false);
  useEffect(()=>{
    if(focusEnabled && !wasFocused.current) normalViewport.current=getViewport();
    if(!focusEnabled && wasFocused.current){
      restoringViewport.current=true;
      void setViewport(normalViewport.current,{duration:150}).finally(()=>{restoringViewport.current=false;});
    }
    wasFocused.current=focusEnabled;
  },[focusEnabled]);
  useEffect(() => {
    try {
      localStorage.setItem("theboard:last-board", boardId);
      localStorage.setItem(
        "theboard:workspace:" + boardId,
        JSON.stringify({ ...(focusEnabled || restoringViewport.current ? normalViewport.current : viewport), focusEnabled, currentScreenId }),
      );
    } catch {}
  }, [
    viewport.x,
    viewport.y,
    viewport.zoom,
    boardId,
    focusEnabled,
    currentScreenId,
  ]);
  useEffect(()=>{
    if(!ready || !focusKey){setFocusLayout(null);return;}
    let disposed=false;
    // Measure the currently visible composites after React Flow has rendered.
    const timer=setTimeout(()=>{
      void arrangeBoard(focusNodes,focusEdges,direction).then(result=>{
        if(!disposed)setFocusLayout({key:focusKey,result});
      }).catch(()=>{
        if(!disposed){
          setFocusLayout({key:focusKey});
          setError('Не удалось рассчитать временную компоновку фокуса. Исходное расположение сохранено.');
        }
      });
    },80);
    return()=>{disposed=true;clearTimeout(timer);};
  },[ready,focusKey]);
  useEffect(()=>{
    if(!focusGeometry)return;
    const frame=requestAnimationFrame(()=>{
      updateNodeInternals([...focusGeometry.positions.keys()]);
      void fitView({nodes:focusNodes.filter(n=>!n.data.dock).map(n=>({id:n.id})),
        padding:.2,maxZoom:1,duration:150});
    });
    return()=>cancelAnimationFrame(frame);
  },[focusGeometry]);
  const screens = nodes.filter((n) => n.type === "screen");
  const notes = nodes.filter((n) => n.type === "note");

  useEffect(() => {
    if (!nodes.length || saveStatus === "Сохранено в браузере") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [nodes.length, saveStatus]);

  useEffect(() => {
    const cancel = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnecting(null);
        setPendingRegion(null);
        setHelp(false);
      }
    };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, []);

  const update: Actions["update"] = (id, patch) =>
    setNodes((current) =>
      current.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    );
  const remove = (id: string) => {
    setNodes((current) =>
      current
        .filter((n) => n.id !== id)
        .map((n) => ({
          ...n,
          data: {
            ...n.data,
            dock:n.data.dock?.screenId===id?undefined:n.data.dock,
            regions: n.data.regions?.map((r) => ({
              ...r,
              noteIds: r.noteIds?.filter((noteId) => noteId !== id),
            })),
          },
        })),
    );
    setEdges((current) =>
      current.filter((e) => e.source !== id && e.target !== id),
    );
    if (connecting === id) setConnecting(null);
  };
  const connect = (connection: Connection) => {
    if (connection.source === connection.target) return;
    // Dynamic composites can outlive an initial handle measurement. Refresh
    // after the connection render, as we do after automatic placement.
    requestAnimationFrame(()=>updateNodeInternals([connection.source,connection.target]));
    setEdges((current) =>
      addEdge<Edge>(
        {
          ...connection,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          style: { strokeWidth: 2, stroke: "#7c879d" },
        },
        current,
      ),
    );
    setConnecting(null);
  };
  const finish = (target: string) => {
    if (connecting)
      connect({
        source: connecting,
        target,
        sourceHandle: null,
        targetHandle: null,
      });
  };

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setLoading(true);
    setError("");
    const additions: BoardNode[] = [];
    let failures = 0;
    for (const file of files) {
      try {
        const { image, imageSize } = await readImage(file);
        const index = screens.length + additions.length;
        additions.push({
          id: crypto.randomUUID(),
          type: "screen",
          dragHandle: ".node-grip",
          position: freePosition(
            { x: 70 + (index % 3) * 480, y: 100 + Math.floor(index / 3) * 600 },
            imageSize.width >= imageSize.height ? 400 : 230,
            82 +
              ((imageSize.width >= imageSize.height ? 380 : 210) *
                imageSize.height) /
                imageSize.width,
            [...nodes, ...additions].map((n) => ({
              ...n.position,
              ...nodeSize(n),
            })),
          ),
          data: { title: file.name.replace(/\.[^.]+$/, ""), image, imageSize },
        });
      } catch {
        failures++;
      }
    }
    setNodes((current) => [...current, ...additions]);
    if (failures)
      setError(
        `Не удалось загрузить файлов: ${failures}. Выберите корректные PNG, JPEG или WebP до 10 МБ и 40 Мп.`,
      );
    setLoading(false);
    if (input.current) input.current.value = "";
  }

  function addNote() {
    const bounds = board.current!.getBoundingClientRect();
    const position = screenToFlowPosition({
      x: bounds.x + bounds.width / 2 - 105 + notes.length * 18,
      y: bounds.y + bounds.height / 2 - 80 + notes.length * 18,
    });
    setNodes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: "note",
        dragHandle: ".node-grip",
        position,
        data: { title: "Заметка", text: "" },
      },
    ]);
  }

  return (
    <ActionsContext.Provider
      value={{
        pendingRegion,
        nodes,
        selectNote:(id)=>setNodes(current=>current.map(n=>({...n,selected:n.id===id}))),
        dockNote:(id,dock)=>{
          setNodes(current=>current.map(n=>n.id===id?{...n,data:{...n.data,dock}}:n));
          if(!automatic)setEdges(current=>current.map(e=>({...e,data:{...e.data,route:undefined}})));
        },
        update,
        regionSelection,
        hoveredFlowNodes: activeTransition
          ? [activeTransition.source, activeTransition.target]
          : [],
        tool,
        brushRadius,
        changeBrushRadius:radius=>setBrushRadius(Math.max(.01,Math.min(.2,radius))),
        brushScreenId,
        activateBrush: (id) => {
          if (brushScreenId && brushScreenId !== id) return;
          setBrushScreenId(id);
          setTool("brush");
        },
        hoverScreen: (id) => { hoveredScreenRef.current = id; },
        startBrush: setBrushScreenId,
        cancelBrush: () => {
          setTool("select");
          setBrushScreenId(null);
        },
        deleteRegion: (screenId, regionId) => {
          const screen = nodes.find((n) => n.id === screenId);
          const region = screen?.data.regions?.find((r) => r.id === regionId);
          if (!screen || !region) return;
          setDeletedRegion({ screenId, region });
          update(screenId, {
            regions: screen.data.regions?.filter((r) => r.id !== regionId),
          });
          setRegionSelection(null);
          setHoveredRegion(null);
        },
        hoverRegion: (screenId, regionId) =>
          setHoveredRegion(regionId ? { screenId, regionId } : null),
        linkedNoteIds: (hoverMask ?? selectedRegion)?.noteIds ?? [],
        createRegion: (screenId, region) => {
          setNoteChoice("");
          setNewNoteText("");
          setPendingRegion({ screenId, region });
          setTool("select");
          setBrushScreenId(null);
        },
        selectRegion: (screenId, regionId) =>
          setRegionSelection({ screenId, regionId }),
        remove,
        begin: (id) => setConnecting(id),
        finish,
        connecting,
      }}
    >
      <div className="app-shell">
        {autoWarning&&<dialog id="auto-layout-warning" className="auto-warning" onCancel={()=>setAutoWarning(false)} aria-labelledby="auto-warning-title">
          <h2 id="auto-warning-title">Ручная компоновка будет сброшена</h2>
          <p>Экраны, заметки и подписи будут размещены автоматически. Их содержимое и связи сохранятся.</p>
          <button onClick={()=>{fitAfterArrange.current=true;setAutoWarning(false);setAutomatic(true);}}>Включить автокомпоновку</button>
          <button onClick={()=>setAutoWarning(false)}>Отмена</button>
        </dialog>}
        <header className="app-header">
          <a className="brand" href="/" aria-label="TheBoard — главная">
            <span className="brand-mark">
              <i />
              <i />
              <i />
              <i />
            </span>
            TheBoard<span className="beta">PREVIEW</span>
          </a>
          <div className="breadcrumb">
            <span>Мои доски</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <button
            className="archive-button"
            disabled={!ready || loading}
            onClick={() => archiveInput.current?.click()}
          >
            Импорт ZIP
          </button>
          <button
            className="archive-button"
            aria-label="Экспорт архива"
            disabled={!ready || loading}
            onClick={downloadArchive}
          >
            Экспорт ZIP
          </button>
          <input
            className="file-input"
            ref={archiveInput}
            aria-label="Импорт архива"
            type="file"
            accept=".zip"
            onChange={openArchive}
          />
          <span className="session-badge">
            <span /> <span role="status">{saveStatus}</span>
          </span>
          <button
            className="icon-button help-button"
            aria-label="Как пользоваться доской"
            aria-expanded={help}
            onClick={() => setHelp(!help)}
          >
            <CircleHelp size={20} />
          </button>
        </header>
        <div className="workspace" inert={!ready || loading}>
          <aside className="sidebar">
            <div className="sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
            <div className="board-link">
              <Layers2 size={17} />
              <span>{title}</span>
              <span className="board-dot" />
            </div>
            <button className="replace-board-button" disabled={!ready || loading}
              onClick={() => replacementInput.current?.click()}>Заменить доску из ZIP</button>
            <input className="file-input" ref={replacementInput} type="file" accept=".zip"
              aria-label="Заменить текущую доску из архива" onChange={e => void openArchive(e, true)} />
            {backupId && <a className="recovery-link" href={'?board=' + backupId} target="_blank" rel="noreferrer">Резервная копия доски</a>}
            <div className="auto-layout-controls">
              <label><input type="checkbox" aria-label="Автоматическая компоновка" checked={automatic}
                onChange={e=>{if(e.target.checked)setAutoWarning(true);else setAutomatic(false);}}/> Автоматическая компоновка</label>
              <select aria-label="Направление компоновки" value={direction} onChange={e=>{if(automatic)fitAfterArrange.current=true;setDirection(e.target.value as 'RIGHT'|'DOWN');}}>
                <option value="RIGHT">Слева направо</option><option value="DOWN">Сверху вниз</option>
              </select>
              {arranging&&<span role="status">Расчёт компоновки…</span>}
            </div>
            <div className="sidebar-section">
              <div className="focus-mode-switch">
                <span>Показывать все</span>
                <button type="button" role="switch" aria-label="Режим фокуса" aria-checked={focusEnabled} disabled={!screens.length}
                  onClick={()=>{if(!currentScreenId)setCurrentScreenId(screens[0]?.id);setFocusEnabled(v=>!v);}}><i/></button>
                <span>Только выделенное</span>
              </div>
              {focusActive && focusLayout?.key !== focusKey && <p role="status">Компоновка фокуса…</p>}
              <div className="section-heading">
                Экраны <span>{screens.length.toString().padStart(2, "0")}</span>
              </div>
              {screens.length === 0 ? (
                <p className="sidebar-empty">
                  Загруженные экраны
                  <br />
                  появятся здесь
                </p>
              ) : (
                <ol className="screen-list">
                  {screens.map((screen, index) => (
                    <li key={screen.id}>
                      <button
                        className={[screen.id===currentScreenId?'is-current':'',focusActive&&focusIds.has(screen.id)?'in-focus':'',focusActive&&!focusIds.has(screen.id)?'out-of-focus':''].join(' ')}
                        aria-current={screen.id===currentScreenId?'true':undefined}
                        title={screen.data.title}
                        onClick={() => {
                          setCurrentScreenId(screen.id);
                          if (!focusActive || screen.id===currentScreenId) void fitView({
                            nodes: [{ id: screen.id }],
                            maxZoom: 1,
                            duration: 250,
                          });
                        }}
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span>{screen.data.title || "Без названия"}</span>
                        <ChevronRight size={13} />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="edge-labels">
              <h3>Переходы</h3>
              {edges.map((edge) => (
                <label key={edge.id}>
                  {nodes.find((n) => n.id === edge.source)?.data.title} →{" "}
                  {nodes.find((n) => n.id === edge.target)?.data.title}
                  <input
                    aria-label="Подпись перехода"
                    maxLength={500}
                    value={String(edge.label ?? "")}
                    onChange={(e) =>
                      setEdges((current) =>
                        current.map((item) =>
                          item.id === edge.id
                            ? { ...item, label: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <div className="sidebar-section overview">
              <div className="section-heading">На доске</div>
              <div>
                <ArrowRight size={15} /> Переходы{" "}
                <strong>{edges.length}</strong>
              </div>
              <div>
                <StickyNote size={15} /> Заметки <strong>{notes.length}</strong>
              </div>
            </div>
            <div className="sidebar-bottom">
              <div className="privacy-icon">
                <Check size={16} />
              </div>
              <strong>Ваши экраны — у вас</strong>
              <p>
                Изображения обрабатываются
                <br />в браузере и не отправляются
                <br />
                на сервер.
              </p>
              <span>THEBOARD / FIRST CANVAS</span>
            </div>
          </aside>
          <main
            className="canvas"
            ref={board}
            onPointerDownCapture={(e) => {
              if (e.button !== 0 || (!e.altKey && !spaceDown.current)) return;
              e.preventDefault();
              e.stopPropagation();
              panGesture.current = {
                x: e.clientX,
                y: e.clientY,
                viewport: getViewport(),
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMoveCapture={(e) => {
              if (!panGesture.current) return;
              e.preventDefault();
              e.stopPropagation();
              const p = panGesture.current;
              void setViewport({
                ...p.viewport,
                x: p.viewport.x + e.clientX - p.x,
                y: p.viewport.y + e.clientY - p.y,
              });
            }}
            onPointerUpCapture={(e) => {
              if (panGesture.current) {
                e.stopPropagation();
                panGesture.current = null;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancelCapture={() => {
              panGesture.current = null;
            }}
          >
            <div className="canvas-heading">
              <h1>{title}</h1>
              <p>От первого экрана до последнего шага</p>
            </div>
            <div
              className="toolbar"
              role="toolbar"
              aria-label="Инструменты доски"
            >
              <button
                className={"tool " + (tool === "select" ? "active" : "")}
                onClick={() => {
                  setTool("select");
                  setBrushScreenId(null);
                }}
                aria-label="Выделение и перемещение"
                title={automatic ? 'Для ручного размещения выключите автоматическую компоновку слева' : 'Перемещайте элементы за верхнюю полоску'}
              >
                <MousePointer2 size={19} />
              </button>
              <span className="toolbar-divider" />
              <button
                className="tool labeled"
                onClick={() => input.current?.click()}
                disabled={loading}
              >
                <ImagePlus size={19} />
                <span>{loading ? "Загрузка…" : "Добавить экраны"}</span>
              </button>
              <button
                className="tool labeled"
                aria-label="Добавить заметку"
                onClick={addNote}
              >
                <StickyNote size={19} />
                <span>Заметка</span>
              </button>
              <button
                className={"tool labeled " + (focusActive ? "active" : "")}
                aria-label="Режим фокуса"
                aria-pressed={Boolean(focusActive)}
                disabled={!currentScreenId}
                onClick={() => setFocusEnabled((v) => !v)}
                title="Выберите экран: только его исходящие переходы"
              >
                <Scan size={18} />
                <span>Фокус</span>
              </button>
            </div>
            <input
              ref={input}
              className="file-input"
              type="file"
              aria-label="Загрузить скриншоты"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={loading}
              onChange={upload}
            />
              <HoveredTransition.Provider
              value={{ id: hoveredTransition, setId: setHoveredTransition, automatic:automatic||focusActive }}
            >
              <LabelPositions.Provider value={labelPositions}>
                <ReactFlow
                  nodes={displayNodes}
                  edges={displayEdges}
                  onNodeClick={(_, node) => {
                    if (node.type === "screen") setCurrentScreenId(node.id);
                  }}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  onNodesChange={changes=>onNodesChange(focusActive ? changes.filter(c=>c.type!=='position') : changes)}
                  nodesDraggable={!automatic&&!focusActive}
                  onNodeDragStart={()=>{if(!automatic)setEdges(current=>current.map(e=>({...e,data:{...e.data,route:undefined}})));}}
                  onEdgesChange={onEdgesChange}
                  onConnect={connect}
                  connectOnClick={false}
                  onPaneClick={() => setConnecting(null)}
                  onNodesDelete={(deleted) => {
                    const ids = new Set(deleted.map((n) => n.id));
                    setNodes((current) =>
                      current
                        .filter((n) => !ids.has(n.id))
                        .map((n) => ({
                          ...n,
                          data: {
                            ...n.data,
                            dock:n.data.dock&&ids.has(n.data.dock.screenId)?undefined:n.data.dock,
                            regions: n.data.regions?.map((r) => ({
                              ...r,
                              noteIds: r.noteIds?.filter((id) => !ids.has(id)),
                            })),
                          },
                        })),
                    );
                    if (deleted.some((n) => n.id === connecting))
                      setConnecting(null);
                  }}
                  defaultViewport={initialViewport}
                  minZoom={0.05}
                  maxZoom={4}
                  deleteKeyCode={
                    tool === "brush" || autoWarning ? null : ["Backspace", "Delete"]
                  }
                  isValidConnection={(c) => c.source !== c.target}
                  aria-label="Полотно пользовательского потока"
                >
                  <ViewportPortal>
                    <svg className="mask-note-connectors" width="1" height="1">
                      {displayNodes
                        .filter((n) => !focusActive || focusIds.has(n.id))
                        .flatMap((screen) =>
                          (screen.data.regions ?? []).flatMap((region) => {
                            const points = region.strokes?.flatMap(
                              (stroke) => stroke.points,
                            );
                            const center = points?.length
                              ? {
                                  x:
                                    points.reduce((s, p) => s + p.x, 0) /
                                    points.length,
                                  y:
                                    points.reduce((s, p) => s + p.y, 0) /
                                    points.length,
                                }
                              : {
                                  x: region.x + region.width / 2,
                                  y: region.y + region.height / 2,
                                };
                            const ratio =
                              (screen.data.imageSize?.width ?? 210) /
                              (screen.data.imageSize?.height ?? 290);
                            const width = ratio >= 1 ? 380 : 210,
                              height = width / ratio;
                            const offset=anchors[screen.id]?.core??{x:0,y:0};
                            const x = screen.position.x + offset.x + 10 + center.x * width,
                              y = screen.position.y + offset.y + 37 + center.y * height;
                            return (region.noteIds ?? []).map((id) => {
                              const note = displayNodes.find((n) => n.id === id);
                              if (!note) return null;
                              const dockId=note.data.dock?.screenId;
                              const anchor=dockId ? anchors[dockId]?.notes[id] : undefined;
                              const parent=displayNodes.find(n=>n.id===dockId),canonicalParent=nodes.find(n=>n.id===dockId);
                              const box=anchor&&parent&&canonicalParent ? {...anchor,
                                x:anchor.x+parent.position.x-canonicalParent.position.x,
                                y:anchor.y+parent.position.y-canonicalParent.position.y,
                              } : {...note.position,...nodeSize(note)};
                              const targetX =
                                  box.x +
                                  (box.x < x ? box.width : 0),
                                targetY = Math.max(
                                  box.y + 10,
                                  Math.min(box.y + box.height - 10, y),
                                );
                              return (
                                <line
                                  key={screen.id + region.id + id}
                                  className="mask-note-connector"
                                  x1={x}
                                  y1={y}
                                  x2={targetX}
                                  y2={targetY}
                                  stroke={
                                    hoveredRegion?.regionId === region.id ||
                                    regionSelection?.regionId === region.id
                                      ? "#9366c7"
                                      : "#c7b6db"
                                  }
                                  strokeWidth="1"
                                  vectorEffect="non-scaling-stroke"
                                />
                              );
                            });
                          }),
                        )}
                    </svg>
                  </ViewportPortal>
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="#d7dce6"
                  />
                </ReactFlow>
              </LabelPositions.Provider>
            </HoveredTransition.Provider>
            {!nodes.length && (
              <div className="empty-state">
                <div className="empty-illustration" aria-hidden="true">
                  <div className="mini-screen first">
                    <span />
                    <i />
                    <i />
                    <b />
                  </div>
                  <ArrowRight size={24} />
                  <div className="mini-screen second">
                    <span />
                    <i />
                    <i />
                    <b />
                  </div>
                  <div className="mini-note">
                    <i />
                    <i />
                  </div>
                </div>
                <span className="eyebrow">МЫСЛИТЕ ЭКРАНАМИ</span>
                <h2>
                  У каждого пути
                  <br />
                  есть первый экран
                </h2>
                <p>
                  Соберите скриншоты в одну историю.
                  <br />
                  Соедините шаги и оставьте важные детали рядом.
                </p>
                <button
                  className="primary-button"
                  onClick={() => input.current?.click()}
                  disabled={loading}
                >
                  <Plus size={18} />
                  Загрузить скриншоты
                </button>
                <span className="file-hint">
                  PNG, JPEG или WebP · до 10 МБ на файл
                </span>
              </div>
            )}
            {connecting && (
              <div className="connection-hint" role="status">
                <ArrowRight size={17} />
                Нажмите левую точку другого экрана
                <button
                  className="icon-button"
                  aria-label="Отменить стрелку"
                  onClick={() => setConnecting(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {error && (
              <div className="error-banner" role="alert">
                {error}
                <button
                  className="icon-button"
                  aria-label="Закрыть ошибку"
                  onClick={() => setError("")}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="zoom-controls">
              <button
                aria-label="Уменьшить масштаб"
                onClick={() => void zoomOut()}
              >
                <Minus size={17} />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                aria-label="Увеличить масштаб"
                onClick={() => void zoomIn()}
              >
                <Plus size={17} />
              </button>
              <i />
              <button
                aria-label="Показать всю доску"
                onClick={() =>
                  void fitView({ padding: 0.2, maxZoom: 1, duration: 200 })
                }
              >
                <Maximize size={17} />
              </button>
            </div>
            {pendingRegion && (
              <section className="region-discussion">
                <h2>Связать с заметкой</h2>
                <label>
                  Существующая заметка
                  <select
                    aria-label="Заметка для области"
                    value={noteChoice}
                    onChange={(e) => setNoteChoice(e.target.value)}
                  >
                    <option value="">Выберите заметку</option>
                    {notes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.data.text?.slice(0, 100) || n.data.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={!noteChoice}
                  onClick={() => attachNote(noteChoice)}
                >
                  Связать с заметкой
                </button>
                <label>
                  Новая заметка
                  <textarea
                    aria-label="Текст новой заметки"
                    value={newNoteText}
                    maxLength={4000}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                </label>
                <button
                  disabled={!newNoteText.trim()}
                  onClick={() => attachNote(undefined)}
                >
                  Создать и связать
                </button>
                <button onClick={() => setPendingRegion(null)}>
                  Отменить выбор заметки
                </button>
              </section>
            )}
            {selectedRegion && selectedScreen && !pendingRegion && (
              <section className="region-discussion">
                <header>
                  <h2>Связанные заметки</h2>
                  <button
                    aria-label="Закрыть связанные заметки"
                    onClick={() => setRegionSelection(null)}
                  >
                    ×
                  </button>
                </header>
                {(selectedRegion.noteIds ?? []).map((noteId) => {
                  const note = nodes.find((n) => n.id === noteId);
                  return (
                    note && (
                      <article
                        key={noteId}
                        className="region-comment highlighted"
                      >
                        <textarea
                          aria-label="Текст связанной заметки"
                          value={note.data.text ?? ""}
                          onChange={(e) =>
                            update(noteId, { text: e.target.value })
                          }
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={note.data.status === "done"}
                            onChange={(e) =>
                              update(noteId, {
                                status: e.target.checked ? "done" : "open",
                                resolvedAt: e.target.checked
                                  ? new Date().toISOString()
                                  : undefined,
                              })
                            }
                          />
                          Выполнена · остаётся на доске
                        </label>
                      </article>
                    )
                  );
                })}
                <button
                  onClick={() => {
                    setNoteChoice("");
                    setNewNoteText("");
                    setPendingRegion({
                      screenId: selectedScreen.id,
                      region: selectedRegion,
                      existing: true,
                    });
                  }}
                >
                  Добавить связь с заметкой
                </button>
              </section>
            )}
            {deletedRegion && (
              <div className="connection-hint mask-undo" role="status">
                Область удалена; заметки сохранены
                <button
                  onClick={() => {
                    const screen = nodes.find(
                      (n) => n.id === deletedRegion.screenId,
                    );
                    if (screen)
                      update(screen.id, {
                        regions: [
                          ...(screen.data.regions ?? []),
                          {
                            ...deletedRegion.region,
                            noteIds: (
                              deletedRegion.region.noteIds ?? []
                            ).filter((id) =>
                              nodes.some(
                                (n) => n.id === id && n.type === "note",
                              ),
                            ),
                          },
                        ],
                      });
                    setDeletedRegion(null);
                  }}
                >
                  Отменить удаление области
                </button>
              </div>
            )}
            {help && (
              <section className="help-panel">
                <div>
                  <h2>Как собрать поток</h2>
                  <button
                    className="icon-button"
                    aria-label="Закрыть помощь"
                    onClick={() => setHelp(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <ol>
                  <li>Загрузите скриншоты и измените подписи под ними.</li>
                  <li>Перемещайте экраны и заметки за верхнюю полоску.</li>
                  <li>
                    Перетащите правую точку экрана к левой точке другого. Или
                    нажмите их по очереди.
                  </li>
                  <li>
                    Выделите стрелку и нажмите Delete, чтобы убрать переход.
                  </li>
                  <li>Нажмите маркер в шапке нужного экрана или наведите на экран
                    и нажмите B. Нарисуйте маску на этом экране;
                    Бегунок у маркера или [ и ] меняют размер кисти;
                    Enter завершает выделение. Затем
                    выберите заметку или создайте новую.</li>
                  <li>Автокомпоновка включается слева. Выключите её, чтобы
                    размещать карточки и подписи вручную.</li>
                </ol>
                <p>Escape отменяет создание стрелки.</p>
              </section>
            )}
          </main>
        </div>
        <footer className="status-bar">
          <span>
            <span className="status-dot" />
            {screens.length} экранов <span className="status-separator">/</span>{" "}
            {edges.length} переходов
          </span>
          <span>
            <ArrowDownToLine size={13} />
            Доска хранится в браузере. Экспортируйте архив для резервной копии.
          </span>
          <span className="version-label">THEBOARD PREVIEW</span>
          <div className="canvas-tip">
            {tool === "brush"
              ? `Кисть ${Math.round(brushRadius * 100)}% · [ ] размер · Enter завершить · Esc отмена · Ctrl/Cmd+Z мазок`
              : "Пробел / Alt + перетаскивание — навигация"}
            {" · Колесо — масштаб · Наведите на подпись, чтобы увидеть её стрелку"}
          </div>
        </footer>
      </div>
    </ActionsContext.Provider>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
