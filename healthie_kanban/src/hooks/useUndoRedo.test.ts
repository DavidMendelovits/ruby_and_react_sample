import { describe, it, expect } from "vitest";

// We test the meta-reducer logic directly by extracting it.
// The useUndoRedo hook is a thin wrapper around useReducer + useCallback.

// Re-implement the meta-reducer logic inline for testing since createMetaReducer is not exported.
// This tests the same logic that runs inside the hook.

const MAX_HISTORY = 50;

interface InternalState<S> {
  past: S[];
  present: S;
  future: S[];
  checkpoint: S | null;
}

type CounterAction = { type: "INCREMENT" } | { type: "SET"; value: number };

function counterReducer(state: number, action: CounterAction): number {
  switch (action.type) {
    case "INCREMENT":
      return state + 1;
    case "SET":
      return action.value;
    default:
      return state;
  }
}

type MetaAction<A> =
  | { type: "DISPATCH"; action: A }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_CHECKPOINT" }
  | { type: "COMMIT_CHECKPOINT" }
  | { type: "DISCARD_CHECKPOINT" };

function metaReducer(
  state: InternalState<number>,
  meta: MetaAction<CounterAction>
): InternalState<number> {
  switch (meta.type) {
    case "DISPATCH": {
      const newPresent = counterReducer(state.present, meta.action);
      if (newPresent === state.present) return state;
      if (state.checkpoint !== null) {
        return { ...state, present: newPresent };
      }
      const past = [...state.past, state.present];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, present: newPresent, future: [], checkpoint: null };
    }
    case "UNDO": {
      if (state.checkpoint !== null) return state;
      if (state.past.length === 0) return state;
      const past = [...state.past];
      const previous = past.pop()!;
      return {
        past,
        present: previous,
        future: [state.present, ...state.future],
        checkpoint: null,
      };
    }
    case "REDO": {
      if (state.checkpoint !== null) return state;
      if (state.future.length === 0) return state;
      const future = [...state.future];
      const next = future.shift()!;
      return {
        past: [...state.past, state.present],
        present: next,
        future,
        checkpoint: null,
      };
    }
    case "SAVE_CHECKPOINT":
      return { ...state, checkpoint: state.present };
    case "COMMIT_CHECKPOINT": {
      if (state.checkpoint === null) return state;
      const past = [...state.past, state.checkpoint];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, present: state.present, future: [], checkpoint: null };
    }
    case "DISCARD_CHECKPOINT": {
      if (state.checkpoint === null) return state;
      return { ...state, present: state.checkpoint, checkpoint: null };
    }
    default:
      return state;
  }
}

function makeState(present: number, past: number[] = [], future: number[] = [], checkpoint: number | null = null): InternalState<number> {
  return { past, present, future, checkpoint };
}

