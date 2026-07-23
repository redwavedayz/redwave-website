const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");
const toast = document.getElementById("toast");

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

document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      toast.textContent = `${value} copied`;
    } catch {
      toast.textContent = `Server IP: ${value}`;
    }
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  });
});

document.getElementById("year").textContent = new Date().getFullYear();


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
    backgroundCanvas.style.width = width + "px";
    backgroundCanvas.style.height = height + "px";

    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(45, Math.min(110, Math.floor((width * height) / 14000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: Math.random() * 1.8 + 0.7,
      depth: Math.random() * 0.8 + 0.2
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

    for (let x = -spacing + gridX; x < width + spacing; x += spacing) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }
    for (let y = -spacing + gridY; y < height + spacing; y += spacing) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }
    context.stroke();

    // Cursor spotlight
    const glow = context.createRadialGradient(
      mouse.x, mouse.y, 0,
      mouse.x, mouse.y, 260
    );
    glow.addColorStop(0, "rgba(66,165,235,0.22)");
    glow.addColorStop(0.45, "rgba(66,165,235,0.08)");
    glow.addColorStop(1, "rgba(66,165,235,0)");
    context.fillStyle = glow;
    context.fillRect(mouse.x - 260, mouse.y - 260, 520, 520);

    // Particles
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
      context.fillStyle = particle.depth > 0.55
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
          context.strokeStyle = `rgba(165,210,235,${0.20 * (1 - distance / 120)})`;
          context.lineWidth = 0.8;
          context.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("pointermove", (event) => {
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
