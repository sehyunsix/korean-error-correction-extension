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
 * 교정 결과를 표시하는 모달 생성
 */
function showCorrectionModal(title, originalText, correctedText, errors) {
  // 기존 모달 제거
  const existingModal = document.getElementById('spelling-correction-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // 모달 컨테이너 생성
  const modal = document.createElement('div');
  modal.id = 'spelling-correction-modal';
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

  // 모달 내용
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  // 오류 목록 HTML 생성
  let errorListHTML = '';
  if (errors.length > 0) {
    errorListHTML = `
      <div style="margin: 16px 0; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <div style="font-weight: 600; margin-bottom: 8px; color: #856404;">발견된 오류:</div>
        ${errors.map(e => `
          <div style="margin: 4px 0; padding: 4px 0; color: #856404;">
            <span style="background: #ffebee; padding: 2px 6px; border-radius: 4px; text-decoration: line-through;">${e.token}</span>
            <span style="margin: 0 8px;">→</span>
            <span style="background: #e8f5e9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${e.suggestions[0]}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 텍스트 비교 HTML
  const comparisonHTML = originalText !== correctedText ? `
    <div style="margin: 16px 0;">
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; color: #d32f2f; margin-bottom: 6px;">❌ 수정 전:</div>
        <div style="padding: 12px; background: #ffebee; border-radius: 8px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${originalText}</div>
      </div>
      <div>
        <div style="font-weight: 600; color: #388e3c; margin-bottom: 6px;">✅ 수정 후:</div>
        <div style="padding: 12px; background: #e8f5e9; border-radius: 8px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${correctedText}</div>
      </div>
    </div>
  ` : `
    <div style="margin: 16px 0; padding: 12px; background: #e8f5e9; border-radius: 8px;">
      <div style="font-weight: 600; color: #388e3c; margin-bottom: 6px;">✅ 원본 텍스트:</div>
      <div style="line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${originalText}</div>
    </div>
  `;

  modalContent.innerHTML = `
    <div style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #333;">
      ${title}
    </div>
    ${errorListHTML}
    ${comparisonHTML}
    <div style="display: flex; gap: 8px; margin-top: 20px;">
      <button id="copy-corrected-text" style="
        flex: 1;
        padding: 12px 20px;
        background: #4caf50;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      ">
        📋 교정된 텍스트 복사
      </button>
      <button id="close-modal" style="
        padding: 12px 20px;
        background: #9e9e9e;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      ">
        닫기
      </button>
    </div>
    <div id="copy-status" style="
      margin-top: 12px;
      padding: 8px;
      border-radius: 6px;
      text-align: center;
      font-size: 13px;
      display: none;
    "></div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // 버튼 hover 효과
  const copyBtn = modalContent.querySelector('#copy-corrected-text');
  const closeBtn = modalContent.querySelector('#close-modal');
  const copyStatus = modalContent.querySelector('#copy-status');

  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.background = '#45a049';
  });
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.background = '#4caf50';
  });

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#757575';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#9e9e9e';
  });

  // 복사 버튼 클릭
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(correctedText);
      copyStatus.textContent = '✅ 클립보드에 복사되었습니다!';
      copyStatus.style.background = '#e8f5e9';
      copyStatus.style.color = '#388e3c';
      copyStatus.style.display = 'block';
      
      console.log('✅ 클립보드 복사 성공:', correctedText.substring(0, 50) + '...');
      
      // 2초 후 모달 자동 닫기
      setTimeout(() => {
        modal.remove();
      }, 2000);
    } catch (error) {
      console.error('❌ 클립보드 복사 실패:', error);
      copyStatus.textContent = '❌ 복사 실패. 다시 시도해주세요.';
      copyStatus.style.background = '#ffebee';
      copyStatus.style.color = '#d32f2f';
      copyStatus.style.display = 'block';
    }
  });

  // 닫기 버튼 클릭
  closeBtn.addEventListener('click', () => {
    modal.remove();
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
 * 선택된 텍스트에 API 기반 하이라이트 적용
 */
async function highlightErrors(bodyElement) {
  console.log('\n=== 선택된 텍스트 맞춤법 검사 시작 ===');
  
  // 선택된 텍스트 가져오기
  console.log('🔍 getSelectedText() 호출...');
  const selectionInfo = getSelectedText();
  console.log('📦 selectionInfo:', selectionInfo);
  
  if (!selectionInfo || !selectionInfo.text) {
    console.warn('⚠️ 선택된 텍스트 없음!');
    console.log('activeElement:', document.activeElement);
    console.log('activeElement.tagName:', document.activeElement?.tagName);
    console.log('window.getSelection():', window.getSelection()?.toString());
    
    alert('텍스트를 선택해주세요.\n\n💡 Tip:\n- 마우스로 텍스트를 드래그하세요\n- Input 필드에서는 텍스트를 선택한 후 단축키를 누르세요');
    return 0;
  }

  const selectedText = selectionInfo.text;
  console.log(`✅ 선택된 텍스트 (${selectionInfo.type}): "${selectedText.substring(0, 100)}..."`);

  // 하이라이트 제거
  clearHighlights();

  try {
    // API로 맞춤법 검사
    const result = await checkSpellingWithAPI(selectedText);
    
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

    // Input/Textarea 또는 iframe 필드인 경우 (하이라이트 불가)
    if (selectionInfo.type === 'input' || selectionInfo.type === 'iframe') {
      if (errors.length === 0) {
        showCorrectionModal('✅ 오류가 없습니다!', selectedText, selectedText, []);
        console.log(`✅ ${selectionInfo.type} 필드 - 오류 없음`);
        STATE.lastCheckStats.foundErrors = 0;
        return 0;
      }
      
      // Input/iframe 필드는 교정된 텍스트를 표시
      let correctedText = selectedText;
      for (const error of errors) {
        correctedText = correctedText.replace(error.token, error.suggestions[0]);
      }
      
      showCorrectionModal(
        `🔴 ${errors.length}개의 오류 발견`,
        selectedText,
        correctedText,
        errors
      );
      
      console.log(`🔴 ${selectionInfo.type} 필드 - ${errors.length}개의 오류 발견`);
      STATE.lastCheckStats.foundErrors = errors.length;
      return errors.length;
    }

    // 일반 텍스트 또는 ContentEditable인 경우
    const selection = selectionInfo.selection || window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      alert('범위를 다시 선택해주세요.');
      return 0;
    }

    const range = selection.getRangeAt(0);

    if (errors.length === 0) {
      // 오류 없음
      console.log('✅ 오류 없음');
      highlightSelectedRange(range, [], selectedText, false);
      STATE.lastCheckStats.foundErrors = 0;
      return 0;
    }

    // 오류 하이라이트
    console.log(`🔴 ${errors.length}개의 오류 발견`);
    highlightSelectedRange(range, errors, selectedText, true);

    STATE.lastCheckStats.foundErrors = errors.length;
    return errors.length;

  } catch (error) {
    console.error('❌ 하이라이트 오류:', error);
    alert('하이라이트 적용 중 오류가 발생했습니다.');
    return 0;
  }
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
    console.log('🚀 검사 시작...');
    
    (async () => {
      try {
        const startTime = Date.now();
        const errorCount = await highlightErrors(document.body);
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
  } else {
    console.log('❓ [CONTENT] 알 수 없는 액션:', request.action);
  }
});

// 확장 프로그램 로드 확인
console.log('');
console.log('🎉 한글 맞춤법 검사기 Content Script 로드 완료!');
console.log('⌨️  단축키 Cmd+Shift+E를 눌러 선택한 텍스트를 검사하세요!');
console.log('');

