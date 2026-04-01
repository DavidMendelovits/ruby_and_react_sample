import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} role="listitem" className={styles.card} {...attributes} {...listeners}>
      <img src={task.character.image} alt={task.character.name} className={styles.avatar} />
      <div className={styles.content}>
        <p className={styles.title}>{task.title}</p>
        <span className={styles.character}>{task.character.name}</span>
      </div>
    </div>
  );
}
