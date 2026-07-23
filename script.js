const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");
const toast = document.getElementById("toast");

// ===============================
// MOBILE MENU
// ===============================

if (menuButton && mainNav) {
  menuButton.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  mainNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// ===============================
// COPY SERVER IP BUTTONS
// ===============================

document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;

    try {
      await navigator.clipboard.writeText(value);

      if (toast) {
        toast.textContent = `${value} copied`;
      }
    } catch {
      if (toast) {
        toast.textContent = `Server IP: ${value}`;
      }
    }

    if (toast) {
      toast.classList.add("show");

      setTimeout(() => {
        toast.classList.remove("show");
      }, 2200);
    }
  });
});

// ===============================
// COPYRIGHT YEAR
// ===============================

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ===============================
// INTERACTIVE BACKGROUND
// ===============================

const backgroundCanvas = document.getElementById("interactiveBackground");

if (backgroundCanvas) {
  const context = backgroundCanvas.getContext("2d", { alpha: true });

  let width = 0;
  let height = 0;
  let ratio = 1;
  let particles = [];
  let time = 0;

  const mouse = {
    x: window.innerWidth * 0.72,
    y: window.innerHeight * 0.35,
    targetX: window.innerWidth * 0.72,
    targetY: window.innerHeight * 0.35,
    active: false
  };

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    ratio = Math.min(window.devicePixelRatio || 1, 2);

    backgroundCanvas.width = Math.round(width * ratio);
    backgroundCanvas.height = Math.round(height * ratio);

    backgroundCanvas.style.width = `${width}px`;
    backgroundCanvas.style.height = `${height}px`;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(
      45,
      Math.min(110, Math.floor((width * height) / 14000))
    );

    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: Math.random() * 1.8 + 0.7,
      depth: Math.random() * 0.8 + 0.2,
      drawX: 0,
      drawY: 0
    }));
  }

  function draw() {
    time += 0.008;

    context.clearRect(0, 0, width, height);

    mouse.x += (mouse.targetX - mouse.x) * 0.075;
    mouse.y += (mouse.targetY - mouse.y) * 0.075;

    const shiftX = (mouse.x / Math.max(width, 1) - 0.5) * 70;
    const shiftY = (mouse.y / Math.max(height, 1) - 0.5) * 70;

    // Moving tactical grid
    context.beginPath();
    context.strokeStyle = "rgba(255,255,255,0.055)";
    context.lineWidth = 1;

    const spacing = 70;
    const gridX = (shiftX + time * 16) % spacing;
    const gridY = (shiftY + time * 10) % spacing;

    for (
      let x = -spacing + gridX;
      x < width + spacing;
      x += spacing
    ) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }

    for (
      let y = -spacing + gridY;
      y < height + spacing;
      y += spacing
    ) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }

    context.stroke();

    // Cursor spotlight
    const glow = context.createRadialGradient(
      mouse.x,
      mouse.y,
      0,
      mouse.x,
      mouse.y,
      260
    );

    glow.addColorStop(0, "rgba(66,165,235,0.22)");
    glow.addColorStop(0.45, "rgba(66,165,235,0.08)");
    glow.addColorStop(1, "rgba(66,165,235,0)");

    context.fillStyle = glow;
    context.fillRect(
      mouse.x - 260,
      mouse.y - 260,
      520,
      520
    );

    // Particles
    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -20) {
        particle.x = width + 20;
      }

      if (particle.x > width + 20) {
        particle.x = -20;
      }

      if (particle.y < -20) {
        particle.y = height + 20;
      }

      if (particle.y > height + 20) {
        particle.y = -20;
      }

      let drawX = particle.x + shiftX * particle.depth;
      let drawY = particle.y + shiftY * particle.depth;

      const dx = drawX - mouse.x;
      const dy = drawY - mouse.y;
      const distance = Math.hypot(dx, dy);

      if (mouse.active && distance < 180 && distance > 0.1) {
        const force = (180 - distance) / 180;

        drawX += (dx / distance) * force * 55;
        drawY += (dy / distance) * force * 55;
      }

      particle.drawX = drawX;
      particle.drawY = drawY;

      context.beginPath();
      context.arc(
        drawX,
        drawY,
        particle.size,
        0,
        Math.PI * 2
      );

      context.fillStyle =
        particle.depth > 0.55
          ? "rgba(83,177,243,0.72)"
          : "rgba(255,255,255,0.46)";

      context.fill();
    }

    // Connecting lines
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];

      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];

        const dx = a.drawX - b.drawX;
        const dy = a.drawY - b.drawY;
        const distance = Math.hypot(dx, dy);

        if (distance < 120) {
          context.beginPath();
          context.moveTo(a.drawX, a.drawY);
          context.lineTo(b.drawX, b.drawY);

          context.strokeStyle =
            `rgba(165,210,235,${0.20 * (1 - distance / 120)})`;

          context.lineWidth = 0.8;
          context.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("pointermove", event => {
    mouse.targetX = event.clientX;
    mouse.targetY = event.clientY;
    mouse.active = true;
  });

  window.addEventListener("pointerleave", () => {
    mouse.active = false;
    mouse.targetX = width * 0.72;
    mouse.targetY = height * 0.35;
  });

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  draw();
}

