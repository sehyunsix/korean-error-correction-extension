/**
 * 한글 맞춤법 검사기 - 메인 로직
 * @file content-main.js
 * 
 * 모듈 로드 순서:
 * 1. config.js - 설정
 * 2. storage.js - Storage 관리
 * 3. text-utils.js - 텍스트 유틸리티  
 * 4. gemini-api.js - Gemini API
 * 5. ui-highlight.js - UI 하이라이트
 * 6. content-main.js - 메인 로직 (현재 파일)
 */

/**
 * 로딩 모달 표시
 */
function showLoadingModal() {
  // 검사 시작 시간 기록
  STATE.checkStartTime = Date.now();
  
  // 기존 로딩 모달 제거
  const existingModal = document.getElementById('spelling-loading-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'spelling-loading-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const loadingContent = document.createElement('div');
  loadingContent.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 48px 40px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
    min-width: 280px;
  `;

  loadingContent.innerHTML = `
    <div style="margin-bottom: 24px;">
      <div class="spinner-grammarly" style="
        border: 3px solid #d1fae5;
        border-top: 3px solid #15C39A;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        animation: spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        margin: 0 auto;
      "></div>
    </div>
    <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px; letter-spacing: -0.3px;">
      AI가 검사 중입니다
    </div>
    <div style="font-size: 14px; color: #6b7280; font-weight: 500;">
      잠시만 기다려주세요...
    </div>
  `;

  // 스피너 애니메이션 추가 (Grammarly 스타일)
  if (!document.getElementById('spinner-animation-style')) {
  const style = document.createElement('style');
    style.id = 'spinner-animation-style';
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  }

  modal.appendChild(loadingContent);
  document.body.appendChild(modal);
  
  console.log('⏳ 로딩 모달 표시');
}

/**
 * 로딩 모달 숨김
 */
function hideLoadingModal() {
  const modal = document.getElementById('spelling-loading-modal');
  if (modal) {
    modal.remove();
    console.log('✅ 로딩 모달 제거');
  }
}

/**
 * 교정 결과를 표시하는 모달 생성
 */
function showCorrectionModal(title, originalText, correctedText, errors, selectionInfo = null) {
  // 검사 소요 시간 계산
  const elapsedTime = STATE.checkStartTime ? Date.now() - STATE.checkStartTime : 0;
  const elapsedSeconds = (elapsedTime / 1000).toFixed(1);
  // iframe의 경우 Range를 미리 저장 (모달이 열리면 selection이 해제되므로)
  let savedRange = null;
  if (selectionInfo && selectionInfo.type === 'iframe' && selectionInfo.selection) {
    try {
      if (selectionInfo.selection.rangeCount > 0) {
        savedRange = selectionInfo.selection.getRangeAt(0).cloneRange();
        console.log('💾 Range 저장 완료:', savedRange.toString());
      }
  } catch (e) {
      console.warn('⚠️ Range 저장 실패:', e);
    }
  }
  
  // 기존 모달 제거
  const existingModal = document.getElementById('spelling-correction-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // 모달 컨테이너 생성 (중앙 배치)
  const modal = document.createElement('div');
  modal.id = 'spelling-correction-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(3px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
    animation: modalFadeIn 0.2s ease;
  `;

  // 모달 내용
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 0;
    width: 800px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 80px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
    animation: modalSlideIn 0.3s ease;
  `;
  
  // 애니메이션 및 스크롤바 스타일 추가
  if (!document.getElementById('modal-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes tooltipFadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      /* 웹킷 스크롤바 스타일 */
      .modal-scroll-content::-webkit-scrollbar {
        width: 8px;
      }
      .modal-scroll-content::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      .modal-scroll-content::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      .modal-scroll-content::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
  }

  // 각 수정 사항의 상태 관리 (accepted: 적용, rejected: 거절, pending: 대기)
  const correctionStates = errors.map((error, index) => ({
    id: index,
    error: error,
    state: 'accepted' // 기본값: 모두 적용
  }));

  // 수정 전 텍스트에 삭제 부분 하이라이트 적용
  let highlightedOriginalText = originalText;
  if (errors.length > 0) {
    // 오류를 위치 순서대로 정렬 (뒤에서부터 처리하기 위해)
    const sortedErrors = [...errors].sort((a, b) => {
      const indexA = originalText.indexOf(a.token);
      const indexB = originalText.indexOf(b.token);
      return indexB - indexA; // 역순 정렬
    });

    // 뒤에서부터 대체하여 인덱스가 틀어지지 않도록 함
    for (const error of sortedErrors) {
      const errorIndex = errors.indexOf(error);
      const tokenIndex = highlightedOriginalText.lastIndexOf(error.token);
      if (tokenIndex !== -1) {
        const before = highlightedOriginalText.substring(0, tokenIndex);
        const after = highlightedOriginalText.substring(tokenIndex + error.token.length);
        highlightedOriginalText = before + 
          `<span class="deleted-text" data-correction-id="${errorIndex}" style="background: #ffe5e5; padding: 2px 4px; border-radius: 3px; text-decoration: line-through; color: #d32f2f; font-weight: 600;">${error.token}</span>` +
          after;
      }
    }
  }

  // 모달 헤더
  const headerHTML = originalText !== correctedText ? `
    <div style="background: linear-gradient(135deg, #15C39A 0%, #0FA784 100%); padding: 20px 24px; color: white; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2 style="margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.5px;">✨ 맞춤법 교정 완료</h2>
          <span style="background: rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${elapsedSeconds}초</span>
      </div>
        <button id="close-modal-header" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          padding: 0;
          line-height: 1;
        ">✕</button>
      </div>
    </div>
  ` : `
    <div style="background: linear-gradient(135deg, #15C39A 0%, #0FA784 100%); padding: 20px 24px; color: white; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">✓</div>
      <div>
            <h2 style="margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
              완벽합니다!
              <span style="background: rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${elapsedSeconds}초</span>
            </h2>
          </div>
        </div>
        <button id="close-modal-header" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          padding: 0;
          line-height: 1;
        ">✕</button>
      </div>
    </div>
  `;
  
  // 교정된 텍스트에 추가 부분 하이라이트와 툴팁 추가
  let highlightedCorrectedText = correctedText;
  if (errors.length > 0) {
    // 오류를 위치 순서대로 정렬 (뒤에서부터 처리하기 위해)
    const sortedErrors = [...errors].sort((a, b) => {
      const indexA = correctedText.indexOf(a.suggestions[0]);
      const indexB = correctedText.indexOf(b.suggestions[0]);
      return indexB - indexA; // 역순 정렬
    });

    // 뒤에서부터 대체하여 인덱스가 틀어지지 않도록 함
    for (const error of sortedErrors) {
      const errorIndex = errors.indexOf(error);
      const correctedWord = error.suggestions[0];
      const tokenIndex = highlightedCorrectedText.lastIndexOf(correctedWord);
      if (tokenIndex !== -1) {
        const before = highlightedCorrectedText.substring(0, tokenIndex);
        const after = highlightedCorrectedText.substring(tokenIndex + correctedWord.length);
        const infoText = error.info || '맞춤법 오류';
        highlightedCorrectedText = before + 
          `<span class="corrected-word-tooltip added-text" data-correction-id="${errorIndex}" style="background: #c8e6c9; padding: 2px 4px; border-radius: 3px; color: #2e7d32; font-weight: 600; cursor: help; position: relative;" data-original="${error.token}" data-info="${infoText.replace(/"/g, '&quot;')}">${correctedWord}</span>` +
          after;
      }
    }
  }

  // 수정 사항 리스트 HTML 생성
  let correctionListHTML = '';
  if (errors.length > 0) {
    correctionListHTML = errors.map((error, index) => `
      <div class="correction-item" data-correction-id="${index}" style="
        padding: 12px 16px;
        border: 2px solid transparent;
        border-radius: 8px;
        background: #f9fafb;
        margin-bottom: 8px;
        transition: all 0.2s;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: #6b7280; background: #e5e7eb; padding: 2px 8px; border-radius: 10px;">#${index + 1}</span>
            <span class="correction-status-badge" style="font-size: 11px; font-weight: 600; color: #15C39A; background: #d1fae5; padding: 2px 8px; border-radius: 10px;">✓ 적용됨</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="accept-btn" data-correction-id="${index}" style="
              background: #15C39A;
              color: white;
              border: none;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            ">✓ 적용</button>
            <button class="reject-btn" data-correction-id="${index}" style="
              background: #e5e7eb;
              color: #6b7280;
              border: none;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            ">✕ 거절</button>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
          <span style="background: #ffe5e5; color: #d32f2f; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: line-through;">${error.token}</span>
          <span style="color: #9ca3af; font-size: 16px;">→</span>
          <span style="background: #c8e6c9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 600;">${error.suggestions[0]}</span>
        </div>
        <div style="font-size: 12px; color: #6b7280; line-height: 1.5; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #15C39A;">
          ${error.info || '맞춤법 오류'}
        </div>
      </div>
    `).join('');
  }

  // 텍스트 비교 HTML (2단 레이아웃 - 네이버 스타일)
  const comparisonHTML = originalText !== correctedText ? `
    <!-- 수정 사항 요약 및 네비게이션 -->
    <div style="background: #f9fafb; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 14px; font-weight: 700; color: #1f2937;">
            총 <span style="color: #15C39A;">${errors.length}개</span> 수정 사항
          </span>
          <span id="accepted-count" style="font-size: 13px; color: #6b7280;">
            <span style="color: #15C39A; font-weight: 600;">${errors.length}개</span> 적용됨
          </span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span id="current-correction-index" style="font-size: 13px; font-weight: 600; color: #6b7280;">1/${errors.length}</span>
          <button id="prev-correction" style="
            background: white;
            border: 1px solid #e5e7eb;
            color: #6b7280;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">◀ 이전</button>
          <button id="next-correction" style="
            background: white;
            border: 1px solid #e5e7eb;
            color: #6b7280;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">다음 ▶</button>
          <button id="accept-all" style="
            background: #15C39A;
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-left: 8px;
          ">✓ 전체 적용</button>
          <button id="reject-all" style="
            background: #ef4444;
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">✕ 전체 거절</button>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #e5e7eb; padding: 0;">
      <!-- 왼쪽: 원문 -->
      <div style="background: white; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <div style="font-weight: 700; color: #1f2937; font-size: 15px; letter-spacing: -0.3px;">원문</div>
          <div style="font-size: 11px; color: #9ca3af; font-weight: 500;">${originalText.length}자</div>
        </div>
        <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; line-height: 1.8; white-space: pre-wrap; word-break: break-word; font-size: 14px; color: #1f2937; min-height: 120px;">${highlightedOriginalText}</div>
      </div>
      
      <!-- 오른쪽: 교정 결과 -->
      <div style="background: white; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <div style="font-weight: 700; color: #15C39A; font-size: 15px; letter-spacing: -0.3px;">교정 결과</div>
          <div style="font-size: 11px; color: #15C39A; font-weight: 600; background: #d1fae5; padding: 2px 8px; border-radius: 12px;">${errors.length}개 수정</div>
          <div style="font-size: 11px; color: #9ca3af; font-weight: 500;">${correctedText.length}자</div>
        </div>
        <div id="corrected-text-container" style="padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; line-height: 1.8; white-space: pre-wrap; word-break: break-word; font-size: 14px; color: #1f2937; min-height: 120px;">${highlightedCorrectedText}</div>
      </div>
    </div>

    <!-- 수정 사항 상세 리스트 -->
    <div style="background: white; padding: 24px; border-top: 1px solid #e5e7eb;">
      <div style="font-weight: 700; color: #1f2937; font-size: 15px; letter-spacing: -0.3px; margin-bottom: 16px;">📝 수정 사항 상세</div>
      <div id="correction-list-container" style="max-height: 400px; overflow-y: auto;">
        ${correctionListHTML}
      </div>
    </div>
  ` : `
    <div style="padding: 32px; text-align: center;">
      <div style="display: inline-block; padding: 24px 32px; background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 12px;">
        <div style="width: 56px; height: 56px; background: #15C39A; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px;">✓</div>
        <div style="font-weight: 700; color: #065f46; margin-bottom: 12px; font-size: 18px; letter-spacing: -0.3px;">텍스트가 완벽합니다</div>
        <div style="line-height: 1.8; white-space: pre-wrap; word-break: break-word; color: #064e3b; font-size: 14px; max-width: 600px;">${originalText}</div>
      </div>
    </div>
  `;

  // 버튼 HTML 생성 (수정 가능한 타입이면 수정하기 버튼 추가)
  const canEdit = selectionInfo && (
    selectionInfo.type === 'input' || 
    selectionInfo.type === 'iframe' || 
    selectionInfo.type === 'contenteditable'
  );
  
  const buttonsHTML = canEdit ? `
    <div style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 10px;">
      <button id="replace-text" style="
        flex: 1;
        padding: 14px 20px;
        background: #15C39A;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(21, 195, 154, 0.2);
      ">
        ✅ 텍스트 수정하기
      </button>
      <button id="copy-corrected-text" style="
        flex: 1;
        padding: 14px 20px;
        background: #ffffff;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      ">
        📋 복사하기
      </button>
    </div>
  ` : `
    <div style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; justify-content: center;">
      <button id="copy-corrected-text" style="
        padding: 14px 32px;
        background: #15C39A;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(21, 195, 154, 0.2);
      ">
        📋 텍스트 복사
      </button>
    </div>
  `;

  modalContent.innerHTML = `
    ${headerHTML}
    <div class="modal-scroll-content" style="
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    ">
    ${comparisonHTML}
    </div>
    <div id="action-status" style="
      margin: 0 24px 12px 24px;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      display: none;
    "></div>
    ${buttonsHTML}
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // 버튼 요소 가져오기
  const replaceBtn = modalContent.querySelector('#replace-text');
  const copyBtn = modalContent.querySelector('#copy-corrected-text');
  const closeHeaderBtn = modalContent.querySelector('#close-modal-header');
  const actionStatus = modalContent.querySelector('#action-status');
  
  // 헤더 닫기 버튼 이벤트
  if (closeHeaderBtn) {
    closeHeaderBtn.addEventListener('mouseenter', () => {
      closeHeaderBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    closeHeaderBtn.addEventListener('mouseleave', () => {
      closeHeaderBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    closeHeaderBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  // 교정된 단어에 툴팁 이벤트 추가
  const correctedWords = modalContent.querySelectorAll('.corrected-word-tooltip');
  correctedWords.forEach(word => {
    let tooltipElement = null;
    
    word.addEventListener('mouseenter', (e) => {
      const original = word.getAttribute('data-original');
      const info = word.getAttribute('data-info');
      const corrected = word.textContent;
      
      // 툴팁 생성
      tooltipElement = document.createElement('div');
      tooltipElement.style.cssText = `
        position: fixed;
        background: white;
        padding: 0;
        border-radius: 12px;
        font-size: 13px;
        width: 280px;
        z-index: 1000000;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
        pointer-events: none;
        animation: tooltipFadeIn 0.2s ease;
      `;
      
      tooltipElement.innerHTML = `
        <div style="background: #d1fae5; padding: 12px 14px; border-radius: 12px 12px 0 0; border-bottom: 1px solid #a7f3d0;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 20px; background: #15C39A; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">✓</div>
            <div style="font-weight: 700; color: #065f46; font-size: 14px;">교정 완료</div>
          </div>
        </div>
        <div style="padding: 14px; background: white; border-radius: 0 0 12px 12px;">
          <div style="margin-bottom: 10px;">
            <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">원본</div>
            <div style="color: #991b1b; font-size: 13px; font-weight: 600; padding: 6px 10px; background: #fee2e2; border-radius: 4px; border: 1px solid #fecaca; text-decoration: line-through;">
              ${original}
            </div>
          </div>
          <div style="margin-bottom: 10px;">
            <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">수정</div>
            <div style="color: #065f46; font-size: 13px; font-weight: 600; padding: 6px 10px; background: #d1fae5; border-radius: 4px; border: 1px solid #a7f3d0;">
              ${corrected}
            </div>
          </div>
          <div style="color: #6b7280; font-size: 12px; line-height: 1.5; padding: 8px; background: #f9fafb; border-radius: 4px; border-left: 3px solid #15C39A;">
            ${info}
          </div>
        </div>
      `;
      
      document.body.appendChild(tooltipElement);
      
      // 툴팁 위치 계산
      const rect = word.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();
      
      // 오른쪽에 공간이 있으면 오른쪽, 없으면 왼쪽
      let left = rect.right + 10;
      if (left + tooltipRect.width > window.innerWidth) {
        left = rect.left - tooltipRect.width - 10;
      }
      
      // 위치 조정 (화면 밖으로 나가지 않도록)
      let top = rect.top;
      if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height - 10;
      }
      
      tooltipElement.style.left = left + 'px';
      tooltipElement.style.top = top + 'px';
    });
    
    word.addEventListener('mouseleave', () => {
      if (tooltipElement) {
        tooltipElement.remove();
        tooltipElement = null;
      }
    });
  });

  // 네비게이션 및 승인/거절 기능 구현
  let currentCorrectionIndex = 0;

  // 현재 보고 있는 수정 사항 업데이트
  function updateCurrentCorrection(index) {
    currentCorrectionIndex = index;
    const indexDisplay = modalContent.querySelector('#current-correction-index');
    if (indexDisplay) {
      indexDisplay.textContent = `${index + 1}/${errors.length}`;
    }

    // 모든 수정 항목의 하이라이트 제거
    const allItems = modalContent.querySelectorAll('.correction-item');
    allItems.forEach(item => {
      item.style.border = '2px solid transparent';
      item.style.background = '#f9fafb';
    });

    // 현재 항목 하이라이트
    const currentItem = modalContent.querySelector(`.correction-item[data-correction-id="${index}"]`);
    if (currentItem) {
      currentItem.style.border = '2px solid #fbbf24';
      currentItem.style.background = '#fffbeb';
      currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 이전/다음 버튼 상태 업데이트
    const prevBtn = modalContent.querySelector('#prev-correction');
    const nextBtn = modalContent.querySelector('#next-correction');
    if (prevBtn) prevBtn.disabled = (index === 0);
    if (nextBtn) nextBtn.disabled = (index === errors.length - 1);
  }

  // 최종 텍스트 생성 (승인된 수정만 반영)
  function generateFinalText() {
    let finalText = originalText;
    const acceptedCorrections = correctionStates
      .filter(state => state.state === 'accepted')
      .sort((a, b) => {
        // 뒤에서부터 적용해야 인덱스가 안 틀어짐
        const indexA = finalText.lastIndexOf(a.error.token);
        const indexB = finalText.lastIndexOf(b.error.token);
        return indexB - indexA;
      });

    for (const correction of acceptedCorrections) {
      const tokenIndex = finalText.lastIndexOf(correction.error.token);
      if (tokenIndex !== -1) {
        finalText = finalText.substring(0, tokenIndex) +
          correction.error.suggestions[0] +
          finalText.substring(tokenIndex + correction.error.token.length);
      }
    }

    return finalText;
  }

  // 승인/거절 상태 업데이트
  function updateCorrectionState(correctionId, newState) {
    correctionStates[correctionId].state = newState;

    // UI 업데이트
    const item = modalContent.querySelector(`.correction-item[data-correction-id="${correctionId}"]`);
    if (!item) return;

    const statusBadge = item.querySelector('.correction-status-badge');
    const acceptBtn = item.querySelector('.accept-btn');
    const rejectBtn = item.querySelector('.reject-btn');

    if (newState === 'accepted') {
      statusBadge.style.color = '#15C39A';
      statusBadge.style.background = '#d1fae5';
      statusBadge.textContent = '✓ 적용됨';
      acceptBtn.style.background = '#15C39A';
      acceptBtn.style.color = 'white';
      rejectBtn.style.background = '#e5e7eb';
      rejectBtn.style.color = '#6b7280';
    } else if (newState === 'rejected') {
      statusBadge.style.color = '#ef4444';
      statusBadge.style.background = '#fee2e2';
      statusBadge.textContent = '✕ 거절됨';
      acceptBtn.style.background = '#e5e7eb';
      acceptBtn.style.color = '#6b7280';
      rejectBtn.style.background = '#ef4444';
      rejectBtn.style.color = 'white';
    }

    // 승인된 개수 업데이트
    const acceptedCount = correctionStates.filter(s => s.state === 'accepted').length;
    const acceptedCountDisplay = modalContent.querySelector('#accepted-count');
    if (acceptedCountDisplay) {
      acceptedCountDisplay.innerHTML = `<span style="color: #15C39A; font-weight: 600;">${acceptedCount}개</span> 적용됨`;
    }
  }

  // 네비게이션 버튼 이벤트
  const prevBtn = modalContent.querySelector('#prev-correction');
  const nextBtn = modalContent.querySelector('#next-correction');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentCorrectionIndex > 0) {
        updateCurrentCorrection(currentCorrectionIndex - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentCorrectionIndex < errors.length - 1) {
        updateCurrentCorrection(currentCorrectionIndex + 1);
      }
    });
  }

  // 전체 적용/거절 버튼
  const acceptAllBtn = modalContent.querySelector('#accept-all');
  const rejectAllBtn = modalContent.querySelector('#reject-all');

  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', () => {
      correctionStates.forEach((state, index) => {
        updateCorrectionState(index, 'accepted');
      });
    });
  }

  if (rejectAllBtn) {
    rejectAllBtn.addEventListener('click', () => {
      correctionStates.forEach((state, index) => {
        updateCorrectionState(index, 'rejected');
      });
    });
  }

  // 개별 승인/거절 버튼
  const acceptBtns = modalContent.querySelectorAll('.accept-btn');
  const rejectBtns = modalContent.querySelectorAll('.reject-btn');

  acceptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const correctionId = parseInt(btn.getAttribute('data-correction-id'));
      updateCorrectionState(correctionId, 'accepted');
    });
  });

  rejectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const correctionId = parseInt(btn.getAttribute('data-correction-id'));
      updateCorrectionState(correctionId, 'rejected');
    });
  });

  // 초기 상태 설정
  if (errors.length > 0) {
    updateCurrentCorrection(0);
  }

  // 수정하기 버튼 (selectionInfo가 있을 때만)
  if (replaceBtn && selectionInfo) {
    replaceBtn.addEventListener('mouseenter', () => {
      replaceBtn.style.background = '#13B389';
      replaceBtn.style.transform = 'translateY(-1px)';
      replaceBtn.style.boxShadow = '0 4px 8px rgba(21, 195, 154, 0.3)';
    });
    replaceBtn.addEventListener('mouseleave', () => {
      replaceBtn.style.background = '#15C39A';
      replaceBtn.style.transform = 'translateY(0)';
      replaceBtn.style.boxShadow = '0 2px 4px rgba(21, 195, 154, 0.2)';
    });

    replaceBtn.addEventListener('click', () => {
      try {
        console.log('\n=== 텍스트 수정하기 시작 ===');
        console.log('📦 selectionInfo:', selectionInfo);
        console.log('📝 selectionInfo.type:', selectionInfo?.type);
        
        // 최종 텍스트 생성 (승인된 수정만 반영)
        const finalText = generateFinalText();
        console.log('📝 finalText:', finalText?.substring(0, 100));
        
        let success = false;

        // Input/Textarea 필드
        if (selectionInfo.type === 'input' && selectionInfo.element) {
          console.log('🔧 Input/Textarea 대체 시도...');
          console.log('📝 element:', selectionInfo.element);
          console.log('📝 start:', selectionInfo.start);
          console.log('📝 end:', selectionInfo.end);
          
          const element = selectionInfo.element;
          const start = selectionInfo.start;
          const end = selectionInfo.end;
          
          // 요소가 여전히 DOM에 있는지 확인
          if (!document.contains(element)) {
            console.error('❌ 요소가 DOM에서 제거되었습니다');
            throw new Error('요소를 찾을 수 없습니다. 페이지를 새로고침하고 다시 시도해주세요.');
          }
          
          // 값 대체
          const originalValue = element.value;
          element.value = element.value.substring(0, start) + finalText + element.value.substring(end);
          console.log('✅ 값 대체 완료');
          console.log(`  원본: "${originalValue.substring(start, end)}"`);
          console.log(`  대체: "${finalText}"`);
          
          // 커서 위치 설정 (교정된 텍스트 끝으로)
          const newCursorPos = start + finalText.length;
          element.setSelectionRange(newCursorPos, newCursorPos);
          element.focus();
          
          success = true;
          console.log('✅ Input/Textarea 텍스트 대체 성공');
        }
        // iframe 필드
        else if (selectionInfo.type === 'iframe') {
          console.log('🔧 iframe 대체 시도...');
          console.log('📝 element:', selectionInfo.element);
          console.log('📝 iframeWindow:', selectionInfo.iframeWindow);
          console.log('📝 savedRange:', savedRange);
          
          if (!selectionInfo.iframeWindow) {
            console.error('❌ iframeWindow가 없습니다');
            throw new Error('iframe 정보를 찾을 수 없습니다.');
          }
          
          if (!savedRange) {
            console.error('❌ 저장된 Range가 없습니다');
            throw new Error('선택 범위가 저장되지 않았습니다. 텍스트를 다시 선택해주세요.');
          }
          
          const iframeDoc = selectionInfo.iframeWindow.document;
          const iframeSelection = selectionInfo.iframeWindow.getSelection();
          
          console.log('📝 savedRange.toString():', savedRange.toString());
          
          try {
            // 저장된 Range 사용
            savedRange.deleteContents();
            console.log('✅ 기존 내용 삭제 완료');
            
            // 최종 텍스트 삽입
            const textNode = document.createTextNode(finalText);
            savedRange.insertNode(textNode);
            console.log('✅ 새 텍스트 삽입 완료');
            
            // 선택 해제 및 커서를 끝으로 이동
            iframeSelection.removeAllRanges();
            savedRange.collapse(false);
            iframeSelection.addRange(savedRange);
            
            success = true;
            console.log('✅ iframe 텍스트 대체 성공');
          } catch (rangeError) {
            console.error('❌ Range 조작 오류:', rangeError);
            throw new Error('텍스트 대체 중 오류가 발생했습니다. 페이지를 새로고침하고 다시 시도해주세요.');
          }
        }
        // ContentEditable 필드
        else if (selectionInfo.type === 'contenteditable') {
          console.log('✏️ ContentEditable 대체 시도...');
          console.log('📝 element:', selectionInfo.element);
          console.log('📝 selection:', selectionInfo.selection);
          
          if (!selectionInfo.selection || selectionInfo.selection.rangeCount === 0) {
            console.error('❌ Selection이 없습니다');
            throw new Error('선택 범위를 찾을 수 없습니다. 텍스트를 다시 선택해주세요.');
          }
          
          const selection = selectionInfo.selection;
          const range = selection.getRangeAt(0);
          
          try {
            // 기존 내용 삭제
            range.deleteContents();
            console.log('✅ 기존 내용 삭제 완료');
            
            // 최종 텍스트 삽입
            const textNode = document.createTextNode(finalText);
            range.insertNode(textNode);
            console.log('✅ 새 텍스트 삽입 완료');
            
            // 선택 해제 및 커서를 끝으로 이동
            selection.removeAllRanges();
            range.collapse(false);
            selection.addRange(range);
            
            success = true;
            console.log('✅ ContentEditable 텍스트 대체 성공');
          } catch (rangeError) {
            console.error('❌ Range 조작 오류:', rangeError);
            throw new Error('텍스트 대체 중 오류가 발생했습니다.');
          }
        } else {
          console.error('❌ 지원되지 않는 타입 또는 정보 부족');
          console.error('  type:', selectionInfo?.type);
          console.error('  element:', selectionInfo?.element);
          throw new Error('지원되지 않는 요소 타입입니다. 복사 버튼을 이용해주세요.');
        }

        if (success) {
          actionStatus.textContent = '✅ 텍스트가 수정되었습니다!';
          actionStatus.style.background = '#e8f5e9';
          actionStatus.style.color = '#388e3c';
          actionStatus.style.display = 'block';
          
          console.log('✅✅✅ 텍스트 수정 완료! ✅✅✅\n');
          
          // 0.5초 후 모달 닫기
          setTimeout(() => {
            modal.remove();
          }, 500);
        } else {
          console.error('❌ success가 false입니다');
          throw new Error('텍스트 대체 실패');
        }
      } catch (error) {
        console.error('\n❌❌❌ 텍스트 대체 오류 ❌❌❌');
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
        console.error('');
        
        actionStatus.textContent = `❌ ${error.message}`;
        actionStatus.style.background = '#ffebee';
        actionStatus.style.color = '#d32f2f';
        actionStatus.style.display = 'block';
      }
    });
  }

  // 복사 버튼 hover 효과
  copyBtn.addEventListener('mouseenter', () => {
    if (copyBtn.style.background === 'rgb(21, 195, 154)' || copyBtn.style.background === '#15C39A') {
      copyBtn.style.background = '#13B389';
      copyBtn.style.transform = 'translateY(-1px)';
    } else {
      copyBtn.style.background = '#f3f4f6';
      copyBtn.style.borderColor = '#9ca3af';
    }
  });
  copyBtn.addEventListener('mouseleave', () => {
    if (copyBtn.textContent.includes('복사')) {
      copyBtn.style.background = canEdit ? '#ffffff' : '#15C39A';
      copyBtn.style.borderColor = '#d1d5db';
      copyBtn.style.transform = 'translateY(0)';
    }
  });

  // 복사 버튼 클릭
  copyBtn.addEventListener('click', async () => {
    try {
      // 최종 텍스트 생성 (승인된 수정만 반영)
      const finalText = generateFinalText();
      await navigator.clipboard.writeText(finalText);
      actionStatus.textContent = '✅ 클립보드에 복사되었습니다!';
      actionStatus.style.background = '#e8f5e9';
      actionStatus.style.color = '#388e3c';
      actionStatus.style.display = 'block';
      
      console.log('✅ 클립보드 복사 성공:', finalText.substring(0, 50) + '...');
      
      // 0.5초 후 모달 자동 닫기
      setTimeout(() => {
        modal.remove();
      }, 500);
    } catch (error) {
      console.error('❌ 클립보드 복사 실패:', error);
      actionStatus.textContent = '❌ 복사 실패. 다시 시도해주세요.';
      actionStatus.style.background = '#ffebee';
      actionStatus.style.color = '#d32f2f';
      actionStatus.style.display = 'block';
    }
  });

  // 모달 배경 클릭시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // ESC 키로 닫기
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

/**
 * API로 맞춤법 검사 (Gemini 우선)
 */
async function checkSpellingWithAPI(text) {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (apiKey && apiKey.trim()) {
      console.log('🤖 Gemini API 사용');
      return await checkSpellingWithGemini(text, apiKey.trim());
    } else {
      console.log('📝 규칙 기반 사용 (API Key 없음)');
      return findErrorsWithRules(text, CONFIG.SPELLING_RULES, CONFIG.ERROR_PATTERNS);
    }
  } catch (error) {
    console.error('❌ API 맞춤법 검사 오류:', error);
    return null;
  }
}

/**
 * 선택된 텍스트 가져오기 (input/textarea/contenteditable/iframe 지원)
 */
function getSelectedText() {
  console.log('🔎 getSelectedText 함수 실행');
  
  // 1. 활성 요소 확인
  const activeElement = document.activeElement;
  console.log('🎯 activeElement:', activeElement);
  console.log('🎯 activeElement.tagName:', activeElement?.tagName);
  
  // 2. iframe 내부 선택 확인 (TinyMCE, CKEditor 등)
  if (activeElement && activeElement.tagName === 'IFRAME') {
    console.log('🖼️ iframe 감지! iframe 내부 확인...');
    try {
      const iframeDoc = activeElement.contentDocument || activeElement.contentWindow?.document;
      const iframeWindow = activeElement.contentWindow;
      
      if (iframeWindow && iframeDoc) {
        console.log('🖼️ iframe 접근 성공');
        const iframeSelection = iframeWindow.getSelection();
        console.log('🖼️ iframe selection:', iframeSelection?.toString());
        
        if (iframeSelection && iframeSelection.toString().trim()) {
          const selectedText = iframeSelection.toString().trim();
          console.log('🖼️ iframe에서 선택:', selectedText.substring(0, 100));
          return {
            text: selectedText,
            element: activeElement,
            type: 'iframe',
            selection: iframeSelection,
            iframeWindow: iframeWindow
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ iframe 접근 오류 (CORS일 수 있음):', error);
    }
  }
  
  // 3. 모든 iframe 검사 (activeElement가 iframe이 아닐 때도)
  console.log('🔍 모든 iframe 검사...');
  const iframes = document.querySelectorAll('iframe');
  console.log(`🖼️ 발견된 iframe: ${iframes.length}개`);
  
  for (let i = 0; i < iframes.length; i++) {
    const iframe = iframes[i];
    console.log(`🖼️ iframe[${i}] 확인:`, iframe.id || iframe.name || '(no id)');
    
    try {
      const iframeWindow = iframe.contentWindow;
      const iframeDoc = iframe.contentDocument || iframeWindow?.document;
      
      if (iframeWindow && iframeDoc) {
        const iframeSelection = iframeWindow.getSelection();
        const selectionText = iframeSelection?.toString().trim();
        
        console.log(`🖼️ iframe[${i}] selection:`, selectionText?.substring(0, 50) || '(없음)');
        
        if (selectionText) {
          console.log(`✅ iframe[${i}]에서 선택 발견!`);
          return {
            text: selectionText,
            element: iframe,
            type: 'iframe',
            selection: iframeSelection,
            iframeWindow: iframeWindow
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ iframe[${i}] 접근 오류:`, error.message);
    }
  }
  
  // 4. Input/Textarea 필드인 경우
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    console.log('📝 Input/Textarea 감지!');
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    console.log(`📝 Selection: start=${start}, end=${end}`);
    
    if (start !== end && start !== null && end !== null) {
      const selectedText = activeElement.value.substring(start, end);
      console.log('📝 Input/Textarea에서 선택:', selectedText.substring(0, 100));
      return {
        text: selectedText,
        element: activeElement,
        type: 'input',
        start: start,
        end: end
      };
  } else {
      console.log('📝 Input/Textarea에 선택 없음');
    }
  }
  
  // 5. ContentEditable 요소인 경우
  console.log('✏️ ContentEditable 확인:', activeElement?.isContentEditable);
  if (activeElement && activeElement.isContentEditable) {
    console.log('✏️ ContentEditable 감지!');
    const selection = window.getSelection();
    console.log('✏️ selection:', selection?.toString());
    if (selection && selection.toString().trim()) {
      console.log('✏️ ContentEditable에서 선택:', selection.toString().substring(0, 100));
      return {
        text: selection.toString().trim(),
        element: activeElement,
        type: 'contenteditable',
        selection: selection
      };
    }
  }
  
  // 6. 일반 텍스트 선택
  console.log('📄 일반 텍스트 선택 확인...');
  const selection = window.getSelection();
  console.log('📄 window.getSelection():', selection);
  console.log('📄 selection.toString():', selection?.toString());
  console.log('📄 selection.rangeCount:', selection?.rangeCount);
  
  if (selection && selection.toString().trim()) {
    console.log('📄 일반 텍스트 선택:', selection.toString().substring(0, 100));
    return {
      text: selection.toString().trim(),
      element: null,
      type: 'normal',
      selection: selection
    };
  }
  
  console.log('❌ 어떤 선택도 감지되지 않음!');
  return null;
}

