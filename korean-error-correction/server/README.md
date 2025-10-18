# 한글 맞춤법 검사 서버

hanspell 라이브러리를 사용하는 백엔드 서버입니다.

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 서버 실행
npm start
```

## 📋 설치 및 실행

### 1차: 의존성 설치 (최초 1회만)
```bash
cd server
npm install
```

### 2차: 서버 실행

**방법 1: 스크립트 사용 (권장)**
```bash
./start-server.sh
```

**방법 2: npm 명령어**
```bash
npm start
```

**방법 3: node 직접 실행**
```bash
node server.js
```

서버가 실행되면 다음과 같이 표시됩니다:
```
╔════════════════════════════════════════════════╗
║   🚀 한글 맞춤법 검사 서버 시작됨              ║
╠════════════════════════════════════════════════╣
║   📍 URL: http://localhost:3000                ║
║   📝 API: POST /api/check                      ║
║   💚 Health: GET /health                       ║
╠════════════════════════════════════════════════╣
║   📊 모든 요청이 콘솔에 로그로 표시됩니다     ║
║   🛑 종료: Ctrl + C                            ║
╚════════════════════════════════════════════════╝
```

## 📡 API 사용법

### POST /api/check

맞춤법 검사를 수행합니다.

**요청:**
```json
{
  "text": "오늘은 날씨가 되요"
}
```

**응답:**
```json
{
  "success": true,
  "text": "오늘은 날씨가 되요",
  "errors": [
    {
      "token": "되요",
      "suggestions": ["돼요"],
      "info": "맞춤법 오류",
      "type": "spell"
    }
  ],
  "errorCount": 1,
  "duration": 1234
}
```

### GET /health

서버 상태를 확인합니다.

**응답:**
```json
{
  "status": "ok",
  "message": "Korean Spell Checker Server is running",
  "timestamp": "2025-10-18T..."
}
```

## 🔍 로그 확인

서버를 실행하면 모든 요청과 검사 결과가 상세하게 로그로 표시됩니다:

```
=== 맞춤법 검사 요청 ===
📝 텍스트 길이: 15자
📄 텍스트: "오늘은 날씨가 되요..."
🔍 hanspell 검사 시작...
  ✓ 오류 발견: "되요" → "돼요"
✅ hanspell 검사 완료: 1개 오류 발견
⏱️ 검사 소요 시간: 1234ms
=== 응답 전송 ===
```

## 🐛 문제 해결

### 포트 3000이 이미 사용 중
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# 또는 server.js에서 포트 변경
const PORT = 3001;
```

### hanspell 설치 오류
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🔗 Chrome 확장 프로그램과 연동

1. 서버 실행 (`npm start`)
2. Chrome 확장 프로그램의 `content.js`에서:
   ```javascript
   const USE_API = true;
   ```
3. Chrome 확장 프로그램 새로고침
4. 웹페이지에서 맞춤법 검사 실행
5. 서버 콘솔에서 로그 확인!

