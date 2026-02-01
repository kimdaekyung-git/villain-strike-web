// ============================================
// 시각/청각 이펙트 모듈
// ============================================

import { elements } from './gameState.js';
import { randomChoice, random } from './utils.js';
import { getComboLevel } from './scoring.js';

// ============================================
// 파티클 시스템
// ============================================

export class ParticleSystem {
  constructor(container) {
    this._container = container;
  }

  // 컨테이너 동적 가져오기 (DOM이 준비되지 않을 수 있으므로)
  get container() {
    return this._container || elements.effectsLayer || document.getElementById('effects-layer');
  }

  // 타격 파티클 생성
  createHitParticles(x, y, count = 8) {
    const container = this.container;
    if (!container) {
      console.warn('⚠ effects-layer 컨테이너를 찾을 수 없습니다.');
      return;
    }

    const colors = ['#ff0', '#f0f', '#0ff', '#ff4444', '#44ff44', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor = randomChoice(colors);

      // 랜덤 방향 및 속도
      const angle = (Math.PI * 2 * i) / count + random(-0.3, 0.3);
      const velocity = random(80, 150);
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      particle.style.setProperty('--vx', `${vx}px`);
      particle.style.setProperty('--vy', `${vy}px`);

      // 크기 랜덤화
      const size = random(4, 10);
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      container.appendChild(particle);

      // 애니메이션 후 제거
      setTimeout(() => particle.remove(), 600);
    }
  }

  // 콤보 텍스트 표시
  showComboEffect(combo, x, y) {
    const container = this.container;
    if (!container) {
      return;
    }

    const comboText = document.createElement('div');
    comboText.className = 'combo-text';
    comboText.textContent = `${combo} COMBO!`;
    comboText.style.left = `${x}px`;
    comboText.style.top = `${y}px`;

    // 콤보 레벨에 따른 스타일
    const level = getComboLevel(combo);
    comboText.classList.add(`combo-${level}`);

    container.appendChild(comboText);
    setTimeout(() => comboText.remove(), 800);
  }

  // 크리티컬 이펙트
  showCriticalEffect(x, y) {
    const container = this.container;
    if (!container) {
      return;
    }

    const critical = document.createElement('div');
    critical.className = 'critical-effect';
    critical.textContent = 'CRITICAL!';
    critical.style.left = `${x}px`;
    critical.style.top = `${y}px`;

    container.appendChild(critical);
    setTimeout(() => critical.remove(), 600);
  }

  // 정확도 이펙트 (얼굴 영역 타격)
  showAccurateEffect(x, y) {
    const container = this.container;
    if (!container) {
      return;
    }

    const accurate = document.createElement('div');
    accurate.className = 'accurate-effect';
    accurate.textContent = 'NICE!';
    accurate.style.left = `${x}px`;
    accurate.style.top = `${y - 30}px`;

    container.appendChild(accurate);
    setTimeout(() => accurate.remove(), 500);
  }

  // 점수 팝업
  showScorePopup(score, x, y, isCritical = false) {
    const container = this.container;
    if (!container) {
      return;
    }

    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${score}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    if (isCritical) {
      popup.classList.add('critical');
    }

    container.appendChild(popup);
    setTimeout(() => popup.remove(), 700);
  }

  // 레벨업 이펙트
  showLevelUpEffect(level) {
    const container = this.container;
    if (!container) {
      return;
    }

    const levelUp = document.createElement('div');
    levelUp.className = 'level-up-effect';

    const messages = {
      1: 'LEVEL 1!',
      2: 'LEVEL 2!',
      3: 'K.O.!!!',
    };
    levelUp.textContent = messages[level] || `LEVEL ${level}!`;

    if (level === 3) {
      levelUp.classList.add('ko-level');
    }

    container.appendChild(levelUp);
    setTimeout(() => levelUp.remove(), 1500);
  }
}

// ============================================
// 글러브 애니메이션
// ============================================

export function showPunchAnimation(x, y, container) {
  const effectsLayer = container || elements.effectsLayer;

  // 글러브 생성
  const glove = document.createElement('div');
  glove.className = 'punch-glove';

  // 좌/우 글러브 랜덤 선택
  const isLeft = Math.random() > 0.5;
  glove.classList.add(isLeft ? 'glove-left' : 'glove-right');

  // 위치 설정
  glove.style.left = `${x}px`;
  glove.style.top = `${y}px`;

  effectsLayer.appendChild(glove);

  // 타격 이펙트 추가
  showHitEffect(x, y, effectsLayer);

  // 애니메이션 후 제거
  setTimeout(() => glove.remove(), 300);
}

