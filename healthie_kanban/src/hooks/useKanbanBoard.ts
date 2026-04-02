import { useCallback, useEffect } from "react";
import type { KanbanState, KanbanAction, ColumnId, Character } from "../types";
import { localStorageAdapter, type StorageAdapter } from "../storage";
import { useUndoRedo } from "./useUndoRedo";

const emptyState: KanbanState = {
  todo: [],
  doing: [],
  done: [],
};

export function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case "ADD_TASK": {
      const task = {
        id: crypto.randomUUID(),
        title: action.payload.title,
        character: action.payload.character,
      };
      return { ...state, todo: [...state.todo, task] };
    }

    case "MOVE_TASK": {
      const { taskId, from, to, toIndex } = action.payload;
      if (from === to) return state;

      const fromTasks = [...state[from]];
      const taskIndex = fromTasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return state;

      const [task] = fromTasks.splice(taskIndex, 1);
      const toTasks = [...state[to]];
      toTasks.splice(toIndex, 0, task);

      return { ...state, [from]: fromTasks, [to]: toTasks };
    }

    case "REORDER": {
      const { column, fromIndex, toIndex } = action.payload;
      const tasks = [...state[column]];
      const [moved] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, moved);
      return { ...state, [column]: tasks };
    }

    default:
      return state;
  }
}

export function useKanbanBoard(storage: StorageAdapter = localStorageAdapter) {
  const {
    state,
    dispatch,
    undo,
    redo,
    canUndo,
    canRedo,
    saveCheckpoint,
    commitCheckpoint,
    discardCheckpoint,
  } = useUndoRedo(kanbanReducer, storage.load() ?? emptyState);

  useEffect(() => {
    storage.save(state);
  }, [state, storage]);

  const addTask = useCallback(
    (title: string, character: Character) => {
      dispatch({ type: "ADD_TASK", payload: { title, character } });
    },
    [dispatch]
  );

  const moveTask = useCallback(
    (taskId: string, from: ColumnId, to: ColumnId, toIndex: number) => {
      dispatch({ type: "MOVE_TASK", payload: { taskId, from, to, toIndex } });
    },
    [dispatch]
  );

  const reorder = useCallback(
    (column: ColumnId, fromIndex: number, toIndex: number) => {
      dispatch({ type: "REORDER", payload: { column, fromIndex, toIndex } });
    },
    [dispatch]
  );

  return {
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
  };
}
