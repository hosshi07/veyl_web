import test from "node:test";
import assert from "node:assert/strict";
import {
  archiveReducer,
  initialArchiveState,
  visibleIndices,
  wrapIndex,
  swipeDirection,
} from "../src/lib/archive-model.ts";

test("horizontal swipes rotate while taps and vertical page scrolling do not", () => {
  assert.equal(swipeDirection(-80, 10), 1);
  assert.equal(swipeDirection(80, 10), -1);
  assert.equal(swipeDirection(12, 5), 0);
  assert.equal(swipeDirection(50, 120), 0);
  assert.equal(swipeDirection(-55, -50), 0);
});

test("pile window is bounded and wraps with thousands of records", () => {
  assert.deepEqual(visibleIndices(9998, 10000, 5), [9998, 9999, 0, 1, 2]);
  assert.deepEqual(visibleIndices(0, 2, 5), [0, 1]);
  assert.deepEqual(visibleIndices(0, 0, 5), []);
  assert.equal(wrapIndex(-1, 6), 5);
  assert.equal(wrapIndex(6, 6), 0);
});

test("every navigation press is applied even before an animation settles", () => {
  const ids = ["A", "B", "C", "D", "E", "F"];
  let state = initialArchiveState();
  for (let i = 0; i < 10; i++) {
    state = archiveReducer(state, { type: "rotate", direction: 1, ids });
    assert.equal(state.index, (i + 1) % ids.length);
  }
  for (let i = 0; i < 10; i++)
    state = archiveReducer(state, { type: "rotate", direction: -1, ids });
  assert.equal(state.index, 0);
  assert.equal(state.logs.at(-1)?.sequence, 22);
});

test("rapid clicks and rotation cannot replace an extracted file", () => {
  const open = archiveReducer(initialArchiveState(), {
    type: "open",
    id: "DEMO-02",
  });
  assert.equal(archiveReducer(open, { type: "open", id: "DEMO-03" }), open);
  assert.equal(
    archiveReducer(open, {
      type: "rotate",
      direction: 1,
      ids: ["DEMO-01", "DEMO-02"],
    }),
    open,
  );
  assert.equal(
    archiveReducer(open, { type: "settled", phase: "closing" }),
    open,
  );
});

test("Escape during extraction queues a return and preserves pile order", () => {
  const ids = ["DEMO-01", "DEMO-02", "DEMO-03"];
  let state = archiveReducer(initialArchiveState(), {
    type: "jump",
    index: 2,
    ids,
  });
  const originalWindow = visibleIndices(state.index, ids.length, 3);
  state = archiveReducer(state, { type: "open", id: "DEMO-01" });
  state = archiveReducer(state, { type: "close" });
  assert.equal(state.phase, "opening");
  assert.equal(state.closeRequested, true);
  state = archiveReducer(state, { type: "settled", phase: "opening" });
  assert.equal(state.phase, "closing");
  state = archiveReducer(state, { type: "settled", phase: "closing" });
  assert.equal(state.phase, "idle");
  assert.equal(state.selected, null);
  assert.deepEqual(visibleIndices(state.index, ids.length, 3), originalWindow);
  assert.equal(state.logs.at(-1)?.message, "RECORD CLOSED");
});

test("reading closes normally and preview is not retained across rotation", () => {
  let state = archiveReducer(initialArchiveState(), {
    type: "preview",
    id: "DEMO-01",
  });
  state = archiveReducer(state, {
    type: "rotate",
    direction: -1,
    ids: ["DEMO-01", "DEMO-02"],
  });
  assert.equal(state.preview, null);
  assert.equal(state.index, 1);
  state = archiveReducer(state, { type: "open", id: "DEMO-02" });
  state = archiveReducer(state, { type: "settled", phase: "opening" });
  assert.equal(state.phase, "reading");
  assert.equal(state.logs.at(-1)?.message, "FILE RETRIEVED");
  state = archiveReducer(state, { type: "close" });
  assert.equal(state.phase, "closing");
});

test("session logs stay bounded after repeated navigation", () => {
  let state = initialArchiveState();
  for (let i = 0; i < 1000; i++)
    state = archiveReducer(state, {
      type: "rotate",
      direction: 1,
      ids: ["A", "B"],
    });
  assert.equal(state.logs.length, 4);
  assert.equal(state.logs.at(-1)?.sequence, 1002);
});
