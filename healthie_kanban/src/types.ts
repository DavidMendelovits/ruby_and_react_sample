export type ColumnId = "todo" | "doing" | "done";

export interface Character {
  id: string;
  name: string;
  image: string;
  status: string;
}

export interface Task {
  id: string;
  title: string;
  character: Character;
}

export interface KanbanState {
  todo: Task[];
  doing: Task[];
  done: Task[];
}

export type KanbanAction =
  | { type: "ADD_TASK"; payload: { title: string; character: Character } }
  | { type: "MOVE_TASK"; payload: { taskId: string; from: ColumnId; to: ColumnId; toIndex: number } }
  | { type: "REORDER"; payload: { column: ColumnId; fromIndex: number; toIndex: number } };

export const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
];