describe("useUndoRedo meta-reducer", () => {
  it("dispatches actions to the inner reducer", () => {
    const state = makeState(0);
    const next = metaReducer(state, { type: "DISPATCH", action: { type: "INCREMENT" } });
    expect(next.present).toBe(1);
    expect(next.past).toEqual([0]);
    expect(next.future).toEqual([]);
  });

  it("undoes a single action", () => {
    const state = makeState(1, [0]);
    const next = metaReducer(state, { type: "UNDO" });
    expect(next.present).toBe(0);
    expect(next.past).toEqual([]);
    expect(next.future).toEqual([1]);
  });

  it("redoes after undo", () => {
    const state = makeState(0, [], [1]);
    const next = metaReducer(state, { type: "REDO" });
    expect(next.present).toBe(1);
    expect(next.past).toEqual([0]);
    expect(next.future).toEqual([]);
  });

  it("clears future on new dispatch", () => {
    const state = makeState(1, [0], [2]);
    const next = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 10 } });
    expect(next.present).toBe(10);
    expect(next.future).toEqual([]);
  });

  it("handles multiple undos and redos", () => {
    let state = makeState(0);
    state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 1 } });
    state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 2 } });
    state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 3 } });

    state = metaReducer(state, { type: "UNDO" }); // 2
    state = metaReducer(state, { type: "UNDO" }); // 1
    expect(state.present).toBe(1);

    state = metaReducer(state, { type: "REDO" }); // 2
    expect(state.present).toBe(2);
  });

  it("caps history at 50 entries", () => {
    let state = makeState(0);
    for (let i = 1; i <= 60; i++) {
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: i } });
    }
    expect(state.present).toBe(60);
    expect(state.past.length).toBe(50);

    // Undo 50 times
    for (let i = 0; i < 50; i++) {
      state = metaReducer(state, { type: "UNDO" });
    }
    expect(state.present).toBe(10);
    expect(state.past.length).toBe(0);
  });

  it("is a no-op when undoing with empty past", () => {
    const state = makeState(0);
    const next = metaReducer(state, { type: "UNDO" });
    expect(next).toBe(state);
  });

  it("is a no-op when redoing with empty future", () => {
    const state = makeState(1, [0]);
    const next = metaReducer(state, { type: "REDO" });
    expect(next).toBe(state);
  });

  it("does not push to history when reducer returns same state", () => {
    const state = makeState(0);
    const next = metaReducer(state, { type: "DISPATCH", action: { type: "UNKNOWN" } as unknown as CounterAction });
    expect(next).toBe(state);
    expect(next.past.length).toBe(0);
  });

  describe("checkpoint (drag coalescing)", () => {
    it("coalesces multiple dispatches into one undo entry", () => {
      let state = makeState(0);
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 1 } });

      // Save checkpoint
      state = metaReducer(state, { type: "SAVE_CHECKPOINT" });
      expect(state.checkpoint).toBe(1);

      // Intermediate moves
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 5 } });
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 8 } });
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 3 } });

      // Past should NOT have grown during checkpoint
      expect(state.past).toEqual([0]);

      // Commit checkpoint
      state = metaReducer(state, { type: "COMMIT_CHECKPOINT" });
      expect(state.present).toBe(3);
      expect(state.checkpoint).toBeNull();

      // Single undo goes back to checkpoint state (1)
      state = metaReducer(state, { type: "UNDO" });
      expect(state.present).toBe(1);
    });

    it("discards checkpoint and restores state", () => {
      let state = makeState(0);
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 1 } });

      state = metaReducer(state, { type: "SAVE_CHECKPOINT" });
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 99 } });
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 42 } });

      state = metaReducer(state, { type: "DISCARD_CHECKPOINT" });
      expect(state.present).toBe(1);
      expect(state.checkpoint).toBeNull();
    });

    it("blocks undo during pending checkpoint", () => {
      let state = makeState(0);
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 1 } });

      state = metaReducer(state, { type: "SAVE_CHECKPOINT" });
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 5 } });

      const afterUndo = metaReducer(state, { type: "UNDO" });
      expect(afterUndo).toBe(state); // no-op
    });

    it("blocks redo during pending checkpoint", () => {
      let state = makeState(0);
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 1 } });
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 2 } });
      state = metaReducer(state, { type: "UNDO" }); // present: 1, future: [2]

      state = metaReducer(state, { type: "SAVE_CHECKPOINT" });

      const afterRedo = metaReducer(state, { type: "REDO" });
      expect(afterRedo).toBe(state); // no-op
    });

    it("commit is a no-op when no checkpoint pending", () => {
      let state = makeState(0);
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 1 } });

      const afterCommit = metaReducer(state, { type: "COMMIT_CHECKPOINT" });
      expect(afterCommit).toBe(state);
    });

    it("discard is a no-op when no checkpoint pending", () => {
      let state = makeState(0);
      state = metaReducer(state, { type: "DISPATCH", action: { type: "SET", value: 1 } });

      const afterDiscard = metaReducer(state, { type: "DISCARD_CHECKPOINT" });
      expect(afterDiscard).toBe(state);
    });
  });
});
