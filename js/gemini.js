// ============================================
// Gemini API 이미지 변형 모듈 (나노바나나)
// ============================================

import { gameState, elements } from './gameState.js';
import { storage, sleep, getBase64Data, getBase64MimeType } from './utils.js';
import { GEMINI_API_KEY, isGeminiConfigured } from './config.js';

// API 설정
const GEMINI_CONFIG = {
  // Gemini 2.5 Flash Image 모델 (나노바나나 - 이미지 생성/편집 지원)
  // 참고: https://ai.google.dev/gemini-api/docs/image-generation
  MODEL: 'gemini-2.5-flash-image',
  API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
  MAX_RETRIES: 3,
  TIMEOUT: 60000, // 60초
  RETRY_DELAY: 2000,
};

// 이미지 변형 프롬프트 (3단계: 당황 → 아픔 → K.O.)
const TRANSFORMATION_PROMPTS = {
  // 초반 (0-33% 점수): 당황한 표정
  stage1: `Transform this face into a slightly confused and worried cartoon expression:
- Eyes slightly widened with raised eyebrows (concerned look)
- Mouth slightly open with corners turned down
- Add a single sweat drop on forehead
- Keep style cartoonish and exaggerated
- Character still looks composed but starting to worry
- Add light nervous expression
Output only the edited image.`,

  // 중반 (34-66% 점수): 아파하는 표정
  stage2: `Transform this face into a hurt and pained cartoon expression:
- Eyes squinting or tearing up (tears forming)
- Nose slightly red with a small blood drop
- Mouth open showing teeth in pain
- Add bruise marks (purple/blue spots) on one cheek
- Light swelling visible on face
- Cartoon style with exaggerated pain expression
- Multiple sweat drops showing distress
Output only the edited image.`,

  // 종반 (67-100% 점수): K.O. 표정
  stage3: `Transform this face into a completely knocked-out/defeated cartoon expression:
- Eyes showing spiral dizzy marks or X's (classic cartoon KO eyes)
- Heavy nosebleed (red streams from nose)
- Tongue sticking out or mouth wide open drooling
- Multiple bruises and swelling all over face
- Add cartoon stars or birds circling above head
- Face looks totally defeated and battered
- Maximum cartoonish exaggeration of defeat
Output only the edited image.`,
};

// 저장 키
const STORAGE_KEY = 'villain_gemini_api_key';

// ============================================
// Gemini 이미지 변형 클래스
// ============================================

export class GeminiImageTransformer {
  constructor() {
    this.apiKey = null;
    this.cache = new Map();
    this.isProcessing = false;
  }

  // API 키 설정
  setApiKey(key, save = false) {
    this.apiKey = key;
    if (save) {
      storage.set(STORAGE_KEY, key);
    }
  }

  // 저장된 API 키 로드
  loadApiKey() {
    const saved = storage.get(STORAGE_KEY);
    if (saved) {
      this.apiKey = saved;
    }
    return this.apiKey;
  }

  // API 키 삭제
  clearApiKey() {
    this.apiKey = null;
    storage.remove(STORAGE_KEY);
  }

  // API 키 유효성 확인
  hasApiKey() {
    return !!this.apiKey;
  }

