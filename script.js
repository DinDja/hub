const stage = document.querySelector(".paint-stage");
const frame = document.querySelector(".paint-frame");
const canvas = document.querySelector(".paint-canvas");
const context = canvas.getContext("2d");
const meter = document.querySelector(".scroll-meter-fill");
const progressBar = meter.parentElement;
const copy = document.querySelector(".paint-copy");

const palette = {
  navy: "#123477",
  blue: "#168bd0",
  sky: "#24a7df",
  red: "#e5233c",
  yellow: "#f0bd24",
  green: "#15945b",
  pink: "#e94f87",
};

const brushPresets = [
  { start: -0.04, first: 0.12, second: 0.02, end: 0.08, color: palette.navy, width: 0.23 },
  { start: 0.0275, first: -0.015, second: 0.115, end: 0.045, color: palette.sky, width: 0.27 },
  { start: -0.006, first: 0.08, second: -0.08, end: 0.02, color: palette.red, width: 0.29 },
  { start: 0.095, first: 0.02, second: 0.2, end: 0.14, color: palette.red, width: 0.23 },
  { start: 0.1625, first: 0.24, second: 0.11, end: 0.2, color: palette.yellow, width: 0.27 },
  { start: 0.129, first: 0.06, second: 0.24, end: 0.16, color: palette.green, width: 0.29 },
  { start: 0.23, first: 0.32, second: 0.17, end: 0.28, color: palette.blue, width: 0.23 },
  { start: 0.2975, first: 0.215, second: 0.34, end: 0.31, color: palette.pink, width: 0.27 },
  { start: 0.264, first: 0.34, second: 0.22, end: 0.29, color: palette.navy, width: 0.29 },
  { start: 0.365, first: 0.28, second: 0.43, end: 0.38, color: palette.yellow, width: 0.23 },
  { start: 0.4325, first: 0.48, second: 0.34, end: 0.44, color: palette.navy, width: 0.27 },
  { start: 0.399, first: 0.31, second: 0.51, end: 0.41, color: palette.sky, width: 0.29 },
  { start: 0.5, first: 0.58, second: 0.44, end: 0.47, color: palette.green, width: 0.23 },
  { start: 0.5675, first: 0.48, second: 0.64, end: 0.58, color: palette.blue, width: 0.27 },
  { start: 0.534, first: 0.62, second: 0.5, end: 0.55, color: palette.red, width: 0.29 },
  { start: 0.635, first: 0.56, second: 0.71, end: 0.64, color: palette.pink, width: 0.23 },
  { start: 0.7025, first: 0.78, second: 0.63, end: 0.71, color: palette.green, width: 0.27 },
  { start: 0.669, first: 0.58, second: 0.76, end: 0.68, color: palette.yellow, width: 0.29 },
  { start: 0.77, first: 0.86, second: 0.72, end: 0.75, color: palette.sky, width: 0.23 },
  { start: 0.8375, first: 0.75, second: 0.91, end: 0.85, color: palette.red, width: 0.27 },
  { start: 0.804, first: 0.88, second: 0.77, end: 0.82, color: palette.pink, width: 0.29 },
  { start: 0.905, first: 0.82, second: 0.98, end: 0.9, color: palette.navy, width: 0.23 },
  { start: 0.9725, first: 1.04, second: 0.9, end: 0.98, color: palette.yellow, width: 0.27 },
  { start: 0.939, first: 0.83, second: 1.01, end: 0.95, color: palette.blue, width: 0.29 },
  { start: 1.04, first: 0.94, second: 1.08, end: 0.98, color: palette.red, width: 0.23 },
  { start: 1.074, first: 1.15, second: 1.02, end: 1.04, color: palette.green, width: 0.29 },
];

let width = 0;
let height = 0;
let pixelRatio = 1;
let scrollProgress = -1;
let frameRequested = false;
let brushes = [];

