# 심심할 때 스트레스 해소! 🎮

이미지를 업로드하고 클릭/탭으로 스트레스를 해소하는 브라우저 게임입니다.

## ✨ 주요 기능

- **얼굴 인식**: TensorFlow.js로 눈/코/입 자동 탐지
- **보너스 점수**: 얼굴 특징점 정확히 타격 시 점수 2-3배
- **빌런 저장**: 최대 10명까지 저장하고 불러오기
- **실시간 변형**: 점수에 따라 이미지 3단계 변형
- **효과음**: 카운트다운, 타격, 게임 오버 사운드

## 🎮 게임 방법

1. **이미지 업로드** - 사진 선택 또는 드래그 앤 드롭
2. **START 버튼 클릭** - 3, 2, 1 카운트다운
3. **15초 동안 타격** - 클릭/탭으로 연타
4. **점수 확인** - 최종 점수 및 통계 확인

### 💡 고득점 팁

- **눈 타격**: 3배 점수 (15점)
- **코 타격**: 2.5배 점수 (12점)
- **입 타격**: 2배 점수 (10점)
- **콤보 유지**: 연속 타격으로 최대 3배까지 증가
- **크리티컬**: 10% 확률로 2배 점수

## 🚀 로컬 실행

```bash
# 서버 시작 (Linux/Mac)
./start-server.sh

# 또는 Python 직접 실행
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

서버 종료: `./stop-server.sh` 또는 `Ctrl+C`

## 📦 배포

Cloudflare Pages로 무료 배포 가능합니다.

### Cloudflare Pages 배포 방법

1. **GitHub에 푸시**
   ```bash
   git add .
   git commit -m "Release version"
   git push origin main
   ```

2. **Cloudflare Pages 설정**
   - [Cloudflare Dashboard](https://dash.cloudflare.com) 로그인
   - **Workers & Pages** → **Create application** → **Pages**
   - **Connect to Git** → GitHub 저장소 선택
   - **Build settings:**
     - Framework preset: `None`
     - Build command: (비워두기)
     - Build output directory: `/`
   - **Save and Deploy** 클릭

3. **배포 완료**
   - 자동으로 빌드 및 배포됨
   - `https://your-project.pages.dev` 도메인 제공
   - `main` 브랜치에 푸시할 때마다 자동 재배포

### 커스텀 도메인 연결 (선택)

- Cloudflare Pages → **Custom domains** → 도메인 추가
- DNS 자동 설정됨

## 🛠️ 기술 스택

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **AI**: TensorFlow.js (얼굴 인식)
- **Audio**: Web Audio API (절차적 사운드 생성)
- **Storage**: localStorage (빌런 저장)

## 📝 프로젝트 구조

```
strike/
├── index.html          # 메인 HTML
├── style.css           # 스타일시트
├── js/
│   ├── main.js         # 메인 로직
│   ├── faceDetection.js # TensorFlow.js 얼굴 인식
│   ├── scoring.js      # 점수 계산
│   ├── effects.js      # 사운드/파티클 효과
│   ├── gameState.js    # 상태 관리
│   └── ...
└── start-server.sh     # 로컬 서버 시작 스크립트
```

## 🎯 게임 설정

- **게임 시간**: 15초
- **기본 점수**: 5점
- **카운트다운**: 마지막 5초
- **최대 빌런 저장**: 10명

## 📄 라이선스

MIT License

---

**즐거운 스트레스 해소 되세요!** 🎉
