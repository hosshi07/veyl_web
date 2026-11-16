"use client";
import { useCallback, useRef, useState } from "react";
import {
  archiveReducer,
  initialArchiveState,
  type ArchiveAction,
} from "@/lib/archive-model";

export function useArchive(ids: readonly string[]) {
  const [state, setState] = useState(initialArchiveState);
  const current = useRef(state);
  // Synchronous ref guards also reject events arriving before React re-renders.
  const dispatch = useCallback((action: ArchiveAction) => {
    const next = archiveReducer(current.current, action);
    current.current = next;
    setState(next);
  }, []);
  const rotate = useCallback(
    (direction: number) => {
      dispatch({ type: "rotate", direction, ids });
    },
    [dispatch, ids],
  );
  const jump = useCallback(
    (index: number) => {
      dispatch({ type: "jump", index, ids });
    },
    [dispatch, ids],
  );
  return { state, current, dispatch, rotate, jump };
}
