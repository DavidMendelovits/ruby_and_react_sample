import { useReducer, useCallback } from "react";

const MAX_HISTORY = 50;

interface InternalState<S> {
  past: S[];
  present: S;
  future: S[];
  checkpoint: S | null;
}

type MetaAction<A> =
  | { type: "DISPATCH"; action: A }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_CHECKPOINT" }
  | { type: "COMMIT_CHECKPOINT" }
  | { type: "DISCARD_CHECKPOINT" };

function createMetaReducer<S, A>(innerReducer: (state: S, action: A) => S) {
  return function metaReducer(
    state: InternalState<S>,
    meta: MetaAction<A>
  ): InternalState<S> {
    switch (meta.type) {
      case "DISPATCH": {
        const newPresent = innerReducer(state.present, meta.action);
        if (newPresent === state.present) return state;

        if (state.checkpoint !== null) {
          // During a drag: update present without touching history
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

      case "SAVE_CHECKPOINT": {
        return { ...state, checkpoint: state.present };
      }

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
  };
}

export function useUndoRedo<S, A>(
  innerReducer: (state: S, action: A) => S,
  initialState: S
) {
  const [internal, dispatchMeta] = useReducer(
    createMetaReducer(innerReducer),
    {
      past: [],
      present: initialState,
      future: [],
      checkpoint: null,
    }
  );

  const dispatch = useCallback(
    (action: A) => dispatchMeta({ type: "DISPATCH", action }),
    []
  );
  const undo = useCallback(() => dispatchMeta({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatchMeta({ type: "REDO" }), []);
  const saveCheckpoint = useCallback(
    () => dispatchMeta({ type: "SAVE_CHECKPOINT" }),
    []
  );
  const commitCheckpoint = useCallback(
    () => dispatchMeta({ type: "COMMIT_CHECKPOINT" }),
    []
  );
  const discardCheckpoint = useCallback(
    () => dispatchMeta({ type: "DISCARD_CHECKPOINT" }),
    []
  );

  return {
    state: internal.present,
    dispatch,
    undo,
    redo,
    canUndo: internal.checkpoint === null && internal.past.length > 0,
    canRedo: internal.checkpoint === null && internal.future.length > 0,
    saveCheckpoint,
    commitCheckpoint,
    discardCheckpoint,
  };
}
