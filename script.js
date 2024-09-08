const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const scoreDisplay = document.getElementById("score");

// 음소거 버튼과 볼륨 슬라이더
const muteButton = document.getElementById("muteButton");
const volumeSlider = document.getElementById("volumeSlider");
const audioControls = document.getElementById("audioControls");

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
const eveAudio = new Audio("audio/eve.mp3");
const bgAudio = new Audio("audio/bg.mp3");
bgAudio.loop = true;
bgAudio.volume = 0.3; // 초기 볼륨을 낮게 설정

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
const minPipeGap = 250; // 최소 세로 간격
let pipeWidth = 30; // 파이프 두께
const minPipeSpacing = 80; // 파이프 사이의 최소 가로 간격
const maxPipeSpacing = 140; // 파이프 사이의 최대 가로 간격
let score = 0; // 초기 점수
let scoreIncrement = 10; // 점수 증가량 초기화

// 까악이 날갯짓 애니메이션 프레임
const birdFrames = ["src/kaaki1.png", "src/kaaki2.png", "src/kaaki3.png"];

let currentFrame = 0;
const birdImg = new Image();
birdImg.src = birdFrames[currentFrame];

let bird = {
  x: 50,
  y: 150,
  width: 30,
  height: 30,
  gravity: 0.25,
  lift: -7, // 점프 높이
  velocity: 0,
};

let pipes = [];
let frame = 0;
let isGameRunning = false;
let gamePaused = false; // 게임이 종료되면 true로 설정

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
  if (!isGameRunning || gamePaused) return; // 게임이 종료되면 업데이트 중단

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  // 속도가 너무 커지지 않도록 제한
  if (bird.velocity > 10) bird.velocity = 10; // 하강 속도 제한
  if (bird.velocity < -10) bird.velocity = -10; // 상승 속도 제한

  if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
    endGame(); // 화면 상단이나 하단에 닿으면 게임 종료
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

      scoreIncrement += 5 * pipesPassed;
      scoreDisplay.innerText = score.toLocaleString(); // 점수를 3자리마다 쉼표로 구분
    }

    if (pipe.x + pipe.width < 0) {
      pipes.shift();
    }

    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.height || bird.y + bird.height > pipe.height + pipe.gap)
    ) {
      endGame(); // 파이프와 충돌하면 게임 종료
    }
  });

  if (frame % 5 === 0) {
    currentFrame = (currentFrame + 1) % birdFrames.length;
    birdImg.src = birdFrames[currentFrame];
  }

  frame++;
}

// 게임 종료 함수
function endGame() {
  isGameRunning = false; // 게임 루프 중단
  gamePaused = true; // 게임이 멈췄음을 표시
  restartButton.style.display = "block"; // 재시작 버튼 표시
  canvas.style.display = "none"; // 캔버스를 숨김
  scoreDisplay.style.display = "block"; // 점수 표시
  // 배경음악을 계속 재생하려면 아래 줄을 주석 처리하세요.
  // bgAudio.pause();
}

// 재시작 버튼 클릭 시 게임 재시작
restartButton.addEventListener("click", () => {
  restartButton.style.display = "none"; // 재시작 버튼 숨김
  resetGame(); // 게임 리셋
  startGame(); // 게임 재시작
});

function resetGame() {
  bird.y = 150;
  bird.velocity = 0;
  pipes = [];
  frame = 0;
  score = 0;
  pipesPassed = 0; // 파이프 넘은 횟수 초기화
  scoreIncrement = 10;
  scoreDisplay.innerText = score.toLocaleString(); // 점수를 3자리마다 쉼표로 구분
  gamePaused = false; // 게임 상태 초기화
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

// 게임 시작 시 배경음악 재생 및 오디오 컨트롤 표시
function startGame() {
  isGameRunning = true;
  restartButton.style.display = "none"; // 재시작 버튼 숨김
  canvas.style.display = "block"; // 캔버스 표시
  scoreDisplay.style.display = "block";
  audioControls.style.display = "flex"; // 오디오 컨트롤 표시

  bgAudio.play(); // 배경음악 재생

  gameLoop();
}

// 게임 시작 버튼 클릭 이벤트
startButton.addEventListener("click", () => {
  startButton.style.display = "none";

  // 오디오를 사용자 상호작용 후에 미리 로드하고 정지
  eveAudio.play();
  eveAudio.pause();
  eveAudio.currentTime = 0;

  bgAudio.play();
  bgAudio.pause();
  bgAudio.currentTime = 0;

  startGame();
});

// 게임 중간 클릭 이벤트로 까악이 점프
canvas.addEventListener("click", () => {
  if (isGameRunning && !gamePaused) {
    bird.velocity = bird.lift;
  }
});

// 스페이스바로 점프
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && isGameRunning && !gamePaused) {
    bird.velocity = bird.lift;
  }
});

// 음소거 버튼 클릭 이벤트
muteButton.addEventListener("click", () => {
  if (bgAudio.muted) {
    bgAudio.muted = false;
    muteButton.innerText = "🔈";
  } else {
    bgAudio.muted = true;
    muteButton.innerText = "🔇";
  }
});

// 볼륨 슬라이더 변경 이벤트
volumeSlider.addEventListener("input", () => {
  bgAudio.volume = volumeSlider.value;
});

// 초기 오디오 로드
bgAudio.addEventListener("loadeddata", () => {
  bgAudio.volume = volumeSlider.value;
});

birdImg.onload = function () {
  // 초기 상태에서는 아무 것도 하지 않음. 게임 시작을 기다림.
};
