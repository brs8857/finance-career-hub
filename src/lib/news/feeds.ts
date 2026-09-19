// Public business RSS feeds. We show HEADLINES AND LINKS ONLY - never the
// article text or descriptions - and every headline links to the publisher.
//
// Checked 2026-09-19. Reuters' public RSS feeds were discontinued (no response),
// so it isn't listed. To add a feed: append an entry; the id must be unique.

export interface FeedDefinition {
  id: string;
  name: string;
  url: string;
  homepage: string;
  note?: string;
}

export const FEEDS: FeedDefinition[] = [
  {
    id: "bbc-business",
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    homepage: "https://www.bbc.co.uk/news/business",
  },
  {
    id: "guardian-business",
    name: "Guardian Business",
    url: "https://www.theguardian.com/uk/business/rss",
    homepage: "https://www.theguardian.com/uk/business",
  },
  {
    id: "guardian-economics",
    name: "Guardian Economics",
    url: "https://www.theguardian.com/business/economics/rss",
    homepage: "https://www.theguardian.com/business/economics",
  },
  {
    id: "sky-business",
    name: "Sky News Business",
    url: "https://feeds.skynews.com/feeds/rss/business.xml",
    homepage: "https://news.sky.com/business",
  },
  {
    id: "cityam",
    name: "City AM",
    url: "https://www.cityam.com/feed/",
    homepage: "https://www.cityam.com/",
  },
  {
    id: "ft",
    name: "Financial Times",
    url: "https://www.ft.com/rss/home/uk",
    homepage: "https://www.ft.com/",
    note: "Most FT articles are paywalled; the headlines alone are still useful.",
  },
  {
    id: "boe",
    name: "Bank of England",
    url: "https://www.bankofengland.co.uk/rss/news",
    homepage: "https://www.bankofengland.co.uk/news",
    note: "Official announcements, speeches and publications.",
  },
];

export function findFeed(id: string): FeedDefinition | undefined {
  return FEEDS.find((f) => f.id === id);
}
