---
description: AI 이미지 생성 백그라운드 작업
context: fork
---

# Background AI Image Generation

이 스킬은 forked sub-agent 컨텍스트에서 실행되어 메인 작업을 방해하지 않고 AI 이미지를 생성합니다.

## 사용 사례

- 게임 시작 전 우는 얼굴/웃는 얼굴 이미지 미리 생성
- UI 작업과 병렬로 AI 이미지 처리
- 사용자 인터랙션을 차단하지 않는 백그라운드 작업

## 실행 방법

```javascript
// gemini.js에서 호출
async preGenerateImages(baseImage) {
  console.log('백그라운드에서 AI 이미지 생성 시작...');

  // 병렬로 두 이미지 생성
  const [cryingFace, smilingFace] = await Promise.all([
    this.generateImage(baseImage, '우는 얼굴 변형'),
    this.generateImage(baseImage, '웃는 얼굴 변형')
  ]);

  return { cryingFace, smilingFace };
}
```

## Gemini API 설정

### Model: gemini-2.5-flash-image

### Request Format

```javascript
{
  contents: [{
    parts: [
      { text: "prompt" },
      { inline_data: { mime_type: "image/jpeg", data: "base64..." } }
    ]
  }],
  generationConfig: {
    responseModalities: ['Image']
  }
}
```

### Error Handling

- 재시도: 최대 3회, 지수 백오프
- 타임아웃: 60초
- 폴백: CSS 필터 (saturate, brightness)

## 모니터링

- 생성 시간 측정
- 에러 로깅
- 캐시 히트율 추적
