import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceCoast,
  releaseVelocity,
  deckSlots,
  paperPose,
  shouldHandOffLeft,
  canHoverCandidate,
} from "../src/lib/archive-deck-motion.ts";
import {
  archiveReducer,
  initialArchiveState,
  visibleIndices,
  wrapIndex,
  swipeDirection,
} from "../src/lib/archive-model.ts";

test("coasting decays in both directions and is independent of frame rate", () => {
  const whole = advanceCoast(0, 10, 1);
  let split = { position: 0, velocity: 10 };
  for (let i = 0; i < 120; i++)
    split = advanceCoast(split.position, split.velocity, 1 / 120);
  assert.ok(Math.abs(split.position - whole.position) < 1e-10);
  assert.ok(whole.velocity > 0 && whole.velocity < 1);
  const reverse = advanceCoast(0, -10, 1);
  assert.ok(Math.abs(reverse.position + whole.position) < 1e-10);
});

test("release speed uses recent movement, ignores a held pointer, and is bounded", () => {
  assert.equal(
    releaseVelocity(
      [
        { x: 100, time: 0 },
        { x: 40, time: 100 },
      ],
      100,
      60,
    ),
    10,
  );
  assert.equal(
    releaseVelocity(
      [
        { x: 100, time: 0 },
        { x: 40, time: 100 },
        { x: 40, time: 300 },
      ],
      300,
      60,
    ),
    0,
  );
  assert.equal(
    releaseVelocity(
      [
        { x: 0, time: 0 },
        { x: 2000, time: 20 },
      ],
      20,
      60,
    ),
    -14,
  );
});

test("continuous slots wrap with bounded rendering and preserve a paper across boundaries", () => {
  const before = deckSlots(9999.9, 10000, 5);
  const after = deckSlots(10000.1, 10000, 5);
  assert.equal(before.length, 6);
  assert.deepEqual(
    before.slice(1).map((entry) => entry.slot),
    after.slice(0, 5).map((entry) => entry.slot),
  );
  assert.equal(after[0].index, 0);
  assert.equal(deckSlots(0, 0, 5).length, 0);
});

test("edge papers fade horizontally in the same direction without dropping down", () => {
  const exitA = paperPose(-0.25, 5, 54, false);
  const exitB = paperPose(-0.75, 5, 54, false);
  assert.ok(exitB.x < exitA.x && exitB.opacity < exitA.opacity);
  assert.equal(exitA.y, exitB.y);
  const entryA = paperPose(4.75, 5, 54, false);
  const entryB = paperPose(4.25, 5, 54, false);
  assert.ok(entryB.x < entryA.x && entryB.opacity > entryA.opacity);
  assert.equal(entryA.y, entryB.y);
  assert.equal(paperPose(5, 5, 54, false).opacity, 0);
});

test("leftward hover hands off at the left half, not on rightward motion", () => {
  assert.equal(shouldHandOffLeft(240, 260, 100, 300), true);
  assert.equal(shouldHandOffLeft(260, 280, 100, 300), false);
  assert.equal(shouldHandOffLeft(240, 220, 100, 300), false);
});

test("a still-overlapping paper cannot steal selection back against pointer direction", () => {
  assert.equal(canHoverCandidate(4, 3, 580, 590), false);
  assert.equal(canHoverCandidate(4, 3, 600, 590), true);
  assert.equal(canHoverCandidate(2, 3, 580, 590), true);
  assert.equal(canHoverCandidate(3, 3, 580, 590), false);
});

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
