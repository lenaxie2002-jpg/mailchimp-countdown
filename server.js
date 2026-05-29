const express = require("express");
const { createCanvas } = require("canvas");

const app = express();
const PORT = process.env.PORT || 3000;

// 默认截止时间：2026年6月1日 00:00，中国时间 UTC+8
const DEFAULT_DEADLINE = "2026-06-01T00:00:00+08:00";

function pad(num) {
  return String(num).padStart(2, "0");
}

function getTimeLeft(deadlineString) {
  const deadline = new Date(deadlineString).getTime();
  const now = Date.now();

  // 防止传入非法时间
  if (Number.isNaN(deadline)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: true
    };
  }

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
  const height = 150;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 背景色：你要的深棕色
  ctx.fillStyle = "#2C1C17";
  ctx.fillRect(0, 0, width, height);

  // 抗锯齿设置
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 如果倒计时结束
  if (isEnded) {
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 34px Arial";
    ctx.fillText("OFFER ENDED", width / 2, height / 2 - 10);

    ctx.font = "18px Arial";
    ctx.fillText("This offer has ended", width / 2, height / 2 + 28);

    return canvas.toBuffer("image/png");
  }

  const values = [
    { label: "DAYS", value: days },
    { label: "HOURS", value: hours },
    { label: "MINUTES", value: minutes },
    { label: "SECONDS", value: pad(seconds) }
  ];

  // 四组文字中心点，参考你图2的布局
  const centers = [100, 235, 370, 505];

  // 数字与标签位置
  const numberY = 72;
  const labelY = 118;

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";

  // 画数字
  ctx.font = "64px Arial";
  values.forEach((item, index) => {
    ctx.fillText(String(item.value), centers[index], numberY);
  });

  // 画冒号
  ctx.font = "56px Arial";
  ctx.fillText(":", 168, numberY - 2);
  ctx.fillText(":", 303, numberY - 2);
  ctx.fillText(":", 438, numberY - 2);

  // 画标签
  ctx.font = "22px Arial";
  values.forEach((item, index) => {
    ctx.fillText(item.label, centers[index], labelY);
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

  // 尽量避免缓存，方便 Mailchimp 重新请求最新图片
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
