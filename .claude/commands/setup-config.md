---
description: config.js 셋업 자동화
---

프로젝트 초기 설정을 위해 다음 단계를 실행하세요:

1. config.example.js 복사

   ```bash
   cp js/config.example.js js/config.js
   ```

2. 사용자에게 API 키 입력 요청:
   - Gemini API 키 (https://aistudio.google.com/app/apikey)
   - Firebase 설정 (firebase-setup.md 참조)

3. config.js 파일 생성 확인

   ```bash
   ls -la js/config.js
   ```

4. .gitignore 확인
   - config.js가 포함되어 있는지 확인
   - 없으면 추가

5. 테스트
   - /test-game 실행하여 API 연동 확인
