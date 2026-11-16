import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveTerminal } from "@/components/archive/archive-terminal";
import { getArchiveRecords } from "@/lib/content";
import { GateMark } from "@/components/ui/icon";
import "./archive.css";

export const metadata: Metadata = {
  title: "Anomorph Archive",
  description:
    "VEYLの内部端末から、アノモルフの紙資料を閲覧する。操作検証用プロトタイプ。",
};

export default function AnomorphArchivePage() {
  return (
    <main id="main" className="archive-terminal">
      <header id="top" className="archive-heading" data-archive-background>
        <div className="archive-breadcrumb">
          <Link href="/">VEYL</Link>
          <span>/</span>
          <span>INTERNAL TERMINAL</span>
          <span>/</span>
          <strong>ARCHIVE</strong>
        </div>
        <div className="archive-title-row">
          <div>
            <p className="eyebrow">PERSONNEL INTERFACE / RESEARCH DIVISION</p>
            <h1>
              ANOMORPH<span>ARCHIVE</span>
            </h1>
            <p className="archive-subtitle">未知の存在、その記録に触れる。</p>
          </div>
          <div className="archive-terminal-mark" aria-hidden="true">
            <GateMark />
            <span>
              VEYL
              <br />
              ARCHIVE TERMINAL
            </span>
          </div>
        </div>
      </header>
      <ArchiveTerminal records={getArchiveRecords()} />
    </main>
  );
}
