// ============================================
// API 설정 파일 (배포용)
// ============================================
// Gemini API는 사용하지 않음 (CSS 필터 사용)
// Firebase는 리더보드용으로 사용
// ============================================

// Gemini API 키 (사용 안 함 - CSS 필터로 이미지 변형)
export const GEMINI_API_KEY = null;

// Firebase 설정
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBtQw6Mi7UCcdA-GCsYFBehrnqrQ2i1zdU',
  authDomain: 'villain-strike-game.firebaseapp.com',
  databaseURL: 'https://villain-strike-game-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'villain-strike-game',
  storageBucket: 'villain-strike-game.firebasestorage.app',
  messagingSenderId: '15224101527',
  appId: '1:15224101527:web:c1461e8663d214358867d2',
};

// API 키가 설정되었는지 확인 (localStorage 포함)
export function isGeminiConfigured() {
  try {
    return !!GEMINI_API_KEY || !!localStorage.getItem('geminiApiKey');
  } catch (e) {
    return false;
  }
}

export function isFirebaseConfigured() {
  try {
    const hasConfig = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL;
    const hasLocalConfig =
      localStorage.getItem('firebaseApiKey') && localStorage.getItem('firebaseDatabaseURL');
    return hasConfig || hasLocalConfig;
  } catch (e) {
    console.warn('Firebase config check failed:', e);
    return false;
  }
}
