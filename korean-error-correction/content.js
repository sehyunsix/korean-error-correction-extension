// 설정
const API_SERVER_URL = 'http://localhost:3000'; // Python 서버 URL
const USE_API = true; // true: AI 모델 사용, false: 룰 베이스 사용
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent';

// 맞춤법 검사 규칙 데이터베이스 (폴백용)
const spellingRules = {
  // 부정 표현
  '않됩니다': '안 됩니다',
  '않돼요': '안 돼요',
  '않되': '안 되',
  '않돼': '안 돼',
  '안돼': '안 돼',
  '안되': '안 되',
  
  // '되다' 관련
  '되요': '돼요',
  '대요': '돼요',
  '되가지고': '돼 가지고',
  
  // '웬'과 '왠' 혼동
  '웬지': '왠지',
  '웬만하면': '왠만하면',
  '웬만큼': '왠만큼',
  '왠일': '웬일',
  
  // 기타 자주 틀리는 표현
  '어떻해': '어떡해',
  '어떻케': '어떡해',
  '몇일': '며칠',
  '금새': '금세',
  '넒은': '넓은',
  '넒다': '넓다',
  '닫쳐': '닫혀',
  '담굼': '담금',
  '담습': '답습',
  '바램': '바람',
  '있따': '이따'
};

// 오타 패턴 (정규식 - 폴백용)
const errorPatterns = [
  { pattern: /않\s*돼/g, correct: '안 돼', description: '않돼 -> 안 돼' },
  { pattern: /않\s*되/g, correct: '안 되', description: '않되 -> 안 되' },
  { pattern: /되\s*요(?![가-힣])/g, correct: '돼요', description: '되요 -> 돼요' },
  { pattern: /웬지(?![가-힣])/g, correct: '왠지', description: '웬지 -> 왠지' },
  { pattern: /웬만하/g, correct: '왠만하', description: '웬만하 -> 왠만하' },
  { pattern: /왠일/g, correct: '웬일', description: '왠일 -> 웬일' },
  { pattern: /어떻[해케]/g, correct: '어떡해', description: '어떻해 -> 어떡해' },
  { pattern: /몇일/g, correct: '며칠', description: '몇일 -> 며칠' },
  { pattern: /금새/g, correct: '금세', description: '금새 -> 금세' },
  { pattern: /바램/g, correct: '바람', description: '바램 -> 바람' },
  { pattern: /넒/g, correct: '넓', description: '넒 -> 넓' },
  { pattern: /닫쳐/g, correct: '닫혀', description: '닫쳐 -> 닫혀' },
  { pattern: /담굼/g, correct: '담금', description: '담굼 -> 담금' },
  { pattern: /대요(?![가-힣])/g, correct: '돼요', description: '대요 -> 돼요' },
  { pattern: /되가지고/g, correct: '돼 가지고', description: '되가지고 -> 돼 가지고' },
  { pattern: /있따/g, correct: '이따', description: '있따 -> 이따' }
];

let highlightedElements = [];
let autoCheckEnabled = true; // 기본값 true (로컬 캐시)
let lastServerLogs = []; // 마지막 서버 로그 저장 (사용 안 함)
let lastCheckStats = { // 마지막 검사 통계
  totalNodes: 0,
  checkedNodes: 0,
  foundErrors: 0
};

// Extension context 유효성 확인
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

// 안전하게 storage에 접근
async function safeGetStorage(key, defaultValue) {
  try {
    if (!isExtensionContextValid()) {
      console.log('Extension context invalid, using cached value');
      return defaultValue;
    }
    const storageResult = await chrome.storage.sync.get([key]);
    return storageResult[key] !== undefined ? storageResult[key] : defaultValue;
  } catch (error) {
    console.log('Storage access failed, using cached value:', error.message);
    return defaultValue;
  }
}

