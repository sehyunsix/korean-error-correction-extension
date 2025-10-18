// Background script
chrome.runtime.onInstalled.addListener(() => {
  console.log('');
  console.log('='.repeat(80));
  console.log('🎉 한글 맞춤법 검사기가 설치되었습니다!');
  console.log('⌨️  단축키: Cmd+Shift+E (Mac) / Ctrl+Shift+E (Windows/Linux)');
  console.log('⚙️  단축키 설정: chrome://extensions/shortcuts');
  console.log('🔍 단축키를 누르면 이 콘솔에 로그가 출력됩니다!');
  console.log('='.repeat(80));
  console.log('');
  
  // 우클릭 메뉴 추가
  chrome.contextMenus.create({
    id: 'check-korean-spelling',
    title: '🔍 선택한 텍스트 맞춤법 검사',
    contexts: ['selection']
  });
  console.log('✅ 우클릭 메뉴 추가됨: "선택한 텍스트 맞춤법 검사"');
});

// 우클릭 메뉴 클릭 처리
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'check-korean-spelling') {
    console.log('');
    console.log('='.repeat(80));
    console.log('🖱️ [BACKGROUND] 우클릭 메뉴에서 맞춤법 검사 실행!');
    console.log('📌 선택된 텍스트:', info.selectionText?.substring(0, 50) + '...');
    console.log('⏰ 시간:', new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // 🔥 Chrome API가 제공하는 selectionText 사용!
    if (!info.selectionText || !info.selectionText.trim()) {
      console.warn('⚠️ 선택된 텍스트가 없습니다!');
      console.log('='.repeat(80));
      return;
    }
    
    console.log('💾 전송할 selectionText:', info.selectionText.substring(0, 100));
    
    // Content script에 메시지 전송 (selectionText 포함!)
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'checkSpelling',
        selectionText: info.selectionText  // ← 선택된 텍스트 전달!
      });
      console.log('✅ 메시지 전송 성공!');
      console.log('📥 응답:', response);
    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error.message);
      
      // 재시도 (selectionText 포함!)
      try {
        console.log('🔄 0.5초 후 재시도...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryResponse = await chrome.tabs.sendMessage(tab.id, { 
          action: 'checkSpelling',
          selectionText: info.selectionText  // ← 재시도에도 selectionText 전달!
        });
        console.log('✅ 재시도 성공!');
      } catch (retryError) {
        console.error('❌ 재시도 실패:', retryError.message);
      }
    }
  }
});

// Content script에서 온 메시지 처리 (Gemini API 호출)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callGeminiAPI') {
    console.log('\n🔵 [BACKGROUND] Gemini API 호출 요청 받음');
    console.log('📝 텍스트 길이:', request.text?.length || 0);
    
    // 비동기 API 호출
    callGeminiAPI(request.text, request.apiKey, request.selectedModel)
      .then(result => {
        console.log('✅ [BACKGROUND] API 호출 성공, 결과 반환');
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('❌ [BACKGROUND] API 호출 실패:', error);
        sendResponse({ 
          success: false, 
          error: {
            isError: true,
            errorType: error.name,
            errorMessage: error.message
          }
        });
      });
    
    return true; // 비동기 응답을 위해 true 반환
  }
});

/**
 * Gemini API 호출 함수
 */
async function callGeminiAPI(text, apiKey, selectedModel) {
  try {
    console.log('\n=== [BACKGROUND] Gemini API 맞춤법 검사 시작 ===');
    
    let apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent';
    
    if (selectedModel) {
      const modelName = selectedModel.replace('models/', '');
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      console.log(`🎯 선택된 모델: ${modelName}`);
    }
    
    const prompt = createGeminiPrompt(text);
    console.log(`📤 API 요청 URL: ${apiUrl}?key=***`);
    
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
    
    console.log(`📥 API 응답 상태: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ API 오류 응답:', errorBody);
      throw new Error(`Gemini API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ 예상치 못한 API 응답 구조:', JSON.stringify(data, null, 2));
      throw new Error('Gemini API 응답 구조가 올바르지 않습니다');
    }
    
    const textContent = data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini 응답:', textContent.substring(0, 200));
    
    const result = parseGeminiResponse(textContent);
    const validErrors = filterValidErrors(result.errors || []);
    
    console.log(`✅ 필터링 완료: ${result.errors?.length || 0}개 → ${validErrors.length}개`);
    console.log('=== [BACKGROUND] Gemini API 맞춤법 검사 완료 ===\n');
    
    return { errors: validErrors, corrected_text: result.corrected_text };
  } catch (error) {
    console.error('❌ [BACKGROUND] API 호출 실패:', error);
    throw error;
  }
}

/**
 * Gemini 프롬프트 생성
 */