function random(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function makeBrush(preset, index) {
  const brush = {
    ...preset,
    index,
    seed: 3287 + index * 1901,
    startX: width * preset.start,
    control1X: width * preset.first,
    control2X: width * preset.second,
    endX: width * preset.end,
    startY: height * 1.08,
    control1Y: height * 0.8,
    control2Y: height * 0.29,
    endY: -height * 0.06,
    width: Math.min(width * 0.23, height * preset.width),
    delay: index * (0.6 / (brushPresets.length - 1)),
    duration: 0.4,
  };

  brush.pointAt = (t) => {
    const inverse = 1 - t;
    const x = inverse ** 3 * brush.startX
      + 3 * inverse ** 2 * t * brush.control1X
      + 3 * inverse * t ** 2 * brush.control2X
      + t ** 3 * brush.endX;
    const y = inverse ** 3 * brush.startY
      + 3 * inverse ** 2 * t * brush.control1Y
      + 3 * inverse * t ** 2 * brush.control2Y
      + t ** 3 * brush.endY;
    const dx = 3 * inverse ** 2 * (brush.control1X - brush.startX)
      + 6 * inverse * t * (brush.control2X - brush.control1X)
      + 3 * t ** 2 * (brush.endX - brush.control2X);
    const dy = 3 * inverse ** 2 * (brush.control1Y - brush.startY)
      + 6 * inverse * t * (brush.control2Y - brush.control1Y)
      + 3 * t ** 2 * (brush.endY - brush.control2Y);
    const length = Math.hypot(dx, dy) || 1;
    return { x, y, nx: -dy / length, ny: dx / length };
  };

  return brush;
}

function pressureAt(t) {
  return 0.015 + 0.985 * Math.sin(Math.PI * t) ** 0.55;
}

function makeBrushTexture(brush) {
  const layer = document.createElement("canvas");
  layer.width = Math.ceil(width * pixelRatio);
  layer.height = Math.ceil(height * pixelRatio);
  const paint = layer.getContext("2d");
  paint.scale(pixelRatio, pixelRatio);
  const rand = random(brush.seed);
  const left = [];
  const right = [];

  for (let step = 0; step <= 150; step += 1) {
    const t = step / 150;
    const point = brush.pointAt(t);
    const halfWidth = brush.width * pressureAt(t) * 0.48;
    const edgeNoise = brush.width * 0.014;
    const leftNoise = (
      Math.sin(t * 283 + brush.seed) * 0.56
      + Math.sin(t * 607 + brush.seed * 0.4) * 0.28
      + (rand() - 0.5) * 0.5
    ) * edgeNoise;
    const rightNoise = (
      Math.sin(t * 317 + brush.seed * 0.7) * 0.52
      + Math.sin(t * 683 + brush.seed * 0.3) * 0.31
      + (rand() - 0.5) * 0.48
    ) * edgeNoise;
    left.push({
      x: point.x + point.nx * (halfWidth + leftNoise),
      y: point.y + point.ny * (halfWidth + leftNoise),
    });
    right.push({
      x: point.x - point.nx * (halfWidth + rightNoise),
      y: point.y - point.ny * (halfWidth + rightNoise),
    });
  }

  paint.beginPath();
  paint.moveTo(left[0].x, left[0].y);
  for (let index = 1; index < left.length; index += 1) {
    paint.lineTo(left[index].x, left[index].y);
  }
  for (let index = right.length - 1; index >= 0; index -= 1) {
    paint.lineTo(right[index].x, right[index].y);
  }
  paint.closePath();
  paint.globalAlpha = 0.1;
  paint.fillStyle = brush.color;
  paint.fill();

  const count = width < 700 ? 250 : 350;
  const steps = width < 700 ? 22 : 30;
  for (let strand = 0; strand < count; strand += 1) {
    const across = (strand + rand() * 0.8) / count * 2 - 1;
    const edge = Math.abs(across);
    const fade = 0.3 + 0.7 * (1 - edge ** 1.55);
    const dry = rand() < 0.44 + edge * 0.42;
    const from = dry ? rand() * 0.38 : rand() * 0.025;
    const to = dry ? 0.55 + rand() * 0.45 : 0.98 + rand() * 0.02;
    const lineWidth = (0.4 + rand() * 1.35) * (width < 700 ? 0.9 : 1);
    const shade = rand();
    const lineColor = shade < 0.035 ? "#fff9ec"
      : shade < 0.095 ? "#0e285b"
        : shade < 0.2 ? palette.sky
          : brush.color;
    const grain = 0.8 + rand() * 3.6;
    const wander = brush.width * (0.005 + rand() * 0.022);

    paint.beginPath();
    for (let step = 0; step <= steps; step += 1) {
      const t = from + (to - from) * step / steps;
      const point = brush.pointAt(t);
      const offset = across * brush.width * pressureAt(t) * 0.48;
      const rough = (
        Math.sin(t * 49 + strand * 2.7) * grain
        + Math.sin(t * 137 + strand * 1.3) * grain * 0.45
        + Math.sin(t * 263 + strand * 0.7) * grain * 0.18
        + Math.sin(t * 17 + strand) * wander
      ) * Math.max(0.14, fade);
      const x = point.x + point.nx * (offset + rough);
      const y = point.y + point.ny * (offset + rough);
      if (step === 0) paint.moveTo(x, y);
      else paint.lineTo(x, y);
    }

    paint.globalAlpha = (0.58 + rand() * 0.42) * fade;
    paint.strokeStyle = lineColor;
    paint.lineWidth = lineWidth;
    paint.lineCap = "butt";
    paint.lineJoin = "round";
    paint.stroke();
  }

  const flecks = width < 700 ? 28 : 48;
  for (let index = 0; index < flecks; index += 1) {
    const t = rand();
    const point = brush.pointAt(t);
    const spread = brush.width * (0.47 + rand() * 0.23);
    const side = rand() < 0.5 ? -1 : 1;
    const radius = 0.4 + rand() * 1.4;
    paint.globalAlpha = 0.12 + rand() * 0.36;
    paint.fillStyle = brush.color;
    paint.beginPath();
    paint.ellipse(
      point.x + point.nx * spread * side + (rand() - 0.5) * 8,
      point.y + point.ny * spread * side + (rand() - 0.5) * 8,
      radius * 1.7,
      radius * 0.7,
      rand() * Math.PI,
      0,
      Math.PI * 2,
    );
    paint.fill();
  }

  return layer;
}

function clipBrushPass(brush, amount) {
  const steps = Math.max(2, Math.ceil(amount * 110));
  const leftEdge = [];
  const rightEdge = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = amount * index / steps;
    const point = brush.pointAt(t);
    const halfWidth = brush.width * pressureAt(t) * 0.52;
    leftEdge.push({
      x: point.x + point.nx * halfWidth,
      y: point.y + point.ny * halfWidth,
    });
    rightEdge.push({
      x: point.x - point.nx * halfWidth,
      y: point.y - point.ny * halfWidth,
    });
  }

  context.beginPath();
  context.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let index = 1; index < leftEdge.length; index += 1) {
    context.lineTo(leftEdge[index].x, leftEdge[index].y);
  }

  const head = brush.pointAt(amount);
  const headSteps = 52;
  const headTangentX = head.ny;
  const headTangentY = -head.nx;
  for (let index = 0; index <= headSteps; index += 1) {
    const across = 1 - index / headSteps * 2;
    const seed = brush.seed + index * 127.1;
    const noise = Math.sin(seed * 78.233) * 43758.5453;
    const grain = (noise - Math.floor(noise) - 0.5) * 2;
    const rough = brush.width * (
      Math.sin(index * 0.23 + brush.seed) * 0.025
      + Math.sin(index * 0.61 + brush.seed * 0.37) * 0.025
      + Math.sin(index * 1.71 + brush.seed * 0.13) * 0.014
      + grain * 0.045
    );
    context.lineTo(
      head.x + head.nx * across * brush.width * pressureAt(amount) * 0.52
        + headTangentX * rough,
      head.y + head.ny * across * brush.width * pressureAt(amount) * 0.52
        + headTangentY * rough,
    );
  }

  for (let index = rightEdge.length - 1; index >= 0; index -= 1) {
    context.lineTo(rightEdge[index].x, rightEdge[index].y);
  }

  context.closePath();
  context.clip();
}

