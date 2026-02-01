// ============================================
// 빌런 참교육 - 메인 모듈 (얼굴 인식 + CSS 효과)
// ============================================

import { gameState, elements, initElements, resetGameState, updateStats } from './gameState.js';
import { fileToBase64, showLoading, hideLoading, logInfo } from './utils.js';
import {
  calculateScore,
  startScoring,
  endScoring,
  createScoreData,
  getAccuracyRate,
} from './scoring.js';
import { calculateLevel, isKO, getLevelStatus } from './difficulty.js';
import {
  particleSystem,
  soundManager,
  showPunchAnimation,
  shakeScreen,
  vibrateDevice,
  vibrateKO,
  applyDamageEffects,
  clearDamageOverlays,
  applyProgressiveDamageEffects,
} from './effects.js';
import { showLeaderboardModal, hideLeaderboardModal, initLeaderboard } from './leaderboard.js';
import { resizeImageForAPI, applyCSSFallback, geminiTransformer } from './gemini.js';
import { saveVillain, updateVillainResult, renderVillainList } from './villainStorage.js';
import { faceDetector } from './faceDetection.js';

// 점수 임계값은 applyResultImage 함수에서 직접 사용 (1000)
// const HIGH_SCORE_THRESHOLD = 1000;

// 현재 빌런 정보
let currentVillain = {
  id: null,
  name: '',
  message: '',
};

// ============================================
// 게임 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  logInfo('빌런 참교육 초기화 중...');

  try {
    // DOM 요소 초기화
    initElements();

    // 리더보드 초기화 (선택적 - 실패해도 계속 진행)
    try {
      initLeaderboard();
    } catch (error) {
      console.warn('리더보드 초기화 실패 (선택적 기능):', error);
    }

    // 이벤트 리스너 설정
    setupEventListeners();

    // 게임 시작 플로우
    startGameFlow();

    logInfo('게임 초기화 완료!');

    // TensorFlow.js 얼굴 인식 모델 로드 (백그라운드)
    faceDetector
      .loadModel()
      .then(() => {
        logInfo('✓ 얼굴 인식 모델 로드 완료 - 눈, 코, 입 타격 시 보너스 점수!');
      })
      .catch(error => {
        console.error('얼굴 인식 모델 로드 실패:', error);
        console.warn('⚠ 얼굴 인식 없이 기본 모드로 진행합니다.');
      });
  } catch (error) {
    console.error('게임 초기화 중 에러 발생:', error);
    alert('게임 로드 중 문제가 발생했습니다. 페이지를 새로고침해주세요.');
  }
});

// ============================================
// 게임 시작 플로우 (단순화 - 난이도 선택 없음)
// ============================================

function startGameFlow() {
  // 바로 업로드 화면 표시
  logInfo('게임 시작! 빌런 사진을 등록하세요.');
  showUploadZone();
}

// 업로드 존 표시
function showUploadZone() {
  if (elements.uploadZone) {
    elements.uploadZone.style.display = 'flex';
  }
  if (elements.gameImage) {
    elements.gameImage.style.display = 'none';
  }
  if (elements.status) {
    elements.status.textContent = 'READY';
  }
}

// ============================================
// 이벤트 리스너 설정
// ============================================

