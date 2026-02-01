// ============================================
// Firebase 리더보드 모듈
// ============================================

import { elements } from './gameState.js';
import { generateScoreHash, formatNumber, timeAgo, storage } from './utils.js';
import { DIFFICULTY, getDifficultyConfig } from './difficulty.js';
import { FIREBASE_CONFIG, isFirebaseConfigured } from './config.js';

// Firebase 설정
let firebaseConfig = isFirebaseConfigured() ? FIREBASE_CONFIG : null;
let database = null;
let isInitialized = false;

// 저장 키
const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'villain_firebase_config',
  LOCAL_SCORES: 'villain_local_scores',
};

// ============================================
// Firebase 초기화
// ============================================

export function setFirebaseConfig(config) {
  firebaseConfig = config;
  storage.set(STORAGE_KEYS.FIREBASE_CONFIG, config);
}

export function getFirebaseConfig() {
  if (!firebaseConfig) {
    firebaseConfig = storage.get(STORAGE_KEYS.FIREBASE_CONFIG);
  }
  return firebaseConfig;
}

export function initFirebase() {
  const config = getFirebaseConfig();

  if (!config) {
    console.warn('Firebase config not set');
    return false;
  }

  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
    return false;
  }

  try {
    // 이미 초기화되어 있으면 기존 앱 사용
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    database = firebase.database();
    isInitialized = true;
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return false;
  }
}

export function isFirebaseReady() {
  return isInitialized && database !== null;
}

// ============================================
// 점수 저장
// ============================================

export async function saveScore(playerName, villainName, scoreData) {
  const entry = {
    playerName: playerName.trim(),
    villainName: villainName.trim() || '알 수 없는 빌런',
    score: scoreData.score,
    hitCount: scoreData.hitCount,
    maxCombo: scoreData.maxCombo,
    difficulty: scoreData.difficulty,
    accuracyRate: scoreData.accuracyRate,
    playTime: scoreData.playTime,
    timestamp: Date.now(),
  };

  // 해시 생성 (무결성 검증용)
  entry.hash = generateScoreHash(entry);

  // Firebase에 저장 시도
  if (isFirebaseReady()) {
    try {
      const newRef = database.ref('leaderboard').push();
      entry.id = newRef.key;
      await newRef.set(entry);
      console.log('Score saved to Firebase:', entry.id);
      return { success: true, id: entry.id, entry };
    } catch (error) {
      console.error('Firebase save failed:', error);
      // 실패 시 로컬에 저장
      return saveScoreLocal(entry);
    }
  } else {
    // Firebase 미설정 시 로컬에 저장
    return saveScoreLocal(entry);
  }
}

// 로컬 저장 (폴백)
function saveScoreLocal(entry) {
  const scores = storage.get(STORAGE_KEYS.LOCAL_SCORES, []);
  entry.id = `local_${Date.now()}`;
  scores.push(entry);

  // 최대 100개만 유지
  if (scores.length > 100) {
    scores.sort((a, b) => b.score - a.score);
    scores.splice(100);
  }

  storage.set(STORAGE_KEYS.LOCAL_SCORES, scores);
  console.log('Score saved locally:', entry.id);
  return { success: true, id: entry.id, entry, isLocal: true };
}

// ============================================
// 점수 조회
// ============================================

export async function getTopScores(limit = 10, difficulty = null) {
  if (isFirebaseReady()) {
    try {
      const snapshot = await database
        .ref('leaderboard')
        .orderByChild('score')
        .limitToLast(limit * 2) // 필터링 고려해서 더 많이 가져옴
        .once('value');

      if (!snapshot.exists()) {
        return getLocalScores(limit, difficulty);
      }

      let scores = [];
      snapshot.forEach(child => {
        scores.push({ id: child.key, ...child.val() });
      });

      // 내림차순 정렬
      scores.sort((a, b) => b.score - a.score);

      // 난이도 필터링
      if (difficulty) {
        scores = scores.filter(s => s.difficulty === difficulty);
      }

      return scores.slice(0, limit);
    } catch (error) {
      console.error('Firebase fetch failed:', error);
      return getLocalScores(limit, difficulty);
    }
  } else {
    return getLocalScores(limit, difficulty);
  }
}

// 로컬 점수 조회
function getLocalScores(limit = 10, difficulty = null) {
  let scores = storage.get(STORAGE_KEYS.LOCAL_SCORES, []);

  if (difficulty) {
    scores = scores.filter(s => s.difficulty === difficulty);
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, limit);
}

// 실시간 리더보드 구독
export function subscribeToLeaderboard(callback, limit = 10) {
  if (!isFirebaseReady()) {
    console.warn('Firebase not ready for subscription');
    return null;
  }

  const ref = database.ref('leaderboard').orderByChild('score').limitToLast(limit);

  ref.on('value', snapshot => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const scores = [];
    snapshot.forEach(child => {
      scores.push({ id: child.key, ...child.val() });
    });

    scores.sort((a, b) => b.score - a.score);
    callback(scores);
  });

  // 구독 해제 함수 반환
  return () => ref.off('value');
}

// ============================================
// 리더보드 UI
// ============================================

