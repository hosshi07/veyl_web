// Motion and geometry are independent of the paper's colors and visual skin.
export const DECK_PHYSICS = {
  friction: 3.4,
  maxVelocity: 14,
  minVelocity: 0.045,
  dragDistancePerSlot: 1.5,
  velocityWindowMs: 100,
} as const;

export type PointerSample = { x: number; time: number };

export function releaseVelocity(
  samples: readonly PointerSample[],
  now: number,
  pixelsPerSlot: number,
): number {
  const recent = samples.filter(
    (sample) => now - sample.time <= DECK_PHYSICS.velocityWindowMs,
  );
  if (recent.length < 2 || pixelsPerSlot <= 0) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const seconds = (last.time - first.time) / 1000;
  if (seconds < 0.008) return 0;
  return Math.max(
    -DECK_PHYSICS.maxVelocity,
    Math.min(
      DECK_PHYSICS.maxVelocity,
      -(last.x - first.x) / pixelsPerSlot / seconds,
    ),
  );
}

export function advanceCoast(
  position: number,
  velocity: number,
  seconds: number,
) {
  const decay = Math.exp(-DECK_PHYSICS.friction * Math.max(0, seconds));
  return {
    position: position + (velocity * (1 - decay)) / DECK_PHYSICS.friction,
    velocity: velocity * decay,
  };
}

export function deckSlots(
  position: number,
  length: number,
  visibleCount: number,
) {
  if (length <= 0) return [];
  const count = Math.min(length, visibleCount);
  const first = Math.floor(position);
  return Array.from({ length: count + 1 }, (_, offset) => {
    const slot = first + offset;
    return {
      slot,
      index: ((slot % length) + length) % length,
      rank: slot - position,
    };
  });
}

export function paperPose(
  rank: number,
  count: number,
  step: number,
  compact: boolean,
) {
  const depth = Math.max(0, Math.min(count - 1, rank));
  return {
    x: (rank - (count - 1) / 2) * step - (compact ? 12 : 25),
    // Clamp depth at the edges: fade in/out along X, without dropping down.
    y: depth * -6,
    rotate: -3.5 + depth * 1.15,
    opacity: Math.max(0, Math.min(1, rank + 1, count - rank)),
  };
}

export function shouldHandOffLeft(
  pointerX: number,
  previousX: number,
  paperLeft: number,
  paperWidth: number,
) {
  return pointerX < previousX - 0.2 && pointerX < paperLeft + paperWidth / 2;
}

export function canHoverCandidate(
  candidate: number,
  active: number | null,
  pointerX: number,
  previousX: number,
) {
  return (
    active === null ||
    (candidate > active && pointerX > previousX + 0.2) ||
    (candidate < active && pointerX < previousX - 0.2)
  );
}
