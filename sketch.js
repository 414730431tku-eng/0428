// Hand Pose Detection with ml5.js
let video;
let handPose;
let hands = [];

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function gotHands(results) {
  hands = results;
}

function mousePressed() {
  console.log(hands);
}

function setup() {
  createCanvas(640, 480);

  // 用最基本的寫法，不帶第二個參數
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // 等影像準備好再開始偵測
  video.elt.onloadedmetadata = () => {
    handPose.detectStart(video, gotHands);
  };
}

function draw() {
  // 鏡像翻轉顯示（translate + scale）
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // 畫關鍵點
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }
          noStroke();
          circle(keypoint.x, keypoint.y, 16);
        }
      }
    }
  }
}