function setupEventListeners() {
  // 업로드 버튼
  elements.uploadBtn?.addEventListener('click', () => {
    console.log('📷 업로드 버튼 클릭됨');
    if (!elements.imageInput) {
      console.error('❌ imageInput 요소를 찾을 수 없음');
      return;
    }
    console.log('✅ imageInput 클릭 트리거');
    elements.imageInput.click();
  });

  // 업로드 존 클릭 (입력 필드, 버튼 제외)
  elements.uploadZone?.addEventListener('click', e => {
    // 입력 필드, 버튼, 업로드 버튼 클릭 시에는 이미지 선택 안 함
    const target = e.target;
    const isInput = target.tagName === 'INPUT';
    const isButton = target.tagName === 'BUTTON';
    const isClickable =
      isInput ||
      isButton ||
      target.closest('.upload-buttons') ||
      target.closest('.villain-info-form');

    if (!isClickable) {
      elements.imageInput?.click();
    }
  });

  // 이미지 선택
  if (elements.imageInput) {
    console.log('✅ imageInput 이벤트 리스너 등록됨');
    elements.imageInput.addEventListener('change', handleImageSelect);
  } else {
    console.error('❌ imageInput 요소를 찾을 수 없어서 이벤트 리스너 등록 실패');
  }

  // 게임 이미지 타격 (PC)
  elements.gameImage?.addEventListener('click', handleHit);

  // 게임 이미지 타격 (모바일)
  elements.gameImage?.addEventListener('touchstart', handleTouchHit, { passive: false });

  // 리셋 버튼 (같은 빌런으로 다시하기)
  elements.resetBtn?.addEventListener('click', handleReset);

  // 저장된 빌런 불러오기 버튼
  document.getElementById('load-villain-btn')?.addEventListener('click', showVillainListModal);

  // 빌런 목록 모달 닫기
  document
    .getElementById('close-villain-list-btn')
    ?.addEventListener('click', hideVillainListModal);

  // 결과 이미지 저장 버튼
  document.getElementById('save-result-btn')?.addEventListener('click', handleSaveResult);

  // 새 빌런 선택 버튼
  document.getElementById('new-villain-btn')?.addEventListener('click', handleNewVillain);

  // 리더보드 닫기
  document.getElementById('close-leaderboard')?.addEventListener('click', hideLeaderboardModal);

  // 리더보드 보기 버튼
  document.getElementById('view-leaderboard-btn')?.addEventListener('click', () => {
    soundManager.playClick();
    showLeaderboardModal();
  });

  // 리더보드 탭 초기화 (제거됨)
}

// ============================================
// 이미지 선택 처리
// ============================================

async function handleImageSelect(e) {
  console.log('🖼️ handleImageSelect 호출됨', e);

  const file = e.target.files[0];
  console.log('📁 선택된 파일:', file);

  if (!file) {
    console.warn('⚠️ 파일이 선택되지 않음');
    return;
  }

  // 파일 검증
  if (!file.type.startsWith('image/')) {
    console.error('❌ 이미지 파일이 아님:', file.type);
    alert('이미지 파일만 업로드 가능합니다.');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    console.error('❌ 파일 크기 초과:', file.size);
    alert('파일 크기는 10MB 이하여야 합니다.');
    return;
  }

  console.log('✅ 파일 검증 통과, 로딩 시작');

  try {
    showLoading(elements.loadingOverlay, elements.loadingProgress, '이미지 로딩 중...');

    // 파일을 Base64로 변환
    let base64Image = await fileToBase64(file);

    // 이미지 리사이즈 (최적화)
    base64Image = await resizeImageForAPI(base64Image, 1024);

    // 원본 이미지 저장 및 표시
    gameState.originalImage = base64Image;
    elements.gameImage.src = base64Image;
    elements.gameImage.style.display = 'block';
    elements.gameImage.style.filter = 'none';
    elements.uploadZone.style.display = 'none';

    // 현재 빌런 정보 설정 및 저장
    const nameInput = document.getElementById('villain-name-input');
    const messageInput = document.getElementById('villain-message');
    currentVillain = {
      id: null, // 새 빌런
      name: nameInput?.value.trim() || '이름 없는 빌런',
      message: messageInput?.value.trim() || '',
    };

    // 빌런 저장
    saveVillain({
      name: currentVillain.name,
      message: currentVillain.message,
      image: base64Image,
    });

    // 얼굴 특징점 탐지 (선택 사항 - 실패해도 계속 진행)
    if (faceDetector && faceDetector.isReady) {
      try {
        if (elements.loadingProgress) {
          elements.loadingProgress.textContent = '얼굴 인식 중... 👀';
        }

        // 이미지 로드 대기
        await new Promise(resolve => {
          if (elements.gameImage.complete) {
            resolve();
          } else {
            elements.gameImage.onload = resolve;
            elements.gameImage.onerror = () => {
              console.warn('이미지 로드 실패, 계속 진행합니다.');
              resolve(); // 에러여도 계속 진행
            };
          }
        });

        const landmarks = await faceDetector.detectFace(elements.gameImage);

        if (!landmarks) {
          console.warn('⚠ 얼굴을 감지할 수 없습니다. 기본 타격 모드로 진행합니다.');
        } else {
          gameState.faceLandmarks = landmarks;

          // 히트 존 반경 계산 (얼굴 크기 기반)
          const faceSize = Math.max(landmarks.faceBox.width, landmarks.faceBox.height);
          gameState.featureHitZones = {
            leftEye: faceSize * 0.08,
            rightEye: faceSize * 0.08,
            nose: faceSize * 0.1,
            mouth: faceSize * 0.12,
          };

          logInfo('✓ 얼굴 특징점 탐지 완료 - 눈, 코, 입 타격 시 보너스!');
        }
      } catch (error) {
        console.error('얼굴 인식 중 오류:', error);
        console.warn('⚠ 얼굴 인식 없이 기본 모드로 진행합니다.');
      }
    } else {
      console.warn('⚠ 얼굴 인식 모델이 로드되지 않았습니다. 기본 타격 모드로 진행합니다.');
    }

    // CSS 효과 전용 모드 설정 (AI 이미지 없음)
    gameState.transformedImages = {
      stage1: null,
      stage2: null,
      stage3: null,
    };

    logInfo(`✓ 빌런 이미지 로드 완료: ${currentVillain.name}`);

    // 로딩 숨기고 스타트 버튼 표시
    hideLoading(elements.loadingOverlay);
    showStartButton();
  } catch (error) {
    console.error('이미지 처리 실패:', error);
    alert(`이미지 처리 실패: ${error.message}`);
    hideLoading(elements.loadingOverlay);
  }
}