// ===============================
// LIVE REDWAVE SERVER STATUS
// ===============================

const REDWAVE_STATUS_API =
  "https://redwave-api.redwavedayz.workers.dev/status";

const liveServerName = document.getElementById("liveServerName");
const serverStatus = document.getElementById("serverStatus");
const statusDot = document.getElementById("statusDot");

const livePlayers = document.getElementById("livePlayers");
const liveMap = document.getElementById("liveMap");
const liveTime = document.getElementById("liveTime");
const liveUptime = document.getElementById("liveUptime");
const liveVersion = document.getElementById("liveVersion");
const liveRestart = document.getElementById("liveRestart");
const liveMods = document.getElementById("liveMods");
const liveLocation = document.getElementById("liveLocation");

const heroMap = document.getElementById("heroMap");
const heroSlots = document.getElementById("heroSlots");
const statusUpdated = document.getElementById("statusUpdated");

function setText(element, value, fallback = "Unknown") {
  if (!element) {
    return;
  }

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    element.textContent = fallback;
    return;
  }

  element.textContent = String(value);
}

function setServerStatusAppearance(online) {
  if (serverStatus) {
    serverStatus.textContent = online
      ? "Online"
      : "Offline";
  }

  if (!statusDot) {
    return;
  }

  if (online) {
    statusDot.style.backgroundColor = "#55d97b";
    statusDot.style.boxShadow =
      "0 0 8px rgba(85, 217, 123, 0.8)";
  } else {
    statusDot.style.backgroundColor = "#e05050";
    statusDot.style.boxShadow =
      "0 0 8px rgba(224, 80, 80, 0.8)";
  }
}

function formatMapName(mapName) {
  if (!mapName) {
    return "Unknown";
  }

  const normalized = String(mapName).trim().toLowerCase();

  if (normalized === "channel") {
    return "The Channel";
  }

  return String(mapName);
}

function formatRestartTime(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatLocation(location) {
  if (!location) {
    return "Unknown";
  }

  const parts = [
    location.city,
    location.region
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return location.country || "Unknown";
}

function formatPlayerCount(server) {
  if (server.player_text) {
    return server.player_text;
  }

  const players = Number(server.players ?? 0);
  const maxPlayers = Number(server.max_players ?? 0);

  return `${players} / ${maxPlayers}`;
}

async function updateServerStatus() {
  try {
    const response = await fetch(REDWAVE_STATUS_API, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(
        `Status API returned ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.success || !data.server) {
      throw new Error(
        data.error || "Invalid server status response"
      );
    }

    const server = data.server;
    const totals = data.totals || {};
    const online = server.online === true;

    setServerStatusAppearance(online);

    setText(
      liveServerName,
      server.name,
      "RedWave US Main"
    );

    setText(
      livePlayers,
      formatPlayerCount(server)
    );

    const mapName = formatMapName(server.map);

    setText(liveMap, mapName);
    setText(heroMap, mapName);

    setText(
      liveTime,
      server.game_time
    );

    setText(
      liveUptime,
      server.uptime
    );

    setText(
      liveVersion,
      server.version
    );

    setText(
      liveRestart,
      formatRestartTime(server.next_restart)
    );

    setText(
      liveMods,
      totals.mod_count,
      "0"
    );

    setText(
      liveLocation,
      formatLocation(server.location)
    );

    setText(
      heroSlots,
      server.max_players,
      "100"
    );

    if (statusUpdated) {
      const now = new Date();

      statusUpdated.textContent =
        `Live data updated at ${now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit"
        })}. Refreshes every 15 seconds.`;
    }
  } catch (error) {
    console.error(
      "Unable to load RedWave server status:",
      error
    );

    if (serverStatus) {
      serverStatus.textContent =
        "Status unavailable";
    }

    if (statusDot) {
      statusDot.style.backgroundColor = "#e0a750";
      statusDot.style.boxShadow =
        "0 0 8px rgba(224, 167, 80, 0.8)";
    }

    if (statusUpdated) {
      statusUpdated.textContent =
        "The live server status could not be loaded. The server may still be online.";
    }
  }
}

// Load status immediately.
updateServerStatus();

// Refresh status every 15 seconds.
setInterval(updateServerStatus, 15000);
