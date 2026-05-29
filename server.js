const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// 2026-06-01 00:00:00 中国时间 UTC+8
// 等于 2026-05-31 16:00:00 UTC
const DEADLINE_TIMESTAMP = Date.UTC(2026, 4, 31, 16, 0, 0);

function pad(num) {
  return String(num).padStart(2, "0");
}

function getTimeLeft() {
  const now = Date.now();
  const diff = Math.max(0, DEADLINE_TIMESTAMP - now);

  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isEnded: diff <= 0
  };
}

function createCountdownSvg({ days, hours, minutes, seconds, isEnded }) {
  const bgColor = "#2C1C17";
  const textColor = "#FFFFFF";

  if (isEnded) {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="150" viewBox="0 0 600 150">
  <rect width="600" height="150" fill="${bgColor}"/>
  <text x="300" y="78" text-anchor="middle"
        font-family="Georgia, Times New Roman, serif"
        font-size="42"
        fill="${textColor}"
        letter-spacing="3">
    OFFER ENDED
  </text>
</svg>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="150" viewBox="0 0 600 150">
  <rect width="600" height="150" fill="${bgColor}"/>

  <text x="100" y="75" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="58"
        fill="${textColor}">
    ${days}
  </text>

  <text x="235" y="75" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="58"
        fill="${textColor}">
    ${hours}
  </text>

  <text x="370" y="75" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="58"
        fill="${textColor}">
    ${minutes}
  </text>

  <text x="505" y="75" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="58"
        fill="${textColor}">
    ${pad(seconds)}
  </text>

  <text x="168" y="70" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="54"
        fill="${textColor}">
    :
  </text>

  <text x="303" y="70" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="54"
        fill="${textColor}">
    :
  </text>

  <text x="438" y="70" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="54"
        fill="${textColor}">
    :
  </text>

  <text x="100" y="115" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="21"
        fill="${textColor}">
    DAYS
  </text>

  <text x="235" y="115" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="21"
        fill="${textColor}">
    HOURS
  </text>

  <text x="370" y="115" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="21"
        fill="${textColor}">
    MINUTES
  </text>

  <text x="505" y="115" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="21"
        fill="${textColor}">
    SECONDS
  </text>
</svg>`;
}

app.get("/", (req, res) => {
  res.send("Countdown service is running. Open /countdown.svg");
});

app.get("/debug", (req, res) => {
  res.json({
    serverNow: new Date().toISOString(),
    deadlineUTC: new Date(DEADLINE_TIMESTAMP).toISOString(),
    deadlineChinaTime: "2026-06-01 00:00:00 UTC+8",
    timeLeft: getTimeLeft()
  });
});

app.get("/countdown.svg", (req, res) => {
  const svg = createCountdownSvg(getTimeLeft());

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.send(svg);
});

app.listen(PORT, () => {
  console.log(`Countdown service running on port ${PORT}`);
});
