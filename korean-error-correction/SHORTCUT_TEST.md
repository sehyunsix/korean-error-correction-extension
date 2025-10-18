# 단축키 문제 해결 가이드

## 1. Chrome 확장 프로그램 새로고침
1. `chrome://extensions/` 접속
2. "한글 맞춤법 검사기" 찾기
3. 새로고침 버튼 클릭 🔄

## 2. 단축키 설정 확인
1. `chrome://extensions/shortcuts` 접속
2. "한글 맞춤법 검사기" 찾기
3. "선택한 텍스트 맞춤법 검사" 단축키 확인
4. 비어있으면 직접 설정: `Command+Shift+S` (Mac) 또는 `Ctrl+Shift+S` (Windows)

## 3. 단축키 충돌 확인
- `Cmd+Shift+S`는 Chrome의 "다른 이름으로 저장" 기능과 충돌할 수 있습니다
- 다른 확장 프로그램과 충돌할 수 있습니다
- `chrome://extensions/shortcuts`에서 다른 단축키로 변경해보세요 (예: `Cmd+Shift+K`)

## 4. Content Script 로드 확인
1. 테스트할 웹페이지에서 개발자 도구 열기 (F12)
2. Console 탭 확인
3. "한글 맞춤법 검사기 Content Script 로드됨" 메시지가 있는지 확인
4. 없으면 페이지 새로고침 (F5)

## 5. 단축키 작동 테스트
1. 웹페이지에서 텍스트 선택 (드래그)
2. `Cmd+Shift+S` 누르기
3. 개발자 도구 Console에서 로그 확인:
   - Background: "단축키 명령 수신: check-selection"
   - Content: "한글 맞춤법 검사기: 메시지 수신"

## 6. 대체 방법
단축키가 작동하지 않으면:
- 확장 프로그램 아이콘 클릭
- 팝업에서 "선택한 텍스트 검사" 버튼 클릭

## 7. 권장 단축키
충돌이 적은 단축키:
- `Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows)
- `Alt+Shift+S`
- `Alt+Shift+K`