// ============================================
// 스타트 버튼 표시
// ============================================

function showStartButton() {
  if (elements.startOverlay) {
    elements.startOverlay.style.display = 'flex';
  }

  // 스타트 버튼 이벤트
  elements.startBtn?.addEventListener(
    'click',
    () => {
      soundManager.playClick();
      hideStartButton();
      showCountdown();
    },
    { once: true }
  );

  logInfo('스타트 버튼 표시');
}

function hideStartButton() {
  if (elements.startOverlay) {
    elements.startOverlay.style.display = 'none';
  }
}

// ============================================
// 카운트다운
// ============================================

function showCountdown() {
  if (elements.countdownOverlay) {
    elements.countdownOverlay.style.display = 'flex';
  }

  let count = 3;
  updateCountdownDisplay(count);
  soundManager.playCountdown(); // 첫 번째 "3" 효과음

  const countdownInterval = setInterval(() => {
    count--;

    if (count > 0) {
      updateCountdownDisplay(count);
      soundManager.playCountdown(); // 카운트다운 숫자 효과음 (2, 1)
    } else if (count === 0) {
      // "GO!" 표시
      if (elements.countdownNumber) {
        elements.countdownNumber.textContent = 'GO!';
        elements.countdownNumber.classList.add('go');
      }
      soundManager.playStart(); // 게임 시작 효과음
    } else {
      // 카운트다운 종료, 게임 시작
      clearInterval(countdownInterval);
      hideCountdown();
      startGame();
    }
  }, 1000);
}

function updateCountdownDisplay(count) {
  if (elements.countdownNumber) {
    elements.countdownNumber.textContent = count;
    elements.countdownNumber.classList.remove('go');
    // 애니메이션 재시작
    elements.countdownNumber.style.animation = 'none';
    elements.countdownNumber.offsetHeight; // reflow
    elements.countdownNumber.style.animation = 'countdownPop 1s ease-out';
  }
}

function hideCountdown() {
  if (elements.countdownOverlay) {
    elements.countdownOverlay.style.display = 'none';
  }
  if (elements.countdownNumber) {
    elements.countdownNumber.classList.remove('go');
  }
}

// ============================================
// 게임 시작
// ============================================