/**
 * 미리 저장된 selection 정보를 활용한 getSelectedText (타이밍 문제 해결)
 */
function getSelectedTextWithPreserved(savedText, savedRange, activeElement) {
  console.log('🔎 getSelectedTextWithPreserved 실행');
  console.log('💾 savedText:', savedText?.substring(0, 50));
  console.log('💾 savedRange:', savedRange);
  console.log('💾 activeElement:', activeElement?.tagName);
  
  // 1. 저장된 일반 텍스트 선택이 있는 경우 (최우선)
  if (savedText && savedText.trim()) {
    console.log('✅ 저장된 텍스트 사용!');
    
    // activeElement에 따라 타입 결정
    if (activeElement) {
      if (activeElement.tagName === 'IFRAME') {
        console.log('📦 타입: iframe');
        try {
          const iframeWindow = activeElement.contentWindow;
          const iframeSelection = iframeWindow?.getSelection();
          return {
            text: savedText.trim(),
            element: activeElement,
            type: 'iframe',
            selection: iframeSelection,
            iframeWindow: iframeWindow,
            savedRange: savedRange
          };
        } catch (e) {
          console.warn('⚠️ iframe 접근 실패, 일반 텍스트로 처리');
        }
      } else if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
        console.log('📦 타입: input');
        return {
          text: savedText.trim(),
          element: activeElement,
          type: 'input',
          start: activeElement.selectionStart,
          end: activeElement.selectionEnd
        };
      } else if (activeElement.isContentEditable) {
        console.log('📦 타입: contenteditable');
        return {
          text: savedText.trim(),
          element: activeElement,
          type: 'contenteditable',
          selection: window.getSelection(),
          savedRange: savedRange
        };
      }
    }
    
    // 기본: 일반 텍스트 선택
    console.log('📦 타입: normal');
    return {
      text: savedText.trim(),
      element: null,
      type: 'normal',
      selection: window.getSelection(),
      savedRange: savedRange
    };
  }
  
  // 2. 저장된 텍스트가 없으면 기존 getSelectedText() 호출
  console.log('⚠️ 저장된 텍스트 없음, 기존 방식으로 시도...');
  return getSelectedText();
}

