const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS 설정 - Chrome 확장 프로그램에서 접근 가능하도록
app.use(cors());
app.use(express.json());

// PassportKey 캐시 (모듈 레벨)
let cachedPassportKey = null;
let passportKeyExpiry = 0;

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 맞춤법 검사 API
app.post('/api/check', async (req, res) => {
  const logs = []; // 로그 수집용 배열
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    logs.push({ timestamp, message, type });
    console.log(message);
  };
  
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      const errorMsg = '❌ 잘못된 요청: 텍스트 없음';
      console.error(errorMsg);
      return res.status(400).json({ 
        success: false, 
        message: '텍스트를 입력해주세요.',
        logs: [{ timestamp: new Date().toLocaleTimeString('ko-KR'), message: errorMsg, type: 'error' }]
      });
    }

    addLog('=== 맞춤법 검사 요청 ===', 'info');
    addLog(`📝 텍스트 길이: ${text.length}자`, 'info');
    addLog(`📄 텍스트: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`, 'info');

    // PassportKey 가져오기
    const getPassportKey = async () => {
      // 캐시된 키가 있고 만료되지 않았으면 사용
      if (cachedPassportKey && Date.now() < passportKeyExpiry) {
        return cachedPassportKey;
      }
      
      addLog('🔑 PassportKey 발급 중...', 'info');
      
      try {
        const keyResponse = await fetch('https://m.search.naver.com/search.naver?query=맞춤법검사기', {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        
        const html = await keyResponse.text();
        const passportKeyMatch = html.match(/passportKey['"]\s*:\s*['"]([^'"]+)['"]/);
        
        if (passportKeyMatch && passportKeyMatch[1]) {
          cachedPassportKey = passportKeyMatch[1];
          passportKeyExpiry = Date.now() + 3600000; // 1시간 유효
          addLog(`✅ PassportKey 발급 성공: ${cachedPassportKey.substring(0, 20)}...`, 'success');
          return cachedPassportKey;
        }
        
        addLog('⚠️ PassportKey를 찾을 수 없습니다', 'warning');
        return null;
      } catch (error) {
        addLog(`❌ PassportKey 발급 실패: ${error.message}`, 'error');
        return null;
      }
    };

    // 네이버 맞춤법 검사 API 사용
    const checkSpelling = async (text, retryCount = 0) => {
      addLog('🔍 네이버 맞춤법 검사 API 호출...', 'info');
      
      try {
        // PassportKey 가져오기
        const passportKey = await getPassportKey();
        
        // 네이버 맞춤법 검사 API 호출 (GET 방식, JSONP)
        const timestamp = Date.now();
        let url = `https://m.search.naver.com/p/csearch/ocontent/util/SpellerProxy?_callback=mycallback&q=${encodeURIComponent(text)}&where=nexearch&color_blindness=0&_=${timestamp}`;
        
        // PassportKey가 있으면 추가
        if (passportKey) {
          url += `&passportKey=${passportKey}`;
          addLog('🔐 PassportKey 사용', 'info');
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://m.search.naver.com/',
            'Accept': '*/*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });

        if (!response.ok) {
          throw new Error(`네이버 API 오류: ${response.status}`);
        }

        const responseText = await response.text();
        addLog('📦 네이버 API 응답 수신 완료', 'success');
        
        // JSONP 콜백 제거 (mycallback(...); 형식)
        const jsonMatch = responseText.match(/mycallback\((.*)\);?/);
        if (!jsonMatch || !jsonMatch[1]) {
          addLog('⚠️ 네이버 API 응답 파싱 실패', 'warning');
          return [];
        }
        
        const data = JSON.parse(jsonMatch[1]);
        
        // 응답 데이터 확인
        if (!data || !data.message) {
          addLog('⚠️ 네이버 API 응답 형식 오류', 'warning');
          return [];
        }
        
        // 에러 체크 - "유효한 키가 아닙니다" 처리
        if (data.message.error) {
          if (data.message.error === "유효한 키가 아닙니다." && retryCount === 0) {
            addLog('🔄 유효하지 않은 키, PassportKey 재발급 후 재시도...', 'warning');
            // 캐시된 키 무효화
            cachedPassportKey = null;
            passportKeyExpiry = 0;
            // 재시도 (1회만)
            return await checkSpelling(text, 1);
          }
          addLog(`⚠️ 네이버 API 에러: ${data.message.error}`, 'warning');
          return [];
        }

        const errors = [];

        // 네이버 API 응답 파싱
        if (data.message && data.message.result) {
          const result = data.message.result;
          
          // errata_count가 0이면 오류 없음
          if (result.errata_count === 0) {
            addLog('✨ 오류가 발견되지 않았습니다.', 'success');
            return errors;
          }

          // html을 파싱하여 오류 추출
          const notag_html = result.notag_html || result.html || '';
          const original_html = result.origin_html || '';

          addLog(`📊 발견된 오류 개수: ${result.errata_count}개`, 'info');
          
          // errata 배열에서 오류 정보 추출
          if (result.errata && Array.isArray(result.errata)) {
            result.errata.forEach((error, index) => {
              if (error.wrongText) {
                const errorInfo = {
                  token: error.wrongText,
                  suggestions: error.correctText ? [error.correctText] : [],
                  info: error.help || '맞춤법 오류',
                  type: error.type || 'spell'
                };
                
                addLog(`  ✓ ${index + 1}. "${errorInfo.token}" → "${errorInfo.suggestions[0] || '?'}" (${errorInfo.info})`, 'warning');
                errors.push(errorInfo);
              }
            });
          }
        }

        addLog(`✅ 네이버 검사 완료: ${errors.length}개 오류 발견`, 'success');
        return errors;

      } catch (error) {
        addLog(`❌ 네이버 API 호출 실패: ${error.message}`, 'error');
        throw error;
      }
    };

    const startTime = Date.now();
    const errors = await checkSpelling(text);
    const duration = Date.now() - startTime;

    addLog(`⏱️ 검사 소요 시간: ${duration}ms`, 'info');
    addLog('=== 응답 전송 ===', 'info');

    res.json({
      success: true,
      text: text,
      errors: errors,
      errorCount: errors.length,
      duration: duration,
      logs: logs  // 로그 배열 추가
    });

  } catch (error) {
    addLog(`❌ 맞춤법 검사 오류: ${error.message}`, 'error');
    res.status(500).json({
      success: false,
      message: error.message,
      logs: logs  // 오류 발생 시에도 로그 전송
    });
  }
});

// PassportKey 발급
app.get('/api/passportKey', async (req, res) => {
  try {
    console.log('🔑 PassportKey 발급 요청');
    
    // 네이버 검색창에서 passportKey 추출
    const response = await fetch('https://m.search.naver.com/search.naver?query=맞춤법검사기', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const html = await response.text();
    
    // passportKey 추출 (정규식)
    const passportKeyMatch = html.match(/passportKey['"]\s*:\s*['"]([^'"]+)['"]/);
    
    if (passportKeyMatch && passportKeyMatch[1]) {
      const passportKey = passportKeyMatch[1];
      console.log(`✅ PassportKey 발급 성공: ${passportKey.substring(0, 20)}...`);
      
      res.json({
        success: true,
        passportKey: passportKey,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ PassportKey를 찾을 수 없습니다');
      res.status(500).json({
        success: false,
        message: 'PassportKey를 찾을 수 없습니다'
      });
    }
  } catch (error) {
    console.error('❌ PassportKey 발급 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 헬스 체크
app.get('/health', (req, res) => {
  console.log('💚 Health check');
  res.json({ 
    status: 'ok', 
    message: 'Korean Spell Checker Server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🚀 한글 맞춤법 검사 서버 시작됨              ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║   📍 URL: http://localhost:${PORT}                ║`);
  console.log(`║   📝 API: POST /api/check                      ║`);
  console.log(`║   💚 Health: GET /health                       ║`);
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║   📊 모든 요청이 콘솔에 로그로 표시됩니다     ║');
  console.log('║   🛑 종료: Ctrl + C                            ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
});