function createGeminiPrompt(text) {
  return `당신은 한국어 맞춤법 전문가입니다. 다음 텍스트에서 **틀린 부분만** 정확하게 찾아주세요.

텍스트: "${text}"

**중요 규칙**:
1. 실제로 맞춤법이 **틀린 단어만** 찾아주세요
2. 이미 올바른 단어는 절대 포함하지 마세요
3. token(오류 단어)과 suggestions(교정 단어)가 같으면 안 됩니다
4. 띄어쓰기, 문법, 맞춤법 오류만 찾아주세요

**영어 단어 처리 규칙 (매우 중요!):**
다음과 같은 영어는 **절대 오류로 판단하지 마세요**:
- 프로그래밍 언어: JavaScript, Python, React, Vue, TypeScript, Java, C++, Ruby, Go, Rust 등
- 라이브러리/프레임워크: npm, webpack, Redux, Django, Flask, Express, Next.js, Nuxt 등
- 기술 용어: API, HTTP, HTTPS, JSON, XML, CSS, HTML, REST, GraphQL, SQL 등
- 메서드/함수명: useState, useEffect, onClick, getElementById, querySelector 등
- 파일 확장자: .js, .py, .tsx, .json, .css, .html, .md 등
- 패키지/모듈: axios, lodash, moment, dayjs 등
- 일반 영어 단어: import, export, function, class, const, let, var 등

다음 JSON 형식으로 응답해주세요:
{
  "errors": [
    {
      "token": "틀린 단어",
      "suggestions": ["올바른 단어"],
      "type": "spell",
      "info": "오류 설명"
    }
  ],
  "corrected_text": "전체 교정된 텍스트"
}

오류가 없으면 errors는 빈 배열 []로, corrected_text는 원본 텍스트 그대로 반환하세요.
JSON만 출력하고 다른 설명은 하지 마세요.`;
}

/**
 * Gemini 응답 파싱
 */
function parseGeminiResponse(textContent) {
  let jsonText = textContent;
  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }
  
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('❌ JSON 파싱 실패:', error);
    console.error('원본 텍스트:', jsonText);
    return { errors: [], corrected_text: '' };
  }
}

/**
 * 유효한 오류만 필터링
 */
function filterValidErrors(errors) {
  return errors.filter(error => {
    if (!error.token || !error.suggestions || !error.suggestions[0]) {
      return false;
    }
    // token과 suggestion이 같으면 제외
    if (error.token === error.suggestions[0]) {
      console.log(`⚠️ 필터링: "${error.token}" === "${error.suggestions[0]}"`);
      return false;
    }
    return true;
  });
}

// 단축키 명령 처리
chrome.commands.onCommand.addListener(async (command) => {
  console.log('');
  console.log('='.repeat(80));
  console.log('🎯 [BACKGROUND] 단축키 명령 감지!!!');
  console.log('📌 명령:', command);
  console.log('⏰ 시간:', new Date().toLocaleTimeString());
  console.log('='.repeat(80));
  
  if (command === 'check-selection') {
    // 현재 활성 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    console.log('📄 활성 탭 URL:', tab.url);
    console.log('📄 탭 ID:', tab.id);
    
    if (tab && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      // Content script에 메시지 전송
      try {
        console.log('📤 Content script에 메시지 전송 시도...');
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkSpelling' });
        console.log('✅ 메시지 전송 성공!');
        console.log('📥 응답:', response);
        console.log('='.repeat(80));
      } catch (error) {
        console.error('');
        console.error('⚠️ Content Script 응답 없음 - 재시도 중...');
        console.error('오류:', error.message);
        
        // Content Script가 로드되지 않았을 수 있으므로 재시도
        try {
          console.log('🔄 0.5초 후 재시도...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const retryResponse = await chrome.tabs.sendMessage(tab.id, { action: 'checkSpelling' });
          console.log('✅ 재시도 성공!');
          console.log('📥 응답:', retryResponse);
          console.log('='.repeat(80));
        } catch (retryError) {
          console.error('❌❌❌ 재시도 실패! ❌❌❌');
          console.error('오류:', retryError.message);
          console.error('');
          console.error('💡 해결 방법:');
          console.error('   1. 웹페이지를 새로고침(F5)하세요');
          console.error('   2. chrome://extensions/ 에서 확장 프로그램 새로고침');
          console.error('   3. 페이지가 완전히 로드될 때까지 기다리세요');
          console.error('='.repeat(80));
          
          // 사용자에게 알림 (선택사항)
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'showError' });
          } catch (e) {
            // Content Script가 없으면 무시
          }
        }
      }
    } else {
      console.warn('');
      console.warn('⚠️⚠️⚠️ 이 페이지에서는 확장 프로그램을 사용할 수 없습니다! ⚠️⚠️⚠️');
      console.warn('URL:', tab.url);
      console.warn('='.repeat(80));
    }
  } else {
    console.log('❓ 알 수 없는 명령:', command);
    console.log('='.repeat(80));
  }
});