/**
 * 선택된 텍스트에 API 기반 하이라이트 적용 (저장된 선택 정보 사용)
 */
async function highlightErrorsWithSavedSelection(bodyElement, savedSelectionInfo) {
  console.log('\n=== 선택된 텍스트 맞춤법 검사 시작 (저장된 선택 사용) ===');
  console.log('📦 savedSelectionInfo:', savedSelectionInfo);
  
  if (!savedSelectionInfo || !savedSelectionInfo.text) {
    console.warn('⚠️ 선택된 텍스트 없음!');
    console.log('activeElement:', document.activeElement);
    console.log('activeElement.tagName:', document.activeElement?.tagName);
    console.log('window.getSelection():', window.getSelection()?.toString());
    console.log('텍스트를 선택해주세요.\n\n💡 Tip:\n- 마우스로 텍스트를 드래그하세요\n- Input 필드에서는 텍스트를 선택한 후 단축키를 누르세요');
    return 0;
  }

  const selectedText = savedSelectionInfo.text;
  console.log(`✅ 선택된 텍스트 (${savedSelectionInfo.type}): "${selectedText.substring(0, 100)}..."`);

  // 하이라이트 제거
  clearHighlights();

  try {
    // 로딩 모달 표시
    showLoadingModal();
    
    // API로 맞춤법 검사
    const result = await checkSpellingWithAPI(selectedText);
    
    // 로딩 모달 숨김
    hideLoadingModal();
    
    if (result === null || result === undefined) {
      alert('맞춤법 검사에 실패했습니다. 콘솔을 확인하세요.');
      return 0;
    }
    
    // API 오류 체크
    if (result.isError) {
      let errorMsg = `맞춤법 검사 오류: ${result.errorMessage}`;
      
      if (result.errorMessage.includes('403')) {
        errorMsg = '❌ API Key가 유효하지 않습니다.\n\n팝업에서 올바른 API Key를 입력해주세요.\nhttps://aistudio.google.com/app/apikey';
      } else if (result.errorMessage.includes('404')) {
        errorMsg = '❌ 모델을 찾을 수 없습니다.\n\n팝업에서 다른 모델을 선택해주세요.\n(🔄 버튼으로 모델 목록 새로고침)';
      } else if (result.errorMessage.includes('429')) {
        errorMsg = '❌ API 호출 한도를 초과했습니다.\n\n잠시 후 다시 시도해주세요.';
      }
      
      alert(errorMsg);
      return 0;
    }
    
    const errors = Array.isArray(result) ? result : (result.errors || []);

    // 교정된 텍스트 생성
    let correctedText = selectedText;
    for (const error of errors) {
      correctedText = correctedText.replace(error.token, error.suggestions[0]);
    }

    // 모든 경우에 모달 표시 (Google Docs, Sheets, 일반 HTML 모두 포함)
    if (errors.length === 0) {
      showCorrectionModal('✅ 오류가 없습니다!', selectedText, selectedText, [], savedSelectionInfo);
      console.log(`✅ ${savedSelectionInfo.type} - 오류 없음`);
      STATE.lastCheckStats.foundErrors = 0;
      return 0;
    }

    showCorrectionModal(
      `🔴 ${errors.length}개의 오류 발견`,
      selectedText,
      correctedText,
      errors,
      savedSelectionInfo
    );
    
    console.log(`🔴 ${savedSelectionInfo.type} - ${errors.length}개의 오류 발견`);
    STATE.lastCheckStats.foundErrors = errors.length;
    return errors.length;

  } catch (error) {
    // 로딩 모달 숨김 (오류 발생 시에도)
    hideLoadingModal();
    console.error('❌ 맞춤법 검사 오류:', error);
    alert('맞춤법 검사 중 오류가 발생했습니다.');
    return 0;
  }
}

