import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState, useCallback, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import type { ColumnId, Task } from "../types";
import { COLUMNS } from "../types";
import { useKanbanBoard } from "../hooks/useKanbanBoard";
import { Column } from "./Column";
import { TaskForm } from "./TaskForm";
import { TaskCard } from "./TaskCard";
import styles from "./KanbanBoard.module.css";

function findTaskColumn(state: Record<ColumnId, Task[]>, taskId: string): ColumnId | null {
  for (const col of COLUMNS) {
    if (state[col.id].some((t) => t.id === taskId)) {
      return col.id;
    }
  }
  return null;
}

export function KanbanBoard() {
  const {
    state,
    addTask,
    moveTask,
    reorder,
    undo,
    redo,
    canUndo,
    canRedo,
    saveCheckpoint,
    commitCheckpoint,
    discardCheckpoint,
  } = useKanbanBoard();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const dragOriginRef = useRef<ColumnId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
      showToast("Undone");
    }
  }, [canUndo, undo, showToast]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo();
      showToast("Redone");
    }
  }, [canRedo, redo, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const column = findTaskColumn(state, String(active.id));
      if (column) {
        const task = state[column].find((t) => t.id === String(active.id));
        if (task) {
          setActiveTask(task);
          dragOriginRef.current = column;
          saveCheckpoint();
        }
      }
    },
    [state, saveCheckpoint]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const activeColumn = findTaskColumn(state, activeId);
      // over could be a column id or a task id
      let overColumn = COLUMNS.find((c) => c.id === overId)?.id ?? findTaskColumn(state, overId);

      if (!activeColumn || !overColumn || activeColumn === overColumn) return;

      const overIndex = state[overColumn].findIndex((t) => t.id === overId);
      const insertIndex = overIndex >= 0 ? overIndex : state[overColumn].length;

      moveTask(activeId, activeColumn, overColumn, insertIndex);
    },
    [state, moveTask]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const activeColumn = findTaskColumn(state, activeId);
      const overColumn = COLUMNS.find((c) => c.id === overId)?.id ?? findTaskColumn(state, overId);

      if (!activeColumn || !overColumn) return;

      if (activeColumn === overColumn) {
        const items = state[activeColumn];
        const oldIndex = items.findIndex((t) => t.id === activeId);
        const newIndex = items.findIndex((t) => t.id === overId);
        if (oldIndex !== newIndex && newIndex >= 0) {
          reorder(activeColumn, oldIndex, newIndex);
        }
      }

      // Fire confetti when a task is newly moved to "done"
      if (overColumn === "done" && dragOriginRef.current !== "done") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      dragOriginRef.current = null;
      commitCheckpoint();
    },
    [state, reorder, commitCheckpoint]
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    dragOriginRef.current = null;
    discardCheckpoint();
  }, [discardCheckpoint]);

  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = useCallback(
    (title: string, character: Parameters<typeof addTask>[1]) => {
      addTask(title, character);
      setModalOpen(false);
    },
    [addTask]
  );

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>Kanban Board</h1>
        <div className={styles.undoRedoGroup}>
          <button
            className={styles.undoRedoButton}
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo"
            aria-disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M3 13a9 9 0 0 1 15.36-6.36" />
              <path d="M21 12a9 9 0 0 1-15.36 6.36" />
            </svg>
          </button>
          <button
            className={styles.undoRedoButton}
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo"
            aria-disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M21 13a9 9 0 0 0-15.36-6.36" />
              <path d="M3 12a9 9 0 0 0 15.36 6.36" />
            </svg>
          </button>
        </div>
        <button className={styles.createButton} onClick={() => setModalOpen(true)}>
          + Create Task
        </button>
      </div>
      {modalOpen && <TaskForm onAdd={handleAdd} onClose={() => setModalOpen(false)} />}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={styles.board}>
          {COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} title={col.title} tasks={state[col.id]} />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
