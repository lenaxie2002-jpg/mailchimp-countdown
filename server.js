const express = require("express");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");

const app = express();
const PORT = process.env.PORT || 3000;

// 2026-06-01 00:00:00 纽约时间 America/New_York
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

function drawFrame(ctx, timeLeft) {
  const { days, hours, minutes, seconds, isEnded } = timeLeft;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // 背景色
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = TEXT_COLOR;

  if (isEnded) {
    ctx.font = "42px Arial";
    ctx.fillText("OFFER ENDED", WIDTH / 2, 85);
    return;
  }

  const centers = [100, 235, 370, 505];

  const values = [
    { label: "DAYS", value: days },
    { label: "HOURS", value: hours },
    { label: "MINUTES", value: minutes },
    { label: "SECONDS", value: pad(seconds) }
  ];

  // 数字
  ctx.font = "64px Arial";
  values.forEach((item, index) => {
    ctx.fillText(String(item.value), centers[index], 75);
  });

  // 冒号
  ctx.font = "56px Arial";
  ctx.fillText(":", 168, 72);
  ctx.fillText(":", 303, 72);
  ctx.fillText(":", 438, 72);

  // 标签
  ctx.font = "22px Arial";
  values.forEach((item, index) => {
    ctx.fillText(item.label, centers[index], 118);
  });
}

function createCountdownGif() {
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  encoder.start();

  // 0 = 无限循环，不停止
  encoder.setRepeat(0);

  // 每帧停留 1 秒
  encoder.setDelay(1000);

  encoder.setQuality(10);

  const now = Date.now();

  // 生成 120 帧 = 每轮播放 2 分钟
  for (let i = 0; i < 120; i++) {
    const timeLeft = getTimeLeft(now + i * 1000);
    drawFrame(ctx, timeLeft);
    encoder.addFrame(ctx);
  }

  encoder.finish();

  return encoder.out.getData();
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

app.get("/countdown.gif", (req, res) => {
  const gif = createCountdownGif();

  res.setHeader("Content-Type", "image/gif");

  // 尽量避免缓存，方便 Mailchimp 测试时重新拉取
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.send(gif);
});

app.listen(PORT, () => {
  console.log(`Countdown service running on port ${PORT}`);
});
