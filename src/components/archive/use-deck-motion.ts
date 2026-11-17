"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { advanceCoast, DECK_PHYSICS } from "@/lib/archive-deck-motion";

type Mode = "idle" | "target" | "coast" | "drag";

export function useDeckMotion(
  onIndexChange: (index: number) => void,
  reduced: boolean,
) {
  const [position, setPosition] = useState(0);
  const [moving, setMoving] = useState(false);
  const positionRef = useRef(0);
  const mode = useRef<Mode>("idle");
  const target = useRef(0);
  const velocity = useRef(0);
  const frame = useRef<number | null>(null);
  const lastTime = useRef(0);
  const lastPublished = useRef(0);
  const callback = useRef(onIndexChange);
  callback.current = onIndexChange;
  const reduce = useRef(reduced);
  reduce.current = reduced;

  const publish = useCallback((next: number) => {
    const index = Math.round(next);
    if (index !== lastPublished.current) {
      lastPublished.current = index;
      callback.current(index);
    }
  }, []);
  const write = useCallback(
    (next: number, report: boolean) => {
      positionRef.current = next;
      setPosition(next);
      if (report) publish(next);
    },
    [publish],
  );

  const stop = useCallback(
    (report = true) => {
      const wasMoving = mode.current !== "idle";
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      mode.current = "idle";
      velocity.current = 0;
      setMoving(false);
      if (report) publish(positionRef.current);
      return wasMoving;
    },
    [publish],
  );

  const tick = useCallback(
    function tick(time: number) {
      const dt = Math.min(0.05, Math.max(0, (time - lastTime.current) / 1000));
      lastTime.current = time;
      if (mode.current === "coast") {
        const next = advanceCoast(positionRef.current, velocity.current, dt);
        velocity.current = next.velocity;
        write(next.position, true);
        if (Math.abs(next.velocity) < DECK_PHYSICS.minVelocity) {
          target.current = Math.round(next.position);
          mode.current = "target";
        }
      } else if (mode.current === "target") {
        const distance = target.current - positionRef.current;
        if (Math.abs(distance) < 0.002 || reduce.current) {
          write(target.current, true);
          mode.current = "idle";
          setMoving(false);
        } else
          write(
            positionRef.current + distance * (1 - Math.exp(-18 * dt)),
            false,
          );
      }
      frame.current =
        mode.current === "idle" ? null : requestAnimationFrame(tick);
    },
    [write],
  );

  const start = useCallback(() => {
    setMoving(true);
    lastTime.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }, [tick]);

  const goTo = useCallback(
    (index: number) => {
      stop(false);
      target.current = index;
      publish(index);
      if (reduce.current) write(index, false);
      else {
        mode.current = "target";
        start();
      }
    },
    [stop, publish, write, start],
  );

  const step = useCallback(
    (direction: number) => {
      const next =
        (mode.current === "target"
          ? target.current
          : Math.round(positionRef.current)) + direction;
      goTo(next);
    },
    [goTo],
  );

  const dragTo = useCallback(
    (next: number) => {
      mode.current = "drag";
      setMoving(true);
      write(next, true);
    },
    [write],
  );

  const release = useCallback(
    (speed: number) => {
      if (reduce.current || Math.abs(speed) < 0.12) {
        goTo(Math.round(positionRef.current));
        return;
      }
      velocity.current = Math.max(
        -DECK_PHYSICS.maxVelocity,
        Math.min(DECK_PHYSICS.maxVelocity, speed),
      );
      mode.current = "coast";
      start();
    },
    [goTo, start],
  );

  useEffect(() => {
    const pause = () => {
      stop();
    };
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("blur", pause);
    return () => {
      document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("blur", pause);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [stop]);
  useEffect(() => {
    if (reduced) stop();
  }, [reduced, stop]);

  return { position, positionRef, moving, stop, goTo, step, dragTo, release };
}
