// Hand Pose Detection with ml5.js + 馬賽克黑白 + 泡泡 + 截圖
let video;
let handPose;
let hands = [];
let pg;
let bubbles = [];
const NUM_BUBBLES = 30;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  handPose.detectStart(video, gotHands);

  video.elt.addEventListener('loadedmetadata', () => {
    pg = createGraphics(video.width, video.height);
    for (let i = 0; i < NUM_BUBBLES; i++) {
      bubbles.push(new Bubble(video.width, video.height));
    }
  });

  // 截圖按鈕
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

  // 更新泡泡
  for (let b of bubbles) b.update();

  // 繪製泡泡到 graphics 層
  pg.clear();
  for (let b of bubbles) b.draw(pg);

  push();
  translate(vx, vy);

  // 馬賽克黑白效果
  drawMosaic(0, 0, vw, vh);

  // 疊上泡泡層
  image(pg, 0, 0, vw, vh);

  // 縮放比例（video 座標 → 顯示座標）
  let scaleX = vw / video.width;
  let scaleY = vh / video.height;

  // 繪製手部關鍵點
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let i = 0; i < hand.keypoints.length; i++) {
          let kp = hand.keypoints[i];
          if (hand.handedness === 'Left') {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }
          noStroke();
          circle(kp.x * scaleX, kp.y * scaleY, 16);
        }
      }
    }
  }

  pop();
}

// ── 馬賽克黑白 ──
function drawMosaic(x, y, vw, vh) {
  let cols = 20;
  let rows = 20;
  let cellW = vw / cols;
  let cellH = vh / rows;

  let tmp = createGraphics(vw, vh);
  tmp.image(video, 0, 0, vw, vh);
  tmp.loadPixels();

  noStroke();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
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

// ── 截圖 ──
function captureImage() {
  let vw = width * 0.6;
  let vh = height * 0.6;

  let cap = createGraphics(vw, vh);
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

  cap.image(pg, 0, 0, vw, vh);

  // 手部關鍵點也畫進截圖
  let scaleX = vw / video.width;
  let scaleY = vh / video.height;
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let kp of hand.keypoints) {
          cap.noStroke();
          cap.fill(hand.handedness === 'Left' ? color(255, 0, 255) : color(255, 255, 0));
          cap.circle(kp.x * scaleX, kp.y * scaleY, 16);
        }
      }
    }
  }

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

function mousePressed() {
  console.log(hands);
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
    g.stroke(255, 255, 255, this.alpha * 0.6);
    g.strokeWeight(1);
    g.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.6, this.r * 0.6, PI + QUARTER_PI, TWO_PI);
  }
}
