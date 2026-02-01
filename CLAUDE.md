# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

"빌런 참교육: AI FACE OFF" - 이미지를 업로드하고 클릭/탭으로 "참교육"하는 브라우저 기반 클리커 게임. TensorFlow.js로 얼굴 특징점(눈, 코, 입)을 인식하고, 정확한 타격 시 보너스 점수를 제공함. 점수에 따라 CSS 필터로 이미지가 실시간 변형됨.

## 개발 환경 설정

**순수 바닐라 JavaScript 프로젝트** - 빌드 도구, npm, package.json 없이 ES Modules를 브라우저에서 직접 실행합니다.

**로컬 실행:**

```bash
# 정적 파일 서버 실행
python -m http.server 8000
# 또는
npx serve .
```

**API 설정:**

1. `js/config.example.js`를 `js/config.js`로 복사
2. Gemini API 키와 Firebase 설정 추가
3. `config.js`는 gitignore에 포함됨

## 아키텍처

### 모듈 구조 (`js/`)

- **main.js** - 진입점. 게임 흐름 제어 (이미지 업로드 → 얼굴 인식 → 카운트다운 → 게임 → 게임오버)
- **gameState.js** - 중앙 상태 관리. `gameState` 객체와 `elements` DOM 참조 export
- **faceDetection.js** - TensorFlow.js MediaPipe FaceMesh를 사용한 얼굴 특징점 탐지. `FaceDetector` 클래스가 눈/코/입 중심점 계산
- **villainStorage.js** - 빌런 저장/관리. localStorage에 최대 10명 저장, CRUD 기능 제공
- **scoring.js** - 콤보/점수 계산. 얼굴 특징점 타격 시 보너스 점수 (눈 3배, 코 2.5배, 입 2배)
- **difficulty.js** - 3단계 난이도(EASY/NORMAL/HARD). K.O. 임계값과 점수 배율 정의
- **effects.js** - `ParticleSystem`과 `SoundManager` 클래스로 시각/청각 피드백 제공. Web Audio API로 절차적 사운드 생성
- **leaderboard.js** - Firebase Realtime Database 연동. localStorage 폴백 지원
- **gemini.js** - (선택적) Gemini 2.5 Flash Image API 연동. 현재는 CSS 필터 사용 중
- **utils.js** - 공통 유틸리티 (storage, 해시 생성, 시간 포맷팅)

### 핵심 데이터 흐름

1. **이미지 업로드** → base64 변환 → 저장 (선택)
2. **얼굴 인식** → `faceDetector.detectFace()`가 눈/코/입 특징점 추출 → 게임 상태에 저장
3. **게임 시작** → 30초 타이머 시작 → 클릭/터치 대기
4. **타격 처리** → 클릭 → `processPunch()` → 특징점 거리 계산 → 점수 보너스 적용 → 이펙트
5. **실시간 변형** → 누적 점수에 따라 CSS 필터 단계별 적용 (stage1/stage2/stage3)
6. **게임 오버** → 최종 점수 표시 → 결과 이미지 저장 (선택) → Firebase/localStorage 리더보드 등록

### 주요 설정 상수

- **SCORE_CONFIG** (`scoring.js`) - 기본 점수, 콤보 배율, 크리티컬 확률
- **FACE_HIT_MULTIPLIERS** (`scoring.js`) - 얼굴 특징점 보너스 배율 (눈 3x, 코 2.5x, 입 2x)
- **DIFFICULTY** (`difficulty.js`) - K.O. 임계값, 레벨 임계값, 점수 배율
- **MAX_VILLAINS** (`villainStorage.js`, 10) - localStorage에 저장 가능한 최대 빌런 수
- **DAMAGE_STAGES** (`main.js`) - CSS 필터 변형 단계 (0-299점: stage1, 300-699: stage2, 700+: stage3)

### Firebase 연동

리더보드용 Firebase Realtime Database 사용. 설정 방법:

1. **코드 설정** (`js/config.js`에 firebaseConfig 추가) - 권장
2. **게임 내 모달** (플레이 중 Firebase 설정 입력)
3. **폴백 모드** (Firebase 미설정 시 localStorage 자동 사용)

**상세 설정 가이드**: `firebase-setup.md` 참조

- Firebase 프로젝트 생성 및 Realtime Database 설정
- 보안 규칙 (테스트/프로덕션)
- Database Rules: 읽기 공개, 쓰기는 신규 엔트리만 허용
- 프로덕션 배포 시 해시 검증 적용 권장

