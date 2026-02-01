---
description: 게임 배포 워크플로우
---

다음 단계를 실행하세요:

1. 배포 전 체크리스트
   - [ ] config.example.js가 최신인지 확인
   - [ ] API 키가 노출되지 않았는지 확인 (git grep GEMINI_API_KEY)
   - [ ] 모든 테스트 통과 확인

2. 빌드 (해당 없음 - 바닐라 JS)

3. Firebase Hosting 배포

   ```bash
   firebase deploy --only hosting
   ```

4. 배포 후 검증
   - [ ] 프로덕션 URL에서 게임 테스트
   - [ ] API 연동 확인
   - [ ] 리더보드 작동 확인
