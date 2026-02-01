# Game Mechanics Patterns

## Scoring System (scoring.js)

- Base score: 10
- Combo multiplier: 1 + (comboCount \* 0.3)
- Critical hit: 15% 확률, 3배 점수
- Accuracy bonus: 얼굴 영역 타격 시 1.5배

## Difficulty Levels (difficulty.js)

- EASY: K.O. 100 hits
- NORMAL: K.O. 150 hits
- HARD: K.O. 200 hits

## Visual Effects (effects.js)

- ParticleSystem: 타격 파티클
- SoundManager: Web Audio API 절차적 사운드
- Screen shake: normal/heavy
- Damage overlays: 레벨당 투명도 증가

## Timer System (main.js)

- Game duration: 60초 (난이도별 조정 가능)
- Countdown: 마지막 10초
- Time's up: 자동 게임 오버

## State Management (gameState.js)

- gameState 객체: 중앙 상태
- elements: DOM 참조 캐시
- updateStats(): UI 동기화