  // 단일 이미지 변형 (type: 'crying' 또는 'smiling')
  async transformImage(base64Image, type) {
    if (!this.apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    // 캐시 확인
    const cacheKey = `${type}_${base64Image.substring(0, 50)}`;
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached image for ${type}`);
      return this.cache.get(cacheKey);
    }

    const prompt = TRANSFORMATION_PROMPTS[type];
    if (!prompt) {
      throw new Error(`Invalid type: ${type}`);
    }

    // 재시도 로직
    let lastError = null;
    for (let attempt = 1; attempt <= GEMINI_CONFIG.MAX_RETRIES; attempt++) {
      try {
        console.log(`Generating ${type} image (attempt ${attempt})`);
        const result = await this._callGeminiAPI(base64Image, prompt);

        // 캐시에 저장
        this.cache.set(cacheKey, result);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error.message);

        if (attempt < GEMINI_CONFIG.MAX_RETRIES) {
          await sleep(GEMINI_CONFIG.RETRY_DELAY * attempt);
        }
      }
    }

    throw new Error(
      `이미지 생성 실패 (${GEMINI_CONFIG.MAX_RETRIES}회 시도): ${lastError?.message}`
    );
  }

  // Gemini API 호출
  async _callGeminiAPI(base64Image, prompt) {
    // Base64 데이터 처리
    const imageData = getBase64Data(base64Image);
    const mimeType = getBase64MimeType(base64Image);

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['Image'],
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    };

    const url = `${GEMINI_CONFIG.API_ENDPOINT}/${GEMINI_CONFIG.MODEL}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;

        if (response.status === 400) {
          throw new Error(`API 요청 오류: ${errorMessage}`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('API 키가 유효하지 않습니다.');
        } else if (response.status === 429) {
          throw new Error('API 요청 한도 초과. 잠시 후 다시 시도해주세요.');
        } else {
          throw new Error(`API 오류 (${response.status}): ${errorMessage}`);
        }
      }

      const data = await response.json();

      // 이미지 응답 추출
      const candidate = data.candidates?.[0];
      if (!candidate) {
        throw new Error('API 응답에 결과가 없습니다.');
      }

      const imagePart = candidate.content?.parts?.find(part =>
        part.inline_data?.mime_type?.startsWith('image/')
      );

      if (imagePart) {
        return `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`;
      }

      // 텍스트만 반환된 경우
      const textPart = candidate.content?.parts?.find(part => part.text);
      if (textPart) {
        console.warn('API returned text instead of image:', textPart.text);
        throw new Error('이미지 대신 텍스트가 반환되었습니다. 다시 시도해주세요.');
      }

      throw new Error('API 응답에서 이미지를 찾을 수 없습니다.');
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('요청 시간 초과. 네트워크 상태를 확인해주세요.');
      }

      throw error;
    }
  }

  // 3단계 AI 이미지 사전 생성 (당황 → 아픔 → K.O.)
  async preGenerateImages(base64Image, onProgress) {
    if (!this.apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    this.isProcessing = true;
    const results = { stage1: null, stage2: null, stage3: null };
    const stages = ['stage1', 'stage2', 'stage3'];
    const stageNames = {
      stage1: '당황한 표정',
      stage2: '아파하는 표정',
      stage3: 'K.O. 표정',
    };

    try {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        onProgress?.(`AI 이미지 생성 중... (${i + 1}/3) - ${stageNames[stage]}`, i + 1);

        try {
          results[stage] = await this.transformImage(base64Image, stage);
          console.log(`✓ ${stageNames[stage]} 이미지 생성 완료`);
        } catch (error) {
          console.error(`${stageNames[stage]} 생성 실패:`, error);
          results[stage] = null; // null = CSS 폴백 사용

          // 사용자에게 알림
          onProgress?.(`${stageNames[stage]} 이미지 생성 실패: ${error.message}`, i + 1, true);
        }

        // Rate limiting 방지를 위한 딜레이
        if (i < stages.length - 1) {
          await sleep(1500);
        }
      }

      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  // 캐시 클리어
  clearCache() {
    this.cache.clear();
  }

  // 처리 중 여부
  isGenerating() {
    return this.isProcessing;
  }
}

// ============================================
// API 키 입력 모달 관리
// ============================================

export function showApiKeyModal(onComplete) {
  const modal = elements.apiKeyModal;
  if (!modal) {
    console.error('API key modal not found');
    onComplete?.(false);
    return;
  }

  // 저장된 키 로드
  const savedKey = storage.get(STORAGE_KEY);
  const input = elements.apiKeyInput || document.getElementById('api-key-input');
  if (input && savedKey) {
    input.value = savedKey;
  }

  modal.style.display = 'flex';

  // 이벤트 핸들러 설정
  const saveBtn = document.getElementById('save-api-key-btn');
  const saveHandler = () => {
    const key = input?.value.trim();
    if (!key) {
      alert('API 키를 입력해주세요.');
      return;
    }

    const saveCheckbox = document.getElementById('save-api-key-checkbox');
    geminiTransformer.setApiKey(key, saveCheckbox?.checked);

    modal.style.display = 'none';
    saveBtn.removeEventListener('click', saveHandler);
    onComplete?.(true);
  };

  saveBtn?.addEventListener('click', saveHandler);

  // API 키는 필수이므로 건너뛰기 버튼 제거 또는 비활성화
  // 만약 건너뛰기를 허용하려면 아래 코드 활성화
  /*
    const skipBtn = document.getElementById('skip-api-key-btn');
    if (skipBtn) {
        skipBtn.style.display = 'none';  // 필수이므로 숨김
    }
    */
}

export function hideApiKeyModal() {
  const modal = elements.apiKeyModal;
  if (modal) {
    modal.style.display = 'none';
  }
}

// ============================================
// API 키 검증
// ============================================

export async function validateApiKey(apiKey) {
  if (!apiKey) {
    return false;
  }

  try {
    // 간단한 API 호출로 키 유효성 확인
    const url = `${GEMINI_CONFIG.API_ENDPOINT}/${GEMINI_CONFIG.MODEL}?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    // 200 또는 404(모델 정보 없음)면 키는 유효
    return response.status === 200 || response.status === 404;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
}

// ============================================
// 이미지 변형 적용
// ============================================

/**
 * 점수에 따라 적절한 단계의 AI 이미지 선택
 * @param {number} score - 현재 점수
 * @param {number} maxScore - 최대 점수 기준 (기본 1000)
 * @returns {{stage: string, percentage: number}}
 */
export function selectResultStage(score, maxScore = 1000) {
  const percentage = Math.min((score / maxScore) * 100, 100);

  let stage;
  if (percentage <= 33) {
    stage = 'stage1'; // 빌런 승리 - 당황한 표정
  } else if (percentage <= 66) {
    stage = 'stage2'; // 팽팽 - 아파하는 표정
  } else {
    stage = 'stage3'; // 빌런 패배 - K.O. 표정
  }

  return { stage, percentage };
}

// 게임 오버 시 점수에 따라 3단계 AI 이미지 적용
export function applyResultImage(score, maxScore = 1000) {
  const { stage, percentage } = selectResultStage(score, maxScore);
  const transform = gameState.transformedImages[stage];

  const stageNames = {
    stage1: '당황한 표정',
    stage2: '아파하는 표정',
    stage3: 'K.O. 표정',
  };

  if (transform && typeof transform === 'string' && transform.startsWith('data:')) {
    // AI 생성 이미지 사용
    elements.gameImage.src = transform;
    elements.gameImage.style.filter = 'none';
    console.log(`✓ ${stageNames[stage]} 적용 (점수: ${score}, ${percentage.toFixed(1)}%)`);
    return stage;
  } else {
    // 원본 이미지 유지 + CSS 필터 폴백
    applyCSSFallback(stage);
    console.log(`⚠ CSS 폴백 적용: ${stageNames[stage]}`);
    return stage;
  }
}

// 게임 중 원본 이미지 표시
export function showOriginalImage() {
  if (gameState.originalImage && elements.gameImage) {
    elements.gameImage.src = gameState.originalImage;
    elements.gameImage.style.filter = 'none';
  }
}

// CSS 필터 폴백 (3단계)
export function applyCSSFallback(stage) {
  const filters = {
    stage1: 'saturate(1.2) brightness(1.05)', // 약간 밝게 (당황)
    stage2: 'saturate(0.8) brightness(0.9) sepia(0.1)', // 약간 어둡게 (아픔)
    stage3: 'saturate(0.6) brightness(0.8) sepia(0.3)', // 어둡고 세피아 (K.O.)
  };

  if (elements.gameImage) {
    // 원본 이미지를 사용하되 CSS 필터 적용
    if (gameState.originalImage && elements.gameImage.src !== gameState.originalImage) {
      elements.gameImage.src = gameState.originalImage;
    }
    elements.gameImage.style.filter = filters[stage] || 'none';
  }
}

// ============================================
// 이미지 리사이즈 (API 요청 최적화)
// ============================================

export async function resizeImageForAPI(base64Image, maxSize = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // 최대 크기 제한
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      // 캔버스에 그리기
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG로 변환 (용량 절약)
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = base64Image;
  });
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const geminiTransformer = new GeminiImageTransformer();

// 초기화: config.js의 API 키 우선 사용, 없으면 저장된 키 로드
if (isGeminiConfigured()) {
  geminiTransformer.setApiKey(GEMINI_API_KEY, false);
  console.log('Gemini API 키가 config.js에서 로드되었습니다.');
} else {
  geminiTransformer.loadApiKey();
}
