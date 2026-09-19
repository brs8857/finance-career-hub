import { describe, expect, it } from "vitest";
import { canonicalUrl, cleanTitle, mergeHeadlines, parseFeed } from "./rss";

const feed = { id: "bbc-business", name: "BBC Business" };

describe("parseFeed", () => {
  it("extracts title, link and date - and never the description", () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <title><![CDATA['We simply don't know' - JP Morgan on oil prices]]></title>
        <description>Article text we must not store.</description>
        <link>https://www.bbc.co.uk/news/articles/abc?at_medium=RSS&amp;at_campaign=rss</link>
        <pubDate>Fri, 18 Sep 2026 17:57:30 GMT</pubDate>
      </item>
      <item><title>Retailers &amp; the &#8216;cost of living&#8217;</title><link>https://example.com/b</link></item>
    </channel></rss>`;
    const items = parseFeed(xml, feed);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: "'We simply don't know' - JP Morgan on oil prices",
      url: "https://www.bbc.co.uk/news/articles/abc",
      source: "BBC Business",
      publishedAt: "2026-09-18T17:57:30.000Z",
    });
    expect(JSON.stringify(items)).not.toContain("Article text");
    expect(items[1].title).toBe("Retailers & the ‘cost of living’");
    expect(items[1].publishedAt).toBeNull();
  });

  it("handles a single-item feed and Atom links", () => {
    const rss = `<rss><channel><item><title>Only one</title><link>https://example.com/1</link></item></channel></rss>`;
    expect(parseFeed(rss, feed)).toHaveLength(1);
    const atom = `<feed><entry><title>Atom</title><link href="https://example.com/a"/><updated>2026-09-18T10:00:00Z</updated></entry></feed>`;
    expect(parseFeed(atom, feed)[0]).toMatchObject({ url: "https://example.com/a", publishedAt: "2026-09-18T10:00:00.000Z" });
  });

  it("drops items with unsafe or missing links", () => {
    const xml = `<rss><channel>
      <item><title>Bad</title><link>javascript:alert(1)</link></item>
      <item><title>No link</title></item>
    </channel></rss>`;
    expect(parseFeed(xml, feed)).toEqual([]);
  });
});

describe("helpers", () => {
  it("strips tracking parameters and fragments", () => {
    expect(canonicalUrl("https://x.com/a?utm_source=rss&id=5#top")).toBe("https://x.com/a?id=5");
    expect(canonicalUrl("ftp://x.com/a")).toBeNull();
  });

  it("cleans titles", () => {
    expect(cleanTitle("  Rates <b>held</b>\n at 3.75% ")).toBe("Rates held at 3.75%");
  });

  it("merges, de-duplicates and sorts newest first", () => {
    const h = (url: string, publishedAt: string | null) => ({
      id: url, title: url, url, feedId: "f", source: "S", publishedAt,
    });
    const merged = mergeHeadlines([
      [h("a", "2026-09-18T10:00:00Z"), h("b", null)],
      [h("a", "2026-09-18T10:00:00Z"), h("c", "2026-09-19T08:00:00Z")],
    ]);
    expect(merged.map((m) => m.url)).toEqual(["c", "a", "b"]);
  });
});
