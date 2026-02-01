// ============================================
// Villain Storage - 빌런 저장/불러오기 기능
// ============================================

const STORAGE_KEY = 'villain_strike_villains';
const MAX_VILLAINS = 10; // 최대 저장 가능한 빌런 수

/**
 * 저장된 빌런 목록을 가져옵니다
 * @returns {Array} 빌런 목록
 */
export function getVillains() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('빌런 목록 로드 실패:', error);
    return [];
  }
}

/**
 * 새 빌런을 저장합니다
 * @param {Object} villain - 빌런 정보
 * @param {string} villain.name - 빌런 이름
 * @param {string} villain.message - 다짐 메시지
 * @param {string} villain.image - base64 이미지
 * @param {string} [villain.resultImage] - 결과 이미지 (게임 후)
 * @returns {boolean} 저장 성공 여부
 */
export function saveVillain(villain) {
  try {
    const villains = getVillains();

    // 중복 이름 체크
    const existingIndex = villains.findIndex(v => v.name === villain.name);
    if (existingIndex !== -1) {
      // 기존 빌런 업데이트
      villains[existingIndex] = {
        ...villains[existingIndex],
        ...villain,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // 새 빌런 추가
      if (villains.length >= MAX_VILLAINS) {
        alert(`최대 ${MAX_VILLAINS}명까지만 저장할 수 있습니다. 기존 빌런을 삭제해주세요.`);
        return false;
      }

      villains.push({
        id: Date.now().toString(),
        name: villain.name || '이름 없는 빌런',
        message: villain.message || '',
        image: villain.image,
        resultImage: villain.resultImage || null,
        createdAt: new Date().toISOString(),
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(villains));
    console.log('✓ 빌런 저장 완료:', villain.name);
    return true;
  } catch (error) {
    console.error('빌런 저장 실패:', error);

    // 용량 초과 시
    if (error.name === 'QuotaExceededError') {
      alert('저장 공간이 부족합니다. 기존 빌런을 삭제해주세요.');
    }
    return false;
  }
}

/**
 * 빌런의 결과 이미지를 업데이트합니다
 * @param {string} villainId - 빌런 ID
 * @param {string} resultImage - 결과 이미지 (base64)
 * @returns {boolean} 저장 성공 여부
 */
export function updateVillainResult(villainId, resultImage) {
  try {
    const villains = getVillains();
    const index = villains.findIndex(v => v.id === villainId);

    if (index !== -1) {
      villains[index].resultImage = resultImage;
      villains[index].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(villains));
      console.log('✓ 빌런 결과 이미지 업데이트 완료');
      return true;
    }
    return false;
  } catch (error) {
    console.error('빌런 결과 업데이트 실패:', error);
    return false;
  }
}

/**
 * 빌런을 삭제합니다
 * @param {string} villainId - 빌런 ID
 * @returns {boolean} 삭제 성공 여부
 */
export function deleteVillain(villainId) {
  try {
    const villains = getVillains();
    const filtered = villains.filter(v => v.id !== villainId);

    if (filtered.length !== villains.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('✓ 빌런 삭제 완료');
      return true;
    }
    return false;
  } catch (error) {
    console.error('빌런 삭제 실패:', error);
    return false;
  }
}

/**
 * 빌런을 ID로 가져옵니다
 * @param {string} villainId - 빌런 ID
 * @returns {Object|null} 빌런 객체
 */
export function getVillainById(villainId) {
  const villains = getVillains();
  return villains.find(v => v.id === villainId) || null;
}

/**
 * 빌런 목록 UI를 렌더링합니다
 * @param {HTMLElement} container - 목록을 표시할 컨테이너
 * @param {Function} onSelect - 빌런 선택 시 콜백
 * @param {Function} onDelete - 빌런 삭제 시 콜백
 */
export function renderVillainList(container, onSelect, onDelete) {
  const villains = getVillains();

  if (villains.length === 0) {
    container.innerHTML = '<p class="empty-list">저장된 빌런이 없습니다.</p>';
    return;
  }

  container.innerHTML = villains
    .map(
      villain => `
        <div class="villain-card" data-id="${villain.id}">
            <img class="villain-card-thumbnail" src="${villain.image}" alt="${villain.name}">
            <div class="villain-card-info">
                <div class="villain-card-name">${escapeHtml(villain.name)}</div>
                <div class="villain-card-message">${escapeHtml(villain.message || '...')}</div>
            </div>
            <button class="villain-card-delete" data-id="${villain.id}" title="삭제">🗑️</button>
        </div>
    `
    )
    .join('');

  // 빌런 선택 이벤트
  container.querySelectorAll('.villain-card').forEach(card => {
    card.addEventListener('click', e => {
      if (!e.target.classList.contains('villain-card-delete')) {
        const id = card.dataset.id;
        const villain = villains.find(v => v.id === id);
        if (villain && onSelect) {
          onSelect(villain);
        }
      }
    });
  });

  // 삭제 버튼 이벤트
  container.querySelectorAll('.villain-card-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('이 빌런을 삭제하시겠습니까?')) {
        if (deleteVillain(id)) {
          renderVillainList(container, onSelect, onDelete);
          if (onDelete) {
            onDelete(id);
          }
        }
      }
    });
  });
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
