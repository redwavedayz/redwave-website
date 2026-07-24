const REDWAVE_API = "https://redwave-api.redwavedayz.workers.dev";
const REDWAVE_STATUS_API = `${REDWAVE_API}/status`;
const SESSION_STORAGE_KEY = "redwave_session";

const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");
const toast = document.getElementById("toast");

if (menuButton && mainNav) {
  menuButton.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${value} copied`);
    } catch {
      showToast(`Server IP: ${value}`);
    }
  });
});

const yearElement = document.getElementById("year");
if (yearElement) yearElement.textContent = new Date().getFullYear();

const modal = document.getElementById("comingSoonModal");
const modalMessage = document.getElementById("modalMessage");

function openModal(message) {
  if (!modal) return;
  if (message && modalMessage) modalMessage.textContent = message;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

function getSessionToken() {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

function setSessionToken(token) {
  if (token) localStorage.setItem(SESSION_STORAGE_KEY, token);
  else localStorage.removeItem(SESSION_STORAGE_KEY);
}

function processAuthHash() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const session = hash.get("rw_session");
  const error = hash.get("auth_error");
  const steamLinked = hash.get("steam_linked");

  if (session) {
    setSessionToken(session);
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    showToast("Signed in with Discord");
  } else if (error) {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    showToast(`Account error: ${error.replaceAll("-", " ")}`);
  } else if (steamLinked) {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    showToast("Steam account linked");
  }
}

function startDiscordLogin() {
  const returnTo = `${location.origin}${location.pathname}`;
  location.assign(
    `${REDWAVE_API}/auth/discord?return_to=${encodeURIComponent(returnTo)}`
  );
}

async function apiFetch(path, options = {}) {
  const token = getSessionToken();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${REDWAVE_API}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const accountAvatar = document.getElementById("accountAvatar");
const accountStatus = document.getElementById("accountStatus");
const accountDetails = document.getElementById("accountDetails");
const discordLoginButton = document.getElementById("discordLoginButton");
const storeLoginButton = document.getElementById("storeLoginButton");
const accountLoginButton = document.getElementById("accountLoginButton");
const linkSteamButton = document.getElementById("linkSteamButton");
const logoutButton = document.getElementById("logoutButton");

function setSignedOutView() {
  if (accountAvatar) {
    accountAvatar.textContent = "RW";
    accountAvatar.style.backgroundImage = "";
  }
  if (accountStatus) accountStatus.textContent = "Not signed in";
  if (accountDetails) {
    accountDetails.textContent =
      "Sign in to link Steam, view purchases, and manage renewals.";
  }

  [discordLoginButton, storeLoginButton, accountLoginButton].forEach((button) => {
    if (button) {
      button.hidden = false;
      button.textContent = "Sign in with Discord";
    }
  });

  if (linkSteamButton) linkSteamButton.hidden = true;
  if (logoutButton) logoutButton.hidden = true;
}

function setSignedInView(account) {
  const displayName = account.display_name || account.discord_username;

  if (accountAvatar) {
    accountAvatar.textContent = account.avatar_url ? "" : displayName.slice(0, 2).toUpperCase();
    accountAvatar.style.backgroundImage = account.avatar_url
      ? `url("${account.avatar_url}")`
      : "";
    accountAvatar.style.backgroundSize = "cover";
    accountAvatar.style.backgroundPosition = "center";
  }

  if (accountStatus) accountStatus.textContent = displayName;
  if (accountDetails) {
    accountDetails.textContent = account.steam_linked
      ? `Steam linked: ${account.steam_id}`
      : "Discord connected. Link Steam before purchasing priority queue.";
  }

  [discordLoginButton, storeLoginButton, accountLoginButton].forEach((button) => {
    if (button) button.hidden = true;
  });

  if (linkSteamButton) linkSteamButton.hidden = account.steam_linked;
  if (logoutButton) logoutButton.hidden = false;
}

async function loadAccount() {
  if (!getSessionToken()) {
    setSignedOutView();
    return null;
  }

  try {
    const data = await apiFetch("/api/account");
    setSignedInView(data.account);
    return data.account;
  } catch (error) {
    if (error.status === 401) {
      setSessionToken(null);
      setSignedOutView();
    } else {
      console.error("Unable to load account:", error);
      showToast("Unable to load account");
    }
    return null;
  }
}

[discordLoginButton, storeLoginButton, accountLoginButton].forEach((button) => {
  if (button) button.addEventListener("click", startDiscordLogin);
});

if (linkSteamButton) {
  linkSteamButton.addEventListener("click", async () => {
    try {
      const data = await apiFetch("/auth/steam/start", {
        method: "POST",
        body: JSON.stringify({
          return_to: `${location.origin}${location.pathname}`,
        }),
      });
      location.assign(data.redirect_url);
    } catch (error) {
      showToast(error.status === 401 ? "Sign in with Discord first" : "Steam linking failed");
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } catch {
      // Local logout still proceeds if the network request fails.
    }
    setSessionToken(null);
    setSignedOutView();
    showToast("Logged out");
  });
}

document.querySelectorAll(".purchase-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const account = await loadAccount();

    if (!account) {
      showToast("Sign in with Discord before checkout");
      return;
    }

    if (button.dataset.product?.startsWith("priority") && !account.steam_linked) {
      showToast("Link Steam before buying priority queue");
      return;
    }

    const product = button.dataset.product;
    let detail = "";

    if (product === "priority-1-month") {
      detail =
        document.querySelector('input[name="priority1"]:checked')?.value === "recurring"
          ? "monthly auto-renewal"
          : "one-time 1-month purchase";
    } else if (product === "priority-3-month") {
      detail =
        document.querySelector('input[name="priority3"]:checked')?.value === "recurring"
          ? "3-month auto-renewal"
          : "one-time 3-month purchase";
    } else if (product === "clan-tag") {
      detail = `clan tag in ${
        document.getElementById("clanTagColor")?.value || "selected"
      } color`;
    }

    openModal(
      `Your ${detail} is account-ready. PayPal order creation and payment verification are the next phase.`
    );
  });
});

const donationAmount = document.getElementById("donationAmount");

document.querySelectorAll("[data-donation]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-donation]").forEach((item) => {
      item.classList.remove("active");
    });
    button.classList.add("active");
    if (donationAmount) donationAmount.value = button.dataset.donation;
  });
});

const donateButton = document.getElementById("donateButton");
if (donateButton) {
  donateButton.addEventListener("click", async () => {
    const amount = Number(donationAmount?.value || 0);
    if (amount < 1) {
      showToast("Enter a donation amount of at least $1");
      return;
    }

    const account = await loadAccount();
    if (!account) {
      showToast("Sign in with Discord before donating");
      return;
    }

    openModal(
      `Your $${amount.toFixed(2)} donation is account-ready. PayPal checkout is the next phase.`
    );
  });
}

const backgroundCanvas = document.getElementById("interactiveBackground");
if (backgroundCanvas) {
  const context = backgroundCanvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let ratio = 1;
  let particles = [];
  let time = 0;

  const mouse = {
    x: innerWidth * 0.72,
    y: innerHeight * 0.35,
    targetX: innerWidth * 0.72,
    targetY: innerHeight * 0.35,
    active: false,
  };

  function resizeCanvas() {
    width = innerWidth;
    height = innerHeight;
    ratio = Math.min(devicePixelRatio || 1, 2);
    backgroundCanvas.width = Math.round(width * ratio);
    backgroundCanvas.height = Math.round(height * ratio);
    backgroundCanvas.style.width = `${width}px`;
    backgroundCanvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(45, Math.min(105, Math.floor((width * height) / 15000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: Math.random() * 1.8 + 0.7,
      depth: Math.random() * 0.8 + 0.2,
      drawX: 0,
      drawY: 0,
    }));
  }

  function draw() {
    time += 0.008;
    context.clearRect(0, 0, width, height);
    mouse.x += (mouse.targetX - mouse.x) * 0.075;
    mouse.y += (mouse.targetY - mouse.y) * 0.075;

    const shiftX = (mouse.x / Math.max(width, 1) - 0.5) * 70;
    const shiftY = (mouse.y / Math.max(height, 1) - 0.5) * 70;

    context.beginPath();
    context.strokeStyle = "rgba(255,255,255,.055)";
    context.lineWidth = 1;
    const spacing = 70;
    const gridX = (shiftX + time * 16) % spacing;
    const gridY = (shiftY + time * 10) % spacing;

    for (let x = -spacing + gridX; x < width + spacing; x += spacing) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }
    for (let y = -spacing + gridY; y < height + spacing; y += spacing) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }
    context.stroke();

    const glow = context.createRadialGradient(
      mouse.x,
      mouse.y,
      0,
      mouse.x,
      mouse.y,
      260
    );
    glow.addColorStop(0, "rgba(66,165,235,.22)");
    glow.addColorStop(0.45, "rgba(66,165,235,.08)");
    glow.addColorStop(1, "rgba(66,165,235,0)");
    context.fillStyle = glow;
    context.fillRect(mouse.x - 260, mouse.y - 260, 520, 520);

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;

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
      context.arc(drawX, drawY, particle.size, 0, Math.PI * 2);
      context.fillStyle =
        particle.depth > 0.55
          ? "rgba(83,177,243,.72)"
          : "rgba(255,255,255,.46)";
      context.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const first = particles[i];
        const second = particles[j];
        const dx = first.drawX - second.drawX;
        const dy = first.drawY - second.drawY;
        const distance = Math.hypot(dx, dy);

        if (distance < 120) {
          context.beginPath();
          context.moveTo(first.drawX, first.drawY);
          context.lineTo(second.drawX, second.drawY);
          context.strokeStyle = `rgba(165,210,235,${0.2 * (1 - distance / 120)})`;
          context.lineWidth = 0.8;
          context.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  addEventListener("pointermove", (event) => {
    mouse.targetX = event.clientX;
    mouse.targetY = event.clientY;
    mouse.active = true;
  });

  addEventListener("pointerleave", () => {
    mouse.active = false;
    mouse.targetX = width * 0.72;
    mouse.targetY = height * 0.35;
  });

  addEventListener("resize", resizeCanvas);
  resizeCanvas();
  draw();
}

const ids = [
  "liveServerName",
  "serverStatus",
  "statusDot",
  "heroStatusDot",
  "heroServerStatus",
  "livePlayers",
  "livePlayersLarge",
  "heroPlayers",
  "liveMap",
  "liveTime",
  "liveUptime",
  "liveVersion",
  "liveRestart",
  "heroRestart",
  "liveMods",
  "liveLocation",
  "heroMap",
  "statusUpdated",
];

const elements = Object.fromEntries(
  ids.map((id) => [id, document.getElementById(id)])
);

function setText(element, value, fallback = "Unknown") {
  if (element) {
    element.textContent =
      value === undefined || value === null || value === ""
        ? fallback
        : String(value);
  }
}

function statusAppearance(online) {
  [elements.statusDot, elements.heroStatusDot].forEach((dot) => {
    if (!dot) return;
    dot.style.backgroundColor = online ? "#55d97b" : "#e05050";
    dot.style.boxShadow = online
      ? "0 0 8px rgba(85,217,123,.8)"
      : "0 0 8px rgba(224,80,80,.8)";
  });

  setText(elements.serverStatus, online ? "Online" : "Offline");
  setText(elements.heroServerStatus, online ? "Server online" : "Server offline");
}

function mapName(map) {
  return String(map || "").trim().toLowerCase() === "channel"
    ? "The Channel"
    : map || "Unknown";
}

function restartTime(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function locationName(location) {
  if (!location) return "Unknown";
  const parts = [location.city, location.region].filter(Boolean);
  return parts.length ? parts.join(", ") : location.country || "Unknown";
}

function playerCount(server) {
  return (
    server.player_text ||
    `${Number(server.players ?? 0)} / ${Number(server.max_players ?? 0)}`
  );
}

async function updateServerStatus() {
  try {
    const response = await fetch(REDWAVE_STATUS_API, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`Status API returned ${response.status}`);

    const data = await response.json();
    if (!data.success || !data.server) {
      throw new Error(data.error || "Invalid response");
    }

    const server = data.server;
    const totals = data.totals || {};
    const online = server.online === true;
    const players = playerCount(server);
    const map = mapName(server.map);
    const restart = restartTime(server.next_restart);

    statusAppearance(online);
    setText(elements.liveServerName, server.name, "RedWave US Main");

    [elements.livePlayers, elements.livePlayersLarge, elements.heroPlayers].forEach(
      (element) => setText(element, players)
    );
    [elements.liveMap, elements.heroMap].forEach((element) =>
      setText(element, map)
    );

    setText(elements.liveTime, server.game_time);
    setText(elements.liveUptime, server.uptime);
    setText(elements.liveVersion, server.version);
    [elements.liveRestart, elements.heroRestart].forEach((element) =>
      setText(element, restart)
    );
    setText(elements.liveMods, totals.mod_count, "0");
    setText(elements.liveLocation, locationName(server.location));

    if (elements.statusUpdated) {
      const now = new Date();
      elements.statusUpdated.textContent =
        `Live data updated at ${now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        })}. Refreshes every 15 seconds.`;
    }
  } catch (error) {
    console.error("Unable to load RedWave status:", error);
    setText(elements.serverStatus, "Status unavailable");
    setText(elements.heroServerStatus, "Status unavailable");

    [elements.statusDot, elements.heroStatusDot].forEach((dot) => {
      if (dot) {
        dot.style.backgroundColor = "#e0a750";
        dot.style.boxShadow = "0 0 8px rgba(224,167,80,.8)";
      }
    });

    if (elements.statusUpdated) {
      elements.statusUpdated.textContent =
        "Live status could not be loaded. The server may still be online.";
    }
  }
}

processAuthHash();
loadAccount();
updateServerStatus();
setInterval(updateServerStatus, 15000);
