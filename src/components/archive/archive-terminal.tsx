"use client";
import { useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  DECK_PHYSICS,
  deckSlots,
  releaseVelocity,
  shouldHandOffLeft,
  canHoverCandidate,
  type PointerSample,
} from "@/lib/archive-deck-motion";
import type { ArchiveRecord } from "@/lib/types";
import { RecordPaper } from "./record-paper";
import { useArchive } from "./use-archive";
import { useDeckMotion } from "./use-deck-motion";

export function ArchiveTerminal({ records }: { records: ArchiveRecord[] }) {
  const ids = useMemo(() => records.map((record) => record.id), [records]);
  const { state, current, dispatch } = useArchive(ids);
  const stage = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const gesture = useRef<{
    pointerId: number;
    x: number;
    y: number;
    dragging: boolean;
    position: number;
    samples: PointerSample[];
  } | null>(null);
  const suppressClick = useRef(false);
  const suppressHover = useRef(false);
  const hoverSlot = useRef<number | null>(null);
  const lastPointer = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [metrics, setMetrics] = useState({
    width: 320,
    height: 496,
    step: 54,
    compact: false,
  });
  const [target, setTarget] = useState({ x: 0, y: 0, scale: 1 });
  const reduced = useReducedMotion();
  const updateIndex = useCallback(
    (index: number) => dispatch({ type: "jump", index, ids }),
    [dispatch, ids],
  );
  const deck = useDeckMotion(updateIndex, !!reduced);
  const selected = state.selected !== null;
  const count = Math.min(records.length, metrics.compact ? 3 : 5);
  const slots = deckSlots(deck.position, records.length, count);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const compact = entry.contentRect.width < 640;
      const width = compact
        ? Math.max(172, Math.min(230, entry.contentRect.width * 0.54))
        : Math.max(260, Math.min(338, entry.contentRect.width * 0.31));
      // Freeze stack geometry while a record is out, preserving its exact slot.
      if (current.current.phase === "idle")
        setMetrics({
          width,
          height: width * (compact ? 1.7 : 1.55),
          compact,
          step: compact ? 40 : 54,
        });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [current]);

  // A viewport resize can happen while the pile is frozen (e.g. orientation).
  // Re-measure once the file has returned, without changing the record order.
  useEffect(() => {
    if (selected || !stage.current) return;
    const stageWidth = stage.current.clientWidth;
    const compact = stageWidth < 640;
    const width = compact
      ? Math.max(172, Math.min(230, stageWidth * 0.54))
      : Math.max(260, Math.min(338, stageWidth * 0.31));
    setMetrics({
      width,
      height: width * (compact ? 1.7 : 1.55),
      compact,
      step: compact ? 40 : 54,
    });
  }, [selected]);

  const updateTarget = useCallback(() => {
    const rect = stage.current?.getBoundingClientRect();
    if (!rect) return;
    const tabWidth = metrics.compact ? 40 : 48;
    const scale = Math.max(
      0.5,
      Math.min(
        420 / metrics.width,
        (window.innerWidth - 40) / (metrics.width + tabWidth),
        (window.innerHeight - 112) / metrics.height,
      ),
    );
    setTarget({
      x:
        window.innerWidth / 2 -
        (rect.left + rect.width / 2) -
        (tabWidth * scale) / 2,
      y: window.innerHeight / 2 - (rect.top + rect.height / 2),
      scale,
    });
  }, [metrics]);

  useEffect(() => {
    if (!selected) return;
    const oldOverflow = document.body.style.overflow;
    const oldPadding = document.body.style.paddingRight;
    const scrollY = window.scrollY;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbar + parseFloat(getComputedStyle(document.body).paddingRight || "0")}px`;
    document.body.style.overflow = "hidden";
    // Cancel any in-flight anchor/momentum scroll before moving the same paper.
    window.scrollTo({ top: scrollY, behavior: "instant" });
    updateTarget();
    const background = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".site-header, .site-footer, .skip-link, [data-archive-background]",
      ),
    );
    const previousInert = background.map((node) => node.inert);
    background.forEach((node) => {
      node.inert = true;
    });
    const focusFrame = requestAnimationFrame(() => {
      stage.current
        ?.querySelector<HTMLButtonElement>(".archive-close")
        ?.focus({ preventScroll: true });
    });
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dispatch({ type: "close" });
      }
      if (event.key === "Tab") {
        event.preventDefault();
        stage.current
          ?.querySelector<HTMLButtonElement>(".archive-close")
          ?.focus({ preventScroll: true });
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, { passive: true });
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget);
      document.body.style.overflow = oldOverflow;
      document.body.style.paddingRight = oldPadding;
      background.forEach((node, index) => {
        node.inert = previousInert[index];
      });
      // preventScroll keeps both the original page position and the pile order.
      if (returnFocus.current?.isConnected)
        returnFocus.current.focus({ preventScroll: true });
      if (Math.abs(window.scrollY - scrollY) > 1)
        window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [selected, dispatch, updateTarget]);

  function select(id: string, touch: boolean, slot: number) {
    if (current.current.phase !== "idle") return;
    deck.stop();
    if (touch && current.current.preview !== id) {
      dispatch({ type: "preview", id });
      return;
    }
    returnFocus.current =
      stage.current?.querySelector<HTMLElement>(
        `[data-slot="${slot}"] [data-file-trigger="${id}"]`,
      ) ?? stage.current;
    setSelectedSlot(slot);
    updateTarget();
    dispatch({ type: "open", id });
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    suppressHover.current = false;
    if (current.current.phase !== "idle") return;
    if (
      ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)
    ) {
      event.preventDefault();
      stage.current?.focus({ preventScroll: true });
      hoverSlot.current = null;
      deck.step(
        event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1,
      );
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const index = event.key === "Home" ? 0 : records.length - 1;
      deck.goTo(
        Math.round((deck.positionRef.current - index) / records.length) *
          records.length +
          index,
      );
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      event.target === stage.current &&
      records.length
    ) {
      event.preventDefault();
      deck.stop();
      const slot = Math.round(deck.positionRef.current);
      select(
        records[((slot % records.length) + records.length) % records.length].id,
        false,
        slot,
      );
    } else if (event.key === "Escape") {
      dispatch({ type: "preview", id: null });
    }
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      current.current.phase !== "idle"
    )
      return;
    const wasMoving = deck.stop();
    suppressClick.current = wasMoving;
    suppressHover.current = wasMoving;
    if (wasMoving) {
      hoverSlot.current = null;
      dispatch({ type: "preview", id: null });
    }
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      position: deck.positionRef.current,
      samples: [{ x: event.clientX, time: event.timeStamp }],
    };
  }

  function hoverAt(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      metrics.compact ||
      selected ||
      deck.moving
    )
      return;
    const previousX = lastPointer.current ?? event.clientX;
    lastPointer.current = event.clientX;
    const active = hoverSlot.current;
    if (active !== null) {
      const paper = stage.current?.querySelector<HTMLElement>(
        `[data-slot="${active}"]`,
      );
      const rect = paper?.getBoundingClientRect();
      const previous = slots.find(
        (entry) => entry.slot === active - 1 && entry.rank > -0.85,
      );
      if (
        rect &&
        previous &&
        shouldHandOffLeft(
          event.clientX,
          previousX,
          rect.left,
          (rect.width * metrics.width) /
            (metrics.width + (metrics.compact ? 40 : 48)),
        )
      ) {
        hoverSlot.current = previous.slot;
        dispatch({ type: "preview", id: records[previous.index].id });
        return;
      }
    }
    const paper = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-slot]",
    );
    const candidate = slots.find(
      (entry) =>
        entry.slot === Number(paper?.dataset.slot) &&
        entry.rank > -0.85 &&
        entry.rank < count - 0.15,
    );
    if (
      candidate &&
      !suppressHover.current &&
      canHoverCandidate(candidate.slot, active, event.clientX, previousX)
    ) {
      hoverSlot.current = candidate.slot;
      dispatch({ type: "preview", id: records[candidate.index].id });
    } else if (!paper && active !== null) {
      hoverSlot.current = null;
      dispatch({ type: "preview", id: null });
    }
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start) {
      suppressHover.current = false;
      hoverAt(event);
      return;
    }
    if (start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.dragging) {
      // Leave vertical touch gestures to the browser's native page scroll.
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.3) {
        suppressClick.current = true;
        gesture.current = null;
        return;
      }
      if (Math.abs(dx) <= 8 || Math.abs(dx) <= Math.abs(dy) * 1.3) return;
      start.dragging = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      dispatch({ type: "preview", id: null });
      hoverSlot.current = null;
      setDragging(true);
    }
    const now = event.timeStamp;
    start.samples = [
      ...start.samples.filter(
        (sample) => now - sample.time <= DECK_PHYSICS.velocityWindowMs,
      ),
      { x: event.clientX, time: now },
    ];
    deck.dragTo(
      start.position - dx / (metrics.step * DECK_PHYSICS.dragDistancePerSlot),
    );
  }
  function cancelGesture() {
    const start = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (start && stage.current?.hasPointerCapture(start.pointerId))
      stage.current.releasePointerCapture(start.pointerId);
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    cancelGesture();
    if (!start.dragging || selected) return;
    suppressHover.current = true;
    const dx = event.clientX - start.x;
    const now = event.timeStamp;
    const pixelsPerSlot = metrics.step * DECK_PHYSICS.dragDistancePerSlot;
    deck.dragTo(start.position - dx / pixelsPerSlot);
    deck.release(
      releaseVelocity(
        [...start.samples, { x: event.clientX, time: now }],
        now,
        pixelsPerSlot,
      ),
    );
  }

  if (!records.length)
    return (
      <div className="archive-empty">公開できる資料はまだありません。</div>
    );
  return (
    <>
      <div className="archive-toolbar" data-archive-background>
        <div>
          <i className="status-dot" />
          <span>RECORD INDEX</span>
          <strong>
            {String(state.index + 1).padStart(2, "0")}
            <small> / {String(records.length).padStart(2, "0")}</small>
          </strong>
        </div>
        <span className="archive-demo-badge">PROTOTYPE / 全件仮データ</span>
        <span className="archive-drag-hint">
          <span aria-hidden="true">↔</span> ドラッグで回す・押さえて止める
        </span>
      </div>
      <div
        ref={stage}
        className={`archive-stage${dragging ? " is-dragging" : ""}${selected ? " has-open-record" : ""}`}
        data-deck-position={deck.position.toFixed(4)}
        data-deck-moving={deck.moving}
        tabIndex={selected ? -1 : 0}
        role="region"
        aria-label="アノモルフ資料束"
        aria-describedby="archive-help"
        onKeyDown={onKey}
        onBlur={(event) => {
          if (
            !selected &&
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            hoverSlot.current = null;
            dispatch({ type: "preview", id: null });
          }
        }}
        onPointerDownCapture={pointerDown}
        onPointerMoveCapture={pointerMove}
        onPointerUpCapture={pointerUp}
        onPointerCancel={() => {
          cancelGesture();
          deck.stop();
        }}
        onLostPointerCapture={(event) => {
          if (gesture.current?.pointerId === event.pointerId) {
            cancelGesture();
            deck.stop();
          }
        }}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
        onPointerLeave={(event) => {
          // Touch sends pointerleave after pointerup: retain its first-tap preview.
          if (event.pointerType !== "mouse") return;
          if (!selected && !metrics.compact && !gesture.current?.dragging) {
            hoverSlot.current = null;
            lastPointer.current = null;
            dispatch({ type: "preview", id: null });
          }
        }}
      >
        <div className="archive-stage-grid" aria-hidden="true" />
        <div className="stage-coordinate coordinate-left" aria-hidden="true">
          VEYL / RECORD STORAGE
          <br />
          INDEX : ANOMORPH
          <br />
          <span>+</span>
        </div>
        <div className="stage-coordinate coordinate-right" aria-hidden="true">
          RESEARCH TERMINAL
          <br />
          LOCAL SESSION
          <br />
          <span>+</span>
        </div>
        <div className="archive-stage-caption" data-archive-background>
          <span>ANOMORPH FILES</span>
          <span>資料を選び、記録をひらく。</span>
        </div>
        {slots.map(({ index, rank, slot }) => (
          <RecordPaper
            key={slot}
            slot={slot}
            record={records[index]}
            rank={rank}
            count={count}
            width={metrics.width}
            height={metrics.height}
            step={metrics.step}
            compact={metrics.compact}
            preview={
              !deck.moving &&
              state.preview === records[index].id &&
              hoverSlot.current === slot
            }
            selected={selected && selectedSlot === slot}
            dimmed={selected && selectedSlot !== slot}
            moving={deck.moving}
            phase={state.phase}
            target={target}
            onPreview={(id) => {
              if (
                !gesture.current?.dragging &&
                !deck.moving &&
                (!id || !suppressHover.current)
              ) {
                hoverSlot.current = id ? slot : null;
                dispatch({ type: "preview", id });
              }
            }}
            onSelect={(id, touch) => {
              if (touch) hoverSlot.current = slot;
              select(id, touch, slot);
            }}
            onClose={() => dispatch({ type: "close" })}
            onSettled={(phase) => dispatch({ type: "settled", phase })}
          />
        ))}
        <div className="archive-stage-bottom" data-archive-background>
          <span>
            {reduced ? "REDUCED MOTION" : "PHYSICAL RECORD INTERFACE"}
          </span>
          <span>
            {state.preview
              ? `${state.preview} / PREVIEW`
              : "AWAITING SELECTION"}
          </span>
        </div>
      </div>
      {selected && (
        <div
          className="archive-backdrop"
          onClick={() => dispatch({ type: "close" })}
          aria-hidden="true"
        />
      )}
      <div className="archive-controls" data-archive-background>
        <div className="archive-paging">
          <button
            type="button"
            aria-label="前の資料へ"
            onClick={() => deck.step(-1)}
          >
            ←
          </button>
          <span>{records[state.index].id}</span>
          <button
            type="button"
            aria-label="次の資料へ"
            onClick={() => deck.step(1)}
          >
            →
          </button>
        </div>
        <button
          type="button"
          className="clear-preview"
          disabled={!state.preview}
          onClick={() => dispatch({ type: "preview", id: null })}
        >
          プレビュー解除 <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="archive-lower" data-archive-background>
        <p id="archive-help" className="archive-help">
          <span>OPERATION GUIDE</span>
          左右ドラッグ／スワイプで連続移動。離すと減速し、押さえると止まります。
          <br />
          スマートフォン：1回タップでプレビュー、もう1回で開く。左右スワイプで切り替え。
          <br />
          矢印キー・前後ボタンは1操作ごとに切り替え。ホイールはページの縦スクロール。Escで閉じる／プレビュー解除。
        </p>
        <div
          className="archive-system-log"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="アーカイブ操作ログ"
        >
          <span className="log-heading">
            <i /> SESSION LOG
          </span>
          {state.logs.map((entry) => (
            <p key={entry.sequence}>
              <span>{String(entry.sequence).padStart(3, "0")}</span>
              {entry.message}
            </p>
          ))}
        </div>
      </div>
      <noscript>
        <p className="archive-empty">
          資料束の操作にはJavaScriptが必要です。以下のテキスト版でも閲覧できます。
        </p>
      </noscript>
      <details className="archive-text-version" data-archive-background>
        <summary>テキスト形式で資料を閲覧する</summary>
        <div>
          {records.map((record) => (
            <article key={record.id}>
              <small>
                {record.id}
                {record.sample ? " / 仮データ" : ""}
              </small>
              <h2>{record.name}</h2>
              <p>「{record.phrase}」</p>
              <p>{record.teaser}</p>
            </article>
          ))}
        </div>
      </details>
    </>
  );
}
