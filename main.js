const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const typebox = document.getElementById('typebox');
const clearbtn = document.getElementById('clearbtn');

const W = 680;
const H = 340;
canvas.width = W;
canvas.height = H;

const VOWELS = new Set(['a','e','i','o','u']);

const PALETTE = {
  stems: ['#4a7c59','#3b6e4a','#5a8a69','#2d5c3a'],
  leaves: ['#6aab7a','#8dc98e','#a3d4a0','#5e9e6e','#7fbe8f','#b5ddb0'],
  flowers: ['#e85d8a','#f4a261','#e76f51','#9b5de5','#f15bb5','#fee440','#00bbf9','#d62828'],
  flowerCenter: ['#ffd166','#fffbe6','#fff','#ffa500']
};

let plants = [];
let lastTime = Date.now();
let charCount = 0;
let totalStems = 0;
let totalLeaves = 0;
let totalFlowers = 0;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rnd(a, b) {
  return a + Math.random() * (b - a);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

class Segment {
  constructor(x, y, angle, len, thick, color, depth) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.len = len;
    this.thick = thick;
    this.color = color;
    this.depth = depth;
    this.ex = x + Math.cos(angle) * len;
    this.ey = y + Math.sin(angle) * len;
    this.children = [];
    this.leaves = [];
    this.flower = null;
  }
}

class Plant {
  constructor(x) {
    this.x = x;
    this.root = null;
    this.tips = [];
    this.letterFreq = {};
    this.stemColor = pick(PALETTE.stems);
    this.leafColor = pick(PALETTE.leaves);
    this.flowerColor = pick(PALETTE.flowers);
    this.flowerCenter = pick(PALETTE.flowerCenter);
    this.init();
  }

  init() {
    const baseY = H - 28;
    const angle = -Math.PI / 2 + rnd(-0.08, 0.08);
    this.root = new Segment(this.x, baseY, angle, rnd(28, 38), 5, this.stemColor, 0);
    this.tips = [this.root];
    totalStems++;
  }

  grow(ch, speed) {
    if (!this.tips.length) return;
    this.letterFreq[ch] = (this.letterFreq[ch] || 0) + 1;

    const isVowel = VOWELS.has(ch.toLowerCase());
    const isSpace = ch === ' ';
    const freq = this.letterFreq[ch] || 1;

    const tip = this.tips[Math.floor(Math.random() * this.tips.length)];

    if (isSpace || (tip.depth > 2 && Math.random() < 0.4)) {
      this.branch(tip);
    } else if (isVowel && Math.random() < 0.7) {
      if (!tip.flower) {
        tip.flower = {
          x: tip.ex,
          y: tip.ey,
          r: clamp(4 + freq * 0.8, 5, 14),
          color: this.flowerColor,
          center: this.flowerCenter,
          petals: 5 + Math.floor(freq / 2),
          rot: Math.random() * Math.PI
        };
        totalFlowers++;
      }
    } else {
      this.extend(tip, speed, freq);
    }

    if (Math.random() < 0.5) this.addLeaf(tip);
  }

  extend(tip, speed, freq) {
    const wobble = rnd(-0.18, 0.18);
    const newAngle = tip.angle + wobble;
    const baseLen = clamp(20 + speed * 0.4 + freq * 1.5, 14, 48);
    const len = rnd(baseLen * 0.8, baseLen * 1.2);
    const thick = Math.max(1, tip.thick - 0.6);
    const child = new Segment(tip.ex, tip.ey, newAngle, len, thick, this.stemColor, tip.depth + 1);
    tip.children.push(child);
    const idx = this.tips.indexOf(tip);
    if (idx !== -1) this.tips.splice(idx, 1, child);
    totalStems++;
  }