function startGame() {
  gameState.isGameActive = true;
  gameState.hitCount = 0;
  gameState.level = 0;

  // 타이머 초기화
  gameState.timeRemaining = gameState.gameDuration;
  gameState.isTimerActive = true;
  updateTimerDisplay();

  // 점수 시스템 시작
  startScoring();

  // UI 업데이트
  updateStats();
  if (elements.status) {
    elements.status.textContent = 'FIGHT!';
  }

  // 데미지 오버레이 초기화
  clearDamageOverlays();

  // 사운드 초기화
  soundManager.init();

  // 타이머 시작
  startTimer();

  logInfo('게임 시작!', `난이도: ${gameState.difficulty}, 시간: ${gameState.gameDuration}초`);
}

// ============================================
// 타이머 시스템
// ============================================

function startTimer() {
  // 기존 타이머가 있으면 제거
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
  }

  gameState.timerInterval = setInterval(() => {
    if (!gameState.isGameActive || !gameState.isTimerActive) {
      clearInterval(gameState.timerInterval);
      return;
    }

    gameState.timeRemaining--;
    updateTimerDisplay();

    // 5초 이하 카운트다운 효과 (릴리즈: 5초로 변경)
    if (gameState.timeRemaining <= 5 && gameState.timeRemaining > 0) {
      showTimerCountdownEffect(gameState.timeRemaining);
      soundManager.playClick();
    }

    // 시간 종료
    if (gameState.timeRemaining <= 0) {
      clearInterval(gameState.timerInterval);
      gameState.isTimerActive = false;
      showTimeUp();
    }
  }, 1000);
}

function updateTimerDisplay() {
  if (elements.timerDisplay) {
    elements.timerDisplay.textContent = gameState.timeRemaining;

    // 시간에 따른 스타일 변경
    elements.timerDisplay.classList.remove('warning', 'danger');
    if (gameState.timeRemaining <= 5) {
      elements.timerDisplay.classList.add('danger');
    } else if (gameState.timeRemaining <= 8) {
      elements.timerDisplay.classList.add('warning');
    }
  }
}

function showTimerCountdownEffect(seconds) {
  if (!elements.effectsLayer) {
    return;
  }

  const effect = document.createElement('div');
  effect.className = 'timer-countdown-effect';
  effect.textContent = seconds;
  elements.effectsLayer.appendChild(effect);

  // 애니메이션 후 제거
  setTimeout(() => effect.remove(), 500);
}

function showTimeUp() {
  // 타임 아웃 효과
  if (elements.effectsLayer) {
    const effect = document.createElement('div');
    effect.className = 'timeout-effect';
    effect.textContent = "TIME'S UP!";
    elements.effectsLayer.appendChild(effect);

    setTimeout(() => effect.remove(), 1000);
  }

  soundManager.playKO();
  shakeScreen('heavy');

  // 게임 오버 표시
  setTimeout(showGameOver, 1500);
}

// ============================================
// 타격 처리
// ============================================

function handleHit(e) {
  if (!gameState.isGameActive) {
    return;
  }

  e.preventDefault();

  const rect = elements.gameImage.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  processPunch(x, y);
}

function handleTouchHit(e) {
  if (!gameState.isGameActive) {
    return;
  }

  e.preventDefault();

  const touch = e.touches[0];
  const rect = elements.gameImage.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  processPunch(x, y);
}

function processPunch(x, y) {
  // 타격 카운트 증가
  gameState.hitCount++;

  // 점수 계산
  const currentTime = Date.now();
  const scoreResult = calculateScore(x, y, currentTime);

  // 시각 효과
  showPunchAnimation(x, y);
  particleSystem.createHitParticles(x, y, 6);

  // 점수 팝업
  particleSystem.showScorePopup(scoreResult.finalScore, x, y, scoreResult.isCritical);

  // 콤보 이펙트
  if (scoreResult.comboCount >= 5) {
    particleSystem.showComboEffect(scoreResult.comboCount, x, y - 40);
  }

  // 크리티컬 이펙트
  if (scoreResult.isCritical) {
    particleSystem.showCriticalEffect(x, y - 60);
    soundManager.playCritical();
    shakeScreen('heavy');
  } else {
    shakeScreen('normal');
  }

  // 사운드
  if (scoreResult.isCritical) {
    soundManager.playHeavyPunch();
  } else {
    soundManager.playPunch();
  }

  // 콤보 사운드
  if (scoreResult.comboCount >= 3) {
    soundManager.playCombo(scoreResult.comboCount);
  }

  // 진동
  vibrateDevice(scoreResult.isCritical ? 80 : 50);

  // UI 업데이트
  updateStats();

  // 실시간 이미지 변형 (점수에 따라)
  applyRealtimeImageTransform();

  // 점수에 따라 누적 데미지 효과 적용 (멍, 붓기, 반창고 등)
  applyProgressiveDamageEffects(gameState.score);

  // 레벨 체크 및 변형 적용
  checkLevelUp();
}

