# Cloudflare Pages 배포 가이드 📦

Cloudflare Pages로 **무료**로 배포하는 방법을 단계별로 설명합니다.

## 🌟 Cloudflare Pages 장점

- ✅ **무료 배포** (무제한 트래픽)
- ✅ **빠른 CDN** (전 세계 200+ 도시)
- ✅ **자동 HTTPS**
- ✅ **GitHub 연동** (푸시할 때마다 자동 배포)
- ✅ **커스텀 도메인** 무료 연결
- ✅ **무제한 빌드** 및 배포

---

## 📋 사전 준비

1. **GitHub 저장소**: 코드가 GitHub에 푸시되어 있어야 함
2. **Cloudflare 계정**: [cloudflare.com](https://cloudflare.com) 무료 가입

---

## 🚀 배포 단계

### 1단계: GitHub에 코드 푸시

```bash
# 최신 변경사항 커밋
git add .
git commit -m "Deploy to Cloudflare Pages"
git push origin main
```

### 2단계: Cloudflare Pages 프로젝트 생성

1. **Cloudflare Dashboard 로그인**
   - [https://dash.cloudflare.com](https://dash.cloudflare.com) 접속
   - 로그인 또는 계정 생성

2. **Workers & Pages 메뉴로 이동**
   - 왼쪽 사이드바에서 **Workers & Pages** 클릭

3. **새 프로젝트 생성**
   - **Create application** 버튼 클릭
   - **Pages** 탭 선택
   - **Connect to Git** 클릭

4. **GitHub 연동**
   - **GitHub** 선택
   - 권한 요청 화면에서 **Authorize** 클릭
   - 저장소 선택: `villain-strike-web` (또는 본인의 저장소)

### 3단계: 빌드 설정

**중요: 이 프로젝트는 순수 HTML/CSS/JS이므로 빌드가 필요 없습니다!**

다음과 같이 설정하세요:

```
Framework preset: None
Build command: (비워두기)
Build output directory: /
```

**상세 설정:**

| 항목 | 값 | 설명 |
|------|-----|------|
| **Project name** | `villain-strike` (원하는 이름) | URL에 사용됨 |
| **Production branch** | `main` | 자동 배포할 브랜치 |
| **Framework preset** | `None` | 빌드 도구 없음 |
| **Build command** | (비워두기) | 필요 없음 |
| **Build output directory** | `/` | 루트 디렉토리 |

### 4단계: 배포 시작

- **Save and Deploy** 버튼 클릭
- 자동으로 빌드 및 배포 시작 (약 1-2분 소요)

### 5단계: 배포 완료 확인

배포가 완료되면:

```
✅ Success! Your site is live at:
https://villain-strike.pages.dev
```

또는

```
https://your-project-name.pages.dev
```

---

## 🔄 자동 재배포

**main 브랜치에 푸시할 때마다 자동으로 재배포됩니다!**

```bash
# 코드 수정 후
git add .
git commit -m "Update game"
git push origin main

# 1-2분 후 자동으로 배포됨
```

배포 상태 확인:
- Cloudflare Dashboard → **Workers & Pages** → 프로젝트 클릭
- **Deployments** 탭에서 배포 로그 확인

---

## 🌐 커스텀 도메인 연결 (선택)

본인 도메인이 있다면 무료로 연결 가능합니다.

### 방법 1: Cloudflare에서 도메인 구매/이전

1. **Cloudflare에 도메인 추가**
   - Dashboard → **Domain Registration**
   - 도메인 구매 또는 기존 도메인 이전

2. **Pages 프로젝트에 연결**
   - Pages 프로젝트 → **Custom domains**
   - **Set up a custom domain** 클릭
   - 도메인 입력 (예: `game.yourdomain.com`)
   - DNS 자동 설정됨 ✅

### 방법 2: 외부 도메인 연결

1. **Pages에서 도메인 추가**
   - Pages 프로젝트 → **Custom domains**
   - 도메인 입력

2. **DNS 레코드 추가**
   - 도메인 제공업체 DNS 설정으로 이동
   - CNAME 레코드 추가:
     ```
     Name: game (또는 원하는 서브도메인)
     Type: CNAME
     Value: villain-strike.pages.dev
     ```

3. **SSL 인증서 자동 발급**
   - Cloudflare가 자동으로 SSL 인증서 발급 (무료)
   - 5-10분 소요

---

## 🛠️ 고급 설정

### 환경 변수 설정 (필요 시)

Cloudflare Pages → **Settings** → **Environment variables**

예: API 키 등을 환경 변수로 관리 가능

```
Key: GEMINI_API_KEY
Value: your-api-key-here
```

### 빌드 훅 (Webhook)

외부 서비스에서 빌드를 트리거하고 싶다면:

1. **Settings** → **Builds & deployments**
2. **Build hooks** → **Create hook**
3. Webhook URL 생성됨

```bash
# 배포 트리거
curl -X POST https://api.cloudflare.com/client/v4/pages/webhooks/deploy/...
```

---

## 🐛 문제 해결

### 1. 배포 실패

**증상**: 빌드가 실패하거나 404 에러

**해결 방법**:
- Build output directory가 `/`로 설정되었는지 확인
- `index.html`이 루트에 있는지 확인
- Build command가 비어있는지 확인

### 2. JavaScript 모듈 로드 실패

**증상**: `Failed to load module` 에러

**해결 방법**:
- 파일 경로가 상대 경로인지 확인 (예: `./js/main.js`)
- MIME type 문제: Cloudflare Pages는 자동으로 처리하므로 걱정 없음

### 3. 커스텀 도메인 SSL 인증서 대기 중

**증상**: "Pending" 상태가 오래 지속됨

**해결 방법**:
- DNS 전파 대기 (최대 24시간, 보통 1시간 이내)
- DNS 레코드가 올바른지 확인
- Cloudflare Proxy (오렌지 구름) 활성화 확인

---

## 📊 배포 모니터링

### Analytics 확인

Cloudflare Dashboard → **Workers & Pages** → 프로젝트 → **Analytics**

- 방문자 수
- 트래픽 (무제한!)
- 지역별 통계
- 성능 메트릭

### 로그 확인

**Deployment logs**:
- 각 배포의 상세 로그 확인 가능
- 에러 디버깅에 유용

---

## 💡 팁

1. **프리뷰 배포**
   - 브랜치를 푸시하면 자동으로 프리뷰 URL 생성
   - 예: `https://abc123.villain-strike.pages.dev`
   - 테스트 후 `main`에 머지

2. **Rollback**
   - 이전 배포 버전으로 롤백 가능
   - **Deployments** → 이전 배포 선택 → **Rollback**

3. **캐시 무효화**
   - 변경 사항이 즉시 반영 안 되면:
   - **Settings** → **Caching** → **Purge cache**

4. **성능 최적화**
   - 이미지 최적화: Cloudflare Images (유료)
   - 자동 압축: 기본 활성화
   - HTTP/3: 기본 지원

---

## 🎉 완료!

이제 게임이 전 세계에서 접속 가능합니다!

**배포 URL 예시**:
- `https://villain-strike.pages.dev`
- `https://game.yourdomain.com` (커스텀 도메인)

**공유하기**:
- SNS에 링크 공유
- QR 코드 생성하여 모바일에서 접속

---

**질문이나 문제가 있다면 Cloudflare Docs를 참고하세요:**
- [Cloudflare Pages 공식 문서](https://developers.cloudflare.com/pages/)
- [커뮤니티 포럼](https://community.cloudflare.com/)
