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
 * 선택된 텍스트 가져오기 (input/textarea/contenteditable 지원)
 */
function getSelectedText() {
  console.log('🔎 getSelectedText 함수 실행');
  
  // 1. 활성 요소 확인
  const activeElement = document.activeElement;
  console.log('🎯 activeElement:', activeElement);
  console.log('🎯 activeElement.tagName:', activeElement?.tagName);
  
  // 2. Input/Textarea 필드인 경우
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
  
  // 3. ContentEditable 요소인 경우
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
  
  // 4. 일반 텍스트 선택
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

    // Input/Textarea 필드인 경우
    if (selectionInfo.type === 'input') {
      if (errors.length === 0) {
        alert('✅ 오류가 없습니다!');
        console.log('✅ Input 필드 - 오류 없음');
        STATE.lastCheckStats.foundErrors = 0;
  return 0;
}

      // Input 필드는 교정된 텍스트를 표시
      const correctedText = errors.length > 0 
        ? errors.reduce((text, error) => text.replace(error.token, error.suggestions[0]), selectedText)
        : selectedText;
      
      const errorList = errors.map(e => `• ${e.token} → ${e.suggestions[0]}`).join('\n');
      alert(`🔴 ${errors.length}개의 오류 발견:\n\n${errorList}\n\n교정된 텍스트:\n${correctedText}\n\n💡 교정된 텍스트를 복사하여 사용하세요.`);
      
      console.log(`🔴 Input 필드 - ${errors.length}개의 오류 발견`);
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

