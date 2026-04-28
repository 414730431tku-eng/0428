// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

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

  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();

  handPose.detectStart(video, gotHands);
}

function draw() {
  image(video, 0, 0, width, height);

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
