import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import { createWriteStream } from "fs";
import os from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "../client/public");

// Download Cormorant Garamond font to a temp file so we can register it
const FONT_URL =
  "https://fonts.gstatic.com/s/cormorantgaramond/v22/co3YmX5slCNuHLi8bLeY9MK7whWMhyjQEl5fug.woff2";

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const get = url.startsWith("https") ? https : http;
    get
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        file.close();
        reject(err);
      });
  });
}

async function loadFont() {
  const fontPath = join(os.tmpdir(), "cormorant-garamond.woff2");
  if (!existsSync(fontPath)) {
    console.log("Downloading Cormorant Garamond font...");
    await download(FONT_URL, fontPath);
  }
  GlobalFonts.registerFromPath(fontPath, "Cormorant Garamond");
  console.log("Font registered.");
}

function drawBackground(ctx, color, width, height) {
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawCenteredText(ctx, text, color, fontSize, letterSpacing, width, height) {
  ctx.fillStyle = color;
  ctx.font = `600 ${fontSize}px 'Cormorant Garamond'`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Manual letter spacing via character-by-character drawing
  if (letterSpacing > 0) {
    const chars = text.split("");
    // Measure full width with spacing
    let totalWidth = 0;
    const widths = chars.map((ch) => {
      const m = ctx.measureText(ch);
      return m.width;
    });
    totalWidth =
      widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
    let x = width / 2 - totalWidth / 2;
    const y = height / 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    chars.forEach((ch, i) => {
      ctx.fillText(ch, x, y);
      x += widths[i] + letterSpacing;
    });
  } else {
    ctx.fillText(text, width / 2, height / 2);
  }
}

function pngBuffer(canvas) {
  return canvas.toBuffer("image/png");
}

async function generate() {
  await loadFont();

  // ── favicon-32.png — LV monogram, dark square, 32×32 ──────────────────────
  {
    const [w, h] = [32, 32];
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    drawBackground(ctx, "#0f0f19", w, h);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 17px 'Cormorant Garamond'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LV", w / 2, h / 2 + 1);
    writeFileSync(join(PUBLIC, "favicon-32.png"), pngBuffer(canvas));
    console.log("✓ favicon-32.png");
  }

  // ── favicon-180.png — LV monogram, dark square, 180×180 ───────────────────
  {
    const [w, h] = [180, 180];
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    drawBackground(ctx, "#0f0f19", w, h);
    drawCenteredText(ctx, "LV", "#ffffff", 90, 8, w, h);
    writeFileSync(join(PUBLIC, "favicon-180.png"), pngBuffer(canvas));
    console.log("✓ favicon-180.png");
  }

  // ── favicon.ico (same as favicon-32.png, saved as .ico) ───────────────────
  // Browsers accept PNG data in a .ico file
  {
    const [w, h] = [32, 32];
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    drawBackground(ctx, "#0f0f19", w, h);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 17px 'Cormorant Garamond'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LV", w / 2, h / 2 + 1);
    writeFileSync(join(PUBLIC, "favicon.ico"), pngBuffer(canvas));
    console.log("✓ favicon.ico");
  }

  // ── og-image.png — LUXVIBE wordmark + tagline, 1200×630 ──────────────────
  {
    const [w, h] = [1200, 630];
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");

    // Background: dark navy
    drawBackground(ctx, "#0f0f19", w, h);

    // Subtle horizontal rule / decorative line
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 340);
    ctx.lineTo(1000, 340);
    ctx.stroke();

    // LUXVIBE wordmark
    drawCenteredText(ctx, "LUXVIBE", "#ffffff", 160, 30, w, h - 80);

    // Tagline
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `400 28px 'Cormorant Garamond'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Luxury Stays. Unbeatable Rates.", w / 2, h / 2 + 110);

    writeFileSync(join(PUBLIC, "og-image.png"), pngBuffer(canvas));
    console.log("✓ og-image.png");
  }

  console.log("\nAll brand assets saved to client/public/");
}

generate().catch((err) => {
  console.error("Error generating assets:", err);
  process.exit(1);
});
