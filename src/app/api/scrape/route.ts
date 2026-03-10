import { NextResponse } from "next/server";

type ScrapeResult = {
  title: string | null;
  image: string | null;
  price: string | null;
  description: string | null;
};

// ── Extract metadata from raw HTML ───────────────────────
function extractFromHtml(html: string, url: string): ScrapeResult {
  // Helper to grab meta tag content
  function getMeta(attr: string, value: string): string | null {
    // Match both property="x" content="y" and content="y" property="x" orderings
    const pattern1 = new RegExp(
      `<meta[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']+)["']`,
      "i"
    );
    const pattern2 = new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${value}["']`,
      "i"
    );
    return pattern1.exec(html)?.[1] ?? pattern2.exec(html)?.[1] ?? null;
  }

  // ── TITLE ──────────────────────────────────────────────
  const title =
    getMeta("property", "og:title") ??
    getMeta("name", "title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
    null;

  // ── IMAGE ──────────────────────────────────────────────
  // Try multiple sources, filter out tracking pixels and tiny images
  const imageCandidates = [
    getMeta("property", "og:image"),
    getMeta("property", "og:image:secure_url"),
    getMeta("name", "twitter:image"),
    getMeta("name", "twitter:image:src"),
  ];

  // Amazon-specific: grab the main product image from their JS data
  const amazonLanding = html.match(/"hiRes"\s*:\s*"([^"]+)"/)?.[1];
  const amazonLarge = html.match(/"large"\s*:\s*"([^"]+)"/)?.[1];
  const amazonMainImg = html.match(/id="landingImage"[^>]*src="([^"]+)"/)?.[1];
  const amazonDynImg = html.match(/data-old-hires="([^"]+)"/)?.[1];

  if (amazonLanding) imageCandidates.unshift(amazonLanding);
  if (amazonLarge) imageCandidates.unshift(amazonLarge);
  if (amazonMainImg) imageCandidates.push(amazonMainImg);
  if (amazonDynImg) imageCandidates.push(amazonDynImg);

  // Generic: look for large product images in JSON-LD
  const jsonLdImageMatch = html.match(/"image"\s*:\s*"([^"]+)"/);
  if (jsonLdImageMatch) imageCandidates.push(jsonLdImageMatch[1]);

  // Filter: skip tracking pixels, 1x1 images, and Amazon fls-na URLs
  const image =
    imageCandidates.find(
      (img) =>
        img &&
        !img.includes("fls-na.amazon") &&
        !img.includes("/1x1/") &&
        !img.includes("pixel") &&
        !img.includes("beacon") &&
        !img.includes("tr?") &&
        (img.startsWith("http") || img.startsWith("//"))
    ) ?? null;

  // ── PRICE ──────────────────────────────────────────────
  // Try structured data first, then meta tags, then common HTML patterns
  const priceCandidates: (string | null)[] = [
    // Meta tags
    getMeta("property", "og:price:amount"),
    getMeta("property", "product:price:amount"),
    getMeta("property", "product:price"),

    // JSON-LD structured data
    html.match(/"price"\s*:\s*"?(\d+\.?\d*)"?/)?.[1] ?? null,
    html.match(/"lowPrice"\s*:\s*"?(\d+\.?\d*)"?/)?.[1] ?? null,

    // Amazon-specific price patterns
    html.match(/class="a-price-whole"[^>]*>(\d+)/)?.[1]
      ? `${html.match(/class="a-price-whole"[^>]*>(\d+)/)?.[1]}.${
          html.match(/class="a-price-fraction"[^>]*>(\d+)/)?.[1] ?? "00"
        }`
      : null,
    html.match(/id="priceblock_ourprice"[^>]*>\s*\$?([\d,.]+)/)?.[1] ?? null,
    html.match(/id="priceblock_dealprice"[^>]*>\s*\$?([\d,.]+)/)?.[1] ?? null,
    html.match(/class="a-offscreen"[^>]*>\s*\$?([\d,.]+)/)?.[1] ?? null,

    // Generic price patterns
    html.match(/class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,.]+)/i)?.[1] ?? null,
  ];

  const price =
    priceCandidates.find(
      (p) => p && !isNaN(parseFloat(p.replace(",", "")))
    ) ?? null;

  // ── DESCRIPTION ────────────────────────────────────────
  const description =
    getMeta("property", "og:description") ??
    getMeta("name", "description") ??
    null;

  return { title, image, price, description };
}

// ── Fetch HTML with a realistic browser user-agent ───────
async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ── Playwright fallback for JS-heavy sites ───────────────
async function fetchWithPlaywright(url: string): Promise<ScrapeResult> {
  const { chromium } = await import("playwright-core");
  const chromiumPkg = await import("@sparticuz/chromium");

  const browser = await chromium.launch({
    args: chromiumPkg.default.args,
    executablePath: await chromiumPkg.default.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Wait briefly for dynamic content to load
    await page.waitForTimeout(2000);

    const html = await page.content();
    return extractFromHtml(html, url);
  } finally {
    await browser.close();
  }
}

// ── Main handler ─────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Step 1: Try simple fetch + HTML parsing
    let result: ScrapeResult = {
      title: null,
      image: null,
      price: null,
      description: null,
    };

    try {
      const html = await fetchHtml(url);
      result = extractFromHtml(html, url);
    } catch (err) {
      console.error("Simple fetch failed:", err);
    }

    // Step 2: If we didn't get a title or image, try Playwright
    if (!result.title || !result.image) {
      try {
        console.log("Falling back to Playwright for:", url);
        const pwResult = await fetchWithPlaywright(url);

        // Merge: prefer Playwright results for missing fields
        result = {
          title: result.title ?? pwResult.title,
          image: result.image ?? pwResult.image,
          price: result.price ?? pwResult.price,
          description: result.description ?? pwResult.description,
        };
      } catch (err) {
        console.error("Playwright fallback failed:", err);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Scrape error:", err.message);
    return NextResponse.json(
      { title: null, image: null, price: null, description: null },
      { status: 200 }
    );
  }
}