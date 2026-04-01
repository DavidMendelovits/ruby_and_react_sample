import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useState, useCallback } from "react";
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
  const { state, addTask, moveTask, reorder } = useKanbanBoard();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const column = findTaskColumn(state, String(active.id));
      if (column) {
        const task = state[column].find((t) => t.id === String(active.id));
        if (task) setActiveTask(task);
      }
    },
    [state]
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
      } else {
        // Cross-column move was handled in dragOver
        // Check if dropped into "done" for confetti
        if (overColumn === "done") {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }

      // Also fire confetti if reordering within "done" and item was just moved there
      if (activeColumn !== overColumn && overColumn === "done") {
        // Already handled above
      }
    },
    [state, reorder]
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Kanban Board</h1>
      <TaskForm onAdd={addTask} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
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
    </div>
  );
}