export async function renderLeaderboard(container, difficulty = null) {
  if (!container) {
    return;
  }

  container.innerHTML = '<div class="loading-scores">점수 불러오는 중...</div>';

  try {
    const scores = await getTopScores(10, difficulty);

    if (scores.length === 0) {
      container.innerHTML = `
                <div class="no-scores">
                    <p>아직 기록이 없습니다!</p>
                    <p>첫 번째 기록을 남겨보세요!</p>
                </div>
            `;
      return;
    }

    const html = scores
      .map((score, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const diffConfig = getDifficultyConfig(score.difficulty);

        return `
                <div class="leaderboard-entry ${rankClass}">
                    <span class="rank">${getRankIcon(rank)}</span>
                    <div class="entry-info">
                        <span class="player-name">${escapeHtml(score.playerName)}</span>
                        <span class="villain-name">vs ${escapeHtml(score.villainName)}</span>
                    </div>
                    <div class="entry-stats">
                        <span class="score">${formatNumber(score.score)}</span>
                        <span class="difficulty" style="color: ${diffConfig.color}">${diffConfig.name}</span>
                    </div>
                    <div class="entry-details">
                        <span class="combo">MAX ${score.maxCombo} COMBO</span>
                        <span class="time">${timeAgo(score.timestamp)}</span>
                    </div>
                </div>
            `;
      })
      .join('');

    container.innerHTML = html;
  } catch (error) {
    console.error('Leaderboard render failed:', error);
    container.innerHTML = `
            <div class="error-message">
                <p>점수를 불러오지 못했습니다</p>
                <p>인터넷 연결을 확인해주세요</p>
            </div>
        `;
  }
}

// 랭크 아이콘
function getRankIcon(rank) {
  const icons = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };
  return icons[rank] || `#${rank}`;
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// 리더보드 모달 관리
// ============================================

let unsubscribe = null;

export function showLeaderboardModal() {
  const modal = elements.leaderboardModal;
  if (!modal) {
    return;
  }

  modal.style.display = 'flex';
  switchLeaderboardTab('all');
}

export function hideLeaderboardModal() {
  const modal = elements.leaderboardModal;
  if (!modal) {
    return;
  }

  modal.style.display = 'none';

  // 구독 해제
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export function switchLeaderboardTab(tab) {
  // 탭 버튼 업데이트
  const tabs = document.querySelectorAll('.leaderboard-tab');
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  // 리더보드 렌더링
  const difficulty = tab === 'all' ? null : tab;
  renderLeaderboard(elements.leaderboardList, difficulty);
}

// ============================================
// 리더보드 탭 UI 생성
// ============================================

export function createLeaderboardTabs(container) {
  if (!container) {
    return;
  }

  const tabs = [
    { key: 'all', label: '전체' },
    ...Object.entries(DIFFICULTY).map(([key, config]) => ({
      key,
      label: config.name,
    })),
  ];

  container.innerHTML = tabs
    .map(
      tab => `
        <button class="leaderboard-tab ${tab.key === 'all' ? 'active' : ''}"
                data-tab="${tab.key}">
            ${tab.label}
        </button>
    `
    )
    .join('');

  // 이벤트 리스너
  container.querySelectorAll('.leaderboard-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      switchLeaderboardTab(tabBtn.dataset.tab);
    });
  });
}

// ============================================
// Firebase 설정 UI
// ============================================

export function showFirebaseConfigModal() {
  // 기존 설정 로드
  const existingConfig = getFirebaseConfig();

  const modal = document.getElementById('firebase-config-modal');
  if (!modal) {
    return;
  }

  // 기존 값 채우기
  if (existingConfig) {
    const inputs = {
      'firebase-api-key': existingConfig.apiKey,
      'firebase-auth-domain': existingConfig.authDomain,
      'firebase-database-url': existingConfig.databaseURL,
      'firebase-project-id': existingConfig.projectId,
    };

    Object.entries(inputs).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input && value) {
        input.value = value;
      }
    });
  }

  modal.style.display = 'flex';
}

export function saveFirebaseConfigFromForm() {
  const config = {
    apiKey: document.getElementById('firebase-api-key')?.value.trim(),
    authDomain: document.getElementById('firebase-auth-domain')?.value.trim(),
    databaseURL: document.getElementById('firebase-database-url')?.value.trim(),
    projectId: document.getElementById('firebase-project-id')?.value.trim(),
    storageBucket: `${document.getElementById('firebase-project-id')?.value.trim()}.appspot.com`,
    messagingSenderId: '',
    appId: '',
  };

  // 필수 필드 검증
  if (!config.apiKey || !config.databaseURL || !config.projectId) {
    alert('API Key, Database URL, Project ID는 필수입니다.');
    return false;
  }

  setFirebaseConfig(config);

  // 초기화 시도
  const success = initFirebase();

  if (success) {
    const modal = document.getElementById('firebase-config-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    return true;
  } else {
    alert('Firebase 초기화에 실패했습니다. 설정을 확인해주세요.');
    return false;
  }
}

// ============================================
// 개인 최고 기록
// ============================================

export async function getPersonalBest(playerName) {
  if (isFirebaseReady()) {
    try {
      const snapshot = await database
        .ref('leaderboard')
        .orderByChild('playerName')
        .equalTo(playerName)
        .once('value');

      if (!snapshot.exists()) {
        return null;
      }

      let best = null;
      snapshot.forEach(child => {
        const entry = child.val();
        if (!best || entry.score > best.score) {
          best = { id: child.key, ...entry };
        }
      });

      return best;
    } catch (error) {
      console.error('Personal best fetch failed:', error);
    }
  }

  // 로컬에서 찾기
  const scores = storage.get(STORAGE_KEYS.LOCAL_SCORES, []);
  const playerScores = scores.filter(s => s.playerName.toLowerCase() === playerName.toLowerCase());

  if (playerScores.length === 0) {
    return null;
  }

  return playerScores.sort((a, b) => b.score - a.score)[0];
}

// ============================================
// 초기화
// ============================================

export function initLeaderboard() {
  // Firebase 초기화는 선택적 - 실패해도 게임 계속 진행
  try {
    const savedConfig = getFirebaseConfig();
    if (savedConfig) {
      initFirebase();
    }
  } catch (error) {
    console.warn('Firebase initialization skipped:', error);
    // Firebase 없이도 게임 진행 가능 (localStorage 사용)
  }
}
