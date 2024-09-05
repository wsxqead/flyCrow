const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const easyButton = document.getElementById("easyButton");
const mediumButton = document.getElementById("mediumButton");
const hardButton = document.getElementById("hardButton");
const difficultyButtons = document.getElementById("difficultyButtons");
const scoreDisplay = document.getElementById("score");

// 화면 크기에 따라 캔버스 크기 조절
function resizeCanvas() {
  if (window.innerWidth > 768) {
    canvas.width = 480;
    canvas.height = 640;
  } else {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 난이도에 따른 설정 변수
let pipeSpeed = 1; // 초반 속도
let pipeGap = 150; // 초기 세로 간격을 줄임
const minPipeGap = 120; // 최소 파이프 세로 간격
let pipeWidth = 30; // 파이프 두께
let pipeMinSpacing = 200; // 파이프 가로 간격 최소값
let pipeMaxSpacing = 300; // 파이프 가로 간격 최대값
let score = 0; // 초기 점수
let scoreIncrement = 10; // 점수 증가량 초기화
let nextDifficultyScore = 500; // 다음 난이도 증가 기준 점수

// 까악이 날갯짓 애니메이션 프레임 (src 폴더 경로로 수정)
const birdFrames = ["src/kaaki1.png", "src/kaaki2.png", "src/kaaki3.png"];

let currentFrame = 0;
const birdImg = new Image();
birdImg.src = birdFrames[currentFrame];

let bird = {
  x: 50,
  y: 150,
  width: 30,
  height: 30,
  gravity: 0.15,
  lift: -6, // 점프 높이
  velocity: 0,
};

let pipes = [];
let frame = 0;
let isGameRunning = false;

function drawBird() {
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
  ctx.fillStyle = "#ff6f61";
  pipes.forEach((pipe) => {
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.height);
    ctx.fillRect(
      pipe.x,
      pipe.height + pipe.gap,
      pipe.width,
      canvas.height - pipe.height - pipe.gap
    );
  });
}

function update() {
  if (!isGameRunning) return;

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
    resetGame();
  }

  // 무작위로 설정된 간격에 따라 파이프 생성
  if (
    frame %
      Math.floor(
        Math.random() * (pipeMaxSpacing - pipeMinSpacing + 1) + pipeMinSpacing
      ) ===
    0
  ) {
    let pipeHeight = Math.floor(Math.random() * (canvas.height / 2)) + 50;
    let randomGap = Math.floor(Math.random() * 50) + pipeGap; // 현재 파이프 세로 간격을 기준으로 무작위 설정
    randomGap = Math.max(randomGap, minPipeGap); // 최소 세로 간격 적용

    pipes.push({
      x: canvas.width,
      height: pipeHeight,
      width: pipeWidth,
      gap: randomGap, // 무작위 세로 간격 적용
    });
  }

  pipes.forEach((pipe, index) => {
    pipe.x -= pipeSpeed;

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score += scoreIncrement;
      scoreIncrement += 5;
      scoreDisplay.innerText = score;
    }

    if (pipe.x + pipe.width < 0) {
      pipes.shift();
    }

    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.height || bird.y + bird.height > pipe.height + pipe.gap)
    ) {
      resetGame();
    }
  });

  if (frame % 5 === 0) {
    currentFrame = (currentFrame + 1) % birdFrames.length;
    birdImg.src = birdFrames[currentFrame];
  }

  frame++;
}

function resetGame() {
  bird.y = 150;
  bird.velocity = 0;
  pipes = [];
  frame = 0;
  score = 0;
  scoreIncrement = 10;
  nextDifficultyScore = 500;
  scoreDisplay.innerText = score;
  isGameRunning = false;
  canvas.style.display = "none";
  scoreDisplay.style.display = "none";
  difficultyButtons.style.display = "none";
  startButton.style.display = "block";
}

function gameLoop() {
  if (!isGameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBird();
  drawPipes();
  update();
  requestAnimationFrame(gameLoop);
}

function increaseDifficulty() {
  pipeSpeed += 0.5; // 파이프 속도 증가
  pipeGap = Math.max(minPipeGap, pipeGap - 10); // 파이프 세로 간격을 줄여나가지만 최소값 유지
}

function setDifficulty(speed, gap) {
  pipeSpeed = speed;
  pipeGap = gap;
  startGame();
}

function startGame() {
  isGameRunning = true;
  difficultyButtons.style.display = "none";
  startButton.style.display = "none";
  canvas.style.display = "block";
  scoreDisplay.style.display = "block";
  gameLoop();
}

startButton.addEventListener("click", () => {
  startButton.style.display = "none";
  difficultyButtons.style.display = "flex";
});

easyButton.addEventListener("click", () => setDifficulty(1, 150)); // 초기 세로 간격을 줄임
mediumButton.addEventListener("click", () => setDifficulty(1.5, 120));
hardButton.addEventListener("click", () => setDifficulty(2, 100));

canvas.addEventListener("click", () => {
  if (isGameRunning) {
    bird.velocity = bird.lift;
  }
});

birdImg.onload = function () {
  // 초기 상태에서는 아무 것도 하지 않음. 난이도 선택 버튼을 기다림.
};
