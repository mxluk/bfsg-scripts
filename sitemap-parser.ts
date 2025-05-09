// sitemap-parser.ts
import { parse } from "https://deno.land/x/xml@2.1.2/mod.ts";

const visited = new Set<string>();
const urls: string[] = [];

async function parseSitemap(url: string) {
  if (visited.has(url)) return;
  visited.add(url);

  console.log(`Parsing: ${url}`);
  const res = await fetch(url);
  const xml = await res.text();
  const parsed = parse(xml);

  if (parsed.sitemapindex?.sitemap) {
    const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];
    for (const sm of sitemaps) {
      const loc = sm.loc?.toString().trim();
      if (loc) await parseSitemap(loc);
    }
  }

  if (parsed.urlset?.url) {
    const entries = Array.isArray(parsed.urlset.url)
        ? parsed.urlset.url
        : [parsed.urlset.url];
    for (const entry of entries) {
      const loc = entry.loc?.toString().trim();
      if (loc) urls.push(loc);
    }
  }
}

const root = Deno.args[0];
if (!root) {
  console.error("Usage: deno run --allow-net --allow-write sitemap-parser.ts <sitemap_url>");
  Deno.exit(1);
}

await parseSitemap(root);
await Deno.writeTextFile("urls.txt", [...new Set(urls)].join("\n"));
console.log(`Extracted ${urls.length} URLs.`);