// ============================================
// 실시간 이미지 변형 (점수에 따라 3단계)
// ============================================

// 현재 적용된 stage 추적
let currentAppliedStage = null;

/**
 * 게임 중 점수에 따라 실시간으로 CSS 효과 적용
 * 점수에 따라 3단계로 변형 (당황 → 아픔 → K.O.)
 */
function applyRealtimeImageTransform() {
  if (!gameState.isGameActive) {
    return;
  }

  // 점수에 따라 stage 결정
  const score = gameState.score;
  let stage;
  if (score < 300) {
    stage = 'stage1'; // 당황
  } else if (score < 700) {
    stage = 'stage2'; // 아픔
  } else {
    stage = 'stage3'; // 만신창이
  }

  // 같은 stage면 변경 필요 없음
  if (stage === currentAppliedStage) {
    return;
  }

  // CSS 필터 적용
  applyCSSFallback(stage);
  currentAppliedStage = stage;
  console.log(`🎨 CSS 효과 적용: ${stage}`);
}

/**
 * 현재 stage 초기화 (게임 리셋 시 호출)
 */
function resetCurrentStage() {
  currentAppliedStage = null;
}

// ============================================
// 레벨업 체크
// ============================================

function checkLevelUp() {
  const newLevel = calculateLevel(gameState.hitCount);

  if (newLevel !== gameState.level) {
    const oldLevel = gameState.level;
    gameState.level = newLevel;

    // 레벨업 이펙트
    particleSystem.showLevelUpEffect(newLevel);
    soundManager.playLevelUp();

    // 게임 중에는 원본 이미지 유지 (이미지 변환은 게임 종료 시에만)
    // 데미지 오버레이 효과만 적용
    applyDamageEffects(newLevel);

    // 상태 텍스트 업데이트
    const status = getLevelStatus(newLevel);
    if (elements.status) {
      elements.status.textContent = status.text;
      elements.status.style.color = status.color;
    }

    updateStats();

    logInfo(`레벨업! ${oldLevel} -> ${newLevel}`);

    // K.O. 체크
    if (isKO(gameState.hitCount)) {
      setTimeout(showGameOver, 2000);
    }
  }
}

// ============================================
// 게임 오버
// ============================================

function showGameOver() {
  gameState.isGameActive = false;
  gameState.isTimerActive = false;

  // 타이머 정지
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }

  endScoring();

  // 게임 오버 효과음
  soundManager.playGameOver();

  // K.O. 효과 (타임아웃이 아닌 경우에만)
  if (gameState.timeRemaining > 0) {
    soundManager.playKO();
  }
  vibrateKO();

  // 최종 CSS 효과 적용 (만신창이 이미지)
  applyCSSFallback('stage3');
  logInfo(`게임 종료! 점수: ${gameState.score}`);

  // 최종 통계 생성 (미래에 사용될 수 있음)
  createScoreData();

  // 상단 큰 점수 표시
  const finalScoreBig = document.getElementById('final-score-big');
  if (finalScoreBig) {
    finalScoreBig.textContent = gameState.score.toLocaleString();
  }

  // 빌런 이름 표시
  const villainNameDisplay = document.getElementById('villain-name-display');
  if (villainNameDisplay && currentVillain.name) {
    villainNameDisplay.textContent = `🎯 ${currentVillain.name}`;
  }

  if (elements.finalHits) {
    elements.finalHits.textContent = gameState.hitCount;
  }
  if (elements.maxComboDisplay) {
    elements.maxComboDisplay.textContent = gameState.maxCombo;
  }
  if (elements.accuracyDisplay) {
    elements.accuracyDisplay.textContent = `${(getAccuracyRate() * 100).toFixed(1)}%`;
  }

  // 게임 오버 오버레이 표시
  if (elements.gameoverOverlay) {
    elements.gameoverOverlay.style.display = 'flex';
  }

  logInfo('K.O.!', `점수: ${gameState.score}, 최대 콤보: ${gameState.maxCombo}`);
}

