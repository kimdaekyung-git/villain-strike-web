# Firebase 배포 가이드

## Firebase Hosting 셋업

### 초기 설정

```bash
# Firebase CLI 설치 (글로벌)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init hosting
```

### 설정 옵션

- Public directory: `.` (루트 디렉토리)
- Single-page app: `No` (정적 사이트)
- GitHub Actions: 선택 사항

### firebase.json 기본 구조

```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**", "js/config.js"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 배포 프로세스

### 1. 배포 전 체크리스트

- [ ] `/test-game` 로컬 테스트 완료
- [ ] config.js가 .gitignore에 포함됨 (API 키 보호)
- [ ] 프로덕션 API 키 설정 확인
- [ ] Firebase 프로젝트 설정 완료

### 2. 배포 실행

```bash
# 미리보기 (로컬)
firebase serve

# 프로덕션 배포
firebase deploy
```

### 3. 배포 후 확인

```bash
# 배포 URL 확인
firebase hosting:channel:list

# 브라우저에서 확인
# https://your-project.web.app
```

## 환경 변수 관리

### Firebase Hosting Environment Config

Firebase Hosting은 환경 변수를 직접 지원하지 않으므로, 다음 전략 사용:

**방법 1: 빌드 타임 주입 (권장)**

```bash
# .env 파일 생성
echo "GEMINI_API_KEY=your_key" > .env

# 배포 스크립트에서 config.js 생성
node scripts/generate-config.js
firebase deploy
```

**방법 2: Firebase Functions 프록시**

- Firebase Functions로 API 키를 서버 사이드에서 관리
- 클라이언트는 Functions를 통해 Gemini API 호출

**방법 3: Firebase Remote Config**

- 런타임에 설정 값 가져오기
- 실시간 업데이트 가능

## 롤백

```bash
# 이전 버전으로 롤백
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

## 트러블슈팅

### 403 Forbidden

- Firebase 프로젝트 권한 확인
- `firebase login` 재실행

### 404 Not Found

- firebase.json의 public 경로 확인
- index.html 파일 존재 확인

### API 호출 실패

- CORS 설정 확인 (Gemini API는 CORS 지원)
- API 키 환경 변수 확인