function render() {
  frameRequested = false;
  if (!width || !height || !brushes.length) return;

  const bounds = stage.getBoundingClientRect();
  const travel = Math.max(bounds.height - height, 1);
  const nextProgress = Math.max(0, Math.min(1, -bounds.top / travel));
  if (Math.abs(nextProgress - scrollProgress) < 0.0001) return;
  scrollProgress = nextProgress;
  context.clearRect(0, 0, width, height);
  for (const brush of brushes) {
    const brushProgress = (scrollProgress - brush.delay) / brush.duration;
    if (brushProgress <= 0) continue;

    context.save();
    clipBrushPass(brush, Math.min(1, brushProgress));
    context.drawImage(brush.layer, 0, 0, width, height);
    context.restore();
  }

  meter.style.transform = `scaleX(${scrollProgress})`;
  progressBar.setAttribute("aria-valuenow", String(Math.round(scrollProgress * 100)));
  copy.style.opacity = String(1 - Math.min(Math.max(0, scrollProgress - 0.08) * 3.7, 1));

  for (const word of document.querySelectorAll(".painted-word")) {
    const start = Number(word.dataset.start);
    const reveal = Math.max(0, Math.min(1, (scrollProgress - start) / 0.2));
    word.style.clipPath = `inset(0 0 ${(1 - reveal) * 100}% 0)`;
  }
}

function revealToolSections() {
  const sections = document.querySelectorAll(".tool-section");
  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      activeObserver.unobserve(entry.target);
    }
  }, { threshold: 0.2 });

  sections.forEach((section) => observer.observe(section));
}

function requestRender() {
  if (frameRequested) return;
  frameRequested = true;
  window.requestAnimationFrame(render);
}

function resize() {
  const bounds = frame.getBoundingClientRect();
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
  width = bounds.width;
  height = bounds.height;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  brushes = brushPresets.map(makeBrush);
  for (const brush of brushes) {
    brush.layer = makeBrushTexture(brush);
  }
  scrollProgress = -1;
  render();
}

window.addEventListener("scroll", requestRender, { passive: true });
window.addEventListener("resize", resize);
resize();
revealToolSections();
