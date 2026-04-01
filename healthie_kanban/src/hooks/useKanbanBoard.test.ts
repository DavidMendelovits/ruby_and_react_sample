import { describe, it, expect } from "vitest";
import { kanbanReducer } from "./useKanbanBoard";
import type { KanbanState, Character } from "../types";

const mockCharacter: Character = {
  id: "1",
  name: "Rick Sanchez",
  image: "https://example.com/rick.png",
  status: "Alive",
};

const emptyState: KanbanState = { todo: [], doing: [], done: [] };

describe("kanbanReducer", () => {
  it("adds a task to the todo column", () => {
    const result = kanbanReducer(emptyState, {
      type: "ADD_TASK",
      payload: { title: "Test task", character: mockCharacter },
    });

    expect(result.todo).toHaveLength(1);
    expect(result.todo[0].title).toBe("Test task");
    expect(result.todo[0].character).toBe(mockCharacter);
    expect(result.doing).toHaveLength(0);
    expect(result.done).toHaveLength(0);
  });

  it("moves a task between columns", () => {
    const state: KanbanState = {
      todo: [{ id: "1", title: "Task 1", character: mockCharacter }],
      doing: [],
      done: [],
    };

    const result = kanbanReducer(state, {
      type: "MOVE_TASK",
      payload: { taskId: "1", from: "todo", to: "doing", toIndex: 0 },
    });

    expect(result.todo).toHaveLength(0);
    expect(result.doing).toHaveLength(1);
    expect(result.doing[0].id).toBe("1");
  });

  it("inserts at the correct index when moving", () => {
    const char2: Character = { ...mockCharacter, id: "2", name: "Morty" };
    const state: KanbanState = {
      todo: [{ id: "3", title: "Task 3", character: mockCharacter }],
      doing: [
        { id: "1", title: "Task 1", character: mockCharacter },
        { id: "2", title: "Task 2", character: char2 },
      ],
      done: [],
    };

    const result = kanbanReducer(state, {
      type: "MOVE_TASK",
      payload: { taskId: "3", from: "todo", to: "doing", toIndex: 1 },
    });

    expect(result.doing.map((t) => t.id)).toEqual(["1", "3", "2"]);
  });

  it("returns same state when moving to same column", () => {
    const state: KanbanState = {
      todo: [{ id: "1", title: "Task 1", character: mockCharacter }],
      doing: [],
      done: [],
    };

    const result = kanbanReducer(state, {
      type: "MOVE_TASK",
      payload: { taskId: "1", from: "todo", to: "todo", toIndex: 0 },
    });

    expect(result).toBe(state);
  });

  it("reorders tasks within a column", () => {
    const state: KanbanState = {
      todo: [
        { id: "1", title: "First", character: mockCharacter },
        { id: "2", title: "Second", character: mockCharacter },
        { id: "3", title: "Third", character: mockCharacter },
      ],
      doing: [],
      done: [],
    };

    const result = kanbanReducer(state, {
      type: "REORDER",
      payload: { column: "todo", fromIndex: 0, toIndex: 2 },
    });

    expect(result.todo.map((t) => t.id)).toEqual(["2", "3", "1"]);
  });

  it("handles moving a non-existent task gracefully", () => {
    const result = kanbanReducer(emptyState, {
      type: "MOVE_TASK",
      payload: { taskId: "999", from: "todo", to: "doing", toIndex: 0 },
    });

    expect(result).toBe(emptyState);
  });
});