// ============================================
// 빌런 저장/불러오기
// ============================================

// 빌런 목록 모달 표시
function showVillainListModal() {
  soundManager.playClick();
  const modal = document.getElementById('villain-list-modal');
  const list = document.getElementById('villain-list');

  if (modal && list) {
    renderVillainList(list, handleSelectVillain, null);
    modal.style.display = 'flex';
  }
}

// 빌런 목록 모달 숨기기
function hideVillainListModal() {
  const modal = document.getElementById('villain-list-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// 저장된 빌런 선택
function handleSelectVillain(villain) {
  hideVillainListModal();

  // 현재 빌런 정보 설정
  currentVillain = {
    id: villain.id,
    name: villain.name,
    message: villain.message,
  };

  // 입력 필드에 빌런 정보 표시
  const nameInput = document.getElementById('villain-name-input');
  const messageInput = document.getElementById('villain-message');
  if (nameInput) {
    nameInput.value = villain.name;
  }
  if (messageInput) {
    messageInput.value = villain.message || '';
  }

  // 이미지 설정
  gameState.originalImage = villain.image;

  if (elements.gameImage) {
    elements.gameImage.src = villain.image;
    elements.gameImage.style.display = 'block';
    elements.gameImage.style.filter = 'none';
  }

  if (elements.uploadZone) {
    elements.uploadZone.style.display = 'none';
  }

  logInfo(`빌런 불러오기: ${villain.name}`);

  // 스타트 버튼 표시
  showStartButton();
}

// 현재 빌런 저장 (이미지 업로드 후) - 미래 기능용 예약
// eslint-disable-next-line no-unused-vars
function saveCurrentVillain() {
  const nameInput = document.getElementById('villain-name-input');
  const messageInput = document.getElementById('villain-message');

  const name = nameInput?.value.trim() || '이름 없는 빌런';
  const message = messageInput?.value.trim() || '';

  currentVillain = {
    id: currentVillain.id, // 기존 ID 유지 (새 빌런이면 null)
    name: name,
    message: message,
  };

  // 빌런 저장
  if (gameState.originalImage) {
    const saved = saveVillain({
      id: currentVillain.id,
      name: name,
      message: message,
      image: gameState.originalImage,
    });

    if (saved) {
      logInfo(`빌런 저장 완료: ${name}`);
    }
  }
}

// 결과 이미지 저장
function handleSaveResult() {
  soundManager.playClick();

  // 현재 게임 이미지 (만신창이)를 저장
  const currentImage = elements.gameImage?.src;

  if (!currentImage) {
    alert('저장할 이미지가 없습니다.');
    return;
  }

  // 빌런의 결과 이미지 업데이트
  if (currentVillain.id) {
    updateVillainResult(currentVillain.id, currentImage);
    alert('결과 이미지가 빌런에 저장되었습니다!');
  } else {
    // 새 빌런으로 저장
    const nameInput = document.getElementById('villain-name-input');
    const name = nameInput?.value.trim() || currentVillain.name || '빌런';

    const saved = saveVillain({
      name: name + ' (결과)',
      message: `최종 점수: ${gameState.score}`,
      image: gameState.originalImage,
      resultImage: currentImage,
    });

    if (saved) {
      alert('결과 이미지가 새 빌런으로 저장되었습니다!');
    }
  }
}

// 새 빌런 선택 (업로드 화면으로)
function handleNewVillain() {
  soundManager.playClick();

  // 게임 오버 오버레이 숨기기
  if (elements.gameoverOverlay) {
    elements.gameoverOverlay.style.display = 'none';
  }

  // 게임 상태 리셋
  resetGameState();
  clearDamageOverlays();

  // 현재 빌런 초기화
  currentVillain = { id: null, name: '', message: '' };

  // 입력 필드 초기화
  const nameInput = document.getElementById('villain-name-input');
  const messageInput = document.getElementById('villain-message');
  if (nameInput) {
    nameInput.value = '';
  }
  if (messageInput) {
    messageInput.value = '';
  }

  // 업로드 존 표시
  if (elements.uploadZone) {
    elements.uploadZone.style.display = 'flex';
  }

  // 게임 이미지 숨기기
  if (elements.gameImage) {
    elements.gameImage.style.display = 'none';
    elements.gameImage.src = '';
  }

  // 스타트 오버레이 숨기기
  if (elements.startOverlay) {
    elements.startOverlay.style.display = 'none';
  }

  logInfo('새 빌런 선택 화면');
}

// ============================================
// 게임 리셋 (같은 빌런으로 다시하기)
// ============================================

function handleReset() {
  soundManager.playClick();

  // 게임 오버 오버레이 숨기기
  if (elements.gameoverOverlay) {
    elements.gameoverOverlay.style.display = 'none';
  }

  // 리더보드 숨기기
  hideLeaderboardModal();

  // 스타트 오버레이, 카운트다운 오버레이 숨기기
  hideStartButton();
  hideCountdown();

  // 게임 상태 초기화
  resetGameState();

  // 타이머 디스플레이 초기화
  if (elements.timerDisplay) {
    elements.timerDisplay.textContent = gameState.gameDuration;
    elements.timerDisplay.classList.remove('warning', 'danger');
  }

  // 데미지 오버레이 초기화
  clearDamageOverlays();

  // 원본 이미지가 있으면 복원 (같은 빌런으로 다시하기)
  if (gameState.originalImage) {
    if (elements.gameImage) {
      elements.gameImage.src = gameState.originalImage;
      elements.gameImage.style.display = 'block';
      elements.gameImage.style.filter = 'none';
    }

    // 스타트 버튼 표시
    showStartButton();
    logInfo(`같은 빌런으로 다시 시작: ${currentVillain.name || '빌런'}`);
  } else {
    // 원본 이미지가 없으면 업로드 화면으로
    if (elements.gameImage) {
      elements.gameImage.style.display = 'none';
      elements.gameImage.src = '';
      elements.gameImage.style.filter = 'none';
    }

    if (elements.uploadZone) {
      elements.uploadZone.style.display = 'flex';
    }

    logInfo('게임 리셋 완료');
  }

  // 실시간 이미지 변형 stage 초기화
  resetCurrentStage();

  // 이펙트 레이어 초기화
  if (elements.effectsLayer) {
    elements.effectsLayer.innerHTML = '';
  }

  // UI 초기화
  updateStats();
  if (elements.status) {
    elements.status.textContent = 'READY';
    elements.status.style.color = '';
  }

  // 입력 필드 초기화
  if (elements.playerNameInput) {
    elements.playerNameInput.value = '';
  }
  if (elements.villainNameInput) {
    elements.villainNameInput.value = '';
  }
  if (elements.imageInput) {
    elements.imageInput.value = '';
  }

  // 저장 버튼 초기화
  if (elements.saveScoreBtn) {
    elements.saveScoreBtn.style.display = 'inline-block';
    elements.saveScoreBtn.disabled = false;
    elements.saveScoreBtn.textContent = '점수 저장';
  }
  const viewBtn = document.getElementById('view-leaderboard-btn');
  if (viewBtn) {
    viewBtn.style.display = 'none';
  }

  // AI 캐시 클리어
  geminiTransformer.clearCache();

  // 게임 시작 플로우 재시작
  startGameFlow();

  logInfo('게임 리셋 완료');
}

// ============================================
// 콘솔 로그
// ============================================

console.log('%c🥊 빌런 참교육: AI FACE OFF', 'color: #ff00ff; font-size: 20px; font-weight: bold;');
console.log('%c📸 AI 이미지 변형 지원 (Gemini 2.5 Flash Image)', 'color: #00ffff;');
console.log('%c🎮 점수 시스템: 콤보, 크리티컬, 정확도', 'color: #ffff00;');
console.log('%c🏆 Firebase 온라인 리더보드', 'color: #00ff00;');