## 배포

### GitHub Actions 자동 배포

`.github/workflows/deploy.yml`을 통한 Firebase Hosting 배포:

**배포 트리거:**

- `main` 브랜치에 push
- 수동 실행 (`workflow_dispatch`)

**필수 설정:**

1. GitHub Secrets에 `FIREBASE_TOKEN` 추가

   ```bash
   firebase login:ci
   # 생성된 토큰을 GitHub → Settings → Secrets에 추가
   ```

2. 배포 워크플로우 자동 실행
   - 파일 검증
   - Firebase CLI 설치
   - `firebase deploy --only hosting` 실행

**수동 배포:**

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 배포
firebase deploy --only hosting
```

**배포 체크리스트**: `/deploy` 명령어로 확인

## 코딩 규칙

### JavaScript 스타일

- **모듈**: ES Modules (import/export)
- **주석**: JSDoc 형식 (함수 위에)
- **변수명**: camelCase (예: gameState, geminiTransformer)
- **상수명**: UPPER_SNAKE_CASE (예: HIGH_SCORE_THRESHOLD, GEMINI_CONFIG)
- **파일 구조**: 모듈당 단일 책임 원칙

### 파일 헤더

```javascript
// ============================================
// [모듈 이름] - [간단한 설명]
// ============================================
```

### 함수 주석 예시

```javascript
/**
 * 타격 점수를 계산합니다.
 * @param {number} x - 타격 X 좌표
 * @param {number} y - 타격 Y 좌표
 * @param {number} timestamp - 타격 시각
 * @returns {{finalScore: number, isCritical: boolean, comboCount: number}}
 */