// API를 사용한 맞춤법 검사
// Gemini API로 맞춤법 검사
async function checkSpellingWithGemini(text, apiKey) {
  try {
    console.log('\n=== Gemini API 맞춤법 검사 시작 ===');
    console.log(`검사할 텍스트: "${text.substring(0, 100)}..."`);
    
    // 저장된 모델 가져오기
    const modelData = await chrome.storage.sync.get(['geminiModel']);
    let apiUrl = GEMINI_API_URL;
    
    if (modelData.geminiModel) {
      // models/gemini-xxx 형식을 API URL로 변환
      const modelName = modelData.geminiModel.replace('models/', '');
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      console.log(`🎯 선택된 모델: ${modelName}`);
    } else {
      console.log(`🎯 기본 모델 사용`);
    }
    
    const prompt = `당신은 한국어 맞춤법 전문가입니다. 다음 텍스트의 맞춤법 오류를 찾아주세요.

텍스트: "${text}"

다음 JSON 형식으로 응답해주세요:
{
  "errors": [
    {
      "token": "오류가 있는 단어",
      "suggestions": ["교정된 단어"],
      "type": "spell",
      "info": "Gemini 교정"
    }
  ],
  "corrected_text": "전체 교정된 텍스트"
}

오류가 없으면 errors는 빈 배열 []로, corrected_text는 원본 텍스트 그대로 반환하세요.
JSON만 출력하고 다른 설명은 하지 마세요.`;

    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    const textContent = data.candidates[0].content.parts[0].text;
    console.log('Gemini 응답:', textContent);
    
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = textContent;
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }
    
    const result = JSON.parse(jsonText);
    console.log('파싱된 결과:', result);
    console.log('=== Gemini API 맞춤법 검사 완료 ===\n');
    
    return result.errors || [];
  } catch (error) {
    console.error('❌ Gemini API 맞춤법 검사 오류:', error);
    return null;
  }
}

