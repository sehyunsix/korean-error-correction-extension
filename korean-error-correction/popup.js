// API 서버 상태 확인
async function checkAPIServer() {
  try {
    // AbortController를 사용한 타임아웃 (CSP 안전)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('http://localhost:3000/health', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// API 상태 표시
async function updateAPIStatus() {
  const apiStatusSection = document.getElementById('apiStatusSection');
  const apiStatusDiv = document.getElementById('apiStatus');
  const apiModeSpan = document.getElementById('apiMode');
  const serverStatusText = document.getElementById('serverStatusText');
  const apiServerStatusDiv = document.getElementById('apiServerStatus');
  
  // content.js에서 USE_API 값 가져오기
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getAPIStatus' });
    
    if (response && response.useAPI !== undefined) {
      apiStatusSection.style.display = 'block';
      
      if (response.useAPI) {
        // API 모드
        const serverOnline = await checkAPIServer();
        
        if (serverOnline) {
          apiStatusDiv.style.backgroundColor = '#d1fae5';
          apiStatusDiv.style.borderColor = '#a7f3d0';
          apiModeSpan.textContent = '🤖 AI (ET5)';
          apiModeSpan.style.color = '#065f46';
          serverStatusText.textContent = '🟢 온라인';
          serverStatusText.style.color = '#065f46';
          apiServerStatusDiv.style.display = 'flex';
        } else {
          apiStatusDiv.style.backgroundColor = '#fef3c7';
          apiStatusDiv.style.borderColor = '#fcd34d';
          apiModeSpan.textContent = '⚠️ API → 룰 베이스';
          apiModeSpan.style.color = '#92400e';
          serverStatusText.textContent = '🔴 오프라인 (폴백)';
          serverStatusText.style.color = '#991b1b';
          apiServerStatusDiv.style.display = 'flex';
        }
      } else {
        // 룰 베이스 모드
        apiStatusDiv.style.backgroundColor = '#dbeafe';
        apiStatusDiv.style.borderColor = '#93c5fd';
        apiModeSpan.textContent = '🔧 룰 베이스';
        apiModeSpan.style.color = '#1e3a8a';
        apiServerStatusDiv.style.display = 'none';
      }
    }
  } catch (error) {
    // content script가 로드되지 않았거나 메시지 전송 실패
    apiStatusSection.style.display = 'none';
  }
}

// 검사 통계 표시
async function displayCheckStats() {
  const apiStatsDiv = document.getElementById('apiStats');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCheckStats' });
      
      if (response && response.stats && response.stats.checkedNodes > 0) {
        apiStatsDiv.style.display = 'block';
        
        // 선택된 텍스트 표시
        const selectedText = response.stats.selectedText || '-';
        document.getElementById('statSelectedText').textContent = 
          selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText;
        
        // 텍스트 길이
        document.getElementById('statTextLength').textContent = 
          selectedText.length > 0 ? `${selectedText.length}자` : '-';
        
        // 발견된 오류
        document.getElementById('statFoundErrors').textContent = response.stats.foundErrors || 0;
        
        // API 상태
        const apiStatus = response.stats.apiSuccess > 0 ? '✅ 성공' : '❌ 실패';
        document.getElementById('statApiStatus').textContent = apiStatus;
        
      } else {
        apiStatsDiv.style.display = 'none';
      }
    }
  } catch (error) {
    // content script가 로드되지 않았거나 통계가 없으면 숨김
    apiStatsDiv.style.display = 'none';
  }
}

