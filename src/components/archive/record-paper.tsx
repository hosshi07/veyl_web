"use client";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useState, type CSSProperties, type MouseEvent } from "react";
import { GateMark } from "@/components/ui/icon";
import type { ArchiveRecord } from "@/lib/types";
import type { ArchivePhase } from "@/lib/archive-model";
import { paperPose } from "@/lib/archive-deck-motion";

type PaperProps = {
  record: ArchiveRecord;
  rank: number;
  slot: number;
  count: number;
  width: number;
  height: number;
  step: number;
  compact: boolean;
  preview: boolean;
  selected: boolean;
  dimmed: boolean;
  moving: boolean;
  phase: ArchivePhase;
  target: { x: number; y: number; scale: number };
  onPreview: (id: string | null) => void;
  onSelect: (id: string, touch: boolean) => void;
  onClose: () => void;
  onSettled: (phase: ArchivePhase) => void;
};

function isTouchSelection(
  event: MouseEvent<HTMLButtonElement>,
  compact: boolean,
) {
  const pointerType = (event.nativeEvent as globalThis.PointerEvent)
    .pointerType;
  return (
    event.detail !== 0 &&
    (compact || pointerType === "touch" || pointerType === "pen")
  );
}

function RecordImage({ record }: { record: ArchiveRecord }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="file-image">
      {record.image && !failed ? (
        <Image
          src={record.image}
          alt={`${record.name}の仮ビジュアル`}
          fill
          sizes="420px"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="file-placeholder">
          <GateMark />
          <span>VISUAL NOT AVAILABLE</span>
          <small>画像準備中</small>
        </div>
      )}
    </div>
  );
}

export function RecordPaper(props: PaperProps) {
  const {
    record,
    rank,
    slot,
    count,
    width,
    height,
    step,
    compact,
    preview,
    selected,
    dimmed,
    moving,
    phase,
    target,
    onPreview,
    onSelect,
    onClose,
    onSettled,
  } = props;
  const reduced = useReducedMotion();
  const { x, y, rotate, opacity } = paperPose(rank, count, step, compact);
  const interactive = opacity > 0.15 || selected;
  const resting = {
    x: x + (preview ? -16 : 0),
    y: y - (preview ? 28 : 0),
    rotate: preview ? -1 : rotate,
    scale: preview ? 1.025 : 1,
  };
  const opened = { x: target.x, y: target.y, rotate: 0, scale: target.scale };
  const opening = selected && phase === "opening";
  const closing = selected && phase === "closing";
  let animation: {
    x: number | (number | null)[];
    y: number | (number | null)[];
    rotate: number | (number | null)[];
    scale: number | (number | null)[];
    opacity: number;
  } = { ...resting, opacity: opacity * (dimmed ? 0.25 : 1) };
  if (selected) {
    animation = reduced
      ? { ...(closing ? { x, y, rotate, scale: 1 } : opened), opacity: 1 }
      : closing
        ? {
            x: [null, x + 46, x],
            y: [null, y - 90, y],
            rotate: [null, -5, rotate],
            scale: [null, 1.08, 1],
            opacity: 1,
          }
        : opening
          ? {
              x: [null, x + 46, target.x],
              y: [null, y - 90, target.y],
              rotate: [null, -5, 0],
              scale: [null, 1.08, target.scale],
              opacity: 1,
            }
          : { ...opened, opacity: 1 };
  }
  const duration = reduced || moving ? 0 : opening || closing ? 0.82 : 0.22;
  const style = {
    width,
    height,
    marginLeft: -width / 2,
    marginTop: -height / 2,
    zIndex: selected ? 110 : preview ? 60 : 40 - Math.round(Math.max(0, rank)),
    "--file-width": `${width}px`,
    "--tab-width": compact ? "40px" : "48px",
  } as CSSProperties;
  return (
    <div
      className="file-slot"
      style={style}
      inert={dimmed || !interactive || undefined}
      aria-hidden={!interactive || undefined}
    >
      <motion.article
        className={`record-paper${preview ? " is-preview" : ""}${selected ? " is-selected" : ""}${closing ? " is-returning" : ""}`}
        data-record={record.id}
        data-slot={slot}
        data-phase={selected ? phase : "idle"}
        role={selected ? "dialog" : undefined}
        aria-modal={selected ? true : undefined}
        aria-labelledby={selected ? `file-name-${record.id}` : undefined}
        initial={false}
        animate={animation}
        transition={{
          duration,
          ease: [0.22, 0.68, 0.16, 1],
          times: opening || closing ? [0, 0.4, 1] : undefined,
        }}
        onAnimationComplete={() => {
          if (selected) onSettled(phase);
        }}
      >
        <div className="file-shape" />
        <div className="file-cover" aria-hidden="true">
          <div className="file-cover-top">
            <GateMark />
            <span>
              VEYL
              <br />
              RESEARCH ARCHIVE
            </span>
          </div>
          <div className="file-cover-rule" />
          <span className="file-cover-class">
            ANOMORPH
            <br />
            RECORD
          </span>
          <div className="file-redactions">
            <i />
            <i />
            <i />
          </div>
          <span className="file-cover-id">{record.id}</span>
          <span className="file-cover-bottom">
            SELECT TAB TO RETRIEVE
            <br />
            資料タブから閲覧
          </span>
        </div>
        <div className="file-content" aria-hidden={!selected && !preview}>
          <div className="file-meta">
            <span>ANOMORPH RECORD</span>
            <strong>{record.id}</strong>
          </div>
          <h2 id={`file-name-${record.id}`}>{record.name}</h2>
          <RecordImage record={record} />
          <p className="file-phrase">「{record.phrase}」</p>
          <p className="file-teaser">{record.teaser}</p>
          <div className="file-content-footer">
            {record.sample
              ? "仮データ / 正式な設定ではありません"
              : "VEYL / PUBLIC ARCHIVE"}
          </div>
        </div>
        <button
          type="button"
          className="file-tab"
          data-file-trigger={record.id}
          aria-label={`資料 ${record.id} を${compact && !preview ? "プレビュー" : "開く"}${record.sample ? "（仮データ）" : ""}`}
          aria-haspopup="dialog"
          aria-expanded={selected}
          disabled={selected || dimmed || !interactive}
          onFocus={(event) => {
            if (event.currentTarget.matches(":focus-visible"))
              onPreview(record.id);
          }}
          onClick={(event) =>
            onSelect(record.id, isTouchSelection(event, compact))
          }
        >
          <span>{record.id}</span>
        </button>
        {!selected && (
          <button
            type="button"
            className="file-face-trigger"
            tabIndex={-1}
            aria-hidden="true"
            disabled={dimmed || !interactive}
            onClick={(event) =>
              onSelect(record.id, isTouchSelection(event, compact))
            }
          />
        )}
        {selected && (
          <button
            type="button"
            className="archive-close"
            onClick={onClose}
            aria-label="資料を閉じて束に戻す"
          >
            <span>資料を戻す</span>
            <span aria-hidden="true">×</span>
          </button>
        )}
      </motion.article>
    </div>
  );
}
