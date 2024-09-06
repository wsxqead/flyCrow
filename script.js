const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const scoreDisplay = document.getElementById("score");

// 배경 이미지 설정 (낮과 밤)
const dayBg = new Image();
const nightBg = new Image();
dayBg.src = "src/day_bg.png";
nightBg.src = "src/night_bg.png";

let currentBg = dayBg; // 초기 배경은 낮 배경

// 1분 간격으로 배경 전환
let dayNightTransitionTime = 60000; // 60초 (1분)
let lastBgSwitchTime = Date.now();
let bgOpacity = 0.5; // 배경 투명도 설정 (0.5로 설정하여 반투명)

// 오디오 설정
const eveAudio = new Audio("src/eve.mp3");
let pipesPassed = 0; // 파이프를 넘은 횟수

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

// 설정 변수
let pipeSpeed = 1; // 파이프 이동 속도
let pipeGap = 150; // 세로 간격
const minPipeGap = 250; // 최소 세로 간격 (까악이의 점프 높이에 맞춰 설정)
let pipeWidth = 30; // 파이프 두께
const minPipeSpacing = 80; // 파이프 사이의 최소 가로 간격
const maxPipeSpacing = 140; // 파이프 사이의 최대 가로 간격
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

// 배경 그리기 함수
function drawBackground() {
  ctx.globalAlpha = bgOpacity; // 배경의 투명도 설정
  ctx.drawImage(currentBg, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0; // 다른 요소에는 투명도가 적용되지 않도록 기본값으로 되돌림
}

// 배경 전환 함수 (1분 단위)
function switchBackground() {
  const now = Date.now();
  if (now - lastBgSwitchTime >= dayNightTransitionTime) {
    currentBg = currentBg === dayBg ? nightBg : dayBg; // 배경을 낮/밤으로 전환
    lastBgSwitchTime = now;
  }
}

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

  // 파이프 생성 주기와 가로 간격 설정
  const minPipeSpacingPx = 200; // 최소 가로 간격 (픽셀)
  const lastPipe = pipes[pipes.length - 1]; // 마지막 파이프의 위치 확인

  if (!lastPipe || canvas.width - lastPipe.x >= minPipeSpacingPx) {
    if (
      frame %
        Math.floor(
          Math.random() * (maxPipeSpacing - minPipeSpacing + 1) + minPipeSpacing
        ) ===
      0
    ) {
      let pipeHeight = Math.floor(Math.random() * (canvas.height / 2)) + 50;
      let randomGap = Math.floor(Math.random() * 50) + pipeGap; // 세로 간격 무작위로 설정
      randomGap = Math.max(randomGap, minPipeGap); // 최소 세로 간격 보장

      pipes.push({
        x: canvas.width,
        height: pipeHeight,
        width: pipeWidth,
        gap: randomGap, // 무작위 세로 간격 적용
      });
    }
  }

  pipes.forEach((pipe, index) => {
    pipe.x -= pipeSpeed;

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score += scoreIncrement;
      pipesPassed++; // 파이프를 넘은 횟수 증가

      // 파이프 5개 넘을 때마다 소리 재생
      if (pipesPassed % 5 === 0) {
        eveAudio.play(); // 소리 재생
      }

      scoreIncrement += 5;
      scoreDisplay.innerText = score;

      if (score >= nextDifficultyScore) {
        nextDifficultyScore += 500;
      }
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
  pipesPassed = 0; // 파이프 넘은 횟수 초기화
  scoreIncrement = 10;
  nextDifficultyScore = 500;
  scoreDisplay.innerText = score;
  isGameRunning = false;
  canvas.style.display = "none";
  scoreDisplay.style.display = "none";
  startButton.style.display = "block";
}

function gameLoop() {
  if (!isGameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(); // 배경 그리기
  drawBird();
  drawPipes();
  update();
  switchBackground(); // 배경 전환
  requestAnimationFrame(gameLoop);
}

function startGame() {
  isGameRunning = true;
  startButton.style.display = "none";
  canvas.style.display = "block";
  scoreDisplay.style.display = "block";
  gameLoop();
}

// 게임 시작 버튼 클릭 이벤트
startButton.addEventListener("click", () => {
  startButton.style.display = "none";

  eveAudio.play(); // 사용자 상호작용이 있을 때 오디오를 준비
  eveAudio.pause(); // 바로 정지
  eveAudio.currentTime = 0; // 초기화
  startGame();
});

// 게임 중간 클릭 이벤트로 까악이 점프
canvas.addEventListener("click", () => {
  if (isGameRunning) {
    bird.velocity = bird.lift;
  }
});

birdImg.onload = function () {
  // 초기 상태에서는 아무 것도 하지 않음. 게임 시작을 기다림.
};

// 오디오가 준비되었는지 확인
eveAudio.addEventListener("canplaythrough", () => {
  console.log("Audio is ready to play");
});

// 오디오 로드 에러 확인
eveAudio.addEventListener("error", (e) => {
  console.error("Error loading audio:", e);
});
