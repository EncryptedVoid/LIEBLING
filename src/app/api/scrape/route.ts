import { NextResponse } from "next/server";
import got from "got";
import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperImage from "metascraper-image";
import metascraperDescription from "metascraper-description";

const scraper = metascraper([
  metascraperTitle(),
  metascraperImage(),
  metascraperDescription(),
]);

// Try to extract price from HTML meta tags or structured data
function extractPrice(html: string): string | null {
  // og:price:amount
  const ogMatch = html.match(
    /<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogMatch) return ogMatch[1];

  // schema.org offers.price
  const schemaMatch = html.match(/"price"\s*:\s*"?(\d+\.?\d*)"?/i);
  if (schemaMatch) return schemaMatch[1];

  return null;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // ── Primary: metascraper (fast) ────────────────────────
    const { body: html, url: resolvedUrl } = await got(url, {
      followRedirect: true,
      timeout: { request: 8000 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; Lieblings/1.0; +https://lieblings.app)",
      },
    });

    const metadata = await scraper({ html, url: resolvedUrl });
    const price = extractPrice(html);

    // If metascraper got a title, return early — no need for Playwright
    if (metadata.title) {
      return NextResponse.json({
        title: metadata.title,
        image: metadata.image ?? null,
        price: price ?? null,
        description: metadata.description ?? null,
      });
    }

    // ── Fallback: Playwright (slow, for JS-heavy sites) ────
    // Lazy-import so Playwright only loads when needed
    const { chromium } = await import("playwright-core");
    const chromiumPkg = await import("@sparticuz/chromium");

    const browser = await chromium.launch({
      args: chromiumPkg.default.args,
      executablePath: await chromiumPkg.default.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    const pwData = await page.evaluate(() => {
      const getMeta = (attr: string, value: string) => {
        const el = document.querySelector(
          `meta[${attr}="${value}"]`
        ) as HTMLMetaElement | null;
        return el?.content ?? null;
      };

      return {
        title:
          getMeta("property", "og:title") ??
          document.title ??
          null,
        image:
          getMeta("property", "og:image") ?? null,
        price:
          getMeta("property", "og:price:amount") ??
          getMeta("property", "product:price:amount") ??
          null,
        description:
          getMeta("property", "og:description") ??
          getMeta("name", "description") ??
          null,
      };
    });

    await browser.close();

    return NextResponse.json(pwData);
  } catch (err: any) {
    console.error("Scrape error:", err.message);
    return NextResponse.json(
      { title: null, image: null, price: null, description: null },
      { status: 200 } // Return empty data, not an error — the form still works
    );
  }
}