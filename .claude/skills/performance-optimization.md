# 게임 성능 최적화 가이드

## 목표: FPS 60 유지

## 1. 렌더링 최적화

### Canvas/DOM 최적화

```javascript
// ❌ 나쁜 예: 매 프레임마다 DOM 조작
function render() {
  element.style.left = x + 'px';
  element.style.top = y + 'px';
}

// ✅ 좋은 예: transform 사용 (GPU 가속)
function render() {
  element.style.transform = `translate(${x}px, ${y}px)`;
}
```

### requestAnimationFrame 사용

```javascript
// ✅ 브라우저 렌더링 사이클에 맞춘 애니메이션
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

### 레이어 분리

- 정적 요소: 배경 이미지
- 동적 요소: 파티클, 이펙트
- UI 요소: 점수, 콤보

각각 별도 레이어로 관리하여 불필요한 리페인트 방지

## 2. 이벤트 최적화

### 이벤트 리스너 정리

```javascript
// ✅ 게임 종료 시 리스너 제거
function cleanup() {
  targetImage.removeEventListener('click', handlePunch);
  targetImage.removeEventListener('touchstart', handlePunch);
}
```

### Passive 이벤트 리스너

```javascript
// ✅ 스크롤 성능 향상
element.addEventListener('touchstart', handler, { passive: true });
```

## 3. 메모리 관리

### 객체 풀링 (Object Pooling)

```javascript
// 파티클 시스템에서 객체 재사용
class ParticlePool {
  constructor(size) {
    this.pool = Array(size)
      .fill(null)
      .map(() => new Particle());
    this.active = [];
  }

  get() {
    return this.pool.pop() || new Particle();
  }

  release(particle) {
    particle.reset();
    this.pool.push(particle);
  }
}
```

### 타이머 정리

```javascript
// ✅ 타이머 정리
function cleanup() {
  if (gameInterval) clearInterval(gameInterval);
  if (comboTimeout) clearTimeout(comboTimeout);
}
```

## 4. 이미지 최적화

### Base64 캐싱

```javascript
// ✅ 변환된 이미지 캐싱
const imageCache = new Map();

function cacheImage(key, base64) {
  imageCache.set(key, base64);
}

function getCachedImage(key) {
  return imageCache.get(key);
}
```

### 이미지 프리로드

```javascript
// ✅ 게임 시작 전 이미지 로드
async function preloadImages() {
  const promises = [loadImage('sad-face.png'), loadImage('happy-face.png')];
  await Promise.all(promises);
}
```

### 리사이즈 최적화

```javascript
// ✅ Canvas로 효율적 리사이즈
function resizeImage(img, maxSize) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const scale = Math.min(maxSize / img.width, maxSize / img.height);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}
```

## 5. 네트워크 최적화

### API 호출 디바운싱

```javascript
// ✅ 중복 요청 방지
let pendingRequest = null;

async function callAPI(data) {
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetch('/api', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const result = await pendingRequest;
  pendingRequest = null;
  return result;
}
```

### 재시도 로직 (이미 구현됨)

- 지수 백오프 사용
- 최대 3회 재시도
- 타임아웃 60초

## 6. Web Audio API 최적화

### AudioContext 재사용

```javascript
// ✅ 단일 AudioContext 사용
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}
```

### 사운드 풀링

- 자주 사용하는 사운드는 미리 생성
- 재사용 가능한 oscillator 풀 유지

## 7. 성능 측정

### FPS 모니터링

```javascript
let lastTime = performance.now();
let fps = 60;

function measureFPS() {
  const now = performance.now();
  const delta = now - lastTime;
  fps = 1000 / delta;
  lastTime = now;

  if (fps < 30) {
    console.warn('Low FPS detected:', fps);
  }
}
```

### Performance API

```javascript
// ✅ 성능 측정
performance.mark('game-start');
// ... 게임 로직 ...
performance.mark('game-end');
performance.measure('game-duration', 'game-start', 'game-end');

const measure = performance.getEntriesByName('game-duration')[0];
console.log('Game duration:', measure.duration);
```

## 8. 모바일 최적화

### 터치 이벤트 최적화

```javascript
// ✅ 터치 딜레이 제거
element.style.touchAction = 'manipulation';

// ✅ 300ms 딜레이 제거
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
```

### 절전 모드 대응

```javascript
// ✅ Page Visibility API
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseGame();
  } else {
    resumeGame();
  }
});
```

## 체크리스트

- [ ] FPS 60 유지 확인
- [ ] 메모리 누수 없음 (Chrome DevTools Memory Profiler)
- [ ] 이벤트 리스너 정리됨
- [ ] 이미지 캐싱 적용
- [ ] 타이머 정리됨
- [ ] 모바일 터치 반응 빠름 (300ms 이하)
- [ ] 네트워크 요청 최소화
