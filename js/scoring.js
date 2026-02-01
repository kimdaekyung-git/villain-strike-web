// ============================================
// 점수/콤보 시스템 모듈
// ============================================

import { gameState, elements } from './gameState.js';
import { getDifficultyConfig } from './difficulty.js';

// 점수 설정 상수
export const SCORE_CONFIG = {
  BASE_POINT: 5, // 기본 타격 점수 (릴리즈: 밸런스 조정)
  FACE_BONUS: 2.0, // 얼굴 영역 타격 배율 (폴백용)
  COMBO_MULTIPLIER: 0.1, // 콤보당 추가 배율
  MAX_COMBO_BONUS: 3.0, // 최대 콤보 배율
  CRITICAL_CHANCE: 0.1, // 크리티컬 확률 (10%)
  CRITICAL_MULTIPLIER: 2.0, // 크리티컬 배율

  // 얼굴 특징점별 보너스 (TensorFlow.js 탐지 시)
  FEATURE_BONUS: {
    leftEye: 3.0, // 왼쪽 눈 히트 (가장 어려움)
    rightEye: 3.0, // 오른쪽 눈 히트 (가장 어려움)
    nose: 2.5, // 코 히트 (중간)
    mouth: 2.0, // 입 히트 (비교적 쉬움)
  },
};

// 점수 계산 결과 타입
export class ScoreResult {
  constructor() {
    this.basePoints = SCORE_CONFIG.BASE_POINT;
    this.multiplier = 1.0;
    this.finalScore = 0;
    this.isCritical = false;
    this.isAccurate = false; // 얼굴 영역 타격
    this.comboCount = 0;
    this.hitFeature = null; // 히트한 특징점 ('leftEye', 'rightEye', 'nose', 'mouth')
    this.featureBonus = 1.0; // 특징점 보너스 배율
  }
}

// 점수 계산
export function calculateScore(x, y, currentTime) {
  const result = new ScoreResult();
  const difficulty = getDifficultyConfig(gameState.difficulty);

  // 1. 콤보 체크
  const timeSinceLastHit = currentTime - gameState.lastHitTime;
  if (gameState.lastHitTime > 0 && timeSinceLastHit < difficulty.comboWindow) {
    gameState.combo++;
  } else {
    gameState.combo = 0;
  }
  result.comboCount = gameState.combo;

  // 콤보 보너스 계산
  if (gameState.combo > 0) {
    const comboBonus = Math.min(
      gameState.combo * SCORE_CONFIG.COMBO_MULTIPLIER,
      SCORE_CONFIG.MAX_COMBO_BONUS - 1 // -1 because base is 1.0
    );
    result.multiplier += comboBonus;
  }

  // 2. 정확도 체크 (얼굴 특징점 or 얼굴 영역)
  const featureHit = checkFeatureHit(x, y);

  if (featureHit.hit) {
    // TensorFlow.js 기반 특징점 히트
    result.multiplier *= featureHit.bonus;
    result.isAccurate = true;
    result.hitFeature = featureHit.feature;
    result.featureBonus = featureHit.bonus;
    gameState.accurateHits++;
  } else if (isInFaceRegion(x, y)) {
    // 폴백: 기본 얼굴 영역 히트
    result.multiplier *= SCORE_CONFIG.FACE_BONUS;
    result.isAccurate = true;
    gameState.accurateHits++;
  }

  // 3. 크리티컬 체크
  if (Math.random() < SCORE_CONFIG.CRITICAL_CHANCE) {
    result.multiplier *= SCORE_CONFIG.CRITICAL_MULTIPLIER;
    result.isCritical = true;
  }

  // 4. 난이도 배율 적용
  result.multiplier *= difficulty.scoreMultiplier;

  // 최종 점수 계산
  result.finalScore = Math.floor(result.basePoints * result.multiplier);
  gameState.score += result.finalScore;
  gameState.lastHitTime = currentTime;
  gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);

  // 히트 로그 기록 (조작 방지)
  gameState.hitLog.push({
    time: currentTime,
    x,
    y,
    score: result.finalScore,
    combo: gameState.combo,
    isCritical: result.isCritical,
    isAccurate: result.isAccurate,
  });

  return result;
}

// 얼굴 영역 초기화 (이미지 중앙 50% - 폴백용)
export function initFaceRegion() {
  if (!elements.gameImage) {
    return;
  }

  const rect = elements.gameImage.getBoundingClientRect();
  gameState.faceRegion = {
    x: rect.width * 0.25,
    y: rect.height * 0.15,
    width: rect.width * 0.5,
    height: rect.height * 0.5,
  };
}

