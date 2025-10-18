# 한글 맞춤법 검사기 설치 가이드

## 📋 목차
1. [Chrome 확장 프로그램 설치](#chrome-확장-프로그램-설치)
2. [서버 설치 및 실행 (선택사항)](#서버-설치-및-실행)
3. [설정 변경](#설정-변경)

---

## Chrome 확장 프로그램 설치

### 1. 기본 설치 (룰 베이스 검사)

서버 없이 기본 룰 베이스 맞춤법 검사를 사용하려면:

1. `content.js` 파일을 열고 3번째 줄을 수정:
   ```javascript
   const USE_API = false; // false로 변경
   ```

2. Chrome 브라우저에서 `chrome://extensions/` 접속

3. 우측 상단 "개발자 모드" 활성화

4. "압축해제된 확장 프로그램을 로드합니다" 클릭

5. 이 프로젝트 폴더 선택

6. 완료! 웹페이지를 열면 자동으로 맞춤법 검사가 실행됩니다.

---

## 서버 설치 및 실행

### hanspell 라이브러리를 사용한 고급 맞춤법 검사

더 정확한 맞춤법 검사를 원한다면 서버를 설치하세요.

### 사전 요구사항
- Node.js (v14 이상)
- npm

### 설치 단계

1. **서버 디렉토리로 이동**
   ```bash
   cd server
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **서버 실행**
   ```bash
   npm start
   ```

   또는 개발 모드 (자동 재시작):
   ```bash
   npm run dev
   ```

4. **서버 확인**
   - 브라우저에서 `http://localhost:3000/health` 접속
   - `{"status":"ok"}` 메시지가 표시되면 성공

5. **Chrome 확장 프로그램 설정**
   - `content.js` 파일 열기
   - 3번째 줄 확인:
     ```javascript
     const USE_API = true; // true로 설정
     ```
   - `chrome://extensions/`에서 확장 프로그램 새로고침

6. **테스트**
   - 아무 웹페이지나 열기
   - F12를 눌러 콘솔 확인
   - "API로 검사할 텍스트 길이" 메시지가 표시되면 성공

---

## 설정 변경

### content.js 설정

```javascript
// 설정
const API_SERVER_URL = 'http://localhost:3000'; // 서버 URL 변경 가능
const USE_API = true; // true: API 사용, false: 룰 베이스 사용
```

### API 사용 vs 룰 베이스 비교

| 기능 | 룰 베이스 | API (hanspell) |
|------|-----------|----------------|
| 설치 | 쉬움 | 서버 필요 |
| 정확도 | 중간 | 높음 |
| 속도 | 빠름 | 조금 느림 |
| 인터넷 | 불필요 | 필요 |
| 검사 범위 | 제한적 (30개 규칙) | 광범위 |

---

## 🐛 문제 해결

### 서버가 시작되지 않는 경우

1. Node.js 버전 확인:
   ```bash
   node --version
   ```
   v14 이상이어야 합니다.

2. 포트 3000이 이미 사용 중인 경우:
   - `server/server.js`에서 PORT 변경
   - `content.js`에서 API_SERVER_URL도 함께 변경

### API 검사가 작동하지 않는 경우

1. 서버가 실행 중인지 확인:
   ```bash
   curl http://localhost:3000/health
   ```

2. 콘솔 오류 확인 (F12)

3. "룰 베이스 검사로 폴백합니다" 메시지가 보이면:
   - 서버가 실행되지 않았거나
   - 네트워크 오류 발생
   - 자동으로 룰 베이스 검사로 전환됨

---

## 📝 추가 정보

### 서버 API 문서

서버 설치 후 다음 파일 참고:
- `server/README.md`

### Chrome 확장 프로그램 사용법

메인 README 참고:
- `README.md`

