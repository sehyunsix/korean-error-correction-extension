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
});

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
        console.error('❌❌❌ 메시지 전송 실패! ❌❌❌');
        console.error('오류:', error);
        console.error('해결 방법: 웹페이지를 새로고침(F5)하세요!');
        console.error('='.repeat(80));
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