// 얼굴 영역 판정 (폴백: TensorFlow.js 미사용 시)
export function isInFaceRegion(x, y) {
  if (!gameState.faceRegion) {
    initFaceRegion();
  }

  if (!gameState.faceRegion) {
    return false;
  }

  const region = gameState.faceRegion;
  return (
    x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height
  );
}

/**
 * 얼굴 특징점 히트 체크 (TensorFlow.js 기반)
 * @param {number} clickX - 클릭 X 좌표 (이미지 기준)
 * @param {number} clickY - 클릭 Y 좌표 (이미지 기준)
 * @returns {{hit: boolean, feature: string|null, bonus: number}}
 */
export function checkFeatureHit(clickX, clickY) {
  // TensorFlow.js 얼굴 인식 데이터 없으면 폴백
  if (!gameState.faceLandmarks || !gameState.featureHitZones) {
    return { hit: false, feature: null, bonus: 1.0 };
  }

  const landmarks = gameState.faceLandmarks;
  const hitZones = gameState.featureHitZones;

  // 각 특징점과의 거리 계산 (우선순위: 눈 > 코 > 입)
  const features = ['leftEye', 'rightEye', 'nose', 'mouth'];

  for (const feature of features) {
    const point = landmarks[feature];
    const radius = hitZones[feature];

    if (!point || !radius) {
      continue;
    }

    // 거리 계산
    const distance = Math.sqrt(Math.pow(clickX - point.x, 2) + Math.pow(clickY - point.y, 2));

    // 히트 존 안에 있으면 히트
    if (distance <= radius) {
      return {
        hit: true,
        feature: feature,
        bonus: SCORE_CONFIG.FEATURE_BONUS[feature],
      };
    }
  }

  return { hit: false, feature: null, bonus: 1.0 };
}

// 정확도 계산
export function getAccuracyRate() {
  if (gameState.hitCount === 0) {
    return 0;
  }
  return gameState.accurateHits / gameState.hitCount;
}

// 플레이 시간 계산 (밀리초)
export function getPlayTime() {
  if (gameState.gameStartTime === 0) {
    return 0;
  }
  const endTime = gameState.gameEndTime || Date.now();
  return endTime - gameState.gameStartTime;
}

// 최종 점수 데이터 생성 (리더보드 저장용)
export function createScoreData() {
  const playTime = getPlayTime();
  const accuracyRate = getAccuracyRate();

  return {
    score: gameState.score,
    hitCount: gameState.hitCount,
    maxCombo: gameState.maxCombo,
    difficulty: gameState.difficulty,
    accuracyRate: accuracyRate,
    playTime: playTime,
    timestamp: Date.now(),
  };
}

// 게임 시작 시 호출
export function startScoring() {
  gameState.gameStartTime = Date.now();
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.lastHitTime = 0;
  gameState.accurateHits = 0;
  gameState.hitLog = [];
  initFaceRegion();
}

// 게임 종료 시 호출
export function endScoring() {
  gameState.gameEndTime = Date.now();
}

// 점수 등급 계산
export function getScoreGrade(score, difficulty) {
  const thresholds = {
    EASY: { S: 3000, A: 2000, B: 1000, C: 500 },
    NORMAL: { S: 5000, A: 3500, B: 2000, C: 1000 },
    HARD: { S: 10000, A: 7000, B: 4000, C: 2000 },
  };

  const t = thresholds[difficulty] || thresholds.NORMAL;

  if (score >= t.S) {
    return 'S';
  }
  if (score >= t.A) {
    return 'A';
  }
  if (score >= t.B) {
    return 'B';
  }
  if (score >= t.C) {
    return 'C';
  }
  return 'D';
}

// 점수 보너스 텍스트 생성
export function getScoreText(result) {
  const parts = [];

  if (result.isCritical) {
    parts.push('CRITICAL!');
  }

  // 얼굴 특징점 히트 표시
  if (result.hitFeature) {
    const featureNames = {
      leftEye: 'LEFT EYE!',
      rightEye: 'RIGHT EYE!',
      nose: 'NOSE!',
      mouth: 'MOUTH!',
    };
    parts.push(featureNames[result.hitFeature] || 'HIT!');
  } else if (result.isAccurate) {
    parts.push('ACCURATE!');
  }

  if (result.comboCount >= 5) {
    parts.push(`${result.comboCount} COMBO!`);
  }

  return parts.join(' ');
}

// 콤보 레벨 (이펙트용)
export function getComboLevel(combo) {
  if (combo >= 30) {
    return 'legendary';
  }
  if (combo >= 20) {
    return 'super';
  }
  if (combo >= 10) {
    return 'fire';
  }
  if (combo >= 5) {
    return 'good';
  }
  return 'normal';
}
