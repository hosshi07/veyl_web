export type Anomorph = {
  id: string;
  slug: string;
  name: string;
  model: string;
  rank: string;
  origin: string;
  quote: string;
  description: string;
  image: string;
};

export type NewsItem = {
  slug: string;
  date: string;
  category: string;
  title: string;
  body: string;
  sample: boolean;
};

// Public archive contract: deliberately excludes ranks, abilities and lore.
export type ArchiveRecord = {
  id: string;
  name: string;
  image: string | null;
  phrase: string;
  teaser: string;
  sample: boolean;
};
