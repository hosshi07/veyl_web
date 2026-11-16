import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { Arrow, GateMark } from "@/components/ui/icon";
import { getAnomorphs, getNews, getSiteContent } from "@/lib/content";

export function WorldSection() {
  const { world } = getSiteContent();
  return (
    <section id="world" className="section world-section">
      <SectionHeading
        number="01"
        label="WORLD"
        title="世界の境界、その先へ。"
      />
      <div className="world-grid">
        <div className="world-visual">
          <Image
            src="/images/gate-keyvisual.webp"
            alt="アノモルフがやってきた異界へつながる扉"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
          <span className="image-label mono">FIG. 01 / THE GATE</span>
          <span className="visual-corner" />
        </div>
        <div className="world-copy">
          <p className="eyebrow">BEYOND THE BOUNDARY</p>
          <h3>{world.heading}</h3>
          {world.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <div className="world-keywords mono">
            <span>RESEARCH</span>
            <i />
            <span>CONTAINMENT</span>
            <i />
            <span>EXPLORATION</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ArchiveSection() {
  return (
    <section id="anomorphs" className="archive-section section">
      <SectionHeading
        number="02"
        label="ANOMORPHS"
        title="理解不能。だから、観測する。"
      />
      <div className="section-intro">
        <p>
          敵か、あるいは共存者か。
          <br />
          扉の向こうから現れた存在の、断片的な記録。
        </p>
        <span className="archive-stamp mono">
          RESEARCH FILES <span>02</span>
        </span>
      </div>
      <div className="anomorph-grid">
        {getAnomorphs().map((anomorph) => (
          <article className="specimen" key={anomorph.id}>
            <div className="specimen-image">
              <div className="specimen-grid" />
              <span className="specimen-id mono">{anomorph.id}</span>
              <span className="specimen-rank mono">{anomorph.rank}</span>
              <Image
                src={anomorph.image}
                alt={`${anomorph.name}の開発中キャラクタービジュアル`}
                fill
                sizes="(max-width: 760px) 100vw, 45vw"
              />
              <span className="specimen-caption mono">
                VISUAL RECORD / IN DEVELOPMENT
              </span>
            </div>
            <div className="specimen-info">
              <p className="eyebrow">{anomorph.model}</p>
              <h3>
                {anomorph.name}
                <span className="mono">{anomorph.id}</span>
              </h3>
              <p className="specimen-quote">「{anomorph.quote}」</p>
              <p>{anomorph.description}</p>
              <div className="specimen-origin">
                <span>出身記録</span>
                <span>{anomorph.origin}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="section-footnote mono">
        ※ ビジュアル・設定は開発中のものです。研究記録は今後順次公開します。
      </p>
      <div className="home-archive-link">
        <Link href="/anomorphs" className="button">
          ANOMORPH ARCHIVE — 資料を閲覧 <Arrow diagonal />
        </Link>
      </div>
    </section>
  );
}

export function ArcSection() {
  const { arc } = getSiteContent();
  return (
    <section id="arc" className="arc-section section">
      <SectionHeading
        number="03"
        label="ARC / EQUIPMENT"
        title="人類に残された、対抗手段。"
      />
      <div className="arc-grid">
        <div className="arc-copy">
          <p className="eyebrow">ANOMORPH-DERIVED EQUIPMENT</p>
          <h3>{arc.heading}</h3>
          <p>{arc.description}</p>
          <p className="muted-note">
            <span className="status-dot" />
            {arc.status}
          </p>
        </div>
        <div className="arc-visual" aria-label="Arc研究資料の仮ビジュアル">
          <span className="mono arc-visual-label">EXTRACTION PROTOCOL</span>
          <div className="arc-orbit orbit-one" />
          <div className="arc-orbit orbit-two" />
          <div className="arc-orbit orbit-three" />
          <div className="arc-core">
            <GateMark />
          </div>
          <span className="arc-axis axis-x" />
          <span className="arc-axis axis-y" />
          <span className="arc-corner corner-tl">+</span>
          <span className="arc-corner corner-br">+</span>
          <span className="mono arc-visual-bottom">
            ARC / RESEARCH IN PROGRESS
          </span>
        </div>
      </div>
    </section>
  );
}

export function NewsSection() {
  return (
    <section id="news" className="news-section section">
      <SectionHeading
        number="04"
        label="NEWS & UPDATES"
        title="施設からのお知らせ。"
      />
      <div className="news-list">
        {getNews().map((news) => (
          <details className="news-item" key={news.slug}>
            <summary>
              <time className="mono" dateTime={news.date}>
                {news.date.replaceAll("-", ".")}
              </time>
              <span className="news-category mono">{news.category}</span>
              <span className="news-title">
                {news.title}
                {news.sample && <small>サンプル</small>}
              </span>
              <span className="news-expand" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="news-body">{news.body}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function DownloadSection() {
  const { download } = getSiteContent();
  return (
    <section id="download" className="download-section">
      <div className="download-background" />
      <div className="download-content">
        <span className="eyebrow">05 / NEXT EXPEDITION</span>
        <GateMark />
        <h2>次に扉を開くのは、あなた。</h2>
        <p>{download.message}</p>
        <span
          className="button button-pending"
          aria-label="ダウンロードは準備中です"
        >
          DOWNLOAD — 準備中 <Arrow diagonal />
        </span>
        <span className="mono download-note">
          DEVELOPMENT IN PROGRESS. STAY CONNECTED.
        </span>
      </div>
    </section>
  );
}
