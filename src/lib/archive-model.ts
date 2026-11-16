export type ArchivePhase = "idle" | "opening" | "reading" | "closing";
export type ArchiveLog = { sequence: number; message: string };
export type ArchiveState = {
  index: number;
  preview: string | null;
  selected: string | null;
  phase: ArchivePhase;
  closeRequested: boolean;
  logs: ArchiveLog[];
};
export type ArchiveAction =
  | { type: "rotate"; direction: number; ids: readonly string[] }
  | { type: "jump"; index: number; ids: readonly string[] }
  | { type: "preview"; id: string | null }
  | { type: "open"; id: string }
  | { type: "close" }
  | { type: "settled"; phase: ArchivePhase };

export function wrapIndex(index: number, length: number): number {
  return length > 0 ? ((index % length) + length) % length : 0;
}

export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  return Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.3
    ? dx < 0
      ? 1
      : -1
    : 0;
}

export function visibleIndices(
  index: number,
  length: number,
  limit: number,
): number[] {
  return Array.from(
    { length: Math.min(Math.max(0, limit), length) },
    (_, rank) => wrapIndex(index + rank, length),
  );
}

export function initialArchiveState(): ArchiveState {
  return {
    index: 0,
    preview: null,
    selected: null,
    phase: "idle",
    closeRequested: false,
    logs: [
      { sequence: 1, message: "ARCHIVE SESSION ACTIVE" },
      { sequence: 2, message: "RECORD INDEX LOADED" },
    ],
  };
}

function log(state: ArchiveState, message: string): ArchiveState {
  const sequence = (state.logs.at(-1)?.sequence ?? 0) + 1;
  return { ...state, logs: [...state.logs, { sequence, message }].slice(-4) };
}

export function archiveReducer(
  state: ArchiveState,
  action: ArchiveAction,
): ArchiveState {
  switch (action.type) {
    case "rotate":
    case "jump": {
      if (state.phase !== "idle" || !action.ids.length) return state;
      const index = wrapIndex(
        action.type === "rotate"
          ? state.index + action.direction
          : action.index,
        action.ids.length,
      );
      if (index === state.index) return state;
      return log(
        { ...state, index, preview: null },
        `RECORD ${action.ids[index]} FOCUSED`,
      );
    }
    case "preview":
      return state.phase === "idle" ? { ...state, preview: action.id } : state;
    case "open":
      if (state.phase !== "idle") return state;
      return log(
        {
          ...state,
          selected: action.id,
          preview: null,
          phase: "opening",
          closeRequested: false,
        },
        `RECORD ${action.id} SELECTED`,
      );
    case "close":
      if (state.phase === "opening") return { ...state, closeRequested: true };
      return state.phase === "reading" ? { ...state, phase: "closing" } : state;
    case "settled":
      if (action.phase !== state.phase) return state;
      if (state.phase === "opening") {
        return log(
          { ...state, phase: state.closeRequested ? "closing" : "reading" },
          "FILE RETRIEVED",
        );
      }
      if (state.phase === "closing") {
        return log(
          {
            ...state,
            phase: "idle",
            selected: null,
            preview: null,
            closeRequested: false,
          },
          "RECORD CLOSED",
        );
      }
      return state;
  }
}