// 충격파 이펙트
export function showHitEffect(x, y, container) {
  const effectsLayer = container || elements.effectsLayer;

  const effect = document.createElement('div');
  effect.className = 'hit-effect';
  effect.style.left = `${x}px`;
  effect.style.top = `${y}px`;

  effectsLayer.appendChild(effect);
  setTimeout(() => effect.remove(), 500);
}

// ============================================
// 화면 효과
// ============================================

// 화면 흔들기
export function shakeScreen(intensity = 'normal') {
  const container = elements.targetContainer;
  if (!container) {
    return;
  }

  const shakeClass = intensity === 'heavy' ? 'shake-heavy' : 'shake-active';
  container.classList.add(shakeClass);

  setTimeout(() => {
    container.classList.remove(shakeClass);
  }, 300);
}

// 플래시 효과
export function flashScreen(color = 'white') {
  const flash = document.createElement('div');
  flash.className = 'flash-effect';
  flash.style.backgroundColor = color;

  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 200);
}

// ============================================
// 사운드 매니저
// ============================================

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
    this.muted = false;
  }

  init() {
    if (this.initialized) {
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.initialized = true;
      console.log('✓ SoundManager initialized, AudioContext state:', this.audioContext.state);

      // Chrome autoplay 정책: suspended 상태면 resume 필요
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('✓ AudioContext resumed');
        });
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // 뮤트 토글
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // 기본 펀치 사운드
  playPunch() {
    if (this.muted || !this.audioContext) {
      return;
    }
    this.init();

    const duration = 0.1;
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // 노이즈 버스트 생성
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    this._playBuffer(buffer, 0.3, duration);
  }

  // 강한 펀치 (크리티컬)
  playHeavyPunch() {
    if (this.muted || !this.audioContext) {
      return;
    }
    this.init();

    const duration = 0.15;
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    this._playBuffer(buffer, 0.45, duration);
  }

  // 콤보 사운드 (피치 상승)
  playCombo(comboCount) {
    if (this.muted || !this.audioContext) {
      return;
    }
    this.init();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    // 콤보 수에 따라 피치 상승
    oscillator.frequency.setValueAtTime(440 + comboCount * 15, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // 크리티컬 사운드
  playCritical() {
    if (this.muted || !this.audioContext) {
      return;
    }
    this.init();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // 레벨업 사운드 (아르페지오)
  playLevelUp() {
    if (this.muted || !this.audioContext) {
      return;
    }
    this.init();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.muted) {
          return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
      }, i * 80);
    });
  }

  // K.O. 사운드
  playKO() {
    if (this.muted || !this.audioContext) {
      return;
    }
    this.init();

    const duration = 0.8;
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // 드라마틱한 저음 + 노이즈
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate;
      data[i] =
        Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 2) * 0.4 +
        Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t * 3) * 0.3 +
        (Math.random() * 2 - 1) * Math.exp(-t * 5) * 0.2;
    }

    this._playBuffer(buffer, 0.5, duration);

    // 추가 임팩트 사운드
    setTimeout(() => {
      if (this.muted) {
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
    }, 200);
  }

  // UI 클릭 사운드
  playClick() {
    if (this.muted || !this.audioContext) {
      return;
    }
    this.init();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 1000;

    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // 성공 사운드 (점수 저장 등)
  playSuccess() {
    if (this.muted || !this.audioContext) {
      return;
    }
    this.init();

    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.muted) {
          return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
      }, i * 100);
    });
  }

  // 카운트다운 숫자 사운드 (3, 2, 1)
  playCountdown() {
    if (this.muted) {
      return;
    }
    this.init();

    if (!this.audioContext) {
      console.warn('⚠ AudioContext not available');
      return;
    }

    // AudioContext resume (Chrome autoplay 정책)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    console.log('🔊 Playing countdown sound');

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 800; // 높은 톤

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // 게임 시작 사운드 (GO!)
  playStart() {
    if (this.muted) {
      return;
    }
    this.init();

    if (!this.audioContext) {
      return;
    }

    // AudioContext resume (Chrome autoplay 정책)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 상승 아르페지오 (밝고 에너지 넘치는)
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6

    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.muted) {
          return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square';
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
      }, i * 60);
    });
  }

  // 게임 오버 사운드
  playGameOver() {
    if (this.muted) {
      return;
    }
    this.init();

    if (!this.audioContext) {
      return;
    }

    // AudioContext resume (Chrome autoplay 정책)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 하강 멜로디 (드라마틱한)
    const notes = [880, 784, 698.46, 659.25, 523.25]; // A5, G5, F5, E5, C5

    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.muted) {
          return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.25);
      }, i * 150);
    });
  }

  // 내부: 버퍼 재생
  _playBuffer(buffer, gain, duration) {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }
}