// ET5 API로 맞춤법 검사
async function checkSpellingWithET5(text) {
  try {
    console.log('\n=== ET5 API 맞춤법 검사 시작 ===');
    
    const response = await fetch(`${API_SERVER_URL}/api/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('ET5 응답:', data);
    
    // 서버 로그 저장
    if (data.logs && Array.isArray(data.logs)) {
      lastServerLogs = data.logs;
    }
    
    if (data.success) {
      const validErrors = data.errors.filter(error => error && error.token);
      console.log(`발견된 오류: ${validErrors.length}개`);
      console.log('=== ET5 API 맞춤법 검사 완료 ===\n');
      
      return validErrors.map(error => ({
        token: error.token,
        suggestions: error.suggestions || [],
        info: error.info || 'ET5 교정',
        type: error.type || 'spell'
      }));
    } else {
      throw new Error(data.message || '맞춤법 검사 실패');
    }
  } catch (error) {
    console.error('❌ ET5 API 맞춤법 검사 오류:', error);
    return null;
  }
}

// API로 맞춤법 검사 (Gemini 우선, 없으면 ET5)
async function checkSpellingWithAPI(text) {
  try {
    // Gemini API Key 확인
    const apiKeyStorage = await chrome.storage.sync.get(['geminiApiKey']);
    const geminiApiKey = apiKeyStorage.geminiApiKey;
    
    if (geminiApiKey && geminiApiKey.trim()) {
      console.log('🤖 Gemini API 사용');
      return await checkSpellingWithGemini(text, geminiApiKey.trim());
    } else {
      console.log('🔬 ET5 API 사용');
      return await checkSpellingWithET5(text);
    }
  } catch (error) {
    console.error('❌ API 맞춤법 검사 오류:', error);
    return null;
  }
}

// 선택된 텍스트만 API로 검사
async function highlightErrorsWithAPI(node) {
  // 선택된 텍스트 가져오기
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    console.log('⚠️ 텍스트를 선택해주세요!');
    alert('교정할 텍스트를 드래그해서 선택한 후 다시 시도해주세요.');
    return 0;
  }
  
  const selectedText = selection.toString().trim();
  
  if (!selectedText || selectedText.length < 2) {
    console.log('⚠️ 선택한 텍스트가 너무 짧습니다.');
    alert('최소 2자 이상의 텍스트를 선택해주세요.');
    return 0;
  }
  
  if (!/[가-힣]/.test(selectedText)) {
    console.log('⚠️ 한글이 포함되지 않았습니다.');
    alert('한글이 포함된 텍스트를 선택해주세요.');
    return 0;
  }
  
  console.log(`📝 선택된 텍스트 (${selectedText.length}자): "${selectedText}"`);
  
  // 검사 통계 초기화
  lastCheckStats = {
    totalNodes: 1,
    checkedNodes: 0,
    foundErrors: 0,
    apiCalls: 0,
    apiSuccess: 0,
    apiFailed: 0,
    selectedText: selectedText
  };
  
  try {
    // AI API 호출 (Gemini 또는 ET5)
    lastCheckStats.apiCalls++;
    const errors = await checkSpellingWithAPI(selectedText);
    lastCheckStats.apiSuccess++;
    lastCheckStats.checkedNodes = 1;
    
    if (errors && errors.length > 0) {
      console.log(`✅ ${errors.length}개의 오류 발견`);
      lastCheckStats.foundErrors = errors.length;
      
      // 교정된 텍스트 생성 (간단하게 첫 번째 제안으로 교체)
      let correctedText = selectedText;
      errors.forEach(error => {
        if (error.suggestions && error.suggestions.length > 0) {
          correctedText = correctedText.replace(error.token, error.suggestions[0]);
        }
      });
      
      // 선택된 범위에 하이라이트 적용 (빨간색 - 오류 있음)
      const range = selection.getRangeAt(0);
      highlightSelectedRange(range, errors, correctedText, true);
      
      return errors.length;
    } else {
      console.log('✅ 오류가 발견되지 않았습니다.');
      
      // 오류가 없으면 초록색으로 표시
      const range = selection.getRangeAt(0);
      highlightSelectedRange(range, [], selectedText, false);
      
      return 0;
    }
    
  } catch (error) {
    lastCheckStats.apiFailed++;
    console.error('❌ API 오류:', error.message);
    alert(`교정 중 오류가 발생했습니다: ${error.message}`);
    return 0;
  }
}

// 선택된 범위에서 오류 부분만 하이라이트
function highlightSelectedRange(range, errors, correctedText, hasErrors = true) {
  const selectedText = range.toString();
  
  if (!hasErrors) {
    // 오류 없음 - 간단한 알림만
    console.log('✅ 오류가 발견되지 않았습니다.');
    
    // 임시로 초록색 표시 후 제거
    try {
      const wrapper = document.createElement('span');
      wrapper.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
      wrapper.style.transition = 'opacity 0.5s';
      
      range.surroundContents(wrapper);
      
      setTimeout(() => {
        wrapper.style.opacity = '0';
        setTimeout(() => {
          if (wrapper.parentNode) {
            const textContent = wrapper.textContent;
            const textNode = document.createTextNode(textContent);
            wrapper.parentNode.replaceChild(textNode, wrapper);
          }
        }, 500);
      }, 1500);
      
      window.getSelection().removeAllRanges();
    } catch (error) {
      console.log('초록색 표시 실패 (무시)');
    }
    return;
  }
  
  // 오류가 있는 경우 - 오류 부분만 표시
  try {
    const fragment = range.extractContents();
    const container = document.createElement('span');
    
    // 텍스트 노드들을 순회하면서 오류 토큰 찾기
    const walker = document.createTreeWalker(
      fragment,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // 각 텍스트 노드에서 오류 토큰 하이라이트
    textNodes.forEach(textNode => {
      let text = textNode.textContent;
      let hasError = false;
      
      // 이 텍스트 노드에 오류가 있는지 확인
      errors.forEach(error => {
        if (text.includes(error.token)) {
          hasError = true;
        }
      });
      
      if (hasError && textNode.parentNode) {
        const parent = textNode.parentNode;
        const parts = [];
        let lastIndex = 0;
        
        // 오류 토큰들을 찾아서 하이라이트
        errors.forEach(error => {
          const index = text.indexOf(error.token, lastIndex);
          if (index !== -1) {
            // 오류 앞의 정상 텍스트
            if (index > lastIndex) {
              parts.push({
                type: 'text',
                content: text.substring(lastIndex, index)
              });
            }
            
            // 오류 부분
            parts.push({
              type: 'error',
              content: error.token,
              suggestions: error.suggestions,
              info: error.info
            });
            
            lastIndex = index + error.token.length;
          }
        });
        
        // 남은 정상 텍스트
        if (lastIndex < text.length) {
          parts.push({
            type: 'text',
            content: text.substring(lastIndex)
          });
        }
        
        // DOM 노드 생성
        parts.forEach(part => {
          if (part.type === 'text') {
            parent.insertBefore(document.createTextNode(part.content), textNode);
          } else {
            // 오류 span 생성
            const errorSpan = document.createElement('span');
            errorSpan.className = 'korean-spell-error';
            errorSpan.textContent = part.content;
            errorSpan.style.cssText = `
              background-color: rgba(255, 0, 0, 0.3);
              border-bottom: 2px solid #f44336;
              cursor: help;
              position: relative;
            `;
            
            // 툴팁 생성
            const tooltip = document.createElement('div');
            tooltip.style.cssText = `
              position: absolute;
              bottom: calc(100% + 8px);
              left: 50%;
              transform: translateX(-50%);
              background: #2c3e50;
              color: white;
              padding: 10px 14px;
              border-radius: 8px;
              font-size: 13px;
              white-space: normal;
              max-width: 280px;
              min-width: 150px;
              z-index: 99999;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: none;
              pointer-events: none;
              line-height: 1.5;
            `;
            
            const suggestionText = part.suggestions && part.suggestions.length > 0 
              ? part.suggestions.join(', ') 
              : '제안 없음';
            
            const infoText = part.info || '맞춤법 오류';
            
            tooltip.innerHTML = `
              <div style="font-weight: bold; color: #ff6b6b; margin-bottom: 6px; font-size: 14px;">
                ❌ "${part.content}"
              </div>
              <div style="color: #fff; margin-bottom: 4px; font-size: 12px;">
                <strong>제안:</strong> ${suggestionText}
              </div>
              <div style="color: #bdc3c7; font-size: 11px; border-top: 1px solid #555; padding-top: 4px; margin-top: 4px;">
                ${infoText}
              </div>
            `;
            
            errorSpan.appendChild(tooltip);
            
            errorSpan.addEventListener('mouseenter', () => {
              tooltip.style.display = 'block';
            });
            
            errorSpan.addEventListener('mouseleave', () => {
              tooltip.style.display = 'none';
            });
            
            parent.insertBefore(errorSpan, textNode);
            highlightedElements.push(errorSpan);
          }
        });
        
        // 원본 텍스트 노드 제거
        parent.removeChild(textNode);
      }
    });
    
    // 수정된 fragment를 다시 삽입
    range.insertNode(fragment);
    
    // 선택 해제
    window.getSelection().removeAllRanges();
    
    console.log(`✅ ${errors.length}개의 오류 단어만 빨간색 표시 완료`);
    
  } catch (error) {
    console.error('❌ 오류 하이라이트 실패:', error);
    alert('하이라이트 적용에 실패했습니다. 다시 시도해주세요.');
  }
}

// API 결과를 기반으로 단일 노드 하이라이트
function highlightSingleNodeWithErrors(textNode, errors) {
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE || !errors || errors.length === 0) {
    return 0;
  }
  
  const text = textNode.textContent;
  const parent = textNode.parentNode;
  
  if (!parent) {
    return 0;
  }
  
  // 각 오류를 하이라이트
  let highlightCount = 0;
  const fragments = [];
  let lastIndex = 0;
  
  // 오류를 위치 순으로 정렬
  const sortedErrors = [...errors].sort((a, b) => {
    const indexA = text.indexOf(a.token);
    const indexB = text.indexOf(b.token);
    return indexA - indexB;
  });
  
  sortedErrors.forEach(error => {
    const errorIndex = text.indexOf(error.token, lastIndex);
    
    if (errorIndex === -1) {
      return; // 오류 토큰을 찾을 수 없으면 스킵
    }
    
    // 오류 앞의 정상 텍스트
    if (errorIndex > lastIndex) {
      fragments.push(document.createTextNode(text.substring(lastIndex, errorIndex)));
    }
    
    // 오류 하이라이트
    const errorSpan = document.createElement('span');
    errorSpan.className = 'korean-spell-error';
    errorSpan.textContent = error.token;
    errorSpan.title = `교정: ${error.suggestions.join(', ')}`;
    errorSpan.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    errorSpan.style.cursor = 'pointer';
    errorSpan.style.borderBottom = '2px solid red';
    
    fragments.push(errorSpan);
    highlightedElements.push(errorSpan);
    highlightCount++;
    
    lastIndex = errorIndex + error.token.length;
  });
  
  // 남은 정상 텍스트
  if (lastIndex < text.length) {
    fragments.push(document.createTextNode(text.substring(lastIndex)));
  }
  
  // 원본 텍스트 노드를 교체
  if (fragments.length > 0) {
    fragments.forEach(fragment => {
      parent.insertBefore(fragment, textNode);
    });
    parent.removeChild(textNode);
  }
  
  return highlightCount;
}

// 단일 텍스트 노드에 대한 룰 베이스 검사
function highlightSingleNodeRuleBased(textNode) {
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    return 0;
  }
  
  const text = textNode.textContent;
  
  // 한글이 포함된 텍스트만 검사
  if (!/[가-힣]/.test(text)) {
    return 0;
  }
  
  let errorCount = 0;
  const errors = [];
  
  // 정규식 패턴으로 오타 찾기
  errorPatterns.forEach(rule => {
    const matches = [...text.matchAll(rule.pattern)];
    matches.forEach(match => {
      errors.push({
        text: match[0],
        index: match.index,
        correct: rule.correct,
        description: rule.description
      });
      errorCount++;
    });
  });
  
  // 단어 단위로 검사
  const words = text.split(/[\s.,!?;:()[\]{}'"]+/);
  words.forEach(word => {
    const trimmedWord = word.trim();
    if (trimmedWord && spellingRules[trimmedWord] && spellingRules[trimmedWord] !== trimmedWord) {
      const index = text.indexOf(trimmedWord);
      if (index !== -1) {
        errors.push({
          text: trimmedWord,
          index: index,
          correct: spellingRules[trimmedWord],
          description: `${trimmedWord} -> ${spellingRules[trimmedWord]}`
        });
        errorCount++;
      }
    }
  });
  
  // 오타가 발견되면 하이라이트
  if (errors.length > 0) {
    const parent = textNode.parentNode;
    if (parent && !isExcludedElement(parent)) {
      // 중복 제거 및 정렬
      const uniqueErrors = Array.from(new Set(errors.map(e => JSON.stringify(e))))
        .map(e => JSON.parse(e))
        .sort((a, b) => b.index - a.index);
      
      const fragment = document.createDocumentFragment();
      let lastIndex = text.length;
      
      uniqueErrors.forEach(error => {
        // 뒤쪽 텍스트
        if (lastIndex > error.index + error.text.length) {
          fragment.insertBefore(
            document.createTextNode(text.substring(error.index + error.text.length, lastIndex)),
            fragment.firstChild
          );
        }
        
        // 하이라이트된 오타
        const span = document.createElement('span');
        span.className = 'korean-spell-error';
        span.textContent = error.text;
        span.title = `맞춤법 오류: ${error.description}`;
        span.style.cssText = 'background-color: #ffcccc !important; border-bottom: 2px solid #ff0000 !important; cursor: help !important; padding: 0 2px !important; border-radius: 2px !important;';
        span.setAttribute('data-correct', error.correct);
        
        // 클릭하면 수정
        span.addEventListener('click', function(e) {
          e.stopPropagation();
          if (confirm(`"${error.text}"을(를) "${error.correct}"(으)로 수정하시겠습니까?`)) {
            this.textContent = error.correct;
            this.style.cssText = 'background-color: #ccffcc !important; border-bottom: 2px solid #00aa00 !important; cursor: default !important; padding: 0 2px !important; border-radius: 2px !important;';
            this.title = '수정됨';
          }
        });
        
        fragment.insertBefore(span, fragment.firstChild);
        highlightedElements.push(span);
        
        lastIndex = error.index;
      });
      
      // 앞쪽 텍스트
      if (lastIndex > 0) {
        fragment.insertBefore(
          document.createTextNode(text.substring(0, lastIndex)),
          fragment.firstChild
        );
      }
      
      try {
        parent.replaceChild(fragment, textNode);
      } catch (error) {
        console.error('하이라이트 적용 실패:', error);
      }
    }
  }
  
  return errorCount;
}

// 룰 베이스 검사 (기존 방식)
function highlightErrorsRuleBased(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    
    // 한글이 포함된 텍스트만 검사
    if (!/[가-힣]/.test(text)) {
      return 0;
    }
    
    let errorCount = 0;
    let modifiedText = text;
    const errors = [];
    
    // 정규식 패턴으로 오타 찾기
    errorPatterns.forEach(rule => {
      const matches = [...text.matchAll(rule.pattern)];
      matches.forEach(match => {
        errors.push({
          text: match[0],
          index: match.index,
          correct: rule.correct,
          description: rule.description
        });
        errorCount++;
      });
    });
    
    // 단어 단위로 검사 (공백과 구두점 기준으로 분리)
    const words = text.split(/[\s.,!?;:()[\]{}'"]+/);
    words.forEach(word => {
      const trimmedWord = word.trim();
      if (trimmedWord && spellingRules[trimmedWord] && spellingRules[trimmedWord] !== trimmedWord) {
        const index = text.indexOf(trimmedWord);
        if (index !== -1) {
          errors.push({
            text: trimmedWord,
            index: index,
            correct: spellingRules[trimmedWord],
            description: `${trimmedWord} -> ${spellingRules[trimmedWord]}`
          });
          errorCount++;
          console.log(`오타 발견: "${trimmedWord}" -> "${spellingRules[trimmedWord]}"`);
        }
      }
    });
    
    // 오타가 발견되면 하이라이트
    if (errors.length > 0) {
      const parent = node.parentNode;
      if (parent && !isExcludedElement(parent)) {
        // 중복 제거 및 정렬
        const uniqueErrors = Array.from(new Set(errors.map(e => JSON.stringify(e))))
          .map(e => JSON.parse(e))
          .sort((a, b) => b.index - a.index);
        
        const fragment = document.createDocumentFragment();
        let lastIndex = text.length;
        
        uniqueErrors.forEach(error => {
          // 뒤쪽 텍스트
          if (lastIndex > error.index + error.text.length) {
            fragment.insertBefore(
              document.createTextNode(text.substring(error.index + error.text.length, lastIndex)),
              fragment.firstChild
            );
          }
          
          // 하이라이트된 오타
          const span = document.createElement('span');
          span.className = 'korean-spell-error';
          span.textContent = error.text;
          span.title = `맞춤법 오류: ${error.description}`;
          span.style.cssText = 'background-color: #ffcccc !important; border-bottom: 2px solid #ff0000 !important; cursor: help !important; padding: 0 2px !important; border-radius: 2px !important;';
          span.setAttribute('data-correct', error.correct);
          
          console.log(`하이라이트 생성: "${error.text}" at position ${error.index}`);
          
          // 클릭하면 수정
          span.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm(`"${error.text}"을(를) "${error.correct}"(으)로 수정하시겠습니까?`)) {
              this.textContent = error.correct;
              this.style.cssText = 'background-color: #ccffcc !important; border-bottom: 2px solid #00aa00 !important; cursor: default !important; padding: 0 2px !important; border-radius: 2px !important;';
              this.title = '수정됨';
              console.log(`수정 완료: "${error.text}" -> "${error.correct}"`);
            }
          });
          
          fragment.insertBefore(span, fragment.firstChild);
          highlightedElements.push(span);
          
          lastIndex = error.index;
        });
        
        // 앞쪽 텍스트
        if (lastIndex > 0) {
          fragment.insertBefore(
            document.createTextNode(text.substring(0, lastIndex)),
            fragment.firstChild
          );
        }
        
        parent.replaceChild(fragment, node);
      }
    }
    
    return errorCount;
  } else if (node.nodeType === Node.ELEMENT_NODE && !isExcludedElement(node)) {
    let totalErrors = 0;
    const childNodes = Array.from(node.childNodes);
    childNodes.forEach(child => {
      totalErrors += highlightErrorsRuleBased(child);
    });
    return totalErrors;
  }
  
  return 0;
}

// 통합 검사 함수
async function highlightErrors(node) {
  if (USE_API) {
    return await highlightErrorsWithAPI(node);
  } else {
    return highlightErrorsRuleBased(node);
  }
}

// 제외할 요소 (스크립트, 스타일 등)
function isExcludedElement(element) {
  const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'CODE', 'PRE'];
  const excludedClasses = ['korean-spell-error'];
  
  if (element.nodeType === Node.ELEMENT_NODE) {
    if (excludedTags.includes(element.tagName)) {
      return true;
    }
    if (element.className && typeof element.className === 'string') {
      return excludedClasses.some(cls => element.className.includes(cls));
    }
  }
  
  return false;
}

// 하이라이트 제거
function clearHighlights() {
  highlightedElements.forEach(element => {
    if (element.parentNode) {
      const textNode = document.createTextNode(element.textContent);
      element.parentNode.replaceChild(textNode, element);
    }
  });
  highlightedElements = [];
  
  // 텍스트 노드 병합
  document.body.normalize();
}

// 단어 수 계산
function countKoreanWords(node, count = { total: 0 }) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    const koreanWords = text.match(/[가-힣]+/g);
    if (koreanWords) {
      count.total += koreanWords.length;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE && !isExcludedElement(node)) {
    node.childNodes.forEach(child => countKoreanWords(child, count));
  }
  return count.total;
}

// 마지막 검사 방식 저장
let lastCheckMethod = 'rule-based';

// 메시지 리스너
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
    
    // 비동기 처리
    (async () => {
      try {
        // 검사 시작 시간
        const startTime = Date.now();
        
        // 선택된 텍스트 검사 실행
        const errorCount = await highlightErrors(document.body);
        const checkedCount = countKoreanWords(document.body);
        
        // 검사 완료 시간
        const duration = Date.now() - startTime;
        
        console.log('');
        console.log('✅✅✅ 검사 완료! ✅✅✅');
        console.log(`📊 발견된 오류: ${errorCount}개`);
        console.log(`📊 검사한 단어: ${checkedCount}개`);
        console.log(`📊 하이라이트된 요소: ${highlightedElements.length}개`);
        console.log(`⏱️ 소요 시간: ${duration}ms`);
        
        // 검사 방식 결정 (API 또는 룰 베이스)
        let method = '룰 베이스';
        if (USE_API) {
          // API를 시도했는지 확인
          try {
            // AbortController를 사용한 타임아웃 (CSP 안전)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500);
            
            const response = await fetch(`${API_SERVER_URL}/health`, {
              method: 'GET',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              method = 'API';
              lastCheckMethod = 'api';
            } else {
              method = '룰 (폴백)';
              lastCheckMethod = 'fallback';
            }
          } catch (error) {
            method = '룰 (폴백)';
            lastCheckMethod = 'fallback';
          }
        } else {
          lastCheckMethod = 'rule-based';
        }
        
        console.log('📤 응답 전송:', { errorCount, checkedCount, method, duration });
        console.log('*'.repeat(80));
        console.log('');
        
        sendResponse({
          success: true,
          errorCount: errorCount,
          checkedCount: checkedCount,
          method: method,
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
    return true; // 비동기 응답을 위해 true 반환
  } else if (request.action === 'clearHighlights') {
    console.log('🧹 [CONTENT] 하이라이트 제거 요청');
    clearHighlights();
    console.log('✅ 하이라이트 제거 완료');
    sendResponse({ success: true });
  } else if (request.action === 'toggleAutoCheck') {
    console.log('🔄 [CONTENT] 자동 검사 토글:', request.enabled ? '활성화' : '비활성화');
    autoCheckEnabled = request.enabled;
    sendResponse({ success: true });
  } else if (request.action === 'getAPIStatus') {
    console.log('📊 [CONTENT] API 상태 요청');
    sendResponse({ 
      useAPI: USE_API,
      apiServerUrl: API_SERVER_URL,
      lastCheckMethod: lastCheckMethod
    });
  } else if (request.action === 'getServerLogs') {
    console.log('📜 [CONTENT] 서버 로그 요청');
    sendResponse({ 
      logs: lastServerLogs
    });
  } else if (request.action === 'getCheckStats') {
    console.log('📈 [CONTENT] 검사 통계 요청');
    sendResponse({ 
      stats: lastCheckStats
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

// 선택 텍스트 기반 검사이므로 자동 검사는 제거됨

// 실시간 맞춤법 검사를 위한 이벤트 리스너 설정 (제거됨)
function setupRealtimeChecking() {
  // 디바운스를 위한 타이머
  let typingTimer;
  const typingDelay = 1000; // 1초 대기
  
  // 편집 가능한 요소에 이벤트 리스너 추가하는 함수
  const addInputListener = (element) => {
    element.addEventListener('input', async () => {
      try {
        // Extension context 확인
        if (!isExtensionContextValid()) {
          // Context가 invalid하면 캐시된 값 사용
          if (!autoCheckEnabled) {
            return;
          }
        } else {
          // Context가 valid하면 storage에서 확인
          const enabled = await safeGetStorage('autoCheck', true);
          autoCheckEnabled = enabled; // 캐시 업데이트
          
          if (!enabled) {
            return;
          }
        }
        
        // 이전 타이머 취소
        clearTimeout(typingTimer);
        
        // 새로운 타이머 설정
        typingTimer = setTimeout(() => {
          console.log('한글 맞춤법 검사기: 실시간 검사 실행');
          checkElement(element);
        }, typingDelay);
      } catch (error) {
        console.error('한글 맞춤법 검사기 실시간 검사 오류:', error);
      }
    });
  };
  
  // 모든 편집 가능한 요소에 이벤트 리스너 추가
  const editableElements = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
  editableElements.forEach(element => {
    addInputListener(element);
  });
  
  // MutationObserver로 동적으로 추가되는 요소 감지
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const newEditables = node.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
          newEditables.forEach(element => {
            addInputListener(element);
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('한글 맞춤법 검사기: 실시간 검사 설정 완료');
}

// 특정 요소의 맞춤법 검사
async function checkElement(element) {
  try {
    // 요소 내부의 하이라이트 제거
    const highlights = element.querySelectorAll('.korean-spell-error');
    highlights.forEach(span => {
      const textNode = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(textNode, span);
    });
    
    // 맞춤법 검사 실행
    const errorCount = await highlightErrors(element);
    if (errorCount > 0) {
      console.log(`한글 맞춤법 검사기: ${errorCount}개의 오류 발견`);
    }
  } catch (error) {
    console.error('한글 맞춤법 검사기 요소 검사 오류:', error);
  }
}