function calculateScore(x, y, timestamp) { ... }
```

### 커밋 컨벤션

- `feat`: 새 기능 추가
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `docs`: 문서 수정
- `style`: 코드 스타일 변경
- `perf`: 성능 개선

### 보안 규칙

- ❌ **절대 금지**: API 키 하드코딩
- ✅ **필수**: config.js 사용 (gitignore)
- ✅ **필수**: 사용자 입력 검증 (파일 크기, 타입)
- ✅ **권장**: innerHTML 대신 textContent 사용 (villainStorage.js에서 escapeHtml 사용)

### TensorFlow.js 얼굴 인식

- **모델**: MediaPipe FaceMesh (face-landmarks-detection)
- **백엔드**: WebGL (자동 폴백: CPU)
- **maxFaces**: 1 (한 얼굴만 탐지)
- **refineLandmarks**: true (정밀 탐지)
- **특징점 인덱스**:
  - 왼쪽 눈: [33, 133, 160, 159, 158, 157, 173]
  - 오른쪽 눈: [362, 263, 387, 386, 385, 384, 398]
  - 코: [1] (코 끝)
  - 입: [61, 291, 13, 14, 17, 0]

### CSS 필터 변형 (실시간)

- **stage1 (0-299점)**: saturate(0.7) brightness(0.95) - 당황
- **stage2 (300-699점)**: saturate(0.5) brightness(0.85) hue-rotate(10deg) - 아픔
- **stage3 (700+점)**: saturate(0.3) brightness(0.7) hue-rotate(20deg) contrast(1.1) - 만신창이
- **폴백**: Gemini API 사용 가능 (gemini.js에 구현되어 있으나 현재 미사용)

### 테스트 가이드

**로컬 테스트 워크플로우:**

```bash
# 서버 시작 및 테스트
/test-game
```

**테스트 체크리스트:**

- [ ] 이미지 업로드 (파일 선택, 미리보기, 크기 검증)
- [ ] 얼굴 인식 (눈/코/입 특징점 탐지, 인식 실패 시 폴백)
- [ ] 빌런 저장/불러오기 (최대 10명, 중복 이름 업데이트)
- [ ] 클릭/탭 타격 (파티클, 사운드, 콤보)
- [ ] 점수 계산 (기본 점수, 얼굴 특징점 보너스, 콤보 배율, 크리티컬)
- [ ] 실시간 CSS 변형 (stage1/2/3 점수별 자동 적용)
- [ ] 게임 오버 (K.O. 게이지, 최종 점수, 통계)
- [ ] 결과 저장 (빌런별 결과 이미지, 다운로드)
- [ ] 리더보드 (Firebase/localStorage 저장, 순위 표시)

**디버깅 명령어:**

- `/debug-ai` - Gemini API 디버깅 체크리스트
- `/performance-check` - FPS, 메모리, 파티클 수 분석
- `/setup-config` - config.js 초기 설정

**성능 목표:**

- FPS: 60 유지
- 메모리: 안정적 (누수 없음)
- 파티클: 최대 100개

### 문제 해결

**일반적인 에러와 해결 방법:**

| 에러 메시지                        | 원인                      | 해결 방법                                           |
| ---------------------------------- | ------------------------- | --------------------------------------------------- |
| `Failed to load module`            | ES Modules 경로 오류      | 상대 경로 확인, 서버에서 실행 중인지 확인           |
| `CORS error`                       | 로컬 서버 미실행          | `python -m http.server 8000` 실행                   |
| `TensorFlow.js 모델 로드 실패`     | CDN 로딩 실패 또는 WebGL  | 페이지 새로고침, 브라우저 WebGL 지원 확인           |
| `Face detection model not loaded`  | 얼굴 인식 모델 초기화 실패 | 콘솔에서 로딩 상태 확인, 백엔드 폴백(CPU) 시도      |
| `얼굴을 감지할 수 없습니다`        | 얼굴 미인식               | 정면 얼굴 사진 사용, 기본 모드로 게임 진행 가능     |
| `QuotaExceededError`               | localStorage 용량 초과    | 기존 빌런 삭제 (최대 10명 제한)                     |
| `Firebase permission denied`       | Database Rules 오류       | `firebase-setup.md` 참조, 규칙 확인                 |
| `최대 10명까지만 저장할 수 있습니다` | 빌런 저장 제한 도달       | 기존 빌런 삭제 후 재시도                            |

**디버깅 팁:**

- 브라우저 콘솔(F12) 확인
- TensorFlow.js 로딩 상태: `console.log(tf.version, faceLandmarksDetection)`
- 얼굴 인식 상태: `gameState.faceLandmarks` 확인 (눈/코/입 좌표)
- localStorage 빌런 목록: `localStorage.getItem('villain_strike_villains')`
- Firebase 연결: Network 탭에서 firebaseio.com 요청 확인

## Claude Code 활용 가이드

### Plan Mode 사용

복잡한 작업은 Plan Mode를 활용하세요:

1. `/plan` 명령어로 Plan Mode 진입
2. 파일 탐색 및 구현 계획 수립
3. Normal Mode로 돌아와서 계획대로 구현
4. 완료 후 `/commit`으로 커밋

**Plan Mode 사용이 권장되는 경우:**

- 여러 파일을 수정해야 하는 기능 추가
- 아키텍처 변경이 필요한 리팩토링
- 버그 원인이 불명확한 디버깅

### Context 관리

효율적인 작업을 위해 Context를 관리하세요:

- ✅ `/clear` 자주 사용: 새 작업 시작 시 컨텍스트 초기화
- ✅ 구체적인 지시: 파일명, 함수명, 예시 패턴 명시
- ✅ 검증 방법 포함: 테스트, 스크린샷, 예상 출력 제시
- ❌ 불필요한 히스토리 유지: 토큰 낭비 방지

**Context 관리 베스트 프랙티스 (2026)**:

- 🔥 **MCP Tool Search 활용**: 토큰 85% 절감 가능 (134k → 5k)
- ⚡ **Context7 MCP 사용**: 최신 라이브러리 문서 자동 검색
  ```
  "Gemini 2.5 Flash Image API 최신 문서 검색해줘"
  → Context7이 자동으로 최신 버전 문서 제공
  ```
- 📊 **컨텍스트 모니터링**: 상태 라인에서 사용량 확인
- 🎯 **작업 단위로 세션 분리**: 큰 작업은 Plan Mode → Normal Mode로 분할

### 커스텀 명령어

자주 사용하는 워크플로우는 `.claude/commands/` 에 저장하여 슬래시 명령어로 활용하세요.

**Skill Hot Reload (2026 신기능)**:

- 스킬 수정 시 세션 재시작 불필요
- `.claude/skills/` 또는 `~/.claude/skills/`에 저장
- 병렬 작업용 `context: fork` frontmatter 지원
  ```markdown
  ---
  description: AI 이미지 생성 백그라운드 작업
  context: fork
  ---
  ```

## 트렌드 체크 일정

- **마지막 체크**: 2026-01-30
- **다음 체크 권장**: 2026-02-28 (월 1회)
- **실행 명령어**: `/upgrade-claude-code`
