let video;
let pg; // createGraphics layer
let bubbles = [];
const NUM_BUBBLES = 30;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 建立攝影機視訊
  video = createCapture(VIDEO);
  video.hide();

  // 等 video metadata 載入後建立 Graphics 層和泡泡
  video.elt.addEventListener('loadedmetadata', () => {
    pg = createGraphics(video.width, video.height);
    for (let i = 0; i < NUM_BUBBLES; i++) {
      bubbles.push(new Bubble(video.width, video.height));
    }
  });

  // 建立截圖按鈕
  let btn = createButton('📸 截圖儲存');
  btn.style('position', 'absolute');
  btn.style('bottom', '30px');
  btn.style('left', '50%');
  btn.style('transform', 'translateX(-50%)');
  btn.style('padding', '12px 28px');
  btn.style('font-size', '16px');
  btn.style('background', '#c77dff');
  btn.style('color', 'white');
  btn.style('border', 'none');
  btn.style('border-radius', '30px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 4px 15px rgba(199,125,255,0.5)');
  btn.mousePressed(captureImage);
}

function draw() {
  background('#e7c6ff');

  let vw = width * 0.6;
  let vh = height * 0.6;
  let vx = (width - vw) / 2;
  let vy = (height - vh) / 2;

  if (video.width === 0 || !pg) return;

  // ── 更新泡泡 ──
  for (let b of bubbles) b.update();

  // ── 繪製 createGraphics 覆蓋層（泡泡）──
  pg.clear();
  for (let b of bubbles) b.draw(pg);

  // ── 繪製視訊（修正左右顛倒）──
  push();
  translate(vx + vw, vy);
  scale(-1, 1);

  // 馬賽克黑白效果
  drawMosaic(0, 0, vw, vh);

  // 疊上 Graphics 層（泡泡）
  image(pg, 0, 0, vw, vh);

  pop();
}

// ── 馬賽克黑白效果 ──
function drawMosaic(x, y, vw, vh) {
  let cols = 20;
  let rows = 20;
  let cellW = vw / cols;
  let cellH = vh / rows;

  // 用臨時 Graphics 取得 pixel 資料
  let tmp = createGraphics(vw, vh);
  tmp.image(video, 0, 0, vw, vh);
  tmp.loadPixels();

  noStroke();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // 取單元格中心點 pixel
      let px = floor(col * cellW + cellW / 2);
      let py = floor(row * cellH + cellH / 2);
      let idx = (py * floor(vw) + px) * 4;
      let r = tmp.pixels[idx];
      let g = tmp.pixels[idx + 1];
      let b = tmp.pixels[idx + 2];
      let gray = (r + g + b) / 3;

      fill(gray);
      rect(x + col * cellW, y + row * cellH, cellW + 1, cellH + 1);
    }
  }
  tmp.remove();
}

// ── 截圖功能 ──
function captureImage() {
  let vw = width * 0.6;
  let vh = height * 0.6;
  let vx = (width - vw) / 2;
  let vy = (height - vh) / 2;

  // 擷取視訊畫面區域存為 jpg
  let cap = createGraphics(vw, vh);

  // 鏡像繪製馬賽克
  cap.push();
  cap.translate(vw, 0);
  cap.scale(-1, 1);

  let cols = 20, rows = 20;
  let cellW = vw / cols;
  let cellH = vh / rows;
  let tmp = createGraphics(vw, vh);
  tmp.image(video, 0, 0, vw, vh);
  tmp.loadPixels();

  cap.noStroke();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let px = floor(col * cellW + cellW / 2);
      let py = floor(row * cellH + cellH / 2);
      let idx = (py * floor(vw) + px) * 4;
      let r = tmp.pixels[idx];
      let g = tmp.pixels[idx + 1];
      let b = tmp.pixels[idx + 2];
      let gray = (r + g + b) / 3;
      cap.fill(gray);
      cap.rect(col * cellW, row * cellH, cellW + 1, cellH + 1);
    }
  }
  tmp.remove();

  // 疊上泡泡層
  cap.image(pg, 0, 0, vw, vh);
  cap.pop();

  cap.canvas.toBlob(blob => {
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'snapshot.jpg';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.92);

  cap.remove();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ── 泡泡類別 ──
class Bubble {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.reset();
  }

  reset() {
    this.x = random(this.w);
    this.y = random(this.h, this.h * 1.5);
    this.r = random(8, 28);
    this.speed = random(0.5, 2);
    this.alpha = random(120, 200);
    this.wobble = random(TWO_PI);
    this.wobbleSpeed = random(0.02, 0.06);
  }

  update() {
    this.y -= this.speed;
    this.wobble += this.wobbleSpeed;
    this.x += sin(this.wobble) * 0.6;
    if (this.y < -this.r * 2) this.reset();
  }

  draw(g) {
    g.noFill();
    g.stroke(255, 255, 255, this.alpha);
    g.strokeWeight(1.5);
    g.ellipse(this.x, this.y, this.r * 2);

    // 高光
    g.stroke(255, 255, 255, this.alpha * 0.6);
    g.strokeWeight(1);
    g.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.6, this.r * 0.6, PI + QUARTER_PI, TWO_PI);
  }
}