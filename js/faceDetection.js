// ============================================
// Face Detection - TensorFlow.js 얼굴 특징점 탐지
// ============================================

/**
 * TensorFlow.js MediaPipe FaceMesh를 사용한 얼굴 특징점 탐지 클래스
 */
class FaceDetector {
  constructor() {
    this.model = null;
    this.isReady = false;
  }

  /**
   * 얼굴 인식 모델을 로드합니다 (앱 초기화 시 한 번만 호출)
   */
  async loadModel() {
    console.log('TensorFlow.js 얼굴 인식 모델 로딩 시작...');

    // TensorFlow.js 코어 확인
    if (typeof tf === 'undefined') {
      console.warn('⚠ TensorFlow.js 코어가 로드되지 않았습니다.');
      this.isReady = false;
      return false;
    }
    const tfVersion = tf.version ? tf.version.tfjs || tf.version_core || 'unknown' : 'unknown';
    console.log('✓ TensorFlow.js 코어 로드됨, 버전:', tfVersion);

    // face-landmarks-detection 확인
    if (typeof faceLandmarksDetection === 'undefined') {
      console.warn('⚠ face-landmarks-detection 라이브러리가 로드되지 않았습니다.');
      this.isReady = false;
      return false;
    }
    console.log('✓ face-landmarks-detection 라이브러리 로드됨');

    try {
      // WebGL 백엔드 설정 시도
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('✓ TensorFlow.js 백엔드 준비 완료:', tf.getBackend());

      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      console.log('모델 타입:', model);

      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1, // 한 얼굴만 탐지
      };

      console.log('디텍터 생성 중...');
      this.model = await faceLandmarksDetection.createDetector(model, detectorConfig);
      this.isReady = true;

      console.log('✓ TensorFlow.js 얼굴 인식 모델 로드 완료');
      return true;
    } catch (error) {
      console.error('❌ TensorFlow.js 모델 로드 실패:', error);
      console.warn('상세 오류:', error.message);
      this.isReady = false;
      return false;
    }
  }

  /**
   * 이미지에서 얼굴 특징점을 추출합니다
   * @param {HTMLImageElement} imageElement - 분석할 이미지 엘리먼트
   * @returns {Object|null} 얼굴 특징점 정보 또는 null (얼굴 없음)
   */
  async detectFace(imageElement) {
    if (!this.isReady) {
      throw new Error('Face detection model not loaded');
    }

    try {
      const faces = await this.model.estimateFaces(imageElement, {
        flipHorizontal: false,
      });

      if (faces.length === 0) {
        console.warn('얼굴을 감지할 수 없습니다');
        return null;
      }

      const face = faces[0]; // 첫 번째 얼굴 사용
      const keypoints = face.keypoints;

      // MediaPipe FaceMesh 주요 특징점 인덱스
      // 참고: https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection
      const landmarks = {
        leftEye: this.getEyeCenter(keypoints, [33, 133, 160, 159, 158, 157, 173]),
        rightEye: this.getEyeCenter(keypoints, [362, 263, 387, 386, 385, 384, 398]),
        nose: keypoints[1], // 코 끝
        mouth: this.getMouthCenter(keypoints, [61, 291, 13, 14, 17, 0]),
        faceBox: {
          x: face.box.xMin,
          y: face.box.yMin,
          width: face.box.width,
          height: face.box.height,
        },
      };

      console.log('✓ 얼굴 특징점 탐지 완료:', landmarks);
      return landmarks;
    } catch (error) {
      console.error('얼굴 탐지 중 오류:', error);
      return null;
    }
  }

  /**
   * 눈 영역 키포인트들의 중심점을 계산합니다
   * @param {Array} keypoints - 전체 키포인트 배열
   * @param {Array} indices - 눈 영역 키포인트 인덱스 배열
   * @returns {Object} 중심점 좌표 {x, y}
   */
  getEyeCenter(keypoints, indices) {
    let sumX = 0,
      sumY = 0;
    indices.forEach(i => {
      sumX += keypoints[i].x;
      sumY += keypoints[i].y;
    });
    return {
      x: sumX / indices.length,
      y: sumY / indices.length,
    };
  }

  /**
   * 입 영역 키포인트들의 중심점을 계산합니다
   * @param {Array} keypoints - 전체 키포인트 배열
   * @param {Array} indices - 입 영역 키포인트 인덱스 배열
   * @returns {Object} 중심점 좌표 {x, y}
   */
  getMouthCenter(keypoints, indices) {
    let sumX = 0,
      sumY = 0;
    indices.forEach(i => {
      sumX += keypoints[i].x;
      sumY += keypoints[i].y;
    });
    return {
      x: sumX / indices.length,
      y: sumY / indices.length,
    };
  }
}

// 싱글톤 인스턴스 export
export const faceDetector = new FaceDetector();
