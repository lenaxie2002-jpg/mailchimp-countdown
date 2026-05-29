const express = require("express");
const sharp = require("sharp");
const { GIFEncoder, quantize, applyPalette } = require("gifenc");

const app = express();
const PORT = process.env.PORT || 3000;

// 截止时间：2026-06-01 00:00:00 纽约时间
// 2026年6月纽约是 EDT / UTC-4
// 等于 2026-06-01 04:00:00 UTC
const DEADLINE_TIMESTAMP = Date.UTC(2026, 5, 1, 4, 0, 0);

const WIDTH = 600;
const HEIGHT = 150;
const BG_COLOR = "#2C1C17";
const TEXT_COLOR = "#FFFFFF";

function pad(num) {
  return String(num).padStart(2, "0");
}

function getTimeLeft(timestampNow) {
  const diff = Math.max(0, DEADLINE_TIMESTAMP - timestampNow);
  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isEnded: diff <= 0
  };
}

function createFrameSvg(timeLeft) {
  const { days, hours, minutes, seconds, isEnded } = timeLeft;

  if (isEnded) {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}"/>
  <text x="300" y="85" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="42"
        fill="${TEXT_COLOR}">
    OFFER ENDED
  </text>
</svg>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}"/>

  <text x="100" y="76" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="64"
        fill="${TEXT_COLOR}">
    ${days}
  </text>

  <text x="235" y="76" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="64"
        fill="${TEXT_COLOR}">
    ${hours}
  </text>

  <text x="370" y="76" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="64"
        fill="${TEXT_COLOR}">
    ${minutes}
  </text>

  <text x="505" y="76" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="64"
        fill="${TEXT_COLOR}">
    ${pad(seconds)}
  </text>

  <text x="168" y="72" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="56"
        fill="${TEXT_COLOR}">
    :
  </text>

  <text x="303" y="72" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="56"
        fill="${TEXT_COLOR}">
    :
  </text>

  <text x="438" y="72" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="56"
        fill="${TEXT_COLOR}">
    :
  </text>

  <text x="100" y="118" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22"
        fill="${TEXT_COLOR}">
    DAYS
  </text>

  <text x="235" y="118" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22"
        fill="${TEXT_COLOR}">
    HOURS
  </text>

  <text x="370" y="118" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22"
        fill="${TEXT_COLOR}">
    MINUTES
  </text>

  <text x="505" y="118" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22"
        fill="${TEXT_COLOR}">
    SECONDS
  </text>
</svg>`;
}

async function svgToRgba(svg) {
  return await sharp(Buffer.from(svg))
    .resize(WIDTH, HEIGHT)
    .ensureAlpha()
    .raw()
    .toBuffer();
}

async function createCountdownGif() {
  const gif = GIFEncoder();

  const now = Date.now();

  // 120 帧 = 2 分钟
  for (let i = 0; i < 120; i++) {
    const timeLeft = getTimeLeft(now + i * 1000);
    const svg = createFrameSvg(timeLeft);

    const rgba = await svgToRgba(svg);

    const palette = quantize(rgba, 256);
    const indexed = applyPalette(rgba, palette);

    gif.writeFrame(indexed, WIDTH, HEIGHT, {
      palette,
      delay: 1000
    });
  }

  gif.finish();

  return Buffer.from(gif.bytes());
}

app.get("/", (req, res) => {
  res.send("Countdown service is running. Open /countdown.gif");
});

app.get("/debug", (req, res) => {
  res.json({
    serverNowUTC: new Date().toISOString(),
    deadlineUTC: new Date(DEADLINE_TIMESTAMP).toISOString(),
    deadlineNewYorkTime: "2026-06-01 00:00:00 America/New_York",
    timeLeft: getTimeLeft(Date.now())
  });
});

// 单帧 SVG 测试：先看这里有没有文字
app.get("/frame.svg", (req, res) => {
  const svg = createFrameSvg(getTimeLeft(Date.now()));

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, max-age=0");
  res.send(svg);
});

// 单帧 PNG 测试：再看这里有没有文字
app.get("/frame.png", async (req, res) => {
  try {
    const svg = createFrameSvg(getTimeLeft(Date.now()));
    const png = await sharp(Buffer.from(svg)).png().toBuffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store, no-cache, max-age=0");
    res.send(png);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating PNG frame");
  }
});

app.get("/countdown.gif", async (req, res) => {
  try {
    const gifBuffer = await createCountdownGif();

    res.setHeader("Content-Type", "image/gif");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.send(gifBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating countdown GIF");
  }
});

app.listen(PORT, () => {
  console.log(`Countdown service running on port ${PORT}`);
});
