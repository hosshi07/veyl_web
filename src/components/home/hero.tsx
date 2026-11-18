import Image from "next/image";
import { Arrow } from "@/components/ui/icon";

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero-art">
        <Image
          src="/images/gate-keyvisual.webp"
          alt="霧に包まれた巨大な扉に、一人の従業員が向き合う。"
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 760px) 175vw, 100vw"
        />
      </div>
      <div className="hero-shade" />
      <div className="hero-topline mono">
        <span>
          <i className="status-dot" /> CONNECTION ESTABLISHED
        </span>
        <span>VEYL RESEARCH ARCHIVE / 001</span>
      </div>
      <div className="hero-content">
        <p className="eyebrow">
          <span className="tiny-cross">+</span> ORIGINAL 2D GAME PROJECT
        </p>
        <h1 id="hero-title">
          VEYL
          <span className="hero-title-line" />
        </h1>
        <p className="hero-tagline">
          扉の向こうを
          <br />
          知ってはいけない
        </p>
        <p className="hero-description">
          未知を解析し、その力を手に入れろ
          <br />
          不可解な存在とともに扉の謎に迫る
        </p>
        <a href="#world" className="button button-primary">
          この世界に触れる <Arrow />
        </a>
        <span className="hero-development mono">
          <i /> IN DEVELOPMENT
        </span>
      </div>
      <div className="hero-coordinate mono" aria-hidden="true">
        <span>GATE_01</span>
        <span>STATUS : UNIDENTIFIED</span>
        <span className="coordinate-cross">⌖</span>
      </div>
      <div className="hero-bottom">
        <a href="#world" className="scroll-prompt mono">
          <span className="scroll-line" />
          SCROLL TO EXPLORE<span>↓</span>
        </a>
        <p>その扉は、まだ開かれていない</p>
        <span className="mono">01 — 06</span>
      </div>
    </section>
  );
}
