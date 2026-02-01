// ============================================
// 공통 유틸리티 함수 모듈
// ============================================

// 슬립 함수 (비동기 대기)
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 난수 생성 (min ~ max)
export function random(min, max) {
  return Math.random() * (max - min) + min;
}

// 정수 난수 생성
export function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

// 배열에서 랜덤 선택
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 간단한 해시 생성 (점수 검증용)
export function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash).toString(16);
}

// UUID 생성
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 숫자 포맷팅 (천 단위 콤마)
export function formatNumber(num) {
  return num.toLocaleString('ko-KR');
}

// 퍼센트 포맷팅
export function formatPercent(value, decimals = 1) {
  return (value * 100).toFixed(decimals) + '%';
}

// 시간 포맷팅 (밀리초 -> "M:SS" 형식)
export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// LocalStorage 안전 접근
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  },
};

// 디바운스 함수
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 쓰로틀 함수
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 값 클램프 (범위 제한)
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// 선형 보간
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

// 이미지 파일을 Base64로 변환
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

// Base64에서 MIME 타입 추출
export function getBase64MimeType(base64) {
  const match = base64.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

// Base64 데이터 부분만 추출
export function getBase64Data(base64) {
  return base64.replace(/^data:[^;]+;base64,/, '');
}

// 진동 함수 (모바일)
export function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// 이벤트 발생 방지 (터치 디바이스 기본 동작)
export function preventDefaultTouch(element) {
  const events = ['touchstart', 'touchmove', 'touchend', 'contextmenu'];
  events.forEach(event => {
    element.addEventListener(
      event,
      e => {
        if (event !== 'touchstart' || e.touches.length > 1) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  });
}

// 날짜 포맷팅
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 상대적 시간 표시 (예: "3분 전")
export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  const intervals = [
    { label: '년', seconds: 31536000 },
    { label: '개월', seconds: 2592000 },
    { label: '일', seconds: 86400 },
    { label: '시간', seconds: 3600 },
    { label: '분', seconds: 60 },
    { label: '초', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} 전`;
    }
  }
  return '방금 전';
}

// 플레이어 이름 검증
export function validatePlayerName(name) {
  if (typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 15) {
    return false;
  }
  // 허용: 한글, 영문, 숫자, 밑줄, 하이픈, 공백
  if (!/^[a-zA-Z0-9가-힣_\-\s]+$/.test(trimmed)) {
    return false;
  }
  return true;
}

// 점수 해시 생성 (조작 방지용)
export function generateScoreHash(entry) {
  const data = `${entry.score}|${entry.hitCount}|${entry.maxCombo}|${entry.playTime}|${entry.timestamp}|VILLAIN_STRIKE_2024`;
  return simpleHash(data);
}

// 점수 엔트리 검증
export function validateScoreEntry(entry) {
  // 1. 해시 검증
  const expectedHash = generateScoreHash(entry);
  if (entry.hash !== expectedHash) {
    console.warn('Score hash mismatch');
    return false;
  }

  // 2. 논리적 검증
  if (entry.score < 0 || entry.hitCount < 0 || entry.maxCombo < 0) {
    console.warn('Invalid score values');
    return false;
  }

  if (entry.accuracyRate < 0 || entry.accuracyRate > 1) {
    console.warn('Invalid accuracy rate');
    return false;
  }

  // 3. 플레이 시간 검증 (최소 타격당 30ms)
  const minPlayTime = entry.hitCount * 30;
  if (entry.playTime < minPlayTime) {
    console.warn('Play time too short');
    return false;
  }

  return true;
}

// CSS 클래스 토글 유틸리티
export function toggleClass(element, className, condition) {
  if (condition) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

// 애니메이션 완료 대기
export function waitForAnimation(element) {
  return new Promise(resolve => {
    const handler = () => {
      element.removeEventListener('animationend', handler);
      resolve();
    };
    element.addEventListener('animationend', handler);
  });
}

// 로딩 표시 유틸리티
export function showLoading(overlay, progressEl, message) {
  if (progressEl) {
    progressEl.textContent = message;
  }
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

export function hideLoading(overlay) {
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// 모달 표시/숨기기
export function showModal(modal) {
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('modal-visible');
  }
}

export function hideModal(modal) {
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('modal-visible');
  }
}

// 콘솔 로그 스타일링
export function logInfo(message, ...args) {
  console.log(`%c[INFO] ${message}`, 'color: #00ff00; font-weight: bold;', ...args);
}

export function logWarn(message, ...args) {
  console.warn(`%c[WARN] ${message}`, 'color: #ffff00; font-weight: bold;', ...args);
}

export function logError(message, ...args) {
  console.error(`%c[ERROR] ${message}`, 'color: #ff0000; font-weight: bold;', ...args);
}
