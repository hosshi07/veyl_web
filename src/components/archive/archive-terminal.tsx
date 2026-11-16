"use client";
import { AnimatePresence, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { visibleIndices, swipeDirection } from "@/lib/archive-model";
import type { ArchiveRecord } from "@/lib/types";
import { RecordPaper } from "./record-paper";
import { useArchive } from "./use-archive";

export function ArchiveTerminal({ records }: { records: ArchiveRecord[] }) {
  const ids = useMemo(() => records.map((record) => record.id), [records]);
  const { state, current, dispatch, rotate, jump } = useArchive(ids);
  const stage = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const gesture = useRef<{
    pointerId: number;
    x: number;
    y: number;
    dragging: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const suppressHover = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [metrics, setMetrics] = useState({
    width: 320,
    height: 496,
    step: 54,
    compact: false,
  });
  const [target, setTarget] = useState({ x: 0, y: 0, scale: 1 });
  const reduced = useReducedMotion();
  const selected = state.selected !== null;
  const indices = visibleIndices(
    state.index,
    records.length,
    metrics.compact ? 3 : 5,
  );

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

  function select(id: string, touch: boolean) {
    if (current.current.phase !== "idle") return;
    if (touch && current.current.preview !== id) {
      dispatch({ type: "preview", id });
      return;
    }
    returnFocus.current =
      stage.current?.querySelector<HTMLElement>(
        `[data-file-trigger="${id}"]`,
      ) ?? stage.current;
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
      rotate(event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      jump(event.key === "Home" ? 0 : records.length - 1);
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      event.target === stage.current &&
      records.length
    ) {
      event.preventDefault();
      select(records[state.index].id, false);
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
    suppressClick.current = false;
    suppressHover.current = false;
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
    };
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start) {
      suppressHover.current = false;
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
      setDragging(true);
    }
    setDragOffset(reduced ? 0 : Math.max(-80, Math.min(80, dx * 0.4)));
  }
  function cancelGesture() {
    const start = gesture.current;
    gesture.current = null;
    setDragging(false);
    setDragOffset(0);
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
    const dy = event.clientY - start.y;
    const direction = swipeDirection(dx, dy);
    if (direction) {
      suppressClick.current = true;
      rotate(direction);
    }
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
          <span aria-hidden="true">↔</span> 左右にドラッグして切り替え
        </span>
      </div>
      <div
        ref={stage}
        className={`archive-stage${dragging ? " is-dragging" : ""}`}
        tabIndex={selected ? -1 : 0}
        role="region"
        aria-label="アノモルフ資料束"
        aria-describedby="archive-help"
        onKeyDown={onKey}
        onPointerDownCapture={pointerDown}
        onPointerMoveCapture={pointerMove}
        onPointerUpCapture={pointerUp}
        onPointerCancel={cancelGesture}
        onLostPointerCapture={(event) => {
          if (gesture.current?.pointerId === event.pointerId) cancelGesture();
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
          if (!selected && !metrics.compact && !gesture.current?.dragging)
            dispatch({ type: "preview", id: null });
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
        <AnimatePresence initial={false}>
          {indices.map((index, rank) => (
            <RecordPaper
              key={records[index].id}
              record={records[index]}
              rank={rank}
              count={indices.length}
              width={metrics.width}
              height={metrics.height}
              step={metrics.step}
              compact={metrics.compact}
              preview={state.preview === records[index].id}
              selected={state.selected === records[index].id}
              dimmed={selected && state.selected !== records[index].id}
              dragging={dragging}
              dragOffset={dragOffset}
              phase={state.phase}
              target={target}
              onPreview={(id) => {
                if (
                  !gesture.current?.dragging &&
                  (!id || !suppressHover.current)
                )
                  dispatch({ type: "preview", id });
              }}
              onSelect={select}
              onClose={() => dispatch({ type: "close" })}
              onSettled={(phase) => dispatch({ type: "settled", phase })}
            />
          ))}
        </AnimatePresence>
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
            onClick={() => rotate(-1)}
          >
            ←
          </button>
          <span>{records[state.index].id}</span>
          <button
            type="button"
            aria-label="次の資料へ"
            onClick={() => rotate(1)}
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
          PC：左右ドラッグで切り替え。ホバーでプレビュー、クリックで開く。
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