// ============================================
// 진동 효과 (모바일)
// ============================================

export function vibrateDevice(pattern = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// 펀치 진동
export function vibratePunch() {
  vibrateDevice(50);
}

// K.O. 진동 패턴
export function vibrateKO() {
  vibrateDevice([100, 50, 100, 50, 200]);
}

// ============================================
// 데미지 오버레이 (멍, 부기 등)
// ============================================

// 오버레이 컨테이너 생성
export function createDamageOverlayContainer() {
  // damage-overlay 요소 사용 (HTML에 이미 존재)
  let container = elements.damageOverlay || document.getElementById('damage-overlay');
  if (!container) {
    container = document.createElement('div');
    container.id = 'damage-overlay';
    container.className = 'damage-overlay';
    elements.targetContainer?.appendChild(container);
  }
  return container;
}

// 멍 추가
export function addBruises(count) {
  const container = createDamageOverlayContainer();

  for (let i = 0; i < count; i++) {
    const bruise = document.createElement('div');
    bruise.className = 'bruise';

    // 랜덤 위치 및 크기
    const size = random(40, 80);
    bruise.style.width = `${size}px`;
    bruise.style.height = `${size}px`;
    bruise.style.left = `${random(15, 70)}%`;
    bruise.style.top = `${random(15, 55)}%`;
    bruise.style.animationDelay = `${i * 0.1}s`;

    container.appendChild(bruise);
  }
}

// 부기 추가
export function addSwellings(count) {
  const container = createDamageOverlayContainer();

  for (let i = 0; i < count; i++) {
    const swelling = document.createElement('div');
    swelling.className = 'swelling';

    const size = random(60, 120);
    swelling.style.width = `${size}px`;
    swelling.style.height = `${size}px`;
    swelling.style.left = `${random(10, 65)}%`;
    swelling.style.top = `${random(10, 55)}%`;
    swelling.style.animationDelay = `${i * 0.2}s`;

    container.appendChild(swelling);
  }
}

// K.O. 별 추가
export function addKOStars() {
  const stars = document.createElement('div');
  stars.className = 'ko-stars';
  stars.textContent = '⭐✨⭐✨⭐';
  elements.targetContainer?.appendChild(stars);
}

// 반창고 추가
export function addBandages(count) {
  const container = createDamageOverlayContainer();

  for (let i = 0; i < count; i++) {
    const bandage = document.createElement('div');
    bandage.className = 'bandage';
    bandage.textContent = '🩹';

    // 랜덤 위치 및 회전
    bandage.style.left = `${random(20, 75)}%`;
    bandage.style.top = `${random(20, 60)}%`;
    bandage.style.transform = `rotate(${random(-45, 45)}deg)`;
    bandage.style.fontSize = `${random(30, 50)}px`;
    bandage.style.animationDelay = `${i * 0.15}s`;

    container.appendChild(bandage);
  }
}

// 눈탱이 (다크서클) 추가
export function addBlackEyes(count) {
  const container = createDamageOverlayContainer();

  for (let i = 0; i < count; i++) {
    const blackEye = document.createElement('div');
    blackEye.className = 'black-eye';

    // 눈 위치 (왼쪽, 오른쪽)
    const isLeft = i % 2 === 0;
    blackEye.style.left = isLeft ? '30%' : '65%';
    blackEye.style.top = '30%';

    container.appendChild(blackEye);
  }
}

// 머리카락 빠지기
export function addFallingHair(count) {
  const container = createDamageOverlayContainer();

  for (let i = 0; i < count; i++) {
    const hair = document.createElement('div');
    hair.className = 'falling-hair';
    hair.textContent = '💈';

    // 랜덤 시작 위치 (머리 윗부분)
    hair.style.left = `${random(30, 70)}%`;
    hair.style.top = `${random(5, 25)}%`;
    hair.style.animationDelay = `${i * 0.2}s`;
    hair.style.animationDuration = `${random(2, 3)}s`;

    container.appendChild(hair);
  }
}

// 데미지 오버레이 초기화
export function clearDamageOverlays() {
  const container = elements.damageOverlay || document.getElementById('damage-overlay');
  if (container) {
    container.innerHTML = '';
  }

  // K.O. 별 제거
  const koStars = elements.targetContainer?.querySelector('.ko-stars');
  if (koStars) {
    koStars.remove();
  }
}

// 레벨별 데미지 적용
export function applyDamageEffects(level) {
  clearDamageOverlays();

  switch (level) {
    case 1:
      addBruises(2);
      break;
    case 2:
      addBruises(4);
      addSwellings(2);
      break;
    case 3:
      addBruises(6);
      addSwellings(3);
      addKOStars();
      break;
  }
}

/**
 * 점수에 따라 누적 데미지 효과 적용 (레벨업 없이도 호출 가능)
 * 각 점수 임계값에 도달하면 해당 효과가 순차적으로 추가됨
 * @param {number} score - 현재 점수
 */
export function applyProgressiveDamageEffects(score) {
  // 기존 효과는 유지하면서 추가 (clearDamageOverlays 호출 안 함)
  const container = createDamageOverlayContainer();
  if (!container) {
    console.warn('⚠ damage-overlay 컨테이너를 찾을 수 없습니다.');
    return;
  }

  // 100점 이상: 작은 멍 1개
  if (score >= 100 && container.querySelectorAll('.bruise').length < 1) {
    console.log(`💢 멍 추가 (score: ${score})`);
    addBruises(1);
  }

  // 150점 이상: 멍 추가 (총 2개)
  if (score >= 150 && container.querySelectorAll('.bruise').length < 2) {
    console.log(`💢 멍 추가 (score: ${score})`);
    addBruises(1);
  }

  // 250점 이상: 붓기 시작
  if (score >= 250 && container.querySelectorAll('.swelling').length < 1) {
    console.log(`💨 붓기 추가 (score: ${score})`);
    addSwellings(1);
  }

  // 350점 이상: 반창고 등장
  if (score >= 350 && container.querySelectorAll('.bandage').length < 1) {
    console.log(`🩹 반창고 추가 (score: ${score})`);
    addBandages(1);
  }

  // 450점 이상: 눈탱이 시작 (한쪽)
  if (score >= 450 && container.querySelectorAll('.black-eye').length < 1) {
    console.log(`🥊 눈탱이 추가 (score: ${score})`);
    addBlackEyes(1);
  }

  // 550점 이상: 멍 대폭 증가 (총 5개)
  if (score >= 550 && container.querySelectorAll('.bruise').length < 5) {
    console.log(`💢 멍 대폭 증가 (score: ${score})`);
    addBruises(2);
  }

  // 650점 이상: 머리카락 빠지기
  if (score >= 650 && container.querySelectorAll('.falling-hair').length < 2) {
    console.log(`💇 머리카락 빠지기 (score: ${score})`);
    addFallingHair(2);
  }

  // 750점 이상: 양쪽 눈탱이
  if (score >= 750 && container.querySelectorAll('.black-eye').length < 2) {
    console.log(`🥊 양쪽 눈탱이 (score: ${score})`);
    addBlackEyes(1); // 기존 1개 + 1개 = 2개
  }

  // 850점 이상: 완전 K.O. - 추가 효과
  if (score >= 850 && !container.querySelector('.ko-stars')) {
    console.log(`⭐ K.O. 총집합! (score: ${score})`);
    addBruises(2); // 멍 추가
    addSwellings(1); // 붓기 추가
    addBandages(1); // 반창고 추가
    addFallingHair(1); // 머리카락 추가
    addKOStars(); // K.O. 별
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const particleSystem = new ParticleSystem();
export const soundManager = new SoundManager();