// 서버 로그 표시
async function displayServerLogs() {
  const serverLogsDiv = document.getElementById('serverLogs');
  const logsContainer = document.getElementById('logsContainer');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getServerLogs' });
      
      if (response && response.logs && response.logs.length > 0) {
        serverLogsDiv.style.display = 'block';
        
        // 로그 HTML 생성
        const logsHtml = response.logs.map(log => {
          let color = '#333';
          if (log.type === 'error') color = '#d32f2f';
          else if (log.type === 'warning') color = '#f57c00';
          else if (log.type === 'success') color = '#2e7d32';
          else if (log.type === 'info') color = '#1976d2';
          
          return `<div style="margin-bottom: 6px; color: ${color};">
            <span style="color: #999; font-size: 10px;">[${log.timestamp}]</span> ${log.message}
          </div>`;
        }).join('');
        
        logsContainer.innerHTML = logsHtml;
        
        // 자동 스크롤 (최신 로그가 보이도록)
        logsContainer.scrollTop = logsContainer.scrollHeight;
      } else {
        serverLogsDiv.style.display = 'none';
      }
    }
  } catch (error) {
    // content script가 로드되지 않았거나 로그가 없으면 숨김
    serverLogsDiv.style.display = 'none';
  }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // 버전 정보 표시
  const manifest = chrome.runtime.getManifest();
  const versionInfo = document.getElementById('versionInfo');
  if (versionInfo && manifest.version) {
    versionInfo.textContent = `v${manifest.version}`;
  }
  
  // Gemini API Key 및 모델 불러오기
  const storageData = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel']);
  const apiKeyInput = document.getElementById('geminiApiKey');
  const modelSelect = document.getElementById('geminiModel');
  const modelSelectContainer = document.getElementById('modelSelectContainer');
  
  if (storageData.geminiApiKey) {
    apiKeyInput.value = storageData.geminiApiKey;
    modelSelectContainer.style.display = 'block';
    await loadAvailableModels(storageData.geminiApiKey);
    
    if (storageData.geminiModel) {
      modelSelect.value = storageData.geminiModel;
    }
  }
  
  // 사용 가능한 모델 목록 가져오기
  async function loadAvailableModels(apiKey) {
    const modelInfo = document.getElementById('modelInfo');
    modelInfo.textContent = '모델 목록 로딩 중...';
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      const models = data.models || [];
      
      // generateContent를 지원하는 모델만 필터링
      const validModels = models.filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      );
      
      // 모델 선택 옵션 추가
      modelSelect.innerHTML = '<option value="">모델 선택...</option>';
      validModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = model.displayName || model.name.split('/').pop();
        modelSelect.appendChild(option);
      });
      
      modelInfo.textContent = `${validModels.length}개의 사용 가능한 모델 발견`;
      
      // 저장된 모델이 있으면 선택
      const savedResult = await chrome.storage.sync.get(['geminiModel']);
      if (savedResult.geminiModel) {
        modelSelect.value = savedResult.geminiModel;
      }
      
    } catch (error) {
      console.error('모델 목록 로드 실패:', error);
      modelInfo.textContent = `❌ 모델 로드 실패: ${error.message}`;
      modelInfo.style.color = '#f44336';
    }
  }
  
  // API Key 저장 버튼
  document.getElementById('saveApiKey').addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    await chrome.storage.sync.set({ geminiApiKey: apiKey });
    
    const statusDiv = document.getElementById('status');
    statusDiv.className = 'success';
    statusDiv.style.display = 'block';
    
    if (apiKey) {
      statusDiv.textContent = '✅ Gemini API Key 저장됨';
      modelSelectContainer.style.display = 'block';
      await loadAvailableModels(apiKey);
    } else {
      statusDiv.textContent = '✅ API Key 제거됨 (ET5 모드)';
      modelSelectContainer.style.display = 'none';
      await chrome.storage.sync.remove('geminiModel');
    }
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 2000);
  });
  
  // 모델 선택 변경 시 저장
  modelSelect.addEventListener('change', async () => {
    const selectedModel = modelSelect.value;
    if (selectedModel) {
      await chrome.storage.sync.set({ geminiModel: selectedModel });
      
      const statusDiv = document.getElementById('status');
      statusDiv.className = 'success';
      statusDiv.style.display = 'block';
      statusDiv.textContent = `✅ 모델 선택됨: ${selectedModel.split('/').pop()}`;
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 2000);
    }
  });
  
  // 모델 새로고침 버튼
  document.getElementById('refreshModels').addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      await loadAvailableModels(apiKey);
    } else {
      alert('API Key를 먼저 입력해주세요.');
    }
  });
  
  // API 상태 표시
  await updateAPIStatus();
  
  // 검사 통계 표시
  await displayCheckStats();
  
  // 서버 로그 표시
  await displayServerLogs();
  
  // 로그 접기/펼치기 버튼 이벤트
  const toggleLogsBtn = document.getElementById('toggleLogs');
  const logsContainer = document.getElementById('logsContainer');
  toggleLogsBtn.addEventListener('click', () => {
    if (logsContainer.style.display === 'none') {
      logsContainer.style.display = 'block';
      toggleLogsBtn.textContent = '접기';
    } else {
      logsContainer.style.display = 'none';
      toggleLogsBtn.textContent = '펼치기';
    }
  });
  
  // API 테스트 버튼 이벤트
  const testBtn = document.getElementById('testBtn');
  const testInput = document.getElementById('testInput');
  const testResult = document.getElementById('testResult');
  const resultText = document.getElementById('resultText');
  const testTime = document.getElementById('testTime');
  const copyBtn = document.getElementById('copyBtn');
  
  testBtn.addEventListener('click', async () => {
    const text = testInput.value.trim();
    
    if (!text) {
      alert('텍스트를 입력해주세요.');
      return;
    }
    
      testBtn.textContent = '교정 중...';
    testBtn.disabled = true;
    testResult.style.display = 'none';
    
    // 상태 메시지 초기화
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
      statusDiv.style.display = 'none';
    }
    
    try {
      const startTime = Date.now();
      
      // Gemini API Key 확인
      const apiKeyData = await chrome.storage.sync.get(['geminiApiKey']);
      const geminiApiKey = apiKeyData.geminiApiKey;
      
      let data;
      let useGemini = false;
      
      if (geminiApiKey && geminiApiKey.trim()) {
        // Gemini API 사용
        useGemini = true;
        
        // 저장된 모델 가져오기
        const modelResult = await chrome.storage.sync.get(['geminiModel']);
        let apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b-latest:generateContent';
        
        if (modelResult.geminiModel) {
          const modelName = modelResult.geminiModel.replace('models/', '');
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        }
        
        console.log(`📤 [팝업] API 요청 URL: ${apiUrl}?key=***`);
        
        const response = await fetch(`${apiUrl}?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `당신은 한국어 맞춤법 전문가입니다. 다음 텍스트에서 **틀린 부분만** 정확하게 찾아주세요.

텍스트: "${text}"

**중요 규칙**:
1. 실제로 맞춤법이 **틀린 단어만** 찾아주세요
2. 이미 올바른 단어는 절대 포함하지 마세요
3. token(오류 단어)과 suggestions(교정 단어)가 같으면 안 됩니다
4. 띄어쓰기, 문법, 맞춤법 오류만 찾아주세요

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
JSON만 출력하고 다른 설명은 하지 마세요.`
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
        
        console.log(`📥 [팝업] API 응답 상태: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          // 오류 응답 본문 읽기
          let errorBody = '';
          try {
            const errorData = await response.json();
            errorBody = JSON.stringify(errorData, null, 2);
            console.error('❌ [팝업] API 오류 응답:', errorData);
          } catch (e) {
            errorBody = await response.text();
            console.error('❌ [팝업] API 오류 응답 (텍스트):', errorBody);
          }
          
          console.error('');
          console.error('='.repeat(80));
          console.error('❌❌❌ [팝업] Gemini API 오류 상세 정보 ❌❌❌');
          console.error('='.repeat(80));
          console.error(`🔗 요청 URL: ${apiUrl}`);
          console.error(`📊 상태 코드: ${response.status} (${response.statusText})`);
          console.error(`📝 모델: ${modelResult.geminiModel || 'gemini-1.5-flash-8b-latest (기본)'}`);
          console.error(`📄 오류 내용:\n${errorBody}`);
          console.error('='.repeat(80));
          console.error('');
          
          let helpMessage = `Gemini API 오류: ${response.status} (${response.statusText})\n\n`;
          if (response.status === 404) {
            helpMessage += '💡 모델을 찾을 수 없습니다.\n';
            helpMessage += '   - 팝업에서 "🔄" 버튼을 눌러 사용 가능한 모델 목록을 다시 불러오세요.\n';
            helpMessage += '   - 다른 모델을 선택해보세요.';
          } else if (response.status === 403) {
            helpMessage += '💡 API Key 권한 오류\n';
            helpMessage += '   - API Key가 유효한지 확인하세요.\n';
            helpMessage += '   - https://aistudio.google.com/app/apikey 에서 확인하세요.';
          } else if (response.status === 429) {
            helpMessage += '💡 API 호출 한도 초과\n';
            helpMessage += '   - 잠시 후 다시 시도하세요.';
          }
          
          alert(helpMessage);
          throw new Error(`Gemini API 오류: ${response.status}`);
        }
        
        const geminiData = await response.json();
        
        // 응답 구조 확인
        if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
          console.error('❌ [팝업] 예상치 못한 API 응답 구조:', JSON.stringify(geminiData, null, 2));
          alert('Gemini API 응답 구조가 올바르지 않습니다.\n콘솔을 확인하세요.');
          throw new Error('Gemini API 응답 구조 오류');
        }
        
        const textContent = geminiData.candidates[0].content.parts[0].text;
        console.log('✅ [팝업] Gemini 응답:', textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''));
        
        // JSON 추출
        let jsonText = textContent;
        if (jsonText.includes('```json')) {
          jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }
        
        data = JSON.parse(jsonText);
        console.log('✅ [팝업] 파싱된 결과:', data);
        
        // suggestion과 token이 같은 경우 필터링
        if (data.errors && Array.isArray(data.errors)) {
          const originalCount = data.errors.length;
          data.errors = data.errors.filter(error => {
            const token = error.token?.trim();
            const suggestion = error.suggestions?.[0]?.trim();
            
            if (!token || !suggestion) {
              console.warn('⚠️ [팝업] 유효하지 않은 오류 항목 제거:', error);
              return false;
            }
            
            if (token === suggestion) {
              console.log(`🔄 [팝업] token과 suggestion이 동일하여 제거: "${token}"`);
              return false;
            }
            
            return true;
          });
          console.log(`✅ [팝업] 필터링 완료: ${originalCount}개 → ${data.errors.length}개`);
        }
      } else {
        // ET5 API 사용
        const response = await fetch('http://localhost:3000/api/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
          throw new Error(`서버 오류: ${response.status}`);
        }
        
        data = await response.json();
      }
      
      const duration = Date.now() - startTime;
      
      // 교정 결과 표시
      const correctedText = data.corrected_text || text;
      resultText.textContent = correctedText;
      testTime.textContent = `⏱️ ${duration}ms (${useGemini ? 'Gemini' : 'ET5'})`;
      testResult.style.display = 'block';
      
      // 원본과 다르면 초록색, 같으면 파란색
      if (text === correctedText) {
        testResult.style.background = '#e3f2fd';
        testResult.querySelector('span').textContent = 'ℹ️ 수정 사항 없음:';
        testResult.querySelector('span').style.color = '#1976d2';
      } else {
        testResult.style.background = '#e8f5e9';
        testResult.querySelector('span').textContent = `✅ 교정 결과 (${data.errors ? data.errors.length : 0}개 오류):`;
        testResult.querySelector('span').style.color = '#2e7d32';
      }
      
    } catch (error) {
      console.error('[팝업 테스트] 오류:', error);
      
      // 상태 메시지 표시
      const statusDiv = document.getElementById('status');
      if (statusDiv) {
        statusDiv.className = 'error';
        statusDiv.style.display = 'block';
        
        let errorMsg = '오류가 발생했습니다.';
        
        // API Key 오류
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMsg = '❌ API Key가 유효하지 않습니다.\n올바른 API Key를 입력해주세요.\n\nhttps://aistudio.google.com/app/apikey';
        } 
        // 모델 없음 오류
        else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMsg = '❌ 모델을 찾을 수 없습니다.\n🔄 버튼을 눌러 모델 목록을 새로고침하고\n다른 모델을 선택해주세요.';
        }
        // 호출 한도 초과
        else if (error.message.includes('429')) {
          errorMsg = '❌ API 호출 한도를 초과했습니다.\n잠시 후 다시 시도해주세요.';
        }
        // 네트워크 오류
        else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMsg = '❌ 네트워크 오류가 발생했습니다.\n인터넷 연결을 확인해주세요.';
        }
        // 기타 오류
        else {
          errorMsg = `❌ 오류: ${error.message}`;
        }
        
        statusDiv.textContent = errorMsg;
        
        // 5초 후 자동 숨김
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 5000);
      } else {
        alert(`오류: ${error.message}`);
      }
    } finally {
      testBtn.textContent = '교정하기';
      testBtn.disabled = false;
    }
  });
  
  // 복사 버튼 이벤트
  copyBtn.addEventListener('click', () => {
    const text = resultText.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ 복사됨';
      copyBtn.style.background = '#66bb6a';
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#4caf50';
      }, 1500);
    }).catch(err => {
      alert('복사 실패: ' + err.message);
    });
  });
  
  // Enter 키로 교정 실행
  testInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      testBtn.click();
    }
  });
});

