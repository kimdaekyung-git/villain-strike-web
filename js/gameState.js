// ============================================
// 게임 상태 관리 모듈
// ============================================

export const gameState = {
  // 기본 게임 상태
  hitCount: 0,
  level: 0,
  isGameActive: false,

  // 점수 시스템
  score: 0,
  combo: 0,
  maxCombo: 0,
  lastHitTime: 0,
  accurateHits: 0,

  // 시간 추적
  gameStartTime: 0,
  gameEndTime: 0,

  // 타이머 시스템
  timeRemaining: 15,
  gameDuration: 15, // 릴리즈 버전: 15초
  timerInterval: null,
  isTimerActive: false,

  // 설정
  difficulty: 'NORMAL',
  geminiApiKey: null,

  // 이미지 관련
  originalImage: null,
  transformedImages: {
    stage1: null, // 초반 (0-33%): 당황한 표정
    stage2: null, // 중반 (34-66%): 아파하는 표정
    stage3: null, // 종반 (67-100%): K.O. 표정
  },

  // 얼굴 영역 (정확도 판정용)
  faceRegion: null,

  // 얼굴 특징점 (TensorFlow.js로 탐지)
  faceLandmarks: null, // {leftEye, rightEye, nose, mouth, faceBox}
  featureHitZones: null, // {leftEye: radius, rightEye: radius, nose: radius, mouth: radius}

  // 히트 로그 (점수 검증용)
  hitLog: [],

  // 플레이어 정보
  playerName: '',
  villainName: '',
};

// DOM 요소 참조
export const elements = {
  // 기존 요소
  uploadZone: null,
  uploadBtn: null,
  imageInput: null,
  gameImage: null,
  targetContainer: null,
  effectsLayer: null,
  damageOverlay: null,
  loadingOverlay: null,
  loadingProgress: null,
  gameoverOverlay: null,
  resetBtn: null,
  hitCount: null,
  level: null,
  status: null,
  finalHits: null,

  // 새로운 요소
  score: null,
  combo: null,
  finalScore: null,
  maxComboDisplay: null,
  accuracyDisplay: null,

  // 모달 요소
  apiKeyModal: null,
  apiKeyInput: null,
  difficultyModal: null,
  leaderboardModal: null,
  leaderboardList: null,

  // 입력 폼
  playerNameInput: null,
  villainNameInput: null,
  saveScoreBtn: null,

  // 타이머 요소
  timerDisplay: null,
  startBtn: null,
  startOverlay: null,
  countdownOverlay: null,
  countdownNumber: null,
};

// DOM 요소 초기화 함수
export function initElements() {
  // 기존 요소
  elements.uploadZone = document.getElementById('upload-zone');
  elements.uploadBtn = document.getElementById('upload-btn');
  elements.imageInput = document.getElementById('image-input');
  elements.gameImage = document.getElementById('game-image');
  elements.targetContainer = document.getElementById('target-container');
  elements.effectsLayer = document.getElementById('effects-layer');
  elements.damageOverlay = document.getElementById('damage-overlay');
  elements.loadingOverlay = document.getElementById('loading-overlay');
  elements.loadingProgress = document.getElementById('loading-progress');
  elements.gameoverOverlay = document.getElementById('gameover-overlay');
  elements.resetBtn = document.getElementById('reset-btn');
  elements.hitCount = document.getElementById('hit-count');
  elements.level = document.getElementById('level');
  elements.status = document.getElementById('status');
  elements.finalHits = document.getElementById('final-hits');

  // 새로운 요소
  elements.score = document.getElementById('score');
  elements.combo = document.getElementById('combo');
  elements.finalScore = document.getElementById('final-score');
  elements.maxComboDisplay = document.getElementById('max-combo');
  elements.accuracyDisplay = document.getElementById('accuracy');

  // 모달 요소
  elements.apiKeyModal = document.getElementById('api-key-modal');
  elements.apiKeyInput = document.getElementById('api-key-input');
  elements.difficultyModal = document.getElementById('difficulty-modal');
  elements.leaderboardModal = document.getElementById('leaderboard-modal');
  elements.leaderboardList = document.getElementById('leaderboard-list');

  // 입력 폼
  elements.playerNameInput = document.getElementById('player-name');
  elements.villainNameInput = document.getElementById('villain-name');
  elements.saveScoreBtn = document.getElementById('save-score-btn');

  // 타이머 요소
  elements.timerDisplay = document.getElementById('timer-display');
  elements.startBtn = document.getElementById('start-btn');
  elements.startOverlay = document.getElementById('start-overlay');
  elements.countdownOverlay = document.getElementById('countdown-overlay');
  elements.countdownNumber = document.getElementById('countdown-number');
}

// 게임 상태 초기화
export function resetGameState() {
  gameState.hitCount = 0;
  gameState.level = 0;
  gameState.isGameActive = false;
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.lastHitTime = 0;
  gameState.accurateHits = 0;
  gameState.gameStartTime = 0;
  gameState.gameEndTime = 0;
  gameState.timeRemaining = gameState.gameDuration;
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
  gameState.isTimerActive = false;
  gameState.originalImage = null;
  gameState.transformedImages = {
    stage1: null,
    stage2: null,
    stage3: null,
  };
  gameState.faceRegion = null;
  gameState.faceLandmarks = null;
  gameState.featureHitZones = null;
  gameState.hitLog = [];
  gameState.playerName = '';
  gameState.villainName = '';
}

// 게임 상태 업데이트 (UI 반영)
export function updateStats() {
  if (elements.hitCount) {
    elements.hitCount.textContent = gameState.hitCount;
  }
  if (elements.level) {
    elements.level.textContent = gameState.level;
  }
  if (elements.score) {
    elements.score.textContent = gameState.score.toLocaleString();

    // 점수 증가 애니메이션
    elements.score.classList.remove('score-pulse');
    void elements.score.offsetWidth; // reflow
    elements.score.classList.add('score-pulse');
  }
  if (elements.combo) {
    elements.combo.textContent = gameState.combo;

    // 콤보에 따른 스타일 변경
    elements.combo.classList.remove('combo-fire', 'combo-super');
    if (gameState.combo >= 20) {
      elements.combo.classList.add('combo-super');
    } else if (gameState.combo >= 10) {
      elements.combo.classList.add('combo-fire');
    }
  }
}
