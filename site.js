(() => {
  "use strict";

  const GOLD = [255, 201, 4];
  const BLACK = [17, 24, 39];
  const MUTED = [191, 191, 191];
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const HOME = { code: "MCO", tz: "America/New_York", lat: 28.4312, lon: -81.3081 };
  const AIRPORTS = [
    HOME,
    { code: "MIA", tz: "America/New_York", lat: 25.7959, lon: -80.287 },
    { code: "TPA", tz: "America/New_York", lat: 27.9755, lon: -82.5332 },
    { code: "JFK", tz: "America/New_York", lat: 40.6413, lon: -73.7781 },
    { code: "BOS", tz: "America/New_York", lat: 42.3656, lon: -71.0096 },
    { code: "ATL", tz: "America/New_York", lat: 33.6407, lon: -84.4277 },
    { code: "ORD", tz: "America/Chicago", lat: 41.9742, lon: -87.9073 },
    { code: "DFW", tz: "America/Chicago", lat: 32.8998, lon: -97.0403 },
    { code: "IAH", tz: "America/Chicago", lat: 29.9902, lon: -95.3368 },
    { code: "DEN", tz: "America/Denver", lat: 39.8561, lon: -104.6737 },
    { code: "PHX", tz: "America/Phoenix", lat: 33.4373, lon: -112.0078 },
    { code: "LAX", tz: "America/Los_Angeles", lat: 33.9416, lon: -118.4085 },
    { code: "SFO", tz: "America/Los_Angeles", lat: 37.6213, lon: -122.379 },
    { code: "SEA", tz: "America/Los_Angeles", lat: 47.4502, lon: -122.3088 },
    { code: "YYZ", tz: "America/Toronto", lat: 43.6777, lon: -79.6248 },
    { code: "LHR", tz: "Europe/London", lat: 51.47, lon: -0.4543 },
    { code: "CDG", tz: "Europe/Paris", lat: 49.0097, lon: 2.5479 },
    { code: "FRA", tz: "Europe/Berlin", lat: 50.0379, lon: 8.5622 },
    { code: "AMS", tz: "Europe/Amsterdam", lat: 52.3105, lon: 4.7683 },
    { code: "DXB", tz: "Asia/Dubai", lat: 25.2532, lon: 55.3657 },
    { code: "DEL", tz: "Asia/Kolkata", lat: 28.5562, lon: 77.1 },
    { code: "BOM", tz: "Asia/Kolkata", lat: 19.0896, lon: 72.8656 },
    { code: "BLR", tz: "Asia/Kolkata", lat: 13.1986, lon: 77.7066 },
    { code: "MAA", tz: "Asia/Kolkata", lat: 12.9941, lon: 80.1709 },
    { code: "SIN", tz: "Asia/Singapore", lat: 1.3644, lon: 103.9915 },
    { code: "NRT", tz: "Asia/Tokyo", lat: 35.772, lon: 140.3929 },
    { code: "ICN", tz: "Asia/Seoul", lat: 37.4602, lon: 126.4407 },
    { code: "SYD", tz: "Australia/Sydney", lat: -33.9399, lon: 151.1753 },
  ];
  const TZ_FALLBACK = {
    "America/New_York": "JFK",
    "America/Detroit": "DTW",
    "America/Chicago": "ORD",
    "America/Denver": "DEN",
    "America/Los_Angeles": "LAX",
    "America/Phoenix": "PHX",
    "America/Toronto": "YYZ",
    "Europe/London": "LHR",
    "Europe/Paris": "CDG",
    "Europe/Berlin": "FRA",
    "Europe/Amsterdam": "AMS",
    "Asia/Kolkata": "BLR",
    "Asia/Calcutta": "BLR",
    "Asia/Dubai": "DXB",
    "Asia/Singapore": "SIN",
    "Asia/Tokyo": "NRT",
    "Asia/Seoul": "ICN",
    "Australia/Sydney": "SYD",
  };
  const PAGES = [
    "home",
    "about",
    "research",
    "publications",
    "presentations",
    "projects",
    "virtual-reality",
    "machine-learning",
    "web-development",
    "cv",
    "contact",
  ];
  const EXPLORE_KEY = "rn-explore";
  const ARC_LEN = 2 * Math.PI * 15.5;

  const pageId = (() => {
    const file = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/i, "");
    return !file || file === "index" ? "home" : file;
  })();

  const state = {
    mx: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    my: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
    nx: 0,
    ny: 0,
    tx: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    ty: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
    started: Date.now(),
    visitor: nearestFromTimeZone(),
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatTime(date, tz) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || "00";
    return `${get("hour")}:${get("minute")}:${get("second")}`;
  }

  function gmtOffset(tz) {
    const str = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).format(new Date());
    const match = str.match(/GMT[+\-]\d+(?::\d+)?/);
    return match ? match[0] : "";
  }

  function nearestFromTimeZone() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || HOME.tz;
    if (tz === HOME.tz) return { code: "UTC", tz: "UTC" };
    const code = TZ_FALLBACK[tz];
    const hit = AIRPORTS.find((a) => a.code === code);
    if (hit) return hit;
    return { code: "LOC", tz };
  }

  function lerpColor(stops, t) {
    const x = Math.min(1, Math.max(0, t));
    let i = 0;
    while (i < stops.length - 2 && x > stops[i + 1][0]) i += 1;
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    const u = t1 === t0 ? 0 : (x - t0) / (t1 - t0);
    const rgb = c0.map((v, idx) => Math.round(v + (c1[idx] - v) * u));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  function loadExplore() {
    try {
      return JSON.parse(localStorage.getItem(EXPLORE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveExplore(map) {
    try {
      localStorage.setItem(EXPLORE_KEY, JSON.stringify(map));
    } catch {
      /* ignore quota */
    }
  }

  function scrollProgress() {
    const el = document.scrollingElement || document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return 1;
    return Math.min(1, Math.max(0, el.scrollTop / max));
  }

  function explorationScore(map) {
    const share = 1 / PAGES.length;
    let total = 0;
    for (const id of PAGES) total += (Number(map[id]) || 0) * share;
    return Math.min(1, total);
  }

  function pageTitleYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function injectChrome() {
    if (!document.querySelector(".spatial-field") && !REDUCE) {
      const canvas = document.createElement("canvas");
      canvas.className = "spatial-field";
      canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(canvas);
    }

    if (document.querySelector(".hud")) return;

    const hud = document.createElement("div");
    hud.className = "hud";
    hud.innerHTML = `
      <div class="hud-clocks" aria-hidden="true">
        <div class="hud-clock">
          <span class="hud-code" id="hud-home-code">${HOME.code}</span>
          <span class="hud-time" id="hud-home-time">00:00:00</span>
          <span class="hud-offset" id="hud-home-off"></span>
        </div>
        <div class="hud-clock">
          <span class="hud-code" id="hud-vis-code">${state.visitor.code}</span>
          <span class="hud-time" id="hud-vis-time">00:00:00</span>
          <span class="hud-offset" id="hud-vis-off"></span>
        </div>
      </div>
      <div class="hud-readout">
        <div class="hud-session" aria-hidden="true"><span id="hud-session">00:00</span> · <span id="hud-explored">00%</span></div>
        <div class="hud-xy" aria-hidden="true">
          <span>X<b id="hud-x">0.0000</b></span>
          <span>Y<b id="hud-y">0.0000</b></span>
        </div>
        <button class="hud-top" id="hud-top" type="button" aria-label="Back to top">
          <svg viewBox="0 0 36 36">
            <circle class="hud-track" cx="18" cy="18" r="15.5"></circle>
            <circle class="hud-arc" id="hud-arc" cx="18" cy="18" r="15.5"
              stroke-dasharray="${ARC_LEN.toFixed(2)}" stroke-dashoffset="${ARC_LEN.toFixed(2)}"></circle>
          </svg>
          <span>↑</span>
        </button>
      </div>
    `;
    document.body.appendChild(hud);

    if (FINE && !REDUCE) {
      const ring = document.createElement("div");
      ring.className = "cursor-ring";
      ring.setAttribute("aria-hidden", "true");
      document.body.appendChild(ring);
    }

    const top = document.getElementById("hud-top");
    top?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: REDUCE ? "auto" : "smooth" });
    });
  }

  function tickClocks() {
    const now = new Date();
    const homeTime = document.getElementById("hud-home-time");
    const visTime = document.getElementById("hud-vis-time");
    const homeOff = document.getElementById("hud-home-off");
    const visOff = document.getElementById("hud-vis-off");
    if (homeTime) homeTime.textContent = formatTime(now, HOME.tz);
    if (visTime) visTime.textContent = formatTime(now, state.visitor.tz);
    if (homeOff) homeOff.textContent = gmtOffset(HOME.tz);
    if (visOff) visOff.textContent = gmtOffset(state.visitor.tz);

    const elapsed = Math.floor((Date.now() - state.started) / 1000);
    const session = document.getElementById("hud-session");
    if (session) session.textContent = `${pad(Math.floor(elapsed / 60))}:${pad(elapsed % 60)}`;
  }

  function updateHud() {
    const x = document.getElementById("hud-x");
    const y = document.getElementById("hud-y");
    if (x) x.textContent = state.nx.toFixed(4);
    if (y) y.textContent = state.ny.toFixed(4);

    const depth = scrollProgress();
    const map = loadExplore();
    const prev = Number(map[pageId]) || 0;
    if (depth > prev + 0.02 || (depth >= 0.99 && prev < 1)) {
      map[pageId] = Math.max(prev, depth);
      saveExplore(map);
    }
    const explored = explorationScore({ ...map, [pageId]: Math.max(prev, depth) });

    const arc = document.getElementById("hud-arc");
    const top = document.getElementById("hud-top");
    const label = document.getElementById("hud-explored");
    const color = lerpColor(
      [
        [0, MUTED],
        [0.2, GOLD],
        [0.65, GOLD],
        [1, BLACK],
      ],
      explored
    );
    if (arc) {
      arc.style.strokeDashoffset = String(ARC_LEN * (1 - depth));
      arc.style.stroke = color;
    }
    if (top) top.style.color = color;
    if (label) label.textContent = `${Math.round(explored * 100).toString().padStart(2, "0")}%`;
  }

  function bindPointer() {
    window.addEventListener(
      "pointermove",
      (e) => {
        state.tx = e.clientX;
        state.ty = e.clientY;
        state.nx = (e.clientX / window.innerWidth) * 2 - 1;
        state.ny = (e.clientY / window.innerHeight) * 2 - 1;
        const x = document.getElementById("hud-x");
        const y = document.getElementById("hud-y");
        if (x) x.textContent = state.nx.toFixed(4);
        if (y) y.textContent = state.ny.toFixed(4);
      },
      { passive: true }
    );

    const ring = document.querySelector(".cursor-ring");
    if (ring) {
      document.addEventListener("pointerover", (e) => {
        const link = e.target.closest("a, button, .card, .nav-link");
        ring.classList.toggle("is-link", Boolean(link));
      });
      document.addEventListener("pointerdown", () => ring.classList.add("is-press"));
      document.addEventListener("pointerup", () => ring.classList.remove("is-press"));
    }
  }

  function enhanceCards() {
    const cards = document.querySelectorAll(".card, .hero-card");
    cards.forEach((card, i) => {
      if (!card.hasAttribute("data-reveal")) {
        card.setAttribute("data-reveal", "");
        card.style.transitionDelay = `${Math.min(i * 0.05, 0.25)}s`;
      }
      if (!FINE || REDUCE) return;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        const rx = (0.5 - py) * 6;
        const ry = (px - 0.5) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });

    document.querySelectorAll(".hero").forEach((el) => {
      if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "");
    });

    if (REDUCE) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
  }

  function magneticNav() {
    if (!FINE || REDUCE) return;
    document.querySelectorAll(".nav-link, .btn").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / 8;
        const dy = (e.clientY - (r.top + r.height / 2)) / 8;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  function startField() {
    const canvas = document.querySelector(".spatial-field");
    if (!canvas || REDUCE) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    const particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let grid;
    let running = true;
    let last = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      grid = document.createElement("canvas");
      grid.width = canvas.width;
      grid.height = canvas.height;
      const g = grid.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.strokeStyle = "rgba(0,0,0,0.035)";
      g.lineWidth = 1;
      const step = 56;
      g.beginPath();
      for (let x = 0; x <= width; x += step) {
        g.moveTo(x, 0);
        g.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += step) {
        g.moveTo(0, y);
        g.lineTo(width, y);
      }
      g.stroke();
      for (let y = 0; y < height; y += 4) {
        g.fillStyle = "rgba(0,0,0,0.02)";
        g.fillRect(0, y, width, 1);
      }
    }

    function seed() {
      const count = width < 700 ? 42 : 78;
      particles.length = 0;
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.4 + 0.5,
        });
      }
    }

    function frame(ts) {
      if (!running) return;
      if (ts - last < 14) {
        requestAnimationFrame(frame);
        return;
      }
      last = ts;
      state.mx += (state.tx - state.mx) * 0.12;
      state.my += (state.ty - state.my) * 0.12;

      ctx.clearRect(0, 0, width, height);
      if (grid) ctx.drawImage(grid, 0, 0, width, height);

      const glow = ctx.createRadialGradient(state.mx, state.my, 0, state.mx, state.my, 220);
      glow.addColorStop(0, "rgba(255,201,4,0.10)");
      glow.addColorStop(1, "rgba(255,201,4,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const dx = p.x - state.mx;
        const dy = p.y - state.my;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 160) {
          p.vx += (dx / dist) * 0.012;
          p.vy += (dy / dist) * 0.012;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.992;
        p.vy *= 0.992;
        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;
        if (p.y < -8) p.y = height + 8;
        if (p.y > height + 8) p.y = -8;
      }

      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 110) {
            ctx.strokeStyle = `rgba(255,201,4,${(1 - d / 110) * 0.28})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "rgba(0,0,0,0.28)";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,201,4,0.55)";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      const ring = document.querySelector(".cursor-ring");
      if (ring) {
        ring.style.transform = `translate(${state.mx}px, ${state.my}px)`;
        ring.classList.add("is-on");
      }

      requestAnimationFrame(frame);
    }

    resize();
    seed();
    window.addEventListener("resize", () => {
      resize();
      seed();
    });
    document.addEventListener("visibilitychange", () => {
      running = document.visibilityState !== "hidden";
      if (running) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }

  function init() {
    document.documentElement.classList.add("js-ready");
    pageTitleYear();
    injectChrome();
    bindPointer();
    enhanceCards();
    magneticNav();
    tickClocks();
    updateHud();
    setInterval(tickClocks, 1000);
    window.addEventListener("scroll", updateHud, { passive: true });
    document.querySelector(".hud")?.classList.add("is-on");
    if (!REDUCE) startField();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
