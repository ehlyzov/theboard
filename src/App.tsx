import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
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
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  GripHorizontal,
  ImagePlus,
  Layers2,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  Scan,
  StickyNote,
  Trash2,
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
} from "./boards";

import RegionImage from "./RegionImage";
import LabeledEdge from "./LabeledEdge";
const edgeTypes = { smoothstep: LabeledEdge };

type Actions = {
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
  return (
    <article
      data-testid="screen-node"
      className={`screen-card ${selected ? "is-selected" : ""} ${actions.connecting === id ? "is-source" : ""}`}
    >
      <div className="node-grip">
        <span>
          <Scan size={13} /> ЭКРАН
        </span>
        <GripHorizontal size={16} />
        <button
          className="icon-button nodrag"
          aria-label="Удалить экран"
          onClick={() => actions.remove(id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <RegionImage
        image={data.image!}
        title={data.title}
        regions={data.regions ?? []}
        selected={
          actions.regionSelection?.screenId === id
            ? actions.regionSelection.regionId
            : undefined
        }
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

function NoteNode({ id, data, selected }: NodeProps<BoardNode>) {
  const actions = useContext(ActionsContext);
  return (
    <article
      data-testid="note-node"
      className={`note-card ${selected ? "is-selected" : ""} ${actions.linkedNoteIds.includes(id) ? "is-linked" : ""}`}
    >
      <div className="node-grip">
        <span>
          <StickyNote size={13} /> ЗАМЕТКА
        </span>
        <GripHorizontal size={16} />
        <button
          className="icon-button nodrag"
          aria-label="Удалить заметку"
          onClick={() => actions.remove(id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <textarea
        className="nodrag nowheel"
        aria-label="Текст заметки"
        placeholder="Что важно в этом шаге?"
        value={data.text || ""}
        onChange={(e) => actions.update(id, { text: e.target.value })}
        maxLength={4000}
      />
    </article>
  );
}

const nodeTypes = { screen: ScreenNode, note: NoteNode };

async function readImage(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("format");
  const image = await createImageBitmap(file);
  const pixels = image.width * image.height;
  image.close();
  if (pixels > 40_000_000) throw new Error("size");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
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
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [regionSelection, setRegionSelection] = useState<{
    screenId: string;
    regionId: string;
  } | null>(null);
  const [pendingRegion, setPendingRegion] = useState<{
    screenId: string;
    region: Region;
    existing?: boolean;
  } | null>(null);
  const [noteChoice, setNoteChoice] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [deletedRegion, setDeletedRegion] = useState<{
    screenId: string;
    region: Region;
  } | null>(null);
  const selectedScreen = nodes.find((n) => n.id === regionSelection?.screenId);
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
          position: { x: screen.position.x + 280, y: screen.position.y + 80 },
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
    Boolean(nodes.find((n) => n.id === currentScreenId && n.type === "screen"));
  const displayNodes = focusActive
    ? nodes.map((n) => ({
        ...n,
        hidden: !focusIds.has(n.id) && !focusedNoteIds.has(n.id),
      }))
    : nodes;
  const displayEdges = focusActive
    ? edges.map((e) => ({ ...e, hidden: e.source !== currentScreenId }))
    : edges;
  const [help, setHelp] = useState(false);
  const [boardId] = useState(() => currentBoard());
  const [title, setTitle] = useState("Новый поток");
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Загрузка…");
  const archiveInput = useRef<HTMLInputElement>(null);
  const saveSequence = useRef(0);
  const snapshot = (): BoardData => ({ version: 1, title, nodes, edges });
  useEffect(() => {
    let disposed = false;
    loadBoard(boardId)
      .then((saved) => {
        if (disposed) return;
        if (saved) {
          setTitle(saved.title);
          setNodes(saved.nodes);
          setEdges(saved.edges);
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
  }, [ready, title, nodes, edges, boardId]);
  async function openArchive(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const imported = await importBoard(file);
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
  const [initialViewport] = useState(() => workspace(boardId));
  useEffect(() => {
    try {
      localStorage.setItem("theboard:last-board", boardId);
      localStorage.setItem(
        "theboard:workspace:" + boardId,
        JSON.stringify({ ...viewport, focusEnabled, currentScreenId }),
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
  useEffect(() => {
    if (!focusActive) return;
    const frame = requestAnimationFrame(
      () =>
        void fitView({
          nodes: Array.from(focusIds).map((id) => ({ id })),
          padding: 0.2,
          maxZoom: 1,
          duration: 150,
        }),
    );
    return () => cancelAnimationFrame(frame);
  }, [focusEnabled, currentScreenId]);
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
        const image = await readImage(file);
        const index = screens.length + additions.length;
        additions.push({
          id: crypto.randomUUID(),
          type: "screen",
          dragHandle: ".node-grip",
          position: {
            x: 70 + (index % 3) * 310,
            y: 100 + Math.floor(index / 3) * 460,
          },
          data: { title: file.name.replace(/\.[^.]+$/, ""), image },
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
        update,
        regionSelection,
        linkedNoteIds: selectedRegion?.noteIds ?? [],
        createRegion: (screenId, region) => {
          setNoteChoice("");
          setNewNoteText("");
          setPendingRegion({ screenId, region });
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
            <div className="sidebar-section">
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
                        onClick={() =>
                          void fitView({
                            nodes: [{ id: screen.id }],
                            maxZoom: 1,
                            duration: 250,
                          })
                        }
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
                className="tool active"
                aria-label="Выделение и перемещение"
                title="Перемещайте элементы за верхнюю полоску"
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
            <ReactFlow
              nodes={displayNodes}
              edges={displayEdges}
              onNodeClick={(_, node) => {
                if (node.type === "screen") setCurrentScreenId(node.id);
              }}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
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
              deleteKeyCode={["Backspace", "Delete"]}
              isValidConnection={(c) => c.source !== c.target}
              aria-label="Полотно пользовательского потока"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color="#d7dce6"
              />
            </ReactFlow>
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
            <div className="canvas-tip">
              Пробел / Alt + перетаскивание — навигация <span>·</span> Колесо —
              масштаб
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
                <button
                  onClick={() => {
                    setDeletedRegion({
                      screenId: selectedScreen.id,
                      region: selectedRegion,
                    });
                    update(selectedScreen.id, {
                      regions: (selectedScreen.data.regions ?? []).filter(
                        (r) => r.id !== selectedRegion.id,
                      ),
                    });
                    setRegionSelection(null);
                  }}
                >
                  Удалить выбранную область
                </button>
              </section>
            )}
            {deletedRegion && (
              <div className="connection-hint" role="status">
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
                          deletedRegion.region,
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
