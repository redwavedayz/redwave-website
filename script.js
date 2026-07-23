const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");
const toast = document.getElementById("toast");
if (menuButton && mainNav) {
    menuButton.addEventListener("click", () => {
        const open = mainNav.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", String(open))
    });
    mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false")
    }))
}

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200)
}
document.querySelectorAll("[data-copy]").forEach(button => button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
        await navigator.clipboard.writeText(value);
        showToast(`${value} copied`)
    } catch {
        showToast(`Server IP: ${value}`)
    }
}));
const yearElement = document.getElementById("year");
if (yearElement) yearElement.textContent = new Date().getFullYear();
const modal = document.getElementById("comingSoonModal");
const modalMessage = document.getElementById("modalMessage");

function openModal(message) {
    if (!modal) return;
    if (message && modalMessage) modalMessage.textContent = message;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false")
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true")
}
document.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", closeModal));
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal()
});
["discordLoginButton", "storeLoginButton", "accountLoginButton"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", () => openModal("Discord OAuth and Steam linking need to be added to your Cloudflare Worker before account sign-in can go live."))
});
document.querySelectorAll(".purchase-button").forEach(button => button.addEventListener("click", () => {
    const product = button.dataset.product;
    let detail = "";
    if (product === "priority-1-month") {
        detail = document.querySelector('input[name="priority1"]:checked')?.value === "recurring" ? "monthly auto-renewal" : "one-time 1-month purchase"
    } else if (product === "priority-3-month") {
        detail = document.querySelector('input[name="priority3"]:checked')?.value === "recurring" ? "3-month auto-renewal" : "one-time 3-month purchase"
    } else if (product === "clan-tag") {
        detail = `clan tag in ${document.getElementById("clanTagColor")?.value||"selected"} color`
    }
    openModal(`The ${detail} selection is ready on the front end. PayPal checkout, payment webhooks, and fulfillment still need to be connected in the Worker.`)
}));
const donationAmount = document.getElementById("donationAmount");
document.querySelectorAll("[data-donation]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-donation]").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    if (donationAmount) donationAmount.value = button.dataset.donation
}));
const donateButton = document.getElementById("donateButton");
if (donateButton) donateButton.addEventListener("click", () => {
    const amount = Number(donationAmount?.value || 0);
    if (amount < 1) {
        showToast("Enter a donation amount of at least $1");
        return
    }
    openModal(`Your $${amount.toFixed(2)} donation selection is ready. PayPal checkout still needs to be connected to the Worker.`)
});
const backgroundCanvas = document.getElementById("interactiveBackground");
if (backgroundCanvas) {
    const context = backgroundCanvas.getContext("2d", {
        alpha: true
    });
    let width = 0,
        height = 0,
        ratio = 1,
        particles = [],
        time = 0;
    const mouse = {
        x: innerWidth * .72,
        y: innerHeight * .35,
        targetX: innerWidth * .72,
        targetY: innerHeight * .35,
        active: false
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
        const count = Math.max(45, Math.min(105, Math.floor(width * height / 15000)));
        particles = Array.from({
            length: count
        }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - .5) * .28,
            vy: (Math.random() - .5) * .28,
            size: Math.random() * 1.8 + .7,
            depth: Math.random() * .8 + .2,
            drawX: 0,
            drawY: 0
        }))
    }

    function draw() {
        time += .008;
        context.clearRect(0, 0, width, height);
        mouse.x += (mouse.targetX - mouse.x) * .075;
        mouse.y += (mouse.targetY - mouse.y) * .075;
        const shiftX = (mouse.x / Math.max(width, 1) - .5) * 70,
            shiftY = (mouse.y / Math.max(height, 1) - .5) * 70;
        context.beginPath();
        context.strokeStyle = "rgba(255,255,255,.055)";
        context.lineWidth = 1;
        const spacing = 70,
            gridX = (shiftX + time * 16) % spacing,
            gridY = (shiftY + time * 10) % spacing;
        for (let x = -spacing + gridX; x < width + spacing; x += spacing) {
            context.moveTo(x, 0);
            context.lineTo(x, height)
        }
        for (let y = -spacing + gridY; y < height + spacing; y += spacing) {
            context.moveTo(0, y);
            context.lineTo(width, y)
        }
        context.stroke();
        const glow = context.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 260);
        glow.addColorStop(0, "rgba(66,165,235,.22)");
        glow.addColorStop(.45, "rgba(66,165,235,.08)");
        glow.addColorStop(1, "rgba(66,165,235,0)");
        context.fillStyle = glow;
        context.fillRect(mouse.x - 260, mouse.y - 260, 520, 520);
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < -20) p.x = width + 20;
            if (p.x > width + 20) p.x = -20;
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;
            let dxp = p.x + shiftX * p.depth,
                dyp = p.y + shiftY * p.depth;
            const dx = dxp - mouse.x,
                dy = dyp - mouse.y,
                d = Math.hypot(dx, dy);
            if (mouse.active && d < 180 && d > .1) {
                const force = (180 - d) / 180;
                dxp += dx / d * force * 55;
                dyp += dy / d * force * 55
            }
            p.drawX = dxp;
            p.drawY = dyp;
            context.beginPath();
            context.arc(dxp, dyp, p.size, 0, Math.PI * 2);
            context.fillStyle = p.depth > .55 ? "rgba(83,177,243,.72)" : "rgba(255,255,255,.46)";
            context.fill()
        }
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i],
                    b = particles[j],
                    dx = a.drawX - b.drawX,
                    dy = a.drawY - b.drawY,
                    d = Math.hypot(dx, dy);
                if (d < 120) {
                    context.beginPath();
                    context.moveTo(a.drawX, a.drawY);
                    context.lineTo(b.drawX, b.drawY);
                    context.strokeStyle = `rgba(165,210,235,${.2*(1-d/120)})`;
                    context.lineWidth = .8;
                    context.stroke()
                }
            }
        }
        requestAnimationFrame(draw)
    }
    addEventListener("pointermove", e => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
        mouse.active = true
    });
    addEventListener("pointerleave", () => {
        mouse.active = false;
        mouse.targetX = width * .72;
        mouse.targetY = height * .35
    });
    addEventListener("resize", resizeCanvas);
    resizeCanvas();
    draw()
}
const REDWAVE_STATUS_API = "https://redwave-api.redwavedayz.workers.dev/status";
const ids = ["liveServerName", "serverStatus", "statusDot", "heroStatusDot", "heroServerStatus", "livePlayers", "livePlayersLarge", "heroPlayers", "liveMap", "liveTime", "liveUptime", "liveVersion", "liveRestart", "heroRestart", "liveMods", "liveLocation", "heroMap", "statusUpdated"];
const E = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