  branch(tip) {
    if (tip.depth > 8) return;
    const spread = rnd(0.3, 0.7);
    const angles = [tip.angle - spread, tip.angle + spread];
    const newTips = [];
    for (const angle of angles) {
      const len = rnd(18, 32);
      const thick = Math.max(1, tip.thick - 1);
      const child = new Segment(tip.ex, tip.ey, angle, len, thick, this.stemColor, tip.depth + 1);
      tip.children.push(child);
      newTips.push(child);
      totalStems++;
    }
const idx= this.tips.indexOf(tip);
if (idx !== -1) this.tips.splice(idx, 1, ...newTips);
  }
  addLeaf(seg){
    const t = rnd(0.3, 0.9);
    const bx = seg.x + Math.cos(seg.angle) * seg.len * t;
    const by = seg.y + Math.sin(seg.angle) * seg.len *t;
    const side = Math.random() < 0.5 ? 1: -1;
    const lAngle = seg.angle + side * rnd(0.6, 1.2);
    const lLen = rnd(12, 26);
    seg.leaves.push({
      x: bx, 
      y: by,
      angle: lAngle,
      len: lLen,
      color: this.leafColor
    });
    totalFlowers.leafColor ++;
  }
  draw(){
    this.drawSeg(this.root);
  }
  drawSeg(seg){
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = seg.thick;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(seg.x, seg.y);
    ctx.lineTo(seg.ex, seg.ey);
    ctx.stroke();
    for (const leaf of seg.leaves) this.drawLeaf(leaf);
    if (seg.flower) this.drawFlower(seg.flower);
    for (const leaf of seg.leaves) this.drawLeaf(leaf);
    if (seg.flower) this.drawFlower(seg.flower);
    for (const child of seg.children) this.drawSeg(child);
  }
  drawLeaf(leaf){
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle);
    ctx.fillStyle = leaf.color;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.ellipse(leaf.len * 0.5, 0, leaf.len * 0.5, leaf.len * 0.18, 0,0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  drawFlower(f){
    ctx.save();
    ctx.translate(f.x, f.y);
    for (let i = 0; i < f.petals; i++){
      ctx.save();
      ctx.rotate(f.rot + (i / f.petals)* Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(f.r * 1.1, 0, f.r * 0.55, f.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    ctx.fillStyle = f.center;
    ctx.beginPath();
    ctx.arc(0, 0, f.r * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
function shiftPlant(seg, dx){
  seg.x += dx;
  seg.ex += dx;
  if (seg.flower) {seg.flower.x += dx;}
 for (const l of seg.leaves) l.x += dx;
 for (const c of seg.children) shiftPlant(c, dx);
}
function redistributePlants(){
  plants.forEach((p, i)=>{
    const nx = getPlantX(i, plants.length);
    const dx = nx - p.x;
    if (Math.abs(dx) > 1) shiftPlant (p.root,dx);
    p.x = nx;
  });
}
function drawBackground(){
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0d1f17');
  g.addColorStop(1, '#1a3328');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1a2e22';
  ctx.beginPath();
  ctx.ellipse(W/2, H - 10, W * 0.55, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(0, H - 18, W, 18);
}
function updateStats(){
  document.getElementById('sc').textContent = totalStems;
  documnet.getElementById('lc').textContent = totalLeaves;
  document.getElementById('fc').textContent = totalFlowers;
  document.getElementById('cc').textContent = charCount;
}
function render(){
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  for (const plant of plants) p.draw();
  updateStats();
}
let prevLen = 0;

typebox.addEventListener('input', () => {
  const val = typebox.value;
  const now = Date.now();
  const dt = now - lastTime;
  const speed = clamp(1000 / (dt + 1), 0, 20);
  lastTime = now;

  if (val.length < prevLen) {
    prevLen = val.length;
    return;
  }
const newChars = val.slice(prevLen);
prevLen = val.length;
for (const ch of newChars){
  charCount++;
  if (ch === '\n'){
    plants.push(new Plant(0));
    redistributePlants();
    continue;
  }
  if (plants.length ===0){
    plants.push(new Plant(W/2));
  }
  const target = plants[plants.length - 1];
  target.grow(ch, speed);
}
render();
});
clearbtn.addEventListener('click', () => {
  plants = [];
  totalStems = 0;
  totalLeaves = 0;
  totalFlowers = 0;
  charCount = 0;
  typebox.value = '';
  prevLen = 0;
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  updateStats();
})
drawBackground();
typebox.focus();