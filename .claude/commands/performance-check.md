---
description: 게임 성능 체크 및 최적화 제안
---

다음 단계를 실행하여 게임 성능을 확인하고 최적화 제안을 제공하세요:

1. **파일 크기 체크**

   ```bash
   ls -lh js/*.js index.html css/*.css
   ```

2. **JavaScript 모듈 분석**
   - `effects.js` - Particle System 복잡도
   - `gemini.js` - API 호출 최적화
   - `main.js` - 게임 루프 효율성

3. **성능 체크리스트**
   - [ ] FPS 60 유지되는가?
   - [ ] 메모리 누수 없는가?
   - [ ] Particle 수가 적절한가? (< 100)
   - [ ] Event listener가 정리되는가?
   - [ ] Timer가 정리되는가? (clearTimeout/clearInterval)

4. **최적화 제안**
   - Object pooling 패턴 적용 여부
   - requestAnimationFrame 사용 여부
   - 불필요한 DOM 조작 최소화
   - Asset 프리로딩 전략

5. **Chrome DevTools 가이드**
   ```
   1. F12 → Performance 탭
   2. 녹화 시작 후 게임 플레이
   3. FPS, JS 실행 시간, Rendering 분석
   4. Memory 탭에서 Heap Snapshot 비교
   ```

performance-optimizer 에이전트를 호출하여 상세 분석을 받으세요.