function setText(el, value, fallback = "Unknown") {
    if (el) el.textContent = value === undefined || value === null || value === "" ? fallback : String(value)
}

function statusAppearance(online) {
    [E.statusDot, E.heroStatusDot].forEach(dot => {
        if (!dot) return;
        dot.style.backgroundColor = online ? "#55d97b" : "#e05050";
        dot.style.boxShadow = online ? "0 0 8px rgba(85,217,123,.8)" : "0 0 8px rgba(224,80,80,.8)"
    });
    setText(E.serverStatus, online ? "Online" : "Offline");
    setText(E.heroServerStatus, online ? "Server online" : "Server offline")
}

function mapName(map) {
    return String(map || "").trim().toLowerCase() === "channel" ? "The Channel" : map || "Unknown"
}

function restartTime(value) {
    if (!value) return "Unknown";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    })
}

function locationName(location) {
    if (!location) return "Unknown";
    const parts = [location.city, location.region].filter(Boolean);
    return parts.length ? parts.join(", ") : location.country || "Unknown"
}

function playerCount(server) {
    return server.player_text || `${Number(server.players??0)} / ${Number(server.max_players??0)}`
}
async function updateServerStatus() {
    try {
        const response = await fetch(REDWAVE_STATUS_API, {
            cache: "no-store",
            headers: {
                Accept: "application/json"
            }
        });
        if (!response.ok) throw new Error(`Status API returned ${response.status}`);
        const data = await response.json();
        if (!data.success || !data.server) throw new Error(data.error || "Invalid response");
        const s = data.server,
            t = data.totals || {},
            online = s.online === true,
            players = playerCount(s),
            map = mapName(s.map),
            restart = restartTime(s.next_restart);
        statusAppearance(online);
        setText(E.liveServerName, s.name, "RedWave US Main");
        [E.livePlayers, E.livePlayersLarge, E.heroPlayers].forEach(el => setText(el, players));
        [E.liveMap, E.heroMap].forEach(el => setText(el, map));
        setText(E.liveTime, s.game_time);
        setText(E.liveUptime, s.uptime);
        setText(E.liveVersion, s.version);
        [E.liveRestart, E.heroRestart].forEach(el => setText(el, restart));
        setText(E.liveMods, t.mod_count, "0");
        setText(E.liveLocation, locationName(s.location));
        if (E.statusUpdated) {
            const now = new Date();
            E.statusUpdated.textContent = `Live data updated at ${now.toLocaleTimeString([],{hour:"numeric",minute:"2-digit",second:"2-digit"})}. Refreshes every 15 seconds.`
        }
    } catch (error) {
        console.error("Unable to load RedWave status:", error);
        setText(E.serverStatus, "Status unavailable");
        setText(E.heroServerStatus, "Status unavailable");
        [E.statusDot, E.heroStatusDot].forEach(dot => {
            if (dot) {
                dot.style.backgroundColor = "#e0a750";
                dot.style.boxShadow = "0 0 8px rgba(224,167,80,.8)"
            }
        });
        if (E.statusUpdated) E.statusUpdated.textContent = "Live status could not be loaded. The server may still be online."
    }
}
updateServerStatus();
setInterval(updateServerStatus, 15000);
