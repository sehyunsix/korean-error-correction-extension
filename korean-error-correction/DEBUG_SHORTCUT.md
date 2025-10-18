# 단축키 디버깅 가이드 (Cmd+Shift+E)

## ✅ 현재 단축키
- **Mac**: `Cmd+Shift+E`
- **Windows/Linux**: `Ctrl+Shift+E`

이 조합은 Chrome/macOS 기본 단축키와 충돌이 거의 없습니다!

## ✅ 해결 방법

### 1단계: Chrome 확장 프로그램 새로고침
```
1. chrome://extensions/ 접속
2. "한글 맞춤법 검사기" 찾기
3. 🔄 새로고침 버튼 클릭
4. "Service worker" 옆 파란색 링크 클릭 (백그라운드 콘솔 열기)
```

### 2단계: 단축키 설정 확인
```
1. chrome://extensions/shortcuts 접속
2. "한글 맞춤법 검사기" 찾기
3. "선택한 텍스트 맞춤법 검사" 단축키 확인
4. 비어있거나 다른 키로 설정되어 있으면:
   - 입력창 클릭
   - Cmd+Shift+E 누르기
   - ✅ 이 조합은 충돌이 거의 없습니다!
```

### 3단계: 웹페이지 새로고침
```
1. 테스트할 웹페이지로 이동
2. F5 또는 Cmd+R로 새로고침
3. F12로 개발자 도구 열기
4. Console 탭 확인
```

### 4단계: 단축키 테스트
```
1. 웹페이지에서 한글 텍스트 선택
2. Cmd+Shift+E 누르기
3. 다음 로그 확인:

[Service Worker 콘솔]
✅ "단축키 명령 수신: check-selection"
✅ "활성 탭: https://..."
✅ "Content script에 메시지 전송 중..."

[웹페이지 콘솔]
✅ "한글 맞춤법 검사기: 메시지 수신"
✅ "=== 선택된 텍스트 맞춤법 검사 시작 ==="
```

## 🚨 여전히 안 되면?

### A. 수동 테스트
1. 확장 프로그램 아이콘 클릭
2. "선택한 텍스트 검사" 버튼 클릭
3. 이게 작동하면 단축키 충돌 문제임

### B. 권한 확인
```
chrome://extensions/ → 한글 맞춤법 검사기
- "사이트 액세스": "모든 사이트에서" 확인
- 비활성화되어 있으면 활성화
```

## 📝 로그 예시

### 정상 작동:
```
[Service Worker]
단축키 명령 수신: check-selection
활성 탭: https://example.com
Content script에 메시지 전송 중...
메시지 전송 완료: {success: true}

[웹페이지 Console]
한글 맞춤법 검사기: 메시지 수신 {action: 'checkSpelling'}
=== 선택된 텍스트 맞춤법 검사 시작 ===
```

### 문제 발생:
```
[Service Worker]
단축키 명령 수신: check-selection  ← 이것도 안 보이면 단축키 충돌!
❌ 메시지 전송 오류: Could not establish connection

→ 웹페이지 새로고침 필요!
```

## 🎯 빠른 해결책

1. **확장 프로그램 새로고침** (chrome://extensions/)
2. **웹페이지 새로고침** (F5)
3. **단축키 수동 설정** (chrome://extensions/shortcuts)
   - 현재 단축키: **Cmd+Shift+E** (Mac) / **Ctrl+Shift+E** (Windows)

