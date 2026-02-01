// ============================================
// API 설정 파일 템플릿
//
// 사용법:
// 1. 이 파일을 config.js로 복사하세요
// 2. API 키를 입력하세요
// 3. config.js는 .gitignore에 포함되어 있어 커밋되지 않습니다
// ============================================

// Gemini API 키 (나노바나나 이미지 생성)
// 발급: https://aistudio.google.com/app/apikey
export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

// Firebase 설정
// 발급: https://console.firebase.google.com
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  databaseURL: 'https://your-project-default-rtdb.firebasedatabase.app',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
};

// API 키가 설정되었는지 확인
export function isGeminiConfigured() {
  return GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE';
}

export function isFirebaseConfigured() {
  return (
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    FIREBASE_CONFIG.databaseURL
  );
}
