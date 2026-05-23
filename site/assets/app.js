const meetingStart = new Date("2026-05-23T08:58:00.000Z");
const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date-line");
const counterEl = document.getElementById("counter");
const phaseEl = document.getElementById("phase");
const lastUpdatedEl = document.getElementById("last-updated");
const messageEl = document.getElementById("status-message");
const statusTextEl = document.querySelector("[data-status-text]");

const clockFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric"
});

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateClock() {
  const now = new Date();
  const diff = Math.max(0, now.getTime() - meetingStart.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  clockEl.textContent = `${clockFormatter.format(now)} WIB`;
  dateEl.textContent = dateFormatter.format(now);
  counterEl.textContent = `${days} hari ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

async function loadStatus() {
  try {
    const response = await fetch(`./data/app-status.json?ts=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json();
    statusTextEl.textContent = data.headline || "APPS STATUS COMINGSOON";
    phaseEl.textContent = data.phase || "Setup GitHub Pages";
    messageEl.textContent =
      data.message || "Sistem sedang disiapkan untuk pengembangan bersama tim PTI dan scouting.";
    lastUpdatedEl.textContent = data.lastUpdated
      ? `Update data: ${data.lastUpdated}`
      : "Menunggu update data";
  } catch (error) {
    lastUpdatedEl.textContent = "Data status belum tersambung";
  }
}

updateClock();
loadStatus();
setInterval(updateClock, 1000);
setInterval(loadStatus, 30000);