// content script와 통신하는 헬퍼 함수
async function sendMessageToContentScript(tab, message) {
  try {
    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response;
  } catch (error) {
    // content script가 로드되지 않았으면 수동으로 주입
    if (error.message.includes('Receiving end does not exist')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // CSS도 주입
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
        
        // 잠시 대기 후 다시 시도
        await new Promise(resolve => setTimeout(resolve, 100));
        return await chrome.tabs.sendMessage(tab.id, message);
      } catch (injectionError) {
        throw new Error('이 페이지에서는 확장 프로그램을 사용할 수 없습니다.');
      }
    }
    throw error;
  }
}

document.getElementById('checkBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const statsDiv = document.getElementById('stats');
  
  statusDiv.className = 'info';
  statusDiv.textContent = '맞춤법 검사 중...';
  statsDiv.style.display = 'none';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // chrome:// 또는 extension:// 페이지는 제외
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      statusDiv.className = 'error';
      statusDiv.textContent = 'Chrome 내부 페이지에서는 사용할 수 없습니다.';
      return;
    }
    
    const response = await sendMessageToContentScript(tab, { 
      action: 'checkSpelling' 
    });
    
    if (response && response.success) {
      statusDiv.className = 'success';
      statusDiv.textContent = '맞춤법 검사 완료!';
      
      document.getElementById('errorCount').textContent = response.errorCount || 0;
      document.getElementById('checkedCount').textContent = response.checkedCount || 0;
      document.getElementById('checkMethod').textContent = response.method || '-';
      statsDiv.style.display = 'flex';
      
      // API 상태 업데이트
      await updateAPIStatus();
      
      // 검사 통계 표시
      await displayCheckStats();
      
      // 서버 로그 표시
      await displayServerLogs();
    } else {
      statusDiv.className = 'error';
      statusDiv.textContent = response?.message || '검사 실패';
    }
  } catch (error) {
    statusDiv.className = 'error';
    statusDiv.textContent = error.message || '오류가 발생했습니다.';
  }
});

document.getElementById('clearBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const statsDiv = document.getElementById('stats');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // chrome:// 또는 extension:// 페이지는 제외
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      statusDiv.className = 'error';
      statusDiv.textContent = 'Chrome 내부 페이지에서는 사용할 수 없습니다.';
      return;
    }
    
    const response = await sendMessageToContentScript(tab, { 
      action: 'clearHighlights' 
    });
    
    statusDiv.className = 'info';
    statusDiv.textContent = '표시를 모두 지웠습니다.';
    statsDiv.style.display = 'none';
  } catch (error) {
    statusDiv.className = 'error';
    statusDiv.textContent = error.message || '오류가 발생했습니다.';
  }
});

