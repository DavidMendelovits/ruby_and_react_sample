import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task, ColumnId } from "../types";
import { TaskCard } from "./TaskCard";
import styles from "./Column.module.css";

interface ColumnProps {
  id: ColumnId;
  title: string;
  tasks: Task[];
}

export function Column({ id, title, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className={`${styles.column} ${isOver ? styles.over : ""}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>{tasks.length}</span>
      </div>
      <div ref={setNodeRef} role="list" aria-label={title} className={styles.tasks}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && <p className={styles.empty}>Drop items here</p>}
      </div>
    </div>
  );
}
