// ============================================
// 난이도 시스템 모듈
// ============================================

import { gameState } from './gameState.js';

// 난이도 설정
export const DIFFICULTY = {
  EASY: {
    name: '최저',
    nameEn: 'EASY',
    koThreshold: 40, // K.O. 필요 타격수
    levelThresholds: [7, 18, 40], // 레벨업 임계값 [Lv1, Lv2, Lv3/KO]
    scoreMultiplier: 0.8, // 점수 배율
    comboWindow: 700, // 콤보 유지 시간 (ms)
    description: '입문자용 - 여유롭게 즐기세요',
    color: '#00ff00',
  },
  NORMAL: {
    name: '보통',
    nameEn: 'NORMAL',
    koThreshold: 60,
    levelThresholds: [10, 30, 60],
    scoreMultiplier: 1.0,
    comboWindow: 500,
    description: '표준 난이도 - 균형 잡힌 도전',
    color: '#ffff00',
  },
  HARD: {
    name: '최고',
    nameEn: 'HARD',
    koThreshold: 100,
    levelThresholds: [15, 45, 100],
    scoreMultiplier: 1.5,
    comboWindow: 350,
    description: '숙련자용 - 진정한 참교육',
    color: '#ff0000',
  },
};

// 현재 난이도 설정 가져오기
export function getDifficultyConfig(difficultyKey = null) {
  const key = difficultyKey || gameState.difficulty;
  return DIFFICULTY[key] || DIFFICULTY.NORMAL;
}

// 난이도 설정
export function setDifficulty(difficultyKey) {
  if (DIFFICULTY[difficultyKey]) {
    gameState.difficulty = difficultyKey;
    return true;
  }
  return false;
}

// 현재 레벨 계산 (타격 횟수 기반)
export function calculateLevel(hitCount) {
  const config = getDifficultyConfig();
  const thresholds = config.levelThresholds;

  if (hitCount >= thresholds[2]) {
    return 3;
  } // K.O.
  if (hitCount >= thresholds[1]) {
    return 2;
  }
  if (hitCount >= thresholds[0]) {
    return 1;
  }
  return 0;
}

// 다음 레벨까지 필요한 타격 수
export function hitsToNextLevel(currentHits) {
  const config = getDifficultyConfig();
  const thresholds = config.levelThresholds;

  for (const threshold of thresholds) {
    if (currentHits < threshold) {
      return threshold - currentHits;
    }
  }
  return 0; // 이미 K.O.
}

// K.O. 체크
export function isKO(hitCount) {
  const config = getDifficultyConfig();
  return hitCount >= config.koThreshold;
}

// 진행률 계산 (0 ~ 1)
export function getProgress(hitCount) {
  const config = getDifficultyConfig();
  return Math.min(hitCount / config.koThreshold, 1);
}

// 난이도 선택 UI 렌더링
export function renderDifficultyOptions(container, onSelect) {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  Object.entries(DIFFICULTY).forEach(([key, config]) => {
    const button = document.createElement('button');
    button.className = 'difficulty-btn';
    button.dataset.difficulty = key;

    if (key === gameState.difficulty) {
      button.classList.add('selected');
    }

    button.innerHTML = `
            <span class="diff-icon" style="color: ${config.color}">${getDifficultyIcon(key)}</span>
            <span class="diff-name">${config.name}</span>
            <span class="diff-name-en">${config.nameEn}</span>
            <span class="diff-desc">K.O: ${config.koThreshold}회 | 점수 x${config.scoreMultiplier}</span>
            <span class="diff-hint">${config.description}</span>
        `;

    button.addEventListener('click', () => {
      // 이전 선택 해제
      container.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
      });

      // 새 선택
      button.classList.add('selected');
      setDifficulty(key);

      if (onSelect) {
        onSelect(key, config);
      }
    });

    container.appendChild(button);
  });
}

// 난이도 아이콘
function getDifficultyIcon(key) {
  const icons = {
    EASY: '🌱',
    NORMAL: '⚔️',
    HARD: '🔥',
  };
  return icons[key] || '⚔️';
}

// 난이도 관련 통계 텍스트 생성
export function getDifficultyStatsText() {
  const config = getDifficultyConfig();
  return `난이도: ${config.name} | 목표: ${config.koThreshold}회 | 점수 배율: x${config.scoreMultiplier}`;
}

// 레벨별 상태 텍스트
export function getLevelStatus(level) {
  const statuses = [
    { text: 'READY', color: '#00ff00' },
    { text: 'HURT!', color: '#ffff00' },
    { text: 'DAMAGED!', color: '#ff8800' },
    { text: 'K.O.!', color: '#ff0000' },
  ];
  return statuses[level] || statuses[0];
}

// 난이도별 레벨업 메시지
export function getLevelUpMessage(level) {
  const messages = {
    1: ['아야!', '아프다!', '으악!'],
    2: ['꺄악!', '그만해!', '안돼!'],
    3: ['K.O.!!!', '참교육 완료!', '끝났다...'],
  };
  const levelMessages = messages[level] || messages[1];
  return levelMessages[Math.floor(Math.random() * levelMessages.length)];
}

// 모든 난이도 키 목록
export function getDifficultyKeys() {
  return Object.keys(DIFFICULTY);
}

// 난이도 순위 (정렬용)
export function getDifficultyRank(key) {
  const ranks = { EASY: 0, NORMAL: 1, HARD: 2 };
  return ranks[key] ?? 1;
}
