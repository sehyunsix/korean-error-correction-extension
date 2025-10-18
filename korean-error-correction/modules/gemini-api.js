/**
 * 한글 맞춤법 검사기 - Gemini API 모듈
 * @file gemini-api.js
 */

/**
 * Gemini API로 맞춤법 검사 (Background를 통해)
 */
async function checkSpellingWithGemini(text, apiKey) {
  try {
    console.log('\n=== [CONTENT] Gemini API 맞춤법 검사 요청 ===');
    console.log(`검사할 텍스트: "${text.substring(0, 100)}..."`);
    
    const selectedModel = await getSelectedModel();
    
    if (selectedModel) {
      console.log(`🎯 선택된 모델: ${selectedModel}`);
    } else {
      console.log(`🎯 기본 모델 사용`);
    }
    
    // Background에 메시지 전송하여 API 호출 요청
    console.log('📤 Background로 API 호출 요청 전송...');
    const response = await chrome.runtime.sendMessage({
      action: 'callGeminiAPI',
      text: text,
      apiKey: apiKey,
      selectedModel: selectedModel
    });
    
    console.log('📥 Background로부터 응답 받음:', response);
    
    if (response.success) {
      console.log(`✅ API 호출 성공: ${response.data.errors?.length || 0}개 오류 발견`);
      console.log('=== [CONTENT] Gemini API 맞춤법 검사 완료 ===\n');
      return response.data.errors || [];
    } else {
      console.error('❌ API 호출 실패:', response.error);
      return {
        isError: true,
        errorType: response.error.errorType,
        errorMessage: response.error.errorMessage,
        errors: []
      };
    }
  } catch (error) {
    console.error('');
    console.error('❌❌❌ Gemini API 맞춤법 검사 실패 ❌❌❌');
    console.error('오류 타입:', error.name);
    console.error('오류 메시지:', error.message);
    console.error('스택 트레이스:', error.stack);
    console.error('');
    
    // 오류 정보를 객체로 반환
    return {
      isError: true,
      errorType: error.name,
      errorMessage: error.message,
      errors: []
    };
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

**영어-한국어 혼용 허용 예시:**
✅ "React를 사용해서 개발했습니다" (정상)
✅ "API 호출이 실패했어요" (정상)
✅ "useState로 상태를 관리합니다" (정상)
✅ "JavaScript와 Python을 배웠습니다" (정상)
✅ "npm install로 설치하세요" (정상)

❌ "이건 않돼요" → "안 돼요" (오류)
❌ "되요" → "돼요" (오류)

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
  
  return JSON.parse(jsonText);
}

/**
 * 유효한 오류만 필터링
 */
function filterValidErrors(errors) {
  return errors.filter(error => {
    const token = error.token?.trim();
    const suggestion = error.suggestions?.[0]?.trim();
    
    if (!token || !suggestion) {
      console.warn('⚠️ 유효하지 않은 오류 항목 제거:', error);
      return false;
    }
    
    if (token === suggestion) {
      console.log(`🔄 token과 suggestion이 동일하여 제거: "${token}"`);
      return false;
    }
    
    return true;
  });
}

/**
 * Gemini API 오류 처리
 */
async function handleGeminiApiError(response, selectedModel) {
  let errorBody = '';
  try {
    const errorData = await response.json();
    errorBody = JSON.stringify(errorData, null, 2);
    console.error('❌ API 오류 응답:', errorData);
  } catch (e) {
    errorBody = await response.text();
    console.error('❌ API 오류 응답 (텍스트):', errorBody);
  }
  
  console.error('');
  console.error('='.repeat(80));
  console.error('❌❌❌ Gemini API 오류 상세 정보 ❌❌❌');
  console.error('='.repeat(80));
  console.error(`🔗 요청 URL: ${response.url}`);
  console.error(`📊 상태 코드: ${response.status} (${response.statusText})`);
  console.error(`📝 모델: ${selectedModel || 'gemini-flash-lite-latest (기본)'}`);
  console.error(`📄 오류 내용:\n${errorBody}`);
  console.error('='.repeat(80));
  console.error('');
  
  printGeminiErrorSolution(response.status);
}

/**
 * Gemini 오류 해결 방법 출력
 */
function printGeminiErrorSolution(status) {
  if (status === 404) {
    console.error('💡 해결 방법:');
    console.error('   1. 모델 이름이 올바른지 확인하세요');
    console.error('   2. 팝업에서 "🔄" 버튼을 눌러 사용 가능한 모델 목록을 다시 불러오세요');
    console.error('   3. API Key가 해당 모델에 대한 권한이 있는지 확인하세요');
  } else if (status === 403) {
    console.error('💡 해결 방법:');
    console.error('   1. API Key가 유효한지 확인하세요');
    console.error('   2. API Key에 Gemini API 사용 권한이 있는지 확인하세요');
    console.error('   3. https://aistudio.google.com/app/apikey 에서 확인하세요');
  } else if (status === 429) {
    console.error('💡 해결 방법:');
    console.error('   1. API 호출 한도를 초과했습니다');
    console.error('   2. 잠시 후 다시 시도하세요');
  }
}
