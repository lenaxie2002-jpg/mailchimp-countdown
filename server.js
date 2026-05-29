const express = require("express");
const { createCanvas } = require("canvas");

const app = express();
const PORT = process.env.PORT || 3000;

// 截止时间：2026年6月1日 00:00，中国时间 UTC+8
const DEFAULT_DEADLINE = "2026-06-01T00:00:00+08:00";

function pad(num) {
  return String(num).padStart(2, "0");
}

function getTimeLeft(deadlineString) {
  const deadline = new Date(deadlineString).getTime();
  const now = Date.now();
  const diff = Math.max(0, deadline - now);

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
  const height = 180;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 外框
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // 标题
  ctx.fillStyle = "#111111";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(isEnded ? "Offer Ended" : "Offer Ends In", width / 2, 38);

  if (isEnded) {
    ctx.font = "bold 34px Arial";
    ctx.fillText("This offer has ended", width / 2, 105);
    return canvas.toBuffer("image/png");
  }

  const boxes = [
    { label: "DAYS", value: days },
    { label: "HOURS", value: pad(hours) },
    { label: "MINS", value: pad(minutes) },
    { label: "SECS", value: pad(seconds) }
  ];

  const boxWidth = 115;
  const boxHeight = 82;
  const gap = 16;
  const startX = (width - boxWidth * 4 - gap * 3) / 2;
  const y = 64;

  boxes.forEach((box, i) => {
    const x = startX + i * (boxWidth + gap);

    ctx.fillStyle = "#111111";
    ctx.fillRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(box.value), x + boxWidth / 2, y + 43);

    ctx.font = "bold 13px Arial";
    ctx.fillText(box.label, x + boxWidth / 2, y + 68);
  });

  return canvas.toBuffer("image/png");
}

app.get("/", (req, res) => {
  res.send("Countdown service is running. Open /countdown.png");
});

app.get("/countdown.png", (req, res) => {
  const deadline = req.query.deadline || DEFAULT_DEADLINE;
  const timeLeft = getTimeLeft(deadline);
  const image = drawCountdown(timeLeft);

  res.setHeader("Content-Type", "image/png");

  // 尽量避免邮件客户端/CDN缓存太久
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.send(image);
});

app.listen(PORT, () => {
  console.log(`Countdown service running on port ${PORT}`);
});