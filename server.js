const express = require("express");
const { createCanvas } = require("canvas");

const app = express();
const PORT = process.env.PORT || 3000;

// 2026-06-01 00:00:00 中国时间 UTC+8
// 等于 2026-05-31 16:00:00 UTC
const DEFAULT_DEADLINE_TIMESTAMP = Date.UTC(2026, 4, 31, 16, 0, 0);

function pad(num) {
  return String(num).padStart(2, "0");
}

function getTimeLeft() {
  const now = Date.now();
  const diff = Math.max(0, DEFAULT_DEADLINE_TIMESTAMP - now);

  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isEnded: diff <= 0
  };
}

function drawCountdown({ days, hours, minutes, seconds, isEnded }) {
  const width = 600;
  const height = 150;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 背景色
  ctx.fillStyle = "#2C1C17";
  ctx.fillRect(0, 0, width, height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";

  if (isEnded) {
    ctx.textBaseline = "middle";
    ctx.font = "bold 34px Arial";
    ctx.fillText("OFFER ENDED", width / 2, height / 2);
    return canvas.toBuffer("image/png");
  }

  const values = [
    { label: "DAYS", value: days },
    { label: "HOURS", value: hours },
    { label: "MINUTES", value: minutes },
    { label: "SECONDS", value: pad(seconds) }
  ];

  const centers = [100, 235, 370, 505];

  const numberY = 72;
  const labelY = 118;

  // 数字
  ctx.font = "64px Arial";
  values.forEach((item, index) => {
    ctx.fillText(String(item.value), centers[index], numberY);
  });

  // 冒号
  ctx.font = "56px Arial";
  ctx.fillText(":", 168, numberY - 2);
  ctx.fillText(":", 303, numberY - 2);
  ctx.fillText(":", 438, numberY - 2);

  // 标签
  ctx.font = "22px Arial";
  values.forEach((item, index) => {
    ctx.fillText(item.label, centers[index], labelY);
  });

  return canvas.toBuffer("image/png");
}

app.get("/", (req, res) => {
  res.send("Countdown service is running. Open /countdown.png");
});

app.get("/debug", (req, res) => {
  res.json({
    serverNow: new Date().toISOString(),
    deadlineUTC: new Date(DEFAULT_DEADLINE_TIMESTAMP).toISOString(),
    deadlineChinaTime: "2026-06-01 00:00:00 UTC+8",
    timeLeft: getTimeLeft()
  });
});

app.get("/countdown.png", (req, res) => {
  const timeLeft = getTimeLeft();
  const image = drawCountdown(timeLeft);

  res.setHeader("Content-Type", "image/png");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.send(image);
});

app.listen(PORT, () => {
  console.log(`Countdown service running on port ${PORT}`);
});
