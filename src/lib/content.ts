import "server-only";
import anomorphData from "@/content/anomorphs.json";
import newsData from "@/content/news.json";
import siteData from "@/content/site.json";
import archiveData from "@/content/archive-records.json";
import type { Anomorph, ArchiveRecord, NewsItem } from "./types";

// Keep the public data contract stable when replacing JSON with a CMS adapter.
export function getAnomorphs(): Anomorph[] {
  return anomorphData;
}
export function getNews(): NewsItem[] {
  return [...newsData].sort((a, b) => b.date.localeCompare(a.date));
}
export function getSiteContent() {
  return siteData;
}

export function getArchiveRecords(): ArchiveRecord[] {
  const ids = new Set<string>();
  return archiveData.map(({ id, name, image, phrase, teaser, sample }) => {
    if (!id || ids.has(id))
      throw new Error(`Duplicate or empty archive ID: ${id}`);
    ids.add(id);
    // Explicit projection prevents future CMS/private fields reaching the client.
    return { id, name, image, phrase, teaser, sample };
  });
}