/**
 * 선택된 텍스트에 API 기반 하이라이트 적용 (호환성 유지용)
 */
async function highlightErrors(bodyElement) {
  console.log('\n=== highlightErrors 호출 (호환성 유지) ===');
  const selectionInfo = getSelectedText();
  return await highlightErrorsWithSavedSelection(bodyElement, selectionInfo);
}

/**
 * 메시지 리스너
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('');
  console.log('*'.repeat(80));
  console.log('🎯 [CONTENT] 메시지 수신 감지!!!');
  console.log('📌 요청:', request);
  console.log('⏰ 시간:', new Date().toLocaleTimeString());
  console.log('*'.repeat(80));
  
  if (request.action === 'checkSpelling') {
    console.log('✅ 맞춤법 검사 액션 확인!');
    
    // 🔥 Chrome API에서 받은 selectionText 우선 사용!
    let savedText = request.selectionText || null;  // ← background.js에서 받은 텍스트
    console.log('💾 Background에서 받은 selectionText:', savedText?.substring(0, 50));
    
    // 만약 없다면 현재 selection 시도 (fallback)
    let savedRange = null;
    const activeElement = document.activeElement;
    
    if (!savedText) {
      console.log('⚠️ selectionText 없음, 현재 selection 확인...');
      const windowSelection = window.getSelection();
      
      if (windowSelection && windowSelection.rangeCount > 0) {
        savedText = windowSelection.toString();
        try {
          savedRange = windowSelection.getRangeAt(0).cloneRange();
        } catch (e) {
          console.warn('⚠️ Range 복사 실패:', e);
        }
      }
      console.log('💾 현재 selection:', savedText?.substring(0, 50));
    }
    
    console.log('🚀 검사 시작...');
    
    (async () => {
      try {
        const startTime = Date.now();
        
        // 저장된 selection 정보 생성
        const savedSelectionInfo = getSelectedTextWithPreserved(savedText, savedRange, activeElement);
        const errorCount = await highlightErrorsWithSavedSelection(document.body, savedSelectionInfo);
        const checkedCount = countKoreanWords(document.body);
        const duration = Date.now() - startTime;
        
        console.log('');
        console.log('✅✅✅ 검사 완료! ✅✅✅');
        console.log(`📊 발견된 오류: ${errorCount}개`);
        console.log(`📊 검사한 단어: ${checkedCount}개`);
        console.log(`📊 하이라이트된 요소: ${STATE.highlightedElements.length}개`);
        console.log(`⏱️ 소요 시간: ${duration}ms`);
        
        console.log('📤 응답 전송:', { errorCount, checkedCount, duration });
        console.log('*'.repeat(80));
        console.log('');
        
        sendResponse({
          success: true,
          errorCount: errorCount,
          checkedCount: checkedCount,
          method: 'Gemini',
          duration: duration,
          message: `${errorCount}개의 오류를 발견했습니다.`
        });
      } catch (error) {
        console.error('');
        console.error('❌❌❌ 검사 중 오류 발생! ❌❌❌');
        console.error('오류:', error);
        console.error('스택:', error.stack);
        console.error('*'.repeat(80));
        console.error('');
        sendResponse({
          success: false,
          message: error.message
        });
      }
    })();
    return true;
  } else if (request.action === 'clearHighlights') {
    console.log('🧹 [CONTENT] 하이라이트 제거 요청');
    clearHighlights();
    console.log('✅ 하이라이트 제거 완료');
    sendResponse({ success: true });
  } else if (request.action === 'getAPIStatus') {
    console.log('📊 [CONTENT] API 상태 요청');
    sendResponse({ 
      useAPI: true,
      lastCheckMethod: STATE.lastCheckMethod
    });
  } else if (request.action === 'getCheckStats') {
    console.log('📈 [CONTENT] 검사 통계 요청');
    sendResponse({ 
      stats: STATE.lastCheckStats
    });
  } else if (request.action === 'showError') {
    console.log('⚠️ [CONTENT] 오류 알림 요청');
    alert('⚠️ 확장 프로그램이 아직 완전히 로드되지 않았습니다.\n\n페이지를 새로고침(F5)하고 다시 시도해주세요.');
    sendResponse({ success: true });
  } else if (request.action === 'updateShortcut') {
    // 단축키 업데이트
    CURRENT_SHORTCUT_KEY = request.shortcutKey || 'E';
    CURRENT_SHORTCUT_STRING = request.shortcutString || 'Cmd+E';
    console.log('⌨️ 단축키 업데이트:', CURRENT_SHORTCUT_STRING);
    sendResponse({ success: true });
  } else {
    console.log('❓ [CONTENT] 알 수 없는 액션:', request.action);
  }
});

// 현재 단축키 설정 (전역 변수)
let CURRENT_SHORTCUT_KEY = 'E'; // 기본값
let CURRENT_SHORTCUT_STRING = 'Cmd+E'; // 전체 단축키 문자열

// 단축키 설정 불러오기
async function loadShortcutKey() {
  try {
    const result = await chrome.storage.sync.get(['shortcutKey', 'shortcutString']);
    CURRENT_SHORTCUT_KEY = result.shortcutKey || 'E';
    CURRENT_SHORTCUT_STRING = result.shortcutString || 'Cmd+E';
    console.log('⌨️ 단축키 설정 로드:', CURRENT_SHORTCUT_STRING);
  } catch (error) {
    console.error('단축키 설정 불러오기 실패:', error);
    CURRENT_SHORTCUT_KEY = 'E';
    CURRENT_SHORTCUT_STRING = 'Cmd+E';
  }
}

// 초기화 시 단축키 불러오기
loadShortcutKey();

// 현재 키 이벤트를 문자열로 변환
function getCurrentShortcutString(e) {
  const parts = [];
  
  if (e.metaKey || e.ctrlKey) {
    parts.push(e.metaKey ? 'Cmd' : 'Ctrl');
  }
  if (e.altKey) {
    parts.push(e.metaKey ? 'Option' : 'Alt');
  }
  if (e.shiftKey) {
    parts.push('Shift');
  }
  
  if (e.key && e.key.length === 1 && e.key !== ' ') {
    parts.push(e.key.toUpperCase());
  } else if (e.key && !['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
    parts.push(e.key);
  }
  
  return parts.join('+');
}

// 키보드 단축키 감지 함수
async function handleShortcut(e) {
  // 수식키만 누른 경우는 무시
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
    return;
  }
  
  // 현재 눌린 키 조합을 문자열로 변환
  const currentShortcut = getCurrentShortcutString(e);
  
  // 저장된 단축키와 비교
  if (currentShortcut === CURRENT_SHORTCUT_STRING) {
    // 🔥🔥🔥 최우선: 즉시 selection 저장 (로그보다 먼저!)
    console.log(`⌨️⌨️⌨️ 단축키 감지! ${currentShortcut} ⌨️⌨️⌨️`);
    // 이벤트 차단보다도 먼저 selection을 캡처해야 함
    const activeElement = document.activeElement;

    let savedSelection = null;
    let savedText = null;
    let savedRange = null;
    const windowSelection = window.getSelection();

    console.log('');
    console.log(`⌨️⌨️⌨️ 단축키 감지! ${currentShortcut} ⌨️⌨️⌨️`);
    console.log('💾 즉시 저장한 selection:', windowSelection?.toString()?.substring(0, 50) || '(없음)');
    console.log('💾 savedText 길이:', savedText?.length || 0);
    console.log('💾 activeElement:', activeElement?.tagName);
    console.log('💾 rangeCount:', windowSelection?.rangeCount || 0);
    // Selection을 즉시 복사 (얕은 복사가 아닌 깊은 저장)

    if (windowSelection && windowSelection.rangeCount > 0) {
      savedSelection = windowSelection;
      const textContent = windowSelection.toString();
      // 빈 문자열이 아닐 때만 저장
      if (textContent && textContent.trim()) {
        savedText = textContent;
        try {
          savedRange = windowSelection.getRangeAt(0).cloneRange();
        } catch (e) {
          // Range 복사 실패 시 무시
        }
      }
    }
    
    // 즉시 이벤트 차단 (selection 저장 후)
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    console.log('');
    console.log('💾 즉시 저장한 selection:', savedText?.substring(0, 50) || '(없음)');
    console.log('💾 savedText 길이:', savedText?.length || 0);
    console.log('💾 activeElement:', activeElement?.tagName);
    console.log('💾 rangeCount:', windowSelection?.rangeCount || 0);
    
    // 이제 getSelectedText() 호출 (저장된 정보 활용)
    const savedSelectionInfo = getSelectedTextWithPreserved(savedText, savedRange, activeElement);
    console.log('📦 최종 selectionInfo:', savedSelectionInfo);
    
    console.log('🔍 맞춤법 검사 시작...');
    
    try {
      const startTime = Date.now();
      const errorCount = await highlightErrorsWithSavedSelection(document.body, savedSelectionInfo);
      const checkedCount = countKoreanWords(document.body);
      const duration = Date.now() - startTime;
      
      console.log('✅ 맞춤법 검사 완료!');
      console.log(`📊 발견된 오류: ${errorCount}개`);
      console.log(`📊 검사한 단어: ${checkedCount}개`);
      console.log(`⏱️ 소요 시간: ${duration}ms`);
      console.log('');
      } catch (error) {
      console.error('❌ 맞춤법 검사 오류:', error);
    }
    
    return false; // 추가 차단
  }
}

// 다중 레벨 이벤트 리스너 등록 (최대한 빨리, 강력하게)
// 1. Window 레벨 (최상위, passive: false로 이벤트 차단 가능하게)
window.addEventListener('keydown', handleShortcut, { capture: true, passive: false });

// 2. Document 레벨 (백업)
document.addEventListener('keydown', handleShortcut, { capture: true, passive: false });

// 3. Document.body 레벨 (추가 백업) - DOM 로드 후
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body) {
      document.body.addEventListener('keydown', handleShortcut, { capture: true, passive: false });
      console.log('✅ Body 레벨 단축키 리스너 등록 완료');
    }
  });
} else {
  if (document.body) {
    document.body.addEventListener('keydown', handleShortcut, { capture: true, passive: false });
    console.log('✅ Body 레벨 단축키 리스너 등록 완료');
  }
}

// 확장 프로그램 로드 확인
console.log('');
console.log('🎉 한글 맞춤법 검사기 Content Script 로드 완료!');
console.log('⌨️  단축키 Cmd+E (Mac) / Ctrl+E (Windows) - 간편해졌습니다!');
console.log('🖱️  또는 텍스트 선택 후 우클릭 → 맞춤법 검사');
console.log('✅ Window + Document + Body 3중 리스너 등록');
console.log('📍 Run at: document_start');
console.log('');

