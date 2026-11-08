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

type BoardNode = Node<
  { title: string; image?: string; text?: string },
  "screen" | "note"
>;
type Actions = {
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
      <div className="screen-image">
        <img
          src={data.image}
          alt={data.title || "Экран приложения"}
          draggable={false}
        />
      </div>
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
      className={`note-card ${selected ? "is-selected" : ""}`}
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

function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<BoardNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [help, setHelp] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, screenToFlowPosition } =
    useReactFlow<BoardNode>();
  const { zoom } = useViewport();
  const screens = nodes.filter((n) => n.type === "screen");
  const notes = nodes.filter((n) => n.type === "note");

  useEffect(() => {
    if (!nodes.length) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [nodes.length]);

  useEffect(() => {
    const cancel = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnecting(null);
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
    setNodes((current) => current.filter((n) => n.id !== id));
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
            <strong>Новый поток</strong>
          </div>
          <span className="session-badge">
            <span /> Локальная сессия
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
        <div className="workspace">
          <aside className="sidebar">
            <div className="sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
            <div className="board-link">
              <Layers2 size={17} />
              <span>Новый поток</span>
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
          <main className="canvas" ref={board}>
            <div className="canvas-heading">
              <h1>Новый поток</h1>
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
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={connect}
              connectOnClick={false}
              onPaneClick={() => setConnecting(null)}
              onNodesDelete={(deleted) => {
                if (deleted.some((n) => n.id === connecting))
                  setConnecting(null);
              }}
              defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
              minZoom={0.2}
              maxZoom={2}
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
              Перетаскивайте фон для навигации <span>·</span> Колесо — масштаб
            </div>
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
            Доска хранится только в этой вкладке — после закрытия данные
            исчезнут
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
