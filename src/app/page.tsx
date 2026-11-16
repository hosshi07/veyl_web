import { Hero } from "@/components/home/hero";
import {
  WorldSection,
  ArchiveSection,
  ArcSection,
  NewsSection,
  DownloadSection,
} from "@/components/home/home-sections";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <div className="transmission-bar mono">
        <span>
          <i className="status-dot" /> VEYL ARCHIVE
        </span>
        <span>THE UNKNOWN IS NOT ALWAYS YOUR ENEMY.</span>
        <span>
          RESTRICTED ACCESS <span aria-hidden="true">↗</span>
        </span>
      </div>
      <WorldSection />
      <ArchiveSection />
      <ArcSection />
      <NewsSection />
      <DownloadSection />
    </main>
  );
}
